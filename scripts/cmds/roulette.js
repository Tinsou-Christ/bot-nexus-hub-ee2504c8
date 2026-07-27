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
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "RouFont", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "RouFont", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "RouFont", weight: "600" });
} catch(e) { console.log("[Roulette] Font:", e.message); }

const MF = {
  bold:    s => `bold ${s}px RouFont, Arial`,
  semi:    s => `600 ${s}px RouFont, Arial`,
  regular: s => `${s}px RouFont, Arial`,
};

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const GAME_EXPIRE_MS = 1000 * 60 * 20;  // 20 min
const SPIN_DELAY      = 2600;
const MIN_BET         = 50;
const MAX_BET         = 100_000;
const BETTING_WINDOW  = 35_000; // ms — fenetre de mises avant le lancer auto

const activeGames = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Roue europeenne (37 cases, simple zero)
const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,
  20,14,31,9,22,18,29,7,28,12,35,3,26
];
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function colorOf(n) {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

// ─────────────────────────────────────────────
//  TYPES DE PARIS
// ─────────────────────────────────────────────
const BET_TYPES = {
  plein:    { label: "Plein",     payout: 35, needsNum: true  },
  rouge:    { label: "Rouge",     payout: 1,  needsNum: false },
  noir:     { label: "Noir",      payout: 1,  needsNum: false },
  pair:     { label: "Pair",      payout: 1,  needsNum: false },
  impair:   { label: "Impair",    payout: 1,  needsNum: false },
  manque:   { label: "1-18",      payout: 1,  needsNum: false },
  passe:    { label: "19-36",     payout: 1,  needsNum: false },
  d1:       { label: "1ere douz", payout: 2,  needsNum: false },
  d2:       { label: "2eme douz", payout: 2,  needsNum: false },
  d3:       { label: "3eme douz", payout: 2,  needsNum: false },
};

function betWins(type, num, betNum) {
  const col = colorOf(num);
  switch (type) {
    case "plein":  return num === betNum;
    case "rouge":  return col === "red";
    case "noir":   return col === "black";
    case "pair":   return num !== 0 && num % 2 === 0;
    case "impair": return num !== 0 && num % 2 === 1;
    case "manque": return num >= 1 && num <= 18;
    case "passe":  return num >= 19 && num <= 36;
    case "d1":     return num >= 1  && num <= 12;
    case "d2":     return num >= 13 && num <= 24;
    case "d3":     return num >= 25 && num <= 36;
    default: return false;
  }
}

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
//  PARSER DE COMMANDE DE MISE
//  ex: "rouge 500" | "plein 17 500" | "d2 300" | "pair 200"
// ─────────────────────────────────────────────
const TYPE_ALIASES = {
  rouge:"rouge", red:"rouge",
  noir:"noir", black:"noir",
  pair:"pair", even:"pair",
  impair:"impair", odd:"impair",
  manque:"manque", low:"manque",
  passe:"passe", high:"passe",
  d1:"d1", douz1:"d1", "1ere":"d1",
  d2:"d2", douz2:"d2", "2eme":"d2",
  d3:"d3", douz3:"d3", "3eme":"d3",
  plein:"plein", num:"plein", numero:"plein",
};

function parseBetCommand(input) {
  const parts = input.trim().toLowerCase().split(/\s+/);
  if (!parts.length) return null;

  const typeKey = TYPE_ALIASES[parts[0]];
  if (!typeKey) return null;
  const def = BET_TYPES[typeKey];

  if (def.needsNum) {
    const num = parseInt(parts[1]);
    const amount = parseInt(parts[2]);
    if (isNaN(num) || num < 0 || num > 36 || isNaN(amount)) return null;
    return { type: typeKey, num, amount };
  } else {
    const amount = parseInt(parts[1]);
    if (isNaN(amount)) return null;
    return { type: typeKey, num: null, amount };
  }
}

// ─────────────────────────────────────────────
//  CANVAS — RENDU
// ─────────────────────────────────────────────
const CW = 1300, CH = 900;

function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function drawBg(ctx) {
  const g = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, Math.max(CW,CH)/1.4);
  g.addColorStop(0, "#1a0508"); g.addColorStop(0.5, "#0d0306"); g.addColorStop(1, "#000000");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);

  for (const [lx, ly, lc] of [[200,200,"#330011"],[CW-200,200,"#220022"],[CW/2,CH-100,"#2a0010"]]) {
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 320);
    lg.addColorStop(0, lc+"88"); lg.addColorStop(1, "transparent");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, CW, CH);
  }

  ctx.save();
  for (let i = 0; i < 60; i++) {
    ctx.globalAlpha = 0.06 + Math.random()*0.1;
    ctx.beginPath();
    ctx.arc((i*191)%CW, (i*113+40)%CH, Math.random()*1.6+0.4, 0, Math.PI*2);
    ctx.fillStyle = "#ffaa88"; ctx.fill();
  }
  ctx.restore();

  const nb = ctx.createLinearGradient(0, 0, CW, CH);
  nb.addColorStop(0, "#cc8800"); nb.addColorStop(0.5, "#774400"); nb.addColorStop(1, "#cc8800");
  ctx.save();
  ctx.shadowColor = "#cc7700"; ctx.shadowBlur = 26;
  ctx.strokeStyle = nb; ctx.lineWidth = 6;
  rrPath(ctx, 8, 8, CW-16, CH-16, 30); ctx.stroke();
  ctx.shadowBlur = 6;
  ctx.strokeStyle = "rgba(200,120,0,0.3)"; ctx.lineWidth = 2;
  rrPath(ctx, 16, 16, CW-32, CH-32, 26); ctx.stroke();
  ctx.restore();
}

