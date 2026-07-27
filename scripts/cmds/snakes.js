const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "SnkF", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "SnkF", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "SnkF", weight: "600" });
} catch(e) {}

const F = {
  bold:    s => `bold ${s}px SnkF, Arial`,
  semi:    s => `600 ${s}px SnkF, Arial`,
  regular: s => `${s}px SnkF, Arial`,
};

// ─────────────────────────────────────────────
//  PLATEAU 10x10
// ─────────────────────────────────────────────
const SNAKES = {
  99:7, 95:13, 87:24, 62:19, 54:34, 47:26, 17:7
};
const LADDERS = {
  4:56, 9:31, 20:58, 28:84, 40:59, 51:67, 63:81, 71:91
};

// ─────────────────────────────────────────────
//  COULEURS JOUEURS (sans emoji)
// ─────────────────────────────────────────────
const PLAYER_COLORS = [
  { key:"red",    label:"[R]", hex:"#ef4444", dark:"#7f1d1d", text:"#fca5a5", letter:"R" },
  { key:"blue",   label:"[B]", hex:"#3b82f6", dark:"#1e3a8a", text:"#93c5fd", letter:"B" },
  { key:"green",  label:"[V]", hex:"#22c55e", dark:"#14532d", text:"#86efac", letter:"V" },
  { key:"yellow", label:"[J]", hex:"#facc15", dark:"#713f12", text:"#fef08a", letter:"J" },
];

const BOT_NAMES   = ["Cobra King", "Ladder Lord", "Sly Viper", "Rung Runner"];
const GAME_EXPIRE = 45 * 60 * 1000;
const BOT_DELAY   = 1100;
const activeGames = new Map();
const sleep       = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  CANVAS CONSTANTES
// ─────────────────────────────────────────────
const CELL    = 84;
const COLS    = 10;
const ROWS    = 10;
const BOARD_X = 60;
const BOARD_Y = 175;
const BOARD_W = CELL * COLS;
const BOARD_H = CELL * ROWS;
const CW = 1200, CH = 1680;

// ─────────────────────────────────────────────
//  MODULE GOATBOT
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name: "snakes",
    aliases: ["snake","sel","serpents","snakeladder"],
    version: "2.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Serpents & Echelles Royal — plateau Canvas sans emojis, multijoueur, bots IA et paris." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("SERPENTS & ECHELLES ROYAL")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `  ${fonts.monospace("snakes bot")}           : 1v1 contre un bot\n` +
        `  ${fonts.monospace("snakes bot 3")}         : vous + 2 bots\n` +
        `  ${fonts.monospace("snakes bot 4")}         : vous + 3 bots\n` +
        `  ${fonts.monospace("snakes 1v1 @joueur")}   : duel humain\n` +
        `  ${fonts.monospace("snakes 1v1v1 @p2 @p3")} : 3 joueurs\n` +
        `  ${fonts.monospace("snakes 1v1v1v1 @p2 @p3 @p4")} : 4 joueurs\n\n` +
        `${fonts.bold("Paris (hors bot) :")}\n` +
        `  ${fonts.monospace("snakes 1v1 @joueur 500")} : mise de 500 chacun\n\n` +
        `${fonts.bold("En jeu :")}\n` +
        `  Repondez ${fonts.monospace("roll")} (ou ${fonts.monospace("r")}) pour lancer le de\n\n` +
        `${fonts.bold("Gestion :")}\n` +
        `  ${fonts.monospace("snakes stop")}   : terminer la partie\n` +
        `  ${fonts.monospace("snakes status")} : revoir le plateau\n\n` +
        `Premier a atteindre la case 100 remporte la partie !\n` +
        `Serpents [S] font descendre | Echelles [E] font monter`
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
        body: fonts.bold(`Ce n'est pas votre tour ! C'est a ${current.name}.`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }

    const input = (event.body || "").trim().toLowerCase();
    if (input === "stop" || input === "end") {
      await refundBets(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("Partie terminee. Mises remboursees."));
    }
    if (!["roll","r","dice","lancer"].includes(input)) {
      await publishState(message, game, `${current.name}, repondez "roll" pour lancer le de !`);
      return;
    }
    await doRoll(message, game, api, usersData);
  }
};

