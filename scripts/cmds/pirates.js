"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
  PILLAGE:   2  * 60 * 60 * 1000,
  PECHE:     30 * 60 * 1000,
  COMMERCE:  3  * 60 * 60 * 1000,
  BATAILLE:  6  * 60 * 60 * 1000,
  EXPLORATION: 4 * 60 * 60 * 1000,
  TAVERNE:   1  * 60 * 60 * 1000,
  DAILY:     24 * 60 * 60 * 1000,
  RECRUTEMENT: 2 * 60 * 60 * 1000,
  CHASSE_TRESOR: 8 * 60 * 60 * 1000,
};

const RANGS = [
  { id: "MOUSSE",    nom: "Mousse",           min: 0,            emoji: "🪣",  bonus: 0,    infamie: 0   },
  { id: "MATELOT",  nom: "Matelot",           min: 5_000,        emoji: "⚓",  bonus: 0.05, infamie: 10  },
  { id: "QUARTIER", nom: "Quartier-Maître",   min: 50_000,       emoji: "🗺️", bonus: 0.10, infamie: 25  },
  { id: "CAPITAINE",nom: "Capitaine",         min: 250_000,      emoji: "🏴‍☠️",bonus:0.20, infamie: 50  },
  { id: "COMMODORE",nom: "Commodore",         min: 1_000_000,    emoji: "⚔️", bonus: 0.30, infamie: 100 },
  { id: "AMIRAL",   nom: "Amiral Maudit",     min: 5_000_000,    emoji: "💀",  bonus: 0.45, infamie: 200 },
  { id: "ROI_MERS", nom: "Roi des Sept Mers", min: 25_000_000,   emoji: "👑",  bonus: 0.70, infamie: 500 },
];

const NAVIRES = {
  BARQUE:    { id: "BARQUE",   nom: "Barque Pourrie",    cout: 0,          coque: 100, canons: 1,  cargo: 50,   vitesse: 1, emoji: "🛶"  },
  SLOOP:     { id: "SLOOP",    nom: "Sloop Rapide",      cout: 10_000,     coque: 200, canons: 4,  cargo: 150,  vitesse: 3, emoji: "⛵"  },
  BRIGANTIN: { id: "BRIGANTIN",nom: "Brigantin Corsaire",cout: 80_000,     coque: 400, canons: 10, cargo: 350,  vitesse: 4, emoji: "🚢"  },
  FREGATE:   { id: "FREGATE",  nom: "Frégate de Guerre", cout: 500_000,    coque: 800, canons: 24, cargo: 600,  vitesse: 5, emoji: "⚓"  },
  VAISSEAU:  { id: "VAISSEAU", nom: "Vaisseau de Ligne", cout: 3_000_000,  coque: 2000,canons: 64, cargo: 1200, vitesse: 4, emoji: "🏴‍☠️"},
  LEVIATHAN: { id: "LEVIATHAN",nom: "Le Léviathan Noir", cout: 20_000_000, coque: 5000,canons: 120,cargo: 3000, vitesse: 6, emoji: "💀"  },
};

const MARCHANDISES = {
  POISSON:   { id: "POISSON",  nom: "Poisson frais",    prixAchat: 50,    prixVente: 150,   poids: 1,  emoji: "🐟", risque: 0 },
  RHUM:      { id: "RHUM",     nom: "Rhum des Caraïbes",prixAchat: 500,   prixVente: 1_500, poids: 2,  emoji: "🍺", risque: 1 },
  EPICES:    { id: "EPICES",   nom: "Épices d'Orient",  prixAchat: 1_000, prixVente: 4_000, poids: 1,  emoji: "🌶️",risque: 2 },
  SOIE:      { id: "SOIE",     nom: "Soie de Chine",    prixAchat: 5_000, prixVente: 18_000,poids: 2,  emoji: "🧵", risque: 2 },
  OR_BRUT:   { id: "OR_BRUT",  nom: "Or brut",          prixAchat: 10_000,prixVente: 35_000,poids: 3,  emoji: "🪙", risque: 4 },
  DIAMANTS:  { id: "DIAMANTS", nom: "Diamants bruts",   prixAchat: 50_000,prixVente: 180_000,poids:2,  emoji: "💎", risque: 5 },
  ARTEFACT:  { id: "ARTEFACT", nom: "Artefact ancien",  prixAchat: 100_000,prixVente:400_000,poids:1,  emoji: "🏺", risque: 3 },
};

const PORTS = {
  TORTUGA:   { id: "TORTUGA",  nom: "Port Tortuga",      emoji: "🏝️", bonus_vente: 1.0, bonus_achat: 1.0, infamie_requis: 0   },
  NASSAU:    { id: "NASSAU",   nom: "Nassau la Pirate",  emoji: "🏴‍☠️",bonus_vente: 1.2, bonus_achat: 0.9, infamie_requis: 25  },
  CARTHAGENE:{ id: "CARTHAGENE",nom:"Carthagène",         emoji: "⚓",  bonus_vente: 1.4, bonus_achat: 0.8, infamie_requis: 50  },
  HAVANE:    { id: "HAVANE",   nom: "La Havane",         emoji: "🌴", bonus_vente: 1.6, bonus_achat: 0.7, infamie_requis: 100 },
  SINGAPORE: { id: "SINGAPORE",nom: "Singapour Noir",    emoji: "🌏", bonus_vente: 2.0, bonus_achat: 0.6, infamie_requis: 200 },
};

const EQUIPAGE = {
  CHARPENTIER:{ id:"CHARPENTIER",nom:"Charpentier",      cout: 5_000,  effet: "Répare +20% coque",      emoji: "🔨", bonus_coque: 0.20  },
  CANONNIER:  { id:"CANONNIER",  nom:"Canonnier Expert", cout: 15_000, effet: "+25% dégâts canon",       emoji: "💣", bonus_combat: 0.25 },
  NAVIGATEUR: { id:"NAVIGATEUR", nom:"Navigateur",       cout: 20_000, effet: "+1 exploration/jour",     emoji: "🧭", bonus_explo: 1     },
  MEDECIN:    { id:"MEDECIN",    nom:"Médecin de Bord",  cout: 12_000, effet: "-30% pertes en bataille", emoji: "⚕️", bonus_survie: 0.30 },
  CUISINIER:  { id:"CUISINIER",  nom:"Cuisinier",        cout: 8_000,  effet: "+15% moral équipage",     emoji: "🍖", bonus_moral: 0.15  },
  SORCIERE:   { id:"SORCIERE",   nom:"Sorcière Vaudou",  cout: 100_000,effet: "+50% chance trésor",      emoji: "🔮", bonus_tresor: 0.50 },
};