function drawHeader(ctx, game, statusLine) {
  ctx.save();
  ctx.shadowColor = "#aa6600"; ctx.shadowBlur = 16;
  rrPath(ctx, 38, 16, CW-76, 110, 18);
  ctx.fillStyle = "rgba(20,4,4,0.93)"; ctx.fill();
  ctx.strokeStyle = "rgba(170,100,0,0.6)"; ctx.lineWidth = 2;
  rrPath(ctx, 38, 16, CW-76, 110, 18); ctx.stroke();
  ctx.restore();

  const tg = ctx.createLinearGradient(60, 28, 60, 84);
  tg.addColorStop(0, "#ffcc66"); tg.addColorStop(0.5, "#dd8822"); tg.addColorStop(1, "#aa5500");
  ctx.save();
  ctx.shadowColor = "#dd8822"; ctx.shadowBlur = 20;
  ctx.font = MF.bold(44);
  ctx.fillStyle = tg;
  ctx.fillText("ROULETTE  ROYALE", 60, 80);
  ctx.restore();

  ctx.font = MF.semi(17); ctx.fillStyle = "#aa7755";
  ctx.fillText(statusLine, 60, 108);

  ctx.textAlign = "right";
  ctx.font = MF.semi(18); ctx.fillStyle = "#ffcc44";
  ctx.fillText(`Manche: ${game.round}  |  Pot total: ${fmt(game.totalPot)}`, CW-52, 108);
  ctx.textAlign = "left";
}

