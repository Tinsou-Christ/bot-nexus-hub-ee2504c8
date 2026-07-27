const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.4",
		author: "Christus",
		countDown: 5,
		role: 0,
		description: {
			en: "View facebook user id of user"
		},
		category: "info",
		guide: {
			en: "{pn} | {pn} @tag | {pn} <link> | reply message"
		}
	},

	onStart: async function ({ event, args, api }) {
		const { senderID, threadID, messageReply, mentions } = event;

		if (messageReply) {
			return api.shareContact(
				`${messageReply.senderID}`,
				messageReply.senderID,
				threadID
			);
		}

		if (!args[0]) {
			return api.shareContact(
				`${senderID}`,
				senderID,
				threadID
			);
		}

		if (args[0].match(regExCheckURL)) {
			let msg = "";

			for (const link of args) {
				try {
					const uid = await findUid(link);
					msg += `${uid}\n`;
				} catch (e) {
					msg += `error\n`;
				}
			}

			return api.shareContact(msg.trim(), senderID, threadID);
		}

		let msg = "";

		for (const id in mentions) {
			msg += `${id}\n`;
		}

		if (!msg.trim()) {
			return api.shareContact(
				"error",
				senderID,
				threadID
			);
		}

		return api.shareContact(msg.trim(), senderID, threadID);
	}
};
