"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  GIVE QUANTUM v4.0 — Transmission de fonds style "signal quantique"
//  Auteur   : Christus
//  Concept  : Layout VERTICAL — deux stations (envoyeur haut / receveur bas)
//             reliées par un tube de données central avec particules d energie.
//             Le montant est affiché dans un "noyau" central lumineux.
//             Completement different de Give Sovereign (qui etait horizontal)
//  Canvas   : 820 × 1100 px (format portrait, like une carte)
//  Symboles : zéro emoji — uniquement caracteres speciaux
//  20 themes exclusifs
// ═══════════════════════════════════════════════════════════════════════════════

const fs     = require("fs-extra");
const path   = require("path");
const axios  = require("axios");
const moment = require("moment-timezone");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

// ─── Polices ──────────────────────────────────────────────────────────────────
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded || !canvasAvailable || !registerFont) return;
  fontsLoaded = true;
  try {
    const fd = path.join(__dirname, "assets", "font");
    if (!fs.existsSync(fd)) return;
    const ff = [
      ["JetBrainsMono-Bold.ttf",    "QF", "bold"],
      ["JetBrainsMono-Regular.ttf", "QF", "normal"],
      ["BeVietnamPro-Bold.ttf",     "QF", "bold"],
      ["BeVietnamPro-Regular.ttf",  "QF", "normal"],
      ["NotoSans-Bold.ttf",         "QF", "bold"],
      ["NotoSans-Regular.ttf",      "QF", "normal"],
    ];
    for (const [f, fam, w] of ff) {
      try {
        const fp = path.join(fd, f);
        if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
      } catch (_) {}
    }
  } catch (_) {}
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  n = Number(n);
  if (!isFinite(n)) return "$MAX";
  const S = [{v:1e18,s:"Qi"},{v:1e15,s:"Qa"},{v:1e12,s:"T"},{v:1e9,s:"B"},{v:1e6,s:"M"},{v:1e3,s:"K"}];
  const sc = S.find(s => Math.abs(n) >= s.v);
  if (sc) return `${n<0?"-":""}$${(Math.abs(n)/sc.v).toFixed(2).replace(/\.00$/,"")}${sc.s}`;
  const p = Math.abs(n).toFixed(2).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n<0?"-":""}$${p.join(".")}`;
}

const SUFFIXES = { k:1e3, m:1e6, b:1e9, t:1e12, q:1e15 };
function parseAmount(input) {
  if (!input || typeof input !== "string") return NaN;
  const m = input.trim().toLowerCase().match(/^([\d,.]+)\s*([kmbtq]?)$/i);
  if (!m) return NaN;
  let v = parseFloat(m[1].replace(/,/g, "."));
  if (m[2] && SUFFIXES[m[2]]) v *= SUFFIXES[m[2]];
  return isNaN(v) ? NaN : Math.floor(v);
}

const TIERS = [
  { name:"Starter", min:0,       max:999,      color:"#CD7F32", sym:"[I]"  },
  { name:"Rookie",  min:1_000,   max:4_999,    color:"#C0C0C0", sym:"[II]" },
  { name:"Pro",     min:5_000,   max:19_999,   color:"#FFD700", sym:"[III]"},
  { name:"Elite",   min:20_000,  max:49_999,   color:"#E8E8FF", sym:"[IV]" },
  { name:"Master",  min:50_000,  max:99_999,   color:"#00FFFF", sym:"[V]"  },
  { name:"Legend",  min:100_000, max:499_999,  color:"#FF00FF", sym:"[VI]" },
  { name:"GOD",     min:500_000, max:Infinity,  color:"#FF2020", sym:"[VII]"},
];
function getTier(b) { return TIERS.find(t => (b||0)>=t.min && (b||0)<=t.max) || TIERS[0]; }

// ─── Seedé random ─────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = typeof seed === "string"
    ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 1)
    : Math.abs(seed) || 1;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  20 THEMES "QUANTUM TRANSMISSION"
//  Chaque theme a : fond unique, tube de donnees, noyau central, couleurs
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {

  // ── GROUPE 1 : COSMOS ─────────────────────────────────────────────────────
  neutron_pulse: {
    name:"Neutron Pulse", sym:"//",
    bg1:"#04000E", bg2:"#080018",
    tube:"#5500FF", tubeGlow:"#8844FF",
    core:"#AA66FF", coreGlow:"#7733FF",
    particle:"#CCAAFF",
    primary:"#BB88FF", accent:"#FF99FF", gold:"#FFEEAA",
    text:"#F0EAFF", muted:"#8877AA",
    card1:"#0C0424", card2:"#140830",
    border:"#6622CC",
  },

  solar_wind: {
    name:"Solar Wind", sym:">>",
    bg1:"#0E0400", bg2:"#180800",
    tube:"#FF6600", tubeGlow:"#FF9900",
    core:"#FFD700", coreGlow:"#FF8800",
    particle:"#FFEEAA",
    primary:"#FF9900", accent:"#FFD700", gold:"#FFFFAA",
    text:"#FFF8E8", muted:"#AA8844",
    card1:"#200800", card2:"#2C1000",
    border:"#CC5500",
  },

  event_horizon: {
    name:"Event Horizon", sym:"**",
    bg1:"#000000", bg2:"#050508",
    tube:"#4444FF", tubeGlow:"#6666FF",
    core:"#FFFFFF", coreGlow:"#AAAAFF",
    particle:"#AAAAFF",
    primary:"#8888FF", accent:"#FFFFFF", gold:"#FFFF88",
    text:"#EEEEFF", muted:"#666699",
    card1:"#080810", card2:"#101018",
    border:"#3333BB",
  },

  quasar_jet: {
    name:"Quasar Jet", sym:"~~",
    bg1:"#000C0E", bg2:"#00181C",
    tube:"#00DDFF", tubeGlow:"#00FFFF",
    core:"#00FFFF", coreGlow:"#00BBFF",
    particle:"#AAFFFF",
    primary:"#00EEFF", accent:"#88FFFF", gold:"#FFFF88",
    text:"#E0FFFF", muted:"#337788",
    card1:"#001820", card2:"#002030",
    border:"#007799",
  },

  dark_matter: {
    name:"Dark Matter", sym:"##",
    bg1:"#000000", bg2:"#040406",
    tube:"#9900CC", tubeGlow:"#CC00FF",
    core:"#FF00FF", coreGlow:"#BB00CC",
    particle:"#FF88FF",
    primary:"#CC44FF", accent:"#FF88FF", gold:"#FFAAFF",
    text:"#F8EEFF", muted:"#7733AA",
    card1:"#100010", card2:"#180018",
    border:"#880099",
  },

  // ── GROUPE 2 : TECHNO ─────────────────────────────────────────────────────
  data_stream: {
    name:"Data Stream", sym:"01",
    bg1:"#000800", bg2:"#001200",
    tube:"#00AA33", tubeGlow:"#00FF44",
    core:"#00FF44", coreGlow:"#00CC33",
    particle:"#AAFFBB",
    primary:"#00EE44", accent:"#88FF99", gold:"#AAFF88",
    text:"#EEFFEE", muted:"#336644",
    card1:"#001400", card2:"#002000",
    border:"#006622",
  },

  circuit_burn: {
    name:"Circuit Burn", sym:"[]",
    bg1:"#100200", bg2:"#180400",
    tube:"#FF3300", tubeGlow:"#FF6600",
    core:"#FF9900", coreGlow:"#FF5500",
    particle:"#FFCCAA",
    primary:"#FF5500", accent:"#FF9900", gold:"#FFCC44",
    text:"#FFF0E8", muted:"#993322",
    card1:"#1C0400", card2:"#280600",
    border:"#AA2200",
  },

  neon_grid: {
    name:"Neon Grid", sym:"++",
    bg1:"#040010", bg2:"#080018",
    tube:"#0088FF", tubeGlow:"#00CCFF",
    core:"#00CCFF", coreGlow:"#0088FF",
    particle:"#AADDFF",
    primary:"#00AAFF", accent:"#00EEFF", gold:"#FFEE88",
    text:"#E8F8FF", muted:"#224488",
    card1:"#060020", card2:"#0A0030",
    border:"#0055BB",
  },

  cyber_gold: {
    name:"Cyber Gold", sym:"$$",
    bg1:"#0A0800", bg2:"#14100000",
    tube:"#CC9900", tubeGlow:"#FFD700",
    core:"#FFD700", coreGlow:"#FFAA00",
    particle:"#FFEEAA",
    primary:"#FFD700", accent:"#FFE880", gold:"#FFFFFF",
    text:"#FFFBE8", muted:"#887733",
    card1:"#181000", card2:"#241800",
    border:"#AA7700",
  },

  plasma_rift: {
    name:"Plasma Rift", sym:"~~",
    bg1:"#0E000E", bg2:"#180014",
    tube:"#FF00AA", tubeGlow:"#FF44CC",
    core:"#FF66DD", coreGlow:"#CC0088",
    particle:"#FFBBEE",
    primary:"#FF44BB", accent:"#FF88DD", gold:"#FFDDFF",
    text:"#FFF0FF", muted:"#993388",
    card1:"#1A001A", card2:"#240024",
    border:"#BB0088",
  },

  // ── GROUPE 3 : NATURE / ELEMENTS ──────────────────────────────────────────
  aurora_transfer: {
    name:"Aurora Transfer", sym:"--",
    bg1:"#000A06", bg2:"#001408",
    tube:"#00FF88", tubeGlow:"#00FFCC",
    core:"#00FFCC", coreGlow:"#00CC88",
    particle:"#AAFFDD",
    primary:"#00FF99", accent:"#00FFDD", gold:"#AAFFEE",
    text:"#E8FFF8", muted:"#226644",
    card1:"#001C10", card2:"#002818",
    border:"#008855",
  },

  lava_flow: {
    name:"Lava Flow", sym:"^^",
    bg1:"#120200", bg2:"#1C0300",
    tube:"#FF2200", tubeGlow:"#FF5500",
    core:"#FF8800", coreGlow:"#FF3300",
    particle:"#FFBBAA",
    primary:"#FF4400", accent:"#FF8800", gold:"#FFCC44",
    text:"#FFF4F0", muted:"#883322",
    card1:"#200300", card2:"#2C0400",
    border:"#991100",
  },

  ice_crystal: {
    name:"Ice Crystal", sym:"::",
    bg1:"#000812", bg2:"#001020",
    tube:"#66CCFF", tubeGlow:"#99EEFF",
    core:"#CCFFFF", coreGlow:"#88CCFF",
    particle:"#DDEEFF",
    primary:"#88DDFF", accent:"#BBFFFF", gold:"#DDEEFF",
    text:"#F0FAFF", muted:"#446688",
    card1:"#001828", card2:"#002030",
    border:"#4499BB",
  },

  thunder_arc: {
    name:"Thunder Arc", sym:"!!",
    bg1:"#080808", bg2:"#0E0C00",
    tube:"#FFFF00", tubeGlow:"#FFEE00",
    core:"#FFFFFF", coreGlow:"#FFFF66",
    particle:"#FFFFAA",
    primary:"#FFEE00", accent:"#FFFFFF", gold:"#FFFF88",
    text:"#FFFFF0", muted:"#888844",
    card1:"#141200", card2:"#1C1800",
    border:"#AAAA00",
  },

  void_rift: {
    name:"Void Rift", sym:"<>",
    bg1:"#000000", bg2:"#030306",
    tube:"#4400FF", tubeGlow:"#7733FF",
    core:"#AA44FF", coreGlow:"#6600CC",
    particle:"#CC99FF",
    primary:"#8833FF", accent:"#BB77FF", gold:"#DDAAFF",
    text:"#F0EAFF", muted:"#553388",
    card1:"#060010", card2:"#0A0018",
    border:"#440099",
  },

  // ── GROUPE 4 : RETRO / LO-FI ──────────────────────────────────────────────
  retro_transfer: {
    name:"Retro Transfer", sym:">>",
    bg1:"#0A0018", bg2:"#140022",
    tube:"#FF71CE", tubeGlow:"#FF99DD",
    core:"#FF71CE", coreGlow:"#CC44AA",
    particle:"#FFCCEE",
    primary:"#FF71CE", accent:"#FFBBDD", gold:"#B967FF",
    text:"#FFE8F8", muted:"#994477",
    card1:"#18002E", card2:"#220038",
    border:"#AA3388",
  },

  outrun_send: {
    name:"Outrun Send", sym:"//",
    bg1:"#080010", bg2:"#100018",
    tube:"#FF3864", tubeGlow:"#FF6688",
    core:"#2DE2E6", coreGlow:"#00BBCC",
    particle:"#AAFFFF",
    primary:"#FF3864", accent:"#2DE2E6", gold:"#FFE74C",
    text:"#FFF0F8", muted:"#883355",
    card1:"#14001C", card2:"#1C0028",
    border:"#CC2255",
  },

  synthwave_tx: {
    name:"Synthwave TX", sym:"~~",
    bg1:"#06000E", bg2:"#0C0018",
    tube:"#7209B7", tubeGlow:"#9B2FE8",
    core:"#F72585", coreGlow:"#CC1060",
    particle:"#FFAACC",
    primary:"#9B2FE8", accent:"#F72585", gold:"#4CC9F0",
    text:"#FFE0F4", muted:"#662277",
    card1:"#100018", card2:"#180022",
    border:"#5A0099",
  },

  lo_fi_send: {
    name:"Lo-Fi Send", sym:"--",
    bg1:"#060810", bg2:"#0C1020",
    tube:"#7B8CDE", tubeGlow:"#9DAAFF",
    core:"#A8C0FF", coreGlow:"#6677BB",
    particle:"#CCDDFF",
    primary:"#8899EE", accent:"#AABBFF", gold:"#FFDD99",
    text:"#E8ECFF", muted:"#5566AA",
    card1:"#0E1428", card2:"#141C34",
    border:"#445588",
  },

  cassette_gold: {
    name:"Cassette Gold", sym:"[]",
    bg1:"#080600", bg2:"#100C00",
    tube:"#C8960C", tubeGlow:"#FFD700",
    core:"#FFE066", coreGlow:"#CCAA00",
    particle:"#FFF4AA",
    primary:"#E8B800", accent:"#FFE066", gold:"#FFFFFF",
    text:"#FFFDE8", muted:"#887733",
    card1:"#141000", card2:"#1E1800",
    border:"#886600",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
function rr(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r,r,r,r];
  const [tl,tr,br,bl] = r;
  ctx.beginPath();
  ctx.moveTo(x+tl,y); ctx.lineTo(x+w-tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br); ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl); ctx.quadraticCurveTo(x,y,x+tl,y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, {align="left",weight="bold",glow=null,alpha=1,blur=14}={}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${sz}px QF, "JetBrains Mono", "Courier New", monospace`;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = blur; }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}