// ── Roue ──────────────────────────────────────
function drawWheel(ctx, centerX, centerY, radius, rotationDeg, winningIdx = -1, ballAngleDeg = null) {
  const n = WHEEL_ORDER.length;
  const slice = (Math.PI*2) / n;
  const rot = rotationDeg * Math.PI/180;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Anneau exterieur dore
  ctx.save();
  ctx.shadowColor = "#cc8800"; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(0, 0, radius+22, 0, Math.PI*2);
  const og = ctx.createRadialGradient(0,0,radius, 0,0,radius+22);
  og.addColorStop(0, "#774400"); og.addColorStop(0.5, "#ffcc66"); og.addColorStop(1, "#553300");
  ctx.fillStyle = og; ctx.fill();
  ctx.restore();

  // Cases de la roue
  ctx.rotate(rot);
  for (let i = 0; i < n; i++) {
    const num   = WHEEL_ORDER[i];
    const start = i * slice;
    const end   = start + slice;
    const col   = colorOf(num);
    const isWin = i === winningIdx;

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();

    let fillColor;
    if (col === "green") fillColor = isWin ? "#22dd66" : "#0a7733";
    else if (col === "red") fillColor = isWin ? "#ff4466" : "#aa1133";
    else fillColor = isWin ? "#555566" : "#161616";

    if (isWin) { ctx.save(); ctx.shadowColor = fillColor; ctx.shadowBlur = 26; }
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (isWin) ctx.restore();

    ctx.strokeStyle = "rgba(200,160,80,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Numero
    ctx.save();
    const midAngle = start + slice/2;
    ctx.rotate(midAngle);
    ctx.translate(radius*0.82, 0);
    ctx.rotate(Math.PI/2);
    ctx.font = MF.bold(radius < 200 ? 13 : 15);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(num), 0, 0);
    ctx.restore();
  }

  // Moyeu central
  ctx.beginPath(); ctx.arc(0, 0, radius*0.22, 0, Math.PI*2);
  const hub = ctx.createRadialGradient(0,0,4, 0,0,radius*0.22);
  hub.addColorStop(0, "#ffeebb"); hub.addColorStop(0.6, "#cc9933"); hub.addColorStop(1, "#553300");
  ctx.fillStyle = hub; ctx.fill();
  ctx.strokeStyle = "#774400"; ctx.lineWidth = 3; ctx.stroke();

  // Rayons moyeu
  ctx.strokeStyle = "rgba(100,60,10,0.6)"; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI/4)*i;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*radius*0.05, Math.sin(a)*radius*0.05);
    ctx.lineTo(Math.cos(a)*radius*0.2, Math.sin(a)*radius*0.2);
    ctx.stroke();
  }

  ctx.restore();

  // Bille
  if (ballAngleDeg !== null) {
    const ba = ballAngleDeg * Math.PI/180;
    const br = radius * 0.93;
    const bx = centerX + Math.cos(ba)*br;
    const by = centerY + Math.sin(ba)*br;
    ctx.save();
    ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI*2);
    const bg2 = ctx.createRadialGradient(bx-3,by-3,1, bx,by,9);
    bg2.addColorStop(0, "#ffffff"); bg2.addColorStop(1, "#bbbbbb");
    ctx.fillStyle = bg2; ctx.fill();
    ctx.restore();
  }

  // Pointeur fixe (haut)
  ctx.save();
  ctx.translate(centerX, centerY - radius - 30);
  ctx.beginPath();
  ctx.moveTo(-14, -18); ctx.lineTo(14, -18); ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.shadowColor = "#ffcc66"; ctx.shadowBlur = 10;
  ctx.fillStyle = "#ffcc66"; ctx.fill();
  ctx.strokeStyle = "#774400"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

function drawResultBadge(ctx, num, cx, cy) {
  const col = colorOf(num);
  const color = col === "red" ? "#ff4466" : col === "black" ? "#888888" : "#22dd66";
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI*2);
  const bg = ctx.createRadialGradient(cx-12,cy-12,4, cx,cy,46);
  bg.addColorStop(0, color); bg.addColorStop(1, col === "black" ? "#222" : col === "red" ? "#770022" : "#0a5522");
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = "#ffeebb"; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  ctx.font = MF.bold(34); ctx.fillStyle = "#fff";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(String(num), cx, cy+2);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}

// ── Table de mises ─────────────────────────────
function drawBetTable(ctx, game) {
  const tx = 700, ty = 180;
  const tw = CW - tx - 38, th = 380;

  ctx.save();
  ctx.shadowColor = "#aa6600"; ctx.shadowBlur = 14;
  rrPath(ctx, tx, ty, tw, th, 16);
  ctx.fillStyle = "rgba(15,5,5,0.9)"; ctx.fill();
  ctx.strokeStyle = "rgba(170,100,0,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, tx, ty, tw, th, 16); ctx.stroke();
  ctx.restore();

  ctx.font = MF.bold(19); ctx.fillStyle = "#dd9944";
  ctx.fillText("MISES EN COURS", tx+18, ty+28);
  ctx.strokeStyle = "rgba(170,100,0,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tx+14, ty+38); ctx.lineTo(tx+tw-14, ty+38); ctx.stroke();

  let row = 0;
  const lineH = 26;
  for (const p of game.players) {
    if (!p.bets.length) continue;
    ctx.font = MF.bold(15); ctx.fillStyle = p.bot ? "#665544" : "#ddbb77";
    const y = ty + 60 + row*lineH;
    if (y > ty+th-20) continue;
    ctx.fillText(`${p.name}${p.bot?" [BOT]":""}:`, tx+18, y);
    row++;
    for (const b of p.bets) {
      const yy = ty + 60 + row*lineH;
      if (yy > ty+th-20) { row++; continue; }
      const def = BET_TYPES[b.type];
      const label = def.needsNum ? `${def.label} ${b.num}` : def.label;
      ctx.font = MF.semi(14); ctx.fillStyle = "#997755";
      ctx.fillText(`  ${label} -- ${fmt(b.amount)}`, tx+18, yy);
      row++;
    }
  }
  if (row === 0) {
    ctx.font = MF.semi(15); ctx.fillStyle = "#554433";
    ctx.fillText("Aucune mise pour le moment.", tx+18, ty+64);
  }
}

