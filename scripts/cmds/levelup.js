const fs = require("fs-extra");
const path = require("path");

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  fonts = { bold: (t) => t, monospace: (t) => t, sansSerif: (t) => t };
}

module.exports = {
  config: {
    name: "levelup",
    aliases: ["lvup", "setlevel", "setniveau"],
    version: "1.3",
    author: "Christus",
    countDown: 5,
    role: 1,
    description: {
      fr: "📈 Définit le niveau d'un utilisateur (avec synchronisation automatique de l'XP)"
    },
    category: "ranking",
    guide: {
      fr: `${fonts.sansSerif("✨ MODIFICATION DE NIVEAU ✨")}\n` +
           `${fonts.bold("{pn}")} ${fonts.monospace("<@user|uid> <valeur>")}\n\n` +
           `${fonts.bold("💡 Exemples :")}\n` +
           `• ${fonts.monospace("{pn} @user 10")} → +10 niveaux\n` +
           `• ${fonts.monospace("{pn} @user 10/20")} → aléatoire entre 10 et 20\n` +
           `• ${fonts.monospace("{pn} @user -5")} → retire 5 niveaux\n` +
           `• ${fonts.monospace("{pn} 123456789 15")} → via UID`
    }
  },

  onStart: async function ({ message, event, args, usersData, envCommands }) {
    const deltaNext = envCommands["rank"]?.deltaNext || 5;

    let targetID;
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
      args.shift();
    } else if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      args.shift();
    } else if (/^\d{6,}$/.test(args[0])) {
      targetID = args.shift();
    }

    if (!targetID) {
      return message.reply(fonts.bold("❌ Veuillez taguer, répondre ou fournir un UID valide."));
    }

    const input = args.find(arg => !isNaN(arg) || arg.includes("/"));
    if (!input) {
      return message.reply(fonts.bold("⚠️ Fournissez un nombre de niveaux (ex: 10) ou une plage (ex: 10/20) ou une valeur négative (ex: -5)."));
    }

    let levelChange;
    if (input.includes("/")) {
      const [min, max] = input.split("/").map(Number);
      if (isNaN(min) || isNaN(max) || min > max) {
        return message.reply(fonts.bold("❌ Plage invalide. Exemple : 10/20"));
      }
      levelChange = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      levelChange = parseInt(input);
      if (isNaN(levelChange)) {
        return message.reply(fonts.bold("❌ Valeur numérique invalide."));
      }
    }

    const userData = await usersData.get(targetID);
    if (!userData) {
      return message.reply(fonts.bold("❌ Utilisateur introuvable dans la base de données."));
    }

    const oldExp = userData.exp || 0;
    const oldLevel = Math.floor((1 + Math.sqrt(1 + 8 * oldExp / deltaNext)) / 2);
    const newLevel = Math.max(1, oldLevel + levelChange);
    const newExp = Math.floor(((newLevel ** 2 - newLevel) * deltaNext) / 2);

    await usersData.set(targetID, { exp: newExp });

    const name = userData.name || "Inconnu";
    const msg = `${fonts.bold("📈 MISE À JOUR DU NIVEAU")}\n━━━━━━━━━━━━━━━━━━━━\n👤 ${fonts.bold(name)} (${fonts.monospace(targetID)})\n🎚️ Niveau : ${oldLevel} → ${newLevel}\n✨ XP : ${oldExp.toLocaleString()} → ${newExp.toLocaleString()}`;
    return message.reply(msg);
  }
};
