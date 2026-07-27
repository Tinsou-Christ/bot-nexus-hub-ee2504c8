const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "TttF", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "TttF", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "TttF", weight: "600" });
} catch(e) {}

const F = {
  bold:    s => `bold ${s}px TttF, Arial`,
  semi:    s => `600 ${s}px TttF, Arial`,
  regular: s => `${s}px TttF, Arial`,
};

const PLAYER_COLORS = [
  { key:"red",  label:"[X]", hex:"#ef4444", dark:"#7f1d1d", text:"#fca5a5", letter:"X" },
  { key:"blue", label:"[O]", hex:"#3b82f6", dark:"#1e3a8a", text:"#93c5fd", letter:"O" },
];

const BOT_NAMES   = ["Deep Zero", "Alpha O"];
const GAME_EXPIRE = 20 * 60 * 1000;
const BOT_DELAY   = 900;
const activeGames = new Map();
const sleep       = ms => new Promise(r => setTimeout(r, ms));

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const CW = 900, CH = 1100;
const BOARD_X = 120, BOARD_Y = 210;
const CELL_SIZE = 220;
const BOARD_W = CELL_SIZE * 3;
const BOARD_H = CELL_SIZE * 3;

module.exports = {
  config: {
    name: "ttt",
    aliases: ["morpion","tic","tictactoe","xo"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Morpion (Tic Tac Toe) Royal — Canvas sans emojis, 1v1 humain ou vs bot, avec paris." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("MORPION ROYAL - TIC TAC TOE")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `  ${fonts.monospace("ttt bot")}           : 1v1 contre un bot\n` +
        `  ${fonts.monospace("ttt @joueur")}        : duel humain\n` +
        `  ${fonts.monospace("ttt @joueur 500")}    : duel avec mise de 500\n\n` +
        `${fonts.bold("En jeu (repondez au message) :")}\n` +
        `  Entrez un numero de 1 a 9 :\n\n` +
        `       1 | 2 | 3\n` +
        `      ---+---+---\n` +
        `       4 | 5 | 6\n` +
        `      ---+---+---\n` +
        `       7 | 8 | 9\n\n` +
        `${fonts.bold("Gestion :")}\n` +
        `  ${fonts.monospace("ttt stop")}   : abandonner la partie\n` +
        `  ${fonts.monospace("ttt status")} : revoir le plateau\n\n` +
        `Aligner 3 [X] ou 3 [O] pour gagner !\n` +
        `Match nul si le plateau est plein.`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpired();
    const mode = (args[0] || "").toLowerCase();
    if (!mode || mode === "help") return message.reply(this.config.guide.fr);

    if (mode === "stop" || mode === "end") {
      const n = endGamesForThread(event.threadID, event.senderID, usersData);
      if (!n) return message.reply(fonts.bold("Aucune partie en cours pour vous ici."));
      return message.reply(fonts.bold(`${n} partie(s) terminee(s). Mises remboursees si applicable.`));
    }

    if (mode === "status") {
      for (const g of activeGames.values()) {
        if (g.threadID === event.threadID && g.players.some(p => p.id === event.senderID)) {
          await publishState(message, g, "Etat du plateau.");
          return;
        }
      }
      return message.reply(fonts.bold("Aucune partie en cours pour vous ici."));
    }

    await handleStart({ message, event, args, api, usersData, commandName });
  },

  onReply: async function ({ message, event, Reply, api, usersData }) {
    cleanupExpired();
    const game = activeGames.get(Reply.gameKey || Reply.threadID);
    if (!game || game.id !== Reply.gameID) return;
    if (game.replyMessageID && global.GoatBot?.onReply)
      global.GoatBot.onReply.delete(game.replyMessageID);

    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;
    if (event.senderID !== current.id) {
      return message.reply({
        body: fonts.bold(`Ce n'est pas votre tour ! C'est a ${current.name} (${current.color.label}).`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }

    const input = (event.body || "").trim().toLowerCase();
    if (input === "stop" || input === "end") {
      await refundBets(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("Partie terminee. Mises remboursees."));
    }

    const cell = parseInt(input);
    if (isNaN(cell) || cell < 1 || cell > 9) {
      await publishState(message, game, `${current.name}, entrez un numero de 1 a 9 !`);
      return;
    }

    await doPlay(message, game, cell - 1, api, usersData);
  }
};

async function handleStart({ message, event, args, api, usersData, commandName }) {
  const { threadID, senderID } = event;
  const mode = (args[0] || "").toLowerCase();
  const humanName = await getName(api, usersData, senderID);

  let isBotGame = false;
  if (mode === "bot" || mode === "bots") isBotGame = true;

  const mentionIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);

  const players = [{ id: senderID, name: humanName, bot: false }];

  if (isBotGame) {
    players.push({ id: `bot_1_${Date.now()}`, name: BOT_NAMES[0], bot: true });
  } else {
    if (!mentionIDs.length)
      return message.reply(fonts.bold("Mentionnez un adversaire ou utilisez \"ttt bot\"."));
    players.push({ id: mentionIDs[0], name: await getName(api, usersData, mentionIDs[0]), bot: false });
  }

  let bet = 0;
  if (!isBotGame) {
    const betArg = args.find(a => /^\d+$/.test(a) && +a > 0);
    if (betArg) bet = parseInt(betArg, 10);
  }

  if (bet > 0) {
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      if ((ud?.money || 0) < bet)
        return message.reply(fonts.bold(`${p.name} n'a pas assez ! Besoin: ${bet.toLocaleString()} | Solde: ${(ud?.money||0).toLocaleString()}`));
    }
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money||0) - bet });
    }
  }

  const game = createGame(threadID, players, commandName, isBotGame, bet);

  if (activeGames.has(game.key))
    return message.reply(fonts.bold("Une partie est deja en cours dans ce fil !"));

  activeGames.set(game.key, game);

  const potStr = bet > 0 ? ` | Cagnotte: ${game.pot.toLocaleString()}` : "";
  await publishState(message, game, `MORPION demarre!${potStr} A vous, ${players[0].name} ! Entrez 1-9.`);
  await runBots(message, game, api, usersData);
}

