let fonts;
try {
  fonts = require('../../func/font.js');
} catch (e) {
  fonts = { bold: (t) => t, monospace: (t) => t, sansSerif: (t) => t };
}

const ADMIN_UIDS = ["61591043063567"];

// État bank vierge (identique à bank.js)
function emptyBank() {
  return {
    balance: 0, savings: 0, vault: 0, loan: 0, loanDate: null,
    creditScore: 750, bankLevel: 1, multiplier: 1.0, premium: false,
    streak: 0, lastDaily: null, lastWork: null, lastRob: null,
    lastInterest: Date.now(), lotteryTickets: 0, achievements: [],
    reputation: 0, skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
    stocks: {}, crypto: {}, bonds: {}, realEstate: [], businesses: [],
    vehicles: [], luxury: [], insurance: {}, transactions: []
  };
}

// État empire vierge (identique à empire.js)
function emptyEmpire() {
  return {
    argentSale:        0,
    argentPropre:      0,
    totalGagne:        0,
    totalBlanchit:     0,
    rang:              "RAT",
    xp:                0,
    niveau:            1,
    reputation:        0,
    territoires:       ["BANLIEUE"],
    structuresActives: [],
    inventaire:        {},
    capaciteMax:       50,
    allies:            [],
    missionEnCours:    null,
    lastMission:       null,
    missionsCompletes: 0,
    lastGuerre:        null,
    guerresGagnees:    0,
    guerresPerdues:    0,
    lastBlanchiment:   null,
    blanchimentEnCours:null,
    lastCollecte:      null,
    lastAttentat:      null,
    lastDaily:         null,
    lastMarche:        null,
    transactions:      [],
    achievements:      [],
    evenementActif:    null,
    evenementExpire:   null,
    alerte:            0,
    prison:            null,
    vault:             0,
    loan:              0,
  };
}

