const { getStreamsFromAttachment } = global.utils;

let fonts;
try {
  fonts = require("../../func/font.js");
} catch (error) {}

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "3.0",
    author: "Christus",
    countDown: 5,
    role: 4,
    description: "📢 Envoie une notification à tous les groupes (admin only)",
    category: "owner",
    guide: {
      fr: "{pn} <message> [-a] [-p]\n   -a : mentionner tous les membres\n   -p : épingler le message"
    },
    envConfig: {
      delayPerGroup: 250,
      maxRetries: 2,
      batchSize: 10
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData }) {
    const { delayPerGroup, maxRetries, batchSize } = envCommands[commandName];
    const startTime = Date.now();

    const { cleanMessage, options } = this.parseArgs(args);

    if (!cleanMessage && (!event.attachments || event.attachments.length === 0)) {
      const msg = "📢 Notification\n━━━━━━━━━━━━━━━━━━\n❌ Veuillez entrer un message ou joindre un média.";
      return message.reply(fonts?.bold ? fonts.bold(msg) : msg);
    }

    const adminName = (await api.getUserInfo(event.senderID))[event.senderID]?.name || "Administrateur";

    const prepared = await this.prepareMessage({ event, message: cleanMessage, options, adminName });

    const allThreads = await this.getActiveThreads(threadsData, api);
    if (!allThreads.length) {
      return message.reply("❌ Aucun groupe actif trouvé.");
    }

    const confirmMsg = `📢 Envoi de notification\n━━━━━━━━━━━━━━━━━━\n➜ ${allThreads.length} groupe(s) concerné(s)\n➜ Délai : ${delayPerGroup} ms par groupe\n➜ Options : ${options.tagAll ? "tag all" : "aucun tag"} ${options.pin ? "+ pin" : ""}\n➜ From : ${adminName}\n\n✅ Confirmez l'envoi en répondant avec oui (30 secondes).`;
    const replyMsg = await message.reply(fonts?.bold ? fonts.bold(confirmMsg) : confirmMsg);

    global.GoatBot.onReply.set(replyMsg.messageID, {
      commandName: this.config.name,
      author: event.senderID,
      type: "confirm_notification",
      prepared,
      allThreads,
      delayPerGroup,
      maxRetries,
      batchSize,
      startTime,
      adminId: event.senderID,
      adminName,
      messageID: replyMsg.messageID
    });

    setTimeout(() => {
      const data = global.GoatBot.onReply.get(replyMsg.messageID);
      if (data && data.author === event.senderID) {
        message.reply("⏰ Temps écoulé, envoi annulé.");
        global.GoatBot.onReply.delete(replyMsg.messageID);
        message.unsend(replyMsg.messageID).catch(() => {});
      }
    }, 30000);
  },

  onReply: async function ({ message, event, Reply, api, threadsData }) {
    if (Reply.author !== event.senderID) return;
    if (event.body.trim().toLowerCase() !== "oui") {
      return message.reply("❌ Envoi annulé.");
    }

    const { prepared, allThreads, delayPerGroup, maxRetries, batchSize, startTime, adminId, adminName, messageID } = Reply;
    message.unsend(messageID).catch(() => {});
    global.GoatBot.onReply.delete(messageID);

    await message.reply(fonts?.bold ? fonts.bold(`📢 Début de l'envoi à ${allThreads.length} groupes...`) : `📢 Début de l'envoi à ${allThreads.length} groupes...`);

    const results = await this.sendBulkNotifications({
      api,
      threads: allThreads,
      baseMessage: prepared,
      options: prepared.options,
      adminId,
      adminName,
      delayPerGroup,
      maxRetries,
      batchSize
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const resultMsg = `📢 Rapport d'envoi\n━━━━━━━━━━━━━━━━━━\n✅ Réussis : ${results.success.length}\n❌ Échecs : ${results.failed.length}\n⏱️ Temps : ${totalTime}s`;
    message.reply(fonts?.bold ? fonts.bold(resultMsg) : resultMsg);
  },

  parseArgs(args) {
    const options = { tagAll: false, pin: false };
    const messageParts = [];

    for (const arg of args) {
      if (arg.startsWith("-")) {
        if (arg === "-a" || arg === "--all") options.tagAll = true;
        else if (arg === "-p" || arg === "--pin") options.pin = true;
        else messageParts.push(arg);
      } else messageParts.push(arg);
    }

    return {
      cleanMessage: messageParts.join(" "),
      options
    };
  },

  async prepareMessage({ event, message, options, adminName }) {
    const title = "𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 𝐃𝐄 𝐋'𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐓𝐄𝐔𝐑";
    let body = `📢 ${title}\n━━━━━━━━━━━━━━━━━━\nFrom : ${adminName}\n\n💬 :\n${message || ""}\n\n`;
    const attachments = [
      ...(event.attachments || []),
      ...(event.messageReply?.attachments || [])
    ].filter(item =>
      ["photo", "png", "animated_image", "video", "audio"].includes(item.type)
    );

    return {
      bodyTemplate: body,
      rawAttachments: attachments,
      options
    };
  },

  async getActiveThreads(threadsData, api) {
    const allThreads = await threadsData.getAll();
    const botID = api.getCurrentUserID();
    return allThreads.filter(t =>
      t.isGroup && t.members?.some(m => m.userID === botID && m.inGroup)
    );
  },

  async sendBulkNotifications({ api, threads, baseMessage, options, adminId, adminName, delayPerGroup, maxRetries, batchSize }) {
    const results = { success: [], failed: [] };

    for (let i = 0; i < threads.length; i += batchSize) {
      const batch = threads.slice(i, i + batchSize);

      for (const thread of batch) {
        try {
          let groupName = thread.threadName;
          if (!groupName) {
            const info = await api.getThreadInfo(thread.threadID);
            groupName = info.threadName || "Groupe inconnu";
          }

          let personalizedBody = `${baseMessage.bodyTemplate}\n🏷️ Groupe : ${groupName}\n🔗 ID : ${thread.threadID}\n\n`;
          
          const membersData = thread.members || (await api.getThreadInfo(thread.threadID)).userInfo;
          const res = await this.sendWithRetry({
            api,
            threadID: thread.threadID,
            body: personalizedBody,
            rawAttachments: baseMessage.rawAttachments,
            options,
            membersData,
            adminId,
            adminName,
            maxRetries
          });

          if (res.success) results.success.push(thread.threadID);
          else results.failed.push(thread.threadID);

          await this.delay(delayPerGroup);
        } catch {
          results.failed.push(thread.threadID);
        }
      }

      if (i + batchSize < threads.length) await this.delay(1000);
    }

    return results;
  },

  async sendWithRetry({ api, threadID, body, rawAttachments, options, membersData, adminId, adminName, maxRetries }) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let finalBody = body;
        const mentions = [];

        const adminTag = adminName;
        if (finalBody.includes(adminName)) {
          const index = finalBody.indexOf(adminName);
          finalBody = finalBody.replace(adminName, adminTag);
          mentions.push({ id: adminId, tag: adminTag, fromIndex: index });
        }

        const formSend = { body: finalBody, mentions };

        if (rawAttachments?.length) {
          formSend.attachment = await getStreamsFromAttachment(rawAttachments);
        }

        if (options.tagAll && membersData) {
          const botID = api.getCurrentUserID();
          let offset = formSend.body.length;

          const ids = membersData
            .filter(m => m.userID !== botID && m.userID !== adminId && m.inGroup)
            .map(m => m.userID);

          for (const id of ids) {
            const userName = membersData.find(m => m.userID === id)?.name || id;
            const tagText = userName;
            formSend.body += tagText;
            mentions.push({ tag: tagText, id, fromIndex: offset });
            offset += tagText.length;
          }
        }

        const info = await api.sendMessage(formSend, threadID);

        if (options.pin && info?.messageID) {
          try {
            await api.pinMessage(info.messageID, threadID);
          } catch {}
        }

        return { success: true };
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) await this.delay(1000 * (attempt + 1));
      }
    }

    return { success: false, error: lastError?.message };
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