function createGame(threadID, rawPlayers, commandName, botGame, bet) {
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const players = rawPlayers.map((p, i) => ({
    ...p,
    color:     PLAYER_COLORS[i % PLAYER_COLORS.length],
    moveCount: 0,
    wins:      0,
  }));
  return {
    id:             `${threadID}_${Date.now()}`,
    key, threadID, commandName, botGame, players,
    board:          Array(9).fill(null),
    turnIndex:      0,
    moveCount:      0,
    log:            ["Partie creee - plateau vide"],
    replyMessageID: null,
    updatedAt:      Date.now(),
    startedAt:      Date.now(),
    bet, pot: bet * rawPlayers.filter(p => !p.bot).length,
    winner:         null,
    draw:           false,
    winLine:        null,
  };
}

async function doPlay(message, game, cellIdx, api, usersData) {
  const player = game.players[game.turnIndex];

  if (game.board[cellIdx] !== null) {
    await publishState(message, game, `${player.name}, cette case est deja prise ! Choisissez une autre.`);
    return;
  }

  game.board[cellIdx] = game.turnIndex;
  player.moveCount++;
  game.moveCount++;
  game.updatedAt = Date.now();

  const row = Math.floor(cellIdx / 3) + 1;
  const col = (cellIdx % 3) + 1;
  game.log.unshift(`${player.color.label} ${player.name} joue case ${cellIdx + 1} (ligne ${row}, col ${col}).`);

  const winLine = checkWin(game.board, game.turnIndex);
  if (winLine) {
    game.winner  = player;
    game.winLine = winLine;
    await payWinner(game, usersData);
    const winMsg = buildWinMsg(game);
    endGame(game);
    await publishState(message, game, winMsg);
    return;
  }

  if (game.board.every(c => c !== null)) {
    game.draw = true;
    await refundBets(game, usersData);
    endGame(game);
    await publishState(message, game, `MATCH NUL ! Le plateau est plein. Mises remboursees.`);
    return;
  }

  game.turnIndex = 1 - game.turnIndex;
  const next = game.players[game.turnIndex];
  await publishState(message, game, `${player.color.label} ${player.name} joue case ${cellIdx + 1}. A toi, ${next.color.label} ${next.name} !`);
  await runBots(message, game, api, usersData);
}

