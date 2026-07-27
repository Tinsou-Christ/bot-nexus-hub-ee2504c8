"use strict";

let createCanvas, loadImage, registerFont;
let canvasOk = false;
try {
  const cv = require("canvas");
  createCanvas = cv.createCanvas; loadImage = cv.loadImage; registerFont = cv.registerFont;
  canvasOk = true;
} catch(e) { console.log("[Guild] Canvas:", e.message); }

const fs   = require("fs");
const path = require("path");
const os   = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold:t=>t, outline:t=>t, fancy:t=>t, monospace:t=>t, sansSerif:t=>t, fraktur:t=>t, italic:t=>t, bubble:t=>t }; }

if (canvasOk && registerFont) {
  const fd = path.join(__dirname, "assets", "font");
  [
    ["NotoSans-Bold.ttf",    "GF", "bold"],
    ["NotoSans-Regular.ttf", "GF", "normal"],
    ["NotoSans-SemiBold.ttf","GF", "600"],
  ].forEach(([f, fam, w]) => {
    try { const fp = path.join(fd, f); if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w }); } catch(_){}
  });
}

const GF = {
  bold:    s => `bold ${s}px GF, Arial`,
  semi:    s => `600 ${s}px GF, Arial`,
  regular: s => `${s}px GF, Arial`,
};

const COOLDOWNS = {
  CONTRIBUER: 6  * 60 * 60 * 1000,
  RAID:       12 * 60 * 60 * 1000,
  DAILY:      24 * 60 * 60 * 1000,
  MISSION:    4  * 60 * 60 * 1000,
};

const RANGS_GUILDE = [
  { id: "RECRUE",    nom: "Recrue",     min: 0,          xpBonus: 0,    color: "#808080" },
  { id: "MEMBRE",   nom: "Membre",     min: 1_000,      xpBonus: 0.05, color: "#4CAF50" },
  { id: "VETERAN",  nom: "Veteran",    min: 10_000,     xpBonus: 0.10, color: "#2196F3" },
  { id: "ELITE",    nom: "Elite",      min: 50_000,     xpBonus: 0.15, color: "#9C27B0" },
  { id: "CHAMPION", nom: "Champion",   min: 200_000,    xpBonus: 0.25, color: "#FF9800" },
  { id: "LEGENDE",  nom: "Legende",    min: 1_000_000,  xpBonus: 0.40, color: "#FFD700" },
];

const NIVEAUX_GUILDE = [
  { lvl:1,  xp:0,       bonus:0,    capacite:5  },
  { lvl:2,  xp:5_000,   bonus:0.05, capacite:8  },
  { lvl:3,  xp:15_000,  bonus:0.10, capacite:12 },
  { lvl:4,  xp:40_000,  bonus:0.15, capacite:18 },
  { lvl:5,  xp:100_000, bonus:0.20, capacite:25 },
  { lvl:6,  xp:250_000, bonus:0.30, capacite:35 },
  { lvl:7,  xp:600_000, bonus:0.40, capacite:50 },
  { lvl:8,  xp:1500_000,bonus:0.55, capacite:75 },
  { lvl:9,  xp:3500_000,bonus:0.70, capacite:100},
  { lvl:10, xp:8000_000,bonus:1.00, capacite:150},
];

const MISSIONS_GUILDE = [
  { id:"M1", nom:"Patrouille des Murs",    xp:200,   gain:[500,2000],    duree:4,  diff:1 },
  { id:"M2", nom:"Raid d'Approvisionnement",xp:500,  gain:[2000,8000],   duree:4,  diff:2 },
  { id:"M3", nom:"Siege de Forteresse",    xp:1200,  gain:[8000,30000],  duree:4,  diff:3 },
  { id:"M4", nom:"Conquest du Territoire", xp:3000,  gain:[30000,100000],duree:4,  diff:4 },
  { id:"M5", nom:"Guerre de Guildes",      xp:8000,  gain:[80000,300000],duree:4,  diff:5 },
];

const BATIMENTS = [
  { id:"CASERNE",   nom:"Caserne",      cout:5_000,    bonus:"Raid +10%",    emoji_text:"[C]" },
  { id:"FORGE",     nom:"Forge",        cout:15_000,   bonus:"XP +15%",      emoji_text:"[F]" },
  { id:"MARCHE",    nom:"Marche",       cout:40_000,   bonus:"Gain +20%",    emoji_text:"[M]" },
  { id:"TOUR",      nom:"Tour de Garde",cout:100_000,  bonus:"Defense +25%", emoji_text:"[T]" },
  { id:"CITADELLE", nom:"Citadelle",    cout:500_000,  bonus:"Tous +30%",    emoji_text:"[X]" },
];

