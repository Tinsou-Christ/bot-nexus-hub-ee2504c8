"use strict";

const fonts = require('../../func/font.js');

// ═══════════════════════════════════════════════════════════════════
//  🌾 FERME ROYALE v1.0 — Tycoon agricole complet
//  Auteur : Christus (inspiré de empire.js)
//  Système : Cultures · Élevage · Météo · Marché · Recherche · Événements
// ═══════════════════════════════════════════════════════════════════

const COOLDOWNS = {
  RECOLTE:    1  * 60 * 60 * 1000,   // 1h
  ELEVAGE:    2  * 60 * 60 * 1000,   // 2h
  MARCHE:     30 * 60 * 1000,        // 30min
  DAILY:      24 * 60 * 60 * 1000,   // 24h
  METEO:      6  * 60 * 60 * 1000,   // 6h (météo change)
  EXPANSION:  0,
  PRET:       0,
};

// ─── Niveaux fermier ────────────────────────────────────────────────
const NIVEAUX = [
  { id: "PAYSAN",       nom: "Paysan Débutant",    min: 0,           emoji: "👨‍🌾", bonus: 0,    color: "🟤" },
  { id: "CULTIVATEUR",  nom: "Cultivateur",        min: 5_000,       emoji: "🌱", bonus: 0.05, color: "🟢" },
  { id: "FERMIER",      nom: "Fermier Confirmé",   min: 30_000,      emoji: "🚜", bonus: 0.10, color: "🟡" },
  { id: "AGRICULTEUR",  nom: "Agriculteur Expert", min: 150_000,     emoji: "🌾", bonus: 0.18, color: "🟠" },
  { id: "MAITRE",       nom: "Maître des Champs",  min: 800_000,     emoji: "🏆", bonus: 0.28, color: "🔵" },
  { id: "BARON",        nom: "Baron Agricole",     min: 5_000_000,   emoji: "👑", bonus: 0.40, color: "🟣" },
  { id: "MAGNAT",       nom: "Magnat de la Terre", min: 30_000_000,  emoji: "💎", bonus: 0.60, color: "⭐" },
];

// ─── Cultures ────────────────────────────────────────────────────────
const CULTURES = {
  BLE:        { id: "BLE",      nom: "Blé",           emoji: "🌾", prixGraine: 50,   temps: 60,  gain: [200,  450],  saison: ["PRINTEMPS","ETE"],    risque: 1 },
  MAIS:       { id: "MAIS",     nom: "Maïs",          emoji: "🌽", prixGraine: 80,   temps: 90,  gain: [350,  700],  saison: ["ETE"],                 risque: 1 },
  TOURNESOL:  { id: "TOURNESOL",nom: "Tournesol",     emoji: "🌻", prixGraine: 120,  temps: 120, gain: [500,  950],  saison: ["ETE","AUTOMNE"],       risque: 2 },
  TOMATE:     { id: "TOMATE",   nom: "Tomate",        emoji: "🍅", prixGraine: 200,  temps: 90,  gain: [700,  1400], saison: ["ETE"],                 risque: 2 },
  POMME:      { id: "POMME",    nom: "Pomme",         emoji: "🍎", prixGraine: 350,  temps: 150, gain: [1200, 2500], saison: ["AUTOMNE"],             risque: 3 },
  RAISIN:     { id: "RAISIN",   nom: "Raisin",        emoji: "🍇", prixGraine: 500,  temps: 180, gain: [2000, 4000], saison: ["AUTOMNE"],             risque: 3 },
  TRUFFE:     { id: "TRUFFE",   nom: "Truffe Noire",  emoji: "🍄", prixGraine: 2000, temps: 240, gain: [8000,18000], saison: ["HIVER"],               risque: 4 },
  SAFRAN:     { id: "SAFRAN",   nom: "Safran",        emoji: "🌸", prixGraine: 3000, temps: 300, gain:[12000,28000], saison: ["AUTOMNE","PRINTEMPS"], risque: 4 },
};

// ─── Élevage ─────────────────────────────────────────────────────────
const ANIMAUX = {
  POULE:      { id: "POULE",    nom: "Poule",          emoji: "🐔", cout: 500,    production: 150,  produit: "Œufs",       temps: 120, risque: 1 },
  VACHE:      { id: "VACHE",    nom: "Vache Laitière", emoji: "🐄", cout: 3000,   production: 800,  produit: "Lait",       temps: 120, risque: 1 },
  MOUTON:     { id: "MOUTON",   nom: "Mouton",         emoji: "🐑", cout: 2000,   production: 600,  produit: "Laine",      temps: 120, risque: 2 },
  COCHON:     { id: "COCHON",   nom: "Cochon",         emoji: "🐷", cout: 4000,   production: 1200, produit: "Viande",     temps: 120, risque: 2 },
  ABEILLE:    { id: "ABEILLE",  nom: "Ruche d'Abeilles",emoji:"🐝",cout: 8000,   production: 2500, produit: "Miel",       temps: 120, risque: 2 },
  CHEVAL:     { id: "CHEVAL",   nom: "Cheval de Trait",emoji: "🐎", cout: 20000,  production: 5000, produit: "Services",   temps: 120, risque: 3 },
  AUTRUCHE:   { id: "AUTRUCHE", nom: "Autruche",       emoji: "🐦", cout: 15000,  production: 4000, produit: "Plumes/Œufs",temps:120,  risque: 3 },
};

// ─── Bâtiments ───────────────────────────────────────────────────────
const BATIMENTS = {
  GRANGE:     { id: "GRANGE",    nom: "Grange",           cout: 5_000,    bonus: "stockage",  val: 100,   emoji: "🏚️" },
  SERRE:      { id: "SERRE",     nom: "Serre Chauffée",   cout: 25_000,   bonus: "saison",    val: 1,     emoji: "🏠" },
  SILO:       { id: "SILO",      nom: "Silo à Grain",     cout: 50_000,   bonus: "stockage",  val: 300,   emoji: "🏛️" },
  LABO_AGRI:  { id: "LABO_AGRI", nom: "Labo Agricole",   cout: 120_000,  bonus: "recherche", val: 0.20,  emoji: "🔬" },
  MOULIN:     { id: "MOULIN",    nom: "Moulin à Vent",    cout: 80_000,   bonus: "revenu",    val: 0.15,  emoji: "💨" },
  FROMAGERIE: { id: "FROMAGERIE",nom: "Fromagerie",       cout: 200_000,  bonus: "revenu",    val: 0.25,  emoji: "🧀" },
  COOPERATIVE:{ id: "COOPERATIVE",nom:"Coopérative",      cout: 500_000,  bonus: "marche",    val: 0.30,  emoji: "🤝" },
  CHATEAU_EAU:{ id: "CHATEAU_EAU",nom:"Château d'Eau",   cout: 350_000,  bonus: "irrigation",val: 0.20,  emoji: "🏗️" },
};

// ─── Terrains ────────────────────────────────────────────────────────
const TERRAINS = {
  JARDIN:   { id: "JARDIN",  nom: "Jardin Potager", cout: 0,         parcelles: 2,  emoji: "🌿" },
  CHAMP:    { id: "CHAMP",   nom: "Champ Familial", cout: 15_000,    parcelles: 5,  emoji: "🌱" },
  PRAIRIE:  { id: "PRAIRIE", nom: "Prairie",        cout: 60_000,    parcelles: 10, emoji: "🌄" },
  DOMAINE:  { id: "DOMAINE", nom: "Grand Domaine",  cout: 250_000,   parcelles: 20, emoji: "🏞️" },
  VALLEE:   { id: "VALLEE",  nom: "Vallée Fertile", cout: 1_200_000, parcelles: 40, emoji: "🗻" },
  PLAINE:   { id: "PLAINE",  nom: "Grande Plaine",  cout: 6_000_000, parcelles: 80, emoji: "🌍" },
};

