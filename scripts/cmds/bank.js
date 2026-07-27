const { getTime } = global.utils;
const fonts = require('../../func/font.js');
const numbers = require('../../func/number.js');

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
	const cv = require("canvas");
	loadImage = cv.loadImage;
	createCanvas = cv.createCanvas;
	registerFont = cv.registerFont;
	canvasAvailable = true;
} catch (e) { console.error("Canvas unavailable:", e.message); }

let fontsLoaded = false;
function ensureFonts() {
	if (fontsLoaded || !canvasAvailable || !registerFont) return;
	fontsLoaded = true;
	try {
		const fd = path.join(__dirname, "assets", "font");
		if (!fs.existsSync(fd)) return;
		const fontFiles = [
			["BeVietnamPro-Bold.ttf", "BK", "bold"],
			["BeVietnamPro-Regular.ttf", "BK", "normal"],
			["BeVietnamPro-SemiBold.ttf", "BK", "600"],
			["NotoSans-Bold.ttf", "BK", "bold"],
			["NotoSans-Regular.ttf", "BK", "normal"]
		];
		for (const [f, fam, w] of fontFiles) {
			try {
				const fp = path.join(fd, f);
				if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
			} catch (_) {}
		}
	} catch (_) {}
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

const VAULT_THEMES = {
	graphite: { name: "Graphite", primary: "#9BA3AF", secondary: "#3A3F47", bg1: "#0A0B0D", bg2: "#15171A", text: "#EDEFF2", grid: "#9BA3AF" },
	slate_blue: { name: "Slate Blue", primary: "#6E8FB0", secondary: "#2A3C4D", bg1: "#070A0D", bg2: "#0F1620", text: "#E7EEF5", grid: "#6E8FB0" },
	copper_line: { name: "Copper Line", primary: "#B87B4A", secondary: "#4A2F1C", bg1: "#0C0805", bg2: "#180F09", text: "#F2E6DA", grid: "#B87B4A" },
	mono_white: { name: "Mono White", primary: "#D8DCE2", secondary: "#3E4248", bg1: "#08090A", bg2: "#121315", text: "#F5F6F8", grid: "#D8DCE2" },
	forest_steel: { name: "Forest Steel", primary: "#5E9C7C", secondary: "#23362C", bg1: "#050A07", bg2: "#0D1712", text: "#E3F2EA", grid: "#5E9C7C" },
	crimson_grid: { name: "Crimson Grid", primary: "#B0525E", secondary: "#3D1A1F", bg1: "#0A0506", bg2: "#160A0C", text: "#F4E1E4", grid: "#B0525E" },
	violet_frame: { name: "Violet Frame", primary: "#8A6FBF", secondary: "#332A4D", bg1: "#08070D", bg2: "#120F1C", text: "#ECE6F8", grid: "#8A6FBF" },
	amber_index: { name: "Amber Index", primary: "#C9974A", secondary: "#4A3A1C", bg1: "#0B0904", bg2: "#181208", text: "#F5ECDA", grid: "#C9974A" },
};

function rr(ctx, x, y, w, h, r) {
	if (typeof r === "number") r = [r, r, r, r];
	const [tl, tr, br, bl] = r;
	ctx.beginPath();
	ctx.moveTo(x + tl, y); ctx.lineTo(x + w - tr, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + tr); ctx.lineTo(x + w, y + h - br);
	ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h); ctx.lineTo(x + bl, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - bl); ctx.lineTo(x, y + tl);
	ctx.quadraticCurveTo(x, y, x + tl, y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, { align = "left", weight = "bold", glow = null, alpha = 1, letterSpacing = 0 } = {}) {
	ctx.save(); ctx.globalAlpha = alpha;
	ctx.font = `${weight} ${sz}px BK, Arial`;
	ctx.textAlign = letterSpacing ? "left" : align;
	ctx.textBaseline = "middle";
	if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 16; }
	ctx.fillStyle = color;
	if (letterSpacing) {
		let cx = x;
		if (align === "center") {
			const w = [...s].reduce((acc, ch) => acc + ctx.measureText(ch).width + letterSpacing, -letterSpacing);
			cx = x - w / 2;
		} else if (align === "right") {
			const w = [...s].reduce((acc, ch) => acc + ctx.measureText(ch).width + letterSpacing, -letterSpacing);
			cx = x - w;
		}
		for (const ch of s) {
			ctx.fillText(ch, cx, y);
			cx += ctx.measureText(ch).width + letterSpacing;
		}
	} else {
		ctx.fillText(s, x, y);
	}
	ctx.restore();
}

function GL(ctx, x1, y1, x2, y2, color, w = 1.2) {
	const g = ctx.createLinearGradient(x1, y1, x2, y2);
	g.addColorStop(0, "transparent"); g.addColorStop(0.5, color); g.addColorStop(1, "transparent");
	ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = w;
	ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

function drawIndexBg(ctx, W, H, t) {
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, t.bg1); g.addColorStop(0.55, t.bg2); g.addColorStop(1, t.bg1);
	ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

	ctx.save();
	ctx.strokeStyle = t.grid; ctx.globalAlpha = 0.05; ctx.lineWidth = 1;
	for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
	for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
	ctx.restore();

	const corner = 26;
	ctx.save();
	ctx.strokeStyle = t.primary; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
	[[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]].forEach(([x, y, dx, dy]) => {
		ctx.beginPath();
		ctx.moveTo(x, y + corner * dy);
		ctx.lineTo(x, y);
		ctx.lineTo(x + corner * dx, y);
		ctx.stroke();
	});
	ctx.restore();
}

function drawSquareAvatar(ctx, img, x, y, size, t) {
	ctx.save();
	rr(ctx, x, y, size, size, 10);
	ctx.clip();
	if (img) ctx.drawImage(img, x, y, size, size);
	else { ctx.fillStyle = t.secondary; ctx.fillRect(x, y, size, size); }
	ctx.restore();
	ctx.save();
	rr(ctx, x, y, size, size, 10);
	ctx.lineWidth = 2;
	ctx.strokeStyle = t.primary;
	ctx.stroke();
	ctx.restore();
}

function fitText(ctx, text, maxW, baseSize) {
	let size = baseSize;
	ctx.font = `bold ${size}px BK, Arial`;
	while (ctx.measureText(text).width > maxW && size > 14) {
		size -= 1;
		ctx.font = `bold ${size}px BK, Arial`;
	}
	return size;
}

async function fetchAvatar(uid) {
	try {
		const res = await axios.get(
			`https://graph.facebook.com/${uid}/picture?width=400&height=400&access_token=${FB_TOKEN}`,
			{ responseType: "arraybuffer", timeout: 10000 }
		);
		return await loadImage(Buffer.from(res.data));
	} catch (_) { return null; }
}

function pickTheme() {
	const keys = Object.keys(VAULT_THEMES);
	return VAULT_THEMES[keys[Math.floor(Math.random() * keys.length)]];
}

async function buildRankingCanvas(title, rows, t, opts = {}) {
	ensureFonts();
	const rowH = 92;
	const headerH = 200;
	const footH = 70;
	const W = 1500;
	const H = headerH + rows.length * rowH + footH;
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	drawIndexBg(ctx, W, H, t);

	T(ctx, "RANKING INDEX", 60, 70, 22, t.primary, { letterSpacing: 6 });
	T(ctx, title.toUpperCase(), 60, 112, 38, t.text, { letterSpacing: 1 });
	GL(ctx, 60, 150, W - 60, 150, t.primary);

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const y = headerH + i * rowH;

		ctx.save();
		ctx.globalAlpha = i % 2 === 0 ? 0.05 : 0.0;
		ctx.fillStyle = t.primary;
		ctx.fillRect(60, y, W - 120, rowH - 14);
		ctx.restore();

		const rankSize = i < 3 ? 30 : 22;
		T(ctx, `${i + 1}`, 95, y + (rowH - 14) / 2, rankSize, i < 3 ? t.text : t.secondary, { align: "center", weight: "bold" });
		if (i < 3) {
			ctx.save();
			ctx.strokeStyle = t.primary; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
			ctx.beginPath(); ctx.arc(95, y + (rowH - 14) / 2, 26, 0, Math.PI * 2); ctx.stroke();
			ctx.restore();
		}

		if (row.avatar) {
			drawSquareAvatar(ctx, row.avatar, 130, y + 4, rowH - 22, t);
		} else {
			ctx.save();
			rr(ctx, 130, y + 4, rowH - 22, rowH - 22, 8);
			ctx.fillStyle = t.secondary; ctx.fill();
			ctx.restore();
		}

		const textX = 130 + (rowH - 22) + 24;
		T(ctx, row.name.toUpperCase(), textX, y + (rowH - 14) / 2 - 14, 20, t.text, { letterSpacing: 1 });
		T(ctx, row.subtitle || "", textX, y + (rowH - 14) / 2 + 14, 14, t.secondary, { letterSpacing: 1 });

		T(ctx, numbers.apply("monospace", row.value), W - 80, y + (rowH - 14) / 2, 26, t.primary, { align: "right", weight: "bold" });
	}

	GL(ctx, 60, H - footH, W - 60, H - footH, t.primary);
	T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, H - 30, 14, t.secondary, { align: "center", letterSpacing: 3 });

	return canvas;
}

async function buildCatalogCanvas(title, items, t, opts = {}) {
	ensureFonts();
	const cols = opts.cols || 2;
	const cardW = 700;
	const cardH = opts.cardH || 130;
	const gap = 24;
	const headerH = 160;
	const footH = 64;
	const rows = Math.ceil(items.length / cols);
	const W = 60 + cols * cardW + (cols - 1) * gap + 60;
	const H = headerH + rows * cardH + (rows - 1) * gap + footH;
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	drawIndexBg(ctx, W, H, t);

	T(ctx, "CATALOG INDEX", 60, 68, 20, t.primary, { letterSpacing: 6 });
	T(ctx, title.toUpperCase(), 60, 108, 34, t.text, { letterSpacing: 1 });
	GL(ctx, 60, 140, W - 60, 140, t.primary);

	items.forEach((item, i) => {
		const col = i % cols;
		const row = Math.floor(i / cols);
		const x = 60 + col * (cardW + gap);
		const y = headerH + row * (cardH + gap);

		ctx.save();
		rr(ctx, x, y, cardW, cardH, 10);
		ctx.fillStyle = t.bg2;
		ctx.globalAlpha = 0.6;
		ctx.fill();
		ctx.restore();
		ctx.save();
		rr(ctx, x, y, cardW, cardH, 10);
		ctx.strokeStyle = t.primary;
		ctx.globalAlpha = 0.5;
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.restore();

		ctx.save();
		ctx.fillStyle = t.primary; ctx.globalAlpha = 0.9;
		ctx.fillRect(x, y, 5, cardH);
		ctx.restore();

		T(ctx, item.name.toUpperCase(), x + 26, y + 34, 19, t.text, { letterSpacing: 1 });
		if (item.tag) {
			T(ctx, item.tag.toUpperCase(), x + cardW - 24, y + 34, 13, t.secondary, { align: "right", letterSpacing: 2 });
		}
		T(ctx, numbers.apply("monospace", item.price), x + 26, y + 72, 26, t.primary, { weight: "bold" });
		if (item.detail) {
			T(ctx, item.detail, x + 26, y + 102, 14, t.secondary, { letterSpacing: 0.5 });
		}
		if (item.owned) {
			T(ctx, "OWNED", x + cardW - 24, y + 102, 13, t.text, { align: "right", letterSpacing: 2 });
		}
	});

	const footY = H - footH;
	GL(ctx, 60, footY, W - 60, footY, t.primary);
	T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, footY + 36, 14, t.secondary, { align: "center", letterSpacing: 3 });

	return canvas;
}

async function renderAndAttach(message, text, canvasPromise, prefix) {
	if (!canvasAvailable) return message.reply(text);
	try {
		const canvas = await canvasPromise;
		const cacheDir = path.join(__dirname, "cache");
		if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
		const outPath = path.join(cacheDir, `${prefix}_${Date.now()}.png`);
		fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
		await message.reply({ body: text, attachment: fs.createReadStream(outPath) });
		setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
	} catch (e) {
		console.error(`${prefix} canvas error:`, e);
		return message.reply(text);
	}
}

