const { createCanvas, loadImage } = require("canvas");
const Canvas = require("canvas");
const path = require("path");
const fs = require("fs");
const os = require("os");

let fonts;
try {
  fonts = require("../../func/font.js");
} catch {
  fonts = { bold: t => t, sansSerif: t => t, monospace: t => t };
}

Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"), { family: "PokerFont", weight: "bold" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "PokerFont", weight: "normal" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"), { family: "PokerFont", weight: "600" });

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_COLORS = { "♠": "#e2e8f0", "♥": "#f87171", "♦": "#f87171", "♣": "#e2e8f0" };
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUES = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14 };

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 25;
const BIG_BLIND = 50;
const BOT_THINK_DELAY = 1200;
const GAME_EXPIRE_MS = 1000 * 60 * 45;

const activeGames = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  CONFIG COMMANDE
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name: "poker",
    aliases: ["texas", "holdem", "pokergame"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🃏 Texas Hold'em Poker complet — plateau Canvas, multijoueur, bots IA et paris."
    },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("🃏 POKER ROYAL — Texas Hold'em 🃏")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `• ${fonts.monospace("poker bot")} : 1v1 contre un bot\n` +
        `• ${fonts.monospace("poker bot 3")} : contre 2 bots (3 joueurs)\n` +
        `• ${fonts.monospace("poker bot 4")} : contre 3 bots (4 joueurs)\n` +
        `• ${fonts.monospace("poker 1v1 @joueur")} : duel humain\n` +
        `• ${fonts.monospace("poker 1v1v1 @p2 @p3")} : 3 joueurs\n` +
        `• ${fonts.monospace("poker 1v1v1v1 @p2 @p3 @p4")} : 4 joueurs (max)\n\n` +
        `${fonts.bold("Mise de départ optionnelle :")}\n` +
        `• ${fonts.monospace("poker 1v1 @joueur 500")} : chaque joueur mise 500$\n\n` +
        `${fonts.bold("Actions en jeu :")}\n` +
        `• ${fonts.monospace("check")} / ${fonts.monospace("c")} : passer (si pas de mise)\n` +
        `• ${fonts.monospace("call")} : suivre la mise actuelle\n` +
        `• ${fonts.monospace("raise 200")} : relancer de 200$\n` +
        `• ${fonts.monospace("allin")} / ${fonts.monospace("all")} : tapis !\n` +
        `• ${fonts.monospace("fold")} / ${fonts.monospace("f")} : se coucher\n\n` +
        `${fonts.bold("Gestion :")}\n` +
        `• ${fonts.monospace("poker stop")} : terminer la partie\n` +
        `• ${fonts.monospace("poker status")} : revoir le plateau\n\n` +
        `★ Blindes : SB=${SMALL_BLIND}$ / BB=${BIG_BLIND}$ | Stack de départ : ${STARTING_CHIPS}$`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const mode = (args[0] || "").toLowerCase();

    if (!mode || mode === "help") {
      return message.reply(this.config.guide.fr);
    }
    if (mode === "stop" || mode === "end") {
      const ended = endGamesForThread(event.threadID, event.senderID, usersData);
      if (!ended) return message.reply(fonts.bold("❌ Aucune partie de Poker en cours pour vous ici."));
      return message.reply(fonts.bold(`✅ ${ended} partie(s) terminée(s). Mises remboursées si applicable.`));
    }
    if (mode === "status") {
      for (const game of activeGames.values()) {
        if (game.threadID === event.threadID && game.players.some(p => p.id === event.senderID)) {
          await publishState(message, game, "📊 État de la table");
          return;
        }
      }
      return message.reply(fonts.bold("❌ Aucune partie en cours pour vous ici."));
    }
    await handlePokerStart({ message, event, args, api, usersData, commandName });
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey || Reply.threadID);
    if (!game || game.id !== Reply.gameID) return;

    if (game.replyMessageID && global.GoatBot?.onReply) {
      global.GoatBot.onReply.delete(game.replyMessageID);
    }

    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;

    if (event.senderID !== current.id) {
      return message.reply({
        body: fonts.bold(`❌ Ce n'est pas votre tour ! C'est à ${current.name}.`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }

    const input = (event.body || "").trim().toLowerCase();

    if (input === "stop" || input === "end") {
      await refundAll(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("🛑 Partie de Poker terminée. Mises remboursées."));
    }

    await handlePlayerAction(message, game, current, input, api, usersData);
  }
};

// ─────────────────────────────────────────────
//  DÉMARRAGE
// ─────────────────────────────────────────────
async function handlePokerStart({ message, event, args, api, usersData, commandName }) {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const mode = (args[0] || "").toLowerCase();
  const humanName = await getUserName(api, usersData, senderID);

  let playerCount = 2;
  let isBotGame = false;

  if (mode === "1v1") playerCount = 2;
  else if (mode === "1v1v1") playerCount = 3;
  else if (mode === "1v1v1v1") playerCount = 4;
  else if (mode === "bot" || mode === "bots") {
    isBotGame = true;
    playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  } else {
    return message.reply(module.exports.config.guide.fr);
  }

  const mentionedIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const players = [{ id: senderID, name: humanName, bot: false }];
  for (let i = 0; i < Math.min(mentionedIDs.length, playerCount - 1); i++) {
    const id = mentionedIDs[i];
    const name = await getUserName(api, usersData, id);
    players.push({ id, name, bot: false });
  }
  while (players.length < playerCount) {
    const botNames = ["Ace McGraw", "Bluff King", "River Shark", "The Maverick"];
    players.push({ id: `bot_${players.length}_${Date.now()}`, name: botNames[players.length - 1] || `Bot ${players.length}`, bot: true });
  }

  // Mise d'entrée (buy-in)
  let buyIn = 0;
  if (!isBotGame) {
    const betArg = args.find(a => /^\d+$/.test(a) && parseInt(a, 10) > 0);
    if (betArg) buyIn = parseInt(betArg, 10);
  }
  if (buyIn > 0) {
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      if ((ud?.money || 0) < buyIn) {
        return message.reply(fonts.bold(`💸 ${p.name} n'a pas assez d'argent !\nNécessaire : $${buyIn.toLocaleString()} | Balance : $${(ud?.money || 0).toLocaleString()}`));
      }
    }
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money || 0) - buyIn });
    }
  }

  const startingChips = buyIn > 0 ? buyIn : STARTING_CHIPS;
  const game = createGame(threadID, players, commandName, isBotGame, startingChips);
  activeGames.set(game.key, game);

  dealNewHand(game);
  const startMsg = `🃏 POKER ROYAL démarre ! Stack : $${startingChips.toLocaleString()} chacun. SB=$${SMALL_BLIND} / BB=$${BIG_BLIND}`;
  await publishState(message, game, startMsg);
  await runBots(message, game, api, usersData);
}