// ─────────────────────────────────────────────
//  DEMARRAGE
// ─────────────────────────────────────────────
async function handleStart({ message, event, args, api, usersData, commandName }) {
  const { threadID, senderID } = event;
  const mode = (args[0] || "").toLowerCase();
  const humanName = await getName(api, usersData, senderID);

  let playerCount = 2, isBotGame = false;
  if (mode === "1v1")           playerCount = 2;
  else if (mode === "1v1v1")    playerCount = 3;
  else if (mode === "1v1v1v1")  playerCount = 4;
  else if (mode === "bot" || mode === "bots") {
    isBotGame   = true;
    playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  } else return message.reply(module.exports.config.guide.fr);

  const mentionIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const players = [{ id: senderID, name: humanName, bot: false }];
  for (let i = 0; i < Math.min(mentionIDs.length, playerCount - 1); i++) {
    players.push({ id: mentionIDs[i], name: await getName(api, usersData, mentionIDs[i]), bot: false });
  }
  while (players.length < playerCount) {
    const idx = players.length - 1;
    players.push({ id: `bot_${idx}_${Date.now()}`, name: BOT_NAMES[idx] || `Bot${idx+1}`, bot: true });
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
  activeGames.set(game.key, game);

  const potStr = bet > 0 ? ` | Cagnotte: ${game.pot.toLocaleString()}` : "";
  await publishState(message, game, `SERPENTS & ECHELLES ROYAL demarre!${potStr} Repondez "roll" !`);
  await runBots(message, game, api, usersData);
}

// ─────────────────────────────────────────────
//  CREATION DE PARTIE
// ─────────────────────────────────────────────
function createGame(threadID, rawPlayers, commandName, botGame, bet) {
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const players = rawPlayers.map((p, i) => ({
    ...p,
    color:      PLAYER_COLORS[i % PLAYER_COLORS.length],
    position:   0,
    lastRoll:   null,
    rollCount:  0,
    snakeHits:  0,
    ladderHits: 0,
  }));
  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, commandName, botGame, players,
    turnIndex:      0,
    moveCount:      0,
    log:            ["Partie creee - case de depart: 0"],
    replyMessageID: null,
    updatedAt:      Date.now(),
    startedAt:      Date.now(),
    bet, pot: bet * rawPlayers.filter(p => !p.bot).length,
    winner: null,
  };
}

// ─────────────────────────────────────────────
//  LOGIQUE DU JEU
// ─────────────────────────────────────────────
function rollDice() { return Math.floor(Math.random() * 6) + 1; }

// Dessiner les points d'un dé dans le panneau texte
function diceStr(n) { return `[${n}]`; }

async function doRoll(message, game, api, usersData) {
  const player  = game.players[game.turnIndex];
  const roll    = rollDice();
  player.lastRoll  = roll;
  player.rollCount++;
  game.moveCount++;
  game.updatedAt = Date.now();

  const oldPos = player.position;
  let newPos   = oldPos + roll;
  let event_   = null;

  if (newPos > 100) {
    newPos = oldPos;
    game.log.unshift(`${player.color.label} ${player.name} fait ${diceStr(roll)} - trop loin, reste a ${oldPos}.`);
    event_ = "overshoot";
  } else {
    player.position = newPos;
    if (newPos === 100) {
      game.log.unshift(`${player.color.label} ${player.name} atteint la case 100 - VICTOIRE !`);
      game.winner = player;
      await payWinner(game, usersData);
      const winMsg = buildWinMsg(game);
      endGame(game);
      await publishState(message, game, winMsg);
      return;
    }
    if (SNAKES[newPos] !== undefined) {
      const dest = SNAKES[newPos];
      player.position  = dest;
      player.snakeHits++;
      game.log.unshift(`${player.color.label} ${player.name} ${diceStr(roll)} - case ${newPos} [SERPENT] - glisse a ${dest} !`);
      event_ = "snake";
    } else if (LADDERS[newPos] !== undefined) {
      const dest = LADDERS[newPos];
      player.position   = dest;
      player.ladderHits++;
      game.log.unshift(`${player.color.label} ${player.name} ${diceStr(roll)} - case ${newPos} [ECHELLE] - monte a ${dest} !`);
      event_ = "ladder";
    } else {
      game.log.unshift(`${player.color.label} ${player.name} ${diceStr(roll)} - case ${player.position}.`);
      event_ = "normal";
    }
  }

  const replay = roll === 6 && event_ !== "overshoot";
  if (!replay) nextTurn(game);

  const banner = buildBanner(player, roll, event_, replay);
  await publishState(message, game, banner);
  await runBots(message, game, api, usersData);
}

