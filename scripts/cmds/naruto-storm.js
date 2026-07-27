const characters = [
  {
    name: "𝖭𝖺𝗋𝗎𝗍𝗈 𝖴𝗓𝗎𝗆𝖺𝗄𝗂",
    power: 50,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 🌀",
    ultimate: "𝖬𝗎𝗅𝗍𝗂-𝖢𝗅𝗈𝗇𝖾𝗌 + 𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖦𝖾́𝖺𝗇𝗍 🌪️"
  },
  {
    name: "𝖭𝖺𝗋𝗎𝗍𝗈 (𝖬𝗈𝖽𝖾 𝖤𝗋𝗆𝗂𝗍𝖾)",
    power: 60,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖦𝖾́𝖺𝗇𝗍 🌪️",
    ultimate: "𝖥𝗎𝗍𝗈𝗇 𝖱𝖺𝗌𝖾𝗇𝗌𝗁𝗎𝗋𝗂𝗄𝖾𝗇 🌪️💨"
  },
  {
    name: "𝖭𝖺𝗋𝗎𝗍𝗈 (𝖱𝗂𝗄𝗎𝖽𝗈)",
    power: 70,
    basic: "𝖮𝗋𝖻𝖾 𝖳𝗋𝗎𝗍𝗁 𝖲𝖾𝖾𝗄𝖾𝗋 ⚫",
    ultimate: "𝖡𝗂𝗃𝗎𝗎 𝖬𝗈𝖽𝖾 𝖱𝖺𝗌𝖾𝗇𝗌𝗁𝗎𝗋𝗂𝗄𝖾𝗇 🦊🌪️"
  },
  {
    name: "𝖭𝖺𝗋𝗎𝗍𝗈 (𝖡𝖺𝗋𝗒𝗈𝗇 𝖬𝗈𝖽𝖾)",
    power: 85,
    basic: "𝖯𝗎𝗇𝖼𝗁 𝖴𝗅𝗍𝗋𝖺 𝖱𝖺𝗉𝗂𝖽𝖾 ⚡",
    ultimate: "𝖤𝗑𝗉𝗅𝗈𝗌𝗂𝗈𝗇 𝖢𝗁𝖺𝗄𝗋𝖺 𝖭𝗎𝖼𝗅𝖾́𝖺𝗂𝗋𝖾 ☢️"
  },
  {
    name: "𝖲𝖺𝗌𝗎𝗄𝖾 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 60,
    basic: "𝖢𝗁𝗂𝖽𝗈𝗋𝗂 ⚡",
    ultimate: "𝖪𝗂𝗋𝗂𝗇 ⚡🌩️"
  },
  {
    name: "𝖲𝖺𝗌𝗎𝗄𝖾 (𝖳𝖺𝗄𝖺)",
    power: 65,
    basic: "𝖢𝗁𝗂𝖽𝗈𝗋𝗂 𝖭𝖺𝗀𝖺𝗌𝗁𝗂 ⚡💧",
    ultimate: "𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 💀"
  },
  {
    name: "𝖲𝖺𝗌𝗎𝗄𝖾 (𝖱𝗂𝗇𝗇𝖾𝗀𝖺𝗇)",
    power: 70,
    basic: "𝖠𝗆𝖺𝗍𝖾𝗋𝖺𝗌𝗎 🔥",
    ultimate: "𝖨𝗇𝖽𝗋𝖺'𝗌 𝖠𝗋𝗋𝗈𝗐 ⚡🏹"
  },
  {
    name: "𝖪𝖺𝗄𝖺𝗌𝗁𝗂 𝖧𝖺𝗍𝖺𝗄𝖾",
    power: 60,
    basic: "𝖱𝖺𝗂𝗄𝗂𝗋𝗂 ⚡",
    ultimate: "𝖪𝖺𝗆𝗎𝗂 🌀"
  },
  {
    name: "𝖪𝖺𝗄𝖺𝗌𝗁𝗂 (𝖣𝖬𝖲)",
    power: 75,
    basic: "𝖪𝖺𝗆𝗎𝗂 𝖱𝖺𝗂𝗄𝗂𝗋𝗂 ⚡🌀",
    ultimate: "𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 𝖯𝖺𝗋𝖿𝖺𝗂𝗍 💠"
  },
  {
    name: "𝖬𝗂𝗇𝖺𝗍𝗈 𝖭𝖺𝗆𝗂𝗄𝖺𝗓𝖾",
    power: 80,
    basic: "𝖧𝗂𝗋𝖺𝗂𝗌𝗁𝗂𝗇 𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 ⚡🌀",
    ultimate: "𝖬𝗈𝖽𝖾 𝖪𝗒𝗎𝗎𝖻𝗂 🦊"
  },
  {
    name: "𝖧𝖺𝗌𝗁𝗂𝗋𝖺𝗆𝖺 𝖲𝖾𝗇𝗃𝗎",
    power: 70,
    basic: "𝖥𝗈𝗋𝖾𝗍 𝖭𝖺𝗂𝗌𝗌𝖺𝗇𝗍𝖾 🌳",
    ultimate: "𝖠𝗋𝗍 𝖲𝖾𝗇𝗂𝗇 🌿"
  },
  {
    name: "𝖳𝗈𝖻𝗂𝗋𝖺𝗆𝖺 𝖲𝖾𝗇𝗃𝗎",
    power: 60,
    basic: "𝖲𝗎𝗂𝗍𝗈𝗇: 𝖣𝗋𝖺𝗀𝗈𝗇 🌊",
    ultimate: "𝖤𝖽𝗈 𝖳𝖾𝗇𝗌𝖾𝗂 ⚰️"
  },
  {
    name: "𝖳𝗌𝗎𝗇𝖺𝖽𝖾",
    power: 60,
    basic: "𝖢𝗈𝗎𝗉 𝖲𝗎𝗋𝗉𝗋𝖾𝗇𝖺𝗇𝗍 💥",
    ultimate: "𝖲𝖼𝖾𝖺𝗎 𝖡𝗒𝖺𝗄𝗎𝗀𝗈 💎"
  },
  {
    name: "𝖧𝗂𝗋𝗎𝗓𝖾𝗇 𝖲𝖺𝗋𝗎𝗍𝗈𝖻𝗂",
    power: 65,
    basic: "5 𝖤́𝗅𝖾́𝗆𝖾𝗇𝗍𝗌 🌍🔥💧🌪️⚡",
    ultimate: "𝖲𝗁𝗂𝗇𝗂𝗀𝖺𝗆𝗂 𝖲𝖾𝖺𝗅 ☠️"
  },
  {
    name: "𝖯𝖺𝗂𝗇 (𝖳𝖾𝗇𝖽𝗈)",
    power: 68,
    basic: "𝖲𝗁𝗂𝗇𝗋𝖺 𝖳𝖾𝗇𝗌𝖾𝗂 ⬇️",
    ultimate: "𝖢𝗁𝗂𝖻𝖺𝗄𝗎 𝖳𝖾𝗇𝗌𝖾𝗂 ⬆️"
  },
  {
    name: "𝖪𝗈𝗇𝖺𝗇",
    power: 55,
    basic: "𝖣𝖺𝗇𝗌𝖾 𝖽𝖾 𝖯𝖺𝗉𝗂𝖾𝗋 📄",
    ultimate: "𝖬𝖾𝗋 𝖽𝖾𝗌 𝗉𝖺𝗉𝗂𝖾𝗋𝗌 𝖾𝗑𝗉𝗅𝗈𝗌𝗂𝖿𝗌 💥📄"
  },
  {
    name: "𝖭𝖺𝗀𝖺𝗍𝗈",
    power: 68,
    basic: "𝖠𝖻𝗌𝗈𝗋𝗉𝗍𝗂𝗈𝗇 𝖢𝗁𝖺𝗄𝗋𝖺 🌀",
    ultimate: "𝖱𝖾́𝖺𝗇𝗂𝗆𝖺𝗍𝗂𝗈𝗇 𝖴𝗇𝗂𝗏𝖾𝗋𝗌𝖾𝗅𝗅𝖾 ⚰️"
  },
  {
    name: "𝖣𝖾𝗂𝖽𝖺𝗋𝖺",
    power: 60,
    basic: "𝖠𝗋𝗀𝗂𝗅𝖾 𝖤𝗑𝗉𝗅𝗈𝗌𝗂𝗏𝖾 𝖢𝟤 💣",
    ultimate: "𝖠𝗎𝗍𝗈-𝖣𝖾𝗌𝗍𝗋𝗎𝖼𝗍𝗂𝗈𝗇 𝖢𝟢 💥"
  },
  {
    name: "𝖪𝖺𝗄𝗎𝗓𝗎",
    power: 60,
    basic: "𝖥𝗎𝗍𝗈𝗇 - 𝖹𝖺𝗇𝗄𝗈𝗄𝗎𝗁𝖺 💨",
    ultimate: "𝖢𝗈𝖾𝗎𝗋𝗌 𝖤𝗇𝖼𝗁𝖺𝗂̂𝗇𝖾́𝗌 💔"
  },
  {
    name: "𝖧𝗂𝖽𝖺𝗇",
    power: 50,
    basic: "𝖠𝗍𝗍𝖺𝗊𝗎𝖾 𝖱𝗂𝗍𝗎𝖾𝗅𝗅𝖾 ⛧",
    ultimate: "𝖱𝗂𝗍𝗎𝖾𝗅 𝖩𝖺𝗌𝗁𝗂𝗇 ⛧"
  },
  {
    name: "𝖲𝖺𝗌𝗈𝗋𝗂",
    power: 58,
    basic: "𝖬𝖺𝗋𝗂𝗈𝗇𝗇𝖾𝗍𝗍𝖾𝗌 🎭",
    ultimate: "𝖠𝗋𝗆𝖾́𝖾 𝖽𝖾𝗌 𝟣𝟢𝟢 🎭"
  },
  {
    name: "𝖨𝗍𝖺𝖼𝗁𝗂 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 70,
    basic: "𝖳𝗌𝗎𝗄𝗎𝗒𝗈𝗆𝗂 🌙",
    ultimate: "𝖠𝗆𝖺𝗍𝖾𝗋𝖺𝗌𝗎 + 𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 🔥💀"
  },
  {
    name: "𝖪𝗂𝗌𝖺𝗆𝖾 𝖧𝗈𝗌𝗁𝗂𝗀𝖺𝗄𝗂",
    power: 62,
    basic: "𝖱𝖾𝗊𝗎𝗂𝗇 𝖦𝖾́𝖺𝗇𝗍 🦈",
    ultimate: "𝖥𝗎𝗌𝗂𝗈𝗇 𝖺𝗏𝖾𝖼 𝖲𝖺𝗆𝖾𝗁𝖺𝖽𝖺 🦈"
  },
  {
    name: "𝖮𝗋𝗈𝖼𝗁𝗂𝗆𝖺𝗋𝗎",
    power: 65,
    basic: "𝖯𝗈𝗂𝗀𝗇𝖾́𝖾 𝖽𝗎 𝖲𝖾𝗋𝗉𝖾𝗇𝗍 𝖲𝗉𝖾𝖼𝗍𝗋𝖺𝗅 🐍",
    ultimate: "𝖬𝗈𝖽𝖾 𝖲𝖺𝗀𝖾 𝖡𝗅𝖺𝗇𝖼 🐍"
  },
  {
    name: "𝖠𝗌𝗎𝗆𝖺 𝖲𝖺𝗋𝗎𝗍𝗈𝖻𝗂",
    power: 55,
    basic: "𝖫𝖺𝗆𝖾𝗌 𝖽𝖾 𝖢𝗁𝖺𝗄𝗋𝖺 🔪",
    ultimate: "𝖥𝗎𝗋𝗂𝖾 𝖬𝗈𝖽𝖾 💨"
  },
  {
    name: "𝖬𝖺𝗂𝗍𝗈 𝖦𝖺𝗂",
    power: 70,
    basic: "𝖥𝖾𝗎 𝖽𝖾 𝗅𝖺 𝖩𝖾𝗎𝗇𝖾𝗌𝗌𝖾 🔥",
    ultimate: "8𝖾̀𝗆𝖾 𝖯𝗈𝗋𝗍𝖾 - 𝖭𝗎𝗂𝗍 𝖽𝖾 𝗅𝖺 𝖬𝗈𝗋𝗍 💀"
  },
  {
    name: "𝖪𝗎𝗋𝖾𝗇𝖺𝗂 𝖸𝗎𝗁𝗂",
    power: 45,
    basic: "𝖦𝖾𝗇𝗃𝗎𝗍𝗌𝗎 🌸",
    ultimate: "𝖯𝗂𝖾𝗀𝖾 𝖥𝗅𝗈𝗋𝖺𝗅 🌸"
  },
  {
    name: "𝖦𝖺𝖺𝗋𝖺",
    power: 68,
    basic: "𝖲𝖺𝖻𝗅𝖾 𝖬𝗈𝗎𝗏𝖺𝗇𝗍 🏜️",
    ultimate: "𝖠𝗋𝗆𝗎𝗋𝖾 + 𝖲𝖺𝖻𝗅𝖾 𝖥𝗎𝗇𝖾́𝗋𝖺𝗂𝗋𝖾 ⚔️🏜️"
  },
  {
    name: "𝖳𝖾𝗆𝖺𝗋𝗂",
    power: 58,
    basic: "𝖵𝖾𝗇𝗍 𝖳𝗋𝖺𝗇𝖼𝗁𝖺𝗇𝗍 🌪️",
    ultimate: "𝖣𝖺𝗇𝗌𝖾 𝖽𝖾 𝗅𝖺 𝖥𝖺𝗎𝖼𝗂𝗅𝗅𝖾 🌪️"
  },
  {
    name: "𝖪𝖺𝗇𝗄𝗎𝗋𝗈",
    power: 56,
    basic: "𝖯𝗈𝗎𝗉𝖾́𝖾 𝖪𝖺𝗋𝖺𝗌𝗎 🎭",
    ultimate: "𝖯𝗂𝖾𝗀𝖾 𝖽𝖾𝗌 𝟥 𝖬𝖺𝗋𝗂𝗈𝗇𝗇𝖾𝗍𝗍𝖾𝗌 🎭"
  },
  {
    name: "𝖧𝗂𝗇𝖺𝗍𝖺 𝖧𝗒𝗎𝗀𝖺",
    power: 52,
    basic: "𝖯𝖺𝗎𝗆𝗆𝖾 𝖽𝗎 𝖧𝖺𝗄𝗄𝖾́ ✋",
    ultimate: "𝖯𝗋𝗈𝗍𝖾𝖼𝗍𝗂𝗈𝗇 𝖽𝖾𝗌 64 𝖢𝗈𝗎𝗉𝗌 ✋✋"
  },
  {
    name: "𝖭𝖾𝗃𝗂 𝖧𝗒𝗎𝗀𝖺",
    power: 60,
    basic: "𝖳𝗈𝗎𝗋𝖻𝗂𝗅𝗅𝗈𝗇 𝖣𝗂𝗏𝗂𝗇 🌪️",
    ultimate: "64 𝖯𝗈𝗂𝗇𝗍𝗌 𝖽𝗎 𝖧𝖺𝗄𝗄𝖾́ ✋"
  },
  {
    name: "𝖱𝗈𝖼𝗄 𝖫𝖾𝖾",
    power: 65,
    basic: "𝖫𝗈𝗍𝗎𝗌 𝖱𝖾𝖼𝗍𝗈 🌸",
    ultimate: "6𝖾̀𝗆𝖾 𝖯𝗈𝗋𝗍𝖾 - 𝖯𝖺𝗈𝗇 𝖽𝗎 𝖬𝗂𝖽𝗂 🦚"
  },
  {
    name: "𝖲𝗁𝗂𝗄𝖺𝗆𝖺𝗋𝗎 𝖭𝖺𝗋𝖺",
    power: 60,
    basic: "𝖮𝗆𝖻𝗋𝖾 𝖬𝖺𝗇𝗂𝗉𝗎𝗅𝖺𝗍𝗋𝗂𝖼𝖾 🕳️",
    ultimate: "𝖯𝗂𝖾𝗀𝖾 𝖲𝗍𝗋𝖺𝗍𝖾́𝗀𝗂𝗊𝗎𝖾 𝖳𝗈𝗍𝖺𝗅 🕳️"
  },
  {
    name: "𝖲𝖺𝗄𝗎𝗋𝖺 𝖧𝖺𝗋𝗎𝗇𝗈",
    power: 60,
    basic: "𝖢𝗈𝗎𝗉 𝖲𝗎𝗉𝖾𝗋𝗌𝗈𝗇𝗂𝗊𝗎𝖾 💥",
    ultimate: "𝖲𝖼𝖾𝖺𝗎 𝖡𝗒𝖺𝗄𝗎𝗀𝗈 𝖣𝖾́𝖼𝗁𝖺𝗂̂𝗇𝖾́ 💎"
  },
  {
    name: "𝖬𝖺𝖽𝖺𝗋𝖺 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 75,
    basic: "𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 💀",
    ultimate: "𝖫𝗂𝗆𝖻𝗈 + 𝖬𝖾́𝗍𝖾́𝗈𝗋𝖾𝗌 ☄️"
  },
  {
    name: "𝖬𝖺𝖽𝖺𝗋𝖺 (𝖱𝗂𝗄𝗎𝖽𝗈)",
    power: 85,
    basic: "𝖳𝗋𝗎𝗍𝗁 𝖲𝖾𝖾𝗄𝖾𝗋 𝖮𝗋𝖻𝗌 ⚫",
    ultimate: "𝖨𝗇𝖿𝗂𝗇𝗂𝗍𝖾 𝖳𝗌𝗎𝗄𝗎𝗒𝗈𝗆𝗂 🌙"
  },
  {
    name: "𝖮𝖻𝗂𝗍𝗈 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 70,
    basic: "𝖪𝖺𝗆𝗎𝗂 🌀",
    ultimate: "𝖩𝗎𝗎𝖻𝗂 𝖬𝗈𝖽𝖾 🔥"
  },
  {
    name: "𝖮𝖻𝗂𝗍𝗈 (𝖱𝗂𝗄𝗎𝖽𝗈)",
    power: 80,
    basic: "𝖦𝗎𝗇𝖻𝖺𝗂 𝖴𝖼𝗁𝗂𝗐𝖺 🌀",
    ultimate: "𝖲𝗁𝗂𝗇𝗋𝖺 𝖳𝖾𝗇𝗌𝖾𝗂 ⬇️"
  },
  {
    name: "𝖹𝖾𝗍𝗌𝗎",
    power: 40,
    basic: "𝖠𝗍𝗍𝖺𝗊𝗎𝖾 𝖥𝗎𝗋𝗍𝗂𝗏𝖾 🥷",
    ultimate: "𝖨𝗇𝖿𝖾𝖼𝗍𝗂𝗈𝗇 𝖽𝖾 𝖢𝗈𝗋𝗉𝗌 🦠"
  },
  {
    name: "𝖪𝖺𝗀𝗎𝗒𝖺 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 78,
    basic: "𝖯𝗈𝗋𝗍𝖺𝗂𝗅 𝖣𝗂𝗆𝖾𝗇𝗌𝗂𝗈𝗇𝗇𝖾𝗅 🌀",
    ultimate: "𝖮𝗌 𝖢𝖾𝗇𝖽𝗋𝖾́ + 𝖤𝗑𝗉𝖺𝗇𝗌𝗂𝗈𝗇 𝖣𝗂𝗏𝗂𝗇𝖾 ☄️"
  },
  {
    name: "𝖠𝗒 (𝖱𝖺𝗂𝗄𝖺𝗀𝖾)",
    power: 66,
    basic: "𝖢𝗈𝗎𝗉 𝖱𝖺𝗂𝗄𝖺𝗀𝖾 ⚡",
    ultimate: "𝖬𝗈𝖽𝖾 𝖥𝗈𝗎𝖽𝗋𝖾 ⚡"
  },
  {
    name: "𝖬𝖾𝗂 𝖳𝖾𝗋𝗎𝗆𝗂",
    power: 60,
    basic: "𝖠𝖼𝗂𝖽𝖾 𝖡𝗈𝗎𝗂𝗅𝗅𝖺𝗇𝗍 🧪",
    ultimate: "𝖵𝖺𝗉𝖾𝗎𝗋 𝖣𝖾𝗌𝗍𝗋𝗎𝖼𝗍𝗋𝗂𝖼𝖾 💨"
  },
  {
    name: "𝖮𝗇𝗈𝗄𝗂",
    power: 65,
    basic: "𝖳𝖾𝖼𝗁𝗇𝗂𝗊𝗎𝖾 𝖽𝖾 𝖫𝖾́𝗀𝖾𝗋𝗍𝖾́ 🪶",
    ultimate: "𝖩𝗂𝗇𝗍𝗈𝗇: 𝖣𝖾́𝗆𝖺𝗍𝖾́𝗋𝗂𝖺𝗅𝗂𝗌𝖺𝗍𝗂𝗈𝗇 💎"
  },
  {
    name: "𝖪𝗂𝗅𝗅𝖾𝗋 𝖡𝖾𝖾",
    power: 68,
    basic: "𝖫𝖺𝗆𝖾𝗌 à 8 𝖲𝖺𝖻𝗋𝖾𝗌 ⚔️",
    ultimate: "𝖬𝗈𝖽𝖾 𝖧𝖺𝖼𝗁𝗂𝖻𝗂 🐙"
  },
  {
    name: "𝖡𝗈𝗋𝗎𝗍𝗈 𝖴𝗓𝗎𝗆𝖺𝗄𝗂",
    power: 60,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖨𝗇𝗏𝗂𝗌𝗂𝖻𝗅𝖾 👻🌀",
    ultimate: "𝖪𝖺𝗋𝗆𝖺 𝖠𝖼𝗍𝗂𝗏𝖾́ + 𝖩𝗈𝗎𝗀𝖺𝗇 👁️"
  },
  {
    name: "𝖡𝗈𝗋𝗎𝗍𝗈 (𝖪𝖺𝗋𝗆𝖺)",
    power: 75,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖲𝗉𝖺𝗍𝗂𝖺𝗅 🌌",
    ultimate: "𝖯𝗈𝗎𝗏𝗈𝗂𝗋 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂 🌙"
  },
  {
    name: "𝖪𝖺𝗐𝖺𝗄𝗂",
    power: 70,
    basic: "𝖳𝗋𝖺𝗇𝗌𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇 𝖬𝗈𝗋𝗉𝗁𝗈 ⚔️",
    ultimate: "𝖪𝖺𝗋𝗆𝖺 𝖥𝗎𝗅𝗅 𝖯𝗈𝗐𝖾𝗋 💀"
  },
  {
    name: "𝖲𝖺𝗋𝖺𝖽𝖺 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 58,
    basic: "𝖢𝗁𝗂𝖽𝗈𝗋𝗂 ⚡",
    ultimate: "𝖲𝗁𝖺𝗋𝗂𝗇𝗀𝖺𝗇 3 𝖳𝗈𝗆𝗈𝖾 🔴"
  },
  {
    name: "𝖬𝗂𝗍𝗌𝗎𝗄𝗂",
    power: 60,
    basic: "𝖲𝖾𝗋𝗉𝖾𝗇𝗍 𝖡𝗅𝖺𝗇𝖼 🐍",
    ultimate: "𝖬𝗈𝖽𝖾 𝖲𝖺𝗀𝖾 🐍"
  },
  {
    name: "𝖩𝗂𝗀𝖾𝗇",
    power: 82,
    basic: "𝖱𝗈𝖽𝗌 𝖣𝗂𝗆𝖾𝗇𝗌𝗂𝗈𝗇𝗇𝖾𝗅𝗌 ⚡",
    ultimate: "𝖳𝗋𝖺𝗇𝗌𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇 𝖪𝖺𝗋𝗆𝖺 🔥"
  },
  {
    name: "𝖨𝗌𝗌𝗁𝗂𝗄𝗂 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 90,
    basic: "𝖲𝗎𝗄𝗎𝗇𝖺𝗁𝗂𝗄𝗈𝗇𝖺 🔍",
    ultimate: "𝖣𝖺𝗂𝗄𝗈𝗄𝗎𝗍𝖾𝗇 ⏳"
  },
  {
    name: "𝖬𝗈𝗆𝗈𝗌𝗁𝗂𝗄𝗂 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 84,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖦𝖾́𝖺𝗇𝗍 🌪️",
    ultimate: "𝖠𝖻𝗌𝗈𝗋𝗉𝗍𝗂𝗈𝗇 𝖢𝗁𝖺𝗄𝗋𝖺 🌀"
  },
  {
    name: "𝖨𝗇𝖽𝗋𝖺 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 78,
    basic: "𝖢𝗁𝗂𝖽𝗈𝗋𝗂 𝖴𝗅𝗍𝗂𝗆𝖾 ⚡",
    ultimate: "𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 𝖯𝖺𝗋𝖿𝖺𝗂𝗍 💠"
  },
  {
    name: "𝖠𝗌𝗎𝗋𝖺 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 76,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖮𝗋𝗂𝗀𝗂𝗇𝖾𝗅 🌀",
    ultimate: "𝖬𝗈𝖽𝖾 𝖲𝖺𝗀𝖾 𝖽𝖾𝗌 6 𝖢𝗁𝖾𝗆𝗂𝗇𝗌 ☯️"
  },
  {
    name: "𝖧𝖺𝗀𝗈𝗋𝗈𝗆𝗈 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 88,
    basic: "𝖢𝗋𝖾𝖺𝗍𝗂𝗈𝗇 𝗈𝖿 𝖠𝗅𝗅 𝖳𝗁𝗂𝗇𝗀𝗌 🌍",
    ultimate: "6 𝖯𝖺𝗍𝗁𝗌 𝖲𝖾𝗇𝗃𝗎𝗍𝗌𝗎 ☯️"
  },
  {
    name: "𝖧𝖺𝗆𝗎𝗋𝖺 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 80,
    basic: "𝖳𝖾𝗇𝗌𝖾𝗂𝗀𝖺𝗇 𝖠𝖼𝗍𝗂𝗏𝖺𝗍𝗂𝗈𝗇 ✨",
    ultimate: "𝖬𝗈𝗈𝗇 𝖲𝗐𝗈𝗋𝖽 𝖲𝗅𝖺𝗌𝗁 🌙"
  },
  {
    name: "𝖪𝗈𝗇𝗈𝗁𝖺𝗆𝖺𝗋𝗎 𝖲𝖺𝗋𝗎𝗍𝗈𝖻𝗂",
    power: 55,
    basic: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 🌀",
    ultimate: "𝖳𝖾𝖼𝗁𝗇𝗂𝗊𝗎𝖾 𝖲𝖾𝗑𝗒 + 𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 𝖦𝖾𝖺𝗇𝗍 💥"
  },
  {
    name: "𝖨𝗋𝗎𝗄𝖺 𝖴𝗆𝗂𝗇𝗈",
    power: 45,
    basic: "𝖲𝗁𝗎𝗋𝗂𝗄𝖾𝗇 𝖪𝖺𝗀𝖾 𝖡𝗎𝗇𝗌𝗁𝗂𝗇 ⚔️",
    ultimate: "𝖦𝗋𝖺𝗇𝖽𝖾 𝖡𝗈𝗎𝗅𝖾 𝖽𝖾 𝖥𝖾𝗎 🔥"
  },
  {
    name: "𝖩𝗂𝗋𝖺𝗂𝗒𝖺",
    power: 75,
    basic: "𝖨𝗇𝗏𝗈𝖼𝖺𝗍𝗂𝗈𝗇 𝖢𝗋𝖺𝗉𝖺𝗎𝖽 🐸",
    ultimate: "𝖱𝖺𝗌𝖾𝗇𝗀𝖺𝗇 + 𝖬𝗈𝖽𝖾 𝖲𝖺𝗀𝖾 𝖽𝖾𝗌 𝖢𝗋𝖺𝗉𝖺𝗎𝖽𝗌 🐸🌀"
  },
  {
    name: "𝖢𝗁𝗈𝗃𝗂 𝖠𝗄𝗂𝗆𝗂𝖼𝗁𝗂",
    power: 62,
    basic: "𝖤𝗑𝗉𝖺𝗇𝗌𝗂𝗈𝗇 𝖢𝗈𝗋𝗉𝗈𝗋𝖾𝗅𝗅𝖾 🍖",
    ultimate: "𝖯𝖺𝗉𝗂𝗅𝗅𝗈𝗇 𝖢𝗁𝖺𝗄𝗋𝖺 🦋"
  },
  {
    name: "𝖨𝗇𝗈 𝖸𝖺𝗆𝖺𝗇𝖺𝗄𝖺",
    power: 48,
    basic: "𝖳𝗋𝖺𝗇𝗌𝖿𝖾𝗋𝗍 𝖽'𝖤𝗌𝗉𝗋𝗂𝗍 🧠",
    ultimate: "𝖯𝗈𝗌𝗌𝖾𝗌𝗌𝗂𝗈𝗇 𝖳𝗈𝗍𝖺𝗅𝖾 🧠✨"
  },
  {
    name: "𝖲𝗁𝗂𝗇𝗈 𝖠𝖻𝗎𝗋𝖺𝗆𝖾",
    power: 52,
    basic: "𝖨𝗇𝗌𝖾𝖼𝗍𝖾𝗌 𝖣𝖾𝗌𝗍𝗋𝗎𝖼𝗍𝖾𝗎𝗋𝗌 🐝",
    ultimate: "𝖭𝗎𝖾𝖾 𝖽'𝖨𝗇𝗌𝖾𝖼𝗍𝖾𝗌 𝖣𝖾𝗏𝗈𝗋𝖾𝗎𝗋𝗌 🐝☠️"
  },
  {
    name: "𝖳𝖾𝗇𝗍𝖾𝗇",
    power: 55,
    basic: "𝖯𝗅𝗎𝗂𝖾 𝖽'𝖠𝗋𝗆𝖾𝗌 ⚔️",
    ultimate: "𝖨𝗇𝗏𝗈𝖼𝖺𝗍𝗂𝗈𝗇 𝖲𝗈𝗅𝖾𝗂𝗅 𝖫𝖾𝗏𝖺𝗇𝗍 🌅⚔️"
  },
  {
    name: "𝖹𝖺𝖻𝗎𝗓𝖺 𝖬𝗈𝗆𝗈𝖼𝗁𝗂",
    power: 60,
    basic: "𝖣𝖾𝖼𝖺𝗉𝗂𝗍𝖺𝗍𝗂𝗈𝗇 𝖪𝗎𝖻𝗂𝗄𝗂𝗋𝗂𝖻𝗈𝖼𝗁𝗈 ⚔️",
    ultimate: "𝖯𝗋𝗂𝗌𝗈𝗇 𝖽'𝖤𝖺𝗎 + 𝖡𝗋𝗎𝗆𝖾 𝖲𝖺𝗇𝗀𝗅𝖺𝗇𝗍𝖾 🌫️"
  },
  {
    name: "𝖧𝖺𝗄𝗎",
    power: 58,
    basic: "𝖠𝗂𝗀𝗎𝗂𝗅𝗅𝖾𝗌 𝖽𝖾 𝖦𝗅𝖺𝖼𝖾 ❄️",
    ultimate: "𝖬𝗂𝗋𝗈𝗂𝗋𝗌 𝖽𝖾 𝖦𝗅𝖺𝖼𝖾 𝖣𝖾𝗆𝗈𝗇𝗂𝖺𝗊𝗎𝖾𝗌 🧊"
  },
  {
    name: "𝖪𝖺𝖻𝗎𝗍𝗈 𝖸𝖺𝗄𝗎𝗌𝗁𝗂",
    power: 62,
    basic: "𝖲𝖼𝖺𝗅𝗉𝖾𝗅 𝖢𝗁𝖺𝗄𝗋𝖺 🗡️",
    ultimate: "𝖥𝗎𝗌𝗂𝗈𝗇 𝖲𝖾𝗋𝗉𝖾𝗇𝗍 𝖡𝗅𝖺𝗇𝖼 🐍"
  },
  {
    name: "𝖠𝗇𝗄𝗈 𝖬𝗂𝗍𝖺𝗋𝖺𝗌𝗁𝗂",
    power: 55,
    basic: "𝖬𝗈𝗋𝗌𝗎𝗋𝖾 𝖲𝖾𝗋𝗉𝖾𝗇𝗍 𝖣𝗈𝗎𝖻𝗅𝖾 🐍",
    ultimate: "𝖲𝖼𝖾𝖺𝗎 𝖬𝖺𝗎𝖽𝗂𝗍 𝖭𝗂𝗏𝖾𝖺𝗎 𝟤 🐍🔥"
  },
  {
    name: "𝖲𝗎𝗂𝗀𝖾𝗍𝗌𝗎 𝖧𝗈𝗓𝗎𝗄𝗂",
    power: 58,
    basic: "𝖢𝗈𝗋𝗉𝗌 𝖫𝗂𝗊𝗎𝗂𝖽𝖾 💧",
    ultimate: "𝖤𝗉𝖾𝖾 𝖪𝗎𝖻𝗂𝗄𝗂𝗋𝗂𝖻𝗈𝖼𝗁𝗈 🌊⚔️"
  },
  {
    name: "𝖩𝗎𝗎𝗀𝗈",
    power: 62,
    basic: "𝖳𝗋𝖺𝗇𝗌𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇 𝖢𝗁𝖺𝗄𝗋𝖺 🦴",
    ultimate: "𝖬𝗈𝖽𝖾 𝖬𝖺𝗅𝖾𝖽𝗂𝖼𝗍𝗂𝗈𝗇 𝖳𝗈𝗍𝖺𝗅 👹"
  },
  {
    name: "𝖪𝖺𝗋𝗂𝗇",
    power: 50,
    basic: "𝖬𝗈𝗋𝗌𝗎𝗋𝖾 𝖠𝖻𝗌𝗈𝗋𝗉𝗍𝗂𝗈𝗇 ❤️",
    ultimate: "𝖢𝗁𝖺𝗂𝗇𝖾𝗌 𝖽𝖾 𝖢𝗁𝖺𝗄𝗋𝖺 𝖯𝗋𝗈𝗍𝖾𝖼𝗍𝗋𝗂𝖼𝖾𝗌 ⛓️"
  },
  {
    name: "𝖣𝖺𝗇𝗓𝗈 𝖲𝗁𝗂𝗆𝗎𝗋𝖺",
    power: 68,
    basic: "𝖲𝗁𝖺𝗋𝗂𝗇𝗀𝖺𝗇 𝖵𝗈𝗅𝖾-𝖡𝗋𝖺𝗌 👁️",
    ultimate: "𝖨𝗓𝖺𝗇𝖺𝗀𝗂 👁️✨"
  },
  {
    name: "𝖥𝗎",
    power: 60,
    basic: "𝖣𝖺𝗇𝗌𝖾 𝖽𝗎 𝖲𝖼𝖺𝗋𝖺𝖻𝖾𝖾 🦋",
    ultimate: "𝖬𝗈𝖽𝖾 𝖢𝗁𝗂𝗆𝖾𝗋𝖾 𝖲𝖾𝗉𝗍 𝖰𝗎𝖾𝗎𝖾𝗌 🦋🔥"
  },
  {
    name: "𝖴𝗍𝖺𝗄𝖺𝗍𝖺",
    power: 58,
    basic: "𝖡𝗎𝗅𝗅𝖾𝗌 𝖤𝗑𝗉𝗅𝗈𝗌𝗂𝗏𝖾𝗌 🫧",
    ultimate: "𝖬𝗈𝖽𝖾 𝖱𝗈𝗄𝗎𝖻𝗂 🐌"
  },
  {
    name: "𝖸𝗎𝗀𝗂𝗍𝗈 𝖭𝗂𝗂",
    power: 62,
    basic: "𝖦𝗋𝗂𝖿𝖿𝖾𝗌 𝖽𝖾 𝖥𝖾𝗎 𝖡𝗅𝖾𝗎 🔥",
    ultimate: "𝖬𝗈𝖽𝖾 𝖭𝗂𝖻𝗂 🐱🔥"
  },
  {
    name: "𝖧𝖺𝗇",
    power: 60,
    basic: "𝖠𝗋𝗆𝗎𝗋𝖾 𝖽𝖾 𝖵𝖺𝗉𝖾𝗎𝗋 💨",
    ultimate: "𝖬𝗈𝖽𝖾 𝖦𝗈𝖻𝗂 🐗♨️"
  },
  {
    name: "𝖱𝗈𝗌𝗁𝗂",
    power: 60,
    basic: "𝖯𝗈𝗂𝗇𝗀𝗌 𝖽𝖾 𝖫𝖺𝗏𝖾 🌋",
    ultimate: "𝖬𝗈𝖽𝖾 𝖸𝗈𝗇𝖻𝗂 🐒🌋"
  },
  {
    name: "𝖸𝖺𝗀𝗎𝗋𝖺 𝖪𝖺𝗋𝖺𝗍𝖺𝖼𝗁𝗂",
    power: 65,
    basic: "𝖫𝖺𝗇𝖼𝖾 𝖢𝗈𝗋𝖺𝗂𝗅 ⚔️",
    ultimate: "𝖬𝗈𝖽𝖾 𝖲𝖺𝗇𝖻𝗂 🐢🌊"
  },
  {
    name: "𝖥𝗎𝗀𝖺𝗄𝗎 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 65,
    basic: "𝖡𝗈𝗎𝗅𝖾 𝖽𝖾 𝖥𝖾𝗎 𝖲𝗎𝗉𝗋𝖾𝗆𝖾 🔥",
    ultimate: "𝖲𝗎𝗌𝖺𝗇𝗈'𝗈 𝖠𝗇𝖼𝖾𝗌𝗍𝗋𝖺𝗅 💀"
  },
  {
    name: "𝖲𝗁𝗂𝗌𝗎𝗂 𝖴𝖼𝗁𝗂𝗁𝖺",
    power: 72,
    basic: "𝖪𝗈𝗍𝗈𝖺𝗆𝖺𝗍𝗌𝗎𝗄𝖺𝗆𝗂 👁️",
    ultimate: "𝖦𝖾𝗇𝗃𝗎𝗍𝗌𝗎 𝖠𝖻𝗌𝗈𝗅𝗎 🌙"
  },
  {
    name: "𝖲𝗁𝗂𝗄𝖺𝖽𝖺𝗂 𝖭𝖺𝗋𝖺",
    power: 55,
    basic: "𝖮𝗆𝖻𝗋𝖾 𝖢𝗈𝗆𝖻𝗂𝗇𝖾𝖾 🕳️",
    ultimate: "𝖯𝗂𝖾𝗀𝖾 𝖮𝗆𝖻𝗋𝖾 𝖴𝗅𝗍𝗂𝗆𝖾 🕳️⚡"
  },
  {
    name: "𝖨𝗇𝗈𝗃𝗂𝗇 𝖸𝖺𝗆𝖺𝗇𝖺𝗄𝖺",
    power: 45,
    basic: "𝖡𝖾𝗍𝖾 𝖽'𝖤𝗇𝖼𝗋𝖾 🖋️",
    ultimate: "𝖲𝗎𝗉𝖾𝗋 𝖡𝖾𝗍𝖾 𝖦𝖾𝖺𝗇𝗍𝖾 🖋️🐉"
  },
  {
    name: "𝖢𝗁𝗈𝖼𝗁𝗈 𝖠𝗄𝗂𝗆𝗂𝖼𝗁𝗂",
    power: 55,
    basic: "𝖯𝖺𝗉𝗂𝗅𝗅𝗈𝗇 𝖢𝗁𝖺𝗋𝗆𝖾 🦋",
    ultimate: "𝖳𝗋𝖺𝗇𝗌𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇 𝖯𝖺𝗉𝗂𝗅𝗅𝗈𝗇 𝖡𝗈𝗆𝖻𝖾 🦋💥"
  },
  {
    name: "𝖧𝗂𝗆𝖺𝗐𝖺𝗋𝗂 𝖴𝗓𝗎𝗆𝖺𝗄𝗂",
    power: 40,
    basic: "𝖯𝗈𝗂𝗇𝗀 𝖢𝗈𝗅𝖾𝗋𝖾 𝖡𝗒𝖺𝗄𝗎𝗀𝖺𝗇 ✊",
    ultimate: "𝖱𝖾𝗏𝖾𝗂𝗅 𝖡𝗒𝖺𝗄𝗎𝗀𝖺𝗇 𝖥𝗎𝗋𝗂𝖾𝗎𝗑 👁️💥"
  },
  {
    name: "𝖬𝖾𝗍𝖺𝗅 𝖫𝖾𝖾",
    power: 62,
    basic: "𝖣𝖺𝗇𝗌𝖾 𝖣𝗒𝗇𝖺𝗆𝗂𝗊𝗎𝖾 ⚡",
    ultimate: "𝟪𝖾𝗆𝖾 𝖯𝗈𝗋𝗍𝖾 𝖩𝗎𝗏𝖾𝗇𝗂𝗅𝖾 🔥"
  },
  {
    name: "𝖲𝗎𝗆𝗂𝗋𝖾 𝖪𝖺𝗄𝖾𝗂",
    power: 50,
    basic: "𝖥𝗂𝗅 𝖢𝗁𝖺𝗄𝗋𝖺 𝖬𝖺𝗋𝗂𝗈𝗇𝗇𝖾𝗍𝗍𝖾 🕸️",
    ultimate: "𝖲𝖺𝗇𝖼𝗍𝗎𝖺𝗂𝗋𝖾 𝖬𝖾𝗇𝗍𝖺𝗅 🌸"
  },
  {
    name: "𝖣𝖾𝗇𝗄𝗂 𝖪𝖺𝗆𝗂𝗇𝖺𝗋𝗂𝗆𝗈𝗇",
    power: 45,
    basic: "𝖤𝗅𝖾𝖼𝗍𝗋𝗈-𝖭𝗂𝗇𝗃𝗎𝗍𝗌𝗎 ⚡",
    ultimate: "𝖲𝗎𝗋𝖼𝗁𝖺𝗋𝗀𝖾 𝖳𝗈𝗍𝖺𝗅𝖾 ⚡💥"
  },
  {
    name: "𝖠𝗆𝖺𝖽𝗈 𝖲𝖺𝗇𝗓𝗎",
    power: 65,
    basic: "𝖣𝗋𝗈𝗇𝖾 𝖪𝖺𝗋𝗆𝖺 🤖",
    ultimate: "𝖲𝖺𝖻𝗈𝗍𝖺𝗀𝖾 𝖴𝗅𝗍𝗂𝗆𝖾 🤖💥"
  },
  {
    name: "𝖢𝗈𝖽𝖾",
    power: 78,
    basic: "𝖦𝗋𝗂𝖿𝖿𝖾𝗌 𝖢𝗅𝖺𝗂𝗋𝖾𝗌 🖤",
    ultimate: "𝖱𝖾𝗏𝖾𝗂𝗅 𝖪𝖺𝗋𝗆𝖺 𝖠𝖻𝗌𝗈𝗅𝗎 🖤💀"
  },
  {
    name: "𝖤𝗂𝖽𝖺",
    power: 60,
    basic: "𝖢𝗁𝖺𝗋𝗆𝖾 𝖮𝗆𝗇𝗂𝗌𝖼𝗂𝖾𝗇𝗍 💜",
    ultimate: "𝖣𝗂𝗌𝗍𝗈𝗋𝗌𝗂𝗈𝗇 𝖽𝖾 𝖯𝖾𝗋𝖼𝖾𝗉𝗍𝗂𝗈𝗇 💜🌀"
  },
  {
    name: "𝖣𝖺𝖾𝗆𝗈𝗇 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂",
    power: 76,
    basic: "𝖥𝗋𝖺𝗉𝗉𝖾 𝖣𝗂𝗏𝗂𝗇𝖾 ⚡",
    ultimate: "𝖤𝗏𝖾𝗂𝗅 𝖮𝗍𝗌𝗎𝗍𝗌𝗎𝗄𝗂 ✨"
  },
  {
    name: "𝖣𝖾𝖾𝗉𝖺",
    power: 65,
    basic: "𝖡𝗋𝖺𝗌 𝖢𝗒𝖻𝖾𝗋𝗇𝖾𝗍𝗂𝗊𝗎𝖾𝗌 🦾",
    ultimate: "𝖢𝗁𝖺𝗋𝗀𝖾 𝖡𝗅𝗂𝗇𝖽𝖾𝖾 🦾💥"
  },
  {
    name: "𝖡𝗈𝗋𝗈",
    power: 68,
    basic: "𝖯𝗈𝗂𝗌𝗈𝗇 𝖪𝖺𝗋𝗆𝖺 ☠️",
    ultimate: "𝖤𝗑𝗉𝗅𝗈𝗌𝗂𝗈𝗇 𝖪𝖺𝗋𝗆𝖺 𝖳𝗈𝗍𝖺𝗅𝖾 ☠️💥"
  }
];

