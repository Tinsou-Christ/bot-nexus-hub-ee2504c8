// mafia.js
"use strict";

const fonts = require('../../func/font.js');

// ─── Configuration ─────────────────────────────────────────────
const COOLDOWNS = {
  HIT:         2 * 60 * 60 * 1000,
  HEIST:       4 * 60 * 60 * 1000,
  RECRUIT:     6 * 60 * 60 * 1000,
  BOSS:        12 * 60 * 60 * 1000,
  DAILY:       24 * 60 * 60 * 1000,
  INTEL:       1 * 60 * 60 * 1000,
  CLEAN:       3 * 60 * 60 * 1000,
};

const RANKS = [
  { id: "PEON",       nom: "Pion",         min: 0,           emoji: "🪨", bonus: 0,   color: "⬛" },
  { id: "SOLDIER",    nom: "Soldat",       min: 10000,       emoji: "🔫", bonus: 0.05, color: "🟫" },
  { id: "CAPO",       nom: "Capo",         min: 100000,      emoji: "⚜️", bonus: 0.10, color: "🟥" },
  { id: "UNDERBOSS",  nom: "Sous-Boss",    min: 500000,      emoji: "🦅", bonus: 0.20, color: "🟧" },
  { id: "BOSS",       nom: "Boss",         min: 2000000,     emoji: "👹", bonus: 0.30, color: "🟨" },
  { id: "DON",        nom: "Don",          min: 10000000,    emoji: "👑", bonus: 0.50, color: "🟪" },
];

const OPERATIONS = [
  { id: "O01", nom: "Vol de voiture",      risque: 1, gain: [2000, 8000],   duree: 30,  emoji: "🚗" },
  { id: "O02", nom: "Extorsion",           risque: 2, gain: [8000, 25000],  duree: 45,  emoji: "💰" },
  { id: "O03", nom: "Braquage de bijouterie", risque: 3, gain: [30000, 90000], duree: 60, emoji: "💎" },
  { id: "O04", nom: "Trafic d'armes",      risque: 4, gain: [80000, 250000], duree: 90, emoji: "🔫" },
  { id: "O05", nom: "Casse de banque",     risque: 5, gain: [300000, 900000], duree: 120, emoji: "🏦" },
  { id: "O06", nom: "Coup d'état mafieux", risque: 6, gain: [1000000, 5000000], duree: 180, emoji: "⚔️" },
];

const CONTACTS = {
  AVOCAT:    { id: "AVOCAT",    nom: "Maître Corbin",   cout: 30000,  effet: "⬇️ Réduction peine -30%", emoji: "⚖️" },
  POLICIER:  { id: "POLICIER",  nom: "Inspecteur vénal", cout: 80000,  effet: "🛡️ Alerte raid -1",       emoji: "🚔" },
  JOURNALISTE:{ id:"JOURNALISTE",nom:"Reporter véreux",  cout: 50000,  effet: "📰 Manipulation médias",   emoji: "📰" },
  TUEUR:     { id: "TUEUR",     nom: "Le Fantôme",      cout: 200000, effet: "🗡️ Tirs critiques +25%",   emoji: "🗡️" },
  MAIRE:     { id: "MAIRE",     nom: "Maire corrompu",  cout: 500000, effet: "🏛️ Protection politique",  emoji: "🏛️" },
};

const TERRITOIRES = {
  QUARTIER:   { id: "QUARTIER",   nom: "Quartier Est",   cout: 0,      revenu: 3000,  risque: 1, emoji: "🏘️" },
  PORT:       { id: "PORT",       nom: "Port Fran",      cout: 100000, revenu: 12000, risque: 2, emoji: "⚓" },
  ENTREPOT:   { id: "ENTREPOT",   nom: "Entrepôt Nord",  cout: 300000, revenu: 30000, risque: 2, emoji: "🏭" },
  CASINO:     { id: "CASINO",     nom: "Casino Royal",   cout: 1000000,revenu: 100000,risque: 3, emoji: "🎰" },
  CENTRE:     { id: "CENTRE",     nom: "Centre-ville",   cout: 3000000,revenu: 300000,risque: 4, emoji: "🌆" },
};

const EVENEMENTS = [
  { id: "RAID",     texte: "🚨 RAID DE POLICE ! Perte de 15% de votre cash sale.",       effet: "cash_loss",   val: -0.15 },
  { id: "TRAHISON", texte: "🗡️ Un traître vous dénonce ! Vous perdez 5% de réputation.", effet: "rep_loss",    val: -0.05 },
  { id: "CACHE",    texte: "💰 Vous découvrez une cache d'argent ! +$200 000.",           effet: "cash_bonus",  val: 200000 },
  { id: "RIVAL",    texte: "⚔️ Un clan rival attaque votre territoire. Résistance.",      effet: "territoire_attaque", val: 0 },
  { id: "PROTEGE",  texte: "🌟 Un protégé prometteur vous rejoint. +10 réputation.",      effet: "rep_bonus",   val: 10 },
];

// ─── Helpers ──────────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function L(char = "─", n = 50) { return char.repeat(n); }

