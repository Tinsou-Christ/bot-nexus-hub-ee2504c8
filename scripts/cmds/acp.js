const moment = require("moment-timezone");
const fonts = require('../../func/font.js'); // Importation du module de polices

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "1.0",
    author: "Christus",
    countDown: 15,
    role: 3,
    shortDescription: "Accept or delete friend requests",
    longDescription: "View and manage incoming friend requests with stylish formatting",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      return api.sendMessage(`⚠️ ${fonts.bold("Invalid Syntax")}\n${fonts.sansSerif("Please use:")} ${fonts.monospace("add/del <number/all>")}`, event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") {
      targetIDs = [];
      const lengthList = listRequest.length;
      for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`${fonts.italic("STT " + stt + " not found")}`);
        continue;
      }
      form.variables.input.friend_requester_id = u.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const lengthTarget = newTargetIDs.length;
    for (let i = 0; i < lengthTarget; i++) {
      try {
        const friendRequest = await promiseFriends[i];
        if (JSON.parse(friendRequest).errors) {
          failed.push(newTargetIDs[i].node.name);
        } else {
          success.push(newTargetIDs[i].node.name);
        }
      } catch (e) {
        failed.push(newTargetIDs[i].node.name);
      }
    }

    let resultMsg = `✨ ${fonts.bold("REQUEST PROCESSED")}\n${"━".repeat(15)}\n`;
    if (success.length > 0) {
      resultMsg += `✅ ${fonts.sansSerif("Successfully " + (args[0] === 'add' ? 'accepted' : 'deleted') + ":")}\n`;
      resultMsg += success.map(name => `┣ ${fonts.fancy(name)}`).join("\n") + "\n\n";
    }
    if (failed.length > 0) {
      resultMsg += `❌ ${fonts.sansSerif("Failed/Errors:")}\n`;
      resultMsg += failed.map(name => `┗ ${fonts.italic(name)}`).join("\n");
    }

    api.sendMessage(resultMsg, event.threadID, event.messageID);
    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    try {
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;
      
      if (listRequest.length === 0) {
        return api.sendMessage(`📭 ${fonts.sansSerif("You have no pending friend requests.")}`, event.threadID);
      }

      let msg = `📥 ${fonts.bold("FRIEND REQUEST LIST")}\n${"━".repeat(15)}\n`;
      let i = 0;
      for (const user of listRequest) {
        i++;
        const timeStr = moment(user.time * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm");
        msg += `${fonts.bold(i + ".")} ${fonts.fancy(user.node.name)}\n`
          + `🆔 ${fonts.monospace(user.node.id)}\n`
          + `📅 ${fonts.sansSerif("Time:")} ${fonts.monospace(timeStr)}\n`
          + `${"━".repeat(10)}\n`;
      }

      msg += `\n💡 ${fonts.italic("Reply: <add/del> <number/all>")}`;

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, this.config.countDown * 1000)
        });
      }, event.messageID);

    } catch (err) {
      api.sendMessage("❌ Error fetching requests.", event.threadID);
    }
  }
};
