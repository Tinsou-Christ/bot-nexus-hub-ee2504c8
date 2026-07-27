"use strict";

const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

// ─────────────────────────────────────────────
//  FONTS
// ─────────────────────────────────────────────
let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "MemFont", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "MemFont", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "MemFont", weight: "600" });
} catch(e) { console.log("[Memory] Font:", e.message); }

const MF = {
  bold:    s => `bold ${s}px MemFont, Arial`,
  semi:    s => `600 ${s}px MemFont, Arial`,
  regular: s => `${s}px MemFont, Arial`,
};

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const GAME_EXPIRE_MS = 1000 * 60 * 30;  // 30 min
const BOT_DELAY      = 1400;
const MIN_BET        = 100;
const MAX_BET        = 50_000;

const activeGames = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  TAILLES DE GRILLE
// ─────────────────────────────────────────────
const GRID_MODES = {
  "4x4": { cols: 4, rows: 4, pairs: 8  },
  "4x6": { cols: 6, rows: 4, pairs: 12 },
  "6x6": { cols: 6, rows: 6, pairs: 18 },
};
const DEFAULT_GRID = "4x4";

// ─────────────────────────────────────────────
//  SYMBOLES CANVAS (aucun emoji — dessines en Canvas pur)
//  Chaque symbole a un id, un label court, et une drawFn
// ─────────────────────────────────────────────
const SYMBOL_DEFS = [
  { id: "diamond",  label: "DIAM"  },
  { id: "crown",    label: "CROWN" },
  { id: "star",     label: "STAR"  },
  { id: "heart",    label: "HEART" },
  { id: "club",     label: "CLUB"  },
  { id: "spade",    label: "SPADE" },
  { id: "bell",     label: "BELL"  },
  { id: "bolt",     label: "BOLT"  },
  { id: "moon",     label: "MOON"  },
  { id: "sun",      label: "SUN"   },
  { id: "shield",   label: "SHLD"  },
  { id: "gem",      label: "GEM"   },
  { id: "anchor",   label: "ANKR"  },
  { id: "flame",    label: "FIRE"  },
  { id: "key",      label: "KEY"   },
  { id: "seven",    label: "7"     },
  { id: "skull",    label: "SKUL"  },
  { id: "note",     label: "NOTE"  },
];

// ─────────────────────────────────────────────
//  FORMATAGE
// ─────────────────────────────────────────────
function fmt(n) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

