const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "BwlF", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "BwlF", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "BwlF", weight: "600" });
} catch(e) {}

const F = {
  bold:    s => `bold ${s}px BwlF, Arial`,
  semi:    s => `600 ${s}px BwlF, Arial`,
  regular: s => `${s}px BwlF, Arial`,
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

// Profils bots
const BOT_PROFILES = [
  { name:"Lucky Luke",  skill:0.45 },
  { name:"Strike King", skill:0.72 },
  { name:"Pro Bowler",  skill:0.85 },
  { name:"The Machine", skill:0.95 },
];

const GAME_EXPIRE = 45 * 60 * 1000;
const BOT_DELAY   = 1400;
const activeGames = new Map();
const sleep       = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  CANVAS DIMENSIONS
// ─────────────────────────────────────────────
const CW = 1200, CH = 1750;

// Disposition des 10 quilles [col, row] (triangulaire 1-2-3-4)
const PIN_LAYOUT = [
  [2,0],
  [1.5,1],[2.5,1],
  [1,2],[2,2],[3,2],
  [0.5,3],[1.5,3],[2.5,3],[3.5,3],
];

// ─────────────────────────────────────────────
//  MODULE GOATBOT
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name: "bowling",
    aliases: ["bowl","strike","quilles"],
    version: "2.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Bowling Royal — 10 frames, strikes, spares, multijoueur, bots IA et paris." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("BOWLING ROYAL")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `  ${fonts.monospace("bowling bot")}           : 1v1 contre un bot\n` +
        `  ${fonts.monospace("bowling bot 3")}         : vous + 2 bots\n` +
        `  ${fonts.monospace("bowling bot 4")}         : vous + 3 bots\n` +
        `  ${fonts.monospace("bowling 1v1 @joueur")}   : duel humain\n` +
        `  ${fonts.monospace("bowling 1v1v1 @p2 @p3")} : 3 joueurs\n` +
        `  ${fonts.monospace("bowling 1v1v1v1 @p2 @p3 @p4")} : 4 joueurs\n\n` +
        `${fonts.bold("Paris (hors bot) :")}\n` +
        `  ${fonts.monospace("bowling 1v1 @joueur 500")} : mise de 500 chacun\n\n` +
        `${fonts.bold("En jeu :")}\n` +
        `  Repondez ${fonts.monospace("roll")} (ou ${fonts.monospace("r")}) pour lancer la boule\n\n` +
        `${fonts.bold("Gestion :")}\n` +
        `  ${fonts.monospace("bowling stop")}   : terminer la partie\n` +
        `  ${fonts.monospace("bowling status")} : revoir le tableau\n\n` +
        `10 frames par joueur.\n` +
        `[X] Strike = 10 quilles au 1er lancer, bonus 2 prochains.\n` +
        `[/] Spare  = reste au 2eme lancer, bonus prochain.\n` +
        `Score max : 300 (partie parfaite).\n` +
        `10eme frame : jusqu'a 3 lancers si [X] ou [/].`
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
          await publishState(message, g, "Etat du tableau de scores.");
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
    if (!["roll","r","lancer","bowl"].includes(input)) {
      await publishState(message, game, `${current.name}, repondez "roll" pour lancer la boule !`);
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
  const mode      = (args[0] || "").toLowerCase();
  const humanName = await getName(api, usersData, senderID);

  let playerCount = 2, isBotGame = false;
  if      (mode === "1v1")       playerCount = 2;
  else if (mode === "1v1v1")     playerCount = 3;
  else if (mode === "1v1v1v1")   playerCount = 4;
  else if (mode === "bot" || mode === "bots") {
    isBotGame   = true;
    playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  } else return message.reply(module.exports.config.guide.fr);

  const mentionIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const players    = [{ id: senderID, name: humanName, bot: false }];
  for (let i = 0; i < Math.min(mentionIDs.length, playerCount - 1); i++)
    players.push({ id: mentionIDs[i], name: await getName(api, usersData, mentionIDs[i]), bot: false });
  while (players.length < playerCount) {
    const idx     = players.length - 1;
    const profile = BOT_PROFILES[idx % BOT_PROFILES.length];
    players.push({ id: `bot_${idx}_${Date.now()}`, name: profile.name, skill: profile.skill, bot: true });
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
  await publishState(message, game,
    `BOWLING ROYAL demarre ! 10 frames${potStr}.\n${game.players[0].name} commence ! Repondez "roll" !`
  );
  await runBots(message, game, api, usersData);
}

// ─────────────────────────────────────────────
//  CREATION DE PARTIE
// ─────────────────────────────────────────────
function createGame(threadID, rawPlayers, commandName, botGame, bet) {
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const players = rawPlayers.map((p, i) => ({
    ...p,
    color:        PLAYER_COLORS[i % PLAYER_COLORS.length],
    frames:       Array.from({ length: 10 }, () => ({ rolls: [], score: null, display: [] })),
    currentFrame: 0,
    currentRoll:  0,
    pinsUp:       10,
    lastRoll:     null,
    strikes:      0,
    spares:       0,
    done:         false,
  }));
  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, commandName, botGame, players,
    turnIndex:  0,
    rollTotal:  0,
    log:        ["Partie lancee - a vos boules !"],
    replyMessageID: null,
    updatedAt:  Date.now(),
    startedAt:  Date.now(),
    bet, pot: bet * rawPlayers.filter(p => !p.bot).length,
    finished:   false,
  };
}

// ─────────────────────────────────────────────
//  LOGIQUE BOWLING
// ─────────────────────────────────────────────
function getCurrentPlayer(game) {
  return game.players[game.turnIndex] || null;
}

function simulateRoll(pinsUp, skill = 0.6) {
  const r = Math.random();
  if (pinsUp === 10) {
    if (r < skill * 0.5) return 10;
    const base  = Math.floor(Math.random() * 11);
    const bonus = Math.floor(skill * 3 * Math.random());
    return Math.min(10, base + bonus);
  } else {
    if (r < skill * 0.55) return pinsUp;
    return Math.floor(Math.random() * (pinsUp + 1));
  }
}

async function doRoll(message, game, api, usersData) {
  const player = getCurrentPlayer(game);
  if (!player || player.done) return;

  const fi     = player.currentFrame;
  const frame  = player.frames[fi];
  const ri     = player.currentRoll;
  const is10th = fi === 9;

  const knocked   = simulateRoll(player.pinsUp, player.skill || 0.6);
  frame.rolls.push(knocked);
  player.lastRoll  = knocked;
  player.pinsUp   -= knocked;
  game.rollTotal++;
  game.updatedAt   = Date.now();

  _rebuildDisplay(frame, is10th);

  const label = _rollLabel(knocked, frame, ri, player.pinsUp + knocked);
  game.log.unshift(`${player.color.label} ${player.name} [F${fi+1}L${ri+1}] : ${label}`);

  if (knocked === 10 && ri === 0 && !is10th) player.strikes++;

  const frameDone = _advanceFrame(player, knocked, is10th);
  _recalcScores(player);

  if (player.currentFrame >= 10) {
    player.done = true;
    game.log.unshift(`${player.color.label} ${player.name} termine avec ${_total(player)} points !`);
  }

  if (game.players.every(p => p.done)) {
    await _finishGame(message, game, usersData);
    return;
  }

  if (frameDone || player.done) _nextPlayer(game);

  const current = getCurrentPlayer(game);
  const banner  = _rollBanner(player, label, current);
  await publishState(message, game, banner);
  await runBots(message, game, api, usersData);
}

function _advanceFrame(player, knocked, is10th) {
  const frame = player.frames[player.currentFrame];
  const ri    = player.currentRoll;
  if (!is10th) {
    if (knocked === 10) {
      player.currentFrame++; player.currentRoll = 0; player.pinsUp = 10; return true;
    } else if (ri === 1) {
      if (player.pinsUp === 0) player.spares++;
      player.currentFrame++; player.currentRoll = 0; player.pinsUp = 10; return true;
    } else { player.currentRoll++; return false; }
  } else {
    const rolls = frame.rolls;
    if (rolls.length === 1) {
      if (knocked === 10) player.pinsUp = 10;
      player.currentRoll = 1; return false;
    } else if (rolls.length === 2) {
      const [f, s] = rolls;
      const bonusBall = f === 10 || s === 10 || f + s === 10;
      if (bonusBall) {
        if (f === 10 && s === 10) player.pinsUp = 10;
        else if (f === 10)        player.pinsUp = 10 - s;
        else                      player.pinsUp = 10;
        player.currentRoll = 2; return false;
      } else { player.currentFrame++; return true; }
    } else { player.currentFrame++; return true; }
  }
}

function _rebuildDisplay(frame, is10th) {
  const rolls = frame.rolls;
  frame.display = [];
  if (!is10th) {
    if (rolls[0] === 10) { frame.display = ["","X"]; return; }
    frame.display[0] = rolls[0] === 0 ? "-" : String(rolls[0]);
    if (rolls.length > 1)
      frame.display[1] = (rolls[0]+rolls[1]===10) ? "/" : (rolls[1]===0 ? "-" : String(rolls[1]));
  } else {
    rolls.forEach((r, i) => {
      const prev = rolls[i-1];
      if (r === 10) frame.display.push("X");
      else if (i > 0 && prev !== 10 && prev + r === 10) frame.display.push("/");
      else if (r === 0) frame.display.push("-");
      else frame.display.push(String(r));
    });
  }
}

function _recalcScores(player) {
  let allRolls = [];
  for (let fi = 0; fi < 10; fi++) allRolls = allRolls.concat(player.frames[fi].rolls);
  let idx = 0;
  for (let fi = 0; fi < 10; fi++) {
    const frame = player.frames[fi];
    if (!frame.rolls.length) break;
    if (fi < 9) {
      if (frame.rolls[0] === 10) {
        if (allRolls[idx+1] !== undefined && allRolls[idx+2] !== undefined)
          frame.score = 10 + (allRolls[idx+1]||0) + (allRolls[idx+2]||0);
        idx += 1;
      } else if ((frame.rolls[0]+(frame.rolls[1]||0)) === 10) {
        if (allRolls[idx+2] !== undefined) frame.score = 10 + (allRolls[idx+2]||0);
        idx += 2;
      } else {
        frame.score = (frame.rolls[0]||0) + (frame.rolls[1]||0);
        idx += 2;
      }
    } else {
      frame.score = frame.rolls.reduce((a,b) => a+b, 0);
    }
  }
}

function _total(player) {
  return player.frames.reduce((a, f) => a + (f.score || 0), 0);
}

function _cumul(player) {
  const out = []; let t = 0;
  for (const f of player.frames) {
    if (f.score !== null) { t += f.score; out.push(t); }
    else out.push(null);
  }
  return out;
}

function _nextPlayer(game) {
  const n = game.players.length;
  let tries = 0;
  do { game.turnIndex = (game.turnIndex + 1) % n; tries++; }
  while (tries < n && game.players[game.turnIndex].done);
}

function _rollLabel(knocked, frame, ri, prevPins) {
  if (knocked === 10 && ri === 0) return `[X] STRIKE ! (10/10)`;
  if (ri > 0 && knocked === prevPins) return `[/] SPARE ! (${knocked}/${prevPins})`;
  if (knocked === 0) return `[-] Aucune quille tombee`;
  return `${knocked} quille${knocked>1?"s":""} tombee${knocked>1?"s":""}`;
}

function _rollBanner(player, label, next) {
  let b = `${player.color.label} ${player.name} : ${label} | Score: ${_total(player)}`;
  if (next && !next.done && next.id !== player.id)
    b += ` | Au tour de ${next.color.label} ${next.name} !`;
  return b;
}

// ─────────────────────────────────────────────
//  FIN DE PARTIE
// ─────────────────────────────────────────────
async function _finishGame(message, game, usersData) {
  game.finished = true;
  const ranked  = [...game.players].sort((a,b) => _total(b) - _total(a));
  const winner  = ranked[0];
  const perfect = _total(winner) === 300;

  await payWinner(game, winner, usersData);

  let msg = perfect
    ? `PARTIE PARFAITE ! ${winner.color.label} ${winner.name} marque 300 points !!\n`
    : `VICTOIRE ! ${winner.color.label} ${winner.name} remporte la partie avec ${_total(winner)} points !\n`;
  if (game.bet > 0 && !winner.bot) msg += `Gain: ${game.pot.toLocaleString()}\n`;
  msg += `\nCLASSEMENT FINAL:\n`;
  ranked.forEach((p, i) => {
    const medals = ["1er","2eme","3eme","4eme"];
    msg += `${medals[i]||"-"} ${p.color.label} ${p.name} - ${_total(p)} pts | [X]${p.strikes} [/]${p.spares}\n`;
  });

  const saved = { ...game, players: game.players.map(p => ({ ...p, frames: p.frames.map(f => ({ ...f })) })) };
  endGame(game);
  await publishState(message, saved, msg);
}

// ─────────────────────────────────────────────
//  BOTS IA
// ─────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  if (!activeGames.has(game.key) || game.finished) return;
  let safety = 0;
  while (activeGames.has(game.key) && !game.finished && safety < 200) {
    safety++;
    const current = getCurrentPlayer(game);
    if (!current || !current.bot) break;
    await sleep(BOT_DELAY);
    if (!activeGames.has(game.key) || game.finished) return;
    await doRoll(message, game, api, usersData);
  }
}

