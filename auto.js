/**
 * AUTOBOT MULTI-DEPLOY (inspiré d'Aryauto) pour Goat-Bot V2
 * ---------------------------------------------------------
 * Plusieurs comptes Facebook peuvent être déployés EN MÊME TEMPS.
 * Chaque déploiement possède :
 *   - son propre dossier de session (sessions/<uid>/) : config, configCommands, appstate
 *   - son propre sous-processus Goat.js
 *   - ses propres logs
 *   - son propre mot de passe à 4 chiffres (nécessaire pour arrêter le bot)
 *
 * Endpoints :
 *   GET  /commands      -> commandes + events disponibles
 *   GET  /info          -> liste des bots en ligne (nom, photo, uptime...)
 *   GET  /logs?uid=...  -> logs d'un bot
 *   POST /login         -> { state, commands, prefix, admin, password }
 *   POST /stop          -> { uid, password }
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { spawn } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const DIR_CONFIG = path.join(ROOT, "config.dev.json");
const DIR_CONFIG_COMMANDS = path.join(ROOT, "configCommands.dev.json");
const DIR_CMDS = path.join(ROOT, "scripts", "cmds");
const DIR_EVENTS = path.join(ROOT, "scripts", "events");
const DIR_DATA = path.join(ROOT, "data");
const DIR_SESSIONS = path.join(ROOT, "sessions");
const DIR_HISTORY = path.join(DIR_DATA, "history.json");

// Commandes définitivement retirées de ce bot
const REMOVED = ["cmd.js", "system.js", "file.js"];

const app = express();
app.use(express.static(path.join(ROOT, "public")));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// ───────────────────── état : une entrée par bot ─────────────────────
/** @type {Map<string, object>} clé = uid facebook */
const sessions = new Map();

function pushLog(session, line) {
  const text = String(line).replace(/\u001b\[[0-9;]*m/g, "").trimEnd();
  if (!text) return;
  session.logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
  if (session.logs.length > 300) session.logs.splice(0, session.logs.length - 300);
  console.log(`[${session.userid}] ${text}`);
}

// ─────────────────────────── mot de passe ────────────────────────────
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

// ────────────────────── lecture des commandes ─────────────────────
function readModuleName(file, dir) {
  try {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const scoped = content.match(/config\s*:\s*\{[\s\S]{0,600}?\bname\s*:\s*["'`]([^"'`]+)["'`]/);
    const match = scoped || content.match(/module\.exports[\s\S]{0,400}?\bname\s*:\s*["'`]([^"'`]+)["'`]/);
    return match ? match[1] : path.parse(file).name;
  } catch (error) {
    return path.parse(file).name;
  }
}

function listModules(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".js") && !file.endsWith("eg.js") && !REMOVED.includes(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ file, name: readModuleName(file, dir) }));
}

function readJson(dir, fallback) {
  try {
    return JSON.parse(fs.readFileSync(dir, "utf8"));
  } catch (error) {
    return fallback;
  }
}

// ───────────── écriture des configs PROPRES à une session ─────────────
/** Donne à chaque bot sa propre base de données (sinon ils s'écrasent entre eux). */
function isolateDatabase(config, userid) {
  const db = config.database || (config.database = {});
  db.autoSyncWhenStart = false;
  if (db.type === "mongodb" && typeof db.uriMongodb === "string" && db.uriMongodb) {
    try {
      const uri = new URL(db.uriMongodb);
      const base = (uri.pathname || "/").replace(/^\//, "").split("?")[0] || "goatbot";
      const cleanBase = base.replace(/_\d{5,}$/, "");
      uri.pathname = `/${cleanBase}_${userid}`;
      db.uriMongodb = uri.toString();
    } catch (error) {
      /* uri illisible : on laisse tel quel */
    }
  }
  return config;
}

function buildSessionConfig(sessionDir, { prefix, admin, userid }) {
  const config = readJson(DIR_CONFIG, {});
  if (prefix) config.prefix = prefix;
  const admins = (Array.isArray(admin) ? admin : [admin])
    .map((id) => String(id || "").trim())
    .filter(Boolean);
  if (admins.length) {
    for (const key of ["adminBot", "creator", "developer", "premium", "vipuser"]) {
      const current = Array.isArray(config[key]) ? config[key] : [];
      config[key] = [...new Set([...current, ...admins])];
    }
  }
  // pas de dashboard interne (sinon plusieurs bots se battent pour le même port)
  if (config.dashBoard) config.dashBoard.enable = false;
  if (config.serverUptime) config.serverUptime.enable = false;
  if (config.autoUptime) config.autoUptime.enable = false;
  isolateDatabase(config, userid);
  const dir = path.join(sessionDir, "config.dev.json");
  fs.writeFileSync(dir, JSON.stringify(config, null, 2));
  return { dir, prefix: config.prefix, admins };
}

// ───────── espace de travail isolé (cwd propre à chaque bot) ─────────
// Certaines librairies (fca-unofficial, caches, fichiers temporaires) écrivent
// dans process.cwd(). Si tous les bots partagent le même dossier, le second
// déploiement écrase l'état du premier => déconnexion. On crée donc un
// "miroir" de symlinks : le code est partagé (lecture seule), les dossiers
// dans lesquels on écrit sont réels et propres à chaque bot.
const WRITABLE_DIRS = new Set([
  "scripts",
  "scripts/cmds",
  "scripts/cmds/tmp",
  "scripts/events",
  "scripts/events/data",
  "scripts/events/assets",
  "cache",
  "tmp"
]);
const SKIP_ENTRIES = new Set(["sessions", "data", ".git", "node_modules/.cache"]);

function mirrorDir(sourceDir, targetDir, relative = "") {
  fs.ensureDirSync(targetDir);
  for (const entry of fs.readdirSync(sourceDir)) {
    const rel = relative ? `${relative}/${entry}` : entry;
    if (SKIP_ENTRIES.has(rel)) continue;
    const source = path.join(sourceDir, entry);
    const target = path.join(targetDir, entry);
    if (WRITABLE_DIRS.has(rel)) {
      mirrorDir(source, target, rel);
      continue;
    }
    if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false })) continue;
    try {
      fs.symlinkSync(source, target, fs.statSync(source).isDirectory() ? "dir" : "file");
    } catch (error) {
      /* déjà présent */
    }
  }
}

