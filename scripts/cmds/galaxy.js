"use strict";

const fonts = require('../../func/font.js');

// ══════════════════════════════════════════════════════════════
//  COOLDOWNS
// ══════════════════════════════════════════════════════════════
const COOLDOWNS = {
  MINAGE:      1  * 60 * 60 * 1000,  // 1h
  EXPEDITION:  3  * 60 * 60 * 1000,  // 3h
  COMMERCE:    30 * 60 * 1000,        // 30min
  PILLAGE:     6  * 60 * 60 * 1000,  // 6h
  GUERRE:      12 * 60 * 60 * 1000,  // 12h
  DAILY:       24 * 60 * 60 * 1000,  // 24h
};

// ══════════════════════════════════════════════════════════════
//  GRADES (équivalent des rangs dans empire)
// ══════════════════════════════════════════════════════════════
const GRADES = [
  { id: "ASTRONAUTE",  nom: "Astronaute",          min: 0,             emoji: "👨‍🚀", bonus: 0,    color: "⚫" },
  { id: "EXPLORATEUR", nom: "Explorateur Stellaire",min: 50_000,        emoji: "🔭", bonus: 0.05, color: "🟤" },
  { id: "MINEUR",      nom: "Mineur Astéroïdal",   min: 250_000,       emoji: "⛏️", bonus: 0.10, color: "🔴" },
  { id: "CORSAIRE",    nom: "Corsaire Galactique",  min: 1_000_000,     emoji: "🚀", bonus: 0.15, color: "🟠" },
  { id: "AMIRAL",      nom: "Amiral de la Flotte",  min: 5_000_000,     emoji: "⚡", bonus: 0.20, color: "🟡" },
  { id: "GOUVERNEUR",  nom: "Gouverneur Planétaire",min: 20_000_000,    emoji: "🌍", bonus: 0.25, color: "🟢" },
  { id: "SEIGNEUR",    nom: "Seigneur de Secteur",  min: 100_000_000,   emoji: "🌌", bonus: 0.35, color: "🔵" },
  { id: "IMPERATOR",   nom: "Impérator Galactique", min: 500_000_000,   emoji: "👑", bonus: 0.50, color: "🟣" },
];

// ══════════════════════════════════════════════════════════════
//  SECTEURS (équivalent des territoires)
// ══════════════════════════════════════════════════════════════
const SECTEURS = {
  CEINTURE:  { id: "CEINTURE",  nom: "Ceinture d'Astéroïdes", cout: 0,           revenu: 5_000,     risque: 1, protection: 0, emoji: "☄️" },
  LUNE:      { id: "LUNE",      nom: "Colonie Lunaire",        cout: 80_000,      revenu: 20_000,    risque: 2, protection: 0, emoji: "🌙" },
  MARS:      { id: "MARS",      nom: "Station Martienne",      cout: 500_000,     revenu: 70_000,    risque: 3, protection: 1, emoji: "🔴" },
  JUPITER:   { id: "JUPITER",   nom: "Orbital Jupiter",        cout: 2_000_000,   revenu: 220_000,   risque: 4, protection: 2, emoji: "🪐" },
  PLUTON:    { id: "PLUTON",    nom: "Base Pluton Secrète",    cout: 8_000_000,   revenu: 650_000,   risque: 3, protection: 3, emoji: "❄️" },
  NOYAU:     { id: "NOYAU",     nom: "Noyau Galactique",       cout: 30_000_000,  revenu: 2_500_000, risque: 5, protection: 5, emoji: "🌌" },
};

// ══════════════════════════════════════════════════════════════
//  RESSOURCES (marché noir = marché galactique)
// ══════════════════════════════════════════════════════════════
const RESSOURCES = {
  HELIUM3:    { id: "HELIUM3",   nom: "Hélium-3",        prixAchat: 1_000,  prixVente: 2_800,   risque: 1, emoji: "⚗️" },
  TITANIUM:   { id: "TITANIUM",  nom: "Titane Stellaire", prixAchat: 8_000,  prixVente: 22_000,  risque: 2, emoji: "🔩" },
  CRISTAL:    { id: "CRISTAL",   nom: "Cristal Énergie",  prixAchat: 3_000,  prixVente: 9_500,   risque: 2, emoji: "💎" },
  ANTIMATTER: { id: "ANTIMATTER",nom: "Antimatière",      prixAchat: 5_000,  prixVente: 16_000,  risque: 4, emoji: "⚡" },
  DARKORE:    { id: "DARKORE",   nom: "Minerai Sombre",   prixAchat: 15_000, prixVente: 45_000,  risque: 3, emoji: "🌑" },
  NEUTRONIUM: { id: "NEUTRONIUM",nom: "Neutronium",       prixAchat: 50_000, prixVente: 140_000, risque: 4, emoji: "🔮" },
};

// ══════════════════════════════════════════════════════════════
//  INSTALLATIONS (équivalent des structures)
// ══════════════════════════════════════════════════════════════
const INSTALLATIONS = {
  SONDE:      { id: "SONDE",     nom: "Sonde Robotique",     cout: 10_000,    capacite: 50,  revenuBonus: 0,    emoji: "🛰️" },
  RAFFINERIE: { id: "RAFFINERIE",nom: "Raffinerie Orbitale", cout: 75_000,    capacite: 0,   revenuBonus: 0.15, emoji: "🏭" },
  HANGAR:     { id: "HANGAR",    nom: "Hangar Stellaire",    cout: 200_000,   capacite: 500, revenuBonus: 0,    emoji: "🚀" },
  LAB:        { id: "LAB",       nom: "Laboratoire Quantique",cout: 500_000,  capacite: 0,   revenuBonus: 0.25, emoji: "🔬" },
  STATION:    { id: "STATION",   nom: "Station Commerciale", cout: 2_000_000, capacite: 0,   revenuBonus: 0.40, emoji: "🛸" },
  MEGA_CANON: { id: "MEGA_CANON",nom: "Canon de Défense",   cout: 15_000_000,capacite: 0,   revenuBonus: 0.60, emoji: "🔫" },
};

// ══════════════════════════════════════════════════════════════
//  AGENTS (équivalent des alliés)
// ══════════════════════════════════════════════════════════════
const AGENTS = {
  INGENIEUR:  { id: "INGENIEUR",  nom: "Dr. Volta",         cout: 50_000,    effet: "Réduit risque de panne -30%",         emoji: "🔧" },
  PILOTE:     { id: "PILOTE",     nom: "Ace Stelar",        cout: 150_000,   effet: "Expédition cooldown -1h",             emoji: "🧑‍✈️" },
  DIPLOMATE:  { id: "DIPLOMATE",  nom: "Ambassadrice Nyx",  cout: 500_000,   effet: "Risque secteur -2",                   emoji: "🤝" },
  HACKER:     { id: "HACKER",     nom: "Ghost-7",           cout: 250_000,   effet: "+30% revenus commerce galactique",    emoji: "💻" },
  MERCENAIRE: { id: "MERCENAIRE", nom: "Général Kron",      cout: 1_000_000, effet: "+50% succès attaque de secteur",      emoji: "⚔️" },
  ORACLE:     { id: "ORACLE",     nom: "Oracle IA",         cout: 3_000_000, effet: "Immunité totale aux raids 48h",       emoji: "🤖" },
};

// ══════════════════════════════════════════════════════════════
//  EXPÉDITIONS (équivalent des missions)
// ══════════════════════════════════════════════════════════════
const EXPEDITIONS = [
  { id: "E01", nom: "Collecte d'astéroïdes",   difficulte: 1, duree: 30,  gain: [2_000,    8_000],    cout: 0,         risque: 10, xp: 5 },
  { id: "E02", nom: "Pillage de satellite",    difficulte: 2, duree: 60,  gain: [10_000,   40_000],   cout: 2_000,     risque: 20, xp: 15 },
  { id: "E03", nom: "Capture de vaisseau",     difficulte: 3, duree: 90,  gain: [50_000,   180_000],  cout: 15_000,    risque: 30, xp: 30 },
  { id: "E04", nom: "Attaque de convoi",       difficulte: 4, duree: 120, gain: [200_000,  700_000],  cout: 50_000,    risque: 45, xp: 60 },
  { id: "E05", nom: "Destruction de bastion",  difficulte: 5, duree: 180, gain: [800_000,  3_000_000],cout: 200_000,   risque: 60, xp: 120 },
  { id: "E06", nom: "Coup d'état stellaire",   difficulte: 6, duree: 240, gain: [3_000_000,12_000_000],cout:1_000_000, risque: 75, xp: 300 },
];

