const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

let fonts;
try {
  fonts = require("../../func/font.js");
} catch (e) {
  fonts = { bold: (t) => t, monospace: (t) => t, sansSerif: (t) => t };
}

// ─────────────────────────── SÉCURITÉ ───────────────────────────
const OWNER_UID = "61590743674439";

// ─────────────────────────── CHEMINS ────────────────────────────
const ROOT = process.cwd();
const CMDS_DIR = path.join(ROOT, "scripts", "cmds");
const EVENTS_DIR = path.join(ROOT, "scripts", "events");
const BACKUP_DIR = path.join(ROOT, "scripts", "cmds", "tmp", "agent_backups");

// mémoire de conversation (par utilisateur)
const memory = new Map();

// ─────────────────────────── UTILS FS ───────────────────────────
function resolveTarget(name) {
  if (!name) return null;
  let file = String(name).trim().replace(/^\/+/, "");
  if (file.includes("..")) return null;
  // chemin explicite depuis la racine du projet
  if (file.includes("/")) return path.join(ROOT, file);
  if (!file.endsWith(".js") && !file.includes(".")) file += ".js";
  const inCmds = path.join(CMDS_DIR, file);
  const inEvents = path.join(EVENTS_DIR, file);
  if (fs.existsSync(inCmds)) return inCmds;
  if (fs.existsSync(inEvents)) return inEvents;
  return inCmds; // création par défaut dans cmds
}

function backup(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    fs.ensureDirSync(BACKUP_DIR);
    const dest = path.join(
      BACKUP_DIR,
      `${path.basename(filePath)}.${Date.now()}.bak`
    );
    fs.copyFileSync(filePath, dest);
    return dest;
  } catch (e) {
    return null;
  }
}

function listBackups(base) {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => (base ? f.startsWith(base + ".") : true))
    .sort()
    .reverse();
}

function listCommands() {
  const cmds = fs.existsSync(CMDS_DIR)
    ? fs.readdirSync(CMDS_DIR).filter((f) => f.endsWith(".js"))
    : [];
  const evts = fs.existsSync(EVENTS_DIR)
    ? fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".js"))
    : [];
  return { cmds, evts };
}

function searchProject(query, limit = 20) {
  const results = [];
  const needle = String(query).toLowerCase();
  for (const dir of [CMDS_DIR, EVENTS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
      const full = path.join(dir, file);
      let content;
      try {
        content = fs.readFileSync(full, "utf8");
      } catch (e) {
        continue;
      }
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (results.length < limit && line.toLowerCase().includes(needle))
          results.push(`${path.relative(ROOT, full)}:${i + 1}: ${line.trim().slice(0, 160)}`);
      });
    }
  }
  return results;
}

// ─────────────────── RECHARGEMENT À CHAUD ───────────────────────
function unregister(commandName, isEvent) {
  const GoatBot = global.GoatBot;
  if (!GoatBot) return;
  const map = isEvent ? GoatBot.eventCommands : GoatBot.commands;
  if (map && map.has(commandName)) map.delete(commandName);
  if (GoatBot.aliases) {
    for (const [alias, name] of GoatBot.aliases.entries())
      if (name === commandName) GoatBot.aliases.delete(alias);
  }
  for (const key of ["onChat", "onEvent", "onAnyEvent"]) {
    if (Array.isArray(GoatBot[key]))
      GoatBot[key] = GoatBot[key].filter((n) => n !== commandName);
  }
  if (Array.isArray(GoatBot.onFirstChat))
    GoatBot.onFirstChat = GoatBot.onFirstChat.filter(
      (o) => o.commandName !== commandName
    );
}

async function reloadFile(filePath) {
  const GoatBot = global.GoatBot;
  if (!GoatBot) throw new Error("GoatBot non initialisé");
  const isEvent = filePath.includes(`${path.sep}events${path.sep}`);
  const full = path.normalize(filePath);

  // retire l'ancienne version (par nom de fichier)
  const map = isEvent ? GoatBot.eventCommands : GoatBot.commands;
  for (const [name, cmd] of map.entries())
    if (cmd.location && path.normalize(cmd.location) === full)
      unregister(name, isEvent);

  delete require.cache[require.resolve(full)];
  if (!fs.existsSync(full)) return null;

  const command = require(full);
  command.location = full;
  const config = command.config;
  if (!config || !config.name) throw new Error("config.name manquant");
  if (!command.onStart && !isEvent) throw new Error("onStart manquant");

  unregister(config.name, isEvent);
  map.set(config.name, command);

  if (Array.isArray(config.aliases))
    for (const alias of config.aliases) GoatBot.aliases.set(alias, config.name);
  if (command.onChat) GoatBot.onChat.push(config.name);
  if (command.onEvent) GoatBot.onEvent.push(config.name);
  if (command.onAnyEvent) GoatBot.onAnyEvent.push(config.name);
  if (command.onFirstChat)
    GoatBot.onFirstChat.push({ commandName: config.name, threadIDsChattedFirstTime: [] });

  global.temp = global.temp || { contentScripts: { cmds: {}, events: {} } };
  const bucket = isEvent ? "events" : "cmds";
  if (global.temp.contentScripts && global.temp.contentScripts[bucket])
    global.temp.contentScripts[bucket][path.basename(full)] = fs.readFileSync(full, "utf8");

  if (typeof command.onLoad === "function") {
    try {
      await command.onLoad({ api: global.GoatBot.fcaApi || global.client?.api });
    } catch (e) {
      /* onLoad optionnel */
    }
  }
  return config.name;
}

