const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "gem",
    author: "Kay",
    version: "2.0",
    cooldowns: 5,
    role: 3,
    shortDescription: "Generate artistic images using New API",
    longDescription: "Generates/Edits AI images. Use --nw for artistic mode. Support ratios like 16:9, 9:16, 1:1, etc.",
    category: "ai",
    guide: "{pn} <prompt> [--r X:Y] [--nw]"
  },

  onStart: async function ({ message, args, api, event }) {
    if (!args[0]) return message.reply("🎨 | Please provide a prompt.");

    const cacheFolder = path.join(__dirname, "/tmp");
    if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    try {
      let promptParts = [];
      let ratioArg = "1:1"; // Default ratio
      let unfilteredMode = false;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === "--r" && i + 1 < args.length) {
          ratioArg = args[i + 1];
          i++;
        } else if (args[i] === "--nw") {
          unfilteredMode = true;
        } else {
          promptParts.push(args[i]);
        }
      }

      const userPrompt = promptParts.join(" ");
      if (!userPrompt) return message.reply("🎨 | Please provide a prompt.");

      // Artistic filtering logic (keeping your original logic)
      let finalPrompt = userPrompt;
      if (unfilteredMode) {
        finalPrompt = `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${userPrompt}`;
      }

      let payload = {
        prompt: finalPrompt,
        ratio: ratioArg,
        format: "jpg"
      };

      let endpoint = "https://gem-tw6a.onrender.com/generate";

      // Checking for Image Reply (Edit Mode)
      if (event.messageReply?.attachments?.[0]?.type === "photo") {
        const imgUrl = event.messageReply.attachments[0].url;
        const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
        const imgBase64 = Buffer.from(imgRes.data, "binary").toString("base64");
        
        endpoint = "https://gem-tw6a.onrender.com/edit";
        payload.image = imgBase64;
        delete payload.ratio; // Edit API handles ratio based on input image
      }

      const res = await axios.post(endpoint, payload, { 
        responseType: "arraybuffer",
        timeout: 180000 
      });

      const imgPath = path.join(cacheFolder, `gem_${Date.now()}.jpg`);
      fs.writeFileSync(imgPath, res.data);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      return message.reply({
        body: `🎨✨ | Masterpiece created!${unfilteredMode ? " [Artistic Mode]" : ""}`,
        attachment: fs.createReadStream(imgPath)
      });

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      console.error("Generation error:", error);
      message.reply(`❌ | Failed: ${error.message}`);
    }
  }
};