// ─────────────────────────────────────────────
//  DESSIN DES SYMBOLES (Canvas pur)
// ─────────────────────────────────────────────
function drawSymbol(ctx, id, cx, cy, size) {
  const s = size * 0.38;
  ctx.save();
  ctx.translate(cx, cy);

  switch (id) {

    case "diamond": {
      const g = ctx.createLinearGradient(-s, 0, s, 0);
      g.addColorStop(0, "#00e5ff"); g.addColorStop(0.5, "#ffffff"); g.addColorStop(1, "#0088cc");
      ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, -s*1.3); ctx.lineTo(s, 0); ctx.lineTo(0, s*1.3); ctx.lineTo(-s, 0);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0,-s*1.3); ctx.lineTo(0,s*1.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s,0); ctx.lineTo(s,0); ctx.stroke();
      break;
    }

    case "crown": {
      const cg = ctx.createLinearGradient(0, -s, 0, s);
      cg.addColorStop(0, "#ffe066"); cg.addColorStop(0.5, "#c9a84c"); cg.addColorStop(1, "#7a5c00");
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 18;
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.rect(-s, s*0.1, s*2, s*0.9); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s, s*0.1); ctx.lineTo(-s, -s*0.6); ctx.lineTo(-s*0.5, -s*0.1);
      ctx.lineTo(0, -s*0.85); ctx.lineTo(s*0.5, -s*0.1); ctx.lineTo(s, -s*0.6);
      ctx.lineTo(s, s*0.1); ctx.closePath(); ctx.fill();
      for (const gx of [-s*0.55, 0, s*0.55]) {
        ctx.beginPath(); ctx.arc(gx, s*0.5, s*0.18, 0, Math.PI*2);
        ctx.fillStyle = "#ff3366"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      break;
    }

    case "star": {
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, s*1.2);
      sg.addColorStop(0, "#fff176"); sg.addColorStop(0.5, "#fdd835"); sg.addColorStop(1, "#f9a825");
      ctx.shadowColor = "#ffe066"; ctx.shadowBlur = 16;
      ctx.fillStyle = sg;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI/5)*i - Math.PI/2;
        const r2 = i%2===0 ? s*1.2 : s*0.5;
        i===0 ? ctx.moveTo(Math.cos(angle)*r2, Math.sin(angle)*r2)
              : ctx.lineTo(Math.cos(angle)*r2, Math.sin(angle)*r2);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f57f17"; ctx.lineWidth = 2; ctx.stroke();
      break;
    }

    case "heart": {
      ctx.shadowColor = "#ff4466"; ctx.shadowBlur = 16;
      const hg = ctx.createRadialGradient(-s*0.2, -s*0.3, 0, 0, 0, s*1.2);
      hg.addColorStop(0, "#ff6680"); hg.addColorStop(0.6, "#ff1144"); hg.addColorStop(1, "#99002a");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, s*0.9);
      ctx.bezierCurveTo(-s*1.2, s*0.2, -s*1.4, -s*0.8, 0, -s*0.2);
      ctx.bezierCurveTo(s*1.4, -s*0.8, s*1.2, s*0.2, 0, s*0.9);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.ellipse(-s*0.4, -s*0.3, s*0.3, s*0.18, -0.5, 0, Math.PI*2); ctx.fill();
      break;
    }

    case "club": {
      ctx.shadowColor = "#aaffaa"; ctx.shadowBlur = 12;
      const clg = ctx.createRadialGradient(0, 0, 0, 0, 0, s*1.1);
      clg.addColorStop(0, "#88ff88"); clg.addColorStop(1, "#228822");
      ctx.fillStyle = clg;
      for (const [ox, oy] of [[-s*0.5, s*0.1],[s*0.5, s*0.1],[0, -s*0.65]]) {
        ctx.beginPath(); ctx.arc(ox, oy, s*0.58, 0, Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.rect(-s*0.2, s*0.5, s*0.4, s*0.7); ctx.fill();
      ctx.beginPath(); ctx.rect(-s*0.6, s*1.0, s*1.2, s*0.25); ctx.fill();
      break;
    }

    case "spade": {
      ctx.shadowColor = "#aaaaff"; ctx.shadowBlur = 12;
      const spg = ctx.createRadialGradient(0, 0, 0, 0, 0, s*1.2);
      spg.addColorStop(0, "#8888ff"); spg.addColorStop(1, "#222288");
      ctx.fillStyle = spg;
      ctx.beginPath();
      ctx.moveTo(0, -s*1.1);
      ctx.bezierCurveTo(s*1.3, s*0.1, s*0.5, s*0.9, 0, s*0.3);
      ctx.bezierCurveTo(-s*0.5, s*0.9, -s*1.3, s*0.1, 0, -s*1.1);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.rect(-s*0.2, s*0.3, s*0.4, s*0.7); ctx.fill();
      ctx.beginPath(); ctx.rect(-s*0.6, s*0.9, s*1.2, s*0.25); ctx.fill();
      break;
    }

    case "bell": {
      const bg = ctx.createRadialGradient(-s*0.2, -s*0.3, 0, 0, 0, s*1.2);
      bg.addColorStop(0, "#ffe066"); bg.addColorStop(0.6, "#c9a84c"); bg.addColorStop(1, "#7a5c00");
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 14;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-s*0.15, -s*1.1);
      ctx.bezierCurveTo(-s*1.1, -s*1.1, -s*1.2, s*0.4, -s*0.9, s*0.6);
      ctx.lineTo(s*0.9, s*0.6);
      ctx.bezierCurveTo(s*1.2, s*0.4, s*1.1, -s*1.1, s*0.15, -s*1.1);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#7a5c00"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s*0.85, s*0.2, 0, Math.PI*2);
      ctx.fillStyle = "#c9a84c"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -s*1.1, s*0.18, 0, Math.PI*2);
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 4; ctx.stroke();
      break;
    }

    case "bolt": {
      ctx.shadowColor = "#ffff00"; ctx.shadowBlur = 20;
      const bog = ctx.createLinearGradient(0, -s*1.2, 0, s*1.2);
      bog.addColorStop(0, "#ffff88"); bog.addColorStop(0.5, "#ffcc00"); bog.addColorStop(1, "#ff8800");
      ctx.fillStyle = bog;
      ctx.beginPath();
      ctx.moveTo(s*0.3, -s*1.2); ctx.lineTo(-s*0.5, s*0.1);
      ctx.lineTo(s*0.2, s*0.1);  ctx.lineTo(-s*0.3, s*1.2);
      ctx.lineTo(s*0.7, -s*0.2); ctx.lineTo(0, -s*0.2); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#fff8"; ctx.lineWidth = 1.5; ctx.stroke();
      break;
    }

    case "moon": {
      ctx.shadowColor = "#aaddff"; ctx.shadowBlur = 16;
      const mg = ctx.createRadialGradient(-s*0.2, -s*0.2, 0, 0, 0, s*1.2);
      mg.addColorStop(0, "#ddeeff"); mg.addColorStop(1, "#3366aa");
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(0, 0, s*1.05, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#0d1b2a";
      ctx.beginPath(); ctx.arc(s*0.42, -s*0.2, s*0.82, 0, Math.PI*2); ctx.fill();
      // Etoiles decoratives
      ctx.fillStyle = "#ffffff";
      for (const [sx, sy, sr] of [[-s*0.5, s*0.5, s*0.1],[-s*0.8, s*0.1, s*0.07]]) {
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
      }
      break;
    }

    case "sun": {
      ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 22;
      const sug = ctx.createRadialGradient(0, 0, 0, 0, 0, s*0.9);
      sug.addColorStop(0, "#fffde7"); sug.addColorStop(0.5, "#ffd600"); sug.addColorStop(1, "#ff8f00");
      ctx.fillStyle = sug;
      ctx.beginPath(); ctx.arc(0, 0, s*0.8, 0, Math.PI*2); ctx.fill();
      // Rayons
      ctx.strokeStyle = "#ffd600"; ctx.lineWidth = s*0.22;
      ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI/4)*i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*s*0.95, Math.sin(a)*s*0.95);
        ctx.lineTo(Math.cos(a)*s*1.35, Math.sin(a)*s*1.35);
        ctx.stroke();
      }
      break;
    }

    case "shield": {
      ctx.shadowColor = "#4488ff"; ctx.shadowBlur = 14;
      const shg = ctx.createLinearGradient(0, -s*1.1, 0, s*1.1);
      shg.addColorStop(0, "#6699ff"); shg.addColorStop(0.5, "#2255cc"); shg.addColorStop(1, "#112288");
      ctx.fillStyle = shg;
      ctx.beginPath();
      ctx.moveTo(0, -s*1.1);
      ctx.lineTo(s, -s*0.6); ctx.lineTo(s, s*0.3);
      ctx.bezierCurveTo(s, s*0.9, 0, s*1.2, 0, s*1.2);
      ctx.bezierCurveTo(0, s*1.2, -s, s*0.9, -s, s*0.3);
      ctx.lineTo(-s, -s*0.6); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#aaccff"; ctx.lineWidth = 2; ctx.stroke();
      // Croix
      ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = s*0.18;
      ctx.beginPath(); ctx.moveTo(0,-s*0.6); ctx.lineTo(0,s*0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.5,s*0.0); ctx.lineTo(s*0.5,s*0.0); ctx.stroke();
      break;
    }

    case "gem": {
      ctx.shadowColor = "#ff44ff"; ctx.shadowBlur = 18;
      const gg = ctx.createLinearGradient(-s, -s*0.5, s, s*0.5);
      gg.addColorStop(0, "#ff88ff"); gg.addColorStop(0.3, "#ffffff"); gg.addColorStop(0.6, "#cc00ff"); gg.addColorStop(1, "#660088");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(-s*0.6, -s*0.3); ctx.lineTo(-s*0.9, s*0.1);
      ctx.lineTo(0, s*1.1); ctx.lineTo(s*0.9, s*0.1);
      ctx.lineTo(s*0.6, -s*0.3); ctx.lineTo(s*0.2, -s*0.9);
      ctx.lineTo(-s*0.2, -s*0.9); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ff88ff55"; ctx.lineWidth = 1.5; ctx.stroke();
      // Facettes
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s*0.6,-s*0.3); ctx.lineTo(s*0.6,-s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.6,-s*0.3); ctx.lineTo(0,s*1.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.6,-s*0.3); ctx.lineTo(0,s*1.1); ctx.stroke();
      break;
    }

    case "anchor": {
      ctx.shadowColor = "#88aacc"; ctx.shadowBlur = 10;
      ctx.strokeStyle = "#7090aa"; ctx.lineWidth = s*0.28;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      // Barre horizontale
      ctx.beginPath(); ctx.moveTo(-s*0.9, -s*0.8); ctx.lineTo(s*0.9, -s*0.8); ctx.stroke();
      // Tige verticale
      ctx.beginPath(); ctx.moveTo(0, -s*0.8); ctx.lineTo(0, s*1.0); ctx.stroke();
      // Boucle supérieure
      ctx.beginPath(); ctx.arc(0, -s*1.0, s*0.25, 0, Math.PI*2); ctx.stroke();
      // Courbe du bas
      ctx.beginPath();
      ctx.moveTo(-s*0.8, s*0.5); ctx.bezierCurveTo(-s*1.1, s*1.5, s*1.1, s*1.5, s*0.8, s*0.5);
      ctx.stroke();
      // Remplissage deco
      ctx.fillStyle = "#7090aa55";
      ctx.beginPath(); ctx.arc(0, -s*1.0, s*0.2, 0, Math.PI*2); ctx.fill();
      break;
    }

    case "flame": {
      ctx.shadowColor = "#ff5500"; ctx.shadowBlur = 20;
      const fg = ctx.createLinearGradient(0, -s*1.2, 0, s*1.0);
      fg.addColorStop(0, "#ffffff"); fg.addColorStop(0.2, "#ffee44"); fg.addColorStop(0.5, "#ff8800"); fg.addColorStop(1, "#cc0000");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, s*1.0);
      ctx.bezierCurveTo(-s*1.0, s*0.4, -s*0.8, -s*0.3, -s*0.2, -s*0.6);
      ctx.bezierCurveTo(-s*0.3, -s*1.2, s*0.4, -s*0.8, 0, -s*1.2);
      ctx.bezierCurveTo(0, -s*0.6, s*0.5, -s*0.7, s*0.4, -s*0.2);
      ctx.bezierCurveTo(s*0.9, -s*0.4, s*1.0, s*0.4, 0, s*1.0);
      ctx.closePath(); ctx.fill();
      // Coeur de flamme
      ctx.fillStyle = "#ffffffaa";
      ctx.beginPath();
      ctx.moveTo(0, s*0.7);
      ctx.bezierCurveTo(-s*0.3, s*0.3, -s*0.2, s*0.0, 0, -s*0.2);
      ctx.bezierCurveTo(s*0.2, s*0.0, s*0.3, s*0.3, 0, s*0.7);
      ctx.closePath(); ctx.fill();
      break;
    }

    case "key": {
      ctx.shadowColor = "#ddbb44"; ctx.shadowBlur = 12;
      const kg = ctx.createLinearGradient(-s, -s, s, s);
      kg.addColorStop(0, "#ffe066"); kg.addColorStop(0.5, "#c9a84c"); kg.addColorStop(1, "#7a5c00");
      ctx.fillStyle = kg;
      ctx.strokeStyle = "#7a5c00"; ctx.lineWidth = 2; ctx.lineCap = "round";
      // Anneau
      ctx.beginPath(); ctx.arc(-s*0.3, -s*0.3, s*0.65, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Trou de l'anneau
      ctx.fillStyle = "#0d1b2a";
      ctx.beginPath(); ctx.arc(-s*0.3, -s*0.3, s*0.32, 0, Math.PI*2); ctx.fill();
      // Tige
      ctx.fillStyle = kg;
      ctx.beginPath(); ctx.rect(s*0.1, -s*0.12, s*1.0, s*0.24); ctx.fill(); ctx.stroke();
      // Dents
      for (const dx of [0.3, 0.6]) {
        ctx.beginPath(); ctx.rect(s*dx+s*0.1, s*0.12, s*0.2, s*0.35); ctx.fill();
      }
      break;
    }

    case "seven": {
      ctx.font = MF.bold(Math.floor(size * 0.68));
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 18;
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 4;
      ctx.strokeText("7", 0, 2);
      ctx.fillStyle = "#ff2222"; ctx.fillText("7", 0, 2);
      break;
    }

    case "skull": {
      ctx.shadowColor = "#aaaacc"; ctx.shadowBlur = 12;
      const skg = ctx.createLinearGradient(0, -s*1.1, 0, s*1.1);
      skg.addColorStop(0, "#ddddee"); skg.addColorStop(1, "#8888aa");
      ctx.fillStyle = skg;
      // Crane
      ctx.beginPath(); ctx.arc(0, -s*0.15, s, 0, Math.PI*2); ctx.fill();
      // Machoire
      ctx.beginPath();
      ctx.moveTo(-s*0.7, s*0.4); ctx.lineTo(-s*0.7, s*1.0);
      ctx.lineTo(s*0.7, s*1.0); ctx.lineTo(s*0.7, s*0.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#0d1b2a55"; ctx.lineWidth = 2; ctx.stroke();
      // Yeux
      ctx.fillStyle = "#0d1b2a";
      for (const ex of [-s*0.38, s*0.38]) {
        ctx.beginPath(); ctx.arc(ex, -s*0.3, s*0.24, 0, Math.PI*2); ctx.fill();
      }
      // Nez
      ctx.beginPath(); ctx.arc(0, s*0.1, s*0.14, 0, Math.PI*2); ctx.fill();
      // Dents
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = "#0d1b2a";
        ctx.beginPath(); ctx.rect(i*s*0.28 - s*0.12, s*0.55, s*0.24, s*0.35); ctx.fill();
        ctx.fillStyle = skg;
        ctx.beginPath(); ctx.rect(i*s*0.28 - s*0.12, s*0.65, s*0.24, s*0.25); ctx.fill();
      }
      break;
    }

    case "note": {
      ctx.shadowColor = "#ff88cc"; ctx.shadowBlur = 12;
      const nog = ctx.createLinearGradient(0, -s*1.1, 0, s*1.1);
      nog.addColorStop(0, "#ff88cc"); nog.addColorStop(1, "#cc2288");
      ctx.fillStyle = nog;
      // Hampe
      ctx.beginPath(); ctx.rect(s*0.1, -s*1.0, s*0.2, s*1.5); ctx.fill();
      // Tete de note
      ctx.beginPath(); ctx.ellipse(-s*0.1, s*0.5, s*0.38, s*0.28, -0.4, 0, Math.PI*2); ctx.fill();
      // Crochet
      ctx.strokeStyle = nog; ctx.lineWidth = s*0.18; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s*0.3, -s*1.0);
      ctx.bezierCurveTo(s*1.1, -s*1.0, s*1.1, -s*0.4, s*0.3, -s*0.4);
      ctx.stroke();
      break;
    }

    default: {
      ctx.font = MF.bold(Math.floor(size*0.5));
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("?", 0, 2);
    }
  }
  ctx.restore();
}