// ─── Recherches ──────────────────────────────────────────────────────
const RECHERCHES = {
  ENGRAIS:    { id: "ENGRAIS",   nom: "Engrais Amélioré",    cout: 10_000,  effet: "+20% récoltes",          bonus: { recolte: 0.20 } },
  PESTICIDE:  { id: "PESTICIDE", nom: "Pesticide Bio",       cout: 25_000,  effet: "-50% risque maladie",    bonus: { risque: -0.50 } },
  SEMENCES:   { id: "SEMENCES",  nom: "Semences OGM",        cout: 80_000,  effet: "-25% temps de pousse",   bonus: { temps: -0.25 } },
  IRRIGATION: { id: "IRRIGATION",nom: "Système d'Irrigation",cout: 50_000,  effet: "+15% récolte en sécheresse", bonus: { sécheresse: 0.15 } },
  VETERINAIRE:{ id: "VETERINAIRE",nom:"Vétérinaire Attitré",  cout: 40_000,  effet: "+25% production animale", bonus: { animal: 0.25 } },
  MARCHE_PRO: { id: "MARCHE_PRO",nom: "Accès Marché Pro",    cout: 150_000, effet: "+30% prix de vente",     bonus: { prix: 0.30 } },
  DRONES:     { id: "DRONES",    nom: "Drones Agricoles",    cout: 300_000, effet: "+40% efficacité globale", bonus: { global: 0.40 } },
};

// ─── Météo ───────────────────────────────────────────────────────────
const METEO_TYPES = [
  { id: "SOLEIL",    nom: "Ensoleillé",    emoji: "☀️",  bonus: 1.20, texte: "Excellentes conditions de croissance !" },
  { id: "NUAGE",     nom: "Nuageux",       emoji: "⛅",  bonus: 1.00, texte: "Conditions normales." },
  { id: "PLUIE",     nom: "Pluie douce",   emoji: "🌧️", bonus: 1.15, texte: "La pluie arrose vos champs naturellement." },
  { id: "ORAGE",     nom: "Orage",         emoji: "⛈️", bonus: 0.70, texte: "L'orage menace vos cultures !" },
  { id: "SECHERESSE",nom: "Sécheresse",    emoji: "🌵", bonus: 0.60, texte: "La sécheresse brûle vos champs..." },
  { id: "GEL",       nom: "Gel",           emoji: "❄️", bonus: 0.50, texte: "Le gel endommage les cultures sensibles !" },
  { id: "VENT",      nom: "Vent fort",     emoji: "💨", bonus: 0.85, texte: "Le vent perturbe la récolte." },
  { id: "PARFAIT",   nom: "Météo Parfaite",emoji: "🌈", bonus: 1.40, texte: "Météo idéale ! Tout pousse à merveille !" },
];

// ─── Saisons ─────────────────────────────────────────────────────────
const SAISONS = ["PRINTEMPS", "ETE", "AUTOMNE", "HIVER"];
const SAISON_EMOJI = { PRINTEMPS: "🌸", ETE: "☀️", AUTOMNE: "🍂", HIVER: "❄️" };

// ─── Événements aléatoires ───────────────────────────────────────────
const EVENEMENTS = [
  { id: "LOCUSTES",  texte: "🦗 Invasion de criquets ! Vous perdez 10% de votre stock.",      effet: "stock_perte",  val: -0.10 },
  { id: "FESTIVAL",  texte: "🎪 Festival agricole ! Prix du marché +40% pendant 2h.",          effet: "prix_bonus",   val: 1.40 },
  { id: "SUBVENTION",texte: "🏛️ Subvention gouvernementale ! +$5 000 de prime immédiate.",     effet: "bonus_cash",   val: 5_000 },
  { id: "MALADIE",   texte: "🦠 Maladie animale ! Vos animaux produisent -30% pendant 2h.",   effet: "animal_malus", val: -0.30 },
  { id: "EXPERT",    texte: "👨‍🔬 Un expert visite votre ferme ! Bonus de recherche gratuit.",  effet: "recherche_bonus",val: 1 },
  { id: "MAUVAISE_HERBE",texte:"🌿 Mauvaises herbes invasives ! Prochaine récolte -15%.",     effet: "recolte_malus",val: -0.15 },
  { id: "RECORD",    texte: "📈 Prix record du blé ! Ventes à +60% ce soir.",                  effet: "prix_bonus",   val: 1.60 },
  { id: "DROUGHT",   texte: "☀️ Sécheresse annoncée. Activez l'irrigation maintenant !",      effet: "alerte",       val: 0 },
];

// ─── Helper functions ─────────────────────────────────────────────────
function L(c = "─", n = 44) { return c.repeat(n); }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getSaison() {
  const mois = new Date().getMonth(); // 0-11
  if (mois <= 1 || mois === 11) return "HIVER";
  if (mois <= 4) return "PRINTEMPS";
  if (mois <= 7) return "ETE";
  return "AUTOMNE";
}

function getNiveau(ferme) {
  let nv = NIVEAUX[0];
  for (const n of NIVEAUX) {
    if (ferme.totalRecolte >= n.min) nv = n;
    else break;
  }
  return nv;
}

function getMeteo(ferme) {
  const now = Date.now();
  if (!ferme.meteoActuelle || now - (ferme.meteoTimestamp || 0) > COOLDOWNS.METEO) {
    const m = pick(METEO_TYPES);
    ferme.meteoActuelle = m.id;
    ferme.meteoTimestamp = now;
  }
  return METEO_TYPES.find(m => m.id === ferme.meteoActuelle) || METEO_TYPES[0];
}

function getStockageMax(ferme) {
  let base = 200;
  for (const b of ferme.batiments) {
    const bat = BATIMENTS[b.type];
    if (bat && bat.bonus === "stockage") base += bat.val;
  }
  return base;
}

function getStockActuel(ferme) {
  return Object.values(ferme.stock).reduce((a, b) => a + b, 0);
}

function getRevenuAnimaux(ferme) {
  let total = 0;
  for (const [id, qte] of Object.entries(ferme.animaux)) {
    const a = ANIMAUX[id];
    if (a) {
      let prod = a.production * qte;
      if (ferme.recherches.includes("VETERINAIRE")) prod = Math.floor(prod * 1.25);
      if (ferme.evenementActif === "MALADIE" && Date.now() < ferme.evenementExpire) prod = Math.floor(prod * 0.70);
      total += prod;
    }
  }
  return total;
}

function getParcellesTotales(ferme) {
  let total = 0;
  for (const tId of ferme.terrains) {
    const t = TERRAINS[tId];
    if (t) total += t.parcelles;
  }
  return total;
}

function getParcellesTotalesOccupees(ferme) {
  return ferme.cultures.length;
}