const guildesCache = new Map();

const rand    = (mn, mx) => Math.floor(Math.random()*(mx-mn+1))+mn;
const fmt     = n => {
  if (!n||isNaN(n)) return "$0";
  n=Number(n);
  if (n>=1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n>=1e6)  return `$${(n/1e6).toFixed(2)}M`;
  if (n>=1e3)  return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
const fmtXP   = n => n>=1e6?`${(n/1e6).toFixed(1)}M XP`:n>=1e3?`${(n/1e3).toFixed(1)}K XP`:`${n} XP`;
const L       = (c="─",n=44) => c.repeat(n);
const timeLeft= (ts,cd)=>{
  const d=cd-(Date.now()-(ts||0));
  if(d<=0)return null;
  const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000);
  return h>0?`${h}h${m>0?` ${m}m`:""}`:`${m}m`;
};

function getRangMembre(membre) {
  let r = RANGS_GUILDE[0];
  for (const rg of RANGS_GUILDE) { if ((membre.xpTotal||0)>=rg.min) r=rg; else break; }
  return r;
}

function getNiveauGuilde(guilde) {
  let nv = NIVEAUX_GUILDE[0];
  for (const n of NIVEAUX_GUILDE) { if ((guilde.xp||0)>=n.xp) nv=n; else break; }
  const idx  = NIVEAUX_GUILDE.indexOf(nv);
  const next = NIVEAUX_GUILDE[idx+1]||null;
  return { ...nv, next };
}

function initGuilde(nom, fondateurID, fondateurNom) {
  return {
    nom,
    fondateurID,
    fondateurNom,
    xp:        0,
    tresor:    0,
    victoires: 0,
    defaites:  0,
    raids:     0,
    batiments: [],
    membres: [{ id: fondateurID, nom: fondateurNom, xpTotal: 0, contributions: 0, role: "FONDATEUR", joined: Date.now() }],
    missions:  [],
    lastRaid:  null,
    createdAt: Date.now(),
  };
}

function initMembre() {
  return {
    guildeId:      null,
    xpTotal:       0,
    contributions: 0,
    lastContrib:   null,
    lastMission:   null,
    lastDaily:     null,
    missionActive: null,
    partiesMission:0,
    victoires:     0,
  };
}

function getGuildeKey(nom) { return `guilde_${nom.toLowerCase().replace(/\s+/g,"_")}`; }

async function loadGuilde(guildeName, usersData, fondateurID) {
  const user = await usersData.get(fondateurID);
  return user?.data?.[getGuildeKey(guildeName)] || null;
}

async function saveGuilde(guilde, usersData) {
  const user = await usersData.get(guilde.fondateurID) || { money:0, data:{} };
  if (!user.data) user.data={};
  user.data[getGuildeKey(guilde.nom)] = guilde;
  await usersData.set(guilde.fondateurID, user);
}

async function findGuilde(memberID, usersData) {
  const user = await usersData.get(memberID);
  if (!user?.data?.guild_ref) return null;
  const { fondateurID, nom } = user.data.guild_ref;
  return loadGuilde(nom, usersData, fondateurID);
}

async function saveGuildeRef(memberID, guilde, usersData) {
  const user = await usersData.get(memberID) || { money:0, data:{} };
  if (!user.data) user.data={};
  user.data.guild_ref = { fondateurID: guilde.fondateurID, nom: guilde.nom };
  await usersData.set(memberID, user);
}

