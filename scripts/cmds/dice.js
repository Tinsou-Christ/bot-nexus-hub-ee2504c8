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
  return `$${amount.toLocaleString("en-US")}`;
}

function parseAmount(input) {
  if (!input || typeof input !== 'string') return NaN;
  input = input.trim().toLowerCase();
  const match = input.match(/^(\d+(?:\.\d+)?)(k|m|b|t|qt)?$/);
  if (!match) return NaN;
  let num = parseFloat(match[1]);
  const unit = match[2];
  const map = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qt: 1e15 };
  return Math.floor(num * (map[unit] || 1));
}

module.exports = {
  config: {
    name: "dice",
    aliases: ["dicegame", "rolldice", "dg", "dicebet"],
    version: "2.2.4",
    author: "Christus",
    role: 0,
    usePrefix: true,
    description: {
      fr: "🎲 Jeu de dés avec paris multiples (pair/impair, haut/bas, 7, double)."
    },
    category: "game",
    guide: {
      fr: `${fonts.sansSerif("✨ DICE GAME ✨")}\n` +
           `${fonts.bold("{pn} <paris> <montant>")} : jouer un pari simple\n` +
           `${fonts.bold("{pn} <paris1> <paris2> <montant>")} : jouer deux paris combinés\n\n` +
           `${fonts.bold("🎲 Paris disponibles :")}\n` +
           `• ${fonts.monospace("high")} : total ≥ 8\n` +
           `• ${fonts.monospace("low")} : total ≤ 6\n` +
           `• ${fonts.monospace("even")} : total pair\n` +
           `• ${fonts.monospace("odd")} : total impair\n` +
           `• ${fonts.monospace("7")} : total = 7\n` +
           `• ${fonts.monospace("double")} : deux dés identiques\n\n` +
           `${fonts.bold("💡 Exemples :")}\n` +
           `• ${fonts.monospace("dice odd 1k")}\n` +
           `• ${fonts.monospace("dice high even 500")}\n` +
           `• ${fonts.monospace("dice 7 2m")}\n\n` +
           `💰 Multiplicateurs : simple x2, double x4, 7 x5, combiné x5\n` +
           `💵 Mise max : ${formatMoney(1000000)}`
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const senderID = event.senderID;
    const MAX_BET = 1000000;

    if (args.length < 2) {
      return message.reply(fonts.bold(
        `🎲 JEU DE DÉS\n\n` +
        `Utilisation :\n` +
        `${this.config.name} <paris> <montant>\n` +
        `${this.config.name} <paris1> <paris2> <montant>\n\n` +
        `Exemple : ${this.config.name} low odd 300k`
      ));
    }

    let bet1, bet2, rawAmount;
    if (args.length === 2) {
      bet1 = args[0].toLowerCase();
      rawAmount = args[1];
    } else {
      bet1 = args[0].toLowerCase();
      bet2 = args[1].toLowerCase();
      rawAmount = args[2];
    }

    const amount = parseAmount(rawAmount);
    const valid = ["high", "low", "even", "odd", "7", "double"];
    if (!valid.includes(bet1) || (bet2 && !valid.includes(bet2))) {
      return message.reply(fonts.bold("❌ Paris invalide. Choisissez : high, low, even, odd, 7 ou double."));
    }
    if (!Number.isFinite(amount) || amount < 10) {
      return message.reply(fonts.bold("❌ Mise minimale : 10$."));
    }
    if (amount > MAX_BET) {
      return message.reply(fonts.bold(`❌ Mise maximale : ${formatMoney(MAX_BET)}.`));
    }

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    const balance = user.money || 0;
    if (balance < amount) {
      return message.reply(fonts.bold(`❌ Solde insuffisant. Vous avez ${formatMoney(balance)}.`));
    }

    user.money = balance - amount;
    await usersData.set(senderID, user);

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    const check = (bet) => {
      if (bet === "high") return total >= 8 && total <= 12;
      if (bet === "low") return total >= 2 && total <= 6;
      if (bet === "even") return total % 2 === 0;
      if (bet === "odd") return total % 2 === 1;
      if (bet === "7") return total === 7;
      if (bet === "double") return dice1 === dice2;
      return false;
    };

    const win = check(bet1) && (bet2 ? check(bet2) : true);
    let multiplier = 0;
    let title = "";

    if (win && bet2) {
      multiplier = 5;
      title = "🎉 GRAND GAIN !";
    } else if (win) {
      if (bet1 === "double") multiplier = 4;
      else if (bet1 === "7") multiplier = 5;
      else multiplier = 2;
      title = "✅ VOUS AVEZ GAGNÉ !";
    } else {
      title = "❌ VOUS AVEZ PERDU...";
    }

    let payout = 0;
    if (multiplier > 0) {
      payout = amount * multiplier;
      user.money = (user.money || 0) + payout;
      await usersData.set(senderID, user);
    }

    const newBalance = user.money;
    const betText = [bet1, bet2].filter(Boolean).join(" + ");
    const resultMsg = `${fonts.bold(title)}\n\n` +
      `🎲 Dés : ${dice1} + ${dice2} = ${total}\n` +
      `🎯 Paris : ${betText}\n\n` +
      `${multiplier ? `💰 Gain : +${formatMoney(payout)} (x${multiplier})` : `💸 Perte : -${formatMoney(amount)}`}\n` +
      `💵 Nouveau solde : ${formatMoney(newBalance)}`;

    return message.reply(fonts.bold(resultMsg));
  }
};