// ─────────────────────────────────────────────
//  PARIS & UTILITAIRES
// ─────────────────────────────────────────────
async function payWinner(game, winner, usersData) {
  if (!game.bet || !game.pot || !usersData || winner.bot) return;
  try { const ud = await usersData.get(winner.id); await usersData.set(winner.id, { money: (ud.money||0) + game.pot }); }
  catch(e) { console.error("[Bowling] Paiement:", e); }
}

async function refundBets(game, usersData) {
  if (!game.bet || !usersData) return;
  for (const p of game.players.filter(p => !p.bot)) {
    try { const ud = await usersData.get(p.id); await usersData.set(p.id, { money: (ud.money||0) + game.bet }); }
    catch(e) { console.error("[Bowling] Remboursement:", e); }
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply)
    global.GoatBot.onReply.delete(game.replyMessageID);
}

function endGamesForThread(threadID, senderID, usersData) {
  let n = 0;
  for (const g of [...activeGames.values()])
    if (g.threadID === threadID && g.players.some(p => p.id === senderID))
      { refundBets(g, usersData); endGame(g); n++; }
  return n;
}

function cleanupExpired() {
  const now = Date.now();
  for (const g of activeGames.values()) if (now - g.updatedAt > GAME_EXPIRE) endGame(g);
}

