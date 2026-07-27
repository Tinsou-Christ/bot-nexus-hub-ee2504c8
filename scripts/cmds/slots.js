const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "SlotFont", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "SlotFont", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "SlotFont", weight: "600" });
} catch(e) { console.log("[Slots] Font:", e.message); }

const SF = {
  bold:    s => `bold ${s}px SlotFont, Arial`,
  semi:    s => `600 ${s}px SlotFont, Arial`,
  regular: s => `${s}px SlotFont, Arial`,
};

const GAME_EXPIRE_MS  = 1000 * 60 * 45;
const BOT_DELAY       = 1000;
const REELS           = 5;
const ROWS            = 3;
const activeGames     = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SYMBOLS = [
  { id: "seven",   label: "7",       freq: 2,  vals: [0, 0, 50,  200, 500],  tier: 6 },
  { id: "diamond", label: "DIAM",    freq: 3,  vals: [0, 0, 30,  100, 250],  tier: 5 },
  { id: "crown",   label: "CROWN",   freq: 4,  vals: [0, 0, 20,  80,  200],  tier: 4 },
  { id: "bell",    label: "BELL",    freq: 6,  vals: [0, 0, 10,  40,  100],  tier: 3 },
  { id: "star",    label: "STAR",    freq: 7,  vals: [0, 0, 5,   20,  60],   tier: 2 },
  { id: "bar",     label: "BAR",     freq: 8,  vals: [0, 0, 4,   15,  40],   tier: 2 },
  { id: "lemon",   label: "LEM",     freq: 10, vals: [0, 0, 3,   10,  25],   tier: 1 },
  { id: "cherry",  label: "CHR",     freq: 10, vals: [0, 0, 3,   10,  25],   tier: 1 },
  { id: "wild",    label: "WILD",    freq: 2,  vals: [0, 0, 0,   0,   0],    tier: 7, isWild: true },
  { id: "scatter", label: "BONUS",   freq: 2,  vals: [0, 0, 0,   0,   0],    tier: 7, isScatter: true },
];

const REEL_POOL = [];
for (const sym of SYMBOLS) for (let i = 0; i < sym.freq; i++) REEL_POOL.push(sym.id);

const PAYLINES = [
  [1,1,1,1,1],
  [0,0,0,0,0],
  [2,2,2,2,2],
  [0,1,2,1,0],
  [2,1,0,1,2],
  [0,0,1,2,2],
  [2,2,1,0,0],
  [1,0,0,0,1],
  [1,2,2,2,1],
  [0,1,0,1,0],
];

const BET_LEVELS = {
  low:    { label: "Low Roller",  min: 50,   max: 200,   jackpotContrib: 0.01 },
  mid:    { label: "Mid Roller",  min: 200,  max: 1000,  jackpotContrib: 0.03 },
  high:   { label: "High Roller", min: 1000, max: 10000, jackpotContrib: 0.05 },
};

let GLOBAL_JACKPOT = 50000;