// ─────────────────────────────────────────────
//  COULEUR ACCENT PAR SYMBOLE (pour reflet de la carte)
// ─────────────────────────────────────────────
const SYMBOL_ACCENT = {
  diamond:"#00e5ff", crown:"#ffd700", star:"#fdd835", heart:"#ff1144",
  club:"#44ff88", spade:"#8888ff", bell:"#ffd700", bolt:"#ffcc00",
  moon:"#aaddff", sun:"#ffdd00", shield:"#4488ff", gem:"#cc00ff",
  anchor:"#88aacc", flame:"#ff5500", key:"#c9a84c", seven:"#ff2222",
  skull:"#aaaacc", note:"#ff88cc",
};

// ─────────────────────────────────────────────
//  LOGIQUE DE JEU
// ─────────────────────────────────────────────
function buildBoard(gridKey) {
  const { cols, rows, pairs } = GRID_MODES[gridKey];
  const pool = SYMBOL_DEFS.slice(0, pairs);
  const doubled = [...pool, ...pool];
  // Mélange Fisher-Yates
  for (let i = doubled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((sym, idx) => ({
    idx,
    symbolId  : sym.id,
    symbolLabel: sym.label,
    revealed  : false,   // visible en permanence (paire trouvée)
    flipped   : false,   // retournée ce tour
  }));
}

function checkMatch(board, idxA, idxB) {
  return board[idxA].symbolId === board[idxB].symbolId;
}

function isBoardComplete(board) {
  return board.every(c => c.revealed);
}

// IA Bot Memory
function botChooseCard(game, player) {
  const { board, botMemory } = game;
  const hidden = board.filter(c => !c.revealed).map(c => c.idx);

  // Bot niveau "hard" utilise la mémoire parfaite
  // Bot niveau "easy" a 40% de chance d'utiliser la mémoire
  const useMemory = player.level === "hard" || Math.random() < 0.4;

  if (useMemory) {
    // Chercher une paire connue
    for (const [symId, idxList] of Object.entries(botMemory)) {
      const available = idxList.filter(i => !board[i].revealed);
      if (available.length >= 2) return available[0];
    }
  }

  // Retourner une carte non révélée au hasard parmi les non mémorisées
  const unknown = hidden.filter(i => {
    const sym = board[i].symbolId;
    return !botMemory[sym] || botMemory[sym].filter(x => !board[x].revealed).length < 2;
  });

  return unknown.length > 0
    ? unknown[Math.floor(Math.random()*unknown.length)]
    : hidden[Math.floor(Math.random()*hidden.length)];
}

function botSecondCard(game, firstIdx) {
  const { board, botMemory } = game;
  const firstSym = board[firstIdx].symbolId;

  // Chercher la paire en mémoire
  const memorized = (botMemory[firstSym] || []).filter(i => i !== firstIdx && !board[i].revealed);
  if (memorized.length > 0) return memorized[0];

  // Aléatoire sinon
  const hidden = board.filter(c => !c.revealed && c.idx !== firstIdx);
  return hidden[Math.floor(Math.random()*hidden.length)]?.idx ?? -1;
}

// Mettre à jour la mémoire bot après avoir vu une carte
function updateBotMemory(game, idx) {
  const sym = game.board[idx].symbolId;
  if (!game.botMemory[sym]) game.botMemory[sym] = [];
  if (!game.botMemory[sym].includes(idx)) game.botMemory[sym].push(idx);
}

// ─────────────────────────────────────────────
//  CANVAS RENDU
// ─────────────────────────────────────────────
const CW = 1300, CH = 900;

function renderMemory(game, highlightIdxs = [], matchResult = null) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  drawBg(ctx);
  drawMemHeader(ctx, game);
  drawGrid(ctx, game, highlightIdxs, matchResult);
  drawPlayerPanel(ctx, game);
  drawMemFooter(ctx, game);

  return canvas;
}