module.exports = {
	config: {
		name: "bank",
		aliases: [],
		version: "4.0",
		author: "Christus",
		countDown: 0,
		role: 0,
		description: {
			en: "Comprehensive banking system"
		},
		category: "economy",
		guide: {
			en: "Use {pn} help to see all commands"
		}
	},

	langs: {
		en: {
			help: "Banking commands list",
			success: "Success",
			error: "Error",
			insufficientFunds: "Insufficient funds",
			invalidAmount: "Invalid amount"
		}
	},

	onLoad: function () {
		ensureFonts();
	},

	marketData: {
		stocks: {
			"AAPL": { price: 150.25, change: 2.1, name: "Apple Inc." },
			"GOOGL": { price: 2800.50, change: 1.8, name: "Alphabet Inc." },
			"TSLA": { price: 800.75, change: -0.5, name: "Tesla Inc." },
			"MSFT": { price: 320.40, change: 1.2, name: "Microsoft Corp." },
			"AMZN": { price: 3200.00, change: 0.8, name: "Amazon.com Inc." },
			"META": { price: 330.00, change: 2.5, name: "Meta Platforms Inc." },
			"NVDA": { price: 450.00, change: 3.2, name: "NVIDIA Corp." },
			"NFLX": { price: 380.00, change: -1.1, name: "Netflix Inc." },
			"DIS": { price: 95.40, change: 0.6, name: "Walt Disney Co." },
			"KO": { price: 62.10, change: 0.3, name: "Coca-Cola Co." },
			"JPM": { price: 178.90, change: 1.1, name: "JPMorgan Chase" },
			"BA": { price: 205.30, change: -2.2, name: "Boeing Co." }
		},
		crypto: {
			"BTC": { price: 45000, change: 3.2, name: "Bitcoin" },
			"ETH": { price: 3200, change: 2.8, name: "Ethereum" },
			"BNB": { price: 400, change: 1.5, name: "Binance Coin" },
			"ADA": { price: 1.20, change: 4.1, name: "Cardano" },
			"DOT": { price: 25.50, change: 2.3, name: "Polkadot" },
			"LINK": { price: 28.00, change: 1.9, name: "Chainlink" },
			"MATIC": { price: 0.85, change: 5.1, name: "Polygon" },
			"SOL": { price: 120.00, change: 3.8, name: "Solana" },
			"XRP": { price: 0.62, change: -1.4, name: "Ripple" },
			"DOGE": { price: 0.14, change: 6.7, name: "Dogecoin" },
			"AVAX": { price: 38.00, change: 2.9, name: "Avalanche" },
			"LTC": { price: 95.00, change: 0.4, name: "Litecoin" }
		},
		bonds: {
			"US_TREASURY": { yield: 2.5, risk: "Low", term: "10 Year", minInvest: 1000 },
			"CORPORATE": { yield: 3.8, risk: "Medium", term: "5 Year", minInvest: 2000 },
			"MUNICIPAL": { yield: 2.1, risk: "Low", term: "7 Year", minInvest: 1500 },
			"HIGH_YIELD": { yield: 6.2, risk: "High", term: "3 Year", minInvest: 5000 },
			"EUROBOND": { yield: 3.2, risk: "Medium", term: "8 Year", minInvest: 3000 },
			"SAVINGS_BOND": { yield: 1.8, risk: "Low", term: "15 Year", minInvest: 500 }
		},
		properties: {
			"APARTMENT": { price: 250000, income: 2500, name: "City Apartment" },
			"HOUSE": { price: 500000, income: 4000, name: "Suburban House" },
			"TOWNHOUSE": { price: 750000, income: 5500, name: "Modern Townhouse" },
			"PENTHOUSE": { price: 1500000, income: 11000, name: "Downtown Penthouse" },
			"MANSION": { price: 2000000, income: 15000, name: "Luxury Mansion" },
			"OFFICE": { price: 1000000, income: 8000, name: "Commercial Office" },
			"WAREHOUSE": { price: 750000, income: 6000, name: "Industrial Warehouse" },
			"MALL": { price: 5000000, income: 40000, name: "Shopping Mall" },
			"HOTEL_RESORT": { price: 8000000, income: 65000, name: "Beach Resort" },
			"SKYSCRAPER": { price: 25000000, income: 180000, name: "Skyscraper Tower" }
		},
		vehicles: {
			"TOYOTA": { price: 25000, depreciation: 0.85, name: "Toyota Camry" },
			"AUDI": { price: 45000, depreciation: 0.78, name: "Audi A6" },
			"BMW": { price: 60000, depreciation: 0.70, name: "BMW M3" },
			"MERCEDES": { price: 90000, depreciation: 0.72, name: "Mercedes-Benz S-Class" },
			"PORSCHE": { price: 130000, depreciation: 0.82, name: "Porsche 911" },
			"FERRARI": { price: 300000, depreciation: 0.90, name: "Ferrari 488" },
			"LAMBORGHINI": { price: 400000, depreciation: 0.85, name: "Lamborghini Huracan" },
			"ASTON_MARTIN": { price: 250000, depreciation: 0.80, name: "Aston Martin DB11" },
			"ROLLS_ROYCE": { price: 500000, depreciation: 0.80, name: "Rolls-Royce Phantom" },
			"BUGATTI": { price: 3000000, depreciation: 0.75, name: "Bugatti Chiron" }
		},
		businesses: {
			"FOOD_TRUCK": { cost: 15000, income: 1800, employees: 1, name: "Food Truck" },
			"COFFEE_SHOP": { cost: 50000, income: 5000, employees: 3, name: "Coffee Shop" },
			"GYM": { cost: 90000, income: 8500, employees: 5, name: "Fitness Gym" },
			"RESTAURANT": { cost: 150000, income: 12000, employees: 8, name: "Restaurant" },
			"NIGHTCLUB": { cost: 350000, income: 28000, employees: 12, name: "Nightclub" },
			"TECH_STARTUP": { cost: 500000, income: 50000, employees: 20, name: "Tech Startup" },
			"CAR_DEALERSHIP": { cost: 1200000, income: 95000, employees: 30, name: "Car Dealership" },
			"HOTEL": { cost: 2000000, income: 150000, employees: 50, name: "Hotel Chain" },
			"FACTORY": { cost: 5000000, income: 400000, employees: 120, name: "Manufacturing Factory" },
			"BANK": { cost: 10000000, income: 800000, employees: 200, name: "Regional Bank" },
			"SHIPPING_LINE": { cost: 25000000, income: 1800000, employees: 500, name: "Shipping Company" },
			"AIRLINE": { cost: 50000000, income: 3000000, employees: 1000, name: "Airline Company" }
		},
		luxury: {
			"WATCH": { price: 8000, name: "Designer Watch" },
			"ROLEX": { price: 15000, name: "Rolex Submariner" },
			"DIAMOND": { price: 50000, name: "5 Carat Diamond" },
			"PAINTING": { price: 100000, name: "Van Gogh Replica" },
			"SCULPTURE": { price: 180000, name: "Bronze Sculpture" },
			"RARE_WINE": { price: 250000, name: "Vintage Wine Collection" },
			"YACHT": { price: 2000000, name: "Luxury Yacht" },
			"HELICOPTER": { price: 5000000, name: "Private Helicopter" },
			"PRIVATE_JET": { price: 25000000, name: "Private Jet" },
			"ISLAND": { price: 100000000, name: "Private Island" }
		},
		commodities: {
			"GOLD": { price: 1950, change: 0.6, unit: "oz", name: "Gold Bullion" },
			"SILVER": { price: 24.50, change: 1.1, unit: "oz", name: "Silver Bullion" },
			"OIL": { price: 78.30, change: -0.9, unit: "barrel", name: "Crude Oil" },
			"PLATINUM": { price: 980, change: 0.3, unit: "oz", name: "Platinum" },
			"COPPER": { price: 4.10, change: 1.4, unit: "lb", name: "Copper" },
			"NATURAL_GAS": { price: 2.85, change: -1.6, unit: "MMBtu", name: "Natural Gas" }
		},
		nft: {
			"PIXEL_PUNK": { price: 12000, rarity: "Rare", name: "Pixel Punk #4821" },
			"CRYPTO_APE": { price: 45000, rarity: "Epic", name: "Crypto Ape Collective" },
			"DIGITAL_LAND": { price: 80000, rarity: "Epic", name: "Metaverse Land Plot" },
			"GOLDEN_TICKET": { price: 150000, rarity: "Legendary", name: "Golden Access Ticket" },
			"GENESIS_BLOCK": { price: 500000, rarity: "Mythic", name: "Genesis Block Art" }
		}
	},

	onStart: async function ({ message, args, event, usersData, api }) {
		const { senderID, threadID } = event;
		const command = args[0]?.toLowerCase();

		let user = await usersData.get(senderID);
		if (!user) user = { money: 0, exp: 0, data: {} };
		if (!user.data.bank) {
			user.data.bank = {
				balance: 0, savings: 0, vault: 0, loan: 0, loanDate: null,
				creditScore: 750, bankLevel: 1, multiplier: 1.0, premium: false,
				streak: 0, lastDaily: null, lastWork: null, lastRob: null,
				lastInterest: Date.now(), lotteryTickets: 0, achievements: [],
				reputation: 0, skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
				stocks: {}, crypto: {}, bonds: {}, realEstate: [], businesses: [],
				vehicles: [], luxury: [], insurance: {}, transactions: [], commodities: {}, nfts: []
			};
		}
		const bank = user.data.bank;
		const walletBalance = user.money || 0;

		const save = async () => {
			await usersData.set(senderID, user);
		};

		switch (command) {
			case "help":
			case undefined:
				return this.showHelp(message, fonts);

			case "balance":
			case "bal":
				return this.showBalance(message, bank, walletBalance, fonts, senderID, usersData, api);

			case "deposit":
			case "dep":
				return this.deposit(message, args, user, usersData, bank, senderID, fonts, save);

			case "withdraw":
			case "wd":
				return this.withdraw(message, args, user, usersData, bank, senderID, fonts, save);

			case "transfer":
			case "send":
				return this.transfer(message, args, bank, usersData, senderID, event, fonts, save);

			case "loan":
				return this.loan(message, args, bank, senderID, fonts, save);

			case "repay":
				return this.repayLoan(message, args, bank, senderID, fonts, save);

			case "savings":
			case "save":
				return this.savings(message, args, bank, senderID, fonts, save);

			case "interest":
				return this.calculateInterest(message, bank, senderID, fonts, save);

			case "collect":
				return this.collectInterest(message, bank, senderID, fonts, save);

			case "history":
				return this.showHistory(message, bank, fonts);

			case "freeze":
				return this.freezeAccount(message, bank, senderID, fonts, save);

			case "daily":
				return this.dailyReward(message, bank, senderID, fonts, save);

			case "work":
				return this.work(message, bank, senderID, fonts, save);

			case "invest":
				return this.invest(message, fonts);

			case "stocks":
				return this.stocks(message, args, bank, senderID, fonts, save);

			case "bonds":
				return this.bonds(message, args, bank, senderID, fonts, save);

			case "crypto":
				return this.crypto(message, args, bank, senderID, fonts, save);

			case "portfolio":
				return this.showPortfolio(message, bank, fonts);

			case "market":
				return this.showMarket(message, fonts);

			case "dividend":
				return this.collectDividend(message, bank, senderID, fonts, save);

			case "business":
				return this.business(message, args, bank, senderID, fonts, save);

			case "shop":
				return this.shop(message, args, bank, senderID, fonts, save);

			case "property":
			case "realestate":
				return this.realEstate(message, args, bank, senderID, fonts, save);

			case "house":
				return this.buyHouse(message, args, bank, senderID, fonts, save);

			case "rent":
				return this.rentProperty(message, bank, senderID, fonts, save);

			case "luxury":
				return this.luxury(message, args, bank, senderID, fonts, save);

			case "car":
				return this.buyCar(message, args, bank, senderID, fonts, save);

			case "commodities":
			case "commodity":
				return this.commodities(message, args, bank, senderID, fonts, save);

			case "nft":
				return this.nftMarket(message, args, bank, senderID, fonts, save);

			case "gamble":
				return this.gamble(message, args, bank, senderID, fonts, save);

			case "lottery":
				return this.lottery(message, args, bank, senderID, fonts, save);

			case "slots":
				return this.slots(message, args, bank, senderID, fonts, save);

			case "blackjack":
				return this.blackjack(message, args, bank, senderID, fonts, save);

			case "roulette":
				return this.roulette(message, args, bank, senderID, fonts, save);

			case "premium":
				return this.premium(message, args, bank, senderID, fonts, save);

			case "vault":
				return this.vault(message, args, bank, senderID, fonts, save);

			case "insurance":
				return this.insurance(message, args, bank, senderID, fonts, save);

			case "credit":
				return this.creditScore(message, bank, fonts);

			case "achievements":
				return this.achievements(message, bank, fonts);

			case "leaderboard":
				return this.leaderboard(message, usersData, fonts, api, senderID);

			case "rob":
				return this.rob(message, args, bank, usersData, senderID, event, fonts, save);

			case "networth":
			case "nw":
				return this.netWorth(message, args, bank, walletBalance, fonts, senderID, event, usersData, api);

			case "statement":
			case "report":
				return this.statement(message, args, bank, walletBalance, fonts, senderID, event, usersData, api);

			case "goal":
				return this.savingsGoal(message, args, bank, fonts, save);

			case "tax":
				return this.payTax(message, bank, senderID, fonts, save);

			case "convert":
			case "exchange":
				return this.convertCurrency(message, args, fonts);

			case "pin":
				return this.managePin(message, args, bank, fonts, save);

			case "gift":
				return this.giftMoney(message, args, user, usersData, senderID, event, fonts, save);

			case "networthboard":
			case "nwboard":
				return this.netWorthLeaderboard(message, usersData, fonts, api, senderID);

			case "subscription":
			case "sub":
				return this.subscription(message, args, bank, fonts, save);

			case "budget":
				return this.budgetPlanner(message, args, bank, fonts, save);

			case "streak":
				return this.streakBonus(message, bank, fonts, save);

			case "split":
				return this.splitBill(message, args, user, usersData, senderID, event, fonts, save);

			case "forecast":
				return this.forecastGrowth(message, args, bank, walletBalance, fonts);

			case "card":
				return this.virtualCard(message, args, bank, fonts, save);

			case "upgrade":
				return this.upgradeLevel(message, args, bank, user, fonts, save);

			default:
				return message.reply(fonts.bold("❌ Unknown command. Use 'bank help' to see all commands."));
		}
	},

	showHelp: function (message, fonts) {
		const helpText = `
${fonts.bold("🏦 SYSTÈME BANCAIRE")}
━━━━━━━━━━━━━━━━
${fonts.bold("💎 L'Expérience Financière Ultime 💎")}

${fonts.bold("💰 BANQUE DE BASE")} ${fonts.bold("━━━━━━━━━━━━━")}
🏦 bank balance - Votre aperçu financier complet
💵 bank deposit <montant> - Sécurisez votre argent à la banque
💸 bank withdraw <montant> - Accédez à vos fonds instantanément
📤 bank transfer @utilisateur <montant> - Envoyez de l'argent à vos amis
💳 bank loan <montant> - Obtenez un financement pour vos rêves
🔄 bank repay <montant> - Construisez votre score de crédit
🏛️ bank savings <montant> - Faites fructifier votre argent en toute sécurité
🏛️ bank savings withdraw <montant> - Retirez de l'épargne
📊 bank interest - Calculez vos gains
💰 bank collect - Récupérez vos intérêts
📋 bank history - Consultez votre historique de transactions
🎁 bank daily - Réclamez vos bonus quotidiens (24h)
💼 bank work - Gagnez de l'argent via différents emplois

${fonts.bold("📈 INVESTISSEMENTS")} ${fonts.bold("━━━━━━━━━━━━━")}
🚀 bank invest - Explorez les opportunités d'investissement
📊 bank stocks [list/buy/sell] - Actions de premier ordre
₿ bank crypto [list/buy/sell] - Trading de cryptomonnaies
🏛️ bank bonds [list/buy/sell] - Obligations d'État stables
📊 bank portfolio - Consultez votre portefeuille d'investissement
📈 bank market - Prix et tendances du marché en direct
💰 bank dividend - Collectez les dividendes d'investissement

${fonts.bold("🏢 EMPIRE COMMERCIAL")} ${fonts.bold("━━━━━━━━━━━━━")}
🏢 bank business [list/buy/upgrade] - Construisez votre empire
🛒 bank shop [list/buy] - Articles exclusifs et mises à niveau

${fonts.bold("🏠 IMMOBILIER")} ${fonts.bold("━━━━━━━━━━━━━")}
🏠 bank property [list/buy/sell] - Propriétés de luxe
🏘️ bank house [list/buy/sell] - Maisons de luxe
💰 bank rent - Collectez vos revenus locatifs passifs

${fonts.bold("💎 STYLE DE VIE LUXUEUX")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 bank luxury [list/buy] - Objets de collection exclusifs
🚗 bank car [list/buy/sell] - Collection de véhicules de luxe
🪙 bank commodities [list/buy/sell] - Or, argent, pétrole et plus
🖼️ bank nft [list/buy] - Marché des NFT

${fonts.bold("🎰 JEUX & DIVERTISSEMENT")} ${fonts.bold("━━━━━━━━━━━━━")}
🎲 bank gamble <montant> - Jeux à haut risque, haute récompense
🎫 bank lottery [buy/check] - Tirages de loterie hebdomadaires
🎰 bank slots <montant> - Machines à sous style Las Vegas
🃏 bank blackjack <montant> - Jeu de cartes classique
🎯 bank roulette <montant> <mise> - Roulette européenne

${fonts.bold("⭐ PREMIUM & SOCIAL")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 bank premium [buy] - Gains x2 et avantages exclusifs
🔐 bank vault [deposit/withdraw] - Stockage ultra-sécurisé
🛡️ bank insurance [list/buy/claim] - Protégez vos actifs
📊 bank credit - Surveillez votre score de crédit
🏆 bank achievements - Débloquez des récompenses et titres
🏆 bank leaderboard - Compétitionnez avec les meilleurs utilisateurs
🏴‍☠️ bank rob @utilisateur - Tentatives de vol risquées

${fonts.bold("🆕 NOUVEAUX OUTILS")} ${fonts.bold("━━━━━━━━━━━━━━━━")}
💎 bank networth - Répartition complète du patrimoine net
📋 bank statement - Relevé de compte détaillé
🎯 bank goal set <montant> - Suivi d'objectif d'épargne
🧾 bank tax - Payer la taxe annuelle sur la fortune
💱 bank convert <montant> <de> <vers> - Convertisseur de devises
🔐 bank pin set/remove - Code PIN de sécurité du compte
🎁 bank gift @utilisateur <montant> - Envoyer un cadeau exempt de taxe
🏆 bank networthboard - Classement du patrimoine net
🔁 bank subscription plans/start/cancel - Abonnement d'auto-épargne
📐 bank budget set <catégorie> <limite> - Planificateur budgétaire
🔥 bank streak - Bonus de fidélité quotidien
🧾 bank split <montant> @user1 @user2 - Partager une facture
📈 bank forecast <semaines> - Prévision de croissance
💳 bank card create/spend - Carte virtuelle avec cashback
🏦 bank upgrade info - Améliorer votre niveau de compte
`;
		return message.reply(helpText);
	},

	showBalance: async function (message, bank, walletBalance, fonts, senderID, usersData, api) {
		const portfolioValue = this.calculatePortfolioValue(bank);
		const realEstateValue = this.calculateRealEstateValue(bank);
		const businessValue = this.calculateBusinessValue(bank);
		const vehicleValue = this.calculateVehicleValue(bank);
		const luxuryValue = this.calculateLuxuryValue(bank);

		const totalLiquid = bank.balance + bank.savings + bank.vault + walletBalance;
		const totalAssets = portfolioValue + realEstateValue + businessValue + vehicleValue + luxuryValue;
		const totalWealth = totalLiquid + totalAssets;

		let wealthTier = "👤 Débutant";
		if (totalWealth >= 1000000000) wealthTier = "💎 Milliardaire";
		else if (totalWealth >= 1000000) wealthTier = "🏆 Millionnaire";
		else if (totalWealth >= 100000) wealthTier = "💰 Riche";
		else if (totalWealth >= 10000) wealthTier = "📈 En progression";

		let creditRating = "🔴 Mauvais";
		let creditEmoji = "🔴";
		if (bank.creditScore >= 800) {
			creditRating = "🟢 Excellent";
			creditEmoji = "🟢";
		} else if (bank.creditScore >= 740) {
			creditRating = "🟢 Très Bon";
			creditEmoji = "🟢";
		} else if (bank.creditScore >= 670) {
			creditRating = "🟡 Bon";
			creditEmoji = "🟡";
		} else if (bank.creditScore >= 580) {
			creditRating = "🟠 Moyen";
			creditEmoji = "🟠";
		}

		let tierEmoji = "🔰";
		if (totalWealth >= 1000000000) tierEmoji = "👑";
		else if (totalWealth >= 1000000) tierEmoji = "⭐";
		else if (totalWealth >= 100000) tierEmoji = "✨";
		else if (totalWealth >= 10000) tierEmoji = "🚀";

		const balanceText = `
${fonts.bold("💳 TABLEAU DE BORD FINANCIER")} ${tierEmoji}
━━━━━━━━━━━━━
${fonts.bold(wealthTier)} • ${fonts.bold("Niveau " + bank.bankLevel)}${bank.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 ACTIFS LIQUIDES")} ${fonts.bold("━━━━━━━━━━━━━")}
💵 Portefeuille: ${fonts.bold("$" + walletBalance.toLocaleString())}
🏦 Banque: ${fonts.bold("$" + bank.balance.toLocaleString())}
🏛️ Épargne: ${fonts.bold("$" + bank.savings.toLocaleString())} ${bank.savings > 0 ? "(+3% mensuel)" : ""}
🔐 Coffre: ${fonts.bold("$" + bank.vault.toLocaleString())} ${bank.vault > 0 ? "(+1% mensuel)" : ""}
├─ ${fonts.bold("Total Liquide: $" + totalLiquid.toLocaleString())}

${fonts.bold("📊 PORTEFEUILLE D'ACTIFS")} ${fonts.bold("━━━━━━━━━━━━━")}
📈 Investissements: ${fonts.bold("$" + portfolioValue.toLocaleString())}
🏠 Immobilier: ${fonts.bold("$" + realEstateValue.toLocaleString())}
🏢 Entreprises: ${fonts.bold("$" + businessValue.toLocaleString())}
🚗 Véhicules: ${fonts.bold("$" + vehicleValue.toLocaleString())}
💎 Luxe: ${fonts.bold("$" + luxuryValue.toLocaleString())}
├─ ${fonts.bold("Total Actifs: $" + totalAssets.toLocaleString())}

${fonts.bold("🏆 RÉSUMÉ DE RICHESSE")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 ${fonts.bold("Patrimoine Net: $" + totalWealth.toLocaleString())}
${creditEmoji} Score de Crédit: ${fonts.bold(bank.creditScore + "/850")} (${creditRating})
🎯 Prêt Max: ${fonts.bold("$" + (bank.creditScore * 1000).toLocaleString())}
⚡ Multiplicateur de Gains: ${fonts.bold(bank.multiplier + "x")}${bank.premium ? " (Boost Premium!)" : ""}

${fonts.bold("📈 MÉTRIQUES DE PERFORMANCE")} ${fonts.bold("━━━━━━━━━━━━━")}
🔥 Série Quotidienne: ${fonts.bold(bank.streak + " jours")} ${bank.streak >= 7 ? "🎉" : ""}
🏆 Succès: ${fonts.bold((bank.achievements?.length || 0) + "/100")} ${bank.achievements?.length >= 10 ? "⭐" : ""}
⭐ Réputation: ${fonts.bold(bank.reputation)} ${bank.reputation >= 100 ? "👑" : ""}
💸 Prêt Actif: ${fonts.bold(bank.loan > 0 ? "$" + bank.loan.toLocaleString() : "Aucun ✅")}

${fonts.bold("🎲 STATS DE JEU")} ${fonts.bold("━━━━━━━━━━━━━")}
🎰 Compétence de Jeu: ${fonts.bold(bank.skills?.gambling || 0)}
📊 Compétence de Trading: ${fonts.bold(bank.skills?.trading || 0)}
🏢 Compétence Commerciale: ${fonts.bold(bank.skills?.business || 0)}
📈 Compétence d'Investissement: ${fonts.bold(bank.skills?.investing || 0)}`;

		if (!canvasAvailable || !senderID) {
			return message.reply(balanceText);
		}

		try {
			const renderData = {
				name: (await usersData.getName(senderID).catch(() => null)) || "Titulaire du Compte",
				wealthTier: wealthTier.replace(/[^\w\s]/g, '').trim(),
				totalWealth, totalLiquid, totalAssets,
				wallet: walletBalance, bankBalance: bank.balance, savings: bank.savings, vault: bank.vault,
				creditScore: bank.creditScore, creditRating: creditRating.replace(/[^\w\s]/g, '').trim(),
				level: bank.bankLevel,
				loan: bank.loan, streak: bank.streak, premium: bank.premium
			};
			const themeKeys = Object.keys(VAULT_THEMES);
			const themeKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
			const theme = VAULT_THEMES[themeKey];
			const avatar = await fetchAvatar(senderID);

			const cacheDir = path.join(__dirname, "cache");
			if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
			const outPath = path.join(cacheDir, `bank_balance_${Date.now()}.png`);

			const canvas = await this.buildBalanceCanvas(renderData, theme, avatar);
			fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

			await message.reply({ body: balanceText, attachment: fs.createReadStream(outPath) });
			setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
		} catch (e) {
			console.error("Bank balance canvas error:", e);
			return message.reply(balanceText);
		}
	},

	buildBalanceCanvas: async function (data, t, avatar) {
		ensureFonts();
		const W = 1500, H = 820;
		const canvas = createCanvas(W, H);
		const ctx = canvas.getContext("2d");

		drawIndexBg(ctx, W, H, t);

		T(ctx, "ACCOUNT INDEX", 60, 70, 22, t.primary, { letterSpacing: 6 });
		T(ctx, data.name.toUpperCase(), 60, 112, 38, t.text, { letterSpacing: 1 });
		GL(ctx, 60, 145, W - 60, 145, t.primary);

		drawSquareAvatar(ctx, avatar, W - 196, 50, 136, t);
		T(ctx, data.wealthTier.toUpperCase(), W - 128, 210, 16, t.secondary, { align: "center", letterSpacing: 2 });

		const colX = 60, colW = (W - 120 - 40) / 2;
		const rowY = 200;
		T(ctx, "LIQUID ASSETS", colX, rowY, 18, t.primary, { letterSpacing: 3 });
		const liquidRows = [
			["WALLET", numbers.money(data.wallet)],
			["BANK", numbers.money(data.bankBalance)],
			["SAVINGS", numbers.money(data.savings)],
			["VAULT", numbers.money(data.vault)],
		];
		liquidRows.forEach((row, i) => {
			const y = rowY + 50 + i * 56;
			ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = t.primary;
			rr(ctx, colX, y - 24, colW, 44, 6); ctx.fill(); ctx.restore();
			T(ctx, row[0], colX + 20, y, 17, t.secondary, { letterSpacing: 1 });
			T(ctx, numbers.apply("monospace", row[1]), colX + colW - 20, y, 22, t.text, { align: "right" });
		});

		const col2X = colX + colW + 40;
		T(ctx, "PORTFOLIO SUMMARY", col2X, rowY, 18, t.primary, { letterSpacing: 3 });
		const rows2 = [
			["LIQUID TOTAL", numbers.money(data.totalLiquid)],
			["ASSET TOTAL", numbers.money(data.totalAssets)],
			["CREDIT SCORE", `${numbers.apply("monospace", data.creditScore)} / 850`],
			["ACTIVE LOAN", data.loan > 0 ? numbers.money(data.loan) : "NONE"],
		];
		rows2.forEach((row, i) => {
			const y = rowY + 50 + i * 56;
			ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = t.primary;
			rr(ctx, col2X, y - 24, colW, 44, 6); ctx.fill(); ctx.restore();
			T(ctx, row[0], col2X + 20, y, 17, t.secondary, { letterSpacing: 1 });
			T(ctx, numbers.apply("monospace", String(row[1])), col2X + colW - 20, y, 22, t.text, { align: "right" });
		});

		const netY = rowY + 50 + 4 * 56 + 30;
		GL(ctx, 60, netY - 30, W - 60, netY - 30, t.primary);
		T(ctx, "NET WORTH", 60, netY + 20, 20, t.secondary, { letterSpacing: 3 });
		T(ctx, numbers.apply("monospace", numbers.money(data.totalWealth)), 60, netY + 70, 52, t.text, { weight: "bold", glow: t.primary });

		T(ctx, "LEVEL", W - 320, netY + 20, 16, t.secondary, { align: "left", letterSpacing: 2 });
		T(ctx, numbers.apply("monospace", String(data.level)), W - 320, netY + 60, 36, t.primary, { align: "left" });
		T(ctx, "STREAK", W - 180, netY + 20, 16, t.secondary, { align: "left", letterSpacing: 2 });
		T(ctx, numbers.apply("monospace", String(data.streak)), W - 180, netY + 60, 36, t.primary, { align: "left" });

		T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, H - 36, 14, t.secondary, { align: "center", letterSpacing: 3 });

		return canvas;
	},

	deposit: async function (message, args, user, usersData, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
💰 DEPOSIT HELP
━━━━━━━━━━━━━

Usage: bank deposit <amount>
Example: bank deposit 5000

Your current wallet: ${numbers.money((user.money || 0))}
			`));
		}

		const userMoney = user.money || 0;
		if (userMoney < amount) {
			return message.reply(fonts.bold(`
❌ INSUFFICIENT FUNDS
━━━━━━━━━━━

Wallet Balance: ${numbers.money(userMoney)}
Required Amount: ${numbers.money(amount)}
Shortfall: ${numbers.money((amount - userMoney))}

💡 Tip: Use 'bank work' to earn more money!
			`));
		}

		user.money = userMoney - amount;
		bank.balance += amount;
		bank.transactions.push({
			type: "deposit",
			amount: amount,
			date: Date.now(),
			description: "Cash deposit"
		});

		if (!bank.achievements.includes("First Deposit")) {
			bank.achievements.push("First Deposit");
		}
		if (amount >= 1000000 && !bank.achievements.includes("Million Dollar Deposit")) {
			bank.achievements.push("Million Dollar Deposit");
		}

		await save();

		const newAchievements = bank.achievements.includes("First Deposit") ? "\n🏆 Achievement unlocked: First Deposit!" : "";
		const millionAchievement = bank.achievements.includes("Million Dollar Deposit") ? "\n🏆 Achievement unlocked: Million Dollar Deposit!" : "";

		return message.reply(fonts.bold(`
💰 DEPOSIT SUCCESSFUL! 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Amount Deposited: ${numbers.money(amount)}
🏦 New Bank Balance: ${numbers.money(bank.balance)}
💳 Remaining Wallet: ${numbers.money(user.money)}

📊 Transaction recorded successfully!
${newAchievements}${millionAchievement}

💡 Your money is now earning interest in the bank!
		`));
	},

	withdraw: async function (message, args, user, usersData, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
💸 WITHDRAWAL HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: bank withdraw <amount>
Example: bank withdraw 5000

Your current bank balance: ${numbers.money(bank.balance)}
			`));
		}

		if (bank.balance < amount) {
			return message.reply(fonts.bold(`
❌ INSUFFICIENT BANK FUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Balance: ${numbers.money(bank.balance)}
Required Amount: ${numbers.money(amount)}
Shortfall: ${numbers.money((amount - bank.balance))}

💡 Tips:
• Use 'bank collect' to claim interest
• Transfer from savings if available
• Work or invest to earn more money
			`));
		}

		user.money = (user.money || 0) + amount;
		bank.balance -= amount;
		bank.transactions.push({
			type: "withdrawal",
			amount: amount,
			date: Date.now(),
			description: "Cash withdrawal"
		});

		await save();

		return message.reply(fonts.bold(`
💸 WITHDRAWAL SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Amount Withdrawn: ${numbers.money(amount)}
💳 New Wallet Balance: ${numbers.money(user.money)}
🏦 Remaining Bank Balance: ${numbers.money(bank.balance)}

📊 Transaction recorded successfully!

💡 Remember: Money in your wallet can be stolen!
Consider keeping funds in your vault for security.
		`));
	},

	transfer: async function (message, args, bank, usersData, senderID, event, fonts, save) {
		const targetUID = Object.keys(event.mentions)[0];
		const amount = parseInt(args[2]);

		if (!targetUID) {
			return message.reply(fonts.bold("❌ Please mention a user to transfer money to.\nUsage: bank transfer @user <amount>"));
		}
		if (targetUID === senderID) {
			return message.reply(fonts.bold("❌ You cannot transfer money to yourself."));
		}
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold("❌ Please enter a valid amount to transfer."));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold(`❌ Insufficient funds in your bank account. You have ${numbers.money(bank.balance)}, but need ${numbers.money(amount)}.`));
		}

		try {
			let targetUser = await usersData.get(targetUID);
			if (!targetUser) targetUser = { money: 0, exp: 0, data: {} };
			if (!targetUser.data.bank) {
				targetUser.data.bank = {
					balance: 0, savings: 0, vault: 0, loan: 0, loanDate: null,
					creditScore: 750, bankLevel: 1, multiplier: 1.0, premium: false,
					streak: 0, lastDaily: null, lastWork: null, lastRob: null,
					lastInterest: Date.now(), lotteryTickets: 0, achievements: [],
					reputation: 0, skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
					stocks: {}, crypto: {}, bonds: {}, realEstate: [], businesses: [],
					vehicles: [], luxury: [], insurance: {}, transactions: [], commodities: {}, nfts: []
				};
			}
			const targetBank = targetUser.data.bank;

			bank.balance -= amount;
			targetBank.balance += amount;
			bank.transactions.push({
				type: "transfer_out",
				amount: amount,
				date: Date.now(),
				description: `Transfer to user ${targetUID}`
			});
			targetBank.transactions.push({
				type: "transfer_in",
				amount: amount,
				date: Date.now(),
				description: `Transfer from user ${senderID}`
			});

			await usersData.set(targetUID, targetUser);
			await save();

			return message.reply(fonts.bold(`✅ Successfully transferred ${numbers.money(amount)} to the user.\nYour new balance: ${numbers.money(bank.balance)}`));
		} catch (error) {
			console.error('Transfer error:', error);
			return message.reply(fonts.bold("❌ An error occurred during the transfer. Please try again."));
		}
	},

	loan: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);

		if (!amount || amount <= 0) {
			const maxLoan = Math.floor(bank.creditScore * 1000);
			return message.reply(fonts.bold(`
💳 LOAN INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Credit Score: ${bank.creditScore}
Maximum Loan Amount: ${numbers.money(maxLoan)}
Interest Rate: 5% per week
Current Loan: ${bank.loan > 0 ? numbers.money(bank.loan) : "None"}
${bank.loanDate ? `Loan Date: ${new Date(bank.loanDate).toLocaleDateString()}` : ""}

Usage: bank loan <amount>
Example: bank loan 50000
			`));
		}

		if (bank.loan > 0) {
			return message.reply(fonts.bold(`❌ You already have an active loan of ${numbers.money(bank.loan)}. Please repay it first using 'bank repay <amount>'.`));
		}

		const maxLoan = Math.floor(bank.creditScore * 1000);
		if (amount > maxLoan && !bank.loanVoucher) {
			return message.reply(fonts.bold(`❌ Maximum loan amount based on your credit score (${bank.creditScore}): ${numbers.money(maxLoan)}\nRequested: ${numbers.money(amount)}`));
		}
		if (amount < 1000) {
			return message.reply(fonts.bold("❌ Minimum loan amount is $1,000."));
		}

		const usedVoucher = amount > maxLoan && bank.loanVoucher;
		if (usedVoucher) bank.loanVoucher = false;

		bank.balance += amount;
		bank.loan = amount;
		bank.loanDate = new Date();
		bank.transactions.push({
			type: "loan",
			amount: amount,
			date: Date.now(),
			description: usedVoucher ? "Bank loan approved (voucher used)" : "Bank loan approved"
		});

		await save();
		return message.reply(fonts.bold(`✅ Loan approved!${usedVoucher ? " (Loan Voucher used to bypass credit limit)" : ""} ${numbers.money(amount)} has been added to your bank account.\nInterest rate: 5% per week\nCurrent balance: ${numbers.money(bank.balance)}\nPlease repay responsibly to maintain your credit score.`));
	},

	repayLoan: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);

		if (bank.loan <= 0) {
			return message.reply(fonts.bold("❌ You don't have any active loans."));
		}
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
💳 LOAN REPAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outstanding Loan: ${numbers.money(bank.loan)}
Your Balance: ${numbers.money(bank.balance)}