function buildWorkspace(sessionDir, userid) {
  const workspace = path.join(sessionDir, "workspace");
  fs.ensureDirSync(workspace);
  mirrorDir(ROOT, workspace);

  // fca-config propre au bot : pas d'auto-update pendant qu'un autre bot tourne
  const fcaTarget = path.join(workspace, "fca-config.json");
  try {
    fs.removeSync(fcaTarget);
  } catch (error) {
    /* rien */
  }
  const fca = readJson(path.join(ROOT, "fca-config.json"), {});
  fca.autoUpdate = false;
  fca.checkUpdate = { ...(fca.checkUpdate || {}), enabled: false, install: false, notifyIfCurrent: false };
  fs.writeFileSync(fcaTarget, JSON.stringify(fca, null, 2));

  // dossiers d'écriture garantis
  for (const dir of ["scripts/cmds/tmp", "scripts/events/data", "scripts/events/assets", "cache", "tmp"])
    fs.ensureDirSync(path.join(workspace, dir));

  return workspace;
}


function buildSessionCommands(sessionDir, selectedCommands, selectedEvents) {
  const configCommands = readJson(DIR_CONFIG_COMMANDS, {});
  const cmds = listModules(DIR_CMDS);
  const events = listModules(DIR_EVENTS);

  const keepCmd = new Set(selectedCommands.map((c) => String(c).toLowerCase()));
  const keepEvent = new Set(selectedEvents.map((c) => String(c).toLowerCase()));

  configCommands.commandUnload = [
    ...REMOVED,
    ...cmds
      .filter(({ file, name }) =>
        !keepCmd.has(name.toLowerCase()) && !keepCmd.has(path.parse(file).name.toLowerCase()))
      .map(({ file }) => file)
  ];
  configCommands.commandEventUnload = events
    .filter(({ file, name }) =>
      !keepEvent.has(name.toLowerCase()) && !keepEvent.has(path.parse(file).name.toLowerCase()))
    .map(({ file }) => file);

  const dir = path.join(sessionDir, "configCommands.dev.json");
  fs.writeFileSync(dir, JSON.stringify(configCommands, null, 2));
  return dir;
}