// ─── Fond "cosmos" : gradient + particules seedées + grille fine ──────────────
function drawQuantumBg(ctx, W, H, t, seed) {
  // Gradient de fond
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.bg1); g.addColorStop(0.5, t.bg2); g.addColorStop(1, t.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Halo autour du tube (axe central vertical)
  const tubeX = W / 2;
  const tg = ctx.createRadialGradient(tubeX, H*0.5, 0, tubeX, H*0.5, W*0.5);
  tg.addColorStop(0, t.tube + "18"); tg.addColorStop(1, "transparent");
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);

  // Etoiles / particules de fond
  const rng = seededRng(seed + "_bg");
  ctx.save();
  for (let i = 0; i < 180; i++) {
    const sx = rng() * W, sy = rng() * H;
    const sr = rng() * 1.2 + 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${rng() * 0.35 + 0.05})`;
    ctx.fill();
  }
  ctx.restore();

  // Lignes horizontales très fines (grille quantique)
  ctx.save();
  ctx.strokeStyle = t.tube + "22"; ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

// ─── Station (bloc joueur) ─────────────────────────────────────────────────────
// role: "sender" (haut) ou "receiver" (bas)
async function drawStation(ctx, W, t, cx, y, avatarImg, name, newBalance, role, seed) {
  const CARD_W = W - 80;
  const CARD_H = 200;
  const CARD_X = (W - CARD_W) / 2;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = t.tube + "88"; ctx.shadowBlur = 40; ctx.shadowOffsetY = role === "sender" ? 8 : -8;
  ctx.fillStyle = t.card1;
  rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.fill();
  ctx.restore();

  // Fond dégradé de la carte
  const cg = ctx.createLinearGradient(CARD_X, y, CARD_X + CARD_W, y + CARD_H);
  cg.addColorStop(0, t.card1); cg.addColorStop(1, t.card2);
  ctx.fillStyle = cg; rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.fill();

  // Bordure lumineuse
  ctx.save();
  ctx.strokeStyle = t.border; ctx.lineWidth = 1.8;
  ctx.shadowColor = t.tube; ctx.shadowBlur = 12;
  rr(ctx, CARD_X, y, CARD_W, CARD_H, 18); ctx.stroke();
  ctx.restore();

  // Bordure accent intérieure
  ctx.save();
  ctx.strokeStyle = t.primary + "40"; ctx.lineWidth = 1;
  rr(ctx, CARD_X + 5, y + 5, CARD_W - 10, CARD_H - 10, 14); ctx.stroke();
  ctx.restore();

  // Coins décoratifs (L-shapes)
  const corners = [
    [CARD_X + 16, y + 16, 1, 1],
    [CARD_X + CARD_W - 16, y + 16, -1, 1],
    [CARD_X + 16, y + CARD_H - 16, 1, -1],
    [CARD_X + CARD_W - 16, y + CARD_H - 16, -1, -1],
  ];
  corners.forEach(([cx2, cy2, dx, dy]) => {
    ctx.save();
    ctx.strokeStyle = t.gold; ctx.lineWidth = 2.2;
    ctx.shadowColor = t.gold; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 + dy * 22); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2 + dx * 22, cy2);
    ctx.stroke(); ctx.restore();
  });

  // Label role
  const roleLabel = role === "sender" ? "EMETTEUR" : "RECEPTEUR";
  const roleSymbol = role === "sender" ? "[->>]" : "[>>-]";
  T(ctx, `${roleSymbol}  ${roleLabel}`, CARD_X + CARD_W/2, y + 22, 11, t.muted, { align:"center", weight:"700" });

  // Avatar circulaire (gauche de la carte)
  const AV_CX = CARD_X + 76;
  const AV_CY = y + CARD_H / 2 + 8;
  const AV_R  = 56;

  // Anneaux orbitaux autour de l avatar
  [0, 1].forEach(i => {
    ctx.save();
    ctx.strokeStyle = t.tube + ["80", "35"][i]; ctx.lineWidth = [1.8, 1][i];
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = [10, 4][i];
    ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R + 8 + i * 10, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  });

  // Image avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R, 0, Math.PI*2); ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, AV_CX - AV_R, AV_CY - AV_R, AV_R*2, AV_R*2);
  } else {
    const rng2 = seededRng(seed);
    ctx.fillStyle = `hsl(${Math.round(rng2()*360)},70%,35%)`;
    ctx.fillRect(AV_CX-AV_R, AV_CY-AV_R, AV_R*2, AV_R*2);
    T(ctx, (name||"?").charAt(0).toUpperCase(), AV_CX, AV_CY, 44, "#FFF", { align:"center" });
  }
  ctx.restore();

  // Contour avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R, 0, Math.PI*2);
  ctx.strokeStyle = t.primary; ctx.lineWidth = 2.8;
  ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 16; ctx.stroke();
  ctx.restore();

  // Zone texte droite
  const TX = AV_CX + AV_R + 28;
  const TW = CARD_X + CARD_W - TX - 20;

  // Nom
  ctx.save();
  ctx.font = `bold 22px QF, "JetBrains Mono", monospace`;
  let dispName = name || "Utilisateur";
  while (ctx.measureText(dispName).width > TW - 10 && dispName.length > 2) {
    dispName = dispName.slice(0, -1);
  }
  if (dispName !== (name || "Utilisateur")) dispName += "~";
  ctx.restore();
  T(ctx, dispName, TX, AV_CY - 32, 22, t.text, { weight:"800" });

  // Palier
  const tier = getTier(newBalance);
  T(ctx, `${tier.sym}  ${tier.name}`, TX, AV_CY - 6, 14, tier.color, { weight:"700", glow: tier.color, blur:8 });

  // Nouveau solde
  T(ctx, "SOLDE APRES :", TX, AV_CY + 20, 10, t.muted, { weight:"600" });
  T(ctx, fmt(newBalance), TX, AV_CY + 42, 20, t.primary, { weight:"900", glow: t.coreGlow, blur:10 });

  // Indicateur de connexion (LED) en haut à droite de la carte
  const LED_X = CARD_X + CARD_W - 30;
  const LED_Y = y + 22;
  ctx.save();
  ctx.fillStyle = t.primary; ctx.shadowColor = t.primary; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(LED_X, LED_Y, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "#FFF"; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(LED_X - 1, LED_Y - 1, 2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── Tube de données central (axe vertical entre les deux stations) ───────────
function drawQuantumTube(ctx, W, tubeTop, tubeBot, t, seed) {
  const cx = W / 2;
  const TUBE_W = 52;

  // Fond du tube (canal semi-transparent)
  ctx.save();
  ctx.fillStyle = t.tube + "18";
  const tubeX = cx - TUBE_W / 2;
  const tubeH = tubeBot - tubeTop;
  ctx.fillRect(tubeX, tubeTop, TUBE_W, tubeH);
  ctx.restore();

  // Bordures du tube (deux lignes verticales lumineuses)
  [-1, 1].forEach(side => {
    const lineX = cx + side * (TUBE_W / 2);
    const lg = ctx.createLinearGradient(lineX, tubeTop, lineX, tubeBot);
    lg.addColorStop(0, "transparent");
    lg.addColorStop(0.2, t.tube + "AA");
    lg.addColorStop(0.5, t.tubeGlow + "DD");
    lg.addColorStop(0.8, t.tube + "AA");
    lg.addColorStop(1, "transparent");
    ctx.save();
    ctx.strokeStyle = lg; ctx.lineWidth = 1.8;
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(lineX, tubeTop); ctx.lineTo(lineX, tubeBot); ctx.stroke();
    ctx.restore();
  });

  // Particules de données qui "coulent" dans le tube (seedées, fixes)
  const rng = seededRng(seed + "_particles");
  const numParticles = 16;
  for (let i = 0; i < numParticles; i++) {
    const py = tubeTop + rng() * (tubeBot - tubeTop);
    const px = cx + (rng() - 0.5) * (TUBE_W * 0.7);
    const pr = rng() * 3 + 1.5;
    const alpha = rng() * 0.7 + 0.2;

    ctx.save();
    ctx.fillStyle = t.particle;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // Trainee de particule (ligne courte vers le bas)
    if (pr > 2.5) {
      ctx.save();
      const tg2 = ctx.createLinearGradient(px, py, px, py + 14);
      tg2.addColorStop(0, t.particle + "AA"); tg2.addColorStop(1, "transparent");
      ctx.strokeStyle = tg2; ctx.lineWidth = pr * 0.6; ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 14); ctx.stroke();
      ctx.restore();
    }
  }

  // Chevrons directionnels dans le tube (indiquent le flux)
  const chevrons = 4;
  for (let c = 0; c < chevrons; c++) {
    const cy2 = tubeTop + (c + 0.5) * (tubeBot - tubeTop) / chevrons;
    const CW2 = 14, CH2 = 8;
    ctx.save();
    ctx.strokeStyle = t.particle; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.shadowColor = t.tubeGlow; ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(cx - CW2, cy2 - CH2/2);
    ctx.lineTo(cx, cy2 + CH2/2);
    ctx.lineTo(cx + CW2, cy2 - CH2/2);
    ctx.stroke();
    ctx.restore();
  }
}

// ─── Noyau central (montant du transfert) ─────────────────────────────────────
function drawQuantumCore(ctx, W, cy, amount, t) {
  const cx = W / 2;
  const CORE_R = 88;

  // Halos concentriques
  [1.8, 1.4, 1.0].forEach((mult, i) => {
    const r = CORE_R * mult;
    const alpha = [0.06, 0.10, 0.15][i];
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    cg.addColorStop(0, t.core + Math.round(alpha * 255).toString(16).padStart(2,"0"));
    cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  });

  // Disque de fond du noyau
  const diskG = ctx.createRadialGradient(cx - CORE_R*0.3, cy - CORE_R*0.3, 0, cx, cy, CORE_R);
  diskG.addColorStop(0, t.card2);
  diskG.addColorStop(0.6, t.card1);
  diskG.addColorStop(1, t.bg2);
  ctx.fillStyle = diskG;
  ctx.beginPath(); ctx.arc(cx, cy, CORE_R, 0, Math.PI*2); ctx.fill();

  // Anneau principal du noyau
  ctx.save();
  ctx.strokeStyle = t.core; ctx.lineWidth = 3.5;
  ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(cx, cy, CORE_R, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // Second anneau
  ctx.save();
  ctx.strokeStyle = t.primary + "60"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, CORE_R - 8, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // Croix de visée dans le noyau
  const crossLen = CORE_R * 0.35;
  ctx.save();
  ctx.strokeStyle = t.tube + "50"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - crossLen, cy); ctx.lineTo(cx + crossLen, cy);
  ctx.moveTo(cx, cy - crossLen); ctx.lineTo(cx, cy + crossLen);
  ctx.stroke();
  ctx.restore();

  // Label "TRANSMIS"
  T(ctx, "TRANSMIS", cx, cy - 38, 11, t.muted, { align:"center", weight:"700" });

  // Montant principal
  const amtStr = fmt(amount);
  ctx.save();
  ctx.font = `900 ${amtStr.length > 8 ? 26 : 32}px QF, "JetBrains Mono", monospace`;
  const mg = ctx.createLinearGradient(cx - 80, cy, cx + 80, cy);
  mg.addColorStop(0, t.primary); mg.addColorStop(0.5, t.gold); mg.addColorStop(1, t.accent);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 28;
  ctx.fillStyle = mg; ctx.fillText(amtStr, cx, cy); ctx.restore();

  // Label "VERIFIED" en bas
  T(ctx, "[  VERIFIED  ]", cx, cy + 38, 10, t.muted, { align:"center", weight:"600" });

  // Petits marqueurs sur le cercle (12h, 3h, 6h, 9h)
  [0, Math.PI/2, Math.PI, -Math.PI/2].forEach(angle => {
    const mx = cx + Math.cos(angle) * CORE_R;
    const my = cy + Math.sin(angle) * CORE_R;
    ctx.save();
    ctx.fillStyle = t.core; ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

// ─── Bande de statut et meta-infos ────────────────────────────────────────────
function drawStatusBar(ctx, W, y, t, themeName, sym) {
  // Fond de bande
  ctx.save();
  ctx.fillStyle = t.card1 + "CC"; ctx.fillRect(0, y, W, 56);
  ctx.strokeStyle = t.border + "66"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
  ctx.restore();

  const now = moment().tz("Asia/Dhaka").format("DD.MM.YYYY  HH:mm");
  T(ctx, `${sym}  ${themeName.toUpperCase()}  //  ${now}  //  CHRISTUS QUANTUM`, W/2, y + 28, 11, t.muted, { align:"center", weight:"700" });
}