async function getName(api, usersData, id) {
  if (id.startsWith("bot_")) return id;
  try {
    if (usersData?.getName) return await usersData.getName(id);
    const info = await api.getUserInfo(id); return info[id]?.name || "Joueur";
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

  const tmpPath = path.join(os.tmpdir(), `bowling_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderBowling(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch(err) {
    console.error("[Bowling] Canvas:", err);
    return message.reply(fonts.bold(`BOWLING: ${body}`));
  }

  const nextHuman = game.players.find(p => !p.bot && !p.done);
  const mentions  = nextHuman ? [{ id: nextHuman.id, tag: nextHuman.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: text, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch(_) {}
      if (err) { console.error("[Bowling] Envoi:", err); resolve(); return; }
      game.replyMessageID = info.messageID;
      if (activeGames.get(game.key) === game && nextHuman && global.GoatBot?.onReply) {
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
  const current = getCurrentPlayer(game);
  const lines   = [];
  lines.push(`BOWLING ROYAL`);
  lines.push(`Temps: ${elapsed}m | Lancers: ${game.rollTotal}`);
  if (game.bet > 0) lines.push(`Mise: ${game.bet.toLocaleString()} | Cagnotte: ${game.pot.toLocaleString()}`);
  lines.push("--------------------");
  game.players.forEach((p, i) => {
    const score = _total(p);
    const frame = p.done ? "FINI" : `Frame ${Math.min(p.currentFrame+1,10)}/10`;
    const arrow = (!p.done && current && p.id === current.id) ? " << TON TOUR" : "";
    lines.push(`${p.color.label} ${p.name}${p.bot?" [BOT]":""}${arrow}`);
    lines.push(`   Score: ${score} | ${frame} | [X]${p.strikes} [/]${p.spares}`);
  });
  lines.push("--------------------");
  if (current && !current.done) {
    if (current.bot) lines.push(`[BOT] ${current.name} reflechit...`);
    else lines.push(`>> ${current.name} : repondez "roll" pour lancer !`);
  }
  game.log.slice(0,4).forEach(l => lines.push(`- ${l}`));
  lines.push("--------------------");
  lines.push(body.replace(/[^\x20-\x7E]/g,"").trim());
  return lines.join("\n");
}

// ─────────────────────────────────────────────
//  RENDU CANVAS 1200 x 1750
// ─────────────────────────────────────────────
function renderBowling(game, banner) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");

  _drawBg(ctx);
  _drawHeader(ctx, game);
  _drawLane(ctx, game);
  _drawPins(ctx, game);
  _drawScoreboard(ctx, game);
  _drawPlayerStats(ctx, game);
  _drawLogPanel(ctx, game);
  _drawBanner(ctx, banner);

  return canvas;
}

// ── Fond ──────────────────────────────────────
function _drawBg(ctx) {
  const g = ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,   "#0f0a1a");
  g.addColorStop(0.3, "#1a1030");
  g.addColorStop(0.7, "#0d0820");
  g.addColorStop(1,   "#08050f");
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);

  // Halos d'ambiance (sans emojis, cercles gradients)
  ctx.save(); ctx.globalAlpha=0.055;
  for (const [cx,cy,r,col] of [[200,200,280,"#7c3aed"],[1000,150,250,"#2563eb"],[600,900,350,"#7c3aed"],[1050,1580,220,"#7c3aed"]]) {
    const rg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    rg.addColorStop(0,col); rg.addColorStop(1,"transparent");
    ctx.fillStyle=rg; ctx.fillRect(0,0,CW,CH);
  }
  ctx.restore();
}

// ── Header ────────────────────────────────────
function _drawHeader(ctx, game) {
  rr(ctx, 35,22,CW-70,140,24,"#ffffff09","#7c3aed66",2);

  // Titre — texte pur avec gradient
  const tg = ctx.createLinearGradient(50,40,50,120);
  tg.addColorStop(0,"#a78bfa"); tg.addColorStop(0.5,"#ddd6fe"); tg.addColorStop(1,"#a78bfa");
  ctx.font=F.bold(54); ctx.fillStyle=tg;
  ctx.fillText("BOWLING ROYAL", 55, 102);

  // Icone boule dessinee canvas
  _drawBallIcon(ctx, CW-150, 80, 45, { hex:"#7c3aed", dark:"#4c1d95" });

  const elapsed = Math.floor((Date.now()-game.startedAt)/60000);
  ctx.font=F.regular(21); ctx.fillStyle="#c4b5fd88";
  ctx.fillText(`${game.players.length} joueurs  |  ${elapsed}m  |  ${game.rollTotal} lancers`, 58, 140);

  if (game.bet > 0) {
    ctx.font=F.bold(20); ctx.fillStyle="#fde68a";
    ctx.textAlign="right"; ctx.fillText(`Cagnotte: ${game.pot.toLocaleString()}`, CW-52, 140); ctx.textAlign="left";
  }
}

// Boule de bowling dessinee en Canvas pur
function _drawBallIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.shadowColor=color.hex+"99"; ctx.shadowBlur=16;
  const bg = ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.05,cx,cy,r);
  bg.addColorStop(0,"#ffffff33"); bg.addColorStop(0.4,color.hex); bg.addColorStop(1,color.dark);
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle=bg; ctx.fill();
  // Trous
  for (const [ox,oy] of [[-r*0.22,-r*0.14],[0,-r*0.32],[r*0.22,r*0.02]]) {
    ctx.beginPath(); ctx.arc(cx+ox,cy+oy,r*0.1,0,Math.PI*2);
    ctx.fillStyle="#00000077"; ctx.fill();
  }
  ctx.restore();
}

// ── Piste ─────────────────────────────────────
function _drawLane(ctx, game) {
  const lx=180, ly=185, lw=CW-360, lh=290;

  // Caniveaux
  rr(ctx,lx-50,ly,46,lh,8,"#1e1b4b","#4c1d9599",2);
  rr(ctx,lx+lw+4,ly,46,lh,8,"#1e1b4b","#4c1d9599",2);
  ctx.save();
  ctx.font=F.bold(12); ctx.fillStyle="#4c1d9588";
  ctx.textAlign="center";
  ctx.save(); ctx.translate(lx-27,ly+lh/2); ctx.rotate(-Math.PI/2);
  ctx.fillText("CANIVEAU", 0, 0); ctx.restore();
  ctx.save(); ctx.translate(lx+lw+27,ly+lh/2); ctx.rotate(Math.PI/2);
  ctx.fillText("CANIVEAU", 0, 0); ctx.restore();
  ctx.textAlign="left"; ctx.restore();

  // Parquet en bois (dégradé + lignes)
  ctx.save();
  ctx.shadowColor="#00000077"; ctx.shadowBlur=20; ctx.shadowOffsetY=10;
  const wood = ctx.createLinearGradient(lx,ly,lx,ly+lh);
  wood.addColorStop(0,"#92400e"); wood.addColorStop(0.2,"#b45309");
  wood.addColorStop(0.5,"#d97706"); wood.addColorStop(0.8,"#b45309");
  wood.addColorStop(1,"#78350f");
  rr(ctx,lx,ly,lw,lh,12,null,null,0); ctx.fillStyle=wood; ctx.fill();
  ctx.restore();

  // Lignes de parquet
  ctx.save(); ctx.globalAlpha=0.12;
  for (let x=lx+20; x<lx+lw; x+=22) {
    ctx.strokeStyle="#fff"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x,ly); ctx.lineTo(x,ly+lh); ctx.stroke();
  }
  ctx.restore();

  // Points de visee (7 petits triangles)
  ctx.save(); ctx.globalAlpha=0.55;
  const arrowY=ly+lh*0.58, sp=lw/8;
  for (let i=1;i<8;i++) {
    const ax=lx+i*sp;
    ctx.fillStyle="#fbbf24";
    ctx.beginPath(); ctx.moveTo(ax,arrowY-12); ctx.lineTo(ax-8,arrowY+7); ctx.lineTo(ax+8,arrowY+7);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Ligne de faute (tirets rouges)
  ctx.save();
  ctx.strokeStyle="#ef4444"; ctx.lineWidth=4; ctx.setLineDash([10,6]);
  ctx.beginPath(); ctx.moveTo(lx,ly+lh-2); ctx.lineTo(lx+lw,ly+lh-2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font=F.bold(13); ctx.fillStyle="#ef4444aa";
  ctx.fillText("LIGNE DE FAUTE", lx+8, ly+lh-8);
  ctx.restore();

  // Bordure piste
  ctx.strokeStyle="#f59e0b55"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx,ly+lh);
  ctx.moveTo(lx+lw,ly); ctx.lineTo(lx+lw,ly+lh); ctx.stroke();
}

// ── Quilles ───────────────────────────────────
function _drawPins(ctx, game) {
  const lx=180, ly=185, lw=CW-360, lh=290;
  const current = getCurrentPlayer(game);
  if (!current) return;

  const fi    = Math.min(current.currentFrame, 9);
  const frame = current.frames[fi];

  // Calcul quilles tombées (visuel pseudo-aléatoire)
  const downSet = _computeDownPins(frame.rolls, fi * 37 + current.currentRoll * 7);

  const startX = lx + lw/2 - 110;
  const startY = ly + 14;
  const PIN_R  = 13;

  PIN_LAYOUT.forEach((pos, idx) => {
    const px = startX + pos[0] * 50;
    const py = startY + pos[1] * 40;
    const isDown = downSet.has(idx);

    ctx.save();
    if (isDown) {
      // Quille couchee (ellipse grise)
      ctx.globalAlpha=0.3;
      ctx.beginPath(); ctx.ellipse(px+PIN_R, py+PIN_R*1.4, PIN_R*1.5, PIN_R*0.4, 0.4, 0, Math.PI*2);
      ctx.fillStyle="#6b7280"; ctx.fill();
    } else {
      // Quille debout
      ctx.shadowColor="#00000099"; ctx.shadowBlur=8; ctx.shadowOffsetY=4;

      // Corps blanc (ovale vertical)
      const pg = ctx.createLinearGradient(px-PIN_R,py,px+PIN_R,py);
      pg.addColorStop(0,"#d1d5db"); pg.addColorStop(0.4,"#ffffff"); pg.addColorStop(1,"#9ca3af");
      ctx.beginPath(); ctx.ellipse(px,py,PIN_R*0.5,PIN_R,0,0,Math.PI*2);
      ctx.fillStyle=pg; ctx.fill();

      // Bandes rouges
      ctx.shadowColor="transparent";
      ctx.beginPath(); ctx.ellipse(px,py-PIN_R*0.1,PIN_R*0.42,PIN_R*0.2,0,0,Math.PI*2);
      ctx.fillStyle="#ef4444"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(px,py+PIN_R*0.35,PIN_R*0.46,PIN_R*0.16,0,0,Math.PI*2);
      ctx.fillStyle="#ef4444"; ctx.fill();

      // Tete
      ctx.beginPath(); ctx.arc(px,py-PIN_R*0.65,PIN_R*0.3,0,Math.PI*2);
      ctx.fillStyle="#ffffff"; ctx.fill();
    }
    ctx.restore();

    // Numero
    ctx.font=F.bold(11);
    ctx.fillStyle=isDown?"#374151":"#ffffff55";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(String(idx+1), px+(isDown?PIN_R+8:0), py+(isDown?PIN_R*1.4+5:0));
    ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  });

  // Boule en bas de piste (coloree selon joueur)
  if (current.lastRoll !== null && frame.rolls.length > 0)
    _drawBallIcon(ctx, lx+lw/2, ly+lh-38, 26, current.color);

  // Compteur quilles
  ctx.font=F.semi(18); ctx.fillStyle="#c4b5fd";
  ctx.textAlign="center";
  ctx.fillText(`${current.pinsUp} quille${current.pinsUp>1?"s":""} debout`, CW/2, ly+lh-18);
  ctx.textAlign="left";
}

function _computeDownPins(rolls, seed) {
  const down = new Set();
  if (!rolls.length) return down;
  const rng = (() => { let s=seed; return () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; }; })();
  const all  = [0,1,2,3,4,5,6,7,8,9];
  const sh1  = [...all].sort(()=>rng()-0.5);
  for (let i=0; i<Math.min(rolls[0],10); i++) down.add(sh1[i]);
  if (rolls.length > 1) {
    const rem = all.filter(i=>!down.has(i));
    const sh2 = rem.sort(()=>rng()-0.5);
    for (let i=0; i<Math.min(rolls[1],rem.length); i++) down.add(sh2[i]);
  }
  return down;
}

// ── Tableau de scores ─────────────────────────
function _drawScoreboard(ctx, game) {
  const n      = game.players.length;
  const sbY    = 490;
  const sbH    = 44 + n * 92;
  const sbX    = 30, sbW = CW-60;

  rr(ctx, sbX,sbY,sbW,sbH,18,"#0d0a1e","#7c3aed66",2);

  ctx.font=F.bold(20); ctx.fillStyle="#a78bfa";
  ctx.fillText("TABLEAU DE SCORES", sbX+18, sbY+28);

  // Entetes frames
  const frameW = (sbW-160)/10;
  ctx.font=F.bold(14); ctx.fillStyle="#6b7280";
  for (let fi=0; fi<10; fi++) {
    ctx.textAlign="center";
    ctx.fillText(fi<9?`F${fi+1}`:"F10", sbX+160+fi*frameW+frameW/2, sbY+50);
  }
  ctx.textAlign="left";
  ctx.strokeStyle="#7c3aed22"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(sbX+10,sbY+56); ctx.lineTo(sbX+sbW-10,sbY+56); ctx.stroke();

  game.players.forEach((player, pi) => {
    const rowY   = sbY+62+pi*92;
    const cumul  = _cumul(player);
    const isCur  = !player.done && getCurrentPlayer(game)?.id === player.id;

    if (isCur) rr(ctx,sbX+8,rowY-4,sbW-16,84,10,player.color.hex+"18",player.color.hex+"66",1.5);

    // Label joueur
    ctx.font=F.bold(20); ctx.fillStyle=isCur?player.color.light:"#cbd5e1";
    ctx.fillText(player.color.label+" "+player.name.slice(0,10), sbX+14, rowY+22);

    // Total
    ctx.font=F.bold(30); ctx.fillStyle=player.color.hex;
    ctx.textAlign="center"; ctx.fillText(String(_total(player)), sbX+122, rowY+32);
    ctx.font=F.regular(12); ctx.fillStyle="#64748b";
    ctx.fillText("total", sbX+122, rowY+48); ctx.textAlign="left";

    // Frames
    player.frames.forEach((frame, fi) => {
      const fx       = sbX+158+fi*frameW;
      const isCurF   = player.currentFrame===fi && !player.done;
      const boxCount = fi===9?3:2;
      const boxW     = (frameW-6)/boxCount;

      rr(ctx,fx+2,rowY-2,frameW-4,80,8,
        isCurF?player.color.hex+"33":"#ffffff05",
        isCurF?player.color.hex:"#ffffff15",
        isCurF?1.5:1
      );

      // Boites des lancers
      for (let ri=0; ri<boxCount; ri++) {
        const bx=fx+4+ri*(boxW+1), by=rowY+4;
        rr(ctx,bx,by,boxW,28,4,"#ffffff0a","#ffffff1a",1);
        const sym = frame.display[ri];
        if (sym) {
          ctx.font=F.bold(16);
          ctx.fillStyle = sym==="X"?"#fbbf24":sym==="/"?"#34d399":"#e2e8f0";
          ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(sym, bx+boxW/2, by+14);
          ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        }
      }

      // Score cumulatif
      const cs = cumul[fi];
      if (cs !== null && cs !== undefined) {
        ctx.font=F.bold(20); ctx.fillStyle="#f8fafc";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(String(cs), fx+frameW/2, rowY+60);
        ctx.textAlign="left"; ctx.textBaseline="alphabetic";
      }
    });
  });
}

// ── Stats joueurs ─────────────────────────────
function _drawPlayerStats(ctx, game) {
  const n    = game.players.length;
  const sbH  = 44 + n * 92;
  const baseY= 490 + sbH + 16;
  const colW = (CW-70)/n;

  rr(ctx,30,baseY,CW-60,186,18,"#0d0a1eaa","#7c3aed44",1.5);
  ctx.font=F.bold(19); ctx.fillStyle="#a78bfa";
  ctx.fillText("STATISTIQUES", 55, baseY+25);

  game.players.forEach((p, i) => {
    const cx    = 35+i*colW;
    const total = _total(p);
    const isCur = getCurrentPlayer(game)?.id === p.id;

    rr(ctx,cx,baseY+38,colW-10,132,14,
      isCur?p.color.hex+"25":"#ffffff07",
      isCur?p.color.hex:"#ffffff18",
      isCur?2:1
    );

    // Pastille couleur
    ctx.save(); ctx.shadowColor=p.color.hex; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(cx+18,baseY+62,11,0,Math.PI*2);
    ctx.fillStyle=p.color.hex; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();

    // Label dans la pastille
    ctx.font=F.bold(11); ctx.fillStyle="#fff";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(p.color.letter, cx+18, baseY+62);
    ctx.textAlign="left"; ctx.textBaseline="alphabetic";

    ctx.font=F.bold(18); ctx.fillStyle=isCur?"#f8fafc":"#94a3b8";
    ctx.fillText((p.bot?"[BOT] ":"")+p.name.slice(0,11), cx+34, baseY+66);

    // Score central
    ctx.font=F.bold(38); ctx.fillStyle=p.color.hex;
    ctx.textAlign="center"; ctx.fillText(String(total), cx+colW/2-5, baseY+112);
    ctx.textAlign="left";

    // Stats texte pur
    ctx.font=F.regular(15); ctx.fillStyle="#64748b";
    ctx.fillText(`[X] ${p.strikes} strikes  [/] ${p.spares} spares`, cx+10, baseY+138);

    if (p.done) { ctx.font=F.bold(13); ctx.fillStyle="#34d399"; ctx.fillText("TERMINE", cx+10, baseY+158); }
    else if (isCur) { ctx.font=F.bold(13); ctx.fillStyle="#fbbf24"; ctx.fillText(">> EN COURS F"+Math.min(p.currentFrame+1,10), cx+10, baseY+158); }
  });
}

// ── Log ───────────────────────────────────────
function _drawLogPanel(ctx, game) {
  const n   = game.players.length;
  const sbH = 44 + n * 92;
  const py  = 490 + sbH + 16 + 204;
  const ph  = 186;
  rr(ctx,30,py,CW-60,ph,18,"#0d0a1eaa","#7c3aed44",1.5);
  ctx.font=F.bold(18); ctx.fillStyle="#a78bfa";
  ctx.fillText("JOURNAL", 58, py+25);
  ctx.font=F.regular(18);
  game.log.slice(0,6).forEach((line,i) => {
    ctx.fillStyle = i===0?"#ddd6fe":i===1?"#e2e8f0":"#475569";
    const safe = line.replace(/[^\x20-\x7E]/g,"").trim();
    ctx.fillText("- "+safe.slice(0,92), 58, py+50+i*23);
  });
}

// ── Banniere ──────────────────────────────────
function _drawBanner(ctx, banner) {
  const by = CH-96;
  rr(ctx,30,by,CW-60,62,14,"#0d0a1ebb","#7c3aed",2);
  ctx.save();
  ctx.font=F.bold(25); ctx.fillStyle="#ddd6fe";
  ctx.shadowColor="#7c3aed"; ctx.shadowBlur=14;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(banner.replace(/[^\x20-\x7E]/g,"").trim().slice(0,84), CW/2, by+31);
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.restore();
}

// ─────────────────────────────────────────────
//  UTILITAIRES CANVAS
// ─────────────────────────────────────────────
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