function buildBanner(player, roll, event_, replay) {
  const tag = { snake:"[SERPENT] Descente!", ladder:"[ECHELLE] Montee!", overshoot:"[STOP] Trop loin!", normal:"" }[event_]||"";
  let msg = `${player.color.label} ${player.name} : ${diceStr(roll)} ${tag} -> case ${player.position}`;
  if (replay) msg += "\n[6] Vous rejouez !";
  return msg;
}

function nextTurn(game) {
  game.turnIndex = (game.turnIndex + 1) % game.players.length;
}

// ─────────────────────────────────────────────
//  BOTS IA
// ─────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (
    activeGames.get(game.key) === game &&
    game.players[game.turnIndex]?.bot &&
    !game.winner && safety < 60
  ) {
    safety++;
    await sleep(BOT_DELAY);
    if (!activeGames.has(game.key)) return;

    const bot  = game.players[game.turnIndex];
    const roll = rollDice();
    bot.lastRoll  = roll;
    bot.rollCount++;
    game.moveCount++;
    game.updatedAt = Date.now();

    const oldPos = bot.position;
    let newPos   = oldPos + roll;
    let event_   = null;

    if (newPos > 100) {
      newPos = oldPos;
      game.log.unshift(`[BOT] ${bot.name} ${diceStr(roll)} - trop loin, reste a ${oldPos}.`);
      event_ = "overshoot";
    } else {
      bot.position = newPos;
      if (newPos === 100) {
        game.log.unshift(`[BOT] ${bot.name} atteint la case 100 - VICTOIRE !`);
        game.winner = bot;
        await payWinner(game, usersData);
        const winMsg = buildWinMsg(game);
        endGame(game);
        await publishState(message, game, winMsg);
        return;
      }
      if (SNAKES[newPos] !== undefined) {
        bot.position = SNAKES[newPos]; bot.snakeHits++;
        game.log.unshift(`[BOT] ${bot.name} ${diceStr(roll)} - case ${newPos} [S] -> ${bot.position}.`);
        event_ = "snake";
      } else if (LADDERS[newPos] !== undefined) {
        bot.position = LADDERS[newPos]; bot.ladderHits++;
        game.log.unshift(`[BOT] ${bot.name} ${diceStr(roll)} - case ${newPos} [E] -> ${bot.position}.`);
        event_ = "ladder";
      } else {
        game.log.unshift(`[BOT] ${bot.name} ${diceStr(roll)} - case ${bot.position}.`);
        event_ = "normal";
      }
    }

    const replay = roll === 6 && event_ !== "overshoot";
    if (!replay) nextTurn(game);

    if (!game.players[game.turnIndex]?.bot || game.winner) {
      const banner = buildBanner(bot, roll, event_, replay);
      await publishState(message, game, banner);
      return;
    }
  }

  if (activeGames.get(game.key) === game && !game.winner && !game.players[game.turnIndex]?.bot) {
    const cur = game.players[game.turnIndex];
    await publishState(message, game, `A vous, ${cur.name} ! Repondez "roll".`);
  }
}