function saveHistory(entry) {
  fs.ensureDirSync(DIR_DATA);
  const history = readJson(DIR_HISTORY, []);
  const index = history.findIndex((item) => item.userid === entry.userid);
  if (index !== -1) history[index] = { ...history[index], ...entry };
  else history.push(entry);
  fs.writeFileSync(DIR_HISTORY, JSON.stringify(history, null, 2));
}

// ───────────────── infos du compte (nom + photo de profil) ─────────────────
const UA =
  "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36";

function cookieHeader(appState) {
  return (appState || [])
    .filter((item) => item && item.key && item.value !== undefined)
    .map((item) => `${item.key}=${item.value}`)
    .join("; ");
}

function decodeEntities(text) {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

const BAD_NAME = /^(erreur|error|facebook|log in|connexion|se connecter|content not found|page introuvable)/i;

function extractName(html) {
  const candidates = [];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) candidates.push(title[1]);
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) candidates.push(og[1]);
  const alt = html.match(/alt=["']([^"']{2,60}?)["'][^>]*class=["'][^"']*profpic/i);
  if (alt) candidates.push(alt[1]);
  const profilePic = html.match(/alt=["'](?:Photo de profil de |Profile picture of )([^"']+)["']/i);
  if (profilePic) candidates.push(profilePic[1]);
  for (const raw of candidates) {
    const name = decodeEntities(raw).replace(/\s*\|\s*Facebook\s*$/i, "").trim();
    if (name && !BAD_NAME.test(name) && name.length > 1) return name;
  }
  return "";
}

function extractPicture(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /src=["'](https:\/\/scontent[^"']+?)["']/i,
    /(https:\/\/[a-z0-9.\-]*fbcdn\.net\/[^"'\\ ]+?\.jpg[^"'\\ ]*)/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]).replace(/\\\//g, "/");
  }
  return "";
}

/** Récupère nom + URL de la photo via plusieurs sources (cookies du compte). */
async function fetchAccountProfile(userid, appState) {
  const cookie = cookieHeader(appState);
  const headers = {
    cookie,
    "user-agent": UA,
    "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
  const urls = [
    `https://mbasic.facebook.com/profile.php?id=${userid}&v=info`,
    `https://mbasic.facebook.com/${userid}`,
    `https://m.facebook.com/profile.php?id=${userid}`,
    `https://www.facebook.com/profile.php?id=${userid}`,
    "https://mbasic.facebook.com/me"
  ];
  const result = { name: "", picture: "" };
  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 15000, maxRedirects: 5 });
      const html = String(data);
      if (!result.name) result.name = extractName(html);
      if (!result.picture) result.picture = extractPicture(html);
      if (result.name && result.picture) break;
    } catch (error) {
      /* on essaie la source suivante */
    }
  }
  if (!result.name) result.name = `Compte ${userid}`;
  return result;
}

/** Rafraîchit nom + photo d'une session en arrière-plan. */
async function refreshProfile(session) {
  try {
    const appState = readJson(session.dirAccount, []);
    const profile = await fetchAccountProfile(session.userid, appState);
    if (profile.name && !/^Compte /.test(profile.name)) session.name = profile.name;
    if (profile.picture) session.pictureUrl = profile.picture;
  } catch (error) {
    /* silencieux */
  }
}

/** Photo servie par NOTRE serveur (les URLs fbcdn expirent / bloquent le hotlink). */
const avatarCache = new Map(); // uid -> { buffer, type, at }
const FALLBACK_AVATAR = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);


// ─────────────────────────── déploiement ──────────────────────────
function stopSession(userid, { remove = true } = {}) {
  const session = sessions.get(userid);
  if (!session) return false;
  session.stopping = true;
  if (session.child) {
    try {
      session.child.kill("SIGKILL");
    } catch (error) {
      pushLog(session, `Impossible d'arrêter le bot: ${error.message}`);
    }
  }
  session.child = null;
  session.startedAt = null;
  if (remove) sessions.delete(userid);
  return true;
}

