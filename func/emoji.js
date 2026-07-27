const { loadImage } = require('canvas');

function getURL(emoji) {
  const code = [...emoji].map(c => c.codePointAt(0).toString(16)).join("-");
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`;
}

async function draw(ctx, emoji, x, y, size) {
  try {
    const img = await loadImage(getURL(emoji));
    ctx.drawImage(img, x, y, size, size);
  } catch (e) {}
}

async function drawText(ctx, text, x, y, font, emojiSize = null) {
  ctx.save();
  ctx.font = font;
  const emojiSizePx = emojiSize || parseInt(font.match(/\d+/)) || 30;
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
  const segments = [];
  let lastIndex = 0, match;
  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    segments.push({ type: 'emoji', value: match[0] });
    lastIndex = emojiRegex.lastIndex;
  }
  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) });

  let currentX = x;
  for (const seg of segments) {
    if (seg.type === 'text') {
      ctx.fillText(seg.value, currentX, y);
      currentX += ctx.measureText(seg.value).width;
    } else {
      await draw(ctx, seg.value, currentX, y - emojiSizePx, emojiSizePx);
      currentX += emojiSizePx;
    }
  }
  ctx.restore();
  return currentX;
}

const emojis = {
  smile: {
    grin: "😀", smile: "😃", joy: "😄", laugh: "😆", sweat: "😅", rolling: "😝", wink: "😉", blush: "😊",
    innocent: "😇", heartEyes: "😍", kissing: "😘", stuckOut: "😛", tongue: "😜", zip: "🤐",
    sunglasses: "😎", smirk: "😏", neutral: "😐", expressionless: "😑", unamused: "😒", weary: "😩",
    sleepy: "😪", tired: "😫", sob: "😭", cry: "😢", cold: "🥶", hot: "🥵", dizzy: "😵",
    angry: "😠", rage: "😡", triumph: "😤", scream: "😱", fearful: "😨", flushed: "😳",
    disappointed: "😞", worried: "😟", yum: "😋", lying: "🤥", relief: "😌", thinking: "🤔",
    facepalm: "🤦", shrug: "🤷", nerd: "🤓", starstruck: "🤩", party: "🥳", zany: "🤪",
    hugging: "🤗", handshake: "🤝", praying: "🙏", clap: "👏", thumbsup: "👍", thumbsdown: "👎"
  },
  people: {
    boy: "👦", girl: "👧", man: "👨", woman: "👩", superhero: "🦸", supervillain: "🦹",
    elf: "🧝", fairy: "🧚", vampire: "🧛", mermaid: "🧜", genie: "🧞", zombie: "🧟",
    santa: "🎅", mrsClaus: "🤶", police: "👮", detective: "🕵️", guard: "💂", builder: "👷",
    farmer: "👨‍🌾", cook: "👨‍🍳", student: "👨‍🎓", singer: "👨‍🎤", artist: "👨‍🎨", teacher: "👨‍🏫",
    worker: "👨‍💼", mechanic: "👨‍🔧", scientist: "👨‍🔬", astronaut: "👨‍🚀", firefighter: "👨‍🚒",
    health: "👨‍⚕️", judge: "👨‍⚖️", pilot: "👨‍✈️",
    walking: "🚶", running: "🏃", dancing: "💃", levitate: "🕴️", kneeling: "🧎", standing: "🧍",
    hair: { blond: "👱", red: "🦰", curly: "🦱", white: "🦳", bald: "🦲" }
  },
  heart: {
    red: "❤️", orange: "🧡", yellow: "💛", green: "💚", blue: "💙", purple: "💜", brown: "🤎", black: "🖤", white: "🤍",
    broken: "💔", heartbeat: "💓", sparkling: "💖", growing: "💗", cupid: "💘", arrow: "💘",
    two: "💕", revolving: "💞", exclamation: "❣️", letter: "💌"
  },
  animals: {
    mammal: {
      monkey: "🐒", gorilla: "🦍", dog: "🐕", wolf: "🐺", fox: "🦊", raccoon: "🦝", cat: "🐈", lion: "🦁",
      tiger: "🐅", leopard: "🐆", horse: "🐎", zebra: "🦓", deer: "🦌", cow: "🐄", pig: "🐖", boar: "🐗",
      elephant: "🐘", rhino: "🦏", hippo: "🦛", mouse: "🐁", rat: "🐀", hamster: "🐹", rabbit: "🐇",
      squirrel: "🐿️", bat: "🦇", bear: "🐻", sloth: "🦥", otter: "🦦", skunk: "🦨", kangaroo: "🦘",
      badger: "🦡", paw: "🐾"
    },
    bird: {
      turkey: "🦃", chicken: "🐔", rooster: "🐓", hatching: "🐣", chick: "🐤", eagle: "🦅", duck: "🦆",
      swan: "🦢", owl: "🦉", parrot: "🦜", pigeon: "🐦", peacock: "🦚"
    },
    aquatic: {
      frog: "🐸", crocodile: "🐊", turtle: "🐢", lizard: "🦎", snake: "🐍", fish: "🐟", tropical: "🐠",
      blowfish: "🐡", shark: "🦈", dolphin: "🐬", whale: "🐳", octopus: "🐙", shellfish: "🦐", crab: "🦀",
      jellyfish: "🪼", seahorse: "🐠"
    },
    bug: { snail: "🐌", butterfly: "🦋", bug: "🐛", ant: "🐜", bee: "🐝", beetle: "🪲", spider: "🕷️", scorpion: "🦂" }
  },
  food: {
    fruit: {
      apple: "🍎", greenApple: "🍏", pear: "🍐", orange: "🍊", lemon: "🍋", banana: "🍌", watermelon: "🍉",
      grapes: "🍇", strawberry: "🍓", blueberries: "🫐", melon: "🍈", cherry: "🍒", peach: "🍑", mango: "🥭",
      pineapple: "🍍", coconut: "🥥", kiwi: "🥝"
    },
    vegetable: {
      tomato: "🍅", eggplant: "🍆", avocado: "🥑", broccoli: "🥦", cucumber: "🥒", carrot: "🥕", corn: "🌽",
      pepper: "🌶️", hot: "🌶️", mushroom: "🍄", potato: "🥔", sweet: "🍠", leafy: "🥬"
    },
    prepared: {
      pizza: "🍕", burger: "🍔", fries: "🍟", hotdog: "🌭", taco: "🌮", burrito: "🌯", sandwich: "🥪",
      salad: "🥗", pasta: "🍝", rice: "🍚", curry: "🍛", dumpling: "🥟", ramen: "🍜", fried: "🍤",
      egg: "🍳", pancake: "🥞", waffle: "🧇", bacon: "🥓", steak: "🥩", chicken: "🍗", meat: "🍖"
    },
    dessert: {
      cake: "🍰", cupcake: "🧁", pie: "🥧", icecream: "🍦", frozen: "🍨", doughnut: "🍩", cookie: "🍪",
      chocolate: "🍫", candy: "🍬", lollipop: "🍭", popcorn: "🍿", pudding: "🍮"
    },
    drink: {
      coffee: "☕", tea: "🍵", juice: "🧃", milk: "🥛", soda: "🥤", beer: "🍺", wine: "🍷", cocktail: "🍸",
      tropical: "🍹", champagne: "🍾", ice: "🧊"
    }
  },
  sports: {
    soccer: "⚽", basketball: "🏀", football: "🏈", baseball: "⚾", volleyball: "🏐", tennis: "🎾",
    pingpong: "🏓", badminton: "🏸", hockey: "🏒", cricket: "🏏", golf: "⛳", bowling: "🎳",
    rugby: "🏉", frisbee: "🥏", billiards: "🎱", fishing: "🎣", climbing: "🧗", skating: "⛸️",
    skateboard: "🛹", surfing: "🏄", swimming: "🏊", running: "🏃", cycling: "🚴", weight: "🏋️",
    yoga: "🧘", martial: "🥋", fencing: "🤺", horse: "🏇"
  },
  travel: {
    transport: {
      plane: "✈️", helicopter: "🚁", rocket: "🚀", satellite: "🛸", car: "🚗", taxi: "🚕", bus: "🚌",
      train: "🚆", tram: "🚊", subway: "🚇", bike: "🚲", scooter: "🛴", ship: "🚢", boat: "⛵",
      anchor: "⚓"
    },
    place: {
      house: "🏠", buildings: "🏙️", factory: "🏭", hospital: "🏥", school: "🏫", hotel: "🏨",
      bank: "🏦", atms: "🏧", church: "⛪", mosque: "🕌", temple: "🛕", statue: "🗽",
      mountain: "⛰️", volcano: "🌋", beach: "🏖️", desert: "🏜️", island: "🏝️", park: "🏞️"
    },
    map: {
      globe: "🌍", map: "🗺️", compass: "🧭", flag: "🏁", finish: "🏁", sign: "📍"
    }
  },
  symbols: {
    arrow: {
      up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️", updown: "⬆️⬇️", leftright: "⬅️➡️",
      upSmall: "🔼", downSmall: "🔽", back: "🔙", end: "🔚", soon: "🔜", top: "🔝"
    },
    math: { plus: "➕", minus: "➖", multiply: "✖️", divide: "➗", equal: "🟰", infinity: "♾️" },
    status: { check: "✅", cross: "❌", warning: "⚠️", info: "ℹ️", question: "❓", exclamation: "❗" },
    tech: { phone: "📱", computer: "💻", keyboard: "⌨️", mouse: "🖱️", disk: "💾", cd: "💿", dvd: "📀" },
    time: { clock: "🕒", hourglass: "⏳", calendar: "📅", alarm: "⏰", timer: "⏲️" },
    currency: { dollar: "💵", euro: "💶", pound: "💷", yen: "💴", bitcoin: "₿", money: "💰", credit: "💳" }
  },
  flags: {
    af: "🇦🇫", al: "🇦🇱", dz: "🇩🇿", ad: "🇦🇩", ao: "🇦🇴", ag: "🇦🇬", ar: "🇦🇷", am: "🇦🇲", au: "🇦🇺", at: "🇦🇹",
    az: "🇦🇿", bs: "🇧🇸", bh: "🇧🇭", bd: "🇧🇩", bb: "🇧🇧", by: "🇧🇾", be: "🇧🇪", bz: "🇧🇿", bj: "🇧🇯", bt: "🇧🇹",
    bo: "🇧🇴", ba: "🇧🇦", bw: "🇧🇼", br: "🇧🇷", bn: "🇧🇳", bg: "🇧🇬", bf: "🇧🇫", bi: "🇧🇮", kh: "🇰🇭", cm: "🇨🇲",
    ca: "🇨🇦", cv: "🇨🇻", cf: "🇨🇫", td: "🇹🇩", cl: "🇨🇱", cn: "🇨🇳", co: "🇨🇴", km: "🇰🇲", cg: "🇨🇬", cd: "🇨🇩",
    cr: "🇨🇷", ci: "🇨🇮", hr: "🇭🇷", cu: "🇨🇺", cy: "🇨🇾", cz: "🇨🇿", dk: "🇩🇰", dj: "🇩🇯", dm: "🇩🇲", do: "🇩🇴",
    ec: "🇪🇨", eg: "🇪🇬", sv: "🇸🇻", gq: "🇬🇶", er: "🇪🇷", ee: "🇪🇪", et: "🇪🇹", fj: "🇫🇯", fi: "🇫🇮", fr: "🇫🇷",
    ga: "🇬🇦", gm: "🇬🇲", ge: "🇬🇪", de: "🇩🇪", gh: "🇬🇭", gr: "🇬🇷", gd: "🇬🇩", gt: "🇬🇹", gn: "🇬🇳", gw: "🇬🇼",
    gy: "🇬🇾", ht: "🇭🇹", hn: "🇭🇳", hu: "🇭🇺", is: "🇮🇸", in: "🇮🇳", id: "🇮🇩", ir: "🇮🇷", iq: "🇮🇶", ie: "🇮🇪",
    il: "🇮🇱", it: "🇮🇹", jm: "🇯🇲", jp: "🇯🇵", jo: "🇯🇴", kz: "🇰🇿", ke: "🇰🇪", ki: "🇰🇮", kp: "🇰🇵", kr: "🇰🇷",
    kw: "🇰🇼", kg: "🇰🇬", la: "🇱🇦", lv: "🇱🇻", lb: "🇱🇧", ls: "🇱🇸", lr: "🇱🇷", ly: "🇱🇾", li: "🇱🇮", lt: "🇱🇹",
    lu: "🇱🇺", mk: "🇲🇰", mg: "🇲🇬", mw: "🇲🇼", my: "🇲🇾", mv: "🇲🇻", ml: "🇲🇱", mt: "🇲🇹", mh: "🇲🇭", mr: "🇲🇷",
    mu: "🇲🇺", mx: "🇲🇽", fm: "🇫🇲", md: "🇲🇩", mc: "🇲🇨", mn: "🇲🇳", me: "🇲🇪", ma: "🇲🇦", mz: "🇲🇿", mm: "🇲🇲",
    na: "🇳🇦", nr: "🇳🇷", np: "🇳🇵", nl: "🇳🇱", nz: "🇳🇿", ni: "🇳🇮", ne: "🇳🇪", ng: "🇳🇬", no: "🇳🇴", om: "🇴🇲",
    pk: "🇵🇰", pw: "🇵🇼", ps: "🇵🇸", pa: "🇵🇦", pg: "🇵🇬", py: "🇵🇾", pe: "🇵🇪", ph: "🇵🇭", pl: "🇵🇱", pt: "🇵🇹",
    qa: "🇶🇦", ro: "🇷🇴", ru: "🇷🇺", rw: "🇷🇼", kn: "🇰🇳", lc: "🇱🇨", vc: "🇻🇨", ws: "🇼🇸", sm: "🇸🇲", st: "🇸🇹",
    sa: "🇸🇦", sn: "🇸🇳", rs: "🇷🇸", sc: "🇸🇨", sl: "🇸🇱", sg: "🇸🇬", sk: "🇸🇰", si: "🇸🇮", sb: "🇸🇧", so: "🇸🇴",
    za: "🇿🇦", ss: "🇸🇸", es: "🇪🇸", lk: "🇱🇰", sd: "🇸🇩", sr: "🇸🇷", sz: "🇸🇿", se: "🇸🇪", ch: "🇨🇭", sy: "🇸🇾",
    tw: "🇹🇼", tj: "🇹🇯", tz: "🇹🇿", th: "🇹🇭", tl: "🇹🇱", tg: "🇹🇬", to: "🇹🇴", tt: "🇹🇹", tn: "🇹🇳", tr: "🇹🇷",
    tm: "🇹🇲", tv: "🇹🇻", ug: "🇺🇬", ua: "🇺🇦", ae: "🇦🇪", gb: "🇬🇧", us: "🇺🇸", uy: "🇺🇾", uz: "🇺🇿", vu: "🇻🇺",
    va: "🇻🇦", ve: "🇻🇪", vn: "🇻🇳", ye: "🇾🇪", zm: "🇿🇲", zw: "🇿🇼"
  }
};

const shortcuts = {};
for (const cat in emojis) {
  for (const sub in emojis[cat]) {
    if (typeof emojis[cat][sub] === 'object') {
      for (const name in emojis[cat][sub]) {
        shortcuts[`${cat}_${sub}_${name}`] = async (ctx, x, y, size) => draw(ctx, emojis[cat][sub][name], x, y, size);
      }
    } else {
      shortcuts[`${cat}_${sub}`] = async (ctx, x, y, size) => draw(ctx, emojis[cat][sub], x, y, size);
    }
  }
}

module.exports = {
  getURL,
  draw,
  drawText,
  emojis,
  get: (path) => {
    const parts = path.split('.');
    let current = emojis;
    for (const part of parts) {
      if (current && current[part]) current = current[part];
      else return "❓";
    }
    return typeof current === 'string' ? current : "❓";
  },
  apply: async (ctx, name, x, y, size) => {
    const emoji = typeof name === 'string' ? (module.exports.get(name) || emojis[name]) : null;
    if (!emoji) return false;
    await draw(ctx, emoji, x, y, size);
    return true;
  },
  list: () => {
    const result = [];
    function traverse(obj, prefix = '') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') result.push(prefix + key);
        else if (typeof obj[key] === 'object') traverse(obj[key], prefix + key + '.');
      }
    }
    traverse(emojis);
    return result;
  },
  ...shortcuts
};