// ─────────────────────────────────────────────
//  CRÉATION DE PARTIE
// ─────────────────────────────────────────────
function createGame(threadID, rawPlayers, commandName, botGame, startingChips) {
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const players = rawPlayers.map((p, i) => ({
    ...p,
    chips: startingChips,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    seatIndex: i
  }));
  return {
    id: `${threadID}_${Date.now()}`,
    key, botGame, threadID, commandName, players,
    deck: [], communityCards: [], pot: 0, sidePots: [],
    stage: "preflop", // preflop | flop | turn | river | showdown
    turnIndex: 0, dealerIndex: 0,
    currentBet: 0, lastRaise: BIG_BLIND,
    handNumber: 0, log: ["Partie créée"],
    replyMessageID: null, updatedAt: Date.now(), startedAt: Date.now(),
    actionCount: 0, playersActed: new Set()
  };
}

// ─────────────────────────────────────────────
//  MÉCANIQUE DE JEU
// ─────────────────────────────────────────────
function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealNewHand(game) {
  // Réinitialiser les joueurs actifs (éliminer ceux sans jetons)
  const activePlayers = game.players.filter(p => p.chips > 0);
  if (activePlayers.length < 2) return false;

  game.handNumber++;
  game.deck = buildDeck();
  game.communityCards = [];
  game.pot = 0;
  game.stage = "preflop";
  game.currentBet = BIG_BLIND;
  game.lastRaise = BIG_BLIND;
  game.actionCount = 0;
  game.playersActed = new Set();
  game.log = [`Main #${game.handNumber} commencée`];

  // Avancer le dealer
  game.dealerIndex = (game.dealerIndex + (game.handNumber > 1 ? 1 : 0)) % activePlayers.length;

  // Reset joueurs
  for (const p of game.players) {
    p.hand = [];
    p.bet = 0;
    p.totalBet = 0;
    p.folded = p.chips <= 0;
    p.allIn = false;
  }

  // Distribuer 2 cartes à chaque joueur actif
  for (const p of activePlayers) {
    p.hand = [game.deck.pop(), game.deck.pop()];
  }

  // Blindes
  const sbIndex = (game.dealerIndex + 1) % activePlayers.length;
  const bbIndex = (game.dealerIndex + 2) % activePlayers.length;
  const sbPlayer = activePlayers[sbIndex];
  const bbPlayer = activePlayers[bbIndex];

  postBlind(game, sbPlayer, SMALL_BLIND);
  postBlind(game, bbPlayer, BIG_BLIND);

  game.log.unshift(`${sbPlayer.name} : SB $${SMALL_BLIND} | ${bbPlayer.name} : BB $${BIG_BLIND}`);

  // Premier à parler : après BB
  const utg = activePlayers[(bbIndex + 1) % activePlayers.length];
  game.turnIndex = game.players.indexOf(utg);

  return true;
}

function postBlind(game, player, amount) {
  const actual = Math.min(amount, player.chips);
  player.chips -= actual;
  player.bet = actual;
  player.totalBet = actual;
  game.pot += actual;
  if (player.chips === 0) player.allIn = true;
}

function getActivePlayers(game) {
  return game.players.filter(p => !p.folded && p.chips > 0 || (!p.folded && p.allIn));
}

function getPlayersInHand(game) {
  return game.players.filter(p => !p.folded);
}