Usage: bank repay <amount>
Example: bank repay ${Math.min(bank.loan, bank.balance)}
			`));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds in your bank account."));
		}

		const repayAmount = Math.min(amount, bank.loan);
		bank.balance -= repayAmount;
		bank.loan -= repayAmount;
		if (bank.loan <= 0) {
			bank.loanDate = null;
			bank.creditScore += 10;
		}
		bank.transactions.push({
			type: "loan_repayment",
			amount: repayAmount,
			date: Date.now(),
			description: "Loan repayment"
		});

		await save();

		const message_text = bank.loan <= 0 
			? `✅ Loan fully repaid! Your credit score increased by 10 points.` 
			: `✅ Successfully repaid ${numbers.money(repayAmount)}.\nRemaining loan: ${numbers.money(bank.loan)}`;
		return message.reply(fonts.bold(message_text));
	},

	savings: async function (message, args, bank, senderID, fonts, save) {
		if (args[1] === "withdraw" || args[1] === "out") {
			const amount = parseInt(args[2]);
			if (!amount || amount <= 0) {
				return message.reply(fonts.bold("❌ Invalid amount. Use: bank savings withdraw <amount>"));
			}
			if (bank.savings < amount) {
				return message.reply(fonts.bold(`❌ Insufficient savings. You have ${numbers.money(bank.savings)}.`));
			}
			bank.savings -= amount;
			bank.balance += amount;
			bank.transactions.push({
				type: "savings_withdrawal",
				amount: amount,
				date: Date.now(),
				description: "Savings withdrawal"
			});
			await save();
			return message.reply(fonts.bold(`✅ Withdrew ${numbers.money(amount)} from savings.\n💰 New bank balance: ${numbers.money(bank.balance)}\n🏛️ New savings: ${numbers.money(bank.savings)}`));
		}

		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
💰 SAVINGS ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Savings: ${numbers.money(bank.savings)}
Bank Balance: ${numbers.money(bank.balance)}
Interest Rate: 3% monthly

Savings earn interest every month automatically!

Usage: bank savings <amount>  (deposit)
       bank savings withdraw <amount>  (withdraw)
Example: bank savings 10000
			`));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds in your bank account."));
		}
		bank.balance -= amount;
		bank.savings += amount;
		bank.transactions.push({
			type: "savings_deposit",
			amount: amount,
			date: Date.now(),
			description: "Savings deposit"
		});
		await save();
		return message.reply(fonts.bold(`✅ Successfully saved ${numbers.money(amount)}.\nSavings earn 3% interest monthly.\nNew savings balance: ${numbers.money(bank.savings)}`));
	},

	calculateInterest: async function (message, bank, senderID, fonts, save) {
		const now = Date.now();
		const lastInterest = bank.lastInterest ? new Date(bank.lastInterest).getTime() : now;
		const timeDiff = now - lastInterest;
		const hoursPassed = timeDiff / (1000 * 60 * 60);

		const savingsRate = (0.03 + (bank.savingsRateBonus || 0)) / (30 * 24);
		const loanRate = 0.05 / (7 * 24);
		const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
		const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);

		if (hoursPassed < 1) {
			return message.reply(fonts.bold(`
📊 INTEREST PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time since last calculation: ${Math.floor(hoursPassed * 60)} minutes
Minimum time required: 1 hour

${fonts.bold("💰 Potential Savings Interest:")} +${numbers.money(savingsInterest)}
${fonts.bold("💸 Potential Loan Interest:")} +${numbers.money(loanInterest)}

Wait ${60 - Math.floor(hoursPassed * 60)} more minutes to collect interest.
			`));
		}

		bank.savings += savingsInterest;
		bank.loan += loanInterest;
		bank.lastInterest = new Date();

		if (savingsInterest > 0) {
			bank.transactions.push({
				type: "interest_earned",
				amount: savingsInterest,
				date: Date.now(),
				description: `Savings interest (${Math.floor(hoursPassed)}h)`
			});
		}
		if (loanInterest > 0) {
			bank.transactions.push({
				type: "interest_charged",
				amount: loanInterest,
				date: Date.now(),
				description: `Loan interest (${Math.floor(hoursPassed)}h)`
			});
		}

		await save();

		const interestText = `
${fonts.bold("📊 INTEREST CALCULATION")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("⏰ Time Period:")} ${Math.floor(hoursPassed)} hours
${fonts.bold("💰 Savings Interest Earned:")} +${numbers.money(savingsInterest)}
${fonts.bold("💸 Loan Interest Accrued:")} +${numbers.money(loanInterest)}

${fonts.bold("📈 Updated Balances:")}
• Savings: ${numbers.money(bank.savings)}
• Loan: ${numbers.money(bank.loan)}
• Net Change: ${savingsInterest - loanInterest >= 0 ? '+' : ''}${numbers.money((savingsInterest - loanInterest))}
`;
		return message.reply(interestText);
	},

	collectInterest: async function (message, bank, senderID, fonts, save) {
		const now = Date.now();
		const lastInterest = bank.lastInterest ? new Date(bank.lastInterest).getTime() : 0;
		const timeDiff = now - lastInterest;
		const hoursPassed = timeDiff / (1000 * 60 * 60);

		if (bank.lastInterest && hoursPassed < 1) {
			const minutesLeft = 60 - Math.floor(hoursPassed * 60);
			return message.reply(fonts.bold(`⏰ Interest can only be collected once per hour.\nWait ${minutesLeft} more minutes.`));
		}

		const savingsRate = (0.03 + (bank.savingsRateBonus || 0)) / (30 * 24);
		const vaultRate = (0.01 + (bank.vaultRateBonus || 0)) / (30 * 24);
		const loanRate = 0.05 / (7 * 24);

		const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
		const vaultInterest = Math.floor(bank.vault * vaultRate * hoursPassed);
		const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);
		const netInterest = savingsInterest + vaultInterest - loanInterest;

		bank.savings += savingsInterest;
		bank.vault += vaultInterest;
		bank.loan += loanInterest;
		bank.lastInterest = new Date();

		if (savingsInterest > 0) {
			bank.transactions.push({
				type: "interest_earned",
				amount: savingsInterest,
				date: Date.now(),
				description: `Savings interest (${Math.floor(hoursPassed)}h)`
			});
		}
		if (vaultInterest > 0) {
			bank.transactions.push({
				type: "interest_earned",
				amount: vaultInterest,
				date: Date.now(),
				description: `Vault interest (${Math.floor(hoursPassed)}h)`
			});
		}
		if (loanInterest > 0) {
			bank.transactions.push({
				type: "interest_charged",
				amount: loanInterest,
				date: Date.now(),
				description: `Loan interest (${Math.floor(hoursPassed)}h)`
			});
		}

		await save();

		const interestText = `
${fonts.bold("💰 INTEREST COLLECTED")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("⏰ Time Period:")} ${Math.floor(hoursPassed)} hours

${fonts.bold("💰 EARNINGS:")}
• Savings Interest: +${numbers.money(savingsInterest)}
• Vault Interest: +${numbers.money(vaultInterest)}

${fonts.bold("💸 CHARGES:")}
• Loan Interest: -${numbers.money(loanInterest)}

${fonts.bold("📊 NET RESULT:")} ${netInterest >= 0 ? '+' : ''}${numbers.money(netInterest)}

${fonts.bold("📈 Current Balances:")}
• Savings: ${numbers.money(bank.savings)}
• Vault: ${numbers.money(bank.vault)}
• Outstanding Loan: ${numbers.money(bank.loan)}
`;
		return message.reply(interestText);
	},

	showHistory: function (message, bank, fonts) {
		const transactions = bank.transactions.slice(-15);
		if (transactions.length === 0) {
			return message.reply(fonts.bold("📋 No transaction history available."));
		}

		let historyText = `${fonts.bold("📋 TRANSACTION HISTORY (Last 15)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		transactions.reverse().forEach((tx, index) => {
			const date = new Date(tx.date).toLocaleDateString();
			const type = tx.type.replace(/_/g, ' ').toUpperCase();
			const amount = numbers.format(tx.amount);
			const emoji = this.getTransactionEmoji(tx.type);
			historyText += `${emoji} ${type}: $${amount} (${date})\n`;
		});
		return message.reply(historyText);
	},

	getTransactionEmoji: function (type) {
		const emojis = {
			deposit: "💰",
			withdrawal: "💸",
			transfer_in: "📥",
			transfer_out: "📤",
			loan: "🏦",
			loan_repayment: "💳",
			savings_deposit: "🏛️",
			savings_withdrawal: "🏛️⬅️",
			interest_earned: "📈",
			interest_charged: "📉",
			investment: "📊",
			dividend: "💰",
			salary: "💼",
			business_income: "🏢",
			rental_income: "🏠",
			gambling_win: "🎰",
			gambling_loss: "💸"
		};
		return emojis[type] || "💼";
	},

	freezeAccount: async function (message, bank, senderID, fonts, save) {
		bank.frozen = !bank.frozen;
		await save();
		const status = bank.frozen ? "frozen" : "unfrozen";
		const emoji = bank.frozen ? "🔒" : "🔓";
		return message.reply(fonts.bold(`${emoji} Account has been ${status}.${bank.frozen ? " All transactions are now blocked." : " You can now make transactions again."}`));
	},

	dailyReward: async function (message, bank, senderID, fonts, save) {
		const now = Date.now();
		const lastDaily = bank.lastDaily ? new Date(bank.lastDaily).getTime() : 0;
		const oneDayMs = 24 * 60 * 60 * 1000;

		if (now - lastDaily < oneDayMs) {
			const timeLeft = oneDayMs - (now - lastDaily);
			const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
			const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
			return message.reply(fonts.bold(`⏰ Daily reward already claimed!\nNext reward in: ${hoursLeft}h ${minutesLeft}m`));
		}

		if (now - lastDaily < oneDayMs * 2) {
			bank.streak++;
		} else {
			bank.streak = 1;
		}

		const baseReward = 1000;
		const streakBonus = Math.min(bank.streak * 100, 2000);
		const levelBonus = bank.bankLevel * 500;
		const premiumMultiplier = bank.premium ? 2 : 1;
		const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

		bank.balance += totalReward;
		bank.lastDaily = new Date();
		bank.transactions.push({
			type: "daily_reward",
			amount: totalReward,
			date: Date.now(),
			description: `Daily reward (${bank.streak} day streak)`
		});

		await save();

		return message.reply(fonts.bold(`
🎁 DAILY REWARD CLAIMED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Reward: ${numbers.money(totalReward)}
🔥 Streak: ${bank.streak} days
📈 Level: ${bank.bankLevel}
⭐ Premium: ${bank.premium ? "2x Bonus!" : "None"}

Keep your streak alive for bigger rewards!
		`));
	},

	work: async function (message, bank, senderID, fonts, save) {
		const now = Date.now();
		const lastWork = bank.lastWork ? new Date(bank.lastWork).getTime() : 0;
		const workCooldown = 4 * 60 * 60 * 1000;

		if (now - lastWork < workCooldown) {
			const timeLeft = workCooldown - (now - lastWork);
			const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
			const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
			return message.reply(fonts.bold(`⏰ You're too tired to work!\nRest for: ${hoursLeft}h ${minutesLeft}m`));
		}

		const jobs = [
			{ name: "Delivery Driver", min: 500, max: 1500 },
			{ name: "Data Entry", min: 300, max: 800 },
			{ name: "Freelancer", min: 1000, max: 3000 },
			{ name: "Consultant", min: 2000, max: 5000 },
			{ name: "Manager", min: 3000, max: 7000 }
		];
		const job = jobs[Math.floor(Math.random() * jobs.length)];
		const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
		const skillBonus = bank.skills.business * 100;
		const totalEarnings = Math.floor((salary + skillBonus) * bank.multiplier);

		bank.balance += totalEarnings;
		bank.lastWork = new Date();
		bank.skills.business += 1;
		bank.transactions.push({
			type: "salary",
			amount: totalEarnings,
			date: Date.now(),
			description: `Work: ${job.name}`
		});

		await save();

		return message.reply(fonts.bold(`
💼 WORK COMPLETED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job: ${job.name}
Base Salary: ${numbers.money(salary)}
Skill Bonus: ${numbers.money(skillBonus)}
Total Earned: ${numbers.money(totalEarnings)}

Business Skill increased! (${bank.skills.business})
		`));
	},

	invest: function (message, fonts) {
		return message.reply(fonts.bold(`
📊 INVESTMENT MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Investment Options:
• bank stocks - Stock market trading
• bank crypto - Cryptocurrency trading  
• bank bonds - Government & corporate bonds
• bank business - Business investments
• bank property - Real estate investments

Use 'bank <option> list' to see available items!
Example: bank stocks list
		`));
	},

	stocks: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let stockList = `${fonts.bold("📈 STOCK MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.stocks).forEach(([symbol, data]) => {
				const changeEmoji = data.change >= 0 ? "📈" : "📉";
				const changeColor = data.change >= 0 ? "+" : "";
				stockList += `${changeEmoji} ${symbol} - ${numbers.money(data.price)} (${changeColor}${data.change}%)\n`;
				stockList += `   ${data.name}\n\n`;
			});
			stockList += `${fonts.bold("Your Holdings:")}\n`;
			if (Object.keys(bank.stocks).length === 0) {
				stockList += "None owned\n\n";
			} else {
				Object.entries(bank.stocks).forEach(([symbol, shares]) => {
					const currentPrice = this.marketData.stocks[symbol]?.price || 0;
					const value = shares * currentPrice;
					stockList += `• ${symbol}: ${shares} shares (${numbers.money(value)})\n`;
				});
				stockList += "\n";
			}
			stockList += `${fonts.bold("Usage:")}\n`;
			stockList += `• bank stocks buy <symbol> <shares>\n`;
			stockList += `• bank stocks sell <symbol> <shares>`;

			const theme = pickTheme();
			const items = Object.entries(this.marketData.stocks).map(([symbol, data]) => ({
				name: `${symbol} - ${data.name}`,
				price: numbers.money(data.price),
				tag: `${data.change >= 0 ? "+" : ""}${data.change}%`,
				detail: `${bank.stocks[symbol] ? bank.stocks[symbol] + " shares owned" : "Not owned"}`,
				owned: !!bank.stocks[symbol]
			}));
			return renderAndAttach(message, stockList, buildCatalogCanvas("STOCK MARKET", items, theme), "bank_stocks");
		}

		const symbol = args[2]?.toUpperCase();
		const shares = parseInt(args[3]);
		if (!symbol || !this.marketData.stocks[symbol]) {
			return message.reply(fonts.bold("❌ Invalid stock symbol. Use 'bank stocks list' to see available stocks."));
		}
		if (action === "buy") {
			if (!shares || shares <= 0) {
				return message.reply(fonts.bold("❌ Please specify the number of shares to buy."));
			}
			const stockPrice = this.marketData.stocks[symbol].price;
			const totalCost = stockPrice * shares;
			if (bank.balance < totalCost) {
				return message.reply(fonts.bold("❌ Insufficient funds. You need " + numbers.money(totalCost)));
			}
			bank.balance -= totalCost;
			if (!bank.stocks[symbol]) bank.stocks[symbol] = 0;
			bank.stocks[symbol] += shares;
			bank.transactions.push({
				type: "stock_purchase",
				amount: totalCost,
				date: Date.now(),
				description: `Bought ${shares} shares of ${symbol}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Bought ${shares} shares of ${symbol} for ${numbers.money(totalCost)}.`));
		}
		if (action === "sell") {
			if (!shares || shares <= 0) {
				return message.reply(fonts.bold("❌ Please specify the number of shares to sell."));
			}
			if (!bank.stocks[symbol] || bank.stocks[symbol] < shares) {
				return message.reply(fonts.bold("❌ You don't own enough shares."));
			}
			const stockPrice = this.marketData.stocks[symbol].price;
			const totalValue = stockPrice * shares;
			bank.balance += totalValue;
			bank.stocks[symbol] -= shares;
			if (bank.stocks[symbol] === 0) delete bank.stocks[symbol];
			bank.transactions.push({
				type: "stock_sale",
				amount: totalValue,
				date: Date.now(),
				description: `Sold ${shares} shares of ${symbol}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Sold ${shares} shares of ${symbol} for ${numbers.money(totalValue)}.`));
		}
	},

	crypto: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let cryptoList = `${fonts.bold("₿ CRYPTOCURRENCY MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.crypto).forEach(([symbol, data]) => {
				const changeEmoji = data.change >= 0 ? "📈" : "📉";
				const changeColor = data.change >= 0 ? "+" : "";
				cryptoList += `${changeEmoji} ${symbol} - ${numbers.money(data.price)} (${changeColor}${data.change}%)\n`;
				cryptoList += `   ${data.name}\n\n`;
			});
			cryptoList += `${fonts.bold("Your Holdings:")}\n`;
			if (Object.keys(bank.crypto).length === 0) {
				cryptoList += "None owned\n\n";
			} else {
				Object.entries(bank.crypto).forEach(([symbol, amount]) => {
					const currentPrice = this.marketData.crypto[symbol]?.price || 0;
					const value = amount * currentPrice;
					cryptoList += `• ${symbol}: ${amount} coins (${numbers.money(value)})\n`;
				});
				cryptoList += "\n";
			}
			cryptoList += `${fonts.bold("Usage:")}\n`;
			cryptoList += `• bank crypto buy <symbol> <amount>\n`;
			cryptoList += `• bank crypto sell <symbol> <amount>`;

			const theme = pickTheme();
			const items = Object.entries(this.marketData.crypto).map(([symbol, data]) => ({
				name: `${symbol} - ${data.name}`,
				price: numbers.money(data.price),
				tag: `${data.change >= 0 ? "+" : ""}${data.change}%`,
				detail: `${bank.crypto[symbol] ? bank.crypto[symbol] + " coins owned" : "Not owned"}`,
				owned: !!bank.crypto[symbol]
			}));
			return renderAndAttach(message, cryptoList, buildCatalogCanvas("CRYPTOCURRENCY MARKET", items, theme), "bank_crypto");
		}

		const symbol = args[2]?.toUpperCase();
		const amount = parseFloat(args[3]);
		if (!symbol || !this.marketData.crypto[symbol]) {
			return message.reply(fonts.bold("❌ Invalid crypto symbol. Use 'bank crypto list' to see available cryptos."));
		}
		if (action === "buy") {
			if (!amount || amount <= 0) {
				return message.reply(fonts.bold("❌ Please specify the amount to buy."));
			}
			const cryptoPrice = this.marketData.crypto[symbol].price;
			const totalCost = cryptoPrice * amount;
			if (bank.balance < totalCost) {
				return message.reply(fonts.bold("❌ Insufficient funds. You need " + numbers.money(totalCost)));
			}
			bank.balance -= totalCost;
			if (!bank.crypto[symbol]) bank.crypto[symbol] = 0;
			bank.crypto[symbol] += amount;
			bank.transactions.push({
				type: "crypto_purchase",
				amount: totalCost,
				date: Date.now(),
				description: `Bought ${amount} ${symbol}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Bought ${amount} ${symbol} for ${numbers.money(totalCost)}.`));
		}
		if (action === "sell") {
			if (!amount || amount <= 0) {
				return message.reply(fonts.bold("❌ Please specify the amount to sell."));
			}
			if (!bank.crypto[symbol] || bank.crypto[symbol] < amount) {
				return message.reply(fonts.bold("❌ You don't own enough cryptocurrency."));
			}
			const cryptoPrice = this.marketData.crypto[symbol].price;
			const totalValue = cryptoPrice * amount;
			bank.balance += totalValue;
			bank.crypto[symbol] -= amount;
			if (bank.crypto[symbol] === 0) delete bank.crypto[symbol];
			bank.transactions.push({
				type: "crypto_sale",
				amount: totalValue,
				date: Date.now(),
				description: `Sold ${amount} ${symbol}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Sold ${amount} ${symbol} for ${numbers.money(totalValue)}.`));
		}
	},

	bonds: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let bondList = `${fonts.bold("🏛️ BOND MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.bonds).forEach(([type, data]) => {
				bondList += `📊 ${type.replace(/_/g, ' ')}\n`;
				bondList += `   Yield: ${data.yield}% annually\n`;
				bondList += `   Risk: ${data.risk}\n`;
				bondList += `   Term: ${data.term}\n\n`;
			});
			bondList += `${fonts.bold("Your Holdings:")}\n`;
			if (Object.keys(bank.bonds).length === 0) {
				bondList += "None owned\n\n";
			} else {
				Object.entries(bank.bonds).forEach(([type, amount]) => {
					bondList += `• ${type.replace(/_/g, ' ')}: ${numbers.money(amount)}\n`;
				});
				bondList += "\n";
			}
			bondList += `${fonts.bold("Usage:")}\n`;
			bondList += `• bank bonds buy <type> <amount>\n`;
			bondList += `• bank bonds sell <type> <amount>`;

			const theme = pickTheme();
			const items = Object.entries(this.marketData.bonds).map(([type, data]) => ({
				name: type.replace(/_/g, ' '),
				price: `${data.yield}% YIELD`,
				tag: data.risk,
				detail: `${data.term} - MIN ${numbers.money(data.minInvest || 0)}${bank.bonds[type] ? " - HOLDING " + numbers.money(bank.bonds[type]) : ""}`,
				owned: !!bank.bonds[type]
			}));
			return renderAndAttach(message, bondList, buildCatalogCanvas("BOND MARKET", items, theme), "bank_bonds");
		}

		const bondType = args[2]?.toUpperCase();
		const amount = parseInt(args[3]);
		if (!bondType || !this.marketData.bonds[bondType]) {
			return message.reply(fonts.bold("❌ Invalid bond type. Use 'bank bonds list' to see available bonds."));
		}
		if (action === "buy") {
			if (!amount || amount <= 0) {
				return message.reply(fonts.bold("❌ Please specify the amount to invest."));
			}
			const minInvest = this.marketData.bonds[bondType].minInvest || 0;
			if (amount < minInvest) {
				return message.reply(fonts.bold(`❌ Minimum investment for this bond is ${numbers.money(minInvest)}.`));
			}
			if (bank.balance < amount) {
				return message.reply(fonts.bold("❌ Insufficient funds."));
			}
			bank.balance -= amount;
			if (!bank.bonds[bondType]) bank.bonds[bondType] = 0;
			bank.bonds[bondType] += amount;
			bank.transactions.push({
				type: "bond_purchase",
				amount: amount,
				date: Date.now(),
				description: `Bought ${bondType} bonds`
			});
			await save();
			return message.reply(fonts.bold(`✅ Bought ${numbers.money(amount)} in ${bondType.replace(/_/g, ' ')} bonds.`));
		}
	},

	showPortfolio: function (message, bank, fonts) {
		let portfolioText = `${fonts.bold("📊 INVESTMENT PORTFOLIO")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		let totalValue = 0;

		if (Object.keys(bank.stocks).length > 0) {
			portfolioText += `${fonts.bold("📈 STOCKS:")}\n`;
			Object.entries(bank.stocks).forEach(([symbol, shares]) => {
				const currentPrice = this.marketData.stocks[symbol]?.price || 100;
				const value = shares * currentPrice;
				totalValue += value;
				portfolioText += `• ${symbol}: ${shares} shares (${numbers.money(value)})\n`;
			});
			portfolioText += "\n";
		}
		if (Object.keys(bank.crypto).length > 0) {
			portfolioText += `${fonts.bold("₿ CRYPTOCURRENCY:")}\n`;
			Object.entries(bank.crypto).forEach(([coin, amount]) => {
				const currentPrice = this.marketData.crypto[coin]?.price || 1;
				const value = amount * currentPrice;
				totalValue += value;
				portfolioText += `• ${coin}: ${amount} coins (${numbers.money(value)})\n`;
			});
			portfolioText += "\n";
		}
		if (Object.keys(bank.bonds).length > 0) {
			portfolioText += `${fonts.bold("🏛️ BONDS:")}\n`;
			Object.entries(bank.bonds).forEach(([type, amount]) => {
				totalValue += amount;
				portfolioText += `• ${type.replace(/_/g, ' ')}: ${numbers.money(amount)}\n`;
			});
			portfolioText += "\n";
		}
		portfolioText += `${fonts.bold("Total Portfolio Value: " + numbers.money(totalValue))}`;
		if (totalValue === 0) {
			portfolioText = fonts.bold("📊 Your investment portfolio is empty.\nStart investing with 'bank stocks list' or 'bank crypto list'!");
		}
		return message.reply(portfolioText);
	},

	showMarket: function (message, fonts) {
		const marketText = `
${fonts.bold("📊 GLOBAL MARKET OVERVIEW")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📈 TOP STOCKS:")}
• AAPL: $150.25 (+2.1%) - Apple Inc.
• GOOGL: $2,800.50 (+1.8%) - Alphabet Inc.
• TSLA: $800.75 (-0.5%) - Tesla Inc.
• MSFT: $320.40 (+1.2%) - Microsoft Corp.

${fonts.bold("₿ TOP CRYPTOCURRENCY:")}
• BTC: $45,000 (+3.2%) - Bitcoin
• ETH: $3,200 (+2.8%) - Ethereum
• BNB: $400 (+1.5%) - Binance Coin
• ADA: $1.20 (+4.1%) - Cardano

${fonts.bold("🏛️ BOND YIELDS:")}
• US Treasury: 2.5% (10 Year)
• Corporate: 3.8% (5 Year)
• Municipal: 2.1% (7 Year)
• High Yield: 6.2% (3 Year)

${fonts.bold("📊 MARKET SENTIMENT:")} Bullish
${fonts.bold("💹 Trading Volume:")} High
${fonts.bold("🔥 Trending:")} Tech Stocks, DeFi Tokens
`;
		return message.reply(marketText);
	},

	collectDividend: async function (message, bank, senderID, fonts, save) {
		let totalDividends = 0;
		Object.entries(bank.stocks || {}).forEach(([symbol, shares]) => {
			const dividend = shares * 5;
			totalDividends += dividend;
		});
		Object.entries(bank.bonds || {}).forEach(([type, amount]) => {
			const yieldRate = this.marketData.bonds[type]?.yield || 2.5;
			const dividend = amount * (yieldRate / 100) / 12;
			totalDividends += dividend;
		});
		if (totalDividends === 0) {
			return message.reply(fonts.bold("💰 No dividends to collect. Invest in stocks or bonds to earn dividends!"));
		}
		bank.balance += Math.floor(totalDividends);
		bank.transactions.push({
			type: "dividend",
			amount: Math.floor(totalDividends),
			date: Date.now(),
			description: "Investment dividends"
		});
		await save();
		return message.reply(fonts.bold(`💰 Collected ${numbers.money(Math.floor(totalDividends))} in dividends from your investments!`));
	},

	business: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let businessList = `${fonts.bold("🏢 BUSINESS OPPORTUNITIES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.businesses).forEach(([type, data]) => {
				businessList += `🏢 ${data.name}\n`;
				businessList += `   Cost: ${numbers.money(data.cost)}\n`;
				businessList += `   Monthly Income: ${numbers.money(data.income)}\n`;
				businessList += `   Employees: ${data.employees}\n`;
				businessList += `   ROI: ${Math.round((data.income * 12 / data.cost) * 100)}% annually\n\n`;
			});
			businessList += `${fonts.bold("Your Businesses:")}\n`;
			if (bank.businesses.length === 0) {
				businessList += "None owned\n\n";
			} else {
				bank.businesses.forEach((business, index) => {
					businessList += `${index + 1}. ${business.name} (Level ${business.level})\n`;
				});
				businessList += "\n";
			}
			businessList += `${fonts.bold("Usage:")}\n`;
			businessList += `• bank business buy <type>\n`;
			businessList += `• bank business collect`;

			const theme = pickTheme();
			const ownedTypes = new Set(bank.businesses.map(b => b.type));
			const items = Object.entries(this.marketData.businesses).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.cost),
				tag: `${Math.round((data.income * 12 / data.cost) * 100)}% ROI`,
				detail: `${numbers.money(data.income)}/mo - ${data.employees} employees`,
				owned: ownedTypes.has(type)
			}));
			return renderAndAttach(message, businessList, buildCatalogCanvas("BUSINESS OPPORTUNITIES", items, theme, { cardH: 150 }), "bank_business");
		}
		if (action === "buy") {
			const businessType = args[2]?.toUpperCase();
			if (!businessType || !this.marketData.businesses[businessType]) {
				return message.reply(fonts.bold("❌ Invalid business type. Use 'bank business list' to see available businesses."));
			}
			const businessData = this.marketData.businesses[businessType];
			if (bank.balance < businessData.cost) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(businessData.cost)}`));
			}
			bank.balance -= businessData.cost;
			bank.businesses.push({
				type: businessType,
				name: businessData.name,
				level: 1,
				revenue: businessData.income,
				employees: businessData.employees,
				established: Date.now(),
				lastCollected: Date.now()
			});
			bank.transactions.push({
				type: "business_purchase",
				amount: businessData.cost,
				date: Date.now(),
				description: `Bought ${businessData.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Successfully purchased ${businessData.name} for ${numbers.money(businessData.cost)}!\nMonthly income: ${numbers.money(businessData.income)}`));
		}
		if (action === "collect") {
			let totalIncome = 0;
			const now = Date.now();
			bank.businesses.forEach(business => {
				const timeSinceCollected = now - (business.lastCollected || business.established);
				const hoursElapsed = timeSinceCollected / (1000 * 60 * 60);
				const income = Math.floor((business.revenue / 30 / 24) * hoursElapsed * business.level);
				if (income > 0) {
					totalIncome += income;
					business.lastCollected = now;
				}
			});
			if (totalIncome === 0) {
				return message.reply(fonts.bold("💼 No business income to collect yet."));
			}
			bank.balance += totalIncome;
			bank.transactions.push({
				type: "business_income",
				amount: totalIncome,
				date: Date.now(),
				description: "Business income collected"
			});
			await save();
			return message.reply(fonts.bold(`💼 Collected ${numbers.money(totalIncome)} from your businesses!`));
		}
	},

	shopItems: {
		"CREDIT_BOOST": { price: 50000, name: "Credit Score Boost (+50)", description: "Instantly increase your credit score by 50 points" },
		"MULTIPLIER": { price: 1000000, name: "Earnings Multiplier 1.5x", description: "Increase all earnings by 50% for 7 days" },
		"INSURANCE_BUNDLE": { price: 100000, name: "Full Insurance Package", description: "Get all 5 insurance types at a discount" },
		"LOTTERY_PACK": { price: 5000, name: "Lottery Ticket Pack (100x)", description: "Get 100 lottery tickets at once" },
		"SKILL_BOOST": { price: 25000, name: "Skill Training", description: "Increase all skills by 10 levels" },
		"PREMIUM_TRIAL": { price: 100000, name: "Premium Trial (30 days)", description: "Try premium features for 30 days" },
		"VAULT_EXPANSION": { price: 75000, name: "Vault Expansion", description: "Permanently increase vault interest rate by 0.5%" },
		"ROBBERY_SHIELD": { price: 60000, name: "Robbery Shield (72h)", description: "Become immune to robbery attempts for 72 hours" },
		"TAX_SHIELD": { price: 40000, name: "Tax Shield", description: "Skip your next wealth tax payment for free" },
		"INTEREST_BOOST": { price: 90000, name: "Interest Rate Boost", description: "Permanently increase savings interest rate by 1%" },
		"LOAN_VOUCHER": { price: 30000, name: "Loan Approval Voucher", description: "Guarantees approval on your next loan regardless of credit score" },
		"REPUTATION_PACK": { price: 20000, name: "Reputation Pack (+25)", description: "Instantly increase your reputation by 25 points" }
	},

	shop: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		const shopItems = this.shopItems;

		if (!action || action === "list") {
			let shopList = `${fonts.bold("🛒 BANK SHOP")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(shopItems).forEach(([type, data]) => {
				shopList += `🛍️ ${data.name}\n`;
				shopList += `   Price: ${numbers.money(data.price)}\n`;
				shopList += `   ${data.description}\n\n`;
			});
			shopList += `${fonts.bold("Usage:")}\n`;
			shopList += `• bank shop buy <item_type>\n`;
			shopList += `Example: bank shop buy CREDIT_BOOST`;

			const theme = pickTheme();
			const items = Object.entries(shopItems).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.price),
				detail: data.description
			}));
			return renderAndAttach(message, shopList, buildCatalogCanvas("BANK SHOP", items, theme, { cardH: 150 }), "bank_shop");
		}
		if (action === "buy") {
			const itemType = args[2]?.toUpperCase();
			if (!itemType || !shopItems[itemType]) {
				return message.reply(fonts.bold("❌ Invalid item. Use 'bank shop list' to see available items."));
			}
			const item = shopItems[itemType];
			if (bank.balance < item.price) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(item.price)}`));
			}
			bank.balance -= item.price;
			switch (itemType) {
				case "CREDIT_BOOST":
					bank.creditScore = Math.min(850, bank.creditScore + 50);
					break;
				case "MULTIPLIER":
					bank.multiplier = 1.5;
					break;
				case "INSURANCE_BUNDLE":
					bank.insurance = {
						LIFE: { active: true, coverage: 100000, purchased: Date.now() },
						HEALTH: { active: true, coverage: 50000, purchased: Date.now() },
						PROPERTY: { active: true, coverage: 200000, purchased: Date.now() },
						BUSINESS: { active: true, coverage: 500000, purchased: Date.now() },
						THEFT: { active: true, coverage: 75000, purchased: Date.now() }
					};
					break;
				case "LOTTERY_PACK":
					bank.lotteryTickets += 100;
					break;
				case "SKILL_BOOST":
					bank.skills.trading += 10;
					bank.skills.business += 10;
					bank.skills.investing += 10;
					bank.skills.gambling += 10;
					break;
				case "PREMIUM_TRIAL":
					bank.premium = true;
					bank.multiplier = 2.0;
					break;
				case "VAULT_EXPANSION":
					bank.vaultRateBonus = (bank.vaultRateBonus || 0) + 0.005;
					break;
				case "ROBBERY_SHIELD":
					bank.robberyShieldUntil = Date.now() + 72 * 60 * 60 * 1000;
					break;
				case "TAX_SHIELD":
					bank.taxShield = true;
					break;
				case "INTEREST_BOOST":
					bank.savingsRateBonus = (bank.savingsRateBonus || 0) + 0.01;
					break;
				case "LOAN_VOUCHER":
					bank.loanVoucher = true;
					break;
				case "REPUTATION_PACK":
					bank.reputation = (bank.reputation || 0) + 25;
					break;
			}
			bank.transactions.push({
				type: "shop_purchase",
				amount: item.price,
				date: Date.now(),
				description: `Bought ${item.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Successfully purchased ${item.name} for ${numbers.money(item.price)}!`));
		}
	},

	realEstate: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let propertyList = `${fonts.bold("🏠 REAL ESTATE MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.properties).forEach(([type, data]) => {
				propertyList += `🏠 ${data.name}\n`;
				propertyList += `   Price: ${numbers.money(data.price)}\n`;
				propertyList += `   Monthly Rent: ${numbers.money(data.income)}\n`;
				propertyList += `   Annual ROI: ${Math.round((data.income * 12 / data.price) * 100)}%\n\n`;
			});
			propertyList += `${fonts.bold("Your Properties:")}\n`;
			if (bank.realEstate.length === 0) {
				propertyList += "None owned\n\n";
			} else {
				bank.realEstate.forEach((property, index) => {
					propertyList += `${index + 1}. ${property.name} - ${numbers.money(property.value)}\n`;
				});
				propertyList += "\n";
			}
			propertyList += `${fonts.bold("Usage:")}\n`;
			propertyList += `• bank property buy <type>\n`;
			propertyList += `• bank rent collect`;

			const theme = pickTheme();
			const ownedTypes = new Set(bank.realEstate.map(p => p.type));
			const items = Object.entries(this.marketData.properties).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.price),
				tag: `${Math.round((data.income * 12 / data.price) * 100)}% ROI`,
				detail: `${numbers.money(data.income)}/mo rent`,
				owned: ownedTypes.has(type)
			}));
			return renderAndAttach(message, propertyList, buildCatalogCanvas("REAL ESTATE MARKET", items, theme), "bank_property");
		}
		if (action === "buy") {
			const propertyType = args[2]?.toUpperCase();
			if (!propertyType || !this.marketData.properties[propertyType]) {
				return message.reply(fonts.bold("❌ Invalid property type. Use 'bank property list' to see available properties."));
			}
			const propertyData = this.marketData.properties[propertyType];
			if (bank.balance < propertyData.price) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(propertyData.price)}`));
			}
			bank.balance -= propertyData.price;
			bank.realEstate.push({
				type: propertyType,
				name: propertyData.name,
				value: propertyData.price,
				income: propertyData.income,
				purchased: Date.now(),
				lastRentCollected: Date.now()
			});
			bank.transactions.push({
				type: "property_purchase",
				amount: propertyData.price,
				date: Date.now(),
				description: `Bought ${propertyData.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Successfully purchased ${propertyData.name} for ${numbers.money(propertyData.price)}!\nMonthly rent: ${numbers.money(propertyData.income)}`));
		}
	},

	buyHouse: async function (message, args, bank, senderID, fonts, save) {
		return this.realEstate(message, args, bank, senderID, fonts, save);
	},

	rentProperty: async function (message, bank, senderID, fonts, save) {
		if (bank.realEstate.length === 0) {
			return message.reply(fonts.bold("🏠 You don't own any properties to collect rent from."));
		}
		let totalRent = 0;
		const now = Date.now();
		bank.realEstate.forEach(property => {
			const timeSinceCollected = now - (property.lastRentCollected || property.purchased);
			const hoursElapsed = timeSinceCollected / (1000 * 60 * 60);
			const rent = Math.floor((property.income / 30 / 24) * hoursElapsed);
			if (rent > 0) {
				totalRent += rent;
				property.lastRentCollected = now;
			}
		});
		if (totalRent === 0) {
			return message.reply(fonts.bold("🏠 No rent to collect yet."));
		}
		bank.balance += totalRent;
		bank.transactions.push({
			type: "rental_income",
			amount: totalRent,
			date: Date.now(),
			description: "Rental income collected"
		});
		await save();
		return message.reply(fonts.bold(`🏠 Collected ${numbers.money(totalRent)} in rental income!`));
	},

	luxury: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let luxuryList = `${fonts.bold("💎 LUXURY COLLECTION")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.luxury).forEach(([type, data]) => {
				luxuryList += `💎 ${data.name}\n`;
				luxuryList += `   Price: ${numbers.money(data.price)}\n\n`;
			});
			luxuryList += `${fonts.bold("Your Collection:")}\n`;
			if (bank.luxury.length === 0) {
				luxuryList += "None owned\n\n";
			} else {
				bank.luxury.forEach((item, index) => {
					luxuryList += `${index + 1}. ${item.name} - ${numbers.money(item.value)}\n`;
				});
				luxuryList += "\n";
			}
			luxuryList += `${fonts.bold("Usage:")}\n`;
			luxuryList += `• bank luxury buy <type>`;

			const theme = pickTheme();
			const ownedTypes = new Set(bank.luxury.map(l => l.type));
			const items = Object.entries(this.marketData.luxury).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.price),
				owned: ownedTypes.has(type)
			}));
			return renderAndAttach(message, luxuryList, buildCatalogCanvas("LUXURY COLLECTION", items, theme, { cardH: 100 }), "bank_luxury");
		}
		if (action === "buy") {
			const luxuryType = args[2]?.toUpperCase();
			if (!luxuryType || !this.marketData.luxury[luxuryType]) {
				return message.reply(fonts.bold("❌ Invalid luxury item. Use 'bank luxury list' to see available items."));
			}
			const luxuryData = this.marketData.luxury[luxuryType];
			if (bank.balance < luxuryData.price) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(luxuryData.price)}`));
			}
			bank.balance -= luxuryData.price;
			bank.luxury.push({
				type: luxuryType,
				name: luxuryData.name,
				value: luxuryData.price,
				purchased: Date.now()
			});
			bank.transactions.push({
				type: "luxury_purchase",
				amount: luxuryData.price,
				date: Date.now(),
				description: `Bought ${luxuryData.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Successfully purchased ${luxuryData.name} for ${numbers.money(luxuryData.price)}!`));
		}
	},

	commodities: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		if (!bank.commodities) bank.commodities = {};

		if (!action || action === "list") {
			let list = `${fonts.bold("COMMODITIES MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.commodities).forEach(([symbol, data]) => {
				const changeIcon = data.change >= 0 ? "+" : "";
				list += `${data.name} [${symbol}]\n`;
				list += `   Price: ${numbers.money(data.price)} / ${data.unit} (${changeIcon}${data.change}%)\n\n`;
			});
			list += `${fonts.bold("Your Holdings:")}\n`;
			if (Object.keys(bank.commodities).length === 0) {
				list += "None owned\n\n";
			} else {
				Object.entries(bank.commodities).forEach(([symbol, qty]) => {
					const price = this.marketData.commodities[symbol]?.price || 0;
					list += `${symbol}: ${qty} units (${numbers.money(qty * price)})\n`;
				});
				list += "\n";
			}
			list += `${fonts.bold("Usage:")}\n`;
			list += `bank commodities buy <symbol> <quantity>\nbank commodities sell <symbol> <quantity>`;

			const theme = pickTheme();
			const items = Object.entries(this.marketData.commodities).map(([symbol, data]) => ({
				name: `${symbol} - ${data.name}`,
				price: `${numbers.money(data.price)}/${data.unit}`,
				tag: `${data.change >= 0 ? "+" : ""}${data.change}%`,
				detail: bank.commodities[symbol] ? `${bank.commodities[symbol]} units owned` : "Not owned",
				owned: !!bank.commodities[symbol]
			}));
			return renderAndAttach(message, fonts.bold(list), buildCatalogCanvas("COMMODITIES MARKET", items, theme), "bank_commodities");
		}

		const symbol = args[2]?.toUpperCase();
		const qty = parseInt(args[3]);
		if (!symbol || !this.marketData.commodities[symbol]) {
			return message.reply(fonts.bold("❌ Invalid commodity. Use 'bank commodities list' to see available items."));
		}
		const unitPrice = this.marketData.commodities[symbol].price;

		if (action === "buy") {
			if (!qty || qty <= 0) return message.reply(fonts.bold("❌ Please specify a valid quantity."));
			const cost = Math.floor(unitPrice * qty);
			if (bank.balance < cost) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(cost)}`));
			}
			bank.balance -= cost;
			bank.commodities[symbol] = (bank.commodities[symbol] || 0) + qty;
			bank.transactions.push({ type: "commodity_purchase", amount: -cost, date: Date.now(), description: `Bought ${qty} ${symbol}` });
			await save();
			return message.reply(fonts.bold(`Bought ${qty} units of ${this.marketData.commodities[symbol].name} for ${numbers.money(cost)}.`));
		}

		if (action === "sell") {
			const owned = bank.commodities[symbol] || 0;
			if (!qty || qty <= 0 || qty > owned) {
				return message.reply(fonts.bold(`❌ You only own ${owned} units of ${symbol}.`));
			}
			const proceeds = Math.floor(unitPrice * qty);
			bank.commodities[symbol] -= qty;
			if (bank.commodities[symbol] <= 0) delete bank.commodities[symbol];
			bank.balance += proceeds;
			bank.transactions.push({ type: "commodity_sale", amount: proceeds, date: Date.now(), description: `Sold ${qty} ${symbol}` });
			await save();
			return message.reply(fonts.bold(`Sold ${qty} units of ${symbol} for ${numbers.money(proceeds)}.`));
		}

		return message.reply(fonts.bold("❌ Usage: bank commodities [list|buy|sell] <symbol> <quantity>"));
	},

	nftMarket: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		if (!bank.nfts) bank.nfts = [];

		if (!action || action === "list") {
			let list = `${fonts.bold("NFT MARKETPLACE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.nft).forEach(([type, data]) => {
				list += `${data.name} [${type}]\n`;
				list += `   Price: ${numbers.money(data.price)} | Rarity: ${data.rarity}\n\n`;
			});
			list += `${fonts.bold("Your Collection:")}\n`;
			if (bank.nfts.length === 0) {
				list += "None owned\n\n";
			} else {
				bank.nfts.forEach((item, index) => {
					list += `${index + 1}. ${item.name} (${item.rarity}) - ${numbers.money(item.value)}\n`;
				});
				list += "\n";
			}
			list += `${fonts.bold("Usage:")}\n`;
			list += `bank nft buy <type>`;

			const theme = pickTheme();
			const ownedTypes = new Set(bank.nfts.map(n => n.type));
			const items = Object.entries(this.marketData.nft).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.price),
				tag: data.rarity,
				owned: ownedTypes.has(type)
			}));
			return renderAndAttach(message, fonts.bold(list), buildCatalogCanvas("NFT MARKETPLACE", items, theme, { cardH: 100 }), "bank_nft");
		}

		if (action === "buy") {
			const nftType = args[2]?.toUpperCase();
			if (!nftType || !this.marketData.nft[nftType]) {
				return message.reply(fonts.bold("❌ Invalid NFT. Use 'bank nft list' to see available items."));
			}
			const nftData = this.marketData.nft[nftType];
			if (bank.balance < nftData.price) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(nftData.price)}`));
			}
			bank.balance -= nftData.price;
			bank.nfts.push({ type: nftType, name: nftData.name, rarity: nftData.rarity, value: nftData.price, purchased: Date.now() });
			bank.transactions.push({ type: "nft_purchase", amount: -nftData.price, date: Date.now(), description: `Bought ${nftData.name}` });
			await save();
			return message.reply(fonts.bold(`Successfully minted ${nftData.name} for ${numbers.money(nftData.price)}!`));
		}

		return message.reply(fonts.bold("❌ Usage: bank nft [list|buy] <type>"));
	},

	buyCar: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();

		if (!action || action === "list") {
			let carList = `${fonts.bold("🚗 LUXURY VEHICLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(this.marketData.vehicles).forEach(([type, data]) => {
				carList += `🚗 ${data.name}\n`;
				carList += `   Price: ${numbers.money(data.price)}\n`;
				carList += `   Annual Depreciation: ${Math.round((1 - data.depreciation) * 100)}%\n\n`;
			});
			carList += `${fonts.bold("Your Vehicles:")}\n`;
			if (bank.vehicles.length === 0) {
				carList += "None owned\n\n";
			} else {
				bank.vehicles.forEach((vehicle, index) => {
					carList += `${index + 1}. ${vehicle.name} - ${numbers.money(vehicle.currentValue)}\n`;
				});
				carList += "\n";
			}
			carList += `${fonts.bold("Usage:")}\n`;
			carList += `• bank car buy <type>`;

			const theme = pickTheme();
			const ownedTypes = new Set(bank.vehicles.map(v => v.type));
			const items = Object.entries(this.marketData.vehicles).map(([type, data]) => ({
				name: data.name,
				price: numbers.money(data.price),
				tag: `${Math.round((1 - data.depreciation) * 100)}% DEP/YR`,
				owned: ownedTypes.has(type)
			}));
			return renderAndAttach(message, carList, buildCatalogCanvas("LUXURY VEHICLES", items, theme), "bank_car");
		}
		if (action === "buy") {
			const carType = args[2]?.toUpperCase();
			if (!carType || !this.marketData.vehicles[carType]) {
				return message.reply(fonts.bold("❌ Invalid vehicle type. Use 'bank car list' to see available vehicles."));
			}
			const carData = this.marketData.vehicles[carType];
			if (bank.balance < carData.price) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(carData.price)}`));
			}
			bank.balance -= carData.price;
			bank.vehicles.push({
				type: carType,
				name: carData.name,
				purchasePrice: carData.price,
				currentValue: carData.price,
				depreciation: carData.depreciation,
				purchased: Date.now()
			});
			bank.transactions.push({
				type: "vehicle_purchase",
				amount: carData.price,
				date: Date.now(),
				description: `Bought ${carData.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Successfully purchased ${carData.name} for ${numbers.money(carData.price)}!`));
		}
	},

	gamble: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