// ══════════════════════════════════════════════════════════════
//  RECYCLAGE (équivalent du blanchiment)
//  On "recycle" les crédits bruts (sales) en crédits nets (propres)
// ══════════════════════════════════════════════════════════════
const RECYCLAGE_METHODES = {
  BOURSE:     { id: "BOURSE",    nom: "Bourse Interstellaire", ratio: 0.70, frais: 0.30, delai: "4h", emoji: "📈" },
  FONDATION:  { id: "FONDATION", nom: "Fondation Fictive",     ratio: 0.80, frais: 0.20, delai: "4h", emoji: "🏛️" },
  HOLOSHOP:   { id: "HOLOSHOP",  nom: "Holo-Boutique Écran",   ratio: 0.90, frais: 0.10, delai: "4h", emoji: "🛍️" },
  CRYPTO_MIX: { id: "CRYPTO_MIX",nom: "Mixeur Crypto-Ion",     ratio: 0.85, frais: 0.15, delai: "4h", emoji: "🔀" },
  CHARITÉ:    { id: "CHARITÉ",   nom: "Don ONG Spatiale",      ratio: 0.60, frais: 0.40, delai: "4h", emoji: "🎁" },
};

// ══════════════════════════════════════════════════════════════
//  ÉVÉNEMENTS ALÉATOIRES
// ══════════════════════════════════════════════════════════════
const EVENEMENTS = [
  { id: "EVT_RAID",     texte: "🚨 Raid de la Fédération ! Revenus -20% pendant 2h.",         effet: "revenu_malus",     val: -0.20 },
  { id: "EVT_TRAITRE",  texte: "🗡️ Traître à bord ! Vous perdez 5% de vos crédits bruts.",    effet: "brut_perte",       val: -0.05 },
  { id: "EVT_AUBAINE",  texte: "💰 Épave abandonnée détectée ! +$500 000 immédiatement.",      effet: "bonus_instant",    val: 500_000 },
  { id: "EVT_RIVAL",    texte: "⚔️ Une flotte rivale attaque un de vos secteurs. Résistance!", effet: "attaque_secteur",  val: 0 },
  { id: "EVT_MARCHE",   texte: "📈 Les prix du marché galactique explosent pendant 1h !",      effet: "prix_bonus",       val: 1.50 },
  { id: "EVT_INFO",     texte: "🕵️ Un informateur vous contacte. Indice gratuit sur expéd.",   effet: "expedition_info",  val: 0 },
];

// ══════════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════════
function initGalaxy() {
  return {
    creditsBruts:    0,      // = argent sale (pas encore recyclé)
    creditsNets:     0,      // = argent propre (recyclé / légal)
    totalGagne:      0,
    totalRecycle:    0,
    grade:           "ASTRONAUTE",
    xp:              0,
    niveau:          1,
    reputation:      0,
    secteurs:        ["CEINTURE"],
    installations:   [],
    inventaire:      {},
    capaciteMax:     50,
    agents:          [],
    expeditionEnCours: null,
    lastExpedition:    null,
    expeditionsCompletes: 0,
    lastGuerre:      null,
    guerresGagnees:  0,
    guerresPerdues:  0,
    lastRecyclage:   null,
    recyclageEnCours: null,
    lastMinage:      null,
    lastPillage:     null,
    lastDaily:       null,
    lastCommerce:    null,
    transactions:    [],
    achievements:    [],
    evenementActif:  null,
    evenementExpire: null,
    tauxSurveillance: 0,
    prisEnChasse:    false,
    nbArrestes:      0,
    vault:           0,
    loan:            0,
    loanDate:        null,
    creditScore:     500,
    galaxyLevel:     1,
    multiplier:      1.0,
    premium:         false,
    streak:          0,
    lastVault:       null,
    lastInterest:    Date.now(),
  };
}