function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function progressBar(value, max, width = 20, filled = "█", empty = "░") {
  const pct = Math.min(1, value / max);
  const filledCount = Math.floor(pct * width);
  const emptyCount = width - filledCount;
  return filled.repeat(filledCount) + empty.repeat(emptyCount);
}

// ─── Fonctions métier ────────────────────────────────────────
function initMafia() {
  return {
    cash: 0,
    clean: 0,
    totalEarned: 0,
    rank: "PEON",
    xp: 0,
    level: 1,
    reputation: 0,
    territories: ["QUARTIER"],
    contacts: [],
    operationsDone: 0,
    operationsSuccess: 0,
    lastHit: null,
    lastHeist: null,
    lastRecruit: null,
    lastBoss: null,
    lastDaily: null,
    lastIntel: null,
    lastClean: null,
    heat: 0,
    safehouse: 1,
    ennemis: 0,
    allies: 0,
    streak: 0,
    achievements: [],
    transactions: [],
    activeOp: null,
    eventActive: null,
    eventExpire: null,
    premium: false,
    multiplier: 1,
  };
}

function getRank(mafia) {
  let r = RANKS[0];
  for (const rr of RANKS) {
    if (mafia.totalEarned >= rr.min) r = rr;
    else break;
  }
  return r;
}

function getTerritoryRevenue(mafia) {
  let total = 0;
  for (const tId of mafia.territories) {
    const t = TERRITOIRES[tId];
    if (t) total += t.revenu;
  }
  const rank = getRank(mafia);
  total += total * rank.bonus;
  return Math.floor(total * mafia.multiplier);
}

function getHeatLevel(mafia) {
  const h = mafia.heat || 0;
  if (h < 20) return { level: "Basse", emoji: "🟢", desc: "Vous êtes tranquille." };
  if (h < 50) return { level: "Moyenne", emoji: "🟡", desc: "La police vous surveille." };
  if (h < 80) return { level: "Élevée", emoji: "🟠", desc: "Vous êtes dans le viseur !" };
  return { level: "Critique", emoji: "🔴", desc: "❗ La police vous traque activement !" };
}

function checkAchievements(mafia) {
  const list = [];
  if (!mafia.achievements.includes("PREMIER_CRIME") && mafia.operationsDone >= 1)
    list.push("PREMIER_CRIME");
  if (!mafia.achievements.includes("CAPO") && mafia.rank === "CAPO")
    list.push("CAPO");
  if (!mafia.achievements.includes("DON") && mafia.rank === "DON")
    list.push("DON");
  if (!mafia.achievements.includes("TERRITOIRES_3") && mafia.territories.length >= 3)
    list.push("TERRITOIRES_3");
  if (!mafia.achievements.includes("TERRITOIRES_5") && mafia.territories.length >= 5)
    list.push("TERRITOIRES_5");
  if (!mafia.achievements.includes("CONTACTS_3") && mafia.contacts.length >= 3)
    list.push("CONTACTS_3");
  if (!mafia.achievements.includes("CONTACTS_5") && mafia.contacts.length >= 5)
    list.push("CONTACTS_5");
  if (!mafia.achievements.includes("REP_500") && mafia.reputation >= 500)
    list.push("REP_500");
  if (!mafia.achievements.includes("REP_1000") && mafia.reputation >= 1000)
    list.push("REP_1000");
  if (!mafia.achievements.includes("STREAK_7") && mafia.streak >= 7)
    list.push("STREAK_7");
  if (!mafia.achievements.includes("PREMIUM") && mafia.premium)
    list.push("PREMIUM");
  if (!mafia.achievements.includes("MILLION") && mafia.totalEarned >= 1000000)
    list.push("MILLION");
  if (!mafia.achievements.includes("DIX_MILLIONS") && mafia.totalEarned >= 10000000)
    list.push("DIX_MILLIONS");
  for (const a of list) mafia.achievements.push(a);
  return list;
}

function addTransaction(mafia, type, montant, description) {
  mafia.transactions.push({ type, montant, description, date: Date.now() });
  if (mafia.transactions.length > 30) mafia.transactions = mafia.transactions.slice(-30);
}

function getTransactionEmoji(type) {
  const map = {
    hit: "🎯", heist: "💥", recruit: "🤝", boss: "👑", daily: "🎁",
    clean: "🧼", territoire: "🗺️", contact: "📞", event: "⚡",
    reward: "💰", penalty: "💸", raid: "🚨", betrayal: "🗡️"
  };
  return map[type] || "💼";
}