function drawBg(ctx) {
  const g = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, Math.max(CW,CH)/1.4);
  g.addColorStop(0, "#001030"); g.addColorStop(0.5, "#000820"); g.addColorStop(1, "#000000");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);

  // Ambiance lumiere
  for (const [lx, ly, lc] of [[200,200,"#003366"],[CW-200,200,"#001166"],[CW/2,CH-100,"#002244"]]) {
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 320);
    lg.addColorStop(0, lc+"88"); lg.addColorStop(1, "transparent");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, CW, CH);
  }

  // Points
  ctx.save();
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.08 + Math.random()*0.12;
    ctx.beginPath();
    ctx.arc((i*173)%CW, (i*107+30)%CH, Math.random()*1.8+0.4, 0, Math.PI*2);
    ctx.fillStyle = "#88aaff"; ctx.fill();
  }
  ctx.restore();

  // Bordure
  const nb = ctx.createLinearGradient(0, 0, CW, CH);
  nb.addColorStop(0, "#0066ff"); nb.addColorStop(0.5, "#0033aa"); nb.addColorStop(1, "#0066ff");
  ctx.save();
  ctx.shadowColor = "#0055ff"; ctx.shadowBlur = 28;
  ctx.strokeStyle = nb; ctx.lineWidth = 6;
  rrPath(ctx, 8, 8, CW-16, CH-16, 30); ctx.stroke();
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(0,80,200,0.3)"; ctx.lineWidth = 2;
  rrPath(ctx, 16, 16, CW-32, CH-32, 26); ctx.stroke();
  ctx.restore();
}