async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (
    activeGames.get(game.key) === game &&
    game.players[game.turnIndex]?.bot &&
    !game.winner && !game.draw && safety < 20
  ) {
    safety++;
    await sleep(BOT_DELAY);
    if (!activeGames.has(game.key)) return;

    const bot   = game.players[game.turnIndex];
    const move  = getBotMove(game.board, game.turnIndex);
    game.board[move] = game.turnIndex;
    bot.moveCount++;
    game.moveCount++;
    game.updatedAt = Date.now();

    game.log.unshift(`[BOT] ${bot.color.label} ${bot.name} joue case ${move + 1}.`);

    const winLine = checkWin(game.board, game.turnIndex);
    if (winLine) {
      game.winner  = bot;
      game.winLine = winLine;
      const winMsg = buildWinMsg(game);
      endGame(game);
      await publishState(message, game, winMsg);
      return;
    }

    if (game.board.every(c => c !== null)) {
      game.draw = true;
      await refundBets(game, usersData);
      endGame(game);
      await publishState(message, game, `MATCH NUL ! Mises remboursees.`);
      return;
    }

    game.turnIndex = 1 - game.turnIndex;

    if (!game.players[game.turnIndex]?.bot) {
      const cur = game.players[game.turnIndex];
      await publishState(message, game, `[BOT] ${bot.name} joue case ${move + 1}. A toi, ${cur.color.label} ${cur.name} !`);
      return;
    }
  }
}

function getBotMove(board, botIdx) {
  const humanIdx = 1 - botIdx;

  const tryWin = findWinningMove(board, botIdx);
  if (tryWin !== -1) return tryWin;

  const tryBlock = findWinningMove(board, humanIdx);
  if (tryBlock !== -1) return tryBlock;

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  const sides = [1, 3, 5, 7].filter(i => board[i] === null);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return board.findIndex(c => c === null);
}

function findWinningMove(board, playerIdx) {
  for (const line of WIN_LINES) {
    const vals = line.map(i => board[i]);
    const mine    = vals.filter(v => v === playerIdx).length;
    const empty   = vals.filter(v => v === null).length;
    if (mine === 2 && empty === 1) return line[vals.indexOf(null)];
  }
  return -1;
}

function checkWin(board, playerIdx) {
  for (const line of WIN_LINES) {
    if (line.every(i => board[i] === playerIdx)) return line;
  }
  return null;
}

async function payWinner(game, usersData) {
  if (!game.bet || !game.pot || !usersData) return;
  const w = game.winner;
  if (!w || w.bot) return;
  try {
    const ud = await usersData.get(w.id);
    await usersData.set(w.id, { money: (ud.money||0) + game.pot });
  } catch(e) {}
}

async function refundBets(game, usersData) {
  if (!game.bet || !usersData) return;
  for (const p of game.players.filter(p => !p.bot)) {
    try {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money||0) + game.bet });
    } catch(e) {}
  }
}

function buildWinMsg(game) {
  const w = game.winner;
  let msg = `[VICTOIRE] ${w.color.label} ${w.name} remporte la partie !`;
  if (game.bet > 0 && !w.bot) msg += ` Gain: ${game.pot.toLocaleString()} !`;
  msg += `\n\nStats:`;
  game.players.forEach(p => {
    msg += `\n${p.color.label} ${p.name}${p.bot?" [BOT]":""} - Coups joues: ${p.moveCount}`;
  });
  return msg;
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);
}

function endGamesForThread(threadID, senderID, usersData) {
  let n = 0;
  for (const g of [...activeGames.values()]) {
    if (g.threadID === threadID && g.players.some(p => p.id === senderID)) {
      refundBets(g, usersData); endGame(g); n++;
    }
  }
  return n;
}

