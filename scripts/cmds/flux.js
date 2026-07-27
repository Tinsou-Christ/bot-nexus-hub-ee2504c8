const axios = require("axios");

module.exports = {
  config: {
    name: "flux",
    version: "0.0.7",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    shortDescription: "Generate image",
    longDescription: "Generate AI image",
    category: "image",
    guide: "{pn} [prompt] | [ratio]"
  },

  onStart: async function ({ api, event, args }) {

    const react = (e) => api.setMessageReaction(e, event.messageID, () => {}, true);

    try {
      const input = args.join(" ");

      if (!input) {
        react("⚠️");
        return api.sendMessage("⚠️ | Please provide a [prompt] | [ratio]", event.threadID);
      }

      const split = input.split("|");
      const prompt = split[0]?.trim();
      const ratio = split[1]?.trim();

      react("⏳");

      let url = `https://azadx69x.is-a.dev/api/flux?prompt=${encodeURIComponent(prompt)}`;
      if (ratio) url += `&ratio=${encodeURIComponent(ratio)}`;

      const res = await axios.get(url, { responseType: "stream" });

      react("✅");

      api.sendMessage({
        body: ratio
          ? `✨ FLUX Generated!\n📝 Prompt: ${prompt}\n📐 Ratio: ${ratio}`
          : `✨ FLUX Generated!\n📝 Prompt: ${prompt}`,
        attachment: res.data
      }, event.threadID);

    } catch (e) {
      console.log(e);
      react("❌");
      api.sendMessage("❌ | Failed to generate image", event.threadID);
    }
  }
};
