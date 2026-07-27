"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
  RECOLTE:    45 * 60 * 1000,
  TAXE:       3  * 60 * 60 * 1000,
  SIEGE:      6  * 60 * 60 * 1000,
  RAID:       2  * 60 * 60 * 1000,
  QUETE:      4  * 60 * 60 * 1000,
  TOURNOI:    8  * 60 * 60 * 1000,
  DAILY:      24 * 60 * 60 * 1000,
  ENTRAINEMENT: 2 * 60 * 60 * 1000,
  DIPLOMATIE: 5  * 60 * 60 * 1000,
};

const TITRES = [
  { id: "PAYSAN",    nom: "Paysan Libre",      min: 0,           emoji: "🌾", bonus: 0,    prestige: 0   },
  { id: "ECUYER",    nom: "Écuyer",            min: 8_000,       emoji: "🛡️", bonus: 0.05, prestige: 10  },
  { id: "CHEVALIER", nom: "Chevalier",         min: 60_000,      emoji: "⚔️", bonus: 0.10, prestige: 25  },
  { id: "BARON",     nom: "Baron",             min: 300_000,     emoji: "🏰", bonus: 0.18, prestige: 50  },
  { id: "COMTE",     nom: "Comte",             min: 1_200_000,   emoji: "👑", bonus: 0.28, prestige: 100 },
  { id: "DUC",       nom: "Duc",               min: 6_000_000,   emoji: "🗝️", bonus: 0.40, prestige: 200 },
  { id: "ROI",       nom: "Roi",               min: 30_000_000,  emoji: "👑", bonus: 0.55, prestige: 400 },
  { id: "EMPEREUR",  nom: "Empereur des Terres",min:150_000_000, emoji: "🏛️", bonus: 0.75, prestige: 800 },
];

const CHATEAUX = {
  CABANE:    { id: "CABANE",   nom: "Cabane de Bois",   cout: 0,          defense: 50,   tresorerie: 500,    emoji: "🛖" },
  MANOIR:    { id: "MANOIR",   nom: "Manoir Fortifié",  cout: 15_000,     defense: 150,  tresorerie: 2_000,  emoji: "🏠" },
  CHATEAU:   { id: "CHATEAU",  nom: "Château de Pierre",cout: 100_000,    defense: 400,  tresorerie: 8_000,  emoji: "🏰" },
  FORTERESSE:{ id: "FORTERESSE",nom:"Forteresse Royale",cout: 800_000,    defense: 900,  tresorerie: 30_000, emoji: "🏯" },
  CITADELLE: { id: "CITADELLE",nom: "Citadelle Impériale",cout:5_000_000, defense: 2_000,tresorerie: 100_000,emoji: "🗼" },
  PALAIS:    { id: "PALAIS",   nom: "Palais des Légendes",cout:30_000_000,defense: 5_000,tresorerie: 500_000,emoji: "🏛️" },
};

const TERRES = {
  CHAMPS:    { id: "CHAMPS",   nom: "Champs de Blé",    cout: 3_000,    revenu: 800,    emoji: "🌾" },
  VERGER:    { id: "VERGER",   nom: "Verger Fruitier",  cout: 6_000,    revenu: 1_500,  emoji: "🍎" },
  MINE:      { id: "MINE",     nom: "Mine de Fer",      cout: 20_000,   revenu: 5_000,  emoji: "⛏️" },
  CARRIERE:  { id: "CARRIERE", nom: "Carrière de Pierre",cout: 35_000,  revenu: 9_000,  emoji: "🪨" },
  MINE_OR:   { id: "MINE_OR",  nom: "Mine d'Or",        cout: 150_000,  revenu: 40_000, emoji: "🪙" },
  FORET:     { id: "FORET",    nom: "Forêt Royale",     cout: 80_000,   revenu: 20_000, emoji: "🌲" },
};

const UNITES = {
  PAYSAN_ARME:{ id: "PAYSAN_ARME",nom: "Paysan Armé",   cout: 200,    force: 5,   entretien: 10,  emoji: "🥄" },
  ARCHER:     { id: "ARCHER",     nom: "Archer",         cout: 800,    force: 15,  entretien: 30,  emoji: "🏹" },
  FANTASSIN:  { id: "FANTASSIN",  nom: "Fantassin",     cout: 1_500,  force: 25,  entretien: 50,  emoji: "🗡️" },
  CAVALIER:   { id: "CAVALIER",   nom: "Cavalier",      cout: 4_000,  force: 60,  entretien: 120, emoji: "🐎" },
  CHEVALIER_U:{ id: "CHEVALIER_U",nom: "Chevalier Lourd",cout: 12_000, force: 150, entretien: 300, emoji: "⚔️" },
  CATAPULTE:  { id: "CATAPULTE",  nom: "Catapulte",     cout: 30_000, force: 400, entretien: 600, emoji: "🎯" },
  DRAGON:     { id: "DRAGON",     nom: "Dragon Apprivoisé",cout:500_000,force:3000, entretien: 8_000,emoji: "🐉" },
};

const CONSEILLERS = {
  INTENDANT:  { id: "INTENDANT",  nom: "Intendant",       cout: 25_000,  effet: "+15% revenus des terres",   emoji: "📜", bonus_terres: 0.15  },
  MARECHAL:   { id: "MARECHAL",   nom: "Maréchal",        cout: 60_000,  effet: "+20% force armée",          emoji: "🎖️", bonus_armee: 0.20   },
  ESPION:     { id: "ESPION",     nom: "Maître Espion",   cout: 40_000,  effet: "+25% succès raids",          emoji: "🗿", bonus_raid: 0.25    },
  ARCHITECTE: { id: "ARCHITECTE", nom: "Architecte Royal", cout: 80_000, effet: "-20% coût constructions",   emoji: "📐", bonus_construction: 0.20 },
  DIPLOMATE:  { id: "DIPLOMATE",  nom: "Diplomate",       cout: 50_000,  effet: "+30% gains diplomatie",      emoji: "🕊️", bonus_diplo: 0.30   },
  ALCHIMISTE: { id: "ALCHIMISTE", nom: "Alchimiste",      cout: 200_000, effet: "+50% trésor des quêtes",    emoji: "⚗️", bonus_quete: 0.50   },
};

const QUETES = [
  { nom: "Chasser les loups-garous", or_min: 2_000,   or_max: 10_000,   danger: 15, emoji: "🐺" },
  { nom: "Explorer la crypte oubliée",or_min: 8_000,   or_max: 40_000,   danger: 30, emoji: "⚰️" },
  { nom: "Vaincre le Chevalier Noir", or_min: 25_000,  or_max: 120_000,  danger: 45, emoji: "🖤" },
  { nom: "Terrasser le Dragon Ancien",or_min: 100_000, or_max: 600_000,  danger: 65, emoji: "🐲" },
  { nom: "Affronter le Roi-Liche",    or_min: 500_000, or_max: 3_000_000,danger: 80, emoji: "💀" },
];