function cleanupExpired() {
  const now = Date.now();
  for (const g of activeGames.values())
    if (now - g.updatedAt > GAME_EXPIRE) endGame(g);
}

async function getName(api, usersData, id) {
  if (id.startsWith("bot_")) return id;
  try {
    if (usersData?.getName) return await usersData.getName(id);
    const info = await api.getUserInfo(id);
    return info[id]?.name || "Joueur";
  } catch { return "Joueur"; }
}

async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const current  = game.players[game.turnIndex];
  const text     = formatDetails(game, body);

  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);

  const tmpPath = path.join(os.tmpdir(), `ttt_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderBoard(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch(err) {
    return message.reply(fonts.bold(body));
  }

  const mentions = (current && !current.bot && current.id && !game.winner && !game.draw)
    ? [{ id: current.id, tag: current.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: text, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { resolve(); return; }
      game.replyMessageID = info?.messageID;
      if (activeGames.get(game.key) === game && current && !current.bot && !game.winner && !game.draw && global.GoatBot?.onReply && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID:   info.messageID,
          author:      current.id,
          threadID:    game.threadID,
          gameKey:     game.key,
          gameID:      game.id,
        });
      }
      resolve();
    });
  });
}

function formatDetails(game, body) {
  const cur     = game.players[game.turnIndex];
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);

  const SYMS = [null, "X", "O"];
  const b    = game.board;
  const cell = i => b[i] !== null ? `[${PLAYER_COLORS[b[i]].letter}]` : `[${i+1}]`;

  const lines = [
    "=== MORPION ROYAL ===",
    `${elapsed}m  |  ${game.moveCount} coups`,
  ];
  if (game.bet > 0) lines.push(`Mise: ${game.bet.toLocaleString()}  |  Cagnotte: ${game.pot.toLocaleString()}`);
  lines.push("---");
  lines.push(`  ${cell(0)} | ${cell(1)} | ${cell(2)}`);
  lines.push(`  ---+---+---`);
  lines.push(`  ${cell(3)} | ${cell(4)} | ${cell(5)}`);
  lines.push(`  ---+---+---`);
  lines.push(`  ${cell(6)} | ${cell(7)} | ${cell(8)}`);
  lines.push("---");
  game.players.forEach((p, i) => {
    const arrow = i === game.turnIndex && !game.winner && !game.draw ? " <<" : "";
    lines.push(`${p.color.label} ${p.name}${p.bot?" [BOT]":""}${arrow} - Coups: ${p.moveCount}`);
  });
  lines.push("---");
  if (!game.winner && !game.draw && cur)
    lines.push(cur.bot ? `[BOT] ${cur.name} reflechit...` : `A vous, ${cur.name} ! Entrez 1-9`);
  game.log.slice(0, 3).forEach(l => lines.push("- " + l.replace(/[^\x20-\x7E]/g, "")));
  lines.push("---");
  lines.push(body.replace(/[^\x20-\x7E]/g, ""));
  return lines.join("\n");
}

function renderBoard(game, banner) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");

  _drawBackground(ctx);
  _drawHeader(ctx, game);
  _drawGrid(ctx, game);
  _drawSymbols(ctx, game);
  _drawCellNumbers(ctx, game);
  if (game.winLine) _drawWinLine(ctx, game.winLine);
  _drawPlayersPanel(ctx, game);
  _drawLogPanel(ctx, game);
  _drawBanner(ctx, banner);

  return canvas;
}

function _drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0,   "#0f172a");
  grad.addColorStop(0.5, "#1e1b4b");
  grad.addColorStop(1,   "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  ctx.strokeStyle = "#ffffff08";
  ctx.lineWidth   = 1;
  for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke(); }
}

function _drawHeader(ctx, game) {
  ctx.save();
  ctx.font = F.bold(52);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "#818cf8";
  ctx.shadowBlur   = 28;
  ctx.fillStyle    = "#e0e7ff";
  ctx.fillText("MORPION ROYAL", CW / 2, 68);

  ctx.font = F.semi(22);
  ctx.fillStyle   = "#94a3b8";
  ctx.shadowBlur  = 0;
  const elapsed   = Math.floor((Date.now() - game.startedAt) / 60000);
  const potStr    = game.bet > 0 ? `  |  Cagnotte: ${game.pot.toLocaleString()}` : "";
  ctx.fillText(`${elapsed}min  |  ${game.moveCount} coups${potStr}`, CW / 2, 130);

  const p0 = game.players[0], p1 = game.players[1];
  ctx.font = F.bold(28);
  ctx.fillStyle  = p0.color.hex;
  ctx.shadowColor = p0.color.hex; ctx.shadowBlur = 12;
  ctx.textAlign  = "right";
  ctx.fillText(`${p0.color.label} ${p0.name}`, CW / 2 - 40, 175);
  ctx.shadowBlur = 0;
  ctx.fillStyle  = "#64748b";
  ctx.textAlign  = "center";
  ctx.font = F.bold(22);
  ctx.fillText("VS", CW / 2, 175);
  ctx.fillStyle  = p1.color.hex;
  ctx.shadowColor = p1.color.hex; ctx.shadowBlur = 12;
  ctx.textAlign  = "left";
  ctx.font = F.bold(28);
  ctx.fillText(`${p1.color.label} ${p1.name}`, CW / 2 + 40, 175);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function _drawGrid(ctx, game) {
  const gx = BOARD_X, gy = BOARD_Y;
  const glow = ctx.createRadialGradient(gx + BOARD_W/2, gy + BOARD_H/2, 50, gx + BOARD_W/2, gy + BOARD_H/2, 380);
  glow.addColorStop(0, "#3730a322");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(gx - 20, gy - 20, BOARD_W + 40, BOARD_H + 40);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x  = gx + col * CELL_SIZE;
      const y  = gy + row * CELL_SIZE;
      const idx = row * 3 + col;
      const cur = game.turnIndex;
      const isActive = game.board[idx] === null && !game.winner && !game.draw;
      const bg = isActive ? "#1e293b" : "#0f172a";
      const brd = isActive ? "#334155" : "#1e293b";
      rr(ctx, x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12, 18, bg, brd, 2);
    }
  }

  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth   = 5;
  ctx.shadowColor = "#818cf8";
  ctx.shadowBlur  = 18;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(gx + i * CELL_SIZE, gy + 10); ctx.lineTo(gx + i * CELL_SIZE, gy + BOARD_H - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx + 10, gy + i * CELL_SIZE); ctx.lineTo(gx + BOARD_W - 10, gy + i * CELL_SIZE); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function _drawSymbols(ctx, game) {
  const gx = BOARD_X, gy = BOARD_Y;
  const R  = CELL_SIZE / 2 - 24;
  const T  = CELL_SIZE / 2 - 16;

  for (let i = 0; i < 9; i++) {
    const val = game.board[i];
    if (val === null) continue;
    const col = i % 3, row = Math.floor(i / 3);
    const cx  = gx + col * CELL_SIZE + CELL_SIZE / 2;
    const cy  = gy + row * CELL_SIZE + CELL_SIZE / 2;
    const col2 = PLAYER_COLORS[val];

    const isWin = game.winLine && game.winLine.includes(i);
    ctx.save();
    ctx.strokeStyle = col2.hex;
    ctx.lineWidth   = isWin ? 20 : 14;
    ctx.lineCap     = "round";
    ctx.shadowColor = col2.hex;
    ctx.shadowBlur  = isWin ? 40 : 18;

    if (val === 0) {
      ctx.beginPath(); ctx.moveTo(cx - T, cy - T); ctx.lineTo(cx + T, cy + T); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + T, cy - T); ctx.lineTo(cx - T, cy + T); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

function _drawCellNumbers(ctx, game) {
  const gx = BOARD_X, gy = BOARD_Y;
  ctx.font      = F.regular(22);
  ctx.fillStyle = "#334155";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let i = 0; i < 9; i++) {
    if (game.board[i] !== null) continue;
    const col = i % 3, row = Math.floor(i / 3);
    const x   = gx + col * CELL_SIZE + 14;
    const y   = gy + row * CELL_SIZE + 12;
    ctx.fillText(`${i + 1}`, x, y);
  }
  ctx.textBaseline = "alphabetic";
}

function _drawWinLine(ctx, winLine) {
  const gx = BOARD_X, gy = BOARD_Y;
  const ci  = (i) => ({
    x: gx + (i % 3) * CELL_SIZE + CELL_SIZE / 2,
    y: gy + Math.floor(i / 3) * CELL_SIZE + CELL_SIZE / 2,
  });
  const a = ci(winLine[0]), b = ci(winLine[2]);
  ctx.save();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth   = 10;
  ctx.lineCap     = "round";
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur  = 30;
  ctx.setLineDash([18, 8]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function _drawPlayersPanel(ctx, game) {
  const py = BOARD_Y + BOARD_H + 28, ph = 200;
  rr(ctx, 40, py, CW - 80, ph, 20, "#ffffff0a", "#ffffff28", 1.5);

  ctx.font = F.bold(20); ctx.fillStyle = "#6ee7b7";
  ctx.textAlign = "left";
  ctx.fillText("JOUEURS", 65, py + 30);

  const colW = (CW - 100) / 2;
  game.players.forEach((p, i) => {
    const cx  = 50 + i * colW;
    const cur = i === game.turnIndex && !game.winner && !game.draw;

    if (cur) {
      ctx.save(); ctx.shadowColor = p.color.hex; ctx.shadowBlur = 22;
      rr(ctx, cx, py + 44, colW - 12, 140, 14, p.color.hex + "33", p.color.hex, 3);
      ctx.restore();
    } else {
      rr(ctx, cx, py + 44, colW - 12, 140, 14, "#ffffff0d", p.color.hex + "55", 1.5);
    }

    ctx.save(); ctx.shadowColor = p.color.hex; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx + 20, py + 68, 12, 0, Math.PI * 2);
    ctx.fillStyle = p.color.hex; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    ctx.font = F.bold(20);
    ctx.fillStyle = cur ? p.color.text : "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText((p.bot ? "[BOT] " : "") + p.name.slice(0, 14), cx + 40, py + 73);

    ctx.font = F.bold(22); ctx.fillStyle = p.color.hex;
    ctx.fillText(p.color.label, cx + 20, py + 108);

    ctx.font = F.regular(17); ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Coups: ${p.moveCount}`, cx + 20, py + 135);

    if (cur && !game.winner && !game.draw) {
      ctx.font = F.bold(15); ctx.fillStyle = "#fde68a";
      ctx.fillText(">> VOTRE TOUR - Entrez 1-9", cx + 16, py + 165);
    }
  });
}

function _drawLogPanel(ctx, game) {
  const py = CH - 280, ph = 160;
  rr(ctx, 40, py, CW - 80, ph, 18, "#0a1a0a99", "#10b98155", 1.5);

  ctx.font = F.bold(18); ctx.fillStyle = "#34d399";
  ctx.textAlign = "left";
  ctx.fillText("JOURNAL", 65, py + 28);

  ctx.font = F.regular(18);
  game.log.slice(0, 5).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#34d399" : i === 1 ? "#e2e8f0" : "#475569";
    const safe = line.replace(/[^\x20-\x7E]/g, "").trim();
    ctx.fillText("- " + safe.slice(0, 88), 65, py + 52 + i * 22);
  });
}

function _drawBanner(ctx, banner) {
  const by = CH - 95;
  rr(ctx, 40, by, CW - 80, 60, 14, "#071a0f99", "#10b981", 2);
  ctx.save();
  ctx.font = F.bold(26); ctx.fillStyle = "#34d399";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#10b981"; ctx.shadowBlur = 16;
  const safe = banner.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 80);
  ctx.fillText(safe, CW / 2, by + 30);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)       { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