function FM(n) { return `${Math.floor(n).toLocaleString("fr-FR")} Cr`; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getGrade(galaxy) {
  let grade = GRADES[0];
  for (const g of GRADES) {
    if (galaxy.totalGagne >= g.min) grade = g;
    else break;
  }
  return grade;
}

function getRevenuTotal(galaxy) {
  let total = 0;
  for (const sId of galaxy.secteurs) {
    const s = SECTEURS[sId];
    if (s) total += s.revenu;
  }
  for (const inst of galaxy.installations) {
    const i = INSTALLATIONS[inst.type];
    if (i && i.revenuBonus > 0) total += total * i.revenuBonus;
  }
  const grade = getGrade(galaxy);
  total += total * grade.bonus;
  if (galaxy.agents.includes("HACKER")) total += total * 0.30;
  if (galaxy.evenementActif === "EVT_RAID" && Date.now() < galaxy.evenementExpire) {
    total -= total * 0.20;
  }
  return Math.floor(total);
}

function getCapaciteMax(galaxy) {
  let cap = 50;
  for (const inst of galaxy.installations) {
    const i = INSTALLATIONS[inst.type];
    if (i && i.capacite > 0) cap += i.capacite;
  }
  return cap;
}

function getQuantiteInventaire(galaxy) {
  return Object.values(galaxy.inventaire).reduce((a, b) => a + b, 0);
}

function calculatePortfolioValue(galaxy) {
  let total = 0;
  for (const sId of galaxy.secteurs) {
    const s = SECTEURS[sId];
    if (s) total += s.cout;
  }
  for (const inst of galaxy.installations) {
    const i = INSTALLATIONS[inst.type];
    if (i) total += i.cout;
  }
  for (const [rId, qte] of Object.entries(galaxy.inventaire)) {
    const r = RESSOURCES[rId];
    if (r) total += r.prixAchat * qte;
  }
  return total;
}

function checkAchievements(galaxy) {
  const liste = [];
  const add = (id, cond) => { if (!galaxy.achievements.includes(id) && cond) liste.push(id); };
  add("PREMIERE_MISSION", galaxy.expeditionsCompletes >= 1);
  add("PETIT_EMPIRE",     galaxy.secteurs.length >= 3);
  add("MILLION",          galaxy.totalGagne >= 1_000_000);
  add("MILLIARD",         galaxy.totalGagne >= 1_000_000_000);
  add("AMIRAL_TITRE",     galaxy.grade === "AMIRAL");
  add("IMPERATOR_TITRE",  galaxy.grade === "IMPERATOR");
  add("RECYCLEUR",        galaxy.totalRecycle >= 10_000_000);
  add("CHEF_DE_GUERRE",   galaxy.guerresGagnees >= 5);
  add("ALLIANCE",         galaxy.agents.length >= 4);
  add("PREMIER_CREDIT",   galaxy.totalGagne >= 10_000);
  add("RICHE",            galaxy.creditsNets >= 1_000_000);
  add("SEIGNEUR_GUERRE",  galaxy.guerresGagnees >= 10);
  add("INVINCIBLE",       galaxy.guerresGagnees >= 20);
  add("LEGENDE",          galaxy.totalGagne >= 1_000_000_000);
  for (const a of liste) galaxy.achievements.push(a);
  return liste;
}

function addTransaction(galaxy, type, montant, description) {
  galaxy.transactions.push({ type, montant, description, date: Date.now() });
  if (galaxy.transactions.length > 30) galaxy.transactions = galaxy.transactions.slice(-30);
}

function getTransactionEmoji(type) {
  const map = {
    deposit: "💰", withdrawal: "💸", vault_depot: "🔐", vault_retrait: "🔓",
    loan: "🏦", remboursement: "💳", interet_gagne: "📈", interet_charge: "📉",
    daily: "🎁", minage: "⛏️", achat_secteur: "🗺️", construction: "🏗️",
    achat_marche: "🛒", vente_marche: "💸", recrutement: "🤝", recyclage: "♻️",
    expedition_succes: "✅", expedition_echec: "❌", guerre_victoire: "⚔️", guerre_defaite: "💀",
    raid: "🚨", pillage: "🏴‍☠️"
  };
  return map[type] || "💼";
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function renderDashboard(galaxy, walletBalance) {
  const grade = getGrade(galaxy);
  const revenu = getRevenuTotal(galaxy);
  const totalLiquid = walletBalance + galaxy.creditsNets;
  const totalNet = totalLiquid + galaxy.creditsBruts + galaxy.vault;
  const portfolio = calculatePortfolioValue(galaxy);
  const totalWealth = totalNet + portfolio;
  const invQte = getQuantiteInventaire(galaxy);
  const capMax = getCapaciteMax(galaxy);

  let tier = "🔰 Novice Spatial";
  if      (totalWealth >= 1_000_000_000) tier = "👑 Impérator Suprême";
  else if (totalWealth >= 100_000_000)   tier = "🌌 Seigneur de Secteur";
  else if (totalWealth >= 10_000_000)    tier = "⚡ Amiral Confirmé";
  else if (totalWealth >= 1_000_000)     tier = "🚀 Corsaire Aguerri";
  else if (totalWealth >= 100_000)       tier = "🔭 Explorateur Ambitieux";

  let creditRating = "Faible"; let creditEmoji = "🔴";
  if      (galaxy.creditScore >= 800) { creditRating = "Excellent"; creditEmoji = "🟢"; }
  else if (galaxy.creditScore >= 700) { creditRating = "Bon";       creditEmoji = "🟢"; }
  else if (galaxy.creditScore >= 600) { creditRating = "Moyen";     creditEmoji = "🟡"; }
  else if (galaxy.creditScore >= 500) { creditRating = "Faible";    creditEmoji = "🟠"; }

  return `
${fonts.bold("🌌 EMPIRE GALACTIQUE")} ${grade.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(tier)} • ${fonts.bold("Niv. " + galaxy.galaxyLevel)}${galaxy.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 FINANCES")}
💵 Portefeuille       : ${fonts.bold(FM(walletBalance))}
♻️  Crédits nets       : ${fonts.bold(FM(galaxy.creditsNets))}
⚡ Crédits bruts      : ${fonts.bold(FM(galaxy.creditsBruts))} ⚠️ (à recycler)
🔐 Coffre sécurisé   : ${fonts.bold(FM(galaxy.vault))}
├─ ${fonts.bold("Liquidités : " + FM(totalLiquid))}

${fonts.bold("🚀 EMPIRE STELLAIRE")}
🗺️  Secteurs contrôlés : ${fonts.bold(galaxy.secteurs.length + " zones")}
🏗️  Installations       : ${fonts.bold(galaxy.installations.length)}
🤝 Agents recrutés     : ${fonts.bold(galaxy.agents.length)}
📦 Inventaire          : ${fonts.bold(invQte + "/" + capMax + " unités")}
├─ ${fonts.bold("Valeur portfolio : " + FM(portfolio))}

${fonts.bold("💎 RICHESSE TOTALE")}
🌌 ${fonts.bold("Patrimoine : " + FM(totalWealth))}
${creditEmoji} Score crédit : ${fonts.bold(galaxy.creditScore + "/850")} (${creditRating})
🎯 Prêt max   : ${fonts.bold(FM(galaxy.creditScore * 2000))}
⚡ Multiplicateur : ${fonts.bold(galaxy.multiplier + "x")}${galaxy.premium ? " (Premium)" : ""}

${fonts.bold("👤 PROGRESSION")}
${grade.emoji} Grade    : ${fonts.bold(grade.nom)}
⭐ XP         : ${fonts.bold(galaxy.xp.toLocaleString("fr-FR"))}
🎯 Réputation : ${fonts.bold(galaxy.reputation + "/1000")}
🏆 Succès     : ${fonts.bold(galaxy.achievements.length + "/50")}
🔥 Série daily: ${fonts.bold(galaxy.streak + " jours")}
💸 Prêt actif : ${fonts.bold(galaxy.loan > 0 ? FM(galaxy.loan) : "Aucun ✅")}

${fonts.bold("⏳ COOLDOWNS")}
⛏️  Minage    : ${timeLeft(galaxy.lastMinage, COOLDOWNS.MINAGE)      || "✅ Prêt"}
🚀 Expédition : ${galaxy.expeditionEnCours ? "⏳ En cours" : timeLeft(galaxy.lastExpedition, COOLDOWNS.EXPEDITION) || "✅ Prêt"}
♻️  Recyclage  : ${galaxy.recyclageEnCours  ? "⏳ En cours" : timeLeft(galaxy.lastRecyclage,  COOLDOWNS.COMMERCE)   || "✅ Prêt"}
⚔️  Guerre     : ${timeLeft(galaxy.lastGuerre, COOLDOWNS.GUERRE)      || "✅ Prêt"}
🎁 Daily      : ${timeLeft(galaxy.lastDaily,  COOLDOWNS.DAILY)        || "✅ Prêt"}
${galaxy.prisEnChasse ? "🚨 LA FÉDÉRATION VOUS POURCHASSE !" : "✅ Aucune surveillance"}
`.trim();
}

// ══════════════════════════════════════════════════════════════
//  AIDE
// ══════════════════════════════════════════════════════════════
function renderHelp() {
  return `
${fonts.bold("🌌 EMPIRE GALACTIQUE - GUIDE COMPLET")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("💰 FINANCES")}
🌌 galaxy stat          - Tableau de bord
💰 galaxy deposit <m>   - Déposer des crédits nets
💸 galaxy withdraw <m>  - Retirer des crédits nets
🔐 galaxy vault [dep/wd] <m> - Coffre sécurisé
🏦 galaxy loan <m>      - Emprunter des crédits
💳 galaxy repay <m>     - Rembourser un prêt
📈 galaxy interest      - Voir intérêts
💵 galaxy collect       - Percevoir les intérêts
📋 galaxy history       - Historique transactions
🎁 galaxy daily         - Récompense quotidienne

${fonts.bold("🗺️ SECTEURS & INSTALLATIONS")}
🏙️ galaxy secteur list       - Secteurs disponibles
💰 galaxy secteur buy <ID>   - Conquérir un secteur
ℹ️  galaxy secteur info <ID>  - Détails secteur
🏗️ galaxy build list         - Voir les installations
🔨 galaxy build <TYPE> <SEC> - Construire une installation

${fonts.bold("🛒 MARCHÉ GALACTIQUE")}
📊 galaxy market        - Prix des ressources
🛍️ galaxy buy <ID> <q>  - Acheter des ressources
💸 galaxy sell <ID> <q> - Vendre votre stock
📦 galaxy inventory     - Votre inventaire

${fonts.bold("🚀 EXPÉDITIONS")}
📋 galaxy expedition list      - Missions disponibles
🚀 galaxy expedition start <N> - Lancer une expédition
✅ galaxy expedition check     - Vérifier avancement
❌ galaxy expedition cancel    - Annuler (50% remboursé)

${fonts.bold("⛏️ MINAGE")}
⛏️ galaxy mine          - Miner des ressources (1h cooldown)

${fonts.bold("🤝 AGENTS")}
👥 galaxy agent list    - Agents disponibles
🤝 galaxy agent buy <ID>- Recruter un agent

${fonts.bold("⚔️ GUERRE")}
📊 galaxy war stats     - Bilan des guerres
⚔️ galaxy war attack <ID> - Attaquer un secteur

${fonts.bold("♻️ RECYCLAGE")}
📋 galaxy recycle list          - Méthodes disponibles
♻️  galaxy recycle <MET> <mont> - Recycler crédits bruts

${fonts.bold("🏆 PROGRESSION")}
📊 galaxy grade         - Votre grade
🏆 galaxy achievements  - Succès débloqués
👑 galaxy leaderboard   - Classement

${fonts.bold("⚠️ RÈGLES")}
• Les crédits BRUTS peuvent être saisis lors de raids
• Sans recyclage, impossible de dépenser les crédits bruts
• Les agents améliorent vos capacités
• La réputation débloque les expéditions difficiles
• Le coffre protège du vol et rapporte 2% mensuel
`.trim();
}

// ══════════════════════════════════════════════════════════════
//  COMMANDES - DÉPÔT / RETRAIT
// ══════════════════════════════════════════════════════════════
async function cmdDeposit(message, args, galaxy, user, save, walletBalance) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(
      `💰 DÉPÔT DE CRÉDITS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nUsage: galaxy deposit <montant>\nEx: galaxy deposit 50000\n\nPortefeuille: ${FM(walletBalance)}\nCrédits nets: ${FM(galaxy.creditsNets)}`
    ));
  }
  if (walletBalance < amount) {
    return message.reply(fonts.bold(
      `❌ FONDS INSUFFISANTS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPortefeuille: ${FM(walletBalance)}\nRequis: ${FM(amount)}\nManque: ${FM(amount - walletBalance)}\n\n💡 Recyclez vos crédits bruts d'abord!`
    ));
  }
  user.money = walletBalance - amount;
  galaxy.creditsNets += amount;
  addTransaction(galaxy, "deposit", amount, "Dépôt crédits nets");
  if (!galaxy.achievements.includes("PREMIER_DEPOT")) galaxy.achievements.push("PREMIER_DEPOT");
  await save();
  return message.reply(fonts.bold(
    `💰 DÉPÔT RÉUSSI!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMontant: ${FM(amount)}\nCrédits nets: ${FM(galaxy.creditsNets)}\nPortefeuille restant: ${FM(user.money)}\n\n✅ Crédits sécurisés et porteurs d'intérêts!`
  ));
}

async function cmdWithdraw(message, args, galaxy, user, save) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(
      `💸 RETRAIT DE CRÉDITS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nUsage: galaxy withdraw <montant>\nCrédits nets: ${FM(galaxy.creditsNets)}`
    ));
  }
  if (galaxy.creditsNets < amount) {
    return message.reply(fonts.bold(
      `❌ FONDS INSUFFISANTS\nCrédits nets: ${FM(galaxy.creditsNets)}\nRequis: ${FM(amount)}`
    ));
  }
  galaxy.creditsNets -= amount;
  user.money = (user.money || 0) + amount;
  addTransaction(galaxy, "withdrawal", amount, "Retrait crédits nets");
  await save();
  return message.reply(fonts.bold(
    `💸 RETRAIT RÉUSSI!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRetiré: ${FM(amount)}\nCrédits nets restants: ${FM(galaxy.creditsNets)}\nNouveau portefeuille: ${FM(user.money)}`
  ));
}

