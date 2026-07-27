"use strict";

const fonts = require('../../func/font.js');

// ══════════════════════════════════════════════════════════════
//  COOLDOWNS
// ══════════════════════════════════════════════════════════════
const CD = {
  QUETE:      2  * 60 * 60 * 1000,
  PILLAGE:    4  * 60 * 60 * 1000,
  DONJON:     6  * 60 * 60 * 1000,
  RAID:       12 * 60 * 60 * 1000,
  DAILY:      24 * 60 * 60 * 1000,
  RECOLTE:    1  * 60 * 60 * 1000,
  MARCHE:     30 * 60 * 1000,
};

// ══════════════════════════════════════════════════════════════
//  TITRES (= rangs / grades)
// ══════════════════════════════════════════════════════════════
const TITRES = [
  { id: "PAYSAN",     nom: "Paysan",           min: 0,            emoji: "🌾", bonus: 0,    desc: "Aucune compétence particulière." },
  { id: "ECUYER",     nom: "Écuyer",            min: 50_000,       emoji: "🛡️", bonus: 0.05, desc: "Apprenti aventurier." },
  { id: "AVENTURIER", nom: "Aventurier",        min: 250_000,      emoji: "⚔️", bonus: 0.10, desc: "Aguerri aux embûches." },
  { id: "CHEVALIER",  nom: "Chevalier",         min: 1_000_000,    emoji: "🏇", bonus: 0.15, desc: "Reconnu par la couronne." },
  { id: "CHAMPION",   nom: "Champion du Peuple",min: 5_000_000,    emoji: "🦁", bonus: 0.20, desc: "Légende vivante." },
  { id: "SEIGNEUR",   nom: "Seigneur de Guerre",min: 20_000_000,   emoji: "👑", bonus: 0.25, desc: "Maître d'un fief entier." },
  { id: "ARCHIMAGE",  nom: "Archimage",         min: 100_000_000,  emoji: "🔮", bonus: 0.35, desc: "Maîtrise des arts occultes." },
  { id: "DIEUDEGUERRE",nom:"Dieu de Guerre",    min: 500_000_000,  emoji: "⚡", bonus: 0.50, desc: "Immortel et invincible." },
];

// ══════════════════════════════════════════════════════════════
//  FIEFS (= territoires / secteurs)
// ══════════════════════════════════════════════════════════════
const FIEFS = {
  HAMEAU:   { id: "HAMEAU",   nom: "Hameau des Brumes",    cout: 0,           revenu: 5_000,     risque: 1, protection: 0, emoji: "🏚️" },
  VILLAGE:  { id: "VILLAGE",  nom: "Village du Carrefour", cout: 80_000,      revenu: 20_000,    risque: 2, protection: 0, emoji: "🏘️" },
  FORTERESSE:{ id:"FORTERESSE",nom:"Forteresse Nordique",  cout: 500_000,     revenu: 70_000,    risque: 3, protection: 1, emoji: "🏰" },
  TEMPLE:   { id: "TEMPLE",   nom: "Temple Maudit",        cout: 2_000_000,   revenu: 220_000,   risque: 4, protection: 2, emoji: "⛪" },
  CAVERNES: { id: "CAVERNES", nom: "Cavernes du Dragon",   cout: 8_000_000,   revenu: 650_000,   risque: 3, protection: 3, emoji: "🐉" },
  CITADELLE:{ id: "CITADELLE",nom: "Citadelle du Néant",   cout: 30_000_000,  revenu: 2_500_000, risque: 5, protection: 5, emoji: "🌑" },
};

// ══════════════════════════════════════════════════════════════
//  MARCHANDISES (= ressources / produits)
// ══════════════════════════════════════════════════════════════
const MARCHANDISES = {
  HERBES:    { id: "HERBES",   nom: "Herbes Médicinales",  prixAchat: 500,    prixVente: 1_400,   risque: 1, emoji: "🌿" },
  MINERAI:   { id: "MINERAI",  nom: "Minerai de Fer",      prixAchat: 3_000,  prixVente: 8_500,   risque: 2, emoji: "⛏️" },
  PARCHEMIN: { id: "PARCHEMIN",nom: "Parchemins Anciens",  prixAchat: 2_000,  prixVente: 6_000,   risque: 2, emoji: "📜" },
  POTION:    { id: "POTION",   nom: "Potions Magiques",    prixAchat: 5_000,  prixVente: 14_000,  risque: 3, emoji: "🧪" },
  RUNE:      { id: "RUNE",     nom: "Runes de Pouvoir",    prixAchat: 12_000, prixVente: 36_000,  risque: 3, emoji: "🔯" },
  DRAGONITE: { id: "DRAGONITE",nom: "Écaille de Dragon",   prixAchat: 40_000, prixVente: 120_000, risque: 5, emoji: "🐉" },
};

// ══════════════════════════════════════════════════════════════
//  BÂTIMENTS (= structures / installations)
// ══════════════════════════════════════════════════════════════
const BATIMENTS = {
  AUBERGE:   { id: "AUBERGE",  nom: "Auberge du Voyageur", cout: 10_000,    capacite: 50,  revenuBonus: 0,    emoji: "🍺" },
  FORGE:     { id: "FORGE",    nom: "Forge Runique",        cout: 75_000,    capacite: 0,   revenuBonus: 0.15, emoji: "🔨" },
  ENTREPOT:  { id: "ENTREPOT", nom: "Entrepôt Secret",      cout: 200_000,   capacite: 500, revenuBonus: 0,    emoji: "📦" },
  TAVERNE:   { id: "TAVERNE",  nom: "Taverne des Ombres",   cout: 500_000,   capacite: 0,   revenuBonus: 0.25, emoji: "🍷" },
  GUILDHALL: { id: "GUILDHALL",nom: "Guildhall Mystique",   cout: 2_000_000, capacite: 0,   revenuBonus: 0.40, emoji: "🏛️" },
  TOUR_MAGE: { id: "TOUR_MAGE",nom: "Tour du Grand Mage",   cout: 15_000_000,capacite: 0,   revenuBonus: 0.60, emoji: "🗼" },
};

// ══════════════════════════════════════════════════════════════
//  COMPAGNONS (= alliés / agents)
// ══════════════════════════════════════════════════════════════
const COMPAGNONS = {
  VOLEUR:    { id: "VOLEUR",   nom: "Lirien la Sournoise",  cout: 50_000,    effet: "Réduit risque arrestation -30%",      emoji: "🗡️" },
  GARDE:     { id: "GARDE",    nom: "Ser Brock",             cout: 150_000,   effet: "Cooldown pillage -1h",                emoji: "🛡️" },
  DIPLOMATE: { id: "DIPLOMATE",nom: "Lord Evander",          cout: 500_000,   effet: "Risque fief -2",                      emoji: "🤝" },
  SORCIER:   { id: "SORCIER",  nom: "Zar le Cryptique",      cout: 250_000,   effet: "+30% revenus marché des ombres",      emoji: "🧙" },
  ASSASSIN:  { id: "ASSASSIN", nom: "Ombre-de-Sang",         cout: 1_000_000, effet: "+50% succès attaque de fief",         emoji: "🩸" },
  ORACLE:    { id: "ORACLE",   nom: "La Voyante Aveugle",    cout: 3_000_000, effet: "Immunité totale aux raids 48h",        emoji: "🔮" },
};

// ══════════════════════════════════════════════════════════════
//  QUÊTES (= missions / expéditions)
// ══════════════════════════════════════════════════════════════
const QUETES = [
  { id: "Q01", nom: "Collecte d'herbes sauvages", difficulte: 1, duree: 30,  gain: [2_000,    8_000],    cout: 0,         risque: 10, xp: 5 },
  { id: "Q02", nom: "Pillage de caravane",        difficulte: 2, duree: 60,  gain: [10_000,   40_000],   cout: 2_000,     risque: 20, xp: 15 },
  { id: "Q03", nom: "Assassinat ciblé",           difficulte: 3, duree: 90,  gain: [50_000,   180_000],  cout: 15_000,    risque: 30, xp: 30 },
  { id: "Q04", nom: "Vol du trésor royal",        difficulte: 4, duree: 120, gain: [200_000,  700_000],  cout: 50_000,    risque: 45, xp: 60 },
  { id: "Q05", nom: "Saccage du palais",          difficulte: 5, duree: 180, gain: [800_000,  3_000_000],cout: 200_000,   risque: 60, xp: 120 },
  { id: "Q06", nom: "Renversement du trône",      difficulte: 6, duree: 240, gain: [3_000_000,12_000_000],cout:1_000_000, risque: 75, xp: 300 },
];