// ─── Rendu Dashboard ──────────────────────────────────────────
function renderDashboard(mafia, walletBalance) {
  const rank = getRank(mafia);
  const revenue = getTerritoryRevenue(mafia);
  const heat = getHeatLevel(mafia);
  const totalWealth = walletBalance + mafia.cash + mafia.clean;

  return `
${fonts.bold("☠️  M A F I A   E M P I R E  ☠️")}
${L("═", 54)}
${fonts.bold("▸ " + rank.emoji + " " + rank.nom + "  |  Niv." + mafia.level + (mafia.premium ? "  💎 PREMIUM" : ""))}
${L("─", 54)}

${fonts.bold("💰  CASH")}          ${FM(mafia.cash)}          ${fonts.bold("🧼  BLANCHI")}      ${FM(mafia.clean)}
${fonts.bold("💳  PORTEFEUILLE")}   ${FM(walletBalance)}          ${fonts.bold("💎  PATRIMOINE")}   ${FM(totalWealth)}
${fonts.bold("📈  REVENUS")}        ${FM(revenue)}/h          ${fonts.bold("🏆  GAINS TOT.")}   ${FM(mafia.totalEarned)}

${L("─", 54)}
${fonts.bold("🔥  RÉPUTATION")}     ${progressBar(mafia.reputation, 1000, 25)}  ${mafia.reputation}/1000
${fonts.bold("👮  CHALEUR")}        ${progressBar(mafia.heat, 100, 25)}  ${heat.emoji} ${heat.level}
${fonts.bold("🏠  PLANQUE")}        Niv.${mafia.safehouse}  ${"🛡️".repeat(Math.min(mafia.safehouse, 5))}
${fonts.bold("🗺️  TERRITOIRES")}    ${mafia.territories.length}  ${fonts.bold("👥  CONTACTS")}   ${mafia.contacts.length}

${L("─", 54)}
${fonts.bold("⏳  COOLDOWNS")}
${fonts.bold("  🎯 HIT")}      ${timeLeft(mafia.lastHit, COOLDOWNS.HIT) || "✅ PRÊT"}
${fonts.bold("  💥 HEIST")}    ${timeLeft(mafia.lastHeist, COOLDOWNS.HEIST) || "✅ PRÊT"}
${fonts.bold("  🤝 RECRUT")}   ${timeLeft(mafia.lastRecruit, COOLDOWNS.RECRUIT) || "✅ PRÊT"}
${fonts.bold("  👑 BOSS")}     ${timeLeft(mafia.lastBoss, COOLDOWNS.BOSS) || "✅ PRÊT"}
${fonts.bold("  🎁 DAILY")}    ${timeLeft(mafia.lastDaily, COOLDOWNS.DAILY) || "✅ PRÊT"}

${L("─", 54)}
${fonts.bold("📊  STATS")}
${fonts.bold("  Opérations :")} ${mafia.operationsDone}  (${Math.round(mafia.operationsSuccess / (mafia.operationsDone || 1) * 100)}% succès)
${fonts.bold("  Série :")}      ${mafia.streak}j  ${fonts.bold("Succès :")} ${mafia.achievements.length}/50
`.trim();
}

// ─── Help ─────────────────────────────────────────────────────
function renderHelp() {
  return `
${fonts.bold("☠️  M A F I A   -   G U I D E")}
${L("═", 54)}

${fonts.bold("🎯  OPÉRATIONS")}
  mafia hit          - Lancer une opération (vol, extorsion...)
  mafia heist        - Braquage de grande envergure
  mafia boss         - Attaquer un territoire rival

${fonts.bold("🤝  CONTACTS & RÉSEAU")}
  mafia contacts     - Voir les contacts disponibles
  mafia recruit <ID> - Recruter un contact

${fonts.bold("🗺️  TERRITOIRES")}
  mafia turf         - Voir vos territoires
  mafia expand <ID>  - Étendre votre territoire

${fonts.bold("💰  FINANCES")}
  mafia clean <mt>   - Blanchir de l'argent (réduit la chaleur)
  mafia deposit <mt> - Déposer argent propre → portefeuille
  mafia withdraw <mt>- Retirer du portefeuille

${fonts.bold("🛡️  SÉCURITÉ")}
  mafia safehouse    - Améliorer votre planque
  mafia heat         - Voir votre niveau de surveillance

${fonts.bold("🎁  RÉCOMPENSES")}
  mafia daily        - Récompense quotidienne
  mafia premium buy  - Devenir premium (2x gains)

${fonts.bold("📊  INFORMATIONS")}
  mafia stat         - Tableau de bord complet
  mafia rank         - Progression des rangs
  mafia achievements - Succès débloqués
  mafia leaderboard  - Classement des joueurs
  mafia history      - Historique des transactions

${L("═", 54)}
${fonts.bold("💡  ASTUCE :")} La CHALEUR augmente avec les crimes. Blanchissez l'argent
et améliorez votre planque pour rester sous les radars !
`.trim();
}

// ─── Commandes ────────────────────────────────────────────────