// ══════════════════════════════════════════════════════════════
//  VAULT (COFFRE)
// ══════════════════════════════════════════════════════════════
async function cmdVault(message, args, galaxy, save) {
  const action = args[1]?.toLowerCase();
  const amount = parseInt(args[2]);
  if (!action || (action !== "dep" && action !== "deposit" && action !== "wd" && action !== "withdraw")) {
    return message.reply(fonts.bold(
      `🔐 COFFRE GALACTIQUE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCoffre: ${FM(galaxy.vault)}\nCrédits nets: ${FM(galaxy.creditsNets)}\n\nUsage:\ngalaxy vault deposit <m>\ngalaxy vault withdraw <m>\n\n💡 Le coffre protège du vol et génère 2%/mois.`
    ));
  }
  if (!amount || amount <= 0) return message.reply(fonts.bold("❌ Montant invalide."));
  if (action === "dep" || action === "deposit") {
    if (galaxy.creditsNets < amount) return message.reply(fonts.bold(`❌ Insuffisant. Crédits nets: ${FM(galaxy.creditsNets)}`));
    galaxy.creditsNets -= amount;
    galaxy.vault += amount;
    addTransaction(galaxy, "vault_depot", amount, "Dépôt coffre");
    await save();
    return message.reply(fonts.bold(`🔐 COFFRE - DÉPÔT RÉUSSI!\n${FM(amount)} sécurisés.\nCoffre: ${FM(galaxy.vault)}`));
  } else {
    if (galaxy.vault < amount) return message.reply(fonts.bold(`❌ Coffre insuffisant: ${FM(galaxy.vault)}`));
    galaxy.vault -= amount;
    galaxy.creditsNets += amount;
    addTransaction(galaxy, "vault_retrait", amount, "Retrait coffre");
    await save();
    return message.reply(fonts.bold(`🔓 COFFRE - RETRAIT RÉUSSI!\n${FM(amount)} déplacés vers crédits nets.`));
  }
}

// ══════════════════════════════════════════════════════════════
//  PRÊT / REMBOURSEMENT
// ══════════════════════════════════════════════════════════════
async function cmdLoan(message, args, galaxy, save) {
  const amount = parseInt(args[1]);
  const maxLoan = Math.floor(galaxy.creditScore * 2000);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(
      `🏦 PRÊT GALACTIQUE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nScore crédit: ${galaxy.creditScore}\nMax empruntable: ${FM(maxLoan)}\nTaux: 8%/semaine\nPrêt actuel: ${galaxy.loan > 0 ? FM(galaxy.loan) : "Aucun"}\n\nUsage: galaxy loan <montant>`
    ));
  }
  if (galaxy.loan > 0) return message.reply(fonts.bold(`❌ Prêt actif de ${FM(galaxy.loan)}. Remboursez d'abord.`));
  if (amount > maxLoan) return message.reply(fonts.bold(`❌ Maximum: ${FM(maxLoan)} (score: ${galaxy.creditScore})`));
  if (amount < 10_000) return message.reply(fonts.bold("❌ Minimum: 10 000 Cr"));
  galaxy.creditsNets += amount;
  galaxy.loan = amount;
  galaxy.loanDate = new Date();
  addTransaction(galaxy, "loan", amount, "Prêt approuvé");
  await save();
  return message.reply(fonts.bold(
    `✅ PRÊT APPROUVÉ!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMontant: ${FM(amount)}\nTaux: 8%/semaine\nCrédits nets: ${FM(galaxy.creditsNets)}\n\n💡 Remboursez vite pour améliorer votre score!`
  ));
}

async function cmdRepay(message, args, galaxy, save) {
  if (galaxy.loan <= 0) return message.reply(fonts.bold("❌ Aucun prêt actif."));
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(
      `💳 REMBOURSEMENT\nPrêt restant: ${FM(galaxy.loan)}\nCrédits nets: ${FM(galaxy.creditsNets)}\n\nUsage: galaxy repay <montant>`
    ));
  }
  if (galaxy.creditsNets < amount) return message.reply(fonts.bold(`❌ Insuffisant. Crédits nets: ${FM(galaxy.creditsNets)}`));
  const repay = Math.min(amount, galaxy.loan);
  galaxy.creditsNets -= repay;
  galaxy.loan -= repay;
  if (galaxy.loan <= 0) {
    galaxy.loanDate = null;
    galaxy.creditScore = Math.min(850, galaxy.creditScore + 15);
  }
  addTransaction(galaxy, "remboursement", repay, "Remboursement prêt");
  await save();
  if (galaxy.loan <= 0) {
    return message.reply(fonts.bold(`✅ PRÊT REMBOURSÉ INTÉGRALEMENT!\n🎉 Score crédit amélioré! Nouveau score: ${galaxy.creditScore}`));
  }
  return message.reply(fonts.bold(`💳 Remboursement: ${FM(repay)}\nPrêt restant: ${FM(galaxy.loan)}`));
}

// ══════════════════════════════════════════════════════════════
//  INTÉRÊTS
// ══════════════════════════════════════════════════════════════
async function cmdInterest(message, galaxy, save) {
  const now = Date.now();
  const elapsed = now - (galaxy.lastInterest || now);
  const hours = elapsed / 3_600_000;
  const vaultInterest = Math.floor(galaxy.vault * (0.02 / 720) * hours);
  const loanInterest = galaxy.loan > 0 ? Math.floor(galaxy.loan * (0.08 / 168) * hours) : 0;
  return message.reply(fonts.bold(
    `📈 INTÉRÊTS GALACTIQUES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💰 Coffre: ${FM(galaxy.vault)} @ 2%/mois\n📈 Intérêts coffre: +${FM(vaultInterest)}\n💸 Prêt: ${galaxy.loan > 0 ? FM(galaxy.loan) : "Aucun"} @ 8%/sem\n📉 Intérêts prêt: -${FM(loanInterest)}\n\nUsez 'galaxy collect' pour percevoir.`
  ));
}

async function cmdCollectInterest(message, galaxy, save) {
  const now = Date.now();
  const elapsed = now - (galaxy.lastInterest || now);
  const hours = elapsed / 3_600_000;
  if (hours < 1) return message.reply(fonts.bold(`⏳ Trop tôt! Revenez dans ${Math.ceil(60 - hours * 60)} min.`));
  const vaultInterest = Math.floor(galaxy.vault * (0.02 / 720) * hours);
  const loanInterest = galaxy.loan > 0 ? Math.floor(galaxy.loan * (0.08 / 168) * hours) : 0;
  galaxy.creditsNets += vaultInterest;
  if (galaxy.loan > 0) galaxy.loan += loanInterest;
  galaxy.lastInterest = now;
  if (vaultInterest > 0) addTransaction(galaxy, "interet_gagne", vaultInterest, "Intérêts coffre");
  if (loanInterest > 0) addTransaction(galaxy, "interet_charge", -loanInterest, "Intérêts prêt");
  await save();
  return message.reply(fonts.bold(
    `💰 INTÉRÊTS PERÇUS!\n+${FM(vaultInterest)} (coffre)${loanInterest > 0 ? `\n-${FM(loanInterest)} (prêt)` : ""}\nCrédits nets: ${FM(galaxy.creditsNets)}`
  ));
}

// ══════════════════════════════════════════════════════════════
//  DAILY
// ══════════════════════════════════════════════════════════════
async function cmdDaily(message, galaxy, save) {
  const now = Date.now();
  const tl = timeLeft(galaxy.lastDaily, COOLDOWNS.DAILY);
  if (tl) return message.reply(fonts.bold(`⏳ Déjà collecté! Revenez dans ${tl}.`));
  galaxy.streak = (galaxy.lastDaily && Date.now() - galaxy.lastDaily < 48 * 3_600_000) ? galaxy.streak + 1 : 1;
  const base = 10_000 + galaxy.galaxyLevel * 2_000;
  const bonus = Math.floor(base * (galaxy.streak > 1 ? Math.min(galaxy.streak * 0.1, 1.0) : 0));
  const total = base + bonus;
  galaxy.creditsNets += total;
  galaxy.totalGagne += total;
  galaxy.lastDaily = now;
  addTransaction(galaxy, "daily", total, `Daily J${galaxy.streak}`);
  await save();
  return message.reply(fonts.bold(
    `🎁 RÉCOMPENSE QUOTIDIENNE!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRécompense de base: ${FM(base)}\nBonus série (${galaxy.streak}j): +${FM(bonus)}\n💎 Total: ${FM(total)}\n\n🔥 Série actuelle: ${galaxy.streak} jours!`
  ));
}