// ══════════════════════════════════════════════════════════════
//  PURIFICATION (= blanchiment / recyclage)
//  Convertit l'or maudit en or légitime
// ══════════════════════════════════════════════════════════════
const PURIFICATION = {
  EGLISE:   { id: "EGLISE",  nom: "Offrande à l'Église",   ratio: 0.70, frais: 0.30, delai: "4h", emoji: "⛪" },
  ALCHIMIE: { id: "ALCHIMIE",nom: "Transmutation Alchimique",ratio:0.85, frais: 0.15, delai: "4h", emoji: "⚗️" },
  MARCHE:   { id: "MARCHE",  nom: "Négoce de Foire",        ratio: 0.80, frais: 0.20, delai: "4h", emoji: "🏪" },
  RUNE_MIX: { id: "RUNE_MIX",nom: "Rituel des Runes",       ratio: 0.90, frais: 0.10, delai: "4h", emoji: "🔯" },
  DON_SERF: { id: "DON_SERF",nom: "Don aux Serfs",           ratio: 0.60, frais: 0.40, delai: "4h", emoji: "🌾" },
};

// ══════════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════════
function initUnderworld() {
  return {
    orMaudit:      0,
    orLegit:       0,
    totalPille:    0,
    totalPurifie:  0,
    titre:         "PAYSAN",
    xp:            0,
    niveau:        1,
    honneur:       0,
    fiefs:         ["HAMEAU"],
    batiments:     [],
    inventaire:    {},
    capaciteMax:   50,
    compagnons:    [],
    queteEnCours:      null,
    lastQuete:         null,
    quetesCompletes:   0,
    lastRaid:          null,
    raidsGagnes:       0,
    raidsPerdus:       0,
    lastPurification:  null,
    purificationEnCours: null,
    lastRecolte:       null,
    lastPillage:       null,
    lastDaily:         null,
    transactions:      [],
    achievements:      [],
    evenementActif:    null,
    evenementExpire:   null,
    poursuivi:         false,
    nbArretes:         0,
    coffre:            0,
    dette:             0,
    detteDate:         null,
    scoreCredit:       500,
    guileNiveau:       1,
    multiplicateur:    1.0,
    premium:           false,
    serie:             0,
    lastCoffre:        null,
    lastInteret:       Date.now(),
  };
}

function OR(n)  { return `${Math.floor(n).toLocaleString("fr-FR")} 🪙`; }
function tl(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getTitre(uw) {
  let t = TITRES[0];
  for (const titre of TITRES) {
    if (uw.totalPille >= titre.min) t = titre;
    else break;
  }
  return t;
}

function getRevenuTotal(uw) {
  let total = 0;
  for (const fId of uw.fiefs) {
    const f = FIEFS[fId];
    if (f) total += f.revenu;
  }
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type];
    if (bat && bat.revenuBonus > 0) total += total * bat.revenuBonus;
  }
  const titre = getTitre(uw);
  total += total * titre.bonus;
  if (uw.compagnons.includes("SORCIER")) total += total * 0.30;
  return Math.floor(total);
}

function getCapaciteMax(uw) {
  let cap = 50;
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type];
    if (bat && bat.capacite > 0) cap += bat.capacite;
  }
  return cap;
}

function getQteInventaire(uw) {
  return Object.values(uw.inventaire).reduce((a, b) => a + b, 0);
}

function getValeurPortefeuille(uw) {
  let total = 0;
  for (const fId of uw.fiefs) {
    const f = FIEFS[fId]; if (f) total += f.cout;
  }
  for (const b of uw.batiments) {
    const bat = BATIMENTS[b.type]; if (bat) total += bat.cout;
  }
  for (const [mId, qte] of Object.entries(uw.inventaire)) {
    const m = MARCHANDISES[mId]; if (m) total += m.prixAchat * qte;
  }
  return total;
}

function verifierSucces(uw) {
  const liste = [];
  const add = (id, cond) => { if (!uw.achievements.includes(id) && cond) liste.push(id); };
  add("PREMIER_BUTIN",   uw.quetesCompletes >= 1);
  add("TROIS_FIEFS",     uw.fiefs.length >= 3);
  add("MILLIONNAIRE",    uw.totalPille >= 1_000_000);
  add("MILLIARDAIRE",    uw.totalPille >= 1_000_000_000);
  add("SEIGNEUR_TITRE",  uw.titre === "SEIGNEUR");
  add("DIEU_TITRE",      uw.titre === "DIEUDEGUERRE");
  add("GRAND_PURIFIE",   uw.totalPurifie >= 10_000_000);
  add("CONQUERANT",      uw.raidsGagnes >= 5);
  add("ALLIANCE_MAX",    uw.compagnons.length >= 4);
  add("PREMIER_OR",      uw.totalPille >= 10_000);
  add("NOBLE",           uw.orLegit >= 1_000_000);
  add("GUERRIER_SANG",   uw.raidsGagnes >= 10);
  add("INVINCIBLE",      uw.raidsGagnes >= 20);
  add("LEGENDE_VIVANTE", uw.totalPille >= 1_000_000_000);
  for (const a of liste) uw.achievements.push(a);
  return liste;
}

function addTransaction(uw, type, montant, desc) {
  uw.transactions.push({ type, montant, description: desc, date: Date.now() });
  if (uw.transactions.length > 30) uw.transactions = uw.transactions.slice(-30);
}

function emojiTx(type) {
  const m = {
    depot: "💰", retrait: "💸", coffre_depot: "🔐", coffre_retrait: "🔓",
    dette: "🏦", remboursement: "💳", interet_gain: "📈", interet_charge: "📉",
    daily: "🎁", recolte: "⚔️", achat_fief: "🗺️", construction: "🏗️",
    achat_marche: "🛒", vente_marche: "💸", recrutement: "🤝", purification: "✨",
    quete_succes: "✅", quete_echec: "❌", raid_victoire: "⚔️", raid_defaite: "💀",
  };
  return m[type] || "💼";
}