function checkAchievements(ferme) {
  const ACHIEV = {
    PREMIER_LABOUR:   { cond: () => ferme.totalRecolte >= 1,          emoji: "🌱" },
    PREMIERE_VENTE:   { cond: () => ferme.totalVendu >= 1,            emoji: "💰" },
    PAYSAN_HEUREUX:   { cond: () => ferme.cultures.length >= 5,       emoji: "👨‍🌾" },
    ELEVEUR:          { cond: () => Object.keys(ferme.animaux).length >= 2, emoji: "🐄" },
    MILLE_DOLLARS:    { cond: () => ferme.totalRecolte >= 1000,       emoji: "💵" },
    MILLION_CLUB:     { cond: () => ferme.totalRecolte >= 1_000_000,  emoji: "💎" },
    CONSTRUCTEUR:     { cond: () => ferme.batiments.length >= 3,      emoji: "🏗️" },
    CHERCHEUR:        { cond: () => ferme.recherches.length >= 3,     emoji: "🔬" },
    PROPRIETAIRE:     { cond: () => ferme.terrains.length >= 3,       emoji: "🗺️" },
    MILLIARDAIRE:     { cond: () => ferme.totalRecolte >= 1_000_000_000, emoji: "👑" },
  };
  const nouveaux = [];
  for (const [id, a] of Object.entries(ACHIEV)) {
    if (!ferme.achievements.includes(id) && a.cond()) {
      ferme.achievements.push(id);
      nouveaux.push(`${a.emoji} ${id.replace(/_/g, " ")}`);
    }
  }
  return nouveaux;
}

function addTransaction(ferme, type, montant, desc) {
  ferme.transactions.push({ type, montant, desc, date: Date.now() });
  if (ferme.transactions.length > 30) ferme.transactions = ferme.transactions.slice(-30);
}

// ─── Init ────────────────────────────────────────────────────────────
function initFerme() {
  return {
    // Finances
    caisseGraisse: 0,        // argent "dans la ferme"
    totalRecolte: 0,
    totalVendu: 0,
    // Terrain & Cultures
    terrains: ["JARDIN"],
    cultures: [],            // { cultureId, planteA, recoltableA, parcelle }
    // Animaux
    animaux: {},             // { POULE: 3, VACHE: 1, ... }
    // Bâtiments
    batiments: [],           // [{ type, id }]
    // Stock de produits récoltés
    stock: {},               // { BLE: 200, MAIS: 150 ... }
    // Recherches
    recherches: [],
    // Niveau & progression
    niveau: "PAYSAN",
    xp: 0,
    streak: 0,
    achievements: [],
    // Finances avancées
    pret: 0,
    pretDate: null,
    creditScore: 600,
    // Météo
    meteoActuelle: "SOLEIL",
    meteoTimestamp: 0,
    // Événement
    evenementActif: null,
    evenementExpire: null,
    // Cooldowns
    lastRecolte: null,
    lastElevage: null,
    lastMarche: null,
    lastDaily: null,
    // Historique
    transactions: [],
    // Saison
    saisonManuelle: null,
  };
}

// ─── Tableau de bord ─────────────────────────────────────────────────
function renderDashboard(ferme, wallet) {
  const nv = getNiveau(ferme);
  const meteo = getMeteo(ferme);
  const saison = ferme.saisonManuelle || getSaison();
  const stock = getStockActuel(ferme);
  const stockMax = getStockageMax(ferme);
  const parcTot = getParcellesTotales(ferme);
  const parcOcc = getParcellesTotalesOccupees(ferme);
  const revAnim = getRevenuAnimaux(ferme);
  const total = wallet + ferme.caisseGraisse;

  const nextNv = NIVEAUX[NIVEAUX.findIndex(n => n.id === nv.id) + 1] || null;
  const progressStr = nextNv
    ? `${FM(ferme.totalRecolte)} / ${FM(nextNv.min)}`
    : "NIVEAU MAX ✅";

  return `
${fonts.bold("🌾 FERME ROYALE")} ${meteo.emoji}
${L("━", 44)}
${fonts.bold(nv.emoji + " " + nv.nom)} ${ferme.streak > 0 ? `• 🔥 ${ferme.streak} jours` : ""}

${fonts.bold("💰 FINANCES")} ${L("─", 24)}
💵 Portefeuille     : ${fonts.bold(FM(wallet))}
🏦 Caisse Ferme     : ${fonts.bold(FM(ferme.caisseGraisse))}
📊 Total Disponible : ${fonts.bold(FM(total))}
${ferme.pret > 0 ? `💳 Prêt en cours   : ${fonts.bold(FM(ferme.pret))}` : "✅ Aucune dette"}

${fonts.bold("🌱 TERRAIN & CULTURES")} ${L("─", 18)}
🗺️ Terrains          : ${fonts.bold(ferme.terrains.length + " zone(s)")}
🌿 Parcelles          : ${fonts.bold(parcOcc + "/" + parcTot + " occupées")}
🌾 Cultures actives   : ${fonts.bold(ferme.cultures.length)}
📦 Stock              : ${fonts.bold(stock + "/" + stockMax + " unités")}

${fonts.bold("🐄 ÉLEVAGE")} ${L("─", 31)}
🐾 Espèces           : ${fonts.bold(Object.keys(ferme.animaux).length)}
🥛 Revenu/collecte   : ${fonts.bold(FM(revAnim))}

${fonts.bold("🏗️ DÉVELOPPEMENT")} ${L("─", 25)}
🏚️ Bâtiments        : ${fonts.bold(ferme.batiments.length)}
🔬 Recherches        : ${fonts.bold(ferme.recherches.length)}
🏆 Succès            : ${fonts.bold(ferme.achievements.length)}

${fonts.bold("📈 PROGRESSION")} ${L("─", 26)}
⭐ Total Récolté     : ${fonts.bold(FM(ferme.totalRecolte))}
${nextNv ? `⬆️ Prochain niveau   : ${progressStr}` : "👑 Vous êtes au sommet !"}
🎯 Score de crédit   : ${fonts.bold(ferme.creditScore + "/850")}

${fonts.bold("⏳ COOLDOWNS")} ${L("─", 28)}
🌾 Récolte   : ${timeLeft(ferme.lastRecolte, COOLDOWNS.RECOLTE) || "✅ Prêt"}
🐄 Élevage   : ${timeLeft(ferme.lastElevage, COOLDOWNS.ELEVAGE) || "✅ Prêt"}
🎁 Daily     : ${timeLeft(ferme.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}

${fonts.bold("🌤️ MÉTÉO & SAISON")} ${L("─", 22)}
${meteo.emoji} ${fonts.bold(meteo.nom)} — ${meteo.texte}
${SAISON_EMOJI[saison]} Saison : ${fonts.bold(saison)}
${ferme.evenementActif ? `\n⚡ ÉVÉNEMENT ACTIF : ${EVENEMENTS.find(e=>e.id===ferme.evenementActif)?.texte || ""}` : ""}
`.trim();
}

// ─── Aide ────────────────────────────────────────────────────────────
function renderHelp() {
  return `
${fonts.bold("🌾 FERME ROYALE — GUIDE COMPLET")}
${L("━", 44)}

${fonts.bold("🌱 CULTURES")} ${L("─", 32)}
📋 ferme culture list            — Voir toutes les cultures
🌱 ferme planter <ID> <nb>       — Planter une culture
✅ ferme recolter                — Récolter les cultures mûres
📦 ferme stock                   — Voir votre stock

${fonts.bold("🐄 ÉLEVAGE")} ${L("─", 31)}
📋 ferme animal list             — Voir les animaux
🐾 ferme acheter animal <ID> <nb>— Acheter un animal
🥛 ferme collecter               — Collecter la production animale

${fonts.bold("🏗️ BÂTIMENTS")} ${L("─", 29)}
📋 ferme batiment list           — Voir les bâtiments
🔨 ferme construire <TYPE>       — Construire un bâtiment

${fonts.bold("🗺️ TERRAINS")} ${L("─", 31)}
📋 ferme terrain list            — Voir les terrains disponibles
💰 ferme agrandir <ID>           — Acheter un nouveau terrain

${fonts.bold("🔬 RECHERCHES")} ${L("─", 28)}
📋 ferme recherche list          — Technologies disponibles
🔬 ferme rechercher <ID>         — Lancer une recherche

${fonts.bold("💰 MARCHÉ")} ${L("─", 32)}
📊 ferme marche                  — Prix du marché actuel
💸 ferme vendre <ID> <qte>       — Vendre votre stock

${fonts.bold("🏦 FINANCES")} ${L("─", 30)}
💵 ferme depot <montant>         — Déposer dans la caisse
💸 ferme retirer <montant>       — Retirer de la caisse
🏦 ferme pret <montant>          — Emprunter de l'argent
💳 ferme rembourser <montant>    — Rembourser votre prêt

${fonts.bold("📊 STATS")} ${L("─", 33)}
🌾 ferme                         — Tableau de bord
🎁 ferme daily                   — Récompense quotidienne
🏆 ferme succes                  — Vos succès
👑 ferme classement              — Top joueurs
🌤️ ferme meteo                   — Météo actuelle
📋 ferme historique              — 15 dernières transactions
`.trim();
}

