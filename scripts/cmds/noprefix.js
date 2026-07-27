const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "noprefix",
		aliases: ["nopx", "npx"],
		version: "1.0",
		author: "Christus",
		countDown: 5,
		role: 6,
		description: {
			vi: "Thêm, xóa quyền dùng lệnh không cần prefix",
			en: "Add, remove permission to use commands without prefix"
		},
		category: "owner",
		guide: {
			vi: '   {pn} [add | -a] <uid | @tag>: Thêm quyền noprefix cho người dùng'
				+ '\n   {pn} [remove | -r] <uid | @tag>: Xóa quyền noprefix của người dùng'
				+ '\n   {pn} [list | -l]: Liệt kê danh sách noprefix'
				+ '\n   {pn} [check | -c] <uid | @tag>: Kiểm tra người dùng có quyền noprefix không'
				+ '\n   {pn} on: Bật tính năng noprefix'
				+ '\n   {pn} off: Tắt tính năng noprefix',
			en: '   {pn} [add | -a] <uid | @tag>: Add noprefix permission for user'
				+ '\n   {pn} [remove | -r] <uid | @tag>: Remove noprefix permission of user'
				+ '\n   {pn} [list | -l]: List all noprefix users'
				+ '\n   {pn} [check | -c] <uid | @tag>: Check if a user has noprefix permission'
				+ '\n   {pn} on: Turn ON the noprefix feature'
				+ '\n   {pn} off: Turn OFF the noprefix feature'
		}
	},

	langs: {
		vi: {
			added: "✓ | Đã thêm quyền noprefix cho %1 người dùng:\n%2",
			alreadyNoPrefix: "\n⚠ | %1 người dùng đã có quyền noprefix từ trước rồi:\n%2",
			missingIdAdd: "⚠ | Vui lòng nhập ID hoặc tag người dùng muốn thêm quyền noprefix",
			removed: "✓ | Đã xóa quyền noprefix của %1 người dùng:\n%2",
			notNoPrefix: "⚠ | %1 người dùng không có quyền noprefix:\n%2",
			missingIdRemove: "⚠ | Vui lòng nhập ID hoặc tag người dùng muốn xóa quyền noprefix",
			listNoPrefix: "★ | Danh sách noprefix users:\n%1",
			listEmpty: "★ | Hiện chưa có ai có quyền noprefix",
			checkInfo: "✓ | %1 (%2) %3 quyền sử dụng lệnh không cần prefix",
			checkYes: "có",
			checkNo: "không có",
			turnedOn: "✓ | Đã BẬT tính năng noprefix, các admin bot và người dùng trong danh sách có thể dùng lệnh không cần prefix",
			turnedOff: "✓ | Đã TẮT tính năng noprefix, tất cả mọi người đều phải dùng prefix để gọi lệnh",
			alreadyOn: "⚠ | Tính năng noprefix đã được bật từ trước rồi",
			alreadyOff: "⚠ | Tính năng noprefix đã được tắt từ trước rồi"
		},
		en: {
			added: "✓ | Added noprefix permission for %1 users:\n%2",
			alreadyNoPrefix: "\n⚠ | %1 users already have noprefix permission:\n%2",
			missingIdAdd: "⚠ | Please enter ID or tag user to add noprefix permission",
			removed: "✓ | Removed noprefix permission of %1 users:\n%2",
			notNoPrefix: "⚠ | %1 users don't have noprefix permission:\n%2",
			missingIdRemove: "⚠ | Please enter ID or tag user to remove noprefix permission",
			listNoPrefix: "★ | List of noprefix users:\n%1",
			listEmpty: "★ | No one has noprefix permission yet",
			checkInfo: "✓ | %1 (%2) %3 permission to use commands without prefix",
			checkYes: "has",
			checkNo: "does not have",
			turnedOn: "✓ | Noprefix feature is now ON, bot admins and listed users can use commands without prefix",
			turnedOff: "✓ | Noprefix feature is now OFF, everyone must use the prefix to call commands",
			alreadyOn: "⚠ | Noprefix feature is already ON",
			alreadyOff: "⚠ | Noprefix feature is already OFF"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		if (!config.noPrefixUser)
			config.noPrefixUser = [];

		switch (args[0]) {
			case "add":
			case "-a": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.filter(arg => !isNaN(arg));

					const notNoPrefixIds = [];
					const noPrefixIds = [];

					for (const uid of uids) {
						if (config.noPrefixUser.includes(uid))
							noPrefixIds.push(uid);
						else
							notNoPrefixIds.push(uid);
					}

					config.noPrefixUser.push(...notNoPrefixIds);

					const getNames = await Promise.all(notNoPrefixIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

					return message.reply(
						(notNoPrefixIds.length > 0 ? getLang("added", notNoPrefixIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (noPrefixIds.length > 0 ? getLang("alreadyNoPrefix", noPrefixIds.length, noPrefixIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				}
				else
					return message.reply(getLang("missingIdAdd"));
			}
			case "remove":
			case "-r": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.filter(arg => !isNaN(arg));

					const notNoPrefixIds = [];
					const noPrefixIds = [];

					for (const uid of uids) {
						if (config.noPrefixUser.includes(uid))
							noPrefixIds.push(uid);
						else
							notNoPrefixIds.push(uid);
					}

					for (const uid of noPrefixIds)
						config.noPrefixUser.splice(config.noPrefixUser.indexOf(uid), 1);

					const getNames = await Promise.all(noPrefixIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

					return message.reply(
						(noPrefixIds.length > 0 ? getLang("removed", noPrefixIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (notNoPrefixIds.length > 0 ? getLang("notNoPrefix", notNoPrefixIds.length, notNoPrefixIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				}
				else
					return message.reply(getLang("missingIdRemove"));
			}
			case "list":
			case "-l": {
				if (config.noPrefixUser.length === 0)
					return message.reply(getLang("listEmpty"));

				const getNames = await Promise.all(config.noPrefixUser.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				return message.reply(getLang("listNoPrefix", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
			}
			case "check":
			case "-c": {
				let uid;
				if (Object.keys(event.mentions).length > 0)
					uid = Object.keys(event.mentions)[0];
				else if (event.messageReply)
					uid = event.messageReply.senderID;
				else if (args[1] && !isNaN(args[1]))
					uid = args[1];
				else
					uid = event.senderID;

				const name = await usersData.getName(uid);
				const hasNoPrefix = config.noPrefixUser.includes(uid);
				return message.reply(getLang("checkInfo", name, uid, hasNoPrefix ? getLang("checkYes") : getLang("checkNo")));
			}
			case "on": {
				if (config.noPrefix === false) {
					config.noPrefix = true;
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
					return message.reply(getLang("turnedOn"));
				}
				else
					return message.reply(getLang("alreadyOn"));
			}
			case "off": {
				if (config.noPrefix !== false) {
					config.noPrefix = false;
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
					return message.reply(getLang("turnedOff"));
				}
				else
					return message.reply(getLang("alreadyOff"));
			}
			default:
				return message.SyntaxError();
		}
	}
};
                