function syntaxCheck(code) {
  try {
    new (require("vm").Script)(code, { filename: "agent-check.js" });
    return null;
  } catch (e) {
    return e.message;
  }
}

// ─────────────────────────── LLM ────────────────────────────────
function getApiConfig() {
  const env = global.GoatBot?.config?.agent || {};
  const key =
    process.env.AGENT_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    env.apiKey ||
    global.GoatBot?.configCommands?.envGlobal?.agentApiKey ||
    "";
  const provider =
    env.provider ||
    (process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY ? "openai" : "gemini");
  return {
    key,
    provider,
    model: env.model || (provider === "openai" ? "gpt-4o-mini" : "gemini-2.0-flash"),
    baseURL: env.baseURL || "https://api.openai.com/v1"
  };
}

async function askLLM(messages) {
  const { key, provider, model, baseURL } = getApiConfig();
  if (!key)
    throw new Error(
      "Aucune clé API IA. Ajoute AGENT_API_KEY (ou GEMINI_API_KEY / OPENAI_API_KEY) dans l'environnement, ou \"agent\": { \"apiKey\": \"...\" } dans config."
    );

  if (provider === "openai") {
    const { data } = await axios.post(
      `${baseURL}/chat/completions`,
      { model, messages, temperature: 0.2 },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 120000 }
    );
    return data.choices?.[0]?.message?.content || "";
  }

  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
    },
    { timeout: 120000 }
  );
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
}

const SYSTEM_PROMPT = `Tu es AGENT, l'assistant de développement intégré au bot Facebook "Christus's Autobot" (framework GoatBot V2, Node.js, CommonJS).
Tu peux LIRE, CRÉER, MODIFIER et SUPPRIMER des fichiers du projet, et recharger les commandes à chaud.

Structure : les commandes sont dans scripts/cmds/*.js, les events dans scripts/events/*.js.
Une commande a la forme :
module.exports = { config: { name, aliases, version, author, countDown, role, description, category, guide }, onStart: async function ({ api, event, args, message, usersData, threadsData, globalData }) {} }

Tu réponds TOUJOURS en JSON strict, sans texte autour, sans balises markdown :
{"thought":"...","actions":[{...}],"reply":"message final pour l'utilisateur en français"}

Actions disponibles :
- {"type":"list"}                                  -> liste des commandes et events
- {"type":"read","file":"bank.js"}                 -> lit un fichier (chemin relatif au projet ou nom de commande)
- {"type":"search","query":"usersData.set"}        -> cherche du texte dans les scripts
- {"type":"write","file":"x.js","content":"..."}   -> écrit/remplace un fichier (backup auto + reload)
- {"type":"delete","file":"x.js"}                  -> supprime un fichier (backup auto)
- {"type":"reload","file":"x.js"}                  -> recharge la commande à chaud

Règles :
1. Avant de modifier une commande existante, LIS-la d'abord (action read) puis attends le résultat.
2. Quand tu écris un fichier, écris le fichier COMPLET, jamais d'ellipse ni "... reste du code".
3. Le code doit être du JavaScript CommonJS valide (require, module.exports).
4. Si tu as juste besoin de répondre à une question, renvoie "actions": [] et remplis "reply".
5. "reply" est court, clair, en français, et décrit ce que tu as fait.`;

