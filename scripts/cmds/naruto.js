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
			["BeVietnamPro-Bold.ttf", "SH", "bold"],
			["BeVietnamPro-Regular.ttf", "SH", "normal"],
			["BeVietnamPro-SemiBold.ttf", "SH", "600"],
			["NotoSans-Bold.ttf", "SH", "bold"],
			["NotoSans-Regular.ttf", "SH", "normal"]
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

const SHINOBI_THEMES = {
	leaf_green: { name: "Konoha Leaf", primary: "#7FBF7F", secondary: "#25392A", bg1: "#070B08", bg2: "#101A13", text: "#EAF5EC", grid: "#7FBF7F" },
	sharingan_crimson: { name: "Sharingan Crimson", primary: "#C24B4B", secondary: "#3C1A1A", bg1: "#0A0505", bg2: "#170C0C", text: "#F6E4E4", grid: "#C24B4B" },
	akatsuki_cloud: { name: "Akatsuki Cloud", primary: "#B0473F", secondary: "#241618", bg1: "#080506", bg2: "#12090B", text: "#F0E2E2", grid: "#C97A46" },
	sage_amber: { name: "Sage Mode", primary: "#C99A4A", secondary: "#3E3018", bg1: "#0A0805", bg2: "#161006", text: "#F5ECDA", grid: "#C99A4A" },
	kurama_orange: { name: "Kurama Chakra", primary: "#D9832E", secondary: "#3E2410", bg1: "#0B0704", bg2: "#170F07", text: "#F7E9D8", grid: "#D9832E" },
	byakugan_lilac: { name: "Byakugan", primary: "#9E8FC2", secondary: "#2C273D", bg1: "#08070A", bg2: "#120F18", text: "#EDE9F5", grid: "#9E8FC2" },
	uchiha_ember: { name: "Uchiha Ember", primary: "#B85C3C", secondary: "#3A2216", bg1: "#0A0605", bg2: "#160D09", text: "#F3E4DA", grid: "#B85C3C" },
	ame_slate: { name: "Amegakure Rain", primary: "#6E8DAE", secondary: "#28323D", bg1: "#06090B", bg2: "#0E1620", text: "#E6EEF4", grid: "#6E8DAE" },
	sand_dune: { name: "Suna Desert", primary: "#D4A05A", secondary: "#3D2E15", bg1: "#0A0804", bg2: "#161006", text: "#F5EDD6", grid: "#D4A05A" },
	mist_haze: { name: "Kirigakure Mist", primary: "#7BA4B8", secondary: "#23323A", bg1: "#06090A", bg2: "#0E161A", text: "#E6F0F4", grid: "#7BA4B8" },
	cloud_lightning: { name: "Kumogakure Lightning", primary: "#D4B84A", secondary: "#3D3315", bg1: "#0A0804", bg2: "#161006", text: "#F5F0D6", grid: "#D4B84A" },
	sound_vibration: { name: "Otogakure Sound", primary: "#8B6EB0", secondary: "#2F2440", bg1: "#08060A", bg2: "#120F18", text: "#EDE6F5", grid: "#8B6EB0" },
	stone_earth: { name: "Iwagakure Stone", primary: "#A0885A", secondary: "#352D1A", bg1: "#080705", bg2: "#141007", text: "#F0EAD6", grid: "#A0885A" },
	water_mist: { name: "Kirigakure Water", primary: "#5A9CB8", secondary: "#1A2D35", bg1: "#050809", bg2: "#0C161A", text: "#E0EEF5", grid: "#5A9CB8" },
	lightning_bolt: { name: "Kumogakure Bolt", primary: "#C4B84A", secondary: "#353015", bg1: "#080704", bg2: "#121006", text: "#F0EDD6", grid: "#C4B84A" }
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
	ctx.font = `${weight} ${sz}px SH, Arial`;
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

function drawScrollBg(ctx, W, H, t) {
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

function drawBar(ctx, x, y, w, h, ratio, colorBg, colorFg) {
	ctx.save();
	rr(ctx, x, y, w, h, h / 2);
	ctx.fillStyle = colorBg;
	ctx.fill();
	ctx.restore();
	const fillW = Math.max(h, w * Math.max(0, Math.min(1, ratio)));
	ctx.save();
	rr(ctx, x, y, fillW, h, h / 2);
	ctx.fillStyle = colorFg;
	ctx.fill();
	ctx.restore();
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
	const keys = Object.keys(SHINOBI_THEMES);
	return SHINOBI_THEMES[keys[Math.floor(Math.random() * keys.length)]];
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

// ============================================================
// CHARACTER LINES — 92 personnages
// ============================================================
const CHARACTER_LINES = [
	// 1-12: Personnages principaux
	{
		id: 1, key: "naruto", clan: "🏮 Clan Uzumaki",
		emoji: "🦊",
		stages: [
			{ minLevel: 1, name: "Naruto Uzumaki (Genin)", power: 48, basic: "Rasengan", ultimate: "Rasengan Geant + Multi-Clonage" },
			{ minLevel: 15, name: "Naruto Uzumaki (Mode Sage)", power: 64, basic: "Rasengan Geant", ultimate: "Futon : Rasenshuriken" },
			{ minLevel: 30, name: "Naruto Uzumaki (Mode Kurama)", power: 82, basic: "Orbe de Verite", ultimate: "Bijuu Rasenshuriken" },
			{ minLevel: 50, name: "Naruto Uzumaki (Mode Baryon)", power: 102, basic: "Frappe Ultra Rapide", ultimate: "Explosion de Chakra Nucleaire" }
		]
	},
	{
		id: 2, key: "sasuke", clan: "⚡ Clan Uchiha",
		emoji: "⚡",
		stages: [
			{ minLevel: 1, name: "Sasuke Uchiha (Genin)", power: 50, basic: "Chidori", ultimate: "Kirin" },
			{ minLevel: 15, name: "Sasuke Uchiha (Sharingan Eveille)", power: 66, basic: "Chidori Nagashi", ultimate: "Susanoo Partiel" },
			{ minLevel: 30, name: "Sasuke Uchiha (Susanoo)", power: 84, basic: "Amaterasu", ultimate: "Susanoo Complet + Amaterasu" },
			{ minLevel: 50, name: "Sasuke Uchiha (Rinnegan)", power: 104, basic: "Fleche d'Indra", ultimate: "Amenotejikara + Susanoo Ultime" }
		]
	},
	{
		id: 3, key: "sakura", clan: "🌸 Ninja Medicin",
		emoji: "🌸",
		stages: [
			{ minLevel: 1, name: "Sakura Haruno (Genin)", power: 42, basic: "Coup Surpuissant", ultimate: "Sceau Byakugou Mineur" },
			{ minLevel: 15, name: "Sakura Haruno (Ninja Medicin)", power: 58, basic: "Poing Chakra Renforce", ultimate: "Liberation du Sceau" },
			{ minLevel: 30, name: "Sakura Haruno (Force Monstrueuse)", power: 76, basic: "Frappe Sismique", ultimate: "Cent Sceaux Liberes" },
			{ minLevel: 50, name: "Sakura Haruno (Byakugou Supreme)", power: 98, basic: "Frappe Regenerante", ultimate: "Creation de Vie Divine" }
		]
	},
	{
		id: 4, key: "kakashi", clan: "📖 Clan Hatake",
		emoji: "📖",
		stages: [
			{ minLevel: 1, name: "Kakashi Hatake (Jonin)", power: 50, basic: "Raikiri", ultimate: "Kamui Mineur" },
			{ minLevel: 15, name: "Kakashi Hatake (Sharingan Copieur)", power: 66, basic: "Kamui Raikiri", ultimate: "Kamui Integral" },
			{ minLevel: 30, name: "Kakashi Hatake (Susanoo Naissant)", power: 84, basic: "Susanoo Partiel", ultimate: "Kamui Shuriken" },
			{ minLevel: 50, name: "Kakashi Hatake (Susanoo Complet)", power: 104, basic: "Frappe Susanoo", ultimate: "Kamui Dimensionnel Total" }
		]
	},
	{
		id: 5, key: "gaara", clan: "🏜️ Clan du Kazekage",
		emoji: "🏜️",
		stages: [
			{ minLevel: 1, name: "Gaara du Desert (Genin)", power: 48, basic: "Sable Mouvant", ultimate: "Cercueil de Sable" },
			{ minLevel: 15, name: "Gaara du Desert (Maitre du Sable)", power: 64, basic: "Vague de Sable", ultimate: "Prison de Sable Absolue" },
			{ minLevel: 30, name: "Gaara du Desert (Armure de Sable)", power: 82, basic: "Armure Renforcee", ultimate: "Tempete de Sable Funeraire" },
			{ minLevel: 50, name: "Gaara du Desert (Kazekage Supreme)", power: 102, basic: "Golem de Sable", ultimate: "Deluge de Sable Dore" }
		]
	},
	{
		id: 6, key: "hinata", clan: "👁️ Clan Hyuga",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Hinata Hyuga (Genin)", power: 40, basic: "Paume du Hakke", ultimate: "8 Trigrammes 16 Paumes" },
			{ minLevel: 15, name: "Hinata Hyuga (Byakugan Affute)", power: 56, basic: "Paume Celeste Tournoyante", ultimate: "64 Points du Hakke" },
			{ minLevel: 30, name: "Hinata Hyuga (Poing Doux Maitrise)", power: 74, basic: "Lion Tournoyant", ultimate: "128 Points du Hakke" },
			{ minLevel: 50, name: "Hinata Hyuga (Chef du Clan)", power: 96, basic: "Frappe du Destin", ultimate: "Trigrammes Infinis" }
		]
	},
	{
		id: 7, key: "rocklee", clan: "💪 Ninja Taijutsu",
		emoji: "💪",
		stages: [
			{ minLevel: 1, name: "Rock Lee (Genin)", power: 46, basic: "Lotus Initial", ultimate: "Lotus Primaire" },
			{ minLevel: 15, name: "Rock Lee (Portes Ouvertes)", power: 62, basic: "Lotus Avance", ultimate: "5eme Porte - Lotus Vivace" },
			{ minLevel: 30, name: "Rock Lee (7eme Porte)", power: 80, basic: "Frappe Explosive", ultimate: "7eme Porte - Lotus Ardent" },
			{ minLevel: 50, name: "Rock Lee (8eme Porte)", power: 100, basic: "Frappe Fatale", ultimate: "8eme Porte - Nuit de la Mort" }
		]
	},
	{
		id: 8, key: "itachi", clan: "🩸 Clan Uchiha (Anbu)",
		emoji: "🩸",
		stages: [
			{ minLevel: 1, name: "Itachi Uchiha (Anbu)", power: 52, basic: "Tsukuyomi Mineur", ultimate: "Amaterasu Ciblee" },
			{ minLevel: 15, name: "Itachi Uchiha (Sharingan Illusoire)", power: 68, basic: "Shuriken de l'Ombre", ultimate: "Amaterasu + Susanoo Partiel" },
			{ minLevel: 30, name: "Itachi Uchiha (Susanoo Eternel)", power: 86, basic: "Frappe Susanoo", ultimate: "Totsuka + Yata" },
			{ minLevel: 50, name: "Itachi Uchiha (Izanami Supreme)", power: 106, basic: "Illusion Absolue", ultimate: "Izanami Inevitable" }
		]
	},
	{
		id: 9, key: "jiraiya", clan: "🐸 Sannin Legendaire",
		emoji: "🐸",
		stages: [
			{ minLevel: 1, name: "Jiraiya (Sannin)", power: 54, basic: "Rasengan", ultimate: "Invocation de Gamabunta" },
			{ minLevel: 20, name: "Jiraiya (Mode Hermite)", power: 72, basic: "Senpo Rasengan", ultimate: "Senpo : Goemon" },
			{ minLevel: 40, name: "Jiraiya (Sage Supreme)", power: 90, basic: "Senpo Rasen Shuriken", ultimate: "Invocation Ultime" },
			{ minLevel: 55, name: "Jiraiya (L'Erudit Legendaire)", power: 108, basic: "Frappe du Sage", ultimate: "Scellage du Demiurge" }
		]
	},
	{
		id: 10, key: "madara", clan: "👺 Clan Uchiha (Rinnegan)",
		emoji: "👺",
		stages: [
			{ minLevel: 1, name: "Madara Uchiha (Eveille)", power: 56, basic: "Grande Boule de Feu", ultimate: "Susanoo Archaique" },
			{ minLevel: 25, name: "Madara Uchiha (Rinnegan)", power: 78, basic: "Limbo", ultimate: "Meteore d'Indra" },
			{ minLevel: 45, name: "Madara Uchiha (Jinchuriki)", power: 96, basic: "Orbe du Ten-Tails", ultimate: "Expansion Infinie" },
			{ minLevel: 60, name: "Madara Uchiha (Divin)", power: 120, basic: "Frappe de l'Infini", ultimate: "Fin du Monde" }
		]
	},
	{
		id: 11, key: "minato", clan: "🌀 Clan Namikaze",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Minato Namikaze (Genin)", power: 46, basic: "Rasengan", ultimate: "Teleportation" },
			{ minLevel: 18, name: "Minato Namikaze (Hokage)", power: 68, basic: "Rasengan Geant", ultimate: "Teleportation du Ryu" },
			{ minLevel: 35, name: "Minato Namikaze (Mode Kyuubi)", power: 86, basic: "Rasengan Ultime", ultimate: "Explosion Teleportee" },
			{ minLevel: 52, name: "Minato Namikaze (Legendaire)", power: 106, basic: "Frappe du Fleau", ultimate: "Reincarnation Divine" }
		]
	},
	{
		id: 12, key: "pain", clan: "🕊️ Clan Nagato",
		emoji: "🕊️",
		stages: [
			{ minLevel: 1, name: "Pain (Chef de l'Akatsuki)", power: 54, basic: "Shinra Tensei", ultimate: "Chibaku Tensei" },
			{ minLevel: 22, name: "Pain (Corps Preta)", power: 74, basic: "Absorption de Chakra", ultimate: "Reanimation" },
			{ minLevel: 42, name: "Pain (Les Six Chemins)", power: 92, basic: "Almighty Push", ultimate: "Cataclysme Celeste" },
			{ minLevel: 58, name: "Pain (Nagato Supreme)", power: 112, basic: "Frappe de la Lune", ultimate: "Resurrection Universelle" }
		]
	},
	// 13-24: Personnages secondaires de Konoha
	{
		id: 13, key: "shikamaru", clan: "♟️ Clan Nara",
		emoji: "♟️",
		stages: [
			{ minLevel: 1, name: "Shikamaru Nara (Genin)", power: 38, basic: "Ombre Bougeante", ultimate: "Prison d'Ombre" },
			{ minLevel: 12, name: "Shikamaru Nara (Chunin)", power: 52, basic: "Etreinte d'Ombre", ultimate: "La Trahison d'Ombre" },
			{ minLevel: 28, name: "Shikamaru Nara (Jonin)", power: 70, basic: "Kage Mane", ultimate: "Paralysie d'Ombre" },
			{ minLevel: 45, name: "Shikamaru Nara (Strategiste Supreme)", power: 88, basic: "Ombre du Strategiste", ultimate: "Trappe d'Ombre Inevitable" }
		]
	},
	{
		id: 14, key: "ino", clan: "🌺 Clan Yamanaka",
		emoji: "🌺",
		stages: [
			{ minLevel: 1, name: "Ino Yamanaka (Genin)", power: 36, basic: "Transfert d'Esprit", ultimate: "Possession d'Esprit" },
			{ minLevel: 12, name: "Ino Yamanaka (Chunin)", power: 50, basic: "Lien d'Esprit", ultimate: "Transfert de Conscience" },
			{ minLevel: 28, name: "Ino Yamanaka (Jonin)", power: 68, basic: "Fleau d'Esprit", ultimate: "Controle Mental" },
			{ minLevel: 45, name: "Ino Yamanaka (Maitre des Esprits)", power: 86, basic: "Vague d'Esprit", ultimate: "Guerre Mentale" }
		]
	},
	{
		id: 15, key: "choji", clan: "🍬 Clan Akimichi",
		emoji: "🍬",
		stages: [
			{ minLevel: 1, name: "Choji Akimichi (Genin)", power: 40, basic: "Ballon Humain", ultimate: "Boule de Fer Humaine" },
			{ minLevel: 12, name: "Choji Akimichi (Chunin)", power: 54, basic: "Butterfly Choji", ultimate: "Guerrier Papillon" },
			{ minLevel: 28, name: "Choji Akimichi (Jonin)", power: 72, basic: "Frappe Colossale", ultimate: "Papillon de l'Enfer" },
			{ minLevel: 45, name: "Choji Akimichi (L'Ange de la Nourriture)", power: 90, basic: "Meteore Humain", ultimate: "Feu d'Artifice Final" }
		]
	},
	{
		id: 16, key: "neji", clan: "👁️ Clan Hyuga",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Neji Hyuga (Genin)", power: 44, basic: "Paume du Hakke", ultimate: "64 Points du Hakke" },
			{ minLevel: 14, name: "Neji Hyuga (Chunin)", power: 58, basic: "Rotation", ultimate: "128 Points du Hakke" },
			{ minLevel: 30, name: "Neji Hyuga (Jonin)", power: 76, basic: "Paume Celeste", ultimate: "256 Points du Hakke" },
			{ minLevel: 48, name: "Neji Hyuga (Genie du Byakugan)", power: 94, basic: "Poing de la Destinee", ultimate: "Trigrammes du Destin" }
		]
	},
	{
		id: 17, key: "tenten", clan: "🗡️ Clan des Armes",
		emoji: "🗡️",
		stages: [
			{ minLevel: 1, name: "Tenten (Genin)", power: 38, basic: "Shuriken Torrent", ultimate: "Pluie d'Armes" },
			{ minLevel: 12, name: "Tenten (Chunin)", power: 52, basic: "Tempete d'Armes", ultimate: "Tornade de Lames" },
			{ minLevel: 28, name: "Tenten (Jonin)", power: 70, basic: "Bazooka d'Armes", ultimate: "Ouragan de Metaux" },
			{ minLevel: 45, name: "Tenten (Maitre des Armes)", power: 88, basic: "Deluge d'Acier", ultimate: "Cataclysme d'Armes" }
		]
	},
	{
		id: 18, key: "temari", clan: "🌪️ Clan du Vent",
		emoji: "🌪️",
		stages: [
			{ minLevel: 1, name: "Temari (Genin)", power: 42, basic: "Coup d'Eventail", ultimate: "Rafale de Vent" },
			{ minLevel: 14, name: "Temari (Chunin)", power: 56, basic: "Danse de l'Eventail", ultimate: "Tempete de Sable" },
			{ minLevel: 30, name: "Temari (Jonin)", power: 74, basic: "Tourbillon d'Eventail", ultimate: "Tornade de Vent" },
			{ minLevel: 48, name: "Temari (Deesse du Vent)", power: 92, basic: "Frappe du Vent Divin", ultimate: "Cataclysme Aeolien" }
		]
	},
	{
		id: 19, key: "kankuro", clan: "🎭 Clan des Marionnettistes",
		emoji: "🎭",
		stages: [
			{ minLevel: 1, name: "Kankuro (Genin)", power: 40, basic: "Marionnette Kuroari", ultimate: "Marionnette Sanshōuo" },
			{ minLevel: 14, name: "Kankuro (Chunin)", power: 54, basic: "Marionnette Karasu", ultimate: "Danse des Marionnettes" },
			{ minLevel: 30, name: "Kankuro (Jonin)", power: 72, basic: "Marionnette Sasori", ultimate: "Theatre des Marionnettes" },
			{ minLevel: 48, name: "Kankuro (Maitre Marionnettiste)", power: 90, basic: "Mille Marionnettes", ultimate: "Feu d'Artifice de Marionnettes" }
		]
	},
	{
		id: 20, key: "kiba", clan: "🐺 Clan Inuzuka",
		emoji: "🐺",
		stages: [
			{ minLevel: 1, name: "Kiba Inuzuka (Genin)", power: 40, basic: "Morsure de Akamaru", ultimate: "Transformation Humaine" },
			{ minLevel: 12, name: "Kiba Inuzuka (Chunin)", power: 54, basic: "Grifle de Akamaru", ultimate: "Double Transformation" },
			{ minLevel: 28, name: "Kiba Inuzuka (Jonin)", power: 72, basic: "Hurlement de la Meute", ultimate: "Tornade de la Meute" },
			{ minLevel: 45, name: "Kiba Inuzuka (Alpha)", power: 90, basic: "Frappe de la Meute", ultimate: "Assaut de la Meute" }
		]
	},
	{
		id: 21, key: "shino", clan: "🪲 Clan Aburame",
		emoji: "🪲",
		stages: [
			{ minLevel: 1, name: "Shino Aburame (Genin)", power: 42, basic: "Nuage d'Insectes", ultimate: "Essaim d'Insectes" },
			{ minLevel: 12, name: "Shino Aburame (Chunin)", power: 56, basic: "Drain d'Insectes", ultimate: "Colonie d'Insectes" },
			{ minLevel: 28, name: "Shino Aburame (Jonin)", power: 74, basic: "Armure d'Insectes", ultimate: "Nuage de Mille Insectes" },
			{ minLevel: 45, name: "Shino Aburame (Roi des Insectes)", power: 92, basic: "Pluie d'Insectes", ultimate: "Cataclysme des Insectes" }
		]
	},
	{
		id: 22, key: "orochimaru", clan: "🐍 Sannin",
		emoji: "🐍",
		stages: [
			{ minLevel: 1, name: "Orochimaru (Sannin)", power: 52, basic: "Morsure de Serpent", ultimate: "Metamorphose de Serpent" },
			{ minLevel: 20, name: "Orochimaru (Scientifique Fou)", power: 70, basic: "Lame de Kusanagi", ultimate: "Invocation des Serpents" },
			{ minLevel: 40, name: "Orochimaru (Immortel)", power: 88, basic: "Transfert d'Ame", ultimate: "Reanimation des Morts" },
			{ minLevel: 55, name: "Orochimaru (Sage)", power: 106, basic: "Sceau du Serpent", ultimate: "Regeneration Complete" }
		]
	},
	{
		id: 23, key: "tsunade", clan: "👊 Sannin",
		emoji: "👊",
		stages: [
			{ minLevel: 1, name: "Tsunade (Sannin)", power: 50, basic: "Poing Surpuissant", ultimate: "Sceau Byakugou" },
			{ minLevel: 20, name: "Tsunade (Hokage)", power: 68, basic: "Frappe Sismique", ultimate: "Sceau Byakugou Complet" },
			{ minLevel: 40, name: "Tsunade (Legende)", power: 86, basic: "Poing de la Creation", ultimate: "Regeneration Divine" },
			{ minLevel: 55, name: "Tsunade (Deesse de la Guerre)", power: 104, basic: "Frappe du Destin", ultimate: "Creation de Vie" }
		]
	},
	{
		id: 24, key: "killerbee", clan: "🐙 Jinchuriki de Hachibi",
		emoji: "🐙",
		stages: [
			{ minLevel: 1, name: "Killer Bee (Genin)", power: 50, basic: "Coup de Pied", ultimate: "Furie du Hachibi" },
			{ minLevel: 18, name: "Killer Bee (Mode Jinchuriki)", power: 68, basic: "Lame de Tentacule", ultimate: "Explosion de Bijuu" },
			{ minLevel: 35, name: "Killer Bee (Maitrise)", power: 86, basic: "Danse des Lames", ultimate: "Octopus Bomb" },
			{ minLevel: 52, name: "Killer Bee (Raper Legendaire)", power: 104, basic: "Frappe Rapide", ultimate: "Rhythme de la Mort" }
		]
	},
	// 25-36: Akatsuki et antagonistes
	{
		id: 25, key: "konan", clan: "📜 Akatsuki",
		emoji: "📜",
		stages: [
			{ minLevel: 1, name: "Konan (Akatsuki)", power: 44, basic: "Papier d'Origami", ultimate: "Danse des Papiers" },
			{ minLevel: 16, name: "Konan (Maitre des Papiers)", power: 60, basic: "Pluie de Papiers", ultimate: "Lac de Papiers" },
			{ minLevel: 32, name: "Konan (Deesse des Papiers)", power: 78, basic: "Papier Explosif", ultimate: "Cataclysme de Papier" },
			{ minLevel: 50, name: "Konan (L'Ange de l'Akatsuki)", power: 96, basic: "Paradoxe de Papier", ultimate: "Danse de la Mort" }
		]
	},
	{
		id: 26, key: "hidan", clan: "🩸 Akatsuki",
		emoji: "🩸",
		stages: [
			{ minLevel: 1, name: "Hidan (Akatsuki)", power: 46, basic: "Lame de Sang", ultimate: "Rituel Maudit" },
			{ minLevel: 16, name: "Hidan (Immortel)", power: 62, basic: "Danse du Sang", ultimate: "Rituel de la Mort" },
			{ minLevel: 32, name: "Hidan (Apotre de la Mort)", power: 80, basic: "Explosion de Sang", ultimate: "Rituel Sanglant" },
			{ minLevel: 50, name: "Hidan (Dieu de la Mort)", power: 98, basic: "Lame de la Faucheuse", ultimate: "Dernier Rituel" }
		]
	},
	{
		id: 27, key: "kakuzu", clan: "🫀 Akatsuki",
		emoji: "🫀",
		stages: [
			{ minLevel: 1, name: "Kakuzu (Akatsuki)", power: 48, basic: "Fils d'Acier", ultimate: "Explosion de Masques" },
			{ minLevel: 18, name: "Kakuzu (Quatre Coeurs)", power: 64, basic: "Tempete de Fils", ultimate: "Fusion des Masques" },
			{ minLevel: 34, name: "Kakuzu (Cinq Coeurs)", power: 82, basic: "Danse des Fils", ultimate: "Cinq Masques" },
			{ minLevel: 52, name: "Kakuzu (L'Immortel)", power: 100, basic: "Bouclier de Fils", ultimate: "Cataclysme des Masques" }
		]
	},
	{
		id: 28, key: "sasori", clan: "🎭 Akatsuki",
		emoji: "🎭",
		stages: [
			{ minLevel: 1, name: "Sasori (Akatsuki)", power: 46, basic: "Marionnette Hiruko", ultimate: "Mille Marionnettes" },
			{ minLevel: 18, name: "Sasori (Marionnettiste)", power: 62, basic: "Lame d'Acier", ultimate: "Danse des Marionnettes" },
			{ minLevel: 34, name: "Sasori (Puppet Master)", power: 80, basic: "Parfum de Poison", ultimate: "Feu d'Artifice de Marionnettes" },
			{ minLevel: 52, name: "Sasori (L'Immortel de l'Akatsuki)", power: 98, basic: "Armure d'Acier", ultimate: "Theatre de la Mort" }
		]
	},
	{
		id: 29, key: "deidara", clan: "💥 Akatsuki",
		emoji: "💥",
		stages: [
			{ minLevel: 1, name: "Deidara (Akatsuki)", power: 44, basic: "Argile Explosive", ultimate: "Explosion Ultimate" },
			{ minLevel: 16, name: "Deidara (Artiste Explosif)", power: 60, basic: "Faucon d'Argile", ultimate: "C4 Karura" },
			{ minLevel: 32, name: "Deidara (Maitre de l'Explosion)", power: 78, basic: "Danse d'Argile", ultimate: "C0" },
			{ minLevel: 50, name: "Deidara (Artiste Supreme)", power: 96, basic: "Explosion d'Argile", ultimate: "L'Art C'est un Explosion" }
		]
	},
	{
		id: 30, key: "zetsu", clan: "🌿 Akatsuki",
		emoji: "🌿",
		stages: [
			{ minLevel: 1, name: "Zetsu (Akatsuki)", power: 40, basic: "Vigne de Chakra", ultimate: "Transformation Vegetale" },
			{ minLevel: 14, name: "Zetsu (Espion)", power: 56, basic: "Photosynthese", ultimate: "Clones Végétaux" },
			{ minLevel: 30, name: "Zetsu (Plante de Combat)", power: 74, basic: "Liane de Chakra", ultimate: "Forêt de Lianes" },
			{ minLevel: 48, name: "Zetsu (La Volonte de Kaguya)", power: 92, basic: "Armure Vegetale", ultimate: "Eveil de Kaguya" }
		]
	},
	{
		id: 31, key: "tobi", clan: "🪶 Akatsuki (Obito)",
		emoji: "🪶",
		stages: [
			{ minLevel: 1, name: "Tobi (Akatsuki)", power: 42, basic: "Teleportation", ultimate: "Kamui" },
			{ minLevel: 16, name: "Tobi (Obito Uchiha)", power: 58, basic: "Kamui Raikiri", ultimate: "Six Chemins" },
			{ minLevel: 32, name: "Tobi (Jinchuriki de Juubi)", power: 76, basic: "Orbe de Verite", ultimate: "Expansion Infinie" },
			{ minLevel: 50, name: "Tobi (Obito Sage)", power: 94, basic: "Frappe de l'Infini", ultimate: "Kamui Dimensional" }
		]
	},
	{
		id: 32, key: "shisui", clan: "👁️ Clan Uchiha",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Shisui Uchiha (Genin)", power: 48, basic: "Boule de Feu", ultimate: "Kotoamatsukami" },
			{ minLevel: 16, name: "Shisui Uchiha (ANBU)", power: 64, basic: "Sharingan Illusoire", ultimate: "Susanoo Mineur" },
			{ minLevel: 32, name: "Shisui Uchiha (L'Illusionniste)", power: 82, basic: "Danse de l'Illusion", ultimate: "Kotoamatsukami Ultime" },
			{ minLevel: 50, name: "Shisui Uchiha (Le Fantome)", power: 100, basic: "Illusion Absolue", ultimate: "Controle des Esprits" }
		]
	},
	{
		id: 33, key: "fugaku", clan: "👁️ Clan Uchiha",
		emoji: "👁️",
		stages: [
			{ minLevel: 1, name: "Fugaku Uchiha (Chef du Clan)", power: 46, basic: "Boule de Feu", ultimate: "Susanoo Partiel" },
			{ minLevel: 18, name: "Fugaku Uchiha (Guerrier)", power: 62, basic: "Sharingan Eveille", ultimate: "Susanoo Complet" },
			{ minLevel: 34, name: "Fugaku Uchiha (Legende)", power: 80, basic: "Danse du Feu", ultimate: "Susanoo Ultime" },
			{ minLevel: 52, name: "Fugaku Uchiha (Pere de Sasuke)", power: 98, basic: "Frappe du Clan", ultimate: "Eveil du Mangekyo" }
		]
	},
	{
		id: 34, key: "konohamaru", clan: "🔥 Clan Sarutobi",
		emoji: "🔥",
		stages: [
			{ minLevel: 1, name: "Konohamaru (Genin)", power: 38, basic: "Rasengan", ultimate: "Rasengan Geant" },
			{ minLevel: 12, name: "Konohamaru (Chunin)", power: 52, basic: "Rasengan de Feu", ultimate: "Rasengan Flamboyant" },
			{ minLevel: 28, name: "Konohamaru (Jonin)", power: 70, basic: "Danse du Rasengan", ultimate: "Rasengan de la Mort" },
			{ minLevel: 45, name: "Konohamaru (Troisieme Hokage)", power: 88, basic: "Frappe du Hokage", ultimate: "Volonte de Feu" }
		]
	},
	{
		id: 35, key: "sai", clan: "🖌️ Ninja d'ANBU",
		emoji: "🖌️",
		stages: [
			{ minLevel: 1, name: "Sai (ANBU)", power: 40, basic: "Lion d'Encre", ultimate: "Encre Noire" },
			{ minLevel: 12, name: "Sai (Ninja)", power: 54, basic: "Dragon d'Encre", ultimate: "Nouage d'Encre" },
			{ minLevel: 28, name: "Sai (Jonin)", power: 72, basic: "Tempete d'Encre", ultimate: "La Mer d'Encre" },
			{ minLevel: 45, name: "Sai (Maitre de l'Encre)", power: 90, basic: "Armure d'Encre", ultimate: "Creation d'Encre" }
		]
	},
	{
		id: 36, key: "yamato", clan: "🌳 Ninja d'ANBU",
		emoji: "🌳",
		stages: [
			{ minLevel: 1, name: "Yamato (ANBU)", power: 42, basic: "Bois du Dragon", ultimate: "Invocation du Bois" },
			{ minLevel: 14, name: "Yamato (Jonin)", power: 56, basic: "Forêt de Bois", ultimate: "Lac de Bois" },
			{ minLevel: 30, name: "Yamato (Maitre du Bois)", power: 74, basic: "Armure de Bois", ultimate: "Forêt de la Mort" },
			{ minLevel: 48, name: "Yamato (Le Ninja Bois)", power: 92, basic: "Frappe de Bois", ultimate: "Eveil du Bois" }
		]
	},
	// 37-48: Clans Uzumaki et Otsutsuki
	{
		id: 37, key: "kushina", clan: "🌀 Clan Uzumaki",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Kushina Uzumaki (Genin)", power: 42, basic: "Chaines de Chakra", ultimate: "Sceau du Kyuubi" },
			{ minLevel: 14, name: "Kushina Uzumaki (Chunin)", power: 56, basic: "Danse de la Volonte", ultimate: "Controle du Kyuubi" },
			{ minLevel: 30, name: "Kushina Uzumaki (Jonin)", power: 74, basic: "Fureur Uzumaki", ultimate: "Explosion de Chakra" },
			{ minLevel: 48, name: "Kushina Uzumaki (Mere de Naruto)", power: 92, basic: "Amour de la Mere", ultimate: "Scellage du Destin" }
		]
	},
	{
		id: 38, key: "nagato", clan: "🕊️ Clan Uzumaki",
		emoji: "🕊️",
		stages: [
			{ minLevel: 1, name: "Nagato (Enfant)", power: 40, basic: "Rinnegan Naissant", ultimate: "Shinra Tensei" },
			{ minLevel: 16, name: "Nagato (Pain)", power: 56, basic: "Bansho Ten'in", ultimate: "Chibaku Tensei" },
			{ minLevel: 32, name: "Nagato (Chef de l'Akatsuki)", power: 74, basic: "Six Chemins de Pain", ultimate: "Cataclysme de Pain" },
			{ minLevel: 50, name: "Nagato (Le Dieu de la Paix)", power: 92, basic: "Frappe de la Paix", ultimate: "Resurrection Ultime" }
		]
	},
	{
		id: 39, key: "hamura", clan: "🌙 Clan Otsutsuki",
		emoji: "🌙",
		stages: [
			{ minLevel: 1, name: "Hamura Otsutsuki (Eveille)", power: 50, basic: "Chakra du Sage", ultimate: "Six Chemins" },
			{ minLevel: 20, name: "Hamura Otsutsuki (Byakugan)", power: 68, basic: "Frappe du Sage", ultimate: "Boule de la Lune" },
			{ minLevel: 40, name: "Hamura Otsutsuki (Legende)", power: 86, basic: "Danse du Sage", ultimate: "Cataclysme Lunaire" },
			{ minLevel: 55, name: "Hamura Otsutsuki (Le Dieu Lunaire)", power: 104, basic: "Frappe de la Lune", ultimate: "Creation de la Lune" }
		]
	},
	{
		id: 40, key: "hagoromo", clan: "🌞 Clan Otsutsuki",
		emoji: "🌞",
		stages: [
			{ minLevel: 1, name: "Hagoromo Otsutsuki (Eveille)", power: 52, basic: "Chakra du Sage", ultimate: "Six Chemins" },
			{ minLevel: 22, name: "Hagoromo Otsutsuki (Sage des Six Chemins)", power: 70, basic: "Frappe du Sage", ultimate: "Eveil des Six Chemins" },
			{ minLevel: 42, name: "Hagoromo Otsutsuki (Legende)", power: 88, basic: "Danse du Soleil", ultimate: "Cataclysme Solaire" },
			{ minLevel: 58, name: "Hagoromo Otsutsuki (Le Dieu Solaire)", power: 106, basic: "Frappe du Soleil", ultimate: "Creation du Monde" }
		]
	},
	{
		id: 41, key: "kaguya", clan: "🌕 Clan Otsutsuki",
		emoji: "🌕",
		stages: [
			{ minLevel: 1, name: "Kaguya Otsutsuki (Eveille)", power: 54, basic: "Byakugan", ultimate: "Chakra du Dieux" },
			{ minLevel: 24, name: "Kaguya Otsutsuki (La Deesse)", power: 72, basic: "Rinne Sharingan", ultimate: "Expansion Infinie" },
			{ minLevel: 44, name: "Kaguya Otsutsuki (La Mere)", power: 90, basic: "Danse de la Lune", ultimate: "Cataclysme de l'Infini" },
			{ minLevel: 60, name: "Kaguya Otsutsuki (La Divinite)", power: 110, basic: "Frappe de l'Infini", ultimate: "Creation de la Vie" }
		]
	},
	{
		id: 42, key: "isshiki", clan: "⭐ Clan Otsutsuki",
		emoji: "⭐",
		stages: [
			{ minLevel: 1, name: "Isshiki Otsutsuki (Eveille)", power: 56, basic: "Chakra Divin", ultimate: "Sceau Maudit" },
			{ minLevel: 26, name: "Isshiki Otsutsuki (Le Destructeur)", power: 74, basic: "Frappe de la Mort", ultimate: "Cataclysme Stellare" },
			{ minLevel: 46, name: "Isshiki Otsutsuki (Le Dieu Stellare)", power: 92, basic: "Danse des Etoiles", ultimate: "Fin de l'Univers" },
			{ minLevel: 60, name: "Isshiki Otsutsuki (Le Créateur)", power: 112, basic: "Frappe Divine", ultimate: "Creation Stellare" }
		]
	},
	{
		id: 43, key: "ashura", clan: "🌀 Clan Otsutsuki",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Ashura Otsutsuki (Eveille)", power: 46, basic: "Chakra de la Volonte", ultimate: "Scellage du Destin" },
			{ minLevel: 18, name: "Ashura Otsutsuki (Heritier)", power: 62, basic: "Frappe de la Volonte", ultimate: "Eveil de la Volonte" },
			{ minLevel: 38, name: "Ashura Otsutsuki (Le Sage)", power: 80, basic: "Danse de la Volonte", ultimate: "Cataclysme de la Volonte" },
			{ minLevel: 54, name: "Ashura Otsutsuki (Le Dieu de la Volonte)", power: 98, basic: "Frappe de la Destinee", ultimate: "Creation de la Volonte" }
		]
	},
	{
		id: 44, key: "indra", clan: "⚡ Clan Otsutsuki",
		emoji: "⚡",
		stages: [
			{ minLevel: 1, name: "Indra Otsutsuki (Eveille)", power: 48, basic: "Chakra de la Foudre", ultimate: "Susanoo Archaique" },
			{ minLevel: 18, name: "Indra Otsutsuki (Heritier)", power: 64, basic: "Frappe de la Foudre", ultimate: "Eveil du Sharingan" },
			{ minLevel: 38, name: "Indra Otsutsuki (Le Guerrier)", power: 82, basic: "Danse de la Foudre", ultimate: "Cataclysme Electrique" },
			{ minLevel: 54, name: "Indra Otsutsuki (Le Dieu de la Foudre)", power: 100, basic: "Frappe de l'Infini", ultimate: "Creation de la Foudre" }
		]
	},
	// 45-56: Nouveaux personnages (Kashin Koji, Delta, etc.)
	{
		id: 45, key: "koji", clan: "🐸 Clan des Sages",
		emoji: "🐸",
		stages: [
			{ minLevel: 1, name: "Koji Kashin (Eveille)", power: 44, basic: "Feu de la Volonte", ultimate: "Sceau du Sage" },
			{ minLevel: 16, name: "Koji Kashin (Mode Hermite)", power: 60, basic: "Senpo Rasengan", ultimate: "Invocation des Sages" },
			{ minLevel: 32, name: "Koji Kashin (Sage)", power: 78, basic: "Danse du Feu", ultimate: "Cataclysme du Sage" },
			{ minLevel: 50, name: "Koji Kashin (Le Heros)", power: 96, basic: "Frappe du Sage", ultimate: "Creation du Sage" }
		]
	},
	{
		id: 46, key: "delta", clan: "🤖 Clan des Robots",
		emoji: "🤖",
		stages: [
			{ minLevel: 1, name: "Delta (Robot)", power: 40, basic: "Laser", ultimate: "Explosion Laser" },
			{ minLevel: 14, name: "Delta (Guerrier)", power: 54, basic: "Danse Laser", ultimate: "Tempete Laser" },
			{ minLevel: 30, name: "Delta (Sentinelle)", power: 72, basic: "Frappe Laser", ultimate: "Cataclysme Laser" },
			{ minLevel: 48, name: "Delta (Deesse Robot)", power: 90, basic: "Laser Supreme", ultimate: "Creation Laser" }
		]
	},
	{
		id: 47, key: "amado", clan: "🔬 Clan des Scientists",
		emoji: "🔬",
		stages: [
			{ minLevel: 1, name: "Amado (Scientifique)", power: 30, basic: "Analyse", ultimate: "Creation de Jutsu" },
			{ minLevel: 10, name: "Amado (Inventeur)", power: 42, basic: "Invention", ultimate: "Creation de Chakra" },
			{ minLevel: 25, name: "Amado (Genie)", power: 58, basic: "Innovation", ultimate: "Creation Divine" },
			{ minLevel: 42, name: "Amado (Le Createur)", power: 76, basic: "Frappe de l'Innovation", ultimate: "Creation de la Vie" }
		]
	},
	{
		id: 48, key: "kashin_koji", clan: "🔥 Clan des Feux",
		emoji: "🔥",
		stages: [
			{ minLevel: 1, name: "Kashin Koji (Clone)", power: 42, basic: "Boule de Feu", ultimate: "Sceau du Destin" },
			{ minLevel: 14, name: "Kashin Koji (Eveille)", power: 56, basic: "Danse du Feu", ultimate: "Eveil du Sage" },
			{ minLevel: 30, name: "Kashin Koji (Le Guerrier)", power: 74, basic: "Tempete de Feu", ultimate: "Cataclysme du Feu" },
			{ minLevel: 48, name: "Kashin Koji (Le Heros)", power: 92, basic: "Frappe du Feu", ultimate: "Creation du Feu" }
		]
	},
	// 49-60: Personnages originaux (elements)
	{
		id: 49, key: "akai", clan: "🔥 Clan du Feu",
		emoji: "🔥",
		stages: [
			{ minLevel: 1, name: "Akai (Eveille)", power: 38, basic: "Boule de Feu", ultimate: "Explosion de Feu" },
			{ minLevel: 12, name: "Akai (Guerrier du Feu)", power: 52, basic: "Danse du Feu", ultimate: "Tempete de Feu" },
			{ minLevel: 28, name: "Akai (Sage du Feu)", power: 70, basic: "Frappe du Feu", ultimate: "Cataclysme de Feu" },
			{ minLevel: 45, name: "Akai (Dieu du Feu)", power: 88, basic: "Feu Divine", ultimate: "Creation de Feu" }
		]
	},
	{
		id: 50, key: "aoi", clan: "💙 Clan de l'Eau",
		emoji: "💙",
		stages: [
			{ minLevel: 1, name: "Aoi (Eveille)", power: 38, basic: "Eau de la Vie", ultimate: "Explosion d'Eau" },
			{ minLevel: 12, name: "Aoi (Guerrier de l'Eau)", power: 52, basic: "Danse de l'Eau", ultimate: "Tempete d'Eau" },
			{ minLevel: 28, name: "Aoi (Sage de l'Eau)", power: 70, basic: "Frappe de l'Eau", ultimate: "Cataclysme d'Eau" },
			{ minLevel: 45, name: "Aoi (Dieu de l'Eau)", power: 88, basic: "Eau Divine", ultimate: "Creation de l'Eau" }
		]
	},
	{
		id: 51, key: "kaze", clan: "🌪️ Clan du Vent",
		emoji: "🌪️",
		stages: [
			{ minLevel: 1, name: "Kaze (Eveille)", power: 38, basic: "Vent de Vie", ultimate: "Explosion de Vent" },
			{ minLevel: 12, name: "Kaze (Guerrier du Vent)", power: 52, basic: "Danse du Vent", ultimate: "Tempete de Vent" },
			{ minLevel: 28, name: "Kaze (Sage du Vent)", power: 70, basic: "Frappe du Vent", ultimate: "Cataclysme de Vent" },
			{ minLevel: 45, name: "Kaze (Dieu du Vent)", power: 88, basic: "Vent Divine", ultimate: "Creation du Vent" }
		]
	},
	{
		id: 52, key: "riku", clan: "🌍 Clan de la Terre",
		emoji: "🌍",
		stages: [
			{ minLevel: 1, name: "Riku (Eveille)", power: 38, basic: "Terre de Vie", ultimate: "Explosion de Terre" },
			{ minLevel: 12, name: "Riku (Guerrier de la Terre)", power: 52, basic: "Danse de la Terre", ultimate: "Tempete de Terre" },
			{ minLevel: 28, name: "Riku (Sage de la Terre)", power: 70, basic: "Frappe de la Terre", ultimate: "Cataclysme de Terre" },
			{ minLevel: 45, name: "Riku (Dieu de la Terre)", power: 88, basic: "Terre Divine", ultimate: "Creation de la Terre" }
		]
	},
	{
		id: 53, key: "kuro", clan: "🖤 Clan de l'Ombre",
		emoji: "🖤",
		stages: [
			{ minLevel: 1, name: "Kuro (Eveille)", power: 38, basic: "Ombre de la Nuit", ultimate: "Tempete d'Ombre" },
			{ minLevel: 12, name: "Kuro (Guerrier de l'Ombre)", power: 52, basic: "Danse de l'Ombre", ultimate: "Cataclysme d'Ombre" },
			{ minLevel: 28, name: "Kuro (Sage de l'Ombre)", power: 70, basic: "Frappe de l'Ombre", ultimate: "Creation d'Ombre" },
			{ minLevel: 45, name: "Kuro (Dieu de l'Ombre)", power: 88, basic: "Ombre Divine", ultimate: "Creation de l'Ombre" }
		]
	},
	{
		id: 54, key: "shiro", clan: "🤍 Clan de la Lumiere",
		emoji: "🤍",
		stages: [
			{ minLevel: 1, name: "Shiro (Eveille)", power: 40, basic: "Lumiere de la Vie", ultimate: "Explosion de Lumiere" },
			{ minLevel: 14, name: "Shiro (Guerrier de la Lumiere)", power: 54, basic: "Danse de la Lumiere", ultimate: "Tempete de Lumiere" },
			{ minLevel: 30, name: "Shiro (Sage de la Lumiere)", power: 72, basic: "Frappe de la Lumiere", ultimate: "Cataclysme de Lumiere" },
			{ minLevel: 48, name: "Shiro (Dieu de la Lumiere)", power: 90, basic: "Lumiere Divine", ultimate: "Creation de la Lumiere" }
		]
	},
	{
		id: 55, key: "yuki", clan: "❄️ Clan de la Neige",
		emoji: "❄️",
		stages: [
			{ minLevel: 1, name: "Yuki (Eveille)", power: 38, basic: "Neige de Vie", ultimate: "Tempete de Neige" },
			{ minLevel: 12, name: "Yuki (Guerrier de la Neige)", power: 52, basic: "Danse de la Neige", ultimate: "Cataclysme de Neige" },
			{ minLevel: 28, name: "Yuki (Sage de la Neige)", power: 70, basic: "Frappe de la Neige", ultimate: "Creation de Neige" },
			{ minLevel: 45, name: "Yuki (Dieu de la Neige)", power: 88, basic: "Neige Divine", ultimate: "Creation de l'Hiver" }
		]
	},
	{
		id: 56, key: "haruki", clan: "🌅 Clan du Soleil",
		emoji: "🌅",
		stages: [
			{ minLevel: 1, name: "Haruki (Eveille)", power: 40, basic: "Lumiere du Soleil", ultimate: "Explosion Solaire" },
			{ minLevel: 14, name: "Haruki (Guerrier du Soleil)", power: 54, basic: "Danse du Soleil", ultimate: "Tempete Solaire" },
			{ minLevel: 30, name: "Haruki (Sage du Soleil)", power: 72, basic: "Frappe du Soleil", ultimate: "Cataclysme Solaire" },
			{ minLevel: 48, name: "Haruki (Dieu du Soleil)", power: 90, basic: "Soleil Divine", ultimate: "Creation de la Lumiere" }
		]
	},
	{
		id: 57, key: "sora", clan: "🌌 Clan du Ciel",
		emoji: "🌌",
		stages: [
			{ minLevel: 1, name: "Sora (Eveille)", power: 38, basic: "Vent de Vie", ultimate: "Explosion Celeste" },
			{ minLevel: 12, name: "Sora (Guerrier du Ciel)", power: 52, basic: "Danse du Ciel", ultimate: "Tempete Celeste" },
			{ minLevel: 28, name: "Sora (Sage du Ciel)", power: 70, basic: "Frappe du Ciel", ultimate: "Cataclysme Celeste" },
			{ minLevel: 45, name: "Sora (Dieu du Ciel)", power: 88, basic: "Ciel Divine", ultimate: "Creation du Ciel" }
		]
	},
	{
		id: 58, key: "kaito", clan: "🌊 Clan de la Mer",
		emoji: "🌊",
		stages: [
			{ minLevel: 1, name: "Kaito (Eveille)", power: 40, basic: "Vague de Vie", ultimate: "Explosion Marine" },
			{ minLevel: 14, name: "Kaito (Guerrier de la Mer)", power: 54, basic: "Danse de la Mer", ultimate: "Tempete Marine" },
			{ minLevel: 30, name: "Kaito (Sage de la Mer)", power: 72, basic: "Frappe de la Mer", ultimate: "Cataclysme Marin" },
			{ minLevel: 48, name: "Kaito (Dieu de la Mer)", power: 90, basic: "Mer Divine", ultimate: "Creation de la Mer" }
		]
	},
	{
		id: 59, key: "hana", clan: "🌸 Clan des Fleurs",
		emoji: "🌸",
		stages: [
			{ minLevel: 1, name: "Hana (Eveille)", power: 36, basic: "Fleur de Vie", ultimate: "Danse des Fleurs" },
			{ minLevel: 12, name: "Hana (Guerrier des Fleurs)", power: 50, basic: "Tempete de Fleurs", ultimate: "Cataclysme Floral" },
			{ minLevel: 28, name: "Hana (Sage des Fleurs)", power: 68, basic: "Frappe des Fleurs", ultimate: "Creation de Fleurs" },
			{ minLevel: 45, name: "Hana (Deesse des Fleurs)", power: 86, basic: "Fleur Divine", ultimate: "Creation de la Vie" }
		]
	},
	{
		id: 60, key: "akira", clan: "🔮 Clan des Etoiles",
		emoji: "🔮",
		stages: [
			{ minLevel: 1, name: "Akira (Eveille)", power: 42, basic: "Etoile Filante", ultimate: "Tempete d'Etoiles" },
			{ minLevel: 14, name: "Akira (Guerrier des Etoiles)", power: 56, basic: "Danse des Etoiles", ultimate: "Cataclysme Stellare" },
			{ minLevel: 30, name: "Akira (Sage des Etoiles)", power: 74, basic: "Frappe des Etoiles", ultimate: "Creation Stellare" },
			{ minLevel: 48, name: "Akira (Dieu des Etoiles)", power: 92, basic: "Etoile Divine", ultimate: "Creation de l'Univers" }
		]
	},
	// 61-72: Personnages saisonniers
	{
		id: 61, key: "haru", clan: "🌱 Clan du Printemps",
		emoji: "🌱",
		stages: [
			{ minLevel: 1, name: "Haru (Eveille)", power: 34, basic: "Printemps de Vie", ultimate: "Explosion de Printemps" },
			{ minLevel: 10, name: "Haru (Guerrier du Printemps)", power: 48, basic: "Danse du Printemps", ultimate: "Tempete de Printemps" },
			{ minLevel: 25, name: "Haru (Sage du Printemps)", power: 64, basic: "Frappe du Printemps", ultimate: "Cataclysme de Printemps" },
			{ minLevel: 42, name: "Haru (Dieu du Printemps)", power: 82, basic: "Printemps Divine", ultimate: "Creation du Printemps" }
		]
	},
	{
		id: 62, key: "natsu", clan: "☀️ Clan de l'Ete",
		emoji: "☀️",
		stages: [
			{ minLevel: 1, name: "Natsu (Eveille)", power: 36, basic: "Ete de Vie", ultimate: "Explosion d'Ete" },
			{ minLevel: 12, name: "Natsu (Guerrier de l'Ete)", power: 50, basic: "Danse de l'Ete", ultimate: "Tempete d'Ete" },
			{ minLevel: 28, name: "Natsu (Sage de l'Ete)", power: 68, basic: "Frappe de l'Ete", ultimate: "Cataclysme d'Ete" },
			{ minLevel: 45, name: "Natsu (Dieu de l'Ete)", power: 86, basic: "Ete Divine", ultimate: "Creation de l'Ete" }
		]
	},
	{
		id: 63, key: "aki", clan: "🍂 Clan de l'Automne",
		emoji: "🍂",
		stages: [
			{ minLevel: 1, name: "Aki (Eveille)", power: 34, basic: "Automne de Vie", ultimate: "Explosion d'Automne" },
			{ minLevel: 10, name: "Aki (Guerrier de l'Automne)", power: 48, basic: "Danse de l'Automne", ultimate: "Tempete d'Automne" },
			{ minLevel: 25, name: "Aki (Sage de l'Automne)", power: 64, basic: "Frappe de l'Automne", ultimate: "Cataclysme d'Automne" },
			{ minLevel: 42, name: "Aki (Dieu de l'Automne)", power: 82, basic: "Automne Divine", ultimate: "Creation de l'Automne" }
		]
	},
	{
		id: 64, key: "fuyu", clan: "❄️ Clan de l'Hiver",
		emoji: "❄️",
		stages: [
			{ minLevel: 1, name: "Fuyu (Eveille)", power: 36, basic: "Hiver de Vie", ultimate: "Explosion d'Hiver" },
			{ minLevel: 12, name: "Fuyu (Guerrier de l'Hiver)", power: 50, basic: "Danse de l'Hiver", ultimate: "Tempete d'Hiver" },
			{ minLevel: 28, name: "Fuyu (Sage de l'Hiver)", power: 68, basic: "Frappe de l'Hiver", ultimate: "Cataclysme d'Hiver" },
			{ minLevel: 45, name: "Fuyu (Dieu de l'Hiver)", power: 86, basic: "Hiver Divine", ultimate: "Creation de l'Hiver" }
		]
	},
	{
		id: 65, key: "yuga", clan: "🌓 Clan du Crepuscule",
		emoji: "🌓",
		stages: [
			{ minLevel: 1, name: "Yuga (Eveille)", power: 38, basic: "Crepuscule de Vie", ultimate: "Explosion de Crepuscule" },
			{ minLevel: 12, name: "Yuga (Guerrier du Crepuscule)", power: 52, basic: "Danse du Crepuscule", ultimate: "Tempete de Crepuscule" },
			{ minLevel: 28, name: "Yuga (Sage du Crepuscule)", power: 70, basic: "Frappe du Crepuscule", ultimate: "Cataclysme de Crepuscule" },
			{ minLevel: 45, name: "Yuga (Dieu du Crepuscule)", power: 88, basic: "Crepuscule Divine", ultimate: "Creation du Crepuscule" }
		]
	},
	{
		id: 66, key: "asuka", clan: "🌄 Clan de l'Aube",
		emoji: "🌄",
		stages: [
			{ minLevel: 1, name: "Asuka (Eveille)", power: 36, basic: "Aube de Vie", ultimate: "Explosion de l'Aube" },
			{ minLevel: 12, name: "Asuka (Guerrier de l'Aube)", power: 50, basic: "Danse de l'Aube", ultimate: "Tempete de l'Aube" },
			{ minLevel: 28, name: "Asuka (Sage de l'Aube)", power: 68, basic: "Frappe de l'Aube", ultimate: "Cataclysme de l'Aube" },
			{ minLevel: 45, name: "Asuka (Deesse de l'Aube)", power: 86, basic: "Aube Divine", ultimate: "Creation de l'Aube" }
		]
	},
	{
		id: 67, key: "tenma", clan: "⭐ Clan des Constellations",
		emoji: "⭐",
		stages: [
			{ minLevel: 1, name: "Tenma (Eveille)", power: 40, basic: "Constellation de Vie", ultimate: "Explosion de Constellations" },
			{ minLevel: 14, name: "Tenma (Guerrier des Constellations)", power: 54, basic: "Danse des Constellations", ultimate: "Tempete de Constellations" },
			{ minLevel: 30, name: "Tenma (Sage des Constellations)", power: 72, basic: "Frappe des Constellations", ultimate: "Cataclysme de Constellations" },
			{ minLevel: 48, name: "Tenma (Dieu des Constellations)", power: 90, basic: "Constellation Divine", ultimate: "Creation des Constellations" }
		]
	},
	{
		id: 68, key: "orihime", clan: "✨ Clan des Voeux",
		emoji: "✨",
		stages: [
			{ minLevel: 1, name: "Orihime (Eveille)", power: 32, basic: "Voeu de Vie", ultimate: "Explosion de Voeux" },
			{ minLevel: 10, name: "Orihime (Guerrier des Voeux)", power: 46, basic: "Danse des Voeux", ultimate: "Tempete de Voeux" },
			{ minLevel: 25, name: "Orihime (Sage des Voeux)", power: 62, basic: "Frappe des Voeux", ultimate: "Cataclysme de Voeux" },
			{ minLevel: 42, name: "Orihime (Deesse des Voeux)", power: 80, basic: "Voeu Divine", ultimate: "Creation des Voeux" }
		]
	},
	{
		id: 69, key: "hikari", clan: "💡 Clan de la Lumiere",
		emoji: "💡",
		stages: [
			{ minLevel: 1, name: "Hikari (Eveille)", power: 34, basic: "Lumiere de Vie", ultimate: "Explosion de Lumiere" },
			{ minLevel: 10, name: "Hikari (Guerrier de la Lumiere)", power: 48, basic: "Danse de la Lumiere", ultimate: "Tempete de Lumiere" },
			{ minLevel: 25, name: "Hikari (Sage de la Lumiere)", power: 64, basic: "Frappe de la Lumiere", ultimate: "Cataclysme de Lumiere" },
			{ minLevel: 42, name: "Hikari (Dieu de la Lumiere)", power: 82, basic: "Lumiere Divine", ultimate: "Creation de la Lumiere" }
		]
	},
	{
		id: 70, key: "mao", clan: "🐉 Clan du Dragon",
		emoji: "🐉",
		stages: [
			{ minLevel: 1, name: "Mao (Eveille)", power: 42, basic: "Dragon de Vie", ultimate: "Explosion de Dragon" },
			{ minLevel: 14, name: "Mao (Guerrier du Dragon)", power: 56, basic: "Danse du Dragon", ultimate: "Tempete de Dragon" },
			{ minLevel: 30, name: "Mao (Sage du Dragon)", power: 74, basic: "Frappe du Dragon", ultimate: "Cataclysme de Dragon" },
			{ minLevel: 48, name: "Mao (Dieu du Dragon)", power: 92, basic: "Dragon Divine", ultimate: "Creation du Dragon" }
		]
	},
	{
		id: 71, key: "midori", clan: "🌿 Clan de la Foret",
		emoji: "🌿",
		stages: [
			{ minLevel: 1, name: "Midori (Eveille)", power: 36, basic: "Bois de la Vie", ultimate: "Foret de la Vie" },
			{ minLevel: 12, name: "Midori (Guerrier de la Foret)", power: 50, basic: "Danse de la Foret", ultimate: "Tempete de Bois" },
			{ minLevel: 28, name: "Midori (Sage de la Foret)", power: 68, basic: "Frappe de la Foret", ultimate: "Cataclysme de Bois" },
			{ minLevel: 45, name: "Midori (Dieu de la Foret)", power: 86, basic: "Bois Divine", ultimate: "Creation de la Foret" }
		]
	},
	{
		id: 72, key: "kiri", clan: "🌫️ Clan du Brouillard",
		emoji: "🌫️",
		stages: [
			{ minLevel: 1, name: "Kiri (Eveille)", power: 34, basic: "Brouillard de Vie", ultimate: "Explosion de Brouillard" },
			{ minLevel: 10, name: "Kiri (Guerrier du Brouillard)", power: 48, basic: "Danse du Brouillard", ultimate: "Tempete de Brouillard" },
			{ minLevel: 25, name: "Kiri (Sage du Brouillard)", power: 64, basic: "Frappe du Brouillard", ultimate: "Cataclysme de Brouillard" },
			{ minLevel: 42, name: "Kiri (Dieu du Brouillard)", power: 82, basic: "Brouillard Divine", ultimate: "Creation du Brouillard" }
		]
	},
	// 73-84: Personnages mythiques
	{
		id: 73, key: "raijin", clan: "⚡ Clan de la Foudre",
		emoji: "⚡",
		stages: [
			{ minLevel: 1, name: "Raijin (Eveille)", power: 44, basic: "Foudre de Vie", ultimate: "Explosion Electrique" },
			{ minLevel: 16, name: "Raijin (Guerrier de la Foudre)", power: 58, basic: "Danse de la Foudre", ultimate: "Tempete Electrique" },
			{ minLevel: 32, name: "Raijin (Sage de la Foudre)", power: 76, basic: "Frappe de la Foudre", ultimate: "Cataclysme Electrique" },
			{ minLevel: 50, name: "Raijin (Dieu de la Foudre)", power: 94, basic: "Foudre Divine", ultimate: "Creation de la Foudre" }
		]
	},
	{
		id: 74, key: "fujin", clan: "🌪️ Clan du Vent",
		emoji: "🌪️",
		stages: [
			{ minLevel: 1, name: "Fujin (Eveille)", power: 44, basic: "Vent de Vie", ultimate: "Explosion de Vent" },
			{ minLevel: 16, name: "Fujin (Guerrier du Vent)", power: 58, basic: "Danse du Vent", ultimate: "Tempete de Vent" },
			{ minLevel: 32, name: "Fujin (Sage du Vent)", power: 76, basic: "Frappe du Vent", ultimate: "Cataclysme de Vent" },
			{ minLevel: 50, name: "Fujin (Dieu du Vent)", power: 94, basic: "Vent Divine", ultimate: "Creation du Vent" }
		]
	},
	{
		id: 75, key: "suijin", clan: "🌊 Clan de l'Eau",
		emoji: "🌊",
		stages: [
			{ minLevel: 1, name: "Suijin (Eveille)", power: 42, basic: "Eau de Vie", ultimate: "Explosion d'Eau" },
			{ minLevel: 14, name: "Suijin (Guerrier de l'Eau)", power: 56, basic: "Danse de l'Eau", ultimate: "Tempete d'Eau" },
			{ minLevel: 30, name: "Suijin (Sage de l'Eau)", power: 74, basic: "Frappe de l'Eau", ultimate: "Cataclysme d'Eau" },
			{ minLevel: 48, name: "Suijin (Dieu de l'Eau)", power: 92, basic: "Eau Divine", ultimate: "Creation de l'Eau" }
		]
	},
	{
		id: 76, key: "kajin", clan: "🔥 Clan du Feu",
		emoji: "🔥",
		stages: [
			{ minLevel: 1, name: "Kajin (Eveille)", power: 42, basic: "Feu de Vie", ultimate: "Explosion de Feu" },
			{ minLevel: 14, name: "Kajin (Guerrier du Feu)", power: 56, basic: "Danse du Feu", ultimate: "Tempete de Feu" },
			{ minLevel: 30, name: "Kajin (Sage du Feu)", power: 74, basic: "Frappe du Feu", ultimate: "Cataclysme de Feu" },
			{ minLevel: 48, name: "Kajin (Dieu du Feu)", power: 92, basic: "Feu Divine", ultimate: "Creation du Feu" }
		]
	},
	{
		id: 77, key: "shinju", clan: "🌳 Clan de la Vie",
		emoji: "🌳",
		stages: [
			{ minLevel: 1, name: "Shinju (Eveille)", power: 40, basic: "Arbre de Vie", ultimate: "Foret de Vie" },
			{ minLevel: 14, name: "Shinju (Guerrier de la Vie)", power: 54, basic: "Danse de la Vie", ultimate: "Tempete de Vie" },
			{ minLevel: 30, name: "Shinju (Sage de la Vie)", power: 72, basic: "Frappe de la Vie", ultimate: "Cataclysme de Vie" },
			{ minLevel: 48, name: "Shinju (Dieu de la Vie)", power: 90, basic: "Vie Divine", ultimate: "Creation de la Vie" }
		]
	},
	{
		id: 78, key: "kagutsuchi", clan: "🔥 Clan du Feu Sacre",
		emoji: "🔥",
		stages: [
			{ minLevel: 1, name: "Kagutsuchi (Eveille)", power: 46, basic: "Feu Sacre", ultimate: "Explosion Sacree" },
			{ minLevel: 18, name: "Kagutsuchi (Guerrier Sacre)", power: 60, basic: "Danse Sacree", ultimate: "Tempete Sacree" },
			{ minLevel: 34, name: "Kagutsuchi (Sage Sacre)", power: 78, basic: "Frappe Sacree", ultimate: "Cataclysme Sacre" },
			{ minLevel: 52, name: "Kagutsuchi (Dieu Sacre)", power: 96, basic: "Feu Divin", ultimate: "Creation Sacree" }
		]
	},
	{
		id: 79, key: "amaterasu", clan: "🌞 Clan du Soleil Divin",
		emoji: "🌞",
		stages: [
			{ minLevel: 1, name: "Amaterasu (Eveille)", power: 48, basic: "Lumiere Divine", ultimate: "Explosion Divine" },
			{ minLevel: 20, name: "Amaterasu (Guerrier Divin)", power: 62, basic: "Danse Divine", ultimate: "Tempete Divine" },
			{ minLevel: 36, name: "Amaterasu (Sage Divin)", power: 80, basic: "Frappe Divine", ultimate: "Cataclysme Divin" },
			{ minLevel: 54, name: "Amaterasu (Deesse Divine)", power: 98, basic: "Lumiere Celeste", ultimate: "Creation Divine" }
		]
	},
	{
		id: 80, key: "tsukuyomi", clan: "🌙 Clan de la Lune",
		emoji: "🌙",
		stages: [
			{ minLevel: 1, name: "Tsukuyomi (Eveille)", power: 46, basic: "Lumiere Lunaire", ultimate: "Explosion Lunaire" },
			{ minLevel: 18, name: "Tsukuyomi (Guerrier Lunaire)", power: 60, basic: "Danse Lunaire", ultimate: "Tempete Lunaire" },
			{ minLevel: 34, name: "Tsukuyomi (Sage Lunaire)", power: 78, basic: "Frappe Lunaire", ultimate: "Cataclysme Lunaire" },
			{ minLevel: 52, name: "Tsukuyomi (Dieu Lunaire)", power: 96, basic: "Lumiere de la Lune", ultimate: "Creation Lunaire" }
		]
	},
	// 81-92: Personnages legendaires finaux
	{
		id: 81, key: "izanagi", clan: "🌀 Clan de la Creation",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Izanagi (Eveille)", power: 50, basic: "Creation de Vie", ultimate: "Explosion de Creation" },
			{ minLevel: 22, name: "Izanagi (Guerrier de la Creation)", power: 64, basic: "Danse de la Creation", ultimate: "Tempete de Creation" },
			{ minLevel: 38, name: "Izanagi (Sage de la Creation)", power: 82, basic: "Frappe de la Creation", ultimate: "Cataclysme de Creation" },
			{ minLevel: 56, name: "Izanagi (Dieu de la Creation)", power: 100, basic: "Creation Divine", ultimate: "Creation de l'Univers" }
		]
	},
	{
		id: 82, key: "izanami", clan: "🌀 Clan de la Destinee",
		emoji: "🌀",
		stages: [
			{ minLevel: 1, name: "Izanami (Eveille)", power: 48, basic: "Destinee de Vie", ultimate: "Explosion de Destinee" },
			{ minLevel: 20, name: "Izanami (Guerrier de la Destinee)", power: 62, basic: "Danse de la Destinee", ultimate: "Tempete de Destinee" },
			{ minLevel: 36, name: "Izanami (Sage de la Destinee)", power: 80, basic: "Frappe de la Destinee", ultimate: "Cataclysme de Destinee" },
			{ minLevel: 54, name: "Izanami (Deesse de la Destinee)", power: 98, basic: "Destinee Divine", ultimate: "Creation de la Destinee" }
		]
	},
	{
		id: 83, key: "susanoo", clan: "⚔️ Clan de la Foudre",
		emoji: "⚔️",
		stages: [
			{ minLevel: 1, name: "Susanoo (Eveille)", power: 52, basic: "Epee de Foudre", ultimate: "Explosion de Foudre" },
			{ minLevel: 24, name: "Susanoo (Guerrier de la Foudre)", power: 66, basic: "Danse de la Foudre", ultimate: "Tempete de Foudre" },
			{ minLevel: 40, name: "Susanoo (Sage de la Foudre)", power: 84, basic: "Frappe de la Foudre", ultimate: "Cataclysme de Foudre" },
			{ minLevel: 58, name: "Susanoo (Dieu de la Foudre)", power: 102, basic: "Foudre Divine", ultimate: "Creation de la Foudre" }
		]
	},
	{
		id: 84, key: "okami", clan: "🐺 Clan du Loup",
		emoji: "🐺",
		stages: [
			{ minLevel: 1, name: "Okami (Eveille)", power: 38, basic: "Hurlement", ultimate: "Meute de Loups" },
			{ minLevel: 12, name: "Okami (Guerrier Loup)", power: 52, basic: "Danse du Loup", ultimate: "Tempete de Loups" },
			{ minLevel: 28, name: "Okami (Sage Loup)", power: 70, basic: "Frappe du Loup", ultimate: "Cataclysme de Loups" },
			{ minLevel: 45, name: "Okami (Dieu Loup)", power: 88, basic: "Loup Divine", ultimate: "Creation de la Meute" }
		]
	},
	{
		id: 85, key: "tengu", clan: "👹 Clan des Tengu",
		emoji: "👹",
		stages: [
			{ minLevel: 1, name: "Tengu (Eveille)", power: 40, basic: "Ailes de Tengu", ultimate: "Explosion Tengu" },
			{ minLevel: 14, name: "Tengu (Guerrier Tengu)", power: 54, basic: "Danse Tengu", ultimate: "Tempete Tengu" },
			{ minLevel: 30, name: "Tengu (Sage Tengu)", power: 72, basic: "Frappe Tengu", ultimate: "Cataclysme Tengu" },
			{ minLevel: 48, name: "Tengu (Dieu Tengu)", power: 90, basic: "Tengu Divine", ultimate: "Creation Tengu" }
		]
	},
	{
		id: 86, key: "kappa", clan: "🐢 Clan des Kappa",
		emoji: "🐢",
		stages: [
			{ minLevel: 1, name: "Kappa (Eveille)", power: 36, basic: "Eau de Kappa", ultimate: "Explosion Kappa" },
			{ minLevel: 12, name: "Kappa (Guerrier Kappa)", power: 50, basic: "Danse Kappa", ultimate: "Tempete Kappa" },
			{ minLevel: 28, name: "Kappa (Sage Kappa)", power: 68, basic: "Frappe Kappa", ultimate: "Cataclysme Kappa" },
			{ minLevel: 45, name: "Kappa (Dieu Kappa)", power: 86, basic: "Kappa Divine", ultimate: "Creation Kappa" }
		]
	},
	{
		id: 87, key: "kitsune", clan: "🦊 Clan des Kitsune",
		emoji: "🦊",
		stages: [
			{ minLevel: 1, name: "Kitsune (Eveille)", power: 38, basic: "Queue de Kitsune", ultimate: "Explosion Kitsune" },
			{ minLevel: 12, name: "Kitsune (Guerrier Kitsune)", power: 52, basic: "Danse Kitsune", ultimate: "Tempete Kitsune" },
			{ minLevel: 28, name: "Kitsune (Sage Kitsune)", power: 70, basic: "Frappe Kitsune", ultimate: "Cataclysme Kitsune" },
			{ minLevel: 45, name: "Kitsune (Dieu Kitsune)", power: 88, basic: "Kitsune Divine", ultimate: "Creation Kitsune" }
		]
	},
	{
		id: 88, key: "ryu", clan: "🐉 Clan du Dragon Celeste",
		emoji: "🐉",
		stages: [
			{ minLevel: 1, name: "Ryu (Eveille)", power: 44, basic: "Ecailles de Dragon", ultimate: "Explosion de Dragon" },
			{ minLevel: 16, name: "Ryu (Guerrier Dragon)", power: 58, basic: "Danse du Dragon", ultimate: "Tempete de Dragon" },
			{ minLevel: 32, name: "Ryu (Sage Dragon)", power: 76, basic: "Frappe du Dragon", ultimate: "Cataclysme de Dragon" },
			{ minLevel: 50, name: "Ryu (Dieu Dragon)", power: 94, basic: "Dragon Divine", ultimate: "Creation du Dragon" }
		]
	},
	{
		id: 89, key: "shishi", clan: "🦁 Clan du Lion",
		emoji: "🦁",
		stages: [
			{ minLevel: 1, name: "Shishi (Eveille)", power: 40, basic: "Rugissement", ultimate: "Explosion de Lion" },
			{ minLevel: 14, name: "Shishi (Guerrier Lion)", power: 54, basic: "Danse du Lion", ultimate: "Tempete de Lion" },
			{ minLevel: 30, name: "Shishi (Sage Lion)", power: 72, basic: "Frappe du Lion", ultimate: "Cataclysme de Lion" },
			{ minLevel: 48, name: "Shishi (Dieu Lion)", power: 90, basic: "Lion Divine", ultimate: "Creation du Lion" }
		]
	},
	{
		id: 90, key: "tora", clan: "🐯 Clan du Tigre",
		emoji: "🐯",
		stages: [
			{ minLevel: 1, name: "Tora (Eveille)", power: 42, basic: "Griffe de Tigre", ultimate: "Explosion de Tigre" },
			{ minLevel: 14, name: "Tora (Guerrier Tigre)", power: 56, basic: "Danse du Tigre", ultimate: "Tempete de Tigre" },
			{ minLevel: 30, name: "Tora (Sage Tigre)", power: 74, basic: "Frappe du Tigre", ultimate: "Cataclysme de Tigre" },
			{ minLevel: 48, name: "Tora (Dieu Tigre)", power: 92, basic: "Tigre Divine", ultimate: "Creation du Tigre" }
		]
	},
	{
		id: 91, key: "hebi", clan: "🐍 Clan du Serpent",
		emoji: "🐍",
		stages: [
			{ minLevel: 1, name: "Hebi (Eveille)", power: 36, basic: "Morsure de Serpent", ultimate: "Explosion de Serpent" },
			{ minLevel: 12, name: "Hebi (Guerrier Serpent)", power: 50, basic: "Danse du Serpent", ultimate: "Tempete de Serpent" },
			{ minLevel: 28, name: "Hebi (Sage Serpent)", power: 68, basic: "Frappe du Serpent", ultimate: "Cataclysme de Serpent" },
			{ minLevel: 45, name: "Hebi (Dieu Serpent)", power: 86, basic: "Serpent Divine", ultimate: "Creation du Serpent" }
		]
	},
	{
		id: 92, key: "saru", clan: "🐵 Clan du Singe",
		emoji: "🐵",
		stages: [
			{ minLevel: 1, name: "Saru (Eveille)", power: 34, basic: "Queue de Singe", ultimate: "Explosion de Singe" },
			{ minLevel: 10, name: "Saru (Guerrier Singe)", power: 48, basic: "Danse du Singe", ultimate: "Tempete de Singe" },
			{ minLevel: 25, name: "Saru (Sage Singe)", power: 64, basic: "Frappe du Singe", ultimate: "Cataclysme de Singe" },
			{ minLevel: 42, name: "Saru (Dieu Singe)", power: 82, basic: "Singe Divine", ultimate: "Creation du Singe" }
		]
	}
];