function drawPlayersPanel(ctx, game) {
  const px = 700, py = 575, pw = CW - px - 38, ph = CH - py - 30;

  ctx.save();
  ctx.shadowColor = "#aa6600"; ctx.shadowBlur = 12;
  rrPath(ctx, px, py, pw, ph, 16);
  ctx.fillStyle = "rgba(15,5,5,0.9)"; ctx.fill();
  ctx.strokeStyle = "rgba(170,100,0,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, px, py, pw, ph, 16); ctx.stroke();
  ctx.restore();

  ctx.font = MF.bold(18); ctx.fillStyle = "#dd9944";
  ctx.fillText("SOLDES JOUEURS", px+18, py+26);

  const colW = Math.floor((pw-32) / Math.min(game.players.length, 2));
  game.players.forEach((p, i) => {
    const col = i % 2, rowI = Math.floor(i/2);
    const cx = px + 16 + col*colW;
    const cy = py + 50 + rowI*46;
    if (cy > py+ph-16) return;
    ctx.font = MF.semi(14); ctx.fillStyle = "#bb9966";
    ctx.fillText(`${p.name}${p.bot?" [BOT]":""}`, cx, cy);
    ctx.font = MF.bold(17); ctx.fillStyle = p.balance >= p.startBalance ? "#55cc77" : "#dd5566";
    ctx.fillText(fmt(p.balance), cx, cy+20);
  });
}

function drawFooter(ctx, text) {
  const fy = CH - 30;
  ctx.font = MF.semi(15); ctx.fillStyle = "rgba(200,140,60,0.8)";
  ctx.textAlign = "center";
  ctx.fillText(text, CW/2, fy);
  ctx.textAlign = "left";
}

// ── Frame: phase MISES ─────────────────────────
function renderBettingFrame(game) {
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext("2d");
  drawBg(ctx);
  const remaining = Math.max(0, Math.ceil((game.bettingEndsAt - Date.now())/1000));
  drawHeader(ctx, game, `Phase de mises -- ${remaining}s restantes`);

  const cx = 330, cy = 410, radius = 230;
  drawWheel(ctx, cx, cy, radius, game.wheelRotation, -1, null);

  drawBetTable(ctx, game);
  drawPlayersPanel(ctx, game);
  drawFooter(ctx, "Misez: <type> [numero] <montant>  |  fin  |  status");
  return canvas;
}

// ── Frame: animation de lancer ─────────────────
function renderSpinFrame(game, rotation, ballAngle, winningIdx) {
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext("2d");
  drawBg(ctx);
  drawHeader(ctx, game, "La bille tourne...");
  const cx = 330, cy = 410, radius = 230;
  drawWheel(ctx, cx, cy, radius, rotation, winningIdx, ballAngle);
  drawBetTable(ctx, game);
  drawPlayersPanel(ctx, game);
  drawFooter(ctx, "Resultat en cours...");
  return canvas;
}