// ─── COMMANDES ────────────────────────────────────────────────────────

async function cmdPlanter(message, args, ferme, user, save, wallet) {
  const cId = (args[1] || "").toUpperCase();
  const nb = parseInt(args[2]) || 1;
  const culture = CULTURES[cId];
  if (!culture) {
    return message.reply(fonts.bold(`❌ Culture inconnue. Tapez 'ferme culture list' pour voir la liste.`));
  }
  const parcTot = getParcellesTotales(ferme);
  const parcOcc = getParcellesTotalesOccupees(ferme);
  if (parcOcc + nb > parcTot) {
    return message.reply(fonts.bold(`
🌱 PLACE INSUFFISANTE
${L("─", 44)}

Parcelles occupées : ${parcOcc}/${parcTot}
Demandé            : ${nb} parcelle(s)
Place restante     : ${parcTot - parcOcc}

💡 Achetez un nouveau terrain avec 'ferme agrandir <ID>'.
    `.trim()));
  }
  const coutTotal = culture.prixGraine * nb;
  const totalDispo = wallet + ferme.caisseGraisse;
  if (totalDispo < coutTotal) {
    return message.reply(fonts.bold(`
❌ FONDS INSUFFISANTS
${L("─", 44)}

Coût des graines : ${FM(coutTotal)}
Disponible       : ${FM(totalDispo)}
Manque           : ${FM(coutTotal - totalDispo)}
    `.trim()));
  }
  // Déduire de la caisse puis du wallet
  let reste = coutTotal;
  if (ferme.caisseGraisse >= reste) { ferme.caisseGraisse -= reste; reste = 0; }
  else { reste -= ferme.caisseGraisse; ferme.caisseGraisse = 0; user.money -= reste; }

  const saison = ferme.saisonManuelle || getSaison();
  let tempsBase = culture.temps * 60 * 1000; // en ms
  if (ferme.recherches.includes("SEMENCES")) tempsBase = Math.floor(tempsBase * 0.75);
  const serre = ferme.batiments.find(b => b.type === "SERRE");
  const hors_saison = !culture.saison.includes(saison) && !serre;

  const maintenant = Date.now();
  const recoltableA = maintenant + tempsBase + (hors_saison ? tempsBase * 0.5 : 0);

  for (let i = 0; i < nb; i++) {
    ferme.cultures.push({
      cultureId: cId,
      planteA: maintenant,
      recoltableA: recoltableA,
    });
  }
  addTransaction(ferme, "plantation", -coutTotal, `Plantation ${nb}x ${culture.nom}`);
  await save();
  const dureeMin = Math.ceil((recoltableA - maintenant) / 60000);
  return message.reply(fonts.bold(`
${culture.emoji} PLANTATION RÉUSSIE !
${L("─", 44)}

Culture    : ${culture.nom}
Quantité   : ${nb} parcelle(s)
Coût       : ${FM(coutTotal)}
Récolte    : dans ${dureeMin >= 60 ? Math.floor(dureeMin / 60) + "h " + (dureeMin % 60) + "m" : dureeMin + " min"}
${hors_saison ? "⚠️ Hors saison — pousse plus lente. Construisez une serre !" : `✅ Saison ${saison} — croissance normale`}

💡 Tapez 'ferme recolter' quand c'est prêt !
  `.trim()));
}