🎰 GAMBLING GAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Games:
• bank gamble <amount> - Classic risk/reward
• bank slots <amount> - Slot machine
• bank blackjack <amount> - Card game
• bank roulette <amount> <bet> - Roulette wheel

Your Balance: ${numbers.money(bank.balance)}
Gambling Skill: ${bank.skills.gambling}
			`));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds."));
		}
		const random = Math.random();
		const skillBonus = bank.skills.gambling * 0.01;
		const winChance = 0.45 + skillBonus;
		let result, winnings = 0;
		if (random < winChance) {
			const multiplier = Math.random() < 0.1 ? 3 : 2;
			result = "🎉 WIN!";
			winnings = amount * multiplier;
			bank.balance += winnings - amount;
			bank.skills.gambling += 1;
		} else {
			result = "💸 LOSE!";
			bank.balance -= amount;
		}
		bank.transactions.push({
			type: winnings > 0 ? "gambling_win" : "gambling_loss",
			amount: winnings > 0 ? winnings - amount : amount,
			date: Date.now(),
			description: `Gambling: ${result}`
		});
		await save();
		const resultText = winnings > 0 
			? `${result} You won ${numbers.money((winnings - amount))}! (${winnings/amount}x multiplier)` 
			: `${result} You lost ${numbers.money(amount)}!`;
		return message.reply(fonts.bold(`🎰 ${resultText}\nGambling skill increased! (${bank.skills.gambling})`));
	},

	slots: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold("❌ Please enter a valid amount to play slots."));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds."));
		}
		const symbols = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣", "⭐"];
		const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
		let winnings = 0;
		let multiplier = 0;
		if (slot1 === slot2 && slot2 === slot3) {
			if (slot1 === "7️⃣") multiplier = 50;
			else if (slot1 === "💎") multiplier = 25;
			else if (slot1 === "⭐") multiplier = 15;
			else multiplier = 10;
		} else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
			multiplier = 2;
		}
		if (multiplier > 0) {
			winnings = amount * multiplier;
			bank.balance += winnings - amount;
		} else {
			bank.balance -= amount;
		}
		bank.transactions.push({
			type: winnings > 0 ? "gambling_win" : "gambling_loss",
			amount: winnings > 0 ? winnings - amount : amount,
			date: Date.now(),
			description: `Slots: ${slot1}${slot2}${slot3}`
		});
		await save();
		const slotText = `