// ============================================================
// QUESTS
// ============================================================
const QUESTS = [
	{ id: 1, name: "Bandits de la Foret de Konoha", minLevel: 1, enemyName: "Bandit Renegat", enemyPower: 30, xp: 40, gold: 150 },
	{ id: 2, name: "Espion du Village d'Oto", minLevel: 5, enemyName: "Espion d'Oto", enemyPower: 42, xp: 70, gold: 300 },
	{ id: 3, name: "Marionnettiste de Suna", minLevel: 10, enemyName: "Marionnettiste Anonyme", enemyPower: 55, xp: 110, gold: 500 },
	{ id: 4, name: "Traque du Ninja Deserteur", minLevel: 16, enemyName: "Ninja Deserteur de Rang S", enemyPower: 68, xp: 160, gold: 800 },
	{ id: 5, name: "Infiltration de l'Akatsuki", minLevel: 24, enemyName: "Membre de l'Akatsuki", enemyPower: 82, xp: 230, gold: 1300 },
	{ id: 6, name: "Jinchuriki en Furie", minLevel: 34, enemyName: "Jinchuriki Incontrolable", enemyPower: 98, xp: 320, gold: 2000 },
	{ id: 7, name: "L'Ombre d'un Uchiha Legendaire", minLevel: 45, enemyName: "Spectre Uchiha", enemyPower: 115, xp: 420, gold: 3000 },
	{ id: 8, name: "Le Reveil d'un Otsutsuki", minLevel: 55, enemyName: "Fragment d'Otsutsuki", enemyPower: 135, xp: 600, gold: 5000 },
	{ id: 9, name: "Le Combat des Trois Sannins", minLevel: 40, enemyName: "Orochimaru", enemyPower: 110, xp: 500, gold: 3500 },
	{ id: 10, name: "La Defense de Konoha", minLevel: 50, enemyName: "Obito Uchiha", enemyPower: 125, xp: 550, gold: 4500 },
	{ id: 11, name: "La Menace de Pain", minLevel: 30, enemyName: "Pain (Six Chemins)", enemyPower: 100, xp: 400, gold: 2800 },
	{ id: 12, name: "Le Retour de Madara", minLevel: 48, enemyName: "Madara Uchiha", enemyPower: 130, xp: 580, gold: 4800 },
	{ id: 13, name: "L'Invasion d'Isshiki", minLevel: 56, enemyName: "Isshiki Otsutsuki", enemyPower: 140, xp: 650, gold: 5500 },
	{ id: 14, name: "La Quete du Sage", minLevel: 60, enemyName: "Sage des Six Chemins", enemyPower: 150, xp: 800, gold: 8000 }
];

