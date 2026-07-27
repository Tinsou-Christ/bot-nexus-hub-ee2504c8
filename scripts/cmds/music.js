"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
  STUDIO:     2  * 60 * 60 * 1000,
  CONCERT:    4  * 60 * 60 * 1000,
  PROMO:      1  * 60 * 60 * 1000,
  COLLAB:     6  * 60 * 60 * 1000,
  TOURNEE:    12 * 60 * 60 * 1000,
  DAILY:      24 * 60 * 60 * 1000,
  INTERVIEW:  3  * 60 * 60 * 1000,
  BATTLE:     5  * 60 * 60 * 1000,
};

const NIVEAUX = [
  { id: "INCONNU",    nom: "Artiste Inconnu",    min: 0,            fans: 0,        emoji: "🎤", bonus: 0    },
  { id: "LOCAL",      nom: "Artiste Local",      min: 10_000,       fans: 100,      emoji: "🌆", bonus: 0.05 },
  { id: "REGIONAL",   nom: "Artiste Régional",   min: 100_000,      fans: 10_000,   emoji: "🌍", bonus: 0.10 },
  { id: "NATIONAL",   nom: "Artiste National",   min: 500_000,      fans: 100_000,  emoji: "🌟", bonus: 0.20 },
  { id: "INTERNATIONAL", nom: "Star Internationale", min: 2_000_000, fans: 1_000_000, emoji: "💫", bonus: 0.35 },
  { id: "SUPERSTAR",  nom: "Superstar Mondiale", min: 10_000_000,   fans: 10_000_000, emoji: "👑", bonus: 0.60 },
];

const GENRES = {
  POP:       { id: "POP",     nom: "Pop",          emoji: "🎵", multiplicateur: 1.0, popularite: 90 },
  RAP:       { id: "RAP",     nom: "Rap / Hip-Hop",emoji: "🎤", multiplicateur: 1.2, popularite: 85 },
  RNB:       { id: "RNB",     nom: "R&B / Soul",   emoji: "🎶", multiplicateur: 1.1, popularite: 80 },
  ELECTRO:   { id: "ELECTRO", nom: "Électro / EDM",emoji: "🎧", multiplicateur: 1.3, popularite: 75 },
  ROCK:      { id: "ROCK",    nom: "Rock",          emoji: "🎸", multiplicateur: 1.15,popularite: 70 },
  JAZZ:      { id: "JAZZ",    nom: "Jazz",          emoji: "🎷", multiplicateur: 0.9, popularite: 50 },
  CLASSIQUE: { id: "CLASSIQUE",nom:"Classique",     emoji: "🎻", multiplicateur: 0.8, popularite: 40 },
  AFRO:      { id: "AFRO",    nom: "Afrobeats",    emoji: "🥁", multiplicateur: 1.25,popularite: 88 },
};

const STUDIOS = {
  CHAMBRE:   { id: "CHAMBRE",  nom: "Studio Chambre",   cout: 0,          qualite: 1,  emoji: "🏠" },
  LOCAL:     { id: "LOCAL",    nom: "Studio Local",     cout: 5_000,      qualite: 2,  emoji: "🎙️" },
  PROFESS:   { id: "PROFESS",  nom: "Studio Pro",       cout: 50_000,     qualite: 3,  emoji: "🎚️" },
  PLATINE:   { id: "PLATINE",  nom: "Studio Platine",   cout: 250_000,    qualite: 4,  emoji: "💿" },
  LEGEND:    { id: "LEGEND",   nom: "Abbey Road Suite", cout: 2_000_000,  qualite: 5,  emoji: "🏆" },
};

const TYPES_SON = {
  SINGLE:    { id: "SINGLE",   nom: "Single",         duree: 1,  revenuBase: 20_000,  fansBase: 500,   emoji: "🎵" },
  EP:        { id: "EP",       nom: "EP (5 titres)",  duree: 2,  revenuBase: 80_000,  fansBase: 2_000,  emoji: "💿" },
  ALBUM:     { id: "ALBUM",    nom: "Album (12 titres)",duree:4, revenuBase: 300_000, fansBase: 10_000, emoji: "📀" },
  MIXTAPE:   { id: "MIXTAPE",  nom: "Mixtape Gratuite",duree:2, revenuBase: 0,        fansBase: 15_000, emoji: "📼" },
  DELUXE:    { id: "DELUXE",   nom: "Album Deluxe",   duree: 6,  revenuBase: 600_000, fansBase: 25_000, emoji: "🌟" },
};

const SALLES = {
  BAR:       { id: "BAR",     nom: "Bar de quartier",   capacite: 50,      prix_billet: 20,   cout: 0,       emoji: "🍺", fans_requis: 0         },
  CLUB:      { id: "CLUB",    nom: "Club Privé",        capacite: 300,     prix_billet: 60,   cout: 5_000,   emoji: "🎪", fans_requis: 500       },
  THEATRE:   { id: "THEATRE", nom: "Théâtre Municipal", capacite: 1_500,   prix_billet: 120,  cout: 30_000,  emoji: "🎭", fans_requis: 5_000     },
  ZENITH:    { id: "ZENITH",  nom: "Zénith",            capacite: 8_000,   prix_billet: 250,  cout: 150_000, emoji: "🏟️", fans_requis: 50_000   },
  STADE:     { id: "STADE",   nom: "Stade National",    capacite: 60_000,  prix_billet: 400,  cout: 1_000_000,emoji:"🏟️",fans_requis: 500_000  },
  WORLD_TOUR:{ id: "WORLD_TOUR",nom:"World Tour Arena", capacite: 100_000, prix_billet: 800,  cout: 5_000_000,emoji:"🌍",fans_requis: 5_000_000 },
};

const STAFF = {
  MANAGER:   { id: "MANAGER",  nom: "Manager",         cout: 50_000,  effet: "+10% revenus concerts",  emoji: "💼", bonus_revenus: 0.10 },
  PROD:      { id: "PROD",     nom: "Beatmaker / Prod", cout: 30_000, effet: "+15% qualité studio",    emoji: "🎛️", bonus_studio: 0.15  },
  COMM:      { id: "COMM",     nom: "Attaché de presse",cout: 20_000, effet: "+20% fans par promo",    emoji: "📢", bonus_fans: 0.20    },
  CHORISTE:  { id: "CHORISTE", nom: "Choristes (x3)",  cout: 80_000,  effet: "+20% revenus concerts",  emoji: "🎼", bonus_revenus: 0.20 },
  TOURNEUR:  { id: "TOURNEUR", nom: "Tourneur",        cout: 200_000, effet: "Accès world tour",       emoji: "✈️", unlock_world: true  },
  AGENT:     { id: "AGENT",    nom: "Agent International",cout:500_000,effet:"+50% deals internationaux",emoji:"🌍",bonus_global: 0.50 },
};

