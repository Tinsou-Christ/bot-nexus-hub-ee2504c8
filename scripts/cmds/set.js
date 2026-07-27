const fs = require("fs-extra");
const path = require("path");

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  fonts = { bold: (t) => t, monospace: (t) => t, sansSerif: (t) => t };
}

function formatMoney(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return "0$";
  amount = Number(amount);
  if (amount === Infinity) return "∞$";
  if (amount === -Infinity) return "-∞$";
  if (!isFinite(amount)) return "NaN$";
  const scales = [
    { value: 1e18, suffix: "Qi" },
    { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" }
  ];
  const scale = scales.find(s => Math.abs(amount) >= s.value);
  if (scale) {
    const scaled = (amount / scale.value).toFixed(2);
    const clean = scaled.endsWith(".00") ? scaled.slice(0, -3) : scaled;
    return `${amount < 0 ? "-" : ""}${clean}${scale.suffix}$`;
  }
  return `${amount.toLocaleString("en-US")}$`;
}

module.exports = {
  config: {
    name: "set",
    aliases: ["setadmin", "admincmd"],
    version: "2.0",
    author: "Christus",
    role: 6,
    description: {
      fr: "🔧 Modifier les données d'un utilisateur (argent, XP, variables personnalisées) – réservé aux administrateurs"
    },
    category: "admin",
    guide: {
      fr: `${fonts.sansSerif("✨ COMMANDE ADMIN ✨")}\n` +
           `${fonts.bold("{pn} money <montant> [@user]")} : définir l'argent\n` +
           `${fonts.bold("{pn} exp <valeur> [@user]")} : définir l'XP\n` +
           `${fonts.bold("{pn} custom <variable> <valeur> [@user]")} : définir une variable personnalisée\n\n` +
           `${fonts.bold("💡 Exemples :")}\n` +
           `• ${fonts.monospace("{pn} money 1000000 @Christus")}\n` +
           `• ${fonts.monospace("{pn} exp 5000")}\n` +
           `• ${fonts.monospace("{pn} custom tmwin1 10 @user")}`
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const ADMIN_UIDS = ["61591043063567"];

    if (!ADMIN_UIDS.includes(event.senderID.toString())) {
      return message.reply(fonts.bold("⛔ Accès refusé : privilèges administrateur requis."));
    }

    const action = args[0]?.toLowerCase();
    const targetID = Object.keys(event.mentions)[0] || event.senderID;
    let userData;

    try {
      userData = await usersData.get(targetID);
      if (!userData) {
        return message.reply(fonts.bold("❌ Utilisateur introuvable dans la base de données."));
      }
    } catch (err) {
      return message.reply(fonts.bold(`❌ Erreur lors de la récupération des données : ${err.message}`));
    }

    if (action === "money") {
      const amount = parseFloat(args[1]);
      if (isNaN(amount)) {
        return message.reply(fonts.bold("❌ Montant invalide. Exemple : set money 5000"));
      }
      try {
        await usersData.set(targetID, { money: amount });
        return message.reply(fonts.bold(`💰 Argent défini à ${formatMoney(amount)} pour ${fonts.bold(userData.name)}`));
      } catch (err) {
        return message.reply(fonts.bold(`❌ Erreur : ${err.message}`));
      }
    }

    else if (action === "exp") {
      const amount = parseFloat(args[1]);
      if (isNaN(amount)) {
        return message.reply(fonts.bold("❌ Valeur d'XP invalide. Exemple : set exp 1500"));
      }
      try {
        await usersData.set(targetID, { exp: amount });
        return message.reply(fonts.bold(`🌟 XP définie à ${amount.toLocaleString()} pour ${fonts.bold(userData.name)}`));
      } catch (err) {
        return message.reply(fonts.bold(`❌ Erreur : ${err.message}`));
      }
    }

    else if (action === "custom") {
      const variable = args[1];
      const value = args[2];
      if (!variable || value === undefined) {
        return message.reply(fonts.bold("❌ Utilisation : set custom <variable> <valeur> [@user]"));
      }
      try {
        await usersData.set(targetID, { [variable]: value });
        return message.reply(fonts.bold(`🔧 Variable "${variable}" définie à ${value} pour ${fonts.bold(userData.name)}`));
      } catch (err) {
        return message.reply(fonts.bold(`❌ Erreur : ${err.message}`));
      }
    }

    else {
      return message.SyntaxError();
    }
  }
};