async function handlePlayerAction(message, game, player, input, api, usersData) {
  const active = getActivePlayers(game);
  const inHand = getPlayersInHand(game);

  // Parser l'action
  let action = null, raiseAmount = 0;

  if (["fold", "f", "coucher", "passer"].includes(input)) action = "fold";
  else if (["check", "c", "checker"].includes(input)) action = "check";
  else if (["call", "suivre", "suiv"].includes(input)) action = "call";
  else if (input === "allin" || input === "all" || input === "tapis") action = "allin";
  else if (input.startsWith("raise") || input.startsWith("relance") || input.startsWith("bet") || input.startsWith("r ")) {
    action = "raise";
    raiseAmount = parseInt(input.replace(/[^\d]/g, ""), 10) || 0;
  } else {
    await publishState(message, game, `❓ Action invalide. Tapez : check | call | raise X | fold | allin`);
    return;
  }

  // Valider et appliquer
  const callAmount = game.currentBet - player.bet;

  if (action === "fold") {
    player.folded = true;
    game.log.unshift(`${player.name} se couche.`);
  } else if (action === "check") {
    if (callAmount > 0) {
      await publishState(message, game, `❌ Vous ne pouvez pas checker — mise actuelle : $${game.currentBet}. Tapez call, raise ou fold.`);
      return;
    }
    game.log.unshift(`${player.name} check.`);
  } else if (action === "call") {
    const actual = Math.min(callAmount, player.chips);
    player.chips -= actual;
    player.bet += actual;
    player.totalBet += actual;
    game.pot += actual;
    if (player.chips === 0) player.allIn = true;
    game.log.unshift(`${player.name} suit ($${actual}).`);
  } else if (action === "raise") {
    const minRaise = game.currentBet + game.lastRaise;
    const totalNeeded = raiseAmount;
    if (totalNeeded < minRaise && player.chips + player.bet >= minRaise) {
      await publishState(message, game, `❌ Relance minimum : $${minRaise}. Tapez raise ${minRaise} ou plus.`);
      return;
    }
    const actualRaise = Math.min(totalNeeded, player.chips + player.bet);
    const toAdd = actualRaise - player.bet;
    player.chips -= toAdd;
    player.totalBet += toAdd;
    game.lastRaise = actualRaise - game.currentBet;
    game.currentBet = actualRaise;
    player.bet = actualRaise;
    game.pot += toAdd;
    if (player.chips === 0) player.allIn = true;
    game.playersActed = new Set([player.id]); // reset — tout le monde doit réagir
    game.log.unshift(`${player.name} relance à $${actualRaise}.`);
  } else if (action === "allin") {
    const total = player.chips + player.bet;
    const toAdd = player.chips;
    game.pot += toAdd;
    player.totalBet += toAdd;
    if (total > game.currentBet) {
      game.lastRaise = total - game.currentBet;
      game.currentBet = total;
      game.playersActed = new Set([player.id]);
    }
    player.bet = total;
    player.chips = 0;
    player.allIn = true;
    game.log.unshift(`${player.name} est ALL-IN ($${total}) !`);
  }

  game.playersActed.add(player.id);
  game.actionCount++;
  game.updatedAt = Date.now();

  // Vérifier si la main est terminée (tout le monde sauf un s'est couché)
  const stillIn = getPlayersInHand(game);
  if (stillIn.length === 1) {
    stillIn[0].chips += game.pot;
    game.log.unshift(`${stillIn[0].name} remporte le pot de $${game.pot} (tous les autres se sont couchés).`);
    const msg = `🏆 ${stillIn[0].name} remporte $${game.pot} !`;
    await publishState(message, game, msg);
    await sleep(1500);
    const canContinue = dealNewHand(game);
    if (!canContinue || game.players.filter(p => p.chips > 0).length < 2) {
      await endSession(message, game, usersData);
      return;
    }
    await publishState(message, game, `🃏 Nouvelle main #${game.handNumber} — ${game.players[game.turnIndex].name} commence.`);
    await runBots(message, game, api, usersData);
    return;
  }

  // Avancer le tour ou passer à l'étape suivante
  const roundOver = isRoundOver(game);
  if (roundOver) {
    await advanceStage(message, game, api, usersData);
  } else {
    nextTurn(game);
    const next = game.players[game.turnIndex];
    await publishState(message, game, `✅ ${player.name} → ${actionLabel(action, raiseAmount)}. C'est à ${next.name}.`);
    await runBots(message, game, api, usersData);
  }
}

function actionLabel(action, amount) {
  if (action === "fold") return "se couche";
  if (action === "check") return "check";
  if (action === "call") return "suit";
  if (action === "raise") return `relance $${amount}`;
  if (action === "allin") return "ALL-IN";
  return action;
}

function isRoundOver(game) {
  const stillIn = getPlayersInHand(game);
  const notAllIn = stillIn.filter(p => !p.allIn);
  if (notAllIn.length === 0) return true;
  // Tout le monde a misé autant et tout le monde a agi
  const allCalled = stillIn.every(p => p.allIn || p.bet === game.currentBet);
  const allActed = stillIn.every(p => p.allIn || game.playersActed.has(p.id));
  return allCalled && allActed;
}

function nextTurn(game) {
  const n = game.players.length;
  let tries = 0;
  do {
    game.turnIndex = (game.turnIndex + 1) % n;
    tries++;
  } while (tries < n && (game.players[game.turnIndex].folded || game.players[game.turnIndex].allIn));
}

async function advanceStage(message, game, api, usersData) {
  // Reset bets pour nouveau tour d'enchères
  for (const p of game.players) p.bet = 0;
  game.currentBet = 0;
  game.lastRaise = BIG_BLIND;
  game.playersActed = new Set();
  game.actionCount = 0;

  const stages = ["preflop", "flop", "turn", "river", "showdown"];
  const currentIdx = stages.indexOf(game.stage);
  game.stage = stages[currentIdx + 1] || "showdown";

  if (game.stage === "flop") {
    game.communityCards.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
    game.log.unshift(`🃏 Flop : ${game.communityCards.map(cardStr).join(" ")}`);
  } else if (game.stage === "turn") {
    game.communityCards.push(game.deck.pop());
    game.log.unshift(`🃏 Turn : ${cardStr(game.communityCards[3])}`);
  } else if (game.stage === "river") {
    game.communityCards.push(game.deck.pop());
    game.log.unshift(`🃏 River : ${cardStr(game.communityCards[4])}`);
  }

  if (game.stage === "showdown") {
    await doShowdown(message, game, usersData);
    return;
  }

  // Premier à parler après dealer
  const active = getPlayersInHand(game).filter(p => !p.allIn);
  if (active.length === 0) {
    // Tout le monde est all-in — révéler les cartes directement
    while (game.stage !== "showdown") {
      const s = ["preflop", "flop", "turn", "river", "showdown"];
      const i = s.indexOf(game.stage);
      game.stage = s[i + 1];
      if (game.stage === "flop") game.communityCards.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
      else if (game.stage === "turn" || game.stage === "river") game.communityCards.push(game.deck.pop());
    }
    await doShowdown(message, game, usersData);
    return;
  }

  const dealerPos = game.dealerIndex;
  const n = game.players.length;
  let firstIdx = (dealerPos + 1) % n;
  let tries = 0;
  while ((game.players[firstIdx].folded || game.players[firstIdx].allIn) && tries < n) {
    firstIdx = (firstIdx + 1) % n;
    tries++;
  }
  game.turnIndex = firstIdx;

  const stageNames = { flop: "Flop", turn: "Turn", river: "River" };
  const label = stageNames[game.stage] || game.stage;
  await publishState(message, game, `🃏 ${label} révélé ! C'est à ${game.players[game.turnIndex].name} de jouer.`);
  await runBots(message, game, api, usersData);
}