function startSession(session) {
  pushLog(session, "Démarrage du bot...");
  const child = spawn("node", ["Goat.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: "development",
      GOATBOT_CONFIG: session.dirConfig,
      GOATBOT_CONFIG_COMMANDS: session.dirConfigCommands,
      GOATBOT_ACCOUNT: session.dirAccount
    },
    shell: false
  });
  session.child = child;
  session.startedAt = Date.now();
  session.stopping = false;

  child.stdout.on("data", (data) => pushLog(session, data.toString()));
  child.stderr.on("data", (data) => pushLog(session, data.toString()));
  child.on("close", (code) => {
    const wasActive = session.child === child;
    session.child = null;
    session.startedAt = null;
    pushLog(session, `Le bot s'est arrêté (code ${code}).`);
    if (!wasActive || session.stopping) return;
    // code 2 = redémarrage demandé par le bot, sinon on relance aussi (auto-uptime)
    setTimeout(() => {
      if (sessions.get(session.userid) === session && !session.child) startSession(session);
    }, code === 2 ? 1000 : 5000);
  });
}

// ───────────────────────────── routes ─────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "public", "index.html"));
});

app.get("/commands", (req, res) => {
  res.json({
    commands: listModules(DIR_CMDS).map(({ name }) => name),
    handleEvent: listModules(DIR_EVENTS).map(({ name }) => name)
  });
});

app.get("/info", (req, res) => {
  const bots = [...sessions.values()].map((session) => ({
    userid: session.userid,
    name: session.name,
    thumbSrc: session.thumbSrc,
    profileUrl: session.profileUrl,
    prefix: session.prefix,
    admin: session.admin,
    commands: session.commands.length,
    handleEvent: session.handleEvent.length,
    online: Boolean(session.child),
    time: session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0
  }));
  res.json({ total: bots.length, online: bots.filter((b) => b.online).length, bots });
});

app.get("/logs", (req, res) => {
  const session = sessions.get(String(req.query.uid || ""));
  if (!session) return res.json({ logs: [] });
  res.json({ logs: session.logs.slice(-200) });
});

app.post("/stop", (req, res) => {
  const { uid, password } = req.body || {};
  const session = sessions.get(String(uid || ""));
  if (!session)
    return res.status(404).json({ error: true, message: "Aucun bot en ligne avec cet UID." });
  if (!verifyPassword(password, session.password))
    return res.status(403).json({ error: true, message: "Mot de passe incorrect : seul le propriétaire du bot peut l'arrêter." });
  stopSession(session.userid);
  res.json({ success: true, message: `Bot ${session.name} arrêté.` });
});