async function cmdHit(message, args, mafia, save) {
  const cd = timeLeft(mafia.lastHit, COOLDOWNS.HIT);
  if (cd) return message.reply(fonts.bold(`⏳ Hit disponible dans ${cd}.`));

  const ops = OPERATIONS.filter(o => o.risque <= Math.floor(mafia.reputation / 100) + 1);
  if (ops.length === 0) {
    return message.reply(fonts.bold("❌ Pas d'opération disponible à votre niveau. Gagnez en réputation !"));
  }

  const op = pick(ops);
  const gain = rand(op.gain[0], op.gain[1]);
  const success = Math.random() < (0.7 - (op.risque - 1) * 0.05 + (mafia.contacts.includes("TUEUR") ? 0.15 : 0));
  const heatGain = Math.floor(op.risque * 5);

  if (success) {
    const bonus = mafia.contacts.includes("TUEUR") ? 1.25 : 1;
    const finalGain = Math.floor(gain * bonus * mafia.multiplier);
    mafia.cash += finalGain;
    mafia.totalEarned += finalGain;
    mafia.xp += op.risque * 20;
    mafia.reputation = Math.min(1000, mafia.reputation + op.risque * 5);
    mafia.operationsSuccess++;
    mafia.heat = Math.min(100, mafia.heat + heatGain);
    addTransaction(mafia, "hit", finalGain, `Hit réussi : ${op.nom}`);
    mafia.lastHit = Date.now();
    mafia.operationsDone++;
    const ach = checkAchievements(mafia);
    await save();
    let msg = `${op.emoji} ${fonts.bold("HIT RÉUSSI !")}\n${L("─", 40)}\n`;
    msg += `Opération : ${op.nom}\n`;
    msg += `💰 Gain : ${FM(finalGain)} (x${bonus.toFixed(2)} bonus)\n`;
    msg += `⭐ XP : +${op.risque * 20}\n`;
    msg += `🔥 Réputation : +${op.risque * 5}\n`;
    msg += `👮 Chaleur : +${heatGain}\n`;
    if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
    return message.reply(fonts.bold(msg));
  } else {
    const penalty = Math.floor(mafia.cash * 0.1);
    mafia.cash = Math.max(0, mafia.cash - penalty);
    mafia.heat = Math.min(100, mafia.heat + heatGain + 10);
    mafia.reputation = Math.max(0, mafia.reputation - 10);
    addTransaction(mafia, "hit", -penalty, `Hit raté : ${op.nom}`);
    mafia.lastHit = Date.now();
    mafia.operationsDone++;
    await save();
    return message.reply(fonts.bold(`
❌ ${op.emoji} HIT RATÉ !
${L("─", 40)}
Perte : ${FM(penalty)} (10% de votre cash)
👮 Chaleur : +${heatGain + 10}
📉 Réputation : -10
💡 Astuce : Recrutez un tueur pour augmenter vos chances !
		`));
  }
}

async function cmdHeist(message, args, mafia, save) {
  const cd = timeLeft(mafia.lastHeist, COOLDOWNS.HEIST);
  if (cd) return message.reply(fonts.bold(`⏳ Heist disponible dans ${cd}.`));

  if (mafia.territories.length < 2) {
    return message.reply(fonts.bold("❌ Il vous faut au moins 2 territoires pour organiser un casse."));
  }

  const risk = mafia.heat / 100 * 0.5 + 0.3;
  const success = Math.random() < (0.6 - risk + (mafia.contacts.includes("POLICIER") ? 0.15 : 0));
  const baseGain = rand(50000, 200000);

  if (success) {
    const gain = Math.floor(baseGain * mafia.multiplier);
    mafia.cash += gain;
    mafia.totalEarned += gain;
    mafia.xp += 100;
    mafia.reputation = Math.min(1000, mafia.reputation + 30);
    mafia.heat = Math.min(100, mafia.heat + 25);
    addTransaction(mafia, "heist", gain, "Casse réussi");
    mafia.lastHeist = Date.now();
    const ach = checkAchievements(mafia);
    await save();
    let msg = `💥 ${fonts.bold("CASSE RÉUSSI !")}\n${L("─", 40)}\n`;
    msg += `💰 Gain : ${FM(gain)}\n`;
    msg += `⭐ XP : +100\n`;
    msg += `🔥 Réputation : +30\n`;
    msg += `👮 Chaleur : +25\n`;
    if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
    return message.reply(fonts.bold(msg));
  } else {
    const loss = Math.floor(mafia.cash * 0.2);
    mafia.cash = Math.max(0, mafia.cash - loss);
    mafia.heat = Math.min(100, mafia.heat + 40);
    mafia.reputation = Math.max(0, mafia.reputation - 20);
    addTransaction(mafia, "heist", -loss, "Casse raté");
    mafia.lastHeist = Date.now();
    await save();
    return message.reply(fonts.bold(`
❌ CASSE RATÉ !
${L("─", 40)}
Perte : ${FM(loss)} (20% de votre cash)
👮 Chaleur : +40
📉 Réputation : -20
💡 Baissez votre chaleur avant de retenter !
		`));
  }
}

async function cmdContacts(message, mafia) {
  let txt = `${fonts.bold("🤝  CONTACTS DISPONIBLES")}\n${L("═", 40)}\n\n`;
  for (const [id, c] of Object.entries(CONTACTS)) {
    const owned = mafia.contacts.includes(id);
    txt += `${c.emoji} ${c.nom} [${id}]\n`;
    txt += `   💰 Coût : ${FM(c.cout)}\n`;
    txt += `   ✨ Effet : ${c.effet}\n`;
    txt += `   ${owned ? "✅ RECRUTÉ" : "🔒 Disponible"}\n\n`;
  }
  txt += `Recruter : mafia recruit <ID>`;
  return message.reply(txt);
}