function fmt(n) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e9)  return `${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `${(n/1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function spinReels() {
  const grid = [];
  for (let r = 0; r < REELS; r++) {
    const col = [];
    for (let row = 0; row < ROWS; row++) {
      col.push(REEL_POOL[Math.floor(Math.random() * REEL_POOL.length)]);
    }
    grid.push(col);
  }
  return grid;
}

function getSymbol(id) { return SYMBOLS.find(s => s.id === id); }

function evaluateSpin(grid, bet, activePaylines) {
  const results   = [];
  let totalWin    = 0;
  let scatterCount = 0;
  let jackpotHit  = false;

  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (grid[r][row] === "scatter") scatterCount++;

  const freeSpins = scatterCount >= 3 ? (scatterCount === 3 ? 5 : scatterCount === 4 ? 10 : 20) : 0;

  for (let li = 0; li < activePaylines; li++) {
    const line   = PAYLINES[li];
    const symIds = line.map((row, r) => grid[r][row]);

    let baseId = null;
    for (const id of symIds) {
      if (id !== "wild" && id !== "scatter") { baseId = id; break; }
    }
    if (!baseId) baseId = symIds[0];

    let count = 0;
    for (const id of symIds) {
      if (id === baseId || id === "wild") count++;
      else break;
    }

    if (count >= 3) {
      const sym = getSymbol(baseId);
      if (sym && sym.vals[count] > 0) {
        const win = bet * sym.vals[count];
        totalWin += win;
        results.push({ line: li, count, symId: baseId, win, symLabel: sym.label });
        if (baseId === "seven" && count === 5) jackpotHit = true;
      }
    }
  }

  if (jackpotHit) {
    totalWin += GLOBAL_JACKPOT;
    results.push({ line: -1, count: 5, symId: "seven", win: GLOBAL_JACKPOT, jackpot: true, symLabel: "7" });
    GLOBAL_JACKPOT = 50000;
  }

  return { results, totalWin, freeSpins, scatterCount, jackpotHit };
}

function drawSymbol(ctx, id, cx, cy, size) {
  const s = size * 0.38;
  ctx.save();
  ctx.translate(cx, cy);

  switch (id) {

    case "seven": {
      ctx.font = `bold ${Math.floor(size*0.68)}px SlotFont, Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 18;
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 4;
      ctx.strokeText("7", 0, 2);
      ctx.fillStyle = "#ff2222";
      ctx.fillText("7", 0, 2);
      break;
    }

    case "diamond": {
      const g = ctx.createLinearGradient(-s, 0, s, 0);
      g.addColorStop(0, "#00e5ff"); g.addColorStop(0.5, "#ffffff"); g.addColorStop(1, "#0088cc");
      ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, -s*1.2);
      ctx.lineTo(s*0.9, 0);
      ctx.lineTo(0, s*1.2);
      ctx.lineTo(-s*0.9, 0);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0,-s*1.2); ctx.lineTo(0,s*1.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.9,0); ctx.lineTo(s*0.9,0); ctx.stroke();
      break;
    }

    case "crown": {
      const cg = ctx.createLinearGradient(0, -s, 0, s);
      cg.addColorStop(0, "#ffe066"); cg.addColorStop(0.5, "#c9a84c"); cg.addColorStop(1, "#7a5c00");
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 18;
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.rect(-s*1.0, s*0.1, s*2.0, s*0.9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s, s*0.1);
      ctx.lineTo(-s, -s*0.6);
      ctx.lineTo(-s*0.5, -s*0.1);
      ctx.lineTo(0, -s*0.85);
      ctx.lineTo(s*0.5, -s*0.1);
      ctx.lineTo(s, -s*0.6);
      ctx.lineTo(s, s*0.1);
      ctx.closePath();
      ctx.fill();
      for (const gx of [-s*0.55, 0, s*0.55]) {
        ctx.beginPath(); ctx.arc(gx, s*0.5, s*0.18, 0, Math.PI*2);
        ctx.fillStyle = "#ff3366"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      break;
    }

    case "bell": {
      const bg2 = ctx.createRadialGradient(-s*0.2, -s*0.3, 0, 0, 0, s*1.2);
      bg2.addColorStop(0, "#ffe066"); bg2.addColorStop(0.6, "#c9a84c"); bg2.addColorStop(1, "#7a5c00");
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 14;
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(-s*0.15, -s*1.1);
      ctx.bezierCurveTo(-s*1.1, -s*1.1, -s*1.2, s*0.4, -s*0.9, s*0.6);
      ctx.lineTo(s*0.9, s*0.6);
      ctx.bezierCurveTo(s*1.2, s*0.4, s*1.1, -s*1.1, s*0.15, -s*1.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#7a5c00"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s*0.85, s*0.2, 0, Math.PI*2);
      ctx.fillStyle = "#c9a84c"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -s*1.1, s*0.18, 0, Math.PI*2);
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 4; ctx.stroke();
      break;
    }

    case "star": {
      ctx.shadowColor = "#ffe066"; ctx.shadowBlur = 16;
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, s*1.2);
      sg.addColorStop(0, "#fff176"); sg.addColorStop(0.5, "#fdd835"); sg.addColorStop(1, "#f9a825");
      ctx.fillStyle = sg;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI/2;
        const r2 = i % 2 === 0 ? s*1.2 : s*0.5;
        i === 0 ? ctx.moveTo(Math.cos(angle)*r2, Math.sin(angle)*r2)
                : ctx.lineTo(Math.cos(angle)*r2, Math.sin(angle)*r2);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f57f17"; ctx.lineWidth = 2; ctx.stroke();
      break;
    }

    case "bar": {
      const bg3 = ctx.createLinearGradient(0, -s, 0, s);
      bg3.addColorStop(0, "#7c3aed"); bg3.addColorStop(0.5, "#4c1d95"); bg3.addColorStop(1, "#2d1b69");
      ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(-s*1.1, -s*0.7, s*2.2, s*1.4, s*0.2);
      ctx.fillStyle = bg3; ctx.fill();
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = `bold ${Math.floor(s*1.1)}px SlotFont, Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#c4b5fd";
      ctx.fillText("BAR", 0, 2);
      break;
    }

    case "lemon": {
      ctx.shadowColor = "#ffe066"; ctx.shadowBlur = 10;
      const lg = ctx.createRadialGradient(-s*0.2, -s*0.2, 0, 0, 0, s);
      lg.addColorStop(0, "#fff59d"); lg.addColorStop(0.5, "#fdd835"); lg.addColorStop(1, "#f9a825");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(0, s*0.1, s*0.85, s*1.0, 0.3, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = "#f57f17"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.ellipse(-s*0.1, -s*0.9, s*0.35, s*0.2, -0.6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-s*0.25, -s*0.3, s*0.25, s*0.18, 0.5, 0, Math.PI*2);
      ctx.fill();
      break;
    }

    case "cherry": {
      ctx.shadowColor = "#ff1744"; ctx.shadowBlur = 10;
      ctx.strokeStyle = "#388e3c"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, s*0.2);
      ctx.quadraticCurveTo(-s*0.6, -s*0.5, -s*0.7, -s*0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s*0.2);
      ctx.quadraticCurveTo(s*0.6, -s*0.5, s*0.7, -s*0.8);
      ctx.stroke();
      const cRad = s * 0.5;
      for (const [bx2, by2] of [[-s*0.7, -s*0.8],[s*0.7,-s*0.8]]) {
        const cg2 = ctx.createRadialGradient(bx2-cRad*0.3, by2-cRad*0.3, 0, bx2, by2, cRad);
        cg2.addColorStop(0, "#ff6b6b"); cg2.addColorStop(0.5, "#ff1744"); cg2.addColorStop(1, "#b71c1c");
        ctx.beginPath(); ctx.arc(bx2, by2, cRad, 0, Math.PI*2);
        ctx.fillStyle = cg2; ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath(); ctx.ellipse(bx2-cRad*0.25, by2-cRad*0.25, cRad*0.3, cRad*0.2, 0, 0, Math.PI*2);
        ctx.fill();
      }
      break;
    }

    case "wild": {
      ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 22;
      const wg = ctx.createLinearGradient(-s*1.2, -s*0.6, s*1.2, s*0.6);
      wg.addColorStop(0, "#f500ff"); wg.addColorStop(0.5, "#9c00e4"); wg.addColorStop(1, "#5500aa");
      ctx.beginPath(); ctx.roundRect(-s*1.2, -s*0.55, s*2.4, s*1.1, s*0.22);
      ctx.fillStyle = wg; ctx.fill();
      ctx.strokeStyle = "#ff88ff"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.roundRect(-s*1.2, -s*0.55, s*2.4, s*0.42, s*0.22); ctx.fill();
      ctx.font = `bold ${Math.floor(s*0.82)}px SlotFont, Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("WILD", 0, 2);
      break;
    }

    case "scatter": {
      ctx.shadowColor = "#ffea00"; ctx.shadowBlur = 26;
      const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, s*1.1);
      hg.addColorStop(0, "#ffff66"); hg.addColorStop(0.4, "#ffea00"); hg.addColorStop(1, "#ff6f00");
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI/6;
        i === 0 ? ctx.moveTo(Math.cos(a)*s*1.1, Math.sin(a)*s*1.1)
                : ctx.lineTo(Math.cos(a)*s*1.1, Math.sin(a)*s*1.1);
      }
      ctx.closePath(); ctx.fillStyle = hg; ctx.fill();
      ctx.strokeStyle = "#fffde7"; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*s*0.3, Math.sin(a)*s*0.3);
        ctx.lineTo(Math.cos(a)*s*1.0, Math.sin(a)*s*1.0);
        ctx.stroke();
      }
      ctx.font = `bold ${Math.floor(s*0.56)}px SlotFont, Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#3e2000";
      ctx.fillText("BONUS", 0, 2);
      break;
    }

    default: {
      ctx.fillStyle = "#ffffff"; ctx.font = SF.bold(Math.floor(size*0.4));
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("?", 0, 2);
    }
  }
  ctx.restore();
}

const W = 1400, H = 920;
const REEL_PAD    = 20;
const REEL_AREA_X = 60;
const REEL_AREA_Y = 175;
const REEL_AREA_W = 820;
const REEL_AREA_H = 520;
const CELL_W      = Math.floor(REEL_AREA_W / REELS);
const CELL_H      = Math.floor(REEL_AREA_H / ROWS);

function renderSlots(game, result) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  drawBackground(ctx, game);
  drawHeader(ctx, game);
  drawMachine(ctx, game, result);
  drawPaylinePanel(ctx, game, result);
  drawPlayerPanel(ctx, game, result);
  drawFooter(ctx, game);

  return canvas;
}

function drawBackground(ctx, game) {
  const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.4);
  g.addColorStop(0, "#1a0030"); g.addColorStop(0.5, "#0d001a"); g.addColorStop(1, "#000000");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  for (const [lcx, lcy, lc] of [[200,200,"#ff006640"],[W-200,200,"#7700ff40"],[W/2,H-100,"#ffaa0030"]]) {
    const lg = ctx.createRadialGradient(lcx, lcy, 0, lcx, lcy, 350);
    lg.addColorStop(0, lc); lg.addColorStop(1, "transparent");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  for (let i = 0; i < 80; i++) {
    const px = (i * 179) % W, py = (i * 113 + 40) % H;
    const r2 = Math.random() * 1.5 + 0.5;
    ctx.globalAlpha = 0.15 + Math.random() * 0.2;
    ctx.beginPath(); ctx.arc(px, py, r2, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
  }
  ctx.restore();

  const nb = ctx.createLinearGradient(0, 0, W, H);
  nb.addColorStop(0, "#ff00ff"); nb.addColorStop(0.33, "#7700ff"); nb.addColorStop(0.66, "#ff00aa"); nb.addColorStop(1, "#ff00ff");
  ctx.save();
  ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 30;
  ctx.strokeStyle = nb; ctx.lineWidth = 6;
  rrPath(ctx, 8, 8, W-16, H-16, 32); ctx.stroke();
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(200,0,255,0.3)"; ctx.lineWidth = 2;
  rrPath(ctx, 16, 16, W-32, H-32, 28); ctx.stroke();
  ctx.restore();
}

function drawHeader(ctx, game) {
  ctx.save();
  ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 20;
  rrPath(ctx, 40, 18, W-80, 138, 20);
  ctx.fillStyle = "rgba(30,0,50,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(180,0,255,0.7)"; ctx.lineWidth = 2;
  rrPath(ctx, 40, 18, W-80, 138, 20); ctx.stroke();
  ctx.restore();

  const tg = ctx.createLinearGradient(60, 30, 60, 95);
  tg.addColorStop(0, "#ff88ff"); tg.addColorStop(0.5, "#cc00ff"); tg.addColorStop(1, "#ff44aa");
  ctx.save();
  ctx.shadowColor = "#cc00ff"; ctx.shadowBlur = 22;
  ctx.font = SF.bold(52);
  ctx.fillStyle = tg;
  ctx.fillText("SLOTS  ROYAL", 65, 88);
  ctx.restore();

  const jpX = W - 370;
  ctx.save();
  ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 28;
  rrPath(ctx, jpX, 24, 340, 120, 16);
  ctx.fillStyle = "rgba(40,20,0,0.95)"; ctx.fill();
  ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3;
  rrPath(ctx, jpX, 24, 340, 120, 16); ctx.stroke();
  ctx.restore();

  ctx.font = SF.semi(17); ctx.fillStyle = "#ffd700";
  ctx.textAlign = "center";
  ctx.fillText("JACKPOT PROGRESSIF", jpX + 170, 52);
  const jg = ctx.createLinearGradient(jpX, 60, jpX+340, 100);
  jg.addColorStop(0, "#ffe066"); jg.addColorStop(0.5, "#ffffff"); jg.addColorStop(1, "#ffe066");
  ctx.save();
  ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 30;
  ctx.font = SF.bold(38);
  ctx.fillStyle = jg;
  ctx.fillText(fmt(GLOBAL_JACKPOT), jpX + 170, 100);
  ctx.restore();

  const current = game.players[game.turnIndex];
  ctx.font = SF.semi(19); ctx.fillStyle = "#e0aaff"; ctx.textAlign = "left";
  const infoStr = `Mise: ${fmt(game.currentBet)}  |  Lignes: ${game.activePaylines}  |  ${game.betLevel.label}  |  Free Spins: ${game.freeSpins}`;
  ctx.fillText(infoStr, 65, 126);
  ctx.textAlign = "left";
}

function drawMachine(ctx, game, result) {
  const mx = REEL_AREA_X, my = REEL_AREA_Y;
  const mw = REEL_AREA_W, mh = REEL_AREA_H;

  ctx.save();
  ctx.shadowColor = "#7700ff"; ctx.shadowBlur = 40;
  const machBg = ctx.createLinearGradient(mx, my, mx+mw, my+mh);
  machBg.addColorStop(0, "#1a0040"); machBg.addColorStop(0.5, "#0d001f"); machBg.addColorStop(1, "#1a0040");
  rrPath(ctx, mx-18, my-18, mw+36, mh+36, 28);
  ctx.fillStyle = machBg; ctx.fill();
  ctx.strokeStyle = "#7700ff"; ctx.lineWidth = 4;
  rrPath(ctx, mx-18, my-18, mw+36, mh+36, 28); ctx.stroke();
  ctx.restore();

  for (let r = 1; r < REELS; r++) {
    const lx = mx + r * CELL_W;
    ctx.save();
    ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 8;
    ctx.strokeStyle = "rgba(170,0,255,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, my); ctx.lineTo(lx, my+mh); ctx.stroke();
    ctx.restore();
  }

  for (let row = 1; row < ROWS; row++) {
    const ly = my + row * CELL_H;
    ctx.save();
    ctx.strokeStyle = "rgba(100,0,180,0.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mx, ly); ctx.lineTo(mx+mw, ly); ctx.stroke();
    ctx.restore();
  }

  for (let r = 0; r < REELS; r++) {
    for (let row = 0; row < ROWS; row++) {
      const sym  = game.grid[r][row];
      const scx  = mx + r * CELL_W + CELL_W/2;
      const scy  = my + row * CELL_H + CELL_H/2;
      const symSize = Math.min(CELL_W, CELL_H) * 0.72;

      const cellBg = ctx.createRadialGradient(scx, scy, 0, scx, scy, symSize*0.8);
      cellBg.addColorStop(0, "rgba(80,0,120,0.3)"); cellBg.addColorStop(1, "transparent");
      ctx.fillStyle = cellBg;
      ctx.fillRect(mx+r*CELL_W+2, my+row*CELL_H+2, CELL_W-4, CELL_H-4);

      drawSymbol(ctx, sym, scx, scy, symSize);
    }
  }

  if (result && result.results.length > 0) {
    for (const win of result.results) {
      if (win.line < 0) continue;
      const line = PAYLINES[win.line];
      const lineColors = ["#ff0000","#00ff88","#ffff00","#00aaff","#ff88ff","#ff6600","#00ffff","#ff00aa","#88ff00","#ff8800"];
      const lc = lineColors[win.line % lineColors.length];
      ctx.save();
      ctx.shadowColor = lc; ctx.shadowBlur = 18;
      ctx.strokeStyle = lc; ctx.lineWidth = 4;
      ctx.setLineDash([12, 6]);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (let r = 0; r < REELS; r++) {
        const row = line[r];
        const px = mx + r * CELL_W + CELL_W/2;
        const py = my + row * CELL_H + CELL_H/2;
        r === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  const midY = my + CELL_H + CELL_H/2;
  ctx.beginPath(); ctx.moveTo(mx, midY); ctx.lineTo(mx+mw, midY); ctx.stroke();
  ctx.restore();

  for (let r = 0; r < REELS; r++) {
    ctx.font = SF.regular(16); ctx.fillStyle = "rgba(200,150,255,0.6)";
    ctx.textAlign = "center";
    ctx.fillText(`R${r+1}`, mx + r*CELL_W + CELL_W/2, my + mh + 22);
  }
  ctx.textAlign = "left";
}

function drawPaylinePanel(ctx, game, result) {
  const px = REEL_AREA_X + REEL_AREA_W + 30;
  const py = REEL_AREA_Y;
  const pw = W - px - 48;
  const ph = REEL_AREA_H;

  ctx.save();
  ctx.shadowColor = "#7700ff"; ctx.shadowBlur = 15;
  rrPath(ctx, px, py, pw, ph, 18);
  ctx.fillStyle = "rgba(20,0,40,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(150,0,255,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, px, py, pw, ph, 18); ctx.stroke();
  ctx.restore();

  ctx.font = SF.bold(20); ctx.fillStyle = "#e0aaff";
  ctx.textAlign = "center";
  ctx.fillText("RESULTATS", px + pw/2, py + 28);

  ctx.save(); ctx.strokeStyle = "rgba(150,0,255,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px+14, py+38); ctx.lineTo(px+pw-14, py+38); ctx.stroke();
  ctx.restore();

  if (!result || result.results.length === 0) {
    ctx.font = SF.semi(17); ctx.fillStyle = "rgba(200,150,255,0.5)";
    ctx.fillText("-- En attente --", px+pw/2, py + ph/2);
  } else {
    let ry = py + 56;
    const lineColors = ["#ff4444","#00ff88","#ffff44","#44aaff","#ff88ff","#ff6600","#00ffff","#ff00aa","#88ff00","#ff8800"];

    for (const win of result.results) {
      const lc = win.jackpot ? "#ffd700" : lineColors[(win.line >= 0 ? win.line : 0) % lineColors.length];

      ctx.save();
      rrPath(ctx, px+10, ry, pw-20, 52, 10);
      ctx.fillStyle = `${lc}22`; ctx.fill();
      ctx.strokeStyle = `${lc}80`; ctx.lineWidth = 1.5;
      rrPath(ctx, px+10, ry, pw-20, 52, 10); ctx.stroke();
      ctx.restore();

      ctx.font = SF.bold(17); ctx.fillStyle = lc; ctx.textAlign = "left";
      const lineLabel = win.jackpot ? "JACKPOT!" : `Ligne ${win.line + 1}`;
      ctx.fillText(lineLabel, px+20, ry+20);

      ctx.font = SF.semi(15); ctx.fillStyle = "#ffffffcc";
      ctx.fillText(`${win.symLabel} x${win.count}`, px+20, ry+42);

      ctx.font = SF.bold(20); ctx.fillStyle = "#ffd700";
      ctx.textAlign = "right";
      ctx.fillText(`+${fmt(win.win)}`, px+pw-18, ry+32);
      ctx.textAlign = "left";

      ry += 62;
      if (ry > py + ph - 80) break;
    }

    ctx.save();
    rrPath(ctx, px+10, py+ph-64, pw-20, 52, 12);
    const tg = ctx.createLinearGradient(px+10, py+ph-64, px+pw-10, py+ph-12);
    tg.addColorStop(0, "#3d0070"); tg.addColorStop(1, "#1a0040");
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 2.5;
    rrPath(ctx, px+10, py+ph-64, pw-20, 52, 12); ctx.stroke();
    ctx.restore();

    ctx.font = SF.bold(16); ctx.fillStyle = "#e0aaff"; ctx.textAlign = "left";
    ctx.fillText("GAIN TOTAL", px+20, py+ph-36);
    const wg = ctx.createLinearGradient(px, py+ph-52, px, py+ph-20);
    wg.addColorStop(0, "#ffd700"); wg.addColorStop(1, "#ff8800");
    ctx.font = SF.bold(24); ctx.fillStyle = wg; ctx.textAlign = "right";
    ctx.fillText(`+${fmt(result.totalWin)}`, px+pw-18, py+ph-36);
    ctx.textAlign = "left";
  }

  if (result && result.freeSpins > 0) {
    ctx.save();
    ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 20;
    rrPath(ctx, px+10, py + (result.results.length > 0 ? 70 + result.results.length*62 : ph/2-36), pw-20, 52, 12);
    ctx.fillStyle = "rgba(0,100,100,0.6)"; ctx.fill();
    ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2;
    rrPath(ctx, px+10, py + (result.results.length > 0 ? 70 + result.results.length*62 : ph/2-36), pw-20, 52, 12); ctx.stroke();
    ctx.font = SF.bold(18); ctx.fillStyle = "#00ffff"; ctx.textAlign = "center";
    ctx.fillText(`FREE SPINS: +${result.freeSpins}`, px+pw/2, py + (result.results.length > 0 ? 70 + result.results.length*62 + 32 : ph/2+8));
    ctx.restore();
    ctx.textAlign = "left";
  }
}

function drawPlayerPanel(ctx, game, result) {
  const panelY  = REEL_AREA_Y + REEL_AREA_H + 30;
  const panelH  = H - panelY - 58;
  const panelX  = REEL_AREA_X;
  const panelW  = W - REEL_AREA_X * 2;

  ctx.save();
  ctx.shadowColor = "#7700ff"; ctx.shadowBlur = 12;
  rrPath(ctx, panelX, panelY, panelW, panelH, 18);
  ctx.fillStyle = "rgba(20,0,40,0.9)"; ctx.fill();
  ctx.strokeStyle = "rgba(130,0,220,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, panelX, panelY, panelW, panelH, 18); ctx.stroke();
  ctx.restore();

  const cardW = Math.floor((panelW - 20) / Math.max(1, game.players.length));
  let cx = panelX + 10;

  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    const isCurrent = i === game.turnIndex;
    const cardH = panelH - 16;
    const cy2   = panelY + 8;

    ctx.save();
    if (isCurrent) { ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 20; }
    const cardBg = ctx.createLinearGradient(cx, cy2, cx, cy2+cardH);
    cardBg.addColorStop(0, isCurrent ? "rgba(80,0,120,0.8)" : "rgba(30,0,60,0.7)");
    cardBg.addColorStop(1, "rgba(10,0,25,0.7)");
    rrPath(ctx, cx, cy2, cardW-8, cardH, 14);
    ctx.fillStyle = cardBg; ctx.fill();
    ctx.strokeStyle = isCurrent ? "#ff00ff" : "rgba(120,0,200,0.5)";
    ctx.lineWidth = isCurrent ? 3 : 1.5;
    rrPath(ctx, cx, cy2, cardW-8, cardH, 14); ctx.stroke();
    ctx.restore();

    const name = (p.name.length > 14 ? p.name.slice(0,13)+"." : p.name) + (p.bot ? " [BOT]" : "");
    ctx.font = SF.bold(18); ctx.fillStyle = isCurrent ? "#ff88ff" : "#c084fc";
    ctx.textAlign = "center";
    ctx.fillText(name, cx + (cardW-8)/2, cy2 + 24);

    if (isCurrent) {
      ctx.save();
      ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 10;
      rrPath(ctx, cx+8, cy2+32, cardW-24, 26, 8);
      ctx.fillStyle = "#ff00ff44"; ctx.fill();
      ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 1.5;
      rrPath(ctx, cx+8, cy2+32, cardW-24, 26, 8); ctx.stroke();
      ctx.font = SF.semi(14); ctx.fillStyle = "#ffffff";
      ctx.fillText("LANCE LE DES", cx+(cardW-8)/2, cy2+48);
      ctx.restore();
    }

    const balY = cy2 + (isCurrent ? 70 : 42);
    ctx.font = SF.semi(16); ctx.fillStyle = "#a78bfa";
    ctx.fillText("Solde", cx+(cardW-8)/2, balY);
    const bg2 = ctx.createLinearGradient(cx, balY+8, cx+cardW-8, balY+8);
    bg2.addColorStop(0, "#ffd700"); bg2.addColorStop(1, "#ff8800");
    ctx.font = SF.bold(22); ctx.fillStyle = bg2;
    ctx.fillText(fmt(p.balance), cx+(cardW-8)/2, balY+24);

    const gainY = balY + 42;
    if (p.lastGain !== undefined && p.lastGain !== null) {
      const gainColor = p.lastGain > 0 ? "#00ff88" : "#ff4444";
      ctx.font = SF.semi(17); ctx.fillStyle = gainColor;
      ctx.fillText(p.lastGain >= 0 ? `+${fmt(p.lastGain)}` : `-${fmt(Math.abs(p.lastGain))}`, cx+(cardW-8)/2, gainY);
    }

    ctx.font = SF.regular(15); ctx.fillStyle = "rgba(200,160,255,0.7)";
    ctx.fillText(`Spins: ${p.spins}   Wins: ${p.wins}`, cx+(cardW-8)/2, gainY + 24);

    ctx.textAlign = "left";
    cx += cardW;
  }
}

function drawFooter(ctx, game) {
  const fy = H - 44;
  ctx.font = SF.semi(17); ctx.fillStyle = "rgba(180,100,255,0.8)";
  ctx.textAlign = "center";
  ctx.fillText("Actions: spin | bet <montant> | lines <1-10> | stop | status", W/2, fy);

  ctx.save();
  for (const [x1, x2] of [[80, W/2-240],[W/2+240, W-80]]) {
    const lg = ctx.createLinearGradient(x1, fy, x2, fy);
    lg.addColorStop(x1 < W/2 ? 0 : 1, "transparent");
    lg.addColorStop(x1 < W/2 ? 1 : 0, "rgba(180,0,255,0.5)");
    ctx.strokeStyle = lg; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, fy-12); ctx.lineTo(x2, fy-12); ctx.stroke();
  }
  ctx.restore();
  ctx.textAlign = "left";
}

function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

async function publishState(message, game, body, result = null) {
  game.updatedAt = Date.now();
  const canvas  = renderSlots(game, result);
  const tmpPath = require("path").join(require("os").tmpdir(), `slots_${game.id}_${Date.now()}.png`);
  require("fs").writeFileSync(tmpPath, canvas.toBuffer("image/png"));

  const current = game.players[game.turnIndex];
  const text    = buildText(game, body, result);
  const mentions = current && !current.bot ? [{ id: current.id, tag: current.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: text, attachment: require("fs").createReadStream(tmpPath), mentions }, (err, info) => {
      try { require("fs").unlinkSync(tmpPath); } catch (_) {}
      if (err) { console.error("[Slots] Send:", err); resolve(); return; }
      game.lastMsgID = info?.messageID;
      if (current && !current.bot && global.GoatBot?.onReply && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID: info.messageID,
          author: current.id,
          threadID: game.threadID,
          gameKey: game.key,
          gameID: game.id,
        });
      }
      resolve(info);
    });
  });
}

