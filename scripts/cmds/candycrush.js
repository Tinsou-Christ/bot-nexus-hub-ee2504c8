const fs = require("fs-extra");
const path = require("path");

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  fonts = { bold: (t) => t, sansSerif: (t) => t, monospace: (t) => t };
}

function formatMoney(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return "0$";
  amount = Number(amount);
  if (amount === Infinity) return "∞$";
  if (amount === -Infinity) return "-∞$";
  if (!isFinite(amount)) return "NaN$";
  const scales = [
    { value: 1e18, suffix: "Qi" }, { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T" }, { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" }, { value: 1e3, suffix: "K" }
  ];
  const scale = scales.find(s => Math.abs(amount) >= s.value);
  if (scale) {
    const scaled = (amount / scale.value).toFixed(2);
    const clean = scaled.endsWith(".00") ? scaled.slice(0, -3) : scaled;
    return `${amount < 0 ? "-" : ""}${clean}${scale.suffix}$`;
  }
  return `${amount.toLocaleString("en-US")}$`;
}

const ROWS = ["A", "B", "C", "D", "E"];
const CANDIES = ["🍫", "🍬", "🍪", "🍩", "🍉", "🍭", "🍒", "🍓"];

function generateBoard() {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => CANDIES[Math.floor(Math.random() * CANDIES.length)])
  );
}

function displayBoard(board) {
  let out = `${fonts.bold("🍬 CANDY CRUSH 🍬")}\n\n`;
  board.forEach((row, i) => {
    out += `${ROWS[i]} | ${row.join(" ")}  ${i + 1}\n`;
  });
  return out;
}

function getPos(token) {
  return [token.charCodeAt(0) - 65, Number(token[1]) - 1];
}

function swap(board, r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
}

function findMatches(board) {
  const matches = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2]) {
        matches.push([r, c], [r, c + 1], [r, c + 2]);
      }
    }
  }
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 3; r++) {
      if (board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c]) {
        matches.push([r, c], [r + 1, c], [r + 2, c]);
      }
    }
  }
  return matches;
}

function removeMatches(board, matches) {
  matches.forEach(([r, c]) => board[r][c] = "⬜");
}

function dropCandies(board) {
  for (let c = 0; c < 5; c++) {
    for (let r = 4; r >= 0; r--) {
      if (board[r][c] === "⬜") {
        board[r][c] = CANDIES[Math.floor(Math.random() * CANDIES.length)];
      }
    }
  }
}

async function addCoins(uid, coins, usersData) {
  let user = await usersData.get(uid);
  if (!user) user = { money: 0, exp: 0, data: {} };
  user.money = (user.money || 0) + coins;
  await usersData.set(uid, user);
}

async function removeCoins(uid, coins, usersData) {
  let user = await usersData.get(uid);
  if (!user) user = { money: 0, exp: 0, data: {} };
  user.money = Math.max(0, (user.money || 0) - coins);
  await usersData.set(uid, user);
}

async function getTopPlayers(api, usersData) {
  const all = await usersData.getAll();
  const top = all.sort((a, b) => (b.money || 0) - (a.money || 0)).slice(0, 5);
  const result = [];
  for (const u of top) {
    let name = u.name;
    if (!name) {
      try {
        const info = await new Promise((resolve) => {
          api.getUserInfo(u.userID, (err, data) => {
            if (err) resolve(null);
            else resolve(data?.[u.userID]);
          });
        });
        name = info?.name || "Inconnu";
      } catch {
        name = "Inconnu";
      }
    }
    result.push({ username: name, coins: u.money });
  }
  return result;
}

