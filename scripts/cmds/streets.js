"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
  GRIND:    30 * 60 * 1000,
  DEAL:     2  * 60 * 60 * 1000,
  FLIP:     4  * 60 * 60 * 1000,
  HEIST:    8  * 60 * 60 * 1000,
  DAILY:    24 * 60 * 60 * 1000,
  GANG:     6  * 60 * 60 * 1000,
  LAUNDRY:  3  * 60 * 60 * 1000,
};

const STATUTS = [
  { id: "BROKE",     nom: "Broke",        min: 0,           bonus: 0,    sym: "[ ]" },
  { id: "HUSTLER",   nom: "Hustler",      min: 10_000,      bonus: 0.05, sym: "[H]" },
  { id: "DEALER",    nom: "Dealer",       min: 75_000,      bonus: 0.10, sym: "[D]" },
  { id: "SHOT",      nom: "Shotcaller",   min: 300_000,     bonus: 0.18, sym: "[S]" },
  { id: "OG",        nom: "OG",           min: 1_000_000,   bonus: 0.28, sym: "[O]" },
  { id: "KINGPIN",   nom: "Kingpin",      min: 5_000_000,   bonus: 0.40, sym: "[K]" },
  { id: "LEGEND",    nom: "Street Legend",min: 20_000_000,  bonus: 0.60, sym: "[L]" },
];

const QUARTIERS = {
  GHETTO:    { id: "GHETTO",    nom: "Le Ghetto",        cout: 0,          revenu: 3_000,   risque: 2, sym: "<<" },
  BANLIEUE:  { id: "BANLIEUE",  nom: "Banlieue Est",     cout: 50_000,     revenu: 12_000,  risque: 3, sym: "<>" },
  CITE:      { id: "CITE",      nom: "La Cite",          cout: 200_000,    revenu: 35_000,  risque: 4, sym: "><" },
  DOWNTOWN:  { id: "DOWNTOWN",  nom: "Downtown",         cout: 800_000,    revenu: 100_000, risque: 3, sym: ">>" },
  UPTOWN:    { id: "UPTOWN",    nom: "Uptown Luxe",      cout: 3_000_000,  revenu: 350_000, risque: 2, sym: "##" },
  PENTHOUSE: { id: "PENTHOUSE", nom: "Penthouse District",cout: 15_000_000,revenu: 1_200_000,risque:1, sym: "**" },
};

const PRODUITS = {
  SNEAK:    { id: "SNEAK",    nom: "Sneakers",          achat: 200,    vente: 550,    risque: 1 },
  MERCH:    { id: "MERCH",    nom: "Merch de rue",      achat: 800,    vente: 2_200,  risque: 2 },
  BIJOUX:   { id: "BIJOUX",   nom: "Bijoux fake",       achat: 2_000,  vente: 6_500,  risque: 2 },
  TECH:     { id: "TECH",     nom: "Tech vole",         achat: 5_000,  vente: 14_000, risque: 3 },
  VOITURE:  { id: "VOITURE",  nom: "Bagnole retouchee", achat: 20_000, vente: 55_000, risque: 4 },
  CRYPTO:   { id: "CRYPTO",   nom: "Crypto douteuse",   achat: 50_000, vente: 130_000,risque: 3 },
};

const CREW = {
  LOOKOUT:  { id: "LOOKOUT",  nom: "Guetteur",          cout: 15_000,  effet: "Reduit risque de 20%",       bonus: "risque_-20" },
  RUNNER:   { id: "RUNNER",   nom: "Runner",            cout: 40_000,  effet: "+15% revenus quartier",       bonus: "revenu_+15" },
  FIXER:    { id: "FIXER",    nom: "Fixeur",            cout: 120_000, effet: "Cooldown grind -30%",         bonus: "grind_-30" },
  MUSCLE:   { id: "MUSCLE",   nom: "Muscle",            cout: 250_000, effet: "+40% succes heist",           bonus: "heist_+40" },
  CONNECT:  { id: "CONNECT",  nom: "La Connexion",      cout: 600_000, effet: "+25% prix vente marche",      bonus: "vente_+25" },
  LAWYER:   { id: "LAWYER",   nom: "Avocat",            cout: 1_500_000,effet: "Annule 1 arrestation/jour",  bonus: "arres_0" },
};

const GRIND_JOBS = [
  { id: "WASH",    nom: "Lavage de voiture",     gain: [500, 2_000],   xp: 5  },
  { id: "MOVE",    nom: "Livraison rapide",      gain: [1_000, 4_500], xp: 10 },
  { id: "FLIP",    nom: "Revente de sneaks",     gain: [2_000, 8_000], xp: 20 },
  { id: "ESCORT",  nom: "Escorte VIP",           gain: [5_000, 18_000],xp: 40 },
  { id: "FENCE",   nom: "Recel de marchandises", gain: [8_000, 30_000],xp: 70 },
];