async function doShowdown(message, game, usersData) {
  const inHand = getPlayersInHand(game);
  const results = inHand.map(p => ({
    player: p,
    best: bestHand([...p.hand, ...game.communityCards])
  }));

  results.sort((a, b) => compareHands(b.best, a.best));
  const winnerResult = results[0];
  const winner = winnerResult.player;

  winner.chips += game.pot;
  const handName = winnerResult.best.name;
  game.log.unshift(`🏆 ${winner.name} remporte $${game.pot} avec ${handName} !`);

  const revealLines = results.map(r => `${r.player.name}: ${r.player.hand.map(cardStr).join(" ")} → ${r.best.name}`).join("\n");
  const winMsg = `🏆 ${winner.name} gagne $${game.pot} avec ${handName} !\n\n${revealLines}`;

  game.stage = "showdown";
  await publishState(message, game, winMsg);
  await sleep(2000);

  // Vérifier s'il reste des joueurs avec des jetons
  const canContinue = dealNewHand(game);
  if (!canContinue || game.players.filter(p => p.chips > 0).length < 2) {
    await endSession(message, game, usersData);
    return;
  }
  await publishState(message, game, `🃏 Nouvelle main #${game.handNumber} — Dealer: ${game.players[game.dealerIndex].name}.`);
  await runBots(message, game, api, usersData);
}

async function endSession(message, game, usersData) {
  const ranked = [...game.players].sort((a, b) => b.chips - a.chips);
  const winner = ranked[0];
  let endMsg = `🏆 FIN DE PARTIE — ${winner.name} remporte la session !\n\nClassement :\n`;
  ranked.forEach((p, i) => { endMsg += `${i + 1}. ${p.name} : $${p.chips.toLocaleString()}\n`; });
  endGame(game);
  await publishState(message, game, endMsg);
}

// ─────────────────────────────────────────────
//  BOT IA
// ─────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (activeGames.get(game.key) === game && game.players[game.turnIndex]?.bot && safety < 40) {
    safety++;
    await sleep(BOT_THINK_DELAY);

    const bot = game.players[game.turnIndex];
    if (bot.folded || bot.allIn) { nextTurn(game); continue; }

    const action = chooseBotAction(game, bot);
    await applyBotAction(game, bot, action);

    const stillIn = getPlayersInHand(game);
    if (stillIn.length === 1) {
      stillIn[0].chips += game.pot;
      game.log.unshift(`${stillIn[0].name} remporte $${game.pot}.`);
      await publishState(message, game, `🏆 ${stillIn[0].name} remporte $${game.pot} !`);
      await sleep(1500);
      const ok = dealNewHand(game);
      if (!ok || game.players.filter(p => p.chips > 0).length < 2) { await endSession(message, game, usersData); return; }
      await publishState(message, game, `🃏 Nouvelle main #${game.handNumber}`);
      continue;
    }

    if (isRoundOver(game)) {
      await advanceStage(message, game, api, usersData);
      return;
    }
    nextTurn(game);

    if (!game.players[game.turnIndex]?.bot) {
      const next = game.players[game.turnIndex];
      await publishState(message, game, `🤖 ${bot.name} → ${action.label}. C'est à vous, ${next.name} !`);
      return;
    }
  }
  if (activeGames.get(game.key) === game && !game.players[game.turnIndex]?.bot) {
    await publishState(message, game, `👑 À vous de jouer, ${game.players[game.turnIndex].name} ! (check / call / raise X / fold / allin)`);
  }
}

function chooseBotAction(game, bot) {
  const handStrength = evaluateBotHand(bot.hand, game.communityCards);
  const callAmount = game.currentBet - bot.bet;
  const potOdds = game.pot > 0 ? callAmount / (game.pot + callAmount) : 0;
  const r = Math.random();

  // Agression basée sur la force de la main
  if (handStrength >= 0.8) {
    // Très bonne main — relancer souvent
    if (r < 0.7) {
      const raise = game.currentBet + Math.floor(game.pot * 0.6);
      const capped = Math.min(raise, bot.chips + bot.bet);
      if (capped > game.currentBet && bot.chips > 0) {
        return { type: "raise", amount: capped, label: `relance $${capped}` };
      }
    }
    return { type: "call", label: "suit" };
  } else if (handStrength >= 0.55) {
    // Bonne main — call ou petite relance
    if (callAmount === 0) {
      if (r < 0.4) {
        const raise = game.currentBet + BIG_BLIND * 2;
        const capped = Math.min(raise, bot.chips + bot.bet);
        if (capped > game.currentBet) return { type: "raise", amount: capped, label: `relance $${capped}` };
      }
      return { type: "check", label: "check" };
    }
    if (potOdds < handStrength && r < 0.75) return { type: "call", label: "suit" };
    return { type: "fold", label: "se couche" };
  } else if (handStrength >= 0.35) {
    // Main passable
    if (callAmount === 0) return { type: "check", label: "check" };
    if (callAmount <= BIG_BLIND * 2 && r < 0.5) return { type: "call", label: "suit" };
    return r < 0.3 ? { type: "call", label: "suit" } : { type: "fold", label: "se couche" };
  } else {
    // Mauvaise main — bluff occasionnel
    if (callAmount === 0) {
      if (r < 0.15) {
        const bluff = game.currentBet + Math.floor(game.pot * 0.4);
        const capped = Math.min(bluff, bot.chips + bot.bet);
        if (capped > game.currentBet) return { type: "raise", amount: capped, label: `bluff $${capped}` };
      }
      return { type: "check", label: "check" };
    }
    return r < 0.2 ? { type: "call", label: "suit" } : { type: "fold", label: "se couche" };
  }
}