function drawGuildeCard(guilde, nv) {
  if (!canvasOk) return null;

  const W=900, H=320;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0, "#07080f");
  bg.addColorStop(0.5,"#0d1020");
  bg.addColorStop(1, "#07080f");
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle="rgba(255,255,255,0.025)"; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const gl=ctx.createRadialGradient(0,H/2,0,0,H/2,320);
  gl.addColorStop(0,"rgba(99,102,241,0.18)"); gl.addColorStop(1,"transparent");
  ctx.fillStyle=gl; ctx.fillRect(0,0,W,H);

  const gr=ctx.createRadialGradient(W,H/2,0,W,H/2,320);
  gr.addColorStop(0,"rgba(251,191,36,0.10)"); gr.addColorStop(1,"transparent");
  ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);

  const barX=36, barY=54, barW=18, barH=214;
  ctx.fillStyle="rgba(255,255,255,0.05)";
  ctx.beginPath(); ctx.roundRect(barX,barY,barW,barH,9); ctx.fill();

  const xpPct = nv.next ? Math.min(1,(guilde.xp-nv.xp)/(nv.next.xp-nv.xp)) : 1;
  const filledH = Math.floor(barH * xpPct);
  const barGrad = ctx.createLinearGradient(0,barY+barH,0,barY);
  barGrad.addColorStop(0,"#6366f1"); barGrad.addColorStop(0.5,"#818cf8"); barGrad.addColorStop(1,"#c7d2fe");
  ctx.fillStyle=barGrad;
  ctx.beginPath(); ctx.roundRect(barX,barY+barH-filledH,barW,filledH,9); ctx.fill();

  ctx.font=GF.bold(11); ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.textAlign="center"; ctx.textBaseline="top";
  ctx.fillText(`LV`,barX+barW/2,barY-18);
  ctx.font=GF.bold(16); ctx.fillStyle="#818cf8";
  ctx.fillText(`${nv.lvl}`,barX+barW/2,barY-4);

  ctx.font=GF.bold(38); ctx.fillStyle="#FFFFFF";
  ctx.textAlign="left"; ctx.textBaseline="top";
  ctx.shadowColor="rgba(99,102,241,0.7)"; ctx.shadowBlur=18;
  ctx.fillText(guilde.nom.toUpperCase().slice(0,22), 78, 36);
  ctx.shadowBlur=0;

  ctx.font=GF.regular(16); ctx.fillStyle="rgba(255,255,255,0.4)";
  ctx.fillText(`Fondateur: ${guilde.fondateurNom}`, 80, 84);

  const sepY=112;
  const sepGrad=ctx.createLinearGradient(78,0,W-40,0);
  sepGrad.addColorStop(0,"#6366f1"); sepGrad.addColorStop(0.5,"rgba(129,140,248,0.5)"); sepGrad.addColorStop(1,"transparent");
  ctx.strokeStyle=sepGrad; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(78,sepY); ctx.lineTo(W-40,sepY); ctx.stroke();

  const stats = [
    { label:"MEMBRES",  val:`${guilde.membres.length}/${nv.capacite}` },
    { label:"TRESOR",   val:fmt(guilde.tresor) },
    { label:"XP",       val:fmtXP(guilde.xp) },
    { label:"VICTOIRES",val:String(guilde.victoires) },
    { label:"RAIDS",    val:String(guilde.raids) },
    { label:"BATIMENTS",val:String(guilde.batiments.length) },
  ];

  const colW=(W-80-40)/3;
  stats.forEach((s,i) => {
    const col=i%3, row=Math.floor(i/3);
    const sx=80+col*colW, sy=130+row*68;

    ctx.fillStyle="rgba(255,255,255,0.035)";
    ctx.beginPath(); ctx.roundRect(sx,sy,colW-12,56,8); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.07)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(sx,sy,colW-12,56,8); ctx.stroke();

    ctx.font=GF.regular(12); ctx.fillStyle="rgba(255,255,255,0.38)";
    ctx.textAlign="left"; ctx.textBaseline="top";
    ctx.fillText(s.label, sx+10, sy+8);

    ctx.font=GF.bold(22); ctx.fillStyle="#FFFFFF";
    ctx.textBaseline="bottom";
    ctx.fillText(s.val, sx+10, sy+52);
  });

  const xpBarY=280, xpBarX=78, xpBarW=W-118;
  ctx.fillStyle="rgba(255,255,255,0.07)";
  ctx.beginPath(); ctx.roundRect(xpBarX,xpBarY,xpBarW,10,5); ctx.fill();

  const xpFill=Math.floor(xpBarW*xpPct);
  const xpFillGrad=ctx.createLinearGradient(xpBarX,0,xpBarX+xpBarW,0);
  xpFillGrad.addColorStop(0,"#6366f1"); xpFillGrad.addColorStop(1,"#c7d2fe");
  ctx.fillStyle=xpFillGrad;
  ctx.beginPath(); ctx.roundRect(xpBarX,xpBarY,xpFill,10,5); ctx.fill();

  ctx.font=GF.regular(12); ctx.fillStyle="rgba(255,255,255,0.35)";
  ctx.textAlign="left"; ctx.textBaseline="top";
  ctx.fillText(nv.next?`${fmtXP(guilde.xp)} / ${fmtXP(nv.next.xp)} → Nv ${nv.lvl+1}`:`Niveau MAX atteint`, xpBarX, xpBarY+14);

  ctx.font=GF.semi(13); ctx.fillStyle="rgba(251,191,36,0.6)";
  ctx.textAlign="right"; ctx.textBaseline="top";
  ctx.fillText(`Bonus guilde: +${Math.round(nv.bonus*100)}%`, W-40, xpBarY+14);

  return canvas;
}

