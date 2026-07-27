const moment = require("moment-timezone");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;

try {
  const canvas = require("canvas");
  loadImage = canvas.loadImage;
  createCanvas = canvas.createCanvas;
  registerFont = canvas.registerFont;
  canvasAvailable = true;
} catch (error) {
  console.error("Canvas module not available:", error.message);
}

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  console.log("Fonts module not found, using fallback");
}

if (canvasAvailable && registerFont) {
  try {
    const fontDir = path.join(__dirname, 'assets', 'font');
    if (fs.existsSync(path.join(fontDir, 'BeVietnamPro-Bold.ttf'))) {
      registerFont(path.join(fontDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro-Bold' });
    }
    if (fs.existsSync(path.join(fontDir, 'BeVietnamPro-Regular.ttf'))) {
      registerFont(path.join(fontDir, 'BeVietnamPro-Regular.ttf'), { family: 'BeVietnamPro-Regular' });
    }
  } catch (error) {
    console.log("Font registration error:", error.message);
  }
}

if (canvasAvailable) {
  try {
    if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
      };
    }
  } catch (error) {
    console.log("Canvas context polyfill error:", error.message);
  }
}

function calculateStreakBonus(streakDays) {
  if (streakDays <= 7) {
    return 1 + (streakDays - 1) * 0.2 / 6;
  } else if (streakDays <= 14) {
    return 1.2 + (streakDays - 7) * 0.3 / 7;
  } else {
    const additionalDays = Math.min(streakDays - 14, 16);
    return 1.5 + additionalDays * 0.5 / 16;
  }
}