async function cmdRecolter(message, ferme, user, save) {
  const cd = timeLeft(ferme.lastRecolte, COOLDOWNS.RECOLTE);
  if (cd) return message.reply(fonts.bold(`⏰ Récolte disponible dans ${cd}.`));

  const now = Date.now();
  const mures = ferme.cultures.filter(c => c.recoltableA <= now);
  if (mures.length === 0) {
    const prochaine = ferme.cultures.reduce((min, c) => c.recoltableA < min ? c.recoltableA : min, Infinity);
    if (prochaine === Infinity) return message.reply(fonts.bold("🌱 Aucune culture plantée. Tapez 'ferme planter <ID> <nb>'."));
    const restant = Math.ceil((prochaine - now) / 60000);
    return message.reply(fonts.bold(`⏳ Aucune culture n'est encore mûre.\nProchaine récolte dans : ${restant >= 60 ? Math.floor(restant / 60) + "h " + (restant % 60) + "m" : restant + " min"}`));
  }

  const meteo = getMeteo(ferme);
  const stockMax = getStockageMax(ferme);
  const stockActuel = getStockActuel(ferme);
  const place = stockMax - stockActuel;

  if (place <= 0) {
    return message.reply(fonts.bold(`
❌ STOCK PLEIN !
${L("─", 44)}

Stockage : ${stockActuel}/${stockMax}
💡 Vendez votre stock avec 'ferme vendre <ID> <qte>'
ou construisez un Silo ('ferme construire SILO').
    `.trim()));
  }

  let gains = {};
  let totalUnites = 0;
  let totalValeur = 0;
  const retirées = [];

  for (const c of mures) {
    const culture = CULTURES[c.cultureId];
    if (!culture) continue;
    let qte = rand(culture.gain[0], culture.gain[1]);
    qte = Math.floor(qte * meteo.bonus);
    if (ferme.recherches.includes("ENGRAIS")) qte = Math.floor(qte * 1.20);
    if (ferme.evenementActif === "MAUVAISE_HERBE" && Date.now() < ferme.evenementExpire) qte = Math.floor(qte * 0.85);
    const stockable = Math.min(qte, place - totalUnites);
    if (stockable <= 0) break;
    ferme.stock[c.cultureId] = (ferme.stock[c.cultureId] || 0) + stockable;
    gains[c.cultureId] = (gains[c.cultureId] || 0) + stockable;
    totalUnites += stockable;
    // Valeur estimée (prix min du marché)
    const culture2 = CULTURES[c.cultureId];
    totalValeur += stockable; // unités brutes
    retirées.push(c);
    ferme.xp += 10;
  }

  // Retirer les cultures récoltées
  ferme.cultures = ferme.cultures.filter(c => !retirées.includes(c));
  ferme.totalRecolte += totalUnites;
  ferme.lastRecolte = now;

  const nouveauxSucces = checkAchievements(ferme);
  addTransaction(ferme, "recolte", totalUnites, `Récolte de ${Object.keys(gains).length} culture(s)`);
  const nv = getNiveau(ferme);
  ferme.niveau = nv.id;
  await save();

  let lignes = "";
  for (const [id, qte] of Object.entries(gains)) {
    const c = CULTURES[id];
    lignes += `${c.emoji} ${c.nom} : +${qte} unités\n`;
  }

  return message.reply(fonts.bold(`
✅ RÉCOLTE EFFECTUÉE !
${L("─", 44)}

${lignes}
${meteo.emoji} Bonus météo : ×${meteo.bonus}
📦 Total récolté : ${totalUnites} unités
📊 Stock actuel  : ${getStockActuel(ferme)}/${getStockageMax(ferme)}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdCollecter(message, ferme, save) {
  const cd = timeLeft(ferme.lastElevage, COOLDOWNS.ELEVAGE);
  if (cd) return message.reply(fonts.bold(`⏰ Collecte animale disponible dans ${cd}.`));

  if (Object.keys(ferme.animaux).length === 0) {
    return message.reply(fonts.bold("🐾 Vous n'avez aucun animal. Tapez 'ferme animal list' pour acheter."));
  }

  const revenu = getRevenuAnimaux(ferme);
  ferme.caisseGraisse += revenu;
  ferme.totalRecolte += revenu;
  ferme.lastElevage = Date.now();
  ferme.xp += 5;

  addTransaction(ferme, "elevage", revenu, "Production animale collectée");
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  let lignes = "";
  for (const [id, qte] of Object.entries(ferme.animaux)) {
    const a = ANIMAUX[id];
    if (a) lignes += `${a.emoji} ${a.nom} ×${qte} → +${FM(a.production * qte)}\n`;
  }

  return message.reply(fonts.bold(`
🥛 PRODUCTION COLLECTÉE !
${L("─", 44)}

${lignes}
💰 Total perçu       : ${FM(revenu)}
🏦 Caisse de la ferme : ${FM(ferme.caisseGraisse)}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdVendre(message, args, ferme, save) {
  const cId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]);

  if (!cId || !qte) {
    // Afficher le stock vendable
    const stock = ferme.stock;
    if (Object.keys(stock).length === 0) return message.reply(fonts.bold("📦 Votre stock est vide. Récoltez d'abord !"));
    let txt = `${fonts.bold("📦 STOCK DISPONIBLE")}\n${L("─", 44)}\n\n`;
    for (const [id, q] of Object.entries(stock)) {
      if (q <= 0) continue;
      const c = CULTURES[id];
      if (c) txt += `${c.emoji} ${c.nom} [${id}] : ${q} unités\n`;
    }
    txt += `\nCommande: ferme vendre <ID> <quantité>`;
    return message.reply(txt);
  }

  const culture = CULTURES[cId];
  if (!culture) return message.reply(fonts.bold(`❌ Culture inconnue: ${cId}`));
  if (!ferme.stock[cId] || ferme.stock[cId] < qte) {
    return message.reply(fonts.bold(`❌ Stock insuffisant. Vous avez ${ferme.stock[cId] || 0} unité(s) de ${culture.nom}.`));
  }

  const meteo = getMeteo(ferme);
  let prixUnit = rand(culture.gain[0], culture.gain[1]) / 10; // prix par unité
  if (ferme.recherches.includes("MARCHE_PRO")) prixUnit = Math.floor(prixUnit * 1.30);
  if (ferme.batiments.find(b => b.type === "COOPERATIVE")) prixUnit = Math.floor(prixUnit * 1.30);
  if (ferme.evenementActif === "FESTIVAL" && Date.now() < ferme.evenementExpire) prixUnit = Math.floor(prixUnit * 1.40);

  const totalGain = Math.floor(prixUnit * qte);
  ferme.stock[cId] -= qte;
  if (ferme.stock[cId] <= 0) delete ferme.stock[cId];
  ferme.caisseGraisse += totalGain;
  ferme.totalVendu += totalGain;
  ferme.totalRecolte += totalGain;
  ferme.xp += Math.floor(totalGain / 100);

  addTransaction(ferme, "vente", totalGain, `Vente ${qte}x ${culture.nom}`);
  const nv = getNiveau(ferme);
  ferme.niveau = nv.id;
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
${culture.emoji} VENTE EFFECTUÉE !
${L("─", 44)}

Produit     : ${culture.nom}
Quantité    : ${qte} unités
Prix/unité  : ${FM(prixUnit)}
💰 Total    : ${FM(totalGain)}
🏦 Caisse   : ${FM(ferme.caisseGraisse)}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdAchetAnimal(message, args, ferme, user, save, wallet) {
  const aId = (args[2] || "").toUpperCase();
  const nb = parseInt(args[3]) || 1;
  const animal = ANIMAUX[aId];
  if (!animal) {
    return message.reply(fonts.bold(`❌ Animal inconnu. Tapez 'ferme animal list'.`));
  }
  const coutTotal = animal.cout * nb;
  const totalDispo = wallet + ferme.caisseGraisse;
  if (totalDispo < coutTotal) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(coutTotal)}, disponible: ${FM(totalDispo)}.`));
  }
  let reste = coutTotal;
  if (ferme.caisseGraisse >= reste) { ferme.caisseGraisse -= reste; }
  else { reste -= ferme.caisseGraisse; ferme.caisseGraisse = 0; user.money -= reste; }

  ferme.animaux[aId] = (ferme.animaux[aId] || 0) + nb;
  addTransaction(ferme, "achat_animal", -coutTotal, `Achat ${nb}x ${animal.nom}`);
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
${animal.emoji} ANIMAL(AUX) ACHETÉ(S) !
${L("─", 44)}

Animal      : ${animal.nom}
Quantité    : ${nb}
Coût total  : ${FM(coutTotal)}
Production  : ${FM(animal.production * nb)} / collecte
Produit     : ${animal.produit}

💡 Tapez 'ferme collecter' toutes les 2h pour percevoir la production.
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdConstruire(message, args, ferme, user, save, wallet) {
  const bId = (args[1] || "").toUpperCase();
  const bat = BATIMENTS[bId];
  if (!bat) {
    return message.reply(fonts.bold(`❌ Bâtiment inconnu. Tapez 'ferme batiment list'.`));
  }
  if (ferme.batiments.find(b => b.type === bId)) {
    return message.reply(fonts.bold(`❌ Vous avez déjà construit ce bâtiment.`));
  }
  const totalDispo = wallet + ferme.caisseGraisse;
  if (totalDispo < bat.cout) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(bat.cout)}, disponible: ${FM(totalDispo)}.`));
  }
  let reste = bat.cout;
  if (ferme.caisseGraisse >= reste) { ferme.caisseGraisse -= reste; }
  else { reste -= ferme.caisseGraisse; ferme.caisseGraisse = 0; user.money -= reste; }

  ferme.batiments.push({ type: bId, construit: Date.now() });
  addTransaction(ferme, "construction", -bat.cout, `Construction: ${bat.nom}`);
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
${bat.emoji} BÂTIMENT CONSTRUIT !
${L("─", 44)}

Bâtiment : ${bat.nom}
Coût     : ${FM(bat.cout)}
Effet    : ${bat.effet || ("+" + (bat.val * 100 | 0) + "% " + bat.bonus)}
  `.trim()) + (nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""));
}

async function cmdAgrandir(message, args, ferme, user, save, wallet) {
  const tId = (args[1] || "").toUpperCase();
  const terrain = TERRAINS[tId];
  if (!terrain) {
    return message.reply(fonts.bold(`❌ Terrain inconnu. Tapez 'ferme terrain list'.`));
  }
  if (ferme.terrains.includes(tId)) {
    return message.reply(fonts.bold(`❌ Vous possédez déjà ce terrain.`));
  }
  const totalDispo = wallet + ferme.caisseGraisse;
  if (totalDispo < terrain.cout) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(terrain.cout)}, disponible: ${FM(totalDispo)}.`));
  }
  if (terrain.cout > 0) {
    let reste = terrain.cout;
    if (ferme.caisseGraisse >= reste) { ferme.caisseGraisse -= reste; }
    else { reste -= ferme.caisseGraisse; ferme.caisseGraisse = 0; user.money -= reste; }
  }
  ferme.terrains.push(tId);
  addTransaction(ferme, "terrain", -terrain.cout, `Achat terrain: ${terrain.nom}`);
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
${terrain.emoji} TERRAIN ACQUIS !
${L("─", 44)}