const DEALS = {
  SPOTIFY:   { id: "SPOTIFY",  nom: "Deal Spotify",    cout: 10_000,   revenuMensuel: 5_000,  emoji: "💚", fans_requis: 1_000   },
  YOUTUBE:   { id: "YOUTUBE",  nom: "Chaîne YouTube",  cout: 5_000,    revenuMensuel: 8_000,  emoji: "📺", fans_requis: 500     },
  LABEL_IND: { id: "LABEL_IND",nom: "Label Indé",      cout: 0,        revenuMensuel: 15_000, emoji: "🎵", fans_requis: 5_000   },
  MAJOR:     { id: "MAJOR",    nom: "Contrat Major",   cout: 0,        revenuMensuel: 100_000,emoji: "🏢", fans_requis: 100_000 },
  BRAND:     { id: "BRAND",    nom: "Sponsoring Marque",cout:100_000,  revenuMensuel: 50_000, emoji: "👟", fans_requis: 50_000  },
  NETFLIX:   { id: "NETFLIX",  nom: "Serie Netflix",   cout: 500_000,  revenuMensuel: 300_000,emoji: "🎬", fans_requis: 1_000_000},
};

const ARTISTES_COLLAB = [
  { nom: "Lil Shadow",    genre: "RAP",    cout: 20_000,   boost_fans: 3_000,   boost_rev: 50_000   },
  { nom: "Luna Vibe",     genre: "POP",    cout: 50_000,   boost_fans: 8_000,   boost_rev: 100_000  },
  { nom: "DJ Nexus",      genre: "ELECTRO",cout: 80_000,   boost_fans: 12_000,  boost_rev: 200_000  },
  { nom: "Afro King",     genre: "AFRO",   cout: 150_000,  boost_fans: 20_000,  boost_rev: 400_000  },
  { nom: "R. Blaze",      genre: "RNB",    cout: 300_000,  boost_fans: 40_000,  boost_rev: 800_000  },
  { nom: "LEGENDARY X",  genre: "RAP",    cout: 2_000_000,boost_fans: 500_000, boost_rev: 10_000_000},
];

