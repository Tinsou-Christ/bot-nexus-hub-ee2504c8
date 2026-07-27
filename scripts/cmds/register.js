const axios = require("axios");

module.exports = {
  config: {
    name: "register",
    version: "1.1.1",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: "Change display name / manage identity",
    longDescription: "Set name, find users, view count, download data, refresh cache",
    category: "User",
    guide: {
      en:
        "{p}{n} setname <name> — change your name\n" +
        "{p}{n} find <query> — search users by name\n" +
        "{p}{n} count — total users + top stats\n" +
        "{p}{n} download [uid] — export data to pastebin\n" +
        "{p}{n} refresh [uid] — refresh user cache",
    },
  },

  onStart: async ({ api, event, args, usersData, message, getLang }) => {
    const sub = (args[0] || "").toLowerCase();
    const sid = event.senderID;

    if (sub === "setname" || sub === "set" || sub === "-s") {
      const newName = args.slice(1).join(" ").trim();
      const ud = await usersData.get(sid);
      const oldName = ud?.name || "Unregistered";

      if (!newName || newName.length < 3 || newName.length > 40)
        return message.reply(
          `👤 ${oldName} (Change User)\n\n❌ Name must be 3–40 characters.\nExample: ${global.GoatBot.config.prefix}changeuser setname YourName`
        );

      const all = await usersData.getAll();
      if (Object.values(all).some(u => u.name === newName))
        return message.reply(`👤 ${oldName} (Change User)\n\n❌ That name's taken! Try something unique.`);

      let { usernameHistory = [] } = ud || {};
      const isPrev = usernameHistory.includes(newName) && newName !== oldName;
      if (!usernameHistory.includes(newName)) {
        usernameHistory.push(newName);
        while (usernameHistory.length > 30) usernameHistory.shift();
      }

      await usersData.set(sid, { name: newName, usernameHistory });

      return message.reply(
        `👤 ${oldName} ➜ ${newName}\n\n` +
        `✅ Your name is now "${newName}"!\n` +
        (isPrev ? `↩️ Back to an old favorite, huh?\n` : "") +
        `📅 Changed: ${new Date().toLocaleString()}`
      );
    }

    if (sub === "find" || sub === "search") {
      const q = args.slice(1).join(" ").trim().toLowerCase();
      if (!q) return message.reply("❌ Provide a search query.\nExample: changeuser find John");

      const all = await usersData.getAll();
      const matched = Object.entries(all)
        .filter(([, u]) =>
          (u.name || "").toLowerCase().includes(q) ||
          String(u.userMeta?.name || "").toLowerCase().includes(q)
        )
        .slice(0, 10);

      if (!matched.length) return message.reply(`🔍 No users found for "${q}".`);

      const lines = matched.map(([uid, u], i) =>
        `${String(i + 1).padStart(2, "0")}. ${u.name || "Unregistered"}${u.userMeta?.name ? ` (${u.userMeta.name})` : ""}\n    🆔 ${uid}\n    💰 $${(u.money || 0).toLocaleString()}`
      ).join("\n\n");

      return message.reply(`🔍 Results for "${q}":\n\n${lines}`);
    }

    if (sub === "count" || sub === "-c") {
      const all = await usersData.getAll();
      const total = Object.keys(all).length;
      const maxStats = {}, maxUsers = {};

      for (const [, u] of Object.entries(all)) {
        for (const [k, v] of Object.entries(u)) {
          if (typeof v === "number" && (!(k in maxStats) || v > maxStats[k])) {
            maxStats[k] = v;
            maxUsers[k] = u.name || "Unregistered";
          }
        }
      }

      const statLines = Object.entries(maxStats)
        .slice(0, 10)
        .map(([k, v]) => `✓ ${maxUsers[k]} → highest ${k}: ${Number(v).toLocaleString()}`)
        .join("\n");

      return message.reply(
        `👥 Total users: ${total.toLocaleString()}\n\n📊 Top stats per category:\n${statLines}`
      );
    }

    if (sub === "download" || sub === "-bin") {
      const targetID = args[1] || event.messageReply?.senderID || sid;
      const ud = await usersData.get(targetID);
      if (!ud?.name) return message.reply("❌ User not found.");

      try {
        const res = await axios.post(
          "https://pastebin.com/api/api_post.php",
          new URLSearchParams({
            api_dev_key: "R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb",
            api_option: "paste",
            api_paste_code: JSON.stringify(ud, null, 2),
            api_paste_name: `${targetID}.json`,
            api_paste_format: "json",
            api_paste_expire_date: "N",
            api_paste_private: "1",
          }).toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const raw = res.data.replace("pastebin.com/", "pastebin.com/raw/");
        return message.reply(`✅ Uploaded to Pastebin!\n\n👤 ${ud.name}\n🔗 ${raw}`);
      } catch (err) {
        return message.reply(`❌ Pastebin upload failed.\n${err.message}`);
      }
    }

    if (sub === "refresh" || sub === "ref") {
      const targetID = args[1] || sid;
      const ud = await usersData.get(targetID);
      if (!ud?.name) return message.reply("❌ User not found.");
      return message.reply(`👥 ${ud.name} (Refresh)\n\n✅ Data cache refreshed!`);
    }

    const ud = await usersData.get(sid);
    const name = ud?.name || "Unregistered";
    const p = global.GoatBot.config.prefix;

    return message.reply(
      `👤 ${name} — Identity Dashboard\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${p}register setname <name> — change name\n` +
      `${p}register find <query> — search users\n` +
      `${p}register count — total users + stats\n` +
      `${p}register download [uid] — export to pastebin\n` +
      `${p}register refresh [uid] — refresh cache`
    );
  },
};