async function cmdRecruit(message, args, mafia, user, save) {
  const cd = timeLeft(mafia.lastRecruit, COOLDOWNS.RECRUIT);
  if (cd) return message.reply(fonts.bold(`⏳ Recrutement disponible dans ${cd}.`));

  const contactId = args[1]?.toUpperCase();
  if (!contactId) return cmdContacts(message, mafia);

  const contact = CONTACTS[contactId];
  if (!contact) return message.reply(fonts.bold("❌ Contact inconnu."));
  if (mafia.contacts.includes(contactId)) return message.reply(fonts.bold("❌ Vous avez déjà ce contact."));

  const totalCash = (user.money || 0) + mafia.cash + mafia.clean;
  if (totalCash < contact.cout) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${FM(contact.cout)}, disponible : ${FM(totalCash)}`));
  }

  let reste = contact.cout;
  if (mafia.cash >= reste) {
    mafia.cash -= reste;
    reste = 0;
  } else {
    reste -= mafia.cash;
    mafia.cash = 0;
    if (mafia.clean >= reste) {
      mafia.clean -= reste;
      reste = 0;
    } else {
      reste -= mafia.clean;
      mafia.clean = 0;
      user.money = (user.money || 0) - reste;
    }
  }

  mafia.contacts.push(contactId);
  mafia.reputation = Math.min(1000, mafia.reputation + 15);
  addTransaction(mafia, "contact", -contact.cout, `Recrutement : ${contact.nom}`);
  mafia.lastRecruit = Date.now();
  const ach = checkAchievements(mafia);
  await save();

  let msg = `${contact.emoji} ${fonts.bold("CONTACT RECRUTÉ : " + contact.nom)}\n${L("─", 40)}\n`;
  msg += `💵 Coût : ${FM(contact.cout)}\n`;
  msg += `✨ Effet : ${contact.effet}\n`;
  msg += `🔥 Réputation : +15`;
  if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
  return message.reply(fonts.bold(msg));
}

async function cmdTurf(message, mafia) {
  let txt = `${fonts.bold("🗺️  TERRITOIRES")}\n${L("═", 40)}\n\n`;
  txt += `${fonts.bold("Vos territoires :")}\n`;
  for (const tId of mafia.territories) {
    const t = TERRITOIRES[tId];
    if (t) {
      txt += `${t.emoji} ${t.nom} — 💰 ${FM(t.revenu)}/h — ⚠️ Risque ${t.risque}\n`;
    }
  }
  txt += `\n${fonts.bold("Territoires disponibles :")}\n`;
  for (const [id, t] of Object.entries(TERRITOIRES)) {
    if (!mafia.territories.includes(id)) {
      txt += `  ${t.emoji} ${t.nom} [${id}] — ${FM(t.cout)} — ⚠️ ${t.risque}\n`;
    }
  }
  txt += `\n💡 Étendre : mafia expand <ID>`;
  return message.reply(txt);
}

async function cmdExpand(message, args, mafia, user, save) {
  const tId = args[1]?.toUpperCase();
  const t = TERRITOIRES[tId];
  if (!t) return message.reply(fonts.bold("❌ Territoire inconnu."));
  if (mafia.territories.includes(tId)) return message.reply(fonts.bold("❌ Vous possédez déjà ce territoire."));

  const totalCash = (user.money || 0) + mafia.cash + mafia.clean;
  if (totalCash < t.cout) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${FM(t.cout)}, disponible : ${FM(totalCash)}`));
  }

  let reste = t.cout;
  if (mafia.cash >= reste) {
    mafia.cash -= reste;
    reste = 0;
  } else {
    reste -= mafia.cash;
    mafia.cash = 0;
    if (mafia.clean >= reste) {
      mafia.clean -= reste;
      reste = 0;
    } else {
      reste -= mafia.clean;
      mafia.clean = 0;
      user.money = (user.money || 0) - reste;
    }
  }

  mafia.territories.push(tId);
  mafia.reputation = Math.min(1000, mafia.reputation + t.risque * 10);
  addTransaction(mafia, "territoire", -t.cout, `Expansion : ${t.nom}`);
  const ach = checkAchievements(mafia);
  await save();

  let msg = `${t.emoji} ${fonts.bold("TERRITOIRE CONQUIS : " + t.nom)}\n${L("─", 40)}\n`;
  msg += `💵 Coût : ${FM(t.cout)}\n`;
  msg += `📈 Revenu : +${FM(t.revenu)}/h\n`;
  msg += `🔥 Réputation : +${t.risque * 10}`;
  if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
  return message.reply(fonts.bold(msg));
}