const MAX_LEVEL = 60;
const TRAIN_COOLDOWN_MS = 15 * 60 * 1000;

function xpForLevel(level) {
	return Math.round(80 * Math.pow(level, 1.35));
}

function getLine(characterId) {
	return CHARACTER_LINES.find(l => l.id === characterId) || null;
}

function getStage(line, level) {
	let stage = line.stages[0];
	for (const s of line.stages) {
		if (level >= s.minLevel) stage = s;
	}
	return stage;
}

function computeStats(line, level) {
	const stage = getStage(line, level);
	const bonus = Math.max(0, level - stage.minLevel) * 0.6;
	return {
		stageName: stage.name,
		power: Math.round(stage.power + bonus),
		basic: stage.basic,
		ultimate: stage.ultimate
	};
}

function addXp(pdata, amount) {
	const line = getLine(pdata.characterId);
	const stageBefore = line ? getStage(line, pdata.level).name : null;
	let leveledUp = false;
	pdata.xp += amount;
	while (pdata.level < MAX_LEVEL && pdata.xp >= xpForLevel(pdata.level)) {
		pdata.xp -= xpForLevel(pdata.level);
		pdata.level += 1;
		leveledUp = true;
	}
	const stageAfter = line ? getStage(line, pdata.level).name : null;
	return { leveledUp, evolved: stageBefore !== stageAfter, newLevel: pdata.level, newStageName: stageAfter };
}

function randomBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDamage(kind, power) {
	const ranges = { basic: [8, 15], special: [15, 25], ultimate: [28, 42] };
	const [mn, mx] = ranges[kind];
	const scale = 0.6 + (power / 100);
	return Math.max(1, Math.round(randomBetween(mn, mx) * scale));
}

function healthColor(hp) {
	if (hp >= 70) return "🟩";
	if (hp >= 35) return "🟨";
	if (hp > 0) return "🟥";
	return "💀";
}

const battles = {};
const userBattle = {};
const pendingDuels = {};

function cleanupBattle(battleId) {
	for (const uid of Object.keys(userBattle)) {
		if (userBattle[uid] === battleId) delete userBattle[uid];
	}
	delete battles[battleId];
}

function resolveTurn(battle, key, letter) {
	const other = key === "p1" ? "p2" : "p1";
	const power = battle.power[key];
	const basicTech = battle.basic[key];
	const ultTech = battle.ultimate[key];

	let damage = 0, tech = "Frappe Basique", missed = false, isCharge = false, isDefend = false, chargeGain = 0;

	switch (letter) {
		case 'a':
			damage = rollDamage('basic', power);
			tech = "Frappe Basique";
			break;
		case 'b':
			if (battle.chakra[key] < 20) { missed = true; tech = basicTech; }
			else { damage = rollDamage('special', power); battle.chakra[key] -= 20; tech = basicTech; }
			break;
		case 'x':
			if (battle.chakra[key] < 45) { missed = true; tech = ultTech; }
			else {
				battle.chakra[key] -= 45;
				if (Math.random() < 0.25) { missed = true; tech = ultTech + " (echouee)"; }
				else { damage = rollDamage('ultimate', power); tech = ultTech; }
			}
			break;
		case 'c':
			chargeGain = 30;
			battle.chakra[key] = Math.min(100, battle.chakra[key] + chargeGain);
			isCharge = true;
			break;
		case 'd':
			battle.defending = key;
			isDefend = true;
			break;
		default:
			return null;
	}

	let blocked = false;
	if (!isCharge && !isDefend && !missed) {
		if (battle.defending === other) {
			damage = Math.floor(damage * 0.45);
			blocked = true;
			battle.defending = null;
		}
		battle.hp[other] = Math.max(0, battle.hp[other] - damage);
	}

	if (letter !== 'c') battle.chakra[key] = Math.min(100, battle.chakra[key] + 5);

	return { key, other, letter, tech, damage, missed, isCharge, isDefend, blocked, chargeGain };
}