🎰 SLOT MACHINE 🎰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────┐
│ ${slot1} │ ${slot2} │ ${slot3} │
└─────────────┘

${winnings > 0 ? `🎉 JACKPOT! You won ${numbers.money((winnings - amount))}! (${multiplier}x)` : `💸 No match! You lost ${numbers.money(amount)}!`}

Balance: ${numbers.money(bank.balance)}
`;
		return message.reply(slotText);
	},

	blackjack: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold("❌ Please enter a valid amount to play blackjack."));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds."));
		}
		const getCard = () => Math.min(Math.floor(Math.random() * 13) + 1, 10);
		const playerCard1 = getCard();
		const playerCard2 = getCard();
		const dealerCard1 = getCard();
		const dealerCard2 = getCard();
		const playerTotal = playerCard1 + playerCard2;
		const dealerTotal = dealerCard1 + dealerCard2;
		let result, winnings = 0;
		if (playerTotal === 21) {
			result = "🎉 BLACKJACK!";
			winnings = amount * 2.5;
		} else if (playerTotal > 21) {
			result = "💸 BUST!";
		} else if (dealerTotal > 21) {
			result = "🎉 DEALER BUST!";
			winnings = amount * 2;
		} else if (playerTotal > dealerTotal) {
			result = "🎉 WIN!";
			winnings = amount * 2;
		} else if (playerTotal === dealerTotal) {
			result = "🤝 PUSH!";
			winnings = amount;
		} else {
			result = "💸 LOSE!";
		}
		if (winnings > 0) {
			bank.balance += winnings - amount;
		} else {
			bank.balance -= amount;
		}
		bank.transactions.push({
			type: winnings > amount ? "gambling_win" : winnings === amount ? "gambling_push" : "gambling_loss",
			amount: Math.abs(winnings - amount),
			date: Date.now(),
			description: `Blackjack: ${result}`
		});
		await save();
		const blackjackText = `
