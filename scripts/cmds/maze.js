const { createCanvas } = require("canvas");
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

Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),     { family: "MZFont", weight: "bold" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"),  { family: "MZFont", weight: "normal" });
Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"), { family: "MZFont", weight: "600" });

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const GAME_EXPIRE_TIME = 1000 * 60 * 30;
const BOT_DELAY        = 900;

// Tailles de labyrinthe selon le mode
const MAZE_SIZES = {
  small:  { cols: 11, rows: 11, label: "Petit (11x11)"  },
  medium: { cols: 15, rows: 15, label: "Moyen (15x15)"  },
  large:  { cols: 21, rows: 21, label: "Grand (21x21)"  },
};

// Couleurs joueurs
const PLAYER_COLORS = [
  { hex: "#f87171", dark: "#991b1b", label: "Rouge"  },
  { hex: "#60a5fa", dark: "#1e40af", label: "Bleu"   },
  { hex: "#4ade80", dark: "#166534", label: "Vert"   },
  { hex: "#facc15", dark: "#854d0e", label: "Jaune"  },
];

// Directions
const DIRS = {
  up:    { dr: -1, dc: 0, label: "Haut",   key: "u" },
  down:  { dr:  1, dc: 0, label: "Bas",    key: "d" },
  left:  { dr:  0, dc:-1, label: "Gauche", key: "l" },
  right: { dr:  0, dc: 1, label: "Droite", key: "r" },
};

// Alias d'entree
const INPUT_MAP = {
  up: "up", u: "up", haut: "up", h: "up",
  down: "down", d: "down", bas: "down", b: "down",
  left: "left", l: "left", gauche: "left", g: "left",
  right: "right", r: "right", droite: "right",
};

const activeGames = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
//  CONFIG COMMANDE
// ─────────────────────────────────────────────
module.exports = {
  config: {
    name: "maze",
    aliases: ["labyrinthe", "laby", "mz"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "Labyrinthe procédural — exploration tour par tour, Canvas, bot IA, 2-4 joueurs, paris." },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("MAZE ROYAL — Labyrinthe")}\n\n` +
        `${fonts.bold("Modes de jeu :")}\n` +
        `• ${fonts.monospace("maze bot")} : 1v1 contre le bot\n` +
        `• ${fonts.monospace("maze bot 3")} : contre 2 bots\n` +
        `• ${fonts.monospace("maze bot 4")} : contre 3 bots\n` +
        `• ${fonts.monospace("maze 1v1 @joueur")} : duel humain\n` +
        `• ${fonts.monospace("maze 1v1v1 @p2 @p3")} : 3 joueurs\n` +
        `• ${fonts.monospace("maze 1v1v1v1 @p2 @p3 @p4")} : 4 joueurs\n\n` +
        `${fonts.bold("Taille du labyrinthe :")}\n` +
        `• ${fonts.monospace("maze bot")} : moyen (defaut)\n` +
        `• ${fonts.monospace("maze bot small")} : petit (11x11)\n` +
        `• ${fonts.monospace("maze bot large")} : grand (21x21)\n\n` +
        `${fonts.bold("Paris :")}\n` +
        `• ${fonts.monospace("maze 1v1 @joueur 500")} : mise de 500$ chacun\n\n` +
        `${fonts.bold("Deplacement :")}\n` +
        `• ${fonts.monospace("up")} / ${fonts.monospace("u")} / ${fonts.monospace("h")} : aller en haut\n` +
        `• ${fonts.monospace("down")} / ${fonts.monospace("d")} / ${fonts.monospace("b")} : aller en bas\n` +
        `• ${fonts.monospace("left")} / ${fonts.monospace("l")} / ${fonts.monospace("g")} : aller a gauche\n` +
        `• ${fonts.monospace("right")} / ${fonts.monospace("r")} : aller a droite\n\n` +
        `${fonts.bold("Regles :")}\n` +
        `1. Chaque joueur demarre dans un coin different.\n` +
        `2. La sortie est au centre du labyrinthe.\n` +
        `3. Premier a atteindre la sortie gagne.\n` +
        `4. Le labyrinthe est identique pour tous (genere une seule fois).\n` +
        `• ${fonts.monospace("maze stop")} : terminer la partie\n` +
        `• ${fonts.monospace("maze status")} : revoir le plateau`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const mode = (args[0] || "").toLowerCase();

    if (!mode || mode === "help") return message.reply(this.config.guide.fr);

    if (mode === "stop" || mode === "end") {
      const ended = endGamesForThread(event.threadID, event.senderID, usersData);
      if (!ended) return message.reply(fonts.bold("Aucune partie de Maze en cours pour vous ici."));
      return message.reply(fonts.bold(`${ended} partie(s) terminee(s). Paris rembourses.`));
    }

    if (mode === "status") {
      for (const game of activeGames.values()) {
        if (game.threadID === event.threadID && game.players.some(p => p.id === event.senderID)) {
          await publishState(message, game, "Etat du labyrinthe");
          return;
        }
      }
      return message.reply(fonts.bold("Aucune partie en cours pour vous ici."));
    }

    await handleStart({ message, event, args, api, usersData, commandName });
  },

  onReply: async function ({ message, event, Reply, api, usersData }) {
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
        body: fonts.bold(`Ce n'est pas votre tour. C'est a ${current.name}.`),
        mentions: [{ id: current.id, tag: current.name }]
      });
    }

    const raw   = (event.body || "").trim().toLowerCase();
    const input = INPUT_MAP[raw];

    if (raw === "stop" || raw === "end") {
      await refundBets(game, usersData);
      endGame(game);
      return message.reply(fonts.bold("Partie terminee. Paris rembourses."));
    }

    if (!input) {
      const moves = getValidMoves(game, current);
      const hint  = moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ");
      await publishState(message, game, `Direction invalide. Deplacements possibles : ${hint}`);
      return;
    }

    await handleMove(message, game, current, input, api, usersData);
  }
};

// ─────────────────────────────────────────────
//  DEMARRAGE
// ─────────────────────────────────────────────
async function handleStart({ message, event, args, api, usersData, commandName }) {
  const threadID  = event.threadID;
  const senderID  = event.senderID;
  const mode      = (args[0] || "").toLowerCase();
  const isBotGame = mode === "bot" || mode === "bots";
  const humanName = await getUserName(api, usersData, senderID);

  let playerCount = 2;
  if (mode === "1v1")      playerCount = 2;
  else if (mode === "1v1v1")   playerCount = 3;
  else if (mode === "1v1v1v1") playerCount = 4;
  else if (isBotGame) playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  else return message.reply(module.exports.config.guide.fr);

  // Taille du labyrinthe
  const sizeKey  = args.find(a => MAZE_SIZES[a]) || "medium";
  const mazeSize = MAZE_SIZES[sizeKey] || MAZE_SIZES.medium;

  const mentionedIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
  const players = [{ id: senderID, name: humanName, bot: false }];

  for (let i = 0; i < Math.min(mentionedIDs.length, playerCount - 1); i++) {
    const name = await getUserName(api, usersData, mentionedIDs[i]);
    players.push({ id: mentionedIDs[i], name, bot: false });
  }

  const botNames = ["Ariadne Bot", "Daedalus IA", "Minotaure", "Labyris AI"];
  while (players.length < playerCount) {
    players.push({ id: `bot_${players.length}_${Date.now()}`, name: botNames[players.length - 1] || `Bot ${players.length}`, bot: true });
  }

  // Mise
  const betArg = args.find(a => /^\d+$/.test(a) && parseInt(a, 10) > 0);
  const bet    = isBotGame ? 0 : (betArg ? parseInt(betArg, 10) : 0);

  if (bet > 0) {
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      if ((ud?.money || 0) < bet) {
        return message.reply(fonts.bold(`${p.name} n'a pas assez d'argent ! Mise : $${bet} | Balance : $${ud?.money || 0}`));
      }
    }
    for (const p of players.filter(p => !p.bot)) {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money || 0) - bet });
    }
  }

  const game = createGame(threadID, players, commandName, isBotGame, bet, mazeSize);
  activeGames.set(game.key, game);

  const betInfo = bet > 0 ? ` | Mise : $${bet} chacun` : "";
  await publishState(message, game, `Maze demarre ! ${mazeSize.label}.${betInfo} ${players[0].name} commence — u/d/l/r pour se deplacer.`);
  await runBots(message, game, api, usersData);
}

// ─────────────────────────────────────────────
//  CREATION DE PARTIE + GENERATION DU LABYRINTHE
// ─────────────────────────────────────────────
function createGame(threadID, rawPlayers, commandName, botGame, bet, mazeSize) {
  const { cols, rows } = mazeSize;
  const maze = generateMaze(cols, rows);
  const exit = { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };

  // Ouvrir la case de sortie
  maze[exit.r][exit.c] = 0;

  // Coins de depart (dans l'ordre : haut-gauche, bas-droite, haut-droite, bas-gauche)
  const corners = [
    { r: 1, c: 1 },
    { r: rows - 2, c: cols - 2 },
    { r: 1,        c: cols - 2 },
    { r: rows - 2, c: 1        },
  ];

  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const players = rawPlayers.map((p, i) => ({
    ...p,
    color:    PLAYER_COLORS[i] || PLAYER_COLORS[0],
    row:      corners[i].r,
    col:      corners[i].c,
    steps:    0,
    visited:  new Set([`${corners[i].r},${corners[i].c}`]),
    finished: false,
  }));

  // S'assurer que les cases de depart sont libres
  players.forEach(p => { maze[p.row][p.col] = 0; });

  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, commandName, botGame,
    players, maze, exit, mazeSize,
    turnIndex: 0,
    moveCount: 0,
    log:       [],
    bet,
    pot:       bet * rawPlayers.filter(p => !p.bot).length,
    winner:    null,
    replyMessageID: null,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Generation du labyrinthe par DFS recursif ──
function generateMaze(cols, rows) {
  // Initialiser : tout en mur
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carve(r, c) {
    maze[r][c] = 0;
    const dirs = shuffle([[-2,0],[2,0],[0,-2],[0,2]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && maze[nr][nc] === 1) {
        maze[r + dr / 2][c + dc / 2] = 0; // Ouvrir le mur entre
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  return maze;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────
//  DEPLACEMENTS
// ─────────────────────────────────────────────
function getValidMoves(game, player) {
  return Object.keys(DIRS).filter(dir => {
    const { dr, dc } = DIRS[dir];
    const nr = player.row + dr, nc = player.col + dc;
    return nr >= 0 && nr < game.mazeSize.rows && nc >= 0 && nc < game.mazeSize.cols && game.maze[nr][nc] === 0;
  });
}

async function handleMove(message, game, player, dir, api, usersData) {
  const { dr, dc, label } = DIRS[dir];
  const nr = player.row + dr, nc = player.col + dc;

  // Verifier si le deplacement est valide
  if (nr < 0 || nr >= game.mazeSize.rows || nc < 0 || nc >= game.mazeSize.cols || game.maze[nr][nc] === 1) {
    const moves = getValidMoves(game, player);
    const hint  = moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ");
    await publishState(message, game, `${player.name} ne peut pas aller ${label}. Mur ! Deplacements possibles : ${hint}`);
    return;
  }

  player.row = nr;
  player.col = nc;
  player.steps++;
  player.visited.add(`${nr},${nc}`);
  game.moveCount++;
  game.log.unshift(`${player.name} (${player.color.label}) va ${label} -> (${nr},${nc})`);

  // Verifier arrivee
  if (nr === game.exit.r && nc === game.exit.c) {
    game.winner = player;
    await payoutWinner(game, usersData);
    const winMsg = buildWinMessage(game);
    endGame(game);
    await publishState(message, game, winMsg);
    return;
  }

  nextTurn(game);
  const next   = game.players[game.turnIndex];
  const moves  = getValidMoves(game, next);
  const hint   = moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ");
  const prompt = next.bot ? `${player.name} avance vers ${label}.` : `${player.name} avance vers ${label}. A ${next.name} — ${hint}`;
  await publishState(message, game, prompt);
  await runBots(message, game, api, usersData);
}

function nextTurn(game) {
  const n = game.players.length;
  let tries = 0;
  do {
    game.turnIndex = (game.turnIndex + 1) % n;
    tries++;
  } while (tries < n && game.players[game.turnIndex].finished);
  game.updatedAt = Date.now();
}

// ─────────────────────────────────────────────
//  BOT IA — BFS vers la sortie
// ─────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (
    activeGames.get(game.key) === game &&
    game.players[game.turnIndex]?.bot &&
    !game.winner &&
    safety < 200
  ) {
    safety++;
    await sleep(BOT_DELAY);
    const bot = game.players[game.turnIndex];
    const dir = getBotMove(game, bot);

    if (!dir) {
      // Bloqué (ne devrait pas arriver avec un labyrinthe parfait)
      nextTurn(game);
      continue;
    }

    const { dr, dc, label } = DIRS[dir];
    bot.row += dr;
    bot.col += dc;
    bot.steps++;
    bot.visited.add(`${bot.row},${bot.col}`);
    game.moveCount++;
    game.log.unshift(`${bot.name} [BOT] va ${label} -> (${bot.row},${bot.col})`);

    if (bot.row === game.exit.r && bot.col === game.exit.c) {
      game.winner = bot;
      await payoutWinner(game, usersData);
      const winMsg = buildWinMessage(game);
      endGame(game);
      await publishState(message, game, winMsg);
      return;
    }

    nextTurn(game);

    if (!game.players[game.turnIndex]?.bot) {
      const next  = game.players[game.turnIndex];
      const moves = getValidMoves(game, next);
      const hint  = moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ");
      await publishState(message, game, `${bot.name} [BOT] avance vers ${label}. A ${next.name} — ${hint}`);
      return;
    }
  }

  if (activeGames.get(game.key) === game && !game.winner && !game.players[game.turnIndex]?.bot) {
    const next  = game.players[game.turnIndex];
    const moves = getValidMoves(game, next);
    const hint  = moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ");
    await publishState(message, game, `A vous, ${next.name} — ${hint}`);
  }
}

function getBotMove(game, bot) {
  // BFS pour trouver le chemin le plus court vers la sortie
  const { rows, cols, maze, exit } = game;
  const start = { r: bot.row, c: bot.col };
  const queue = [{ r: start.r, c: start.c, path: [] }];
  const visited = new Set([`${start.r},${start.c}`]);

  while (queue.length > 0) {
    const { r, c, path } = queue.shift();
    for (const [dir, { dr, dc }] of Object.entries(DIRS)) {
      const nr = r + dr, nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= game.mazeSize.rows || nc < 0 || nc >= game.mazeSize.cols) continue;
      if (game.maze[nr][nc] === 1 || visited.has(key)) continue;
      visited.add(key);
      const newPath = [...path, dir];
      if (nr === exit.r && nc === exit.c) return newPath[0] || null;
      queue.push({ r: nr, c: nc, path: newPath });
    }
  }

  // Fallback : mouvement aleatoire valide
  const moves = getValidMoves(game, bot);
  return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
}

// ─────────────────────────────────────────────
//  FIN DE PARTIE
// ─────────────────────────────────────────────
function buildWinMessage(game) {
  const w = game.winner;
  const ranked = [...game.players].sort((a, b) => {
    if (a === w) return -1;
    if (b === w) return  1;
    // Heuristique : distance a la sortie
    const da = Math.abs(a.row - game.exit.r) + Math.abs(a.col - game.exit.c);
    const db = Math.abs(b.row - game.exit.r) + Math.abs(b.col - game.exit.c);
    return da - db;
  });

  let msg = `VICTOIRE ! ${w.name} (${w.color.label}) sort du labyrinthe en ${w.steps} pas et ${game.moveCount} coups totaux !\n\nClassement :\n`;
  ranked.forEach((p, i) => {
    const pos = ["1er","2e","3e","4e"][i] || `${i+1}e`;
    const dist = Math.abs(p.row - game.exit.r) + Math.abs(p.col - game.exit.c);
    const info = p === w ? `Sorti ! ${p.steps} pas` : `Case (${p.row},${p.col}) — ${dist} cases de la sortie`;
    msg += `${pos} ${p.color.label} ${p.name} : ${info}\n`;
  });
  if (game.bet > 0 && !w.bot) msg += `\nCagnotte remportee : $${game.pot.toLocaleString()} !`;
  return msg;
}

async function payoutWinner(game, usersData) {
  const w = game.winner;
  if (!game.bet || !w || w.bot || !usersData) return;
  try {
    const ud = await usersData.get(w.id);
    await usersData.set(w.id, { money: (ud.money || 0) + game.pot });
  } catch (e) { console.error("[Maze] Paiement:", e); }
}

async function refundBets(game, usersData) {
  if (!game.bet || !usersData) return;
  for (const p of game.players.filter(p => !p.bot)) {
    try {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud.money || 0) + game.bet });
    } catch (e) { console.error("[Maze] Remboursement:", e); }
  }
}

// ─────────────────────────────────────────────
//  GESTION DES PARTIES
// ─────────────────────────────────────────────
function cleanupExpiredGames() {
  const now = Date.now();
  for (const game of activeGames.values()) if (now - game.updatedAt > GAME_EXPIRE_TIME) endGame(game);
}
function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.replyMessageID);
}
function endGamesForThread(threadID, senderID, usersData) {
  let count = 0;
  for (const game of [...activeGames.values()]) {
    if (game.threadID === threadID && game.players.some(p => p.id === senderID)) {
      refundBets(game, usersData); endGame(game); count++;
    }
  }
  return count;
}
async function getUserName(api, usersData, userID) {
  try {
    if (usersData?.getName) return await usersData.getName(userID);
    const info = await api.getUserInfo(userID);
    return info[userID]?.name || "Joueur";
  } catch { return "Joueur"; }
}

// ─────────────────────────────────────────────
//  PUBLICATION D'ETAT
// ─────────────────────────────────────────────
async function publishState(message, game, body) {
  game.updatedAt = Date.now();
  const current = game.players[game.turnIndex] || null;

  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }

  const tmpPath = path.join(os.tmpdir(), `mz_${game.id}_${Date.now()}.png`);
  try {
    const canvas = renderGame(game, body);
    fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
  } catch (err) {
    console.error("[Maze] Canvas:", err);
    return message.reply(fonts.bold(body));
  }

  const details  = formatDetails(game, body);
  const mentions = current && !current.bot ? [{ id: current.id, tag: current.name }] : [];

  return new Promise(resolve => {
    message.reply({ body: details, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      if (err) { console.error("[Maze] Envoi:", err); resolve(); return; }
      game.replyMessageID = info.messageID;
      if (activeGames.get(game.key) === game && current && !current.bot && global.GoatBot?.onReply) {
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
  const elapsed  = Math.floor((Date.now() - game.startedAt) / 60000);
  const current  = game.players[game.turnIndex];
  const lines    = [];

  lines.push("MAZE ROYAL — LABYRINTHE");
  lines.push(`${game.mazeSize.label} | Tour ${game.moveCount} | ${game.players.length} joueurs | ${elapsed}m`);
  if (game.bet > 0) lines.push(`Cagnotte : $${game.pot.toLocaleString()}`);
  lines.push("────────────────────────");
  game.players.forEach((p, i) => {
    const arrow = i === game.turnIndex ? " << TON TOUR" : "";
    const dist  = Math.abs(p.row - game.exit.r) + Math.abs(p.col - game.exit.c);
    lines.push(`${p.color.label} ${p.name}${p.bot ? " [BOT]" : ""}${arrow}`);
    lines.push(`  Pos (${p.row},${p.col}) | ${p.steps} pas | Dist sortie : ${dist}`);
  });
  lines.push("────────────────────────");
  if (current && !current.bot && !game.winner) {
    const moves = getValidMoves(game, current);
    lines.push(`Deplacements : ${moves.map(m => DIRS[m].key + "=" + DIRS[m].label).join(" | ")}`);
  }
  game.log.slice(0, 3).forEach(l => lines.push("  " + l.slice(0, 80)));
  lines.push("────────────────────────");
  lines.push(body);
  return lines.join("\n");
}

// ─────────────────────────────────────────────
//  RENDU CANVAS
// ─────────────────────────────────────────────
function renderGame(game, banner) {
  const { cols, rows } = game.mazeSize;

  // Taille de cellule selon le labyrinthe
  const MAX_BOARD = 960;
  const CELL = Math.floor(MAX_BOARD / Math.max(cols, rows));
  const BW   = cols * CELL;
  const BH   = rows * CELL;

  const PAD    = 50;
  const HEADER = 165;
  const CARDS  = game.players.length <= 2 ? 130 : 240;
  const FOOTER = 72;
  const W      = BW + PAD * 2;
  const H      = HEADER + BH + CARDS + FOOTER + PAD;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  drawBg(ctx, W, H);
  drawBorderGlow(ctx, W, H);
  drawHeader(ctx, game, W, HEADER);
  drawMaze(ctx, game, PAD, HEADER, CELL, BW, BH);
  drawPlayerCards(ctx, game, W, HEADER + BH + PAD + 10, CARDS);
  drawBannerStrip(ctx, banner, W, H - 68);

  return canvas;
}

function drawBg(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#080c12"); g.addColorStop(0.5, "#0d1520"); g.addColorStop(1, "#060a0f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.025;
  for (let x = 20; x < W; x += 28) for (let y = 20; y < H; y += 28) {
    ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
  }
  ctx.restore();
}

function drawBorderGlow(ctx, W, H) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#06b6d4"); g.addColorStop(0.5, "#0891b2"); g.addColorStop(1, "#06b6d4");
  ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.shadowColor = "#06b6d4"; ctx.shadowBlur = 28;
  roundRectPath(ctx, 7, 7, W - 14, H - 14, 34); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = "#06b6d444"; ctx.shadowBlur = 0;
  roundRectPath(ctx, 17, 17, W - 34, H - 34, 28); ctx.stroke();
  ctx.restore();
}

function drawHeader(ctx, game, W, HEADER) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 26, 0, HEADER);
  g.addColorStop(0, "#061a26"); g.addColorStop(1, "#040d14");
  roundRect(ctx, 30, 26, W - 60, HEADER - 36, 20, g, "#06b6d444", 1.5);

  const tg = ctx.createLinearGradient(50, 50, W - 50, 110);
  tg.addColorStop(0, "#67e8f9"); tg.addColorStop(0.5, "#ffffff"); tg.addColorStop(1, "#22d3ee");
  ctx.font = "bold 52px MZFont"; ctx.fillStyle = tg; ctx.shadowColor = "#06b6d4"; ctx.shadowBlur = 22;
  ctx.fillText("MAZE ROYAL", 50, 98); ctx.shadowBlur = 0;

  const elapsed  = Math.floor((Date.now() - game.startedAt) / 60000);
  ctx.font = "bold 20px MZFont"; ctx.fillStyle = "#0e7490";
  ctx.fillText(`${game.mazeSize.label}  |  Tour ${game.moveCount}  |  ${game.players.length} joueurs  |  ${elapsed} min`, 52, 138);

  if (game.bet > 0) {
    ctx.fillStyle = "#22d3ee"; ctx.textAlign = "right";
    ctx.fillText(`Cagnotte : $${game.pot.toLocaleString()}`, W - 44, 138); ctx.textAlign = "left";
  }
  ctx.restore();
}

function drawMaze(ctx, game, bx, by, CELL, BW, BH) {
  const { cols, rows } = game.mazeSize;

  // Fond du labyrinthe
  ctx.save();
  ctx.shadowColor = "#000"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  roundRect(ctx, bx - 4, by - 4, BW + 8, BH + 8, 12, "#050a10", "#06b6d433", 2);
  ctx.restore();

  // Dessiner les cellules
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x   = bx + c * CELL;
      const y   = by + r * CELL;
      const val = game.maze[r][c];

      if (val === 1) {
        // Mur
        const wallGrad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
        wallGrad.addColorStop(0, "#0c2233");
        wallGrad.addColorStop(1, "#071525");
        ctx.fillStyle = wallGrad;
        ctx.fillRect(x, y, CELL, CELL);
        // Bordure subtile
        ctx.strokeStyle = "#06b6d411";
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(x, y, CELL, CELL);
      } else {
        // Couloir
        ctx.fillStyle = "#0d1f30";
        ctx.fillRect(x, y, CELL, CELL);
      }
    }
  }

  // Dessiner les cases visitees de chaque joueur (trace)
  game.players.forEach(p => {
    if (p.visited.size === 0) return;
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (const key of p.visited) {
      const [r, c] = key.split(",").map(Number);
      if (r === p.row && c === p.col) continue; // Position actuelle deja dessinee apres
      const x = bx + c * CELL + 1, y = by + r * CELL + 1;
      ctx.fillStyle = p.color.hex;
      ctx.fillRect(x, y, CELL - 2, CELL - 2);
    }
    ctx.restore();
  });

  // Dessiner la sortie
  {
    const ex = bx + game.exit.c * CELL;
    const ey = by + game.exit.r * CELL;
    ctx.save();
    ctx.shadowColor = "#4ade80"; ctx.shadowBlur = CELL * 1.5;
    const exitGrad = ctx.createRadialGradient(ex + CELL / 2, ey + CELL / 2, 1, ex + CELL / 2, ey + CELL / 2, CELL);
    exitGrad.addColorStop(0, "#4ade80"); exitGrad.addColorStop(1, "#166534");
    ctx.fillStyle = exitGrad;
    ctx.fillRect(ex + 1, ey + 1, CELL - 2, CELL - 2);
    ctx.shadowBlur = 0;
    if (CELL >= 16) {
      ctx.font = `bold ${Math.max(9, CELL * 0.55)}px MZFont`;
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("S", ex + CELL / 2, ey + CELL / 2);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
  }

  // Dessiner les pions des joueurs
  game.players.forEach((p, pi) => {
    const px = bx + p.col * CELL;
    const py = by + p.row * CELL;
    const cx = px + CELL / 2, cy = py + CELL / 2;
    const r  = CELL * 0.38;
    const isCurrent = pi === game.turnIndex;

    ctx.save();
    if (isCurrent) { ctx.shadowColor = p.color.hex; ctx.shadowBlur = CELL * 1.2; }

    // Ombre
    ctx.beginPath(); ctx.arc(cx + 1, cy + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = "#00000077"; ctx.fill();

    // Corps du pion
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const pg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    pg.addColorStop(0, lighten(p.color.hex, 50));
    pg.addColorStop(0.6, p.color.hex);
    pg.addColorStop(1, p.color.dark);
    ctx.fillStyle = pg; ctx.fill();

    // Contour
    ctx.strokeStyle = isCurrent ? "#ffffff" : p.color.hex;
    ctx.lineWidth   = isCurrent ? Math.max(2, CELL * 0.12) : Math.max(1, CELL * 0.07);
    ctx.stroke(); ctx.shadowBlur = 0;

    // Initiale
    if (CELL >= 12) {
      ctx.font = `bold ${Math.max(8, CELL * 0.42)}px MZFont`;
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "#000"; ctx.shadowBlur = 4;
      ctx.fillText(p.name.charAt(0).toUpperCase(), cx, cy + 1);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.shadowBlur = 0;
    }
    ctx.restore();
  });

  // Coins de depart (petits marqueurs)
  const corners = [
    { r: 1, c: 1 }, { r: game.mazeSize.rows - 2, c: game.mazeSize.cols - 2 },
    { r: 1, c: game.mazeSize.cols - 2 }, { r: game.mazeSize.rows - 2, c: 1 },
  ];
  corners.slice(0, game.players.length).forEach((corner, i) => {
    const p = game.players[i];
    if (p.row === corner.r && p.col === corner.c) return; // Joueur encore a l'origine
    const cx = bx + corner.c * CELL + CELL / 2;
    const cy = by + corner.r * CELL + CELL / 2;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = p.color.hex; ctx.fill();
    ctx.restore();
  });
}

function drawPlayerCards(ctx, game, W, startY, CARDS_H) {
  const n     = game.players.length;
  const cols  = n <= 2 ? 2 : 2;
  const gap   = 14;
  const cardW = Math.floor((W - 60 - gap * (cols - 1)) / cols);
  const cardH = Math.floor((CARDS_H - gap * (Math.ceil(n / cols) - 1)) / Math.ceil(n / cols));

  game.players.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx  = 30 + col * (cardW + gap);
    const cy  = startY + row * (cardH + gap);
    const isCurrent = i === game.turnIndex;
    const dist = Math.abs(p.row - game.exit.r) + Math.abs(p.col - game.exit.c);

    ctx.save();
    if (isCurrent) { ctx.shadowColor = p.color.hex; ctx.shadowBlur = 20; }
    const bg = ctx.createLinearGradient(cx, cy, cx + cardW, cy + cardH);
    bg.addColorStop(0, isCurrent ? "#0a1e2e" : "#06101a");
    bg.addColorStop(1, "#040a10");
    roundRect(ctx, cx, cy, cardW, cardH, 14, bg, isCurrent ? p.color.hex : "#0e4a5a", isCurrent ? 3 : 1.5);

    // Barre de couleur gauche
    ctx.fillStyle = p.color.hex; ctx.fillRect(cx, cy, 6, cardH);
    ctx.shadowBlur = 0;

    // Nom
    ctx.font = "bold 20px MZFont"; ctx.fillStyle = isCurrent ? p.color.hex : "#94a3b8";
    ctx.fillText(`${p.color.label}  ${p.name.slice(0, 14)}${p.name.length > 14 ? "..." : ""}${p.bot ? " [BOT]" : ""}`, cx + 18, cy + 26);

    // Stats
    ctx.font = "bold 24px MZFont"; ctx.fillStyle = "#f1f5f9";
    ctx.fillText(`${p.steps} pas`, cx + 18, cy + 56);

    // Barre de progression vers la sortie
    const maxDist = game.mazeSize.rows + game.mazeSize.cols;
    const pct     = Math.max(0, 1 - dist / maxDist);
    const barX = cx + 18, barY = cy + 64, barW = cardW - 36, barH = 10;
    ctx.fillStyle = "#0c1f2e"; roundRect(ctx, barX, barY, barW, barH, 5, "#0c1f2e", null, 0); ctx.fill();
    const pg = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    pg.addColorStop(0, p.color.hex); pg.addColorStop(1, "#4ade80");
    ctx.fillStyle = pg; ctx.shadowColor = p.color.hex; ctx.shadowBlur = 6;
    roundRect(ctx, barX, barY, Math.max(barW * pct, 6), barH, 5, pg, null, 0); ctx.fill();
    ctx.shadowBlur = 0;

    // Distance a la sortie
    ctx.font = "16px MZFont"; ctx.fillStyle = "#64748b";
    ctx.fillText(`Sortie dans ~${dist} cases`, cx + 18, cy + cardH - 12);

    // Badge tour
    if (isCurrent) {
      ctx.font = "bold 16px MZFont"; ctx.fillStyle = p.color.hex; ctx.textAlign = "right";
      ctx.fillText("TON TOUR", cx + cardW - 14, cy + 26); ctx.textAlign = "left";
    }
    ctx.restore();
  });
}

function drawBannerStrip(ctx, text, W, y) {
  ctx.save();
  const g = ctx.createLinearGradient(30, y, W - 30, y);
  g.addColorStop(0, "#061a26"); g.addColorStop(0.5, "#0a2535"); g.addColorStop(1, "#061a26");
  roundRect(ctx, 30, y, W - 60, 58, 14, g, "#06b6d4", 2);
  ctx.font = "bold 22px MZFont"; ctx.fillStyle = "#cffafe";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#06b6d4"; ctx.shadowBlur = 14;
  ctx.fillText(text.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 88), W / 2, y + 29);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.shadowBlur = 0;
  ctx.restore();
}

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────
function lighten(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill)         { ctx.fillStyle   = fill;   ctx.fill();   }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