function aiChoose(battle) {
	const chakra = battle.chakra.p2;
	const hpSelf = battle.hp.p2;
	const hpEnemy = battle.hp.p1;
	if (chakra >= 45 && (hpEnemy <= 40 || Math.random() < 0.3)) return 'x';
	if (chakra >= 20 && Math.random() < 0.5) return 'b';
	if (hpSelf <= 30 && Math.random() < 0.35) return 'd';
	if (chakra < 20 && Math.random() < 0.4) return 'c';
	return 'a';
}

function formatAction(r, battle) {
	const attackerName = battle.name[r.key];
	const defenderName = battle.name[r.other];
	if (r.isCharge) {
		return `🔋 ${attackerName} accumule du chakra (+${r.chargeGain}%).\n`;
	}
	if (r.isDefend) {
		return `🛡️ ${attackerName} se met en position defensive.\n`;
	}
	if (r.missed) {
		return `⚡ ${attackerName} tente ${r.tech}... ❌ Echec !\n`;
	}
	const blockedTxt = r.blocked ? " (bloquee)" : "";
	return `⚔️ ${attackerName} utilise ${r.tech}${blockedTxt}\n💥 Inflige ${r.damage}% de degats a ${defenderName} !\n`;
}

function statusBars(battle) {
	let msg = `━━━━━━━━━━━━━━\n`;
	msg += `${healthColor(battle.hp.p1)} ${battle.name.p1} — HP ${battle.hp.p1}% | Chakra ${battle.chakra.p1}%\n`;
	msg += `${healthColor(battle.hp.p2)} ${battle.name.p2} — HP ${battle.hp.p2}% | Chakra ${battle.chakra.p2}%\n`;
	msg += `━━━━━━━━━━━━━━\n`;
	return msg;
}