function $(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function F(n) { return Math.floor(n).toLocaleString("fr-FR"); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function bar(val, max, len = 20) {
  const filled = Math.round((Math.min(val, max) / max) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}
function timeLeft(ts, cd) {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getNiveau(music) {
  let nv = NIVEAUX[0];
  for (const n of NIVEAUX) {
    if (music.totalRevenu >= n.min) nv = n;
    else break;
  }
  return nv;
}

function initMusic() {
  return {
    argent:         0,
    totalRevenu:    0,
    totalDepense:   0,
    fans:           0,
    notoriete:      0,
    credibilite:    0,
    niveau:         "INCONNU",
    genre:          null,
    studioActuel:   "CHAMBRE",
    discographie:   [],
    staff:          [],
    deals:          [],
    concertsJoues:  0,
    collaborations: 0,
    interviewsDone: 0,
    sonsSortis:     0,
    streamsTotal:   0,
    lastStudio:     null,
    lastConcert:    null,
    lastPromo:      null,
    lastCollab:     null,
    lastTournee:    null,
    lastDaily:      null,
    lastInterview:  null,
    lastBattle:     null,
    tourneeEnCours: null,
    hypeBoost:      0,
    hypeExpiry:     null,
    streak:         0,
    achievements:   [],
    transactions:   [],
    premium:        false,
    battles:        { wins: 0, losses: 0 },
  };
}

function addTx(music, type, montant, desc) {
  music.transactions.push({ type, montant, description: desc, date: Date.now() });
  if (music.transactions.length > 40) music.transactions = music.transactions.slice(-40);
}

function getHype(music) {
  if (music.hypeExpiry && Date.now() < music.hypeExpiry) return music.hypeBoost;
  return 0;
}

function getStaffBonus(music, key) {
  let bonus = 0;
  for (const sId of music.staff) {
    const s = STAFF[sId];
    if (s && s[key]) bonus += s[key];
  }
  return bonus;
}

function checkAchievements(music) {
  const defs = [
    { id: "PREMIER_SON",      check: m => m.sonsSortis >= 1 },
    { id: "DIX_SONS",         check: m => m.sonsSortis >= 10 },
    { id: "PREMIER_CONCERT",  check: m => m.concertsJoues >= 1 },
    { id: "CENT_CONCERTS",    check: m => m.concertsJoues >= 100 },
    { id: "MILLION_STREAMS",  check: m => m.streamsTotal >= 1_000_000 },
    { id: "MILLIARD_STREAMS", check: m => m.streamsTotal >= 1_000_000_000 },
    { id: "PREMIERE_COLLAB",  check: m => m.collaborations >= 1 },
    { id: "CINQ_COLLABS",     check: m => m.collaborations >= 5 },
    { id: "MILLIONNAIRE",     check: m => m.totalRevenu >= 1_000_000 },
    { id: "DIX_MILLIONS",     check: m => m.totalRevenu >= 10_000_000 },
    { id: "CENT_MILLIONS",    check: m => m.totalRevenu >= 100_000_000 },
    { id: "DIX_MILLE_FANS",   check: m => m.fans >= 10_000 },
    { id: "MILLION_FANS",     check: m => m.fans >= 1_000_000 },
    { id: "SUPERSTAR",        check: m => m.niveau === "SUPERSTAR" },
    { id: "FULL_STAFF",       check: m => m.staff.length >= 6 },
    { id: "DEAL_MAJOR",       check: m => m.deals.includes("MAJOR") },
    { id: "STREAKER_7",       check: m => m.streak >= 7 },
    { id: "CREDIBLE",         check: m => m.credibilite >= 80 },
  ];
  const nouveaux = [];
  for (const d of defs) {
    if (!music.achievements.includes(d.id) && d.check(music)) {
      music.achievements.push(d.id);
      nouveaux.push(d.id);
    }
  }
  return nouveaux;
}

function renderDashboard(music) {
  const nv = getNiveau(music);
  const genre = music.genre ? GENRES[music.genre] : null;
  const studio = STUDIOS[music.studioActuel];
  const hype = getHype(music);
  const dealsRevenu = music.deals.reduce((sum, dId) => sum + (DEALS[dId]?.revenuMensuel || 0), 0);

  const notorieteBar = bar(music.notoriete, 1000, 18);
  const credBar = bar(music.credibilite, 100, 18);

  return `
${fonts.bold("🎵 MUSIC STAR — TABLEAU DE BORD")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("🎤 CARRIÈRE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${nv.emoji} ${fonts.bold(nv.nom.toUpperCase())}
${genre ? `${genre.emoji} ${fonts.italic(genre.nom)}` : "🎵 Genre non choisi"}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💵 Argent: ${fonts.bold($(music.argent))}
📈 Total gagné: ${fonts.bold($(music.totalRevenu))}
📊 Revenus mensuels: ${fonts.bold($(dealsRevenu))} (deals)

${fonts.bold("🌟 POPULARITÉ")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
👥 Fans: ${fonts.bold(F(music.fans))}
📡 Notoriété: [${notorieteBar}] ${music.notoriete}/1000
🔥 Crédibilité: [${credBar}] ${music.credibilite}/100
🎧 Streams totaux: ${fonts.bold(F(music.streamsTotal))}

${fonts.bold("🎙️ STATISTIQUES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎵 Sons sortis: ${fonts.bold(music.sonsSortis)}
🎤 Concerts: ${fonts.bold(music.concertsJoues)}
🤝 Collabs: ${fonts.bold(music.collaborations)}
🏆 Succès: ${fonts.bold(music.achievements.length + "/18")}
🎙️ Studio: ${fonts.bold(studio.emoji + " " + studio.nom)}
👔 Staff: ${fonts.bold(music.staff.length + "/6")}
📝 Deals actifs: ${fonts.bold(music.deals.length)}
🔥 Série daily: ${fonts.bold(music.streak + " jours")}
${hype > 0 ? `⚡ Hype boost: ${fonts.bold("+" + Math.round(hype * 100) + "% ✅")}` : ""}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎙️ Studio: ${timeLeft(music.lastStudio, COOLDOWNS.STUDIO) || "✅ Prêt"}
🎤 Concert: ${timeLeft(music.lastConcert, COOLDOWNS.CONCERT) || "✅ Prêt"}
📢 Promo: ${timeLeft(music.lastPromo, COOLDOWNS.PROMO) || "✅ Prêt"}
🤝 Collab: ${timeLeft(music.lastCollab, COOLDOWNS.COLLAB) || "✅ Prêt"}
✈️ Tournée: ${timeLeft(music.lastTournee, COOLDOWNS.TOURNEE) || "✅ Prête"}
🎁 Daily: ${timeLeft(music.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
📺 Interview: ${timeLeft(music.lastInterview, COOLDOWNS.INTERVIEW) || "✅ Prêt"}
⚔️ Battle: ${timeLeft(music.lastBattle, COOLDOWNS.BATTLE) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
  return `
${fonts.bold("🎵 MUSIC STAR — GUIDE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("🎤 CARRIÈRE DE BASE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 music stat — Tableau de bord
🎵 music genre <ID> — Choisir son genre
🎁 music daily — Bonus quotidien
📺 music interview — Donner une interview

${fonts.bold("🎙️ STUDIO")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 music studio list — Voir les studios
⬆️ music studio upgrade <ID> — Améliorer son studio
🎵 music sortir <TYPE> [titre] — Sortir un son
📀 music discographie — Voir sa discographie

${fonts.bold("🎤 CONCERTS & TOURNÉE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 music concert list — Voir les salles
🎤 music concert jouer <ID> — Jouer un concert
✈️ music tournee start — Lancer une tournée
✅ music tournee check — Résultat tournée

${fonts.bold("🤝 COLLABS & RÉSEAU")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 music collab list — Artistes dispo
🤝 music collab <N> — Collaborer
⚔️ music battle @artiste <mise> — Battle de rap

${fonts.bold("👔 ÉQUIPE & BUSINESS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 music staff list — Voir le staff dispo
🤝 music staff recruter <ID> — Recruter
📋 music deals list — Voir les deals
📝 music deals signer <ID> — Signer un deal
💰 music deals collecter — Collecter revenus

${fonts.bold("📢 PROMOTION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📢 music promo — Se faire connaître

${fonts.bold("📊 STATS & SOCIAL")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 music classement — Top artistes
🏅 music achievements — Succès débloqués
📋 music history — Transactions
💎 music premium — Avantages premium
`.trim();
}

async function cmdGenre(message, args, music, save) {
  const gId = (args[1] || "").toUpperCase();
  if (!gId || !GENRES[gId]) {
    let txt = `${fonts.bold("🎵 CHOISIS TON GENRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, g] of Object.entries(GENRES)) {
      txt += `  ${g.emoji}  ${fonts.bold(id.padEnd(10))} ${g.nom}\n`;
      txt += `       Popularité : ${"⭐".repeat(Math.ceil(g.popularite / 20))} (${g.popularite}%)\n\n`;
    }
    txt += `💡 Usage : music genre <ID>  —  Ex : music genre RAP`;
    return message.reply(txt);
  }
  if (music.genre && music.genre !== gId) {
    music.credibilite = Math.max(0, music.credibilite - 20);
  }
  music.genre = gId;
  await save();
  const g = GENRES[gId];
  return message.reply(`
${g.emoji}  ${fonts.bold("GENRE CHOISI : " + g.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Popularité : ${g.popularite}%
Multiplicateur : ×${g.multiplicateur}
${music.credibilite < 100 ? `⚠️ Changement de genre : -20 crédibilité` : ""}

✅ Prêt à enregistrer ! Tape 'music sortir SINGLE'
`.trim());
}

async function cmdStudio(message, args, music, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("🎙️ STUDIOS DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, s] of Object.entries(STUDIOS)) {
      const actuel = music.studioActuel === id;
      txt += `  ${s.emoji}  ${fonts.bold(s.nom)} [${id}]\n`;
      txt += `       Qualité : ${"🔊".repeat(s.qualite)}\n`;
      txt += `       Coût    : ${s.cout > 0 ? $(s.cout) : "Gratuit"}\n`;
      txt += `       ${actuel ? fonts.bold("✅ VOTRE STUDIO ACTUEL") : "🔒 Non acquis"}\n\n`;
    }
    txt += `💡 Usage : music studio upgrade <ID>`;
    return message.reply(txt);
  }

  if (sub === "upgrade") {
    const sId = (args[2] || "").toUpperCase();
    const s = STUDIOS[sId];
    if (!s) return message.reply(fonts.bold("❌ Studio inconnu. Tape 'music studio list'."));
    const actuel = STUDIOS[music.studioActuel];
    if (s.qualite <= actuel.qualite) return message.reply(fonts.bold("❌ Ce studio est de qualité inférieure ou égale au tien."));
    if ((user.money || 0) < s.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${$(s.cout)}`));
    user.money -= s.cout;
    music.studioActuel = sId;
    addTx(music, "studio_upgrade", -s.cout, `Upgrade studio → ${s.nom}`);
    await save();
    return message.reply(`
${s.emoji}  ${fonts.bold("STUDIO AMÉLIORÉ !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nouveau studio : ${fonts.bold(s.nom)}
Qualité : ${"🔊".repeat(s.qualite)}
Coût payé : ${$(s.cout)}

💡 Tes prochains sons seront de meilleure qualité !
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : music studio [list|upgrade]"));
}

async function cmdSortir(message, args, music, user, save) {
  const cd = timeLeft(music.lastStudio, COOLDOWNS.STUDIO);
  if (cd) return message.reply(fonts.bold(`⏰ Studio dispo dans ${cd}.`));
  if (!music.genre) return message.reply(fonts.bold("❌ Choisis d'abord ton genre : music genre <ID>"));

  const typeId = (args[1] || "SINGLE").toUpperCase();
  const type = TYPES_SON[typeId];
  if (!type) return message.reply(fonts.bold(`❌ Type inconnu. Choix : ${Object.keys(TYPES_SON).join(", ")}`));

  const titre = args.slice(2).join(" ") || `${type.nom} #${music.sonsSortis + 1}`;
  const genre = GENRES[music.genre];
  const studio = STUDIOS[music.studioActuel];
  const staffProd = getStaffBonus(music, "bonus_studio");
  const hype = getHype(music);

  const qualite = Math.min(10, Math.round(
    studio.qualite * 2 + (music.credibilite / 20) + rand(0, 3) + (staffProd * 5)
  ));

  const baseStreams = rand(type.fansBase * 10, type.fansBase * 50);
  const streams = Math.floor(baseStreams * genre.multiplicateur * (1 + hype) * (music.premium ? 1.5 : 1));
  const revenu = Math.floor(type.revenuBase * genre.multiplicateur * (qualite / 5) * (1 + hype));

  user.money = (user.money || 0) + revenu;
  music.fans += type.fansBase + Math.floor(streams / 100);
  music.streamsTotal += streams;
  music.notoriete = Math.min(1000, music.notoriete + Math.floor(streams / 5000));
  music.credibilite = Math.min(100, music.credibilite + Math.floor(qualite / 2));
  music.totalRevenu += revenu;
  music.sonsSortis++;
  music.lastStudio = Date.now();
  music.niveau = getNiveau(music).id;

  music.discographie.push({
    type: typeId, titre, qualite, genre: music.genre,
    date: new Date().toLocaleDateString("fr-FR"),
    streams, revenu,
  });
  if (music.discographie.length > 20) music.discographie = music.discographie.slice(-20);

  addTx(music, "sortir_son", revenu, `${type.emoji} ${titre} — ${F(streams)} streams`);
  const ach = checkAchievements(music);
  await save();

  const etoiles = "⭐".repeat(Math.ceil(qualite / 2));
  return message.reply(`
${type.emoji}  ${fonts.bold("SON SORTI : " + titre.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📀 Type : ${fonts.bold(type.nom)}
🎵 Genre : ${genre.emoji} ${genre.nom}
🔊 Qualité : ${etoiles} (${qualite}/10)

🎧 Streams : ${fonts.bold(F(streams))}
👥 Nouveaux fans : ${fonts.bold("+" + F(type.fansBase + Math.floor(streams / 100)))}
💰 Revenu : ${fonts.bold($(revenu))}
📡 Notoriété : +${Math.floor(streams / 5000)}
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
}

async function cmdDiscographie(message, music) {
  if (music.discographie.length === 0) return message.reply(fonts.bold("🎵 Ta discographie est vide. Commence par 'music sortir SINGLE'."));
  const disc = [...music.discographie].reverse().slice(0, 10);
  let txt = `${fonts.bold("📀 DISCOGRAPHIE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  disc.forEach((son, i) => {
    const g = GENRES[son.genre] || { emoji: "🎵" };
    txt += `  ${TYPES_SON[son.type]?.emoji || "🎵"}  ${fonts.bold(son.titre)}\n`;
    txt += `       ${g.emoji} ${son.type} — ${son.date}\n`;
    txt += `       🎧 ${F(son.streams)} streams  |  💰 ${$(son.revenu)}\n`;
    txt += `       ${"⭐".repeat(Math.ceil(son.qualite / 2))} (${son.qualite}/10)\n\n`;
  });
  txt += `📊 Total : ${music.sonsSortis} sons • ${F(music.streamsTotal)} streams`;
  return message.reply(txt);
}

async function cmdConcert(message, args, music, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("🎤 SALLES DE CONCERT")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, s] of Object.entries(SALLES)) {
      const accessible = music.fans >= s.fans_requis;
      txt += `  ${s.emoji}  ${fonts.bold(s.nom)} [${id}]\n`;
      txt += `       Capacité : ${F(s.capacite)} personnes\n`;
      txt += `       Billet   : ${$(s.prix_billet)}\n`;
      txt += `       Location : ${s.cout > 0 ? $(s.cout) : "Gratuit"}\n`;
      txt += `       Requis   : ${F(s.fans_requis)} fans\n`;
      txt += `       ${accessible ? "✅ Accessible" : "🔒 Pas assez de fans"}\n\n`;
    }
    txt += `💡 Usage : music concert jouer <ID>`;
    return message.reply(txt);
  }

  if (sub === "jouer") {
    const cd = timeLeft(music.lastConcert, COOLDOWNS.CONCERT);
    if (cd) return message.reply(fonts.bold(`⏰ Prochain concert dans ${cd}.`));

    const sId = (args[2] || "").toUpperCase();
    const salle = SALLES[sId];
    if (!salle) return message.reply(fonts.bold("❌ Salle inconnue. Tape 'music concert list'."));
    if (music.fans < salle.fans_requis) return message.reply(fonts.bold(`❌ Il te faut ${F(salle.fans_requis)} fans. Tu en as ${F(music.fans)}.`));
    if ((user.money || 0) < salle.cout) return message.reply(fonts.bold(`❌ Location salle : ${$(salle.cout)}`));

    user.money = (user.money || 0) - salle.cout;

    const tauxBase = Math.min(1, music.fans / (salle.fans_requis * 10 + 1));
    const hype = getHype(music);
    const taux = Math.min(1, tauxBase + hype + (music.premium ? 0.1 : 0) + rand(0, 20) / 100);
    const spectateurs = Math.floor(salle.capacite * taux);
    const staffBonus = getStaffBonus(music, "bonus_revenus");

    const revenu = Math.floor(spectateurs * salle.prix_billet * (1 + staffBonus)) - salle.cout;
    const fansGagnes = Math.floor(spectateurs * 0.05);

    user.money += Math.max(0, revenu);
    music.fans += fansGagnes;
    music.notoriete = Math.min(1000, music.notoriete + Math.floor(spectateurs / 1000));
    music.credibilite = Math.min(100, music.credibilite + 2);
    music.totalRevenu += Math.max(0, revenu);
    music.concertsJoues++;
    music.lastConcert = Date.now();

    addTx(music, "concert", revenu, `Concert : ${salle.nom} — ${F(spectateurs)} spectateurs`);
    const ach = checkAchievements(music);
    await save();

    const remplissage = bar(spectateurs, salle.capacite, 20);
    return message.reply(`
${salle.emoji}  ${fonts.bold("CONCERT : " + salle.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Remplissage [${remplissage}]
   ${F(spectateurs)} / ${F(salle.capacite)} (${Math.round(taux * 100)}%)

💰 Recettes brutes : ${$(spectateurs * salle.prix_billet)}
🏛️ Location salle  : -${$(salle.cout)}
💵 Revenu net      : ${fonts.bold($(Math.max(0, revenu)))}
👥 Nouveaux fans   : ${fonts.bold("+" + F(fansGagnes))}
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : music concert [list|jouer]"));
}

async function cmdPromo(message, music, save) {
  const cd = timeLeft(music.lastPromo, COOLDOWNS.PROMO);
  if (cd) return message.reply(fonts.bold(`⏰ Promo disponible dans ${cd}.`));

  const types = [
    { nom: "Post réseaux sociaux",  fans: rand(200, 800),    emoji: "📱" },
    { nom: "Clip sur YouTube",      fans: rand(500, 2_000),  emoji: "🎬" },
    { nom: "Interview radio",       fans: rand(300, 1_200),  emoji: "📻" },
    { nom: "Freestyle viral",       fans: rand(1_000, 5_000),emoji: "🔥" },
    { nom: "Pub Spotify",           fans: rand(400, 1_500),  emoji: "💚" },
    { nom: "Feature blog musique",  fans: rand(250, 900),    emoji: "📝" },
  ];
  const promo = pick(types);
  const staffBonus = getStaffBonus(music, "bonus_fans");
  const fansGagnes = Math.floor(promo.fans * (1 + staffBonus) * (music.premium ? 1.5 : 1));

  music.fans += fansGagnes;
  music.notoriete = Math.min(1000, music.notoriete + Math.floor(fansGagnes / 100));
  music.lastPromo = Date.now();
  addTx(music, "promo", 0, `Promo : ${promo.nom} +${F(fansGagnes)} fans`);
  const ach = checkAchievements(music);
  await save();

  return message.reply(`
${promo.emoji}  ${fonts.bold("PROMO : " + promo.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Fans gagnés  : ${fonts.bold("+" + F(fansGagnes))}
👥 Total fans   : ${fonts.bold(F(music.fans))}
📡 Notoriété    : ${music.notoriete}/1000
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
}

async function cmdCollab(message, args, music, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("🤝 ARTISTES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    ARTISTES_COLLAB.forEach((a, i) => {
      const gd = GENRES[a.genre] || { emoji: "🎵" };
      txt += `  [${i + 1}]  ${fonts.bold(a.nom)}\n`;
      txt += `       ${gd.emoji} ${a.genre}\n`;
      txt += `       Coût         : ${$(a.cout)}\n`;
      txt += `       Boost fans   : +${F(a.boost_fans)}\n`;
      txt += `       Boost revenu : ${$(a.boost_rev)}\n\n`;
    });
    txt += `💡 Usage : music collab <numéro>  —  Ex : music collab 2`;
    return message.reply(txt);
  }

  const cd = timeLeft(music.lastCollab, COOLDOWNS.COLLAB);
  if (cd) return message.reply(fonts.bold(`⏰ Prochaine collab dans ${cd}.`));

  const num = parseInt(sub) - 1;
  if (isNaN(num) || num < 0 || num >= ARTISTES_COLLAB.length) return message.reply(fonts.bold(`❌ Numéro invalide (1-${ARTISTES_COLLAB.length}).`));
  const artiste = ARTISTES_COLLAB[num];
  if ((user.money || 0) < artiste.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${$(artiste.cout)}`));

  user.money -= artiste.cout;
  user.money += artiste.boost_rev;
  music.fans += artiste.boost_fans;
  music.totalRevenu += artiste.boost_rev;
  music.notoriete = Math.min(1000, music.notoriete + Math.floor(artiste.boost_fans / 500));
  music.credibilite = Math.min(100, music.credibilite + 5);
  music.collaborations++;
  music.lastCollab = Date.now();

  addTx(music, "collab", artiste.boost_rev - artiste.cout, `Collab avec ${artiste.nom}`);
  const ach = checkAchievements(music);
  await save();

  return message.reply(`
🤝  ${fonts.bold("COLLABORATION : " + artiste.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💸 Coût feat      : ${$(artiste.cout)}
💰 Revenu généré  : ${$(artiste.boost_rev)}
💵 Profit net     : ${$(artiste.boost_rev - artiste.cout)}
👥 Fans gagnés    : +${F(artiste.boost_fans)}
🔥 Crédibilité    : +5
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
}

async function cmdStaff(message, args, music, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("👔 STAFF DISPONIBLE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, s] of Object.entries(STAFF)) {
      const recrute = music.staff.includes(id);
      txt += `  ${s.emoji}  ${fonts.bold(s.nom)} [${id}]\n`;
      txt += `       Coût   : ${$(s.cout)}\n`;
      txt += `       Effet  : ${fonts.italic(s.effet)}\n`;
      txt += `       ${recrute ? fonts.bold("✅ RECRUTÉ") : "🔒 Non recruté"}\n\n`;
    }
    txt += `💡 Usage : music staff recruter <ID>`;
    return message.reply(txt);
  }

  if (sub === "recruter") {
    const sId = (args[2] || "").toUpperCase();
    const s = STAFF[sId];
    if (!s) return message.reply(fonts.bold("❌ Staff inconnu. Tape 'music staff list'."));
    if (music.staff.includes(sId)) return message.reply(fonts.bold("❌ Déjà recruté."));
    if ((user.money || 0) < s.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${$(s.cout)}`));
    user.money -= s.cout;
    music.staff.push(sId);
    addTx(music, "staff", -s.cout, `Recrutement : ${s.nom}`);
    const ach = checkAchievements(music);
    await save();
    return message.reply(`
${s.emoji}  ${fonts.bold("RECRUTÉ : " + s.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Coût payé  : ${$(s.cout)}
Effet actif : ${fonts.italic(s.effet)}
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : music staff [list|recruter]"));
}

async function cmdDeals(message, args, music, user, save) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `${fonts.bold("📝 DEALS DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, d] of Object.entries(DEALS)) {
      const signe = music.deals.includes(id);
      const accessible = music.fans >= d.fans_requis;
      txt += `  ${d.emoji}  ${fonts.bold(d.nom)} [${id}]\n`;
      txt += `       Revenu/mois  : ${$(d.revenuMensuel)}\n`;
      txt += `       Coût sign.   : ${d.cout > 0 ? $(d.cout) : "Gratuit"}\n`;
      txt += `       Fans requis  : ${F(d.fans_requis)}\n`;
      txt += `       ${signe ? fonts.bold("✅ SIGNÉ") : accessible ? "🔓 Disponible" : "🔒 Pas assez de fans"}\n\n`;
    }
    txt += `💡 Usage : music deals signer <ID>  |  music deals collecter`;
    return message.reply(txt);
  }

  if (sub === "signer") {
    const dId = (args[2] || "").toUpperCase();
    const d = DEALS[dId];
    if (!d) return message.reply(fonts.bold("❌ Deal inconnu."));
    if (music.deals.includes(dId)) return message.reply(fonts.bold("❌ Deal déjà signé."));
    if (music.fans < d.fans_requis) return message.reply(fonts.bold(`❌ ${F(d.fans_requis)} fans requis. Tu en as ${F(music.fans)}.`));
    if ((user.money || 0) < d.cout) return message.reply(fonts.bold(`❌ Fonds insuffisants : ${$(d.cout)}`));
    user.money -= d.cout;
    music.deals.push(dId);
    addTx(music, "deal_signe", -d.cout, `Deal signé : ${d.nom}`);
    const ach = checkAchievements(music);
    await save();
    return message.reply(`
${d.emoji}  ${fonts.bold("DEAL SIGNÉ : " + d.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revenu mensuel : ${fonts.bold($(d.revenuMensuel))}
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
  }

  if (sub === "collecter") {
    if (music.deals.length === 0) return message.reply(fonts.bold("❌ Aucun deal actif. Signe des deals avec 'music deals signer'."));
    let total = 0;
    let detail = "";
    for (const dId of music.deals) {
      const d = DEALS[dId];
      if (d) { total += d.revenuMensuel; detail += `  ${d.emoji} ${d.nom} : +${$(d.revenuMensuel)}\n`; }
    }
    user.money = (user.money || 0) + total;
    music.totalRevenu += total;
    addTx(music, "deals_rev", total, `Revenus deals (${music.deals.length} contrats)`);
    await save();
    return message.reply(`
💰  ${fonts.bold("REVENUS DEALS COLLECTÉS")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${detail.trimEnd()}

${fonts.bold("Total : " + $(total))}
💵 Solde : ${$(user.money)}
`.trim());
  }

  return message.reply(fonts.bold("❓ Usage : music deals [list|signer|collecter]"));
}

async function cmdTournee(message, args, music, user, save) {
  const sub = (args[1] || "start").toLowerCase();

  if (sub === "check") {
    if (!music.tourneeEnCours) return message.reply(fonts.bold("❌ Aucune tournée en cours."));
    const restant = music.tourneeEnCours.finAt - Date.now();
    if (restant > 0) {
      const rm = Math.ceil(restant / 60000);
      return message.reply(fonts.bold(`✈️ Tournée en cours. Fin dans ${rm} min.`));
    }
    const t = music.tourneeEnCours;
    const revenu = Math.floor(t.revenuEstime * (0.8 + Math.random() * 0.4));
    const fansGagnes = Math.floor(t.fansEstimes * (0.8 + Math.random() * 0.4));
    user.money = (user.money || 0) + revenu;
    music.fans += fansGagnes;
    music.totalRevenu += revenu;
    music.notoriete = Math.min(1000, music.notoriete + 50);
    music.concertsJoues += t.concerts;
    music.tourneeEnCours = null;
    music.lastTournee = Date.now();
    addTx(music, "tournee", revenu, `Tournée — ${t.concerts} concerts`);
    const ach = checkAchievements(music);
    await save();
    return message.reply(`
✈️  ${fonts.bold("TOURNÉE TERMINÉE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Concerts joués  : ${t.concerts}
💰 Revenu total    : ${fonts.bold($(revenu))}
👥 Nouveaux fans   : +${F(fansGagnes)}
📡 Notoriété       : +50
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
  }

  const cd = timeLeft(music.lastTournee, COOLDOWNS.TOURNEE);
  if (cd) return message.reply(fonts.bold(`⏰ Prochaine tournée dans ${cd}.`));
  if (music.tourneeEnCours) return message.reply(fonts.bold("⚠️ Tournée déjà en cours. Tape 'music tournee check'."));

  const nv = getNiveau(music);
  const nbConcerts = 5 + NIVEAUX.indexOf(nv) * 3;
  const revenuEstime = music.fans * 2 * nbConcerts;
  const fansEstimes = Math.floor(music.fans * 0.1 * nbConcerts);
  const cout = Math.floor(revenuEstime * 0.2);

  if ((user.money || 0) < cout) return message.reply(fonts.bold(`❌ Budget tournée requis : ${$(cout)}`));

  user.money -= cout;
  music.tourneeEnCours = {
    concerts: nbConcerts,
    revenuEstime,
    fansEstimes,
    finAt: Date.now() + COOLDOWNS.TOURNEE,
  };
  addTx(music, "tournee_cout", -cout, `Départ tournée — ${nbConcerts} concerts`);
  await save();
  return message.reply(`
✈️  ${fonts.bold("TOURNÉE LANCÉE !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Concerts prévus  : ${nbConcerts}
💰 Budget départ    : ${$(cout)}
📈 Revenu estimé    : ${$(revenuEstime)}
👥 Fans estimés     : +${F(fansEstimes)}

💡 Tape 'music tournee check' dans 12h pour le résultat.
`.trim());
}

async function cmdInterview(message, music, user, save) {
  const cd = timeLeft(music.lastInterview, COOLDOWNS.INTERVIEW);
  if (cd) return message.reply(fonts.bold(`⏰ Prochaine interview dans ${cd}.`));

  const medias = [
    { nom: "Podcast Indé",      fans: rand(500, 2_000),   cred: 3,  revenu: 5_000,  emoji: "🎙️" },
    { nom: "Émission TV",       fans: rand(5_000, 20_000),cred: 5,  revenu: 20_000, emoji: "📺" },
    { nom: "Magazine Couleur",  fans: rand(1_000, 5_000), cred: 4,  revenu: 10_000, emoji: "📰" },
    { nom: "Documentary Netflix",fans:rand(20_000,80_000),cred: 10, revenu: 80_000, emoji: "🎬" },
    { nom: "Livestream Twitch", fans: rand(2_000, 10_000),cred: 2,  revenu: 3_000,  emoji: "🟣" },
    { nom: "Interview BFM",     fans: rand(3_000, 12_000),cred: 6,  revenu: 15_000, emoji: "📻" },
  ];
  const media = pick(medias);

  user.money = (user.money || 0) + media.revenu;
  music.fans += media.fans;
  music.credibilite = Math.min(100, music.credibilite + media.cred);
  music.notoriete = Math.min(1000, music.notoriete + Math.floor(media.fans / 200));
  music.totalRevenu += media.revenu;
  music.interviewsDone++;
  music.lastInterview = Date.now();
  addTx(music, "interview", media.revenu, `Interview : ${media.nom}`);
  await save();

  return message.reply(`
${media.emoji}  ${fonts.bold("INTERVIEW : " + media.nom.toUpperCase())}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Fans gagnés    : +${F(media.fans)}
🔥 Crédibilité    : +${media.cred}
💰 Cachet         : ${$(media.revenu)}
📡 Notoriété      : ${music.notoriete}/1000
`.trim());
}

async function cmdBattle(message, args, music, user, usersData, senderID, event, save) {
  const cd = timeLeft(music.lastBattle, COOLDOWNS.BATTLE);
  if (cd) return message.reply(fonts.bold(`⏰ Prochain battle dans ${cd}.`));

  const targetID = Object.keys(event.mentions || {})[0];
  if (!targetID) return message.reply(fonts.bold("❌ Mentionne un artiste à défier.\nUsage : music battle @artiste <mise>"));
  if (targetID === senderID) return message.reply(fonts.bold("❌ Tu ne peux pas te battre toi-même."));

  // La mention peut occuper plusieurs "mots" dans args (ex: "Jean Dupont"),
  // donc on ne peut pas se fier à une position fixe comme args[2].
  // On prend le DERNIER argument qui est un nombre valide.
  let mise = null;
  for (let i = args.length - 1; i >= 1; i--) {
    const cleaned = args[i].replace(/[^\d]/g, "");
    const val = parseInt(cleaned);
    if (!isNaN(val) && val > 0) { mise = val; break; }
  }

  if (!mise || mise <= 0) return message.reply(fonts.bold("❌ Indique une mise.\nUsage : music battle @artiste <mise>"));
  if ((user.money || 0) < mise) return message.reply(fonts.bold(`❌ Fonds insuffisants (${$(user.money || 0)}).`));

  let targetUser = await usersData.get(targetID);
  if (!targetUser?.data?.music) return message.reply(fonts.bold("❌ Cet artiste n'a pas de carrière musicale."));
  const targetMusic = targetUser.data.music;
  if ((targetUser.money || 0) < mise) return message.reply(fonts.bold(`❌ L'adversaire n'a pas assez (${$(targetUser.money || 0)}).`));

  const myScore = music.credibilite + rand(0, 50) + (music.fans / 10000);
  const theirScore = targetMusic.credibilite + rand(0, 50) + (targetMusic.fans / 10000);
  music.lastBattle = Date.now();

  if (myScore > theirScore) {
    user.money = (user.money || 0) + mise;
    targetUser.money = Math.max(0, (targetUser.money || 0) - mise);
    music.credibilite = Math.min(100, music.credibilite + 5);
    music.fans += Math.floor(mise / 100);
    music.battles.wins++;
    addTx(music, "battle_win", mise, `Battle gagné contre ${targetID}`);
    targetUser.data.music = targetMusic;
    await usersData.set(targetID, targetUser);
    await save();
    return message.reply(`
⚔️  ${fonts.bold("BATTLE GAGNÉ !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Score : ${Math.round(myScore)} vs ${Math.round(theirScore)}
💰 Gain  : ${$(mise)}
🔥 Crédibilité +5
👥 Fans +${Math.floor(mise / 100)}
`.trim());
  } else {
    user.money = Math.max(0, (user.money || 0) - mise);
    targetUser.money = (targetUser.money || 0) + mise;
    music.credibilite = Math.max(0, music.credibilite - 3);
    music.battles.losses++;
    addTx(music, "battle_loss", -mise, `Battle perdu contre ${targetID}`);
    targetUser.data.music = targetMusic;
    await usersData.set(targetID, targetUser);
    await save();
    return message.reply(`
⚔️  ${fonts.bold("BATTLE PERDU...")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Score : ${Math.round(myScore)} vs ${Math.round(theirScore)}
💸 Perte : ${$(mise)}
💔 Crédibilité -3
`.trim());
  }
}

async function cmdDaily(message, music, user, save) {
  const cd = timeLeft(music.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé. Prochain dans ${cd}.`));

  const maintenant = Date.now();
  if (music.lastDaily && maintenant - music.lastDaily < COOLDOWNS.DAILY * 2) music.streak++;
  else music.streak = 1;

  const nv = getNiveau(music);
  const idx = NIVEAUX.findIndex(n => n.id === nv.id);
  const base = 3_000 + idx * 2_000;
  const streakBonus = Math.min(music.streak * 300, 5_000);
  const premiumMult = music.premium ? 2 : 1;
  const total = Math.floor((base + streakBonus) * premiumMult);

  user.money = (user.money || 0) + total;
  music.fans += 50 * (idx + 1);
  music.totalRevenu += total;
  music.lastDaily = maintenant;
  music.hypeBoost = 0.10;
  music.hypeExpiry = Date.now() + 60 * 60 * 1000;
  addTx(music, "daily", total, `Daily (streak ${music.streak}j)`);
  const ach = checkAchievements(music);
  await save();

  return message.reply(`
🎁  ${fonts.bold("BONUS QUOTIDIEN !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Base         : ${$(base)}
🔥 Streak (×${music.streak}) : ${$(streakBonus)}
${music.premium ? "💎 Premium ×2" : ""}
──────────────────────────────
💰 Total        : ${fonts.bold($(total))}
👥 Fans         : +${F(50 * (idx + 1))}
⚡ Hype boost   : +10% pendant 1h
${ach.length > 0 ? `🏅 ${fonts.bold("Succès : " + ach.join(", "))}` : ""}
`.trim());
}

async function cmdAchievements(message, music) {
  const liste = {
    PREMIER_SON:      { emoji: "🎵", nom: "Premier Son",        desc: "Sortir son 1er morceau" },
    DIX_SONS:         { emoji: "🎶", nom: "Discographie",       desc: "10 sons sortis" },
    PREMIER_CONCERT:  { emoji: "🎤", nom: "Première Scène",     desc: "Jouer un concert" },
    CENT_CONCERTS:    { emoji: "🏟️", nom: "Bête de scène",     desc: "100 concerts" },
    MILLION_STREAMS:  { emoji: "🎧", nom: "1M Streams",         desc: "1 million de streams" },
    MILLIARD_STREAMS: { emoji: "💿", nom: "Milliard Streams",   desc: "1 milliard de streams" },
    PREMIERE_COLLAB:  { emoji: "🤝", nom: "Première Collab",    desc: "1ère collaboration" },
    CINQ_COLLABS:     { emoji: "🌐", nom: "Réseau solide",       desc: "5 collaborations" },
    MILLIONNAIRE:     { emoji: "💵", nom: "Millionnaire",        desc: "$1M gagné" },
    DIX_MILLIONS:     { emoji: "🤑", nom: "10 Millions",         desc: "$10M gagné" },
    CENT_MILLIONS:    { emoji: "👑", nom: "100 Millions",        desc: "$100M gagné" },
    DIX_MILLE_FANS:   { emoji: "👥", nom: "10K Fans",           desc: "10 000 fans" },
    MILLION_FANS:     { emoji: "🌟", nom: "1M Fans",            desc: "1 million de fans" },
    SUPERSTAR:        { emoji: "💫", nom: "Superstar",           desc: "Niveau Superstar Mondiale" },
    FULL_STAFF:       { emoji: "👔", nom: "Dream Team",          desc: "Staff complet (6)" },
    DEAL_MAJOR:       { emoji: "🏢", nom: "Contrat Major",       desc: "Signer avec un major" },
    STREAKER_7:       { emoji: "🔥", nom: "Série de 7 jours",   desc: "7 daily consécutifs" },
    CREDIBLE:         { emoji: "💯", nom: "Crédible à 80",       desc: "80 de crédibilité" },
  };
  const total = Object.keys(liste).length;
  let txt = `${fonts.bold("🏅 ACHIEVEMENTS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `Progression : ${music.achievements.length}/${total}\n\n`;

  if (music.achievements.length === 0) {
    txt += `💡 Aucun succès encore. Lance ta carrière !\n\n`;
  } else {
    txt += `${fonts.bold("✅ DÉBLOQUÉS :")}\n`;
    music.achievements.slice(0, 10).forEach((id, i) => {
      const a = liste[id] || { emoji: "🏅", nom: id };
      txt += `${i + 1}. ${a.emoji}  ${a.nom}\n`;
    });
    if (music.achievements.length > 10) txt += `...et ${music.achievements.length - 10} de plus !\n`;
    txt += "\n";
  }

  txt += `${fonts.bold("🎯 PROCHAINS :")}\n`;
  Object.entries(liste).filter(([id]) => !music.achievements.includes(id)).slice(0, 5).forEach(([, a]) => {
    txt += `• ${a.emoji}  ${a.nom} : ${fonts.italic(a.desc)}\n`;
  });
  return message.reply(txt);
}

async function cmdClassement(message, usersData) {
  try {
    const allUsers = await usersData.getAll();
    const artistes = [];
    for (const [uid, u] of Object.entries(allUsers)) {
      const m = u.data?.music;
      if (m && m.fans > 0) {
        artistes.push({
          nom:   u.name || `User ${uid.slice(-4)}`,
          fans:  m.fans,
          streams: m.streamsTotal || 0,
          nv:    getNiveau(m),
          premium: m.premium || false,
        });
      }
    }
    artistes.sort((a, b) => b.fans - a.fans);
    const top = artistes.slice(0, 10);

    let txt = `${fonts.bold("🏆 TOP ARTISTES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (top.length === 0) {
      txt += `💡 Aucun artiste classé encore.`;
    } else {
      top.forEach((a, i) => {
        const med = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `  #${i + 1}`;
        txt += `${med}  ${fonts.bold(a.nom)}${a.premium ? " 💎" : ""}\n`;
        txt += `     ${a.nv.emoji} ${a.nv.nom}\n`;
        txt += `     👥 ${F(a.fans)} fans  |  🎧 ${F(a.streams)} streams\n\n`;
      });
    }
    return message.reply(txt);
  } catch (e) {
    return message.reply(fonts.bold("❌ Erreur classement."));
  }
}

async function cmdHistory(message, music) {
  const txs = music.transactions.slice(-15).reverse();
  if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction."));
  const emojiMap = {
    sortir_son: "🎵", concert: "🎤", promo: "📢", collab: "🤝",
    staff: "👔", deal_signe: "📝", deals_rev: "💰", tournee: "✈️",
    tournee_cout: "💸", interview: "📺", battle_win: "⚔️", battle_loss: "💀",
    daily: "🎁", studio_upgrade: "🎙️",
  };
  let txt = `${fonts.bold("📋 HISTORIQUE (15 dernières)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txs.forEach(tx => {
    const e = emojiMap[tx.type] || "💼";
    const sign = tx.montant >= 0 ? "+" : "";
    const date = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `${e}  ${tx.description}\n   ${sign}${$(tx.montant)} — ${date}\n\n`;
  });
  return message.reply(txt);
}

async function cmdPremium(message, args, music, user, save) {
  if ((args[1] || "").toLowerCase() === "buy") {
    const cout = 1_500_000;
    if ((user.money || 0) < cout) return message.reply(fonts.bold(`❌ Premium coûte ${$(cout)}. Tu as ${$(user.money || 0)}.`));
    user.money -= cout;
    music.premium = true;
    addTx(music, "premium", -cout, "Abonnement Premium Music Star");
    await save();
    return message.reply(`
💎  ${fonts.bold("BIENVENUE EN PREMIUM !")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Streams ×1.5
✅ Daily ×2
✅ Promo +50% fans
✅ Concert +10% remplissage
`.trim());
  }
  return message.reply(`
💎  ${fonts.bold("MUSIC STAR PREMIUM")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statut : ${music.premium ? fonts.bold("✅ Actif") : "❌ Inactif"}
Prix   : ${$(1_500_000)}

Avantages :
• Streams ×1.5
• Daily ×2
• Promo +50% fans
• Concert +10% remplissage

${!music.premium ? `💡 music premium buy pour s'abonner !` : ""}
`.trim());
}

module.exports = {
  config: {
    name:        "music",
    aliases:     ["musicstar", "artist", "artiste"],
    version:     "1.0",
    author:      "Christus",
    countDown:   3,
    role:        0,
    description: {
      fr: "🎵 Music Star — Simule une carrière musicale complète. Studio, concerts, deals, tournées, collabs et progression de fan.",
    },
    category: "economy",
    guide: { fr: "Tape 'music help' pour voir toutes les commandes." },
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0] || "stat").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.music) user.data.music = initMusic();

    const music = user.data.music;

    music.niveau = getNiveau(music).id;

    const save = async () => {
      user.data.music = music;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help": case "aide":
        return message.reply(renderHelp());

      case "stat": case "status": case "profil": case "dashboard":
        return message.reply(renderDashboard(music));

      case "genre":
        return cmdGenre(message, args, music, save);

      case "studio":
        return cmdStudio(message, args, music, user, save);

      case "sortir": case "release": case "drop":
        return cmdSortir(message, args, music, user, save);

      case "discographie": case "disco":
        return cmdDiscographie(message, music);

      case "concert":
        return cmdConcert(message, args, music, user, save);

      case "promo":
        return cmdPromo(message, music, save);

      case "collab":
        return cmdCollab(message, args, music, user, save);

      case "staff":
        return cmdStaff(message, args, music, user, save);

      case "deals": case "deal":
        return cmdDeals(message, args, music, user, save);

      case "tournee": case "tour":
        return cmdTournee(message, args, music, user, save);

      case "interview":
        return cmdInterview(message, music, user, save);

      case "battle":
        return cmdBattle(message, args, music, user, usersData, senderID, event, save);

      case "daily":
        return cmdDaily(message, music, user, save);

      case "achievements": case "succes":
        return cmdAchievements(message, music);

      case "classement": case "top": case "leaderboard":
        return cmdClassement(message, usersData);

      case "history": case "historique":
        return cmdHistory(message, music);

      case "premium":
        return cmdPremium(message, args, music, user, save);

      default:
        return message.reply(fonts.bold(`❓ Commande inconnue. Tape 'music help'.`));
    }
  },
};