async function runActions(actions, log) {
  const results = [];
  for (const action of actions || []) {
    const type = String(action.type || "").toLowerCase();
    try {
      if (type === "list") {
        const { cmds, evts } = listCommands();
        results.push({
          type,
          ok: true,
          result: `CMDS (${cmds.length}): ${cmds.join(", ")}\nEVENTS (${evts.length}): ${evts.join(", ")}`
        });
        log.push(`📋 Liste des commandes`);
      } else if (type === "read") {
        const target = resolveTarget(action.file);
        if (!target || !fs.existsSync(target)) throw new Error("fichier introuvable");
        const content = fs.readFileSync(target, "utf8");
        results.push({
          type,
          ok: true,
          file: path.relative(ROOT, target),
          result: content.slice(0, 60000)
        });
        log.push(`👁️ Lecture ${path.relative(ROOT, target)}`);
      } else if (type === "search") {
        const hits = searchProject(action.query);
        results.push({ type, ok: true, result: hits.join("\n") || "aucun résultat" });
        log.push(`🔎 Recherche "${action.query}" (${hits.length})`);
      } else if (type === "write") {
        const target = resolveTarget(action.file);
        if (!target) throw new Error("chemin invalide");
        const code = String(action.content ?? "");
        if (!code.trim()) throw new Error("contenu vide");
        if (target.endsWith(".js")) {
          const err = syntaxCheck(code);
          if (err) throw new Error(`erreur de syntaxe : ${err}`);
        }
        const bak = backup(target);
        fs.ensureDirSync(path.dirname(target));
        fs.writeFileSync(target, code);
        let reloaded = null;
        if (target.startsWith(CMDS_DIR) || target.startsWith(EVENTS_DIR)) {
          try {
            reloaded = await reloadFile(target);
          } catch (e) {
            if (bak) fs.copyFileSync(bak, target);
            throw new Error(`reload échoué (fichier restauré) : ${e.message}`);
          }
        }
        results.push({ type, ok: true, result: `écrit${reloaded ? ` et rechargé (${reloaded})` : ""}` });
        log.push(`💾 ${path.relative(ROOT, target)} écrit${reloaded ? ` + rechargé` : ""}`);
      } else if (type === "delete") {
        const target = resolveTarget(action.file);
        if (!target || !fs.existsSync(target)) throw new Error("fichier introuvable");
        backup(target);
        let name = null;
        try {
          const mod = require(target);
          name = mod?.config?.name;
        } catch (e) {
          /* ignore */
        }
        fs.removeSync(target);
        delete require.cache[require.resolve(target)];
        if (name) unregister(name, target.includes(`${path.sep}events${path.sep}`));
        results.push({ type, ok: true, result: "supprimé" });
        log.push(`🗑️ ${path.relative(ROOT, target)} supprimé`);
      } else if (type === "reload") {
        const target = resolveTarget(action.file);
        const name = await reloadFile(target);
        results.push({ type, ok: true, result: `rechargé: ${name}` });
        log.push(`♻️ ${name} rechargé`);
      } else {
        throw new Error(`action inconnue "${type}"`);
      }
    } catch (e) {
      results.push({ type, ok: false, error: e.message });
      log.push(`❌ ${type}: ${e.message}`);
    }
  }
  return results;
}

function parseJson(text) {
  let raw = String(text || "").trim();
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("réponse IA illisible");
  return JSON.parse(raw.slice(start, end + 1));
}

