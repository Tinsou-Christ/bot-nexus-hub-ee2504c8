const fonts = require('../../func/font.js');
const axios = require('axios');

module.exports = {
	config: {
		name: "spy",
		aliases: ["infospy"],
		version: "2.0",
		author: "Aryan Chauhan",
		countDown: 10,
		role: 0,
		description: {
			vi: "Xem thông tin chi tiết của người dùng",
			en: "View detailed information about a user including avatar"
		},
		category: "info",
		guide: {
			en: "{pn} - Get your own detailed information\n{pn} @tag - Get tagged user's information\n{pn} <uid> - Get user information by ID\nReply to someone's message with {pn} to get their info"
		}
	},

	langs: {
		vi: {
			userNotFound: "Không tìm thấy thông tin người dùng",
			loadingInfo: "🔍 Đang tải thông tin người dùng...",
			errorOccurred: "❌ Có lỗi xảy ra khi lấy thông tin: %1"
		},
		en: {
			userNotFound: "User information not found",
			loadingInfo: "🔍 Loading user information...",
			errorOccurred: "❌ An error occurred while fetching information: %1"
		}
	},

	onStart: async function ({ message, api, event, args, usersData, threadsData, getLang }) {
		try {
			let targetUserID;
			
			if (event.messageReply) {
				targetUserID = event.messageReply.senderID;
			} else if (Object.keys(event.mentions).length > 0) {
				targetUserID = Object.keys(event.mentions)[0];
			} else if (args[0] && !isNaN(args[0])) {
				targetUserID = args[0];
			} else {
				targetUserID = event.senderID;
			}

			await message.reply(getLang("loadingInfo"));

		const userData = await usersData.get(targetUserID);
			
			const allUsers = await usersData.getAll();
			
			let fbUserInfo;
			try {
				const userInfoResult = await api.getUserInfo(targetUserID);
				fbUserInfo = userInfoResult[targetUserID];
			} catch (error) {
				console.log("Error getting FB user info:", error.message);
				fbUserInfo = null;
			}

			let threadInfo = null;
			let userThreadData = null;
			if (event.isGroup) {
				try {
					threadInfo = await threadsData.get(event.threadID);
					userThreadData = threadInfo.members?.find(m => m.userID === targetUserID);
				} catch (error) {
					console.log("Error getting thread info:", error.message);
				}
			}

			let attachment = [];
			try {
				const avatarUrl = await usersData.getAvatarUrl(targetUserID);
				if (avatarUrl) {
					const avatarStream = await global.utils.getStreamFromURL(avatarUrl);
					if (avatarStream) {
						attachment = [avatarStream];
					}
				}
			} catch (error) {
				console.log("Error getting profile picture method 1 (usersData):", error.message);
				try {
					const profilePicUrl = `https://graph.facebook.com/${targetUserID}/picture?width=720&height=720`;
					const avatarStream = await global.utils.getStreamFromURL(profilePicUrl);
					if (avatarStream) {
						attachment = [avatarStream];
					}
				} catch (altError) {
					console.log("Error getting profile picture method 2 (Graph API):", altError.message);
					try {
						if (fbUserInfo && fbUserInfo.thumbSrc) {
							const avatarStream = await global.utils.getStreamFromURL(fbUserInfo.thumbSrc);
							if (avatarStream) {
								attachment = [avatarStream];
							}
						}
					} catch (thumbError) {
						console.log("Error getting profile picture method 3 (thumbSrc):", thumbError.message);
						try {
							const basicUrl = `https://graph.facebook.com/${targetUserID}/picture?type=large`;
							const response = await axios.get(basicUrl, {
								responseType: 'stream'
							});
							
							if (response.data) {
								response.data.path = 'avatar.jpg';
								attachment = [response.data];
							}
						} catch (basicError) {
							console.log("All profile picture methods failed:", basicError.message);
						}
					}
				}
			}

			const userInfo = formatDetailedUserInfo(userData, fbUserInfo, userThreadData, threadInfo, targetUserID, event.isGroup, allUsers);

			if (attachment.length > 0) {
				await message.reply({
					body: userInfo,
					attachment: attachment
				});
			} else {
				await message.reply(userInfo + `\n\n${fonts.italic("📸 Profile picture could not be retrieved")}`);
			}

		} catch (error) {
			console.error("Error in spy command:", error);
			message.reply(getLang("errorOccurred", error.message));
		}
	}
};

