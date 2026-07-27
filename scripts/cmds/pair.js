"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  PAIR ROYAL — Carte de compatibilité amoureuse ultra-redesignée
//  Auteur : Christus
//  10 thèmes visuels exclusifs + architecture Canvas entièrement repensée
// ═══════════════════════════════════════════════════════════════════════════════

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const canvas  = require("canvas");
  loadImage     = canvas.loadImage;
  createCanvas  = canvas.createCanvas;
  registerFont  = canvas.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas not available:", e.message); }

const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

// ─── Fonts ────────────────────────────────────────────────────────────────────
if (canvasAvailable && registerFont) {
  const fontDir = path.join(__dirname, "assets", "font");
  const fontFiles = [
    ["BeVietnamPro-Bold.ttf",    "PairFont", "bold"],
    ["BeVietnamPro-Regular.ttf", "PairFont", "normal"],
    ["BeVietnamPro-SemiBold.ttf","PairFont", "600"],
    ["NotoSans-Bold.ttf",        "PairFont", "bold"],
    ["NotoSans-Regular.ttf",     "PairFont", "normal"],
    ["Emoji.ttf",                "Emoji",    "normal"],
  ];
  for (const [file, family, weight] of fontFiles) {
    try {
      const fp = path.join(fontDir, file);
      if (fs.existsSync(fp)) registerFont(fp, { family, weight });
    } catch (_) {}
  }
}