// ─────────────────────────── COMMANDE ───────────────────────────
module.exports = {
  config: {
    name: "agent",
    aliases: ["ai-dev", "dev-agent"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 2,
    description: {
      fr: "🤖 Agent de développement IA : lit, crée, modifie, supprime et recharge les commandes du bot en direct.",
      en: "AI dev agent: read/create/edit/delete/reload bot commands live."
    },
    category: "owner",
    guide: {
      fr:
        `${fonts.sansSerif("🤖 AGENT DE DÉVELOPPEMENT")}\n\n` +
        `${fonts.bold("{pn} <demande>")} : demande libre (ex: arrange la cmd bank.js, ajoute une cmd dé, supprime slots.js, explique-moi le projet)\n` +
        `${fonts.bold("{pn} list")} : lister les commandes\n` +
        `${fonts.bold("{pn} read <fichier>")} : voir le code d'une commande\n` +
        `${fonts.bold("{pn} reload <fichier>")} : recharger une commande à chaud\n` +
        `${fonts.bold("{pn} delete <fichier>")} : supprimer une commande (backup auto)\n` +
        `${fonts.bold("{pn} restore <fichier>")} : restaurer la dernière sauvegarde\n` +
        `${fonts.bold("{pn} backups [fichier]")} : lister les sauvegardes\n` +
        `${fonts.bold("{pn} clear")} : effacer la mémoire de conversation\n\n` +
        `Tu peux aussi répondre à un message de l'agent pour continuer la discussion.`
    }
  },

  onStart: async function ({ message, event, args, commandName }) {
    if (event.senderID.toString() !== OWNER_UID)
      return message.reply("⛔ Cette commande est réservée au propriétaire du bot.");

    const sub = (args[0] || "").toLowerCase();

    if (!args.length) return message.reply(this.config.guide.fr.replace(/\{pn\}/g, "agent"));

    // ── sous-commandes directes ──
    if (sub === "list") {
      const { cmds, evts } = listCommands();
      return message.reply(
        `📋 ${fonts.bold("Commandes")} (${cmds.length}) :\n${cmds.join(", ")}\n\n` +
          `⚡ ${fonts.bold("Events")} (${evts.length}) :\n${evts.join(", ")}`
      );
    }

    if (sub === "read") {
      const target = resolveTarget(args[1]);
      if (!target || !fs.existsSync(target)) return message.reply("❌ Fichier introuvable.");
      const content = fs.readFileSync(target, "utf8");
      const head = `📄 ${path.relative(ROOT, target)} (${content.split("\n").length} lignes)\n\n`;
      return message.reply(head + (content.length > 8000 ? content.slice(0, 8000) + "\n… (tronqué)" : content));
    }

    if (sub === "reload") {
      try {
        const name = await reloadFile(resolveTarget(args[1]));
        return message.reply(`♻️ Commande "${name}" rechargée avec succès.`);
      } catch (e) {
        return message.reply(`❌ Reload échoué : ${e.message}`);
      }
    }

    if (sub === "delete" || sub === "del") {
      const target = resolveTarget(args[1]);
      if (!target || !fs.existsSync(target)) return message.reply("❌ Fichier introuvable.");
      const log = [];
      await runActions([{ type: "delete", file: args[1] }], log);
      return message.reply(log.join("\n"));
    }

    if (sub === "backups") {
      const base = args[1] ? path.basename(resolveTarget(args[1])) : null;
      const list = listBackups(base).slice(0, 20);
      return message.reply(list.length ? `🗂️ Sauvegardes :\n• ${list.join("\n• ")}` : "Aucune sauvegarde.");
    }

    if (sub === "restore") {
      const target = resolveTarget(args[1]);
      if (!target) return message.reply("❌ Fichier invalide.");
      const list = listBackups(path.basename(target));
      if (!list.length) return message.reply("❌ Aucune sauvegarde pour ce fichier.");
      fs.copyFileSync(path.join(BACKUP_DIR, list[0]), target);
      let info = "";
      try {
        info = ` et rechargé (${await reloadFile(target)})`;
      } catch (e) {
        info = ` (reload échoué : ${e.message})`;
      }
      return message.reply(`↩️ Restauré depuis ${list[0]}${info}.`);
    }

    if (sub === "clear") {
      memory.delete(event.senderID);
      return message.reply("🧹 Mémoire de conversation effacée.");
    }

    return this.run({ message, event, prompt: args.join(" "), commandName });
  },

  onReply: async function ({ message, event, Reply, commandName }) {
    if (event.senderID.toString() !== OWNER_UID) return;
    if (Reply.author !== event.senderID) return;
    if (!event.body) return;
    return this.run({ message, event, prompt: event.body, commandName });
  },

  run: async function ({ message, event, prompt, commandName }) {
    const uid = event.senderID;
    const history = memory.get(uid) || [];
    history.push({ role: "user", content: prompt });

    const { cmds } = listCommands();
    const context =
      `Commandes existantes (${cmds.length}) : ${cmds.join(", ")}\n` +
      `Racine du projet : ${ROOT}`;

    const log = [];
    let final = null;

    try {
      for (let step = 0; step < 6; step++) {
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: context },
          ...history.slice(-16)
        ];
        const answer = await askLLM(messages);
        let parsed;
        try {
          parsed = parseJson(answer);
        } catch (e) {
          final = answer.slice(0, 3000);
          break;
        }
        history.push({ role: "assistant", content: JSON.stringify(parsed) });

        const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
        if (!actions.length) {
          final = parsed.reply || "(aucune réponse)";
          break;
        }
        const results = await runActions(actions, log);
        history.push({
          role: "user",
          content: `RÉSULTATS DES ACTIONS:\n${JSON.stringify(results).slice(0, 60000)}\nContinue : si tout est fait, renvoie actions:[] avec ta réponse finale.`
        });
        if (parsed.reply && step === 5) final = parsed.reply;
      }
    } catch (e) {
      memory.set(uid, history.slice(-20));
      return message.reply(`❌ Agent : ${e.message}`);
    }

    memory.set(uid, history.slice(-20));

    const body =
      `🤖 ${fonts.bold("AGENT")}\n` +
      (log.length ? `\n${log.join("\n")}\n` : "") +
      `\n${final || "Terminé."}`;

    return message.reply(body.slice(0, 15000), (err, info) => {
      if (!err && info)
        global.GoatBot.onReply.set(info.messageID, {
          commandName: commandName || "agent",
          messageID: info.messageID,
          author: event.senderID
        });
    });
  }
};