// ─────────────────────────────────────────────
//  PARIS & FIN
// ─────────────────────────────────────────────
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
  if (game.bet > 0 && !w.bot) msg += `\nGain: ${game.pot.toLocaleString()} !`;
  msg += `\n\nStatistiques:\n`;
  game.players.forEach(p => {
    msg += `${p.color.label} ${p.name} - Case: ${p.position} | Lancers: ${p.rollCount} | [S]: ${p.snakeHits} | [E]: ${p.ladderHits}\n`;
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

// ─────────────────────────────────────────────
//  PUBLISH STATE
// ─────────────────────────────────────────────
async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const current  = game.players[game.turnIndex];
  const text     = formatDetails(game, body);

  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);

  const tmpPath = path.join(os.tmpdir(), `snk2_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderBoard(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch(err) {
    console.error("[Snakes2] Canvas:", err);
    return message.reply(fonts.bold(body));
  }

  const mentions = (current && !current.bot && current.id)
    ? [{ id: current.id, tag: current.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: text, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { resolve(); return; }
      game.replyMessageID = info?.messageID;
      if (activeGames.get(game.key) === game && current && !current.bot && global.GoatBot?.onReply && info) {
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
  const lines   = [
    "=== SERPENTS & ECHELLES ROYAL ===",
    `${elapsed}m  |  ${game.moveCount} lancers au total`,
  ];
  if (game.bet > 0) lines.push(`Mise: ${game.bet.toLocaleString()}  |  Cagnotte: ${game.pot.toLocaleString()}`);
  lines.push("---");
  game.players.forEach((p, i) => {
    const arrow = i === game.turnIndex && !game.winner ? " <<" : "";
    const bar   = progressBar(p.position);
    lines.push(`${p.color.label} ${p.name}${p.bot?" [BOT]":""}${arrow} - Case ${p.position}/100  ${bar}`);
  });
  lines.push("---");
  if (cur && !game.winner) {
    lines.push(cur.bot ? `[BOT] ${cur.name} reflechit...` : `A vous, ${cur.name} ! Repondez "roll"`);
  }
  game.log.slice(0,4).forEach(l => lines.push("- " + l.replace(/[^\x20-\x7E]/g,"")));
  lines.push("---");
  lines.push(body.replace(/[^\x20-\x7E]/g,""));
  return lines.join("\n");
}

function progressBar(pos) {
  const filled = Math.round(pos / 10);
  return "[" + "#".repeat(filled) + ".".repeat(10 - filled) + "]";
}

// ─────────────────────────────────────────────
//  RENDU CANVAS (1200x1680) — AUCUN EMOJI
// ─────────────────────────────────────────────
function renderBoard(game, banner) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  _drawBg(ctx);
  _drawHeader(ctx, game);
  _drawGrid(ctx);
  _drawSnakesAndLadders(ctx);
  _drawTokens(ctx, game);
  _drawLegend(ctx);
  _drawPlayersPanel(ctx, game);
  _drawLogPanel(ctx, game);
  _drawBanner(ctx, banner);

  return canvas;
}

// ── Fond ─────────────────────────────────────
function _drawBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0,    "#0f172a");
  g.addColorStop(0.35, "#1a0a2e");
  g.addColorStop(0.7,  "#0a1f0f");
  g.addColorStop(1,    "#0f172a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);

  // Cercles decoration
  ctx.save(); ctx.globalAlpha = 0.04;
  for (const [cx, cy, r] of [[120,130,200],[1080,160,240],[600,860,320],[200,1500,180],[980,1520,210]]) {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle="#fff"; ctx.fill();
  }
  ctx.restore();

  // Bordure or
  const bg = ctx.createLinearGradient(0,0,CW,CH);
  bg.addColorStop(0,"#c9a84c"); bg.addColorStop(0.5,"#f0d060"); bg.addColorStop(1,"#c9a84c");
  ctx.save();
  ctx.shadowColor="#c9a84c"; ctx.shadowBlur=18;
  ctx.strokeStyle=bg; ctx.lineWidth=7;
  rrPath(ctx,8,8,CW-16,CH-16,32); ctx.stroke();
  ctx.strokeStyle="#f0d06040"; ctx.lineWidth=2;
  rrPath(ctx,16,16,CW-32,CH-32,28); ctx.stroke();
  ctx.restore();
}

// ── Header ────────────────────────────────────
function _drawHeader(ctx, game) {
  rr(ctx, 40, 28, CW-80, 130, 24, "#ffffff0d", "#ffffff25", 1.5);

  const hg = ctx.createLinearGradient(55,50,55,110);
  hg.addColorStop(0,"#34d399"); hg.addColorStop(0.5,"#10b981"); hg.addColorStop(1,"#34d399");
  ctx.save();
  ctx.shadowColor="#10b981"; ctx.shadowBlur=18;
  ctx.font=F.bold(50); ctx.fillStyle=hg;
  ctx.fillText("SERPENTS & ECHELLES ROYAL", 55, 96);
  ctx.restore();

  const elapsed = Math.floor((Date.now()-game.startedAt)/60000);
  ctx.font=F.bold(22); ctx.fillStyle="#6ee7b7";
  ctx.fillText(`${game.players.length} joueurs  |  ${elapsed}m  |  ${game.moveCount} lancers`, 58, 136);

  if (game.bet > 0) {
    ctx.font=F.bold(20); ctx.fillStyle="#fde68a";
    ctx.fillText(`Cagnotte: ${game.pot.toLocaleString()}`, CW-320, 136);
  }
}

// ── Grille 10x10 ─────────────────────────────
function _drawGrid(ctx) {
  ctx.save();
  ctx.shadowColor="#000000bb"; ctx.shadowBlur=30; ctx.shadowOffsetY=15;
  rr(ctx, BOARD_X-8, BOARD_Y-8, BOARD_W+16, BOARD_H+16, 18, "#1e293b", null, 0);
  ctx.restore();

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sq      = squareNumber(row, col);
      const { x, y } = squareXY(sq);
      const isEven  = (row + col) % 2 === 0;

      let fill = isEven ? "#1e3a2a" : "#162d20";
      if (sq === 100)                     fill = "#4c1d95";
      else if (sq === 1)                  fill = "#1e3a8a";
      else if (SNAKES[sq]  !== undefined) fill = "#7f1d1d";
      else if (LADDERS[sq] !== undefined) fill = "#14532d";

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, CELL, CELL);
      ctx.strokeStyle = "#ffffff18"; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL, CELL);

      // Numero de case
      ctx.font = F.bold(sq >= 100 ? 15 : 17);
      ctx.fillStyle = sq===100 ? "#c4b5fd" : sq===1 ? "#93c5fd" :
                      SNAKES[sq]!==undefined  ? "#fca5a5" :
                      LADDERS[sq]!==undefined ? "#86efac" : "#ffffff55";
      ctx.textAlign = "center";
      ctx.fillText(String(sq), x + CELL/2, y + 18);
      ctx.textAlign = "left";

      // Serpent — dessin ASCII canvas
      if (SNAKES[sq] !== undefined) {
        _drawSnakeIcon(ctx, x + CELL/2, y + CELL/2 + 4);
        ctx.font = F.regular(13); ctx.fillStyle = "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText(`>${SNAKES[sq]}`, x + CELL/2, y + CELL - 8);
        ctx.textAlign = "left";
      } else if (LADDERS[sq] !== undefined) {
        _drawLadderIcon(ctx, x + CELL/2, y + CELL/2 + 4);
        ctx.font = F.regular(13); ctx.fillStyle = "#86efac";
        ctx.textAlign = "center";
        ctx.fillText(`^${LADDERS[sq]}`, x + CELL/2, y + CELL - 8);
        ctx.textAlign = "left";
      }

      // Badges START / FIN
      if (sq === 1) {
        ctx.font=F.bold(13); ctx.textAlign="center"; ctx.fillStyle="#93c5fd";
        ctx.fillText("START", x+CELL/2, y+CELL-8); ctx.textAlign="left";
      }
      if (sq === 100) {
        ctx.save();
        ctx.shadowColor="#c4b5fd"; ctx.shadowBlur=12;
        ctx.font=F.bold(13); ctx.textAlign="center"; ctx.fillStyle="#c4b5fd";
        ctx.fillText("FIN", x+CELL/2, y+CELL-8);
        ctx.textAlign="left"; ctx.restore();
      }
    }
  }
  ctx.strokeStyle="#10b98166"; ctx.lineWidth=4;
  ctx.strokeRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
}

// Dessiner un serpent ASCII en Canvas pur (courbe + tete)
function _drawSnakeIcon(ctx, cx, cy) {
  ctx.save();
  ctx.strokeStyle = "#ef444488"; ctx.lineWidth = 5;
  ctx.lineCap = "round";
  // Corps en S
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 14);
  ctx.bezierCurveTo(cx + 18, cy - 14, cx - 18, cy + 2, cx, cy + 2);
  ctx.bezierCurveTo(cx + 18, cy + 2, cx - 18, cy + 18, cx + 18, cy + 18);
  ctx.strokeStyle = "#ef4444cc"; ctx.stroke();
  // Tete
  ctx.beginPath(); ctx.arc(cx - 18, cy - 14, 6, 0, Math.PI*2);
  ctx.fillStyle = "#ef4444"; ctx.fill();
  ctx.strokeStyle = "#fca5a5"; ctx.lineWidth = 2; ctx.stroke();
  // Yeux
  ctx.beginPath(); ctx.arc(cx - 22, cy - 17, 2, 0, Math.PI*2);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.restore();
}

// Dessiner une echelle en Canvas pur (montants + barreaux)
function _drawLadderIcon(ctx, cx, cy) {
  ctx.save();
  const h = 26, w = 16;
  ctx.strokeStyle = "#22c55eaa"; ctx.lineWidth = 4; ctx.lineCap = "round";
  // Montants
  ctx.beginPath(); ctx.moveTo(cx - w/2, cy + h/2); ctx.lineTo(cx - w/2, cy - h/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + w/2, cy + h/2); ctx.lineTo(cx + w/2, cy - h/2); ctx.stroke();
  // Barreaux
  ctx.lineWidth = 3;
  for (let i = 0; i <= 3; i++) {
    const by = cy + h/2 - i * (h/3);
    ctx.beginPath(); ctx.moveTo(cx - w/2, by); ctx.lineTo(cx + w/2, by); ctx.stroke();
  }
  ctx.restore();
}

// ── Fleches serpents & echelles ───────────────
function _drawSnakesAndLadders(ctx) {
  for (const [head, tail] of Object.entries(SNAKES)) {
    const from = squareCenter(+head), to = squareCenter(tail);
    _drawCurvedArrow(ctx, from, to, "#ef444455", "#ef4444", 4, true);
  }
  for (const [bottom, top] of Object.entries(LADDERS)) {
    const from = squareCenter(+bottom), to = squareCenter(top);
    _drawCurvedArrow(ctx, from, to, "#22c55e55", "#22c55e", 4, false);
  }
}

function _drawCurvedArrow(ctx, from, to, color, arrowColor, lw, isSnake) {
  const mx = (from.x + to.x)/2 + (isSnake ? 35 : -35);
  const my = (from.y + to.y)/2;
  ctx.save(); ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(mx, my, to.x, to.y);
  ctx.strokeStyle=color; ctx.lineWidth=lw;
  ctx.setLineDash([8,5]); ctx.stroke(); ctx.setLineDash([]);
  const angle = Math.atan2(to.y - my, to.x - mx);
  ctx.fillStyle = arrowColor;
  ctx.beginPath(); ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 14*Math.cos(angle-0.4), to.y - 14*Math.sin(angle-0.4));
  ctx.lineTo(to.x - 14*Math.cos(angle+0.4), to.y - 14*Math.sin(angle+0.4));
  ctx.closePath(); ctx.globalAlpha=0.75; ctx.fill();
  ctx.restore();
}

// ── Pions ─────────────────────────────────────
function _drawTokens(ctx, game) {
  const byPos = new Map();
  for (const p of game.players) {
    if (p.position === 0) continue;
    if (!byPos.has(p.position)) byPos.set(p.position, []);
    byPos.get(p.position).push(p);
  }
  for (const [pos, players] of byPos) {
    const center = squareCenter(pos);
    players.forEach((p, idx) => {
      const off = stackOffset(idx, players.length);
      _drawToken(ctx, center.x + off.x, center.y + off.y, p.color, idx+1);
    });
  }
}

function stackOffset(i, total) {
  if (total === 1) return { x:0, y:0 };
  const angle  = (Math.PI * 2 * i) / total;
  const radius = total > 2 ? 18 : 13;
  return { x: Math.cos(angle)*radius, y: Math.sin(angle)*radius };
}

function _drawToken(ctx, cx, cy, color, num) {
  ctx.save();
  ctx.shadowColor="#000000aa"; ctx.shadowBlur=8; ctx.shadowOffsetY=4;
  // Corps du pion
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI*2);
  ctx.fillStyle=color.hex; ctx.fill();
  ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.stroke();
  ctx.shadowColor="transparent";
  // Lettre couleur + numero
  ctx.font=F.bold(16); ctx.fillStyle="#fff";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(String(num), cx, cy+1);
  // Arc de contour brillant
  ctx.beginPath(); ctx.arc(cx, cy, 22, Math.PI*1.2, Math.PI*1.8);
  ctx.strokeStyle="rgba(255,255,255,0.45)"; ctx.lineWidth=4; ctx.stroke();
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();
}

// ── Legende ───────────────────────────────────
function _drawLegend(ctx) {
  const lx = BOARD_X + BOARD_W + 18, ly = BOARD_Y, lw = CW - lx - 48;
  rr(ctx, lx, ly, lw, BOARD_H, 16, "#ffffff08", "#ffffff20", 1);

  ctx.font=F.bold(20); ctx.fillStyle="#34d399";
  ctx.fillText("LEGENDE", lx+16, ly+28);

  // Items legende textuels (sans emoji)
  const items = [
    { icon:"[S]", label:"Serpent = descend", color:"#fca5a5" },
    { icon:"[E]", label:"Echelle = monte",   color:"#86efac" },
    { icon:"[ ]", label:"Case normale",      color:"#94a3b8" },
    { icon:"[*]", label:"Case 100 = FIN",    color:"#c4b5fd" },
    { icon:"[>]", label:"Case 1 = START",    color:"#93c5fd" },
  ];
  items.forEach(({ icon, label, color }, i) => {
    ctx.font=F.bold(16); ctx.fillStyle=color;
    ctx.fillText(icon,  lx+14, ly+62+i*34);
    ctx.font=F.regular(17); ctx.fillStyle=color;
    ctx.fillText(label, lx+52, ly+62+i*34);
  });

  // Mini icones dessinées dans la legende
  _drawSnakeIcon(ctx, lx + lw/2 - 20, ly + 100);
  _drawLadderIcon(ctx, lx + lw/2 + 24, ly + 100);

  // Liste serpents
  ctx.font=F.bold(17); ctx.fillStyle="#ef4444";
  ctx.fillText("SERPENTS [S]:", lx+14, ly+240);
  ctx.font=F.regular(15); ctx.fillStyle="#fca5a5";
  Object.entries(SNAKES).forEach(([h,t],i) => {
    ctx.fillText(`${h} > ${t}`, lx+14+(i%2)*(lw/2), ly+262+Math.floor(i/2)*22);
  });

  // Liste echelles
  ctx.font=F.bold(17); ctx.fillStyle="#22c55e";
  ctx.fillText("ECHELLES [E]:", lx+14, ly+420);
  ctx.font=F.regular(15); ctx.fillStyle="#86efac";
  Object.entries(LADDERS).forEach(([b,t],i) => {
    ctx.fillText(`${b} ^ ${t}`, lx+14+(i%2)*(lw/2), ly+442+Math.floor(i/2)*22);
  });

  // Couleurs joueurs
  ctx.font=F.bold(17); ctx.fillStyle="#e2e8f0";
  ctx.fillText("JOUEURS:", lx+14, ly+580);
  PLAYER_COLORS.forEach((c,i) => {
    ctx.save();
    ctx.shadowColor=c.hex; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(lx+26, ly+602+i*30, 10, 0, Math.PI*2);
    ctx.fillStyle=c.hex; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
    ctx.font=F.regular(16); ctx.fillStyle=c.text;
    ctx.fillText(`${c.label} Joueur ${i+1}`, lx+44, ly+607+i*30);
  });

  // De visuel
  ctx.font=F.bold(17); ctx.fillStyle="#e2e8f0";
  ctx.fillText("DE:", lx+14, ly+740);
  _drawDice(ctx, lx+26, ly+752, 42, 4);
}

// Dessiner un dé Canvas pur
function _drawDice(ctx, x, y, size, value) {
  ctx.save();
  ctx.shadowColor="#00000088"; ctx.shadowBlur=8; ctx.shadowOffsetY=4;
  rr(ctx, x, y, size, size, 8, "#fffde7", "#c8a000", 3);
  ctx.restore();
  const dots = {
    1:[[0,0]],
    2:[[-1,-1],[1,1]],
    3:[[-1,-1],[0,0],[1,1]],
    4:[[-1,-1],[1,-1],[-1,1],[1,1]],
    5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
    6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],
  }[value] || [[0,0]];
  const r2 = size * 0.09, step = size * 0.26, mx = x+size/2, my = y+size/2;
  ctx.fillStyle = "#3e2000";
  for (const [dx2,dy2] of dots) {
    ctx.beginPath(); ctx.arc(mx+dx2*step, my+dy2*step, r2, 0, Math.PI*2); ctx.fill();
  }
}

// ── Panneau joueurs ───────────────────────────
function _drawPlayersPanel(ctx, game) {
  const py = BOARD_Y + BOARD_H + 20, ph = 220;
  rr(ctx, 40, py, CW-80, ph, 20, "#ffffff0a", "#ffffff28", 1.5);

  ctx.font=F.bold(20); ctx.fillStyle="#6ee7b7";
  ctx.fillText("JOUEURS", 65, py+28);

  const colW = (CW-100) / game.players.length;
  game.players.forEach((p, i) => {
    const cx  = 50 + i * colW;
    const cur = i === game.turnIndex && !game.winner;

    if (cur) {
      ctx.save(); ctx.shadowColor=p.color.hex; ctx.shadowBlur=20;
      rr(ctx, cx, py+40, colW-10, 155, 14, p.color.hex+"33", p.color.hex, 3);
      ctx.restore();
    } else {
      rr(ctx, cx, py+40, colW-10, 155, 14, "#ffffff0d", p.color.hex+"66", 1.5);
    }

    // Pastille couleur
    ctx.save(); ctx.shadowColor=p.color.hex; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(cx+18, py+62, 10, 0, Math.PI*2);
    ctx.fillStyle=p.color.hex; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();

    // Nom + label
    ctx.font=F.bold(19);
    ctx.fillStyle = cur ? p.color.text : "#e2e8f0";
    const nameStr = (p.bot ? "[BOT] " : "") + p.name.slice(0,13);
    ctx.fillText(nameStr, cx+34, py+66);

    // Position
    ctx.font=F.bold(28); ctx.fillStyle=p.color.hex;
    ctx.fillText(`${p.position}`, cx+18, py+102);
    ctx.font=F.regular(15); ctx.fillStyle="#94a3b8";
    ctx.fillText("/ 100", cx+18+ctx.measureText(`${p.position}`).width+4, py+100);

    // Barre de progression
    const barW=colW-28, barH=12, bx=cx+14, by2=py+110;
    rr(ctx, bx, by2, barW, barH, 6, "#ffffff15", null, 0);
    const filled2 = Math.max(0, (p.position/100)*barW);
    if (filled2 > 0) rr(ctx, bx, by2, filled2, barH, 6, p.color.hex, null, 0);

    // Stats (texte pur)
    ctx.font=F.regular(14); ctx.fillStyle="#64748b";
    ctx.fillText(`[D]${p.rollCount}  [S]${p.snakeHits}  [E]${p.ladderHits}`, cx+14, py+144);

    // De visuel du dernier lancer
    if (p.lastRoll) {
      _drawDice(ctx, cx+colW-60, py+56, 36, p.lastRoll);
    }

    // Badge VOTRE TOUR
    if (cur) {
      ctx.font=F.bold(14); ctx.fillStyle="#fde68a";
      ctx.fillText(">> VOTRE TOUR", cx+14, py+165);
    }
  });
}

// ── Log ───────────────────────────────────────
function _drawLogPanel(ctx, game) {
  const py = CH - 285, ph = 180;
  rr(ctx, 40, py, CW-80, ph, 18, "#0a1a0a99", "#10b98155", 1.5);

  ctx.font=F.bold(18); ctx.fillStyle="#34d399";
  ctx.fillText("JOURNAL", 65, py+26);

  ctx.font=F.regular(18);
  game.log.slice(0,6).forEach((line, i) => {
    ctx.fillStyle = i===0 ? "#34d399" : i===1 ? "#e2e8f0" : "#475569";
    const safe = line.replace(/[^\x20-\x7E]/g,"").trim();
    ctx.fillText("- " + safe.slice(0,90), 65, py+50+i*22);
  });
}

// ── Banniere ──────────────────────────────────
function _drawBanner(ctx, banner) {
  const by = CH - 90;
  rr(ctx, 40, by, CW-80, 58, 14, "#071a0f99", "#10b981", 2);
  ctx.save();
  ctx.font=F.bold(24); ctx.fillStyle="#34d399";
  ctx.shadowColor="#10b981"; ctx.shadowBlur=14;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  const safe = banner.replace(/[^\x20-\x7E]/g,"").trim().slice(0,85);
  ctx.fillText(safe, CW/2, by+29);
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();
}

// ─────────────────────────────────────────────
//  UTILITAIRES CANVAS
// ─────────────────────────────────────────────
function squareNumber(gridRow, gridCol) {
  const boardRow = ROWS - 1 - gridRow;
  const isEven   = boardRow % 2 === 0;
  const col      = isEven ? gridCol : (COLS - 1 - gridCol);
  return boardRow * COLS + col + 1;
}

function squareXY(sq) {
  const boardRow = Math.floor((sq-1)/COLS);
  const posInRow = (sq-1) % COLS;
  const col      = boardRow%2===0 ? posInRow : (COLS-1-posInRow);
  const gridRow  = ROWS - 1 - boardRow;
  return { x: BOARD_X + col*CELL, y: BOARD_Y + gridRow*CELL };
}

function squareCenter(sq) {
  const { x, y } = squareXY(sq);
  return { x: x+CELL/2, y: y+CELL/2 };
}

function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if (fill)       { ctx.fillStyle=fill; ctx.fill(); }
  if (stroke&&lw) { ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
}