async function cmdClean(message, args, mafia, user, save) {
  const cd = timeLeft(mafia.lastClean, COOLDOWNS.CLEAN);
  if (cd) return message.reply(fonts.bold(`⏳ Blanchiment disponible dans ${cd}.`));

  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(`
🧼 BLANCHIMENT
${L("═", 40)}
Cash sale : ${FM(mafia.cash)}
Taux de blanchiment : 70% (perte 30%)
Chaleur réduite : -10 points

Usage : mafia clean <montant>
		`));
  }

  if (mafia.cash < amount) {
    return message.reply(fonts.bold(`❌ Cash insuffisant. Vous avez ${FM(mafia.cash)}.`));
  }

  const cleaned = Math.floor(amount * 0.7);
  mafia.cash -= amount;
  mafia.clean += cleaned;
  mafia.heat = Math.max(0, mafia.heat - 10);
  mafia.lastClean = Date.now();
  addTransaction(mafia, "clean", cleaned, `Blanchiment de ${FM(amount)}`);
  await save();

  return message.reply(fonts.bold(`
🧼 BLANCHIMENT EFFECTUÉ
${L("─", 40)}
Montant blanchi : ${FM(amount)}
Récupéré : ${FM(cleaned)} (70%)
Perte : ${FM(amount - cleaned)}
👮 Chaleur : -10
📊 Cash restant : ${FM(mafia.cash)}
🧼 Argent propre : ${FM(mafia.clean)}
		`));
}

async function cmdDeposit(message, args, mafia, user, save) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(`Usage : mafia deposit <montant>  (argent propre → portefeuille)`));
  }
  if (mafia.clean < amount) {
    return message.reply(fonts.bold(`❌ Argent propre insuffisant. Vous avez ${FM(mafia.clean)}.`));
  }
  mafia.clean -= amount;
  user.money = (user.money || 0) + amount;
  addTransaction(mafia, "deposit", amount, "Dépôt vers portefeuille");
  await save();
  return message.reply(fonts.bold(`✅ ${FM(amount)} transféré vers votre portefeuille.`));
}

async function cmdWithdraw(message, args, mafia, user, save) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return message.reply(fonts.bold(`Usage : mafia withdraw <montant>  (portefeuille → argent propre)`));
  }
  if ((user.money || 0) < amount) {
    return message.reply(fonts.bold(`❌ Portefeuille insuffisant. Vous avez ${FM(user.money || 0)}.`));
  }
  user.money = (user.money || 0) - amount;
  mafia.clean += amount;
  addTransaction(mafia, "withdraw", amount, "Retrait vers argent propre");
  await save();
  return message.reply(fonts.bold(`✅ ${FM(amount)} transféré vers votre argent propre.`));
}

async function cmdDaily(message, mafia, save) {
  const cd = timeLeft(mafia.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`⏳ Daily disponible dans ${cd}.`));

  if (Date.now() - (mafia.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
    mafia.streak++;
  } else {
    mafia.streak = 1;
  }

  const base = 5000 + mafia.level * 1000 + mafia.streak * 500;
  const bonus = mafia.premium ? 2 : 1;
  const reward = Math.floor(base * bonus);
  mafia.cash += reward;
  mafia.totalEarned += reward;
  mafia.lastDaily = Date.now();
  addTransaction(mafia, "daily", reward, `Daily (série ${mafia.streak}j)`);
  const ach = checkAchievements(mafia);
  await save();

  let msg = `🎁 ${fonts.bold("RÉCOMPENSE QUOTIDIENNE")}\n${L("─", 40)}\n`;
  msg += `💰 Récompense : ${FM(reward)}\n`;
  msg += `🔥 Série : ${mafia.streak} jours\n`;
  msg += `⭐ Premium : ${mafia.premium ? "2x" : "Non"}`;
  if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
  return message.reply(fonts.bold(msg));
}

async function cmdSafehouse(message, mafia, user, save) {
  const cost = mafia.safehouse * 50000;
  const totalCash = (user.money || 0) + mafia.cash + mafia.clean;
  if (totalCash < cost) {
    return message.reply(fonts.bold(`❌ Amélioration de planque coûte ${FM(cost)}. Disponible : ${FM(totalCash)}`));
  }
  let reste = cost;
  if (mafia.cash >= reste) {
    mafia.cash -= reste;
    reste = 0;
  } else {
    reste -= mafia.cash;
    mafia.cash = 0;
    if (mafia.clean >= reste) {
      mafia.clean -= reste;
      reste = 0;
    } else {
      reste -= mafia.clean;
      mafia.clean = 0;
      user.money = (user.money || 0) - reste;
    }
  }
  mafia.safehouse++;
  addTransaction(mafia, "safehouse", -cost, `Amélioration planque Niv.${mafia.safehouse}`);
  await save();
  return message.reply(fonts.bold(`
🏠 PLANQUE AMÉLIORÉE !
${L("─", 40)}
Nouveau niveau : ${mafia.safehouse}
🛡️ Protection accrue contre les raids
💵 Coût : ${FM(cost)}
		`));
}

async function cmdHeat(message, mafia) {
  const heat = getHeatLevel(mafia);
  return message.reply(fonts.bold(`
👮 NIVEAU DE CHALEUR
${L("═", 40)}
${heat.emoji} ${heat.level} — ${heat.desc}
📊 Chaleur : ${mafia.heat}/100
${progressBar(mafia.heat, 100, 30)}

💡 Réduire la chaleur :
  • Blanchir de l'argent (mafia clean)
  • Améliorer la planque (mafia safehouse)
  • Éviter les crimes trop risqués
		`));
}