const damageSystem = {
  basic: { min: 8, max: 15, chakraCost: 0 },
  special: { min: 15, max: 25, chakraCost: 20 },
  ultimate: { min: 30, max: 45, chakraCost: 75, failChance: 0.3 },
  charge: { chakraGain: 25 }
};

function getHealthColor(hp) {
  if (hp === 100) return "💚";
  if (hp >= 85) return "💚";
  if (hp >= 55) return "💛";
  if (hp >= 25) return "🧡";
  if (hp > 0) return "❤️";
  return "💔";
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const gameState = {};

module.exports = {
  config: {
    name: "naruto-storm",
    aliases: ["nstorm"],
    version: "4.2",
    author: "Delfa •|• ꗇ︱Blẳȼk 义 • fixed by Christus",
    role: 0,
    category: "game",
    shortDescription: "Jeu de combat Naruto multijoueur/solo",
    longDescription: "Simule un combat entre deux joueurs ou contre un bot avec les personnages de Naruto, système de chakra avancé",
    guide: { en: "{p}naruto-storm" }
  },

  onStart: async function ({ message, event, api }) {
    const threadID = event.threadID;

    if (gameState[threadID]) {
      return message.reply("⛔ 𝖴𝗇𝖾 𝗉𝖺𝗋𝗍𝗂𝖾 𝖾𝗌𝗍 𝖽𝖾́𝗃𝖺̀ 𝖾𝗇 𝖼𝗈𝗎𝗋𝗌 𝖽𝖺𝗇𝗌 𝖼𝖾 𝗀𝗋𝗈𝗎𝗉𝖾. 𝖳𝖺𝗉𝖾𝗓 'fin' 𝗉𝗈𝗎𝗋 𝗅𝖺 𝗍𝖾𝗋𝗆𝗂𝗇𝖾𝗋.");
    }

    gameState[threadID] = {
      step: "waiting_start",
      players: {},
      turn: null,
      p1Character: null,
      p2Character: null,
      p1HP: 100,
      p2HP: 100,
      p1Chakra: 100,
      p2Chakra: 100,
      chakraRegen: 5,
      defending: false,
      lastAction: null,
      lastPlayer: null
    };

    let welcomeAttachment = null;
    try {
      welcomeAttachment = await global.utils.getStreamFromURL("https://i.ibb.co/sv03yFtV/1a221879470b.png");
    } catch (e) {
      welcomeAttachment = null;
    }

    return message.reply({
      body: `🎮 𝗡𝗔𝗥𝗨𝗧𝗢-𝗦𝗧𝗢𝗥𝗠 𝗩𝟰.𝟮\n━━━━━━━━━━━━━━\n𝗘𝗻𝘃𝗼𝘆𝗲𝘇 "start" 𝗽𝗼𝘂𝗿 𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿`,
      attachment: welcomeAttachment || undefined
    });
  },

  onChat: async function ({ event, message, api }) {
    const threadID = event.threadID;
    const userID = event.senderID;
    const body = event.body.toLowerCase();

    if (!gameState[threadID]) return;
    const state = gameState[threadID];

    if (body === "fin" || body === "quit") {
      delete gameState[threadID];
      return message.reply("👋 𝖫𝖺 𝗉𝖺𝗋𝗍𝗂𝖾 𝖺 𝖾́𝗍𝖾́ 𝖺𝗇𝗇𝗎𝗅𝖾́𝖾. 𝖤𝗇𝗏𝗈𝗒𝖾𝗓 'start' 𝗉𝗈𝗎𝗋 𝗋𝖾𝖼𝗈𝗆𝗆𝖾𝗇𝖼𝖾𝗋.");
    }

    if (state.step !== "waiting_start" && state.step !== "choose_p1" && state.step !== "choose_p2" &&
        userID !== state.players.p1 && userID !== state.players.p2) {
      return;
    }

    if (state.step === "waiting_start" && body === "start") {
      state.step = "choose_p1";
      state.players.p1 = userID;
      return message.reply("🧙 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭\n𝗧𝗮𝗽𝗲𝘇 'p1' 𝗽𝗼𝘂𝗿 𝘀𝗲́𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝗿 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲");
    }

    if (state.step === "choose_p1" && body === "p1") {
      if (userID !== state.players.p1) return;
      state.step = "choose_p2";
      return message.reply("🧝 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮\n𝗧𝗮𝗽𝗲𝘇 'p2' 𝗽𝗼𝘂𝗿 𝘃𝗼𝘂𝘀 𝗶𝗻𝘀𝗰𝗿𝗶𝗿𝗲");
    }

    if (state.step === "choose_p2" && body === "p2") {
      if (userID === state.players.p1) {
        return message.reply("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝖾̂𝗍𝗋𝖾 𝗅𝖾𝗌 𝖽𝖾𝗎𝗑 𝗃𝗈𝗎𝖾𝗎𝗋𝗌 !");
      }
      state.players.p2 = userID;
      state.step = "choose_characters_p1";

      let characterList = "🎭 𝗖𝗛𝗢𝗜𝗦𝗜𝗦𝗦𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗣𝗘𝗥𝗦𝗢𝗡𝗡𝗔𝗚𝗘\n━━━━━━━━━━━━━━\n";
      characterList += characters.map((char, i) =>
        `${i + 1}. ${char.name} (${char.power}★)`
      ).join("\n");

      const p1Info = await api.getUserInfo(state.players.p1);
      const p1Name = p1Info[state.players.p1].name;

      return message.reply({
        body: characterList + `\n\n@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗿𝗲́𝗽𝗼𝗻𝗱𝗲𝘇 𝗮𝘃𝗲𝗰 𝗹𝗲 𝗻𝘂𝗺𝗲́𝗿𝗼 𝗱𝘂 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
        mentions: [{
          tag: `@${p1Name}`,
          id: state.players.p1
        }]
      });
    }

    if (state.step.startsWith("choose_characters")) {
      const index = parseInt(body) - 1;

      if (isNaN(index) || index < 0 || index >= characters.length) {
        return message.reply("❌ 𝖭𝗎𝗆𝖾́𝗋𝗈 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾. 𝖱𝖾́𝖾𝗌𝗌𝖺𝗒𝖾𝗓.");
      }

      if (state.step === "choose_characters_p1" && userID === state.players.p1) {
        state.p1Character = characters[index];
        state.step = "choose_characters_p2";

        const p2Info = await api.getUserInfo(state.players.p2);
        const p2Name = p2Info[state.players.p2].name;

        return message.reply({
          body: `✅ 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭: ${state.p1Character.name}\n\n@${p2Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮, 𝗰𝗵𝗼𝗶𝘀𝗶𝘀𝘀𝗲𝘇 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
          mentions: [{
            tag: `@${p2Name}`,
            id: state.players.p2
          }]
        });
      }

      if (state.step === "choose_characters_p2" && userID === state.players.p2) {
        state.p2Character = characters[index];
        state.turn = "p1";
        state.step = "battle";

        const p1Info = await api.getUserInfo(state.players.p1);
        const p2Info = await api.getUserInfo(state.players.p2);
        const p1Name = p1Info[state.players.p1].name;
        const p2Name = p2Info[state.players.p2].name;

        const battleStartMsg = `⚔️ 𝗖𝗢𝗠𝗕𝗔𝗧 𝗗𝗘𝗕𝗨𝗧\n━━━━━━━━━━━━━━\n` +
          `✦ ${state.p1Character.name} (${p1Name}) 𝗩𝗦 ${state.p2Character.name} (${p2Name})\n\n` +
          `𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n` +
          `» 𝗮 - 𝗔𝘁𝘁𝗮𝗾𝘂𝗲 𝗯𝗮𝘀𝗶𝗾𝘂𝗲 (${damageSystem.basic.min}-${damageSystem.basic.max}%)\n` +
          `» 𝗯 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘀𝗽𝗲́𝗰𝗶𝗮𝗹𝗲 (-${damageSystem.special.chakraCost} chakra)\n` +
          `» 𝘅 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘂𝗹𝘁𝗶𝗺𝗲 (-${damageSystem.ultimate.chakraCost} chakra)\n` +
          `» 𝗰 - 𝗖𝗵𝗮𝗿𝗴𝗲𝗿 𝗰𝗵𝗮𝗸𝗿𝗮 (+${damageSystem.charge.chakraGain}%)\n` +
          `» 𝗱 - 𝗗𝗲́𝗳𝗲𝗻𝘀𝗲 (𝗿𝗲́𝗱𝘂𝗶𝘁 𝗹𝗲𝘀 𝗱𝗲́𝗴𝗮̂𝘁𝘀)\n\n` +
          `@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗰'𝗲𝘀𝘁 𝗮̀ 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;

        return message.reply({
          body: battleStartMsg,
          mentions: [{
            tag: `@${p1Name}`,
            id: state.players.p1
          }]
        });
      }
      return;
    }

    if (state.step === "battle") {
      const currentPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
      if (userID !== currentPlayer) return;

      if (body === 'c' && state.lastAction === 'c' && state.lastPlayer === userID) {
        return message.reply("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝖼𝗁𝖺𝗋𝗀𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝗁𝖺𝗄𝗋𝖺 𝖽𝖾𝗎𝗑 𝖿𝗈𝗂𝗌 𝗅'𝗎𝗇𝖾 𝖺𝗉𝗋𝖾̀𝗌 𝗅'𝖺𝗎𝗍𝗋𝖾 !");
      }

      const attacker = state.turn === "p1" ? state.p1Character : state.p2Character;
      const defender = state.turn === "p1" ? state.p2Character : state.p1Character;
      const hpKey = state.turn === "p1" ? "p2HP" : "p1HP";
      const chakraKey = state.turn === "p1" ? "p1Chakra" : "p2Chakra";

      let damage = 0;
      let tech = "𝖠𝗍𝗍𝖺𝗊𝗎𝖾 𝖻𝖺𝗌𝗂𝗊𝗎𝖾";
      let effect = "👊";
      let chakraUsed = 0;
      let missed = false;
      let chargeMessage = "";

      switch (body) {
        case 'a':
          damage = randomBetween(damageSystem.basic.min, damageSystem.basic.max);
          tech = "𝖠𝗍𝗍𝖺𝗊𝗎𝖾 𝖻𝖺𝗌𝗂𝗊𝗎𝖾";
          effect = "👊";
          break;

        case 'b':
          if (state[chakraKey] < damageSystem.special.chakraCost) {
            missed = true;
          } else {
            damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
            chakraUsed = damageSystem.special.chakraCost;
            tech = attacker.basic;
            effect = attacker.basic.split(' ').pop();
          }
          break;

        case 'x':
          if (state[chakraKey] < damageSystem.ultimate.chakraCost) {
            missed = true;
          } else {
            chakraUsed = damageSystem.ultimate.chakraCost;
            if (Math.random() < damageSystem.ultimate.failChance) {
              missed = true;
              tech = attacker.ultimate + " (𝖾́𝖼𝗁𝗈𝗎𝖾́)";
              effect = "❌";
            } else {
              damage = randomBetween(damageSystem.ultimate.min, damageSystem.ultimate.max);
              tech = attacker.ultimate;
              effect = attacker.ultimate.split(' ').pop();
            }
          }
          break;

        case 'c':
          state[chakraKey] = Math.min(100, state[chakraKey] + damageSystem.charge.chakraGain);
          chargeMessage = `🔋 ${attacker.name} 𝖺𝖼𝖼𝗎𝗆𝗎𝗅𝖾 +${damageSystem.charge.chakraGain}% 𝖽𝖾 𝖼𝗁𝖺𝗄𝗋𝖺 !`;
          state.lastAction = 'c';
          state.lastPlayer = userID;
          state.turn = state.turn === "p1" ? "p2" : "p1";
          return await sendBattleMessage();

        case 'd':
          state.defending = state.turn;
          state.lastAction = 'd';
          state.lastPlayer = userID;
          state.turn = state.turn === "p1" ? "p2" : "p1";
          return message.reply(`🛡️ ${attacker.name} 𝗌𝖾 𝗆𝖾𝗍 𝖾𝗇 𝗉𝗈𝗌𝗂𝗍𝗂𝗈𝗇 𝖽𝖾́𝖿𝖾𝗇𝗌𝗂𝗏𝖾 !`);

        default:
          return message.reply("❌ 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾\n» 𝗮 - 𝖠𝗍𝗍𝖺𝗊𝗎𝖾\n» 𝗯 - 𝖳𝖾𝖼𝗁𝗇𝗂𝗊𝗎𝖾\n» 𝘅 - 𝖴𝗅𝗍𝗂𝗆𝖾\n» 𝗰 - 𝖢𝗁𝖺𝗋𝗀𝖾𝗋\n» 𝗱 - 𝖣𝖾́𝖿𝖾𝗇𝗌𝖾");
      }

      if (!missed) {
        if (state.defending && state.defending !== state.turn) {
          damage = Math.floor(damage * 0.6);
          tech += " (𝖽𝖾́𝖿𝖾𝗇𝖽𝗎)";
        }

        state[chakraKey] -= chakraUsed;
        state[chakraKey] = Math.max(0, state[chakraKey]);
        state[hpKey] -= damage;
        state[hpKey] = Math.max(0, state[hpKey]);
      }

      state.lastAction = body;
      state.lastPlayer = userID;

      if (state.turn === "p1") {
        state.p1Chakra = Math.min(100, state.p1Chakra + state.chakraRegen);
      } else {
        state.p2Chakra = Math.min(100, state.p2Chakra + state.chakraRegen);
      }

      async function sendBattleMessage() {
        let msg = "";

        if (body !== 'c' && !missed) {
          msg += `⚡ ${attacker.name} 𝗎𝗍𝗂𝗅𝗂𝗌𝖾 ${tech} ${effect}\n`;
          msg += `💥 𝗂𝗇𝖿𝗅𝗂𝗀𝖾 ${damage}% 𝖽𝖾 𝖽𝖾́𝗀𝖺̂𝗍𝗌 𝖺̀ ${defender.name} !\n\n`;
        } else if (missed) {
          msg += `⚡ ${attacker.name} 𝗍𝖾𝗇𝗍𝖾 ${tech}...\n`;
          const reason = state[chakraKey] < damageSystem.ultimate.chakraCost ? "𝖢𝗁𝖺𝗄𝗋𝖺 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍" : "𝖳𝖾𝖼𝗁𝗇𝗂𝗊𝗎𝖾 𝗋𝖺𝗍𝖾́𝖾";
          msg += `❌ 𝖤́𝖼𝗁𝗈𝗎𝖾 ! (${reason})\n\n`;
        }

        msg += `━━━━━━━━━━━━━━\n`;
        msg += `${getHealthColor(state.p1HP)}|${state.p1Character.name}: HP ${state.p1HP}%\n`;
        msg += `💙| 𝖢𝗁𝖺𝗄𝗋𝖺 ${state.p1Chakra}%\n`;
        msg += `━━━━━━━━━━━━━━\n`;
        msg += `${getHealthColor(state.p2HP)}|${state.p2Character.name}: HP ${state.p2HP}%\n`;
        msg += `💙| 𝖢𝗁𝖺𝗄𝗋𝖺 ${state.p2Chakra}%\n`;
        msg += `━━━━━━━━━━━━━━\n`;

        if (chargeMessage) msg += `${chargeMessage}\n`;

        if (state.p1HP <= 0 || state.p2HP <= 0) {
          const winner = state.p1HP <= 0 ? state.p2Character.name : state.p1Character.name;
          const winnerDisplay = state.p1HP <= 0 ? await api.getUserInfo(state.players.p2) : await api.getUserInfo(state.players.p1);
          const winnerName = winnerDisplay[Object.keys(winnerDisplay)[0]].name;
          msg += `🏆 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 𝗗𝗘 ${winner} (${winnerName}) !\n`;
          msg += `𝗙𝗶𝗻 𝗱𝘂 𝗰𝗼𝗺𝗯𝗮𝘁. 𝖳𝖺𝗉𝖾𝗓 'fin' 𝗉𝗈𝗎𝗋 𝗋𝖾𝖼𝗈𝗆𝗆𝖾𝗇𝖼𝖾𝗋.`;
          delete gameState[threadID];
        } else {
          state.turn = state.turn === "p1" ? "p2" : "p1";
          state.defending = false;
          const nextPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
          const nextInfo = await api.getUserInfo(nextPlayer);
          const nextName = nextInfo[nextPlayer].name;
          msg += `@${nextName} 𝗝𝗈𝗎𝖾𝗎𝗋 ${state.turn === "p1" ? "1" : "2"}, 𝗰'𝖾𝗌𝗍 𝖺̀ 𝗍𝗈𝗂 𝗃𝗈𝗎𝖾𝗋 !`;
        }

        const nextPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
        const nextInfo = await api.getUserInfo(nextPlayer);
        const nextName = nextInfo[nextPlayer].name;

        return message.reply({
          body: msg,
          mentions: [{
            tag: `@${nextName}`,
            id: nextPlayer
          }]
        });
      }

      return await sendBattleMessage();
    }
  }
};