module.exports = {
  config: {
    name: "daily",
    aliases: [],
    version: "2.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "Recevez votre cadeau quotidien avec système de streak et bonus",
      en: "Receive daily gift with streak system and bonuses"
    },
    category: "economy",
    guide: {
      fr: "   {pn} : Recevoir le cadeau du jour"
        + "\n   {pn} info : Voir les informations des récompenses"
        + "\n   {pn} streak : Voir votre streak actuel"
        + "\n   {pn} leaderboard : Classement des streaks",
      en: "   {pn} : Claim daily gift"
        + "\n   {pn} info : View reward information"
        + "\n   {pn} streak : View current streak info"
        + "\n   {pn} leaderboard : Streak leaderboard"
    },
    envConfig: {
      rewardFirstDay: {
        coin: 1500,
        exp: 450
      },
      weeklyBonus: {
        coin: 3500,
        exp: 630
      },
      maxStreakBonus: 2.0,
      timezone: "Asia/Ho_Chi_Minh"
    }
  },

  langs: {
    fr: {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",
      alreadyReceived: "🎁 Vous avez déjà reçu votre cadeau aujourd'hui !",
      received: "🎉 Vous avez reçu %1 coins et %2 points d'expérience !",
      streakInfo: "🔥 Streak : %1 jours consécutifs\n📊 Bonus actuel : x%2",
      streakReward: "✨ +%1 coins et +%2 XP bonus de streak !",
      weeklyBonus: "🎉 FÉLICITATIONS ! Bonus hebdomadaire : %1 coins et %2 XP !",
      streakLost: "⚠️ Votre streak a été réinitialisé car vous avez réclamé trop tard !",
      newStreak: "🆕 Nouveau streak commencé !",
      leaderboard: "🏆 CLASSEMENT DES STREAKS 🏆\n\n%1\n━━━━━━━━━━━━━",
      lbEntry: "%1. %2 - %3 jours 🔥",
      noStreakData: "Aucune donnée de streak pour le moment !",
      yourPosition: "Votre position : #%1",
      multiLogin: "⚠️ Connexion depuis un autre appareil détectée, streak maintenu.",
      streakMilestone: "🎊 NOUVEAU RECORD ! %1 jours de streak !",
      totalReceived: "📈 Total reçu : %1 coins, %2 XP",
      nextRewardIn: "⏰ Prochain cadeau dans : %1 heures %2 minutes"
    },
    en: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      alreadyReceived: "🎁 You have already received today's gift!",
      received: "🎉 You received %1 coins and %2 experience points!",
      streakInfo: "🔥 Streak: %1 consecutive days\n📊 Current bonus: x%2",
      streakReward: "✨ +%1 coins and +%2 XP streak bonus!",
      weeklyBonus: "🎉 CONGRATULATIONS! Weekly bonus: %1 coins and %2 XP!",
      streakLost: "⚠️ Your streak has been reset because you claimed too late!",
      newStreak: "🆕 Starting a new streak!",
      leaderboard: "🏆 STREAK LEADERBOARD 🏆\n\n%1\n━━━━━━━━━━━━━",
      lbEntry: "%1. %2 - %3 days 🔥",
      noStreakData: "No streak data yet!",
      yourPosition: "Your position: #%1",
      multiLogin: "⚠️ Multiple login detected, streak maintained.",
      streakMilestone: "🎊 NEW MILESTONE! %1 days streak!",
      totalReceived: "📈 Total received: %1 coins, %2 XP",
      nextRewardIn: "⏰ Next reward in: %1 hours %2 minutes"
    }
  },

  onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
    if (!canvasAvailable) {
      return message.reply(fonts?.bold ? 
        fonts.bold("⚠️ Le module canvas n'est pas installé. Utilisation du mode texte.") : 
        "⚠️ Le module canvas n'est pas installé. Utilisation du mode texte.");
    }

    try {
      const config = envCommands[commandName];
      const reward = config.rewardFirstDay;
      const timezone = config.timezone || "Asia/Ho_Chi_Minh";

      if (args[0] === "info") {
        let msg = "📅 DAILY REWARD SCHEDULE 📅\n\n";
        for (let i = 1; i <= 7; i++) {
          const getCoin = Math.floor(reward.coin * (1 + 20 / 1500) ** ((i == 7 ? 0 : i) - 1));
          const getExp = Math.floor(reward.exp * (1 + 20 / 1500) ** ((i == 7 ? 0 : i) - 1));
          const day = i == 7 ? getLang("sunday") :
                      i == 6 ? getLang("saturday") :
                      i == 5 ? getLang("friday") :
                      i == 4 ? getLang("thursday") :
                      i == 3 ? getLang("wednesday") :
                      i == 2 ? getLang("tuesday") :
                      getLang("monday");
          msg += `${day}: ${getCoin} coins, ${getExp} XP\n`;
        }
        msg += "\n━━━━━━━━━━━━━\n";
        msg += "🌟 STREAK BONUS SYSTEM 🌟\n";
        msg += "1-7 days: x1.0 - x1.2 bonus\n";
        msg += "8-14 days: x1.3 - x1.5 bonus\n";
        msg += "15-30 days: x1.6 - x2.0 bonus\n";
        msg += "Weekly bonus every 7 days!\n";
        msg += "━━━━━━━━━━━━━";
        return message.reply(fonts?.bold ? fonts.bold(msg) : msg);
      }

      if (args[0] === "streak") {
        const { senderID } = event;
        const userData = await usersData.get(senderID);
        const streakData = userData.data?.dailyStreak || { current: 0, lastClaim: null };
        const bonusMultiplier = calculateStreakBonus(streakData.current);

        let msg = getLang("streakInfo", streakData.current, bonusMultiplier.toFixed(1));

        if (streakData.lastClaim) {
          const lastClaim = moment(streakData.lastClaim);
          const now = moment().tz(timezone);
          const hoursDiff = now.diff(lastClaim, 'hours');
          const minutesDiff = now.diff(lastClaim, 'minutes') % 60;
          msg += `\n⏰ ${getLang("nextRewardIn", hoursDiff < 24 ? 24 - hoursDiff : 0, minutesDiff > 0 ? 60 - minutesDiff : 0)}`;
        }

        msg += `\n${getLang("totalReceived", userData.data?.totalCoinReceived || 0, userData.data?.totalExpReceived || 0)}`;
        return message.reply(fonts?.bold ? fonts.bold(msg) : msg);
      }

      if (args[0] === "leaderboard") {
        const allUsers = await usersData.getAll();
        const streakList = [];

        for (const user of allUsers) {
          if (user.data?.dailyStreak?.current > 0) {
            streakList.push({
              name: user.name,
              streak: user.data.dailyStreak.current,
              id: user.userID
            });
          }
        }

        streakList.sort((a, b) => b.streak - a.streak);

        let leaderboardMsg = "";
        const top10 = streakList.slice(0, 10);

        if (top10.length === 0) {
          leaderboardMsg = getLang("noStreakData");
        } else {
          top10.forEach((user, index) => {
            leaderboardMsg += getLang("lbEntry", index + 1, user.name, user.streak) + "\n";
          });
        }

        const senderID = event.senderID;
        const userIndex = streakList.findIndex(u => u.id === senderID);
        if (userIndex !== -1) {
          leaderboardMsg += `\n${getLang("yourPosition", userIndex + 1)}`;
        }

        return message.reply(fonts?.bold ? fonts.bold(getLang("leaderboard", leaderboardMsg)) : getLang("leaderboard", leaderboardMsg));
      }

      const dateTime = moment().tz(timezone).format("YYYY-MM-DD");
      const currentDay = new Date().getDay();
      const { senderID } = event;

      const userData = await usersData.get(senderID);

      if (!userData.data.dailyStreak) {
        userData.data.dailyStreak = {
          current: 0,
          lastClaim: null,
          longestStreak: 0
        };
      }
      if (!userData.data.totalCoinReceived) userData.data.totalCoinReceived = 0;
      if (!userData.data.totalExpReceived) userData.data.totalExpReceived = 0;

      const streakData = userData.data.dailyStreak;
      const lastClaimDate = streakData.lastClaim ? moment(streakData.lastClaim) : null;
      const currentDate = moment().tz(timezone);

      if (lastClaimDate && lastClaimDate.format("YYYY-MM-DD") === dateTime) {
        const nextClaim = lastClaimDate.clone().add(1, 'day');
        const hoursLeft = nextClaim.diff(currentDate, 'hours');
        const minutesLeft = nextClaim.diff(currentDate, 'minutes') % 60;
        let msg = getLang("alreadyReceived");
        msg += `\n⏰ ${getLang("nextRewardIn", hoursLeft, minutesLeft)}`;
        return message.reply(fonts?.bold ? fonts.bold(msg) : msg);
      }

      let isStreakContinued = false;
      if (lastClaimDate) {
        const daysDiff = currentDate.diff(lastClaimDate, 'days');
        if (daysDiff === 1) {
          streakData.current++;
          isStreakContinued = true;
        } else if (daysDiff <= 3) {
          message.reply(fonts?.bold ? fonts.bold(getLang("multiLogin")) : getLang("multiLogin"));
          isStreakContinued = true;
        } else {
          message.reply(fonts?.bold ? fonts.bold(getLang("streakLost")) : getLang("streakLost"));
          streakData.current = 1;
          message.reply(fonts?.bold ? fonts.bold(getLang("newStreak")) : getLang("newStreak"));
        }
      } else {
        streakData.current = 1;
        message.reply(fonts?.bold ? fonts.bold(getLang("newStreak")) : getLang("newStreak"));
      }

      if (streakData.current > streakData.longestStreak) {
        streakData.longestStreak = streakData.current;
        if (streakData.current % 7 === 0) {
          message.reply(fonts?.bold ? fonts.bold(getLang("streakMilestone", streakData.current)) : getLang("streakMilestone", streakData.current));
        }
      }

      let getCoin = Math.floor(reward.coin * (1 + 20 / 1500) ** ((currentDay == 0 ? 7 : currentDay) - 1));
      let getExp = Math.floor(reward.exp * (1 + 20 / 1500) ** ((currentDay == 0 ? 7 : currentDay) - 1));

      const streakMultiplier = calculateStreakBonus(streakData.current);
      const streakBonusCoin = Math.floor(getCoin * (streakMultiplier - 1));
      const streakBonusExp = Math.floor(getExp * (streakMultiplier - 1));

      getCoin += streakBonusCoin;
      getExp += streakBonusExp;

      let weeklyBonusMsg = "";
      if (streakData.current % 7 === 0) {
        const weeklyBonus = config.weeklyBonus;
        getCoin += weeklyBonus.coin;
        getExp += weeklyBonus.exp;
        weeklyBonusMsg = `\n${getLang("weeklyBonus", weeklyBonus.coin, weeklyBonus.exp)}`;
      }

      streakData.lastClaim = dateTime;

      await usersData.set(senderID, {
        money: userData.money + getCoin,
        exp: userData.exp + getExp,
        data: {
          ...userData.data,
          dailyStreak: streakData,
          totalCoinReceived: (userData.data.totalCoinReceived || 0) + getCoin,
          totalExpReceived: (userData.data.totalExpReceived || 0) + getExp,
          lastTimeGetReward: dateTime
        }
      });

      let responseMsg = getLang("received", getCoin, getExp);
      if (streakBonusCoin > 0 || streakBonusExp > 0) {
        responseMsg += `\n${getLang("streakReward", streakBonusCoin, streakBonusExp)}`;
      }
      if (weeklyBonusMsg) {
        responseMsg += weeklyBonusMsg;
      }
      responseMsg += `\n${getLang("streakInfo", streakData.current, streakMultiplier.toFixed(1))}`;

      return message.reply(fonts?.bold ? fonts.bold(responseMsg) : responseMsg);

    } catch (err) {
      console.error("Daily command error:", err);
      const errorMsg = fonts?.bold ? 
        fonts.bold(`❌ Une erreur s'est produite : ${err.message}`) : 
        `❌ Une erreur s'est produite : ${err.message}`;
      return message.reply(errorMsg);
    }
  }
};