const ILES = [
  { nom: "Île des Crânes",     tresor_min: 5_000,    tresor_max: 30_000,   danger: 20, emoji: "💀" },
  { nom: "Baie des Naufragés", tresor_min: 10_000,   tresor_max: 80_000,   danger: 35, emoji: "⚓" },
  { nom: "Grotte du Diable",   tresor_min: 50_000,   tresor_max: 300_000,  danger: 50, emoji: "🦇" },
  { nom: "Île Fantôme",        tresor_min: 100_000,  tresor_max: 800_000,  danger: 65, emoji: "👻" },
  { nom: "Tombeau du Roi Mer", tresor_min: 500_000,  tresor_max: 3_000_000,danger: 80, emoji: "👑" },
];

const CIBLES_PILLAGE = [
  { nom: "Pêcheur solitaire",    butin_min: 1_000,   butin_max: 5_000,    resistance: 5,  emoji: "🎣", infamie_gain: 2  },
  { nom: "Marchand côtier",      butin_min: 5_000,   butin_max: 25_000,   resistance: 20, emoji: "⛵", infamie_gain: 5  },
  { nom: "Galion espagnol",      butin_min: 30_000,  butin_max: 150_000,  resistance: 40, emoji: "🚢", infamie_gain: 15 },
  { nom: "Convoi colonial",      butin_min: 100_000, butin_max: 500_000,  resistance: 60, emoji: "⚓", infamie_gain: 30 },
  { nom: "Trésorier royal",      butin_min: 500_000, butin_max: 2_000_000,resistance: 75, emoji: "👑", infamie_gain: 80 },
  { nom: "Flotte de l'Armada",   butin_min: 2_000_000,butin_max:10_000_000,resistance:90, emoji: "⚔️",infamie_gain: 200},
];

const EVENEMENTS_TAVERNE = [
  { nom: "Partie de dés",       gain_min: 500,   gain_max: 5_000,   risque: 40, emoji: "🎲" },
  { nom: "Bras de fer",         gain_min: 1_000, gain_max: 8_000,   risque: 35, emoji: "💪" },
  { nom: "Récit légendaire",    gain_min: 0,     gain_max: 0,       risque: 0,  emoji: "📖", special: "infamie" },
  { nom: "Recrutement surprise",gain_min: 0,     gain_max: 0,       risque: 0,  emoji: "🍻", special: "recrue" },
  { nom: "Carte au trésor",     gain_min: 0,     gain_max: 0,       risque: 0,  emoji: "🗺️", special: "carte"  },
  { nom: "Embuscade de rivaux", gain_min: -10_000,gain_max:-1_000,  risque: 100,emoji: "🔪" },
];

const dbl  = (n) => `${Math.floor(n).toLocaleString("fr-FR")} pièces d'or`;
const GP   = (n) => `⚜️ ${Math.floor(n).toLocaleString("fr-FR")}`;
const F    = (n) => Math.floor(n).toLocaleString("fr-FR");
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
function jauge(val, max, len = 16) {
  const p = Math.min(val, max) / max;
  const f = Math.round(p * len);
  return `▰`.repeat(f) + `▱`.repeat(len - f);
}
function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRang(pirate) {
  let r = RANGS[0];
  for (const rg of RANGS) {
    if (pirate.totalPille >= rg.min) r = rg;
    else break;
  }
  return r;
}

function getCargoUsed(pirate) {
  return Object.entries(pirate.cale).reduce((sum, [id, qte]) => {
    return sum + (MARCHANDISES[id]?.poids || 1) * qte;
  }, 0);
}

function getCargoMax(pirate) {
  return NAVIRES[pirate.navire]?.cargo || 50;
}

function initPirate() {
  return {
    or:              500,
    totalPille:      0,
    totalDepense:    0,
    navire:          "BARQUE",
    coqueActuelle:   100,
    equipage:        [],
    moral:           100,
    rang:            "MOUSSE",
    infamie:         0,
    cale:            {},
    portActuel:      "TORTUGA",
    cartesDecouvertes: [],
    pillages:        0,
    batailles:       { wins: 0, losses: 0 },
    explorations:    0,
    tresors:         0,
    commerces:       0,
    lastPillage:     null,
    lastPeche:       null,
    lastCommerce:    null,
    lastBataille:    null,
    lastExploration: null,
    lastTaverne:     null,
    lastDaily:       null,
    lastRecrutement: null,
    lastChasseTresor:null,
    streak:          0,
    achievements:    [],
    transactions:    [],
    premium:         false,
    venteBoost:      0,
    venteExpiry:     null,
  };
}

function addTx(pirate, type, montant, desc) {
  pirate.transactions.push({ type, montant, description: desc, date: Date.now() });
  if (pirate.transactions.length > 40) pirate.transactions = pirate.transactions.slice(-40);
}

function checkAchievements(pirate) {
  const defs = [
    { id: "PREMIER_PILLAGE",   check: p => p.pillages >= 1 },
    { id: "DIX_PILLAGES",      check: p => p.pillages >= 10 },
    { id: "CENT_PILLAGES",     check: p => p.pillages >= 100 },
    { id: "PREMIER_TRESOR",    check: p => p.tresors >= 1 },
    { id: "CINQ_TRESORS",      check: p => p.tresors >= 5 },
    { id: "CAPITAINE",         check: p => p.rang === "CAPITAINE" },
    { id: "ROI_MERS",          check: p => p.rang === "ROI_MERS" },
    { id: "VAISSEAU_GUERRE",   check: p => ["VAISSEAU","LEVIATHAN"].includes(p.navire) },
    { id: "LEVIATHAN",         check: p => p.navire === "LEVIATHAN" },
    { id: "MILLIONNAIRE",      check: p => p.totalPille >= 1_000_000 },
    { id: "DIX_MILLIONS",      check: p => p.totalPille >= 10_000_000 },
    { id: "CENT_MILLIONS",     check: p => p.totalPille >= 100_000_000 },
    { id: "INFAME",            check: p => p.infamie >= 100 },
    { id: "LEGENDAIRE",        check: p => p.infamie >= 500 },
    { id: "FULL_EQUIPAGE",     check: p => p.equipage.length >= 6 },
    { id: "EXPLORATEUR",       check: p => p.explorations >= 20 },
    { id: "COMMERCANT",        check: p => p.commerces >= 50 },
    { id: "STREAKER_7",        check: p => p.streak >= 7 },
  ];
  const nouveaux = [];
  for (const d of defs) {
    if (!pirate.achievements.includes(d.id) && d.check(pirate)) {
      pirate.achievements.push(d.id);
      nouveaux.push(d.id);
    }
  }
  return nouveaux;
}