function formatDetailedUserInfo(userData, fbUserInfo, userThreadData, threadInfo, userID, isGroup, allUsers = []) {
	const divider = "━".repeat(12);
	const timestamp = new Date().toLocaleString('en-US', { 
		timeZone: 'Asia/Kolkata',
		hour12: true,
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	
	const name = String(userData?.name || fbUserInfo?.name || "Unknown User");
	const firstName = String(fbUserInfo?.firstName || "Unknown");
	const lastName = String(fbUserInfo?.lastName || "");
	const gender = getGenderText(userData?.gender || fbUserInfo?.gender);
	const vanity = String(userData?.vanity || fbUserInfo?.vanity || "Not set");
	const profileUrl = String(fbUserInfo?.profileUrl || `https://facebook.com/${userID}`);
	
	const joinedDate = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US') : "Unknown";
	const lastUpdate = userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('en-US') : "Unknown";
	const money = Number(userData?.money) || 0;
	const exp = Number(userData?.exp) || 0;
	const banned = Boolean(userData?.banned?.status) || false;
	const banReason = String(userData?.banned?.reason || "N/A");
	const banDate = userData?.banned?.date ? new Date(userData.banned.date).toLocaleDateString('en-US') : "N/A";
	
	const accountType = String(fbUserInfo?.type || "Unknown");
	const isVerified = fbUserInfo?.isVerified ? "✅ Verified Account" : "❌ Not Verified";
	const isFriend = fbUserInfo?.isFriend ? "👥 Friends" : "👤 Not Friends";
	const birthday = fbUserInfo?.isBirthday ? "🎂 Today is Birthday!" : "Not available";
	
	let threadSpecificInfo = "";
	if (isGroup && userThreadData) {
		const nickname = String(userThreadData.nickname || "Not set");
		const joinedGroup = userThreadData.joinedDate ? new Date(userThreadData.joinedDate).toLocaleDateString('en-US') : "Unknown";
		const isAdmin = Boolean(userThreadData.isAdmin) || false;
		const messageCount = Number(userThreadData.count) || 0;
		
		threadSpecificInfo = 
			`${fonts.bold("💬 GROUP INFORMATION")}\n` +
			`${fonts.sansSerif("🏷️ Nickname:")} ${fonts.fancy(nickname)}\n` +
			`${fonts.sansSerif("📅 Joined Group:")} ${fonts.monospace(joinedGroup)}\n` +
			`${fonts.sansSerif("👑 Admin Status:")} ${fonts.sansSerif(isAdmin ? "✅ Admin" : "❌ Member")}\n` +
			`${fonts.sansSerif("💬 Messages Sent:")} ${fonts.bold(messageCount.toLocaleString())}\n` +
			`${fonts.sansSerif("📍 Group Name:")} ${fonts.fancy(String(threadInfo?.threadName || "Unknown"))}\n\n`;
	}

	const lastActivity = userData?.lastActivity ? new Date(userData.lastActivity).toLocaleDateString('en-US') : "Unknown";
	const totalCommands = Number(userData?.totalCommands) || 0;
	const warningCount = Number(userData?.warn?.count) || 0;
	const level = Math.floor(exp / 1000) + 1;
	const nextLevelExp = (level * 1000) - exp;
	
	const sortedByExp = allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0));
	const sortedByMoney = allUsers.sort((a, b) => (b.money || 0) - (a.money || 0));
	const expRank = sortedByExp.findIndex(u => u.userID == userID) + 1;
	const moneyRank = sortedByMoney.findIndex(u => u.userID == userID) + 1;
	const totalUsers = allUsers.length;

	const formattedInfo = 
		`${fonts.bold("SPY")}\n` +
		`${divider}\n\n` +
		
		`${fonts.bold("👤 PERSONAL INFORMATION")}\n` +
		`${fonts.sansSerif("📝 Full Name:")} ${fonts.fancy(name)}\n` +
		`${fonts.sansSerif("👤 First Name:")} ${fonts.sansSerif(firstName)}\n` +
		`${fonts.sansSerif("👥 Last Name:")} ${fonts.sansSerif(lastName)}\n` +
		`${fonts.sansSerif("🆔 User ID:")} ${fonts.monospace(userID)}\n` +
		`${fonts.sansSerif("⚧️ Gender:")} ${fonts.sansSerif(gender)}\n` +
		`${fonts.sansSerif("🔗 Username:")} ${fonts.monospace(vanity)}\n` +
		`${fonts.sansSerif("🎂 Birthday:")} ${fonts.sansSerif(birthday)}\n` +
		`${fonts.sansSerif("🌐 Profile URL:")} ${fonts.italic("facebook.com/" + (vanity || userID))}\n\n` +
		
		`${fonts.bold("📱 ACCOUNT STATUS")}\n` +
		`${fonts.sansSerif("🏷️ Account Type:")} ${fonts.sansSerif(accountType)}\n` +
		`${fonts.sansSerif("✅ Verification:")} ${fonts.sansSerif(isVerified)}\n` +
		`${fonts.sansSerif("👥 Friendship:")} ${fonts.sansSerif(isFriend)}\n` +
		`${fonts.sansSerif("🚫 Banned:")} ${fonts.sansSerif(banned ? "❌ Yes" : "✅ No")}\n` +
		(banned ? `${fonts.sansSerif("📝 Ban Reason:")} ${fonts.italic(banReason)}\n` +
		`${fonts.sansSerif("📅 Ban Date:")} ${fonts.monospace(banDate)}\n` : "") + '\n' +
		
		`${fonts.bold("🤖 BOT DATABASE")}\n` +
		`${fonts.sansSerif("📅 First Joined:")} ${fonts.monospace(joinedDate)}\n` +
		`${fonts.sansSerif("🔄 Last Update:")} ${fonts.monospace(lastUpdate)}\n` +
		`${fonts.sansSerif("💰 Balance:")} ${fonts.bold(money.toLocaleString())}$\n` +
		`${fonts.sansSerif("⭐ Experience:")} ${fonts.bold(exp.toLocaleString())} XP\n` +
		`${fonts.sansSerif("🎯 Level:")} ${fonts.bold(level)}\n` +
		`${fonts.sansSerif("📈 Next Level:")} ${fonts.monospace(nextLevelExp + " XP needed")}\n\n` +
		
		threadSpecificInfo +
		
		`${fonts.bold("📊 PROFILE STATISTICS")}\n` +
		`${fonts.sansSerif("🌟 Profile Score:")} ${fonts.bold(calculateProfileScore(exp, money, totalCommands))}\n` +
		`${fonts.sansSerif("🏆 User Rank:")} ${fonts.fancy(getUserRank(exp))}\n` +
		`${fonts.sansSerif("📈 EXP Ranking:")} ${fonts.bold("#" + expRank)} ${fonts.sansSerif("out of " + totalUsers + " users")}\n` +
		`${fonts.sansSerif("💰 Money Ranking:")} ${fonts.bold("#" + moneyRank)} ${fonts.sansSerif("out of " + totalUsers + " users")}\n` +
		`${fonts.italic("🕐 Report Generated:")} ${fonts.monospace(timestamp)} (IST)`;

	return formattedInfo;
}

function getGenderText(gender) {
	if (!gender) return "⚧️ Not specified";
	
	switch (gender) {
		case 1:
		case "female":
			return "👩 Female";
		case 2:
		case "male":
			return "👨 Male";
		default:
			return "⚧️ Other/Custom";
	}
}

function calculateProfileScore(exp, money, commands) {
	const expScore = Math.floor(exp / 100);
	const moneyScore = Math.floor(money / 1000);
	const commandScore = commands * 10;
	return expScore + moneyScore + commandScore;
}

function getUserRank(exp) {
	if (exp < 1000) return "🥉 Newbie";
	if (exp < 5000) return "🥈 Beginner";
	if (exp < 10000) return "🥇 Intermediate";
	if (exp < 25000) return "🏆 Advanced";
	if (exp < 50000) return "💎 Expert";
	if (exp < 100000) return "👑 Master";
	return "🌟 Legend";
          }
