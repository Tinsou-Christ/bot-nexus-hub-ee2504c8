const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "lyrics",
    version: "2.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: "Fetch lyrics of a song",
    longDescription: "Get detailed song lyrics with title, artist, and cover art.",
    category: "search",
    guide: {
      en: "{pn} <song name>\nExample: {pn} Tiakola TIA"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage(
        "⚠️ Please provide a song name!\nExample: lyrics Tiakola TIA",
        event.threadID,
        event.messageID
      );
    }

    try {
      const { data } = await axios.get(
        `https://azadx69x-all-apis-top.vercel.app/api/lyrics?song=${encodeURIComponent(query)}`
      );

      if (!data?.success || !data?.lyrics) {
        return api.sendMessage(
          "❌ Lyrics not found. Please try another song.",
          event.threadID,
          event.messageID
        );
      }

      const { artist, song, lyrics, image, url } = data;

      const imgPath = path.join(__dirname, "lyrics_temp.jpg");
      
      try {
        const imgResp = await axios.get(image, { responseType: "stream" });
        const writer = fs.createWriteStream(imgPath);
        imgResp.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        await api.sendMessage(
          {
            body: `🎵 *${song}*\n👤 Artist: ${artist}\n🔗 Source: ${url}\n\n${lyrics}`,
            attachment: fs.createReadStream(imgPath)
          },
          event.threadID,
          () => {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          },
          event.messageID
        );

      } catch (imgError) {
        console.error("Image download error:", imgError);
        await api.sendMessage(
          {
            body: `🎵 *${song}*\n👤 Artist: ${artist}\n🔗 Source: ${url}\n\n${lyrics}`
          },
          event.threadID,
          event.messageID
        );
      }

    } catch (err) {
      console.error("Lyrics API Error:", err);
      api.sendMessage(
        "❌ Error: Unable to fetch lyrics. Please try again later.\nCheck your internet connection.",
        event.threadID,
        event.messageID
      );
    }
  }
};