async function cmdRank(message, mafia) {
  const rank = getRank(mafia);
  const nextIndex = RANKS.findIndex(r => r.id === rank.id) + 1;
  const next = RANKS[nextIndex] || null;

  let txt = `${rank.emoji} ${fonts.bold("RANG : " + rank.nom)}\n${L("═", 40)}\n`;
  txt += `📊 Gains totaux : ${FM(mafia.totalEarned)}\n`;
  txt += `⭐ XP : ${mafia.xp}\n`;
  txt += `🔥 Réputation : ${mafia.reputation}/1000\n`;
  txt += `📈 Bonus revenus : +${pct(rank.bonus)}\n\n`;
  if (next) {
    const manque = next.min - mafia.totalEarned;
    txt += `${L("─", 40)}\n⬆️ Prochain rang : ${next.emoji} ${next.nom}\n`;
    txt += `   Requis : ${FM(next.min)} gains totaux\n`;
    txt += `   Manque : ${FM(Math.max(0, manque))}\n`;
  } else {
    txt += `👑 Vous avez atteint le rang MAXIMUM !\n`;
  }
  txt += `\n${L("─", 40)}\n${fonts.bold("📜 TOUS LES RANGS :")}\n`;
  for (const r of RANKS) {
    const actif = r.id === rank.id;
    txt += `${actif ? "▶️ " : "   "}${r.emoji} ${r.nom} — dès ${FM(r.min)}\n`;
  }
  return message.reply(txt);
}