Terrain       : ${terrain.nom}
Coût          : ${FM(terrain.cout)}
Nouvelles parcelles : +${terrain.parcelles}
Total parcelles  : ${getParcellesTotales(ferme)}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdRechercher(message, args, ferme, user, save, wallet) {
  const rId = (args[1] || "").toUpperCase();
  const rech = RECHERCHES[rId];
  if (!rech) {
    return message.reply(fonts.bold(`❌ Recherche inconnue. Tapez 'ferme recherche list'.`));
  }
  if (ferme.recherches.includes(rId)) {
    return message.reply(fonts.bold(`❌ Vous avez déjà cette recherche.`));
  }
  const totalDispo = wallet + ferme.caisseGraisse;
  if (totalDispo < rech.cout) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(rech.cout)}, disponible: ${FM(totalDispo)}.`));
  }
  let reste = rech.cout;
  if (ferme.caisseGraisse >= reste) { ferme.caisseGraisse -= reste; }
  else { reste -= ferme.caisseGraisse; ferme.caisseGraisse = 0; user.money -= reste; }

  ferme.recherches.push(rId);
  addTransaction(ferme, "recherche", -rech.cout, `Recherche: ${rech.nom}`);
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
🔬 RECHERCHE COMPLÉTÉE !
${L("─", 44)}

Technologie : ${rech.nom}
Coût        : ${FM(rech.cout)}
Effet       : ${rech.effet}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdDepot(message, args, ferme, user, save, wallet) {
  const montant = parseInt(args[1]);
  if (!montant || montant <= 0) {
    return message.reply(fonts.bold(`
💵 DÉPÔT DANS LA CAISSE
${L("─", 44)}

Portefeuille   : ${FM(wallet)}
Caisse actuelle : ${FM(ferme.caisseGraisse)}

Usage: ferme depot <montant>
    `.trim()));
  }
  if (wallet < montant) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(wallet)}, demandé: ${FM(montant)}.`));
  }
  user.money -= montant;
  ferme.caisseGraisse += montant;
  addTransaction(ferme, "depot", montant, "Dépôt dans la caisse");
  await save();
  return message.reply(fonts.bold(`✅ Dépôt de ${FM(montant)} effectué.\n🏦 Caisse ferme : ${FM(ferme.caisseGraisse)}`));
}

async function cmdRetirer(message, args, ferme, user, save) {
  const montant = parseInt(args[1]);
  if (!montant || montant <= 0 || ferme.caisseGraisse < montant) {
    return message.reply(fonts.bold(`❌ Montant invalide ou caisse insuffisante.\nCaisse : ${FM(ferme.caisseGraisse)}`));
  }
  ferme.caisseGraisse -= montant;
  user.money = (user.money || 0) + montant;
  addTransaction(ferme, "retrait", -montant, "Retrait de la caisse");
  await save();
  return message.reply(fonts.bold(`✅ Retrait de ${FM(montant)} effectué.\n💵 Portefeuille : ${FM(user.money)}`));
}

async function cmdPret(message, args, ferme, save) {
  const montant = parseInt(args[1]);
  if (ferme.pret > 0) {
    return message.reply(fonts.bold(`❌ Vous avez déjà un prêt de ${FM(ferme.pret)}.\nRemboursez avec 'ferme rembourser <montant>'.`));
  }
  const maxPret = ferme.creditScore * 1500;
  if (!montant || montant < 1000) {
    return message.reply(fonts.bold(`
🏦 PRÊT AGRICOLE
${L("─", 44)}

Score de crédit : ${ferme.creditScore}/850
Prêt maximum    : ${FM(maxPret)}
Taux d'intérêt  : 7% par semaine

Usage: ferme pret <montant>
    `.trim()));
  }
  if (montant > maxPret) {
    return message.reply(fonts.bold(`❌ Prêt max basé sur votre crédit (${ferme.creditScore}): ${FM(maxPret)}`));
  }
  ferme.caisseGraisse += montant;
  ferme.pret = montant;
  ferme.pretDate = Date.now();
  addTransaction(ferme, "pret", montant, "Prêt agricole approuvé");
  await save();
  return message.reply(fonts.bold(`
✅ PRÊT APPROUVÉ !
${L("─", 44)}

Montant         : ${FM(montant)}
Taux d'intérêt  : 7% / semaine
🏦 Caisse       : ${FM(ferme.caisseGraisse)}

💡 Remboursez vite pour améliorer votre crédit !
  `.trim()));
}

async function cmdRembourser(message, args, ferme, save) {
  const montant = parseInt(args[1]);
  if (ferme.pret <= 0) return message.reply(fonts.bold("✅ Vous n'avez aucun prêt en cours."));
  if (!montant || ferme.caisseGraisse < montant) {
    return message.reply(fonts.bold(`❌ Fonds insuffisants.\nCaisse : ${FM(ferme.caisseGraisse)}\nPrêt restant : ${FM(ferme.pret)}`));
  }
  const rembours = Math.min(montant, ferme.pret);
  ferme.caisseGraisse -= rembours;
  ferme.pret -= rembours;
  if (ferme.pret <= 0) {
    ferme.pretDate = null;
    ferme.creditScore = Math.min(850, ferme.creditScore + 20);
  }
  addTransaction(ferme, "remboursement", -rembours, "Remboursement prêt agricole");
  await save();
  const msg = ferme.pret <= 0
    ? `✅ Prêt intégralement remboursé ! Score crédit +20 → ${ferme.creditScore}.`
    : `✅ Remboursement de ${FM(rembours)} effectué. Reste : ${FM(ferme.pret)}.`;
  return message.reply(fonts.bold(msg));
}