function buildText(game, body, result) {
  const current = game.players[game.turnIndex];
  const lines = [
    "=== SLOTS ROYAL ===",
    `Jackpot: ${fmt(GLOBAL_JACKPOT)}  |  Mise: ${fmt(game.currentBet)}  |  Lignes: ${game.activePaylines}`,
    "-------------------",
  ];
  for (const p of game.players) {
    const isCur = p.id === current?.id;
    const gain = p.lastGain != null ? (p.lastGain >= 0 ? ` (+${fmt(p.lastGain)})` : ` (-${fmt(Math.abs(p.lastGain))})`) : "";
    lines.push(`${isCur ? ">> " : "   "}${p.name}${p.bot ? " [BOT]" : ""}  |  ${fmt(p.balance)}${gain}  |  Spins:${p.spins}`);
  }
  if (result && result.results.length > 0) {
    lines.push("-------------------");
    for (const w of result.results) {
      lines.push(w.jackpot ? `** JACKPOT! +${fmt(w.win)} **` : `Ligne ${w.line+1}: ${w.symLabel} x${w.count} => +${fmt(w.win)}`);
    }
    lines.push(`GAIN TOTAL: +${fmt(result.totalWin)}`);
    if (result.freeSpins > 0) lines.push(`FREE SPINS BONUS: +${result.freeSpins}`);
  }
  lines.push("-------------------");
  lines.push(body.replace(/[^\x20-\x7E]/g, ""));
  if (current) lines.push(`Tour de ${current.name} -- Tapez: spin | bet <n> | lines <1-10> | stop`);
  return lines.join("\n");
}