// ══════════════════════════════════════════════════════════════
//  MINAGE (≈ collecte empire)
// ══════════════════════════════════════════════════════════════
async function cmdMinage(message, galaxy, save) {
  const tl = timeLeft(galaxy.lastMinage, COOLDOWNS.MINAGE);
  if (tl) return message.reply(fonts.bold(`⏳ Vos extracteurs se rechargent! Revenez dans ${tl}.`));
  const revenu = getRevenuTotal(galaxy);
  if (revenu <= 0) return message.reply(fonts.bold("❌ Aucun secteur actif. Conquérez des secteurs d'abord!"));
  const newAchievements = checkAchievements(galaxy);
  galaxy.creditsBruts += revenu;
  galaxy.totalGagne   += revenu;
  galaxy.lastMinage    = Date.now();
  addTransaction(galaxy, "minage", revenu, "Minage territorial");
  await save();
  let msg = `⛏️ MINAGE RÉUSSI!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRevenus perçus: +${FM(revenu)}\nCrédits bruts totaux: ${FM(galaxy.creditsBruts)}\n\n⚠️ Recyclez vos crédits bruts pour les dépenser!\nUsez: galaxy recycle`;
  if (newAchievements.length > 0) msg += `\n\n🏆 Nouveaux succès: ${newAchievements.join(", ")}`;
  return message.reply(fonts.bold(msg));
}

