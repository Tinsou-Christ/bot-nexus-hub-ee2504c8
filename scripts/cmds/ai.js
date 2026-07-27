const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let fonts;
try {
  fonts = require('../../func/font.js');
} catch {
  fonts = {
    serif: (t) => t,
    sansSerif: (t) => t
  };
}

const STICKERS = [
  "254594829337221",
  "254594546003916",
  "254593389337365",
  "254595126003858",
  "254593766003994",
  "254595732670464",
  "254595959337108",
  "526207648112667",
  "374675960117310",
  "374676263450613",
  "380333206218252",
  "380333506218222",
  "375055800079326",
  "387545578037993"
];

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const TMP_DIR = path.join(__dirname, 'tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const getRandomSticker = () => {
  return STICKERS[Math.floor(Math.random() * STICKERS.length)];
};

const formatCoolText = (text) => {
  if (!text) return "";

  let formatted = text
    .replace(/Heck\.ai/gi, "Christus")
    .replace(/Aryan/gi, "Christus")
    .replace(/Shizu AI|Shizuka AI|Shizuka|Shizu/gi, "Christus AI");

  formatted = formatted.replace(/\*(.*?)\*/g, (_, p1) => fonts.serif(p1));
  return fonts.sansSerif(formatted);
};

const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply("✅ Conversation reset.");
  } catch {
    return message.reply("❌ Reset failed.");
  }
};

const handleAIRequest = async (api, event, userInput, message) => {
  const userId = event.senderID;
  let imageUrl = null;
  let messageContent = userInput;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  if (event.messageReply) {
    const att = event.messageReply.attachments?.[0];
    if (att?.type === 'photo') imageUrl = att.url;
  }

  const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/)?.[0];
  if (urlMatch && validUrl.isWebUri(urlMatch)) {
    imageUrl = urlMatch;
    messageContent = messageContent.replace(urlMatch, '').trim();
  }

  if (!messageContent && !imageUrl) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return;
  }

  try {
    const response = await axios.post(
      API_ENDPOINT,
      { uid: userId, message: messageContent, image_url: imageUrl },
      { timeout: 60000 }
    );

    const {
      reply,
      image_url,
      music_data,
      video_data,
      shotti_data
    } = response.data;

    const finalBody = formatCoolText(reply);
    const attachments = [];

    if (image_url) attachments.push(fs.createReadStream(await downloadFile(image_url, 'jpg')));
    if (music_data?.downloadUrl) attachments.push(fs.createReadStream(await downloadFile(music_data.downloadUrl, 'mp3')));
    if (video_data?.downloadUrl) attachments.push(fs.createReadStream(await downloadFile(video_data.downloadUrl, 'mp4')));
    if (shotti_data?.videoUrl) attachments.push(fs.createReadStream(await downloadFile(shotti_data.videoUrl, 'mp4')));

    const sent = await message.reply({
      body: finalBody,
      attachment: attachments.length ? attachments : undefined
    });

    if (sent?.messageID) {
      global.GoatBot.onReply.set(sent.messageID, {
        commandName: 'ai',
        messageID: sent.messageID,
        author: userId
      });
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

module.exports = {
  config: {
    name: 'ai',
    aliases: [],
    version: '2.6.0',
    author: 'Christus',
    role: 0,
    category: 'ai'
  },

  onStart: async function ({ api, event, args, message }) {
    const input = args.join(' ').trim();

    if (!input) {
      const sticker = getRandomSticker();
      api.sendMessage({ sticker }, event.threadID);
      api.setMessageReaction("🟡", event.messageID, () => {}, true);
      return;
    }

    if (['clear', 'reset'].includes(input.toLowerCase())) {
      return resetConversation(api, event, message);
    }

    return handleAIRequest(api, event, input, message);
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;
    return handleAIRequest(api, event, event.body, message);
  },

  onChat: async function ({ api, event, message }) {
    const body = event.body?.trim();
    if (!body?.toLowerCase().startsWith('ai')) return;

    const input = body.slice(2).trim();

    if (!input) {
      const sticker = getRandomSticker();
      api.sendMessage({ sticker }, event.threadID);
      api.setMessageReaction("🟡", event.messageID, () => {}, true);
      return;
    }

    if (['clear', 'reset'].includes(input.toLowerCase())) {
      return resetConversation(api, event, message);
    }

    return handleAIRequest(api, event, input, message);
  }
};