🃏 BLACKJACK 🃏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Cards: ${playerCard1} + ${playerCard2} = ${playerTotal}
Dealer Cards: ${dealerCard1} + ${dealerCard2} = ${dealerTotal}

${result}
${winnings > amount ? `You won ${numbers.money((winnings - amount))}!` : 
	winnings === amount ? `It's a tie!` : 
	`You lost ${numbers.money(amount)}!`}

Balance: ${numbers.money(bank.balance)}
`;
		return message.reply(blackjackText);
	},

	roulette: async function (message, args, bank, senderID, fonts, save) {
		const amount = parseInt(args[1]);
		const bet = args[2]?.toLowerCase();
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold(`
🎯 ROULETTE WHEEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Betting Options:
• red/black - 2x payout
• odd/even - 2x payout
• high (19-36)/low (1-18) - 2x payout
• number (0-36) - 36x payout

Usage: bank roulette <amount> <bet>
Example: bank roulette 1000 red
			`));
		}
		if (!bet) {
			return message.reply(fonts.bold("❌ Please specify your bet (red/black/odd/even/high/low/number)."));
		}
		if (bank.balance < amount) {
			return message.reply(fonts.bold("❌ Insufficient funds."));
		}
		const winningNumber = Math.floor(Math.random() * 37);
		const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
		const isBlack = winningNumber !== 0 && !isRed;
		const isOdd = winningNumber > 0 && winningNumber % 2 === 1;
		const isEven = winningNumber > 0 && winningNumber % 2 === 0;
		const isHigh = winningNumber >= 19 && winningNumber <= 36;
		const isLow = winningNumber >= 1 && winningNumber <= 18;
		let won = false, multiplier = 0;
		if (bet === "red" && isRed) { won = true; multiplier = 2; }
		else if (bet === "black" && isBlack) { won = true; multiplier = 2; }
		else if (bet === "odd" && isOdd) { won = true; multiplier = 2; }
		else if (bet === "even" && isEven) { won = true; multiplier = 2; }
		else if (bet === "high" && isHigh) { won = true; multiplier = 2; }
		else if (bet === "low" && isLow) { won = true; multiplier = 2; }
		else if (bet === winningNumber.toString()) { won = true; multiplier = 36; }
		let winnings = 0;
		if (won) {
			winnings = amount * multiplier;
			bank.balance += winnings - amount;
		} else {
			bank.balance -= amount;
		}
		bank.transactions.push({
			type: won ? "gambling_win" : "gambling_loss",
			amount: won ? winnings - amount : amount,
			date: Date.now(),
			description: `Roulette: ${winningNumber} (${bet})`
		});
		await save();
		const color = winningNumber === 0 ? "🟢" : isRed ? "🔴" : "⚫";
		const result = won ? `🎉 WIN! You won ${numbers.money((winnings - amount))}! (${multiplier}x)` : `💸 You lost ${numbers.money(amount)}!`;
		const rouletteText = `
🎯 ROULETTE RESULT 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Winning Number: ${color} ${winningNumber}
Your Bet: ${bet}

${result}

Balance: ${numbers.money(bank.balance)}
`;
		return message.reply(rouletteText);
	},

	lottery: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		if (!action || action === "buy") {
			const ticketPrice = 100;
			const tickets = parseInt(args[2]) || 1;
			const totalCost = ticketPrice * tickets;
			if (bank.balance < totalCost) {
				return message.reply(fonts.bold(`❌ Insufficient funds. Need ${numbers.money(totalCost)}`));
			}
			bank.balance -= totalCost;
			bank.lotteryTickets += tickets;
			await save();
			return message.reply(fonts.bold(`🎫 Bought ${tickets} lottery ticket(s) for ${numbers.money(totalCost)}!\nTotal tickets: ${bank.lotteryTickets}`));
		}
		if (action === "check") {
			if (!bank.lotteryTickets || bank.lotteryTickets === 0) {
				return message.reply(fonts.bold("🎫 You don't have any lottery tickets."));
			}
			const winChance = 0.01;
			const totalChance = Math.min(bank.lotteryTickets * winChance, 0.5);
			if (Math.random() < totalChance) {
				const prize = Math.floor(Math.random() * 1000000) + 50000;
				bank.balance += prize;
				bank.lotteryTickets = 0;
				bank.transactions.push({
					type: "lottery_win",
					amount: prize,
					date: Date.now(),
					description: "Lottery jackpot!"
				});
				await save();
				return message.reply(fonts.bold(`🎊 LOTTERY WINNER! You won ${numbers.money(prize)}!`));
			} else {
				return message.reply(fonts.bold(`🎫 No winning tickets this time. Keep trying!\nTickets remaining: ${bank.lotteryTickets}`));
			}
		}
	},

	premium: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		if (action === "buy") {
			const premiumCost = 1000000;
			if (bank.balance < premiumCost) {
				return message.reply(fonts.bold("❌ Premium membership costs $1,000,000."));
			}
			bank.balance -= premiumCost;
			bank.premium = true;
			bank.multiplier = 2.0;
			await save();
			return message.reply(fonts.bold(`
💎 WELCOME TO PREMIUM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Premium Benefits:
✅ 2x earnings on all activities
✅ Exclusive investment opportunities
✅ Higher daily rewards
✅ Priority customer support
✅ Advanced portfolio tools

You now earn 2x on all activities!
			`));
		}
		const premiumText = `
💎 PREMIUM MEMBERSHIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ${bank.premium ? "✅ Active" : "❌ Inactive"}
Multiplier: ${bank.multiplier}x
Cost: $1,000,000

Benefits:
• 2x earnings on all activities
• Exclusive investment opportunities
• Higher daily rewards
• Priority customer support
• Advanced portfolio tools

${!bank.premium ? "Use 'bank premium buy' to upgrade!" : ""}
`;
		return message.reply(premiumText);
	},

	vault: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		const amount = parseInt(args[2]);
		if (!action) {
			return message.reply(fonts.bold(`
🔐 SECURE VAULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vault Balance: ${numbers.money(bank.vault)}
Bank Balance: ${numbers.money(bank.balance)}

The vault provides:
• Maximum security for your money
• Protection from theft/robbery
• 1% monthly interest
• No withdrawal limits