// ══════════════════════════════════════════════════════════════
//  MODULE PRINCIPAL
// ══════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "underworld",
    aliases: ["guilde", "medieval", "donjon"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "⚔️ Underworld — Construis ton empire médiéval, pille des fiefs, accomplis des quêtes et deviens le Dieu de Guerre!"
    },
    category: "economy",
    guide: {
      fr: "Tapez 'underworld help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "tableau").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.underworld) user.data.underworld = initUnderworld();

    const uw = user.data.underworld;
    const bourse = user.money || 0;

    const titre = getTitre(uw);
    uw.titre = titre.id;

    const save = async () => {
      user.data.underworld = uw;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help":
      case "aide":
        return message.reply(this.afficherAide());

      case "tableau":
      case "stat":
      case "balance":
      case "bal":
        return message.reply(this.afficherTableau(uw, bourse));

      case "depot":
      case "deposit":
      case "dep":
        return this.depot(message, args, uw, user, save, bourse);

      case "retrait":
      case "withdraw":
      case "wd":
        return this.retrait(message, args, uw, user, save);

      case "coffre":
      case "vault":
        return this.coffre(message, args, uw, save);

      case "dette":
      case "loan":
        return this.dette(message, args, uw, save);

      case "rembourser":
      case "repay":
        return this.rembourser(message, args, uw, save);

      case "interet":
      case "interest":
        return this.voirInteret(message, uw);

      case "percevoir":
      case "collect":
        return this.percevoirInteret(message, uw, save);

      case "historique":
      case "history":
        return this.historique(message, uw);

      case "daily":
        return this.daily(message, uw, save);

      case "recolte":
      case "mine":
        return this.recolte(message, uw, save);

      case "fief":
      case "territoire":
        return this.fief(message, args, uw, user, save);

      case "batir":
      case "build":
        return this.batir(message, args, uw, user, save);

      case "marche":
      case "market":
        return this.marche(message);

      case "acheter":
      case "buy":
        return this.acheter(message, args, uw, user, save);

      case "vendre":
      case "sell":
        return this.vendre(message, args, uw, save);

      case "inventaire":
      case "inventory":
      case "inv":
        return this.inventaire(message, uw);

      case "quete":
      case "quest":
        return this.quete(message, args, uw, save);

      case "compagnon":
      case "ally":
        return this.compagnon(message, args, uw, user, save);

      case "purifier":
      case "launder":
        return this.purifier(message, args, uw, save);

      case "raid":
      case "war":
        return this.raid(message, args, uw, user, save);

      case "titre":
      case "rank":
        return this.voirTitre(message, uw);

      case "succes":
      case "achievements":
        return this.succes(message, uw);

      case "classement":
      case "leaderboard":
        return this.classement(message, usersData);

      case "credit":
        return this.creditScore(message, uw);

      case "premium":
        return this.premium(message, args, uw, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'underworld help' pour la liste complète.`));
    }
  },

  // ══════════════════════════════════════════════════════════════
  //  AIDE
  // ══════════════════════════════════════════════════════════════
  afficherAide: function () {
    return `
${fonts.bold("⚔️ UNDERWORLD — GUILDE DES OMBRES")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold("🏆 Le Royaume t'attend, aventurier.")}

${fonts.bold("💰 FINANCES & TRÉSOR")} ${fonts.bold("━━━━━━━━━━━━━")}
⚔️ underworld tableau        — Bilan complet de ton royaume
💰 underworld depot <m>      — Déposer de l'or légitime
💸 underworld retrait <m>    — Retirer de l'or légitime
🔐 underworld coffre [dep/wd] <m> — Coffre-fort sécurisé
🏦 underworld dette <m>      — Emprunter de l'or
💳 underworld rembourser <m> — Rembourser la dette
📈 underworld interet        — Calculer tes intérêts
💵 underworld percevoir      — Récupérer les intérêts
📋 underworld historique     — Registre de transactions
🎁 underworld daily          — Récompense quotidienne

${fonts.bold("🗺️ FIEFS & BÂTIMENTS")} ${fonts.bold("━━━━━━━━━━━━━")}
🏘️ underworld fief list           — Fiefs disponibles
💰 underworld fief buy <ID>       — Conquérir un fief
ℹ️  underworld fief info <ID>      — Détails d'un fief
🏗️ underworld batir list          — Bâtiments disponibles
🔨 underworld batir <TYPE> <FIEF> — Construire

${fonts.bold("🛒 MARCHÉ DES OMBRES")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld marche         — Voir les prix du marché
🛍️ underworld acheter <ID> <q> — Acheter des marchandises
💸 underworld vendre <ID> <q>  — Vendre ton stock
📦 underworld inventaire      — Ton inventaire

${fonts.bold("🎯 QUÊTES")} ${fonts.bold("━━━━━━━━━━━━━")}
📋 underworld quete list        — Quêtes disponibles
🚀 underworld quete start <N°>  — Partir en quête
✅ underworld quete check       — Vérifier avancement
❌ underworld quete cancel      — Abandonner (50% remboursé)

${fonts.bold("⛏️ RÉCOLTE")} ${fonts.bold("━━━━━━━━━━━━━")}
⛏️  underworld recolte          — Percevoir revenus des fiefs (1h)

${fonts.bold("🤝 COMPAGNONS")} ${fonts.bold("━━━━━━━━━━━━━")}
👥 underworld compagnon list    — Compagnons disponibles
🤝 underworld compagnon buy <ID>— Recruter un compagnon

${fonts.bold("⚔️ RAIDS")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld raid stats        — Bilan des raids
⚔️  underworld raid attack <ID>  — Attaquer un fief

${fonts.bold("✨ PURIFICATION")} ${fonts.bold("━━━━━━━━━━━━━")}
📋 underworld purifier list          — Méthodes disponibles
✨  underworld purifier <MET> <mont> — Purifier l'or maudit

${fonts.bold("🏆 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━")}
📊 underworld titre          — Ton titre et progression
🏆 underworld succes         — Succès débloqués
👑 underworld classement     — Top joueurs
📊 underworld credit         — Score de crédit
💎 underworld premium        — Avantages premium

${fonts.bold("⚠️ RÈGLES DU ROYAUME")} ${fonts.bold("━━━━━━━━━━━━━")}
• L'or MAUDIT peut être saisi lors des raids royaux
• Sans purification, l'or maudit est inutilisable
• Les compagnons améliorent tes capacités
• L'honneur débloque les quêtes dangereuses
• Le coffre rapporte 2%/mois et protège du vol
`.trim();
  },

  // ══════════════════════════════════════════════════════════════
  //  TABLEAU DE BORD
  // ══════════════════════════════════════════════════════════════
  afficherTableau: function (uw, bourse) {
    const titre = getTitre(uw);
    const revenu = getRevenuTotal(uw);
    const totalLiquid = bourse + uw.orLegit;
    const totalNet = totalLiquid + uw.orMaudit + uw.coffre;
    const portfolio = getValeurPortefeuille(uw);
    const totalFortune = totalNet + portfolio;
    const invQte = getQteInventaire(uw);
    const capMax = getCapaciteMax(uw);

    let rang = "🔰 Inconnu des Royaumes";
    if      (totalFortune >= 1_000_000_000) rang = "⚡ Dieu de Guerre Suprême";
    else if (totalFortune >= 100_000_000)   rang = "🔮 Archimage Redouté";
    else if (totalFortune >= 10_000_000)    rang = "👑 Seigneur de Guerre";
    else if (totalFortune >= 1_000_000)     rang = "🦁 Champion du Peuple";
    else if (totalFortune >= 100_000)       rang = "🏇 Chevalier Ambitieux";

    let creditNote = "Médiocre"; let creditEmoji = "🔴";
    if      (uw.scoreCredit >= 800) { creditNote = "Excellent";  creditEmoji = "🟢"; }
    else if (uw.scoreCredit >= 700) { creditNote = "Bon";        creditEmoji = "🟢"; }
    else if (uw.scoreCredit >= 600) { creditNote = "Moyen";      creditEmoji = "🟡"; }
    else if (uw.scoreCredit >= 500) { creditNote = "Faible";     creditEmoji = "🟠"; }

    return `
${fonts.bold("⚔️ UNDERWORLD — ROYAUME DES OMBRES")} ${titre.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(rang)} • ${fonts.bold("Niv. " + uw.guileNiveau)}${uw.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━")}
💵 Bourse           : ${fonts.bold(OR(bourse))}
✨ Or légitime      : ${fonts.bold(OR(uw.orLegit))}
💀 Or maudit        : ${fonts.bold(OR(uw.orMaudit))} ⚠️ (à purifier)
🔐 Coffre secret    : ${fonts.bold(OR(uw.coffre))}
├─ ${fonts.bold("Liquidités : " + OR(totalLiquid))}

${fonts.bold("🗺️ EMPIRE MÉDIÉVAL")} ${fonts.bold("━━━━━━━━━━━━━")}
🏰 Fiefs contrôlés  : ${fonts.bold(uw.fiefs.length + " territoires")}
🏗️ Bâtiments        : ${fonts.bold(uw.batiments.length)}
🤝 Compagnons       : ${fonts.bold(uw.compagnons.length)}
📦 Inventaire       : ${fonts.bold(invQte + "/" + capMax + " unités")}
├─ ${fonts.bold("Valeur actifs : " + OR(portfolio))}

${fonts.bold("💎 FORTUNE TOTALE")} ${fonts.bold("━━━━━━━━━━━━━")}
🏆 ${fonts.bold("Patrimoine : " + OR(totalFortune))}
${creditEmoji} Score crédit : ${fonts.bold(uw.scoreCredit + "/850")} (${creditNote})
🎯 Prêt max   : ${fonts.bold(OR(uw.scoreCredit * 2000))}
⚡ Multiplicateur : ${fonts.bold(uw.multiplicateur + "x")}${uw.premium ? " (Premium)" : ""}

${fonts.bold("👤 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━")}
${titre.emoji} Titre    : ${fonts.bold(titre.nom)}
⭐ XP         : ${fonts.bold(uw.xp.toLocaleString("fr-FR"))}
🎯 Honneur    : ${fonts.bold(uw.honneur + "/1000")}
🏆 Succès     : ${fonts.bold(uw.achievements.length + "/50")}
🔥 Série daily: ${fonts.bold(uw.serie + " jours")}
💸 Dette      : ${fonts.bold(uw.dette > 0 ? OR(uw.dette) : "Aucune ✅")}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━")}
⛏️  Récolte   : ${tl(uw.lastRecolte, CD.RECOLTE)    || "✅ Prêt"}
🎯 Quête     : ${uw.queteEnCours ? "⏳ En cours" : tl(uw.lastQuete, CD.QUETE) || "✅ Prêt"}
✨ Purifier  : ${uw.purificationEnCours ? "⏳ En cours" : tl(uw.lastPurification, CD.MARCHE) || "✅ Prêt"}
⚔️  Raid      : ${tl(uw.lastRaid, CD.RAID)           || "✅ Prêt"}
🎁 Daily     : ${tl(uw.lastDaily, CD.DAILY)           || "✅ Prêt"}
${uw.poursuivi ? "🚨 LA GARDE ROYALE EST À VOS TROUSSES !" : "✅ Aucune surveillance"}
`.trim();
  },

  // ══════════════════════════════════════════════════════════════
  //  DÉPÔT / RETRAIT
  // ══════════════════════════════════════════════════════════════
  depot: async function (message, args, uw, user, save, bourse) {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) {
      return message.reply(fonts.bold(`
💰 DÉPÔT D'OR LÉGITIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage : underworld depot <montant>
Exemple : underworld depot 50000

💵 Bourse actuelle : ${OR(bourse)}
✨ Or légitime : ${OR(uw.orLegit)}
      `));
    }
    if (bourse < montant) {
      return message.reply(fonts.bold(`
❌ BOURSE INSUFFISANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bourse    : ${OR(bourse)}
Requis    : ${OR(montant)}
Manque    : ${OR(montant - bourse)}

💡 Accomplis des quêtes ou vends des marchandises!
      `));
    }
    user.money = bourse - montant;
    uw.orLegit += montant;
    addTransaction(uw, "depot", montant, "Dépôt or légitime");
    if (!uw.achievements.includes("PREMIER_DEPOT")) uw.achievements.push("PREMIER_DEPOT");
    await save();
    return message.reply(fonts.bold(`
💰 DÉPÔT RÉUSSI !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Or déposé       : ${OR(montant)}
Or légitime     : ${OR(uw.orLegit)}
Bourse restante : ${OR(user.money)}

✨ Ton or est sécurisé et génère des intérêts!
    `));
  },

  retrait: async function (message, args, uw, user, save) {
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) {
      return message.reply(fonts.bold(`
💸 RETRAIT D'OR LÉGITIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage : underworld retrait <montant>
Or légitime disponible : ${OR(uw.orLegit)}
      `));
    }
    if (uw.orLegit < montant) {
      return message.reply(fonts.bold(`
❌ OR INSUFFISANT
Or légitime : ${OR(uw.orLegit)}
Requis      : ${OR(montant)}
      `));
    }
    uw.orLegit -= montant;
    user.money = (user.money || 0) + montant;
    addTransaction(uw, "retrait", montant, "Retrait or légitime");
    await save();
    return message.reply(fonts.bold(`
💸 RETRAIT RÉUSSI !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Retiré          : ${OR(montant)}
Or légitime     : ${OR(uw.orLegit)}
Nouvelle bourse : ${OR(user.money)}

⚠️ L'or en bourse peut être volé! Utilise le coffre.
    `));
  },

  // ══════════════════════════════════════════════════════════════
  //  COFFRE
  // ══════════════════════════════════════════════════════════════
  coffre: async function (message, args, uw, save) {
    const action = args[1]?.toLowerCase();
    const montant = parseInt(args[2]);
    if (!action || (action !== "dep" && action !== "wd")) {
      return message.reply(fonts.bold(`
🔐 COFFRE SECRET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contenu : ${OR(uw.coffre)}
Or légitime : ${OR(uw.orLegit)}

Usage :
underworld coffre dep <montant>
underworld coffre wd <montant>

💡 Le coffre rapporte 2%/mois et est insaisissable.
      `));
    }
    if (!montant || montant <= 0) return message.reply(fonts.bold("❌ Montant invalide."));
    if (action === "dep") {
      if (uw.orLegit < montant) return message.reply(fonts.bold(`❌ Or légitime insuffisant : ${OR(uw.orLegit)}`));
      uw.orLegit -= montant;
      uw.coffre  += montant;
      addTransaction(uw, "coffre_depot", montant, "Dépôt coffre");
      await save();
      return message.reply(fonts.bold(`🔐 COFFRE — DÉPÔT RÉUSSI!\n${OR(montant)} sécurisés.\nCoffre : ${OR(uw.coffre)}`));
    } else {
      if (uw.coffre < montant) return message.reply(fonts.bold(`❌ Coffre insuffisant : ${OR(uw.coffre)}`));
      uw.coffre  -= montant;
      uw.orLegit += montant;
      addTransaction(uw, "coffre_retrait", montant, "Retrait coffre");
      await save();
      return message.reply(fonts.bold(`🔓 COFFRE — RETRAIT RÉUSSI!\n${OR(montant)} transférés en or légitime.`));
    }
  },

  // ══════════════════════════════════════════════════════════════
  //  DETTE / REMBOURSEMENT
  // ══════════════════════════════════════════════════════════════
  dette: async function (message, args, uw, save) {
    const montant = parseInt(args[1]);
    const maxDette = Math.floor(uw.scoreCredit * 2000);
    if (!montant || montant <= 0) {
      return message.reply(fonts.bold(`
🏦 PRÊT DU PRÊTEUR SUR GAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score crédit : ${uw.scoreCredit}/850
Maximum empruntable : ${OR(maxDette)}
Taux : 8%/semaine
Dette actuelle : ${uw.dette > 0 ? OR(uw.dette) : "Aucune"}

Usage : underworld dette <montant>
Exemple : underworld dette 100000
      `));
    }
    if (uw.dette > 0) return message.reply(fonts.bold(`❌ Tu as déjà une dette de ${OR(uw.dette)}. Rembourse d'abord!`));
    if (montant > maxDette) return message.reply(fonts.bold(`❌ Maximum autorisé : ${OR(maxDette)} (score: ${uw.scoreCredit})`));
    if (montant < 10_000) return message.reply(fonts.bold("❌ Minimum d'emprunt : 10 000 🪙"));
    uw.orLegit  += montant;
    uw.dette     = montant;
    uw.detteDate = new Date();
    addTransaction(uw, "dette", montant, "Prêt approuvé");
    await save();
    return message.reply(fonts.bold(`
✅ PRÊT ACCORDÉ !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Montant : ${OR(montant)}
Taux    : 8%/semaine
Or légitime : ${OR(uw.orLegit)}

💡 Rembourse vite pour améliorer ton score de crédit!
    `));
  },

  rembourser: async function (message, args, uw, save) {
    if (uw.dette <= 0) return message.reply(fonts.bold("❌ Tu n'as aucune dette active."));
    const montant = parseInt(args[1]);
    if (!montant || montant <= 0) {
      return message.reply(fonts.bold(`
💳 REMBOURSEMENT DE DETTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dette restante : ${OR(uw.dette)}
Or légitime : ${OR(uw.orLegit)}

Usage : underworld rembourser <montant>
      `));
    }
    if (uw.orLegit < montant) return message.reply(fonts.bold(`❌ Or insuffisant. Disponible : ${OR(uw.orLegit)}`));
    const repay = Math.min(montant, uw.dette);
    uw.orLegit -= repay;
    uw.dette   -= repay;
    if (uw.dette <= 0) {
      uw.detteDate = null;
      uw.scoreCredit = Math.min(850, uw.scoreCredit + 15);
    }
    addTransaction(uw, "remboursement", repay, "Remboursement dette");
    await save();
    if (uw.dette <= 0)
      return message.reply(fonts.bold(`✅ DETTE REMBOURSÉE INTÉGRALEMENT!\n🎉 Score crédit amélioré! Nouveau score : ${uw.scoreCredit}/850`));
    return message.reply(fonts.bold(`💳 Remboursé : ${OR(repay)}\nDette restante : ${OR(uw.dette)}`));
  },

  // ══════════════════════════════════════════════════════════════
  //  INTÉRÊTS
  // ══════════════════════════════════════════════════════════════
  voirInteret: function (message, uw) {
    const elapsed = (Date.now() - (uw.lastInteret || Date.now())) / 3_600_000;
    const gainCoffre = Math.floor(uw.coffre  * (0.02 / 720) * elapsed);
    const chargeDette = uw.dette > 0 ? Math.floor(uw.dette * (0.08 / 168) * elapsed) : 0;
    return message.reply(fonts.bold(`
📈 INTÉRÊTS EN COURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Coffre : ${OR(uw.coffre)} @ 2%/mois
📈 Gain coffre  : +${OR(gainCoffre)}
💸 Dette  : ${uw.dette > 0 ? OR(uw.dette) : "Aucune"} @ 8%/sem
📉 Charge dette : -${OR(chargeDette)}

Utilisez 'underworld percevoir' pour encaisser.
    `));
  },

  percevoirInteret: async function (message, uw, save) {
    const now = Date.now();
    const elapsed = (now - (uw.lastInteret || now)) / 3_600_000;
    if (elapsed < 1) return message.reply(fonts.bold(`⏳ Trop tôt! Revenez dans ${Math.ceil(60 - elapsed * 60)} min.`));
    const gainCoffre = Math.floor(uw.coffre * (0.02 / 720) * elapsed);
    const chargeDette = uw.dette > 0 ? Math.floor(uw.dette * (0.08 / 168) * elapsed) : 0;
    uw.orLegit   += gainCoffre;
    if (uw.dette > 0) uw.dette += chargeDette;
    uw.lastInteret = now;
    if (gainCoffre > 0) addTransaction(uw, "interet_gain", gainCoffre, "Intérêts coffre");
    if (chargeDette > 0) addTransaction(uw, "interet_charge", -chargeDette, "Intérêts dette");
    await save();
    return message.reply(fonts.bold(`
💰 INTÉRÊTS PERÇUS !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

+${OR(gainCoffre)} (coffre)${chargeDette > 0 ? `\n-${OR(chargeDette)} (dette)` : ""}
Or légitime : ${OR(uw.orLegit)}
    `));
  },

  // ══════════════════════════════════════════════════════════════
  //  DAILY
  // ══════════════════════════════════════════════════════════════
  daily: async function (message, uw, save) {
    const reste = tl(uw.lastDaily, CD.DAILY);
    if (reste) return message.reply(fonts.bold(`⏳ Tu as déjà prélevé ta récompense! Reviens dans ${reste}.`));
    uw.serie = (uw.lastDaily && Date.now() - uw.lastDaily < 48 * 3_600_000) ? uw.serie + 1 : 1;
    const base  = 10_000 + uw.guileNiveau * 2_000;
    const bonus = Math.floor(base * (uw.serie > 1 ? Math.min(uw.serie * 0.1, 1.0) : 0));
    const total = base + bonus;
    uw.orLegit    += total;
    uw.totalPille += total;
    uw.lastDaily   = Date.now();
    addTransaction(uw, "daily", total, `Récompense daily J${uw.serie}`);
    await save();
    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Or de base      : ${OR(base)}
Bonus série (${uw.serie}j) : +${OR(bonus)}
💎 Total        : ${OR(total)}

🔥 Série actuelle : ${uw.serie} jours consécutifs!
    `));
  },

  // ══════════════════════════════════════════════════════════════
  //  RÉCOLTE (revenus des fiefs)
  // ══════════════════════════════════════════════════════════════
  recolte: async function (message, uw, save) {
    const reste = tl(uw.lastRecolte, CD.RECOLTE);
    if (reste) return message.reply(fonts.bold(`⏳ Tes collecteurs sont en route! Reviens dans ${reste}.`));
    const revenu = getRevenuTotal(uw);
    if (revenu <= 0) return message.reply(fonts.bold("❌ Aucun fief actif. Conquiers des territoires d'abord!"));
    uw.orMaudit    += revenu;
    uw.totalPille  += revenu;
    uw.lastRecolte  = Date.now();
    addTransaction(uw, "recolte", revenu, "Récolte territoriale");
    const nouveauxSucces = verifierSucces(uw);
    await save();
    let msg = `
⛏️ RÉCOLTE EFFECTUÉE !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Or maudit perçu : +${OR(revenu)}
Total or maudit : ${OR(uw.orMaudit)}

⚠️ Cet or est MAUDIT! Purifiez-le pour l'utiliser.
Commande : underworld purifier
    `;
    if (nouveauxSucces.length > 0) msg += `\n🏆 Nouveaux succès : ${nouveauxSucces.join(", ")}`;
    return message.reply(fonts.bold(msg));
  },

  // ══════════════════════════════════════════════════════════════
  //  FIEFS
  // ══════════════════════════════════════════════════════════════
  fief: async function (message, args, uw, user, save) {
    const action   = args[1]?.toLowerCase();
    const targetId = args[2]?.toUpperCase();

    if (!action || action === "list") {
      let txt = `${fonts.bold("🗺️ FIEFS DU ROYAUME")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      for (const [id, f] of Object.entries(FIEFS)) {
        const possede = uw.fiefs.includes(id);
        txt += `${f.emoji} ${fonts.bold(f.nom)} [${id}]${possede ? " ✅" : ""}\n`;
        txt += `   💰 Coût : ${f.cout > 0 ? OR(f.cout) : "Gratuit"} | 📈 Revenu : ${OR(f.revenu)}/h\n`;
        txt += `   ⚠️ Risque : ${"★".repeat(f.risque)} | 🛡️ Protection : ${f.protection}/5\n\n`;
      }
      txt += `Tes fiefs : ${uw.fiefs.join(", ")}\nConquérir : underworld fief buy <ID>`;
      return message.reply(fonts.bold(txt));
    }

    if (action === "buy") {
      if (!targetId || !FIEFS[targetId]) return message.reply(fonts.bold("❌ ID de fief invalide."));
      if (uw.fiefs.includes(targetId)) return message.reply(fonts.bold("❌ Fief déjà sous ton contrôle."));
      const f = FIEFS[targetId];
      if (f.cout > 0 && uw.orLegit < f.cout)
        return message.reply(fonts.bold(`❌ Or insuffisant.\nRequis : ${OR(f.cout)}\nOr légitime : ${OR(uw.orLegit)}`));
      uw.orLegit -= f.cout;
      uw.fiefs.push(targetId);
      uw.honneur += f.risque * 20;
      addTransaction(uw, "achat_fief", -f.cout, `Acquisition : ${f.nom}`);
      const nouveauxSucces = verifierSucces(uw);
      await save();
      let msg = `🗺️ FIEF CONQUIS !\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${f.emoji} ${f.nom}\n💰 Coût : ${OR(f.cout)}\n📈 Revenu : +${OR(f.revenu)}/h\n🎯 Honneur : +${f.risque * 20}`;
      if (nouveauxSucces.length > 0) msg += `\n🏆 Succès : ${nouveauxSucces.join(", ")}`;
      return message.reply(fonts.bold(msg));
    }

    if (action === "info") {
      if (!targetId || !FIEFS[targetId]) return message.reply(fonts.bold("❌ ID invalide."));
      const f = FIEFS[targetId];
      return message.reply(fonts.bold(`${f.emoji} ${f.nom}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💰 Coût : ${OR(f.cout)}\n📈 Revenu : ${OR(f.revenu)}/h\n⚠️ Risque : ${"★".repeat(f.risque)}\n🛡️ Protection : ${f.protection}/5\nStatut : ${uw.fiefs.includes(targetId) ? "✅ Contrôlé" : "❌ Non contrôlé"}`));
    }

    return message.reply(fonts.bold("❓ Usage : underworld fief [list|buy|info] [ID]"));
  },

  // ══════════════════════════════════════════════════════════════
  //  BÂTIMENTS
  // ══════════════════════════════════════════════════════════════
  batir: async function (message, args, uw, user, save) {
    const type     = args[1]?.toUpperCase();
    const fiefId   = args[2]?.toUpperCase();

    if (!type || type === "LIST") {
      let txt = `${fonts.bold("🏗️ BÂTIMENTS DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      for (const [id, b] of Object.entries(BATIMENTS)) {
        const possede = uw.batiments.find(x => x.type === id);
        txt += `${b.emoji} ${fonts.bold(b.nom)} [${id}]${possede ? " ✅" : ""}\n   💰 ${OR(b.cout)}`;
        if (b.capacite > 0) txt += ` | 📦 +${b.capacite} capacité`;
        if (b.revenuBonus > 0) txt += ` | 📈 +${Math.round(b.revenuBonus * 100)}% revenus`;
        txt += "\n\n";
      }
      txt += "Construire : underworld batir <TYPE> <FIEF_ID>";
      return message.reply(fonts.bold(txt));
    }

    if (!BATIMENTS[type]) return message.reply(fonts.bold("❌ Type invalide. Utilise 'underworld batir list'."));
    if (!fiefId || !uw.fiefs.includes(fiefId)) return message.reply(fonts.bold("❌ Fief non contrôlé ou invalide."));
    const b = BATIMENTS[type];
    if (uw.orLegit < b.cout) return message.reply(fonts.bold(`❌ Or insuffisant.\nRequis : ${OR(b.cout)}\nDisponible : ${OR(uw.orLegit)}`));
    uw.orLegit -= b.cout;
    uw.batiments.push({ type, fief: fiefId, date: Date.now() });
    addTransaction(uw, "construction", -b.cout, `Construction : ${b.nom}`);
    await save();
    return message.reply(fonts.bold(`🏗️ CONSTRUCTION RÉUSSIE !\n${b.emoji} ${b.nom} construite dans ${FIEFS[fiefId]?.nom || fiefId}.\nCoût : ${OR(b.cout)}\nOr restant : ${OR(uw.orLegit)}`));
  },

  // ══════════════════════════════════════════════════════════════
  //  MARCHÉ DES OMBRES
  // ══════════════════════════════════════════════════════════════
  marche: function (message) {
    let txt = `${fonts.bold("🛒 MARCHÉ DES OMBRES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, m] of Object.entries(MARCHANDISES)) {
      txt += `${m.emoji} ${fonts.bold(m.nom)} [${id}]\n   Achat : ${OR(m.prixAchat)} | Vente : ${OR(m.prixVente)} | Risque : ${"★".repeat(m.risque)}\n\n`;
    }
    txt += "Acheter : underworld acheter <ID> <quantité>\nVendre  : underworld vendre <ID> <quantité>";
    return message.reply(fonts.bold(txt));
  },

  acheter: async function (message, args, uw, user, save) {
    const marcId = args[1]?.toUpperCase();
    const qte    = parseInt(args[2]);
    if (!marcId || !MARCHANDISES[marcId] || !qte || qte <= 0)
      return message.reply(fonts.bold("❌ Usage : underworld acheter <ID> <quantité>\nEx : underworld acheter POTION 5"));
    const m = MARCHANDISES[marcId];
    const total = m.prixAchat * qte;
    const invQte = getQteInventaire(uw);
    const cap = getCapaciteMax(uw);
    if (invQte + qte > cap) return message.reply(fonts.bold(`❌ Capacité max atteinte (${cap} unités). Vends d'abord!`));
    if (uw.orLegit < total) return message.reply(fonts.bold(`❌ Or insuffisant.\nRequis : ${OR(total)}\nDisponible : ${OR(uw.orLegit)}`));
    uw.orLegit -= total;
    uw.inventaire[marcId] = (uw.inventaire[marcId] || 0) + qte;
    addTransaction(uw, "achat_marche", -total, `Achat ${qte}x ${m.nom}`);
    await save();
    return message.reply(fonts.bold(`🛒 ACHAT RÉUSSI !\n${m.emoji} ${qte}x ${m.nom}\nCoût : ${OR(total)}\nOr restant : ${OR(uw.orLegit)}\nStock : ${uw.inventaire[marcId]} unités`));
  },

  vendre: async function (message, args, uw, save) {
    const marcId = args[1]?.toUpperCase();
    const qte    = parseInt(args[2]);
    if (!marcId || !MARCHANDISES[marcId] || !qte || qte <= 0)
      return message.reply(fonts.bold("❌ Usage : underworld vendre <ID> <quantité>\nEx : underworld vendre POTION 3"));
    const m = MARCHANDISES[marcId];
    const stock = uw.inventaire[marcId] || 0;
    if (stock < qte) return message.reply(fonts.bold(`❌ Stock insuffisant : ${stock} unités disponibles.`));
    const gain = m.prixVente * qte;
    uw.inventaire[marcId] -= qte;
    if (uw.inventaire[marcId] <= 0) delete uw.inventaire[marcId];
    uw.orMaudit   += gain;
    uw.totalPille += gain;
    addTransaction(uw, "vente_marche", gain, `Vente ${qte}x ${m.nom}`);
    await save();
    return message.reply(fonts.bold(`💸 VENTE RÉUSSIE !\n${m.emoji} ${qte}x ${m.nom}\nGain : +${OR(gain)} (or maudit)\n\n⚠️ Purifiez cet or pour l'utiliser! underworld purifier`));
  },

  inventaire: function (message, uw) {
    const items = Object.entries(uw.inventaire);
    if (items.length === 0) return message.reply(fonts.bold("📦 Inventaire vide. Achetez des marchandises!"));
    let txt = `${fonts.bold("📦 INVENTAIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    let totalVal = 0;
    for (const [id, qte] of items) {
      const m = MARCHANDISES[id]; if (!m) continue;
      const val = m.prixVente * qte;
      totalVal += val;
      txt += `${m.emoji} ${m.nom} : ${qte} unités (valeur : ${OR(val)})\n`;
    }
    txt += `\n📊 Valeur totale : ${OR(totalVal)}\n📦 Capacité : ${getQteInventaire(uw)}/${getCapaciteMax(uw)}`;
    return message.reply(fonts.bold(txt));
  },

  // ══════════════════════════════════════════════════════════════
  //  QUÊTES
  // ══════════════════════════════════════════════════════════════
  quete: async function (message, args, uw, save) {
    const action = args[1]?.toLowerCase();

    if (!action || action === "list") {
      let txt = `${fonts.bold("🎯 QUÊTES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      QUETES.forEach((q, i) => {
        txt += `${fonts.bold(`[${i + 1}]`)} ${q.nom}\n   Difficulté : ${"★".repeat(q.difficulte)} | Durée : ${q.duree}min\n   Gain : ${OR(q.gain[0])} → ${OR(q.gain[1])} | Coût : ${OR(q.cout)}\n   Risque : ${q.risque}% | XP : +${q.xp}\n\n`;
      });
      return message.reply(fonts.bold(txt + "Lancer : underworld quete start <N°>"));
    }

    if (action === "start") {
      if (uw.queteEnCours) return message.reply(fonts.bold("⏳ Tu es déjà en quête! Vérifie avec 'underworld quete check'."));
      const reste = tl(uw.lastQuete, CD.QUETE);
      if (reste) return message.reply(fonts.bold(`⏳ Cooldown! Reviens dans ${reste}.`));
      const n = parseInt(args[2]) - 1;
      if (isNaN(n) || !QUETES[n]) return message.reply(fonts.bold("❌ Numéro de quête invalide."));
      const q = QUETES[n];
      if (uw.honneur < q.difficulte * 100) return message.reply(fonts.bold(`❌ Honneur insuffisant (${uw.honneur}/${q.difficulte * 100}).`));
      if (q.cout > 0 && uw.orLegit < q.cout) return message.reply(fonts.bold(`❌ Coût requis : ${OR(q.cout)}. Tu as : ${OR(uw.orLegit)}`));
      if (q.cout > 0) uw.orLegit -= q.cout;
      uw.queteEnCours = { id: q.id, startTime: Date.now(), duration: q.duree * 60_000, cout: q.cout };
      await save();
      return message.reply(fonts.bold(`🚀 QUÊTE LANCÉE !\n⚔️ ${q.nom}\nDurée : ${q.duree} minutes\nGain potentiel : ${OR(q.gain[0])} — ${OR(q.gain[1])}\n\nVérifie avec 'underworld quete check'.`));
    }

    if (action === "check") {
      if (!uw.queteEnCours) return message.reply(fonts.bold("❌ Aucune quête en cours."));
      const { id, startTime, duration } = uw.queteEnCours;
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const restant = Math.ceil((duration - elapsed) / 60_000);
        return message.reply(fonts.bold(`⏳ Quête en cours!\nTemps restant : ${restant} minutes.`));
      }
      const q = QUETES.find(x => x.id === id);
      if (!q) { uw.queteEnCours = null; await save(); return message.reply(fonts.bold("❌ Erreur de quête.")); }
      const succes = Math.random() < Math.max(0.3, 1 - q.risque / 100);
      uw.queteEnCours = null;
      uw.lastQuete = Date.now();
      if (succes) {
        const gain = rand(q.gain[0], q.gain[1]);
        uw.orMaudit += gain;
        uw.totalPille += gain;
        uw.xp += q.xp;
        uw.honneur = Math.min(1000, uw.honneur + q.difficulte * 15);
        uw.quetesCompletes++;
        addTransaction(uw, "quete_succes", gain, `Succès : ${q.nom}`);
        const nouveauxSucces = verifierSucces(uw);
        await save();
        let msg = `✅ QUÊTE ACCOMPLIE !\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚔️ ${q.nom}\n💰 Butin : +${OR(gain)} (or maudit)\n⭐ XP : +${q.xp}\n🎯 Honneur : +${q.difficulte * 15}`;
        if (nouveauxSucces.length > 0) msg += `\n🏆 Succès : ${nouveauxSucces.join(", ")}`;
        return message.reply(fonts.bold(msg));
      } else {
        addTransaction(uw, "quete_echec", 0, `Échec : ${q.nom}`);
        await save();
        return message.reply(fonts.bold(`❌ QUÊTE ÉCHOUÉE !\n⚔️ ${q.nom}\nTu es revenu les mains vides...\n\n💡 Recrute des compagnons pour améliorer tes chances!`));
      }
    }

    if (action === "cancel") {
      if (!uw.queteEnCours) return message.reply(fonts.bold("❌ Aucune quête en cours."));
      const remboursement = Math.floor((uw.queteEnCours.cout || 0) * 0.5);
      uw.orLegit += remboursement;
      uw.queteEnCours = null;
      uw.lastQuete = Date.now();
      await save();
      return message.reply(fonts.bold(`❌ Quête abandonnée.\nRemboursement 50% : +${OR(remboursement)}`));
    }

    return message.reply(fonts.bold("❓ Usage : underworld quete [list|start|check|cancel]"));
  },

  // ══════════════════════════════════════════════════════════════
  //  COMPAGNONS
  // ══════════════════════════════════════════════════════════════
  compagnon: async function (message, args, uw, user, save) {
    const action = args[1]?.toLowerCase();
    const compId = args[2]?.toUpperCase();

    if (!action || action === "list") {
      let txt = `${fonts.bold("🤝 COMPAGNONS DE GUILDE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      for (const [id, c] of Object.entries(COMPAGNONS)) {
        const possede = uw.compagnons.includes(id);
        txt += `${c.emoji} ${fonts.bold(c.nom)} [${id}]${possede ? " ✅ Recruté" : ""}\n   Coût : ${OR(c.cout)}\n   Effet : ${c.effet}\n\n`;
      }
      return message.reply(fonts.bold(txt + "Recruter : underworld compagnon buy <ID>"));
    }

    if (action === "buy") {
      if (!compId || !COMPAGNONS[compId]) return message.reply(fonts.bold("❌ ID de compagnon invalide."));
      if (uw.compagnons.includes(compId)) return message.reply(fonts.bold("❌ Compagnon déjà dans ta guilde."));
      const c = COMPAGNONS[compId];
      if (uw.orLegit < c.cout) return message.reply(fonts.bold(`❌ Or insuffisant. Requis : ${OR(c.cout)}`));
      uw.orLegit -= c.cout;
      uw.compagnons.push(compId);
      addTransaction(uw, "recrutement", -c.cout, `Recrutement : ${c.nom}`);
      const nouveauxSucces = verifierSucces(uw);
      await save();
      let msg = `🤝 COMPAGNON RECRUTÉ !\n${c.emoji} ${c.nom}\nCoût : ${OR(c.cout)}\nEffet actif : ${c.effet}`;
      if (nouveauxSucces.length > 0) msg += `\n🏆 Succès : ${nouveauxSucces.join(", ")}`;
      return message.reply(fonts.bold(msg));
    }

    return message.reply(fonts.bold("❓ Usage : underworld compagnon [list|buy] [ID]"));
  },

  // ══════════════════════════════════════════════════════════════
  //  PURIFICATION (≈ blanchiment / recyclage)
  // ══════════════════════════════════════════════════════════════
  purifier: async function (message, args, uw, save) {
    const action = args[1]?.toLowerCase();

    if (!action || action === "list") {
      let txt = `${fonts.bold("✨ PURIFICATION D'OR MAUDIT")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      for (const [id, p] of Object.entries(PURIFICATION)) {
        txt += `${p.emoji} ${fonts.bold(p.nom)} [${id}]\n   Récupération : ${Math.round(p.ratio * 100)}% | Frais : ${Math.round(p.frais * 100)}%\n\n`;
      }
      txt += `Or maudit disponible : ${OR(uw.orMaudit)}\nUsage : underworld purifier <METHODE> <montant>`;
      return message.reply(fonts.bold(txt));
    }

    // Si purification en cours, tenter de récupérer
    if (uw.purificationEnCours) {
      const { methode, montant, heure } = uw.purificationEnCours;
      const restant = tl(heure, 4 * 60 * 60 * 1000);
      if (restant) return message.reply(fonts.bold(`⏳ Purification en cours!\nTemps restant : ${restant}\nRelance la commande quand c'est fini.`));
      const p = PURIFICATION[methode];
      const gained = Math.floor(montant * p.ratio);
      uw.orLegit += gained;
      uw.totalPurifie += gained;
      uw.purificationEnCours = null;
      addTransaction(uw, "purification", gained, `Purification : ${p.nom}`);
      const nouveauxSucces = verifierSucces(uw);
      await save();
      let msg = `✨ PURIFICATION TERMINÉE !\n${p.emoji} ${p.nom}\nOr récupéré : +${OR(gained)}\nOr légitime total : ${OR(uw.orLegit)}`;
      if (nouveauxSucces.length > 0) msg += `\n🏆 Succès : ${nouveauxSucces.join(", ")}`;
      return message.reply(fonts.bold(msg));
    }

    const methodeId = action.toUpperCase();
    const montant   = parseInt(args[2]);
    if (!PURIFICATION[methodeId]) return message.reply(fonts.bold("❌ Méthode invalide. Utilise 'underworld purifier list'."));
    if (!montant || montant <= 0) return message.reply(fonts.bold("❌ Montant invalide."));
    if (uw.orMaudit < montant) return message.reply(fonts.bold(`❌ Or maudit insuffisant : ${OR(uw.orMaudit)}`));
    if (montant < 5_000) return message.reply(fonts.bold("❌ Minimum de purification : 5 000 🪙"));
    uw.orMaudit -= montant;
    uw.lastPurification = Date.now();
    uw.purificationEnCours = { methode: methodeId, montant, heure: Date.now() };
    await save();
    const p = PURIFICATION[methodeId];
    return message.reply(fonts.bold(`✨ PURIFICATION LANCÉE !\n${p.emoji} ${p.nom}\nMontant : ${OR(montant)}\nGain attendu : ~${OR(Math.floor(montant * p.ratio))}\nDurée : ${p.delai}\n\nRelance 'underworld purifier' dans 4h pour récupérer.`));
  },

  // ══════════════════════════════════════════════════════════════
  //  RAIDS
  // ══════════════════════════════════════════════════════════════
  raid: async function (message, args, uw, user, save) {
    const action   = args[1]?.toLowerCase();
    const targetId = args[2]?.toUpperCase();

    if (!action || action === "stats") {
      return message.reply(fonts.bold(`
⚔️ BILAN DES RAIDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Victoires  : ${uw.raidsGagnes}
💀 Défaites   : ${uw.raidsPerdus}
📊 Ratio      : ${uw.raidsGagnes + uw.raidsPerdus > 0 ? Math.round((uw.raidsGagnes / (uw.raidsGagnes + uw.raidsPerdus)) * 100) : 0}%
⏳ Prochain raid : ${tl(uw.lastRaid, CD.RAID) || "✅ Prêt"}
      `));
    }

    if (action === "attack") {
      const reste = tl(uw.lastRaid, CD.RAID);
      if (reste) return message.reply(fonts.bold(`⏳ Tes troupes se reposent! Reviens dans ${reste}.`));
      if (!targetId || !FIEFS[targetId]) return message.reply(fonts.bold("❌ ID de fief invalide."));
      if (uw.fiefs.includes(targetId)) return message.reply(fonts.bold("❌ Ce fief t'appartient déjà."));
      const f = FIEFS[targetId];
      const coutRaid = Math.floor(f.cout * 0.30) || 30_000;
      if (uw.orLegit < coutRaid) return message.reply(fonts.bold(`❌ Or de guerre insuffisant.\nRequis : ${OR(coutRaid)}\nDisponible : ${OR(uw.orLegit)}`));
      uw.orLegit -= coutRaid;
      const aAssassin = uw.compagnons.includes("ASSASSIN");
      const baseChance = Math.min(0.85, 0.5 + uw.raidsGagnes * 0.02 + (aAssassin ? 0.50 : 0));
      const succes = Math.random() < baseChance;
      uw.lastRaid = Date.now();
      if (succes) {
        uw.fiefs.push(targetId);
        uw.raidsGagnes++;
        uw.xp += 500;
        uw.honneur = Math.min(1000, uw.honneur + f.risque * 30);
        addTransaction(uw, "raid_victoire", f.revenu, `Fief conquis : ${f.nom}`);
        const nouveauxSucces = verifierSucces(uw);
        await save();
        let msg = `⚔️ VICTOIRE DE RAID !\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${f.emoji} ${f.nom} est à toi!\nRevenu ajouté : +${OR(f.revenu)}/h\nCoût du raid : ${OR(coutRaid)}\n⭐ XP : +500 | 🎯 Honneur : +${f.risque * 30}`;
        if (nouveauxSucces.length > 0) msg += `\n🏆 Succès : ${nouveauxSucces.join(", ")}`;
        return message.reply(fonts.bold(msg));
      } else {
        const perte = Math.floor(uw.orMaudit * 0.10);
        uw.orMaudit = Math.max(0, uw.orMaudit - perte);
        uw.raidsPerdus++;
        addTransaction(uw, "raid_defaite", -(perte + coutRaid), `Défaite sur : ${f.nom}`);
        await save();
        return message.reply(fonts.bold(`💀 RAID ÉCHOUÉ !\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nL'assaut sur ${f.emoji} ${f.nom} a échoué.\n💰 Or maudit perdu : ${OR(perte)}\n💰 Coût raid perdu : ${OR(coutRaid)}\n\n💡 Recrute l'Assassin pour +50% de succès.`));
      }
    }

    return message.reply(fonts.bold("❓ Usage : underworld raid [stats|attack] <FIEF_ID>"));
  },

  // ══════════════════════════════════════════════════════════════
  //  TITRE
  // ══════════════════════════════════════════════════════════════
  voirTitre: function (message, uw) {
    const titre = getTitre(uw);
    const idx   = TITRES.findIndex(t => t.id === titre.id);
    const next  = TITRES[idx + 1];
    let txt = `${fonts.bold("🏆 TON TITRE DE NOBLESSE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${titre.emoji} ${fonts.bold(titre.nom)}\n${titre.desc}\n💰 Total pillé : ${OR(uw.totalPille)}\n📈 Bonus revenus : +${Math.round(titre.bonus * 100)}%\n\n`;
    if (next) {
      const prog = Math.min(100, Math.floor((uw.totalPille / next.min) * 100));
      txt += `${fonts.bold("⬆️ Prochain titre :")} ${next.emoji} ${next.nom}\n📊 Progression : ${prog}% (${OR(uw.totalPille)} / ${OR(next.min)})\nManque : ${OR(Math.max(0, next.min - uw.totalPille))}`;
    } else {
      txt += `⚡ Tu as atteint le titre suprême : ${fonts.bold("DIEU DE GUERRE")}!`;
    }
    return message.reply(fonts.bold(txt));
  },

  // ══════════════════════════════════════════════════════════════
  //  SUCCÈS
  // ══════════════════════════════════════════════════════════════
  succes: function (message, uw) {
    const all = ["PREMIER_DEPOT","PREMIER_BUTIN","TROIS_FIEFS","MILLIONNAIRE","MILLIARDAIRE",
                 "SEIGNEUR_TITRE","DIEU_TITRE","GRAND_PURIFIE","CONQUERANT","ALLIANCE_MAX",
                 "PREMIER_OR","NOBLE","GUERRIER_SANG","INVINCIBLE","LEGENDE_VIVANTE"];
    let txt = `${fonts.bold("🏆 SUCCÈS DE GUILDE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nProgression : ${uw.achievements.length}/${all.length}\n\n`;
    if (uw.achievements.length === 0) {
      txt += "🎯 Aucun succès débloqué. Commence à piller!\n\n";
    } else {
      txt += `${fonts.bold("🎖️ DÉBLOQUÉS :")}\n`;
      uw.achievements.slice(0, 10).forEach((a, i) => { txt += `${i + 1}. 🏆 ${a}\n`; });
      if (uw.achievements.length > 10) txt += `... et ${uw.achievements.length - 10} de plus!\n`;
      txt += "\n";
    }
    const restants = all.filter(a => !uw.achievements.includes(a));
    txt += `${fonts.bold("🎯 À DÉBLOQUER :")}\n`;
    restants.slice(0, 5).forEach(a => { txt += `• ${a}\n`; });
    return message.reply(fonts.bold(txt));
  },

  // ══════════════════════════════════════════════════════════════
  //  CLASSEMENT
  // ══════════════════════════════════════════════════════════════
  classement: async function (message, usersData) {
    try {
      const all = await usersData.getAll();
      const liste = [];
      for (const [uid, user] of Object.entries(all)) {
        const uw = user.data?.underworld;
        if (uw && (uw.orLegit > 0 || uw.orMaudit > 0 || uw.coffre > 0)) {
          const fortune = (uw.orLegit || 0) + (uw.orMaudit || 0) + (uw.coffre || 0);
          liste.push({ uid, fortune, titre: uw.titre || "PAYSAN", achievements: uw.achievements?.length || 0, name: user.name || `Aventurier ${uid}` });
        }
      }
      liste.sort((a, b) => b.fortune - a.fortune);
      const top10 = liste.slice(0, 10);
      let txt = `${fonts.bold("👑 CLASSEMENT DU ROYAUME")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚔️ ${fonts.bold("TOP 10 AVENTURIERS")} ⚔️\n\n`;
      if (top10.length === 0) {
        txt += "📊 Aucun aventurier répertorié. Sois le premier!";
      } else {
        top10.forEach((u, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
          txt += `${medal} ${fonts.bold(u.name)}\n   💰 ${OR(u.fortune)} | 🏆 ${u.achievements} succès\n\n`;
        });
      }
      return message.reply(fonts.bold(txt));
    } catch (e) {
      return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
    }
  },

  // ══════════════════════════════════════════════════════════════
  //  CREDIT SCORE
  // ══════════════════════════════════════════════════════════════
  creditScore: function (message, uw) {
    const score = uw.scoreCredit;
    return message.reply(fonts.bold(`
📊 RÉPUTATION AUPRÈS DES PRÊTEURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 Score      : ${score}/850
💎 Prêt max   : ${OR(score * 2000)}
🏦 Taux       : ${score >= 750 ? "5%" : score >= 650 ? "7%" : "10%"}

${fonts.bold("💡 Améliore ton score :")}
• Rembourse tes dettes à temps (+15 pts)
• Évite les dettes multiples
• Maintiens un historique actif

Score de départ : 500 | Actuel : ${score} | Variation : ${score >= 500 ? "+" : ""}${score - 500}
    `));
  },

  // ══════════════════════════════════════════════════════════════
  //  HISTORIQUE
  // ══════════════════════════════════════════════════════════════
  historique: function (message, uw) {
    const txs = uw.transactions.slice(-15).reverse();
    if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction enregistrée."));
    let txt = `${fonts.bold("📋 REGISTRE DES TRANSACTIONS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txs.forEach(tx => {
      const e    = emojiTx(tx.type);
      const sign = tx.montant >= 0 ? "+" : "";
      const date = new Date(tx.date).toLocaleDateString("fr-FR");
      txt += `${e} ${tx.description}\n   ${sign}${OR(tx.montant)} (${date})\n\n`;
    });
    return message.reply(fonts.bold(txt));
  },

  // ══════════════════════════════════════════════════════════════
  //  PREMIUM
  // ══════════════════════════════════════════════════════════════
  premium: async function (message, args, uw, save) {
    const action = args[1]?.toLowerCase();
    if (!action || action !== "buy") {
      return message.reply(fonts.bold(`
💎 STATUT PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statut : ${uw.premium ? "✅ Actif" : "❌ Inactif"}

${fonts.bold("Avantages Guilde Légendaire :")}
• Multiplicateur x2 (revenus doublés)
• Badge 💎 exclusif sur le classement
• +50% gains de quêtes
• Titre honorifique spécial

Coût : ${OR(500_000)}
Commande : underworld premium buy
      `));
    }
    if (uw.premium) return message.reply(fonts.bold("✅ Tu es déjà membre de la Guilde Légendaire!"));
    if (uw.orLegit < 500_000) return message.reply(fonts.bold(`❌ Or insuffisant. Requis : ${OR(500_000)}\nDisponible : ${OR(uw.orLegit)}`));
    uw.orLegit      -= 500_000;
    uw.premium       = true;
    uw.multiplicateur = 2.0;
    await save();
    return message.reply(fonts.bold("💎 GUILDE LÉGENDAIRE ACTIVÉE !\nMultiplicateur : 2x\nBienvenue dans l'élite du Royaume, noble aventurier!"));
  },
};
