"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  RANK CELESTIAL v21 — Carte stellaire personnelle, design entièrement repensé
//  Auteur   : Christus
//  Concept  : l'utilisateur devient une étoile centrale entourée de ses propres
//             planètes-statistiques en orbite, reliées par des lignes de
//             constellation — totalement différent de la v20 (Pass VIP)
//  Canvas   : 1500 × 850 px
// ═══════════════════════════════════════════════════════════════════════════════

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const moment = require("moment-timezone");

let fonts;
try { fonts = require("../../func/font.js"); } catch (_) {}

// ─── Polices (chargement différé et défensif) ─────────────────────────────────
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded || !canvasAvailable || !registerFont) return;
  fontsLoaded = true;
  try {
    if (typeof __dirname !== "string") return;
    const fd = path.join(__dirname, "assets", "font");
    if (!fs.existsSync(fd)) return;
    const fontFiles = [
      ["BeVietnamPro-Bold.ttf",    "RF", "bold"],
      ["BeVietnamPro-Regular.ttf", "RF", "normal"],
      ["BeVietnamPro-SemiBold.ttf","RF", "600"],
      ["NotoSans-Bold.ttf",        "RF", "bold"],
      ["NotoSans-Regular.ttf",     "RF", "normal"],
    ];
    for (const [f, fam, w] of fontFiles) {
      try {
        if (typeof f !== "string") continue;
        const fp = path.join(fd, f);
        if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
      } catch (_) {}
    }
  } catch (_) {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y); ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr); ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h); ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl); ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y); ctx.closePath();
}
function expToLevel(exp) { return Math.floor((1 + Math.sqrt(1 + (8 * exp) / 5)) / 2); }
function levelToExp(l)   { return Math.floor(((l ** 2 - l) * 5) / 2); }
function fmt(n) {
  if (!n || isNaN(n) || !Number.isFinite(n)) return "0";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e12) return `${s}${(a/1e12).toFixed(2)}T`;
  if (a >= 1e9)  return `${s}${(a/1e9).toFixed(2)}B`;
  if (a >= 1e6)  return `${s}${(a/1e6).toFixed(2)}M`;
  if (a >= 1e3)  return `${s}${(a/1e3).toFixed(1)}K`;
  return `${s}${Math.round(a)}`;
}
const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