function evaluateBotHand(hand, community) {
  if (!hand || hand.length === 0) return 0.3;
  const all = [...hand, ...community];
  const best = bestHand(all);
  const scores = {
    "Quinte Flush Royale": 1.0, "Quinte Flush": 0.97, "Carré": 0.93,
    "Full House": 0.87, "Couleur": 0.82, "Quinte": 0.75,
    "Brelan": 0.65, "Deux Paires": 0.55, "Paire": 0.40, "Carte Haute": 0.20
  };
  return scores[best.name] || 0.2;
}

async function applyBotAction(game, bot, action) {
  const callAmount = game.currentBet - bot.bet;
  if (action.type === "fold") {
    bot.folded = true;
    game.log.unshift(`🤖 ${bot.name} se couche.`);
  } else if (action.type === "check") {
    game.log.unshift(`🤖 ${bot.name} check.`);
  } else if (action.type === "call") {
    const actual = Math.min(callAmount, bot.chips);
    bot.chips -= actual;
    bot.bet += actual;
    bot.totalBet += actual;
    game.pot += actual;
    if (bot.chips === 0) bot.allIn = true;
    game.log.unshift(`🤖 ${bot.name} suit ($${actual}).`);
  } else if (action.type === "raise") {
    const toAdd = action.amount - bot.bet;
    const actual = Math.min(toAdd, bot.chips);
    bot.chips -= actual;
    bot.totalBet += actual;
    game.lastRaise = action.amount - game.currentBet;
    game.currentBet = Math.min(action.amount, bot.bet + actual);
    bot.bet = game.currentBet;
    game.pot += actual;
    if (bot.chips === 0) bot.allIn = true;
    game.playersActed = new Set([bot.id]);
    game.log.unshift(`🤖 ${bot.name} relance à $${game.currentBet}.`);
  }
  game.playersActed.add(bot.id);
  game.updatedAt = Date.now();
}

// ─────────────────────────────────────────────
//  ÉVALUATION DES MAINS
// ─────────────────────────────────────────────
function cardStr(card) {
  if (!card) return "??";
  return `${card.rank}${card.suit}`;
}

function bestHand(cards) {
  if (!cards || cards.length === 0) return { name: "Carte Haute", value: 0, ranks: [] };
  const combos = getCombinations(cards, Math.min(5, cards.length));
  let best = null;
  for (const combo of combos) {
    const eval_ = evaluateHand(combo);
    if (!best || compareHands(eval_, best) > 0) best = eval_;
  }
  return best || evaluateHand(cards.slice(0, 5));
}

function getCombinations(arr, k) {
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map(x => [x]);
  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = getCombinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) result.push([arr[i], ...combo]);
  }
  return result;
}

function evaluateHand(cards) {
  const ranks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const rankCounts = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = uniqueRanks.length === 5 &&
    (uniqueRanks[0] - uniqueRanks[4] === 4 ||
     (uniqueRanks[0] === 14 && uniqueRanks[1] === 5)); // As-bas

  let name, value;
  if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 13) { name = "Quinte Flush Royale"; value = 9; }
  else if (isFlush && isStraight) { name = "Quinte Flush"; value = 8; }
  else if (counts[0] === 4) { name = "Carré"; value = 7; }
  else if (counts[0] === 3 && counts[1] === 2) { name = "Full House"; value = 6; }
  else if (isFlush) { name = "Couleur"; value = 5; }
  else if (isStraight) { name = "Quinte"; value = 4; }
  else if (counts[0] === 3) { name = "Brelan"; value = 3; }
  else if (counts[0] === 2 && counts[1] === 2) { name = "Deux Paires"; value = 2; }
  else if (counts[0] === 2) { name = "Paire"; value = 1; }
  else { name = "Carte Haute"; value = 0; }

  return { name, value, ranks, counts };
}

function compareHands(a, b) {
  if (a.value !== b.value) return a.value - b.value;
  for (let i = 0; i < Math.max(a.ranks.length, b.ranks.length); i++) {
    const ar = a.ranks[i] || 0, br = b.ranks[i] || 0;
    if (ar !== br) return ar - br;
  }
  return 0;
}

// ─────────────────────────────────────────────
//  GESTION DES PARTIES
// ─────────────────────────────────────────────
function cleanupExpiredGames() {
  const now = Date.now();
  for (const game of activeGames.values()) {
    if (now - game.updatedAt > GAME_EXPIRE_MS) endGame(game);
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }
}

function endGamesForThread(threadID, senderID, usersData) {
  let count = 0;
  for (const game of [...activeGames.values()]) {
    if (game.threadID === threadID && game.players.some(p => p.id === senderID)) {
      refundAll(game, usersData);
      endGame(game);
      count++;
    }
  }
  return count;
}

async function refundAll(game, usersData) {
  if (!usersData) return;
  for (const p of game.players.filter(p => !p.bot)) {
    try {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money || 0) + p.chips });
    } catch (e) { console.error("[Poker] Remboursement:", e); }
  }
}