function saveTmp(canvas) {
  const p=path.join(os.tmpdir(),`guild_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(p, canvas.toBuffer("image/png"));
  return p;
}

function renderHelp() {
  return [
    fonts.fraktur("GUILD — Systeme de Guildes"),
    L(),
    fonts.bold("Creation & Gestion"),
    `  guild creer <nom>            — Fonder une guilde`,
    `  guild rejoindre <nom>        — Rejoindre une guilde`,
    `  guild quitter                — Quitter votre guilde`,
    `  guild kick <@mention>        — Exclure un membre`,
    "",
    fonts.bold("Economie & Progression"),
    `  guild contribuer <mise>      — Donner au tresor (cd: 6h)`,
    `  guild batiment <ID>          — Construire un batiment`,
    `  guild tresor                 — Voir le tresor`,
    "",
    fonts.bold("Actions"),
    `  guild mission                — Lancer une mission (cd: 4h)`,
    `  guild raid                   — Raid aleatoire (cd: 12h)`,
    `  guild daily                  — Bonus quotidien guilde`,
    "",
    fonts.bold("Infos"),
    `  guild stat                   — Tableau de bord + carte`,
    `  guild membres                — Liste des membres`,
    `  guild batiments              — Batiments disponibles`,
    `  guild missions               — Liste des missions`,
    `  guild classement             — Top guildes`,
    L(),
    fonts.sansSerif("Mise minimum contribution: $500"),
  ].join("\n");
}

function renderStatText(guilde, membre, nv) {
  const rang  = getRangMembre(membre);
  const total = guilde.membres.length;

  return [
    fonts.fraktur(`GUILDE — ${guilde.nom}`),
    L(),
    `${fonts.bold("Fondateur")}   : ${guilde.fondateurNom}`,
    `${fonts.bold("Niveau")}      : ${nv.lvl}/10  (Bonus: +${Math.round(nv.bonus*100)}%)`,
    `${fonts.bold("Membres")}     : ${total}/${nv.capacite}`,
    `${fonts.bold("Tresor")}      : ${fmt(guilde.tresor)}`,
    `${fonts.bold("XP guilde")}   : ${fmtXP(guilde.xp)}`,
    `${fonts.bold("Batiments")}   : ${guilde.batiments.length}/${BATIMENTS.length}`,
    L("─", 22),
    fonts.sansSerif("VOTRE PROFIL"),
    `  Rang        : ${fonts.italic(rang.nom)}`,
    `  XP total    : ${fmtXP(membre.xpTotal)}`,
    `  Contributions: ${fmt(membre.contributions)}`,
    `  Victoires   : ${membre.victoires}`,
    L("─", 22),
    `Victoires / Defaites : ${guilde.victoires} / ${guilde.defaites}`,
    `Raids lances : ${guilde.raids}`,
    L(),
    fonts.monospace("Carte guilde ci-dessous"),
  ].join("\n");
}

function renderMembres(guilde) {
  const lignes = guilde.membres.map((m, i) => {
    const rg = getRangMembre(m);
    return `  ${String(i+1).padStart(2,"0")}. ${m.nom.slice(0,16).padEnd(16)} ${rg.nom.padEnd(10)} ${fmtXP(m.xpTotal||0)}`;
  });
  return [
    fonts.fraktur(`MEMBRES — ${guilde.nom}`),
    L(),
    fonts.bold("  #   Nom              Rang       XP"),
    L("─", 44),
    ...lignes,
    L(),
    `Total: ${guilde.membres.length} membre(s)`,
  ].join("\n");
}

function renderBatimentsDispos(guilde) {
  return [
    fonts.fraktur("BATIMENTS DISPONIBLES"),
    L(),
    ...BATIMENTS.map(b => {
      const construit = guilde.batiments.includes(b.id);
      return `  ${b.emoji_text} ${fonts.bold(b.nom.padEnd(16))} ${construit ? fonts.outline("CONSTRUIT") : fmt(b.cout).padEnd(10)} ${b.bonus}`;
    }),
    L(),
    fonts.sansSerif("Usage: guild batiment <ID>"),
    fonts.sansSerif("IDs: CASERNE FORGE MARCHE TOUR CITADELLE"),
  ].join("\n");
}

function renderMissions() {
  return [
    fonts.fraktur("MISSIONS DE GUILDE"),
    L(),
    ...MISSIONS_GUILDE.map(m =>
      `  ${fonts.bold(`[${m.id}]`)} ${m.nom.padEnd(24)} Diff:${"*".repeat(m.diff).padEnd(5)} XP:${fmtXP(m.xp)}  Gain:${fmt(m.gain[0])}-${fmt(m.gain[1])}`
    ),
    L(),
    fonts.sansSerif("Cooldown: 4h entre chaque mission"),
  ].join("\n");
}

async function cmdCreer(message, args, senderID, senderNom, usersData) {
  const nom = args.slice(1).join(" ").trim();
  if (!nom || nom.length < 3 || nom.length > 24)
    return message.reply(fonts.bold("Nom de guilde invalide. Entre 3 et 24 caracteres."));

  const membreData = await usersData.get(senderID);
  if (membreData?.data?.guild_ref)
    return message.reply(fonts.bold("Vous etes deja dans une guilde. Quittez-la d'abord."));

  const guilde  = initGuilde(nom, senderID, senderNom);
  const user    = membreData || { money:0, data:{} };
  if (!user.data) user.data = {};
  user.data[getGuildeKey(nom)]  = guilde;
  user.data.guild_ref           = { fondateurID: senderID, nom };
  user.data.guild_member        = initMembre();
  user.data.guild_member.guildeId = nom;
  await usersData.set(senderID, user);

  return message.reply([
    fonts.fraktur("NOUVELLE GUILDE FONDEE"),
    L(),
    `Nom        : ${fonts.bold(nom)}`,
    `Fondateur  : ${senderNom}`,
    `Niveau     : 1`,
    `Capacite   : 5 membres`,
    L(),
    fonts.sansSerif("Invitez des membres avec: guild rejoindre " + nom),
  ].join("\n"));
}

async function cmdRejoindre(message, args, senderID, senderNom, usersData) {
  const nom = args.slice(1).join(" ").trim();
  if (!nom) return message.reply(fonts.bold("Precisez le nom de la guilde."));

  const membreUser = await usersData.get(senderID);
  if (membreUser?.data?.guild_ref)
    return message.reply(fonts.bold("Vous etes deja dans une guilde."));

  return message.reply([
    fonts.bold("Pour rejoindre une guilde, le fondateur doit utiliser:"),
    `  guild inviter @mention`,
    "",
    fonts.sansSerif("Ou partagez votre ID de fondateur avec eux."),
  ].join("\n"));
}

async function cmdInviter(message, event, args, guilde, membre, user, usersData, saveGuilde_) {
  const nv = getNiveauGuilde(guilde);
  if (guilde.membres.length >= nv.capacite)
    return message.reply(fonts.bold(`Guilde pleine! Capacite: ${nv.capacite}. Montez de niveau.`));

  const mentions = Object.keys(event.mentions || {});
  if (!mentions.length) return message.reply(fonts.bold("Mentionnez le membre a inviter."));

  const targetID  = mentions[0];
  const targetNom = event.mentions[targetID]?.replace(/@/g,"") || `User#${targetID.slice(-4)}`;

  if (guilde.membres.find(m=>m.id===targetID))
    return message.reply(fonts.bold("Ce membre est deja dans la guilde."));

  guilde.membres.push({ id:targetID, nom:targetNom, xpTotal:0, contributions:0, role:"MEMBRE", joined:Date.now() });
  await saveGuilde_();

  const newUser = await usersData.get(targetID) || { money:0, data:{} };
  if (!newUser.data) newUser.data={};
  newUser.data.guild_ref    = { fondateurID: guilde.fondateurID, nom: guilde.nom };
  newUser.data.guild_member = initMembre();
  newUser.data.guild_member.guildeId = guilde.nom;
  await usersData.set(targetID, newUser);

  return message.reply([
    fonts.bold(`${targetNom} a rejoint ${guilde.nom}!`),
    `Membres: ${guilde.membres.length}/${nv.capacite}`,
  ].join("\n"));
}

async function cmdQuitter(message, senderID, guilde, membre, user, usersData) {
  if (senderID === guilde.fondateurID)
    return message.reply(fonts.bold("Le fondateur ne peut pas quitter. Dissoudre avec: guild dissoudre"));

  guilde.membres = guilde.membres.filter(m=>m.id!==senderID);
  const fondUser = await usersData.get(guilde.fondateurID)||{money:0,data:{}};
  if(!fondUser.data)fondUser.data={};
  fondUser.data[getGuildeKey(guilde.nom)]=guilde;
  await usersData.set(guilde.fondateurID, fondUser);

  delete user.data.guild_ref;
  delete user.data.guild_member;
  await usersData.set(senderID, user);

  return message.reply(fonts.bold(`Vous avez quitte la guilde ${guilde.nom}.`));
}

async function cmdContribuer(message, args, senderID, guilde, membre, user, usersData, saveAll) {
  const montant = parseInt(args[1]);
  if (!montant||montant<500)
    return message.reply(fonts.bold("Minimum de contribution: $500. Ex: guild contribuer 1000"));

  const cd = timeLeft(membre.lastContrib, COOLDOWNS.CONTRIBUER);
  if (cd) return message.reply(fonts.bold(`Prochaine contribution dans: ${cd}`));

  if ((user.money||0)<montant)
    return message.reply(fonts.bold(`Fonds insuffisants. Portefeuille: ${fmt(user.money||0)}`));

  const nv = getNiveauGuilde(guilde);
  const xpGain = Math.floor(montant/100 * (1+nv.bonus));

  user.money          = (user.money||0) - montant;
  guilde.tresor       += montant;
  guilde.xp           += xpGain;
  membre.contributions+= montant;
  membre.xpTotal      += xpGain;
  membre.lastContrib   = Date.now();

  await saveAll();

  const nvApres = getNiveauGuilde(guilde);
  const levelUp = nvApres.lvl > nv.lvl;

  return message.reply([
    fonts.fraktur("CONTRIBUTION GUILDE"),
    L(),
    `Montant contribue : ${fmt(montant)}`,
    `XP gagne          : ${fmtXP(xpGain)}`,
    `Tresor guilde     : ${fmt(guilde.tresor)}`,
    levelUp ? [L("─",22), fonts.bold(`GUILDE NIVEAU ${nvApres.lvl}!`), `Capacite: ${nvApres.capacite} membres`].join("\n") : "",
    L(),
    fonts.monospace(`Prochain: 6h`),
  ].filter(Boolean).join("\n"));
}

async function cmdMission(message, senderID, guilde, membre, user, usersData, saveAll) {
  const cd = timeLeft(membre.lastMission, COOLDOWNS.MISSION);
  if (cd) return message.reply(fonts.bold(`Mission en cooldown. Prochaine dans: ${cd}`));

  const nv       = getNiveauGuilde(guilde);
  const idx      = Math.min(Math.floor(Math.random()*MISSIONS_GUILDE.length), MISSIONS_GUILDE.length-1);
  const mission  = MISSIONS_GUILDE[idx];
  const bonus    = nv.bonus;
  const success  = Math.random() < (0.5 + bonus*0.8);

  let gain = 0, xp = 0, msg = "";

  if (success) {
    gain  = rand(mission.gain[0], mission.gain[1]);
    gain  = Math.floor(gain*(1+bonus));
    xp    = Math.floor(mission.xp*(1+bonus));
    user.money       = (user.money||0) + gain;
    guilde.victoires++;
    membre.victoires++;
    membre.xpTotal  += xp;
    guilde.xp       += Math.floor(xp*0.5);
    msg = [
      fonts.bold(`Mission reussie!`),
      `${mission.nom}`,
      L("─",22),
      `Gain    : +${fmt(gain)}`,
      `XP      : +${fmtXP(xp)}`,
      `Bonus nv: +${Math.round(bonus*100)}%`,
      `Victoires guilde: ${guilde.victoires}`,
    ].join("\n");
  } else {
    guilde.defaites++;
    msg = [
      fonts.bold(`Mission echouee.`),
      `${mission.nom}`,
      L("─",22),
      "Aucun gain.",
      `Defaites guilde: ${guilde.defaites}`,
    ].join("\n");
  }

  membre.lastMission = Date.now();
  membre.partiesMission++;
  await saveAll();

  return message.reply(msg);
}

async function cmdRaid(message, senderID, guilde, membre, user, usersData, saveAll) {
  if (senderID !== guilde.fondateurID)
    return message.reply(fonts.bold("Seul le fondateur peut lancer un raid."));

  const cd = timeLeft(guilde.lastRaid, COOLDOWNS.RAID);
  if (cd) return message.reply(fonts.bold(`Prochain raid dans: ${cd}`));

  const nv       = getNiveauGuilde(guilde);
  const hasCase  = guilde.batiments.includes("CASERNE");
  const success  = Math.random() < (0.45 + nv.bonus*0.6 + (hasCase?0.10:0));
  const butin    = rand(guilde.tresor*0.05, guilde.tresor*0.25)||rand(1000,10000);

  guilde.raids++;
  guilde.lastRaid = Date.now();

  let msg;
  if (success) {
    const gain = Math.floor(butin);
    guilde.tresor   += gain;
    guilde.victoires++;
    guilde.xp       += 500;
    msg = [
      fonts.fraktur("RAID REUSSI"),
      L(),
      `Butin recupere : ${fmt(gain)}`,
      `Tresor guilde  : ${fmt(guilde.tresor)}`,
      `+500 XP guilde`,
      L(),
      fonts.monospace("Prochain raid: 12h"),
    ].join("\n");
  } else {
    const perte = Math.floor((guilde.tresor*0.05)||500);
    guilde.tresor  = Math.max(0, guilde.tresor - perte);
    guilde.defaites++;
    msg = [
      fonts.fraktur("RAID ECHOUE"),
      L(),
      `Perte : -${fmt(perte)}`,
      `Tresor restant: ${fmt(guilde.tresor)}`,
      L(),
      fonts.monospace("Prochain raid: 12h"),
    ].join("\n");
  }

  await saveAll();
  return message.reply(msg);
}

async function cmdBatiment(message, args, senderID, guilde, user, usersData, saveAll) {
  if (senderID !== guilde.fondateurID)
    return message.reply(fonts.bold("Seul le fondateur peut construire des batiments."));

  const id  = (args[1]||"").toUpperCase();
  const bat = BATIMENTS.find(b=>b.id===id);
  if (!bat) return message.reply(renderBatimentsDispos(guilde));

  if (guilde.batiments.includes(id))
    return message.reply(fonts.bold(`${bat.nom} deja construit!`));

  if ((guilde.tresor||0)<bat.cout)
    return message.reply(fonts.bold(`Tresor insuffisant. Besoin: ${fmt(bat.cout)} — Tresor: ${fmt(guilde.tresor)}`));

  guilde.tresor    -= bat.cout;
  guilde.batiments.push(id);
  guilde.xp        += 1000;
  await saveAll();

  return message.reply([
    fonts.bold(`${bat.nom} construit!`),
    `Cout: ${fmt(bat.cout)}`,
    `Effet: ${bat.bonus}`,
    `Tresor restant: ${fmt(guilde.tresor)}`,
    `+1000 XP guilde`,
  ].join("\n"));
}

async function cmdDaily(message, senderID, guilde, membre, user, usersData, saveAll) {
  const cd = timeLeft(membre.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`Daily deja recupere. Reviens dans: ${cd}`));

  const nv   = getNiveauGuilde(guilde);
  const rang = getRangMembre(membre);
  const base = 300;
  const gain = Math.floor(base * (1+nv.bonus) * (1+rang.xpBonus));

  user.money        = (user.money||0) + gain;
  membre.lastDaily   = Date.now();
  membre.xpTotal    += 50;
  guilde.xp         += 25;
  await saveAll();

  return message.reply([
    fonts.fancy("Daily Guilde"),
    L(),
    `Guilde Nv ${nv.lvl}  — Rang ${rang.nom}`,
    `Bonus recus : ${fmt(gain)}`,
    `+50 XP membre, +25 XP guilde`,
    L(),
    fonts.monospace("Reviens dans 24h!"),
  ].join("\n"));
}

