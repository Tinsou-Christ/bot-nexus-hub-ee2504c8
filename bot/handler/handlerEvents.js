const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const config = global.GoatBot.config;
	const creator = config.creator || [];
	const developer = config.developer || [];
	const adminBot = config.adminBot || [];
	const premium = config.premium || [];
	const vipuser = config.vipuser || [];
	
	if (!senderID) return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	
	if (creator.includes(senderID)) return 6;
	if (developer.includes(senderID)) return 5;
	if (adminBot.includes(senderID)) return 4;
	if (premium.includes(senderID)) return 3;
	if (vipuser.includes(senderID)) return 2;
	if (adminBox.includes(senderID)) return 1;
	return 0;
}

function canUseCommand(userRole, needRole) {
	if (userRole >= 5) return true;
	if (userRole === 4) return true;
	if (userRole === 3) return needRole === 0 || needRole === 3;
	if (userRole === 2) return needRole <= 2;
	if (userRole === 1) return needRole <= 1;
	return needRole === 0;
}

function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
	return text
		.replace(/\{(?:p|prefix)\}/g, prefix)
		.replace(/\{(?:n|name)\}/g, commandName)
		.replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = {
			onStart: command.config.role
		};
	}
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart)
			command.config.role.onStart = 0;
		roleConfig = command.config.role;
	}
	else {
		roleConfig = {
			onStart: 0
		};
	}

	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined)
			roleConfig[key] = roleConfig.onStart;
	}

	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config;
	const { adminBot, developer, creator, vipuser, premium, hideNotiMessage, developerOnly, vipOnly, premiumOnly } = config;
	const role = getRole(threadData, senderID);

	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) {
		const { reason, date } = infoBannedUser;
		if (hideNotiMessage.userBanned == false)
			message.reply(getText("userBanned", reason, date, senderID, lang));
		return true;
	}

	if (
		config.adminOnly?.enable == true
		&& role < 4
		&& !(config.adminOnly?.ignoreCommand || []).includes(commandName)
	) {
		if ((hideNotiMessage.adminOnly ?? false) == false)
			message.reply(global.utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot", null, null, null, lang));
		return true;
	}

	if (
		(developerOnly?.enable == true)
		&& role < 5
		&& !(developerOnly?.ignoreCommand || []).includes(commandName)
	) {
		if ((hideNotiMessage.developerOnly ?? false) == false)
			message.reply(global.utils.getText({ lang, head: "handlerEvents" }, "onlyDeveloperGlobal", null, null, null, lang));
		return true;
	}

	if (
		(vipOnly?.enable == true)
		&& role < 2
		&& !(vipOnly?.ignoreCommand || []).includes(commandName)
	) {
		if ((hideNotiMessage.vipOnly ?? false) == false)
			message.reply(global.utils.getText({ lang, head: "handlerEvents" }, "onlyVipUserGlobal", null, null, null, lang));
		return true;
	}

	if (
		(premiumOnly?.enable == true)
		&& role < 3
		&& !(premiumOnly?.ignoreCommand || []).includes(commandName)
	) {
		if ((hideNotiMessage.premiumOnly ?? false) == false)
			message.reply(global.utils.getText({ lang, head: "handlerEvents" }, "onlyPremiumGlobal", null, null, null, lang));
		return true;
	}

	if (isGroup == true) {
		if (
			threadData.data.onlyAdminBox === true
			&& !threadData.adminIDs.includes(senderID)
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			if (!threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply(getText("onlyAdminBox", null, null, null, lang));
			return true;
		}

		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) {
			const { reason, date } = infoBannedThread;
			if (hideNotiMessage.threadBanned == false)
				message.reply(getText("threadBanned", reason, date, threadID, lang));
			return true;
		}
	}
	return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	if (fs.existsSync(pathCustomLang))
		customLang = require(pathCustomLang)[commandName]?.text || {};
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--)
				lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		};
	}
	return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup } = event;

		if (!threadID) return;

		const senderID = event.userID || event.senderID || event.author;

		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);

		if (!userData && !isNaN(senderID))
			userData = await usersData.create(senderID);

		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID)) return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		}
		else {
			if (
				autoRefreshThreadInfoFirstTime === true
				&& !global.db.receivedTheFirstMessage[threadID]
			) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}

		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;

		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Please provide body, prefix and commandName to use this function, this function without parameters only support for onStart");
				for (let i = 0; i < arguments.length; i++)
					if (typeof arguments[i] != "string")
						throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);
				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";

		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		let isUserCallCommand = false;

		async function onStart() {
			if (!body) return;

			if (body.trim() === prefix.trim()) {
				const userName = userData.name || senderID;
				const text = utils.getText({ lang: langCode, head: "handlerEvents" }, "prefixOnly", userName, prefix);
				if (!hideNotiMessage.prefixOnly) {
					return await message.reply({
						body: text,
						mentions: [{ tag: userName, id: senderID }]
					});
				} else {
					return true;
				}
			}

			const isAdmin = role >= 4;
			const noPrefixUsers = config.noPrefixUser || [];
			const noPrefixEnabled = config.noPrefix !== false;
			const hasNoPrefixPermission = noPrefixEnabled && (isAdmin || noPrefixUsers.includes(senderID));
			const hasPrefix = body.startsWith(prefix);
			const canUseNoPrefix = hasNoPrefixPermission && !hasPrefix;

			if (!hasPrefix && !canUseNoPrefix) return;

			const dateNow = Date.now();
			let args;
			let commandName;

			if (hasPrefix) {
				args = body.slice(prefix.length).trim().split(/ +/);
				commandName = args.shift().toLowerCase();
			} else if (canUseNoPrefix) {
				const words = body.trim().split(/ +/);
				const potentialCommand = words[0].toLowerCase();
				if (GoatBot.commands.has(potentialCommand) || GoatBot.aliases.has(potentialCommand)) {
					commandName = potentialCommand;
					args = words.slice(1);
				} else {
					return;
				}
			} else {
				return;
			}

			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}
			if (command) commandName = command.config.name;

			function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if (arguments.length) {
					if (typeof body_ != "string") throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
					if (typeof prefix_ != "string") throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
					if (typeof commandName_ != "string") throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);
					return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				else {
					return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;

			if (!command) {
				if (!hideNotiMessage.commandNotFound) {
					return await message.reply(
						commandName ?
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				} else return true;
			}

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;

			if (!canUseCommand(role, needRole)) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					const userName = userData.name || senderID;
					let textKey, textArgs;
					if (needRole === 1) {
						textKey = "onlyAdmin";
						textArgs = [userName, commandName];
					} else if (needRole === 2) {
						textKey = "onlyVipUser";
						textArgs = [userName, commandName];
					} else if (needRole === 3) {
						textKey = "onlyPremium";
						textArgs = [userName, commandName];
					} else if (needRole === 4) {
						textKey = "onlyAdminBot";
						textArgs = [userName, commandName];
					} else if (needRole === 5) {
						textKey = "onlyDeveloper";
						textArgs = [userName, commandName];
					} else if (needRole === 6) {
						textKey = "onlyCreator";
						textArgs = [userName, commandName];
					} else {
						textKey = "noPermission";
						textArgs = [userName, commandName];
					}
					const text = utils.getText({ lang: langCode, head: "handlerEvents" }, textKey, ...textArgs);
					return await message.reply({
						body: text,
						mentions: [{ tag: userName, id: senderID }]
					});
				} else return true;
			}

			if (!client.countDown[commandName]) client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown)) getCoolDown = 1;
			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName]) analytics[commandName] = 0;
					analytics[commandName]++;
					await globalData.set("analytics", analytics, "data");
				})();

				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				await command.onStart({
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}

		async function onChat() {
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				const needRole = roleConfig.onChat;
				if (!canUseCommand(role, needRole)) continue;

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				if (getType(command.onChat) == "Function") {
					const defaultOnChat = command.onChat;
					command.onChat = async function () { return defaultOnChat(...arguments); };
				}
				command.onChat({ ...parameters, isUserCallCommand, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
							try {
								await handler();
								log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							} catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => { log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err); });
			}
		}

		async function onAnyEvent() {
			const allOnAnyEvent = GoatBot.onAnyEvent || [];
			let args = [];
			if (typeof event.body == "string" && (event.body.startsWith(prefix) || (config.noPrefix !== false && (role >= 4 || (config.noPrefixUser || []).includes(senderID)) && !event.body.startsWith(prefix))))
				args = event.body.split(/ +/);

			for (const key of allOnAnyEvent) {
				if (typeof key !== "string") continue;
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onAnyEvent) == "Function") {
					const defaultOnAnyEvent = command.onAnyEvent;
					command.onAnyEvent = async function () { return defaultOnAnyEvent(...arguments); };
				}
				command.onAnyEvent({ ...parameters, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
								log.info("onAnyEvent", `${commandName} | ${senderID} | ${userData.name} | ${threadID}`);
							} catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => { log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err); });
			}
		}

		async function onFirstChat() {
			const allOnFirstChat = GoatBot.onFirstChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const itemOnFirstChat of allOnFirstChat) {
				const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				if (threadIDsChattedFirstTime.includes(threadID)) continue;
				const command = GoatBot.commands.get(commandName);
				if (!command) continue;
				itemOnFirstChat.threadIDsChattedFirstTime.push(threadID);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				if (getType(command.onFirstChat) == "Function") {
					const defaultOnFirstChat = command.onFirstChat;
					command.onFirstChat = async function () { return defaultOnFirstChat(...arguments); };
				}
				command.onFirstChat({ ...parameters, isUserCallCommand, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
							try {
								await handler();
								log.info("onFirstChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							} catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => { log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err); });
			}
		}

		async function onReply() {
			if (!event.messageReply) return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply) return;
			Reply.delete = () => onReply.delete(messageID);
			const commandName = Reply.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReply;
			if (!canUseCommand(role, needRole)) {
				if (!hideNotiMessage.needRoleToUseCmdOnReply) {
					const userName = userData.name || senderID;
					let textKey, textArgs;
					if (needRole === 1) {
						textKey = "onlyAdminToUseOnReply";
						textArgs = [userName, commandName];
					} else if (needRole === 2) {
						textKey = "onlyVipUserToUseOnReply";
						textArgs = [userName, commandName];
					} else if (needRole === 3) {
						textKey = "onlyPremiumToUseOnReply";
						textArgs = [userName, commandName];
					} else if (needRole === 4) {
						textKey = "onlyAdminBotToUseOnReply";
						textArgs = [userName, commandName];
					} else if (needRole === 5) {
						textKey = "onlyDeveloperToUseOnReply";
						textArgs = [userName, commandName];
					} else if (needRole === 6) {
						textKey = "onlyCreatorToUseOnReply";
						textArgs = [userName, commandName];
					} else {
						textKey = "noPermissionForReply";
						textArgs = [userName, commandName];
					}
					const text = utils.getText({ lang: langCode, head: "handlerEvents" }, textKey, ...textArgs);
					return await message.reply({
						body: text,
						mentions: [{ tag: userName, id: senderID }]
					});
				} else return true;
			}

			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command) throw new Error(`Cannot find command with commandName: ${commandName}`);
				const args = body ? body.split(/ +/) : [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
				await command.onReply({
					...parameters,
					Reply,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			} catch (err) {
				log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}

		async function onReaction() {
			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction) return;
			Reaction.delete = () => onReaction.delete(messageID);
			const commandName = Reaction.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReaction;
			if (!canUseCommand(role, needRole)) {
				if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					const userName = userData.name || senderID;
					let textKey, textArgs;
					if (needRole === 1) {
						textKey = "onlyAdminToUseOnReaction";
						textArgs = [userName, commandName];
					} else if (needRole === 2) {
						textKey = "onlyVipUserToUseOnReaction";
						textArgs = [userName, commandName];
					} else if (needRole === 3) {
						textKey = "onlyPremiumToUseOnReaction";
						textArgs = [userName, commandName];
					} else if (needRole === 4) {
						textKey = "onlyAdminBotToUseOnReaction";
						textArgs = [userName, commandName];
					} else if (needRole === 5) {
						textKey = "onlyDeveloperToUseOnReaction";
						textArgs = [userName, commandName];
					} else if (needRole === 6) {
						textKey = "onlyCreatorToUseOnReaction";
						textArgs = [userName, commandName];
					} else {
						textKey = "noPermissionForReaction";
						textArgs = [userName, commandName];
					}
					const text = utils.getText({ lang: langCode, head: "handlerEvents" }, textKey, ...textArgs);
					return await message.reply({
						body: text,
						mentions: [{ tag: userName, id: senderID }]
					});
				} else return true;
			}

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command) throw new Error(`Cannot find command with commandName: ${commandName}`);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const args = [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
				await command.onReaction({
					...parameters,
					Reaction,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
			} catch (err) {
				log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}

		async function handlerEvent() {
			const { author } = event;
			const allEventCommand = GoatBot.eventCommands.entries();
			for (const [key] of allEventCommand) {
				const getEvent = GoatBot.eventCommands.get(key);
				if (!getEvent) continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				try {
					const handler = await getEvent.onStart({ ...parameters, commandName, getLang: getText2 });
					if (typeof handler == "function") {
						await handler();
						log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
					}
				} catch (err) {
					log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
					await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
				}
			}
		}

		async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			const args = [];
			const { author } = event;
			for (const key of allOnEvent) {
				if (typeof key !== "string") continue;
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onEvent) == "Function") {
					const defaultOnEvent = command.onEvent;
					command.onEvent = async function () { return defaultOnEvent(...arguments); };
				}
				command.onEvent({ ...parameters, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
								log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
							} catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => { log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err); });
			}
		}

		async function presence() {}
		async function read_receipt() {}
		async function typ() {}

		return {
			onAnyEvent,
			onFirstChat,
			onChat,
			onStart,
			onReaction,
			onReply,
			onEvent,
			handlerEvent,
			presence,
			read_receipt,
			typ
		};
	};
};