async function getUserName(api, usersData, userID) {
  if (userID.startsWith("bot_")) return userID;
  try {
    if (usersData?.getName) return await usersData.getName(userID);
    const info = await api.getUserInfo(userID);
    return info[userID]?.name || "Joueur";
  } catch { return "Joueur"; }
}

// ─────────────────────────────────────────────
//  RENDU CANVAS
// ─────────────────────────────────────────────
async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const current = game.players[game.turnIndex];
  const text = formatDetails(game, body);

  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }

  const tmpPath = path.join(os.tmpdir(), `poker_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderPoker(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch (err) {
    console.error("[Poker] Canvas error:", err);
    return message.reply(fonts.bold(`🃏 ${body}`));
  }

  const mentions = (current && !current.bot && current.id) ? [{ id: current.id, tag: current.name }] : [];
  return new Promise(resolve => {
    message.reply({ body: text, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      if (err) { console.error("[Poker] Send error:", err); resolve(); return; }
      game.replyMessageID = info.messageID;
      if (activeGames.get(game.key) === game && current && !current.bot && global.GoatBot?.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: game.commandName,
          messageID: info.messageID,
          author: current.id,
          threadID: game.threadID,
          gameKey: game.key,
          gameID: game.id
        });
      }
      resolve();
    });
  });
}

function formatDetails(game, body) {
  const current = game.players[game.turnIndex];
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  const lines = [];
  lines.push(`🃏 POKER ROYAL — Texas Hold'em`);
  lines.push(`⏱ ${elapsed}m  |  Main #${game.handNumber}  |  Pot : $${game.pot.toLocaleString()}`);
  lines.push(`🎯 Tour : ${game.stage.toUpperCase()} | Mise actuelle : $${game.currentBet}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  if (game.communityCards.length > 0) {
    lines.push(`🃏 Cartes communes : ${game.communityCards.map(cardStr).join("  ")}`);
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  game.players.forEach((p, i) => {
    const arrow = i === game.turnIndex && !p.folded ? " ◄ TON TOUR" : "";
    const status = p.folded ? " [COUCHÉ]" : p.allIn ? " [ALL-IN]" : "";
    lines.push(`${p.bot ? "🤖" : "👤"} ${p.name}${status}${arrow} — $${p.chips.toLocaleString()}`);
    if (!p.bot && !p.folded && p.hand.length > 0) {
      lines.push(`   Main : ${p.hand.map(cardStr).join("  ")}`);
    }
  });
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  if (current && !current.bot && !current.folded) {
    lines.push(`⚡ Actions : check | call ($${game.currentBet - current.bet}) | raise X | fold | allin`);
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  game.log.slice(0, 4).forEach(l => lines.push(`• ${l}`));
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(body);
  return lines.join("\n");
}

// ─────────────────────────────────────────────
//  CANVAS RENDERING
// ─────────────────────────────────────────────
function renderPoker(game, banner) {
  const W = 1200, H = 1700;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Fond feutré (vert casino)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1f0a");
  bg.addColorStop(0.4, "#0d2b0d");
  bg.addColorStop(0.8, "#071a07");
  bg.addColorStop(1, "#030f03");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Texture feutre
  drawFeltTexture(ctx, W, H);
  // Bordure or
  drawGoldBorder(ctx, W, H);
  // Header
  drawPokerHeader(ctx, game, banner, W);
  // Table ovale
  drawOvalTable(ctx, W);
  // Cartes communes
  drawCommunityCards(ctx, game, W);
  // Pot
  drawPotDisplay(ctx, game, W);
  // Joueurs
  drawPlayerSeats(ctx, game, W, H);
  // Log
  drawLogPanel(ctx, game, W, H);
  // Banner
  drawBannerStrip(ctx, banner, W, H);

  return canvas;
}

function drawFeltTexture(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let x = 0; x < W; x += 4) {
    for (let y = 0; y < H; y += 4) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  ctx.restore();
}

function drawGoldBorder(ctx, W, H) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#c9a84c");
  grad.addColorStop(0.3, "#f0d060");
  grad.addColorStop(0.6, "#c9a84c");
  grad.addColorStop(1, "#a07828");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 12;
  roundRectPath(ctx, 10, 10, W - 20, H - 20, 40);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f0d060aa";
  roundRectPath(ctx, 20, 20, W - 40, H - 40, 35);
  ctx.stroke();
  ctx.restore();
}

function drawPokerHeader(ctx, game, banner, W) {
  // Panel header
  ctx.save();
  const hGrad = ctx.createLinearGradient(0, 35, 0, 145);
  hGrad.addColorStop(0, "#1a0a00");
  hGrad.addColorStop(1, "#0d0500");
  roundRect(ctx, 40, 35, W - 80, 115, 20, null, null, 0);
  ctx.fillStyle = hGrad; ctx.fill();
  ctx.strokeStyle = "#c9a84c88"; ctx.lineWidth = 2;
  roundRect(ctx, 40, 35, W - 80, 115, 20, null, null, 0);
  ctx.stroke();

  // Logo
  ctx.font = "bold 52px PokerFont";
  const logoGrad = ctx.createLinearGradient(55, 60, 55, 120);
  logoGrad.addColorStop(0, "#f0d060");
  logoGrad.addColorStop(0.5, "#c9a84c");
  logoGrad.addColorStop(1, "#f0d060");
  ctx.fillStyle = logoGrad;
  ctx.fillText("♠ POKER ROYAL ♥", 55, 105);

  // Stats
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  ctx.font = "bold 20px PokerFont";
  ctx.fillStyle = "#c9a84c";
  const statsText = `Main #${game.handNumber}  |  ${elapsed}m  |  ${game.players.length} joueurs`;
  ctx.fillText(statsText, 55, 130);

  // Stage badge
  const stageColors = { preflop: "#3b82f6", flop: "#22c55e", turn: "#f59e0b", river: "#ef4444", showdown: "#8b5cf6" };
  const stageColor = stageColors[game.stage] || "#64748b";
  const stageLabel = game.stage.toUpperCase();
  ctx.font = "bold 18px PokerFont";
  const sw = ctx.measureText(stageLabel).width + 28;
  roundRect(ctx, W - 80 - sw, 58, sw, 32, 8, stageColor, null, 0);
  ctx.fillStyle = stageColor; ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(stageLabel, W - 80 - sw + 14, 80);
  ctx.restore();
}

function drawOvalTable(ctx, W) {
  const cx = W / 2, cy = 620, rx = 490, ry = 230;
  ctx.save();
  // Ombre
  ctx.shadowColor = "#000000cc"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  // Table
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 10, ry + 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#8B4513";
  ctx.fill();
  ctx.restore();

  // Feutrine
  ctx.save();
  const feltGrad = ctx.createRadialGradient(cx, cy - 30, 50, cx, cy, rx);
  feltGrad.addColorStop(0, "#1a5c1a");
  feltGrad.addColorStop(0.6, "#145014");
  feltGrad.addColorStop(1, "#0d360d");
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = feltGrad;
  ctx.fill();

  // Bordure table
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#f0d06066";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 20, ry - 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCommunityCards(ctx, game, W) {
  const cx = W / 2;
  const totalCards = 5;
  const cardW = 90, cardH = 128, gap = 14;
  const totalW = totalCards * cardW + (totalCards - 1) * gap;
  const startX = cx - totalW / 2;
  const y = 510;

  for (let i = 0; i < totalCards; i++) {
    const x = startX + i * (cardW + gap);
    const card = game.communityCards[i];
    if (card) {
      drawCard(ctx, x, y, cardW, cardH, card);
    } else {
      drawCardBack(ctx, x, y, cardW, cardH, 0.25);
    }
  }

  // Label
  ctx.save();
  ctx.font = "bold 18px PokerFont";
  ctx.fillStyle = "#c9a84caa";
  ctx.textAlign = "center";
  ctx.fillText("CARTES COMMUNES", cx, y - 18);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawCard(ctx, x, y, w, h, card) {
  ctx.save();
  // Ombre
  ctx.shadowColor = "#000000aa"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  // Fond
  roundRect(ctx, x, y, w, h, 10, "#ffffff", null, 0);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.restore();

  // Bordure
  ctx.save();
  roundRect(ctx, x, y, w, h, 10, null, "#cccccc", 1.5);
  ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 10, null, null, 0);
  ctx.stroke();

  const isRed = card.suit === "♥" || card.suit === "♦";
  const color = isRed ? "#dc2626" : "#111827";

  // Rang coin haut-gauche
  ctx.font = `bold ${card.rank === "10" ? 22 : 26}px PokerFont`;
  ctx.fillStyle = color;
  ctx.fillText(card.rank, x + 8, y + 28);
  ctx.font = "24px PokerFont";
  ctx.fillText(card.suit, x + 8, y + 52);

  // Rang coin bas-droite (retourné)
  ctx.save();
  ctx.translate(x + w - 8, y + h - 10);
  ctx.rotate(Math.PI);
  ctx.font = `bold ${card.rank === "10" ? 22 : 26}px PokerFont`;
  ctx.fillStyle = color;
  ctx.fillText(card.rank, 0, 0);
  ctx.restore();

  // Grand symbole central
  ctx.font = `${Math.floor(h * 0.38)}px PokerFont`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(card.suit, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "#000000aa"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, 10, "#1e3a8a", null, 0);
  ctx.fillStyle = "#1e3a8a"; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6, null, "#c9a84c", 1.5);
  ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 1.5;
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6, null, null, 0);
  ctx.stroke();
  ctx.font = "bold 22px PokerFont";
  ctx.fillStyle = "#c9a84c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♠", x + w / 2, y + h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawPotDisplay(ctx, game, W) {
  const cx = W / 2;
  ctx.save();
  ctx.font = "bold 32px PokerFont";
  ctx.textAlign = "center";
  const potGrad = ctx.createLinearGradient(cx - 100, 670, cx + 100, 670);
  potGrad.addColorStop(0, "#f0d060");
  potGrad.addColorStop(0.5, "#ffffff");
  potGrad.addColorStop(1, "#f0d060");
  ctx.fillStyle = potGrad;
  ctx.fillText(`💰 POT : $${game.pot.toLocaleString()}`, cx, 680);
  if (game.currentBet > 0) {
    ctx.font = "bold 20px PokerFont";
    ctx.fillStyle = "#c9a84c";
    ctx.fillText(`Mise courante : $${game.currentBet}`, cx, 710);
  }
  ctx.textAlign = "left";
  ctx.restore();
}

