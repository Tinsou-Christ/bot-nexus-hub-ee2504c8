module.exports = {
  config: {
    name: "stick",
    version: "1.0",
    author: "Aesther",
    countDown: 3,
    role: 2,
    shortDescription: "🎭 Obtiens l'ID d’un sticker Facebook",
    longDescription: "Réponds à un sticker pour en obtenir l'identifiant (ID numérique).",
    category: "admin",
    guide: {
      fr: "Réponds à un sticker avec : {pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const { messageReply, threadID, messageID } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Réponds à un sticker pour obtenir son ID.", threadID, messageID);
    }

    const sticker = messageReply.attachments.find(att => att.type === "sticker");

    if (!sticker) {
      return api.sendMessage("❌ Ce n’est pas un sticker. Réponds à un vrai sticker Facebook.", threadID, messageID);
    }

    const stickerID = sticker.stickerID;

    if (!stickerID) {
      return api.sendMessage("❌ Impossible de récupérer l’ID du sticker.", threadID, messageID);
    }

    const result = 
`${stickerID}`;

    return api.sendMessage(result, threadID, messageID);
  }
};