// ═══════════════════════════════════════════════════════════════════════════════
//  20 THÈMES — cartes stellaires, chacun avec sa propre teinte de nébuleuse
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  nebuleuse_doree:    { name:"Nébuleuse Dorée",    primary:"#D4AF6A", glowC:"#F4E4BC", bg1:"#0A0704", bg2:"#120D08", neb1:"212,175,106", neb2:"255,220,150" },
  amas_azure:         { name:"Amas Azuré",          primary:"#5FA8E8", glowC:"#B8DAFF", bg1:"#020610", bg2:"#081020", neb1:"95,168,232",  neb2:"150,200,255" },
  voie_pourpre:       { name:"Voie Pourpre",        primary:"#B873D9", glowC:"#E8C8FF", bg1:"#0A0414", bg2:"#160828", neb1:"184,115,217", neb2:"230,180,255" },
  comete_emeraude:    { name:"Comète Émeraude",     primary:"#5FD9A0", glowC:"#B8FFD8", bg1:"#020A06", bg2:"#081410", neb1:"95,217,160",  neb2:"180,255,210" },
  supernova_corail:   { name:"Supernova Corail",    primary:"#E87F5F", glowC:"#FFC8A8", bg1:"#100502", bg2:"#1E0A05", neb1:"232,127,95",  neb2:"255,180,140" },
  eclipse_argentee:   { name:"Éclipse Argentée",    primary:"#C8D4E0", glowC:"#F0F4F8", bg1:"#060708", bg2:"#0C0E10", neb1:"200,212,224", neb2:"230,240,250" },
  pulsar_cramoisi:    { name:"Pulsar Cramoisi",     primary:"#D94060", glowC:"#FFA8C0", bg1:"#100208", bg2:"#1E0410", neb1:"217,64,96",   neb2:"255,150,180" },
  quasar_jaune:       { name:"Quasar Jaune",        primary:"#E0C040", glowC:"#FFEFA0", bg1:"#0E0A02", bg2:"#1A1404", neb1:"224,192,64",  neb2:"255,230,150" },
  brume_glaciaire:    { name:"Brume Glaciaire",     primary:"#7FE0E8", glowC:"#C8FFFF", bg1:"#020A0E", bg2:"#08161A", neb1:"127,224,232", neb2:"180,255,255" },
  astre_carmin:       { name:"Astre Carmin",        primary:"#C83838", glowC:"#FF9090", bg1:"#100404", bg2:"#1E0808", neb1:"200,56,56",   neb2:"255,140,140" },
  constellation_jade: { name:"Constellation Jade",  primary:"#40C090", glowC:"#A0F0D0", bg1:"#020E0A", bg2:"#081C14", neb1:"64,192,144",  neb2:"160,240,210" },
  voile_lavande:      { name:"Voile Lavande",       primary:"#9890E0", glowC:"#D0CCFF", bg1:"#08060E", bg2:"#100A1C", neb1:"152,144,224", neb2:"208,204,255" },
  horizon_ambre:      { name:"Horizon Ambre",       primary:"#E0A040", glowC:"#FFD890", bg1:"#0E0802", bg2:"#1C1004", neb1:"224,160,64",  neb2:"255,216,144" },
  zenith_cyan:        { name:"Zénith Cyan",         primary:"#40D0E0", glowC:"#A0F0FF", bg1:"#020C0E", bg2:"#08181C", neb1:"64,208,224",  neb2:"160,240,255" },
  aurore_rosee:       { name:"Aurore Rosée",        primary:"#E090B0", glowC:"#FFD0E0", bg1:"#0E0408", bg2:"#1C0810", neb1:"224,144,176", neb2:"255,208,224" },
  vortex_indigo:      { name:"Vortex Indigo",       primary:"#6050D0", glowC:"#B0A0FF", bg1:"#06041A", bg2:"#0C0830", neb1:"96,80,208",   neb2:"176,160,255" },
  marais_phosphore:   { name:"Marais Phosphoré",    primary:"#90E040", glowC:"#D0FFA0", bg1:"#060E02", bg2:"#0C1C04", neb1:"144,224,64",  neb2:"208,255,160" },
  crepuscule_violet:  { name:"Crépuscule Violet",   primary:"#A050C0", glowC:"#E0A0FF", bg1:"#0A0414", bg2:"#140828", neb1:"160,80,192",  neb2:"224,160,255" },
  etoile_polaire:     { name:"Étoile Polaire",      primary:"#E0E8F0", glowC:"#FFFFFF", bg1:"#060810", bg2:"#0C1020", neb1:"224,232,240", neb2:"255,255,255" },
  nova_safran:        { name:"Nova Safran",         primary:"#E8A030", glowC:"#FFD080", bg1:"#0E0800", bg2:"#1C1000", neb1:"232,160,48",  neb2:"255,208,128" },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES DE DESSIN
