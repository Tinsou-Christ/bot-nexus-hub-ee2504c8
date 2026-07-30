const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),     { family: "TttF", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"),  { family: "TttF", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"), { family: "TttF", weight: "600" });
} catch(e) {}

const F = {
  bold:    s => `bold ${s}px TttF, Arial`,
  semi:    s => `600 ${s}px TttF, Arial`,
  regular: s => `${s}px TttF, Arial`,
};

// ─────────────────────────────────────────────
//  MARQUES & COULEURS (zero emoji)
// ─────────────────────────────────────────────
const MARK = {
  X: { label:"[X]", hex:"#ef4444", dark:"#7f1d1d", glow:"#ff2020", inner:"#ffcc88", text:"#fca5a5", letter:"X" },
  O: { label:"[O]", hex:"#3b82f6", dark:"#1e3a8a", glow:"#0055ff", inner:"#88eeff", text:"#93c5fd", letter:"O" },
};

const BOT_PROFILES = [
  { name:"Deep Mind",   diff:"hard"   },
  { name:"Grid Ghost",  diff:"medium" },
  { name:"Lucky Draw",  diff:"easy"   },
];

const WIN_LINES   = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const TARGET_WINS = 3;
const GAME_EXPIRE = 45 * 60 * 1000;
const BOT_DELAY   = 1200;
const activeGames = new Map();
const sleep       = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  CANVAS DIMENSIONS
// ─────────────────────────────────────────────
const CW   = 1200, CH = 1560;
const CELL = 220;
const GX   = (CW - CELL * 3) / 2;   // 270
const GY   = 305;