function drawMemHeader(ctx, game) {
  ctx.save();
  ctx.shadowColor = "#0055ff"; ctx.shadowBlur = 18;
  rrPath(ctx, 38, 16, CW-76, 120, 18);
  ctx.fillStyle = "rgba(0,10,40,0.93)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,80,200,0.6)"; ctx.lineWidth = 2;
  rrPath(ctx, 38, 16, CW-76, 120, 18); ctx.stroke();
  ctx.restore();

  // Titre
  const tg = ctx.createLinearGradient(60, 28, 60, 90);
  tg.addColorStop(0, "#88bbff"); tg.addColorStop(0.5, "#3388ff"); tg.addColorStop(1, "#0044cc");
  ctx.save();
  ctx.shadowColor = "#3388ff"; ctx.shadowBlur = 20;
  ctx.font = MF.bold(46);
  ctx.fillStyle = tg;
  ctx.fillText("MEMORY  ROYAL", 60, 84);
  ctx.restore();

  // Infos
  const { cols, rows } = GRID_MODES[game.gridKey];
  const found = game.board.filter(c => c.revealed).length / 2;
  const total = game.board.length / 2;
  const infoStr = `Grille: ${cols}x${rows}  |  Paires: ${found}/${total}  |  Tour: ${game.totalTurns}`;
  ctx.font = MF.semi(18); ctx.fillStyle = "#6699cc";
  ctx.fillText(infoStr, 60, 114);

  // Mise
  if (game.bet > 0) {
    ctx.textAlign = "right";
    ctx.font = MF.semi(18); ctx.fillStyle = "#ffcc44";
    ctx.fillText(`Mise: ${fmt(game.bet)}  |  Pot: ${fmt(game.pot)}`, CW-52, 114);
    ctx.textAlign = "left";
  }
}

function drawGrid(ctx, game, highlightIdxs, matchResult) {
  const { cols, rows } = GRID_MODES[game.gridKey];
  const board = game.board;

  const gridX = 38, gridY = 152;
  const gridW = 740, gridH = CH - 168 - 30;
  const cellW = Math.floor(gridW / cols);
  const cellH = Math.floor(gridH / rows);

  // Fond grille
  ctx.save();
  ctx.shadowColor = "#003399"; ctx.shadowBlur = 22;
  rrPath(ctx, gridX, gridY, gridW, gridH, 18);
  ctx.fillStyle = "rgba(0,8,30,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,60,160,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, gridX, gridY, gridW, gridH, 18); ctx.stroke();
  ctx.restore();

  for (let i = 0; i < board.length; i++) {
    const card = board[i];
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const cx   = gridX + col * cellW;
    const cy   = gridY + row * cellH;
    const cw   = cellW - 4;
    const ch   = cellH - 4;
    const px   = cx + 2, py = cy + 2;

    const isHighlight = highlightIdxs.includes(i);
    const isMatch     = matchResult === true && isHighlight;
    const isMiss      = matchResult === false && isHighlight;

    if (card.revealed) {
      // Carte trouvee — fond vert sombre
      const bg2 = ctx.createRadialGradient(px+cw/2, py+ch/2, 10, px+cw/2, py+ch/2, cw/1.5);
      bg2.addColorStop(0, "#003322");
      bg2.addColorStop(1, "#001a10");
      ctx.save();
      ctx.shadowColor = SYMBOL_ACCENT[card.symbolId] || "#00ff88";
      ctx.shadowBlur = 8;
      rrPath(ctx, px, py, cw, ch, 10);
      ctx.fillStyle = bg2; ctx.fill();
      ctx.strokeStyle = (SYMBOL_ACCENT[card.symbolId] || "#00ff88") + "66";
      ctx.lineWidth = 2; rrPath(ctx, px, py, cw, ch, 10); ctx.stroke();
      ctx.restore();
      drawSymbol(ctx, card.symbolId, px+cw/2, py+ch/2, Math.min(cw,ch)*0.52);

    } else if (card.flipped || isHighlight) {
      // Carte retournee — face visible
      const accent = SYMBOL_ACCENT[card.symbolId] || "#aabbff";
      const fb = ctx.createRadialGradient(px+cw/2, py+ch/2, 8, px+cw/2, py+ch/2, cw/1.4);
      fb.addColorStop(0, isMatch ? "#002200" : isMiss ? "#220000" : "#000a20");
      fb.addColorStop(1, "#000010");
      ctx.save();
      ctx.shadowColor = isMatch ? "#00ff88" : isMiss ? "#ff2244" : accent;
      ctx.shadowBlur  = isMatch || isMiss ? 22 : 12;
      rrPath(ctx, px, py, cw, ch, 10);
      ctx.fillStyle = fb; ctx.fill();
      ctx.strokeStyle = isMatch ? "#00ff88" : isMiss ? "#ff2244" : accent;
      ctx.lineWidth = isMatch || isMiss ? 3 : 2;
      rrPath(ctx, px, py, cw, ch, 10); ctx.stroke();
      ctx.restore();
      drawSymbol(ctx, card.symbolId, px+cw/2, py+ch/2, Math.min(cw,ch)*0.52);

    } else {
      // Carte face cachée — dos de carte
      const back = ctx.createLinearGradient(px, py, px+cw, py+ch);
      back.addColorStop(0, "#0a1a3a"); back.addColorStop(0.5, "#071228"); back.addColorStop(1, "#0a1a3a");
      ctx.save();
      ctx.shadowColor = "#003399"; ctx.shadowBlur = 6;
      rrPath(ctx, px, py, cw, ch, 10);
      ctx.fillStyle = back; ctx.fill();
      ctx.strokeStyle = "rgba(30,80,180,0.5)"; ctx.lineWidth = 1.5;
      rrPath(ctx, px, py, cw, ch, 10); ctx.stroke();
      ctx.restore();

      // Motif dos — lignes croisées
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#4488ff"; ctx.lineWidth = 1;
      const step = 10;
      for (let dx = -ch; dx < cw; dx += step) {
        ctx.beginPath(); ctx.moveTo(px+dx, py); ctx.lineTo(px+dx+ch, py+ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+dx+ch, py); ctx.lineTo(px+dx, py+ch); ctx.stroke();
      }
      ctx.restore();

      // Numero de case (aide)
      ctx.font = MF.semi(Math.floor(Math.min(cw,ch)*0.22));
      ctx.fillStyle = "rgba(100,140,220,0.5)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i+1), px+cw/2, py+ch/2);
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    }
  }
}