function createGame({ threadID, commandName, players, betAmount, betLevelKey }) {
  const key = `slots_${threadID}_${players[0].id}`;
  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, commandName,
    players: players.map(p => ({ ...p, balance: betAmount * 10 || 1000, spins: 0, wins: 0, lastGain: null, totalWon: 0 })),
    currentBet: betAmount || 100,
    betLevel: BET_LEVELS[betLevelKey] || BET_LEVELS.low,
    activePaylines: 5,
    freeSpins: 0,
    grid: spinReels(),
    phase: "idle",
    turnIndex: 0,
    updatedAt: Date.now(),
    startedAt: Date.now(),
    lastMsgID: null,
    commandName,
  };
}

async function doSpin(message, game, usersData) {
  const player  = game.players[game.turnIndex];
  const isFree  = game.freeSpins > 0;
  const cost     = isFree ? 0 : game.currentBet * game.activePaylines;

  if (!isFree && player.balance < cost)
    return publishState(message, game, `Solde insuffisant! Besoin: ${fmt(cost)}. Tapez "bet <montant>" pour reduire.`);

  if (!isFree) player.balance -= cost;
  else game.freeSpins--;

  GLOBAL_JACKPOT += Math.floor(cost * game.betLevel.jackpotContrib);

  game.grid   = spinReels();
  game.phase  = "spinning";
  const result = evaluateSpin(game.grid, game.currentBet, game.activePaylines);

  player.balance  += result.totalWin;
  player.lastGain  = result.totalWin - (isFree ? 0 : cost);
  player.spins++;
  if (result.totalWin > 0) player.wins++;
  player.totalWon += result.totalWin;

  if (result.freeSpins > 0) game.freeSpins += result.freeSpins;

  if (!player.bot && usersData) {
    try {
      const ud = await usersData.get(player.id);
      await usersData.set(player.id, {
        money: (ud.money || 0) + player.lastGain,
        exp:   (ud.exp || 0) + Math.floor(Math.abs(player.lastGain) / 50),
      });
    } catch (e) {}
  }

  const label = result.totalWin > 0
    ? `VICTOIRE! +${fmt(result.totalWin)} pour ${player.name}!`
    : isFree ? `Free spin #${player.spins} - Pas de gain.`
    : `Pas de chance... -${fmt(cost)} pour ${player.name}.`;

  await publishState(message, game, label, result);

  if (game.players.length > 1) {
    game.turnIndex = (game.turnIndex + 1) % game.players.length;
  }
  game.phase = "idle";

  await runBots(message, game, usersData);
}