function renderDashboard(pirate) {
  const rang    = getRang(pirate);
  const navire  = NAVIRES[pirate.navire];
  const port    = PORTS[pirate.portActuel];
  const cargoU  = getCargoUsed(pirate);
  const cargoM  = getCargoMax(pirate);
  const coqueBar = jauge(pirate.coqueActuelle, navire.coque);
  const moraleBar = jauge(pirate.moral, 100);
  const cargoBar  = jauge(cargoU, cargoM);
  const infamieBar = jauge(pirate.infamie, 500, 16);

  return `
${fonts.bold("🏴‍☠️  PIRATE LEGEND  ⚓")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${rang.emoji}  ${fonts.bold(rang.nom.toUpperCase())}
${navire.emoji} ${navire.nom}  |  Port : ${port.nom}

${fonts.bold("💰 TRÉSORERIE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
Or actuel   : ${GP(pirate.or)}
Total pillé : ${GP(pirate.totalPille)}

${fonts.bold("⚓ NAVIRE & ÉQUIPAGE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
Coque    [${coqueBar}] ${pirate.coqueActuelle}/${navire.coque}
Moral    [${moraleBar}] ${pirate.moral}/100
Cargo    [${cargoBar}] ${cargoU}/${cargoM}
Canons   ✦ ${navire.canons}  |  Vitesse ✦ ${navire.vitesse}
Équipage ✦ ${pirate.equipage.length}/6

${fonts.bold("☠️ RÉPUTATION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
Infamie  [${infamieBar}] ${pirate.infamie}/500
Pillages ✦ ${pirate.pillages}  |  Trésors ✦ ${pirate.tresors}
Batailles ✦ ${pirate.batailles.wins}V / ${pirate.batailles.losses}D
Explorations ✦ ${pirate.explorations}
Série daily ✦ ${pirate.streak} jours
Succès ✦ ${pirate.achievements.length}/18

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏴‍☠️  Pillage      ${timeLeft(pirate.lastPillage, COOLDOWNS.PILLAGE) || "✅ Prêt"}
🎣  Pêche        ${timeLeft(pirate.lastPeche, COOLDOWNS.PECHE) || "✅ Prête"}
⚓  Commerce     ${timeLeft(pirate.lastCommerce, COOLDOWNS.COMMERCE) || "✅ Prêt"}
⚔️  Bataille     ${timeLeft(pirate.lastBataille, COOLDOWNS.BATAILLE) || "✅ Prête"}
🗺️  Exploration  ${timeLeft(pirate.lastExploration, COOLDOWNS.EXPLORATION) || "✅ Prête"}
🍺  Taverne      ${timeLeft(pirate.lastTaverne, COOLDOWNS.TAVERNE) || "✅ Prête"}
🎁  Daily        ${timeLeft(pirate.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
  return `
${fonts.bold("🏴‍☠️  PIRATE LEGEND — GUIDE DU CORSAIRE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("⚓ BASE & NAVIGATION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 pirate stat — Tableau de bord
🎁 pirate daily — Bonus quotidien
🌴 pirate port <ID> — Changer de port
⚓ pirate navire list — Voir les navires
⚓ pirate navire acheter <ID> — Acheter un navire

${fonts.bold("🏴‍☠️ PILLAGE & COMBAT")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏴‍☠️ pirate pillage [N°] — Attaquer une cible
⚔️ pirate bataille @pirate — Défier un autre pirate

${fonts.bold("🗺️ EXPLORATION & TRÉSOR")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🗺️ pirate explorer — Explorer une île
💎 pirate tresor — Chasse au trésor (carte)

${fonts.bold("⚖️ COMMERCE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⚖️ pirate marche — Prix du marché actuel
🛒 pirate acheter <ID> <qte> — Acheter une marchandise
💰 pirate vendre <ID> <qte> — Vendre au port actuel
📦 pirate cale — Voir votre cargaison
🎣 pirate peche — Pêcher (gratuit, toutes les 30min)

${fonts.bold("⚔️ ÉQUIPAGE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 pirate equipage list — Voir le crew dispo
🤝 pirate equipage recruter <ID> — Recruter

${fonts.bold("🍺 TAVERNE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🍺 pirate taverne — Tenter la chance

${fonts.bold("📊 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 pirate rang — Votre rang & progression
🏅 pirate achievements — Succès débloqués
👑 pirate classement — Top pirates
📋 pirate history — Transactions
💎 pirate premium — Avantages premium
`.trim();
}

async function cmdPort(message, args, pirate, save) {
  const pId = (args[1] || "").toUpperCase();
  if (!pId) {
    let txt = `${fonts.bold("🌴 PORTS DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, p] of Object.entries(PORTS)) {
      const acc = pirate.infamie >= p.infamie_requis;
      const actuel = pirate.portActuel === id;
      txt += `  ${p.emoji}  ${fonts.bold(p.nom)} [${id}]\n`;
      txt += `     Vente  ×${p.bonus_vente}  |  Achat  ×${p.bonus_achat}\n`;
      txt += `     Infamie requise : ${p.infamie_requis}\n`;
      txt += `     ${actuel ? fonts.bold("⚓ PORT ACTUEL") : acc ? "✅ Accessible" : "🔒 Réputation insuffisante"}\n\n`;
    }
    txt += `💡 Usage : pirate port <ID>`;
    return message.reply(txt);
  }
  const p = PORTS[pId];
  if (!p) return message.reply(fonts.bold("❌ Port inconnu. Tape 'pirate port' pour la liste."));
  if (pirate.infamie < p.infamie_requis) return message.reply(fonts.bold(`❌ Il te faut ${p.infamie_requis} d'infamie pour accoster à ${p.nom}. Tu en as ${pirate.infamie}.`));
  pirate.portActuel = pId;
  await save();
  return message.reply(`
${p.emoji}  ${fonts.bold("CAP SUR " + p.nom.toUpperCase() + " !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bonus vente  : ×${p.bonus_vente}
Bonus achat  : ×${p.bonus_achat}

💡 Ancres jetées. Prêt à commercer !
`.trim());
}

async function cmdNavire(message, args, pirate, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("⚓ NAVIRES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, n] of Object.entries(NAVIRES)) {
      const actuel = pirate.navire === id;
      txt += `  ${n.emoji}  ${fonts.bold(n.nom)} [${id}]\n`;
      txt += `     💰 Prix     : ${n.cout > 0 ? GP(n.cout) : "Gratuit (départ)"}\n`;
      txt += `     🛡️ Coque    : ${n.coque}  |  💣 Canons : ${n.canons}\n`;
      txt += `     📦 Cargo    : ${n.cargo}  |  ⚡ Vitesse : ${n.vitesse}\n`;
      txt += `     ${actuel ? fonts.bold("⚓ VOTRE NAVIRE") : "🔒 Non acquis"}\n\n`;
    }
    txt += `💡 Usage : pirate navire acheter <ID>`;
    return message.reply(txt);
  }

  if (sub === "acheter") {
    const nId = (args[2] || "").toUpperCase();
    const n = NAVIRES[nId];
    if (!n) return message.reply(fonts.bold("❌ Navire inconnu."));
    const actuel = NAVIRES[pirate.navire];
    if (n.coque <= actuel.coque) return message.reply(fonts.bold("❌ Ce navire est moins puissant que le tien."));
    if ((user.money || 0) < n.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Prix : ${GP(n.cout)}`));
    user.money -= n.cout;
    pirate.navire = nId;
    pirate.coqueActuelle = n.coque;
    addTx(pirate, "navire", -n.cout, `Nouveau navire : ${n.nom}`);
    const ach = checkAchievements(pirate);
    await save();
    return message.reply(`
${n.emoji}  ${fonts.bold("NOUVEAU NAVIRE : " + n.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️  Coque    : ${n.coque}
💣  Canons   : ${n.canons}
📦  Cargo    : ${n.cargo}
⚡  Vitesse  : ${n.vitesse}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : pirate navire [list|acheter]"));
}

async function cmdPillage(message, args, pirate, user, save) {
  const cd = timeLeft(pirate.lastPillage, COOLDOWNS.PILLAGE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochain pillage dans ${cd}.`));

  const num = parseInt(args[1]);
  if (!num) {
    let txt = `${fonts.bold("🏴‍☠️ CHOISIR UNE CIBLE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    CIBLES_PILLAGE.forEach((c, i) => {
      txt += `  [${i + 1}]  ${c.emoji}  ${fonts.bold(c.nom)}\n`;
      txt += `       Butin : ${GP(c.butin_min)} — ${GP(c.butin_max)}\n`;
      txt += `       Résistance : ${"⚔️".repeat(Math.ceil(c.resistance / 20))}\n`;
      txt += `       Infamie +${c.infamie_gain}\n\n`;
    });
    txt += `💡 Usage : pirate pillage <N°>  —  Ex : pirate pillage 2`;
    return message.reply(txt);
  }

  const idx = num - 1;
  if (idx < 0 || idx >= CIBLES_PILLAGE.length) return message.reply(fonts.bold(`❌ Cible invalide (1-${CIBLES_PILLAGE.length}).`));
  const cible = CIBLES_PILLAGE[idx];
  const navire = NAVIRES[pirate.navire];
  const rang = getRang(pirate);

  const bonusCombat = pirate.equipage.includes("CANONNIER") ? EQUIPAGE.CANONNIER.bonus_combat : 0;
  const bonusSurvie = pirate.equipage.includes("MEDECIN") ? EQUIPAGE.MEDECIN.bonus_survie : 0;
  const chanceBase = Math.min(0.90, 0.40 + (navire.canons / 200) + rang.bonus + bonusCombat + (pirate.premium ? 0.05 : 0));
  const succes = Math.random() * 100 > cible.resistance * (1 - chanceBase);

  pirate.lastPillage = Date.now();
  pirate.pillages++;
  pirate.infamie = Math.min(500, pirate.infamie + cible.infamie_gain);
  pirate.rang = getRang(pirate).id;

  if (succes) {
    const butin = rand(cible.butin_min, cible.butin_max);
    const butinFinal = Math.floor(butin * (1 + rang.bonus) * (pirate.premium ? 1.3 : 1));
    user.money = (user.money || 0) + butinFinal;
    pirate.totalPille += butinFinal;
    pirate.moral = Math.min(100, pirate.moral + 5);
    addTx(pirate, "pillage", butinFinal, `Pillage : ${cible.nom}`);
    const ach = checkAchievements(pirate);
    await save();
    return message.reply(`
${cible.emoji}  ${fonts.bold("PILLAGE RÉUSSI !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cible         : ${cible.nom}
Butin récolté : ${fonts.bold(GP(butinFinal))}
Infamie       : +${cible.infamie_gain} (total : ${pirate.infamie})
Moral         : +5
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
  } else {
    const degats = rand(10, Math.floor(navire.coque * 0.3 * (1 - bonusSurvie)));
    pirate.coqueActuelle = Math.max(1, pirate.coqueActuelle - degats);
    pirate.moral = Math.max(0, pirate.moral - 10);
    addTx(pirate, "pillage_echec", 0, `Pillage raté : ${cible.nom}`);
    await save();
    return message.reply(`
${cible.emoji}  ${fonts.bold("PILLAGE ÉCHOUÉ !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cible         : ${cible.nom}
Dégâts coque  : -${degats} (reste : ${pirate.coqueActuelle}/${navire.coque})
Moral         : -10

💡 Fais réparer ton navire et réessaie !
`.trim());
  }
}

async function cmdExplorer(message, pirate, user, save) {
  const cd = timeLeft(pirate.lastExploration, COOLDOWNS.EXPLORATION);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine exploration dans ${cd}.`));

  const ile = pick(ILES);
  const navire = NAVIRES[pirate.navire];
  const bonusSorciere = pirate.equipage.includes("SORCIERE") ? EQUIPAGE.SORCIERE.bonus_tresor : 0;
  const survie = Math.random() * 100 > ile.danger * (1 - (navire.vitesse / 20) - bonusSorciere);

  pirate.lastExploration = Date.now();
  pirate.explorations++;

  if (survie) {
    const tresor = rand(ile.tresor_min, ile.tresor_max);
    const tresorFinal = Math.floor(tresor * (pirate.premium ? 1.5 : 1));
    user.money = (user.money || 0) + tresorFinal;
    pirate.totalPille += tresorFinal;
    pirate.tresors++;
    const carteTrouvee = Math.random() < 0.20 + bonusSorciere;
    if (carteTrouvee && !pirate.cartesDecouvertes.includes(ile.nom)) {
      pirate.cartesDecouvertes.push(ile.nom);
    }
    addTx(pirate, "exploration", tresorFinal, `Exploration : ${ile.nom}`);
    const ach = checkAchievements(pirate);
    await save();
    return message.reply(`
${ile.emoji}  ${fonts.bold("EXPLORATION : " + ile.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trésor trouvé : ${fonts.bold(GP(tresorFinal))}
${carteTrouvee ? `🗺️  Carte découverte ! (${pirate.cartesDecouvertes.length} cartes)` : ""}
Trésors total : ${pirate.tresors}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
  } else {
    const degats = rand(15, 60);
    pirate.coqueActuelle = Math.max(1, pirate.coqueActuelle - degats);
    addTx(pirate, "exploration_echec", 0, `Exploration ratée : ${ile.nom}`);
    await save();
    return message.reply(`
${ile.emoji}  ${fonts.bold("EXPÉDITION DANGEREUSE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Île            : ${ile.nom}
Résultat       : Piège ! Demi-tour forcé.
Dégâts coque   : -${degats} (reste : ${pirate.coqueActuelle})
`.trim());
  }
}

async function cmdChasseTresor(message, pirate, user, save) {
  const cd = timeLeft(pirate.lastChasseTresor, COOLDOWNS.CHASSE_TRESOR);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine chasse au trésor dans ${cd}.`));
  if (pirate.cartesDecouvertes.length === 0) return message.reply(fonts.bold("❌ Tu n'as aucune carte au trésor. Explore des îles pour en trouver !"));

  const carte = pick(pirate.cartesDecouvertes);
  const ile = ILES.find(i => i.nom === carte) || pick(ILES);
  const bonusSorciere = pirate.equipage.includes("SORCIERE") ? EQUIPAGE.SORCIERE.bonus_tresor : 0;
  const tresor = Math.floor(rand(ile.tresor_min * 2, ile.tresor_max * 3) * (1 + bonusSorciere) * (pirate.premium ? 1.5 : 1));

  user.money = (user.money || 0) + tresor;
  pirate.totalPille += tresor;
  pirate.tresors++;
  pirate.cartesDecouvertes = pirate.cartesDecouvertes.filter(c => c !== carte);
  pirate.lastChasseTresor = Date.now();
  addTx(pirate, "tresor", tresor, `Chasse au trésor : ${carte}`);
  const ach = checkAchievements(pirate);
  await save();

  return message.reply(`
🗺️  ${fonts.bold("TRÉSOR TROUVÉ !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Carte utilisée : ${fonts.italic(carte)}
Trésor récolté : ${fonts.bold(GP(tresor))}
Cartes restantes : ${pirate.cartesDecouvertes.length}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
}

async function cmdMarche(message, pirate) {
  const port = PORTS[pirate.portActuel];
  let txt = `${fonts.bold("⚖️ MARCHÉ DE " + port.nom.toUpperCase())}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [id, m] of Object.entries(MARCHANDISES)) {
    const prixAchat = Math.floor(m.prixAchat * port.bonus_achat);
    const prixVente = Math.floor(m.prixVente * port.bonus_vente);
    const enCale = pirate.cale[id] || 0;
    txt += `  ${m.emoji}  ${fonts.bold(m.nom)} [${id}]\n`;
    txt += `     Achat : ${GP(prixAchat)}  |  Vente : ${GP(prixVente)}\n`;
    txt += `     Poids : ${m.poids}/unité  |  Stock cale : ${enCale}\n\n`;
  }
  const cargoU = getCargoUsed(pirate);
  const cargoM = getCargoMax(pirate);
  txt += `📦  Cale : ${cargoU}/${cargoM}  [${jauge(cargoU, cargoM, 16)}]`;
  return message.reply(txt);
}

async function cmdAcheter(message, args, pirate, user, save) {
  const mId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]) || 1;
  const m = MARCHANDISES[mId];
  if (!m) return message.reply(fonts.bold("❌ Marchandise inconnue. Tape 'pirate marche'."));
  const port = PORTS[pirate.portActuel];
  const prixUnit = Math.floor(m.prixAchat * port.bonus_achat);
  const total = prixUnit * qte;
  const poidsTotal = m.poids * qte;
  const cargoU = getCargoUsed(pirate);
  const cargoM = getCargoMax(pirate);
  if (cargoU + poidsTotal > cargoM) return message.reply(fonts.bold(`❌ Cale pleine ! Place dispo : ${cargoM - cargoU}  |  Requis : ${poidsTotal}`));
  if ((user.money || 0) < total) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${GP(total)}`));
  user.money -= total;
  pirate.cale[mId] = (pirate.cale[mId] || 0) + qte;
  addTx(pirate, "achat_marche", -total, `Acheté ${qte}× ${m.nom}`);
  await save();
  return message.reply(`
${m.emoji}  ${fonts.bold("ACHAT : " + m.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quantité  : ${qte}
Prix/unité : ${GP(prixUnit)}
Total payé : ${GP(total)}
Cale       : ${getCargoUsed(pirate)}/${cargoM}
`.trim());
}

async function cmdVendre(message, args, pirate, user, save) {
  const mId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]) || 1;
  const m = MARCHANDISES[mId];
  if (!m) return message.reply(fonts.bold("❌ Marchandise inconnue."));
  if (!pirate.cale[mId] || pirate.cale[mId] < qte) return message.reply(fonts.bold(`❌ Tu n'as que ${pirate.cale[mId] || 0}× ${m.nom} dans ta cale.`));
  const port = PORTS[pirate.portActuel];
  const rang = getRang(pirate);
  const venteBoost = (pirate.venteExpiry && Date.now() < pirate.venteExpiry) ? pirate.venteBoost : 0;
  const prixUnit = Math.floor(m.prixVente * port.bonus_vente * (1 + rang.bonus) * (1 + venteBoost));
  const total = prixUnit * qte;
  user.money = (user.money || 0) + total;
  pirate.cale[mId] -= qte;
  if (pirate.cale[mId] <= 0) delete pirate.cale[mId];
  pirate.totalPille += total;
  pirate.commerces++;
  addTx(pirate, "vente_marche", total, `Vendu ${qte}× ${m.nom} à ${port.nom}`);
  const ach = checkAchievements(pirate);
  await save();
  return message.reply(`
${m.emoji}  ${fonts.bold("VENTE : " + m.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Port      : ${port.emoji} ${port.nom}
Quantité  : ${qte}
Prix/unité : ${GP(prixUnit)}
Revenu    : ${fonts.bold(GP(total))}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
}

async function cmdCale(message, pirate) {
  const cargoU = getCargoUsed(pirate);
  const cargoM = getCargoMax(pirate);
  let txt = `${fonts.bold("📦 CALE DU NAVIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `Capacité : ${cargoU}/${cargoM}  [${jauge(cargoU, cargoM)}]\n\n`;
  const items = Object.entries(pirate.cale).filter(([, q]) => q > 0);
  if (items.length === 0) {
    txt += fonts.italic("Cale vide. Achète des marchandises !");
  } else {
    items.forEach(([id, qte]) => {
      const m = MARCHANDISES[id];
      if (m) txt += `  ${m.emoji}  ${m.nom} : ${qte} unités (poids : ${m.poids * qte})\n`;
    });
  }
  return message.reply(txt);
}

async function cmdPeche(message, pirate, user, save) {
  const cd = timeLeft(pirate.lastPeche, COOLDOWNS.PECHE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine pêche dans ${cd}.`));
  const cargoU = getCargoUsed(pirate);
  const cargoM = getCargoMax(pirate);
  if (cargoU + 1 > cargoM) return message.reply(fonts.bold("❌ Cale pleine ! Vends d'abord tes marchandises."));
  const qte = rand(1, 5);
  const placeRestante = cargoM - cargoU;
  const qteFinal = Math.min(qte, placeRestante);
  pirate.cale["POISSON"] = (pirate.cale["POISSON"] || 0) + qteFinal;
  pirate.lastPeche = Date.now();
  addTx(pirate, "peche", 0, `Pêche : ${qteFinal} poissons`);
  await save();
  return message.reply(`
🎣  ${fonts.bold("PÊCHE RÉUSSIE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Poissons pêchés : ${qteFinal}
Stock cale      : ${pirate.cale["POISSON"]}

💡 Vends-les au marché : pirate vendre POISSON <qte>
`.trim());
}

async function cmdEquipage(message, args, pirate, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("⚔️ ÉQUIPAGE DISPONIBLE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, e] of Object.entries(EQUIPAGE)) {
      const recrute = pirate.equipage.includes(id);
      txt += `  ${e.emoji}  ${fonts.bold(e.nom)} [${id}]\n`;
      txt += `     Coût   : ${GP(e.cout)}\n`;
      txt += `     Effet  : ${fonts.italic(e.effet)}\n`;
      txt += `     ${recrute ? fonts.bold("✅ À BORD") : "🔒 Non recruté"}\n\n`;
    }
    txt += `💡 Usage : pirate equipage recruter <ID>`;
    return message.reply(txt);
  }

  if (sub === "recruter") {
    const eId = (args[2] || "").toUpperCase();
    const e = EQUIPAGE[eId];
    if (!e) return message.reply(fonts.bold("❌ Membre inconnu. Tape 'pirate equipage list'."));
    if (pirate.equipage.includes(eId)) return message.reply(fonts.bold("❌ Déjà à bord."));
    if ((user.money || 0) < e.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${GP(e.cout)}`));
    user.money -= e.cout;
    pirate.equipage.push(eId);
    addTx(pirate, "recrutement", -e.cout, `Recrutement : ${e.nom}`);
    const ach = checkAchievements(pirate);
    await save();
    return message.reply(`
${e.emoji}  ${fonts.bold("RECRUTÉ : " + e.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Coût payé : ${GP(e.cout)}
Effet     : ${fonts.italic(e.effet)}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : pirate equipage [list|recruter]"));
}

async function cmdTaverne(message, pirate, user, save) {
  const cd = timeLeft(pirate.lastTaverne, COOLDOWNS.TAVERNE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine visite à la taverne dans ${cd}.`));

  const evt = pick(EVENEMENTS_TAVERNE);
  pirate.lastTaverne = Date.now();

  if (evt.special === "infamie") {
    const gain = rand(5, 20);
    pirate.infamie = Math.min(500, pirate.infamie + gain);
    await save();
    return message.reply(`
${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 Tu racontes tes exploits à la taverne...
Infamie +${gain} (total : ${pirate.infamie}/500)
`.trim());
  }

  if (evt.special === "carte") {
    const ile = pick(ILES);
    if (!pirate.cartesDecouvertes.includes(ile.nom)) {
      pirate.cartesDecouvertes.push(ile.nom);
    }
    await save();
    return message.reply(`
${evt.emoji}  ${fonts.bold("CARTE AU TRÉSOR TROUVÉE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️ Un marin ivre te vend une carte...
Destination : ${fonts.italic(ile.nom)}
Cartes totales : ${pirate.cartesDecouvertes.length}

💡 Tape 'pirate tresor' pour l'utiliser !
`.trim());
  }

  if (evt.special === "recrue") {
    pirate.moral = Math.min(100, pirate.moral + 15);
    await save();
    return message.reply(`
${evt.emoji}  ${fonts.bold("FÊTE À LA TAVERNE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🍻 L'équipage fête la nuit... Moral +15 (${pirate.moral}/100)
`.trim());
  }

  const won = Math.random() * 100 > evt.risque;
  if (won) {
    const gain = rand(evt.gain_min, evt.gain_max);
    user.money = (user.money || 0) + gain;
    pirate.totalPille += gain;
    addTx(pirate, "taverne_win", gain, `Taverne : ${evt.nom}`);
    await save();
    return message.reply(`
${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Victoire !
Gain     : ${fonts.bold(GP(gain))}
`.trim());
  } else {
    const perte = Math.abs(rand(evt.gain_min, evt.gain_max));
    user.money = Math.max(0, (user.money || 0) - perte);
    addTx(pirate, "taverne_loss", -perte, `Taverne : ${evt.nom}`);
    await save();
    return message.reply(`
${evt.emoji}  ${fonts.bold(evt.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💀 Défaite !
Perte    : ${GP(perte)}
`.trim());
  }
}

async function cmdBataille(message, args, pirate, usersData, senderID, event, user, save) {
  const cd = timeLeft(pirate.lastBataille, COOLDOWNS.BATAILLE);
  if (cd) return message.reply(fonts.bold(`⏳ Prochaine bataille dans ${cd}.`));

  const targetID = Object.keys(event.mentions)[0];
  if (!targetID) return message.reply(fonts.bold("❌ Mentionne un pirate à défier.\nUsage : pirate bataille @pirate"));
  if (targetID === senderID) return message.reply(fonts.bold("❌ Tu ne peux pas t'attaquer toi-même."));

  let targetUser = await usersData.get(targetID);
  if (!targetUser?.data?.pirate) return message.reply(fonts.bold("❌ Ce joueur n'a pas de navire."));
  const targetPirate = targetUser.data.pirate;

  const monNavire = NAVIRES[pirate.navire];
  const sonNavire = NAVIRES[targetPirate.navire];
  const bonusCombat = pirate.equipage.includes("CANONNIER") ? EQUIPAGE.CANONNIER.bonus_combat : 0;
  const bonusSurvie = pirate.equipage.includes("MEDECIN") ? EQUIPAGE.MEDECIN.bonus_survie : 0;

  const monScore = monNavire.canons * (1 + bonusCombat) + pirate.infamie / 10 + Math.random() * 20;
  const sonScore = sonNavire.canons + targetPirate.infamie / 10 + Math.random() * 20;

  pirate.lastBataille = Date.now();

  if (monScore > sonScore) {
    const butin = Math.floor((targetUser.money || 0) * 0.15);
    user.money = (user.money || 0) + butin;
    targetUser.money = Math.max(0, (targetUser.money || 0) - butin);
    pirate.batailles.wins++;
    pirate.infamie = Math.min(500, pirate.infamie + 10);
    pirate.totalPille += butin;
    addTx(pirate, "bataille_win", butin, `Bataille navale gagnée`);
    targetUser.data.pirate = targetPirate;
    await usersData.set(targetID, targetUser);
    const ach = checkAchievements(pirate);
    await save();
    return message.reply(`
⚔️  ${fonts.bold("BATAILLE NAVALE GAGNÉE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score : ${Math.round(monScore)} ⚔️  ${Math.round(sonScore)}
Butin pillé : ${fonts.bold(GP(butin))}
Infamie +10
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
  } else {
    const degats = rand(20, Math.floor(monNavire.coque * 0.30 * (1 - bonusSurvie)));
    pirate.coqueActuelle = Math.max(1, pirate.coqueActuelle - degats);
    pirate.batailles.losses++;
    pirate.moral = Math.max(0, pirate.moral - 15);
    addTx(pirate, "bataille_loss", 0, `Bataille navale perdue`);
    await save();
    return message.reply(`
⚔️  ${fonts.bold("BATAILLE NAVALE PERDUE...")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score : ${Math.round(monScore)} ⚔️  ${Math.round(sonScore)}
Dégâts coque : -${degats} (reste : ${pirate.coqueActuelle})
Moral -15
`.trim());
  }
}

async function cmdRang(message, pirate) {
  const rang = getRang(pirate);
  const idx = RANGS.findIndex(r => r.id === rang.id);
  const next = RANGS[idx + 1] || null;
  let txt = `${rang.emoji}  ${fonts.bold("RANG : " + rang.nom.toUpperCase())}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `⚜️  Total pillé    : ${GP(pirate.totalPille)}\n`;
  txt += `☠️  Infamie         : ${pirate.infamie}/500\n`;
  txt += `💰  Bonus gains     : +${Math.round(rang.bonus * 100)}%\n\n`;
  if (next) {
    txt += `⬆️  Prochain rang   : ${next.emoji} ${next.nom}\n`;
    txt += `   Requis          : ${GP(next.min)} pillé\n`;
    txt += `   Manque          : ${GP(Math.max(0, next.min - pirate.totalPille))}\n`;
    txt += `   Infamie requise : ${next.infamie}\n\n`;
  } else {
    txt += fonts.bold("👑 Rang MAXIMUM atteint !\n\n");
  }
  txt += fonts.bold("📜 TOUS LES RANGS :\n");
  RANGS.forEach(r => {
    txt += `  ${rang.id === r.id ? "▶ " : "   "}${r.emoji}  ${r.nom} — dès ${GP(r.min)}\n`;
  });
  return message.reply(txt);
}

async function cmdDaily(message, pirate, user, save) {
  const cd = timeLeft(pirate.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`⏳ Daily réclamé. Prochain dans ${cd}.`));

  const maintenant = Date.now();
  if (pirate.lastDaily && maintenant - pirate.lastDaily < COOLDOWNS.DAILY * 2) pirate.streak++;
  else pirate.streak = 1;

  const rang = getRang(pirate);
  const idx  = RANGS.findIndex(r => r.id === rang.id);
  const base = 2_000 + idx * 3_000;
  const streakBonus = Math.min(pirate.streak * 500, 8_000);
  const premiumMult = pirate.premium ? 2 : 1;
  const total = Math.floor((base + streakBonus) * premiumMult);

  user.money = (user.money || 0) + total;
  pirate.totalPille += total;
  pirate.moral = Math.min(100, pirate.moral + 10);
  pirate.lastDaily = maintenant;

  let carteBonus = "";
  if (pirate.streak % 7 === 0) {
    const ile = pick(ILES);
    if (!pirate.cartesDecouvertes.includes(ile.nom)) {
      pirate.cartesDecouvertes.push(ile.nom);
      carteBonus = `\n🗺️  Carte bonus : ${fonts.italic(ile.nom)}`;
    }
  }

  addTx(pirate, "daily", total, `Daily (streak ${pirate.streak}j)`);
  const ach = checkAchievements(pirate);
  await save();

  return message.reply(`
🎁  ${fonts.bold("BUTIN QUOTIDIEN !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base          : ${GP(base)}
Bonus streak  : ${GP(streakBonus)} (${pirate.streak} jours)
${pirate.premium ? "Bonus premium : ×2" : ""}
──────────────────────────────
${fonts.bold("Total : " + GP(total))}
Moral  : +10 (${pirate.moral}/100)
${carteBonus}
${ach.length > 0 ? `\n☠️  Succès : ${ach.join(", ")}` : ""}
`.trim());
}

async function cmdAchievements(message, pirate) {
  const liste = {
    PREMIER_PILLAGE:  { emoji: "🏴‍☠️", nom: "Premier Pillage",     desc: "Attaquer sa 1ère cible" },
    DIX_PILLAGES:     { emoji: "⚔️",  nom: "Dix Pillages",         desc: "10 pillages réussis" },
    CENT_PILLAGES:    { emoji: "💀",  nom: "Cent Pillages",         desc: "100 pillages réussis" },
    PREMIER_TRESOR:   { emoji: "🗺️", nom: "Chasseur de Trésor",    desc: "Trouver son 1er trésor" },
    CINQ_TRESORS:     { emoji: "💎",  nom: "Archéologue Maudit",    desc: "5 trésors trouvés" },
    CAPITAINE:        { emoji: "🏴‍☠️", nom: "Capitaine !",         desc: "Atteindre le rang Capitaine" },
    ROI_MERS:         { emoji: "👑",  nom: "Roi des Sept Mers",     desc: "Atteindre le rang ultime" },
    VAISSEAU_GUERRE:  { emoji: "⚓",  nom: "Capitaine de Vaisseau", desc: "Posséder un Vaisseau de Ligne" },
    LEVIATHAN:        { emoji: "💀",  nom: "Le Léviathan",          desc: "Posséder Le Léviathan Noir" },
    MILLIONNAIRE:     { emoji: "💰",  nom: "Millionnaire",          desc: "1M d'or pillé" },
    DIX_MILLIONS:     { emoji: "🤑",  nom: "10 Millions",           desc: "10M d'or pillé" },
    CENT_MILLIONS:    { emoji: "👑",  nom: "100 Millions",          desc: "100M d'or pillé" },
    INFAME:           { emoji: "☠️",  nom: "Infâme",                desc: "100 d'infamie" },
    LEGENDAIRE:       { emoji: "💀",  nom: "Légende des Mers",      desc: "500 d'infamie (max)" },
    FULL_EQUIPAGE:    { emoji: "🍻",  nom: "Équipage Complet",      desc: "6 membres recrutés" },
    EXPLORATEUR:      { emoji: "🗺️", nom: "Grand Explorateur",     desc: "20 explorations" },
    COMMERCANT:       { emoji: "⚖️",  nom: "Marchand des Mers",     desc: "50 ventes au marché" },
    STREAKER_7:       { emoji: "🔥",  nom: "Série de 7 jours",      desc: "7 daily consécutifs" },
  };
  const total = Object.keys(liste).length;
  let txt = `${fonts.bold("☠️ SUCCÈS DU CORSAIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `Progression : ${pirate.achievements.length}/${total}\n\n`;
  if (pirate.achievements.length === 0) {
    txt += fonts.italic("Aucun succès. Prends la mer !\n\n");
  } else {
    txt += fonts.bold("✅ DÉBLOQUÉS :") + "\n";
    pirate.achievements.slice(0, 10).forEach((id, i) => {
      const a = liste[id] || { emoji: "🏅", nom: id };
      txt += `  ${i + 1}. ${a.emoji}  ${a.nom}\n`;
    });
    if (pirate.achievements.length > 10) txt += `  ...et ${pirate.achievements.length - 10} de plus !\n`;
    txt += "\n";
  }
  txt += fonts.bold("🎯 PROCHAINS :") + "\n";
  Object.entries(liste).filter(([id]) => !pirate.achievements.includes(id)).slice(0, 5).forEach(([, a]) => {
    txt += `  • ${a.emoji}  ${a.nom} : ${fonts.italic(a.desc)}\n`;
  });
  return message.reply(txt);
}

async function cmdClassement(message, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const pirates = [];
    for (const [uid, u] of Object.entries(allUsers)) {
      const p = u.data?.pirate;
      if (p && p.totalPille > 0) {
        pirates.push({
          nom:       u.name || `Pirate ${uid.slice(-4)}`,
          totalPille:p.totalPille,
          infamie:   p.infamie || 0,
          rang:      getRang(p),
          premium:   p.premium || false,
        });
      }
    }
    pirates.sort((a, b) => b.totalPille - a.totalPille);
    const top = pirates.slice(0, 10);
    let txt = `${fonts.bold("👑 CLASSEMENT — LÉGENDES DES MERS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (top.length === 0) {
      txt += fonts.italic("Aucun pirate classé encore.");
    } else {
      top.forEach((p, i) => {
        const med = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `  #${i + 1}`;
        txt += `  ${med}  ${fonts.bold(p.nom)}${p.premium ? " 💎" : ""}\n`;
        txt += `       ${p.rang.emoji} ${p.rang.nom}\n`;
        txt += `       ${GP(p.totalPille)} pillé  |  ☠️ ${p.infamie} d'infamie\n\n`;
      });
    }
    return message.reply(txt);
  } catch (e) {
    return message.reply(fonts.bold("❌ Erreur classement."));
  }
}

async function cmdHistory(message, pirate) {
  const txs = pirate.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction."));
  const emojiMap = {
    pillage:"🏴‍☠️", pillage_echec:"💀", exploration:"🗺️", exploration_echec:"💥",
    tresor:"💎", achat_marche:"🛒", vente_marche:"⚖️", peche:"🎣",
    recrutement:"⚔️", navire:"⚓", bataille_win:"⚔️", bataille_loss:"💀",
    taverne_win:"🎲", taverne_loss:"🔪", daily:"🎁",
  };
  let txt = `${fonts.bold("📋 JOURNAL DE BORD (15 dernières)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txs.forEach(tx => {
    const e = emojiMap[tx.type] || "💼";
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `  ${e}  ${tx.description}\n     ${sign}${GP(tx.montant)} — ${date}\n\n`;
  });
  return message.reply(txt);
}

async function cmdPremium(message, args, pirate, user, save) {
  if ((args[1] || "").toLowerCase() === "buy") {
    const cout = 1_000_000;
    if ((user.money || 0) < cout) return message.reply(fonts.bold(`❌ Premium coûte ${GP(cout)}. Tu as ${GP(user.money || 0)}.`));
    user.money -= cout;
    pirate.premium = true;
    addTx(pirate, "premium", -cout, "Parchemin Premium");
    await save();
    return message.reply(`
💎  ${fonts.bold("PARCHEMIN LÉGENDAIRE ACTIVÉ !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅  Pillage ×1.3
✅  Daily ×2
✅  Exploration ×1.5
✅  Ventes bonus +20%
`.trim());
  }
  return message.reply(`
💎  ${fonts.bold("PARCHEMIN LÉGENDAIRE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statut : ${pirate.premium ? fonts.bold("✅ Actif") : "❌ Inactif"}
Prix   : ${GP(1_000_000)}

Avantages :
• Pillage ×1.3
• Daily ×2
• Exploration ×1.5
• Ventes +20%

${!pirate.premium ? `💡 pirate premium buy pour activer !` : ""}
`.trim());
}

module.exports = {
  config: {
    name:        "pirate",
    aliases:     ["corsaire", "buccaneer", "buccanier"],
    version:     "1.0",
    author:      "Christus",
    countDown:   3,
    role:        0,
    description: {
      fr: "🏴‍☠️ Pirate Legend — De mousse à Roi des Sept Mers. Pillez, explorez, commercez et bâtissez votre légende.",
    },
    category: "economy",
    guide: { fr: "Tape 'pirate help' pour voir toutes les commandes." },
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.pirate) user.data.pirate = initPirate();

    const pirate = user.data.pirate;
    pirate.rang = getRang(pirate).id;

    const save = async () => {
      user.data.pirate = pirate;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help": case "aide":
        return message.reply(renderHelp());

      case "stat": case "status": case "profil": case "dashboard": case "bord":
        return message.reply(renderDashboard(pirate));

      case "port":
        return cmdPort(message, args, pirate, save);

      case "navire": case "ship":
        return cmdNavire(message, args, pirate, user, save);

      case "pillage": case "attaquer": case "piller":
        return cmdPillage(message, args, pirate, user, save);

      case "explorer": case "exploration":
        return cmdExplorer(message, pirate, user, save);

      case "tresor": case "carte":
        return cmdChasseTresor(message, pirate, user, save);

      case "marche": case "market":
        return cmdMarche(message, pirate);

      case "acheter": case "buy":
        return cmdAcheter(message, args, pirate, user, save);

      case "vendre": case "sell":
        return cmdVendre(message, args, pirate, user, save);

      case "cale": case "cargo":
        return cmdCale(message, pirate);

      case "peche": case "fish":
        return cmdPeche(message, pirate, user, save);

      case "equipage": case "crew":
        return cmdEquipage(message, args, pirate, user, save);

      case "taverne": case "bar":
        return cmdTaverne(message, pirate, user, save);

      case "bataille": case "battle": case "naval":
        return cmdBataille(message, args, pirate, usersData, senderID, event, user, save);

      case "rang": case "rank":
        return cmdRang(message, pirate);

      case "daily":
        return cmdDaily(message, pirate, user, save);

      case "achievements": case "succes":
        return cmdAchievements(message, pirate);

      case "classement": case "top": case "leaderboard":
        return cmdClassement(message, usersData);

      case "history": case "historique": case "journal":
        return cmdHistory(message, pirate);

      case "premium":
        return cmdPremium(message, args, pirate, user, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tape 'pirate help'.`));
    }
  },
};