async function cmdDaily(message, ferme, save) {
  const cd = timeLeft(ferme.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`⏰ Récompense déjà réclamée ! Prochaine dans : ${cd}.`));

  if (Date.now() - (ferme.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
    ferme.streak = (ferme.streak || 0) + 1;
  } else {
    ferme.streak = 1;
  }

  const nv = getNiveau(ferme);
  const base = 500;
  const streakBonus = Math.min(ferme.streak * 100, 2000);
  const levelBonus = NIVEAUX.findIndex(n => n.id === nv.id) * 500;
  const total = base + streakBonus + levelBonus;

  ferme.caisseGraisse += total;
  ferme.totalRecolte += total;
  ferme.lastDaily = Date.now();

  // Événement aléatoire (30% de chance)
  let evtMsg = "";
  if (Math.random() < 0.30) {
    const evt = pick(EVENEMENTS);
    ferme.evenementActif = evt.id;
    ferme.evenementExpire = Date.now() + 2 * 60 * 60 * 1000; // 2h
    if (evt.effet === "bonus_cash") { ferme.caisseGraisse += evt.val; }
    evtMsg = `\n\n⚡ ÉVÉNEMENT ALÉATOIRE :\n${evt.texte}`;
  }

  addTransaction(ferme, "daily", total, `Récompense quotidienne (série ${ferme.streak})`);
  const nv2 = getNiveau(ferme);
  ferme.niveau = nv2.id;
  const nouveauxSucces = checkAchievements(ferme);
  await save();

  return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE !
${L("─", 44)}

💵 Base            : ${FM(base)}
🔥 Bonus série     : +${FM(streakBonus)} (${ferme.streak} jours)
⭐ Bonus niveau    : +${FM(levelBonus)}
💰 TOTAL           : ${FM(total)}

🏦 Caisse ferme    : ${FM(ferme.caisseGraisse)}
${evtMsg}
${nouveauxSucces.length > 0 ? `\n🏆 Succès : ${nouveauxSucces.join(", ")}` : ""}
  `.trim()));
}

async function cmdSucces(message, ferme) {
  const LISTE = {
    PREMIER_LABOUR:  { emoji: "🌱", desc: "Récolter pour la 1ère fois" },
    PREMIERE_VENTE:  { emoji: "💰", desc: "Faire une 1ère vente" },
    PAYSAN_HEUREUX:  { emoji: "👨‍🌾",desc: "Avoir 5 cultures actives" },
    ELEVEUR:         { emoji: "🐄", desc: "Posséder 2 espèces animales" },
    MILLE_DOLLARS:   { emoji: "💵", desc: "Récolter 1 000$ de valeur" },
    MILLION_CLUB:    { emoji: "💎", desc: "Atteindre 1 000 000$" },
    CONSTRUCTEUR:    { emoji: "🏗️",desc: "Construire 3 bâtiments" },
    CHERCHEUR:       { emoji: "🔬", desc: "Débloquer 3 recherches" },
    PROPRIETAIRE:    { emoji: "🗺️",desc: "Posséder 3 terrains" },
    MILLIARDAIRE:    { emoji: "👑", desc: "Atteindre 1 milliard$" },
  };
  const total = Object.keys(LISTE).length;
  let txt = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n${L("─", 44)}\n\n`;
  txt += `${fonts.bold("Progression :")} ${ferme.achievements.length}/${total}\n\n`;
  if (ferme.achievements.length === 0) {
    txt += "🎯 Aucun succès pour le moment. Commencez à cultiver !\n\n";
  } else {
    txt += `${fonts.bold("✅ OBTENUS :")}\n`;
    for (const id of ferme.achievements) {
      const a = LISTE[id];
      if (a) txt += `${a.emoji} ${id.replace(/_/g, " ")} — ${a.desc}\n`;
    }
    txt += "\n";
  }
  const restants = Object.entries(LISTE).filter(([id]) => !ferme.achievements.includes(id));
  if (restants.length > 0) {
    txt += `${fonts.bold("🎯 PROCHAINS OBJECTIFS :")}\n`;
    restants.slice(0, 5).forEach(([, a]) => txt += `• ${a.emoji} ${a.desc}\n`);
  }
  return message.reply(fonts.bold(txt));
}

async function cmdClassement(message, usersData) {
  try {
    const tous = await usersData.getAll();
    const joueurs = [];
    for (const [uid, u] of Object.entries(tous)) {
      const f = u.data?.ferme;
      if (f && f.totalRecolte > 0) {
        const nv = getNiveau(f);
        joueurs.push({
          uid,
          nom: u.name || `Fermier ${uid.slice(-4)}`,
          totalRecolte: f.totalRecolte,
          totalVendu: f.totalVendu || 0,
          niveau: nv.nom,
          niveauEmoji: nv.emoji,
          achievements: f.achievements?.length || 0,
        });
      }
    }
    joueurs.sort((a, b) => b.totalRecolte - a.totalRecolte);
    const top10 = joueurs.slice(0, 10);

    let txt = `${fonts.bold("👑 CLASSEMENT FERME ROYALE")}\n${L("─", 44)}\n${fonts.bold("TOP 10 DES FERMIERS")}\n\n`;
    if (top10.length === 0) {
      txt += "Aucun joueur classé pour le moment.\n";
    } else {
      top10.forEach((j, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        txt += `${medal} ${fonts.bold(j.nom)}\n`;
        txt += `   ${j.niveauEmoji} ${j.niveau} | 🏆 ${j.achievements} succès\n`;
        txt += `   💰 Récolté : ${FM(j.totalRecolte)} | Vendu : ${FM(j.totalVendu)}\n\n`;
      });
    }
    return message.reply(txt);
  } catch (e) {
    console.error("Classement ferme error:", e);
    return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
  }
}

function cmdListCultures(message, ferme) {
  const saison = ferme.saisonManuelle || getSaison();
  let txt = `${fonts.bold("🌱 CULTURES DISPONIBLES")}\n${L("─", 44)}\n`;
  txt += `${SAISON_EMOJI[saison]} Saison actuelle : ${fonts.bold(saison)}\n\n`;
  for (const [id, c] of Object.entries(CULTURES)) {
    const stock = ferme.stock[id] || 0;
    const enSaison = c.saison.includes(saison);
    txt += `${c.emoji} ${c.nom} [${id}]\n`;
    txt += `   💵 Graine : ${FM(c.prixGraine)} · ⏱️ ${c.temps} min · Gain : ${FM(c.gain[0])}–${FM(c.gain[1])}\n`;
    txt += `   ${enSaison ? "✅ En saison" : "⚠️ Hors saison (pousse 50% plus lente)"} · 📦 Stock : ${stock}\n\n`;
  }
  txt += `Planter: ferme planter <ID> <nb_parcelles>`;
  return message.reply(txt);
}

function cmdListAnimaux(message, ferme) {
  let txt = `${fonts.bold("🐾 ÉLEVAGE DISPONIBLE")}\n${L("─", 44)}\n\n`;
  for (const [id, a] of Object.entries(ANIMAUX)) {
    const qte = ferme.animaux[id] || 0;
    txt += `${a.emoji} ${a.nom} [${id}]\n`;
    txt += `   💵 Coût : ${FM(a.cout)} · 🥛 ${a.produit} : ${FM(a.production)}/collecte\n`;
    txt += `   ${qte > 0 ? `✅ Vous en avez : ${qte}` : "🔒 Pas encore acheté"}\n\n`;
  }
  txt += `Acheter: ferme acheter animal <ID> <quantité>`;
  return message.reply(txt);
}

function cmdListBatiments(message, ferme) {
  let txt = `${fonts.bold("🏗️ BÂTIMENTS DISPONIBLES")}\n${L("─", 44)}\n\n`;
  for (const [id, b] of Object.entries(BATIMENTS)) {
    const construit = ferme.batiments.find(x => x.type === id);
    txt += `${b.emoji} ${b.nom} [${id}]\n`;
    txt += `   💵 Coût : ${FM(b.cout)} · ✨ Effet : ${b.bonus} +${typeof b.val === "number" && b.val < 1 ? pct(b.val) : b.val}\n`;
    txt += `   ${construit ? "✅ CONSTRUIT" : "🔒 Non construit"}\n\n`;
  }
  txt += `Construire: ferme construire <TYPE>`;
  return message.reply(txt);
}

function cmdListTerrains(message, ferme) {
  let txt = `${fonts.bold("🗺️ TERRAINS DISPONIBLES")}\n${L("─", 44)}\n\n`;
  for (const [id, t] of Object.entries(TERRAINS)) {
    const possede = ferme.terrains.includes(id);
    txt += `${t.emoji} ${t.nom} [${id}]\n`;
    txt += `   💵 Coût : ${t.cout === 0 ? "Gratuit (départ)" : FM(t.cout)} · 🌿 Parcelles : ${t.parcelles}\n`;
    txt += `   ${possede ? "✅ POSSÉDÉ" : "🔒 Non acquis"}\n\n`;
  }
  txt += `Acheter: ferme agrandir <ID>`;
  return message.reply(txt);
}