// ── Frame: resultat final ──────────────────────
function renderResultFrame(game, num, rotation, results) {
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext("2d");
  drawBg(ctx);
  const col = colorOf(num);
  drawHeader(ctx, game, `Resultat: ${num} (${col === "red" ? "Rouge" : col === "black" ? "Noir" : "Vert"})`);

  const cx = 330, cy = 410, radius = 230;
  const winIdx = WHEEL_ORDER.indexOf(num);
  drawWheel(ctx, cx, cy, radius, rotation, winIdx, null);
  drawResultBadge(ctx, num, cx, cy);

  // Resultats joueurs (table de droite remplacee par resultats)
  const tx = 700, ty = 180, tw = CW-tx-38, th = 380;
  ctx.save();
  ctx.shadowColor = "#aa6600"; ctx.shadowBlur = 14;
  rrPath(ctx, tx, ty, tw, th, 16);
  ctx.fillStyle = "rgba(15,5,5,0.9)"; ctx.fill();
  ctx.strokeStyle = "rgba(170,100,0,0.5)"; ctx.lineWidth = 2;
  rrPath(ctx, tx, ty, tw, th, 16); ctx.stroke();
  ctx.restore();

  ctx.font = MF.bold(19); ctx.fillStyle = "#dd9944";
  ctx.fillText("RESULTATS", tx+18, ty+28);
  ctx.strokeStyle = "rgba(170,100,0,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tx+14, ty+38); ctx.lineTo(tx+tw-14, ty+38); ctx.stroke();

  let row = 0;
  for (const r of results) {
    const y = ty + 64 + row*30;
    if (y > ty+th-20) break;
    const netColor = r.net > 0 ? "#55cc77" : r.net < 0 ? "#dd5566" : "#998866";
    ctx.font = MF.bold(15); ctx.fillStyle = r.bot ? "#776655" : "#ddbb77";
    ctx.fillText(`${r.name}${r.bot?" [BOT]":""}`, tx+18, y);
    ctx.font = MF.bold(16); ctx.fillStyle = netColor;
    ctx.textAlign = "right";
    ctx.fillText(`${r.net >= 0 ? "+" : ""}${fmt(r.net)}`, tx+tw-18, y);
    ctx.textAlign = "left";
    row++;
  }

  drawPlayersPanel(ctx, game);
  drawFooter(ctx, "Tapez: rejouer  |  fin");
  return canvas;
}

// ─────────────────────────────────────────────
//  PUBLICATION
// ─────────────────────────────────────────────
async function sendFrame(message, game, canvas, body, registerReply = true) {
  const tmpPath = path.join(os.tmpdir(), `roulette_${game.id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}.png`);
  fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));

  return new Promise(resolve => {
    message.reply({ body, attachment: fs.createReadStream(tmpPath) }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { console.error("[Roulette] Send:", err); resolve(null); return; }
      if (registerReply && info && global.GoatBot?.onReply) {
        game.lastMsgID = info.messageID;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID  : info.messageID,
          threadID   : game.threadID,
          gameKey    : game.key,
          gameID     : game.id,
        });
      }
      resolve(info);
    });
  });
}

function buildBettingText(game) {
  const remaining = Math.max(0, Math.ceil((game.bettingEndsAt - Date.now())/1000));
  const lines = [
    "=== ROULETTE ROYALE ===",
    `Manche: ${game.round}  |  Pot: ${fmt(game.totalPot)}  |  Mises ferment dans ${remaining}s`,
    "-------------------",
    "Types de mise disponibles:",
    "  plein <num> <mise>   (paie x35)",
    "  rouge / noir <mise>  (paie x1)",
    "  pair / impair <mise> (paie x1)",
    "  manque(1-18) / passe(19-36) <mise> (paie x1)",
    "  d1 / d2 / d3 <mise>  (douzaines, paie x2)",
    "-------------------",
  ];
  for (const p of game.players) {
    if (p.bot) continue;
    const myBets = p.bets.map(b => {
      const def = BET_TYPES[b.type];
      return `${def.needsNum ? def.label+" "+b.num : def.label}:${fmt(b.amount)}`;
    }).join(", ") || "aucune";
    lines.push(`${p.name} -- Solde: ${fmt(p.balance)} -- Mises: ${myBets}`);
  }
  lines.push("-------------------");
  lines.push("Tapez votre mise, ou \"fin\" pour lancer la roue maintenant.");
  return lines.join("\n");
}

// ─────────────────────────────────────────────
//  LOGIQUE BOT — mise auto
// ─────────────────────────────────────────────
function botPlaceBet(game, player) {
  const choices = ["rouge","noir","pair","impair","manque","passe","d1","d2","d3"];
  const type = choices[Math.floor(Math.random()*choices.length)];
  const possibleAmounts = [100,200,300,500,1000].filter(a => a <= player.balance);
  if (!possibleAmounts.length) return;
  const amount = possibleAmounts[Math.floor(Math.random()*possibleAmounts.length)];
  player.bets.push({ type, num: null, amount });
  player.balance -= amount;
  game.totalPot += amount;
}