function drawPlayerPanel(ctx, game) {
  const panelX = 790, panelY = 152;
  const panelW = CW - panelX - 38;
  const panelH = CH - 168 - 30;

  ctx.save();
  ctx.shadowColor = "#003399"; ctx.shadowBlur = 14;
  rrPath(ctx, panelX, panelY, panelW, panelH, 18);
  ctx.fillStyle = "rgba(0,8,30,0.93)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,60,160,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, panelX, panelY, panelW, panelH, 18); ctx.stroke();
  ctx.restore();

  ctx.font = MF.bold(20); ctx.fillStyle = "#5588cc";
  ctx.textAlign = "center";
  ctx.fillText("JOUEURS", panelX + panelW/2, panelY + 28);

  ctx.save(); ctx.strokeStyle = "rgba(0,60,160,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(panelX+14, panelY+38); ctx.lineTo(panelX+panelW-14, panelY+38); ctx.stroke();
  ctx.restore();

  const cardH = Math.floor((panelH - 60) / game.players.length);
  for (let i = 0; i < game.players.length; i++) {
    const p   = game.players[i];
    const isCur = i === game.turnIndex;
    const cy2 = panelY + 48 + i * cardH;

    ctx.save();
    if (isCur) { ctx.shadowColor = "#3388ff"; ctx.shadowBlur = 18; }
    rrPath(ctx, panelX+10, cy2, panelW-20, cardH-8, 12);
    const pcBg = ctx.createLinearGradient(panelX+10, cy2, panelX+10, cy2+cardH-8);
    pcBg.addColorStop(0, isCur ? "rgba(0,40,100,0.85)" : "rgba(0,15,50,0.7)");
    pcBg.addColorStop(1, "rgba(0,5,20,0.7)");
    ctx.fillStyle = pcBg; ctx.fill();
    ctx.strokeStyle = isCur ? "#3388ff" : "rgba(0,60,160,0.4)";
    ctx.lineWidth = isCur ? 2.5 : 1.5;
    rrPath(ctx, panelX+10, cy2, panelW-20, cardH-8, 12); ctx.stroke();
    ctx.restore();

    const mid = panelX + panelW/2;
    ctx.textAlign = "center";

    // Nom
    ctx.font = MF.bold(18);
    ctx.fillStyle = isCur ? "#88bbff" : "#4477aa";
    const name = (p.name.length > 16 ? p.name.slice(0,15)+"." : p.name) + (p.bot ? " [BOT]" : "");
    ctx.fillText(name, mid, cy2+22);

    // Badge tour
    if (isCur) {
      ctx.save();
      ctx.shadowColor = "#3388ff"; ctx.shadowBlur = 8;
      rrPath(ctx, panelX+18, cy2+28, panelW-36, 22, 7);
      ctx.fillStyle = "#3388ff33"; ctx.fill();
      ctx.strokeStyle = "#3388ff"; ctx.lineWidth = 1.2;
      rrPath(ctx, panelX+18, cy2+28, panelW-36, 22, 7); ctx.stroke();
      ctx.font = MF.semi(13); ctx.fillStyle = "#88bbff";
      ctx.fillText("A JOUER", mid, cy2+42);
      ctx.restore();
    }

    // Stats
    const statY = cy2 + (isCur ? 60 : 36);
    ctx.font = MF.semi(15); ctx.fillStyle = "#334466";
    ctx.fillText("Paires", mid, statY);
    ctx.font = MF.bold(24); ctx.fillStyle = "#ffcc44";
    ctx.fillText(String(p.pairs), mid, statY+22);

    ctx.font = MF.semi(14); ctx.fillStyle = "#334466";
    ctx.fillText(`Tours: ${p.turns}`, mid, statY+42);

    if (game.bet > 0 && !p.bot) {
      ctx.font = MF.semi(14); ctx.fillStyle = "#336644";
      ctx.fillText(`Gain pot.: ${fmt(p.pairs * Math.floor(game.pot / (game.board.length/2)))}`, mid, statY+60);
    }

    ctx.textAlign = "left";
  }
}

function drawMemFooter(ctx, game) {
  const fy = CH - 30;
  ctx.font = MF.semi(16); ctx.fillStyle = "rgba(80,120,200,0.8)";
  ctx.textAlign = "center";
  ctx.fillText("Actions: <numero> | stop | status", CW/2, fy);
  ctx.textAlign = "left";
}

// ─────────────────────────────────────────────
//  PUBLICATION
// ─────────────────────────────────────────────
async function publishState(message, game, body, highlightIdxs = [], matchResult = null) {
  game.updatedAt = Date.now();
  const canvas  = renderMemory(game, highlightIdxs, matchResult);
  const tmpPath = path.join(os.tmpdir(), `memory_${game.id}_${Date.now()}.png`);
  fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));

  const current = game.players[game.turnIndex];
  const text    = buildText(game, body);
  const mentions = (current && !current.bot) ? [{ id: current.id, tag: current.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: text, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { console.error("[Memory] Send:", err); resolve(); return; }
      game.lastMsgID = info?.messageID;
      if (current && !current.bot && global.GoatBot?.onReply && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID  : info.messageID,
          author     : current.id,
          threadID   : game.threadID,
          gameKey    : game.key,
          gameID     : game.id,
        });
      }
      resolve(info);
    });
  });
}