// ─────────────────────────────────────────────
//  MODULE GOATBOT
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name: "ttt",
    aliases: ["tictactoe","morpion","xo"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Tic Tac Toe Cyber — serie en 3 victoires, bot IA minimax, multijoueur, paris." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("TIC TAC TOE CYBER")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `  ${fonts.monospace("ttt bot")}              : 1v1 vs bot (moyen)\n` +
        `  ${fonts.monospace("ttt bot easy")}         : vs bot facile\n` +
        `  ${fonts.monospace("ttt bot hard")}         : vs bot IA minimax\n` +
        `  ${fonts.monospace("ttt 1v1 @joueur")}      : duel humain\n` +
        `  ${fonts.monospace("ttt 1v1 @joueur 500")}  : duel avec mise\n\n` +
        `${fonts.bold("En jeu :")}\n` +
        `  Tapez un numero de 1 a 9 pour jouer :\n` +
        `  [1][2][3]\n` +
        `  [4][5][6]\n` +
        `  [7][8][9]\n\n` +
        `${fonts.bold("Gestion :")}\n` +
        `  ${fonts.monospace("ttt stop")}   : terminer la serie\n` +
        `  ${fonts.monospace("ttt status")} : revoir le plateau\n\n` +
        `[X] joue en premier. Premier a ${TARGET_WINS} victoires gagne la serie.\n` +
        `[=] Egalite : la manche est rejouee sans point.`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpired();
    const mode = (args[0] || "").toLowerCase();
    if (!mode || mode === "help") return message.reply(this.config.guide.fr);

    if (mode === "stop" || mode === "end") {
      const n = endGamesForThread(event.threadID, event.senderID, usersData);
      if (!n) return message.reply(fonts.bold("Aucune partie en cours pour vous ici."));
      return message.reply(fonts.bold(`${n} partie(s) terminee(s). Mises remboursees.`));
    }
    if (mode === "status") {
      for (const g of activeGames.values()) {
        if (g.threadID === event.threadID && g.players.some(p => p.id === event.senderID)) {
          await publishState(message, g, "Etat de la serie.");
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

    const current = getCurrentPlayer(game);
    if (!current || current.bot) return;
    if (event.senderID !== current.id) {
      return message.reply({
        body: fonts.bold(`Ce n'est pas votre tour ! C'est a ${current.name} ${current.mark.label}.`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }

    const input = (event.body || "").trim().toLowerCase();
    if (input === "stop" || input === "end") {
      await refundBets(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("Serie terminee. Mises remboursees."));
    }

    const cell = parseInt(input, 10) - 1;
    if (isNaN(cell) || cell < 0 || cell > 8) {
      await publishState(message, game, `Entrez un numero de 1 a 9 pour jouer !`);
      return;
    }
    if (game.board[cell] !== null) {
      await publishState(message, game, `Case ${cell + 1} deja occupee ! Choisissez une case libre.`);
      return;
    }

    await doMove(message, game, cell, api, usersData);
  }
};

// ─────────────────────────────────────────────
//  DEMARRAGE
// ─────────────────────────────────────────────
async function handleStart({ message, event, args, api, usersData, commandName }) {
  const { threadID, senderID } = event;
  const mode      = (args[0] || "").toLowerCase();
  const humanName = await getName(api, usersData, senderID);

  let isBotGame = false, diff = "medium";
  if (mode === "bot" || mode === "bots") {
    isBotGame = true;
    const d = (args[1] || "").toLowerCase();
    if (["easy","medium","hard"].includes(d)) diff = d;
  } else if (mode !== "1v1") {
    return message.reply(module.exports.config.guide.fr);
  }

  const mentionIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const xPlayer    = { id: senderID, name: humanName, bot: false, mark: MARK.X };
  let   oPlayer;

  if (isBotGame) {
    const profile = BOT_PROFILES.find(b => b.diff === diff) || BOT_PROFILES[1];
    oPlayer = { id: `bot_0_${Date.now()}`, name: profile.name, bot: true, diff, mark: MARK.O };
  } else {
    if (!mentionIDs.length)
      return message.reply(fonts.bold("Mentionnez un adversaire ! Ex: ttt 1v1 @joueur"));
    const oName = await getName(api, usersData, mentionIDs[0]);
    oPlayer = { id: mentionIDs[0], name: oName, bot: false, mark: MARK.O };
  }

  let bet = 0;
  if (!isBotGame) {
    const betArg = args.find(a => /^\d+$/.test(a) && +a > 0);
    if (betArg) bet = parseInt(betArg, 10);
  }
  if (bet > 0) {
    for (const p of [xPlayer, oPlayer].filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      if ((ud?.money || 0) < bet)
        return message.reply(fonts.bold(`${p.name} n'a pas assez ! Besoin: ${bet.toLocaleString()} | Solde: ${(ud?.money||0).toLocaleString()}`));
    }
    for (const p of [xPlayer, oPlayer].filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money||0) - bet });
    }
  }

  const game = createGame(threadID, [xPlayer, oPlayer], commandName, isBotGame, bet, diff);
  activeGames.set(game.key, game);

  const diffStr = isBotGame ? ` | Bot: ${diff.toUpperCase()}` : "";
  const potStr  = bet > 0 ? ` | Cagnotte: ${game.pot.toLocaleString()}` : "";
  await publishState(message, game,
    `TIC TAC TOE CYBER demarre ! Serie en ${TARGET_WINS} victoires${diffStr}${potStr}.\n` +
    `[X] ${xPlayer.name} commence ! Tapez 1-9 pour jouer.`
  );
  await runBot(message, game, api, usersData);
}

// ─────────────────────────────────────────────
//  CREATION DE PARTIE
// ─────────────────────────────────────────────
function createGame(threadID, players, commandName, botGame, bet, diff) {
  const key = botGame ? `${threadID}:${players[0].id}` : threadID;
  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, commandName, botGame, diff,
    players,
    board:        Array(9).fill(null),
    currentIdx:   0,
    round:        1,
    wins:         [0, 0],
    draws:        0,
    winLine:      null,
    roundWinner:  null,
    seriesWinner: null,
    moveCount:    0,
    log:          ["Serie commencee - [X] joue en premier !"],
    replyMessageID: null,
    updatedAt:    Date.now(),
    startedAt:    Date.now(),
    bet, pot: bet * players.filter(p => !p.bot).length,
  };
}

// ─────────────────────────────────────────────
//  LOGIQUE DU JEU
// ─────────────────────────────────────────────
function getCurrentPlayer(game) { return game.players[game.currentIdx]; }

async function doMove(message, game, cell, api, usersData) {
  const player    = getCurrentPlayer(game);
  const markChar  = player.mark.letter;
  game.board[cell] = markChar;
  game.moveCount++;
  game.updatedAt = Date.now();

  const winLine = _checkWinner(game.board);
  if (winLine) {
    game.winLine     = winLine;
    game.roundWinner = player;
    game.wins[game.currentIdx]++;
    game.log.unshift(`[VICTOIRE] ${player.mark.label} ${player.name} remporte la manche ${game.round} !`);

    if (game.wins[game.currentIdx] >= TARGET_WINS) {
      game.seriesWinner = player;
      await payWinner(game, player, usersData);
      const msg = _buildSeriesEndMsg(game, player);
      const saved = _cloneGame(game);
      endGame(game);
      await publishState(message, saved, msg);
      return;
    }

    const banner = `[VICTOIRE] ${player.mark.label} ${player.name} gagne la manche ${game.round} ! Score: ${game.wins[0]}-${game.wins[1]}`;
    await publishState(message, game, banner);
    await sleep(2000);
    _resetBoard(game);
    await publishState(message, game, `Manche ${game.round} ! [X] ${game.players[0].name} commence.`);
    await runBot(message, game, api, usersData);
    return;
  }

  if (_checkDraw(game.board)) {
    game.draws++;
    game.log.unshift(`[EGALITE] Manche ${game.round} nulle ! Rejouee.`);
    await publishState(message, game, `[EGALITE] Manche ${game.round} nulle ! Score: ${game.wins[0]}-${game.wins[1]} | Rejouee.`);
    await sleep(1800);
    _resetBoard(game);
    await publishState(message, game, `Manche ${game.round} ! [X] ${game.players[0].name} commence.`);
    await runBot(message, game, api, usersData);
    return;
  }

  game.log.unshift(`${player.mark.label} ${player.name} joue case ${cell + 1}.`);
  game.currentIdx = 1 - game.currentIdx;
  const next = getCurrentPlayer(game);
  const banner = `${player.mark.label} ${player.name} -> case ${cell + 1}. A ${next.mark.label} ${next.name} !`;
  await publishState(message, game, banner);
  await runBot(message, game, api, usersData);
}

function _resetBoard(game) {
  game.board      = Array(9).fill(null);
  game.currentIdx = 0;
  game.winLine    = null;
  game.roundWinner= null;
  game.round++;
  game.moveCount  = 0;
}

function _checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return [a,b,c];
  }
  return null;
}