// ─────────────────────────────────────────────
//  DEROULEMENT D'UNE MANCHE
// ─────────────────────────────────────────────
async function startBettingPhase(message, game) {
  game.phase = "betting";
  game.bettingEndsAt = Date.now() + BETTING_WINDOW;
  for (const p of game.players) p.bets = [];
  game.totalPot = 0;

  // Bots misent immediatement
  for (const p of game.players.filter(p => p.bot)) botPlaceBet(game, p);

  game.updatedAt = Date.now();
  const canvas = renderBettingFrame(game);
  await sendFrame(message, game, canvas, buildBettingText(game));

  // Lancer auto apres la fenetre si personne ne dit "fin"
  game.bettingTimer = setTimeout(() => {
    if (activeGames.get(game.key) === game && game.phase === "betting") {
      spinWheel(message, game).catch(e => console.error("[Roulette] spin auto:", e));
    }
  }, BETTING_WINDOW);
}

async function spinWheel(message, game) {
  if (game.bettingTimer) { clearTimeout(game.bettingTimer); game.bettingTimer = null; }
  game.phase = "spinning";

  const winningNum = WHEEL_ORDER[Math.floor(Math.random()*WHEEL_ORDER.length)];
  const winIdx = WHEEL_ORDER.indexOf(winningNum);
  const n = WHEEL_ORDER.length;
  const slice = 360/n;

  // Calcul rotation finale pour amener winIdx sous le pointeur (haut, -90deg / angle 270)
  const targetSliceCenter = winIdx*slice + slice/2;
  const fullSpins = 4 + Math.floor(Math.random()*3); // 4-6 tours
  const finalRotation = game.wheelRotation + fullSpins*360 + (270 - targetSliceCenter);

  const frames = 6;
  for (let f = 1; f <= frames; f++) {
    const t = f/frames;
    const eased = 1 - Math.pow(1-t, 3);
    const rot = game.wheelRotation + (finalRotation - game.wheelRotation)*eased;
    const ballAngle = (rot*-1.3) % 360;
    const canvas = renderSpinFrame(game, rot, ballAngle, -1);
    await sendFrame(message, game, canvas, `La bille tourne... (${Math.round(t*100)}%)`, false);
    await sleep(SPIN_DELAY/frames);
  }

  game.wheelRotation = finalRotation % 360;

  // Calcul des gains
  const results = [];
  for (const p of game.players) {
    let totalGain = 0;
    let totalStaked = 0;
    for (const b of p.bets) {
      totalStaked += b.amount;
      if (betWins(b.type, winningNum, b.num)) {
        const def = BET_TYPES[b.type];
        totalGain += b.amount + b.amount*def.payout;
      }
    }
    p.balance += totalGain;
    const net = totalGain - totalStaked;
    p.lastNet = net;
    results.push({ name: p.name, bot: p.bot, net });
  }

  game.round++;
  game.phase = "result";
  game.updatedAt = Date.now();

  const canvas = renderResultFrame(game, winningNum, game.wheelRotation, results);
  const col = colorOf(winningNum);
  await sendFrame(message, game, canvas,
    `Resultat: ${winningNum} (${col === "red"?"Rouge":col==="black"?"Noir":"Vert"}). Tapez "rejouer" pour la manche suivante ou "fin" pour arreter.`);
}

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────
function endGame(game) {
  if (game.bettingTimer) clearTimeout(game.bettingTimer);
  activeGames.delete(game.key);
  if (game.lastMsgID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.lastMsgID);
}

function cleanupExpiredGames() {
  const now = Date.now();
  for (const [k, g] of activeGames.entries()) {
    if (now - g.updatedAt > GAME_EXPIRE_MS) endGame(g);
  }
}

async function getUserName(api, usersData, id) {
  try {
    if (usersData?.getName) return await usersData.getName(id);
    const info = await api.getUserInfo(id);
    return info[id]?.name || "Joueur";
  } catch { return "Joueur"; }
}

function findGameForUser(threadID, senderID) {
  for (const g of activeGames.values())
    if (g.threadID === threadID && g.players.some(p => p.id === senderID && !p.bot))
      return g;
  return null;
}

