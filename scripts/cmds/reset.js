const fs = require("fs-extra");
const path = require("path");

let fonts;
try {
  fonts = require("../../func/font.js");
} catch (e) {
  fonts = { bold: (t) => t, monospace: (t) => t, sansSerif: (t) => t };
}

// ─────────────────────────── SÉCURITÉ ───────────────────────────
const OWNER_UID = "61590743674439";

function formatMoney(amount) {
  amount = Number(amount) || 0;
  const scales = [
    { value: 1e18, suffix: "Qi" },
    { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" }
  ];
  const scale = scales.find((s) => Math.abs(amount) >= s.value);
  if (scale) {
    const scaled = (amount / scale.value).toFixed(2);
    return `${scaled.endsWith(".00") ? scaled.slice(0, -3) : scaled}${scale.suffix}$`;
  }
  return `${amount.toLocaleString("en-US")}$`;
}

// Données de jeu stockées ailleurs que dans usersData (fichiers json des cmds)
const DATA_DIRS = [
  path.join(process.cwd(), "scripts", "cmds", "tmp"),
  path.join(process.cwd(), "scripts", "events", "data")
];
const PROTECTED_FILES = new Set([".gitkeep"]);

function wipeJsonDataFiles() {
  const wiped = [];
  for (const dir of DATA_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (PROTECTED_FILES.has(file) || !file.endsWith(".json")) continue;
      const full = path.join(dir, file);
      try {
        const raw = fs.readJsonSync(full, { throws: false });
        fs.writeJsonSync(full, Array.isArray(raw) ? [] : {}, { spaces: 2 });
        wiped.push(file);
      } catch (e) {
        /* ignore */
      }
    }
  }
  return wiped;
}

module.exports = {
  config: {
    name: "reset",
    aliases: ["resetall", "wipe"],
    version: "1.0",
    author: "Christus",
    countDown: 10,
    role: 2,
    description: {
      fr: "♻️ Réinitialise TOUT : argent, XP et toutes les données de jeu (bank, royaume, empire, etc.) de tous les utilisateurs.",
      en: "Reset everything: money, exp and all game data of every user."
    },
    category: "owner",
    guide: {
      fr:
        `${fonts.sansSerif("♻️ RÉINITIALISATION GLOBALE")}\n\n` +
        `${fonts.bold("{pn}")} : tout remettre à 0 (demande confirmation)\n` +
        `${fonts.bold("{pn} confirm")} : confirmer la réinitialisation totale\n` +
        `${fonts.bold("{pn} money")} : remettre uniquement l'argent à 0\n` +
        `${fonts.bold("{pn} exp")} : remettre uniquement l'XP à 0\n` +
        `${fonts.bold("{pn} data")} : effacer uniquement les données de jeu (bank, royaume, empire…)\n` +
        `${fonts.bold("{pn} user <@user|uid>")} : réinitialiser un seul utilisateur\n` +
        `${fonts.bold("{pn} files")} : vider les fichiers .json de données des commandes\n\n` +
        `⚠️ Action irréversible.`
    }
  },

  onStart: async function ({ message, event, args, usersData, commandName }) {
    if (event.senderID.toString() !== OWNER_UID)
      return message.reply("⛔ Cette commande est réservée au propriétaire du bot.");

    const sub = (args[0] || "").toLowerCase();

    // ── un seul utilisateur ──
    if (sub === "user") {
      let targetID = Object.keys(event.mentions || {})[0];
      if (!targetID) targetID = args.find((a) => /^\d{10,}$/.test(a)) || event.senderID;
      try {
        const user = await usersData.get(targetID);
        if (!user) return message.reply("❌ Utilisateur introuvable.");
        const before = { money: user.money || 0, exp: user.exp || 0 };
        await usersData.set(targetID, { money: 0, exp: 0, data: {} });
        return message.reply(
          `✅ ${fonts.bold(user.name || targetID)} réinitialisé.\n` +
            `💰 ${formatMoney(before.money)} ➜ 0$\n` +
            `🌟 XP ${before.exp.toLocaleString()} ➜ 0\n` +
            `🗃️ Données de jeu effacées (bank, royaume, empire…)`
        );
      } catch (err) {
        return message.reply(`❌ Erreur : ${err.message}`);
      }
    }

    // ── vider les fichiers json ──
    if (sub === "files") {
      const wiped = wipeJsonDataFiles();
      return message.reply(
        wiped.length
          ? `🧹 ${wiped.length} fichier(s) de données vidé(s) :\n• ${wiped.join("\n• ")}`
          : "Aucun fichier de données à vider."
      );
    }

    const modes = { money: "money", exp: "exp", data: "data", confirm: "all", all: "all" };
    const mode = modes[sub];

    // ── demande de confirmation ──
    if (!mode) {
      return message.reply(
        `⚠️ ${fonts.bold("RÉINITIALISATION TOTALE")}\n\n` +
          `Cela va remettre à ZÉRO, pour TOUS les utilisateurs :\n` +
          `• 💰 l'argent\n• 🌟 l'XP\n• 🗃️ toutes les données de jeu (bank, royaume, empire, ferme, casino…)\n` +
          `• 📁 les fichiers .json de données des commandes\n\n` +
          `Réponds ${fonts.monospace("oui")} à ce message ou tape ${fonts.monospace("reset confirm")} pour valider.`,
        (err, info) => {
          if (!err && info)
            global.GoatBot.onReply.set(info.messageID, {
              commandName: commandName || "reset",
              messageID: info.messageID,
              author: event.senderID,
              type: "confirm"
            });
        }
      );
    }

    return this.doReset({ message, mode, usersData });
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    if (event.senderID.toString() !== OWNER_UID) return;
    if (Reply.author !== event.senderID) return;
    const answer = (event.body || "").trim().toLowerCase();
    if (!["oui", "yes", "ok", "confirm", "y"].includes(answer))
      return message.reply("❌ Réinitialisation annulée.");
    return this.doReset({ message, mode: "all", usersData });
  },

  doReset: async function ({ message, mode, usersData }) {
    await message.reply("⏳ Réinitialisation en cours, cela peut prendre un moment...");

    try {
      const allUsers = await usersData.getAll();
      let count = 0;
      let totalMoney = 0;

      for (const user of allUsers) {
        const uid = user.userID || user.id;
        if (!uid) continue;
        const update = {};
        if (mode === "all" || mode === "money") {
          totalMoney += Number(user.money) || 0;
          update.money = 0;
        }
        if (mode === "all" || mode === "exp") update.exp = 0;
        if (mode === "all" || mode === "data") update.data = {};
        try {
          await usersData.set(uid, update);
          count++;
        } catch (e) {
          /* utilisateur ignoré */
        }
      }

      const wiped = mode === "all" ? wipeJsonDataFiles() : [];

      const lines = [
        `✅ ${fonts.bold("Réinitialisation terminée")}`,
        `👥 Utilisateurs traités : ${count}`
      ];
      if (mode === "all" || mode === "money")
        lines.push(`💰 Argent effacé au total : ${formatMoney(totalMoney)} ➜ 0$`);
      if (mode === "all" || mode === "exp") lines.push(`🌟 XP remise à 0`);
      if (mode === "all" || mode === "data")
        lines.push(`🗃️ Données de jeu effacées (bank, royaume, empire, ferme, casino…)`);
      if (wiped.length) lines.push(`📁 Fichiers de données vidés : ${wiped.length}`);

      return message.reply(lines.join("\n"));
    } catch (err) {
      return message.reply(`❌ Erreur lors de la réinitialisation :\n${err.message}`);
    }
  }
};