async function runBots(message, game, usersData) {
  while (true) {
    const current = game.players[game.turnIndex];
    if (!current || !current.bot) break;
    await sleep(BOT_DELAY);
    await doSpin(message, game, usersData);
    if (game.phase !== "idle") break;
  }
}

function cleanupExpiredGames() {
  const now = Date.now();
  for (const [key, game] of activeGames.entries()) {
    if (now - game.updatedAt > GAME_EXPIRE_MS) {
      activeGames.delete(key);
      if (game.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.lastMsgID);
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

function detectBetLevel(amount) {
  if (amount >= 1000) return "high";
  if (amount >= 200)  return "mid";
  return "low";
}

module.exports = {
  config: {
    name: "slots",
    aliases: [],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Slots Royal - Machine a sous Canvas 5x3, jackpot progressif, free spins, multijoueur." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("SLOTS ROYAL -- Machine a Sous 5x3")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `  ${fonts.monospace("slots solo")}              : Solo\n` +
        `  ${fonts.monospace("slots bot")}               : 1 vs Bot\n` +
        `  ${fonts.monospace("slots 1v1 @joueur")}       : Duel humain\n` +
        `  ${fonts.monospace("slots 1v1v1 @p2 @p3")}    : 3 joueurs\n` +
        `  ${fonts.monospace("slots 1v1v1v1 @p2 @p3 @p4")}: 4 joueurs\n\n` +
        `${fonts.bold("Mise initiale optionnelle :")}\n` +
        `  ${fonts.monospace("slots 1v1 @joueur 500")}   : solde de depart x10\n\n` +
        `${fonts.bold("Actions en jeu :")}\n` +
        `  ${fonts.monospace("spin")}                    : Lancer les reels\n` +
        `  ${fonts.monospace("bet <montant>")}           : Changer la mise par ligne\n` +
        `  ${fonts.monospace("lines <1-10>")}            : Nombre de lignes actives\n` +
        `  ${fonts.monospace("status")}                  : Revoir le plateau\n` +
        `  ${fonts.monospace("stop")}                    : Quitter la partie\n\n` +
        `${fonts.bold("Symboles (du plus rare au plus commun) :")}\n` +
        `  7 (x50/200/500)  DIAM (x30/100/250)  CROWN (x20/80/200)\n` +
        `  BELL (x10/40/100)  STAR (x5/20/60)  BAR (x4/15/40)\n` +
        `  LEM (x3/10/25)  CHR (x3/10/25)\n` +
        `  WILD (substitut universel)  BONUS (free spins: 3=5, 4=10, 5=20)\n\n` +
        `${fonts.bold("Jackpot progressif :")}\n` +
        `  5 x 7 sur une ligne active = JACKPOT total!\n` +
        `  Chaque mise alimente le jackpot (1-5% selon niveau).\n\n` +
        `${fonts.bold("Niveaux de mise :")}\n` +
        `  Low Roller: 50-200  |  Mid Roller: 200-1000  |  High Roller: 1000+`
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
          activeGames.delete(k);
          if (g.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(g.lastMsgID);
          n++;
        }
      }
      return message.reply(fonts.bold(n ? `Partie(s) terminee(s): ${n}` : "Aucune partie en cours."));
    }

    if (mode === "status") {
      for (const g of activeGames.values()) {
        if (g.threadID === threadID && g.players.some(p => p.id === senderID)) {
          return publishState(message, g, "Etat actuel de la machine.");
        }
      }
      return message.reply(fonts.bold("Aucune partie en cours."));
    }

    let playerCount = 1, isSolo = false, isBot = false;
    if (mode === "solo")         { isSolo = true; playerCount = 1; }
    else if (mode === "bot")     { isBot = true;  playerCount = 2; }
    else if (mode === "1v1")     playerCount = 2;
    else if (mode === "1v1v1")   playerCount = 3;
    else if (mode === "1v1v1v1") playerCount = 4;
    else return message.reply(this.config.guide.fr);

    const betArg   = args.find(a => /^\d+$/.test(a) && parseInt(a) >= 50);
    const betAmount = betArg ? parseInt(betArg) : 100;
    const betLevelKey = detectBetLevel(betAmount);

    const myName = await getUserName(api, usersData, senderID);
    const players = [{ id: senderID, name: myName, bot: false }];

    if (!isSolo && !isBot) {
      const mIds = Object.keys(mentions || {}).filter(id => id !== senderID);
      for (let i = 0; i < Math.min(mIds.length, playerCount-1); i++)
        players.push({ id: mIds[i], name: await getUserName(api, usersData, mIds[i]), bot: false });
    }
    while (players.length < playerCount) {
      const n = ["Lucky","Ace","Jackpot","Royal","Vegas","Neon"][players.length-1] || `Bot${players.length}`;
      players.push({ id: `bot_${players.length}_${Date.now()}`, name: n, bot: true });
    }

    const startBalance = betAmount * 10;
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id).catch(() => null);
      if (!ud || (ud.money || 0) < startBalance)
        return message.reply(fonts.bold(`${p.name} n'a pas assez! Besoin: ${fmt(startBalance)}`));
      await usersData.set(p.id, { money: (ud.money || 0) - startBalance });
    }

    const game = createGame({ threadID, commandName, players, betAmount, betLevelKey });
    activeGames.set(game.key, game);

    const modeLabel = isSolo ? "Solo" : isBot ? "vs Bot" : `${playerCount} joueurs`;
    await publishState(message, game, `Slots Royal demarre! Mode: ${modeLabel} | ${BET_LEVELS[betLevelKey].label} | Tapez "spin" pour jouer!`);
    await runBots(message, game, usersData);
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey);
    if (!game || game.id !== Reply.gameID) return;
    if (game.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.lastMsgID);

    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;
    if (event.senderID !== current.id)
      return message.reply(fonts.bold(`C'est le tour de ${current.name}!`));

    const input = (event.body || "").trim().toLowerCase();
    const parts = input.split(/\s+/);

    if (parts[0] === "stop" || parts[0] === "quit") {
      activeGames.delete(game.key);
      return message.reply(fonts.bold("Partie terminee. Soldes sauvegardes."));
    }

    if (parts[0] === "status" || parts[0] === "map") {
      return publishState(message, game, "Etat de la machine.", null);
    }

    if (parts[0] === "bet" && parts[1]) {
      const nb = parseInt(parts[1]);
      if (isNaN(nb) || nb < 50) return message.reply(fonts.bold("Mise minimum: 50. Ex: bet 200"));
      game.currentBet = nb;
      game.betLevel   = BET_LEVELS[detectBetLevel(nb)];
      return publishState(message, game, `Mise changee: ${fmt(nb)} par ligne (${game.betLevel.label})`);
    }

    if (parts[0] === "lines" && parts[1]) {
      const nl = parseInt(parts[1]);
      if (isNaN(nl) || nl < 1 || nl > 10) return message.reply(fonts.bold("Lignes: 1 a 10. Ex: lines 5"));
      game.activePaylines = nl;
      return publishState(message, game, `Lignes actives: ${nl}`);
    }

    if (parts[0] === "spin" || parts[0] === "s" || parts[0] === "go" || parts[0] === "play") {
      return doSpin(message, game, usersData);
    }

    return publishState(message, game, `Commande inconnue. Tapez: spin | bet <n> | lines <1-10> | stop`);
  },
};