// ─────────────────────────────────────────────
//  MODULE GOATBOT
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name       : "roulette",
    aliases    : ["roul", "rl"],
    version    : "1.0",
    author     : "Christus",
    countDown  : 3,
    role       : 0,
    description: { fr: "Roulette Royale - Roue Canvas animee, multi-paris, multijoueur, bots, paris reels." },
    category   : "game",
    guide: {
      fr:
        `${fonts.sansSerif("ROULETTE ROYALE")}` + "\n\n" +
        `${fonts.bold("Demarrer une partie :")}` + "\n" +
        `  ${fonts.monospace("roulette start")}            : table solo (vous seul)` + "\n" +
        `  ${fonts.monospace("roulette start @j1 @j2")}    : table avec des joueurs invites` + "\n" +
        `  ${fonts.monospace("roulette start bot")}        : ajoute un bot a la table` + "\n\n" +
        `${fonts.bold("Pendant la phase de mises (35s) :")}` + "\n" +
        `  ${fonts.monospace("plein 17 500")}    : mise pleine sur le 17 (paie x35)` + "\n" +
        `  ${fonts.monospace("rouge 300")}       : mise sur rouge (paie x1)` + "\n" +
        `  ${fonts.monospace("noir 300")}        : mise sur noir (paie x1)` + "\n" +
        `  ${fonts.monospace("pair 200")} / ${fonts.monospace("impair 200")}` + "\n" +
        `  ${fonts.monospace("manque 200")} (1-18) / ${fonts.monospace("passe 200")} (19-36)` + "\n" +
        `  ${fonts.monospace("d1")} / ${fonts.monospace("d2")} / ${fonts.monospace("d3")} ${fonts.monospace("300")} : douzaines (paie x2)` + "\n\n" +
        `${fonts.bold("Autres commandes :")}` + "\n" +
        `  ${fonts.monospace("fin")}       : lance la roue immediatement (ferme les mises)` + "\n" +
        `  ${fonts.monospace("rejouer")}   : nouvelle manche apres un resultat` + "\n" +
        `  ${fonts.monospace("status")}   : revoir l'etat de la table` + "\n" +
        `  ${fonts.monospace("roulette stop")} : quitter la table` + "\n\n" +
        `Vous pouvez miser plusieurs fois sur des types differents dans la meme manche.` + "\n" +
        `Sans action, la roue se lance automatiquement apres 35 secondes.`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const { senderID, threadID, mentions } = event;
    const mode = (args[0] || "").toLowerCase();

    if (!mode || mode === "help") return message.reply(this.config.guide.fr);

    if (mode === "stop" || mode === "end" || mode === "quit") {
      const g = findGameForUser(threadID, senderID);
      if (!g) return message.reply(fonts.bold("Aucune table en cours."));
      // Rembourser les mises en cours si phase betting
      if (g.phase === "betting") {
        for (const p of g.players.filter(p => !p.bot)) {
          const staked = p.bets.reduce((s,b) => s+b.amount, 0);
          if (staked > 0) {
            const ud = await usersData.get(p.id).catch(()=>null);
            if (ud) await usersData.set(p.id, { money: (ud.money||0) + staked });
          }
        }
      }
      // Reverser le solde virtuel restant aux comptes reels
      for (const p of g.players.filter(p => !p.bot)) {
        const ud = await usersData.get(p.id).catch(()=>null);
        if (ud) await usersData.set(p.id, { money: (ud.money||0) + p.balance });
      }
      endGame(g);
      return message.reply(fonts.bold("Table fermee. Solde reverse a votre compte."));
    }

    if (mode === "status") {
      const g = findGameForUser(threadID, senderID);
      if (!g) return message.reply(fonts.bold("Aucune table en cours."));
      const canvas = g.phase === "betting" ? renderBettingFrame(g) : renderResultFrame(g, WHEEL_ORDER[0], g.wheelRotation, g.players.map(p=>({name:p.name,bot:p.bot,net:p.lastNet||0})));
      return sendFrame(message, g, canvas, "Etat actuel de la table.");
    }

    if (mode === "start") {
      if (findGameForUser(threadID, senderID))
        return message.reply(fonts.bold("Vous avez deja une table ouverte ici. Tapez \"roulette stop\" pour la fermer."));

      const buyIn = MIN_BET * 40; // solde virtuel de depart
      const myName = await getUserName(api, usersData, senderID);
      const ud = await usersData.get(senderID).catch(()=>null);
      if (!ud || (ud.money||0) < buyIn)
        return message.reply(fonts.bold(`Solde insuffisant pour ouvrir la table. Besoin: ${fmt(buyIn)}`));

      const players = [];
      // Achat de jetons pour l'hote
      await usersData.set(senderID, { money: (ud.money||0) - buyIn });
      players.push({ id: senderID, name: myName, bot: false, balance: buyIn, startBalance: buyIn, bets: [] });

      // Joueurs invites
      const mIds = Object.keys(mentions||{}).filter(id => id !== senderID);
      for (const id of mIds.slice(0,3)) {
        const udi = await usersData.get(id).catch(()=>null);
        if (!udi || (udi.money||0) < buyIn) continue;
        await usersData.set(id, { money: (udi.money||0) - buyIn });
        players.push({ id, name: await getUserName(api, usersData, id), bot: false, balance: buyIn, startBalance: buyIn, bets: [] });
      }

      if (args.includes("bot")) {
        players.push({ id: `bot_0_${Date.now()}`, name: "Croupier IA", bot: true, balance: buyIn, startBalance: buyIn, bets: [] });
      }

      const gameKey = `roulette_${threadID}_${senderID}`;
      const game = {
        id: `${threadID}_${Date.now()}`,
        key: gameKey,
        threadID,
        commandName,
        players,
        round: 1,
        wheelRotation: 0,
        totalPot: 0,
        phase: "betting",
        bettingTimer: null,
        bettingEndsAt: 0,
        lastMsgID: null,
        updatedAt: Date.now(),
      };
      activeGames.set(gameKey, game);

      await startBettingPhase(message, game);
      return;
    }

    return message.reply(this.config.guide.fr);
  },

  onReply: async function ({ message, event, Reply, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey);
    if (!game || game.id !== Reply.gameID) return;

    const senderID = event.senderID;
    const player = game.players.find(p => p.id === senderID && !p.bot);
    if (!player) return;

    const input = (event.body || "").trim().toLowerCase();

    if (input === "fin" || input === "stop" && game.phase === "betting") {
      if (input === "fin") {
        await spinWheel(message, game);
        return;
      }
    }

    if (input === "stop" || input === "quit") {
      for (const p of game.players.filter(p => !p.bot)) {
        const staked = (p.bets||[]).reduce((s,b)=>s+b.amount,0);
        const ud = await usersData.get(p.id).catch(()=>null);
        if (ud) await usersData.set(p.id, { money: (ud.money||0) + p.balance + staked });
      }
      endGame(game);
      return message.reply(fonts.bold("Table fermee. Solde reverse a votre compte."));
    }

    if (input === "status") {
      const canvas = game.phase === "betting" ? renderBettingFrame(game) : renderResultFrame(game, WHEEL_ORDER[0], game.wheelRotation, game.players.map(p=>({name:p.name,bot:p.bot,net:p.lastNet||0})));
      return sendFrame(message, game, canvas, "Etat actuel de la table.");
    }

    if (input === "rejouer" || input === "replay") {
      if (game.phase !== "result") return message.reply(fonts.bold("La manche n'est pas terminee."));
      await startBettingPhase(message, game);
      return;
    }

    if (game.phase !== "betting")
      return message.reply(fonts.bold("Les mises sont fermees. Attendez le resultat ou tapez \"rejouer\"."));

    const bet = parseBetCommand(input);
    if (!bet)
      return message.reply(fonts.bold("Mise invalide. Ex: \"rouge 300\", \"plein 17 500\", \"d2 200\"."));

    if (bet.amount < MIN_BET || bet.amount > MAX_BET)
      return message.reply(fonts.bold(`Montant invalide. Min: ${MIN_BET}, Max: ${MAX_BET}.`));

    if (bet.amount > player.balance)
      return message.reply(fonts.bold(`Solde insuffisant. Votre solde: ${fmt(player.balance)}.`));

    player.bets.push(bet);
    player.balance -= bet.amount;
    game.totalPot += bet.amount;
    game.updatedAt = Date.now();

    const def = BET_TYPES[bet.type];
    const label = def.needsNum ? `${def.label} ${bet.num}` : def.label;
    return message.reply(fonts.bold(`Mise enregistree: ${label} -- ${fmt(bet.amount)}. Solde restant: ${fmt(player.balance)}.`));
  },
};
