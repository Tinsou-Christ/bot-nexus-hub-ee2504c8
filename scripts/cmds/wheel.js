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

function parseAmount(input) {
  if (!input || typeof input !== 'string') return NaN;
  input = input.trim().toLowerCase();
  const match = input.match(/^([\d,.]+)\s*([kmbtq]?)$/i);
  if (!match) return NaN;
  let value = parseFloat(match[1].replace(/,/g, '.'));
  const suffix = match[2];
  const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };
  if (suffix && multipliers[suffix]) value *= multipliers[suffix];
  return isNaN(value) ? NaN : Math.floor(value);
}

const LIMIT_INTERVAL_HOURS = 1;
const MAX_PLAYS = 100;
const MAX_BET = 10_000_000;
const MIN_BET = 1000;

const WHEEL_SEGMENTS = [
  { label: "🏆 JACKPOT", multiplier: 25, probability: 0.015, type: "jackpot", emoji: "🏆", color: "#FFD700" },
  { label: "💎 DIAMOND", multiplier: 10, probability: 0.025, type: "premium", emoji: "💎", color: "#B9F2FF" },
  { label: "🔥 MEGA WIN", multiplier: 7, probability: 0.04, type: "big", emoji: "🔥", color: "#FF7F00" },
  { label: "⭐ GOLD", multiplier: 5, probability: 0.06, type: "medium", emoji: "⭐", color: "#FFD700" },
  { label: "💰 SILVER", multiplier: 3, probability: 0.10, type: "small", emoji: "💰", color: "#C0C0C0" },
  { label: "🔔 BRONZE", multiplier: 2, probability: 0.15, type: "tiny", emoji: "🔔", color: "#CD7F32" },
  { label: "🍀 LUCKY", multiplier: 1.5, probability: 0.20, type: "mini", emoji: "🍀", color: "#00FF00" },
  { label: "➖ BREAK EVEN", multiplier: 1, probability: 0.15, type: "even", emoji: "➖", color: "#808080" },
  { label: "😢 HALF LOSS", multiplier: 0.5, probability: 0.10, type: "loss", emoji: "😢", color: "#FF6B6B" },
  { label: "💸 TOTAL LOSS", multiplier: 0, probability: 0.08, type: "loss", emoji: "💸", color: "#FF0000" },
  { label: "⚡ BANKRUPT", multiplier: 0, probability: 0.07, type: "bankrupt", emoji: "⚡", color: "#800080", fee: 0.15 }
];

const SPECIAL_EVENTS = [
  { name: "DOUBLE TROUBLE", trigger: 0.02, effect: (m) => m * 2 },
  { name: "TRIPLE THREAT", trigger: 0.005, effect: (m) => m * 3 },
  { name: "LUCKY CLOVER", trigger: 0.03, effect: (m) => m + 0.5 },
  { name: "GOLDEN SPIN", trigger: 0.01, effect: (m) => m * 1.5 }
];