// ─── roundRect polyfill ───────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r,r,r,r];
  const [tl,tr,br,bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y,       x + w, y + tr);
  ctx.lineTo(x + w,     y + h - br);
  ctx.quadraticCurveTo(x + w, y + h,   x + w - br, y + h);
  ctx.lineTo(x + bl,    y + h);
  ctx.quadraticCurveTo(x,     y + h,   x, y + h - bl);
  ctx.lineTo(x,         y + tl);
  ctx.quadraticCurveTo(x,     y,       x + tl, y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  10 THÈMES ULTRA-SPECTACULAIRES
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {

  // ── 1. NEON TOKYO ──────────────────────────────────────────────────────────
  neon_tokyo: {
    name: "Neon Tokyo",
    emoji: "🌆",
    bg: (ctx, W, H) => {
      ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, W, H);
      // Grille cyber
      ctx.strokeStyle = "rgba(0,255,255,0.06)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      // Glow spots
      const spots = [[W*0.2,H*0.3,"#ff0080"],[W*0.8,H*0.2,"#00ffff"],[W*0.5,H*0.8,"#ff6600"],[W*0.1,H*0.7,"#7700ff"]];
      spots.forEach(([sx,sy,sc]) => {
        const g = ctx.createRadialGradient(sx,sy,0,sx,sy,320);
        g.addColorStop(0, sc+"55"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      });
    },
    heart: "#ff0080",
    text: "#ffffff",
    accent: "#00ffff",
    secondary: "#ff6600",
    glow: "#ff0080",
    barGrad: ["#ff0080","#7700ff","#00ffff"],
    borderStyle: "neon",
    particle: "cyber",
  },

  // ── 2. GALAXY DRIFT ───────────────────────────────────────────────────────
  galaxy_drift: {
    name: "Galaxy Drift",
    emoji: "🌌",
    bg: (ctx, W, H) => {
      ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, W, H);
      // Nébuleuse
      [[W*0.3,H*0.4,"#1a0033"],[W*0.7,H*0.6,"#002244"],[W*0.5,H*0.2,"#220022"]].forEach(([gx,gy,gc]) => {
        const g = ctx.createRadialGradient(gx,gy,0,gx,gy,400);
        g.addColorStop(0, gc+"ff"); g.addColorStop(0.5, gc+"88"); g.addColorStop(1,"transparent");
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      });
      // Étoiles
      for (let i = 0; i < 200; i++) {
        const sx = Math.random()*W, sy = Math.random()*H, sr = Math.random()*1.8;
        const sa = 0.4 + Math.random()*0.6;
        ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${sa})`; ctx.fill();
      }
      // Voie lactée
      const mw = ctx.createLinearGradient(0, H*0.4, W, H*0.6);
      mw.addColorStop(0,"transparent"); mw.addColorStop(0.3,"rgba(255,255,255,0.04)");
      mw.addColorStop(0.5,"rgba(200,180,255,0.08)"); mw.addColorStop(0.7,"rgba(255,255,255,0.04)"); mw.addColorStop(1,"transparent");
      ctx.fillStyle = mw; ctx.fillRect(0,0,W,H);
    },
    heart: "#c084fc",
    text: "#ffffff",
    accent: "#818cf8",
    secondary: "#f0abfc",
    glow: "#a855f7",
    barGrad: ["#a855f7","#6366f1","#ec4899"],
    borderStyle: "galaxy",
    particle: "stars",
  },

  // ── 3. CHERRY BLOSSOM ─────────────────────────────────────────────────────
  cherry_blossom: {
    name: "Sakura Dream",
    emoji: "🌸",
    bg: (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#fff0f3"); g.addColorStop(0.3, "#ffd6e8");
      g.addColorStop(0.6, "#ffb3d1"); g.addColorStop(1, "#ff85b3");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Pétales de sakura flous
      for (let i = 0; i < 30; i++) {
        const px = Math.random()*W, py = Math.random()*H;
        const pr = 8 + Math.random()*25;
        const pg = ctx.createRadialGradient(px,py,0,px,py,pr);
        pg.addColorStop(0,"rgba(255,182,193,0.5)"); pg.addColorStop(1,"transparent");
        ctx.fillStyle = pg; ctx.fillRect(0,0,W,H);
      }
    },
    heart: "#e91e8c",
    text: "#3d0026",
    accent: "#f06292",
    secondary: "#ff80ab",
    glow: "#f48fb1",
    barGrad: ["#e91e8c","#f06292","#ffb3d1"],
    borderStyle: "floral",
    particle: "petals",
  },

  // ── 4. AURORA BOREALIS ────────────────────────────────────────────────────
  aurora: {
    name: "Aurora Borealis",
    emoji: "🌌",
    bg: (ctx, W, H) => {
      ctx.fillStyle = "#010a12"; ctx.fillRect(0, 0, W, H);
      // Aurores
      const auroras = [
        {y: H*0.1, c1:"#00ff88", c2:"#00ccff", w: W*1.2},
        {y: H*0.3, c1:"#0088ff", c2:"#8800ff", w: W*0.9},
        {y: H*0.55,c1:"#ff00aa", c2:"#ff8800", w: W*1.1},
      ];
      auroras.forEach(({ y, c1, c2, w }) => {
        const ag = ctx.createLinearGradient(0, y-80, 0, y+80);
        ag.addColorStop(0,"transparent"); ag.addColorStop(0.4, c1+"44");
        ag.addColorStop(0.5, c1+"88"); ag.addColorStop(0.6, c2+"44"); ag.addColorStop(1,"transparent");
        ctx.fillStyle = ag;
        ctx.save(); ctx.globalAlpha = 0.7;
        ctx.fillRect(W/2 - w/2, y-80, w, 160); ctx.restore();
      });
      // Étoiles
      for (let i = 0; i < 150; i++) {
        ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H*0.4, Math.random()*1.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.3+Math.random()*0.7})`; ctx.fill();
      }
    },
    heart: "#00ff88",
    text: "#ffffff",
    accent: "#00ccff",
    secondary: "#8800ff",
    glow: "#00ff88",
    barGrad: ["#00ff88","#00ccff","#8800ff"],
    borderStyle: "aurora",
    particle: "aurora",
  },

  // ── 5. GOLDEN LUXURY ─────────────────────────────────────────────────────
  golden_luxury: {
    name: "Golden Luxury",
    emoji: "👑",
    bg: (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1a0e00"); g.addColorStop(0.25, "#2d1a00");
      g.addColorStop(0.5, "#1a0a00"); g.addColorStop(0.75, "#2d1a00"); g.addColorStop(1, "#0d0700");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Effet tissu doré
      ctx.strokeStyle = "rgba(255,215,0,0.04)"; ctx.lineWidth = 1;
      for (let i = 0; i < W + H; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(0, i); ctx.stroke();
      }
      // Halo doré central
      const cg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H*0.6);
      cg.addColorStop(0,"rgba(255,200,50,0.15)"); cg.addColorStop(1,"transparent");
      ctx.fillStyle = cg; ctx.fillRect(0,0,W,H);
    },
    heart: "#ffd700",
    text: "#fff8e1",
    accent: "#ffb300",
    secondary: "#ffe082",
    glow: "#ff8f00",
    barGrad: ["#ff6f00","#ffa000","#ffd700","#fff176"],
    borderStyle: "gold",
    particle: "sparkles",
  },

  // ── 6. MIDNIGHT ROSE ──────────────────────────────────────────────────────
  midnight_rose: {
    name: "Midnight Rose",
    emoji: "🥀",
    bg: (ctx, W, H) => {
      const g = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H/2, H*0.9);
      g.addColorStop(0, "#1a0010"); g.addColorStop(0.4, "#2d0020");
      g.addColorStop(0.7, "#150010"); g.addColorStop(1, "#000008");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Veines roses
      [[W*0.2,H*0.2,"#8b0055"],[W*0.8,H*0.3,"#6b003a"],[W*0.5,H*0.7,"#aa0066"]].forEach(([rx,ry,rc]) => {
        const rg = ctx.createRadialGradient(rx,ry,0,rx,ry,250);
        rg.addColorStop(0,rc+"66"); rg.addColorStop(1,"transparent");
        ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
      });
    },
    heart: "#ff1a75",
    text: "#ffe0f0",
    accent: "#ff4da6",
    secondary: "#cc0055",
    glow: "#ff1a75",
    barGrad: ["#8b0055","#cc0066","#ff1a75","#ff80c0"],
    borderStyle: "rose",
    particle: "roses",
  },

  // ── 7. ICE PALACE ────────────────────────────────────────────────────────
  ice_palace: {
    name: "Ice Palace",
    emoji: "❄️",
    bg: (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#e8f4fd"); g.addColorStop(0.3, "#cce7f8");
      g.addColorStop(0.6, "#a8d8f0"); g.addColorStop(1, "#7ec8e3");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Cristaux de glace
      for (let i = 0; i < 20; i++) {
        const cx = Math.random()*W, cy = Math.random()*H;
        const cg2 = ctx.createRadialGradient(cx,cy,0,cx,cy,60+Math.random()*80);
        cg2.addColorStop(0,"rgba(255,255,255,0.4)"); cg2.addColorStop(1,"transparent");
        ctx.fillStyle = cg2; ctx.fillRect(0,0,W,H);
      }
    },
    heart: "#0066cc",
    text: "#001a33",
    accent: "#0099ff",
    secondary: "#66c2ff",
    glow: "#0088ff",
    barGrad: ["#003d7a","#0066cc","#0099ff","#66c2ff"],
    borderStyle: "ice",
    particle: "snowflakes",
  },

  // ── 8. LAVA FLAME ────────────────────────────────────────────────────────
  lava_flame: {
    name: "Lava Flame",
    emoji: "🔥",
    bg: (ctx, W, H) => {
      ctx.fillStyle = "#0a0000"; ctx.fillRect(0, 0, W, H);
      // Lave en fusion
      const layers = [
        {y:H,c1:"#ff2200",c2:"#ff6600",r:H*0.8},
        {y:H*0.8,c1:"#cc1100",c2:"#ff3300",r:H*0.6},
        {y:H*0.6,c1:"#881100",c2:"#cc2200",r:H*0.5},
      ];
      layers.forEach(({y,c1,c2,r}) => {
        const fg = ctx.createRadialGradient(W/2,y,0,W/2,y,r);
        fg.addColorStop(0,c1+"cc"); fg.addColorStop(0.6,c2+"66"); fg.addColorStop(1,"transparent");
        ctx.fillStyle = fg; ctx.fillRect(0,0,W,H);
      });
      // Braises
      for (let i = 0; i < 60; i++) {
        const bx = Math.random()*W, by = Math.random()*H;
        ctx.beginPath(); ctx.arc(bx,by,1+Math.random()*3,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,${100+Math.floor(Math.random()*155)},0,${0.4+Math.random()*0.6})`; ctx.fill();
      }
    },
    heart: "#ff4400",
    text: "#fff5f0",
    accent: "#ff6600",
    secondary: "#ff8800",
    glow: "#ff2200",
    barGrad: ["#cc1100","#ff3300","#ff6600","#ffaa00"],
    borderStyle: "flame",
    particle: "embers",
  },

  // ── 9. HOLOGRAPHIC ────────────────────────────────────────────────────────
  holographic: {
    name: "Holographic",
    emoji: "✨",
    bg: (ctx, W, H) => {
      ctx.fillStyle = "#f0f8ff"; ctx.fillRect(0,0,W,H);
      // Dégradés holographiques superposés
      const holos = [
        ctx.createLinearGradient(0,0,W,H),
        ctx.createLinearGradient(W,0,0,H),
        ctx.createLinearGradient(0,H,W,0),
      ];
      const stops = [
        ["#ff000020","#ff800020","#ffff0020","#00ff0020","#0000ff20","#8000ff20"],
        ["#ff008020","#00ffff20","#0080ff20","#ff00ff20","#ffff0020","#ff000020"],
        ["#00ff8020","#ff00ff20","#ff800020","#00008020","#ff008020","#00ff0020"],
      ];
      holos.forEach((hg, hi) => {
        stops[hi].forEach((c,i) => hg.addColorStop(i/5,c));
        ctx.fillStyle = hg; ctx.fillRect(0,0,W,H);
      });
      // Overlay perle
      const pg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,H*0.8);
      pg.addColorStop(0,"rgba(255,255,255,0.5)"); pg.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle = pg; ctx.fillRect(0,0,W,H);
    },
    heart: "#ff006e",
    text: "#1a0030",
    accent: "#7c00ff",
    secondary: "#0066ff",
    glow: "#ff006e",
    barGrad: ["#ff006e","#7c00ff","#0066ff","#00ffcc"],
    borderStyle: "holo",
    particle: "prismatic",
  },

  // ── 10. ANCIENT EGYPT ─────────────────────────────────────────────────────
  ancient_egypt: {
    name: "Ancient Egypt",
    emoji: "🏺",
    bg: (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a0f00"); g.addColorStop(0.3, "#2d1a00");
      g.addColorStop(0.6, "#331a00"); g.addColorStop(1, "#1a0800");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      // Hieroglyphes en fond
      const hieros = ["𓂀","𓅱","𓆣","𓇯","𓊖","𓋴","𓌀","𓍢","𓎛","☥","𓏏","𓐍"];
      ctx.font = "28px serif"; ctx.fillStyle = "rgba(255,200,50,0.07)"; ctx.textAlign = "center";
      for (let r2 = 0; r2 < H; r2 += 55)
        for (let c2 = 0; c2 < W; c2 += 55)
          ctx.fillText(hieros[Math.floor(Math.random()*hieros.length)], c2, r2);
      // Rayons divins
      const rg = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, H*1.2);
      rg.addColorStop(0,"rgba(255,200,50,0.15)"); rg.addColorStop(1,"transparent");
      ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
    },
    heart: "#ffd700",
    text: "#fff8e1",
    accent: "#daa520",
    secondary: "#b8860b",
    glow: "#ff8c00",
    barGrad: ["#8b4513","#cd853f","#daa520","#ffd700","#fff176"],
    borderStyle: "egypt",
    particle: "hieroglyphs",
  },
};

// ─── Messages romantiques par thème ──────────────────────────────────────────
const MESSAGES = {
  neon_tokyo:    ["Love at the speed of light","Digital hearts connected","Infinite loop of love","System: Love.exe activated","Connection established 💫"],
  galaxy_drift:  ["Written across galaxies","Gravity of true love","Star-crossed forever","Cosmic soul bond","Lost in your universe 🌌"],
  cherry_blossom:["Blooming love forever","Petals of destiny","春の愛 — Spring Love","Gentle as a petal","Softly, endlessly ✿"],
  aurora:        ["Love lights the sky","Colors of your heart","Northern lights of love","Dancing together eternally","Illuminated by you ✨"],
  golden_luxury: ["A love worth its weight in gold","Crown of devotion","Luxury of your presence","Gilded hearts entwined","Royally yours 👑"],
  midnight_rose: ["Love blooms in darkness","Thorns guard what matters","Velvet petals of the heart","Midnight garden of love","Eternal rose 🥀"],
  ice_palace:    ["Cold outside, warm inside","Crystal clear love","Frozen in time for you","Diamond heart","Pure as winter snow ❄️"],
  lava_flame:    ["Burning for you endlessly","Fire of pure devotion","Unstoppable flame of love","Forged in passion","Scorching hearts 🔥"],
  holographic:   ["Love in every spectrum","Shifting colors of devotion","Iridescent connection","Every angle, beautiful","Prism of our love ✨"],
  ancient_egypt: ["Love eternal as the Nile","Written in hieroglyphs","Sacred bond of the gods","Timeless devotion","Destined by the pharaohs 𓂀"],
};

// ─── Particules par thème ─────────────────────────────────────────────────────
function drawParticles(ctx, W, H, theme) {
  const type = theme.particle;
  ctx.save();

  if (type === "cyber") {
    // Lignes de données en chute
    for (let i = 0; i < 40; i++) {
      const px = Math.random()*W, py = Math.random()*H;
      const len = 15 + Math.random()*60;
      ctx.strokeStyle = `rgba(0,255,255,${0.1+Math.random()*0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+len); ctx.stroke();
      ctx.font = `${8+Math.random()*6}px monospace`;
      ctx.fillStyle = `rgba(0,255,0,${0.2+Math.random()*0.3})`;
      ctx.fillText(String.fromCharCode(0x30A0+Math.floor(Math.random()*96)), px, py);
    }
  }
  else if (type === "stars") {
    for (let i = 0; i < 50; i++) {
      drawStar4(ctx, Math.random()*W, Math.random()*H, 3+Math.random()*8, `rgba(255,255,255,${0.2+Math.random()*0.5})`);
    }
  }
  else if (type === "petals") {
    const petalColors = ["#ffb3d1","#ff80c0","#ff4da6","#ffd6e8","#ffe0ee"];
    for (let i = 0; i < 35; i++) {
      const px = Math.random()*W, py = Math.random()*H;
      const pr = 6+Math.random()*14;
      ctx.globalAlpha = 0.25+Math.random()*0.4;
      ctx.fillStyle = petalColors[Math.floor(Math.random()*petalColors.length)];
      ctx.save(); ctx.translate(px,py); ctx.rotate(Math.random()*Math.PI*2);
      ctx.beginPath(); ctx.ellipse(0,0,pr,pr*0.5,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  else if (type === "aurora") {
    for (let i = 0; i < 30; i++) {
      ctx.globalAlpha = 0.1+Math.random()*0.2;
      const ax = Math.random()*W, ay = Math.random()*H;
      const ac = ["#00ff88","#00ccff","#8800ff","#ff00aa"][Math.floor(Math.random()*4)];
      const ag = ctx.createRadialGradient(ax,ay,0,ax,ay,40+Math.random()*80);
      ag.addColorStop(0,ac); ag.addColorStop(1,"transparent");
      ctx.fillStyle = ag; ctx.fillRect(0,0,W,H);
    }
  }
  else if (type === "sparkles") {
    for (let i = 0; i < 60; i++) {
      const sx = Math.random()*W, sy = Math.random()*H;
      const sr = 2+Math.random()*7;
      ctx.globalAlpha = 0.2+Math.random()*0.6;
      drawStar4(ctx, sx, sy, sr, `rgba(255,${180+Math.floor(Math.random()*75)},0,1)`);
    }
  }
  else if (type === "roses") {
    for (let i = 0; i < 25; i++) {
      const rx = Math.random()*W, ry = Math.random()*H;
      ctx.globalAlpha = 0.15+Math.random()*0.3;
      drawSimpleHeart(ctx, rx, ry, 8+Math.random()*16, theme.heart);
    }
  }
  else if (type === "snowflakes") {
    const flakes = ["❄","❅","❆","*"];
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.15+Math.random()*0.35;
      ctx.font = `${12+Math.random()*20}px serif`;
      ctx.fillStyle = "#0066cc";
      ctx.fillText(flakes[Math.floor(Math.random()*flakes.length)], Math.random()*W, Math.random()*H);
    }
  }
  else if (type === "embers") {
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.2+Math.random()*0.6;
      ctx.beginPath();
      ctx.arc(Math.random()*W, Math.random()*H, 1+Math.random()*4, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,${Math.floor(Math.random()*150)},0,1)`; ctx.fill();
    }
  }
  else if (type === "prismatic") {
    const hues = [0,30,60,120,180,240,300];
    for (let i = 0; i < 40; i++) {
      const hue = hues[Math.floor(Math.random()*hues.length)];
      ctx.globalAlpha = 0.12+Math.random()*0.2;
      const pg = ctx.createRadialGradient(Math.random()*W,Math.random()*H,0,Math.random()*W,Math.random()*H,60+Math.random()*100);
      pg.addColorStop(0,`hsl(${hue},100%,70%)`); pg.addColorStop(1,"transparent");
      ctx.fillStyle = pg; ctx.fillRect(0,0,W,H);
    }
  }
  else if (type === "hieroglyphs") {
    const glyphs = ["𓂀","☥","𓅱","𓆣","𓇯","★","✦"];
    for (let i = 0; i < 20; i++) {
      ctx.globalAlpha = 0.12+Math.random()*0.2;
      ctx.font = `${14+Math.random()*18}px serif`;
      ctx.fillStyle = theme.accent;
      ctx.fillText(glyphs[Math.floor(Math.random()*glyphs.length)], Math.random()*W, Math.random()*H);
    }
  }

  ctx.restore();
}

// ─── Bordures par style ───────────────────────────────────────────────────────
function drawBorder(ctx, W, H, theme) {
  const style = theme.borderStyle;
  ctx.save();

  if (style === "neon") {
    // Double cadre néon
    [theme.heart, theme.accent, theme.secondary].forEach((c, i) => {
      const m = 12 + i*10;
      ctx.strokeStyle = c; ctx.lineWidth = i === 0 ? 4 : 2;
      ctx.shadowColor = c; ctx.shadowBlur = 20;
      rrect(ctx, m, m, W-m*2, H-m*2, 18); ctx.stroke();
    });
    // Coins angles droits néon
    [[20,20],[W-20,20],[20,H-20],[W-20,H-20]].forEach(([cx,cy]) => {
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.shadowColor = theme.accent; ctx.shadowBlur = 15;
      const s = 30, dir = [cx<W/2?1:-1, cy<H/2?1:-1];
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+dir[0]*s,cy); ctx.moveTo(cx,cy); ctx.lineTo(cx,cy+dir[1]*s); ctx.stroke();
    });
  }
  else if (style === "galaxy") {
    // Halo dégradé
    const bgg = ctx.createLinearGradient(0,0,W,H);
    bgg.addColorStop(0,theme.heart); bgg.addColorStop(0.5,theme.accent); bgg.addColorStop(1,theme.secondary);
    ctx.strokeStyle = bgg; ctx.lineWidth = 3; ctx.shadowColor = theme.glow; ctx.shadowBlur = 30;
    rrect(ctx,15,15,W-30,H-30,20); ctx.stroke();
    // Points lumineux aux coins
    [[20,20],[W-20,20],[20,H-20],[W-20,H-20]].forEach(([cx,cy]) => {
      ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2);
      ctx.fillStyle = theme.accent; ctx.shadowBlur = 20; ctx.fill();
    });
  }
  else if (style === "floral") {
    ctx.strokeStyle = theme.heart; ctx.lineWidth = 5; ctx.shadowColor = theme.glow; ctx.shadowBlur = 15;
    ctx.setLineDash([8,6]);
    rrect(ctx,18,18,W-36,H-36,25); ctx.stroke(); ctx.setLineDash([]);
    // Petits cœurs aux coins
    [[25,25],[W-55,25],[25,H-55],[W-55,H-55]].forEach(([hx,hy]) => drawSimpleHeart(ctx,hx,hy,18,theme.heart));
  }
  else if (style === "aurora") {
    const auroraBorder = [theme.heart, theme.accent, theme.secondary];
    auroraBorder.forEach((c, i) => {
      const m = 14 + i*8;
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.shadowColor = c; ctx.shadowBlur = 25; ctx.globalAlpha = 0.7;
      rrect(ctx,m,m,W-m*2,H-m*2,16); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  else if (style === "gold") {
    // Triple bordure dorée
    ["#ffd700","#ffb300","#ff8f00"].forEach((c,i) => {
      const m = 10+i*8;
      ctx.strokeStyle = c; ctx.lineWidth = 4-i; ctx.shadowColor = c; ctx.shadowBlur = 15;
      rrect(ctx,m,m,W-m*2,H-m*2,14); ctx.stroke();
    });
    // Ornements aux coins
    [[22,22],[W-22,22],[22,H-22],[W-22,H-22]].forEach(([cx,cy]) => {
      drawStar4(ctx,cx,cy,12,"#ffd700");
    });
  }
  else if (style === "rose") {
    ctx.strokeStyle = theme.heart; ctx.lineWidth = 4; ctx.shadowColor = theme.glow; ctx.shadowBlur = 25;
    rrect(ctx,14,14,W-28,H-28,20); ctx.stroke();
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.shadowBlur = 12;
    rrect(ctx,22,22,W-44,H-44,16); ctx.stroke();
    [[20,20],[W-46,20],[20,H-46],[W-46,H-46]].forEach(([rx,ry]) => drawSimpleHeart(ctx,rx,ry,14,theme.heart));
  }
  else if (style === "ice") {
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 20;
    ctx.setLineDash([12,8]);
    rrect(ctx,16,16,W-32,H-32,22); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#ffffff44"; ctx.lineWidth = 1; ctx.shadowBlur = 0;
    rrect(ctx,24,24,W-48,H-48,18); ctx.stroke();
  }
  else if (style === "flame") {
    // Bordure dégradée feu
    const fireG = ctx.createLinearGradient(0,0,W,H);
    fireG.addColorStop(0,"#ff2200"); fireG.addColorStop(0.3,"#ff6600"); fireG.addColorStop(0.6,"#ffaa00"); fireG.addColorStop(1,"#ff2200");
    ctx.strokeStyle = fireG; ctx.lineWidth = 5; ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 30;
    rrect(ctx,14,14,W-28,H-28,16); ctx.stroke();
  }
  else if (style === "holo") {
    const phases = [[0,0,W,H,"#ff006e"],[W,0,0,H,"#7c00ff"],[0,H,W,0,"#0066ff"]];
    phases.forEach(([x1,y1,x2,y2,c],i) => {
      const hg2 = ctx.createLinearGradient(x1,y1,x2,y2);
      hg2.addColorStop(0,c+"88"); hg2.addColorStop(1,theme.secondary+"88");
      ctx.strokeStyle = hg2; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 20; ctx.globalAlpha = 0.8;
      rrect(ctx,12+i*6,12+i*6,W-24-i*12,H-24-i*12,18-i*3); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  else if (style === "egypt") {
    ["#ffd700","#daa520","#b8860b"].forEach((c,i) => {
      const m = 10+i*9;
      ctx.strokeStyle = c; ctx.lineWidth = 4-i; ctx.shadowColor = "#ff8c00"; ctx.shadowBlur = 12;
      rrect(ctx,m,m,W-m*2,H-m*2,0); ctx.stroke();
    });
    // Symboles ankh aux coins
    [[28,28],[W-28,28],[28,H-28],[W-28,H-28]].forEach(([ex,ey]) => {
      ctx.font = "22px serif"; ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ff8c00"; ctx.shadowBlur = 10;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("☥", ex, ey);
    });
  }

  ctx.restore();
}

// ─── Fonctions de dessin génériques ──────────────────────────────────────────
function drawStar4(ctx, x, y, r, color) {
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = r*2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI/2) - Math.PI/4;
    const a2 = a + Math.PI/4;
    ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    ctx.lineTo(Math.cos(a2)*r*0.4, Math.sin(a2)*r*0.4);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSimpleHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = size;
  ctx.beginPath();
  ctx.moveTo(x, y + size/4);
  ctx.bezierCurveTo(x, y, x-size/2, y, x-size/2, y+size/4);
  ctx.bezierCurveTo(x-size/2, y+size/2, x, y+size, x, y+size);
  ctx.bezierCurveTo(x, y+size, x+size/2, y+size/2, x+size/2, y+size/4);
  ctx.bezierCurveTo(x+size/2, y, x, y, x, y+size/4);
  ctx.fill();
  ctx.restore();
}

function drawBigHeart(ctx, cx, cy, size, color) {
  ctx.save();
  // Lueur multicouche
  [3, 2, 1.5, 1].forEach((mult, i) => {
    ctx.globalAlpha = [0.15, 0.25, 0.4, 1][i];
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = size * mult * 1.5;
    const s = size * [1.4, 1.2, 1.1, 1][i];
    ctx.beginPath();
    ctx.moveTo(cx, cy + s/4);
    ctx.bezierCurveTo(cx, cy, cx-s/2, cy, cx-s/2, cy+s/4);
    ctx.bezierCurveTo(cx-s/2, cy+s/2, cx, cy+s, cx, cy+s);
    ctx.bezierCurveTo(cx, cy+s, cx+s/2, cy+s/2, cx+s/2, cy+s/4);
    ctx.bezierCurveTo(cx+s/2, cy, cx, cy, cx, cy+s/4);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Reflet blanc
  ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(cx - size*0.12, cy + size*0.1, size*0.18, size*0.1, -Math.PI/5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── Avatar frame ultra-designé ───────────────────────────────────────────────
function drawAvatarFrame(ctx, cx, cy, radius, theme) {
  ctx.save();
  // Halo extérieur dégradé
  const hg = ctx.createRadialGradient(cx,cy,radius,cx,cy,radius+50);
  hg.addColorStop(0, theme.heart+"66"); hg.addColorStop(1,"transparent");
  ctx.fillStyle = hg; ctx.fillRect(cx-radius-55, cy-radius-55, (radius+55)*2, (radius+55)*2);

  // Anneaux
  const rings = [
    {r: radius+30, w:8,  c:theme.secondary, blur:20},
    {r: radius+20, w:6,  c:theme.accent,    blur:15},
    {r: radius+10, w:4,  c:theme.heart,     blur:12},
    {r: radius+2,  w:3,  c:"#ffffff",       blur:8 },
  ];
  rings.forEach(({r,w,c,blur}) => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.shadowColor = c; ctx.shadowBlur = blur;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Ornements orbitaux (12 points)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const ox = cx + Math.cos(angle) * (radius + 38);
    const oy = cy + Math.sin(angle) * (radius + 38);
    if (i % 3 === 0) {
      drawSimpleHeart(ctx, ox-7, oy-7, 14, theme.heart);
    } else if (i % 3 === 1) {
      drawStar4(ctx, ox, oy, 5, theme.accent);
    } else {
      ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI*2);
      ctx.fillStyle = theme.secondary; ctx.shadowColor = theme.secondary; ctx.shadowBlur = 8; ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Texte stylisé ────────────────────────────────────────────────────────────
function drawText(ctx, text, x, y, size, theme, opts = {}) {
  const { alpha = 1, stroke = true, shadow = true, gradient = true } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font         = `bold ${size}px PairFont, BeVietnamPro-Bold, Arial`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  if (shadow) {
    // 4 couches d'ombre
    [[40,4,4,"rgba(0,0,0,0.6)"],[25,3,3,theme.glow+"cc"],[15,2,2,theme.accent],[8,1,1,theme.heart]].forEach(([bl,ox,oy,c]) => {
      ctx.shadowColor = c; ctx.shadowBlur = bl; ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy;
      ctx.fillStyle = theme.text; ctx.fillText(text, x, y);
    });
  }

  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  if (gradient) {
    const tw = ctx.measureText(text).width;
    const tg = ctx.createLinearGradient(x-tw/2, y-size/2, x+tw/2, y+size/2);
    tg.addColorStop(0, theme.text); tg.addColorStop(0.5,"#ffffff"); tg.addColorStop(1,theme.text);
    ctx.fillStyle = tg;
  } else {
    ctx.fillStyle = theme.text;
  }
  ctx.fillText(text, x, y);

  if (stroke) {
    ctx.strokeStyle = theme.heart; ctx.lineWidth = 1.5; ctx.strokeText(text, x, y);
  }
  ctx.restore();
}

// ─── Barre de compatibilité ultra-designée ────────────────────────────────────
function drawCompatBar(ctx, pct, x, y, w, h, theme) {
  ctx.save();

  // Fond ombre portée
  ctx.shadowColor = theme.glow; ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  rrect(ctx, x-6, y-6, w+12, h+12, [20]); ctx.fill();

  // Track
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  rrect(ctx, x, y, w, h, [14]); ctx.fill();

  // Remplissage dégradé
  const stops = theme.barGrad;
  const barW   = (w * pct) / 100;
  const bg = ctx.createLinearGradient(x, y, x+w, y);
  stops.forEach((c, i) => bg.addColorStop(i/(stops.length-1), c));
  ctx.fillStyle = bg; ctx.shadowColor = theme.glow; ctx.shadowBlur = 25;
  rrect(ctx, x, y, barW, h, [14]); ctx.fill();

  // Shine
  const sg = ctx.createLinearGradient(x, y, x, y+h);
  sg.addColorStop(0,"rgba(255,255,255,0.6)"); sg.addColorStop(0.45,"rgba(255,255,255,0.2)"); sg.addColorStop(1,"transparent");
  ctx.fillStyle = sg; ctx.shadowBlur = 0;
  rrect(ctx, x, y, barW, h*0.45, [14,14,0,0]); ctx.fill();

  // Contour brillant
  ctx.strokeStyle = theme.heart; ctx.lineWidth = 3; ctx.shadowColor = theme.heart; ctx.shadowBlur = 15;
  rrect(ctx, x, y, w, h, [14]); ctx.stroke();

  // Cœurs flottants au-dessus
  for (let i = 0; i < 7; i++) {
    const hx = x + (i * w/6) - 6;
    const hy = y - 18 - Math.random()*8;
    drawSimpleHeart(ctx, hx, hy, 10, theme.heart);
  }

  // Pourcentage
  ctx.shadowBlur = 0;
  ctx.font = `bold ${Math.floor(h*0.55)}px PairFont, Arial`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "#ffffff";
  ctx.shadowColor  = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 6;
  ctx.fillText(`${pct}%`, x + w/2, y + h/2);

  ctx.restore();
}

// ─── Ligne de connexion entre avatars ─────────────────────────────────────────
function drawConnection(ctx, x1, y1, x2, y2, heartCX, heartCY, theme) {
  ctx.save();
  // Ligne pointillée lumineuse
  ctx.strokeStyle = theme.accent; ctx.lineWidth = 4;
  ctx.shadowColor = theme.accent; ctx.shadowBlur = 15;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(heartCX - 40, heartCY);
  ctx.moveTo(heartCX + 40, heartCY); ctx.lineTo(x2, y2);
  ctx.stroke(); ctx.setLineDash([]);

  // Mini cœurs le long des lignes
  const sides = [[x1,y1,heartCX-40,heartCY],[heartCX+40,heartCY,x2,y2]];
  sides.forEach(([sx,sy,ex,ey]) => {
    for (let t = 0.2; t <= 0.85; t += 0.25) {
      const mx = sx + (ex-sx)*t, my = sy + (ey-sy)*t;
      drawSimpleHeart(ctx, mx-6, my-6, 12, theme.secondary);
    }
  });
  ctx.restore();
}

// ─── Canvas principal ─────────────────────────────────────────────────────────
async function buildCanvas(id1, id2, name1, name2, pct, theme, avt1Path, avt2Path) {
  const W = 1400, H = 820;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  // 1. Fond thématique
  theme.bg(ctx, W, H);

  // 2. Particules
  drawParticles(ctx, W, H, theme);

  // 3. Bordure thématique
  drawBorder(ctx, W, H, theme);

  // ── Layout ──
  const avatarR  = 115;
  const av1CX    = 220,  avCY = 380;
  const av2CX    = W - 220;
  const heartCX  = W / 2, heartCY = avCY;

  // 4. Connexion
  drawConnection(ctx, av1CX + avatarR, avCY, av2CX - avatarR, avCY, heartCX, heartCY, theme);

  // 5. Frames avatars
  drawAvatarFrame(ctx, av1CX, avCY, avatarR, theme);
  drawAvatarFrame(ctx, av2CX, avCY, avatarR, theme);

  // 6. Photos
  const [img1, img2] = await Promise.all([loadImage(avt1Path), loadImage(avt2Path)]);
  [[[av1CX, avCY], img1], [[av2CX, avCY], img2]].forEach(([[cx,cy], img]) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, avatarR, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(img, cx-avatarR, cy-avatarR, avatarR*2, avatarR*2);
    ctx.restore();
  });

  // 7. Grand cœur central
  drawBigHeart(ctx, heartCX - 38, heartCY - 50, 76, theme.heart);

  // 8. Titre thème (haut)
  drawText(ctx, `${theme.emoji}  ${theme.name}  ${theme.emoji}`, W/2, 65, 44, theme);

  // 9. Sous-titre
  drawText(ctx, "✦  LOVE CONNECTION  ✦", W/2, 122, 30, theme, { stroke: false });

  // 10. Noms
  drawText(ctx, name1, av1CX, avCY + avatarR + 55, 32, theme);
  drawText(ctx, name2, av2CX, avCY + avatarR + 55, 32, theme);

  // 11. Message romantique
  const msgs  = MESSAGES[Object.keys(THEMES).find(k => THEMES[k] === theme)] || [];
  const msg   = msgs[Math.floor(Math.random() * msgs.length)] || "Love eternal";
  drawText(ctx, `❝  ${msg}  ❞`, W/2, 580, 28, theme, { stroke: false });

  // 12. Barre de compatibilité
  drawCompatBar(ctx, pct, W/2 - 280, 620, 560, 52, theme);

  // 13. Pied de page
  drawText(ctx, "✦  Eternal Love  ✦", W/2, 760, 24, theme, { stroke: false, gradient: false });

  // 14. Ligne décorative séparatrice
  ctx.save();
  const lineG = ctx.createLinearGradient(W*0.1, 550, W*0.9, 550);
  lineG.addColorStop(0,"transparent"); lineG.addColorStop(0.5, theme.accent+"88"); lineG.addColorStop(1,"transparent");
  ctx.strokeStyle = lineG; ctx.lineWidth = 1.5; ctx.shadowColor = theme.accent; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(W*0.1, 550); ctx.lineTo(W*0.9, 550); ctx.stroke();
  ctx.restore();

  return canvas;
}

// ─── Sélection du partenaire ──────────────────────────────────────────────────
async function getTargetUser(api, event, args) {
  let targetID = null;
  if (event.messageReply) {
    targetID = event.messageReply.senderID;
  } else if (Object.keys(event.mentions || {}).length > 0) {
    targetID = Object.keys(event.mentions)[0];
  } else if (args[1] && /^\d+$/.test(args[1])) {
    targetID = args[1];
  } else {
    try {
      const info   = await api.getThreadInfo(event.threadID);
      if (!info?.userInfo) return null;
      const botID  = api.getCurrentUserID();
      let cands    = info.userInfo.filter(u => u.id !== event.senderID && u.id !== botID);
      if (!cands.length) return null;
      // Gender-based pairing
      try {
        const me = await api.getUserInfo(event.senderID);
        const myGender = me[event.senderID]?.gender;
        if (myGender) {
          const opp = [];
          for (const c of cands) {
            try {
              const ci = await api.getUserInfo(c.id);
              const cg = ci[c.id]?.gender;
              if ((myGender === 1 && cg === 2) || (myGender === 2 && cg === 1)) opp.push(c);
            } catch (_) {}
          }
          if (opp.length) cands = opp;
        }
      } catch (_) {}
      targetID = cands[Math.floor(Math.random() * cands.length)].id;
    } catch (e) { console.log("getTargetUser:", e.message); return null; }
  }
  return targetID;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "pair",
    author: "Christus",
    role: 0,
    description: "💕 Pair Royal — Carte de compatibilité amoureuse ultra-designée (10 thèmes)",
    category: "media",
    guide: {
      en:
        "pair — Pairing aléatoire depuis le groupe\n" +
        "pair @mention — Avec un utilisateur mentionné\n" +
        "pair <uid> — Par ID utilisateur\n\n" +
        "Thèmes disponibles :\n" +
        "  neon_tokyo | galaxy_drift | cherry_blossom | aurora\n" +
        "  golden_luxury | midnight_rose | ice_palace\n" +
        "  lava_flame | holographic | ancient_egypt\n\n" +
        "pair neon_tokyo @mention — Thème spécifique + mention",
    },
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    if (!canvasAvailable) {
      return api.sendMessage("❌ Canvas not installed. Run 'npm install canvas'.", event.threadID, event.messageID);
    }

    // Capture du messageID via callback pour compatibilité FCA
    let processingMsgID = null;
    await new Promise(resolve => {
      api.sendMessage("💫 Création de votre carte romantique...", event.threadID, (err, info) => {
        if (!err && info?.messageID) processingMsgID = info.messageID;
        resolve();
      });
    });

    const unsendProcessing = async () => {
      if (processingMsgID) {
        try { await api.unsendMessage(processingMsgID, event.threadID); } catch (_) {}
      }
    };

    try {
      // ── Sélection du thème ──
      const themeKeys  = Object.keys(THEMES);
      const argTheme   = args.find(a => themeKeys.includes(a.toLowerCase()));
      const selectedKey = argTheme || themeKeys[Math.floor(Math.random() * themeKeys.length)];
      const theme       = THEMES[selectedKey];

      // ── Joueurs ──
      const id1 = event.senderID;
      const id2 = await getTargetUser(api, event, args);
      if (!id2) {
        await unsendProcessing();
        return api.sendMessage("❌ Aucun partenaire trouvé ! Mentionnez quelqu'un ou assurez-vous d'être dans un groupe.", event.threadID, event.messageID);
      }

      const [info1, info2] = await Promise.all([api.getUserInfo(id1), api.getUserInfo(id2)]);
      if (!info1[id1] || !info2[id2]) {
        await unsendProcessing();
        return api.sendMessage("❌ Impossible de récupérer les infos utilisateurs.", event.threadID, event.messageID);
      }

      const name1 = info1[id1].name;
      const name2 = info2[id2].name;

      // ── Compatibilité ──
      const specials = [87,88,89,90,91,92,93,94,95,96,97,98,99,100];
      const pct      = specials[Math.floor(Math.random() * specials.length)];

      // ── Avatars ──
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
      const avt1Path = path.join(cacheDir, `pair_av1_${Date.now()}.png`);
      const avt2Path = path.join(cacheDir, `pair_av2_${Date.now()}.png`);
      const outPath  = path.join(cacheDir, `pair_out_${Date.now()}.png`);

      const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const [d1, d2] = await Promise.all([
        axios.get(`https://graph.facebook.com/${id1}/picture?width=500&height=500&access_token=${FB_TOKEN}`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${id2}/picture?width=500&height=500&access_token=${FB_TOKEN}`, { responseType: "arraybuffer" }),
      ]);
      fs.writeFileSync(avt1Path, Buffer.from(d1.data));
      fs.writeFileSync(avt2Path, Buffer.from(d2.data));

      // ── Canvas ──
      const canvas = await buildCanvas(id1, id2, name1, name2, pct, theme, avt1Path, avt2Path);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      fs.removeSync(avt1Path); fs.removeSync(avt2Path);
      await unsendProcessing();

      const msgs  = MESSAGES[selectedKey] || [];
      const msg   = msgs[Math.floor(Math.random() * msgs.length)] || "Love eternal";

      return api.sendMessage(
        {
          body: `${theme.emoji} ${msg} ${theme.emoji}\n\n💕 ${name1} ✦ ${name2}\n❤️ Compatibilité : ${pct}%\n🎨 Thème : ${theme.name}`,
          mentions: [
            { tag: name1, id: id1 },
            { tag: name2, id: id2 },
          ],
          attachment: fs.createReadStream(outPath),
        },
        event.threadID,
        () => { try { fs.unlinkSync(outPath); } catch (_) {} },
        event.messageID
      );

    } catch (err) {
      console.error("Pair Royal error:", err);
      await unsendProcessing();
      return api.sendMessage(`❌ Erreur : ${err.message}`, event.threadID, event.messageID);
    }
  },
};
