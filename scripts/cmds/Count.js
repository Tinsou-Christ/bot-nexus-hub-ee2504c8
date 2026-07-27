module.exports = {
	config: {
		name: "count",
		version: "4.0",
		author: "Christus",
		countDown: 10,
		role: 0,
		description: {
			fr: "Visualise l'activité du groupe sous forme de sismographe (depuis l'arrivée du bot).",
			vi: "Xem hoạt động nhóm dưới dạng máy đo địa chấn (từ lúc bot vào nhóm).",
			en: "View group activity as a seismograph (since the bot joined the group)."
		},
		category: "box chat",
		guide: {
			fr: "   {pn}: Affiche votre tracé d'activité."
				+ "\n   {pn} @tag: Affiche le tracé de la personne taguée."
				+ "\n   {pn} all: Affiche le sismographe complet du groupe."
				+ "\n   {pn} theme <1-12>: Choisir une palette d'encre.",
			vi: "   {pn}: Xem biểu đồ hoạt động của bạn."
				+ "\n   {pn} @tag: Xem biểu đồ của người được tag."
				+ "\n   {pn} all: Xem máy đo địa chấn đầy đủ của nhóm."
				+ "\n   {pn} theme <1-12>: Chọn bảng màu mực.",
			en: "   {pn}: View your activity trace."
				+ "\n   {pn} @tag: View the tagged user's trace."
				+ "\n   {pn} all: View the group's full seismograph."
				+ "\n   {pn} theme <1-12>: Choose an ink palette."
		},
		envConfig: {
			"ACCESS_TOKEN": "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
		}
	},

	langs: {
		fr: {
			invalidPage: "Numéro de page invalide.",
			leaderboardTitle: "SISMOGRAPHE D'ACTIVITÉ",
			leaderboardSub: "Pouls collectif du groupe",
			userCardTitle: "TRACÉ D'ACTIVITÉ",
			page: "Relevé %1 / %2",
			reply: "Répondez avec un numéro de relevé pour continuer la lecture.",
			totalMessages: "Impulsions Totales",
			serverRank: "Position sur le Tracé",
			dailyActivity: "Amplitude — 7 derniers jours",
			messageBreakdown: "Nature du Signal",
			busiestDay: "PIC D'AMPLITUDE MAXIMALE",
			text: "Texte",
			sticker: "Autocollant",
			media: "Média",
			fallbackName: "Signal anonyme",
			themeList: "PALETTES D'ENCRE",
			themeSet: "Encre changée pour",
			themeInvalid: "Palette introuvable. Tapez : count themes",
			calibrating: "ÉTALONNAGE EN COURS",
			noSignal: "AUCUN SIGNAL DÉTECTÉ"
		},
		vi: {
			invalidPage: "Số trang không hợp lệ.",
			leaderboardTitle: "MÁY ĐO ĐỊA CHẤN HOẠT ĐỘNG",
			leaderboardSub: "Nhịp đập tập thể của nhóm",
			userCardTitle: "BIỂU ĐỒ HOẠT ĐỘNG",
			page: "Bản ghi %1 / %2",
			reply: "Phản hồi kèm số bản ghi để xem tiếp.",
			totalMessages: "Tổng Xung Tín Hiệu",
			serverRank: "Vị Trí Trên Biểu Đồ",
			dailyActivity: "Biên Độ — 7 ngày qua",
			messageBreakdown: "Bản Chất Tín Hiệu",
			busiestDay: "ĐỈNH BIÊN ĐỘ CAO NHẤT",
			text: "Văn Bản",
			sticker: "Nhãn Dán",
			media: "Tệp",
			fallbackName: "Tín hiệu ẩn danh",
			themeList: "BẢNG MÀU MỰC",
			themeSet: "Đã đổi mực sang",
			themeInvalid: "Không tìm thấy bảng màu. Gõ: count themes",
			calibrating: "ĐANG CHUẨN ĐỘ",
			noSignal: "KHÔNG PHÁT HIỆN TÍN HIỆU"
		},
		en: {
			invalidPage: "Invalid page number.",
			leaderboardTitle: "ACTIVITY SEISMOGRAPH",
			leaderboardSub: "The group's collective pulse",
			userCardTitle: "ACTIVITY TRACE",
			page: "Reading %1 / %2",
			reply: "Reply with a reading number to keep scrolling.",
			totalMessages: "Total Pulses",
			serverRank: "Position on the Trace",
			dailyActivity: "Amplitude — last 7 days",
			messageBreakdown: "Signal Composition",
			busiestDay: "PEAK AMPLITUDE",
			text: "Text",
			sticker: "Sticker",
			media: "Media",
			fallbackName: "Anonymous signal",
			themeList: "INK PALETTES",
			themeSet: "Ink switched to",
			themeInvalid: "Palette not found. Type: count themes",
			calibrating: "CALIBRATING",
			noSignal: "NO SIGNAL DETECTED"
		}
	},

	onLoad: async function () {
		const { resolve } = require("path");
		const { existsSync, mkdirSync } = require("fs-extra");
		const { registerFont } = require("canvas");

		const assetsPath = resolve(__dirname, "assets", "count");
		if (!existsSync(assetsPath)) mkdirSync(assetsPath, { recursive: true });

		try {
			registerFont(resolve(assetsPath, "font.ttf"), { family: "Display" });
		} catch (e) {
			console.log("Police personnalisée introuvable pour 'count', repli sur les polices système.");
		}
	},

	onChat: async function ({ event, threadsData, usersData }) {
		const { threadID, senderID } = event;
		const { resolve } = require("path");
		const { readJsonSync, writeJsonSync, ensureFileSync } = require("fs-extra");
		const moment = require("moment-timezone");

		try {
			const members = await threadsData.get(threadID, "members");
			const findMember = members.find(user => user.userID == senderID);
			if (!findMember) {
				members.push({
					userID: senderID,
					name: await usersData.getName(senderID),
					nickname: null,
					inGroup: true,
					count: 1
				});
			} else {
				findMember.count = (findMember.count || 0) + 1;
			}
			await threadsData.set(threadID, members, "members");
		} catch (err) {
			console.error("Échec de la mise à jour du compteur compatible :", err);
		}

		const dataPath = resolve(__dirname, "cache", "count_activity.json");
		ensureFileSync(dataPath);

		let activityData = {};
		try {
			activityData = readJsonSync(dataPath);
		} catch { /* fichier vide ou corrompu */ }

		if (!activityData[threadID]) activityData[threadID] = {};
		if (!activityData[threadID][senderID]) {
			activityData[threadID][senderID] = {
				total: 0,
				types: { text: 0, sticker: 0, media: 0 },
				daily: {}
			};
		}

		const user = activityData[threadID][senderID];
		const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

		user.total = (user.total || 0) + 1;
		user.daily[today] = (user.daily[today] || 0) + 1;

		if (event.attachments.some(att => att.type === 'sticker')) {
			user.types.sticker = (user.types.sticker || 0) + 1;
		} else if (event.attachments.length > 0) {
			user.types.media = (user.types.media || 0) + 1;
		} else {
			user.types.text = (user.types.text || 0) + 1;
		}

		const sortedDays = Object.keys(user.daily).sort((a, b) => new Date(b) - new Date(a));
		if (sortedDays.length > 7) {
			for (let i = 7; i < sortedDays.length; i++) delete user.daily[sortedDays[i]];
		}

		writeJsonSync(dataPath, activityData, { spaces: 2 });
	},

	onStart: async function ({ args, threadsData, message, event, api, getLang, envCommands, usersData }) {
		const { Canvas, loadImage } = require("canvas");
		const { resolve } = require("path");
		const { createWriteStream, readJsonSync, ensureFileSync } = require("fs-extra");
		const axios = require("axios");
		const moment = require("moment-timezone");
		const { threadID, senderID, mentions } = event;

		const ACCESS_TOKEN = envCommands.count.ACCESS_TOKEN;

		// ═══════════════════════════════════════════════════════════════════════
		//  12 PALETTES D'ENCRE — papier thermique + couleur de trace
		// ═══════════════════════════════════════════════════════════════════════
		const PALETTES = [
			{ name: "Encre Cardiaque",   paper: "#F4EFE4", grid: "#0B0D0A", trace: "#C0392B", traceDim: "#E8B4A8", accent: "#0B0D0A" },
			{ name: "Cyan Laboratoire",  paper: "#0A1218", grid: "#16242E", trace: "#3FD6E0", traceDim: "#1A4A52", accent: "#F4EFE4" },
			{ name: "Ambre Vintage",     paper: "#F4EFE4", grid: "#0B0D0A", trace: "#B8860B", traceDim: "#E8D4A0", accent: "#0B0D0A" },
			{ name: "Violet Nocturne",   paper: "#0E0A18", grid: "#241A38", trace: "#A878FF", traceDim: "#3A2A5A", accent: "#F4EFE4" },
			{ name: "Vert Oscilloscope", paper: "#06120A", grid: "#0F2818", trace: "#39FF6E", traceDim: "#164A2A", accent: "#E0FFE8" },
			{ name: "Rose Polygraphe",   paper: "#180A12", grid: "#2E1424", trace: "#FF6FA8", traceDim: "#4A2038", accent: "#F4EFE4" },
			{ name: "Sépia Archive",     paper: "#EDE4D0", grid: "#2A2014", trace: "#8B5E34", traceDim: "#D4C0A0", accent: "#1A1408" },
			{ name: "Bleu Profond",      paper: "#040A14", grid: "#0E1E32", trace: "#4A9EFF", traceDim: "#1A3A5A", accent: "#E8F2FF" },
			{ name: "Corail Clinique",   paper: "#14080A", grid: "#2A1216", trace: "#FF7F5C", traceDim: "#4A2820", accent: "#FFE8E0" },
			{ name: "Jade Capteur",      paper: "#081410", grid: "#122A20", trace: "#4ECDA0", traceDim: "#1A4A38", accent: "#E0FFF4" },
			{ name: "Magenta Pulsé",     paper: "#10081A", grid: "#241236", trace: "#E040E8", traceDim: "#3A1A4A", accent: "#F8E8FF" },
			{ name: "Graphite Neutre",   paper: "#101010", grid: "#242424", trace: "#D8D8D8", traceDim: "#3A3A3A", accent: "#FFFFFF" },
		];

		// ─── Sélection / persistance de la palette ───────────────────────────────
		const cmd = args[0]?.toLowerCase();

		if (cmd === "themes" || cmd === "theme-list") {
			let txt = `◈  ${getLang("themeList")}\n${"─".repeat(28)}\n`;
			PALETTES.forEach((p, i) => { txt += `${i + 1}. ◆ ${p.name}\n`; });
			txt += `\n◈  count theme <numéro>`;
			return message.reply(txt);
		}
		if (cmd === "theme") {
			const n = parseInt(args[1]);
			if (!isNaN(n) && n >= 1 && n <= PALETTES.length) {
				const ud = await usersData.get(senderID);
				ud.countPalette = n - 1;
				await usersData.set(senderID, ud);
				return message.reply(`◈  ${getLang("themeSet")} : ${PALETTES[n - 1].name}`);
			}
			return message.reply(`◆  ${getLang("themeInvalid")}`);
		}

		const senderUD = await usersData.get(senderID).catch(() => ({}));
		let paletteIndex = (typeof senderUD?.countPalette === "number" && PALETTES[senderUD.countPalette])
			? senderUD.countPalette
			: Math.floor(Math.random() * PALETTES.length);
		const ink = PALETTES[paletteIndex];

		// ═══════════════════════════════════════════════════════════════════════
		//  PRIMITIVES DE DESSIN — papier thermique + grille de scan
		// ═══════════════════════════════════════════════════════════════════════
		function drawPaperBackground(ctx, W, H, p) {
			ctx.fillStyle = p.paper;
			ctx.fillRect(0, 0, W, H);

			// Grain de papier thermique (bruit subtil seedé)
			const seed = (s) => () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
			const rnd = seed(7331);
			ctx.save();
			for (let i = 0; i < 2200; i++) {
				const x = rnd() * W, y = rnd() * H;
				ctx.globalAlpha = rnd() * 0.04;
				ctx.fillStyle = p.grid;
				ctx.fillRect(x, y, 1, 1);
			}
			ctx.restore();

			// Grille de scan horizontale (lignes fines régulières, façon papier millimétré)
			ctx.save();
			ctx.strokeStyle = p.grid;
			ctx.globalAlpha = 0.10;
			ctx.lineWidth = 1;
			for (let y = 0; y < H; y += 28) {
				ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
			}
			ctx.globalAlpha = 0.05;
			for (let x = 0; x < W; x += 28) {
				ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
			}
			ctx.restore();

			// Vignette douce sur les bords
			const vg = ctx.createRadialGradient(W / 2, H / 2, Math.max(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
			vg.addColorStop(0, "rgba(0,0,0,0)");
			vg.addColorStop(1, "rgba(0,0,0,0.18)");
			ctx.fillStyle = vg;
			ctx.fillRect(0, 0, W, H);
		}

		// Trace sismographique entre deux points — ligne en dents irrégulières
		function drawTraceLine(ctx, points, color, lineWidth, glow = true) {
			if (points.length < 2) return;
			ctx.save();
			if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
			ctx.stroke();
			ctx.restore();
		}

		// Génère des points de bruit sismique entre deux ancres (pour relier le podium)
		function seismicNoise(x1, y1, x2, y2, segments, amplitude, seedOffset) {
			const pts = [{ x: x1, y: y1 }];
			let s = seedOffset || 1;
			const rnd = () => { s = Math.sin(s * 12.9898) * 43758.5453; return s - Math.floor(s); };
			for (let i = 1; i < segments; i++) {
				const t = i / segments;
				const baseX = x1 + (x2 - x1) * t;
				const baseY = y1 + (y2 - y1) * t;
				const jag = (rnd() - 0.5) * amplitude * (1 - Math.abs(t - 0.5) * 1.2);
				pts.push({ x: baseX, y: baseY + jag });
			}
			pts.push({ x: x2, y: y2 });
			return pts;
		}

		// Sparkline d'activité 7 jours (mini-courbe de pouls pour chaque ligne de liste)
		function drawSparkline(ctx, x, y, w, h, dailyValues, color) {
			const max = Math.max(...dailyValues, 1);
			const pts = dailyValues.map((v, i) => ({
				x: x + (i / (dailyValues.length - 1)) * w,
				y: y + h - (v / max) * h
			}));
			ctx.save();
			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
			ctx.lineJoin = "round";
			ctx.shadowColor = color;
			ctx.shadowBlur = 4;
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
			ctx.stroke();
			ctx.restore();
			// Point final marqué
			ctx.save();
			ctx.fillStyle = color;
			ctx.shadowColor = color;
			ctx.shadowBlur = 8;
			ctx.beginPath();
			ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}

		const threadData = await threadsData.get(threadID);
		const dataPath = resolve(__dirname, "cache", "count_activity.json");
		ensureFileSync(dataPath);
		let activityData = {};
		try { activityData = readJsonSync(dataPath)[threadID] || {}; } catch { /* vide */ }

		const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
		let combinedData = [];

		for (const user of threadData.members) {
			if (!usersInGroup.includes(user.userID)) continue;
			const activity = activityData[user.userID] || {
				total: user.count || 0,
				types: { text: 0, sticker: 0, media: 0 },
				daily: {}
			};
			combinedData.push({
				uid: user.userID,
				name: user.name || getLang("fallbackName"),
				count: user.count || 0,
				activity
			});
		}
		combinedData.sort((a, b) => b.count - a.count);
		combinedData.forEach((user, index) => user.rank = index + 1);

		// ─── Construit les 7 dernières valeurs journalières pour les sparklines ──
		function getLast7Days(daily) {
			const days = [];
			for (let i = 6; i >= 0; i--) {
				const day = moment().tz("Asia/Ho_Chi_Minh").subtract(i, 'days').format('YYYY-MM-DD');
				days.push(daily[day] || 0);
			}
			return days;
		}

		const getAvatar = async (uid, name) => {
			try {
				const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				return await loadImage(response.data);
			} catch (error) {
				const canvas = new Canvas(512, 512);
				const ctx = canvas.getContext('2d');
				const colors = ['#C0392B', '#3FD6E0', '#B8860B', '#A878FF', '#39FF6E', '#FF6FA8'];
				ctx.fillStyle = colors[parseInt(uid) % colors.length];
				ctx.fillRect(0, 0, 512, 512);
				ctx.fillStyle = '#0B0D0A';
				ctx.font = '256px sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText((name || "?").charAt(0).toUpperCase(), 256, 256);
				return await loadImage(canvas.toBuffer());
			}
		};

		const fitText = (ctx, text, maxWidth) => {
			let currentText = text;
			if (ctx.measureText(currentText).width > maxWidth) {
				while (ctx.measureText(currentText + '…').width > maxWidth && currentText.length > 1) {
					currentText = currentText.slice(0, -1);
				}
				return currentText + '…';
			}
			return currentText;
		};

		const drawCircularAvatar = (ctx, avatar, x, y, radius, ringColor) => {
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
			ctx.strokeStyle = ringColor;
			ctx.lineWidth = 2.5;
			ctx.shadowColor = ringColor;
			ctx.shadowBlur = 10;
			ctx.stroke();
			ctx.restore();

			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
			ctx.restore();
		};

		const drawCardinalText = (ctx, text, x, y, color, size, weight = "600", blur = 0) => {
			ctx.font = `${weight} ${size}px "Display", "Archivo", sans-serif`;
			if (blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
			ctx.fillStyle = color;
			ctx.fillText(text, x, y);
			ctx.shadowBlur = 0;
		};

		// ═══════════════════════════════════════════════════════════════════════
		//  LEADERBOARD — Sismographe d'activité, Canvas 1200 × dynamique
		// ═══════════════════════════════════════════════════════════════════════
		if (args[0]?.toLowerCase() === 'all') {
			const usersPerPage = 10;
			const leaderboardUsers = combinedData.filter(u => u.rank > 3);
			const totalPages = Math.ceil(leaderboardUsers.length / usersPerPage) || 1;
			let page = parseInt(args[1]) || 1;
			if (page < 1 || page > totalPages) page = 1;

			const startIndex = (page - 1) * usersPerPage;
			const pageUsers = leaderboardUsers.slice(startIndex, startIndex + usersPerPage);

			const LB_W = 1200;
			const HEADER_H = 130;
			const PODIUM_Y = HEADER_H + 40;
			const PODIUM_H = 280;
			const LIST_Y = PODIUM_Y + PODIUM_H + 60;
			const ROW_H = 84, ROW_GAP = 14, FOOTER_H = 80;
			const LB_H = LIST_Y + pageUsers.length * (ROW_H + ROW_GAP) + FOOTER_H;

			const canvas = new Canvas(LB_W, LB_H);
			const ctx = canvas.getContext('2d');

			drawPaperBackground(ctx, LB_W, LB_H, ink);

			// ── BANDEAU D'EN-TÊTE (pulse strip) ────────────────────────────────────
			ctx.save();
			ctx.fillStyle = ink.grid;
			ctx.globalAlpha = 0.92;
			ctx.fillRect(0, 0, LB_W, HEADER_H);
			ctx.restore();

			// Ligne de pouls décorative dans le bandeau (sinusoïde irrégulière)
			ctx.save();
			ctx.strokeStyle = ink.trace;
			ctx.globalAlpha = 0.35;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			for (let x = 0; x < LB_W; x += 4) {
				const y = HEADER_H - 14 + Math.sin(x * 0.045) * 5 + (Math.random() - 0.5) * 2;
				if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.restore();

			ctx.textAlign = 'left';
			drawCardinalText(ctx, getLang("leaderboardTitle"), 50, 56, ink.accent, 38, "700");
			drawCardinalText(ctx, `${getLang("leaderboardSub")}  ·  ${ink.name}`, 50, 90, ink.trace, 15, "500");

			ctx.textAlign = 'right';
			drawCardinalText(ctx, getLang("page", page, totalPages), LB_W - 50, 56, ink.accent, 16, "600");
			drawCardinalText(ctx, `${combinedData.length} signaux actifs`, LB_W - 50, 80, ink.trace, 12, "500");

			// ── PODIUM = 3 PICS DE SISMOGRAPHE RELIÉS PAR UNE LIGNE DE BASE ────────
			const top3 = combinedData.slice(0, 3);
			const BASE_Y = PODIUM_Y + 195;
			const peakConfig = [
				{ rank: 2, x: 150,        h: 95,  color: ink.traceDim },
				{ rank: 1, x: LB_W / 2,   h: 145, color: ink.trace },
				{ rank: 3, x: LB_W - 150, h: 70,  color: ink.traceDim },
			];

			// Ligne de base sismique reliant les 3 pics
			let basePoints = [];
			const orderedX = [peakConfig[0].x, peakConfig[1].x, peakConfig[2].x];
			for (let seg = 0; seg < 2; seg++) {
				const segPts = seismicNoise(orderedX[seg], BASE_Y, orderedX[seg + 1], BASE_Y, 14, 6, seg * 17 + 3);
				basePoints = basePoints.concat(seg === 0 ? segPts : segPts.slice(1));
			}
			drawTraceLine(ctx, basePoints, ink.traceDim, 1.5, false);

			for (const cfg of peakConfig) {
				const user = top3[cfg.rank - 1];
				if (!user) continue;

				const peakTop = BASE_Y - cfg.h;
				// Pic en triangle irrégulier (façon QRS de l'ECG)
				const spikePts = [
					{ x: cfg.x - 36, y: BASE_Y },
					{ x: cfg.x - 14, y: BASE_Y - cfg.h * 0.15 },
					{ x: cfg.x - 5,  y: peakTop + cfg.h * 0.55 },
					{ x: cfg.x,      y: peakTop },
					{ x: cfg.x + 5,  y: peakTop + cfg.h * 0.45 },
					{ x: cfg.x + 14, y: BASE_Y - cfg.h * 0.1 },
					{ x: cfg.x + 36, y: BASE_Y },
				];
				drawTraceLine(ctx, spikePts, cfg.color, cfg.rank === 1 ? 3 : 2.2);

				// Avatar au sommet du pic
				const avatar = await getAvatar(user.uid, user.name);
				const avR = cfg.rank === 1 ? 56 : 44;
				drawCircularAvatar(ctx, avatar, cfg.x, peakTop - avR - 14, avR, cfg.color);

				// Médaille de rang
				ctx.save();
				ctx.fillStyle = cfg.color;
				ctx.shadowColor = cfg.color;
				ctx.shadowBlur = 8;
				ctx.beginPath();
				ctx.arc(cfg.x, peakTop - avR * 2 - 22, 17, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
				ctx.textAlign = 'center';
				drawCardinalText(ctx, `${cfg.rank}`, cfg.x, peakTop - avR * 2 - 16, ink.paper, 16, "700");

				// Nom + compteur
				ctx.textAlign = 'center';
				drawCardinalText(ctx, fitText(ctx, user.name, 180), cfg.x, BASE_Y + 36, ink.accent, cfg.rank === 1 ? 20 : 16, "600");
				drawCardinalText(ctx, `${user.count} impulsions`, cfg.x, BASE_Y + 58, cfg.color, 13, "500");
			}

			// ── SÉPARATEUR ────────────────────────────────────────────────────────
			const SEP_Y = LIST_Y - 30;
			ctx.save();
			const sepGrad = ctx.createLinearGradient(50, SEP_Y, LB_W - 50, SEP_Y);
			sepGrad.addColorStop(0, "transparent");
			sepGrad.addColorStop(0.5, ink.trace + "70");
			sepGrad.addColorStop(1, "transparent");
			ctx.strokeStyle = sepGrad;
			ctx.lineWidth = 1.2;
			ctx.beginPath(); ctx.moveTo(50, SEP_Y); ctx.lineTo(LB_W - 50, SEP_Y); ctx.stroke();
			ctx.restore();

			// ── LISTE — chaque ligne porte sa propre sparkline 7 jours ─────────────
			const NAME_X = 180, NAME_MAX = 320;
			const SPARK_X = NAME_X + NAME_MAX + 30, SPARK_W = 280, SPARK_H = 32;
			const COUNT_X = LB_W - 50;

			let currentY = LIST_Y;
			for (const user of pageUsers) {
				// Bande de fond légère
				ctx.fillStyle = 'rgba(0,0,0,0.025)';
				ctx.fillRect(40, currentY, LB_W - 80, ROW_H);

				// Tige verticale colorée à gauche (façon repère de bande)
				ctx.fillStyle = ink.trace;
				ctx.globalAlpha = 0.6;
				ctx.fillRect(40, currentY + 10, 3, ROW_H - 20);
				ctx.globalAlpha = 1;

				ctx.textAlign = 'left';
				drawCardinalText(ctx, `#${user.rank}`, 56, currentY + ROW_H / 2 - 8, ink.trace, 22, "700");

				const avatar = await getAvatar(user.uid, user.name);
				drawCircularAvatar(ctx, avatar, 120, currentY + ROW_H / 2, 28, ink.traceDim);

				drawCardinalText(ctx, fitText(ctx, user.name, NAME_MAX), NAME_X, currentY + ROW_H / 2 - 8, ink.accent, 22, "600");
				drawCardinalText(ctx, getLang("totalMessages"), NAME_X, currentY + ROW_H / 2 + 16, ink.traceDim, 11, "500");

				// Sparkline 7 jours
				const days7 = getLast7Days(user.activity.daily || {});
				drawSparkline(ctx, SPARK_X, currentY + (ROW_H - SPARK_H) / 2, SPARK_W, SPARK_H, days7, ink.trace);

				ctx.textAlign = 'right';
				drawCardinalText(ctx, String(user.count), COUNT_X, currentY + ROW_H / 2, ink.trace, 28, "700", 6);

				currentY += ROW_H + ROW_GAP;
			}

			// ── PIED DE PAGE ──────────────────────────────────────────────────────
			const FOOTER_Y = currentY + 24;
			ctx.textAlign = 'center';
			drawCardinalText(ctx, getLang("page", page, totalPages), LB_W / 2, FOOTER_Y, ink.trace, 16, "600");
			drawCardinalText(ctx, getLang("reply"), LB_W / 2, FOOTER_Y + 24, ink.traceDim, 13, "500");

			const outPath = resolve(__dirname, 'cache', `leaderboard_${threadID}.png`);
			const out = createWriteStream(outPath);
			const stream = canvas.createPNGStream();
			stream.pipe(out);
			out.on('finish', () => {
				message.reply({
					attachment: require('fs').createReadStream(outPath)
				}, (err, info) => {
					if (err) return console.error(err);
					global.GoatBot.onReply.set(info.messageID, {
						commandName: this.config.name,
						messageID: info.messageID,
						author: senderID,
						threadID: threadID,
						type: 'leaderboard',
						paletteIndex
					});
				});
			});
		}

		// ═══════════════════════════════════════════════════════════════════════
		//  TRACÉ INDIVIDUEL — Canvas 800 × 1100, papier thermique personnel
		// ═══════════════════════════════════════════════════════════════════════
		else {
			const targetUsers = Object.keys(mentions).length > 0 ? Object.keys(mentions) : [senderID];

			for (const uid of targetUsers) {
				const user = combinedData.find(u => u.uid == uid);
				if (!user) continue;

				const UC_W = 800, UC_H = 1100;
				const canvas = new Canvas(UC_W, UC_H);
				const ctx = canvas.getContext('2d');

				drawPaperBackground(ctx, UC_W, UC_H, ink);

				// ── BANDEAU D'EN-TÊTE ────────────────────────────────────────────────
				ctx.save();
				ctx.fillStyle = ink.grid;
				ctx.globalAlpha = 0.92;
				ctx.fillRect(0, 0, UC_W, 100);
				ctx.restore();

				ctx.save();
				ctx.strokeStyle = ink.trace;
				ctx.globalAlpha = 0.35;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				for (let x = 0; x < UC_W; x += 4) {
					const y = 86 + Math.sin(x * 0.05) * 4 + (Math.random() - 0.5) * 2;
					if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				}
				ctx.stroke();
				ctx.restore();

				ctx.textAlign = 'left';
				drawCardinalText(ctx, getLang("userCardTitle"), 40, 46, ink.accent, 28, "700");
				drawCardinalText(ctx, ink.name, 40, 72, ink.trace, 13, "500");
				ctx.textAlign = 'right';
				drawCardinalText(ctx, `#${user.rank}`, UC_W - 40, 56, ink.trace, 26, "700", 6);

				// ── AVATAR + NOM ─────────────────────────────────────────────────────
				const avatar = await getAvatar(user.uid, user.name);
				drawCircularAvatar(ctx, avatar, UC_W / 2, 180, 64, ink.trace);

				ctx.textAlign = 'center';
				drawCardinalText(ctx, fitText(ctx, user.name, 600), UC_W / 2, 270, ink.accent, 28, "700");

				// ── GRAND TRACÉ ECG CENTRAL (signature visuelle de la carte) ──────────
				const ECG_Y = 320;
				const ECG_H = 130;
				const ECG_X = 60, ECG_W = UC_W - 120;
				const days7 = getLast7Days(user.activity.daily || {});
				const maxDay = Math.max(...days7, 1);

				// Grille du tracé
				ctx.save();
				ctx.strokeStyle = ink.grid;
				ctx.globalAlpha = 0.5;
				ctx.lineWidth = 1;
				for (let i = 0; i <= 4; i++) {
					const gy = ECG_Y + (ECG_H / 4) * i;
					ctx.beginPath(); ctx.moveTo(ECG_X, gy); ctx.lineTo(ECG_X + ECG_W, gy); ctx.stroke();
				}
				ctx.restore();

				// Tracé en dents irrégulières (style sismique) basé sur l'activité réelle
				let ecgPoints = [];
				const dayLabels = [];
				for (let i = 6; i >= 0; i--) {
					const day = moment().tz("Asia/Ho_Chi_Minh").subtract(i, 'days');
					dayLabels.push(day.format('ddd'));
				}
				for (let i = 0; i < 7; i++) {
					const t = i / 6;
					const baseX = ECG_X + t * ECG_W;
					const baseY = ECG_Y + ECG_H - (days7[i] / maxDay) * ECG_H;
					ecgPoints.push({ x: baseX, y: baseY });
					if (i < 6) {
						const nextT = (i + 1) / 6;
						const nextX = ECG_X + nextT * ECG_W;
						const nextY = ECG_Y + ECG_H - (days7[i + 1] / maxDay) * ECG_H;
						const midX = (baseX + nextX) / 2;
						const jag = (Math.sin(i * 13.7) ) * 4;
						ecgPoints.push({ x: midX, y: (baseY + nextY) / 2 + jag });
					}
				}
				drawTraceLine(ctx, ecgPoints, ink.trace, 2.8);

				// Points + labels de jours
				ctx.textAlign = 'center';
				for (let i = 0; i < 7; i++) {
					const t = i / 6;
					const px = ECG_X + t * ECG_W;
					const py = ECG_Y + ECG_H - (days7[i] / maxDay) * ECG_H;
					ctx.save();
					ctx.fillStyle = ink.trace;
					ctx.shadowColor = ink.trace;
					ctx.shadowBlur = 8;
					ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
					ctx.restore();
					drawCardinalText(ctx, dayLabels[i], px, ECG_Y + ECG_H + 22, ink.traceDim, 12, "500");
				}

				// ── BLOC STATS (2 colonnes) ────────────────────────────────────────────
				const STAT_Y = ECG_Y + ECG_H + 60;
				ctx.save();
				ctx.strokeStyle = ink.grid;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(UC_W / 2, STAT_Y);
				ctx.lineTo(UC_W / 2, STAT_Y + 90);
				ctx.stroke();
				ctx.restore();

				ctx.textAlign = 'center';
				drawCardinalText(ctx, getLang("serverRank"), UC_W * 0.25, STAT_Y + 22, ink.traceDim, 13, "600");
				drawCardinalText(ctx, getLang("totalMessages"), UC_W * 0.75, STAT_Y + 22, ink.traceDim, 13, "600");
				drawCardinalText(ctx, `#${user.rank}`, UC_W * 0.25, STAT_Y + 60, ink.trace, 38, "700");
				drawCardinalText(ctx, String(user.count), UC_W * 0.75, STAT_Y + 60, ink.trace, 38, "700");

				// ── PIC D'AMPLITUDE MAXIMALE ───────────────────────────────────────────
				const dailyData = user.activity.daily;
				const fullDays = [];
				for (let i = 6; i >= 0; i--) {
					const day = moment().tz("Asia/Ho_Chi_Minh").subtract(i, 'days');
					fullDays.push({ label: day.format('dddd'), count: dailyData[day.format('YYYY-MM-DD')] || 0 });
				}
				const busiest = fullDays.reduce((p, c) => (p.count > c.count ? p : c), { count: -1 });

				const BUSY_Y = STAT_Y + 130;
				ctx.textAlign = 'center';
				drawCardinalText(ctx, getLang("busiestDay"), UC_W / 2, BUSY_Y, ink.traceDim, 13, "600");
				drawCardinalText(ctx, busiest.count > 0 ? `${busiest.label} — ${busiest.count}` : getLang("noSignal"), UC_W / 2, BUSY_Y + 28, ink.accent, 22, "700");

				// ── COMPOSITION DU SIGNAL (barres horizontales empilées) ───────────────
				const BREAK_Y = BUSY_Y + 80;
				ctx.textAlign = 'left';
				drawCardinalText(ctx, getLang("messageBreakdown"), 60, BREAK_Y, ink.traceDim, 15, "600");

				const types = user.activity.types;
				const totalTypes = types.text + types.sticker + types.media || 1;
				const segments = [
					{ label: getLang("text"), value: types.text, color: ink.trace },
					{ label: getLang("sticker"), value: types.sticker, color: ink.traceDim },
					{ label: getLang("media"), value: types.media, color: ink.accent },
				];

				const BAR_Y = BREAK_Y + 24;
				const BAR_X = 60, BAR_W = UC_W - 120, BAR_H = 22;
				ctx.save();
				ctx.fillStyle = ink.grid;
				ctx.globalAlpha = 0.4;
				ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
				ctx.restore();

				let segX = BAR_X;
				segments.forEach(seg => {
					const segW = (seg.value / totalTypes) * BAR_W;
					ctx.fillStyle = seg.color;
					ctx.fillRect(segX, BAR_Y, Math.max(segW, 0), BAR_H);
					segX += segW;
				});

				let legendY = BAR_Y + 44;
				segments.forEach(seg => {
					const pct = totalTypes > 0 ? ((seg.value / totalTypes) * 100).toFixed(1) : 0;
					ctx.fillStyle = seg.color;
					ctx.fillRect(60, legendY, 14, 14);
					ctx.textAlign = 'left';
					drawCardinalText(ctx, `${seg.label}`, 84, legendY + 11, ink.accent, 14, "600");
					ctx.textAlign = 'right';
					drawCardinalText(ctx, `${pct}% (${seg.value})`, UC_W - 60, legendY + 11, ink.traceDim, 13, "500");
					legendY += 26;
				});

				// ── PIED DE PAGE ──────────────────────────────────────────────────────
				ctx.textAlign = 'center';
				const now = moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
				drawCardinalText(ctx, `◈  ${now}  ·  Christus  ◈`, UC_W / 2, UC_H - 24, ink.traceDim, 12, "500");

				const outPath = resolve(__dirname, 'cache', `usercard_${uid}.png`);
				const out = createWriteStream(outPath);
				const stream = canvas.createPNGStream();
				stream.pipe(out);
				out.on('finish', () => {
					message.reply({ attachment: require('fs').createReadStream(outPath) });
				});
			}
		}
	},

	onReply: async function ({ event, Reply, message, getLang }) {
		if (event.senderID !== Reply.author || Reply.type !== 'leaderboard') return;

		const page = parseInt(event.body);
		if (isNaN(page)) return;

		try {
			message.unsend(Reply.messageID);
			const newArgs = ['all', page.toString()];
			await this.onStart({
				...arguments[0],
				args: newArgs,
				event: { ...arguments[0].event, body: `/count ${newArgs.join(' ')}` }
			});
		} catch (e) {
			console.error("Erreur pendant la pagination :", e);
			message.reply(getLang("invalidPage"));
		}
	}

};