module.exports = {
  config: {
    name: "wheel",
    aliases: ["roue", "fortune"],
    version: "5.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "🎡 Roue de la fortune : tournez et gagnez des multiplicateurs, jackpot progressif et événements spéciaux !"
    },
    category: "game",
    guide: {
      fr: `${fonts.sansSerif("✨ WHEEL OF FORTUNE ✨")}\n` +
           `${fonts.bold("{pn} <mise>")} : tourner la roue\n` +
           `${fonts.bold("{pn} info")} : voir les infos\n` +
           `${fonts.bold("{pn} stats")} : vos statistiques\n` +
           `${fonts.bold("{pn} top")} : classement\n` +
           `${fonts.bold("{pn} jackpot")} : montant du jackpot\n\n` +
           `💸 Mise min : ${formatMoney(MIN_BET)} | max : ${formatMoney(MAX_BET)}\n` +
           `🎯 Limite : ${MAX_PLAYS} parties toutes les ${LIMIT_INTERVAL_HOURS} heures`
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID, threadID } = event;
    const sub = args[0]?.toLowerCase();

    if (sub === "info") {
      const infoMsg = `${fonts.bold("🎡 ROUE DE LA FORTUNE v5.0")}\n━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 Mise : ${formatMoney(MIN_BET)} → ${formatMoney(MAX_BET)}\n` +
        `🎯 Limite : ${MAX_PLAYS} tours / ${LIMIT_INTERVAL_HOURS}h\n` +
        `🏆 Jackpot progressif (2% des mises)\n\n` +
        `${fonts.bold("🎯 SEGMENTS")}\n` +
        WHEEL_SEGMENTS.map(s => `   ${s.emoji} ${s.label} x${s.multiplier} (${(s.probability*100).toFixed(1)}%)`).join("\n") +
        `\n\n${fonts.bold("✨ ÉVÉNEMENTS SPÉCIAUX")}\n` +
        `• Multiplicateurs aléatoires (x2-x3)\n` +
        `• Bonus de série\n` +
        `• Jackpot progressif\n\n` +
        `${fonts.bold("📋 COMMANDES")}\n` +
        `• ${fonts.monospace("wheel <mise>")}\n` +
        `• ${fonts.monospace("wheel info")}\n` +
        `• ${fonts.monospace("wheel stats")}\n` +
        `• ${fonts.monospace("wheel top")}\n` +
        `• ${fonts.monospace("wheel jackpot")}`;
      return message.reply(infoMsg);
    }

    if (sub === "stats") {
      let user = await usersData.get(senderID);
      if (!user) user = { money: 0, exp: 0, data: {} };
      const stats = user.data?.wheelStats || {
        totalSpins: 0, totalWon: 0, totalWagered: 0, biggestWin: 0,
        currentStreak: 0, highestStreak: 0, jackpotsWon: 0, lastSpins: []
      };
      const winRate = stats.totalSpins ? ((stats.totalWon / stats.totalWagered) * 100).toFixed(2) : 0;
      const statsMsg = `${fonts.bold("📊 VOS STATISTIQUES")}\n━━━━━━━━━━━━━━━━━━━━\n` +
        `🎡 Tours : ${stats.totalSpins}\n` +
        `💰 Gains totaux : ${formatMoney(stats.totalWon)}\n` +
        `🎯 Mises totales : ${formatMoney(stats.totalWagered)}\n` +
        `📈 Taux de gain : ${winRate}%\n` +
        `🏆 Plus gros gain : ${formatMoney(stats.biggestWin)}\n` +
        `🔥 Série actuelle : ${stats.currentStreak}\n` +
        `⚡ Meilleure série : ${stats.highestStreak}\n` +
        `🎰 Jackpots : ${stats.jackpotsWon || 0}`;
      return message.reply(statsMsg);
    }

    if (sub === "top" || sub === "leaderboard") {
      const allUsers = await usersData.getAll();
      const leaderboard = [];
      for (const uid of Object.keys(allUsers)) {
        const u = allUsers[uid];
        const stats = u.data?.wheelStats;
        if (stats && stats.totalSpins > 0) {
          const netProfit = (stats.totalWon || 0) - (stats.totalWagered || 0);
          leaderboard.push({ name: u.name || "Inconnu", netProfit, totalWon: stats.totalWon, totalSpins: stats.totalSpins, jackpots: stats.jackpotsWon || 0 });
        }
      }
      leaderboard.sort((a, b) => b.netProfit - a.netProfit);
      const top10 = leaderboard.slice(0, 10);
      let topMsg = `${fonts.bold("🏆 TOP 10 WHEEL")}\n━━━━━━━━━━━━━━━━━━━━\n`;
      top10.forEach((p, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "▫️";
        topMsg += `${medal} ${p.name}\n   💰 Profit net : ${formatMoney(p.netProfit)}\n   🎡 Tours : ${p.totalSpins}\n   🏆 Jackpots : ${p.jackpots}\n\n`;
      });
      if (top10.length === 0) topMsg = "📭 Aucun joueur n'a encore tourné la roue.";
      return message.reply(topMsg);
    }

    if (sub === "jackpot") {
      const allUsers = await usersData.getAll();
      let totalJackpot = 0;
      for (const uid of Object.keys(allUsers)) {
        totalJackpot += allUsers[uid].data?.progressiveJackpot || 0;
      }
      const jackMsg = `${fonts.bold("🏆 JACKPOT PROGRESSIF")}\n━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 Montant actuel : ${formatMoney(totalJackpot)}\n` +
        `💎 Minimum gagnable : ${formatMoney(totalJackpot * 0.5)}\n` +
        `🎯 Maximum gagnable : ${formatMoney(totalJackpot * 2)}\n\n` +
        `🔹 2% de chaque mise est ajouté au jackpot.\n` +
        `🔹 Atterrissez sur 🏆 JACKPOT pour tout rafler !`;
      return message.reply(jackMsg);
    }

    if (!args[0]) {
      return message.reply(fonts.bold(`🎡 Utilisation : ${fonts.monospace("wheel <mise>")}\nMise min : ${formatMoney(MIN_BET)}\nMise max : ${formatMoney(MAX_BET)}\nTapez ${fonts.monospace("wheel info")} pour plus d'infos.`));
    }

    let bet = parseAmount(args[0]);
    if (isNaN(bet) || bet < MIN_BET) return message.reply(fonts.bold(`❌ Mise minimum : ${formatMoney(MIN_BET)}`));
    if (bet > MAX_BET) return message.reply(fonts.bold(`❌ Mise maximum : ${formatMoney(MAX_BET)}`));

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};

    if ((user.money || 0) < bet) return message.reply(fonts.bold(`❌ Solde insuffisant. Vous avez ${formatMoney(user.money)}.`));

    const now = Date.now();
    let wheelStats = user.data.wheelStats || { totalSpins: 0, totalWon: 0, totalWagered: 0, biggestWin: 0, currentStreak: 0, highestStreak: 0, jackpotsWon: 0, lastSpins: [] };
    let validSpins = (wheelStats.lastSpins || []).filter(t => now - t < LIMIT_INTERVAL_HOURS * 3600 * 1000);
    if (validSpins.length >= MAX_PLAYS) {
      const nextTime = new Date(validSpins[0] + LIMIT_INTERVAL_HOURS * 3600 * 1000);
      return message.reply(fonts.bold(`⏰ Limite atteinte ! ${MAX_PLAYS} tours en ${LIMIT_INTERVAL_HOURS}h.\nProchain tour disponible : ${nextTime.toLocaleTimeString()}`));
    }

    validSpins.push(now);
    wheelStats.totalSpins++;
    wheelStats.totalWagered = (wheelStats.totalWagered || 0) + bet;
    wheelStats.lastSpins = validSpins.slice(-MAX_PLAYS);

    await usersData.set(senderID, { money: user.money - bet, data: { ...user.data, wheelStats } });

    const jackpotContribution = Math.floor(bet * 0.02);
    let currentJackpot = (user.data.progressiveJackpot || 0) + jackpotContribution;
    await usersData.set(senderID, { "data.progressiveJackpot": currentJackpot });

    const animMsg = await message.reply(fonts.sansSerif("🎡 Lancement de la roue..."));
    await new Promise(r => setTimeout(r, 500));
    await api.editMessage(fonts.sansSerif("🌀 La roue tourne..."), animMsg.messageID);
    await new Promise(r => setTimeout(r, 500));
    await api.editMessage(fonts.sansSerif("⚡ Détermination du résultat..."), animMsg.messageID);
    await new Promise(r => setTimeout(r, 500));

    let rand = Math.random();
    let cumul = 0;
    let result = null;
    for (const seg of WHEEL_SEGMENTS) {
      cumul += seg.probability;
      if (rand < cumul) { result = { ...seg }; break; }
    }

    let specialEvent = null;
    for (const ev of SPECIAL_EVENTS) {
      if (Math.random() < ev.trigger) {
        specialEvent = ev;
        result.multiplier = ev.effect(result.multiplier);
        result.label += ` ✨ ${ev.name}`;
        break;
      }
    }

    let baseWinnings = Math.floor(bet * result.multiplier);
    let jackpotWin = 0;
    let specialBonus = 0;

    if (result.type === "jackpot") {
      jackpotWin = Math.floor(currentJackpot * (0.5 + Math.random()));
      await usersData.set(senderID, { "data.progressiveJackpot": 0, "data.wheelStats.jackpotsWon": (wheelStats.jackpotsWon || 0) + 1 });
    }

    if (result.type === "bankrupt") {
      const fee = Math.floor(bet * (result.fee || 0.15));
      baseWinnings = -fee;
    }

    let newStreak = result.multiplier > 1 ? (wheelStats.currentStreak || 0) + 1 : 0;
    if (newStreak >= 3) specialBonus = Math.floor(bet * (newStreak - 2) * 0.25);
    const highestStreak = Math.max(wheelStats.highestStreak || 0, newStreak);
    const totalWinnings = Math.max(0, baseWinnings) + jackpotWin + specialBonus;
    const finalBalance = user.money - bet + totalWinnings;

    wheelStats.totalWon = (wheelStats.totalWon || 0) + totalWinnings;
    wheelStats.biggestWin = Math.max(wheelStats.biggestWin || 0, totalWinnings);
    wheelStats.currentStreak = newStreak;
    wheelStats.highestStreak = highestStreak;
    if (result.type === "jackpot") wheelStats.jackpotsWon = (wheelStats.jackpotsWon || 0) + 1;

    await usersData.set(senderID, { money: finalBalance, "data.wheelStats": wheelStats });

    let resultMsg = `${fonts.bold("🎡 RÉSULTAT DE LA ROUE")}\n━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 Segment : ${result.emoji} ${result.label}\n` +
      `💰 Mise : ${formatMoney(bet)}\n` +
      `📈 Multiplicateur : ${result.multiplier.toFixed(2)}x\n`;

    if (baseWinnings > 0) resultMsg += `🎉 Gain de base : +${formatMoney(baseWinnings)}\n`;
    if (jackpotWin > 0) resultMsg += `🏆 JACKPOT : +${formatMoney(jackpotWin)} !\n`;
    if (specialEvent) resultMsg += `✨ Événement spécial : ${specialEvent.name} !\n`;
    if (specialBonus > 0) resultMsg += `🔥 Bonus série (${newStreak}) : +${formatMoney(specialBonus)}\n`;
    if (result.type === "bankrupt") resultMsg += `💸 Frais de faillite : -${formatMoney(Math.floor(bet * 0.15))}\n`;

    resultMsg += `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 Gain total : ${totalWinnings > 0 ? '+' : ''}${formatMoney(totalWinnings)}\n` +
      `💰 Nouveau solde : ${formatMoney(finalBalance)}\n` +
      `🎡 Tours restants : ${MAX_PLAYS - validSpins.length}/${MAX_PLAYS}\n` +
      (newStreak > 1 ? `🔥 Série : ${newStreak}\n` : '');

    await api.editMessage(resultMsg, animMsg.messageID);

    if (result.type === "jackpot") {
      await new Promise(r => setTimeout(r, 1000));
      await message.reply(fonts.bold(`🎊 🎊 🎊 JACKPOT GÉANT ! ${jackpotWin.toLocaleString()} coins gagnés ! 🎊 🎊 🎊`));
    } else if (totalWinnings > bet * 3) {
      await new Promise(r => setTimeout(r, 800));
      await message.reply(fonts.bold("🎉 VICTOIRE ÉCLATANTE ! LA ROUE VOUS SOURIT ! 🎉"));
    }
  }
};