function cmdListRecherches(message, ferme) {
  let txt = `${fonts.bold("🔬 RECHERCHES DISPONIBLES")}\n${L("─", 44)}\n\n`;
  for (const [id, r] of Object.entries(RECHERCHES)) {
    const faite = ferme.recherches.includes(id);
    txt += `🔬 ${r.nom} [${id}]\n`;
    txt += `   💵 Coût : ${FM(r.cout)} · ✨ ${r.effet}\n`;
    txt += `   ${faite ? "✅ DÉBLOQUÉ" : "🔒 Non recherché"}\n\n`;
  }
  txt += `Rechercher: ferme rechercher <ID>`;
  return message.reply(txt);
}

function cmdMarche(message, ferme) {
  const saison = ferme.saisonManuelle || getSaison();
  const meteo = getMeteo(ferme);
  let txt = `${fonts.bold("📊 MARCHÉ AGRICOLE")}\n${L("─", 44)}\n`;
  txt += `${meteo.emoji} Météo : ${meteo.nom} (×${meteo.bonus})\n`;
  txt += `${SAISON_EMOJI[saison]} Saison : ${saison}\n\n`;
  for (const [id, c] of Object.entries(CULTURES)) {
    let prixEst = Math.floor((c.gain[0] + c.gain[1]) / 2 / 10);
    if (ferme.recherches.includes("MARCHE_PRO")) prixEst = Math.floor(prixEst * 1.30);
    const stockActuel = ferme.stock[id] || 0;
    txt += `${c.emoji} ${c.nom} — ~${FM(prixEst)}/unité · Stock: ${stockActuel}\n`;
  }
  txt += `\n💡 Vendre: ferme vendre <ID> <quantité>`;
  return message.reply(txt);
}

function cmdMeteo(message, ferme) {
  const meteo = getMeteo(ferme);
  const saison = ferme.saisonManuelle || getSaison();
  const prochaine = Math.ceil((COOLDOWNS.METEO - (Date.now() - ferme.meteoTimestamp)) / 60000);
  return message.reply(fonts.bold(`
🌤️ MÉTÉO ACTUELLE
${L("─", 44)}

${meteo.emoji} ${fonts.bold(meteo.nom)}
📜 ${meteo.texte}
📈 Bonus récolte : ×${meteo.bonus}
${SAISON_EMOJI[saison]} Saison : ${saison}

⏰ Prochain changement dans : ${prochaine > 0 ? prochaine + " min" : "bientôt"}
${ferme.evenementActif ? `\n⚡ Événement actif : ${EVENEMENTS.find(e => e.id === ferme.evenementActif)?.texte || ""}` : ""}
  `.trim()));
}

function cmdHistorique(message, ferme) {
  const txs = ferme.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction enregistrée."));
  const EMOJI = {
    plantation: "🌱", recolte: "✅", vente: "💸", elevage: "🥛",
    achat_animal: "🐾", construction: "🏗️", terrain: "🗺️", recherche: "🔬",
    depot: "💵", retrait: "💸", pret: "🏦", remboursement: "💳", daily: "🎁",
  };
  let txt = `${fonts.bold("📋 HISTORIQUE (15 dernières)")}\n${L("─", 44)}\n\n`;
  txs.forEach(tx => {
    const e = EMOJI[tx.type] || "📌";
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `${e} ${tx.desc}\n   ${sign}${FM(Math.abs(tx.montant))} (${date})\n\n`;
  });
  return message.reply(fonts.bold(txt));
}

function cmdStock(message, ferme) {
  const stock = ferme.stock;
  const stockMax = getStockageMax(ferme);
  const stockActuel = getStockActuel(ferme);
  let txt = `${fonts.bold("📦 STOCK ACTUEL")}\n${L("─", 44)}\n\n`;
  if (stockActuel === 0) {
    txt += "Votre stock est vide. Récoltez des cultures !\n";
  } else {
    for (const [id, qte] of Object.entries(stock)) {
      if (qte <= 0) continue;
      const c = CULTURES[id];
      if (c) txt += `${c.emoji} ${c.nom} : ${qte} unités\n`;
    }
  }
  txt += `\n📊 Capacité : ${stockActuel}/${stockMax}`;
  txt += `\n💡 Vendre : ferme vendre <ID> <quantité>`;
  return message.reply(fonts.bold(txt));
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORT MODULE
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "ferme",
    aliases: ["farm", "agriculture", "cultivateur"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🌾 Simulateur de ferme tycoon. Cultive, élève, construit et vends pour devenir le plus grand Baron Agricole !"
    },
    category: "economy",
    guide: {
      fr: "Tapez 'ferme help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.ferme) user.data.ferme = initFerme();

    const ferme = user.data.ferme;
    const wallet = user.money || 0;

    // Mettre à jour le niveau
    const nv = getNiveau(ferme);
    ferme.niveau = nv.id;

    const save = async () => {
      user.data.ferme = ferme;
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
        return message.reply(renderDashboard(ferme, wallet));

      case "planter":
      case "plant":
        return cmdPlanter(message, args, ferme, user, save, wallet);

      case "recolter":
      case "recolte":
      case "harvest":
        return cmdRecolter(message, ferme, user, save);

      case "collecter":
      case "collect":
        return cmdCollecter(message, ferme, save);

      case "vendre":
      case "sell":
        return cmdVendre(message, args, ferme, save);

      case "acheter":
      case "buy":
        // ferme acheter animal <ID> <nb>
        if ((args[1] || "").toLowerCase() === "animal") {
          return cmdAchetAnimal(message, args, ferme, user, save, wallet);
        }
        return message.reply(fonts.bold("❓ Usage: ferme acheter animal <ID> <quantité>"));

      case "construire":
      case "build":
        return cmdConstruire(message, args, ferme, user, save, wallet);

      case "agrandir":
      case "expand":
        return cmdAgrandir(message, args, ferme, user, save, wallet);

      case "rechercher":
      case "research":
        return cmdRechercher(message, args, ferme, user, save, wallet);

      case "depot":
      case "deposit":
        return cmdDepot(message, args, ferme, user, save, wallet);

      case "retirer":
      case "withdraw":
        return cmdRetirer(message, args, ferme, user, save);

      case "pret":
      case "loan":
        return cmdPret(message, args, ferme, save);

      case "rembourser":
      case "repay":
        return cmdRembourser(message, args, ferme, save);

      case "daily":
        return cmdDaily(message, ferme, save);

      case "succes":
      case "achievements":
        return cmdSucces(message, ferme);

      case "classement":
      case "leaderboard":
        return cmdClassement(message, usersData);

      case "culture":
      case "cultures":
        return cmdListCultures(message, ferme);

      case "animal":
      case "animaux":
        return cmdListAnimaux(message, ferme);

      case "batiment":
      case "batiments":
        return cmdListBatiments(message, ferme);

      case "terrain":
      case "terrains":
        return cmdListTerrains(message, ferme);

      case "recherche":
      case "recherches":
        return cmdListRecherches(message, ferme);

      case "marche":
      case "market":
        return cmdMarche(message, ferme);

      case "meteo":
      case "weather":
        return cmdMeteo(message, ferme);

      case "stock":
      case "inventaire":
        return cmdStock(message, ferme);

      case "historique":
      case "history":
        return cmdHistorique(message, ferme);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'ferme help' pour la liste.`));
    }
  }
};