// ══════════════════════════════════════════════════════════════
//  SECTEURS
// ══════════════════════════════════════════════════════════════
async function cmdSecteur(message, args, galaxy, user, save) {
  const action = args[1]?.toLowerCase();
  const targetId = args[2]?.toUpperCase();

  if (!action || action === "list") {
    let txt = `${fonts.bold("🗺️ SECTEURS GALACTIQUES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, s] of Object.entries(SECTEURS)) {
      const owned = galaxy.secteurs.includes(id);
      txt += `${s.emoji} ${fonts.bold(s.nom)} [${id}]${owned ? " ✅" : ""}\n`;
      txt += `   💰 Coût: ${s.cout > 0 ? FM(s.cout) : "Gratuit"} | 📈 Revenu: ${FM(s.revenu)}/h\n`;
      txt += `   ⚠️ Risque: ${"★".repeat(s.risque)} | 🛡️ Protection: ${s.protection}\n\n`;
    }
    txt += `Vos secteurs: ${galaxy.secteurs.join(", ")}\nUsez 'galaxy secteur buy <ID>' pour conquérir.`;
    return message.reply(fonts.bold(txt));
  }

  if (action === "buy") {
    if (!targetId || !SECTEURS[targetId]) return message.reply(fonts.bold("❌ ID de secteur invalide."));
    if (galaxy.secteurs.includes(targetId)) return message.reply(fonts.bold("❌ Secteur déjà contrôlé."));
    const s = SECTEURS[targetId];
    if (s.cout > 0 && galaxy.creditsNets < s.cout) {
      return message.reply(fonts.bold(`❌ Fonds insuffisants.\nRequis: ${FM(s.cout)}\nCrédits nets: ${FM(galaxy.creditsNets)}`));
    }
    galaxy.creditsNets -= s.cout;
    galaxy.secteurs.push(targetId);
    galaxy.reputation += s.risque * 20;
    addTransaction(galaxy, "achat_secteur", -s.cout, `Acquisition: ${s.nom}`);
    const newAchievements = checkAchievements(galaxy);
    await save();
    let msg = `🗺️ SECTEUR CONQUIS!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${s.emoji} ${s.nom}\n💰 Coût: ${FM(s.cout)}\n📈 Revenu ajouté: +${FM(s.revenu)}/h\n🎯 Réputation: +${s.risque * 20}`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    return message.reply(fonts.bold(msg));
  }

  if (action === "info") {
    if (!targetId || !SECTEURS[targetId]) return message.reply(fonts.bold("❌ ID invalide."));
    const s = SECTEURS[targetId];
    return message.reply(fonts.bold(
      `${s.emoji} ${s.nom}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💰 Coût: ${FM(s.cout)}\n📈 Revenu: ${FM(s.revenu)}/h\n⚠️ Risque: ${"★".repeat(s.risque)}\n🛡️ Protection: ${s.protection}/5\nStatut: ${galaxy.secteurs.includes(targetId) ? "✅ Contrôlé" : "❌ Non contrôlé"}`
    ));
  }

  return message.reply(fonts.bold("❓ Usage: galaxy secteur [list|buy|info] [ID]"));
}

// ══════════════════════════════════════════════════════════════
//  INSTALLATIONS
// ══════════════════════════════════════════════════════════════
async function cmdBuild(message, args, galaxy, user, save) {
  const action = args[1]?.toLowerCase();

  if (!action || action === "list") {
    let txt = `${fonts.bold("🏗️ INSTALLATIONS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, i] of Object.entries(INSTALLATIONS)) {
      const owned = galaxy.installations.find(x => x.type === id);
      txt += `${i.emoji} ${fonts.bold(i.nom)} [${id}]${owned ? " ✅" : ""}\n`;
      txt += `   💰 Coût: ${FM(i.cout)}`;
      if (i.capacite > 0) txt += ` | 📦 +${i.capacite} capacité`;
      if (i.revenuBonus > 0) txt += ` | 📈 +${Math.round(i.revenuBonus * 100)}% revenus`;
      txt += "\n\n";
    }
    txt += "Usez 'galaxy build <TYPE> <SECTEUR_ID>'";
    return message.reply(fonts.bold(txt));
  }

  const type = args[1]?.toUpperCase();
  const secteurId = args[2]?.toUpperCase();
  if (!INSTALLATIONS[type]) return message.reply(fonts.bold("❌ Type d'installation invalide. Usez 'galaxy build list'."));
  if (!secteurId || !galaxy.secteurs.includes(secteurId)) return message.reply(fonts.bold("❌ Secteur non contrôlé ou invalide."));
  const inst = INSTALLATIONS[type];
  if (galaxy.creditsNets < inst.cout) return message.reply(fonts.bold(`❌ Insuffisant. Requis: ${FM(inst.cout)} | Disponible: ${FM(galaxy.creditsNets)}`));
  galaxy.creditsNets -= inst.cout;
  galaxy.installations.push({ type, secteur: secteurId, date: Date.now() });
  addTransaction(galaxy, "construction", -inst.cout, `Construction: ${inst.nom}`);
  await save();
  return message.reply(fonts.bold(
    `🏗️ CONSTRUCTION RÉUSSIE!\n${inst.emoji} ${inst.nom} construite dans ${SECTEURS[secteurId]?.nom || secteurId}.\nCoût: ${FM(inst.cout)}\nCrédits nets restants: ${FM(galaxy.creditsNets)}`
  ));
}

// ══════════════════════════════════════════════════════════════
//  MARCHÉ GALACTIQUE
// ══════════════════════════════════════════════════════════════
function cmdMarket(message) {
  let txt = `${fonts.bold("🛒 MARCHÉ GALACTIQUE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [id, r] of Object.entries(RESSOURCES)) {
    txt += `${r.emoji} ${fonts.bold(r.nom)} [${id}]\n`;
    txt += `   Achat: ${FM(r.prixAchat)} | Vente: ${FM(r.prixVente)} | Risque: ${"★".repeat(r.risque)}\n\n`;
  }
  txt += "Achat: galaxy buy <ID> <quantité>\nVente: galaxy sell <ID> <quantité>";
  return message.reply(fonts.bold(txt));
}

async function cmdBuy(message, args, galaxy, user, save) {
  const resId = args[1]?.toUpperCase();
  const qte = parseInt(args[2]);
  if (!resId || !RESSOURCES[resId] || !qte || qte <= 0) {
    return message.reply(fonts.bold("❌ Usage: galaxy buy <ID> <quantité>\nEx: galaxy buy HELIUM3 10"));
  }
  const r = RESSOURCES[resId];
  const total = r.prixAchat * qte;
  const invQte = getQuantiteInventaire(galaxy);
  const cap = getCapaciteMax(galaxy);
  if (invQte + qte > cap) return message.reply(fonts.bold(`❌ Capacité max atteinte (${cap}). Vendez d'abord.`));
  if (galaxy.creditsNets < total) return message.reply(fonts.bold(`❌ Insuffisant. Requis: ${FM(total)}\nCrédits nets: ${FM(galaxy.creditsNets)}`));
  galaxy.creditsNets -= total;
  galaxy.inventaire[resId] = (galaxy.inventaire[resId] || 0) + qte;
  addTransaction(galaxy, "achat_marche", -total, `Achat ${qte}x ${r.nom}`);
  await save();
  return message.reply(fonts.bold(`🛒 ACHAT RÉUSSI!\n${r.emoji} ${qte}x ${r.nom}\nCoût: ${FM(total)}\nCrédits nets restants: ${FM(galaxy.creditsNets)}\nStock: ${galaxy.inventaire[resId]} unités`));
}

async function cmdSell(message, args, galaxy, save) {
  const resId = args[1]?.toUpperCase();
  const qte = parseInt(args[2]);
  if (!resId || !RESSOURCES[resId] || !qte || qte <= 0) {
    return message.reply(fonts.bold("❌ Usage: galaxy sell <ID> <quantité>\nEx: galaxy sell HELIUM3 5"));
  }
  const r = RESSOURCES[resId];
  const owned = galaxy.inventaire[resId] || 0;
  if (owned < qte) return message.reply(fonts.bold(`❌ Stock insuffisant: ${owned} unités disponibles.`));
  const gain = r.prixVente * qte;
  galaxy.inventaire[resId] -= qte;
  if (galaxy.inventaire[resId] <= 0) delete galaxy.inventaire[resId];
  galaxy.creditsBruts += gain;
  galaxy.totalGagne += gain;
  addTransaction(galaxy, "vente_marche", gain, `Vente ${qte}x ${r.nom}`);
  await save();
  return message.reply(fonts.bold(`💸 VENTE RÉUSSIE!\n${r.emoji} ${qte}x ${r.nom}\nGain: +${FM(gain)} (crédits bruts)\n\n⚠️ Recyclez ces crédits pour les utiliser!`));
}

function cmdInventory(message, galaxy) {
  const inv = galaxy.inventaire;
  const items = Object.entries(inv);
  if (items.length === 0) return message.reply(fonts.bold("📦 Inventaire vide. Achetez des ressources avec 'galaxy buy'."));
  let txt = `${fonts.bold("📦 INVENTAIRE GALACTIQUE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  let totalValue = 0;
  for (const [id, qte] of items) {
    const r = RESSOURCES[id];
    if (!r) continue;
    const val = r.prixVente * qte;
    totalValue += val;
    txt += `${r.emoji} ${r.nom}: ${qte} unités (valeur: ${FM(val)})\n`;
  }
  txt += `\n📊 Valeur totale: ${FM(totalValue)}\n📦 Capacité: ${getQuantiteInventaire(galaxy)}/${getCapaciteMax(galaxy)}`;
  return message.reply(fonts.bold(txt));
}

// ══════════════════════════════════════════════════════════════
//  EXPÉDITIONS
// ══════════════════════════════════════════════════════════════
async function cmdExpedition(message, args, galaxy, save) {
  const action = args[1]?.toLowerCase();

  if (!action || action === "list") {
    let txt = `${fonts.bold("🚀 EXPÉDITIONS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    EXPEDITIONS.forEach((e, i) => {
      txt += `${fonts.bold(`[${i + 1}]`)} ${e.nom}\n   Difficulté: ${"★".repeat(e.difficulte)} | Durée: ${e.duree}min\n   Gain: ${FM(e.gain[0])} à ${FM(e.gain[1])} | Coût: ${FM(e.cout)}\n   Risque: ${e.risque}% | XP: +${e.xp}\n\n`;
    });
    return message.reply(fonts.bold(txt + "Lancez: galaxy expedition start <N°>"));
  }

  if (action === "start") {
    if (galaxy.expeditionEnCours) return message.reply(fonts.bold("⏳ Expédition déjà en cours! Vérifiez avec 'galaxy expedition check'."));
    const tl = timeLeft(galaxy.lastExpedition, COOLDOWNS.EXPEDITION);
    if (tl) return message.reply(fonts.bold(`⏳ Cooldown! Revenez dans ${tl}.`));
    const n = parseInt(args[2]) - 1;
    if (isNaN(n) || !EXPEDITIONS[n]) return message.reply(fonts.bold("❌ Numéro d'expédition invalide."));
    const exp = EXPEDITIONS[n];
    if (galaxy.reputation < exp.difficulte * 100) return message.reply(fonts.bold(`❌ Réputation insuffisante (${galaxy.reputation}/${exp.difficulte * 100}).`));
    if (exp.cout > 0 && galaxy.creditsNets < exp.cout) return message.reply(fonts.bold(`❌ Coût: ${FM(exp.cout)}. Vous avez: ${FM(galaxy.creditsNets)}`));
    if (exp.cout > 0) galaxy.creditsNets -= exp.cout;
    galaxy.expeditionEnCours = { id: exp.id, startTime: Date.now(), duration: exp.duree * 60 * 1000, cout: exp.cout };
    await save();
    return message.reply(fonts.bold(`🚀 EXPÉDITION LANCÉE!\n${exp.nom}\nDurée: ${exp.duree} minutes\nGain potentiel: ${FM(exp.gain[0])} - ${FM(exp.gain[1])}\n\nVérifiez avec 'galaxy expedition check'.`));
  }

  if (action === "check") {
    if (!galaxy.expeditionEnCours) return message.reply(fonts.bold("❌ Aucune expédition en cours."));
    const { id, startTime, duration } = galaxy.expeditionEnCours;
    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const remaining = Math.ceil((duration - elapsed) / 60_000);
      return message.reply(fonts.bold(`⏳ Expédition en cours!\nTemps restant: ${remaining} minutes.`));
    }
    const exp = EXPEDITIONS.find(e => e.id === id);
    if (!exp) { galaxy.expeditionEnCours = null; await save(); return message.reply(fonts.bold("❌ Erreur d'expédition.")); }
    const successChance = Math.max(0.3, 1 - exp.risque / 100);
    const success = Math.random() < successChance;
    galaxy.expeditionEnCours = null;
    galaxy.lastExpedition = Date.now();
    if (success) {
      const gain = rand(exp.gain[0], exp.gain[1]);
      galaxy.creditsBruts += gain;
      galaxy.totalGagne += gain;
      galaxy.xp += exp.xp;
      galaxy.reputation = Math.min(1000, galaxy.reputation + exp.difficulte * 15);
      galaxy.expeditionsCompletes++;
      addTransaction(galaxy, "expedition_succes", gain, `Succès: ${exp.nom}`);
      const newAchievements = checkAchievements(galaxy);
      await save();
      let msg = `✅ EXPÉDITION RÉUSSIE!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${exp.nom}\n💰 Gain: +${FM(gain)} (crédits bruts)\n⭐ XP: +${exp.xp}\n🎯 Réputation: +${exp.difficulte * 15}`;
      if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
      return message.reply(fonts.bold(msg));
    } else {
      addTransaction(galaxy, "expedition_echec", 0, `Échec: ${exp.nom}`);
      await save();
      return message.reply(fonts.bold(`❌ EXPÉDITION ÉCHOUÉE!\n${exp.nom}\nVotre équipage est revenu bredouille.\n\n💡 Recrutez des agents pour améliorer vos chances.`));
    }
  }

  if (action === "cancel") {
    if (!galaxy.expeditionEnCours) return message.reply(fonts.bold("❌ Aucune expédition en cours."));
    const refund = Math.floor((galaxy.expeditionEnCours.cout || 0) * 0.5);
    galaxy.creditsNets += refund;
    galaxy.expeditionEnCours = null;
    galaxy.lastExpedition = Date.now();
    await save();
    return message.reply(fonts.bold(`❌ Expédition annulée.\nRemboursement 50%: +${FM(refund)}`));
  }

  return message.reply(fonts.bold("❓ Usage: galaxy expedition [list|start|check|cancel]"));
}