const HEISTS = [
  { id: "H1", nom: "Vol de voiture",         cout: 0,        gain: [5_000,  20_000],  risque: 25, xp: 30  },
  { id: "H2", nom: "Braquage epicerie",       cout: 5_000,    gain: [20_000, 80_000],  risque: 40, xp: 70  },
  { id: "H3", nom: "Vol de fret",            cout: 20_000,   gain: [80_000, 300_000], risque: 55, xp: 150 },
  { id: "H4", nom: "Braquage bijouterie",    cout: 80_000,   gain: [300_000,1_000_000],risque:65, xp: 300 },
  { id: "H5", nom: "Hold-up banque",         cout: 300_000,  gain: [1_000_000,4_000_000],risque:78,xp:700 },
];

function FM(n) {
  n = Math.floor(n);
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
  return `$${n.toLocaleString("fr-FR")}`;
}
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr)   { return arr[Math.floor(Math.random() * arr.length)]; }
function timeLeft(ts, cd) {
  const d = cd - (Date.now() - (ts || 0));
  if (d <= 0) return null;
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getStatut(street) {
  let s = STATUTS[0];
  for (const st of STATUTS) {
    if (street.cashTotal >= st.min) s = st;
    else break;
  }
  return s;
}

function initStreet() {
  return {
    cashDirty:      0,
    cashClean:      0,
    cashTotal:      0,
    totalGagne:     0,
    totalBlanchit:  0,
    xp:             0,
    statut:         "BROKE",
    rep:            0,
    streak:         0,
    quartiers:      ["GHETTO"],
    inventaire:     {},
    crew:           [],
    lastGrind:      null,
    lastDeal:       null,
    lastFlip:       null,
    lastHeist:      null,
    lastDaily:      null,
    lastGang:       null,
    lastLaundry:    null,
    heistEnCours:   null,
    laundryCours:   null,
    nbArrestes:     0,
    achievements:   [],
    transactions:   [],
    fugitif:        false,
  };
}

function addTx(street, type, montant, desc) {
  street.transactions = street.transactions || [];
  street.transactions.push({ type, montant, desc, date: Date.now() });
  if (street.transactions.length > 25) street.transactions = street.transactions.slice(-25);
}

function getRevenuTotal(street) {
  let total = 0;
  for (const qId of street.quartiers) {
    const q = QUARTIERS[qId];
    if (q) total += q.revenu;
  }
  if (street.crew.includes("RUNNER")) total = Math.floor(total * 1.15);
  const st = getStatut(street);
  total = Math.floor(total * (1 + st.bonus));
  return total;
}

function renderDashboard(street, wallet) {
  const st = getStatut(street);
  const revenu = getRevenuTotal(street);
  const invQte = Object.values(street.inventaire).reduce((a, b) => a + b, 0);
  const totalWealth = wallet + street.cashClean + street.cashDirty;

  return `
${fonts.bold("🏙️ STREET HUSTLE")} ${st.sym}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(st.nom.toUpperCase())} • ${fonts.bold("Réputation: " + street.rep)} • ${fonts.bold("XP: " + street.xp)}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💳 Portefeuille: ${fonts.bold(FM(wallet))}
💀 Cash sale: ${fonts.bold(FM(street.cashDirty))}
🧼 Cash propre: ${fonts.bold(FM(street.cashClean))}
📈 Total gagné: ${fonts.bold(FM(street.totalGagne))}
💎 Patrimoine total: ${fonts.bold(FM(totalWealth))}

${fonts.bold("🏘️ TERRITOIRE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🗺️ Quartiers: ${fonts.bold(street.quartiers.length + " zones")}
💰 Revenu/h: ${fonts.bold(FM(revenu))}
📦 Inventaire: ${fonts.bold(invQte + " articles")}
👥 Crew: ${fonts.bold(street.crew.length + " membres")}

${fonts.bold("📊 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 Statut: ${fonts.bold(st.nom)}
🔥 Série: ${fonts.bold(street.streak + " jours")}
💀 Arrestations: ${fonts.bold(street.nbArrestes)}
${street.fugitif ? "🚨 " + fonts.bold("EN FUITE - La police est sur vous !") : "✅ Aucune surveillance"}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💼 Grind: ${timeLeft(street.lastGrind, COOLDOWNS.GRIND) || "✅ Prêt"}
🛒 Deal: ${timeLeft(street.lastDeal, COOLDOWNS.DEAL) || "✅ Prêt"}
🏦 Heist: ${timeLeft(street.lastHeist, COOLDOWNS.HEIST) || "✅ Prêt"}
🎁 Daily: ${timeLeft(street.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
🧼 Laundry: ${timeLeft(street.lastLaundry, COOLDOWNS.LAUNDRY) || "✅ Prêt"}
⚔️ Gang: ${timeLeft(street.lastGang, COOLDOWNS.GANG) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
  return `
${fonts.bold("🏙️ STREET HUSTLE - GUIDE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("💼 GAINS RAPIDES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 street stat — Tableau de bord
💼 street grind — Petits boulots (30 min)
🎁 street daily — Bonus quotidien

${fonts.bold("🛒 MARCHÉ NOIR")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 street market — Voir les prix
🛒 street deal <ID> <qte> — Acheter une marchandise
💰 street sell <ID> <qte> — Vendre une marchandise

${fonts.bold("🏘️ TERRITOIRE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 street zone list — Voir les quartiers
🏘️ street zone buy <ID> — Acheter un quartier
💰 street collect — Collecter les revenus

${fonts.bold("🏦 CRIME")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 street heist list — Voir les braquages
🏦 street heist do <N> — Lancer un braquage
✅ street heist check — Résultat du braquage
🧼 street launder <montant> — Blanchir de l'argent
🧼 street launder check — Récupérer l'argent blanchi

${fonts.bold("👥 ÉQUIPAGE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 street crew list — Membres disponibles
🤝 street crew hire <ID> — Recruter un membre
⚔️ street gang — Attaque de gang

${fonts.bold("🏆 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 street rank — Votre statut
👑 street top — Classement des hustlers
`.trim();
}

async function cmdGrind(message, street, user, save) {
  let cd = timeLeft(street.lastGrind, COOLDOWNS.GRIND);
  if (street.crew.includes("FIXER")) {
    cd = timeLeft(street.lastGrind, Math.floor(COOLDOWNS.GRIND * 0.70));
  }
  if (cd) return message.reply(`⏳ Grind disponible dans ${cd}`);

  const job = pick(GRIND_JOBS);
  const gain = rand(job.gain[0], job.gain[1]);
  const st = getStatut(street);
  const total = Math.floor(gain * (1 + st.bonus));

  user.money = (user.money || 0) + total;
  street.cashDirty += total;
  street.totalGagne += total;
  street.cashTotal += total;
  street.xp += job.xp;
  street.rep = Math.min(1000, street.rep + 2);
  street.lastGrind = Date.now();
  addTx(street, "grind", total, job.nom);
  await save();

  return message.reply(`
${fonts.bold("💼 GRIND COMPLÉTÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job: ${fonts.bold(job.nom)}
💰 Gain: ${fonts.bold(FM(total))}
⭐ XP: +${job.xp}
🎯 Réputation: +2
💀 Cash sale: ${FM(street.cashDirty)}
💳 Portefeuille: ${FM(user.money)}
`.trim());
}

async function cmdMarket(message, street) {
  let txt = `${fonts.bold("🕶️ MARCHÉ NOIR")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [id, p] of Object.entries(PRODUITS)) {
    const stock = street.inventaire[id] || 0;
    const fluctu = 0.90 + Math.random() * 0.20;
    const achat = Math.floor(p.achat * fluctu);
    const vente = Math.floor(p.vente * fluctu);
    txt += `${p.nom} [${id}]\n`;
    txt += `   🛒 Achat: ${FM(achat)}\n`;
    txt += `   💰 Vente: ${FM(vente)}\n`;
    txt += `   📦 Stock: ${stock}\n\n`;
  }
  txt += `\n💡 Acheter: street deal <ID> <qte>\n`;
  txt += `💡 Vendre: street sell <ID> <qte>`;
  return message.reply(txt);
}

async function cmdDeal(message, args, street, user, save) {
  const cd = timeLeft(street.lastDeal, COOLDOWNS.DEAL);
  if (cd) return message.reply(`⏳ Deal disponible dans ${cd}`);

  const pId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]) || 1;
  const prod = PRODUITS[pId];
  if (!prod) return message.reply(`❌ Produit inconnu. Voir 'street market'.`);

  const fluctu = 0.90 + Math.random() * 0.20;
  const prix = Math.floor(prod.achat * fluctu);
  const total = prix * qte;

  if ((user.money || 0) < total) {
    return message.reply(`
❌ FONDS INSUFFISANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Besoin: ${FM(total)}
Portefeuille: ${FM(user.money)}
`.trim());
  }

  user.money = (user.money || 0) - total;
  street.inventaire[pId] = (street.inventaire[pId] || 0) + qte;
  street.lastDeal = Date.now();
  addTx(street, "deal_achat", -total, `Achat ${qte}x ${prod.nom}`);
  await save();

  return message.reply(`
${fonts.bold("🛒 DEAL CONCLU")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Produit: ${prod.nom}
Quantité: ${qte}
Prix unitaire: ${FM(prix)}
Total: ${FM(total)}
📦 Stock: ${street.inventaire[pId]} unités
💳 Portefeuille: ${FM(user.money)}
`.trim());
}

async function cmdSell(message, args, street, user, save) {
  const pId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]) || 1;
  const prod = PRODUITS[pId];
  if (!prod) return message.reply(`❌ Produit inconnu. Voir 'street market'.`);
  if (!street.inventaire[pId] || street.inventaire[pId] < qte) {
    return message.reply(`❌ Stock insuffisant. Vous avez ${street.inventaire[pId] || 0} unités.`);
  }

  const fluctu = 0.90 + Math.random() * 0.20;
  const connectBonus = street.crew.includes("CONNECT") ? 1.25 : 1;
  const prixUnit = Math.floor(prod.vente * fluctu * connectBonus);
  const total = prixUnit * qte;

  const risqueBase = prod.risque * 8;
  const risqueEff = street.crew.includes("LOOKOUT") ? Math.floor(risqueBase * 0.80) : risqueBase;
  const saisi = Math.random() * 100 < risqueEff;

  street.inventaire[pId] -= qte;
  if (street.inventaire[pId] <= 0) delete street.inventaire[pId];

  if (saisi) {
    street.fugitif = true;
    street.nbArrestes++;
    addTx(street, "sell_saisie", 0, `Saisie ${prod.nom}`);
    await save();
    return message.reply(`
🚨 SAISIE POLICIÈRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La police a intercepté votre livraison de ${prod.nom}.
📦 Marchandises saisies: ${qte} unités
⚠️ ${fonts.bold("Vous êtes en fuite !")}
`.trim());
  }

  user.money = (user.money || 0) + total;
  street.cashDirty += total;
  street.totalGagne += total;
  street.cashTotal += total;
  street.xp += 15;
  addTx(street, "sell_ok", total, `Vente ${qte}x ${prod.nom}`);
  await save();

  return message.reply(`
${fonts.bold("💰 VENTE EFFECTUÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Produit: ${prod.nom}
Quantité: ${qte}
Prix unitaire: ${FM(prixUnit)}${street.crew.includes("CONNECT") ? " (+25% Connexion)" : ""}
Total: ${FM(total)}
💀 Cash sale: ${FM(street.cashDirty)}
💳 Portefeuille: ${FM(user.money)}
`.trim());
}

async function cmdCollect(message, street, user, save) {
  const cd = timeLeft(street.lastGang, COOLDOWNS.GANG);
  if (cd) return message.reply(`⏳ Collecte disponible dans ${cd}`);

  if (street.quartiers.length === 0) return message.reply(`❌ Aucun quartier. Achetez-en un.`);
  const revenu = getRevenuTotal(street);
  if (revenu <= 0) return message.reply(`❌ Revenus nuls.`);

  const risqueTotal = street.quartiers.reduce((s, qId) => s + (QUARTIERS[qId]?.risque || 0), 0);
  const chanceRaid = Math.max(0, risqueTotal * 4);
  const raid = Math.random() * 100 < chanceRaid;

  if (raid && !street.crew.includes("LOOKOUT")) {
    const saisie = Math.floor(street.cashDirty * 0.12);
    street.cashDirty = Math.max(0, street.cashDirty - saisie);
    street.fugitif = true;
    street.nbArrestes++;
    street.lastGang = Date.now();
    addTx(street, "raid", -saisie, "Raid police");
    await save();
    return message.reply(`
🚔 RAID POLICIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Un raid a frappé vos quartiers.
💰 Saisie: ${FM(saisie)} de cash sale
⚠️ ${fonts.bold("Vous êtes en fuite !")}
`.trim());
  }

  street.cashDirty += revenu;
  street.totalGagne += revenu;
  street.cashTotal += revenu;
  street.xp += Math.floor(revenu / 5000);
  street.rep = Math.min(1000, street.rep + street.quartiers.length);
  street.lastGang = Date.now();
  street.fugitif = false;
  addTx(street, "collecte", revenu, `Collecte ${street.quartiers.length} quartier(s)`);
  await save();

  let liste = "";
  street.quartiers.forEach(qId => {
    const q = QUARTIERS[qId];
    if (q) liste += `  ${q.sym} ${q.nom}: +${FM(q.revenu)}\n`;
  });

  return message.reply(`
${fonts.bold("💰 COLLECTE EFFECTUÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${liste}
Total perçu: ${fonts.bold(FM(revenu))}
💀 Cash sale: ${FM(street.cashDirty)}
`.trim());
}

async function cmdZone(message, args, street, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("🏘️ QUARTIERS DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, q] of Object.entries(QUARTIERS)) {
      const own = street.quartiers.includes(id);
      txt += `${q.sym} ${q.nom} [${id}]\n`;
      txt += `   💰 Revenu/h: ${FM(q.revenu)}\n`;
      txt += `   ⚠️ Risque: ${"⚠️".repeat(q.risque)}\n`;
      txt += `   💵 Coût: ${q.cout === 0 ? "GRATUIT" : FM(q.cout)}\n`;
      txt += `   ${own ? "✅ POSSÉDÉ" : "🔒 Non acquis"}\n\n`;
    }
    txt += `💡 Acheter: street zone buy <ID>`;
    return message.reply(txt);
  }

  if (sub === "buy") {
    const qId = (args[2] || "").toUpperCase();
    const q = QUARTIERS[qId];
    if (!q) return message.reply(`❌ Quartier inconnu. Voir 'street zone list'.`);
    if (street.quartiers.includes(qId)) return message.reply(`❌ Vous possédez déjà ce quartier.`);
    const dispo = (user.money || 0) + street.cashClean;
    if (dispo < q.cout) {
      return message.reply(`
❌ FONDS INSUFFISANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Coût: ${FM(q.cout)}
Disponible: ${FM(dispo)}
`.trim());
    }
    let reste = q.cout;
    if (street.cashClean >= reste) { street.cashClean -= reste; reste = 0; }
    else { reste -= street.cashClean; street.cashClean = 0; user.money = (user.money || 0) - reste; }
    street.quartiers.push(qId);
    street.rep = Math.min(1000, street.rep + q.risque * 15);
    addTx(street, "zone_achat", -q.cout, `Achat ${q.nom}`);
    await save();
    return message.reply(`
${fonts.bold("🏘️ QUARTIER ACQUIS: " + q.nom)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Revenu/h: ${FM(q.revenu)}
🎯 Réputation: +${q.risque * 15}
`.trim());
  }
}

async function cmdHeist(message, args, street, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("🏦 BRAQUAGES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    HEISTS.forEach((h, i) => {
      txt += `[${i + 1}] ${h.nom}\n`;
      txt += `   💰 Gain: ${FM(h.gain[0])} — ${FM(h.gain[1])}\n`;
      txt += `   💵 Coût: ${h.cout ? FM(h.cout) : "Gratuit"}\n`;
      txt += `   ⚠️ Risque: ${"⚠️".repeat(Math.ceil(h.risque / 20))}\n\n`;
    });
    txt += `💡 Lancer: street heist do <N>`;
    return message.reply(txt);
  }

  if (sub === "check") {
    if (!street.heistEnCours) return message.reply(`❌ Aucun braquage en cours.`);
    const h = HEISTS.find(x => x.id === street.heistEnCours.id);
    const reste = street.heistEnCours.finAt - Date.now();
    if (reste > 0) {
      return message.reply(`⏳ Braquage "${h.nom}" en cours.\nFin dans: ${timeLeft(Date.now() - (COOLDOWNS.HEIST - reste), COOLDOWNS.HEIST) || "bientôt"}`);
    }
    const success = Math.random() * 100 > h.risque - (street.crew.includes("MUSCLE") ? 20 : 0);
    street.heistEnCours = null;
    street.lastHeist = Date.now();

    if (success) {
      const gain = rand(h.gain[0], h.gain[1]);
      street.cashDirty += gain;
      street.totalGagne += gain;
      street.cashTotal += gain;
      street.xp += h.xp;
      street.rep = Math.min(1000, street.rep + 30);
      street.streak++;
      addTx(street, "heist_ok", gain, `Braquage : ${h.nom}`);
      await save();
      return message.reply(`
${fonts.bold("🏦 BRAQUAGE RÉUSSI")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${h.nom}
💰 Butin: ${FM(gain)}
⭐ XP: +${h.xp}
🎯 Réputation: +30
💀 Cash sale: ${FM(street.cashDirty)}
`.trim());
    } else {
      const saisie = Math.floor(street.cashDirty * 0.15);
      street.cashDirty = Math.max(0, street.cashDirty - saisie);
      street.fugitif = true;
      street.nbArrestes++;
      street.streak = 0;
      addTx(street, "heist_fail", -saisie, `Braquage raté : ${h.nom}`);
      await save();
      return message.reply(`
${fonts.bold("💀 BRAQUAGE RATÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${h.nom}
💰 Saisie: ${FM(saisie)}
⚠️ ${fonts.bold("Vous êtes en fuite !")}
`.trim());
    }
  }

  if (sub === "do") {
    const cd = timeLeft(street.lastHeist, COOLDOWNS.HEIST);
    if (cd) return message.reply(`⏳ Heist disponible dans ${cd}`);
    if (street.heistEnCours) return message.reply(`❌ Un braquage est déjà en cours.`);

    const num = parseInt(args[2]) - 1;
    if (isNaN(num) || num < 0 || num >= HEISTS.length) return message.reply(`❌ Numéro invalide (1-${HEISTS.length}).`);
    const h = HEISTS[num];

    if (h.cout > 0) {
      if ((user.money || 0) + street.cashClean < h.cout) {
        return message.reply(`❌ Fonds insuffisants. Besoin: ${FM(h.cout)}`);
      }
      let r = h.cout;
      if (street.cashClean >= r) { street.cashClean -= r; }
      else { r -= street.cashClean; street.cashClean = 0; user.money = (user.money || 0) - r; }
    }

    street.heistEnCours = { id: h.id, finAt: Date.now() + COOLDOWNS.HEIST };
    await save();

    return message.reply(`
${fonts.bold("🏦 BRAQUAGE LANCÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${h.nom}
⏱️ Durée: 8 heures
⚠️ Risque: ${"⚠️".repeat(Math.ceil(h.risque / 20))}
💵 Coût: ${h.cout ? FM(h.cout) : "Gratuit"}

💡 'street heist check' dans 8h.
`.trim());
  }
}

async function cmdLaunder(message, args, street, user, save) {
  if (street.laundryCours) {
    const reste = street.laundryCours.finAt - Date.now();
    if (reste <= 0 && (args[1] || "").toLowerCase() === "check") {
      const montant = street.laundryCours.montant;
      const propre = Math.floor(montant * 0.78);
      street.cashClean += propre;
      street.totalBlanchit += propre;
      street.laundryCours = null;
      street.lastLaundry = Date.now();
      addTx(street, "laundry_ok", propre, "Blanchiment terminé");
      await save();
      return message.reply(`
${fonts.bold("🧼 BLANCHIMENT TERMINÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Montant entré: ${FM(montant)}
🧾 Frais (22%): ${FM(montant - propre)}
✅ Cash propre reçu: ${FM(propre)}
🧼 Cash propre total: ${FM(street.cashClean)}
`.trim());
    }
    if (reste > 0) {
      const tl = timeLeft(Date.now() - (COOLDOWNS.LAUNDRY - reste), COOLDOWNS.LAUNDRY);
      return message.reply(`⏳ Blanchiment en cours.\nFin dans: ${tl || "bientôt"}\n'street launder check' pour récupérer.`);
    }
  }

  if ((args[1] || "").toLowerCase() === "check") {
    return message.reply(`❌ Aucun blanchiment en cours.`);
  }

  const montant = parseInt(args[1]);
  if (!montant || montant <= 0) {
    return message.reply(`
${fonts.bold("🧼 BLANCHIMENT D'ARGENT")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💀 Cash sale disponible: ${FM(street.cashDirty)}
📊 Taux de récupération: 78%
⏱️ Durée: 3 heures

💡 street launder <montant>
`.trim());
  }

  const cd = timeLeft(street.lastLaundry, COOLDOWNS.LAUNDRY);
  if (cd) return message.reply(`⏳ Laundry disponible dans ${cd}`);
  if (montant < 5000) return message.reply(`❌ Minimum: $5,000.`);
  if (montant > street.cashDirty) return message.reply(`❌ Cash sale insuffisant. Disponible: ${FM(street.cashDirty)}`);

  street.cashDirty -= montant;
  street.laundryCours = { montant, finAt: Date.now() + COOLDOWNS.LAUNDRY };
  addTx(street, "laundry_start", -montant, "Blanchiment lancé");
  await save();

  return message.reply(`
${fonts.bold("🧼 BLANCHIMENT LANCÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Montant engagé: ${FM(montant)}
📈 Retour prévu: ${FM(Math.floor(montant * 0.78))} (dans 3h)

💡 'street launder check' dans 3h.
`.trim());
}

async function cmdCrew(message, args, street, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("👥 MEMBRES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, m] of Object.entries(CREW)) {
      const own = street.crew.includes(id);
      txt += `${m.nom} [${id}]\n`;
      txt += `   💵 Coût: ${FM(m.cout)}\n`;
      txt += `   ✨ Effet: ${m.effet}\n`;
      txt += `   ${own ? "✅ RECRUTÉ" : "🔒 Non recruté"}\n\n`;
    }
    txt += `💡 Recruter: street crew hire <ID>`;
    return message.reply(txt);
  }

  if (sub === "hire") {
    const mId = (args[2] || "").toUpperCase();
    const m = CREW[mId];
    if (!m) return message.reply(`❌ Membre inconnu. Voir 'street crew list'.`);
    if (street.crew.includes(mId)) return message.reply(`❌ Ce membre est déjà dans votre crew.`);
    const dispo = (user.money || 0) + street.cashClean;
    if (dispo < m.cout) return message.reply(`❌ Fonds insuffisants. Besoin: ${FM(m.cout)}`);
    let r = m.cout;
    if (street.cashClean >= r) { street.cashClean -= r; }
    else { r -= street.cashClean; street.cashClean = 0; user.money = (user.money || 0) - r; }
    street.crew.push(mId);
    street.rep = Math.min(1000, street.rep + 20);
    addTx(street, "crew_hire", -m.cout, `Recrutement ${m.nom}`);
    await save();
    return message.reply(`
${fonts.bold("👥 NOUVEAU MEMBRE: " + m.nom)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Coût: ${FM(m.cout)}
✨ Effet: ${m.effet}
🎯 Réputation: +20
`.trim());
  }
}

async function cmdGang(message, args, street, user, save) {
  const cd = timeLeft(street.lastGang, COOLDOWNS.GANG);
  if (cd) return message.reply(`⏳ Attaque de gang disponible dans ${cd}`);

  const zones = Object.values(QUARTIERS).filter(q => !street.quartiers.includes(q.id));
  if (zones.length === 0) return message.reply(`❌ Vous contrôlez déjà tous les quartiers.`);

  const cible = pick(zones);
  const mise = Math.floor(cible.cout * 0.15) || 2000;

  if (street.cashClean < mise && (user.money || 0) < mise) {
    return message.reply(`❌ Fonds insuffisants. Besoin: ${FM(mise)}`);
  }

  let r = mise;
  if (street.cashClean >= r) { street.cashClean -= r; }
  else { r -= street.cashClean; street.cashClean = 0; user.money = (user.money || 0) - r; }

  const chanceVic = street.crew.includes("MUSCLE") ? 0.60 : 0.45;
  const win = Math.random() < chanceVic;
  street.lastGang = Date.now();

  if (win) {
    street.quartiers.push(cible.id);
    street.rep = Math.min(1000, street.rep + cible.risque * 20);
    street.xp += 100;
    addTx(street, "gang_win", cible.revenu, `Gang : ${cible.nom} pris`);
    await save();
    return message.reply(`
${fonts.bold("⚔️ GANG — VICTOIRE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${cible.sym} ${cible.nom} est maintenant à vous !
💰 Revenu/h: ${FM(cible.revenu)}
💵 Mise: ${FM(mise)}
🎯 Réputation: +${cible.risque * 20}
`.trim());
  } else {
    const perte = Math.floor(street.cashDirty * 0.08);
    street.cashDirty = Math.max(0, street.cashDirty - perte);
    addTx(street, "gang_fail", -(mise + perte), `Gang : ${cible.nom} raté`);
    await save();
    return message.reply(`
💀 GANG — DÉFAITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L'attaque sur ${cible.nom} a échoué.
💸 Perte mise: ${FM(mise)}
💰 Saisie supplémentaire: ${FM(perte)}
`.trim());
  }
}

async function cmdDaily(message, street, user, save) {
  const cd = timeLeft(street.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(`⏳ Daily déjà réclamé. Prochain dans ${cd}`);

  const st = getStatut(street);
  const base = 2000;
  const statBonus = Math.floor(base * st.bonus);
  const streak = (street.lastDaily && Date.now() - street.lastDaily < 48 * 3600 * 1000)
    ? (street.streak || 0) + 1 : 1;
  const streakBonus = Math.min(streak * 200, 3000);
  const total = base + statBonus + streakBonus;

  user.money = (user.money || 0) + total;
  street.cashDirty += total;
  street.totalGagne += total;
  street.cashTotal += total;
  street.streak = streak;
  street.lastDaily = Date.now();
  street.rep = Math.min(1000, street.rep + 5);
  addTx(street, "daily", total, "Bonus quotidien");
  await save();

  return message.reply(`
${fonts.bold("🎁 DAILY CLAIMED")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base: ${FM(base)}
Bonus statut: ${FM(statBonus)} (${st.nom})
Bonus série: ${FM(streakBonus)} (${streak} jours)
──────────────────────────────
Total: ${fonts.bold(FM(total))}
🔥 Série: ${streak} jours
💳 Portefeuille: ${FM(user.money)}
`.trim());
}

async function cmdRank(message, street) {
  const st = getStatut(street);
  const nextIdx = STATUTS.findIndex(s => s.id === st.id) + 1;
  const next = STATUTS[nextIdx] || null;
  const pc = next ? Math.min(100, Math.floor(((street.cashTotal - st.min) / (next.min - st.min)) * 100)) : 100;
  const barLen = 20;
  const filled = Math.round(barLen * pc / 100);
  const progBar = "[" + "█".repeat(filled) + "░".repeat(barLen - filled) + "]";

  let txt = `
${fonts.bold("🏆 VOTRE STATUT")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${st.sym} ${fonts.bold(st.nom)}
💰 Cash total: ${FM(street.cashTotal)}
⭐ XP: ${street.xp}
🎯 Réputation: ${street.rep}/1000
📈 Bonus: +${Math.round(st.bonus * 100)}%
`;

  if (next) {
    txt += `\n⬆️ Prochain: ${fonts.bold(next.nom)} (${FM(next.min)})\n`;
    txt += `${progBar} ${pc}%\n`;
    txt += `📊 Manque: ${FM(Math.max(0, next.min - street.cashTotal))}\n`;
  } else {
    txt += `\n${fonts.outline("👑 RANG MAXIMUM — STREET LEGEND")}\n`;
  }

  txt += `\n${fonts.bold("📜 TOUS LES STATUTS")}\n`;
  STATUTS.forEach(s => {
    txt += `${s.id === st.id ? "▶️ " : "   "}${s.sym} ${s.nom}  (${FM(s.min)}+)\n`;
  });
  return message.reply(txt);
}

async function cmdTop(message, usersData) {
  try {
    const all = await usersData.getAll();
    const joueurs = [];
    for (const [uid, u] of Object.entries(all)) {
      const s = u.data?.street;
      if (s && s.cashTotal > 0) {
        joueurs.push({
          nom: u.name || `User_${uid.slice(-4)}`,
          cashTotal: s.cashTotal,
          statut: getStatut(s).nom,
          quartiers: s.quartiers?.length || 0,
        });
      }
    }
    joueurs.sort((a, b) => b.cashTotal - a.cashTotal);
    const top10 = joueurs.slice(0, 10);
    let txt = `${fonts.bold("👑 TOP HUSTLERS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (top10.length === 0) {
      txt += `📊 Aucun joueur classé.`;
    } else {
      top10.forEach((j, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        txt += `${medal} ${fonts.bold(j.nom)}\n`;
        txt += `   🏆 Statut: ${j.statut}\n`;
        txt += `   💰 Cash total: ${FM(j.cashTotal)}\n`;
        txt += `   🏘️ Quartiers: ${j.quartiers}\n\n`;
      });
    }
    return message.reply(txt);
  } catch (e) {
    return message.reply(`❌ Erreur classement.`);
  }
}

async function cmdInventaire(message, street) {
  const invQte = Object.values(street.inventaire).reduce((a, b) => a + b, 0);
  let txt = `${fonts.bold("📦 INVENTAIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (invQte === 0) {
    txt += "📭 Inventaire vide.\n";
  } else {
    for (const [pId, qte] of Object.entries(street.inventaire)) {
      if (qte <= 0) continue;
      const p = PRODUITS[pId];
      if (p) txt += `${p.nom}: ${qte} unités\n`;
    }
  }
  txt += `\n📦 Total: ${invQte} articles`;
  return message.reply(txt);
}

module.exports = {
  config: {
    name: "street",
    aliases: ["hustle", "rue", "ghetto"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🏙️ Street Hustle — Grind, deals, braquages et conquête de quartiers. Deviens le roi de la rue."
    },
    category: "economy",
    guide: {
      fr: "Tapez 'street help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.street) user.data.street = initStreet();

    const street = user.data.street;
    const wallet = user.money || 0;

    const st = getStatut(street);
    street.statut = st.id;

    const save = async () => {
      user.data.street = street;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help":
      case "aide":
        return message.reply(renderHelp());

      case "stat":
      case "status":
      case "dashboard":
        return message.reply(renderDashboard(street, wallet));

      case "daily":
        return cmdDaily(message, street, user, save);

      case "grind":
      case "job":
        return cmdGrind(message, street, user, save);

      case "market":
      case "marche":
        return cmdMarket(message, street);

      case "deal":
      case "buy":
        return cmdDeal(message, args, street, user, save);

      case "sell":
      case "vendre":
        return cmdSell(message, args, street, user, save);

      case "collect":
      case "collecte":
        return cmdCollect(message, street, user, save);

      case "zone":
      case "quartier":
        return cmdZone(message, args, street, user, save);

      case "heist":
      case "braquage":
        return cmdHeist(message, args, street, user, save);

      case "launder":
      case "blanchir":
        return cmdLaunder(message, args, street, user, save);

      case "crew":
        return cmdCrew(message, args, street, user, save);

      case "gang":
        return cmdGang(message, args, street, user, save);

      case "inv":
      case "inventaire":
        return cmdInventaire(message, street);

      case "rank":
      case "rang":
        return cmdRank(message, street);

      case "top":
      case "classement":
        return cmdTop(message, usersData);

      default:
        return message.reply(`❓ Commande inconnue. Tapez 'street help' pour la liste.`);
    }
  }
};