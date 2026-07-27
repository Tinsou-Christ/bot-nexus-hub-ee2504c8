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
function buildSessionConfig(sessionDir, { prefix, admin }) {
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
  const dir = path.join(sessionDir, "config.dev.json");
  fs.writeFileSync(dir, JSON.stringify(config, null, 2));
  return { dir, prefix: config.prefix, admins };
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
function avatarUrl(userid) {
  return `https://graph.facebook.com/${userid}/picture?height=200&width=200`;
}

async function fetchAccountName(userid, appState) {
  try {
    const cookie = appState
      .filter((item) => item && item.key && item.value !== undefined)
      .map((item) => `${item.key}=${item.value}`)
      .join("; ");
    const { data } = await axios.get(`https://mbasic.facebook.com/profile.php?id=${userid}`, {
      headers: {
        cookie,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36"
      },
      timeout: 15000
    });
    const match = String(data).match(/<title[^>]*>([^<]+)<\/title>/i);
    const name = match ? match[1].trim() : "";
    if (name && !/facebook|log in|connexion/i.test(name)) return name;
  } catch (error) {
    /* silencieux : on retombe sur l'UID */
  }
  return `Compte ${userid}`;
}

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

    const name = await fetchAccountName(userid, appState);

    const session = {
      userid,
      name,
      thumbSrc: avatarUrl(userid),
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