// ══════════════════════════════════════════════════════════════
//  AGENTS
// ══════════════════════════════════════════════════════════════
async function cmdAgent(message, args, galaxy, user, save) {
  const action = args[1]?.toLowerCase();
  const agentId = args[2]?.toUpperCase();

  if (!action || action === "list") {
    let txt = `${fonts.bold("🤝 AGENTS GALACTIQUES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, a] of Object.entries(AGENTS)) {
      const owned = galaxy.agents.includes(id);
      txt += `${a.emoji} ${fonts.bold(a.nom)} [${id}]${owned ? " ✅ Recruté" : ""}\n   Coût: ${FM(a.cout)}\n   Effet: ${a.effet}\n\n`;
    }
    txt += "Recrutez: galaxy agent buy <ID>";
    return message.reply(fonts.bold(txt));
  }

  if (action === "buy") {
    if (!agentId || !AGENTS[agentId]) return message.reply(fonts.bold("❌ ID d'agent invalide."));
    if (galaxy.agents.includes(agentId)) return message.reply(fonts.bold("❌ Agent déjà recruté."));
    const a = AGENTS[agentId];
    if (galaxy.creditsNets < a.cout) return message.reply(fonts.bold(`❌ Insuffisant. Requis: ${FM(a.cout)}`));
    galaxy.creditsNets -= a.cout;
    galaxy.agents.push(agentId);
    addTransaction(galaxy, "recrutement", -a.cout, `Recrutement: ${a.nom}`);
    const newAchievements = checkAchievements(galaxy);
    await save();
    let msg = `🤝 AGENT RECRUTÉ!\n${a.emoji} ${a.nom}\nCoût: ${FM(a.cout)}\nEffet actif: ${a.effet}`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    return message.reply(fonts.bold(msg));
  }

  return message.reply(fonts.bold("❓ Usage: galaxy agent [list|buy] [ID]"));
}

// ══════════════════════════════════════════════════════════════
//  RECYCLAGE (≈ blanchiment)
// ══════════════════════════════════════════════════════════════
async function cmdRecycle(message, args, galaxy, save) {
  const action = args[1]?.toLowerCase();

  if (!action || action === "list") {
    let txt = `${fonts.bold("♻️ RECYCLAGE DE CRÉDITS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, m] of Object.entries(RECYCLAGE_METHODES)) {
      txt += `${m.emoji} ${fonts.bold(m.nom)} [${id}]\n   Ratio: ${Math.round(m.ratio * 100)}% | Frais: ${Math.round(m.frais * 100)}%\n\n`;
    }
    txt += `Crédits bruts disponibles: ${FM(galaxy.creditsBruts)}\nUsez: galaxy recycle <METHODE> <montant>`;
    return message.reply(fonts.bold(txt));
  }

  if (galaxy.recyclageEnCours) {
    const { methode, montant, heure } = galaxy.recyclageEnCours;
    const tl = timeLeft(heure, COOLDOWNS.BLANCHIMENT || 4 * 60 * 60 * 1000);
    if (tl) return message.reply(fonts.bold(`⏳ Recyclage en cours!\nTemps restant: ${tl}\n\nUne fois terminé, relancez 'galaxy recycle <METHODE> collect' ou retapez la commande.`));
    // Terminé
    const m = RECYCLAGE_METHODES[methode];
    const gained = Math.floor(montant * m.ratio);
    galaxy.creditsNets += gained;
    galaxy.totalRecycle += gained;
    galaxy.recyclageEnCours = null;
    addTransaction(galaxy, "recyclage", gained, `Recyclage: ${m.nom}`);
    const newAchievements = checkAchievements(galaxy);
    await save();
    let msg = `♻️ RECYCLAGE TERMINÉ!\n${m.emoji} ${m.nom}\nCrédits récupérés: +${FM(gained)}\nCrédits nets totaux: ${FM(galaxy.creditsNets)}`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    return message.reply(fonts.bold(msg));
  }

  const methodeId = action.toUpperCase();
  const montant = parseInt(args[2]);
  if (!RECYCLAGE_METHODES[methodeId]) return message.reply(fonts.bold("❌ Méthode invalide. Usez 'galaxy recycle list'."));
  if (!montant || montant <= 0) return message.reply(fonts.bold("❌ Montant invalide."));
  if (galaxy.creditsBruts < montant) return message.reply(fonts.bold(`❌ Crédits bruts insuffisants: ${FM(galaxy.creditsBruts)}`));
  if (montant < 5_000) return message.reply(fonts.bold("❌ Minimum de recyclage: 5 000 Cr"));
  galaxy.creditsBruts -= montant;
  galaxy.lastRecyclage = Date.now();
  galaxy.recyclageEnCours = { methode: methodeId, montant, heure: Date.now() };
  await save();
  const m = RECYCLAGE_METHODES[methodeId];
  return message.reply(fonts.bold(
    `♻️ RECYCLAGE LANCÉ!\n${m.emoji} ${m.nom}\nMontant: ${FM(montant)}\nGain attendu: ~${FM(Math.floor(montant * m.ratio))}\nDurée: ${m.delai}\n\nRelancez 'galaxy recycle' dans 4h pour récupérer vos crédits.`
  ));
}

// ══════════════════════════════════════════════════════════════
//  GUERRE
// ══════════════════════════════════════════════════════════════
async function cmdGuerre(message, args, galaxy, user, save) {
  const action = args[1]?.toLowerCase();

  if (!action || action === "stats") {
    return message.reply(fonts.bold(
      `⚔️ BILAN DE GUERRE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏆 Victoires: ${galaxy.guerresGagnees}\n💀 Défaites: ${galaxy.guerresPerdues}\n📊 Ratio: ${galaxy.guerresGagnees + galaxy.guerresPerdues > 0 ? Math.round((galaxy.guerresGagnees / (galaxy.guerresGagnees + galaxy.guerresPerdues)) * 100) : 0}%\n⏳ Prochain assaut: ${timeLeft(galaxy.lastGuerre, COOLDOWNS.GUERRE) || "✅ Prêt"}`
    ));
  }

  if (action === "attack") {
    const targetId = args[2]?.toUpperCase();
    const tl = timeLeft(galaxy.lastGuerre, COOLDOWNS.GUERRE);
    if (tl) return message.reply(fonts.bold(`⏳ Flotte en repos! Revenez dans ${tl}.`));
    if (!targetId || !SECTEURS[targetId]) return message.reply(fonts.bold("❌ ID de secteur invalide."));
    if (galaxy.secteurs.includes(targetId)) return message.reply(fonts.bold("❌ Secteur déjà sous contrôle."));
    const s = SECTEURS[targetId];
    const coutGuerre = Math.floor(s.cout * 0.30) || 30_000;
    if (galaxy.creditsNets < coutGuerre) return message.reply(fonts.bold(`❌ Fonds de guerre insuffisants.\nRequis: ${FM(coutGuerre)}\nDisponible: ${FM(galaxy.creditsNets)}`));
    galaxy.creditsNets -= coutGuerre;
    const hasMercenaire = galaxy.agents.includes("MERCENAIRE");
    const baseChance = 0.5 + (galaxy.guerresGagnees * 0.02);
    const successChance = Math.min(0.85, hasMercenaire ? baseChance + 0.5 : baseChance);
    const success = Math.random() < successChance;
    if (success) {
      galaxy.secteurs.push(targetId);
      galaxy.guerresGagnees++;
      galaxy.xp += 500;
      galaxy.reputation = Math.min(1000, galaxy.reputation + s.risque * 30);
      addTransaction(galaxy, "guerre_victoire", s.revenu, `Secteur conquis: ${s.nom}`);
      galaxy.lastGuerre = Date.now();
      const newAchievements = checkAchievements(galaxy);
      await save();
      let msg = `⚔️ VICTOIRE!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${s.emoji} ${s.nom} conquis!\nRevenu ajouté: +${FM(s.revenu)}/h\nCoût de guerre: ${FM(coutGuerre)}\n⭐ XP: +500 | 🎯 Réputation: +${s.risque * 30}`;
      if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
      return message.reply(fonts.bold(msg));
    } else {
      const perte = Math.floor(galaxy.creditsBruts * 0.10);
      galaxy.creditsBruts = Math.max(0, galaxy.creditsBruts - perte);
      galaxy.guerresPerdues++;
      galaxy.lastGuerre = Date.now();
      addTransaction(galaxy, "guerre_defaite", -(perte + coutGuerre), `Défaite sur: ${s.nom}`);
      await save();
      return message.reply(fonts.bold(
        `💀 DÉFAITE!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nL'assaut sur ${s.emoji} ${s.nom} a échoué.\n💰 Perte crédits bruts: ${FM(perte)}\n💰 Coût guerre perdu: ${FM(coutGuerre)}\n\n💡 Recrutez le Mercenaire pour +50% succès.`
      ));
    }
  }

  return message.reply(fonts.bold("❓ Usage: galaxy war [stats|attack] <SECTEUR_ID>"));
}

// ══════════════════════════════════════════════════════════════
//  GRADE
// ══════════════════════════════════════════════════════════════
function cmdGrade(message, galaxy) {
  const grade = getGrade(galaxy);
  const idx = GRADES.findIndex(g => g.id === grade.id);
  const next = GRADES[idx + 1];
  let txt = `${fonts.bold("🚀 GRADE GALACTIQUE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `${grade.emoji} Grade actuel: ${fonts.bold(grade.nom)}\n`;
  txt += `💰 Total gagné: ${FM(galaxy.totalGagne)}\n`;
  txt += `📈 Bonus de revenus: +${Math.round(grade.bonus * 100)}%\n\n`;
  if (next) {
    const progress = Math.min(100, Math.floor((galaxy.totalGagne / next.min) * 100));
    txt += `${fonts.bold("⬆️ Prochain grade:")} ${next.emoji} ${next.nom}\n`;
    txt += `📊 Progression: ${progress}% (${FM(galaxy.totalGagne)} / ${FM(next.min)})\n`;
    txt += `Manque: ${FM(Math.max(0, next.min - galaxy.totalGagne))}`;
  } else {
    txt += `🌌 Vous avez atteint le grade suprême: ${fonts.bold("IMPÉRATOR GALACTIQUE")}!`;
  }
  return message.reply(fonts.bold(txt));
}

// ══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ══════════════════════════════════════════════════════════════
function cmdAchievements(message, galaxy) {
  const all = [
    "PREMIER_DEPOT","PREMIERE_MISSION","PETIT_EMPIRE","MILLION","MILLIARD",
    "AMIRAL_TITRE","IMPERATOR_TITRE","RECYCLEUR","CHEF_DE_GUERRE","ALLIANCE",
    "PREMIER_CREDIT","RICHE","SEIGNEUR_GUERRE","INVINCIBLE","LEGENDE"
  ];
  let txt = `${fonts.bold("🏆 SUCCÈS GALACTIQUES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nProgression: ${galaxy.achievements.length}/${all.length}\n\n`;
  if (galaxy.achievements.length === 0) {
    txt += "🎯 Aucun succès débloqué. Commencez à explorer!\n\n";
  } else {
    txt += `${fonts.bold("🎖️ DÉBLOQUÉS:")}\n`;
    galaxy.achievements.slice(0, 10).forEach((a, i) => { txt += `${i + 1}. 🏆 ${a}\n`; });
    if (galaxy.achievements.length > 10) txt += `... et ${galaxy.achievements.length - 10} de plus!\n`;
    txt += "\n";
  }
  const remaining = all.filter(a => !galaxy.achievements.includes(a));
  txt += `${fonts.bold("🎯 À DÉBLOQUER:")}\n`;
  remaining.slice(0, 5).forEach(a => { txt += `• ${a}\n`; });
  return message.reply(fonts.bold(txt));
}

// ══════════════════════════════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════════════════════════════
async function cmdLeaderboard(message, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const richest = [];
    for (const [uid, user] of Object.entries(allUsers)) {
      const galaxy = user.data?.galaxy;
      if (galaxy && (galaxy.creditsNets > 0 || galaxy.creditsBruts > 0 || galaxy.vault > 0)) {
        const wealth = (galaxy.creditsNets || 0) + (galaxy.creditsBruts || 0) + (galaxy.vault || 0);
        richest.push({ uid, wealth, grade: galaxy.grade || "ASTRONAUTE", achievements: galaxy.achievements?.length || 0, name: user.name || `Joueur ${uid}` });
      }
    }
    richest.sort((a, b) => b.wealth - a.wealth);
    const top10 = richest.slice(0, 10);
    let txt = `${fonts.bold("👑 CLASSEMENT GALACTIQUE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💎 TOP 10 COMMANDANTS 💎\n\n`;
    if (top10.length === 0) {
      txt += "📊 Aucun commandant répertorié. Soyez le premier!";
    } else {
      top10.forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
        txt += `${medal} ${fonts.bold(u.name)}\n   💰 ${FM(u.wealth)} | 🏆 ${u.achievements} succès\n\n`;
      });
    }
    return message.reply(fonts.bold(txt));
  } catch (e) {
    console.error("Leaderboard error:", e);
    return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
  }
}