module.exports = {
  config: {
    name: "candycrush",
    aliases: ["cc", "candy"],
    version: "3.2",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "🍬 Jeu Candy Crush avec mise et déplacements directionnels"
    },
    category: "game",
    guide: {
      fr: `${fonts.sansSerif("✨ CANDY CRUSH ✨")}\n` +
           `${fonts.bold("{pn} <mise>")} : commencer une partie\n` +
           `${fonts.bold("{pn} top")} : top 5 des joueurs\n` +
           `Pendant le jeu, répondez avec la case et la direction :\n` +
           `${fonts.monospace("E3 U")} (haut), ${fonts.monospace("B2 D")} (bas), ${fonts.monospace("A1 L")} (gauche), ${fonts.monospace("C5 R")} (droite)`
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { threadID, senderID } = event;

    if (args[0]?.toLowerCase() === "top") {
      const top = await getTopPlayers(api, usersData);
      if (!top.length) return message.reply(fonts.bold("⚡ Aucun joueur pour le moment !"));
      let msg = `${fonts.bold("🏆 TOP 5 CANDY CRUSH 🏆")}\n\n`;
      top.forEach((p, i) => {
        msg += `${i + 1}. ${p.username} — 🍬 ${formatMoney(p.coins)}\n`;
      });
      return message.reply(msg);
    }

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) {
      return message.reply(fonts.bold("❌ Utilisation : candycrush <mise>"));
    }

    const user = await usersData.get(senderID);
    const balance = user?.money || 0;
    if (balance < bet) {
      return message.reply(fonts.bold(`❌ Solde insuffisant. Vous avez ${formatMoney(balance)}.`));
    }

    const board = generateBoard();
    if (!global.candyGame) global.candyGame = {};

    global.candyGame[threadID] = {
      board,
      initiator: senderID,
      lastTime: Date.now(),
      messageID: null,
      bet,
      totalCoins: 0,
      combos: 0
    };

    const gameMsg = await message.reply(
      displayBoard(board) +
      `\n💰 Mise: ${formatMoney(bet)}\n\nRépondez avec votre mouvement :\n${fonts.monospace("E3 U")} (haut), ${fonts.monospace("B2 D")} (bas), ${fonts.monospace("A1 L")} (gauche), ${fonts.monospace("C5 R")} (droite)`
    );

    global.candyGame[threadID].messageID = gameMsg.messageID;

    global.GoatBot.onReply.set(gameMsg.messageID, {
      commandName: this.config.name,
      author: senderID,
      threadID: threadID
    });

    setTimeout(async () => {
      const game = global.candyGame?.[threadID];
      if (game && Date.now() - game.lastTime >= 60000) {
        await removeCoins(game.initiator, game.bet, usersData);
        const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
        await message.reply(endMsg);
        if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
        delete global.candyGame[threadID];
      }
    }, 60000);
  },

  onReply: async function ({ message, event, api, usersData, Reply }) {
    const { threadID, senderID, messageReply } = event;
    if (!messageReply) return;

    const game = global.candyGame?.[threadID];
    if (!game) return;
    if (game.initiator !== senderID) return;

    game.lastTime = Date.now();

    const parts = event.body.trim().toUpperCase().split(/\s+/);
    if (parts.length !== 2) {
      await removeCoins(game.initiator, game.bet, usersData);
      const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
      await message.reply(endMsg);
      if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
      delete global.candyGame[threadID];
      return;
    }

    const [pos, dir] = parts;
    if (!/^[A-E][1-5]$/.test(pos)) {
      await removeCoins(game.initiator, game.bet, usersData);
      const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
      await message.reply(endMsg);
      if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
      delete global.candyGame[threadID];
      return;
    }

    let [r1, c1] = getPos(pos);
    let r2 = r1, c2 = c1;
    if (dir === "U") r2--;
    else if (dir === "D") r2++;
    else if (dir === "L") c2--;
    else if (dir === "R") c2++;
    else {
      await removeCoins(game.initiator, game.bet, usersData);
      const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
      await message.reply(endMsg);
      if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
      delete global.candyGame[threadID];
      return;
    }

    if (r2 < 0 || r2 > 4 || c2 < 0 || c2 > 4) {
      await removeCoins(game.initiator, game.bet, usersData);
      const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
      await message.reply(endMsg);
      if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
      delete global.candyGame[threadID];
      return;
    }

    swap(game.board, r1, c1, r2, c2);

    let reward = 0;
    let combo = 0;
    while (true) {
      const matches = findMatches(game.board);
      if (!matches.length) break;
      combo++;
      game.combos++;
      const r = matches.length * 100 * combo;
      reward += r;
      removeMatches(game.board, matches);
      dropCandies(game.board);
    }

    if (reward === 0) {
      await removeCoins(game.initiator, game.bet, usersData);
      const endMsg = `${fonts.bold("🏁 GAME OVER")}\n\n🔥 Combos: ${game.combos}\n💰 Gagné: ${formatMoney(game.totalCoins)}\n🎲 Mise: ${formatMoney(game.bet)}`;
      await message.reply(endMsg);
      if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
      delete global.candyGame[threadID];
      return;
    }

    game.totalCoins += reward;
    await addCoins(senderID, reward, usersData);

    const newGameMsg = await message.reply(
      displayBoard(game.board) +
      `\n🔥 Combo x${combo}\n💰 +${formatMoney(reward)}\n\nProchain mouvement ?`
    );

    if (game.messageID) api.unsendMessage(game.messageID).catch(() => {});
    game.messageID = newGameMsg.messageID;

    global.GoatBot.onReply.set(newGameMsg.messageID, {
      commandName: this.config.name,
      author: senderID,
      threadID: threadID
    });
  }
};