app.post("/login", async (req, res) => {
  try {
    const { state: appState, commands, prefix, admin, password } = req.body || {};
    if (!Array.isArray(appState) || !appState.length)
      throw new Error("Appstate/cookie manquant ou invalide.");

    const cUser = appState.find((item) => item && item.key === "c_user");
    if (!cUser) throw new Error("Cookie invalide : la clé c_user est introuvable.");
    const userid = String(cUser.value);

    if (!/^\d{4}$/.test(String(password || "")))
      throw new Error("Choisis un mot de passe de 4 chiffres (il servira à arrêter ton bot).");

    const selectedCommands = (commands?.[0]?.commands) || [];
    const selectedEvents = (commands?.[1]?.handleEvent) || [];
    if (!selectedCommands.length)
      throw new Error("Sélectionne au moins une commande avant de déployer.");
    if (!prefix) throw new Error("Le prefix est obligatoire.");

    const existing = sessions.get(userid);
    if (existing && existing.child) {
      // redéploiement autorisé uniquement avec le bon mot de passe
      if (!verifyPassword(password, existing.password))
        throw new Error("Ce compte est déjà en ligne. Utilise son mot de passe pour le redéployer.");
      stopSession(userid);
    }

    // dossier de session isolé => aucun bot ne gêne un autre
    const sessionDir = path.join(DIR_SESSIONS, userid);
    fs.ensureDirSync(sessionDir);
    const dirAccount = path.join(sessionDir, "account.dev.txt");
    fs.writeFileSync(dirAccount, JSON.stringify(appState, null, 2));
    const applied = buildSessionConfig(sessionDir, { prefix, admin });
    const dirConfigCommands = buildSessionCommands(sessionDir, selectedCommands, selectedEvents);

    const profile = await fetchAccountProfile(userid, appState);
    const name = profile.name;

    const session = {
      userid,
      name,
      pictureUrl: profile.picture,
      thumbSrc: `/avatar/${userid}`,

      profileUrl: `https://www.facebook.com/profile.php?id=${userid}`,
      prefix: applied.prefix,
      admin: applied.admins,
      commands: selectedCommands,
      handleEvent: selectedEvents,
      password: hashPassword(password),
      dirConfig: applied.dir,
      dirConfigCommands,
      dirAccount,
      logs: [],
      child: null,
      startedAt: null,
      stopping: false
    };
    sessions.set(userid, session);

    saveHistory({
      userid,
      name,
      prefix: session.prefix,
      admin: session.admin,
      enableCommands: [{ commands: selectedCommands }, { handleEvent: selectedEvents }],
      time: Date.now()
    });

    startSession(session);

    res.status(200).json({
      success: true,
      message: `Bot déployé pour ${name} (${userid}) — ${selectedCommands.length} commande(s), ${selectedEvents.length} event(s).`,
      bot: { userid, name, thumbSrc: session.thumbSrc }
    });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// ───────────────────── photo de profil (proxy + cache) ─────────────────────
app.get("/avatar/:uid", async (req, res) => {
  const uid = String(req.params.uid || "");
  const cached = avatarCache.get(uid);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) {
    res.set("Content-Type", cached.type);
    return res.send(cached.buffer);
  }
  const session = sessions.get(uid);
  const appState = session ? readJson(session.dirAccount, []) : [];
  const tries = [];
  if (session && session.pictureUrl) tries.push(session.pictureUrl);
  tries.push(`https://graph.facebook.com/${uid}/picture?height=200&width=200`);
  for (const url of tries) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000,
        maxRedirects: 5,
        headers: { "user-agent": UA, cookie: cookieHeader(appState), referer: "https://www.facebook.com/" }
      });
      const type = String(response.headers["content-type"] || "");
      if (!type.startsWith("image/")) continue;
      const buffer = Buffer.from(response.data);
      avatarCache.set(uid, { buffer, type, at: Date.now() });
      res.set("Content-Type", type);
      return res.send(buffer);
    } catch (error) {
      /* source suivante */
    }
  }
  if (session) refreshProfile(session);
  res.set("Content-Type", "image/png");
  res.send(FALLBACK_AVATAR);
});

// rafraîchissement périodique des profils (nom + photo)
setInterval(() => {
  for (const session of sessions.values()) {
    if (!session.name || /^Compte /.test(session.name) || !session.pictureUrl) refreshProfile(session);
  }
}, 60 * 1000);

// ─────────────────────────── ESPACE ADMIN ───────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709";
const adminTokens = new Map(); // token -> { at, ip }
const TOKEN_TTL = 6 * 60 * 60 * 1000;
const loginAttempts = new Map(); // ip -> { count, until }
const DIR_CHAT = path.join(DIR_DATA, "chat.json");
let chat = readJson(DIR_CHAT, []);
const events = []; // journal d'activité admin

function logEvent(type, message) {
  events.push({ type, message, at: Date.now() });
  if (events.length > 200) events.splice(0, events.length - 200);
}

function saveChat() {
  fs.ensureDirSync(DIR_DATA);
  if (chat.length > 300) chat = chat.slice(-300);
  fs.writeFileSync(DIR_CHAT, JSON.stringify(chat, null, 2));
}

function isAdmin(req) {
  const token = req.get("x-admin-token") || req.body?.token || req.query?.token;
  const entry = adminTokens.get(String(token || ""));
  if (!entry) return false;
  if (Date.now() - entry.at > TOKEN_TTL) {
    adminTokens.delete(String(token));
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: true, message: "Accès admin requis." });
  next();
}

app.post("/admin/login", (req, res) => {
  const ip = req.ip;
  const attempt = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (attempt.until > Date.now())
    return res.status(429).json({ error: true, message: "Trop de tentatives, réessaie plus tard." });
  const password = String(req.body?.password || "");
  if (password !== ADMIN_PASSWORD) {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.until = Date.now() + 5 * 60 * 1000;
      attempt.count = 0;
    }
    loginAttempts.set(ip, attempt);
    logEvent("security", `Tentative admin échouée depuis ${ip}`);
    return res.status(403).json({ error: true, message: "Code admin incorrect." });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(24).toString("hex");
  adminTokens.set(token, { at: Date.now(), ip });
  logEvent("auth", `Connexion admin depuis ${ip}`);
  res.json({ success: true, token, message: "Bienvenue Christus." });
});