// ─── Header de la carte ────────────────────────────────────────────────────────
function drawQuantumHeader(ctx, W, t, sym) {
  // Fond header
  ctx.save();
  ctx.fillStyle = t.card1 + "EE"; ctx.fillRect(0, 0, W, 72);
  ctx.restore();

  // Ligne de séparation basse
  const hl = ctx.createLinearGradient(0, 71, W, 71);
  hl.addColorStop(0, "transparent"); hl.addColorStop(0.5, t.border); hl.addColorStop(1, "transparent");
  ctx.save(); ctx.strokeStyle = hl; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 71); ctx.lineTo(W, 71); ctx.stroke(); ctx.restore();

  // Titrage
  ctx.save();
  const hg = ctx.createLinearGradient(W*0.2, 0, W*0.8, 0);
  hg.addColorStop(0, t.primary); hg.addColorStop(0.5, t.gold); hg.addColorStop(1, t.accent);
  ctx.font = "900 26px QF, 'JetBrains Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = t.coreGlow; ctx.shadowBlur = 20;
  ctx.fillStyle = hg;
  ctx.fillText(`${sym}  TRANSFERT QUANTIQUE  ${sym}`, W/2, 36);
  ctx.restore();
}

// ─── Chargement avatar ────────────────────────────────────────────────────────
async function loadAvatar(uid, name) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=300&height=300&access_token=${FB_TOKEN}`,
      { responseType:"arraybuffer", timeout:8000 }
    );
    return await loadImage(Buffer.from(res.data));
  } catch (_) {
    const cv  = createCanvas(300, 300);
    const c   = cv.getContext("2d");
    const rng = seededRng(uid || "0");
    c.fillStyle = `hsl(${Math.round(rng()*360)},75%,35%)`;
    c.fillRect(0, 0, 300, 300);
    c.fillStyle = "#FFF"; c.font = "bold 110px monospace";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((name||"?").charAt(0).toUpperCase(), 150, 150);
    return await loadImage(cv.toBuffer());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CANVAS PRINCIPAL — 820 × 1100 portrait
//  Layout (haut -> bas) :
//    [72]  Header
//    [16]  gap
//    [200] Station Emetteur
//    [80]  Tube haut + connexion
//    [200] Noyau central (montant)
//    [80]  Tube bas
//    [200] Station Recepteur
//    [16]  gap
//    [56]  Status bar
// ═══════════════════════════════════════════════════════════════════════════════
const CW = 820, CH = 920;

async function buildCanvas(sData, rData, amount, theme) {
  ensureFonts();
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  const seed = String(sData.uid) + String(rData.uid);

  // 1. Fond
  drawQuantumBg(ctx, CW, CH, theme, seed);

  // 2. Header
  drawQuantumHeader(ctx, CW, theme, theme.sym);

  // Layout vertical
  const HEADER_H  = 72;
  const GAP       = 12;
  const STATION_H = 200;
  const TUBE_HALF = 82;
  const CORE_H    = 180;

  const S_SENDER_Y = HEADER_H + GAP;
  const TUBE_TOP   = S_SENDER_Y + STATION_H;
  const CORE_CY    = TUBE_TOP + TUBE_HALF + CORE_H / 2 - 10;
  const TUBE_BOT   = CORE_CY + CORE_H / 2 + 10;
  const S_RECV_Y   = TUBE_BOT + TUBE_HALF - 20;
  const STATUS_Y   = S_RECV_Y + STATION_H + GAP;

  // 3. Tube de données (dessiné avant les stations pour qu il soit en dessous)
  drawQuantumTube(ctx, CW, TUBE_TOP, TUBE_BOT, theme, seed);

  // 4. Station envoyeur
  const sImg = await loadAvatar(sData.uid, sData.name);
  await drawStation(ctx, CW, theme, CW/2, S_SENDER_Y, sImg, sData.name, sData.newBalance, "sender", seed + "s");

  // 5. Station recepteur
  const rImg = await loadAvatar(rData.uid, rData.name);
  await drawStation(ctx, CW, theme, CW/2, S_RECV_Y, rImg, rData.name, rData.newBalance, "receiver", seed + "r");

  // 6. Noyau central
  drawQuantumCore(ctx, CW, CORE_CY, amount, theme);

  // 7. Status bar
  drawStatusBar(ctx, CW, STATUS_Y, theme, theme.name, theme.sym);

  return canvas;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name:        "give",
    aliases:     ["gift","donate","don","send"],
    version:     "4.0",
    author:      "Christus",
    countDown:   5,
    role:        0,
    description: { fr: "◈ Give Quantum v4 — Transmission quantique, 20 themes, format portrait." },
    category:    "economy",
    guide: {
      fr: [
        "GIVE QUANTUM",
        "",
        "  give @user <montant>  — Envoyer de l argent",
        "  give @user 500",
        "  give @user 1k",
        "  give @user 2.5m",
        "  give @user 1b",
        "",
        "  give themes           — Liste des 20 themes",
        "  give theme <1-20>     — Choisir un theme",
        "",
        "  Suffixes : k m b t q",
        "  Sans taxe  //  Transmission instantanee",
      ].join("\n"),
    },
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID, mentions, messageReply } = event;
    const cmd = args[0]?.toLowerCase();

    // ─── THEMES ──────────────────────────────────────────────────────────────
    if (cmd === "themes" || (cmd === "theme" && !args[1]?.match(/^\d+$/) && !Object.keys(THEMES).includes(args[1]?.toLowerCase()))) {
      const keys = Object.keys(THEMES);
      let txt = `GIVE QUANTUM — 20 THEMES\n${"─".repeat(28)}\n`;
      keys.forEach((k, i) => { txt += `${i+1}. ${THEMES[k].sym}  ${THEMES[k].name}\n`; });
      txt += `\ngive theme <numero> pour appliquer.`;
      return message.reply(txt);
    }

    if (cmd === "theme" && args[1]) {
      const keys = Object.keys(THEMES);
      const n = parseInt(args[1]);
      const key = (!isNaN(n) && n >= 1 && n <= keys.length)
        ? keys[n-1] : args[1].toLowerCase();
      if (THEMES[key]) {
        const ud = await usersData.get(senderID);
        ud.giveQuantumTheme = key;
        await usersData.set(senderID, ud);
        return message.reply(`Theme applique : ${THEMES[key].sym}  ${THEMES[key].name}`);
      }
      return message.reply("Theme introuvable. Tapez give themes pour la liste.");
    }

    // ─── Cible + montant ─────────────────────────────────────────────────────
    let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
    const amountArg = args.find(a => /^[\d,.]+[kmbtq]?$/i.test(a));
    const amount    = parseAmount(amountArg);

    if (!targetID) {
      return message.reply(
        `GIVE QUANTUM — UTILISATION\n${"─".repeat(22)}\n` +
        `give @utilisateur <montant>\n\n` +
        `Exemples :\n  give @Jean 500\n  give @Marie 1k\n  give @Paul 2.5m`
      );
    }
    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        `MONTANT INVALIDE\n${"─".repeat(18)}\nUtilisez : 500  1k  2.5m  1b`
      );
    }
    if (targetID === senderID) {
      return message.reply("Vous ne pouvez pas vous envoyer de l argent.");
    }

    // ─── Donnees ─────────────────────────────────────────────────────────────
    const [senderData, receiverData] = await Promise.all([
      usersData.get(senderID),
      usersData.get(targetID),
    ]);
    if (!receiverData) return message.reply("Utilisateur destinataire introuvable.");

    const sMoney = senderData.money || 0;
    if (sMoney < amount) {
      return message.reply(
        `FONDS INSUFFISANTS\n${"─".repeat(20)}\n` +
        `Votre solde   : ${fmt(sMoney)}\n` +
        `Montant voulu : ${fmt(amount)}\n` +
        `Manque        : ${fmt(amount - sMoney)}`
      );
    }

    // ─── Transaction ─────────────────────────────────────────────────────────
    const newSMoney = sMoney - amount;
    const newRMoney = (receiverData.money || 0) + amount;
    await Promise.all([
      usersData.set(senderID, { money: newSMoney }),
      usersData.set(targetID, { money: newRMoney }),
    ]);

    let senderName = senderData.name || `User_${senderID}`;
    let receiverName = receiverData.name || `User_${targetID}`;
    try {
      const fbInfo = await api.getUserInfo([senderID, targetID]);
      senderName   = fbInfo[senderID]?.name  || senderName;
      receiverName = fbInfo[targetID]?.name   || receiverName;
    } catch (_) {}

    // ─── Fallback texte ───────────────────────────────────────────────────────
    if (!canvasAvailable) {
      return message.reply(
        `TRANSFERT REUSSI\n${"─".repeat(22)}\n` +
        `De     : ${senderName}\n` +
        `Vers   : ${receiverName}\n` +
        `Montant: ${fmt(amount)}\n${"─".repeat(22)}\n` +
        `${senderName.slice(0,12)} : ${fmt(newSMoney)}\n` +
        `${receiverName.slice(0,12)}: ${fmt(newRMoney)}`
      );
    }

    // ─── Theme ───────────────────────────────────────────────────────────────
    const themeKeys = Object.keys(THEMES);
    const senderUD  = await usersData.get(senderID).catch(() => ({}));
    let themeKey    = senderUD?.giveQuantumTheme && THEMES[senderUD.giveQuantumTheme]
      ? senderUD.giveQuantumTheme
      : themeKeys[Math.floor(Math.random() * themeKeys.length)];
    for (const a of args) {
      const n = parseInt(a);
      if (!isNaN(n) && n >= 1 && n <= themeKeys.length) { themeKey = themeKeys[n-1]; break; }
      if (themeKeys.includes(a.toLowerCase())) { themeKey = a.toLowerCase(); break; }
    }
    const theme = THEMES[themeKey];

    // ─── Rendu canvas ─────────────────────────────────────────────────────────
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
    const outPath = path.join(cacheDir, `give_${senderID}_${Date.now()}.png`);

    const cvs = await buildCanvas(
      { uid: senderID,   name: senderName,   newBalance: newSMoney },
      { uid: targetID,   name: receiverName, newBalance: newRMoney },
      amount, theme
    );
    fs.writeFileSync(outPath, cvs.toBuffer("image/png"));

    const sTier = getTier(newSMoney);
    const rTier = getTier(newRMoney);
    const body  = [
      `TRANSFERT QUANTIQUE REUSSI`,
      `${"─".repeat(26)}`,
      `De      : ${senderName}`,
      `Vers    : ${receiverName}`,
      `Montant : ${fmt(amount)}`,
      `${"─".repeat(26)}`,
      `${senderName.slice(0,14)} : ${fmt(newSMoney)}  ${sTier.sym}`,
      `${receiverName.slice(0,14)}: ${fmt(newRMoney)}  ${rTier.sym}`,
      `Theme   : ${theme.sym} ${theme.name}`,
    ].join("\n");

    await message.reply({ body, attachment: fs.createReadStream(outPath) });
    setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30_000);
  },
};