function _checkDraw(board) { return board.every(c => c !== null); }

function _buildSeriesEndMsg(game, winner) {
  let msg = `[SERIE TERMINEE] ${winner.mark.label} ${winner.name} remporte la serie ${TARGET_WINS} victoires !`;
  if (game.bet > 0 && !winner.bot) msg += `\nGain: ${game.pot.toLocaleString()} !`;
  msg += `\n\nScore final: [X] ${game.players[0].name} ${game.wins[0]} - ${game.wins[1]} ${game.players[1].name} [O]`;
  msg += `\nEgalites: ${game.draws} | Manches jouees: ${game.round}`;
  return msg;
}

function _cloneGame(game) {
  return { ...game, players: game.players.map(p=>({...p})), board: [...game.board], wins:[...game.wins] };
}

// ─────────────────────────────────────────────
//  BOT IA (easy / medium / hard-minimax)
// ─────────────────────────────────────────────
async function runBot(message, game, api, usersData) {
  if (!activeGames.has(game.key)) return;
  const current = getCurrentPlayer(game);
  if (!current?.bot) return;

  await sleep(BOT_DELAY);
  if (!activeGames.has(game.key)) return;

  const cell = _botMove(game.board, current.diff || "medium");
  if (cell === -1) return;

  game.log.unshift(`[BOT] ${current.name} reflechit...`);
  await doMove(message, game, cell, api, usersData);
}

function _botMove(board, diff) {
  const empty = board.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  if (!empty.length) return -1;

  // Tenter de gagner
  for (const i of empty) {
    const t=[...board]; t[i]='O';
    if (_checkWinner(t)) return i;
  }
  // Bloquer adversaire
  for (const i of empty) {
    const t=[...board]; t[i]='X';
    if (_checkWinner(t)) return i;
  }

  if (diff === "easy")   return empty[Math.floor(Math.random()*empty.length)];
  if (diff === "hard")   return _minimaxMove(board);

  // Medium: centre > coins > bords
  if (board[4]===null) return 4;
  const corners = [0,2,6,8].filter(i=>board[i]===null);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  return empty[Math.floor(Math.random()*empty.length)];
}

function _minimaxMove(board) {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = 'O';
    const score = _minimax(board, 0, false, -Infinity, Infinity);
    board[i] = null;
    if (score > best) { best = score; move = i; }
  }
  return move;
}

function _minimax(board, depth, isMax, alpha, beta) {
  const w = _checkWinner(board);
  if (w) return isMax ? -(10-depth) : (10-depth);
  if (board.every(c=>c!==null)) return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i=0;i<9;i++) {
      if (board[i]) continue;
      board[i]='O'; best=Math.max(best,_minimax(board,depth+1,false,alpha,beta));
      board[i]=null; alpha=Math.max(alpha,best); if(beta<=alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i=0;i<9;i++) {
      if (board[i]) continue;
      board[i]='X'; best=Math.min(best,_minimax(board,depth+1,true,alpha,beta));
      board[i]=null; beta=Math.min(beta,best); if(beta<=alpha) break;
    }
    return best;
  }
}

// ─────────────────────────────────────────────
//  PARIS & UTILITAIRES
// ─────────────────────────────────────────────
async function payWinner(game, winner, usersData) {
  if (!game.bet||!game.pot||!usersData||winner.bot) return;
  try { const ud=await usersData.get(winner.id); await usersData.set(winner.id,{money:(ud.money||0)+game.pot}); }
  catch(e) { console.error("[TTT] Paiement:",e); }
}

async function refundBets(game, usersData) {
  if (!game.bet||!usersData) return;
  for (const p of game.players.filter(p=>!p.bot)) {
    try { const ud=await usersData.get(p.id); await usersData.set(p.id,{money:(ud.money||0)+game.bet}); }
    catch(e) { console.error("[TTT] Remboursement:",e); }
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);
}

function endGamesForThread(threadID, senderID, usersData) {
  let n=0;
  for (const g of [...activeGames.values()])
    if (g.threadID===threadID && g.players.some(p=>p.id===senderID))
      { refundBets(g,usersData); endGame(g); n++; }
  return n;
}

function cleanupExpired() {
  const now=Date.now();
  for (const g of activeGames.values()) if (now-g.updatedAt>GAME_EXPIRE) endGame(g);
}

async function getName(api, usersData, id) {
  if (id.startsWith("bot_")) return id;
  try {
    if (usersData?.getName) return await usersData.getName(id);
    const info=await api.getUserInfo(id); return info[id]?.name||"Joueur";
  } catch { return "Joueur"; }
}