app.post("/admin/logout", requireAdmin, (req, res) => {
  adminTokens.delete(String(req.get("x-admin-token") || req.body?.token));
  res.json({ success: true });
});

app.get("/admin/overview", requireAdmin, (req, res) => {
  const bots = [...sessions.values()].map((session) => ({
    userid: session.userid,
    name: session.name,
    thumbSrc: session.thumbSrc,
    profileUrl: session.profileUrl,
    prefix: session.prefix,
    admin: session.admin,
    commands: session.commands.length,
    handleEvent: session.handleEvent.length,
    online: Boolean(session.child),
    pid: session.child ? session.child.pid : null,
    logs: session.logs.length,
    time: session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0
  }));
  const memory = process.memoryUsage();
  res.json({
    bots,
    online: bots.filter((bot) => bot.online).length,
    total: bots.length,
    history: readJson(DIR_HISTORY, []).length,
    events: events.slice(-60).reverse(),
    server: {
      uptime: Math.floor(process.uptime()),
      rss: Math.round(memory.rss / 1024 / 1024),
      heap: Math.round(memory.heapUsed / 1024 / 1024),
      node: process.version
    }
  });
});

// privilège admin : arrêter / relancer / supprimer n'importe quel bot sans son code
app.post("/admin/bot/:action", requireAdmin, (req, res) => {
  const { action } = req.params;
  const session = sessions.get(String(req.body?.uid || ""));
  if (!session) return res.status(404).json({ error: true, message: "Bot introuvable." });
  if (action === "stop") {
    stopSession(session.userid, { remove: false });
    logEvent("admin", `Bot ${session.name} arrêté par l'admin`);
    return res.json({ success: true, message: `${session.name} arrêté.` });
  }
  if (action === "restart") {
    stopSession(session.userid, { remove: false });
    setTimeout(() => startSession(session), 800);
    logEvent("admin", `Bot ${session.name} redémarré par l'admin`);
    return res.json({ success: true, message: `${session.name} redémarre...` });
  }
  if (action === "delete") {
    stopSession(session.userid);
    logEvent("admin", `Bot ${session.name} supprimé par l'admin`);
    return res.json({ success: true, message: `${session.name} supprimé.` });
  }
  if (action === "refresh") {
    avatarCache.delete(session.userid);
    refreshProfile(session);
    return res.json({ success: true, message: "Profil en cours de rafraîchissement." });
  }
  res.status(400).json({ error: true, message: "Action inconnue." });
});

app.post("/admin/stopall", requireAdmin, (req, res) => {
  const count = sessions.size;
  for (const userid of [...sessions.keys()]) stopSession(userid);
  logEvent("admin", `Arrêt total (${count} bot(s))`);
  res.json({ success: true, message: `${count} bot(s) arrêté(s).` });
});

// ───────────────────────────── CHAT ─────────────────────────────
app.get("/chat", (req, res) => {
  const since = Number(req.query.since || 0);
  res.json({ messages: chat.filter((message) => message.at > since).slice(-100) });
});

app.post("/chat", (req, res) => {
  const admin = isAdmin(req);
  const text = String(req.body?.message || "").trim().slice(0, 600);
  if (!text) return res.status(400).json({ error: true, message: "Message vide." });
  const author = admin
    ? "Christus (Admin)"
    : String(req.body?.name || "Visiteur").trim().slice(0, 24) || "Visiteur";
  const message = { id: crypto.randomBytes(8).toString("hex"), author, admin, text, at: Date.now() };
  chat.push(message);
  saveChat();
  res.json({ success: true, message });
});

app.delete("/chat", requireAdmin, (req, res) => {
  chat = [];
  saveChat();
  logEvent("admin", "Chat vidé");
  res.json({ success: true });
});

app.get("/admin", (req, res) => res.sendFile(path.join(ROOT, "public", "admin.html")));

process.on("unhandledRejection", (reason) => console.error("Unhandled:", reason));

function stopAll() {
  for (const userid of [...sessions.keys()]) stopSession(userid);
}
process.on("exit", stopAll);
process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Panneau autobot multi-bots disponible sur http://localhost:${PORT}`);
});