// ═══════════════════════════════════════════════════════════════════════════════
function T(ctx, s, x, y, sz, color, { align="left", weight="bold", glow=null, alpha=1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${sz}px RF, Georgia, serif`;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 14; }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}
function GL(ctx, x1, y1, x2, y2, color, w = 1.2) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, "transparent"); g.addColorStop(0.5, color); g.addColorStop(1, "transparent");
  ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

// ─── Fond carte céleste : étoiles + grille de coordonnées + nébuleuses ───────
function drawCelestialBg(ctx, W, H, t) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, t.bg1); grad.addColorStop(0.6, t.bg2); grad.addColorStop(1, t.bg1);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Nébuleuses douces
  [[W * 0.25, H * 0.2, t.neb1, 420], [W * 0.85, H * 0.85, t.neb2, 360]].forEach(([gx, gy, c, r]) => {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, `rgba(${c},0.10)`); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });

  // Grille de coordonnées célestes (ascension droite / déclinaison) — très subtile
  ctx.save();
  ctx.strokeStyle = `rgba(${t.neb1},0.05)`; ctx.lineWidth = 0.6;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  // Champ d'étoiles (taille/luminosité variées, seedé pour stabilité visuelle)
  const seed = (s) => () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
  const rnd = seed(4242);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * H;
    const r = rnd() * 1.4 + 0.3;
    const alpha = rnd() * 0.7 + 0.15;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Quelques étoiles plus brillantes avec halo
  for (let i = 0; i < 14; i++) {
    const x = rnd() * W, y = rnd() * H;
    ctx.save();
    ctx.shadowColor = t.primary; ctx.shadowBlur = 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ─── Étoile centrale (avatar) avec rayons et halo de magnitude ──────────────
async function drawCentralStar(ctx, avatarPath, cx, cy, R, level, t) {
  // Halo de magnitude (plus le niveau est élevé, plus le halo est large)
  const haloR = R + 30 + Math.min(level * 1.5, 60);
  const haloG = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, haloR);
  haloG.addColorStop(0, `${t.primary}55`); haloG.addColorStop(1, "transparent");
  ctx.fillStyle = haloG;
  ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2); ctx.fill();

  // Rayons stellaires (8 branches)
  ctx.save();
  ctx.strokeStyle = t.primary; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const rayLen = R + 20 + (i % 2 === 0 ? 14 : 0);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6));
    ctx.lineTo(cx + Math.cos(a) * rayLen, cy + Math.sin(a) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // Anneaux orbitaux fins autour de l'avatar
  [0, 1].forEach(i => {
    ctx.save();
    ctx.strokeStyle = t.primary + (i === 0 ? "90" : "40"); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 10 + i * 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  });

  // Avatar circulaire
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  if (avatarPath) {
    try {
      const img = await loadImage(avatarPath);
      ctx.drawImage(img, cx - R, cy - R, R * 2, R * 2);
    } catch (_) { drawStarFallback(ctx, cx, cy, R, "?", t); }
  } else {
    drawStarFallback(ctx, cx, cy, R, "?", t);
  }
  ctx.restore();

  // Contour
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = t.primary; ctx.lineWidth = 3;
  ctx.shadowColor = t.glowC; ctx.shadowBlur = 20;
  ctx.stroke(); ctx.restore();
}
function drawStarFallback(ctx, cx, cy, R, init, t) {
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  bg.addColorStop(0, t.primary + "CC"); bg.addColorStop(1, t.glowC + "55");
  ctx.fillStyle = bg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  T(ctx, init.toUpperCase(), cx, cy, R * 0.7, "#FFF", { align: "center" });
}

// ─── Anneau de phase lunaire (progression XP) ───────────────────────────────
function drawLunarPhaseRing(ctx, cx, cy, R, pct, t) {
  // Disque de fond (nouvelle lune = sombre)
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fill();
  ctx.strokeStyle = t.primary + "60"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Phase illuminée façon croissant de lune (arc proportionnel à pct)
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * pct;
  ctx.save();
  ctx.shadowColor = t.glowC; ctx.shadowBlur = 12;
  ctx.strokeStyle = t.primary; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(cx, cy, R, startAngle, endAngle); ctx.stroke();
  ctx.restore();

  // Petit point lumineux à l'extrémité de la phase
  const tipX = cx + Math.cos(endAngle) * R;
  const tipY = cy + Math.sin(endAngle) * R;
  ctx.save();
  ctx.fillStyle = t.glowC; ctx.shadowColor = t.glowC; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── Planète-statistique en orbite, reliée par une ligne de constellation ──
function drawOrbitPlanet(ctx, centerX, centerY, planetX, planetY, radius, sym, label, val, t, dashed = true) {
  // Ligne de constellation (pointillée, façon carte ancienne)
  ctx.save();
  ctx.strokeStyle = t.primary + "50"; ctx.lineWidth = 1;
  if (dashed) ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(planetX, planetY); ctx.stroke();
  ctx.restore();

  // Orbite faible (cercle pointillé complet, visuel discret)
  // (dessiné séparément au niveau du système, pas ici)

  // Planète (disque avec halo)
  ctx.save();
  const pg = ctx.createRadialGradient(planetX - radius*0.3, planetY - radius*0.3, 0, planetX, planetY, radius);
  pg.addColorStop(0, t.glowC); pg.addColorStop(1, t.primary);
  ctx.shadowColor = t.primary; ctx.shadowBlur = 14;
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(planetX, planetY, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = t.glowC + "90"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(planetX, planetY, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Symbole au centre de la planète
  T(ctx, sym, planetX, planetY, radius * 0.85, t.bg1, { align: "center", weight: "900" });

  // Label + valeur à côté (positionné selon le quadrant pour ne jamais chevaucher)
  const isRight = planetX >= centerX;
  const labelX = planetX + (isRight ? radius + 12 : -(radius + 12));
  T(ctx, label, labelX, planetY - 9, 11.5, t.primary, { align: isRight ? "left" : "right", weight: "600", alpha: 0.75 });
  T(ctx, val, labelX, planetY + 10, 16, "#FFFFFF", { align: isRight ? "left" : "right", weight: "800" });
}

// ─── Orbite pointillée complète (cercle guide) ──────────────────────────────
function drawOrbitRing(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color + "25"; ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CANVAS PRINCIPAL — 1500 × 850, layout "CARTE STELLAIRE PERSONNELLE"
// ═══════════════════════════════════════════════════════════════════════════════
const CW = 1500, CH = 850;
const PAD = 30;
const CENTER_X = CW * 0.42;
const CENTER_Y = CH * 0.5;
const STAR_R = 70;
const PANEL_X = CW * 0.74;
const PANEL_W = CW - PANEL_X - PAD;

async function buildCanvas(data, theme, avatarPath) {
  ensureFonts();
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  // ── 1. Fond carte céleste ──────────────────────────────────────────────────
  drawCelestialBg(ctx, CW, CH, theme);

  // ── 2. Cadre extérieur (façon bordure d'atlas ancien) ─────────────────────
  ctx.save();
  ctx.shadowColor = theme.primary; ctx.shadowBlur = 22;
  ctx.strokeStyle = theme.primary; ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, CW - 36, CH - 36);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = theme.primary + "40"; ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, CW - 52, CH - 52);
  ctx.restore();

  // ── 3. Titre en haut ───────────────────────────────────────────────────────
  T(ctx, "◈  CARTE STELLAIRE PERSONNELLE  ◈", CW / 2, 56, 18, theme.primary, { align: "center", weight: "700", alpha: 0.85 });
  T(ctx, theme.name.toUpperCase(), CW / 2, 80, 12, "#FFFFFF", { align: "center", weight: "600", alpha: 0.4 });

  // ── 4. Système orbital ────────────────────────────────────────────────────
  const level = data.level;
  const exp = data.exp, neededExp = data.neededExp;
  const pct = Math.min(exp / neededExp, 1);

  // Orbites guides
  const orbitRadii = [165, 215, 265];
  orbitRadii.forEach(r => drawOrbitRing(ctx, CENTER_X, CENTER_Y, r, theme.primary));

  // Étoile centrale (avatar)
  await drawCentralStar(ctx, avatarPath, CENTER_X, CENTER_Y, STAR_R, level, theme);

  // Anneau de phase lunaire (XP) — juste à l'extérieur des rayons stellaires
  drawLunarPhaseRing(ctx, CENTER_X, CENTER_Y, STAR_R + 46, pct, theme);

  // Nom + niveau sous l'étoile
  T(ctx, data.name.length > 22 ? data.name.slice(0, 20) + "…" : data.name,
    CENTER_X, CENTER_Y + STAR_R + 78, 22, "#FFFFFF", { align: "center", weight: "700" });
  T(ctx, `NIVEAU ${level}  ·  ${(pct * 100).toFixed(1)}% VERS NIV. ${level + 1}`,
    CENTER_X, CENTER_Y + STAR_R + 102, 13, theme.primary, { align: "center", weight: "600" });

  // ── 5. Planètes-statistiques en orbite (6 planètes, 2 par anneau) ────────
  const planets = [
    { sym: "◈", label: "XP TOTAL",   val: fmt(data.totalExp),     orbit: 0, angleDeg: -55 },
    { sym: "◉", label: "ARGENT",     val: fmt(data.money),         orbit: 0, angleDeg: 235 },
    { sym: "◆", label: "MESSAGES",   val: fmt(data.totalMessages), orbit: 1, angleDeg: -20 },
    { sym: "◇", label: "RANG",       val: `#${data.expRank}`,      orbit: 1, angleDeg: 200 },
    { sym: "▲", label: "TOP",        val: `${data.topPercent}%`,   orbit: 2, angleDeg: 15 },
    { sym: "▣", label: "RANG $",     val: `#${data.moneyRank}`,    orbit: 2, angleDeg: 165 },
  ];
  const planetSizes = [22, 19, 16]; // plus grosses sur l'orbite la plus proche

  planets.forEach(p => {
    const r = orbitRadii[p.orbit];
    const a = (p.angleDeg * Math.PI) / 180;
    const px = CENTER_X + Math.cos(a) * r;
    const py = CENTER_Y + Math.sin(a) * r;
    drawOrbitPlanet(ctx, CENTER_X, CENTER_Y, px, py, planetSizes[p.orbit], p.sym, p.label, p.val, theme);
  });

  // ── 6. Panneau latéral droit (résumé synthétique) ─────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  rr(ctx, PANEL_X, 110, PANEL_W, CH - 110 - 60, 14);
  ctx.fill();
  ctx.strokeStyle = theme.primary + "60"; ctx.lineWidth = 1.3;
  rr(ctx, PANEL_X, 110, PANEL_W, CH - 110 - 60, 14); ctx.stroke();
  ctx.restore();

  T(ctx, "◈ EPHÉMÉRIDE", PANEL_X + PANEL_W / 2, 140, 15, theme.primary, { align: "center", weight: "700" });
  GL(ctx, PANEL_X + 20, 160, PANEL_X + PANEL_W - 20, 160, theme.primary, 1);

  // Grand numéro de rang
  ctx.save();
  const rg = ctx.createLinearGradient(PANEL_X, 180, PANEL_X + PANEL_W, 260);
  rg.addColorStop(0, theme.primary); rg.addColorStop(1, theme.glowC);
  ctx.font = "900 64px RF, Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = theme.glowC; ctx.shadowBlur = 24; ctx.fillStyle = rg;
  ctx.fillText(`#${data.expRank}`, PANEL_X + PANEL_W / 2, 225);
  ctx.restore();
  T(ctx, "RANG GLOBAL", PANEL_X + PANEL_W / 2, 268, 11.5, "#FFFFFF", { align: "center", alpha: 0.5, weight: "600" });

  GL(ctx, PANEL_X + 20, 296, PANEL_X + PANEL_W - 20, 296, theme.primary, 1);

  // Détails empilés
  const details = [
    ["Membres observés", String(data.totalUsers)],
    ["XP par jour",       fmt(data.expPerDay)],
    ["Constellation",     theme.name],
  ];
  details.forEach(([lbl, val], i) => {
    const yy = 330 + i * 56;
    T(ctx, lbl, PANEL_X + 20, yy, 12.5, "#FFFFFF", { alpha: 0.55, weight: "600" });
    T(ctx, val, PANEL_X + 20, yy + 22, 18, theme.primary, { weight: "700" });
  });

  // ── 7. Pied de page ────────────────────────────────────────────────────────
  const FOOT_Y = CH - 36;
  GL(ctx, 60, FOOT_Y - 18, CW - 60, FOOT_Y - 18, theme.primary, 1);
  const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY  HH:mm");
  T(ctx, `${theme.name}  ·  Christus  ·  ${now}`, CW / 2, FOOT_Y, 12.5, "#FFFFFF", { align: "center", alpha: 0.4, weight: "600" });

  return canvas;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "rank",
    aliases: ["rk", "classement", "carte"],
    version: "21.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "◈ Rank Celestial — Carte stellaire personnelle avec 20 constellations exclusives.",
    },
    category: "info",
    guide: {
      fr:
        `◈  COMMANDE RANK CELESTIAL\n\n` +
        `Utilisation :\n` +
        `  rank              — Votre carte stellaire\n` +
        `  rank @mention     — Carte d un autre membre\n` +
        `  rank <uid>        — Par ID utilisateur\n` +
        `  rank <1-20>       — Choisir une constellation\n\n` +
        `Commandes speciales :\n` +
        `  rank themes       — Liste des constellations\n\n` +
        `Constellations disponibles :\n` +
        Object.entries(THEMES).map(([k, v], i) => `  ${i + 1}. ${v.name}`).join("\n"),
    },
  },

  onStart: async function ({ message, event, args, usersData, threadsData, api }) {
    if (!canvasAvailable) {
      return message.reply("◈  Canvas non installe. Executez : npm install canvas");
    }

    const { senderID, threadID, mentions, messageReply } = event;
    const command = args[0]?.toLowerCase();

    // ── Commande : themes ──
    if (command === "themes" || command === "list") {
      let txt = `◈  CONSTELLATIONS RANK CELESTIAL\n${"─".repeat(32)}\n`;
      Object.entries(THEMES).forEach(([k, v], i) => {
        txt += `${i + 1}. ${v.name}\n`;
      });
      txt += `\n◆  Utilisez : rank <numero> pour appliquer une constellation.`;
      return message.reply(txt);
    }

    // ── Cible ──
    let targetID = senderID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0] && !isNaN(args[0]) && parseInt(args[0]) > 1000) {
      targetID = args[0];
    }

    // ── Thème ──
    const themeKeys = Object.keys(THEMES);
    const senderUD0 = await usersData.get(senderID).catch(() => ({}));
    let themeKey = senderUD0?.rankConstellation && THEMES[senderUD0.rankConstellation]
      ? senderUD0.rankConstellation
      : themeKeys[Math.floor(Math.random() * themeKeys.length)];
    for (const a of args) {
      const n = parseInt(a);
      if (!isNaN(n) && n >= 1 && n <= themeKeys.length) { themeKey = themeKeys[n - 1]; break; }
      if (themeKeys.includes(a.toLowerCase())) { themeKey = a.toLowerCase(); break; }
    }
    const theme = THEMES[themeKey];

    // Persiste le choix si explicitement demandé via numéro/clé
    const explicitThemeArg = args.find(a => {
      const n = parseInt(a);
      return (!isNaN(n) && n >= 1 && n <= themeKeys.length) || themeKeys.includes(a.toLowerCase());
    });
    if (explicitThemeArg) {
      try {
        const ud = await usersData.get(senderID);
        ud.rankConstellation = themeKey;
        await usersData.set(senderID, ud);
      } catch (_) {}
    }

    // ── Données utilisateur ──
    const [userData, threadData, allUsersData] = await Promise.all([
      usersData.get(targetID).catch(() => null),
      threadsData.get(threadID).catch(() => ({})),
      usersData.getAll().catch(() => []),
    ]);
    if (!userData) return message.reply("◆  Utilisateur introuvable dans la base de donnees.");

    let userInfo = {};
    try {
      const fb = await api.getUserInfo(targetID);
      userInfo = fb[targetID] || {};
    } catch (_) {
      userInfo = { name: userData.name || `User_${targetID}`, vanity: targetID };
    }

    const sortedExp = [...allUsersData].filter(u => u?.exp > 0).sort((a, b) => (b.exp || 0) - (a.exp || 0));
    const expRank = sortedExp.findIndex(u => u.userID === targetID) + 1 || allUsersData.length;
    const sortedMoney = [...allUsersData].filter(u => u?.money > 0).sort((a, b) => (b.money || 0) - (a.money || 0));
    const moneyRank = sortedMoney.findIndex(u => u.userID === targetID) + 1 || allUsersData.length;

    const threadMembers = threadData?.members || [];
    const threadMember = threadMembers.find(m => m?.userID === targetID) || {};

    const exp = userData.exp || 0;
    const level = expToLevel(exp);
    const currentLevelExp = levelToExp(level);
    const nextLevelExp = levelToExp(level + 1);
    const progressExp = Math.max(0, exp - currentLevelExp);
    const neededExp = Math.max(1, nextLevelExp - currentLevelExp);
    const expPerDay = userData.lastActive && (Date.now() - userData.lastActive < 30 * 86400000)
      ? Math.round(exp / 30) : 0;
    const totalUsers = sortedExp.length || allUsersData.length;
    const topPercent = ((totalUsers - expRank + 1) / totalUsers * 100).toFixed(1);

    const renderData = {
      uid: targetID,
      name: userInfo.name || userData.name || "Utilisateur",
      vanity: userInfo.vanity || "",
      level,
      exp: progressExp,
      neededExp,
      totalExp: exp,
      money: userData.money || 0,
      totalMessages: threadMember.count || 0,
      expPerDay,
      expRank,
      moneyRank,
      totalUsers,
      topPercent,
    };

    // ── Avatar via Facebook Graph API ──
    let cacheDir, avatarPath, outPath;
    try {
      cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
      avatarPath = path.join(cacheDir, `rank_av_${Date.now()}.png`);
      outPath = path.join(cacheDir, `rank_out_${Date.now()}.png`);
    } catch (err) {
      return message.reply(`◆  Erreur d acces au dossier cache : ${err.message}`);
    }

    let avatarOK = false;
    try {
      const res = await axios.get(
        `https://graph.facebook.com/${targetID}/picture?width=500&height=500&access_token=${FB_TOKEN}`,
        { responseType: "arraybuffer", timeout: 10000 }
      );
      fs.writeFileSync(avatarPath, Buffer.from(res.data));
      avatarOK = true;
    } catch (_) {}

    // ── Rendu Canvas ──
    const canvas = await buildCanvas(renderData, theme, avatarOK ? avatarPath : null);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    if (avatarOK) try { fs.unlinkSync(avatarPath); } catch (_) {}

    // ── Réponse texte ──
    const isSelf = targetID === senderID;
    const rankMedal = expRank === 1 ? "[ I ]" : expRank === 2 ? "[ II ]" : expRank === 3 ? "[ III ]" : `#${expRank}`;

    const responseText = [
      isSelf ? "◈  VOTRE CARTE STELLAIRE" : `◈  CARTE STELLAIRE — ${renderData.name}`,
      `${"─".repeat(28)}`,
      `◆  Rang global   : ${rankMedal}  (Top ${topPercent}%)`,
      `◈  Niveau        : ${level}`,
      `◉  XP total      : ${fmt(renderData.totalExp)}`,
      `▣  Progression   : ${((progressExp / neededExp) * 100).toFixed(1)}%`,
      `◇  Argent        : ${fmt(renderData.money)}`,
      `▲  Messages      : ${fmt(renderData.totalMessages)}`,
      `◎  Constellation : ${theme.name}`,
    ].join("\n");

    await message.reply({
      body: responseText,
      attachment: fs.createReadStream(outPath),
    });

    setTimeout(() => {
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
    }, 30000);
  },
};