async function cmdAchievements(message, mafia) {
  const achievementsList = {
    PREMIER_CRIME: { emoji: "🎯", nom: "Premier Crime", desc: "Réaliser votre première opération" },
    CAPO: { emoji: "⚜️", nom: "Capo", desc: "Atteindre le rang Capo" },
    DON: { emoji: "👑", nom: "Don", desc: "Atteindre le rang Don" },
    TERRITOIRES_3: { emoji: "🗺️", nom: "3 Territoires", desc: "Posséder 3 territoires" },
    TERRITOIRES_5: { emoji: "🌆", nom: "5 Territoires", desc: "Posséder 5 territoires" },
    CONTACTS_3: { emoji: "🤝", nom: "3 Contacts", desc: "Recruter 3 contacts" },
    CONTACTS_5: { emoji: "📞", nom: "5 Contacts", desc: "Recruter 5 contacts" },
    REP_500: { emoji: "🔥", nom: "Réputation 500", desc: "Atteindre 500 de réputation" },
    REP_1000: { emoji: "⭐", nom: "Réputation 1000", desc: "Atteindre 1000 de réputation" },
    STREAK_7: { emoji: "🔥", nom: "Série 7 jours", desc: "Maintenir une série de 7 jours" },
    PREMIUM: { emoji: "💎", nom: "Premium", desc: "Devenir premium" },
    MILLION: { emoji: "💰", nom: "Millionnaire", desc: "Gagner 1 000 000$ au total" },
    DIX_MILLIONS: { emoji: "🤑", nom: "10 Millions", desc: "Gagner 10 000 000$ au total" },
  };

  let txt = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n${L("═", 40)}\n`;
  txt += `${fonts.bold("Progression :")} ${mafia.achievements.length}/${Object.keys(achievementsList).length}\n\n`;
  if (mafia.achievements.length === 0) {
    txt += "🎯 Aucun succès pour le moment.\n";
  } else {
    txt += `${fonts.bold("🎖️ DÉBLOQUÉS :")}\n`;
    for (const ach of mafia.achievements.slice(0, 10)) {
      const info = achievementsList[ach] || { emoji: "🏆", nom: ach };
      txt += `• ${info.emoji} ${info.nom}\n`;
    }
    if (mafia.achievements.length > 10) txt += `... et ${mafia.achievements.length - 10} de plus !\n`;
    txt += "\n";
  }
  txt += `${fonts.bold("🎯 PROCHAINS OBJECTIFS :")}\n`;
  const remaining = Object.keys(achievementsList).filter(a => !mafia.achievements.includes(a));
  for (const ach of remaining.slice(0, 5)) {
    const info = achievementsList[ach];
    txt += `• ${info.emoji} ${info.nom} : ${info.desc}\n`;
  }
  return message.reply(txt);
}

async function cmdLeaderboard(message, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const joueurs = [];
    for (const [uid, u] of Object.entries(allUsers)) {
      const m = u.data?.mafia;
      if (m && m.totalEarned > 0) {
        joueurs.push({
          uid,
          nom: u.name || `User ${uid.slice(-4)}`,
          totalEarned: m.totalEarned,
          rank: getRank(m).nom,
          rankEmoji: getRank(m).emoji,
          premium: m.premium || false,
          achievements: m.achievements?.length || 0,
        });
      }
    }
    joueurs.sort((a, b) => b.totalEarned - a.totalEarned);
    const top10 = joueurs.slice(0, 10);

    let txt = `${fonts.bold("👑 CLASSEMENT MAFIA")}\n${L("═", 50)}\n`;
    txt += `${fonts.bold("TOP 10 DES PARRAINS")}\n\n`;
    if (top10.length === 0) {
      txt += "📊 Aucun joueur classé pour le moment.";
    } else {
      for (let i = 0; i < top10.length; i++) {
        const j = top10[i];
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        const crown = i === 0 ? " 👑" : i === 1 ? " ⭐" : i === 2 ? " ✨" : "";
        const premiumIcon = j.premium ? " 💎" : "";
        txt += `${medal} ${fonts.bold(j.nom)}${crown}${premiumIcon}\n`;
        txt += `   ${j.rankEmoji} Rang : ${j.rank}\n`;
        txt += `   💰 Gains : ${FM(j.totalEarned)}`;
        if (j.achievements > 0) txt += ` | 🏆 ${j.achievements} succès`;
        txt += `\n\n`;
      }
    }
    return message.reply(txt);
  } catch (e) {
    console.error("Leaderboard error:", e);
    return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
  }
}

async function cmdHistory(message, mafia) {
  const txs = mafia.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction."));

  let txt = `${fonts.bold("📋 HISTORIQUE (15 dernières)")}\n${L("═", 50)}\n\n`;
  for (const tx of txs) {
    const e = getTransactionEmoji(tx.type);
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `${e} ${tx.description}\n   ${sign}${FM(tx.montant)} (${date})\n\n`;
  }
  return message.reply(txt);
}

async function cmdPremium(message, args, mafia, user, save) {
  const action = args[1]?.toLowerCase();
  if (action === "buy") {
    const cost = 500000;
    const totalCash = (user.money || 0) + mafia.cash + mafia.clean;
    if (totalCash < cost) {
      return message.reply(fonts.bold(`❌ Premium coûte ${FM(cost)}. Disponible : ${FM(totalCash)}`));
    }
    let reste = cost;
    if (mafia.cash >= reste) {
      mafia.cash -= reste;
      reste = 0;
    } else {
      reste -= mafia.cash;
      mafia.cash = 0;
      if (mafia.clean >= reste) {
        mafia.clean -= reste;
        reste = 0;
      } else {
        reste -= mafia.clean;
        mafia.clean = 0;
        user.money = (user.money || 0) - reste;
      }
    }
    mafia.premium = true;
    mafia.multiplier = 2;
    addTransaction(mafia, "premium", -cost, "Achat Premium");
    const ach = checkAchievements(mafia);
    await save();
    let msg = `💎 ${fonts.bold("PREMIUM ACTIVÉ !")}\n${L("─", 40)}\n`;
    msg += `✅ Tous vos gains sont doublés !\n`;
    if (ach.length) msg += `\n🏆 Succès : ${ach.join(", ")}`;
    return message.reply(fonts.bold(msg));
  }
  return message.reply(fonts.bold(`
💎 PREMIUM
${L("═", 40)}
Statut : ${mafia.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur : ${mafia.multiplier}x
Coût : ${FM(500000)}
${!mafia.premium ? "\nUtilisez 'mafia premium buy' pour devenir premium !" : ""}
	`));
}

// ─── Export ──────────────────────────────────────────────────
module.exports = {
  config: {
    name: "mafia",
    aliases: [],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "☠️ Gestion d'un empire criminel avec système de chaleur, contacts et territoires." },
    category: "economy",
    guide: { fr: "Tapez 'mafia help' pour voir toutes les commandes." }
  },

  onStart: async function ({ message, event, args, api, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.mafia) user.data.mafia = initMafia();

    const mafia = user.data.mafia;
    const walletBalance = user.money || 0;

    const rank = getRank(mafia);
    mafia.rank = rank.id;

    const save = async () => {
      user.data.mafia = mafia;
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
        return message.reply(renderDashboard(mafia, walletBalance));

      case "deposit":
        return cmdDeposit(message, args, mafia, user, save);
      case "withdraw":
        return cmdWithdraw(message, args, mafia, user, save);
      case "clean":
        return cmdClean(message, args, mafia, user, save);

      case "hit":
        return cmdHit(message, args, mafia, save);
      case "heist":
        return cmdHeist(message, args, mafia, save);
      case "boss":
        // Similaire à heist mais avec plus de risques et gains
        return message.reply(fonts.bold("⚔️ Commande en développement..."));

      case "contacts":
        return cmdContacts(message, mafia);
      case "recruit":
        return cmdRecruit(message, args, mafia, user, save);

      case "turf":
        return cmdTurf(message, mafia);
      case "expand":
        return cmdExpand(message, args, mafia, user, save);

      case "safehouse":
        return cmdSafehouse(message, mafia, user, save);
      case "heat":
        return cmdHeat(message, mafia);

      case "daily":
        return cmdDaily(message, mafia, save);
      case "premium":
        return cmdPremium(message, args, mafia, user, save);

      case "rank":
      case "rang":
        return cmdRank(message, mafia);
      case "achievements":
      case "succes":
        return cmdAchievements(message, mafia);
      case "leaderboard":
      case "classement":
        return cmdLeaderboard(message, usersData);
      case "history":
      case "historique":
        return cmdHistory(message, mafia);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'mafia help' pour voir la liste.`));
    }
  }
};