// ─────────────────────────────────────────────
//  PUBLISH STATE
// ─────────────────────────────────────────────
async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const text = formatDetails(game, body);
  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);

  const tmpPath = path.join(os.tmpdir(), `ttt_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderTTT(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch(err) {
    console.error("[TTT] Canvas:",err);
    return message.reply(fonts.bold(`TTT: ${body}`));
  }

  const nextHuman = !game.seriesWinner && !getCurrentPlayer(game)?.bot
    ? getCurrentPlayer(game) : null;
  const mentions  = nextHuman ? [{ id:nextHuman.id, tag:nextHuman.name }] : [];

  return new Promise(resolve => {
    message.reply({ body:text, attachment:fs.createReadStream(tmpPath), mentions }, (err,info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { console.error("[TTT] Envoi:",err); resolve(); return; }
      game.replyMessageID = info.messageID;
      if (activeGames.get(game.key)===game && nextHuman && global.GoatBot?.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName, messageID: info.messageID,
          author: nextHuman.id, threadID: game.threadID,
          gameKey: game.key, gameID: game.id,
        });
      }
      resolve();
    });
  });
}

function formatDetails(game, body) {
  const elapsed = Math.floor((Date.now()-game.startedAt)/60000);
  const cur     = getCurrentPlayer(game);
  const lines   = [];
  lines.push(`TIC TAC TOE CYBER`);
  lines.push(`Manche ${game.round} | ${elapsed}m | ${TARGET_WINS} victoires pour gagner`);
  if (game.bet>0) lines.push(`Mise: ${game.bet.toLocaleString()} | Cagnotte: ${game.pot.toLocaleString()}`);
  lines.push("--------------------");
  lines.push(`[X] ${game.players[0].name}${game.players[0].bot?" [BOT]":""} : ${game.wins[0]} victoire(s)`);
  lines.push(`[O] ${game.players[1].name}${game.players[1].bot?" [BOT]":""} : ${game.wins[1]} victoire(s)`);
  lines.push(`Egalites: ${game.draws}`);
  lines.push("--------------------");
  lines.push(_boardToText(game.board));
  lines.push("--------------------");
  if (!game.seriesWinner && cur) {
    if (cur.bot) lines.push(`[BOT] ${cur.name} reflechit...`);
    else lines.push(`>> ${cur.mark.label} ${cur.name} : tapez 1-9 pour jouer.`);
  }
  game.log.slice(0,3).forEach(l => lines.push(`- ${l}`));
  lines.push("--------------------");
  lines.push(body.replace(/[^\x20-\x7E]/g,"").trim());
  return lines.join("\n");
}

function _boardToText(board) {
  const sym = (v,i) => v ? `[${v}]` : `[${i+1}]`;
  return [
    `${sym(board[0],0)} ${sym(board[1],1)} ${sym(board[2],2)}`,
    `${sym(board[3],3)} ${sym(board[4],4)} ${sym(board[5],5)}`,
    `${sym(board[6],6)} ${sym(board[7],7)} ${sym(board[8],8)}`,
  ].join("\n");
}

// ─────────────────────────────────────────────
//  RENDU CANVAS 1200 x 1560
// ─────────────────────────────────────────────
function renderTTT(game, banner) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");

  _drawBg(ctx);
  _drawCanvasBorder(ctx);
  _drawHeader(ctx, game);
  _drawScoreBadges(ctx, game);
  _drawGrid(ctx);
  _drawCells(ctx, game);
  _drawWinLine(ctx, game);
  _drawPlayerPanels(ctx, game);
  _drawLogPanel(ctx, game);
  _drawBanner(ctx, banner);

  return canvas;
}

// ── Fond cyberpunk ────────────────────────────
function _drawBg(ctx) {
  // Gradient de base
  const g = ctx.createLinearGradient(0,0,CW,CH);
  g.addColorStop(0,   "#040810");
  g.addColorStop(0.25,"#060c18");
  g.addColorStop(0.6, "#040c12");
  g.addColorStop(1,   "#020608");
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);

  // Grille de points (circuit nodes)
  ctx.save(); ctx.globalAlpha=0.06;
  for (let x=0;x<CW;x+=42) for (let y=0;y<CH;y+=42) {
    ctx.beginPath(); ctx.arc(x,y,1.4,0,Math.PI*2);
    ctx.fillStyle="#00ffff"; ctx.fill();
  }
  ctx.restore();

  // Traces de circuit horizontales
  ctx.save(); ctx.globalAlpha=0.07; ctx.lineWidth=1;
  const tracesCyan  = [110,280,540,720,960,1180,1380,1510];
  const tracesMag   = [160,340,620,820,1060,1260,1440];
  for (const y of tracesCyan) {
    ctx.strokeStyle="#00f5ff";
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke();
  }
  for (const y of tracesMag) {
    ctx.strokeStyle="#c026d3";
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke();
  }
  // Traces verticales
  for (const x of [80,200,400,640,900,1100]) {
    ctx.strokeStyle="#00f5ff";
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CH); ctx.stroke();
  }
  ctx.restore();

  // Halos couleur dans les coins
  ctx.save(); ctx.globalAlpha=0.09;
  for (const [cx,cy,col] of [[0,0,"#7c3aed"],[CW,0,"#0ea5e9"],[0,CH,"#0ea5e9"],[CW,CH,"#7c3aed"]]) {
    const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,500);
    rg.addColorStop(0,col); rg.addColorStop(1,"transparent");
    ctx.fillStyle=rg; ctx.fillRect(0,0,CW,CH);
  }
  ctx.restore();

  // Scanlines (lignes fines horizontales)
  ctx.save(); ctx.globalAlpha=0.025;
  for (let y=0;y<CH;y+=4) {
    ctx.fillStyle="#000"; ctx.fillRect(0,y,CW,2);
  }
  ctx.restore();
}

// ── Bordure neon du canvas ────────────────────
function _drawCanvasBorder(ctx) {
  // Bordure externe cyan
  ctx.save();
  ctx.shadowColor="#00f5ff"; ctx.shadowBlur=24;
  ctx.strokeStyle="#00f5ff"; ctx.lineWidth=4;
  ctx.strokeRect(8,8,CW-16,CH-16);
  // Bordure interne violette
  ctx.shadowColor="#7c3aed"; ctx.shadowBlur=14;
  ctx.strokeStyle="#7c3aed44"; ctx.lineWidth=2;
  ctx.strokeRect(16,16,CW-32,CH-32);
  // Coins L-brackets decoratifs
  const S=38, W=3, cols=["#00f5ff","#c026d3"];
  for (const [ox,oy,col] of [[10,10,cols[0]],[CW-10,10,cols[1]],[10,CH-10,cols[1]],[CW-10,CH-10,cols[0]]]) {
    const sx=ox<CW/2?1:-1, sy=oy<CH/2?1:-1;
    ctx.shadowColor=col; ctx.shadowBlur=14;
    ctx.strokeStyle=col; ctx.lineWidth=W;
    ctx.beginPath();
    ctx.moveTo(ox+sx*S,oy); ctx.lineTo(ox,oy); ctx.lineTo(ox,oy+sy*S);
    ctx.stroke();
    // Coin interieur
    ctx.shadowBlur=6; ctx.lineWidth=1; ctx.strokeStyle=col+"88";
    ctx.beginPath();
    ctx.moveTo(ox+sx*(S-8),oy+sy*6); ctx.lineTo(ox+sx*6,oy+sy*6); ctx.lineTo(ox+sx*6,oy+sy*(S-8));
    ctx.stroke();
  }
  ctx.restore();
}

// ── Header ────────────────────────────────────
function _drawHeader(ctx, game) {
  rr(ctx,32,28,CW-64,148,22,"#ffffff07","#00f5ff22",1.5);

  // Trait neon haut du header
  ctx.save(); ctx.shadowColor="#00f5ff"; ctx.shadowBlur=18;
  ctx.strokeStyle="#00f5ff"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(48,28); ctx.lineTo(CW-48,28); ctx.stroke();
  ctx.restore();

  // Titre principal
  ctx.save();
  ctx.shadowColor="#00f5ff"; ctx.shadowBlur=32;
  const tg = ctx.createLinearGradient(50,40,CW-50,130);
  tg.addColorStop(0,"#00f5ff"); tg.addColorStop(0.35,"#ffffff");
  tg.addColorStop(0.65,"#ffffff"); tg.addColorStop(1,"#c026d3");
  ctx.font=F.bold(66); ctx.fillStyle=tg;
  ctx.fillText("TIC TAC TOE  CYBER", 52, 108);
  ctx.restore();

  // Sous-titre
  const elapsed = Math.floor((Date.now()-game.startedAt)/60000);
  const diffLbl = game.botGame ? ` | BOT: ${(game.diff||"medium").toUpperCase()}` : "";
  ctx.font=F.semi(20); ctx.fillStyle="#00f5ff88";
  ctx.fillText(`Manche ${game.round}  |  ${elapsed}m  |  Serie en ${TARGET_WINS}${diffLbl}`, 52, 148);

  // Badge manche (coin droit)
  const badge = `M.${game.round}`;
  ctx.font=F.bold(22);
  const bw = ctx.measureText(badge).width+28;
  rr(ctx,CW-52-bw,42,bw,46,10,"#00f5ff18","#00f5ff",2);
  ctx.save(); ctx.shadowColor="#00f5ff"; ctx.shadowBlur=14;
  ctx.fillStyle="#00f5ff"; ctx.fillText(badge,CW-52-bw+14,72); ctx.restore();
}

// ── Score badges ──────────────────────────────
function _drawScoreBadges(ctx, game) {
  const by=188, bh=100;

  // Fond de la bande score
  rr(ctx,32,by,CW-64,bh,18,"#ffffff05","#ffffff12",1);

  // Joueur X (gauche)
  _drawPlayerScoreBadge(ctx, 48, by+10, 420, 80, game.players[0], game.wins[0], game.currentIdx===0 && !game.seriesWinner);

  // Separateur VS
  ctx.save();
  ctx.shadowColor="#ffffff"; ctx.shadowBlur=10;
  ctx.font=F.bold(28); ctx.fillStyle="#ffffff44"; ctx.textAlign="center";
  ctx.fillText("VS", CW/2, by+60); ctx.textAlign="left";
  ctx.restore();

  // Indicateur de progression serie (barres)
  const barCX=CW/2, barY=by+68, barW=120, barH=8;
  // barres [X]
  for (let i=0;i<TARGET_WINS;i++) {
    const bx=barCX-barW-12-(TARGET_WINS-1-i)*22;
    rr(ctx,bx,barY,18,barH,4,i<game.wins[0]?MARK.X.hex:"#ffffff15",null,0);
  }
  // barres [O]
  for (let i=0;i<TARGET_WINS;i++) {
    const bx=barCX+16+i*22;
    rr(ctx,bx,barY,18,barH,4,i<game.wins[1]?MARK.O.hex:"#ffffff15",null,0);
  }

  // Joueur O (droite)
  _drawPlayerScoreBadge(ctx, CW-48-420, by+10, 420, 80, game.players[1], game.wins[1], game.currentIdx===1 && !game.seriesWinner);
}

function _drawPlayerScoreBadge(ctx, x, y, w, h, player, wins, isActive) {
  const m = player.mark;
  if (isActive) {
    ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=28;
    rr(ctx,x,y,w,h,14,m.hex+"28",m.hex,3);
    ctx.restore();
  } else {
    rr(ctx,x,y,w,h,14,"#ffffff08",m.hex+"44",1.5);
  }

  // Pastille lettre
  ctx.save();
  ctx.shadowColor=m.glow; ctx.shadowBlur=14;
  ctx.beginPath(); ctx.arc(x+32,y+h/2,22,0,Math.PI*2);
  ctx.fillStyle=m.hex; ctx.fill();
  ctx.strokeStyle=isActive?"#fff":m.hex+"88"; ctx.lineWidth=2; ctx.stroke();
  ctx.font=F.bold(22); ctx.fillStyle="#fff";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(m.letter, x+32, y+h/2); ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();

  // Nom
  ctx.font=F.bold(21); ctx.fillStyle=isActive?m.text:"#94a3b8";
  ctx.fillText((player.bot?"[BOT] ":"")+player.name.slice(0,12), x+62, y+30);

  // Score
  ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=10;
  ctx.font=F.bold(34); ctx.fillStyle=m.hex;
  ctx.fillText(String(wins), x+62, y+70);
  ctx.restore();
  ctx.font=F.regular(16); ctx.fillStyle="#475569";
  const wlabel=`victoire${wins>1?"s":""}`;
  ctx.fillText(wlabel, x+62+ctx.measureText(String(wins)).width+8, y+70);

  if (isActive) {
    ctx.font=F.bold(13); ctx.fillStyle="#fde68a";
    ctx.fillText(">> VOTRE TOUR", x+w-130, y+72);
  }
}

// ── Grille TTT neon ───────────────────────────
function _drawGrid(ctx) {
  // Zone de fond de grille
  ctx.save();
  ctx.shadowColor="#000"; ctx.shadowBlur=40; ctx.shadowOffsetY=12;
  rr(ctx,GX-12,GY-12,CELL*3+24,CELL*3+24,20,"#060c1e","#00f5ff18",2);
  ctx.restore();

  // 2 lignes verticales + 2 lignes horizontales
  const lineColor="#00f5ff";
  ctx.save();
  ctx.lineCap="round";

  for (const pass of [
    { lw:18, alpha:0.10, blur:0,  col:lineColor },
    { lw:10, alpha:0.22, blur:20, col:lineColor },
    { lw:5,  alpha:0.80, blur:28, col:"#ffffff" },
    { lw:2,  alpha:1.0,  blur:8,  col:lineColor },
  ]) {
    ctx.globalAlpha  = pass.alpha;
    ctx.shadowColor  = lineColor;
    ctx.shadowBlur   = pass.blur;
    ctx.strokeStyle  = pass.col;
    ctx.lineWidth    = pass.lw;

    // Verticale 1 (entre col 0 et 1)
    ctx.beginPath(); ctx.moveTo(GX+CELL, GY+18); ctx.lineTo(GX+CELL, GY+CELL*3-18); ctx.stroke();
    // Verticale 2 (entre col 1 et 2)
    ctx.beginPath(); ctx.moveTo(GX+CELL*2, GY+18); ctx.lineTo(GX+CELL*2, GY+CELL*3-18); ctx.stroke();
    // Horizontale 1
    ctx.beginPath(); ctx.moveTo(GX+18, GY+CELL); ctx.lineTo(GX+CELL*3-18, GY+CELL); ctx.stroke();
    // Horizontale 2
    ctx.beginPath(); ctx.moveTo(GX+18, GY+CELL*2); ctx.lineTo(GX+CELL*3-18, GY+CELL*2); ctx.stroke();
  }
  ctx.restore();

  // Petits cercles aux intersections
  ctx.save();
  ctx.shadowColor="#00f5ff"; ctx.shadowBlur=16;
  ctx.fillStyle="#00f5ff";
  for (const [ix,iy] of [[GX+CELL,GY+CELL],[GX+CELL*2,GY+CELL],[GX+CELL,GY+CELL*2],[GX+CELL*2,GY+CELL*2]]) {
    ctx.beginPath(); ctx.arc(ix,iy,7,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Numeros de cases (fantomes dans les coins)
  ctx.save(); ctx.globalAlpha=0.18;
  ctx.font=F.bold(24); ctx.fillStyle="#00f5ff";
  for (let i=0;i<9;i++) {
    const {cx,cy}=_cellCenter(i);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(String(i+1), cx-CELL/2+22, cy-CELL/2+24);
  }
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();
}

function _cellCenter(idx) {
  const col=idx%3, row=Math.floor(idx/3);
  return { cx: GX+col*CELL+CELL/2, cy: GY+row*CELL+CELL/2 };
}

// ── Contenu des cases ─────────────────────────
function _drawCells(ctx, game) {
  for (let i=0;i<9;i++) {
    const v = game.board[i];
    const {cx,cy} = _cellCenter(i);
    const isWin = game.winLine && game.winLine.includes(i);

    if (!v) {
      // Case vide: subtil fond hover
      if (!game.seriesWinner && !game.roundWinner) {
        ctx.save(); ctx.globalAlpha=0.04;
        rr(ctx,GX+(i%3)*CELL+6,GY+Math.floor(i/3)*CELL+6,CELL-12,CELL-12,12,"#00f5ff",null,0);
        ctx.restore();
      }
    } else if (v==="X") {
      _drawX(ctx, cx, cy, CELL, isWin);
    } else {
      _drawO(ctx, cx, cy, CELL, isWin);
    }
  }
}

// Croix [X] neon rouge-orange
function _drawX(ctx, cx, cy, size, isWin) {
  const hs = size * 0.34;
  const glow = isWin ? "#ffff00" : MARK.X.glow;

  for (const pass of [
    { lw:40, alpha:0.08, blur:0,  col:MARK.X.hex },
    { lw:24, alpha:0.18, blur:40, col:glow        },
    { lw:14, alpha:0.90, blur:30, col:MARK.X.hex  },
    { lw:5,  alpha:1.0,  blur:12, col:MARK.X.inner},
  ]) {
    ctx.save();
    ctx.globalAlpha = pass.alpha;
    ctx.shadowColor = glow; ctx.shadowBlur = pass.blur;
    ctx.lineWidth   = pass.lw; ctx.lineCap="round";
    const gr = ctx.createLinearGradient(cx-hs,cy-hs,cx+hs,cy+hs);
    gr.addColorStop(0,"#ff8800"); gr.addColorStop(1,"#ff0022");
    ctx.strokeStyle = pass.lw <= 5 ? pass.col : gr;
    ctx.beginPath(); ctx.moveTo(cx-hs,cy-hs); ctx.lineTo(cx+hs,cy+hs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+hs,cy-hs); ctx.lineTo(cx-hs,cy+hs); ctx.stroke();
    ctx.restore();
  }
}

// Cercle [O] neon bleu-cyan
function _drawO(ctx, cx, cy, size, isWin) {
  const r    = size * 0.32;
  const glow = isWin ? "#ffff00" : MARK.O.glow;

  for (const pass of [
    { lw:38, alpha:0.08, blur:0,  col:MARK.O.hex  },
    { lw:22, alpha:0.20, blur:40, col:glow         },
    { lw:13, alpha:0.90, blur:30, col:MARK.O.hex   },
    { lw:4,  alpha:1.0,  blur:12, col:MARK.O.inner },
  ]) {
    ctx.save();
    ctx.globalAlpha = pass.alpha;
    ctx.shadowColor = glow; ctx.shadowBlur = pass.blur;
    ctx.lineWidth   = pass.lw;
    const gr = ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
    gr.addColorStop(0,"#00ffff"); gr.addColorStop(1,"#0033ff");
    ctx.strokeStyle = pass.lw <= 4 ? pass.col : gr;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }
}

// ── Ligne gagnante ────────────────────────────
function _drawWinLine(ctx, game) {
  if (!game.winLine) return;
  const [a,,c] = game.winLine;
  const p1=_cellCenter(a), p2=_cellCenter(c);

  for (const pass of [
    { lw:40, alpha:0.10, blur:0  },
    { lw:20, alpha:0.30, blur:30 },
    { lw:8,  alpha:0.95, blur:20 },
    { lw:3,  alpha:1.0,  blur:8  },
  ]) {
    ctx.save();
    ctx.globalAlpha = pass.alpha;
    ctx.shadowColor = "#ffff00"; ctx.shadowBlur = pass.blur;
    ctx.strokeStyle = "#ffff00"; ctx.lineWidth  = pass.lw; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(p1.cx,p1.cy); ctx.lineTo(p2.cx,p2.cy); ctx.stroke();
    ctx.restore();
  }

  // Fond jaune sur cases gagnantes
  ctx.save(); ctx.globalAlpha=0.10;
  for (const i of game.winLine) {
    const cx=GX+(i%3)*CELL, cy=GY+Math.floor(i/3)*CELL;
    rr(ctx,cx+4,cy+4,CELL-8,CELL-8,14,"#ffff00",null,0);
  }
  ctx.restore();
}

// ── Panneaux joueurs ──────────────────────────
function _drawPlayerPanels(ctx, game) {
  const py = GY + CELL*3 + 24;
  const pw = (CW-76)/2, ph = 200;

  // Panneau [X]
  _drawOnePanel(ctx, 32, py, pw, ph, game.players[0], game.wins[0], game.currentIdx===0 && !game.seriesWinner, game);
  // Panneau [O]
  _drawOnePanel(ctx, CW-32-pw, py, pw, ph, game.players[1], game.wins[1], game.currentIdx===1 && !game.seriesWinner, game);
}

function _drawOnePanel(ctx, x, y, w, h, player, wins, isActive, game) {
  const m = player.mark;
  if (isActive) {
    ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=30;
    rr(ctx,x,y,w,h,18,m.hex+"22",m.hex,3);
    ctx.restore();
  } else {
    rr(ctx,x,y,w,h,18,"#ffffff08",m.hex+"44",1.5);
  }

  // Pastille lettre
  ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=18;
  ctx.beginPath(); ctx.arc(x+36,y+46,26,0,Math.PI*2);
  ctx.fillStyle=isActive?m.hex:m.dark; ctx.fill();
  ctx.strokeStyle=isActive?"#fff":m.hex+"88"; ctx.lineWidth=3; ctx.stroke();
  ctx.font=F.bold(26); ctx.fillStyle="#fff";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(m.letter,x+36,y+46); ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();

  // Nom
  ctx.font=F.bold(22); ctx.fillStyle=isActive?m.text:"#94a3b8";
  ctx.fillText((player.bot?"[BOT] ":"")+player.name.slice(0,14), x+72, y+38);
  ctx.font=F.regular(16); ctx.fillStyle="#475569";
  ctx.fillText(player.mark.label, x+72, y+60);

  // Score
  ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=16;
  ctx.font=F.bold(56); ctx.fillStyle=m.hex;
  ctx.textAlign="center"; ctx.fillText(String(wins), x+w/2, y+136);
  ctx.textAlign="left"; ctx.restore();
  ctx.font=F.regular(17); ctx.fillStyle="#475569";
  ctx.textAlign="center"; ctx.fillText(`victoire${wins>1?"s":""}`, x+w/2, y+162); ctx.textAlign="left";

  // Barre de progression serie
  const barW=w-32, barH=10;
  rr(ctx,x+16,y+176,barW,barH,5,"#ffffff10",null,0);
  const fill=Math.min(barW,(wins/TARGET_WINS)*barW);
  if (fill>0) {
    ctx.save(); ctx.shadowColor=m.glow; ctx.shadowBlur=8;
    rr(ctx,x+16,y+176,fill,barH,5,m.hex,null,0); ctx.restore();
  }

  // Badge tour
  if (isActive) {
    ctx.save(); ctx.shadowColor="#fde68a"; ctx.shadowBlur=10;
    ctx.font=F.bold(16); ctx.fillStyle="#fde68a";
    ctx.textAlign="center"; ctx.fillText(">> VOTRE TOUR <<", x+w/2, y+h-12);
    ctx.textAlign="left"; ctx.restore();
  }

  // Mini grille dans le panneau (mini-board)
  _drawMiniBoard(ctx, game, player.mark.letter, x+w-96, y+14);
}

// Mini plateau 3x3 decoratif dans le panneau joueur
function _drawMiniBoard(ctx, game, playerMark, ox, oy) {
  const mc=22, mg=3;
  ctx.save(); ctx.globalAlpha=0.7;
  for (let i=0;i<9;i++) {
    const col=i%3, row=Math.floor(i/3);
    const x=ox+col*(mc+mg), y=oy+row*(mc+mg);
    const v=game.board[i];
    rr(ctx,x,y,mc,mc,4,"#ffffff08",v?(v==="X"?MARK.X.hex:MARK.O.hex):"#ffffff14",1);
    if (v) {
      ctx.font=F.bold(12); ctx.fillStyle=v==="X"?MARK.X.text:MARK.O.text;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(v,x+mc/2,y+mc/2);
      ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    }
  }
  ctx.restore();
}

// ── Log ───────────────────────────────────────
function _drawLogPanel(ctx, game) {
  const py = GY+CELL*3+24+210, ph=190;
  rr(ctx,32,py,CW-64,ph,18,"#040c18aa","#00f5ff33",1.5);

  // Ligne neon top
  ctx.save(); ctx.shadowColor="#00f5ff"; ctx.shadowBlur=10;
  ctx.strokeStyle="#00f5ff"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(48,py); ctx.lineTo(CW-48,py); ctx.stroke();
  ctx.restore();

  ctx.font=F.bold(19); ctx.fillStyle="#00f5ff";
  ctx.fillText("JOURNAL", 60, py+28);

  ctx.font=F.regular(18);
  game.log.slice(0,6).forEach((line,i) => {
    ctx.fillStyle = i===0?"#00f5ff":i===1?"#e2e8f0":"#334155";
    const safe=line.replace(/[^\x20-\x7E]/g,"").trim();
    ctx.fillText("- "+safe.slice(0,92), 60, py+54+i*23);
  });
}

// ── Banniere ──────────────────────────────────
function _drawBanner(ctx, banner) {
  const by = CH - 96;
  ctx.save(); ctx.shadowColor="#00f5ff"; ctx.shadowBlur=20;
  rr(ctx,32,by,CW-64,62,16,"#040c18cc","#00f5ff",2);
  ctx.font=F.bold(26); ctx.fillStyle="#00f5ff";
  ctx.shadowColor="#00f5ff"; ctx.shadowBlur=16;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(banner.replace(/[^\x20-\x7E]/g,"").trim().slice(0,82), CW/2, by+31);
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();
}

// ─────────────────────────────────────────────
//  UTILITAIRE CANVAS
// ─────────────────────────────────────────────
function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if (fill)       { ctx.fillStyle=fill;   ctx.fill(); }
  if (stroke&&lw) { ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
}