const COMBAT_HELP = `🎮 Commandes disponibles :\n» a — Attaque basique\n» b — Technique speciale (-20 chakra)\n» x — Technique ultime (-45 chakra)\n» c — Charger le chakra (+30%)\n» d — Defense (reduit les degats)\n» fin — Abandonner le combat`;

module.exports = {
	config: {
		name: "naruto",
		aliases: ["nrt", "ninja"],
		version: "1.0",
		author: "Delfa • Christus",
		countDown: 0,
		role: 0,
		category: "game",
		description: {
			en: "Naruto RPG: choose a character, level it up, complete quests and duel other players"
		},
		guide: {
			en: "{pn} help to see all commands"
		}
	},

	langs: {
		en: {
			help: "Naruto RPG commands list"
		}
	},

	onLoad: function () {
		ensureFonts();
	},

	onStart: async function ({ message, args, event, usersData, api }) {
		const { senderID, threadID } = event;
		const command = (args[0] || "").toLowerCase();

		let user = await usersData.get(senderID);
		if (!user) user = { money: 0, exp: 0, data: {} };
		if (!user.data) user.data = {};
		if (!user.data.naruto) {
			user.data.naruto = {
				characterId: null,
				level: 1,
				xp: 0,
				wins: 0,
				losses: 0,
				lastTrain: null,
				lastQuestId: null,
				createdAt: Date.now(),
				rank: "Genin",
				completedQuests: [],
				items: []
			};
		}
		const pdata = user.data.naruto;

		const save = async () => { await usersData.set(senderID, user); };

		switch (command) {
			case "help":
			case undefined:
			case "":
				return this.showHelp(message, fonts);

			case "choose":
			case "select":
				return this.chooseCharacter(message, args, pdata, fonts, save, usersData, senderID);

			case "profile":
			case "card":
			case "stats":
				return this.showProfile(message, pdata, fonts, usersData, senderID);

			case "roster":
			case "characters":
			case "list":
				return this.showRoster(message, fonts);

			case "quest":
			case "mission":
				return this.handleQuest(message, args, pdata, fonts, save, senderID, threadID);

			case "train":
			case "entrainement":
				return this.handleTrain(message, pdata, fonts, save, user);

			case "duel":
			case "combat":
				return this.handleDuelChallenge(message, event, pdata, fonts, usersData, senderID, threadID, api);

			case "leaderboard":
			case "classement":
				return this.showLeaderboard(message, fonts, usersData);

			case "rank":
			case "rang":
				return this.showRankInfo(message, pdata, fonts, save);

			case "inventory":
			case "items":
			case "inventaire":
				return this.showInventory(message, pdata, fonts);

			case "stats":
			case "statistiques":
				return this.showDetailedStats(message, pdata, fonts, usersData, senderID);

			case "reset":
			case "reset character":
				return this.resetCharacter(message, pdata, fonts, save);

			case "fin":
			case "quit":
			case "abandon":
			case "cancel": {
				const battleId = userBattle[senderID];
				if (battleId) {
					cleanupBattle(battleId);
					return message.reply(fonts.bold("Le combat a ete abandonne."));
				}
				if (pendingDuels[threadID] && (pendingDuels[threadID].challenger === senderID || pendingDuels[threadID].target === senderID)) {
					delete pendingDuels[threadID];
					return message.reply(fonts.bold("Le defi de duel a ete annule."));
				}
				return message.reply(fonts.bold("Vous n'avez aucun combat ou defi en cours."));
			}

			default:
				return this.showHelp(message, fonts);
		}
	},

	showHelp: function (message, fonts) {
		const helpText = `
${fonts.bold("🍥 NARUTO RPG — MENU")}
━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("🎯 PERSONNAGE")} ${fonts.bold("━━━━━━━━━")}
🎭 naruto choose — Choisir votre personnage (definitif, il evolue ensuite)
📋 naruto profile — Voir votre carte de personnage
📜 naruto roster — Voir la liste des personnages disponibles
🔄 naruto reset — Reinitialiser votre personnage (perte de progression)

${fonts.bold("⚡ PROGRESSION")} ${fonts.bold("━━━━━━━━━")}
🏋️ naruto train — Vous entrainer pour gagner de l'XP et de l'argent
🎯 naruto quest — Voir les quetes disponibles
🎯 naruto quest <numero> — Lancer un combat de quete contre un ennemi
🏅 naruto rank — Voir votre rang et progression

${fonts.bold("⚔️ DUEL ENTRE JOUEURS")} ${fonts.bold("━━━━━━━━━")}
🤺 naruto duel @utilisateur — Defier un autre joueur en duel
Repondez "accepter" ou "refuser" au defi recu

${fonts.bold("🎮 EN COMBAT")} ${fonts.bold("━━━━━━━━━")}
${COMBAT_HELP}

${fonts.bold("📊 AUTRE")} ${fonts.bold("━━━━━━━━━")}
🏆 naruto leaderboard — Classement des meilleurs ninjas
📦 naruto inventory — Voir vos objets et equipements
📈 naruto stats — Statistiques detaillees
❌ naruto fin — Abandonner un combat ou un defi en cours
`;
		return message.reply(helpText);
	},

	chooseCharacter: async function (message, args, pdata, fonts, save, usersData, senderID) {
		if (pdata.characterId) {
			const line = getLine(pdata.characterId);
			const stats = computeStats(line, pdata.level);
			return message.reply(fonts.bold(`Vous avez deja choisi ${stats.stageName}.\nUn personnage ne peut pas etre change, mais il continue d'evoluer avec vous !`));
		}

		const sub = args[1];
		if (!sub) {
			let text = `${fonts.bold("🍥 CHOISISSEZ VOTRE PERSONNAGE")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
			text += `${fonts.bold("⚠️ Attention")} : ce choix est definitif, le personnage evoluera ensuite tout seul.\n\n`;
			const displayLines = CHARACTER_LINES.slice(0, 20);
			displayLines.forEach(line => {
				const base = line.stages[0];
				text += `${line.emoji} ${line.id}. ${base.name} (${line.clan.replace(/[^\w\s]/g, '').trim()}) — Puissance ${base.power}\n`;
				text += `   Base: ${base.basic} | Ultime: ${base.ultimate}\n`;
			});
			text += `\n${fonts.bold("Et " + (CHARACTER_LINES.length - 20) + " autres personnages !")}\n`;
			text += `\nEnvoyez "naruto choose <numero>" pour valider votre choix.`;
			return message.reply(text);
		}

		const idx = parseInt(sub);
		const line = getLine(idx);
		if (!line) return message.reply(fonts.bold("Numero de personnage invalide. Utilisez 'naruto choose' pour voir la liste."));

		pdata.characterId = line.id;
		pdata.level = 1;
		pdata.xp = 0;
		pdata.wins = 0;
		pdata.losses = 0;
		pdata.rank = "Genin";
		await save();

		const stats = computeStats(line, pdata.level);
		return message.reply(fonts.bold(`✅ Vous avez choisi ${stats.stageName} !\n${line.emoji} Clan : ${line.clan}\n⚡ Technique de base : ${stats.basic}\n💥 Technique ultime : ${stats.ultimate}\n\nUtilisez "naruto quest" pour commencer votre aventure.`));
	},

	showProfile: async function (message, pdata, fonts, usersData, senderID) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous n'avez pas encore choisi de personnage. Utilisez 'naruto choose' pour commencer."));
		}
		const line = getLine(pdata.characterId);
		const stats = computeStats(line, pdata.level);
		const xpNeeded = xpForLevel(pdata.level);
		const totalFights = pdata.wins + pdata.losses;
		const winRate = totalFights > 0 ? Math.round((pdata.wins / totalFights) * 100) : 0;

		const ranks = ["Genin", "Chunin", "Jonin", "ANBU", "Sannin", "Kage", "Legendaire", "Divin"];
		const rankIndex = Math.min(Math.floor(pdata.level / 8), ranks.length - 1);
		const currentRank = ranks[rankIndex];
		if (pdata.rank !== currentRank) pdata.rank = currentRank;

		const profileText = `
${fonts.bold("🍥 CARTE DE NINJA")}
━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(stats.stageName)}
${line.emoji} ${fonts.bold("Clan")} : ${line.clan}

${fonts.bold("Niveau")} : ${pdata.level}${pdata.level >= MAX_LEVEL ? " (MAX)" : ""}
${fonts.bold("Experience")} : ${pdata.xp} / ${xpNeeded}
${fonts.bold("Rang")} : ${pdata.rank}
${fonts.bold("Puissance")} : ${stats.power}

${fonts.bold("Technique de base")} : ${stats.basic}
${fonts.bold("Technique ultime")} : ${stats.ultimate}

${fonts.bold("Victoires")} : ${pdata.wins}
${fonts.bold("Defaites")} : ${pdata.losses}
${fonts.bold("Taux de victoire")} : ${winRate}%
${fonts.bold("Quetes completes")} : ${pdata.completedQuests?.length || 0}`;

		if (!canvasAvailable) return message.reply(profileText);

		try {
			const theme = pickTheme();
			const ownerName = (await usersData.getName(senderID).catch(() => null)) || "Ninja Inconnu";
			const avatar = await fetchAvatar(senderID);
			const canvas = await this.buildProfileCanvas({
				ownerName, stageName: stats.stageName, clan: line.clan,
				level: pdata.level, xp: pdata.xp, xpNeeded, rank: pdata.rank,
				power: stats.power, basic: stats.basic, ultimate: stats.ultimate,
				wins: pdata.wins, losses: pdata.losses, winRate,
				completedQuests: pdata.completedQuests?.length || 0
			}, theme, avatar);

			const cacheDir = path.join(__dirname, "cache");
			if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
			const outPath = path.join(cacheDir, `naruto_profile_${Date.now()}.png`);
			fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
			await message.reply({ body: profileText, attachment: fs.createReadStream(outPath) });
			setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30000);
		} catch (e) {
			console.error("Naruto profile canvas error:", e);
			return message.reply(profileText);
		}
	},

	buildProfileCanvas: async function (data, t, avatar) {
		ensureFonts();
		const W = 1500, H = 820;
		const canvas = createCanvas(W, H);
		const ctx = canvas.getContext("2d");

		drawScrollBg(ctx, W, H, t);

		T(ctx, "SHINOBI INDEX", 60, 70, 22, t.primary, { letterSpacing: 6 });
		T(ctx, data.ownerName.toUpperCase(), 60, 112, 38, t.text, { letterSpacing: 1 });
		GL(ctx, 60, 145, W - 60, 145, t.primary);

		drawSquareAvatar(ctx, avatar, W - 196, 50, 136, t);
		T(ctx, data.rank.toUpperCase(), W - 128, 210, 16, t.secondary, { align: "center", letterSpacing: 2 });
		T(ctx, data.clan.replace(/[^\w\s]/g, '').trim().toUpperCase(), W - 128, 230, 13, t.secondary, { align: "center", letterSpacing: 1 });

		T(ctx, data.stageName.toUpperCase(), 60, 195, 26, t.primary, { letterSpacing: 1 });

		const colX = 60, colW = (W - 120 - 40) / 2;
		const rowY = 250;
		T(ctx, "PROGRESSION", colX, rowY, 18, t.primary, { letterSpacing: 3 });

		const xpRatio = data.xpNeeded > 0 ? data.xp / data.xpNeeded : 0;
		T(ctx, "NIVEAU " + data.level, colX, rowY + 46, 20, t.text, { letterSpacing: 1 });
		drawBar(ctx, colX, rowY + 66, colW, 18, xpRatio, t.secondary, t.primary);
		T(ctx, `${data.xp} / ${data.xpNeeded} XP`, colX, rowY + 104, 15, t.secondary, { letterSpacing: 1 });

		const statsRows = [
			["PUISSANCE", numbers.apply("monospace", data.power)],
			["VICTOIRES", numbers.apply("monospace", data.wins)],
			["DEFAITES", numbers.apply("monospace", data.losses)],
			["TAUX DE VICTOIRE", numbers.apply("monospace", data.winRate) + "%"]
		];
		statsRows.forEach((row, i) => {
			const y = rowY + 150 + i * 56;
			ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = t.primary;
			rr(ctx, colX, y - 24, colW, 44, 6); ctx.fill(); ctx.restore();
			T(ctx, row[0], colX + 20, y, 17, t.secondary, { letterSpacing: 1 });
			T(ctx, String(row[1]), colX + colW - 20, y, 22, t.text, { align: "right" });
		});

		const col2X = colX + colW + 40;
		T(ctx, "TECHNIQUES & QUETES", col2X, rowY, 18, t.primary, { letterSpacing: 3 });
		const techRows = [
			["BASIQUE", data.basic],
			["ULTIME", data.ultimate],
			["QUETES", data.completedQuests + " terminees"]
		];
		techRows.forEach((row, i) => {
			const y = rowY + 50 + i * 70;
			ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = t.primary;
			rr(ctx, col2X, y - 24, colW, 58, 6); ctx.fill(); ctx.restore();
			T(ctx, row[0], col2X + 20, y - 6, 15, t.secondary, { letterSpacing: 2 });
			T(ctx, row[1], col2X + 20, y + 22, 19, t.text, {});
		});

		T(ctx, `${t.name.toUpperCase()} INDEX`, W / 2, H - 36, 14, t.secondary, { align: "center", letterSpacing: 3 });

		return canvas;
	},

	showRoster: async function (message, fonts) {
		let text = `${fonts.bold("🍥 LISTE DES PERSONNAGES")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
		const displayLines = CHARACTER_LINES.slice(0, 30);
		displayLines.forEach(line => {
			text += `\n${line.emoji} ${fonts.bold(String(line.id) + ". " + line.stages[0].name)} (${line.clan})\n`;
			line.stages.forEach(stage => {
				text += `  Niv.${stage.minLevel}+ — ${stage.name.split('(')[1]?.replace(')', '') || stage.name} — Puissance ${stage.power}\n`;
			});
		});
		text += `\n${fonts.bold("Et " + (CHARACTER_LINES.length - 30) + " autres personnages !")}`;
		text += `\n\nUtilisez "naruto choose <numero>" pour choisir votre personnage.`;
		return message.reply(text);
	},

	handleQuest: async function (message, args, pdata, fonts, save, senderID, threadID) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}
		if (userBattle[senderID]) {
			return message.reply(fonts.bold("Vous etes deja en plein combat. Tapez 'a', 'b', 'x', 'c', 'd' ou 'fin'."));
		}

		const sub = args[1];
		if (!sub) {
			let text = `${fonts.bold("🎯 QUETES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
			QUESTS.forEach(q => {
				const locked = pdata.level < q.minLevel;
				const completed = pdata.completedQuests?.includes(q.id);
				text += `\n${q.id}. ${q.name}${locked ? " 🔒" : ""}${completed ? " ✅" : ""}\n`;
				text += `   Niveau requis : ${q.minLevel} | Ennemi : ${q.enemyName}\n`;
				text += `   Recompense : ${q.xp} XP, ${numbers.money(q.gold)}\n`;
			});
			text += `\n${fonts.bold("Quetes terminees")} : ${pdata.completedQuests?.length || 0}/${QUESTS.length}`;
			text += `\nUtilisez "naruto quest <numero>" pour lancer un combat.`;
			return message.reply(text);
		}

		const qid = parseInt(sub);
		const quest = QUESTS.find(q => q.id === qid);
		if (!quest) return message.reply(fonts.bold("Numero de quete invalide."));
		if (pdata.level < quest.minLevel) {
			return message.reply(fonts.bold(`Niveau insuffisant. Cette quete requiert le niveau ${quest.minLevel}, vous etes niveau ${pdata.level}.`));
		}
		if (pdata.completedQuests?.includes(qid)) {
			return message.reply(fonts.bold("Vous avez deja termine cette quete."));
		}

		const line = getLine(pdata.characterId);
		const stats = computeStats(line, pdata.level);
		const battleId = `${threadID}_${senderID}_${Date.now()}`;

		battles[battleId] = {
			id: battleId,
			type: "quest",
			threadID,
			p1id: senderID,
			p2id: null,
			name: { p1: stats.stageName, p2: quest.enemyName },
			power: { p1: stats.power, p2: quest.enemyPower },
			basic: { p1: stats.basic, p2: "Attaque Ennemie" },
			ultimate: { p1: stats.ultimate, p2: "Technique Interdite" },
			hp: { p1: 100, p2: 100 },
			chakra: { p1: 100, p2: 100 },
			defending: null,
			quest
		};
		userBattle[senderID] = battleId;

		return message.reply(fonts.bold(`⚔️ COMBAT DE QUETE\n━━━━━━━━━━━━━━\n${stats.stageName} VS ${quest.enemyName}\n\n${COMBAT_HELP}`));
	},

	handleTrain: async function (message, pdata, fonts, save, user) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}
		const now = Date.now();
		if (pdata.lastTrain && (now - pdata.lastTrain) < TRAIN_COOLDOWN_MS) {
			const remain = Math.ceil((TRAIN_COOLDOWN_MS - (now - pdata.lastTrain)) / 60000);
			return message.reply(fonts.bold(`⏰ Vous devez encore attendre ${remain} minute(s) avant de vous entrainer a nouveau.`));
		}

		pdata.lastTrain = now;
		const xpGain = randomBetween(10, 25);
		const goldGain = randomBetween(30, 100);
		const result = addXp(pdata, xpGain);
		user.money = (user.money || 0) + goldGain;

		await save();

		let text = `${fonts.bold("🏋️ SEANCE D'ENTRAINEMENT")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
		text += `Vous vous etes entraine avec acharnement.\n`;
		text += `Recompense : +${xpGain} XP, +${numbers.money(goldGain)}\n`;
		if (result.leveledUp) text += `⭐ Niveau superieur ! Vous etes maintenant niveau ${result.newLevel}.\n`;
		if (result.evolved) text += `✨ Votre personnage a evolue : ${result.newStageName} !\n`;
		text += `\nRevenez dans ${Math.round(TRAIN_COOLDOWN_MS / 60000)} minutes pour vous entrainer a nouveau.`;

		return message.reply(text);
	},

	handleDuelChallenge: async function (message, event, pdata, fonts, usersData, senderID, threadID, api) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}
		if (userBattle[senderID]) {
			return message.reply(fonts.bold("Vous etes deja en plein combat."));
		}
		if (pendingDuels[threadID]) {
			return message.reply(fonts.bold("Un defi de duel est deja en attente dans ce groupe."));
		}

		const mentionIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
		const targetID = mentionIDs[0];
		if (!targetID) {
			return message.reply(fonts.bold("Mentionnez un utilisateur a defier. Exemple : naruto duel @utilisateur"));
		}
		if (userBattle[targetID]) {
			return message.reply(fonts.bold("Cet utilisateur est deja en plein combat."));
		}

		const targetUser = await usersData.get(targetID);
		const targetData = targetUser?.data?.naruto;
		if (!targetData || !targetData.characterId) {
			return message.reply(fonts.bold("Cet utilisateur n'a pas encore choisi de personnage."));
		}

		pendingDuels[threadID] = { challenger: senderID, target: targetID, ts: Date.now() };

		const targetName = (await usersData.getName(targetID).catch(() => null)) || "Ninja";
		return message.reply({
			body: `${fonts.bold("⚔️ DEFI DE DUEL")}\n━━━━━━━━━━━━━━\n@${targetName}, vous etes defie en duel !\nRepondez "accepter" pour combattre ou "refuser" pour decliner.`,
			mentions: [{ tag: `@${targetName}`, id: targetID }]
		});
	},

	showLeaderboard: async function (message, fonts, usersData) {
		try {
			const allUsers = await usersData.getAll();
			const ranked = [];
			for (const [uid, u] of Object.entries(allUsers)) {
				const nd = u.data?.naruto;
				if (nd && nd.characterId) {
					ranked.push({
						uid,
						name: u.name || `User ${uid}`,
						level: nd.level || 1,
						wins: nd.wins || 0,
						losses: nd.losses || 0,
						characterId: nd.characterId
					});
				}
			}
			ranked.sort((a, b) => b.level - a.level || b.wins - a.wins);
			const top10 = ranked.slice(0, 10);

			let text = `${fonts.bold("🏆 CLASSEMENT DES NINJAS")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
			if (top10.length === 0) {
				text += "Aucun ninja n'a encore choisi de personnage.";
				return message.reply(text);
			}
			top10.forEach((u, i) => {
				const line = getLine(u.characterId);
				const stats = line ? computeStats(line, u.level) : null;
				const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold("#" + (i + 1))}`;
				text += `\n${medal} ${fonts.bold(u.name)}\n`;
				text += `   ${stats ? stats.stageName : "Ninja"} — Niveau ${u.level}\n`;
				text += `   Victoires : ${u.wins} | Defaites : ${u.losses}\n`;
			});

			if (!canvasAvailable) return message.reply(text);

			const theme = pickTheme();
			const rows = await Promise.all(top10.map(async (u) => {
				const line = getLine(u.characterId);
				const stats = line ? computeStats(line, u.level) : null;
				return {
					name: u.name,
					subtitle: `NIVEAU ${u.level} - ${stats ? stats.stageName.toUpperCase() : ""}`,
						value: String(u.wins),
						avatar: await fetchAvatar(u.uid)
				};
			}));

			await renderAndAttach(
				message, text,
				this.buildRankingCanvas("SHINOBI RANKING", rows, theme),
				"naruto_leaderboard"
			);
		} catch (e) {
			console.error("Naruto leaderboard error:", e);
			return message.reply(fonts.bold("Erreur lors du chargement du classement."));
		}
	},

	buildRankingCanvas: async function (title, rows, t) {
		ensureFonts();
		const rowH = 92;
		const headerH = 200;
		const footH = 70;
		const W = 1500;
		const H = headerH + rows.length * rowH + footH;
		const canvas = createCanvas(W, H);
		const ctx = canvas.getContext("2d");

		drawScrollBg(ctx, W, H, t);

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
	},

	showRankInfo: async function (message, pdata, fonts, save) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}

		const ranks = ["Genin", "Chunin", "Jonin", "ANBU", "Sannin", "Kage", "Legendaire", "Divin"];
		const rankIndex = Math.min(Math.floor(pdata.level / 8), ranks.length - 1);
		const currentRank = ranks[rankIndex];
		const nextRank = ranks[Math.min(rankIndex + 1, ranks.length - 1)];
		const nextLevel = (rankIndex + 1) * 8;

		if (pdata.rank !== currentRank) {
			pdata.rank = currentRank;
			await save();
		}

		let text = `${fonts.bold("🏅 INFORMATIONS SUR LE RANG")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
		text += `Rang actuel : ${fonts.bold(currentRank)}\n`;
		text += `Niveau : ${pdata.level}\n`;
		if (pdata.level < MAX_LEVEL) {
			text += `Prochain rang : ${nextRank} (niveau ${nextLevel})\n`;
			text += `Progression : ${pdata.level}/${nextLevel}\n`;
		} else {
			text += `🎉 Vous avez atteint le rang maximum !\n`;
		}
		text += `\n${fonts.bold("📊 RANGS DISPONIBLES:")}\n`;
		ranks.forEach((r, i) => {
			const lvl = i * 8 + 1;
			const unlocked = pdata.level >= lvl;
			text += `${unlocked ? "✅" : "🔒"} ${r} (Niv. ${lvl}+)\n`;
		});

		return message.reply(text);
	},

	showInventory: async function (message, pdata, fonts) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}

		const items = pdata.items || [];
		let text = `${fonts.bold("📦 INVENTAIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
		if (items.length === 0) {
			text += "Votre inventaire est vide.\n";
			text += "Completer des quetes pour obtenir des objets !";
		} else {
			items.forEach((item, i) => {
				text += `${i + 1}. ${item.name} (${item.type || "Objet"}) — ${item.description || ""}\n`;
			});
		}
		text += `\n${fonts.bold("Objets totaux")} : ${items.length}`;

		return message.reply(text);
	},

	showDetailedStats: async function (message, pdata, fonts, usersData, senderID) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous devez d'abord choisir un personnage avec 'naruto choose'."));
		}

		const line = getLine(pdata.characterId);
		const stats = computeStats(line, pdata.level);
		const totalFights = pdata.wins + pdata.losses;
		const winRate = totalFights > 0 ? Math.round((pdata.wins / totalFights) * 100) : 0;
		const xpNeeded = xpForLevel(pdata.level);

		const text = `
${fonts.bold("📊 STATISTIQUES DETAILLEES")}
━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold("Niveau")} : ${pdata.level}
${fonts.bold("Experience")} : ${pdata.xp}/${xpNeeded}
${fonts.bold("Rang")} : ${pdata.rank}
${fonts.bold("Puissance")} : ${stats.power}

${fonts.bold("📈 COMBATS")}
Victoires : ${pdata.wins}
Defaites : ${pdata.losses}
Total : ${totalFights}
Taux de victoire : ${winRate}%

${fonts.bold("🎯 QUETES")}
Terminees : ${pdata.completedQuests?.length || 0}/${QUESTS.length}

${fonts.bold("⚡ TECHNIQUES")}
Basique : ${stats.basic}
Ultime : ${stats.ultimate}

${fonts.bold("📅 GENERAL")}
Cree le : ${new Date(pdata.createdAt).toLocaleDateString()}
Dernier entrainement : ${pdata.lastTrain ? new Date(pdata.lastTrain).toLocaleDateString() : "Jamais"}`;

		return message.reply(text);
	},

	resetCharacter: async function (message, pdata, fonts, save) {
		if (!pdata.characterId) {
			return message.reply(fonts.bold("Vous n'avez pas de personnage a reinitialiser."));
		}

		const confirm = args[1]?.toLowerCase();
		if (confirm !== "confirm") {
			return message.reply(fonts.bold(`
⚠️ ATTENTION : Reinitialiser votre personnage supprimera toute votre progression !
Cette action est DEFINITIVE.
Pour confirmer, envoyez : naruto reset confirm
			`));
		}

		pdata.characterId = null;
		pdata.level = 1;
		pdata.xp = 0;
		pdata.wins = 0;
		pdata.losses = 0;
		pdata.lastTrain = null;
		pdata.lastQuestId = null;
		pdata.rank = "Genin";
		pdata.completedQuests = [];
		pdata.items = [];
		await save();

		return message.reply(fonts.bold("✅ Votre personnage a ete reinitialise. Vous pouvez maintenant en choisir un nouveau avec 'naruto choose'."));
	},

	onChat: async function ({ event, message, api, usersData }) {
		const userID = event.senderID;
		const threadID = event.threadID;
		const body = (event.body || "").trim().toLowerCase();
		if (!body) return;

		const pending = pendingDuels[threadID];
		if (pending && userID === pending.target && (body === "accepter" || body === "accepte" || body === "refuser" || body === "refuse")) {
			if (body === "refuser" || body === "refuse") {
				delete pendingDuels[threadID];
				return message.reply(fonts.bold("Le duel a ete refuse."));
			}

			delete pendingDuels[threadID];
			const challengerUser = await usersData.get(pending.challenger);
			const targetUser = await usersData.get(pending.target);
			const cData = challengerUser?.data?.naruto;
			const tData = targetUser?.data?.naruto;
			if (!cData || !cData.characterId || !tData || !tData.characterId) {
				return message.reply(fonts.bold("Impossible de lancer le duel : un des joueurs n'a plus de personnage valide."));
			}

			const cLine = getLine(cData.characterId);
			const tLine = getLine(tData.characterId);
			const cStats = computeStats(cLine, cData.level);
			const tStats = computeStats(tLine, tData.level);

			const cName = (await usersData.getName(pending.challenger).catch(() => null)) || "Ninja 1";
			const tName = (await usersData.getName(pending.target).catch(() => null)) || "Ninja 2";

			const battleId = `${threadID}_duel_${Date.now()}`;
			battles[battleId] = {
				id: battleId,
				type: "duel",
				threadID,
				p1id: pending.challenger,
				p2id: pending.target,
				ownerName: { p1: cName, p2: tName },
				name: { p1: cStats.stageName, p2: tStats.stageName },
				power: { p1: cStats.power, p2: tStats.power },
				basic: { p1: cStats.basic, p2: tStats.basic },
				ultimate: { p1: cStats.ultimate, p2: tStats.ultimate },
				hp: { p1: 100, p2: 100 },
				chakra: { p1: 100, p2: 100 },
				defending: null,
				turn: "p1"
			};
			userBattle[pending.challenger] = battleId;
			userBattle[pending.target] = battleId;

			return message.reply({
				body: `${fonts.bold("⚔️ DUEL ACCEPTE")}\n━━━━━━━━━━━━━━\n${cStats.stageName} (${cName}) VS ${tStats.stageName} (${tName})\n\n${COMBAT_HELP}\n\n@${cName}, a vous de jouer !`,
				mentions: [{ tag: `@${cName}`, id: pending.challenger }]
			});
		}

		const battleId = userBattle[userID];
		if (!battleId) return;
		const battle = battles[battleId];
		if (!battle) { delete userBattle[userID]; return; }

		if (body === "fin" || body === "quit" || body === "abandon") {
			cleanupBattle(battleId);
			return message.reply(fonts.bold("Le combat a ete abandonne."));
		}

		if (!['a', 'b', 'x', 'c', 'd'].includes(body)) return;

		if (battle.type === "quest") {
			if (userID !== battle.p1id) return;

			let msg = "";
			const r1 = resolveTurn(battle, 'p1', body);
			msg += formatAction(r1, battle);

			if (battle.hp.p2 > 0) {
				const botLetter = aiChoose(battle);
				const r2 = resolveTurn(battle, 'p2', botLetter);
				msg += formatAction(r2, battle);
			}

			msg += statusBars(battle);

			if (battle.hp.p1 <= 0 || battle.hp.p2 <= 0) {
				const user = await usersData.get(userID);
				const pdata = user.data.naruto;
				const won = battle.hp.p2 <= 0 && battle.hp.p1 > 0;

				let rewardMsg = "";
				if (won) {
					pdata.wins += 1;
					const result = addXp(pdata, battle.quest.xp);
					user.money = (user.money || 0) + battle.quest.gold;
					if (!pdata.completedQuests) pdata.completedQuests = [];
					if (!pdata.completedQuests.includes(battle.quest.id)) {
						pdata.completedQuests.push(battle.quest.id);
					}
					rewardMsg = `🏆 VICTOIRE ! Vous avez vaincu ${battle.quest.enemyName}.\n`;
					rewardMsg += `Recompense : +${battle.quest.xp} XP, +${numbers.money(battle.quest.gold)}\n`;
					if (result.leveledUp) rewardMsg += `⭐ Niveau superieur ! Vous etes maintenant niveau ${result.newLevel}.\n`;
					if (result.evolved) rewardMsg += `✨ Votre personnage a evolue : ${result.newStageName} !\n`;
				} else {
					pdata.losses += 1;
					const consolationXp = Math.floor(battle.quest.xp * 0.25);
					const result = addXp(pdata, consolationXp);
					rewardMsg = `💀 DEFAITE face a ${battle.quest.enemyName}.\n`;
					rewardMsg += `Recompense de consolation : +${consolationXp} XP\n`;
					if (result.leveledUp) rewardMsg += `⭐ Niveau superieur ! Vous etes maintenant niveau ${result.newLevel}.\n`;
				}

				await usersData.set(userID, user);
				cleanupBattle(battleId);
				msg += `\n${rewardMsg}`;
				return message.reply(msg);
			}

			return message.reply(msg);
		}

		if (battle.type === "duel") {
			const currentId = battle.turn === "p1" ? battle.p1id : battle.p2id;
			if (userID !== currentId) return;

			const key = battle.turn;
			const r = resolveTurn(battle, key, body);
			let msg = formatAction(r, battle);
			msg += statusBars(battle);

			if (battle.hp.p1 <= 0 || battle.hp.p2 <= 0) {
				const p1Won = battle.hp.p2 <= 0 && battle.hp.p1 > 0;
				const winnerID = p1Won ? battle.p1id : battle.p2id;
				const loserID = p1Won ? battle.p2id : battle.p1id;
				const winnerName = p1Won ? battle.ownerName.p1 : battle.ownerName.p2;

				const winnerUser = await usersData.get(winnerID);
				const loserUser = await usersData.get(loserID);
				const wpdata = winnerUser.data.naruto;
				const lpdata = loserUser.data.naruto;

				wpdata.wins += 1;
				lpdata.losses += 1;
				const winXp = 50 + wpdata.level * 2;
				const winGold = 100 + wpdata.level * 5;
				const loseXp = 15;

				const wResult = addXp(wpdata, winXp);
				const lResult = addXp(lpdata, loseXp);
				winnerUser.money = (winnerUser.money || 0) + winGold;

				await usersData.set(winnerID, winnerUser);
				await usersData.set(loserID, loserUser);
				cleanupBattle(battleId);

				msg += `\n🏆 VICTOIRE DE ${winnerName} !\n`;
				msg += `${battle.ownerName.p1} : +${winXp} XP${p1Won ? ", +" + numbers.money(winGold) : ""}\n`;
				msg += `${battle.ownerName.p2} : ${p1Won ? "+" + loseXp + " XP" : "+" + winXp + " XP, +" + numbers.money(winGold)}\n`;
				if (wResult.evolved) msg += `✨ ${winnerName} a evolue : ${wResult.newStageName} !\n`;

				return message.reply(msg);
			}

			battle.turn = key === "p1" ? "p2" : "p1";
			const nextID = battle.turn === "p1" ? battle.p1id : battle.p2id;
			const nextName = battle.turn === "p1" ? battle.ownerName.p1 : battle.ownerName.p2;
			msg += `@${nextName}, a vous de jouer !`;

			return message.reply({
				body: msg,
				mentions: [{ tag: `@${nextName}`, id: nextID }]
			});
		}
	}
};