const CIBLES_RAID = [
  { nom: "Caravane marchande",  butin_min: 1_500,   butin_max: 8_000,    resistance: 10, emoji: "🐴", prestige_gain: 3  },
  { nom: "Village voisin",      butin_min: 5_000,   butin_max: 30_000,   resistance: 25, emoji: "🏘️", prestige_gain: 8  },
  { nom: "Garnison frontalière",butin_min: 20_000,  butin_max: 100_000,  resistance: 45, emoji: "🛡️", prestige_gain: 20 },
  { nom: "Domaine d'un Baron",   butin_min: 80_000,  butin_max: 400_000,  resistance: 60, emoji: "🏰", prestige_gain: 40 },
  { nom: "Trésor d'un Comté",    butin_min: 300_000, butin_max: 1_500_000,resistance: 75, emoji: "👑", prestige_gain: 100},
];

const EVENEMENTS_DIPLO = [
  { nom: "Banquet royal",        gain_min: 1_000,  gain_max: 8_000,    risque: 20, emoji: "🍷" },
  { nom: "Mariage arrangé",      gain_min: 5_000,  gain_max: 30_000,   risque: 30, emoji: "💍" },
  { nom: "Alliance commerciale", gain_min: 0,      gain_max: 0,        risque: 0,  emoji: "🤝", special: "terre"     },
  { nom: "Traité de paix",       gain_min: 0,      gain_max: 0,        risque: 0,  emoji: "🕊️", special: "prestige" },
  { nom: "Visite d'ambassadeur", gain_min: 0,      gain_max: 0,        risque: 0,  emoji: "📯", special: "soldat"   },
  { nom: "Complot déjoué",       gain_min: -15_000,gain_max: -2_000,   risque: 100,emoji: "🗡️" },
];

const OR  = (n) => `🪙 ${Math.floor(n).toLocaleString("fr-FR")}`;
const F   = (n) => Math.floor(n).toLocaleString("fr-FR");
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
function blason(val, max, len = 16) {
  const p = Math.min(val, max) / max;
  const f = Math.round(p * len);
  return `🟨`.repeat(f) + `⬛`.repeat(len - f);
}
function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getTitre(royaume) {
  let t = TITRES[0];
  for (const tt of TITRES) {
    if (royaume.totalAmasse >= tt.min) t = tt;
    else break;
  }
  return t;
}

function getForceArmee(royaume) {
  let force = 0;
  for (const [id, qte] of Object.entries(royaume.armee)) {
    force += (UNITES[id]?.force || 0) * qte;
  }
  const bonusMarechal = royaume.conseillers.includes("MARECHAL") ? CONSEILLERS.MARECHAL.bonus_armee : 0;
  return Math.floor(force * (1 + bonusMarechal));
}

function getEntretienTotal(royaume) {
  let cout = 0;
  for (const [id, qte] of Object.entries(royaume.armee)) {
    cout += (UNITES[id]?.entretien || 0) * qte;
  }
  return cout;
}

function getConseillerBonus(royaume, key) {
  let bonus = 0;
  for (const cId of royaume.conseillers) {
    const c = CONSEILLERS[cId];
    if (c && c[key]) bonus += c[key];
  }
  return bonus;
}

function initRoyaume() {
  return {
    or:              1_000,
    totalAmasse:     0,
    totalDepense:    0,
    chateau:         "CABANE",
    terres:          {},
    armee:           {},
    moralTroupes:    100,
    conseillers:     [],
    titre:           "PAYSAN",
    prestige:        0,
    sieges:          { wins: 0, losses: 0 },
    raids:           0,
    quetes:          0,
    tournois:        { wins: 0, losses: 0 },
    constructions:   0,
    lastRecolte:     null,
    lastTaxe:        null,
    lastSiege:       null,
    lastRaid:        null,
    lastQuete:       null,
    lastTournoi:     null,
    lastDaily:       null,
    lastEntrainement:null,
    lastDiplomatie:  null,
    streak:          0,
    achievements:    [],
    transactions:    [],
    premium:         false,
  };
}

function addTx(royaume, type, montant, desc) {
  royaume.transactions.push({ type, montant, description: desc, date: Date.now() });
  if (royaume.transactions.length > 40) royaume.transactions = royaume.transactions.slice(-40);
}

function checkAchievements(royaume) {
  const defs = [
    { id: "PREMIER_OR",       check: r => r.totalAmasse >= 1 },
    { id: "PREMIERE_TERRE",   check: r => Object.keys(r.terres).length >= 1 },
    { id: "PREMIERE_UNITE",   check: r => Object.keys(r.armee).length >= 1 },
    { id: "PREMIER_SIEGE",    check: r => r.sieges.wins + r.sieges.losses >= 1 },
    { id: "DIX_SIEGES_GAGNES",check: r => r.sieges.wins >= 10 },
    { id: "PREMIERE_QUETE",   check: r => r.quetes >= 1 },
    { id: "DRAGON_VAINCU",    check: r => r.quetes >= 5 },
    { id: "CHEVALIER",        check: r => r.titre === "CHEVALIER" },
    { id: "ROI",              check: r => r.titre === "ROI" },
    { id: "EMPEREUR",         check: r => r.titre === "EMPEREUR" },
    { id: "CHATEAU_FORT",     check: r => ["FORTERESSE","CITADELLE","PALAIS"].includes(r.chateau) },
    { id: "PALAIS_LEGENDE",   check: r => r.chateau === "PALAIS" },
    { id: "MILLIONNAIRE",     check: r => r.totalAmasse >= 1_000_000 },
    { id: "DIX_MILLIONS",     check: r => r.totalAmasse >= 10_000_000 },
    { id: "CENT_MILLIONS",    check: r => r.totalAmasse >= 100_000_000 },
    { id: "PRESTIGE_100",     check: r => r.prestige >= 100 },
    { id: "PRESTIGE_500",     check: r => r.prestige >= 500 },
    { id: "CONSEIL_COMPLET",  check: r => r.conseillers.length >= 6 },
    { id: "STREAKER_7",       check: r => r.streak >= 7 },
  ];
  const nouveaux = [];
  for (const d of defs) {
    if (!royaume.achievements.includes(d.id) && d.check(royaume)) {
      royaume.achievements.push(d.id);
      nouveaux.push(d.id);
    }
  }
  return nouveaux;
}