function buildText(game, body) {
  const { cols, rows } = GRID_MODES[game.gridKey];
  const found = game.board.filter(c => c.revealed).length / 2;
  const total = game.board.length / 2;
  const current = game.players[game.turnIndex];
  const lines = [
    "=== MEMORY ROYAL ===",
    `Grille: ${cols}x${rows}  |  Paires: ${found}/${total}  |  Tour: ${game.totalTurns}`,
    "-------------------",
  ];
  for (const p of game.players) {
    const isCur = p.id === current?.id;
    lines.push(`${isCur ? ">> " : "   "}${p.name}${p.bot ? " [BOT]" : ""}  |  Paires: ${p.pairs}  |  Tours: ${p.turns}`);
  }
  lines.push("-------------------");
  lines.push(body.replace(/[^\x20-\x7E]/g, ""));
  if (current) {
    if (!game.firstCard) {
      lines.push(`${current.name} -- Tapez le numero d'une carte (1-${game.board.length})`);
    } else {
      lines.push(`${current.name} -- Carte ${game.firstCard+1} retournee. Choisissez la 2e carte.`);
    }
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function cleanupExpiredGames() {
  const now = Date.now();
  for (const [k, g] of activeGames.entries()) {
    if (now - g.updatedAt > GAME_EXPIRE_MS) {
      activeGames.delete(k);
      if (g.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(g.lastMsgID);
    }
  }
}

async function getUserName(api, usersData, id) {
  if (id.startsWith("bot_")) return id;
  try {
    if (usersData?.getName) return await usersData.getName(id);
    const info = await api.getUserInfo(id);
    return info[id]?.name || "Joueur";
  } catch { return "Joueur"; }
}

// ─────────────────────────────────────────────
//  TRAITEMENT D'UN CHOIX DE CARTE
// ─────────────────────────────────────────────
async function handleCardChoice(message, game, cardIdx, api, usersData) {
  const board   = game.board;
  const player  = game.players[game.turnIndex];
  const card    = board[cardIdx];

  if (card.revealed || card.flipped)
    return publishState(message, game,
      `Carte ${cardIdx+1} deja retournee ou deja trouvee. Choisissez une autre.`);

  // Premiere carte du tour
  if (game.firstCard === null) {
    game.firstCard     = cardIdx;
    card.flipped       = true;
    updateBotMemory(game, cardIdx);
    return publishState(message, game,
      `${player.name} retourne la carte ${cardIdx+1}. Choisissez la 2e carte.`,
      [cardIdx]);
  }

  // Deuxieme carte
  const firstIdx = game.firstCard;
  const first    = board[firstIdx];
  card.flipped   = true;
  updateBotMemory(game, cardIdx);

  const matched = checkMatch(board, firstIdx, cardIdx);
  player.turns++;
  game.totalTurns++;

  await publishState(message, game,
    matched
      ? `PAIRE TROUVEE! ${first.symbolLabel} et ${card.symbolLabel} -- ${player.name} rejoue!`
      : `Pas de paire. ${first.symbolLabel} != ${card.symbolLabel}`,
    [firstIdx, cardIdx],
    matched ? true : false);

  await sleep(1200);

  if (matched) {
    first.revealed = true; first.flipped = false;
    card.revealed  = true; card.flipped  = false;
    player.pairs++;
    game.firstCard = null;

    // Verifier fin de partie
    if (isBoardComplete(board)) {
      return finishGame(message, game, usersData);
    }
    // Le joueur rejoue (pas de changement de tour)
  } else {
    first.flipped = false;
    card.flipped  = false;
    game.firstCard = null;
    // Changer de joueur
    game.turnIndex = (game.turnIndex + 1) % game.players.length;
  }

  const next = game.players[game.turnIndex];
  await publishState(message, game,
    `${next.name} -- Tapez le numero d'une carte (1-${board.length})`);

  // Bot
  if (next.bot) {
    await sleep(BOT_DELAY);
    await runBot(message, game, api, usersData);
  }
}

// ─────────────────────────────────────────────
//  TOUR BOT
// ─────────────────────────────────────────────
async function runBot(message, game, api, usersData) {
  while (true) {
    const current = game.players[game.turnIndex];
    if (!current || !current.bot) break;

    // Premiere carte
    const first = botChooseCard(game, current);
    if (first === -1) break;
    await handleCardChoice(message, game, first, api, usersData);
    if (!game.players[game.turnIndex]?.bot) break;
    if (isBoardComplete(game.board)) break;

    await sleep(BOT_DELAY);

    // Deuxieme carte (si le bot rejouait)
    if (game.firstCard !== null) continue;

    // Le bot a peut-etre change de tour ou rejoue
    if (!game.players[game.turnIndex]?.bot) break;
    await sleep(BOT_DELAY);
  }
}

// ─────────────────────────────────────────────
//  FIN DE PARTIE
// ─────────────────────────────────────────────
async function finishGame(message, game, usersData) {
  // Tri par paires
  const sorted = [...game.players].sort((a, b) => b.pairs - a.pairs);
  const winner = sorted[0];
  const isDraw = sorted.length > 1 && sorted[0].pairs === sorted[1].pairs;

  // Paiements
  if (game.bet > 0 && !isDraw && !winner.bot) {
    const ud = await usersData.get(winner.id).catch(() => null);
    if (ud) await usersData.set(winner.id, { money: (ud.money || 0) + game.pot });
  } else if (game.bet > 0 && isDraw) {
    const share = Math.floor(game.pot / sorted.filter(p => p.pairs === sorted[0].pairs).length);
    for (const p of sorted.filter(p => p.pairs === sorted[0].pairs && !p.bot)) {
      const ud = await usersData.get(p.id).catch(() => null);
      if (ud) await usersData.set(p.id, { money: (ud.money || 0) + share });
    }
  }

  const scoreLines = sorted.map(p => `${p.name}${p.bot?" [BOT]":""}: ${p.pairs} paires`).join("  |  ");
  let resultMsg;
  if (isDraw) {
    resultMsg = `MATCH NUL! Paires egales. ${scoreLines}`;
    if (game.bet > 0) resultMsg += ` -- Mise remboursee.`;
  } else {
    resultMsg = `FIN! ${winner.name} remporte la partie! ${scoreLines}`;
    if (game.bet > 0 && !winner.bot) resultMsg += ` -- Gain: ${fmt(game.pot)}`;
  }
  resultMsg += `\n\nTapez "memory bot" ou "memory 1v1 @joueur" pour rejouer!`;

  endGame(game);
  await publishState(message, game, resultMsg, [], null);
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.lastMsgID);
}

// ─────────────────────────────────────────────
//  MODULE GOATBOT
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name       : "memory",
    aliases    : ["mem", "paires", "memoire"],
    version    : "1.0",
    author     : "Christus",
    countDown  : 3,
    role       : 0,
    description: { fr: "Memory Royal - Jeu de paires Canvas, bot IA memoire parfaite, multijoueur, paris." },
    category   : "game",
    guide: {
      fr:
        `${fonts.sansSerif("MEMORY ROYAL -- Jeu de Paires")}` + "\n\n" +
        `${fonts.bold("Modes de jeu :")}` + "\n" +
        `  ${fonts.monospace("memory bot")}              : Solo vs Bot (memoire parfaite)` + "\n" +
        `  ${fonts.monospace("memory bot easy")}         : Solo vs Bot (alatoire)` + "\n" +
        `  ${fonts.monospace("memory 1v1 @joueur")}      : Duel humain` + "\n" +
        `  ${fonts.monospace("memory 1v1v1 @p2 @p3")}   : 3 joueurs` + "\n" +
        `  ${fonts.monospace("memory solo")}             : Solo (entrainement)` + "\n\n" +
        `${fonts.bold("Taille de grille (optionnel) :")}` + "\n" +
        `  ${fonts.monospace("memory bot 4x4")}          : 4x4 = 8 paires (defaut)` + "\n" +
        `  ${fonts.monospace("memory bot 4x6")}          : 4x6 = 12 paires` + "\n" +
        `  ${fonts.monospace("memory bot 6x6")}          : 6x6 = 18 paires` + "\n\n" +
        `${fonts.bold("Mise optionnelle :")}` + "\n" +
        `  ${fonts.monospace("memory 1v1 @joueur 500")}  : gagnant remporte 1 000$` + "\n\n" +
        `${fonts.bold("En jeu :")}` + "\n" +
        `  Tapez le numero de la case (1 a N) pour retourner une carte.` + "\n" +
        `  Trouvez la paire pour rejouer. Ratez et passez au suivant.` + "\n\n" +
        `${fonts.bold("Gestion :")}` + "\n" +
        `  ${fonts.monospace("status")}  : revoir la grille` + "\n" +
        `  ${fonts.monospace("stop")}    : abandonner` + "\n\n" +
        `18 symboles dessines entierement en Canvas (aucun emoji).` + "\n" +
        `Le bot memorise chaque carte retournee -- difficile a battre en hard!`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const { senderID, threadID, mentions } = event;
    const mode = (args[0] || "").toLowerCase();

    if (!mode || mode === "help") return message.reply(this.config.guide.fr);

    if (mode === "stop" || mode === "end") {
      let n = 0;
      for (const [k, g] of activeGames.entries()) {
        if (g.threadID === threadID && g.players.some(p => p.id === senderID)) {
          endGame(g); n++;
        }
      }
      return message.reply(fonts.bold(n ? `Partie(s) terminee(s): ${n}` : "Aucune partie en cours."));
    }

    if (mode === "status") {
      for (const g of activeGames.values()) {
        if (g.threadID === threadID && g.players.some(p => p.id === senderID)) {
          return publishState(message, g, "Etat actuel de la grille.", [], null);
        }
      }
      return message.reply(fonts.bold("Aucune partie en cours."));
    }

    // Grille
    const gridArg  = args.find(a => GRID_MODES[a]);
    const gridKey  = gridArg || DEFAULT_GRID;

    // Mise
    const betArg   = args.find(a => /^\d+$/.test(a) && parseInt(a) >= MIN_BET);
    const bet      = betArg ? Math.min(parseInt(betArg), MAX_BET) : 0;

    // Joueurs
    let isSolo = false, isBot = false;
    let botLevel = "hard";

    if (mode === "solo")       { isSolo = true; }
    else if (mode === "bot")   { isBot = true; botLevel = (args[1] === "easy" ? "easy" : "hard"); }
    else if (!["1v1","1v1v1","1v1v1v1"].includes(mode))
      return message.reply(this.config.guide.fr);

    const myName = await getUserName(api, usersData, senderID);
    const players = [{ id: senderID, name: myName, bot: false, pairs: 0, turns: 0 }];

    if (!isSolo && !isBot) {
      const mIds = Object.keys(mentions || {}).filter(id => id !== senderID);
      for (const id of mIds.slice(0, 3))
        players.push({ id, name: await getUserName(api, usersData, id), bot: false, pairs: 0, turns: 0 });
    }

    if (isBot) {
      const bn = botLevel === "easy" ? "Lapin Facile" : "Elephant Royal";
      players.push({ id: `bot_0_${Date.now()}`, name: bn, bot: true, level: botLevel, pairs: 0, turns: 0 });
    }

    // Debit mise
    if (bet > 0) {
      for (const p of players.filter(p => !p.bot)) {
        const ud = await usersData.get(p.id).catch(() => null);
        if (!ud || (ud.money || 0) < bet)
          return message.reply(fonts.bold(`${p.name} n'a pas assez! Besoin: ${fmt(bet)}`));
        await usersData.set(p.id, { money: (ud.money || 0) - bet });
      }
    }

    const gameKey = `memory_${threadID}_${senderID}`;
    const game = {
      id          : `${threadID}_${Date.now()}`,
      key         : gameKey,
      threadID,
      commandName,
      players,
      board       : buildBoard(gridKey),
      gridKey,
      firstCard   : null,
      turnIndex   : 0,
      totalTurns  : 0,
      bet,
      pot         : bet * players.filter(p => !p.bot).length,
      botMemory   : {},
      updatedAt   : Date.now(),
      startedAt   : Date.now(),
      lastMsgID   : null,
    };

    activeGames.set(gameKey, game);

    const { cols, rows, pairs } = GRID_MODES[gridKey];
    const modeLabel = isSolo ? "Solo" : isBot ? `vs Bot (${botLevel === "easy" ? "Facile" : "Expert"})` : `${players.length} joueurs`;
    const betLabel  = bet ? `  |  Mise: ${fmt(bet)}  |  Pot: ${fmt(game.pot)}` : "";
    const intro     = `Memory Royal demarre! Mode: ${modeLabel}  |  Grille: ${cols}x${rows}  |  ${pairs} paires${betLabel}`;

    await publishState(message, game, intro, [], null);

    // Si le premier joueur est bot (possible en cas de solor-only avec bot ajouté)
    if (game.players[0]?.bot) {
      await sleep(BOT_DELAY);
      await runBot(message, game, api, usersData);
    }
  },

  onReply: async function ({ message, event, Reply, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey);
    if (!game || game.id !== Reply.gameID) return;
    if (game.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.lastMsgID);

    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;
    if (event.senderID !== current.id)
      return message.reply(fonts.bold(`C'est le tour de ${current.name}!`));

    const input = (event.body || "").trim().toLowerCase();

    if (input === "stop" || input === "quit") {
      // Remboursement
      if (game.bet > 0) {
        for (const p of game.players.filter(p => !p.bot)) {
          const ud = await usersData.get(p.id).catch(() => null);
          if (ud) await usersData.set(p.id, { money: (ud.money || 0) + game.bet });
        }
      }
      endGame(game);
      return message.reply(fonts.bold("Partie terminee. Mise remboursee."));
    }

    if (input === "status") {
      return publishState(message, game, "Etat de la grille.", [], null);
    }

    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > game.board.length)
      return publishState(message, game,
        `Numero invalide. Tapez un numero entre 1 et ${game.board.length}.`);

    await handleCardChoice(message, game, n-1, api, usersData);
  },
};