async function cmdStat(message, senderID, guilde, membre, user, usersData) {
  const nv      = getNiveauGuilde(guilde);
  const texte   = renderStatText(guilde, membre, nv);
  const canvas  = drawGuildeCard(guilde, nv);

  if (!canvas) return message.reply(texte);

  const tmpPath = saveTmp(canvas);
  message.reply({ body: texte, attachment: fs.createReadStream(tmpPath) }, ()=>{
    fs.unlink(tmpPath, ()=>{});
  });
}

module.exports = {
  config: {
    name: "guild",
    aliases: ["guilde"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "Systeme de guildes: fondez votre clan, montez de niveau, raids, missions, batiments et tresor commun."
    },
    category: "economy",
    guide: {
      fr: "Tapez 'guild help' pour voir toutes les commandes."
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const sub = (args[0]||"stat").toLowerCase();

    let user = await usersData.get(senderID) || { money:0, exp:0, data:{} };
    if (!user.data) user.data = {};

    const senderNom = event.senderName || `User#${senderID.slice(-4)}`;

    if (["help","aide","creer","create"].includes(sub)) {
      if (sub==="creer"||sub==="create") return cmdCreer(message, args, senderID, senderNom, usersData);
      return message.reply(renderHelp());
    }
    if (sub==="rejoindre"||sub==="join") return cmdRejoindre(message, args, senderID, senderNom, usersData);

    let guilde = null, membre = null;

    if (user.data.guild_ref) {
      const { fondateurID, nom } = user.data.guild_ref;
      guilde = await loadGuilde(nom, usersData, fondateurID);
    }

    if (!guilde) {
      const keys = Object.keys(user.data||{}).filter(k=>k.startsWith("guilde_"));
      if (keys.length) guilde = user.data[keys[0]];
    }

    if (!guilde) {
      return message.reply([
        fonts.bold("Vous n'etes dans aucune guilde."),
        "Fondez-en une : guild creer <nom>",
        "Ou demandez une invitation a un fondateur.",
      ].join("\n"));
    }

    membre = user.data.guild_member || initMembre();

    const saveAll = async () => {
      membre.guildeId  = guilde.nom;
      user.data.guild_member = membre;
      await usersData.set(senderID, user);
      await saveGuilde(guilde, usersData);
    };

    switch(sub) {
      case "stat":
      case "stats":
      case "dashboard":
      case "profil":
        return cmdStat(message, senderID, guilde, membre, user, usersData);

      case "membres":
      case "members":
        return message.reply(renderMembres(guilde));

      case "batiments":
      case "buildings":
        return message.reply(renderBatimentsDispos(guilde));

      case "batiment":
      case "build":
      case "building":
        return cmdBatiment(message, args, senderID, guilde, user, usersData, saveAll);

      case "missions":
        return message.reply(renderMissions());

      case "mission":
        return cmdMission(message, senderID, guilde, membre, user, usersData, saveAll);

      case "raid":
        return cmdRaid(message, senderID, guilde, membre, user, usersData, saveAll);

      case "contribuer":
      case "contributer":
      case "don":
        return cmdContribuer(message, args, senderID, guilde, membre, user, usersData, saveAll);

      case "daily":
        return cmdDaily(message, senderID, guilde, membre, user, usersData, saveAll);

      case "inviter":
      case "invite":
      case "add":
        return cmdInviter(message, event, args, guilde, membre, user, usersData, saveAll);

      case "quitter":
      case "leave":
        return cmdQuitter(message, senderID, guilde, membre, user, usersData);

      case "tresor":
      case "treasury":
        return message.reply([
          fonts.fraktur(`TRESOR — ${guilde.nom}`),
          L(),
          `Tresor actuel : ${fonts.bold(fmt(guilde.tresor))}`,
          `Membres       : ${guilde.membres.length}`,
          L("─",22),
          "Top contributeurs:",
          ...[...guilde.membres]
            .sort((a,b)=>(b.contributions||0)-(a.contributions||0))
            .slice(0,5)
            .map((m,i)=>`  ${i+1}. ${m.nom.slice(0,16).padEnd(16)} ${fmt(m.contributions||0)}`),
          L(),
          fonts.sansSerif("guild contribuer <montant> pour alimenter le tresor"),
        ].join("\n"));

      default:
        return message.reply(fonts.bold(`Commande inconnue. Tapez 'guild help'.`));
    }
  }
};