function renderDashboard(royaume) {
  const titre   = getTitre(royaume);
  const chateau = CHATEAUX[royaume.chateau];
  const force   = getForceArmee(royaume);
  const entretien = getEntretienTotal(royaume);
  const nbTerres  = Object.values(royaume.terres).reduce((s, q) => s + q, 0);
  const nbUnites  = Object.values(royaume.armee).reduce((s, q) => s + q, 0);
  const moralBlason = blason(royaume.moralTroupes, 100);

  const lignes = [
    fonts.bold("⚔️  ROYAUME ÉTERNEL  👑"),
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    `   ${fonts.bold(titre.emoji + "  " + titre.nom.toUpperCase())}`,
    `   ${fonts.serif(chateau.emoji + " " + chateau.nom)}`,
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "",
    fonts.bold("🪙  TRÉSORERIE ROYALE"),
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    `   Or en coffre     ${fonts.bold(OR(royaume.or))}`,
    `   Total amassé     ${fonts.bold(OR(royaume.totalAmasse))}`,
    "",
    fonts.bold("🏰  DOMAINE"),
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    `   Château          ${chateau.emoji} ${chateau.nom}`,
    `   Défense          🛡️ ${chateau.defense}`,
    `   Terres acquises  🌾 ${nbTerres}`,
    `   Conseillers      📜 ${royaume.conseillers.length}/6`,
    "",
    fonts.bold("⚔️  ARMÉE ROYALE"),
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    `   Effectifs        ⚔️ ${nbUnites} unités`,
    `   Force totale     💪 ${F(force)}`,
    `   Entretien/jour   💸 ${OR(entretien)}`,
    `   Moral troupes    [${moralBlason}] ${royaume.moralTroupes}/100`,
    "",
    fonts.bold("👑  RÉPUTATION & GUERRE"),
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    `   Prestige         ✨ ${royaume.prestige}`,
    `   Sièges           ⚔️ ${royaume.sieges.wins}V / ${royaume.sieges.losses}D`,
    `   Tournois         🏆 ${royaume.tournois.wins}V / ${royaume.tournois.losses}D`,
    `   Raids menés      🗡️ ${royaume.raids}`,
    `   Quêtes accomplies🐉 ${royaume.quetes}`,
    `   Série daily       🔥 ${royaume.streak} jours`,
    `   Hauts faits       🏅 ${royaume.achievements.length}/18`,
    "",
    fonts.bold("⏳  DÉLAIS ROYAUX"),
    "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    `   🌾 Récolte         ${timeLeft(royaume.lastRecolte, COOLDOWNS.RECOLTE) || "✅ Prête"}`,
    `   💰 Collecte taxes  ${timeLeft(royaume.lastTaxe, COOLDOWNS.TAXE) || "✅ Prête"}`,
    `   🏰 Siège           ${timeLeft(royaume.lastSiege, COOLDOWNS.SIEGE) || "✅ Prêt"}`,
    `   🗡️ Raid            ${timeLeft(royaume.lastRaid, COOLDOWNS.RAID) || "✅ Prêt"}`,
    `   🐉 Quête           ${timeLeft(royaume.lastQuete, COOLDOWNS.QUETE) || "✅ Prête"}`,
    `   🏆 Tournoi         ${timeLeft(royaume.lastTournoi, COOLDOWNS.TOURNOI) || "✅ Prêt"}`,
    `   🍷 Diplomatie      ${timeLeft(royaume.lastDiplomatie, COOLDOWNS.DIPLOMATIE) || "✅ Prête"}`,
    `   🎁 Daily           ${timeLeft(royaume.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}`,
  ];
  return lignes.join("\n");
}