function drawPlayerSeats(ctx, game, W, H) {
  const n = game.players.length;
  const cx = W / 2, tableCY = 620;
  const positions = getSeatPositions(n, cx, tableCY, W, H);

  game.players.forEach((player, i) => {
    const pos = positions[i];
    if (!pos) return;
    drawPlayerSeat(ctx, player, pos, i === game.turnIndex, game);
  });
}

function getSeatPositions(n, cx, cy, W, H) {
  const seats = {
    2: [
      { x: cx, y: 800 },         // bottom
      { x: cx, y: 440 }          // top
    ],
    3: [
      { x: cx, y: 800 },
      { x: 180, y: 480 },
      { x: W - 180, y: 480 }
    ],
    4: [
      { x: cx, y: 820 },
      { x: 160, y: 620 },
      { x: cx, y: 420 },
      { x: W - 160, y: 620 }
    ]
  };
  return seats[n] || seats[4];
}

function drawPlayerSeat(ctx, player, pos, isCurrent, game) {
  const cardW = 72, cardH = 102;
  const panelW = 300, panelH = 130;
  const px = pos.x - panelW / 2, py = pos.y;

  ctx.save();
  // Surbrillance si c'est le tour
  if (isCurrent && !player.folded) {
    ctx.shadowColor = "#f0d060";
    ctx.shadowBlur = 30;
  }

  // Panel joueur
  const panelBg = player.folded ? "#1a1a1a55" : isCurrent ? "#1a0a0055" : "#0d1a0d99";
  const panelBorder = player.folded ? "#33333366" : isCurrent ? "#f0d060" : "#22c55e88";
  roundRect(ctx, px, py, panelW, panelH, 16, panelBg, panelBorder, isCurrent ? 3 : 1.5);
  ctx.fillStyle = panelBg; ctx.fill();
  if (isCurrent && !player.folded) {
    ctx.strokeStyle = "#f0d060"; ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = panelBorder; ctx.lineWidth = 1.5;
  }
  roundRect(ctx, px, py, panelW, panelH, 16, null, null, 0);
  ctx.stroke();
  ctx.restore();

  // Nom
  ctx.save();
  ctx.font = "bold 21px PokerFont";
  ctx.fillStyle = player.folded ? "#64748b" : isCurrent ? "#f0d060" : "#e2e8f0";
  const nameStr = (player.bot ? "🤖 " : "👤 ") + player.name.slice(0, 14) + (player.name.length > 14 ? "…" : "");
  ctx.fillText(nameStr, px + 14, py + 28);

  // Chips
  ctx.font = "bold 20px PokerFont";
  ctx.fillStyle = "#22c55e";
  ctx.fillText(`$${player.chips.toLocaleString()}`, px + 14, py + 54);

  // Status
  if (player.folded) {
    ctx.font = "bold 18px PokerFont"; ctx.fillStyle = "#ef444488";
    ctx.fillText("COUCHÉ", px + 14, py + 78);
  } else if (player.allIn) {
    ctx.font = "bold 18px PokerFont"; ctx.fillStyle = "#f59e0b";
    ctx.fillText("⚡ ALL-IN", px + 14, py + 78);
  } else if (player.bet > 0) {
    ctx.font = "18px PokerFont"; ctx.fillStyle = "#c9a84c";
    ctx.fillText(`Mise : $${player.bet}`, px + 14, py + 78);
  }

  // Dealer button
  if (game.dealerIndex !== undefined) {
    const dealers = game.players.filter(p => p.chips > 0 || p.allIn);
    const dealerPlayer = dealers[game.dealerIndex % dealers.length];
    if (dealerPlayer && dealerPlayer.id === player.id) {
      ctx.beginPath(); ctx.arc(px + panelW - 22, py + 22, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#f0d060"; ctx.fill();
      ctx.font = "bold 14px PokerFont"; ctx.fillStyle = "#000";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("D", px + panelW - 22, py + 22);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }
  }

  ctx.restore();

  // Cartes du joueur
  if (!player.folded && player.hand.length > 0) {
    const cardsX = pos.x - (cardW + 8);
    const cardsY = py + panelH + 10;
    if (player.bot) {
      drawCardBack(ctx, cardsX, cardsY, cardW, cardH);
      drawCardBack(ctx, cardsX + cardW + 8, cardsY, cardW, cardH);
    } else {
      drawCard(ctx, cardsX, cardsY, cardW, cardH, player.hand[0]);
      drawCard(ctx, cardsX + cardW + 8, cardsY, cardW, cardH, player.hand[1]);
    }
  }
}

function drawLogPanel(ctx, game, W, H) {
  const panelY = H - 320, panelH = 200;
  ctx.save();
  roundRect(ctx, 40, panelY, W - 80, panelH, 18, "#0a0a0a99", "#c9a84c55", 1.5);
  ctx.fillStyle = "#0a0a0a99"; ctx.fill();
  ctx.strokeStyle = "#c9a84c55"; ctx.lineWidth = 1.5;
  roundRect(ctx, 40, panelY, W - 80, panelH, 18, null, null, 0);
  ctx.stroke();

  ctx.font = "bold 18px PokerFont";
  ctx.fillStyle = "#c9a84c";
  ctx.fillText("📜 JOURNAL DE LA MAIN", 65, panelY + 28);

  ctx.font = "19px PokerFont";
  game.log.slice(0, 6).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#f0d060" : i === 1 ? "#e2e8f0" : "#64748b";
    const safe = line.replace(/[^\x20-\x7E]/g, "").trim();
    ctx.fillText("• " + safe.slice(0, 85), 65, panelY + 58 + i * 24);
  });
  ctx.restore();
}

function drawBannerStrip(ctx, banner, W, H) {
  ctx.save();
  const by = H - 105;
  roundRect(ctx, 40, by, W - 80, 60, 14, "#1a0a0099", "#c9a84c", 2);
  ctx.fillStyle = "#1a0a0099"; ctx.fill();
  ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 2;
  roundRect(ctx, 40, by, W - 80, 60, 14, null, null, 0);
  ctx.stroke();

  ctx.font = "bold 24px PokerFont";
  ctx.fillStyle = "#f0d060";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const safe = banner.replace(/[^\x20-\x7E]/g, "♠").trim().slice(0, 80);
  ctx.fillText(safe, W / 2, by + 30);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

// ─────────────────────────────────────────────
//  UTILITAIRES CANVAS
// ─────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