Usage:
• bank vault deposit <amount>
• bank vault withdraw <amount>
			`));
		}
		if (!amount || amount <= 0) {
			return message.reply(fonts.bold("❌ Please enter a valid amount."));
		}
		if (action === "deposit") {
			if (bank.balance < amount) {
				return message.reply(fonts.bold("❌ Insufficient funds in bank account."));
			}
			bank.balance -= amount;
			bank.vault += amount;
			bank.transactions.push({
				type: "vault_deposit",
				amount: amount,
				date: Date.now(),
				description: "Vault deposit"
			});
			await save();
			return message.reply(fonts.bold(`🔐 Deposited ${numbers.money(amount)} to your secure vault.\nVault balance: ${numbers.money(bank.vault)}`));
		}
		if (action === "withdraw") {
			if (bank.vault < amount) {
				return message.reply(fonts.bold("❌ Insufficient funds in vault."));
			}
			bank.vault -= amount;
			bank.balance += amount;
			bank.transactions.push({
				type: "vault_withdrawal",
				amount: amount,
				date: Date.now(),
				description: "Vault withdrawal"
			});
			await save();
			return message.reply(fonts.bold(`🔓 Withdrew ${numbers.money(amount)} from your secure vault.\nBank balance: ${numbers.money(bank.balance)}`));
		}
	},

	insurance: async function (message, args, bank, senderID, fonts, save) {
		const action = args[1]?.toLowerCase();
		const insuranceTypes = {
			"LIFE": { cost: 10000, coverage: 100000, name: "Life Insurance" },
			"HEALTH": { cost: 5000, coverage: 50000, name: "Health Insurance" },
			"PROPERTY": { cost: 15000, coverage: 200000, name: "Property Insurance" },
			"BUSINESS": { cost: 25000, coverage: 500000, name: "Business Insurance" },
			"THEFT": { cost: 8000, coverage: 75000, name: "Theft Protection" }
		};
		if (!action || action === "list") {
			let insuranceList = `${fonts.bold("🛡️ INSURANCE POLICIES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
			Object.entries(insuranceTypes).forEach(([type, data]) => {
				insuranceList += `🛡️ ${data.name}\n`;
				insuranceList += `   Cost: ${numbers.money(data.cost)}\n`;
				insuranceList += `   Coverage: ${numbers.money(data.coverage)}\n`;
				insuranceList += `   Owned: ${bank.insurance[type] ? "✅" : "❌"}\n\n`;
			});
			insuranceList += `${fonts.bold("Usage:")}\n`;
			insuranceList += `• bank insurance buy <type>\n`;
			insuranceList += `• bank insurance claim <type>`;
			return message.reply(insuranceList);
		}
		if (action === "buy") {
			const type = args[2]?.toUpperCase();
			if (!type || !insuranceTypes[type]) {
				return message.reply(fonts.bold("❌ Invalid insurance type. Use 'bank insurance list' to see options."));
			}
			if (bank.insurance[type]) {
				return message.reply(fonts.bold("❌ You already have this insurance policy."));
			}
			const insuranceData = insuranceTypes[type];
			if (bank.balance < insuranceData.cost) {
				return message.reply(fonts.bold(`❌ Insufficient funds. You need ${numbers.money(insuranceData.cost)}`));
			}
			bank.balance -= insuranceData.cost;
			bank.insurance[type] = {
				active: true,
				coverage: insuranceData.coverage,
				purchased: Date.now()
			};
			bank.transactions.push({
				type: "insurance_purchase",
				amount: insuranceData.cost,
				date: Date.now(),
				description: `Bought ${insuranceData.name}`
			});
			await save();
			return message.reply(fonts.bold(`✅ Purchased ${insuranceData.name} with ${numbers.money(insuranceData.coverage)} coverage for ${numbers.money(insuranceData.cost)}.`));
		}
	},

	creditScore: function (message, bank, fonts) {
		const score = bank.creditScore;
		let rating, color;
		if (score >= 800) { rating = "Excellent"; color = "🟢"; }
		else if (score >= 740) { rating = "Very Good"; color = "🟢"; }
		else if (score >= 670) { rating = "Good"; color = "🟡"; }
		else if (score >= 580) { rating = "Fair"; color = "🟠"; }
		else { rating = "Poor"; color = "🔴"; }
		const creditText = `
${fonts.bold("📊 CREDIT SCORE REPORT")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${color} ${fonts.bold("Score:")} ${score}/850
📊 ${fonts.bold("Rating:")} ${rating}
💳 ${fonts.bold("Max Loan:")} ${numbers.money((score * 1000))}
🏦 ${fonts.bold("Interest Rate:")} ${score >= 750 ? "5%" : score >= 650 ? "7%" : "10%"}

${fonts.bold("💡 Tips to improve:")}
• Pay loans on time (+10 points)
• Maintain low debt ratios
• Avoid frequent large transactions
• Build long banking history
• Keep accounts active

${fonts.bold("Score History:")}
• Starting Score: 750
• Current Score: ${score}
• Change: ${score >= 750 ? "+" : ""}${score - 750}
`;
		return message.reply(creditText);
	},

	achievements: function (message, bank, fonts) {
		const achievements = bank.achievements || [];
		const possibleAchievements = [
			"First Deposit", "First Loan", "First Investment", "First Business",
			"Millionaire", "Multi-Millionaire", "Billionaire", "Property Owner",
			"Stock Trader", "Crypto Investor", "Business Tycoon", "Gambling King",
			"Insurance Buyer", "Premium Member", "Daily Streaker", "Work Horse",
			"Loan Repayer", "Savings Master", "Portfolio Builder", "Risk Taker"
		];
		let achievementText = `${fonts.bold("🏆 ACHIEVEMENTS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
		achievementText += `${fonts.bold("Progress:")} ${achievements.length}/${possibleAchievements.length}\n\n`;
		if (achievements.length === 0) {
			achievementText += "🎯 No achievements unlocked yet.\nStart banking to earn achievements!\n\n";
		} else {
			achievementText += `${fonts.bold("🎖️ UNLOCKED:")}\n`;
			achievements.slice(0, 10).forEach((achievement, index) => {
				achievementText += `${index + 1}. 🏆 ${achievement}\n`;
			});
			if (achievements.length > 10) {
				achievementText += `... and ${achievements.length - 10} more!\n`;
			}
			achievementText += "\n";
		}
		achievementText += `${fonts.bold("🎯 NEXT GOALS:")}\n`;
		const remaining = possibleAchievements.filter(a => !achievements.includes(a));
		remaining.slice(0, 5).forEach(achievement => {
			achievementText += `• ${achievement}\n`;
		});
		return message.reply(achievementText);
	},

	leaderboard: async function (message, usersData, fonts, api, senderID) {
		try {
			const allUsers = await usersData.getAll();
			const richestUsers = [];
			for (const [uid, user] of Object.entries(allUsers)) {
				const bank = user.data?.bank;
				if (bank && (bank.balance > 0 || bank.savings > 0 || bank.vault > 0)) {
					const wealth = (bank.balance || 0) + (bank.savings || 0) + (bank.vault || 0);
					richestUsers.push({
						uid,
						wealth,
						level: bank.bankLevel || 1,
						premium: bank.premium || false,
						achievements: bank.achievements?.length || 0,
						name: user.name || `User ${uid}`
					});
				}
			}
			richestUsers.sort((a, b) => b.wealth - a.wealth);
			const top10 = richestUsers.slice(0, 10);
			let leaderboardText = `${fonts.bold("🏆 LEADERBOARD")}\n`;
			leaderboardText += `━━━━━━━━━━━\n`;
			leaderboardText += `💎 ${fonts.bold("TOP USERS")} 💎\n\n`;
			if (top10.length === 0) {
				leaderboardText += `${fonts.bold("📊 No wealthy users found yet!")}\n`;
				leaderboardText += `${fonts.bold("💡 Start banking to appear on the leaderboard!")}`;
			} else {
				top10.forEach((user, index) => {
					const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${fonts.bold(`#${index + 1}`)}`;
					const crown = index === 0 ? " 👑" : index === 1 ? " ⭐" : index === 2 ? " ✨" : "";
					const premiumIcon = user.premium ? " 💎" : "";
					const levelIcon = user.level >= 10 ? " 🔥" : user.level >= 5 ? " ⚡" : "";
					leaderboardText += `${medal} ${fonts.bold(user.name)}${crown}${premiumIcon}${levelIcon}\n`;
					leaderboardText += `   💰 Wealth: ${numbers.money(user.wealth)}\n`;
					leaderboardText += `   📈 Level: ${user.level}`;
					if (user.achievements > 0) {
						leaderboardText += ` | 🏆 ${user.achievements} achievements`;
					}
					if (user.wealth >= 1000000000) {
						leaderboardText += ` | 💎 Billionaire`;
					} else if (user.wealth >= 1000000) {
						leaderboardText += ` | 🏆 Millionaire`;
					} else if (user.wealth >= 100000) {
						leaderboardText += ` | ⭐ Wealthy`;
					}
					leaderboardText += `\n\n`;
				});
				leaderboardText += `${fonts.bold("🔥 LEADERBOARD TIERS")}\n`;
				leaderboardText += `💎 Billionaire: $1B+\n`;
				leaderboardText += `🏆 Millionaire: $1M+\n`;
				leaderboardText += `⭐ Wealthy: $100K+\n`;
				leaderboardText += `📈 Rising: $10K+\n\n`;
			}

			if (!canvasAvailable || top10.length === 0) {
				return message.reply(leaderboardText);
			}

			const theme = pickTheme();
			const rows = await Promise.all(top10.map(async (u) => ({
				name: u.name,
				subtitle: `LEVEL ${u.level}${u.premium ? " - PREMIUM" : ""}`,
				value: numbers.money(u.wealth),
				avatar: await fetchAvatar(u.uid)
			})));
			await renderAndAttach(
				message, leaderboardText,
				buildRankingCanvas("WEALTH LEADERBOARD", rows, theme),
				"bank_leaderboard"
			);
		} catch (error) {
			console.error("Leaderboard error:", error);
			return message.reply(fonts.bold("❌ Error loading leaderboard. Please try again."));
		}
	},

	rob: async function (message, args, bank, usersData, senderID, event, fonts, save) {
		const targetUID = Object.keys(event.mentions)[0];
		if (!targetUID) {
			return message.reply(fonts.bold("❌ Please mention a user to rob."));
		}
		if (targetUID === senderID) {
			return message.reply(fonts.bold("❌ You can't rob yourself!"));
		}
		const now = Date.now();
		const robCooldown = 6 * 60 * 60 * 1000;
		const lastRob = bank.lastRob ? new Date(bank.lastRob).getTime() : 0;
		if (now - lastRob < robCooldown) {
			const timeLeft = robCooldown - (now - lastRob);
			const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
			return message.reply(fonts.bold(`⏰ You're too tired to rob someone!\nWait ${hoursLeft} more hours.`));
		}
		const targetUser = await usersData.get(targetUID);
		if (!targetUser) {
			return message.reply(fonts.bold("❌ This user doesn't have a bank account."));
		}
		const targetBank = targetUser.data?.bank;
		if (!targetBank) {
			return message.reply(fonts.bold("❌ This user doesn't have a bank account."));
		}
		const robbableAmount = targetBank.balance || 0;
		const hasTheftInsurance = targetBank.insurance && targetBank.insurance.THEFT;
		if (robbableAmount <= 100) {
			return message.reply(fonts.bold("❌ This user doesn't have enough money to rob."));
		}
		if (hasTheftInsurance) {
			return message.reply(fonts.bold("🛡️ This user has theft protection insurance!"));
		}
		if (targetBank.robberyShieldUntil && Date.now() < targetBank.robberyShieldUntil) {
			return message.reply(fonts.bold("🛡️ This user has an active robbery shield!"));
		}
		const robberLevel = bank.bankLevel || 1;
		const targetLevel = targetBank.bankLevel || 1;
		const successChance = Math.max(0.3, 0.6 - (targetLevel - robberLevel) * 0.1);
		const success = Math.random() < successChance;
		if (success) {
			const stolenPercent = Math.random() * 0.3 + 0.1;
			const stolenAmount = Math.floor(robbableAmount * stolenPercent);
			bank.balance += stolenAmount;
			targetBank.balance -= stolenAmount;
			bank.lastRob = new Date();
			bank.transactions.push({
				type: "robbery_success",
				amount: stolenAmount,
				date: Date.now(),
				description: `Robbed user ${targetUID}`
			});
			targetBank.transactions.push({
				type: "robbed",
				amount: stolenAmount,
				date: Date.now(),
				description: `Robbed by user ${senderID}`
			});
			await usersData.set(targetUID, targetUser);
			await save();
			return message.reply(fonts.bold(`💰 Robbery successful! You stole ${numbers.money(stolenAmount)} from the user!`));
		} else {
			const fine = Math.min(bank.balance * 0.1, 10000);
			bank.balance -= fine;
			bank.lastRob = new Date();
			bank.transactions.push({
				type: "robbery_failed",
				amount: fine,
				date: Date.now(),
				description: "Failed robbery fine"
			});
			await save();
			return message.reply(fonts.bold(`🚔 Robbery failed! You were caught and fined ${numbers.money(fine)}!`));
		}
	},

	netWorth: async function (message, args, bank, walletBalance, fonts, senderID, event, usersData, api) {
		const portfolioValue = this.calculatePortfolioValue(bank);
		const realEstateValue = this.calculateRealEstateValue(bank);
		const businessValue = this.calculateBusinessValue(bank);
		const vehicleValue = this.calculateVehicleValue(bank);
		const luxuryValue = this.calculateLuxuryValue(bank);

		const liquid = walletBalance + (bank.balance || 0) + (bank.savings || 0) + (bank.vault || 0);
		const assets = portfolioValue + realEstateValue + businessValue + vehicleValue + luxuryValue;
		const debts = bank.loan || 0;
		const total = liquid + assets - debts;

		const text = `
NET WORTH BREAKDOWN
━━━━━━━━━━━━━━━
Wallet: ${numbers.money(walletBalance)}
Bank: ${numbers.money((bank.balance || 0))}
Savings: ${numbers.money((bank.savings || 0))}
Vault: ${numbers.money((bank.vault || 0))}
├─ Liquid Total: ${numbers.money(liquid)}

Investments: ${numbers.money(portfolioValue)}
Real Estate: ${numbers.money(realEstateValue)}
Businesses: ${numbers.money(businessValue)}
Vehicles: ${numbers.money(vehicleValue)}
Luxury: ${numbers.money(luxuryValue)}
├─ Asset Total: ${numbers.money(assets)}

Active Loan: -${numbers.money(debts)}
━━━━━━━━━━━━━━━
NET WORTH: ${numbers.money(total)}`;

		if (!canvasAvailable || !senderID) {
			return message.reply(fonts.bold(text));
		}

		try {
			const themeKeys = Object.keys(VAULT_THEMES);
			const themeKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
			const theme = VAULT_THEMES[themeKey];
			const avatar = await fetchAvatar(senderID);
			const name = (await usersData.getName(senderID).catch(() => null)) || "Account Holder";

			const cacheDir = path.join(__dirname, "cache");
			if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
			const outPath = path.join(cacheDir, `bank_networth_${Date.now()}.png`);

			const canvas = await this.buildNetWorthCanvas({
				name, liquid, assets, debts, total,
				wallet: walletBalance, bankBalance: bank.balance || 0, savings: bank.savings || 0, vault: bank.vault || 0,
				portfolioValue, realEstateValue, businessValue, vehicleValue, luxuryValue
			}, theme, avatar);
			fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

			await message.reply({ body: fonts.bold(text), attachment: fs.createReadStream(outPath) });
			setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
		} catch (e) {
			console.error("Net worth canvas error:", e);
			return message.reply(fonts.bold(text));
		}
	},

	buildNetWorthCanvas: async function (data, t, avatar) {
		ensureFonts();
		const W = 1500, H = 900;
		const canvas = createCanvas(W, H);
		const ctx = canvas.getContext("2d");

		drawIndexBg(ctx, W, H, t);

		T(ctx, "NET WORTH INDEX", 60, 70, 22, t.primary, { letterSpacing: 6 });
		T(ctx, data.name.toUpperCase(), 60, 112, 38, t.text, { letterSpacing: 1 });
		GL(ctx, 60, 145, W - 60, 145, t.primary);

		drawSquareAvatar(ctx, avatar, W - 196, 50, 136, t);

		const centerY = 280;
		T(ctx, "TOTAL NET WORTH", W / 2, centerY - 40, 20, t.secondary, { align: "center", letterSpacing: 4 });
		T(ctx, numbers.apply("monospace", numbers.money(data.total)), W / 2, centerY + 30, 64, t.text, { align: "center", weight: "bold", glow: t.primary });

		const barY = centerY + 100;
		const barW = W - 120;
		const liquidPct = Math.max(0, Math.min(1, data.liquid / (data.liquid + data.assets || 1)));
		ctx.save();
		rr(ctx, 60, barY, barW, 18, 9);
		ctx.fillStyle = t.secondary; ctx.fill();
		ctx.restore();
		ctx.save();
		rr(ctx, 60, barY, barW * liquidPct, 18, 9);
		ctx.fillStyle = t.primary; ctx.fill();
		ctx.restore();
		T(ctx, "LIQUID", 60, barY + 40, 14, t.primary, { letterSpacing: 2 });
		T(ctx, "ASSETS", W - 60, barY + 40, 14, t.secondary, { align: "right", letterSpacing: 2 });

		const colY = barY + 90;
		const colX = 60, colW = (W - 120 - 40) / 2;
		T(ctx, "LIQUID HOLDINGS", colX, colY, 17, t.primary, { letterSpacing: 3 });
		const liquidRows = [
			["WALLET", numbers.money(data.wallet)],
			["BANK", numbers.money(data.bankBalance)],
			["SAVINGS", numbers.money(data.savings)],
			["VAULT", numbers.money(data.vault)],
		];
		liquidRows.forEach((row, i) => {
			const y = colY + 46 + i * 50;
			T(ctx, row[0], colX + 4, y, 16, t.secondary, { letterSpacing: 1 });
			T(ctx, numbers.apply("monospace", row[1]), colX + colW - 4, y, 20, t.text, { align: "right" });
		});

		const col2X = colX + colW + 40;
		T(ctx, "ASSET HOLDINGS", col2X, colY, 17, t.primary, { letterSpacing: 3 });
		const assetRows = [
			["INVESTMENTS", numbers.money(data.portfolioValue)],
			["REAL ESTATE", numbers.money(data.realEstateValue)],
			["BUSINESSES", numbers.money(data.businessValue)],
			["VEHICLES", numbers.money(data.vehicleValue)],
		];
		assetRows.forEach((row, i) => {
			const y = colY + 46 + i * 50;
			T(ctx, row[0], col2X + 4, y, 16, t.secondary, { letterSpacing: 1 });
			T(ctx, numbers.apply("monospace", row[1]), col2X + colW - 4, y, 20, t.text, { align: "right" });
		});

		const debtY = colY + 46 + 4 * 50 + 30;
		GL(ctx, 60, debtY - 16, W - 60, debtY - 16, t.primary);
		T(ctx, "ACTIVE LOAN", 60, debtY + 20, 16, t.secondary, { letterSpacing: 2 });
		T(ctx, numbers.apply("monospace", data.debts > 0 ? "-" + numbers.money(data.debts) : "NONE"), W - 60, debtY + 20, 22, t.text, { align: "right" });

		T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, H - 36, 14, t.secondary, { align: "center", letterSpacing: 3 });

		return canvas;
	},

	statement: async function (message, args, bank, walletBalance, fonts, senderID, event, usersData, api) {
		const transactions = (bank.transactions || []).slice(-10);
		const totalIn = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
		const totalOut = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);

		let text = `
ACCOUNT STATEMENT
━━━━━━━━━━━━━━━
Account Level: ${bank.bankLevel || 1}
Credit Score: ${bank.creditScore || 750}/850
Current Balance: ${numbers.money((bank.balance || 0))}
Wallet Balance: ${numbers.money(walletBalance)}

Last 10 Transactions
─────────────────────`;
		if (transactions.length === 0) {
			text += "\nNo transactions recorded yet.";
		} else {
			transactions.forEach(t => {
				const sign = t.amount >= 0 ? "+" : "";
				const date = new Date(t.date).toLocaleDateString();
				text += `\n${sign}${numbers.money(t.amount)} — ${t.description || t.type} (${date})`;
			});
		}
		text += `\n─────────────────────
Total In: ${numbers.money(totalIn)}
Total Out: ${numbers.money(totalOut)}`;

		if (!canvasAvailable || !senderID) {
			return message.reply(fonts.bold(text));
		}

		try {
			const themeKeys = Object.keys(VAULT_THEMES);
			const themeKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
			const theme = VAULT_THEMES[themeKey];
			const avatar = await fetchAvatar(senderID);
			const name = (await usersData.getName(senderID).catch(() => null)) || "Account Holder";

			const cacheDir = path.join(__dirname, "cache");
			if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
			const outPath = path.join(cacheDir, `bank_statement_${Date.now()}.png`);

			const canvas = await this.buildStatementCanvas({
				name, transactions, totalIn, totalOut,
				balance: bank.balance || 0, wallet: walletBalance,
				level: bank.bankLevel || 1, creditScore: bank.creditScore || 750
			}, theme, avatar);
			fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

			await message.reply({ body: fonts.bold(text), attachment: fs.createReadStream(outPath) });
			setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
		} catch (e) {
			console.error("Statement canvas error:", e);
			return message.reply(fonts.bold(text));
		}
	},

	buildStatementCanvas: async function (data, t, avatar) {
		ensureFonts();
		const W = 1500, H = 980;
		const canvas = createCanvas(W, H);
		const ctx = canvas.getContext("2d");

		drawIndexBg(ctx, W, H, t);

		T(ctx, "ACCOUNT STATEMENT", 60, 70, 22, t.primary, { letterSpacing: 6 });
		T(ctx, data.name.toUpperCase(), 60, 112, 38, t.text, { letterSpacing: 1 });
		GL(ctx, 60, 145, W - 60, 145, t.primary);

		drawSquareAvatar(ctx, avatar, W - 196, 50, 136, t);

		const summaryY = 200;
		const summaryCols = [
			["BALANCE", numbers.money(data.balance)],
			["WALLET", numbers.money(data.wallet)],
			["LEVEL", String(data.level)],
			["CREDIT", `${data.creditScore}/850`],
		];
		const colWidth = (W - 120) / 4;
		summaryCols.forEach((c, i) => {
			const x = 60 + i * colWidth;
			ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = t.primary;
			rr(ctx, x, summaryY, colWidth - 16, 90, 8); ctx.fill(); ctx.restore();
			T(ctx, c[0], x + 18, summaryY + 30, 14, t.secondary, { letterSpacing: 2 });
			T(ctx, numbers.apply("monospace", c[1]), x + 18, summaryY + 64, 26, t.text);
		});

		const listY = summaryY + 130;
		T(ctx, "TRANSACTION LOG", 60, listY, 18, t.primary, { letterSpacing: 3 });
		GL(ctx, 60, listY + 20, W - 60, listY + 20, t.primary);

		const rows = data.transactions.slice(-9).reverse();
		const rowH = 56;
		if (rows.length === 0) {
			T(ctx, "NO TRANSACTIONS RECORDED", W / 2, listY + 80, 18, t.secondary, { align: "center", letterSpacing: 2 });
		} else {
			rows.forEach((tx, i) => {
				const y = listY + 50 + i * rowH;
				const isPositive = tx.amount >= 0;
				const label = (tx.description || tx.type || "transaction").toUpperCase();
				const dateStr = new Date(tx.date).toLocaleDateString();

				ctx.save(); ctx.globalAlpha = i % 2 === 0 ? 0.04 : 0.0; ctx.fillStyle = t.primary;
				ctx.fillRect(60, y - 28, W - 120, rowH - 6);
				ctx.restore();

				ctx.save();
				ctx.fillStyle = isPositive ? t.primary : t.secondary;
				ctx.beginPath(); ctx.arc(78, y, 5, 0, Math.PI * 2); ctx.fill();
				ctx.restore();

				T(ctx, label, 100, y - 8, 16, t.text, { letterSpacing: 1 });
				T(ctx, dateStr, 100, y + 14, 13, t.secondary);
				const sign = isPositive ? "+" : "-";
				T(ctx, numbers.apply("monospace", sign + numbers.money(Math.abs(tx.amount))), W - 80, y, 22, isPositive ? t.primary : t.text, { align: "right" });
			});
		}

		const footY = H - 110;
		GL(ctx, 60, footY, W - 60, footY, t.primary);
		T(ctx, "TOTAL IN", 60, footY + 40, 16, t.secondary, { letterSpacing: 2 });
		T(ctx, numbers.apply("monospace", numbers.money(data.totalIn)), 60, footY + 72, 28, t.text);
		T(ctx, "TOTAL OUT", W - 60, footY + 40, 16, t.secondary, { align: "right", letterSpacing: 2 });
		T(ctx, numbers.apply("monospace", numbers.money(data.totalOut)), W - 60, footY + 72, 28, t.text, { align: "right" });

		T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, H - 30, 14, t.secondary, { align: "center", letterSpacing: 3 });

		return canvas;
	},

	savingsGoal: async function (message, args, bank, fonts, save) {
		const sub = args[1]?.toLowerCase();

		if (sub === "set") {
			const amount = parseInt(args[2]);
			if (!amount || amount <= 0) {
				return message.reply(fonts.bold("❌ Usage: bank goal set <amount>"));
			}
			bank.savingsGoal = { target: amount, createdAt: Date.now() };
			await save();
			return message.reply(fonts.bold(`🎯 Savings goal set to ${numbers.money(amount)}!`));
		}

		if (!bank.savingsGoal) {
			return message.reply(fonts.bold("❌ No savings goal set. Use: bank goal set <amount>"));
		}

		const current = (bank.balance || 0) + (bank.savings || 0) + (bank.vault || 0);
		const target = bank.savingsGoal.target;
		const progress = Math.min(100, (current / target) * 100);
		const remaining = Math.max(0, target - current);
		const filled = Math.round(progress / 10);
		const bar = "█".repeat(filled) + "░".repeat(10 - filled);

		const text = `
🎯 SAVINGS GOAL TRACKER
━━━━━━━━━━━━━━━
🏁 Target: ${numbers.money(target)}
💰 Current: ${numbers.money(current)}
📊 Progress: [${bar}] ${progress.toFixed(1)}%
📉 Remaining: ${numbers.money(remaining)}
${progress >= 100 ? "🎉 Goal reached! Set a new one with bank goal set <amount>" : ""}`;
		return message.reply(fonts.bold(text));
	},

	payTax: async function (message, bank, senderID, fonts, save) {
		const now = Date.now();
		const taxCooldown = 7 * 24 * 60 * 60 * 1000;
		const lastTax = bank.lastTax || 0;
		if (now - lastTax < taxCooldown) {
			const daysLeft = Math.ceil((taxCooldown - (now - lastTax)) / (24 * 60 * 60 * 1000));
			return message.reply(fonts.bold(`⏰ Tax already paid this cycle. Next due in ${daysLeft} day(s).`));
		}

		if (bank.taxShield) {
			bank.taxShield = false;
			bank.lastTax = now;
			await save();
			return message.reply(fonts.bold("🛡️ Tax Shield activated! This cycle's wealth tax has been waived."));
		}

		const taxable = (bank.balance || 0) + (bank.savings || 0);
		const rate = 0.02;
		const taxAmount = Math.floor(taxable * rate);

		if (taxAmount <= 0) {
			bank.lastTax = now;
			await save();
			return message.reply(fonts.bold("✅ No taxable funds. Tax cycle marked as filed."));
		}
		if ((bank.balance || 0) < taxAmount) {
			return message.reply(fonts.bold(`❌ Insufficient bank balance to cover tax of ${numbers.money(taxAmount)}.`));
		}

		bank.balance -= taxAmount;
		bank.lastTax = now;
		bank.creditScore = Math.min(850, (bank.creditScore || 750) + 5);
		bank.transactions.push({ type: "tax", amount: -taxAmount, date: now, description: "Annual wealth tax" });
		await save();

		return message.reply(fonts.bold(`
🧾 TAX PAID
━━━━━━━━━━━━━━━
📊 Taxable Funds: ${numbers.money(taxable)}
💸 Rate: ${(rate * 100).toFixed(0)}%
💰 Amount Paid: ${numbers.money(taxAmount)}
📈 Credit Score: +5 (${bank.creditScore})
✅ Filed for this cycle.`));
	},

	convertCurrency: function (message, args, fonts) {
		const RATES = {
			USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5,
			CAD: 1.36, AUD: 1.52, CHF: 0.88, CNY: 7.24
		};
		const amount = parseFloat(args[1]);
		const from = args[2]?.toUpperCase();
		const to = args[3]?.toUpperCase();

		if (!amount || !from || !to) {
			return message.reply(fonts.bold(`
💱 CURRENCY CONVERTER
━━━━━━━━━━━━━━━
Usage: bank convert <amount> <from> <to>
Supported: ${Object.keys(RATES).join(", ")}`));
		}
		if (!RATES[from] || !RATES[to]) {
			return message.reply(fonts.bold(`❌ Unsupported currency. Supported: ${Object.keys(RATES).join(", ")}`));
		}

		const usdValue = amount / RATES[from];
		const result = usdValue * RATES[to];

		return message.reply(fonts.bold(`
💱 CONVERSION RESULT
━━━━━━━━━━━━━━━
${numbers.format(amount)} ${from} = ${result.toFixed(2)} ${to}
Exchange rate: 1 ${from} = ${(RATES[to] / RATES[from]).toFixed(4)} ${to}`));
	},

	managePin: async function (message, args, bank, fonts, save) {
		const sub = args[1]?.toLowerCase();

		if (sub === "set") {
			const code = args[2];
			if (!code || !/^\d{4,6}$/.test(code)) {
				return message.reply(fonts.bold("❌ Pin must be 4 to 6 digits. Usage: bank pin set <code>"));
			}
			bank.pin = code;
			await save();
			return message.reply(fonts.bold("🔒 Security pin set successfully."));
		}

		if (sub === "remove") {
			if (!bank.pin) {
				return message.reply(fonts.bold("❌ No pin currently set."));
			}
			delete bank.pin;
			await save();
			return message.reply(fonts.bold("🔓 Security pin removed."));
		}

		return message.reply(fonts.bold(`
🔐 ACCOUNT PIN
━━━━━━━━━━━━━━━
Status: ${bank.pin ? "Set ✅" : "Not set ❌"}
Usage: bank pin set <code> | bank pin remove`));
	},

	giftMoney: async function (message, args, user, usersData, senderID, event, fonts, save) {
		const targetUID = Object.keys(event.mentions || {})[0];
		const amount = parseInt(args[args.length - 1]);

		if (!targetUID || !amount || amount <= 0) {
			return message.reply(fonts.bold("❌ Usage: bank gift @user <amount>"));
		}
		if (targetUID === senderID) {
			return message.reply(fonts.bold("❌ You can't gift money to yourself."));
		}
		if ((user.money || 0) < amount) {
			return message.reply(fonts.bold(`❌ Insufficient wallet funds. You have ${numbers.money((user.money || 0))}.`));
		}

		const receiver = await usersData.get(targetUID);
		if (!receiver) return message.reply(fonts.bold("❌ Recipient not found."));

		user.money -= amount;
		receiver.money = (receiver.money || 0) + amount;
		await usersData.set(targetUID, receiver);
		await save();

		const receiverName = await usersData.getName(targetUID).catch(() => "User");
		return message.reply(fonts.bold(`
🎁 GIFT SENT
━━━━━━━━━━━━━━━
To: ${receiverName}
Amount: ${numbers.money(amount)} (tax free)
Your new balance: ${numbers.money(user.money)}`));
	},

	netWorthLeaderboard: async function (message, usersData, fonts, api, senderID) {
		try {
			const all = await usersData.getAll();
			const entries = Array.isArray(all) ? all.map((u, i) => [String(i), u]) : Object.entries(all);
			const ranked = entries
				.map(([uid, u]) => {
					const bank = u.data?.bank || {};
					const liquid = (u.money || 0) + (bank.balance || 0) + (bank.savings || 0) + (bank.vault || 0);
					const assets = this.calculatePortfolioValue(bank) + this.calculateRealEstateValue(bank) +
						this.calculateBusinessValue(bank) + this.calculateVehicleValue(bank) + this.calculateLuxuryValue(bank);
					const net = liquid + assets - (bank.loan || 0);
					return { uid, name: u.name || "Unknown", net, level: bank.bankLevel || 1 };
				})
				.filter(u => u.net > 0)
				.sort((a, b) => b.net - a.net)
				.slice(0, 10);

			let text = `🏆 NET WORTH LEADERBOARD\n━━━━━━━━━━━━━━━\n`;
			if (ranked.length === 0) {
				text += "No ranked users yet.";
			} else {
				ranked.forEach((u, i) => {
					const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
					text += `${medal} ${u.name} — ${numbers.money(u.net)}\n`;
				});
			}

			if (!canvasAvailable || ranked.length === 0) {
				return message.reply(fonts.bold(text));
			}

			const theme = pickTheme();
			const rows = await Promise.all(ranked.map(async (u) => ({
				name: u.name,
				subtitle: `LEVEL ${u.level}`,
				value: numbers.money(u.net),
				avatar: await fetchAvatar(u.uid)
			})));
			await renderAndAttach(
				message, fonts.bold(text),
				buildRankingCanvas("NET WORTH RANKING", rows, theme),
				"bank_networthboard"
			);
		} catch (e) {
			console.error("Net worth leaderboard error:", e);
			return message.reply(fonts.bold("❌ Error loading the leaderboard."));
		}
	},

	subscription: async function (message, args, bank, fonts, save) {
		const sub = args[1]?.toLowerCase();
		const PLANS = {
			BASIC: { cost: 500, dailyYield: 0.005, name: "Basic Auto-Save" },
			PLUS: { cost: 2000, dailyYield: 0.012, name: "Plus Auto-Save" },
			ELITE: { cost: 8000, dailyYield: 0.022, name: "Elite Auto-Save" }
		};

		if (sub === "plans") {
			let text = `🔁 AUTO-SAVE SUBSCRIPTIONS\n━━━━━━━━━━━━━━━\n`;
			Object.entries(PLANS).forEach(([key, p]) => {
				text += `${p.name} [${key}] — ${numbers.money(p.cost)}/week — ${numbers.apply("bold", (p.dailyYield * 100).toFixed(1))}% daily yield\n`;
			});
			text += `\nSubscribe: bank subscription start <plan>`;
			return message.reply(fonts.bold(text));
		}

		if (sub === "start") {
			const planKey = args[2]?.toUpperCase();
			const plan = PLANS[planKey];
			if (!plan) return message.reply(fonts.bold("❌ Invalid plan. Use: bank subscription plans"));
			if ((bank.balance || 0) < plan.cost) {
				return message.reply(fonts.bold(`❌ Insufficient bank balance. Cost: ${numbers.money(plan.cost)}`));
			}
			bank.balance -= plan.cost;
			bank.subscription = { plan: planKey, startedAt: Date.now(), lastPayout: Date.now() };
			await save();
			return message.reply(fonts.bold(`✅ Subscribed to ${plan.name}! Auto-yield active on your savings.`));
		}

		if (sub === "cancel") {
			if (!bank.subscription) return message.reply(fonts.bold("❌ No active subscription."));
			delete bank.subscription;
			await save();
			return message.reply(fonts.bold("🔁 Subscription cancelled."));
		}

		if (!bank.subscription) {
			return message.reply(fonts.bold("❌ No active subscription. Use: bank subscription plans"));
		}

		const plan = PLANS[bank.subscription.plan];
		const now = Date.now();
		const elapsedDays = Math.floor((now - bank.subscription.lastPayout) / (24 * 60 * 60 * 1000));
		if (elapsedDays >= 1) {
			const payout = Math.floor((bank.savings || 0) * plan.dailyYield * elapsedDays);
			bank.savings += payout;
			bank.subscription.lastPayout = now;
			await save();
			return message.reply(fonts.bold(`🔁 ${plan.name}\n━━━━━━━━━━━━━━━\n💰 Payout collected: ${numbers.money(payout)}\n🏛️ New Savings: ${numbers.money(bank.savings)}`));
		}
		return message.reply(fonts.bold(`🔁 ${plan.name}\n━━━━━━━━━━━━━━━\n⏰ Next payout available soon. Check back later.`));
	},

	budgetPlanner: async function (message, args, bank, fonts, save) {
		const sub = args[1]?.toLowerCase();

		if (sub === "set") {
			const category = args[2]?.toLowerCase();
			const limit = parseInt(args[3]);
			if (!category || !limit || limit <= 0) {
				return message.reply(fonts.bold("❌ Usage: bank budget set <category> <limit>"));
			}
			if (!bank.budget) bank.budget = {};
			bank.budget[category] = { limit, spent: 0, createdAt: Date.now() };
			await save();
			return message.reply(fonts.bold(`📐 Budget set for "${category}": ${numbers.money(limit)}/week`));
		}

		if (!bank.budget || Object.keys(bank.budget).length === 0) {
			return message.reply(fonts.bold("❌ No budgets set. Use: bank budget set <category> <limit>"));
		}

		let text = `📐 BUDGET OVERVIEW\n━━━━━━━━━━━━━━━\n`;
		Object.entries(bank.budget).forEach(([cat, b]) => {
			const pct = Math.min(100, (b.spent / b.limit) * 100);
			const filled = Math.round(pct / 10);
			const bar = "█".repeat(filled) + "░".repeat(10 - filled);
			text += `${cat}: [${bar}] ${numbers.apply("bold", pct.toFixed(0))}%\n${numbers.money(b.spent)} / ${numbers.money(b.limit)}\n\n`;
		});
		return message.reply(fonts.bold(text));
	},

	streakBonus: async function (message, bank, fonts, save) {
		const now = Date.now();
		const oneDay = 24 * 60 * 60 * 1000;
		const lastCheck = bank.lastStreakCheck || 0;
		const gap = now - lastCheck;

		if (gap < oneDay) {
			return message.reply(fonts.bold("⏰ You already checked your streak today. Come back tomorrow."));
		}

		if (gap > oneDay * 2) {
			bank.loyaltyStreak = 1;
		} else {
			bank.loyaltyStreak = (bank.loyaltyStreak || 0) + 1;
		}
		bank.lastStreakCheck = now;

		const bonus = Math.min(bank.loyaltyStreak * 150, 5000);
		bank.balance += bonus;
		bank.transactions.push({ type: "streak_bonus", amount: bonus, date: now, description: `Loyalty streak day ${bank.loyaltyStreak}` });
		await save();

		return message.reply(fonts.bold(`
🔥 LOYALTY STREAK
━━━━━━━━━━━━━━━
📅 Current Streak: ${numbers.apply("bold", bank.loyaltyStreak)} day(s)
💰 Bonus Earned: ${numbers.money(bonus)}
🏦 New Balance: ${numbers.money(bank.balance)}
${bank.loyaltyStreak >= 30 ? "🏆 Max streak bonus reached!" : "Come back tomorrow to keep the streak alive."}`));
	},

	splitBill: async function (message, args, user, usersData, senderID, event, fonts, save) {
		const totalAmount = parseInt(args[1]);
		const mentionIDs = Object.keys(event.mentions || {});

		if (!totalAmount || totalAmount <= 0 || mentionIDs.length === 0) {
			return message.reply(fonts.bold("❌ Usage: bank split <amount> @user1 @user2 ..."));
		}

		const participants = mentionIDs.length + 1;
		const share = Math.ceil(totalAmount / participants);

		if ((user.money || 0) < totalAmount) {
			return message.reply(fonts.bold(`❌ Insufficient wallet funds. You need ${numbers.money(totalAmount)} to cover the full bill upfront.`));
		}

		user.money -= totalAmount;
		let collected = 0;
		for (const uid of mentionIDs) {
			const participant = await usersData.get(uid);
			if (!participant) continue;
			participant.money = Math.max(0, (participant.money || 0) - share);
			await usersData.set(uid, participant);
			collected += share;
		}
		user.money += collected;
		await save();

		return message.reply(fonts.bold(`
🧾 BILL SPLIT
━━━━━━━━━━━━━━━
💵 Total: ${numbers.money(totalAmount)}
👥 Participants: ${numbers.apply("bold", participants)}
📊 Share Per Person: ${numbers.money(share)}
💰 Refunded to You: ${numbers.money(collected)}
💼 Your Final Balance: ${numbers.money(user.money)}`));
	},

	forecastGrowth: function (message, args, bank, walletBalance, fonts) {
		const weeks = parseInt(args[1]) || 12;
		const monthlyRate = 0.03;
		const weeklyRate = monthlyRate / 4;
		const principal = (bank.balance || 0) + (bank.savings || 0);

		if (principal <= 0) {
			return message.reply(fonts.bold("❌ No funds to forecast. Deposit or save some money first."));
		}

		const projected = principal * Math.pow(1 + weeklyRate, weeks);
		const gain = projected - principal;

		let text = `📈 GROWTH FORECAST (${numbers.apply("bold", weeks)} weeks)\n━━━━━━━━━━━━━━━\n`;
		text += `💰 Current Funds: ${numbers.money(principal)}\n`;
		text += `📊 Weekly Rate: ${numbers.apply("bold", (weeklyRate * 100).toFixed(2))}%\n`;
		text += `🔮 Projected Value: ${numbers.money(projected)}\n`;
		text += `📈 Estimated Gain: ${numbers.money(gain)}\n\n`;
		text += `Milestones:\n`;
		[4, 8, 12, 26, 52].filter(w => w <= weeks * 2).forEach(w => {
			const val = principal * Math.pow(1 + weeklyRate, w);
			text += `Week ${numbers.apply("bold", w)}: ${numbers.money(val)}\n`;
		});
		return message.reply(fonts.bold(text));
	},

	virtualCard: async function (message, args, bank, fonts, save) {
		const sub = args[1]?.toLowerCase();

		if (sub === "create") {
			if (bank.virtualCard) {
				return message.reply(fonts.bold("❌ You already have a virtual card."));
			}
			const digits = () => Math.floor(1000 + Math.random() * 9000);
			bank.virtualCard = {
				number: `${digits()} ${digits()} ${digits()} ${digits()}`,
				cashback: 0,
				createdAt: Date.now()
			};
			await save();
			return message.reply(fonts.bold(`
💳 VIRTUAL CARD CREATED
━━━━━━━━━━━━━━━
Card Number: ${numbers.apply("monospace", bank.virtualCard.number)}
Cashback Rate: ${numbers.apply("bold", 2)}% on all spending
Use: bank card spend <amount>`));
		}

		if (sub === "spend") {
			if (!bank.virtualCard) return message.reply(fonts.bold("❌ No virtual card. Use: bank card create"));
			const amount = parseInt(args[2]);
			if (!amount || amount <= 0) return message.reply(fonts.bold("❌ Usage: bank card spend <amount>"));
			if ((bank.balance || 0) < amount) {
				return message.reply(fonts.bold(`❌ Insufficient bank balance. Balance: ${numbers.money(bank.balance)}`));
			}
			const cashback = Math.floor(amount * 0.02);
			bank.balance -= amount;
			bank.balance += cashback;
			bank.virtualCard.cashback = (bank.virtualCard.cashback || 0) + cashback;
			bank.transactions.push({ type: "card_spend", amount: -amount, date: Date.now(), description: "Virtual card purchase" });
			await save();
			return message.reply(fonts.bold(`
💳 PURCHASE PROCESSED
━━━━━━━━━━━━━━━
Amount Spent: ${numbers.money(amount)}
Cashback Earned: ${numbers.money(cashback)}
New Bank Balance: ${numbers.money(bank.balance)}`));
		}

		if (!bank.virtualCard) {
			return message.reply(fonts.bold("❌ No virtual card. Use: bank card create"));
		}
		return message.reply(fonts.bold(`
💳 VIRTUAL CARD
━━━━━━━━━━━━━━━
Card Number: ${numbers.apply("monospace", bank.virtualCard.number)}
Total Cashback Earned: ${numbers.money(bank.virtualCard.cashback)}`));
	},

	upgradeLevel: async function (message, args, bank, user, fonts, save) {
		const MAX_LEVEL = 10;
		bank.bankLevel = bank.bankLevel || 1;
		bank.multiplier = bank.multiplier || 1.0;

		const LEVEL_PERKS = {
			2: "Unlocks bond investing",
			3: "Unlocks business empire",
			4: "Unlocks real estate market",
			5: "Unlocks luxury vehicles",
			6: "Reduced loan interest rate",
			7: "Higher daily reward cap",
			8: "Unlocks elite auto-save plan",
			9: "Reduced robbery risk",
			10: "Maximum earnings multiplier"
		};

		const costFor = (lvl) => lvl * lvl * 5000;

		if (args[1]?.toLowerCase() === "info") {
			let text = `🏦 BANK LEVEL PROGRESSION\n━━━━━━━━━━━━━━━\nCurrent Level: ${numbers.apply("bold", bank.bankLevel)}/${MAX_LEVEL}\nCurrent Multiplier: ${numbers.apply("bold", bank.multiplier.toFixed(1))}x\n\n`;
			for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
				const unlocked = bank.bankLevel >= lvl;
				text += `${unlocked ? "✅" : "🔒"} Level ${numbers.apply("bold", lvl)} — ${numbers.money(costFor(lvl - 1))} — ${LEVEL_PERKS[lvl]}\n`;
			}
			text += `\nUpgrade: bank upgrade`;
			return message.reply(fonts.bold(text));
		}

		if (bank.bankLevel >= MAX_LEVEL) {
			return message.reply(fonts.bold(`👑 You have reached the maximum bank level (${MAX_LEVEL}). No further upgrades available.`));
		}

		const cost = costFor(bank.bankLevel);
		const walletBalance = user.money || 0;
		const totalAvailable = walletBalance + (bank.balance || 0);

		if (totalAvailable < cost) {
			return message.reply(fonts.bold(`
❌ INSUFFICIENT FUNDS FOR UPGRADE
━━━━━━━━━━━━━━━
Current Level: ${numbers.apply("bold", bank.bankLevel)}
Next Level: ${numbers.apply("bold", bank.bankLevel + 1)}
Upgrade Cost: ${numbers.money(cost)}
Available: ${numbers.money(totalAvailable)}
Shortfall: ${numbers.money(cost - totalAvailable)}`));
		}

		let remaining = cost;
		if (bank.balance >= remaining) {
			bank.balance -= remaining;
		} else {
			remaining -= bank.balance;
			bank.balance = 0;
			user.money -= remaining;
		}

		bank.bankLevel += 1;
		bank.multiplier = Math.round((bank.multiplier + 0.1) * 10) / 10;
		bank.creditScore = Math.min(850, (bank.creditScore || 750) + 10);
		bank.transactions.push({ type: "upgrade", amount: -cost, date: Date.now(), description: `Upgraded to bank level ${bank.bankLevel}` });

		await save();

		return message.reply(fonts.bold(`
🏆 BANK LEVEL UP
━━━━━━━━━━━━━━━
New Level: ${numbers.apply("bold", bank.bankLevel)}/${MAX_LEVEL}
New Multiplier: ${numbers.apply("bold", bank.multiplier.toFixed(1))}x
Cost Paid: ${numbers.money(cost)}
Credit Score: +10 (${numbers.apply("bold", bank.creditScore)})
Perk Unlocked: ${LEVEL_PERKS[bank.bankLevel] || "Higher account standing"}

${bank.bankLevel < MAX_LEVEL ? `Next upgrade cost: ${numbers.money(costFor(bank.bankLevel))}` : "Maximum level reached!"}`));
	},

	calculatePortfolioValue: function (bank) {
		let total = 0;
		Object.entries(bank.stocks || {}).forEach(([symbol, shares]) => {
			const price = this.marketData.stocks[symbol]?.price || 100;
			total += shares * price;
		});
		Object.entries(bank.crypto || {}).forEach(([coin, amount]) => {
			const price = this.marketData.crypto[coin]?.price || 1;
			total += amount * price;
		});
		Object.entries(bank.bonds || {}).forEach(([type, amount]) => {
			total += amount;
		});
		return total;
	},

	calculateRealEstateValue: function (bank) {
		return (bank.realEstate || []).reduce((total, property) => total + property.value, 0);
	},

	calculateBusinessValue: function (bank) {
		return (bank.businesses || []).reduce((total, business) => {
			const marketValue = this.marketData.businesses[business.type]?.cost || 100000;
			return total + (marketValue * business.level);
		}, 0);
	},

	calculateVehicleValue: function (bank) {
		return (bank.vehicles || []).reduce((total, vehicle) => total + vehicle.currentValue, 0);
	},

	calculateLuxuryValue: function (bank) {
		return (bank.luxury || []).reduce((total, item) => total + item.value, 0);
	}
};