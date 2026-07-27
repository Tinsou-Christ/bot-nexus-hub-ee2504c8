module.exports = {
  config: {
    name: "slot",
    version: "6.1",
    author: "Aryan Chauhan",
    countDown: 0,
    role: 0,
    shortDescription: "🎰 Slot Machine",
    longDescription: "Play a simple slot machine game and win coins",
    category: "game",
    guide: "{pn} <amount>"
  },

  onStart: async function ({ args, event, usersData, api }) {
    const { senderID, threadID } = event;
    const user = await usersData.get(senderID);

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0)
      return api.shareContact("❌ Enter a valid bet amount.\nUsage: slot <amount>", senderID, threadID);

    const isSlotAdmin = (global.AryanChauhan?.config?.adminBot || []).map(String).includes(String(senderID));
    if (!isSlotAdmin && bet > (user.money || 0))
      return api.shareContact(
        `💸 Not enough balance!\nYour balance: $${(user.money || 0).toLocaleString()}`,
        senderID,
        threadID
      );

    if (!isSlotAdmin && bet > 50000)
      return api.shareContact("❌ Maximum bet is $50,000.", senderID, threadID);

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const slotData = user.data?.slotData || { lastPlay: 0, count: 0 };

    if (now - slotData.lastPlay > oneHour) {
      slotData.count = 0;
      slotData.lastPlay = now;
    }

    if (slotData.count >= 10) {
      const remaining = Math.ceil((oneHour - (now - slotData.lastPlay)) / 60000);
      return api.shareContact(
        `⏳ Hourly limit reached!\nTry again in ${remaining} minute(s).`,
        senderID,
        threadID
      );
    }

    slotData.count++;
    if (!user.data) user.data = {};
    user.data.slotData = slotData;
    await usersData.set(senderID, { data: user.data });

    const symbols = ["🍎", "🍍", "🍇", "🍊", "🍌", "⭐", "🔥", "💎", "7️⃣"];

    const lose = Math.random() < 0.40;
    let reels;

    if (lose) {
      do {
        reels = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
      } while (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]);
    } else {
      const jackpot = Math.random() < 0.05;
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      if (jackpot) {
        reels = [sym, sym, sym];
      } else {
        let other;
        do { other = symbols[Math.floor(Math.random() * symbols.length)]; } while (other === sym);
        reels = [sym, sym, other].sort(() => Math.random() - 0.5);
      }
    }

    const counts = reels.reduce((a, c) => { a[c] = (a[c] || 0) + 1; return a; }, {});
    const max = Math.max(...Object.values(counts));
    const multiplier = max === 3 ? 5 : max === 2 ? 2 : 0;

    const winAmount = multiplier ? bet * multiplier : 0;
    const profit = isSlotAdmin ? winAmount : (winAmount - bet);
    const newBalance = (user.money || 0) + profit;

    await usersData.set(senderID, { money: newBalance });

    const isWin = profit > 0;
    const isJackpot = max === 3;

    let msg = `🎰 SLOT MACHINE\n`;
    msg += `━━━━━━━━━\n`;
    msg += `[ ${reels[0]} | ${reels[1]} | ${reels[2]} ]\n`;
    msg += `━━━━━━━━━\n`;
    msg += `👤 Player: ${user.name}\n`;
    msg += `💰 Bet: $${bet.toLocaleString()}\n`;

    if (isJackpot) {
      msg += `\n🎉 JACKPOT! x5 WIN!\n`;
      msg += `✅ Won: +$${winAmount.toLocaleString()}\n`;
    } else if (isWin) {
      msg += `\n🎊 PAIR! x2 WIN!\n`;
      msg += `✅ Won: +$${winAmount.toLocaleString()}\n`;
    } else {
      msg += `\n💔 No match — Better luck next time!\n`;
      msg += `❌ Lost: -$${bet.toLocaleString()}\n`;
    }

    msg += `💳 Balance: $${newBalance.toLocaleString()}`;

    return api.shareContact(
      msg,
      senderID,
      threadID
    );
  }
};
