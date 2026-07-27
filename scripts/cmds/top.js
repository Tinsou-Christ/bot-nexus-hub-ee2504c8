"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  PANTHÉON DES LÉGENDES — Classement ultime, design entièrement repensé
//  Auteur   : Christus
//  Concept  : chaque membre devient une Légende avec sa propre photo de profil
//             sertie dans un blason orbital, un rang en chiffres romains, un
//             palier (Mythique / Épique / Rare / Commun) et une barre de
//             puissance relative — architecture 100% différente de la v4
//             (bourse / chandeliers). 22 sanctuaires (thèmes) exclusifs.
//  Canvas   : 1500 × dynamique
// ═══════════════════════════════════════════════════════════════════════════════

const fonts = require("../../func/font.js");

// Applique automatiquement fonts.bold à toutes les réponses (police stylisée)
function _applyPolice(message) {
  if (!message || message.__police) return;
  message.__police = true;
  const _origReply = message.reply.bind(message);
  message.reply = (form, ...rest) => {
    if (typeof form === "string") form = fonts.bold(form);
    else if (form && typeof form === "object" && typeof form.body === "string")
      form = { ...form, body: fonts.bold(form.body) };
    return _origReply(form, ...rest);
  };
}

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage       = cv.loadImage;
  createCanvas    = cv.createCanvas;
  registerFont    = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const moment = require("moment-timezone");

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

// ─── Polices (chargement différé et défensif) ────────────────────────────────
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded || !canvasAvailable || !registerFont) return;
  fontsLoaded = true;
  try {
    if (typeof __dirname !== "string") return;
    const fd = path.join(__dirname, "assets", "font");
    if (!fs.existsSync(fd)) return;
    const fontFiles = [
      ["BeVietnamPro-Bold.ttf",     "PF", "bold"],
      ["BeVietnamPro-Regular.ttf",  "PF", "normal"],
      ["BeVietnamPro-SemiBold.ttf", "PF", "600"],
      ["NotoSans-Bold.ttf",         "PF", "bold"],
      ["NotoSans-Regular.ttf",      "PF", "normal"],
    ];
    for (const [f, fam, w] of fontFiles) {
      try {
        const fp = path.join(fd, f);
        if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
      } catch (_) {}
    }
  } catch (_) {}
}

// ─── Primitives ───────────────────────────────────────────────────────────────
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