function renderHelp() {
  return [
    fonts.bold("⚔️  ROYAUME ÉTERNEL — GRIMOIRE ROYAL"),
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "",
    fonts.bold("   👑  GESTION DU ROYAUME"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume stat              ─ Tableau de bord",
    "   royaume daily             ─ Tribut quotidien",
    "   royaume chateau list      ─ Voir les châteaux",
    "   royaume chateau upgrade <ID> ─ Améliorer",
    "",
    fonts.bold("   🌾  TERRES & ÉCONOMIE"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume terres list       ─ Terres disponibles",
    "   royaume terres acheter <ID> ─ Acquérir une terre",
    "   royaume recolte           ─ Récolter (gratuit, 45min)",
    "   royaume taxe              ─ Collecter les taxes",
    "",
    fonts.bold("   ⚔️  ARMÉE & GUERRE"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume armee list        ─ Unités disponibles",
    "   royaume armee lever <ID> <qte> ─ Lever des troupes",
    "   royaume siege @joueur     ─ Assiéger un royaume",
    "   royaume raid [N°]         ─ Lancer un raid",
    "   royaume entrainement      ─ Entraîner les troupes",
    "",
    fonts.bold("   🐉  QUÊTES & TOURNOIS"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume quete             ─ Partir en quête héroïque",
    "   royaume tournoi @joueur   ─ Duel de joute",
    "",
    fonts.bold("   📜  COUR ROYALE"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume conseillers list  ─ Conseillers dispo",
    "   royaume conseillers nommer <ID> ─ Nommer",
    "   royaume diplomatie        ─ Affaires diplomatiques",
    "",
    fonts.bold("   📊  GLOIRE & HISTOIRE"),
    "   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    "   royaume titre             ─ Votre titre & progression",
    "   royaume achievements      ─ Hauts faits",
    "   royaume classement        ─ Trône des Rois",
    "   royaume history           ─ Chroniques du royaume",
    "   royaume premium           ─ Faveurs royales",
    "",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
  ].join("\n");
}

async function cmdChateau(message, args, royaume, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = fonts.bold("🏰  CHÂTEAUX DISPONIBLES") + "\n" + "▬".repeat(38) + "\n\n";
    for (const [id, c] of Object.entries(CHATEAUX)) {
      const actuel = royaume.chateau === id;
      txt += `   ${c.emoji}  ${fonts.bold(c.nom)} [${id}]\n`;
      txt += `      Coût      : ${c.cout > 0 ? OR(c.cout) : "Gratuit (départ)"}\n`;
      txt += `      Défense   : 🛡️ ${c.defense}\n`;
      txt += `      Trésor max: ${OR(c.tresorerie)}\n`;
      txt += `      ${actuel ? fonts.bold("👑 VOTRE CHÂTEAU") : "🔒 Non acquis"}\n\n`;
    }
    txt += fonts.italic("Usage : royaume chateau upgrade <ID>");
    return message.reply(txt);
  }

  if (sub === "upgrade") {
    const cId = (args[2] || "").toUpperCase();
    const c = CHATEAUX[cId];
    if (!c) return message.reply(fonts.bold("❌ Château inconnu."));
    const actuel = CHATEAUX[royaume.chateau];
    if (c.defense <= actuel.defense) return message.reply(fonts.bold("❌ Ce château est moins puissant que le tien."));
    const bonusArchi = getConseillerBonus(royaume, "bonus_construction");
    const coutFinal = Math.floor(c.cout * (1 - bonusArchi));
    if ((user.money || 0) < coutFinal) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${OR(coutFinal)}`));
    user.money -= coutFinal;
    royaume.chateau = cId;
    royaume.constructions++;
    addTx(royaume, "chateau", -coutFinal, `Construction : ${c.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${c.emoji}  ${fonts.bold("NOUVEAU CHÂTEAU : " + c.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Coût payé  : ${OR(coutFinal)}`,
      `   Défense    : 🛡️ ${c.defense}`,
      `   Trésor max : ${OR(c.tresorerie)}`,
      "",
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  }

  return message.reply(fonts.bold("❓ Usage : royaume chateau [list|upgrade]"));
}

async function cmdTerres(message, args, royaume, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = fonts.bold("🌾  TERRES DISPONIBLES") + "\n" + "▬".repeat(38) + "\n\n";
    for (const [id, t] of Object.entries(TERRES)) {
      const possede = royaume.terres[id] || 0;
      txt += `   ${t.emoji}  ${fonts.bold(t.nom)} [${id}]\n`;
      txt += `      Coût        : ${OR(t.cout)}\n`;
      txt += `      Revenu/jour : ${OR(t.revenu)}\n`;
      txt += `      Possédées   : ${possede}\n\n`;
    }
    txt += fonts.italic("Usage : royaume terres acheter <ID> [qte]");
    return message.reply(txt);
  }

  if (sub === "acheter") {
    const tId = (args[2] || "").toUpperCase();
    const qte = parseInt(args[3]) || 1;
    const t = TERRES[tId];
    if (!t) return message.reply(fonts.bold("❌ Terre inconnue. Tape 'royaume terres list'."));
    const total = t.cout * qte;
    if ((user.money || 0) < total) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${OR(total)}`));
    user.money -= total;
    royaume.terres[tId] = (royaume.terres[tId] || 0) + qte;
    addTx(royaume, "terre", -total, `Acquisition : ${qte}× ${t.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${t.emoji}  ${fonts.bold("TERRE ACQUISE : " + t.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Quantité     : ${qte}`,
      `   Coût payé    : ${OR(total)}`,
      `   Revenu total : ${OR(t.revenu * royaume.terres[tId])}/jour`,
      "",
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  }

  return message.reply(fonts.bold("❓ Usage : royaume terres [list|acheter]"));
}

async function cmdRecolte(message, royaume, user, save) {
  const cd = timeLeft(royaume.lastRecolte, COOLDOWNS.RECOLTE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine récolte dans ${cd}.`));

  const nbTerres = Object.values(royaume.terres).reduce((s, q) => s + q, 0);
  if (nbTerres === 0) {
    royaume.lastRecolte = Date.now();
    await save();
    return message.reply(fonts.bold("🌾 Tu n'as aucune terre. Achète-en avec 'royaume terres acheter <ID>' !"));
  }

  const bonusIntendant = getConseillerBonus(royaume, "bonus_terres");
  let total = 0;
  let detail = "";
  for (const [id, qte] of Object.entries(royaume.terres)) {
    const t = TERRES[id];
    if (!t || qte <= 0) continue;
    const gain = Math.floor(t.revenu * qte * (1 + bonusIntendant) * (royaume.premium ? 1.3 : 1));
    total += gain;
    detail += `   ${t.emoji} ${t.nom} ×${qte} : +${OR(gain)}\n`;
  }
  user.money = (user.money || 0) + total;
  royaume.totalAmasse += total;
  royaume.lastRecolte = Date.now();
  addTx(royaume, "recolte", total, `Récolte des terres`);
  const ach = checkAchievements(royaume);
  await save();

  return message.reply([
    `🌾  ${fonts.bold("RÉCOLTE DES TERRES")}`,
    "▬".repeat(38),
    detail.trimEnd(),
    "",
    `   ${fonts.bold("Total récolté : " + OR(total))}`,
    ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
  ].filter(Boolean).join("\n"));
}

async function cmdTaxe(message, royaume, user, save) {
  const cd = timeLeft(royaume.lastTaxe, COOLDOWNS.TAXE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine collecte dans ${cd}.`));

  const titre = getTitre(royaume);
  const chateau = CHATEAUX[royaume.chateau];
  const base = Math.floor(chateau.tresorerie * 0.15);
  const bonusTitre = Math.floor(base * titre.bonus);
  const total = Math.floor((base + bonusTitre) * (royaume.premium ? 1.5 : 1));

  user.money = (user.money || 0) + total;
  royaume.totalAmasse += total;
  royaume.lastTaxe = Date.now();
  addTx(royaume, "taxe", total, `Collecte des taxes`);
  const ach = checkAchievements(royaume);
  await save();

  return message.reply([
    `💰  ${fonts.bold("COLLECTE DES TAXES")}`,
    "▬".repeat(38),
    `   Base (château)   : ${OR(base)}`,
    `   Bonus titre       : ${OR(bonusTitre)} (${titre.nom})`,
    royaume.premium ? `   Bonus faveur royale : ×1.5` : "",
    `   ──────────────────────────────`,
    `   ${fonts.bold("Total : " + OR(total))}`,
    ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
  ].filter(Boolean).join("\n"));
}

async function cmdArmee(message, args, royaume, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = fonts.bold("⚔️  UNITÉS DISPONIBLES") + "\n" + "▬".repeat(38) + "\n\n";
    for (const [id, u] of Object.entries(UNITES)) {
      const possede = royaume.armee[id] || 0;
      txt += `   ${u.emoji}  ${fonts.bold(u.nom)} [${id}]\n`;
      txt += `      Coût      : ${OR(u.cout)}\n`;
      txt += `      Force     : 💪 ${u.force}\n`;
      txt += `      Entretien : ${OR(u.entretien)}/jour\n`;
      txt += `      En service: ${possede}\n\n`;
    }
    txt += fonts.italic("Usage : royaume armee lever <ID> <qte>");
    return message.reply(txt);
  }

  if (sub === "lever") {
    const uId = (args[2] || "").toUpperCase();
    const qte = parseInt(args[3]) || 1;
    const u = UNITES[uId];
    if (!u) return message.reply(fonts.bold("❌ Unité inconnue. Tape 'royaume armee list'."));
    const total = u.cout * qte;
    if ((user.money || 0) < total) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${OR(total)}`));
    user.money -= total;
    royaume.armee[uId] = (royaume.armee[uId] || 0) + qte;
    addTx(royaume, "armee", -total, `Levée : ${qte}× ${u.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${u.emoji}  ${fonts.bold("TROUPES LEVÉES : " + u.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Quantité      : ${qte}`,
      `   Coût payé     : ${OR(total)}`,
      `   Force ajoutée : 💪 ${u.force * qte}`,
      `   Force totale  : 💪 ${F(getForceArmee(royaume))}`,
      "",
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  }

  return message.reply(fonts.bold("❓ Usage : royaume armee [list|lever]"));
}

async function cmdEntrainement(message, royaume, save) {
  const cd = timeLeft(royaume.lastEntrainement, COOLDOWNS.ENTRAINEMENT);
  if (cd) return message.reply(fonts.bold(`⏳ Prochain entraînement dans ${cd}.`));

  const nbUnites = Object.values(royaume.armee).reduce((s, q) => s + q, 0);
  if (nbUnites === 0) return message.reply(fonts.bold("❌ Tu n'as aucune troupe. Lève une armée avec 'royaume armee lever'."));

  const gainMoral = rand(10, 25);
  royaume.moralTroupes = Math.min(100, royaume.moralTroupes + gainMoral);
  royaume.lastEntrainement = Date.now();
  await save();

  return message.reply([
    `🎯  ${fonts.bold("ENTRAÎNEMENT DES TROUPES")}`,
    "▬".repeat(38),
    `   Moral gagné  : +${gainMoral}`,
    `   Moral actuel : [${blason(royaume.moralTroupes, 100)}] ${royaume.moralTroupes}/100`,
  ].join("\n"));
}

async function cmdRaid(message, args, royaume, user, save) {
  const cd = timeLeft(royaume.lastRaid, COOLDOWNS.RAID);
  if (cd) return message.reply(fonts.bold(`⏳ Prochain raid dans ${cd}.`));

  const num = parseInt(args[1]);
  if (!num) {
    let txt = fonts.bold("🗡️  CHOISIR UNE CIBLE DE RAID") + "\n" + "▬".repeat(38) + "\n\n";
    CIBLES_RAID.forEach((c, i) => {
      txt += `   [${i + 1}]  ${c.emoji}  ${fonts.bold(c.nom)}\n`;
      txt += `        Butin : ${OR(c.butin_min)} — ${OR(c.butin_max)}\n`;
      txt += `        Résistance : ${"🛡️".repeat(Math.ceil(c.resistance / 20))}\n`;
      txt += `        Prestige +${c.prestige_gain}\n\n`;
    });
    txt += fonts.italic("Usage : royaume raid <N°>  ─  Ex : royaume raid 2");
    return message.reply(txt);
  }

  const idx = num - 1;
  if (idx < 0 || idx >= CIBLES_RAID.length) return message.reply(fonts.bold(`❌ Cible invalide (1-${CIBLES_RAID.length}).`));
  const cible = CIBLES_RAID[idx];
  const force = getForceArmee(royaume);
  const bonusEspion = getConseillerBonus(royaume, "bonus_raid");

  const chanceBase = Math.min(0.92, 0.35 + (force / 5000) + bonusEspion + (royaume.premium ? 0.05 : 0));
  const succes = Math.random() * 100 > cible.resistance * (1 - chanceBase);

  royaume.lastRaid = Date.now();
  royaume.raids++;
  royaume.prestige += cible.prestige_gain;

  if (succes) {
    const butin = rand(cible.butin_min, cible.butin_max);
    const titre = getTitre(royaume);
    const butinFinal = Math.floor(butin * (1 + titre.bonus) * (royaume.premium ? 1.2 : 1));
    user.money = (user.money || 0) + butinFinal;
    royaume.totalAmasse += butinFinal;
    royaume.moralTroupes = Math.min(100, royaume.moralTroupes + 5);
    addTx(royaume, "raid", butinFinal, `Raid : ${cible.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${cible.emoji}  ${fonts.bold("RAID VICTORIEUX !")}`,
      "▓".repeat(38),
      `   Cible          : ${cible.nom}`,
      `   Butin récolté  : ${fonts.bold(OR(butinFinal))}`,
      `   Prestige       : +${cible.prestige_gain} (total : ${royaume.prestige})`,
      `   Moral troupes  : +5`,
      "▓".repeat(38),
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  } else {
    const pertes = rand(1, Math.max(1, Math.floor(Object.values(royaume.armee).reduce((s, q) => s + q, 0) * 0.15)));
    royaume.moralTroupes = Math.max(0, royaume.moralTroupes - 15);
    const unitesIds = Object.keys(royaume.armee);
    if (unitesIds.length > 0) {
      const uId = pick(unitesIds);
      royaume.armee[uId] = Math.max(0, royaume.armee[uId] - pertes);
      if (royaume.armee[uId] === 0) delete royaume.armee[uId];
    }
    addTx(royaume, "raid_echec", 0, `Raid échoué : ${cible.nom}`);
    await save();
    return message.reply([
      `${cible.emoji}  ${fonts.bold("RAID ÉCHOUÉ !")}`,
      "▓".repeat(38),
      `   Cible         : ${cible.nom}`,
      `   Pertes        : -${pertes} unités`,
      `   Moral troupes : -15`,
      "▓".repeat(38),
      fonts.italic("   Renforce ton armée et réessaie !"),
    ].join("\n"));
  }
}

async function cmdSiege(message, args, royaume, usersData, senderID, event, user, save) {
  const cd = timeLeft(royaume.lastSiege, COOLDOWNS.SIEGE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochain siège dans ${cd}.`));

  const targetID = Object.keys(event.mentions || {})[0];
  if (!targetID) return message.reply(fonts.bold("❌ Mentionne un royaume à assiéger.\nUsage : royaume siege @joueur"));
  if (targetID === senderID) return message.reply(fonts.bold("❌ Tu ne peux pas assiéger ton propre château."));

  let targetUser = await usersData.get(targetID);
  if (!targetUser?.data?.royaume) return message.reply(fonts.bold("❌ Ce joueur n'a pas de royaume."));
  const targetRoyaume = targetUser.data.royaume;

  const monForce = getForceArmee(royaume);
  const sonChateau = CHATEAUX[targetRoyaume.chateau];
  const sonForce = getForceArmee(targetRoyaume) + sonChateau.defense;

  const monScore = monForce + Math.random() * 100;
  const sonScore = sonForce + Math.random() * 100;

  royaume.lastSiege = Date.now();

  if (monScore > sonScore) {
    const butin = Math.floor((targetUser.money || 0) * 0.20);
    user.money = (user.money || 0) + butin;
    targetUser.money = Math.max(0, (targetUser.money || 0) - butin);
    royaume.sieges.wins++;
    royaume.prestige += 50;
    royaume.totalAmasse += butin;
    royaume.moralTroupes = Math.min(100, royaume.moralTroupes + 10);
    addTx(royaume, "siege_win", butin, `Siège victorieux contre ${targetID}`);
    targetUser.data.royaume = targetRoyaume;
    await usersData.set(targetID, targetUser);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `🏰  ${fonts.bold("SIÈGE VICTORIEUX !")}`,
      "▓".repeat(38),
      `   Force : ${F(Math.round(monScore))} ⚔️ ${F(Math.round(sonScore))}`,
      `   Butin pillé    : ${fonts.bold(OR(butin))}`,
      `   Prestige       : +50`,
      `   Moral troupes  : +10`,
      "▓".repeat(38),
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  } else {
    const pertes = rand(1, Math.max(1, Math.floor(Object.values(royaume.armee).reduce((s, q) => s + q, 0) * 0.25)));
    royaume.moralTroupes = Math.max(0, royaume.moralTroupes - 20);
    royaume.sieges.losses++;
    const unitesIds = Object.keys(royaume.armee);
    if (unitesIds.length > 0) {
      const uId = pick(unitesIds);
      royaume.armee[uId] = Math.max(0, royaume.armee[uId] - pertes);
      if (royaume.armee[uId] === 0) delete royaume.armee[uId];
    }
    addTx(royaume, "siege_loss", 0, `Siège perdu contre ${targetID}`);
    await save();
    return message.reply([
      `🏰  ${fonts.bold("SIÈGE REPOUSSÉ...")}`,
      "▓".repeat(38),
      `   Force : ${F(Math.round(monScore))} ⚔️ ${F(Math.round(sonScore))}`,
      `   Pertes         : -${pertes} unités`,
      `   Moral troupes  : -20`,
      "▓".repeat(38),
    ].join("\n"));
  }
}

async function cmdQuete(message, royaume, user, save) {
  const cd = timeLeft(royaume.lastQuete, COOLDOWNS.QUETE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine quête dans ${cd}.`));

  const quete = pick(QUETES);
  const force = getForceArmee(royaume);
  const survie = Math.random() * 100 > quete.danger * (1 - Math.min(0.5, force / 10000));

  royaume.lastQuete = Date.now();

  if (survie) {
    const bonusAlchimiste = getConseillerBonus(royaume, "bonus_quete");
    const or = rand(quete.or_min, quete.or_max);
    const orFinal = Math.floor(or * (1 + bonusAlchimiste) * (royaume.premium ? 1.4 : 1));
    user.money = (user.money || 0) + orFinal;
    royaume.totalAmasse += orFinal;
    royaume.quetes++;
    royaume.prestige += 10;
    addTx(royaume, "quete", orFinal, `Quête : ${quete.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${quete.emoji}  ${fonts.bold("QUÊTE ACCOMPLIE !")}`,
      "▓".repeat(38),
      `   ${quete.nom}`,
      `   Or récolté    : ${fonts.bold(OR(orFinal))}`,
      `   Prestige      : +10`,
      "▓".repeat(38),
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  } else {
    const pertes = rand(1, Math.max(1, Math.floor(Object.values(royaume.armee).reduce((s, q) => s + q, 0) * 0.10)));
    const unitesIds = Object.keys(royaume.armee);
    if (unitesIds.length > 0) {
      const uId = pick(unitesIds);
      royaume.armee[uId] = Math.max(0, royaume.armee[uId] - pertes);
      if (royaume.armee[uId] === 0) delete royaume.armee[uId];
    }
    addTx(royaume, "quete_echec", 0, `Quête échouée : ${quete.nom}`);
    await save();
    return message.reply([
      `${quete.emoji}  ${fonts.bold("QUÊTE PÉRILLEUSE...")}`,
      "▓".repeat(38),
      `   ${quete.nom}`,
      `   Résultat : Échec ! Tes hommes ont fui.`,
      pertes > 0 ? `   Pertes : -${pertes} unités` : "",
      "▓".repeat(38),
    ].filter(Boolean).join("\n"));
  }
}

async function cmdTournoi(message, args, royaume, usersData, senderID, event, user, save) {
  const cd = timeLeft(royaume.lastTournoi, COOLDOWNS.TOURNOI);
  if (cd) return message.reply(fonts.bold(`⏳ Prochain tournoi dans ${cd}.`));

  const targetID = Object.keys(event.mentions || {})[0];
  if (!targetID) return message.reply(fonts.bold("❌ Mentionne un chevalier à défier.\nUsage : royaume tournoi @joueur"));
  if (targetID === senderID) return message.reply(fonts.bold("❌ Tu ne peux pas te défier toi-même."));

  let targetUser = await usersData.get(targetID);
  if (!targetUser?.data?.royaume) return message.reply(fonts.bold("❌ Ce joueur n'a pas de royaume."));
  const targetRoyaume = targetUser.data.royaume;

  const monTitre = getTitre(royaume);
  const sonTitre = getTitre(targetRoyaume);
  const monScore = monTitre.prestige + royaume.prestige / 5 + rand(0, 50);
  const sonScore = sonTitre.prestige + targetRoyaume.prestige / 5 + rand(0, 50);

  royaume.lastTournoi = Date.now();

  if (monScore > sonScore) {
    const gain = rand(2_000, 15_000);
    user.money = (user.money || 0) + gain;
    royaume.totalAmasse += gain;
    royaume.prestige += 15;
    royaume.tournois.wins++;
    addTx(royaume, "tournoi_win", gain, `Tournoi gagné contre ${targetID}`);
    await save();
    return message.reply([
      `🏆  ${fonts.bold("VICTOIRE AU TOURNOI !")}`,
      "▓".repeat(38),
      `   Score : ${Math.round(monScore)} ⚔️ ${Math.round(sonScore)}`,
      `   Gain de joute : ${OR(gain)}`,
      `   Prestige      : +15`,
      "▓".repeat(38),
    ].join("\n"));
  } else {
    royaume.tournois.losses++;
    royaume.prestige = Math.max(0, royaume.prestige - 5);
    addTx(royaume, "tournoi_loss", 0, `Tournoi perdu contre ${targetID}`);
    await save();
    return message.reply([
      `🏆  ${fonts.bold("DÉFAITE AU TOURNOI...")}`,
      "▓".repeat(38),
      `   Score : ${Math.round(monScore)} ⚔️ ${Math.round(sonScore)}`,
      `   Prestige : -5`,
      "▓".repeat(38),
    ].join("\n"));
  }
}

async function cmdConseillers(message, args, royaume, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = fonts.bold("📜  CONSEILLERS DISPONIBLES") + "\n" + "▬".repeat(38) + "\n\n";
    for (const [id, c] of Object.entries(CONSEILLERS)) {
      const nomme = royaume.conseillers.includes(id);
      txt += `   ${c.emoji}  ${fonts.bold(c.nom)} [${id}]\n`;
      txt += `      Coût  : ${OR(c.cout)}\n`;
      txt += `      Effet : ${fonts.italic(c.effet)}\n`;
      txt += `      ${nomme ? fonts.bold("✅ EN POSTE") : "🔒 Non nommé"}\n\n`;
    }
    txt += fonts.italic("Usage : royaume conseillers nommer <ID>");
    return message.reply(txt);
  }

  if (sub === "nommer") {
    const cId = (args[2] || "").toUpperCase();
    const c = CONSEILLERS[cId];
    if (!c) return message.reply(fonts.bold("❌ Conseiller inconnu."));
    if (royaume.conseillers.includes(cId)) return message.reply(fonts.bold("❌ Déjà en poste."));
    if ((user.money || 0) < c.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${OR(c.cout)}`));
    user.money -= c.cout;
    royaume.conseillers.push(cId);
    addTx(royaume, "conseiller", -c.cout, `Nomination : ${c.nom}`);
    const ach = checkAchievements(royaume);
    await save();
    return message.reply([
      `${c.emoji}  ${fonts.bold("NOMMÉ : " + c.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Coût payé : ${OR(c.cout)}`,
      `   Effet     : ${fonts.italic(c.effet)}`,
      ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
    ].filter(Boolean).join("\n"));
  }

  return message.reply(fonts.bold("❓ Usage : royaume conseillers [list|nommer]"));
}

async function cmdDiplomatie(message, royaume, user, save) {
  const cd = timeLeft(royaume.lastDiplomatie, COOLDOWNS.DIPLOMATIE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine affaire diplomatique dans ${cd}.`));

  const evt = pick(EVENEMENTS_DIPLO);
  royaume.lastDiplomatie = Date.now();

  if (evt.special === "terre") {
    const terresIds = Object.keys(TERRES);
    const terreGratuite = pick(terresIds);
    royaume.terres[terreGratuite] = (royaume.terres[terreGratuite] || 0) + 1;
    await save();
    return message.reply([
      `${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}`,
      "▬".repeat(38),
      fonts.italic("   Un marchand t'offre une terre en gage d'alliance..."),
      `   Terre obtenue : ${TERRES[terreGratuite].emoji} ${TERRES[terreGratuite].nom}`,
    ].join("\n"));
  }

  if (evt.special === "prestige") {
    const gain = rand(20, 60);
    royaume.prestige += gain;
    await save();
    return message.reply([
      `${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Un traité de paix renforce ta réputation...`,
      `   Prestige +${gain} (total : ${royaume.prestige})`,
    ].join("\n"));
  }

  if (evt.special === "soldat") {
    const uId = pick(Object.keys(UNITES).slice(0, 3));
    royaume.armee[uId] = (royaume.armee[uId] || 0) + 1;
    await save();
    return message.reply([
      `${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Un ambassadeur t'offre un soldat...`,
      `   Unité reçue : ${UNITES[uId].emoji} ${UNITES[uId].nom}`,
    ].join("\n"));
  }

  const bonusDiplomate = getConseillerBonus(royaume, "bonus_diplo");
  const won = Math.random() * 100 > evt.risque;
  if (won) {
    const gain = Math.floor(rand(evt.gain_min, evt.gain_max) * (1 + bonusDiplomate));
    user.money = (user.money || 0) + gain;
    royaume.totalAmasse += gain;
    addTx(royaume, "diplo_win", gain, `Diplomatie : ${evt.nom}`);
    await save();
    return message.reply([
      `${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Résultat : 🎉 Succès !`,
      `   Gain     : ${fonts.bold(OR(gain))}`,
    ].join("\n"));
  } else {
    const perte = Math.abs(rand(evt.gain_min, evt.gain_max));
    user.money = Math.max(0, (user.money || 0) - perte);
    addTx(royaume, "diplo_loss", -perte, `Diplomatie : ${evt.nom}`);
    await save();
    return message.reply([
      `${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}`,
      "▬".repeat(38),
      `   Résultat : 🗡️ Trahison !`,
      `   Perte    : ${OR(perte)}`,
    ].join("\n"));
  }
}

async function cmdTitre(message, royaume) {
  const titre = getTitre(royaume);
  const idx = TITRES.findIndex(t => t.id === titre.id);
  const next = TITRES[idx + 1] || null;

  let txt = `${titre.emoji}  ${fonts.bold("TITRE : " + titre.nom.toUpperCase())}\n` + "▬".repeat(38) + "\n\n";
  txt += `   🪙  Total amassé   : ${OR(royaume.totalAmasse)}\n`;
  txt += `   ✨  Prestige        : ${royaume.prestige}\n`;
  txt += `   💰  Bonus gains     : +${Math.round(titre.bonus * 100)}%\n\n`;

  if (next) {
    txt += `   ⬆️  Prochain titre  : ${next.emoji} ${next.nom}\n`;
    txt += `      Requis           : ${OR(next.min)} amassé\n`;
    txt += `      Manque           : ${OR(Math.max(0, next.min - royaume.totalAmasse))}\n\n`;
  } else {
    txt += fonts.bold("   👑 Titre SUPRÊME atteint !\n\n");
  }

  txt += fonts.bold("   📜 TOUS LES TITRES :\n");
  TITRES.forEach(t => {
    txt += `   ${titre.id === t.id ? "▶ " : "   "}${t.emoji}  ${t.nom} — dès ${OR(t.min)}\n`;
  });
  return message.reply(txt);
}

async function cmdDaily(message, royaume, user, save) {
  const cd = timeLeft(royaume.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`⏳ Tribut déjà réclamé. Prochain dans ${cd}.`));

  const maintenant = Date.now();
  if (royaume.lastDaily && maintenant - royaume.lastDaily < COOLDOWNS.DAILY * 2) royaume.streak++;
  else royaume.streak = 1;

  const titre = getTitre(royaume);
  const idx = TITRES.findIndex(t => t.id === titre.id);
  const base = 1_500 + idx * 2_000;
  const streakBonus = Math.min(royaume.streak * 400, 6_000);
  const premiumMult = royaume.premium ? 2 : 1;
  const total = Math.floor((base + streakBonus) * premiumMult);

  user.money = (user.money || 0) + total;
  royaume.totalAmasse += total;
  royaume.moralTroupes = Math.min(100, royaume.moralTroupes + 10);
  royaume.lastDaily = maintenant;
  addTx(royaume, "daily", total, `Tribut quotidien (streak ${royaume.streak}j)`);
  const ach = checkAchievements(royaume);
  await save();

  return message.reply([
    `🎁  ${fonts.bold("TRIBUT QUOTIDIEN !")}`,
    "▓".repeat(38),
    `   Base           : ${OR(base)}`,
    `   Bonus streak    : ${OR(streakBonus)} (${royaume.streak} jours)`,
    royaume.premium ? `   Faveur royale ×2` : "",
    `   ───────────────────────────────`,
    `   ${fonts.bold("Total : " + OR(total))}`,
    `   Moral : +10 (${royaume.moralTroupes}/100)`,
    "▓".repeat(38),
    ach.length > 0 ? fonts.bold(`   🏅 Hauts faits : ${ach.join(", ")}`) : "",
  ].filter(Boolean).join("\n"));
}

async function cmdAchievements(message, royaume) {
  const liste = {
    PREMIER_OR:        { emoji: "🪙", nom: "Premier Or",          desc: "Amasser de l'or" },
    PREMIERE_TERRE:     { emoji: "🌾", nom: "Premier Domaine",     desc: "Acquérir une terre" },
    PREMIERE_UNITE:     { emoji: "⚔️", nom: "Première Recrue",     desc: "Lever une unité" },
    PREMIER_SIEGE:      { emoji: "🏰", nom: "Premier Siège",       desc: "Participer à un siège" },
    DIX_SIEGES_GAGNES:  { emoji: "👑", nom: "Maître des Sièges",   desc: "10 sièges gagnés" },
    PREMIERE_QUETE:     { emoji: "🐉", nom: "Premier Héroïsme",    desc: "Accomplir une quête" },
    DRAGON_VAINCU:      { emoji: "🐲", nom: "Tueur de Dragons",    desc: "5 quêtes accomplies" },
    CHEVALIER:          { emoji: "⚔️", nom: "Chevalier !",         desc: "Atteindre le titre Chevalier" },
    ROI:                { emoji: "👑", nom: "Couronné Roi",        desc: "Atteindre le titre Roi" },
    EMPEREUR:           { emoji: "🏛️", nom: "Empereur des Terres", desc: "Atteindre le titre suprême" },
    CHATEAU_FORT:       { emoji: "🏯", nom: "Bastion Imprenable",  desc: "Posséder une Forteresse+" },
    PALAIS_LEGENDE:     { emoji: "🗼", nom: "Palais des Légendes", desc: "Construire le Palais ultime" },
    MILLIONNAIRE:       { emoji: "💰", nom: "Millionnaire",        desc: "1M d'or amassé" },
    DIX_MILLIONS:       { emoji: "🤑", nom: "10 Millions",         desc: "10M d'or amassé" },
    CENT_MILLIONS:      { emoji: "👑", nom: "100 Millions",        desc: "100M d'or amassé" },
    PRESTIGE_100:       { emoji: "✨", nom: "Renommée",            desc: "100 de prestige" },
    PRESTIGE_500:       { emoji: "🌟", nom: "Légende Vivante",     desc: "500 de prestige" },
    CONSEIL_COMPLET:    { emoji: "📜", nom: "Conseil au Complet",  desc: "6 conseillers nommés" },
    STREAKER_7:         { emoji: "🔥", nom: "Règne de 7 jours",    desc: "7 tributs consécutifs" },
  };
  const total = Object.keys(liste).length;
  let txt = fonts.bold("🏅  HAUTS FAITS DU ROYAUME") + "\n" + "▬".repeat(38) + "\n\n";
  txt += `   Progression : ${royaume.achievements.length}/${total}\n\n`;

  if (royaume.achievements.length === 0) {
    txt += fonts.italic("   Aucun haut fait. Bâtis ton royaume !\n\n");
  } else {
    txt += fonts.bold("   ✅ ACCOMPLIS :") + "\n";
    royaume.achievements.slice(0, 10).forEach((id, i) => {
      const a = liste[id] || { emoji: "🏅", nom: id };
      txt += `   ${i + 1}. ${a.emoji}  ${a.nom}\n`;
    });
    if (royaume.achievements.length > 10) txt += `   ...et ${royaume.achievements.length - 10} de plus !\n`;
    txt += "\n";
  }

  txt += fonts.bold("   🎯 PROCHAINS :") + "\n";
  Object.entries(liste).filter(([id]) => !royaume.achievements.includes(id)).slice(0, 5).forEach(([, a]) => {
    txt += `   • ${a.emoji}  ${a.nom} : ${fonts.italic(a.desc)}\n`;
  });
  return message.reply(txt);
}

async function cmdClassement(message, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const royaumes = [];
    for (const [uid, u] of Object.entries(allUsers)) {
      const r = u.data?.royaume;
      if (r && r.totalAmasse > 0) {
        royaumes.push({
          nom:         u.name || `Seigneur ${uid.slice(-4)}`,
          totalAmasse: r.totalAmasse,
          prestige:    r.prestige || 0,
          titre:       getTitre(r),
          premium:     r.premium || false,
        });
      }
    }
    royaumes.sort((a, b) => b.totalAmasse - a.totalAmasse);
    const top = royaumes.slice(0, 10);

    let txt = fonts.bold("👑  TRÔNE DES ROIS") + "\n" + "▬".repeat(38) + "\n\n";
    if (top.length === 0) {
      txt += fonts.italic("   Aucun royaume classé encore.");
    } else {
      top.forEach((r, i) => {
        const med = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `  #${i + 1}`;
        txt += `   ${med}  ${fonts.bold(r.nom)}${r.premium ? " 💎" : ""}\n`;
        txt += `        ${r.titre.emoji} ${r.titre.nom}\n`;
        txt += `        ${OR(r.totalAmasse)} amassé  |  ✨ ${r.prestige} prestige\n\n`;
      });
    }
    return message.reply(txt);
  } catch (e) {
    return message.reply(fonts.bold("❌ Erreur classement."));
  }
}

async function cmdHistory(message, royaume) {
  const txs = royaume.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune chronique enregistrée."));
  const emojiMap = {
    chateau: "🏰", terre: "🌾", recolte: "🌾", taxe: "💰", armee: "⚔️",
    raid: "🗡️", raid_echec: "💀", siege_win: "🏰", siege_loss: "💀",
    quete: "🐉", quete_echec: "💀", tournoi_win: "🏆", tournoi_loss: "💀",
    conseiller: "📜", diplo_win: "🍷", diplo_loss: "🗡️", daily: "🎁",
  };
  let txt = fonts.bold("📋  CHRONIQUES DU ROYAUME (15 dernières)") + "\n" + "▬".repeat(38) + "\n\n";
  txs.forEach(tx => {
    const e = emojiMap[tx.type] || "📜";
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `   ${e}  ${tx.description}\n      ${sign}${OR(tx.montant)} — ${date}\n\n`;
  });
  return message.reply(txt);
}

async function cmdPremium(message, args, royaume, user, save) {
  if ((args[1] || "").toLowerCase() === "buy") {
    const cout = 1_200_000;
    if ((user.money || 0) < cout) return message.reply(fonts.bold(`❌ Faveur royale coûte ${OR(cout)}. Tu as ${OR(user.money || 0)}.`));
    user.money -= cout;
    royaume.premium = true;
    addTx(royaume, "premium", -cout, "Faveur Royale acquise");
    await save();
    return message.reply([
      `💎  ${fonts.bold("FAVEUR ROYALE ACCORDÉE !")}`,
      "▓".repeat(38),
      "   ✅  Récolte ×1.3",
      "   ✅  Taxes ×1.5",
      "   ✅  Tribut quotidien ×2",
      "   ✅  Raids et quêtes bonus",
      "▓".repeat(38),
    ].join("\n"));
  }
  return message.reply([
    `💎  ${fonts.bold("FAVEUR ROYALE")}`,
    "▬".repeat(38),
    `   Statut : ${royaume.premium ? fonts.bold("✅ Accordée") : "❌ Non accordée"}`,
    `   Prix   : ${OR(1_200_000)}`,
    "",
    "   Avantages :",
    "   • Récolte ×1.3",
    "   • Taxes ×1.5",
    "   • Tribut quotidien ×2",
    "   • Raids et quêtes bonus",
    "",
    !royaume.premium ? fonts.italic("   royaume premium buy pour l'acquérir !") : "",
  ].filter(Boolean).join("\n"));
}

module.exports = {
  config: {
    name:        "royaume",
    aliases:     ["kingdom", "seigneur", "royal"],
    version:     "1.0",
    author:      "Christus",
    countDown:   3,
    role:        0,
    description: {
      fr: "⚔️ Royaume Éternel — De Paysan à Empereur. Châteaux, armées, sièges, quêtes et diplomatie.",
    },
    category: "economy",
    guide: { fr: "Tape 'royaume help' pour voir toutes les commandes." },
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.royaume) user.data.royaume = initRoyaume();

    const royaume = user.data.royaume;
    royaume.titre = getTitre(royaume).id;

    const save = async () => {
      user.data.royaume = royaume;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help": case "aide":
        return message.reply(renderHelp());

      case "stat": case "status": case "profil": case "dashboard":
        return message.reply(renderDashboard(royaume));

      case "chateau": case "castle":
        return cmdChateau(message, args, royaume, user, save);

      case "terres": case "terre": case "land":
        return cmdTerres(message, args, royaume, user, save);

      case "recolte": case "harvest":
        return cmdRecolte(message, royaume, user, save);

      case "taxe": case "tax":
        return cmdTaxe(message, royaume, user, save);

      case "armee": case "army":
        return cmdArmee(message, args, royaume, user, save);

      case "entrainement": case "train":
        return cmdEntrainement(message, royaume, save);

      case "raid":
        return cmdRaid(message, args, royaume, user, save);

      case "siege":
        return cmdSiege(message, args, royaume, usersData, senderID, event, user, save);

      case "quete": case "quest":
        return cmdQuete(message, royaume, user, save);

      case "tournoi": case "tournament": case "joute":
        return cmdTournoi(message, args, royaume, usersData, senderID, event, user, save);

      case "conseillers": case "advisors":
        return cmdConseillers(message, args, royaume, user, save);

      case "diplomatie": case "diplomacy":
        return cmdDiplomatie(message, royaume, user, save);

      case "titre": case "title": case "rang":
        return cmdTitre(message, royaume);

      case "daily":
        return cmdDaily(message, royaume, user, save);

      case "achievements": case "succes": case "hautsfaits":
        return cmdAchievements(message, royaume);

      case "classement": case "top": case "leaderboard": case "trone":
        return cmdClassement(message, usersData);

      case "history": case "historique": case "chroniques":
        return cmdHistory(message, royaume);

      case "premium":
        return cmdPremium(message, args, royaume, user, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tape 'royaume help'.`));
    }
  },
};