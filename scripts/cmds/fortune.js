const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t, italic: t => t }; }

let money;
try { money = require("../../func/money.js"); }
catch { money = { format: n => String(n) }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),     { family: "FortuneFont", weight: "bold"   });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"),  { family: "FortuneFont", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"), { family: "FortuneFont", weight: "600"    });
} catch (e) { console.log("[Fortune] Font:", e.message); }

const SF = {
  bold:    s => `bold ${s}px FortuneFont, Arial`,
  semi:    s => `600 ${s}px FortuneFont, Arial`,
  regular: s => `${s}px FortuneFont, Arial`,
};

const COOLDOWN_MS = 1000 * 60 * 60 * 6;
const lastDraw = new Map();

const ARCANA = [
  { name: "L'Etoile",      theme: "Espoir",      color: ["#1a0a3d", "#3d1a7a", "#7a4fff"], glow: "#7a4fff", luck: [70, 99]  },
  { name: "Le Soleil",     theme: "Reussite",     color: ["#3d1a00", "#7a3d00", "#ffae00"], glow: "#ffae00", luck: [65, 95]  },
  { name: "La Lune",       theme: "Mystere",      color: ["#001a3d", "#0a2a5c", "#3d8bff"], glow: "#3d8bff", luck: [30, 70]  },
  { name: "La Roue",       theme: "Changement",   color: ["#3d2a00", "#7a5400", "#ffd24f"], glow: "#ffd24f", luck: [10, 90]  },
  { name: "La Force",      theme: "Courage",      color: ["#3d0a0a", "#7a1a1a", "#ff4f4f"], glow: "#ff4f4f", luck: [50, 90]  },
  { name: "La Justice",    theme: "Equilibre",    color: ["#0a3d2a", "#1a7a54", "#4fffae"], glow: "#4fffae", luck: [40, 80]  },
  { name: "L'Hermite",     theme: "Reflexion",    color: ["#1a1a1a", "#3d3d3d", "#aaaaaa"], glow: "#aaaaaa", luck: [20, 60]  },
  { name: "La Tour",       theme: "Bouleversement", color: ["#2a0a00", "#5c1a00", "#ff7a3d"], glow: "#ff7a3d", luck: [5, 45]  },
  { name: "Le Pendu",      theme: "Patience",     color: ["#0a2a3d", "#1a5c7a", "#4fd2ff"], glow: "#4fd2ff", luck: [15, 55]  },
  { name: "La Mort",       theme: "Renouveau",    color: ["#1a001a", "#3d003d", "#bf4fff"], glow: "#bf4fff", luck: [10, 60]  },
  { name: "Le Monde",      theme: "Accomplissement", color: ["#001a1a", "#0a3d3d", "#4fffff"], glow: "#4fffff", luck: [75, 99] },
  { name: "Le Diable",     theme: "Tentation",    color: ["#1a0000", "#3d0000", "#ff1a1a"], glow: "#ff1a1a", luck: [0, 40]   },
];

const ADVICE = [
  "Une porte fermee en cache toujours une autre, ouverte.",
  "Le silence d'aujourd'hui prepare la parole de demain.",
  "Ce que tu crains de perdre n'etait peut-etre pas a toi.",
  "La patience est une graine qui ne pousse que dans l'ombre.",
  "Un pas de cote vaut parfois mieux qu'un pas en avant.",
  "Ecoute ce que les autres taisent, pas ce qu'ils disent.",
  "Le hasard n'est qu'un nom donne a un plan invisible.",
  "Ce qui te ralentit aujourd'hui te protege demain.",
  "Une victoire trop facile cache souvent un piege plus tard.",
  "Le doute n'est pas un ennemi, c'est un guide discret.",
  "Ce que tu repares en silence vaut plus que ce que tu detruis bruyamment.",
  "Le chemin le plus court n'est pas toujours le plus sur.",
];

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);              ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStarSymbol(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = color; ctx.shadowBlur = 22;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, color); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a  = (Math.PI / 8) * i;
    const r2 = i % 2 === 0 ? size : size * 0.4;
    const x2 = Math.cos(a) * r2, y2 = Math.sin(a) * r2;
    i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const W = 900, H = 1260;