module.exports = {
  config: {
    name: "resetdata",
    aliases: ["datareset", "wipedata"],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "🔧 Réinitialise les données bank et/ou empire d'un utilisateur ou de tous les utilisateurs."
    },
    category: "admin",
    guide: {
      fr: `${fonts.sansSerif("✨ COMMANDE ADMIN ✨")}\n\n` +
          `${fonts.bold("{pn} bank [@user|uid]")} : reset bank d'un utilisateur\n` +
          `${fonts.bold("{pn} bank all")} : reset bank de TOUS les utilisateurs\n` +
          `${fonts.bold("{pn} empire [@user|uid]")} : reset empire d'un utilisateur\n` +
          `${fonts.bold("{pn} empire all")} : reset empire de TOUS les utilisateurs\n` +
          `${fonts.bold("{pn} all [@user|uid]")} : reset bank + empire d'un utilisateur\n` +
          `${fonts.bold("{pn} all all")} : reset bank + empire de TOUS les utilisateurs\n\n` +
          `Exemples :\n` +
          `• ${fonts.monospace("{pn} bank @Christus")}\n` +
          `• ${fonts.monospace("{pn} empire all")}\n` +
          `• ${fonts.monospace("{pn} all all")}`
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    if (!ADMIN_UIDS.includes(event.senderID.toString())) {
      return message.reply("⛔ Accès refusé : privilèges administrateur requis.");
    }

    const cmd    = args[0]?.toLowerCase(); // bank | empire | all
    const target = args[1]?.toLowerCase(); // all | uid | (vide = soi-même ou tag)

    if (!cmd || !["bank", "empire", "all"].includes(cmd)) {
      return message.reply(
        `❌ Usage :\n` +
        `• resetdata bank [@user|uid|all]\n` +
        `• resetdata empire [@user|uid|all]\n` +
        `• resetdata all [@user|uid|all]`
      );
    }

    const resetBank   = cmd === "bank"   || cmd === "all";
    const resetEmpire = cmd === "empire" || cmd === "all";

    // ───────────────────────────────────────────────
    // MODE: all → tous les utilisateurs
    // ───────────────────────────────────────────────
    if (target === "all") {
      await message.reply("⏳ Réinitialisation en cours pour tous les utilisateurs...");

      try {
        const allUsers = await usersData.getAll();
        let count = 0;

        for (const user of allUsers) {
          const uid = user.userID || user.id;
          if (!uid) continue;

          const fresh = {};
          if (resetBank)   fresh["data.bank"]   = emptyBank();
          if (resetEmpire) fresh["data.empire"]  = emptyEmpire();

          // On reconstruit l'objet data proprement
          const current = await usersData.get(uid);
          if (!current) continue;
          if (!current.data) current.data = {};
          if (resetBank)   current.data.bank   = emptyBank();
          if (resetEmpire) current.data.empire  = emptyEmpire();
          await usersData.set(uid, current);
          count++;
        }

        const what = resetBank && resetEmpire ? "bank + empire" : resetBank ? "bank" : "empire";
        return message.reply(
          `✅ Réinitialisation terminée !\n` +
          `🔄 ${what.toUpperCase()} remis à zéro pour ${count} utilisateur(s).`
        );
      } catch (err) {
        return message.reply(`❌ Erreur lors de la réinitialisation globale :\n${err.message}`);
      }
    }

    // ───────────────────────────────────────────────
    // MODE: utilisateur ciblé (tag / uid / soi-même)
    // ───────────────────────────────────────────────
    let targetID = Object.keys(event.mentions)[0];
    if (!targetID) {
      const potentialUID = args.find(a => /^\d{10,}$/.test(a));
      if (potentialUID) targetID = potentialUID;
      else targetID = event.senderID;
    }

    let userData;
    try {
      userData = await usersData.get(targetID);
      if (!userData) return message.reply("❌ Utilisateur introuvable dans la base de données.");
    } catch (err) {
      return message.reply(`❌ Erreur lors de la récupération : ${err.message}`);
    }

    if (!userData.data) userData.data = {};

    const beforeBank   = userData.data.bank;
    const beforeEmpire = userData.data.empire;
    const lines        = [];

    if (resetBank) {
      const hadBank = !!beforeBank;
      userData.data.bank = emptyBank();
      if (hadBank) {
        lines.push(`🏦 Bank réinitialisée`);
        lines.push(`   • Balance : $${(beforeBank.balance || 0).toLocaleString()} ➜ $0`);
        lines.push(`   • Savings : $${(beforeBank.savings || 0).toLocaleString()} ➜ $0`);
        lines.push(`   • Vault   : $${(beforeBank.vault   || 0).toLocaleString()} ➜ $0`);
        lines.push(`   • Prêt    : $${(beforeBank.loan    || 0).toLocaleString()} ➜ $0`);
        const assets = [
          Object.keys(beforeBank.stocks   || {}).length,
          Object.keys(beforeBank.crypto   || {}).length,
          Object.keys(beforeBank.bonds    || {}).length,
          (beforeBank.realEstate  || []).length,
          (beforeBank.businesses  || []).length,
          (beforeBank.vehicles    || []).length,
          (beforeBank.luxury      || []).length,
        ].reduce((a, b) => a + b, 0);
        if (assets > 0) lines.push(`   • Actifs (stocks/crypto/biens…) : ${assets} effacés`);
      } else {
        lines.push(`🏦 Bank : aucune donnée existante — données vierges créées.`);
      }
    }

    if (resetEmpire) {
      const hadEmpire = !!beforeEmpire;
      userData.data.empire = emptyEmpire();
      if (hadEmpire) {
        lines.push(`🏴‍☠️ Empire réinitialisé`);
        lines.push(`   • Argent sale  : $${(beforeEmpire.argentSale  || 0).toLocaleString()} ➜ $0`);
        lines.push(`   • Argent propre: $${(beforeEmpire.argentPropre|| 0).toLocaleString()} ➜ $0`);
        lines.push(`   • Rang         : ${beforeEmpire.rang || "RAT"} ➜ RAT`);
        lines.push(`   • XP           : ${beforeEmpire.xp || 0} ➜ 0`);
        lines.push(`   • Territoires  : ${(beforeEmpire.territoires || []).length} ➜ 1 (BANLIEUE)`);
        lines.push(`   • Structures   : ${(beforeEmpire.structuresActives || []).length} ➜ 0`);
        lines.push(`   • Alliés       : ${(beforeEmpire.allies || []).length} ➜ 0`);
      } else {
        lines.push(`🏴‍☠️ Empire : aucune donnée existante — données vierges créées.`);
      }
    }

    try {
      await usersData.set(targetID, userData);
      const name = userData.name || targetID;
      return message.reply(
        `✅ Réinitialisation effectuée pour ${fonts.bold(name)} :\n\n` +
        lines.join("\n")
      );
    } catch (err) {
      return message.reply(`❌ Erreur lors de la sauvegarde : ${err.message}`);
    }
  }
};
    