// ══════════════════════════════════════════════════════════════
//  HISTORIQUE
// ══════════════════════════════════════════════════════════════
function cmdHistory(message, galaxy) {
  const txs = galaxy.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction enregistrée."));
  let txt = `${fonts.bold("📋 HISTORIQUE (15 dernières)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txs.forEach(tx => {
    const e = getTransactionEmoji(tx.type);
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `${e} ${tx.description}\n   ${sign}${FM(tx.montant)} (${date})\n\n`;
  });
  return message.reply(fonts.bold(txt));
}

// ══════════════════════════════════════════════════════════════
//  CREDIT SCORE
// ══════════════════════════════════════════════════════════════
function cmdCreditScore(message, galaxy) {
  const score = galaxy.creditScore;
  return message.reply(fonts.bold(
    `📊 SCORE DE CRÉDIT GALACTIQUE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔢 Score: ${score}/850\n💎 Prêt max: ${FM(score * 2000)}\n🏦 Taux d'intérêt: ${score >= 750 ? "5%" : score >= 650 ? "7%" : "10%"}\n\n${fonts.bold("💡 Améliorez votre score:")}\n• Remboursez vos prêts à temps (+15 pts)\n• Evitez les prêts multiples\n• Maintenez un faible ratio dette\n• Historique d'activité régulier\n\nScore de départ: 500 | Actuel: ${score} | Variation: ${score >= 500 ? "+" : ""}${score - 500}`
  ));
}

// ══════════════════════════════════════════════════════════════
//  PREMIUM
// ══════════════════════════════════════════════════════════════
async function cmdPremium(message, args, galaxy, save) {
  const action = args[1]?.toLowerCase();
  if (!action || action !== "buy") {
    return message.reply(fonts.bold(
      `💎 PREMIUM GALACTIQUE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nStatut: ${galaxy.premium ? "✅ Actif" : "❌ Inactif"}\n\n${fonts.bold("Avantages Premium:")}\n• Multiplicateur x2 (revenus doublés)\n• Transactions prioritaires\n• Badge 💎 exclusif\n• +50% gains expéditions\n\nCoût: 500 000 Cr\nUsez: galaxy premium buy`
    ));
  }
  if (galaxy.premium) return message.reply(fonts.bold("✅ Vous êtes déjà Premium!"));
  if (galaxy.creditsNets < 500_000) return message.reply(fonts.bold(`❌ Insuffisant. Requis: 500 000 Cr\nDisponible: ${FM(galaxy.creditsNets)}`));
  galaxy.creditsNets -= 500_000;
  galaxy.premium = true;
  galaxy.multiplier = 2.0;
  await save();
  return message.reply(fonts.bold("💎 PREMIUM ACTIVÉ!\nMultiplicateur: 2x\nBienvenue dans l'élite galactique, Commandant!"));
}

// ══════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ══════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "galaxy",
    aliases: ["galactic", "stellaire", "cosmos"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🌌 Empire Galactique — Conquiers les étoiles, mine des ressources, lance des expéditions et bâtis ton empire spatial!"
    },
    category: "economy",
    guide: {
      fr: "Tapez 'galaxy help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, api, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.galaxy) user.data.galaxy = initGalaxy();

    const galaxy = user.data.galaxy;
    const walletBalance = user.money || 0;

    const grade = getGrade(galaxy);
    galaxy.grade = grade.id;

    const save = async () => {
      user.data.galaxy = galaxy;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help":
      case "aide":
        return message.reply(renderHelp());

      case "stat":
      case "status":
      case "dashboard":
      case "bal":
      case "balance":
        return message.reply(renderDashboard(galaxy, walletBalance));

      case "deposit":
      case "dep":
        return cmdDeposit(message, args, galaxy, user, save, walletBalance);

      case "withdraw":
      case "wd":
        return cmdWithdraw(message, args, galaxy, user, save);

      case "vault":
        return cmdVault(message, args, galaxy, save);

      case "loan":
        return cmdLoan(message, args, galaxy, save);

      case "repay":
        return cmdRepay(message, args, galaxy, save);

      case "interest":
        return cmdInterest(message, galaxy, save);

      case "collect":
        return cmdCollectInterest(message, galaxy, save);

      case "history":
      case "historique":
        return cmdHistory(message, galaxy);

      case "daily":
        return cmdDaily(message, galaxy, save);

      case "mine":
      case "minage":
        return cmdMinage(message, galaxy, save);

      case "secteur":
      case "sector":
      case "zone":
        return cmdSecteur(message, args, galaxy, user, save);

      case "build":
      case "construction":
        return cmdBuild(message, args, galaxy, user, save);

      case "market":
      case "marche":
        return cmdMarket(message);

      case "buy":
      case "acheter":
        return cmdBuy(message, args, galaxy, user, save);

      case "sell":
      case "vendre":
        return cmdSell(message, args, galaxy, save);

      case "inventory":
      case "inventaire":
      case "inv":
        return cmdInventory(message, galaxy);

      case "expedition":
      case "mission":
        return cmdExpedition(message, args, galaxy, save);

      case "agent":
      case "ally":
      case "allie":
        return cmdAgent(message, args, galaxy, user, save);

      case "recycle":
      case "recyclage":
        return cmdRecycle(message, args, galaxy, save);

      case "war":
      case "guerre":
        return cmdGuerre(message, args, galaxy, user, save);

      case "grade":
      case "rank":
      case "rang":
        return cmdGrade(message, galaxy);

      case "achievements":
      case "succes":
        return cmdAchievements(message, galaxy);

      case "leaderboard":
      case "classement":
        return cmdLeaderboard(message, usersData);

      case "credit":
      case "creditscore":
        return cmdCreditScore(message, galaxy);

      case "premium":
        return cmdPremium(message, args, galaxy, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'galaxy help' pour voir la liste.`));
    }
  }
};