function T(ctx, s, x, y, sz, color, { align = "left", weight = "bold", glow = null, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${sz}px PF, "Segoe UI", Arial`;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 14; }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}

function fitText(ctx, text, maxWidth, size, weight = "700") {
  ctx.font = `${weight} ${size}px PF, Arial`;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  n = Number(n);
  if (!isFinite(n)) return "$∞";
  const s = n < 0 ? "-" : "";
  const a = Math.abs(n);
  const S = [{ v: 1e12, s: "T" }, { v: 1e9, s: "B" }, { v: 1e6, s: "M" }, { v: 1e3, s: "K" }];
  const sc = S.find(x => a >= x.v);
  if (sc) return `${s}$${(a / sc.v).toFixed(2).replace(/\.00$/, "")}${sc.s}`;
  return `${s}$${Math.round(a)}`;
}

function romanNumeral(n) {
  const map = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let r = "", v = n;
  for (const [val, sym] of map) { while (v >= val) { r += sym; v -= val; } }
  return r || "0";
}

function seededRandom(seedStr) {
  let s = 0;
  for (const c of String(seedStr)) s = (s * 31 + c.charCodeAt(0)) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// ─── Palier de légende (indépendant du thème) ─────────────────────────────────
function tierFor(rank, total) {
  if (rank <= 3)   return { label: "LÉGENDE",  sym: "❖" };
  const pct = rank / Math.max(1, total);
  if (pct <= 0.05) return { label: "MYTHIQUE", sym: "✦" };
  if (pct <= 0.15) return { label: "ÉPIQUE",   sym: "◆" };
  if (pct <= 0.40) return { label: "RARE",     sym: "◈" };
  return               { label: "COMMUN",   sym: "◇" };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  22 SANCTUAIRES — chaque thème = palette + particule + sigil, un seul moteur
//  de rendu partagé (fond nébuleux paramétrable) pour une identité forte sans
//  jamais répéter le même sanctuaire deux fois.
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  obsidienne_royale:  { name:"Obsidienne Royale",   sigil:"❖", particle:"sparks",  bg1:"#0A0705", bg2:"#140D08", neb1:"212,175,90",  neb2:"255,220,150", primary:"#D4AF5A", secondary:"#8A6A2E", accent:"#F4E4BC", text:"#F5ECD8", glow:"#D4AF5A", bar:["#5A4318","#D4AF5A","#F4E4BC"] },
  neo_tokyo:          { name:"Néo Tokyo",           sigil:"⟡", particle:"cyber",   bg1:"#050510", bg2:"#0C0C1C", neb1:"0,255,255",   neb2:"255,0,128",   primary:"#00E5FF", secondary:"#FF2AA0", accent:"#7B2FFF", text:"#EAF9FF", glow:"#00E5FF", bar:["#FF2AA0","#7B2FFF","#00E5FF"] },
  empire_galactique:  { name:"Empire Galactique",   sigil:"✦", particle:"stars",   bg1:"#050214", bg2:"#0C0824", neb1:"150,90,230",  neb2:"90,110,240",  primary:"#A855F7", secondary:"#6366F1", accent:"#EC4899", text:"#F2ECFF", glow:"#A855F7", bar:["#4338CA","#A855F7","#EC4899"] },
  couronne_aurore:    { name:"Couronne Aurore",     sigil:"❆", particle:"stars",   bg1:"#010A10", bg2:"#071A1C", neb1:"0,230,150",   neb2:"0,180,255",   primary:"#00E6A0", secondary:"#00B4FF", accent:"#8800FF", text:"#EAFFF6", glow:"#00E6A0", bar:["#0088AA","#00E6A0","#B4FF00"] },
  dynastie_doree:     { name:"Dynastie Dorée",      sigil:"◆", particle:"sparks",  bg1:"#150E00", bg2:"#241A00", neb1:"255,190,50",  neb2:"255,230,150", primary:"#FFC93D", secondary:"#FF8F00", accent:"#FFE9A8", text:"#FFF6DE", glow:"#FFC93D", bar:["#B8860B","#FFC93D","#FFF176"] },
  rose_minuit:        { name:"Rose de Minuit",      sigil:"✤", particle:"petals",  bg1:"#100008", bg2:"#1E0012", neb1:"180,20,90",   neb2:"255,60,140",  primary:"#FF3D8A", secondary:"#B8005A", accent:"#FF9FC8", text:"#FFE4F0", glow:"#FF3D8A", bar:["#5A0030","#B8005A","#FF3D8A"] },
  palais_de_glace:    { name:"Palais de Glace",     sigil:"❄", particle:"snow",    bg1:"#040E16", bg2:"#0A1C2A", neb1:"120,200,255", neb2:"200,240,255", primary:"#5FC8FF", secondary:"#B8E8FF", accent:"#FFFFFF", text:"#EAF7FF", glow:"#5FC8FF", bar:["#0D4C7A","#5FC8FF","#EAFBFF"] },
  flamme_ardente:     { name:"Flamme Ardente",      sigil:"▲", particle:"embers",  bg1:"#0E0300", bg2:"#1E0800", neb1:"255,80,0",    neb2:"255,180,0",   primary:"#FF5A1F", secondary:"#FF9500", accent:"#FFD24D", text:"#FFF1E6", glow:"#FF5A1F", bar:["#7A1E00","#FF5A1F","#FFD24D"] },
  prisme_holo:        { name:"Prisme Holographique",sigil:"✧", particle:"prism",   bg1:"#0A0A12", bg2:"#141020", neb1:"255,80,200",  neb2:"80,220,255",  primary:"#FF66CC", secondary:"#66CCFF", accent:"#B266FF", text:"#F5EEFF", glow:"#FF66CC", bar:["#FF006E","#7C00FF","#00CCFF"] },
  pharaon_eternel:    { name:"Pharaon Éternel",     sigil:"𓂀", particle:"hiero",   bg1:"#120A02", bg2:"#221604", neb1:"255,200,60",  neb2:"200,140,30",  primary:"#DAA520", secondary:"#8B5A18", accent:"#FFD700", text:"#FFF3D6", glow:"#DAA520", bar:["#5A3A0E","#DAA520","#FFD700"] },
  brume_fantome:      { name:"Brume Fantôme",       sigil:"◈", particle:"fog",     bg1:"#0A0A0C", bg2:"#141418", neb1:"150,150,170", neb2:"200,190,230", primary:"#9C9CB8", secondary:"#5C5C74", accent:"#D8D0F0", text:"#EDEDF5", glow:"#9C9CB8", bar:["#3A3A4A","#9C9CB8","#D8D0F0"] },
  jardin_sakura:      { name:"Jardin Sakura",       sigil:"❁", particle:"petals",  bg1:"#1A0810", bg2:"#2A0F1A", neb1:"255,150,190", neb2:"255,210,225", primary:"#FF7FAE", secondary:"#FFB3D1", accent:"#FFE3EE", text:"#3D0026", glow:"#FF7FAE", bar:["#C2185B","#FF7FAE","#FFD6E8"] },
  abysse_marine:      { name:"Abysse Marine",       sigil:"◑", particle:"stars",   bg1:"#010A0E", bg2:"#031824", neb1:"0,150,180",   neb2:"0,90,140",    primary:"#00C2D6", secondary:"#0077A8", accent:"#7FFFE0", text:"#E0FBFF", glow:"#00C2D6", bar:["#00344A","#00C2D6","#7FFFE0"] },
  eclipse_cramoisie:  { name:"Éclipse Cramoisie",   sigil:"⬧", particle:"embers",  bg1:"#0C0202", bg2:"#1A0404", neb1:"200,30,40",   neb2:"120,10,20",   primary:"#E0303F", secondary:"#8C1520", accent:"#FF7080", text:"#FFE8EA", glow:"#E0303F", bar:["#4A0810","#E0303F","#FF8C99"] },
  nova_celeste:       { name:"Nova Céleste",        sigil:"✶", particle:"stars",   bg1:"#08080C", bg2:"#101018", neb1:"255,255,255", neb2:"230,200,150", primary:"#FFFFFF", secondary:"#FFD98A", accent:"#FFF3D0", text:"#FFFFFF", glow:"#FFE9B0", bar:["#8A7A50","#FFD98A","#FFFFFF"] },
  jade_imperiale:     { name:"Jade Impériale",      sigil:"❖", particle:"sparks",  bg1:"#020E0A", bg2:"#061C14", neb1:"60,200,140",  neb2:"200,255,150", primary:"#3FCB93", secondary:"#1E8A5C", accent:"#B6FFDE", text:"#E6FFF2", glow:"#3FCB93", bar:["#0F4A32","#3FCB93","#D4FFEA"] },
  vortex_indigo:      { name:"Vortex Indigo",       sigil:"✦", particle:"stars",   bg1:"#06041A", bg2:"#0C0830", neb1:"96,80,208",   neb2:"176,160,255", primary:"#6C5CE7", secondary:"#463398", accent:"#C4B8FF", text:"#EDEAFF", glow:"#6C5CE7", bar:["#2E2266","#6C5CE7","#C4B8FF"] },
  desert_ambre:       { name:"Désert Ambré",        sigil:"◆", particle:"hiero",   bg1:"#140C02", bg2:"#241A04", neb1:"224,160,64",  neb2:"255,216,144", primary:"#E0A040", secondary:"#8A5A18", accent:"#FFD890", text:"#FFF3DC", glow:"#E0A040", bar:["#5A3A0E","#E0A040","#FFD890"] },
  cristal_amethyste:  { name:"Cristal Améthyste",   sigil:"✧", particle:"sparks",  bg1:"#0A0414", bg2:"#160828", neb1:"184,115,217", neb2:"230,180,255", primary:"#B873D9", secondary:"#7A3D9E", accent:"#EFCBFF", text:"#F6E8FF", glow:"#B873D9", bar:["#4A1E63","#B873D9","#EFCBFF"] },
  foret_emeraude:     { name:"Forêt Émeraude",      sigil:"❁", particle:"petals",  bg1:"#020E06", bg2:"#081C10", neb1:"64,192,120",  neb2:"170,255,190", primary:"#3EBF74", secondary:"#1F6E3F", accent:"#B8FFD0", text:"#E4FFEE", glow:"#3EBF74", bar:["#0E3A20","#3EBF74","#B8FFD0"] },
  tempete_argentee:   { name:"Tempête Argentée",    sigil:"❄", particle:"snow",    bg1:"#08090C", bg2:"#10141A", neb1:"180,200,224", neb2:"230,240,250", primary:"#C8D4E0", secondary:"#748394", accent:"#F0F6FA", text:"#EEF3F8", glow:"#C8D4E0", bar:["#3A4650","#C8D4E0","#F0F6FA"] },
  solstice_pourpre:   { name:"Solstice Pourpre",    sigil:"✤", particle:"embers",  bg1:"#0E0212", bg2:"#1E0424", neb1:"180,40,200",  neb2:"255,100,220", primary:"#C43DD0", secondary:"#7A1E8A", accent:"#FF8FE8", text:"#FBE6FF", glow:"#C43DD0", bar:["#4A0E54","#C43DD0","#FF8FE8"] },
  ocre_immortel:      { name:"Ocre Immortel",       sigil:"𓋴", particle:"hiero",   bg1:"#100A00", bg2:"#1E1400", neb1:"220,150,40",  neb2:"255,210,120", primary:"#D89830", secondary:"#7A5010", accent:"#FFDF9E", text:"#FFF2D6", glow:"#D89830", bar:["#4A3008","#D89830","#FFDF9E"] },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MOTEUR DE FOND — un seul générateur nébuleux paramétrable par thème
// ═══════════════════════════════════════════════════════════════════════════════
function drawSanctuaryBg(ctx, W, H, t) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, t.bg1); grad.addColorStop(0.55, t.bg2); grad.addColorStop(1, t.bg1);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  [[W * 0.22, H * 0.18, t.neb1, 460], [W * 0.82, H * 0.85, t.neb2, 400], [W * 0.55, H * 0.5, t.neb1, 320]].forEach(([gx, gy, c, r]) => {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, `rgba(${c},0.12)`); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });

  ctx.save();
  ctx.strokeStyle = `rgba(${t.neb1},0.05)`; ctx.lineWidth = 0.6;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  const rnd = seededRandom("sanctuary_stars");
  for (let i = 0; i < 180; i++) {
    const x = rnd() * W, y = rnd() * H, r = rnd() * 1.3 + 0.3, a = rnd() * 0.6 + 0.15;
    ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
  vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// ─── Particules thématiques ───────────────────────────────────────────────────
function drawParticles(ctx, W, H, t) {
  ctx.save();
  const rnd = seededRandom("particles_" + t.name);
  switch (t.particle) {
    case "cyber":
      for (let i = 0; i < 30; i++) {
        const x = rnd() * W, y = rnd() * H, len = 12 + rnd() * 50;
        ctx.strokeStyle = `rgba(0,255,255,${0.08 + rnd() * 0.2})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
      }
      break;
    case "sparks":
      for (let i = 0; i < 40; i++) {
        const x = rnd() * W, y = rnd() * H, r = 0.6 + rnd() * 1.8;
        ctx.beginPath(); ctx.fillStyle = t.accent; ctx.shadowColor = t.primary; ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.3 + rnd() * 0.5; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case "petals":
      for (let i = 0; i < 22; i++) {
        const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 16;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, t.accent + "55"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      break;
    case "snow":
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H, r = 0.8 + rnd() * 2.2;
        ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.5})`; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case "embers":
      for (let i = 0; i < 50; i++) {
        const x = rnd() * W, y = rnd() * H;
        ctx.beginPath(); ctx.fillStyle = `rgba(255,${120 + Math.floor(rnd() * 120)},0,${0.3 + rnd() * 0.5})`;
        ctx.arc(x, y, 1 + rnd() * 2.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case "prism":
      for (let i = 0; i < 26; i++) {
        const x = rnd() * W, y = rnd() * H, r = 10 + rnd() * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,0.10)"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      break;
    case "hiero":
      const glyphs = ["𓂀","𓅱","𓆣","𓇯","𓊖","𓋴","𓌀","𓍢","𓎛","☥","𓏏"];
      ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.fillStyle = `rgba(${t.neb1},0.06)`;
      for (let r2 = 0; r2 < H; r2 += 70) for (let c2 = 0; c2 < W; c2 += 70) {
        ctx.fillText(glyphs[Math.floor(rnd() * glyphs.length)], c2, r2);
      }
      break;
    case "fog":
      for (let i = 0; i < 8; i++) {
        const x = rnd() * W, y = rnd() * H, r = 120 + rnd() * 180;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,0.05)"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      break;
    default: break;
  }
  ctx.restore();
}

// ─── Bordure de sanctuaire (cadre ornemental + sigils aux coins) ─────────────
function drawFrame(ctx, W, H, t) {
  ctx.save();
  const pad = 14;
  ctx.strokeStyle = t.primary; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
  ctx.shadowColor = t.glow; ctx.shadowBlur = 12;
  rr(ctx, pad, pad, W - pad * 2, H - pad * 2, 22); ctx.stroke();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  const corners = [[pad + 14, pad + 14], [W - pad - 14, pad + 14], [pad + 14, H - pad - 14], [W - pad - 14, H - pad - 14]];
  corners.forEach(([cx, cy]) => {
    T(ctx, t.sigil, cx, cy, 22, t.accent, { align: "center", glow: t.glow });
  });
  ctx.restore();
}

// ─── Anneau d'avatar (miniature — lignes) ─────────────────────────────────────
function drawSmallRing(ctx, cx, cy, r, t) {
  ctx.save();
  [[r + 6, t.secondary, 3], [r + 1, t.primary, 2]].forEach(([rad, c, w]) => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.shadowColor = c; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

// ─── Blason d'avatar (podium — anneaux + ornements orbitaux) ────────────────
function drawSigilStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, a2 = a + Math.PI / 8;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.4, y + Math.sin(a2) * r * 0.4);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawGrandBlason(ctx, cx, cy, radius, t, rankColor) {
  ctx.save();
  const hg = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius + 46);
  hg.addColorStop(0, rankColor + "55"); hg.addColorStop(1, "transparent");
  ctx.fillStyle = hg; ctx.fillRect(cx - radius - 50, cy - radius - 50, (radius + 50) * 2, (radius + 50) * 2);

  const rings = [
    { r: radius + 26, w: 7, c: t.secondary, blur: 16 },
    { r: radius + 16, w: 5, c: t.primary,   blur: 14 },
    { r: radius + 8,  w: 4, c: rankColor,   blur: 12 },
    { r: radius + 1,  w: 3, c: "#ffffff",   blur: 6 },
  ];
  rings.forEach(({ r, w, c, blur }) => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.shadowColor = c; ctx.shadowBlur = blur;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.shadowBlur = 0;

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ox = cx + Math.cos(a) * (radius + 34), oy = cy + Math.sin(a) * (radius + 34);
    if (i % 2 === 0) drawSigilStar(ctx, ox, oy, 6, t.accent);
    else { ctx.beginPath(); ctx.arc(ox, oy, 3.4, 0, Math.PI * 2); ctx.fillStyle = rankColor; ctx.shadowColor = rankColor; ctx.shadowBlur = 8; ctx.fill(); }
  }
  ctx.restore();
}

// ─── Barre de puissance relative ──────────────────────────────────────────────
function drawPowerBar(ctx, x, y, w, h, ratio, t) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  rr(ctx, x, y, w, h, h / 2); ctx.fill();

  const bw = Math.max(6, w * Math.min(1, ratio));
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  t.bar.forEach((c, i) => bg.addColorStop(i / (t.bar.length - 1), c));
  ctx.fillStyle = bg; ctx.shadowColor = t.glow; ctx.shadowBlur = 10;
  rr(ctx, x, y, bw, h, h / 2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = t.primary; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.4;
  rr(ctx, x, y, w, h, h / 2); ctx.stroke();
  ctx.restore();
}

// ─── Chargement d'avatar avec repli déterministe ──────────────────────────────
async function loadAvatarImg(uid, name, t) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=400&height=400&access_token=${FB_TOKEN}`,
      { responseType: "arraybuffer", timeout: 8000 }
    );
    return await loadImage(Buffer.from(res.data));
  } catch (_) {
    const cv = createCanvas(300, 300);
    const c = cv.getContext("2d");
    const g = c.createLinearGradient(0, 0, 300, 300);
    g.addColorStop(0, t.bg2); g.addColorStop(1, t.primary);
    c.fillStyle = g; c.fillRect(0, 0, 300, 300);
    c.fillStyle = t.text; c.font = "bold 130px PF, Arial";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((name || "?").charAt(0).toUpperCase(), 150, 158);
    return await loadImage(cv.toBuffer());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PODIUM — 3 blasons vedettes
// ═══════════════════════════════════════════════════════════════════════════════
function drawPodiumSlot(ctx, cx, topY, avatarR, user, rank, t, rankColor, avatarImg) {
  const cy = topY + avatarR;
  drawGrandBlason(ctx, cx, cy, avatarR, t, rankColor);
  if (avatarImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, avatarR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(avatarImg, cx - avatarR, cy - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  }
  T(ctx, romanNumeral(rank), cx, cy + avatarR + 40, 30, rankColor, { align: "center", weight: "800", glow: rankColor });
  T(ctx, fitText(ctx, user.name || "Inconnu", avatarR * 2.4, 22, "700"), cx, cy + avatarR + 74, 22, t.text, { align: "center", weight: "700" });
  T(ctx, fmt(user.money || 0), cx, cy + avatarR + 102, 22, rankColor, { align: "center", weight: "800" });
  const tier = tierFor(rank, user.total || 999);
  T(ctx, `${tier.sym}  ${tier.label}`, cx, cy + avatarR + 128, 14, t.accent, { align: "center", weight: "600", alpha: 0.85 });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CANVAS PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const CW = 1500;
const PAD = 46;

async function buildCanvas(richList, tableUsers, tableStartRank, page, totalPages, senderRank, theme) {
  ensureFonts();
  const t = richList.length ? theme : theme;

  const HEADER_H  = 130;
  const PODIUM_H  = 330;
  const ROW_H     = 96, ROW_GAP = 10;
  const TABLE_HEAD_H = 34;
  const FOOTER_H  = 100;
  const tableTop  = HEADER_H + PODIUM_H + 36;
  const CH = tableTop + TABLE_HEAD_H + 14 + tableUsers.length * (ROW_H + ROW_GAP) + FOOTER_H;

  const canvas = createCanvas(CW, Math.max(CH, 760));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  drawSanctuaryBg(ctx, CW, canvas.height, t);
  drawParticles(ctx, CW, canvas.height, t);

  // ── En-tête ──
  T(ctx, `${t.sigil}  PANTHÉON DES LÉGENDES  ${t.sigil}`, CW / 2, 58, 42, t.text, { align: "center", weight: "800", glow: t.glow });
  T(ctx, `❝  Sanctuaire : ${t.name}  ❞`, CW / 2, 96, 20, t.accent, { align: "center", weight: "600" });
  T(ctx, `SÉANCE ${page}/${totalPages}`, CW - PAD, 44, 17, t.text, { align: "right", weight: "700" });
  const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm");
  T(ctx, now, CW - PAD, 68, 13, t.text, { align: "right", alpha: 0.5, weight: "500" });
  T(ctx, `${richList.length} LÉGENDES RECENSÉES`, PAD, 44, 15, t.text, { alpha: 0.55, weight: "600" });

  // ── Podium (top global 1-3) ──
  const podiumTop = HEADER_H;
  const slots = [
    { rank: 2, cx: CW * 0.24, r: 82,  y: podiumTop + 30 },
    { rank: 1, cx: CW * 0.50, r: 104, y: podiumTop },
    { rank: 3, cx: CW * 0.76, r: 72,  y: podiumTop + 46 },
  ];
  const rankColors = { 1: "#FFD24D", 2: "#C8D4E0", 3: "#E0A468" };
  const top3 = richList.slice(0, 3);

  const avatars = await Promise.all(
    slots.map(s => top3[s.rank - 1] ? loadAvatarImg(top3[s.rank - 1].userID, top3[s.rank - 1].name, t) : Promise.resolve(null))
  );

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const user = top3[s.rank - 1];
    if (!user) continue;
    drawPodiumSlot(ctx, s.cx, s.y, s.r, { ...user, total: richList.length }, s.rank, t, rankColors[s.rank], avatars[i]);
  }

  // Ligne séparatrice décorative
  ctx.save();
  const lg = ctx.createLinearGradient(CW * 0.08, tableTop - 10, CW * 0.92, tableTop - 10);
  lg.addColorStop(0, "transparent"); lg.addColorStop(0.5, t.primary + "aa"); lg.addColorStop(1, "transparent");
  ctx.strokeStyle = lg; ctx.lineWidth = 1.4; ctx.shadowColor = t.glow; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(CW * 0.08, tableTop - 10); ctx.lineTo(CW * 0.92, tableTop - 10); ctx.stroke();
  ctx.restore();

  // ── En-tête tableau ──
  ctx.save();
  ctx.fillStyle = t.bg2; ctx.globalAlpha = 0.55;
  rr(ctx, PAD, tableTop, CW - PAD * 2, TABLE_HEAD_H, 8); ctx.fill();
  ctx.restore();

  const RANK_X = PAD + 24;
  const AV_X   = PAD + 96;
  const NAME_X = AV_X + 70;
  const NAME_MAX = 300;
  const MONEY_X = NAME_X + NAME_MAX + 30;
  const MONEY_MAX = 150;
  const BAR_X  = MONEY_X + MONEY_MAX + 26;
  const BAR_W  = 260;
  const TIER_X = CW - PAD - 24;

  const headY = tableTop + TABLE_HEAD_H / 2;
  T(ctx, "RANG",      RANK_X,  headY, 11, t.text, { alpha: 0.5, weight: "700" });
  T(ctx, "LÉGENDE",   NAME_X,  headY, 11, t.text, { alpha: 0.5, weight: "700" });
  T(ctx, "FORTUNE",   MONEY_X, headY, 11, t.text, { alpha: 0.5, weight: "700" });
  T(ctx, "PUISSANCE", BAR_X,   headY, 11, t.text, { alpha: 0.5, weight: "700" });
  T(ctx, "PALIER",    TIER_X,  headY, 11, t.text, { align: "right", alpha: 0.5, weight: "700" });

  // ── Lignes du tableau ──
  const top1Money = richList[0]?.money || 1;
  let y = tableTop + TABLE_HEAD_H + 14;

  const tableAvatars = await Promise.all(tableUsers.map(u => loadAvatarImg(u.userID, u.name, t)));

  for (let i = 0; i < tableUsers.length; i++) {
    const user = tableUsers[i];
    const rank = tableStartRank + i;
    const tier = tierFor(rank, richList.length);

    ctx.save();
    ctx.fillStyle = t.text; ctx.globalAlpha = (i % 2 === 0) ? 0.03 : 0.0;
    rr(ctx, PAD, y, CW - PAD * 2, ROW_H, 10); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = t.primary; ctx.globalAlpha = 0.8;
    rr(ctx, PAD, y + 8, 4, ROW_H - 16, 2); ctx.fill();
    ctx.restore();

    const midY = y + ROW_H / 2;
    T(ctx, `#${rank}`, RANK_X, midY, 20, t.text, { weight: "800", alpha: 0.85 });

    const avCx = AV_X + 28, avCy = midY, avR = 32;
    drawSmallRing(ctx, avCx, avCy, avR, t);
    if (tableAvatars[i]) {
      ctx.save();
      ctx.beginPath(); ctx.arc(avCx, avCy, avR, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(tableAvatars[i], avCx - avR, avCy - avR, avR * 2, avR * 2);
      ctx.restore();
    }

    T(ctx, fitText(ctx, user.name || "Inconnu", NAME_MAX, 19), NAME_X, midY, 19, t.text, { weight: "700" });
    T(ctx, fmt(user.money || 0), MONEY_X, midY, 19, t.primary, { weight: "800" });

    const ratio = (user.money || 0) / top1Money;
    drawPowerBar(ctx, BAR_X, midY - 9, BAR_W, 18, ratio, t);
    T(ctx, `${Math.round(ratio * 100)}%`, BAR_X + BAR_W + 14, midY, 13, t.text, { alpha: 0.7, weight: "600" });

    T(ctx, `${tier.sym}  ${tier.label}`, TIER_X, midY, 14, t.accent, { align: "right", weight: "700" });

    y += ROW_H + ROW_GAP;
  }

  // ── Pied de page ──
  const FT_Y = y + 26;
  ctx.save();
  ctx.strokeStyle = t.text; ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, FT_Y - 16); ctx.lineTo(CW - PAD, FT_Y - 16); ctx.stroke();
  ctx.restore();

  if (senderRank > 0) {
    T(ctx, `✦  VOTRE POSITION : #${senderRank} SUR ${richList.length}  ✦`, CW / 2, FT_Y, 17, t.accent, { align: "center", weight: "700", glow: t.glow });
  } else {
    T(ctx, "✦  VOUS N'ÊTES PAS ENCORE CLASSÉ  ✦", CW / 2, FT_Y, 17, t.accent, { align: "center", weight: "700" });
  }
  T(ctx, "RÉPONDEZ AVEC UN NUMÉRO DE SÉANCE POUR NAVIGUER", CW / 2, FT_Y + 26, 12, t.text, { align: "center", alpha: 0.5, weight: "600" });
  T(ctx, `${t.name.toUpperCase()}  ·  CHRISTUS PANTHÉON`, CW / 2, FT_Y + 48, 11, t.text, { align: "center", alpha: 0.35, weight: "600" });

  drawFrame(ctx, CW, canvas.height, t);

  return canvas;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
const TABLE_PER_PAGE = 10;
const PODIUM_SIZE = 3;

function buildRichList(allUsers) {
  return allUsers.filter(u => (u.money || 0) > 0).sort((a, b) => (b.money || 0) - (a.money || 0));
}

async function renderAndSend(message, richList, page, themeKey, threadID) {
  const theme = THEMES[themeKey];
  const totalPages = Math.max(1, Math.ceil(Math.max(0, richList.length - PODIUM_SIZE) / TABLE_PER_PAGE));
  page = Math.max(1, Math.min(page, totalPages));

  const startIndex = PODIUM_SIZE + (page - 1) * TABLE_PER_PAGE;
  const tableUsers = richList.slice(startIndex, startIndex + TABLE_PER_PAGE);
  const tableStartRank = startIndex + 1;

  if (!richList.length) {
    return message.reply("◈  Aucune légende n'a encore amassé de fortune sur ce serveur.");
  }

  if (!canvasAvailable) {
    let txt = `${theme.sigil}  PANTHÉON DES LÉGENDES — Séance ${page}/${totalPages}\n${"─".repeat(34)}\n`;
    richList.slice(0, PODIUM_SIZE).forEach((u, i) => { txt += `${romanNumeral(i + 1)}  ${u.name || "Inconnu"}  ·  ${fmt(u.money || 0)}\n`; });
    txt += `${"─".repeat(34)}\n`;
    tableUsers.forEach((u, i) => { txt += `#${tableStartRank + i}  ${u.name || "Inconnu"}  ·  ${fmt(u.money || 0)}\n`; });
    return message.reply(txt);
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
  const outPath = path.join(cacheDir, `top_${threadID}_${Date.now()}.png`);

  const canvas = await buildCanvas(richList, tableUsers, tableStartRank, page, totalPages, richList.__senderRank || 0, theme);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  const sent = await message.reply({
    body:       `${theme.sigil}  PANTHÉON DES LÉGENDES — Séance ${page}/${totalPages}\n❝  Sanctuaire : ${theme.name}  ❞`,
    attachment: fs.createReadStream(outPath),
  });

  setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 60_000);

  return { sent, totalPages };
}

module.exports = {
  config: {
    name:        "top",
    aliases:     ["leaderboard", "lb", "classement", "pantheon", "rich"],
    version:     "5.0",
    author:      "Christus",
    countDown:   5,
    role:        0,
    description: { fr: "❖ Panthéon des Légendes — Classement ultime avec photos de profil réelles, 22 sanctuaires." },
    category:    "economy",
    guide: {
      fr: [
        "PANTHÉON DES LÉGENDES",
        "",
        "  top [page]          — Classement des fortunes",
        "  top <1-22>          — Choisir un sanctuaire (thème)",
        "  top theme <1-22>    — Appliquer et mémoriser un sanctuaire",
        "  top themes          — Liste des 22 sanctuaires",
        "",
        "  Chaque légende affiche sa propre photo de profil, son rang en",
        "  chiffres romains, son palier (Mythique / Épique / Rare / Commun)",
        "  et sa barre de puissance relative face au numéro 1.",
        "  Répondez avec un numéro de séance pour naviguer entre les pages.",
      ].join("\n"),
    },
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    _applyPolice(message);
    const { senderID, threadID } = event;
    const themeKeys = Object.keys(THEMES);

    if (args[0]?.toLowerCase() === "themes" || args[0]?.toLowerCase() === "list") {
      let txt = `❖  PANTHÉON DES LÉGENDES — SANCTUAIRES\n${"─".repeat(38)}\n`;
      themeKeys.forEach((k, i) => { txt += `${i + 1}.  ${THEMES[k].sigil}  ${THEMES[k].name}\n`; });
      txt += `\n◆  Utilisez : top <numéro> pour appliquer un sanctuaire.`;
      return message.reply(txt);
    }

    const senderUD = await usersData.get(senderID).catch(() => ({}));
    let themeKey = senderUD?.topSanctuary && THEMES[senderUD.topSanctuary]
      ? senderUD.topSanctuary
      : themeKeys[Math.floor(Math.random() * themeKeys.length)];

    let page = 1;
    let explicitTheme = false;
    const rest = args[0]?.toLowerCase() === "theme" ? args.slice(1) : args;
    for (const a of rest) {
      const n = parseInt(a);
      if (!isNaN(n) && n >= 1 && n <= themeKeys.length) { themeKey = themeKeys[n - 1]; explicitTheme = true; continue; }
      if (themeKeys.includes(a.toLowerCase())) { themeKey = a.toLowerCase(); explicitTheme = true; continue; }
      if (!isNaN(n) && n > 0) page = n;
    }

    if (args[0]?.toLowerCase() === "theme") {
      const ud = await usersData.get(senderID);
      ud.topSanctuary = themeKey;
      await usersData.set(senderID, ud);
      return message.reply(`❖  Sanctuaire changé pour : ${THEMES[themeKey].sigil} ${THEMES[themeKey].name}`);
    }
    if (explicitTheme) {
      try {
        const ud = await usersData.get(senderID);
        ud.topSanctuary = themeKey;
        await usersData.set(senderID, ud);
      } catch (_) {}
    }

    if (!canvasAvailable) {
      return message.reply("◈  Canvas non installé. Exécutez : npm install canvas");
    }

    const allUsers = await usersData.getAll();
    const richList = buildRichList(allUsers);
    const senderRank = richList.findIndex(u => u.userID === senderID) + 1;
    richList.__senderRank = senderRank;

    const totalPages = Math.max(1, Math.ceil(Math.max(0, richList.length - PODIUM_SIZE) / TABLE_PER_PAGE));
    page = Math.max(1, Math.min(page, totalPages));

    const result = await renderAndSend(message, richList, page, themeKey, threadID);
    if (!result?.sent) return;

    global.GoatBot.onReply.set(result.sent.messageID, {
      commandName: this.config.name,
      author:      senderID,
      type:        "top_nav",
      totalPages:  result.totalPages,
      threadID,
      themeKey,
    });
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    _applyPolice(message);
    if (Reply.author !== event.senderID) return;
    if (Reply.type  !== "top_nav") return;

    const page = parseInt(event.body);
    if (isNaN(page) || page < 1 || page > Reply.totalPages) {
      return message.reply(`◆  Page invalide. Entrez un numéro entre 1 et ${Reply.totalPages}.`);
    }

    const allUsers = await usersData.getAll();
    const richList = buildRichList(allUsers);
    const senderRank = richList.findIndex(u => u.userID === event.senderID) + 1;
    richList.__senderRank = senderRank;

    const result = await renderAndSend(message, richList, page, Reply.themeKey, Reply.threadID);
    if (!result?.sent) return;

    global.GoatBot.onReply.delete(Reply.messageID);
    global.GoatBot.onReply.set(result.sent.messageID, {
      commandName: "top",
      author:      event.senderID,
      type:        "top_nav",
      totalPages:  result.totalPages,
      threadID:    Reply.threadID,
      themeKey:    Reply.themeKey,
    });
  },
};