function renderCard(card, luckValue, userName) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, card.color[0]);
  bg.addColorStop(0.55, card.color[1]);
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  for (let i = 0; i < 70; i++) {
    const px = (i * 137 + 23) % W;
    const py = (i * 197 + 11) % H;
    const r2 = Math.random() * 1.4 + 0.4;
    ctx.globalAlpha = 0.12 + Math.random() * 0.22;
    ctx.beginPath(); ctx.arc(px, py, r2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor = card.glow; ctx.shadowBlur = 26;
  ctx.strokeStyle = card.glow; ctx.lineWidth = 5;
  drawRoundRect(ctx, 22, 22, W - 44, H - 44, 30); ctx.stroke();
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
  drawRoundRect(ctx, 38, 38, W - 76, H - 76, 24); ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.save();
  ctx.shadowColor = card.glow; ctx.shadowBlur = 16;
  ctx.font = SF.semi(24);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("CARTE DE DESTINEE", W / 2, 100);
  ctx.restore();

  drawStarSymbol(ctx, W / 2, 290, 130, card.glow);

  ctx.save();
  ctx.shadowColor = card.glow; ctx.shadowBlur = 24;
  ctx.font = SF.bold(58);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(card.name, W / 2, 480);
  ctx.restore();

  ctx.font = SF.semi(30);
  ctx.fillStyle = card.glow;
  ctx.fillText(card.theme.toUpperCase(), W / 2, 530);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(120, 580); ctx.lineTo(W - 120, 580); ctx.stroke();
  ctx.restore();

  ctx.font = SF.semi(22);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("INDICE DE CHANCE", W / 2, 650);

  ctx.save();
  ctx.shadowColor = card.glow; ctx.shadowBlur = 30;
  ctx.font = SF.bold(82);
  const lg = ctx.createLinearGradient(W / 2 - 140, 700, W / 2 + 140, 760);
  lg.addColorStop(0, "#ffffff"); lg.addColorStop(0.5, card.glow); lg.addColorStop(1, "#ffffff");
  ctx.fillStyle = lg;
  ctx.fillText(money.format(luckValue, { suffix: "%", decimals: 0 }), W / 2, 760);
  ctx.restore();

  const barW = 560, barH = 18, barX = (W - barW) / 2, barY = 800;
  ctx.save();
  drawRoundRect(ctx, barX, barY, barW, barH, 9);
  ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fill();
  const fillW = Math.max(barH, (barW * Math.min(100, Math.max(0, luckValue))) / 100);
  drawRoundRect(ctx, barX, barY, fillW, barH, 9);
  ctx.shadowColor = card.glow; ctx.shadowBlur = 14;
  ctx.fillStyle = card.glow; ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(120, 870); ctx.lineTo(W - 120, 870); ctx.stroke();
  ctx.restore();

  ctx.font = SF.semi(22);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("MESSAGE", W / 2, 930);

  ctx.font = SF.regular(28);
  ctx.fillStyle = "#f0f0f0";
  wrapText(ctx, card.advice, W / 2, 980, W - 180, 40);

  ctx.save();
  ctx.font = SF.semi(20);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`Tire pour ${userName}`, W / 2, H - 70);
  ctx.restore();

  return canvas;
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

function drawCard() {
  const arcane = ARCANA[Math.floor(Math.random() * ARCANA.length)];
  const [lo, hi] = arcane.luck;
  const luckValue = Math.floor(lo + Math.random() * (hi - lo + 1));
  const advice = ADVICE[Math.floor(Math.random() * ADVICE.length)];
  return { ...arcane, advice, luckValue };
}

module.exports = {
  config: {
    name: "fortune",
    aliases: [],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: { fr: "Tire une carte de destinee illustree, sans aucune utilite reelle." },
    category: "fun",
    guide: {
      fr:
        `${fonts.sansSerif("CARTE DE DESTINEE")}\n\n` +
        `${fonts.monospace("fortune")} : Tirer une carte aleatoire\n\n` +
        `${fonts.italic("Purement cosmetique -- aucun gain, aucune perte, aucune incidence sur ton compte.")}`
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const { senderID } = event;

    const last = lastDraw.get(senderID);
    if (last && Date.now() - last < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (Date.now() - last);
      return message.reply(fonts.bold(`Les cartes se reposent encore. Reviens dans ${fmtMs(remaining)}.`));
    }

    let userName = "Toi";
    try {
      if (usersData?.getName) userName = await usersData.getName(senderID);
    } catch (_) {}

    const card = drawCard();
    lastDraw.set(senderID, Date.now());

    const canvas  = renderCard(card, card.luckValue, userName);
    const tmpPath = path.join(os.tmpdir(), `fortune_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));

    const text =
      `${fonts.bold(card.name.toUpperCase())} -- ${card.theme}\n` +
      `Indice de chance: ${money.format(card.luckValue, { suffix: "%", decimals: 0 })}\n` +
      `${fonts.italic(card.advice)}`;

    return message.reply(
      { body: text, attachment: fs.createReadStream(tmpPath) },
      (err) => { try { fs.unlinkSync(tmpPath); } catch (_) {} if (err) console.error("[Fortune] Send:", err); }
    );
  }
};
