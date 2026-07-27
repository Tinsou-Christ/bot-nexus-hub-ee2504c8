// space.js
"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    DAILY: 24 * 60 * 60 * 1000,
    EXPLORE: 2 * 60 * 60 * 1000,
    TRADE: 1 * 60 * 60 * 1000,
    FIGHT: 4 * 60 * 60 * 1000,
    REPAIR: 3 * 60 * 60 * 1000,
    UPGRADE: 6 * 60 * 60 * 1000,
    RECRUIT: 8 * 60 * 60 * 1000,
};

const SHIP_TYPES = [
    { id: "SCOUT", nom: "Éclaireur", emoji: "🛸", baseHP: 50, baseAttack: 10, baseDefense: 5, cargo: 20, cost: 5000, speed: 2 },
    { id: "FREIGHTER", nom: "Cargo", emoji: "🚀", baseHP: 80, baseAttack: 8, baseDefense: 10, cargo: 80, cost: 15000, speed: 1.5 },
    { id: "FIGHTER", nom: "Chasseur", emoji: "🪐", baseHP: 60, baseAttack: 25, baseDefense: 8, cargo: 30, cost: 30000, speed: 2.5 },
    { id: "CRUISER", nom: "Croiseur", emoji: "🌌", baseHP: 120, baseAttack: 30, baseDefense: 20, cargo: 60, cost: 80000, speed: 1.8 },
    { id: "DREADNOUGHT", nom: "Cuirassé", emoji: "💫", baseHP: 200, baseAttack: 45, baseDefense: 35, cargo: 100, cost: 250000, speed: 1.2 },
    { id: "CARRIER", nom: "Porte-vaisseaux", emoji: "⭐", baseHP: 300, baseAttack: 20, baseDefense: 40, cargo: 150, cost: 1000000, speed: 1.0 },
];

const SYSTEMS = [
    { id: "ALPHA", nom: "Alpha Centauri", emoji: "🌞", danger: 1, resources: ["Eau", "Minerai"], tradeGoods: ["Nourriture", "Eau"] },
    { id: "BETELGEUSE", nom: "Bételgeuse", emoji: "🔴", danger: 3, resources: ["Cristal", "Gaz"], tradeGoods: ["Cristaux", "Carburant"] },
    { id: "VEGA", nom: "Véga", emoji: "🔵", danger: 2, resources: ["Métal", "Silicium"], tradeGoods: ["Électronique", "Armes"] },
    { id: "SIRIUS", nom: "Sirius", emoji: "⚪", danger: 4, resources: ["Antimatière", "Plasma"], tradeGoods: ["Technologie", "Médicaments"] },
    { id: "PROXIMA", nom: "Proxima", emoji: "🟠", danger: 5, resources: ["Énergie", "Matière noire"], tradeGoods: ["Artefacts", "Connaissances"] },
    { id: "ANDROMEDA", nom: "Andromède", emoji: "🌀", danger: 3, resources: ["Cristal", "Métal"], tradeGoods: ["Carburant", "Nourriture"] },
];

const RESOURCES = {
    EAU: { id: "EAU", nom: "Eau", emoji: "💧", basePrice: 50 },
    MINERAI: { id: "MINERAI", nom: "Minerai", emoji: "⛏️", basePrice: 100 },
    CRISTAL: { id: "CRISTAL", nom: "Cristal", emoji: "💎", basePrice: 200 },
    GAZ: { id: "GAZ", nom: "Gaz", emoji: "🌫️", basePrice: 150 },
    METAL: { id: "METAL", nom: "Métal", emoji: "🪨", basePrice: 120 },
    SILICIUM: { id: "SILICIUM", nom: "Silicium", emoji: "🔘", basePrice: 180 },
    ANTIMATIERE: { id: "ANTIMATIERE", nom: "Antimatière", emoji: "⚛️", basePrice: 500 },
    PLASMA: { id: "PLASMA", nom: "Plasma", emoji: "🔥", basePrice: 300 },
    ENERGIE: { id: "ENERGIE", nom: "Énergie", emoji: "⚡", basePrice: 250 },
    MATIERE_NOIRE: { id: "MATIERE_NOIRE", nom: "Matière noire", emoji: "🌑", basePrice: 800 },
};

const CREW_TYPES = [
    { id: "PILOT", nom: "Pilote", emoji: "👨‍✈️", cost: 5000, bonus: "vitesse", bonusValue: 0.1 },
    { id: "ENGINEER", nom: "Ingénieur", emoji: "👩‍🔧", cost: 8000, bonus: "defense", bonusValue: 0.15 },
    { id: "GUNNER", nom: "Artilleur", emoji: "🎯", cost: 6000, bonus: "attack", bonusValue: 0.2 },
    { id: "SCIENTIST", nom: "Scientifique", emoji: "👩‍🔬", cost: 10000, bonus: "cargo", bonusValue: 0.2 },
    { id: "MEDIC", nom: "Médecin", emoji: "👨‍⚕️", cost: 7000, bonus: "repair", bonusValue: 0.3 },
    { id: "CAPTAIN", nom: "Commandant", emoji: "🫡", cost: 20000, bonus: "all", bonusValue: 0.1 },
];

const ENEMIES = [
    { nom: "Pirate", emoji: "🏴‍☠️", hp: 30, attack: 12, reward: [500, 1500], xp: 20 },
    { nom: "Chasseur de primes", emoji: "🔫", hp: 50, attack: 20, reward: [1000, 3000], xp: 35 },
    { nom: "Vaisseau rebelle", emoji: "⚔️", hp: 80, attack: 25, reward: [2000, 6000], xp: 50 },
    { nom: "Croiseur ennemi", emoji: "🛡️", hp: 120, attack: 35, reward: [5000, 12000], xp: 80 },
    { nom: "Dreadnought extraterrestre", emoji: "👾", hp: 200, attack: 50, reward: [15000, 35000], xp: 150 },
    { nom: "Flotte invasionniste", emoji: "🛸", hp: 300, attack: 70, reward: [30000, 80000], xp: 300 },
];

const ACHIEVEMENTS_LIST = {
    FIRST_FLIGHT: { emoji: "🛸", nom: "Premier Vol", desc: "Décoller avec votre vaisseau" },
    FIRST_TRADE: { emoji: "💰", nom: "Premier Commerce", desc: "Effectuer un échange" },
    FIRST_BATTLE: { emoji: "⚔️", nom: "Premier Combat", desc: "Gagner un combat spatial" },
    EXPLORE_3: { emoji: "🌌", nom: "Explorateur", desc: "Explorer 3 systèmes" },
    EXPLORE_6: { emoji: "🌀", nom: "Grand Explorateur", desc: "Explorer 6 systèmes" },
    WEALTH_100K: { emoji: "💎", nom: "100K de Crédits", desc: "Atteindre 100 000 crédits" },
    WEALTH_1M: { emoji: "💰", nom: "Millionnaire Spatial", desc: "Atteindre 1 000 000 crédits" },
    SHIP_CRUISER: { emoji: "🌌", nom: "Commandant de Croiseur", desc: "Posséder un Croiseur" },
    SHIP_DREADNOUGHT: { emoji: "💫", nom: "Seigneur de Guerre", desc: "Posséder un Cuirassé" },
    SHIP_CARRIER: { emoji: "⭐", nom: "Amiral", desc: "Posséder un Porte-vaisseaux" },
    CREW_3: { emoji: "👥", nom: "Équipage Complet", desc: "Recruter 3 membres d'équipage" },
    CREW_6: { emoji: "👥", nom: "Équipage d'Élite", desc: "Recruter 6 membres d'équipage" },
    BATTLES_10: { emoji: "⚔️", nom: "Vétéran", desc: "Gagner 10 combats" },
    BATTLES_50: { emoji: "🏆", nom: "Légende de l'Espace", desc: "Gagner 50 combats" },
    PREMIUM: { emoji: "💎", nom: "Premium", desc: "Devenir Premium" },
};

function initSpace() {
    return {
        ship: "SCOUT",
        shipHP: 50,
        maxShipHP: 50,
        attack: 10,
        defense: 5,
        cargo: 20,
        cargoUsed: 0,
        cargoItems: {},
        credits: 10000,
        totalEarned: 0,
        experience: 0,
        level: 1,
        reputation: 0,
        currentSystem: "ALPHA",
        exploredSystems: ["ALPHA"],
        crew: [],
        battlesWon: 0,
        battlesLost: 0,
        tradesDone: 0,
        lastDaily: null,
        lastExplore: null,
        lastTrade: null,
        lastFight: null,
        lastRepair: null,
        lastUpgrade: null,
        lastRecruit: null,
        streak: 0,
        achievements: [],
        transactions: [],
        activeFight: null,
        premium: false,
        multiplier: 1.0,
        shipLevel: 1,
    };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function L(char = "─", n = 44) { return char.repeat(n); }

function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getShipData(space) {
    const ship = SHIP_TYPES.find(s => s.id === space.ship);
    if (!ship) return SHIP_TYPES[0];
    return ship;
}

function getShipStats(space) {
    const ship = getShipData(space);
    let baseHP = ship.baseHP + (space.shipLevel - 1) * 10;
    let baseAttack = ship.baseAttack + (space.shipLevel - 1) * 3;
    let baseDefense = ship.baseDefense + (space.shipLevel - 1) * 2;
    let baseCargo = ship.cargo + (space.shipLevel - 1) * 5;

    // Crew bonuses
    for (const c of space.crew) {
        const crewData = CREW_TYPES.find(ct => ct.id === c);
        if (crewData) {
            if (crewData.bonus === "attack") baseAttack += Math.floor(baseAttack * crewData.bonusValue);
            else if (crewData.bonus === "defense") baseDefense += Math.floor(baseDefense * crewData.bonusValue);
            else if (crewData.bonus === "cargo") baseCargo += Math.floor(baseCargo * crewData.bonusValue);
            else if (crewData.bonus === "vitesse") { /* vitesse non utilisé dans les stats */ }
            else if (crewData.bonus === "repair") { /* repair non utilisé */ }
            else if (crewData.bonus === "all") {
                baseHP += Math.floor(baseHP * crewData.bonusValue);
                baseAttack += Math.floor(baseAttack * crewData.bonusValue);
                baseDefense += Math.floor(baseDefense * crewData.bonusValue);
            }
        }
    }

    // Premium bonus
    if (space.premium) {
        baseAttack = Math.floor(baseAttack * 1.2);
        baseDefense = Math.floor(baseDefense * 1.2);
    }

    return {
        hp: Math.floor(baseHP),
        maxHP: Math.floor(baseHP),
        attack: Math.floor(baseAttack),
        defense: Math.floor(baseDefense),
        cargo: Math.floor(baseCargo),
    };
}

function getTotalWealth(space, walletBalance) {
    let total = walletBalance + space.credits;
    // Valeur des ressources
    for (const [resId, qte] of Object.entries(space.cargoItems)) {
        const res = RESOURCES[resId];
        if (res) total += res.basePrice * qte;
    }
    // Valeur du vaisseau (estimation)
    const ship = getShipData(space);
    total += Math.floor(ship.cost * (1 + (space.shipLevel - 1) * 0.1));
    return total;
}

function checkAchievements(space) {
    const list = [];
    if (!space.achievements.includes("FIRST_FLIGHT") && space.exploredSystems.length > 1)
        list.push("FIRST_FLIGHT");
    if (!space.achievements.includes("FIRST_TRADE") && space.tradesDone >= 1)
        list.push("FIRST_TRADE");
    if (!space.achievements.includes("FIRST_BATTLE") && space.battlesWon >= 1)
        list.push("FIRST_BATTLE");
    if (!space.achievements.includes("EXPLORE_3") && space.exploredSystems.length >= 3)
        list.push("EXPLORE_3");
    if (!space.achievements.includes("EXPLORE_6") && space.exploredSystems.length >= 6)
        list.push("EXPLORE_6");
    if (!space.achievements.includes("WEALTH_100K") && space.totalEarned >= 100000)
        list.push("WEALTH_100K");
    if (!space.achievements.includes("WEALTH_1M") && space.totalEarned >= 1000000)
        list.push("WEALTH_1M");
    if (!space.achievements.includes("SHIP_CRUISER") && space.ship === "CRUISER")
        list.push("SHIP_CRUISER");
    if (!space.achievements.includes("SHIP_DREADNOUGHT") && space.ship === "DREADNOUGHT")
        list.push("SHIP_DREADNOUGHT");
    if (!space.achievements.includes("SHIP_CARRIER") && space.ship === "CARRIER")
        list.push("SHIP_CARRIER");
    if (!space.achievements.includes("CREW_3") && space.crew.length >= 3)
        list.push("CREW_3");
    if (!space.achievements.includes("CREW_6") && space.crew.length >= 6)
        list.push("CREW_6");
    if (!space.achievements.includes("BATTLES_10") && space.battlesWon >= 10)
        list.push("BATTLES_10");
    if (!space.achievements.includes("BATTLES_50") && space.battlesWon >= 50)
        list.push("BATTLES_50");
    if (!space.achievements.includes("PREMIUM") && space.premium)
        list.push("PREMIUM");
    for (const a of list) space.achievements.push(a);
    return list;
}

function addTransaction(space, type, montant, description) {
    space.transactions.push({ type, montant, description, date: Date.now() });
    if (space.transactions.length > 30) space.transactions = space.transactions.slice(-30);
}

function getTransactionEmoji(type) {
    const emojis = {
        deposit: "💰", withdrawal: "💸", trade: "📦", fight: "⚔️",
        explore: "🪐", repair: "🔧", upgrade: "⬆️", recruit: "👥",
        daily: "🎁", premium: "💎", achievement: "🏆", event: "🎯",
    };
    return emojis[type] || "💼";
}

function renderDashboard(space, walletBalance) {
    const ship = getShipData(space);
    const stats = getShipStats(space);
    const totalWealth = getTotalWealth(space, walletBalance);
    const system = SYSTEMS.find(s => s.id === space.currentSystem);

    let tier = "🛸 Recrue";
    if (totalWealth >= 1000000) tier = "⭐ Amiral";
    else if (totalWealth >= 500000) tier = "💫 Commandant";
    else if (totalWealth >= 100000) tier = "🌌 Officier";
    else if (totalWealth >= 10000) tier = "🚀 Pilote";

    return `
${fonts.bold("🪐 COMMANDEMENT SPATIAL")} ${ship.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(tier)} • ${fonts.bold("Niveau " + space.level)}${space.premium ? " • 💎 Premium" : ""}

${fonts.bold("🚀 VAISSEAU")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${ship.emoji} ${fonts.bold(ship.nom)} (Niv.${space.shipLevel})
❤️ PV: ${fonts.bold(stats.hp + "/" + stats.maxHP)}
⚔️ Attaque: ${fonts.bold(stats.attack)} | 🛡️ Défense: ${fonts.bold(stats.defense)}
📦 Cargo: ${fonts.bold(space.cargoUsed + "/" + stats.cargo)}

${fonts.bold("💳 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💳 Portefeuille: ${fonts.bold(FM(walletBalance))}
🪙 Crédits: ${fonts.bold(FM(space.credits))}
💎 Patrimoine: ${fonts.bold(FM(totalWealth))}
📈 Gains totaux: ${fonts.bold(FM(space.totalEarned))}

${fonts.bold("🪐 SYSTÈME ACTUEL")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${system ? system.emoji + " " + system.nom : "Inconnu"}
⚠️ Danger: ${"⭐".repeat(system ? system.danger : 0)}
🌐 Systèmes explorés: ${space.exploredSystems.length}/6

${fonts.bold("📊 STATISTIQUES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⚔️ Batailles: ${fonts.bold(space.battlesWon + " victoires, " + space.battlesLost + " défaites")}
📦 Échanges: ${fonts.bold(space.tradesDone)}
👥 Équipage: ${fonts.bold(space.crew.length + "/6")}
🏆 Succès: ${fonts.bold(space.achievements.length + "/50")}
🔥 Série: ${fonts.bold(space.streak + " jours")}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🪐 Exploration: ${timeLeft(space.lastExplore, COOLDOWNS.EXPLORE) || "✅ Prêt"}
📦 Commerce: ${timeLeft(space.lastTrade, COOLDOWNS.TRADE) || "✅ Prêt"}
⚔️ Combat: ${space.activeFight ? "⏳ En cours" : timeLeft(space.lastFight, COOLDOWNS.FIGHT) || "✅ Prêt"}
🔧 Réparation: ${timeLeft(space.lastRepair, COOLDOWNS.REPAIR) || "✅ Prêt"}
⬆️ Amélioration: ${timeLeft(space.lastUpgrade, COOLDOWNS.UPGRADE) || "✅ Prêt"}
👥 Recrutement: ${timeLeft(space.lastRecruit, COOLDOWNS.RECRUIT) || "✅ Prêt"}
🎁 Daily: ${timeLeft(space.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
    return `
${fonts.bold("🪐 COMMANDEMENT SPATIAL - GUIDE COMPLET")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📊 TABLEAU DE BORD")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 space stat - Tableau de bord complet

${fonts.bold("🚀 VAISSEAU")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 space ship list - Voir les vaisseaux disponibles
⬆️ space ship upgrade - Améliorer votre vaisseau
🛒 space ship buy <ID> - Acheter un nouveau vaisseau
📊 space ship stats - Voir les stats détaillées

${fonts.bold("🪐 EXPLORATION & SYSTÈMES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🌌 space explore - Explorer le système actuel
🛸 space warp - Voyager vers un autre système (coût 1000 crédits)

${fonts.bold("📦 COMMERCE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 space market - Voir les ressources disponibles
🛒 space buy <RESSOURCE> <qte> - Acheter des ressources
💰 space sell <RESSOURCE> <qte> - Vendre des ressources
📦 space cargo - Voir votre cargaison

${fonts.bold("⚔️ COMBAT")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⚔️ space fight - Lancer un combat
✅ space fight check - Vérifier l'avancement

${fonts.bold("🔧 MAINTENANCE & AMÉLIORATIONS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔧 space repair - Réparer le vaisseau (coût 500 crédits)
⬆️ space upgrade - Améliorer les systèmes du vaisseau

${fonts.bold("👥 ÉQUIPAGE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 space crew list - Voir les membres disponibles
🤝 space crew hire <ID> - Recruter un membre
📊 space crew stats - Voir votre équipage

${fonts.bold("🎯 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 space rank - Votre rang
🏆 space achievements - Succès débloqués
👑 space leaderboard - Classement des commandants

${fonts.bold("🎁 RÉCOMPENSES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎁 space daily - Récompense quotidienne
💎 space premium buy - Devenir premium (2x gains)
📋 space history - Historique des transactions
`.trim();
}

// ---- COMMANDES ----

async function cmdDeposit(message, args, space, user, save, walletBalance) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💰 DÉPÔT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: space deposit <montant>
Portefeuille: ${FM(walletBalance)}
Crédits: ${FM(space.credits)}
		`));
    }
    if (walletBalance < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(walletBalance)}`));
    }
    user.money = walletBalance - amount;
    space.credits += amount;
    addTransaction(space, "deposit", amount, "Dépôt en crédits");
    await save();
    return message.reply(fonts.bold(`
💰 DÉPÔT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Nouveaux crédits: ${FM(space.credits)}
Portefeuille restant: ${FM(user.money)}
		`));
}

async function cmdWithdraw(message, args, space, user, save) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💸 RETRAIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: space withdraw <montant>
Crédits: ${FM(space.credits)}
		`));
    }
    if (space.credits < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Crédits: ${FM(space.credits)}`));
    }
    space.credits -= amount;
    user.money = (user.money || 0) + amount;
    addTransaction(space, "withdrawal", -amount, "Retrait de crédits");
    await save();
    return message.reply(fonts.bold(`
💸 RETRAIT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Nouveaux crédits: ${FM(space.credits)}
Nouveau portefeuille: ${FM(user.money)}
		`));
}

async function cmdShipList(message) {
    let txt = `${fonts.bold("🚀 VAISSEAUX DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const s of SHIP_TYPES) {
        txt += `${s.emoji} ${s.nom} [${s.id}]\n`;
        txt += `   ❤️ PV: ${s.baseHP} | ⚔️ Attaque: ${s.baseAttack} | 🛡️ Défense: ${s.baseDefense}\n`;
        txt += `   📦 Cargo: ${s.cargo} | 💰 Coût: ${FM(s.cost)}\n\n`;
    }
    txt += `Acheter: space ship buy <ID>`;
    return message.reply(txt);
}

async function cmdShipBuy(message, args, space, user, save) {
    const shipId = args[1]?.toUpperCase();
    const ship = SHIP_TYPES.find(s => s.id === shipId);
    if (!ship) {
        return message.reply(fonts.bold(`❌ Vaisseau inconnu. Utilisez 'space ship list'.`));
    }
    if (space.ship === shipId) {
        return message.reply(fonts.bold(`❌ Vous possédez déjà ce vaisseau.`));
    }
    // Vérifier si le vaisseau actuel est plus avancé (optionnel)
    const currentShip = getShipData(space);
    const currentIndex = SHIP_TYPES.indexOf(currentShip);
    const newIndex = SHIP_TYPES.indexOf(ship);
    if (newIndex < currentIndex) {
        return message.reply(fonts.bold(`❌ Vous ne pouvez pas rétrograder vers un vaisseau inférieur.`));
    }

    const totalCash = (user.money || 0) + space.credits;
    if (totalCash < ship.cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(ship.cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = ship.cost;
    if (space.credits >= reste) {
        space.credits -= reste;
        reste = 0;
    } else {
        reste -= space.credits;
        space.credits = 0;
        user.money = (user.money || 0) - reste;
    }

    space.ship = shipId;
    const stats = getShipStats(space);
    space.shipHP = stats.maxHP;
    space.maxShipHP = stats.maxHP;
    space.attack = stats.attack;
    space.defense = stats.defense;
    space.cargo = stats.cargo;
    addTransaction(space, "ship_buy", -ship.cost, `Achat: ${ship.nom}`);
    await save();
    return message.reply(fonts.bold(`
${ship.emoji} VAISSEAU ACHETÉ: ${ship.nom}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Coût: ${FM(ship.cost)}
❤️ PV: ${stats.maxHP}
⚔️ Attaque: ${stats.attack}
🛡️ Défense: ${stats.defense}
📦 Cargo: ${stats.cargo}
		`));
}

async function cmdShipStats(message, space) {
    const ship = getShipData(space);
    const stats = getShipStats(space);
    let txt = `${ship.emoji} ${fonts.bold("STATISTIQUES DU VAISSEAU")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `Nom: ${ship.nom}\n`;
    txt += `Niveau: ${space.shipLevel}\n`;
    txt += `❤️ PV: ${stats.hp}/${stats.maxHP}\n`;
    txt += `⚔️ Attaque: ${stats.attack}\n`;
    txt += `🛡️ Défense: ${stats.defense}\n`;
    txt += `📦 Capacité cargo: ${stats.cargo}\n`;
    txt += `📦 Cargo utilisé: ${space.cargoUsed}/${stats.cargo}\n\n`;
    txt += `Améliorations disponibles: space upgrade (coût: ${FM(1000 * space.shipLevel)})`;
    return message.reply(txt);
}

async function cmdShipUpgrade(message, space, user, save) {
    const cd = timeLeft(space.lastUpgrade, COOLDOWNS.UPGRADE);
    if (cd) return message.reply(fonts.bold(`⏰ Amélioration disponible dans ${cd}.`));

    const cost = 1000 * space.shipLevel;
    const totalCash = (user.money || 0) + space.credits;
    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = cost;
    if (space.credits >= reste) {
        space.credits -= reste;
        reste = 0;
    } else {
        reste -= space.credits;
        space.credits = 0;
        user.money = (user.money || 0) - reste;
    }

    space.shipLevel++;
    const stats = getShipStats(space);
    space.maxShipHP = stats.maxHP;
    space.shipHP = stats.maxHP;
    space.attack = stats.attack;
    space.defense = stats.defense;
    space.cargo = stats.cargo;
    space.lastUpgrade = Date.now();
    addTransaction(space, "upgrade", -cost, "Amélioration vaisseau");
    await save();

    return message.reply(fonts.bold(`
⬆️ AMÉLIORATION RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nouveau niveau: ${space.shipLevel}
❤️ PV: ${stats.maxHP}
⚔️ Attaque: ${stats.attack}
🛡️ Défense: ${stats.defense}
📦 Cargo: ${stats.cargo}
💰 Coût: ${FM(cost)}
		`));
}

async function cmdExplore(message, space, save) {
    const cd = timeLeft(space.lastExplore, COOLDOWNS.EXPLORE);
    if (cd) return message.reply(fonts.bold(`⏰ Exploration disponible dans ${cd}.`));

    const system = SYSTEMS.find(s => s.id === space.currentSystem);
    if (!system) return message.reply(fonts.bold("❌ Système inconnu."));

    // Événements aléatoires
    const events = [
        { type: "ressource", texte: "💎 Vous avez découvert un gisement de ressources!", gain: [500, 2000] },
        { type: "trésor", texte: "📦 Vous avez trouvé une cargaison abandonnée!", gain: [1000, 5000] },
        { type: "rencontre", texte: "🛸 Vous rencontrez un vaisseau marchand amical.", gain: [0, 0] },
        { type: "danger", texte: "⚡ Une tempête spatiale endommage votre vaisseau!", gain: [-200, -800] },
    ];

    const event = pick(events);
    let messageText = "";
    let gain = 0;

    if (event.type === "ressource" || event.type === "trésor") {
        gain = rand(event.gain[0], event.gain[1]);
        const bonus = space.premium ? 2 : 1;
        gain = Math.floor(gain * bonus);
        space.credits += gain;
        space.totalEarned += gain;
        messageText = `${event.texte} +${FM(gain)} crédits!`;
    } else if (event.type === "danger") {
        gain = rand(event.gain[0], event.gain[1]);
        space.credits = Math.max(0, space.credits + gain);
        messageText = `${event.texte} Perte: ${FM(Math.abs(gain))} crédits.`;
    } else {
        messageText = event.texte;
    }

    space.xp += 20 + system.danger * 5;
    space.level = Math.floor(space.xp / 100) + 1;
    if (!space.exploredSystems.includes(space.currentSystem)) {
        space.exploredSystems.push(space.currentSystem);
    }
    space.lastExplore = Date.now();
    addTransaction(space, "explore", gain, `Exploration: ${system.nom}`);
    const newAchievements = checkAchievements(space);
    await save();

    return message.reply(fonts.bold(`
🌌 EXPLORATION DE ${system.emoji} ${system.nom}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${messageText}
⭐ XP: +${20 + system.danger * 5}
📈 Niveau: ${space.level}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdWarp(message, args, space, user, save) {
    const systemId = args[1]?.toUpperCase();
    const system = SYSTEMS.find(s => s.id === systemId);
    if (!system) {
        return message.reply(fonts.bold(`❌ Système inconnu. Systèmes disponibles: ${SYSTEMS.map(s => s.id).join(", ")}`));
    }
    if (system.id === space.currentSystem) {
        return message.reply(fonts.bold(`❌ Vous êtes déjà dans ce système.`));
    }

    const cost = 1000;
    const totalCash = (user.money || 0) + space.credits;
    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants pour le voyage. Coût: ${FM(cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = cost;
    if (space.credits >= reste) {
        space.credits -= reste;
        reste = 0;
    } else {
        reste -= space.credits;
        space.credits = 0;
        user.money = (user.money || 0) - reste;
    }

    space.currentSystem = systemId;
    addTransaction(space, "warp", -cost, `Voyage vers ${system.nom}`);
    await save();

    return message.reply(fonts.bold(`
🛸 VOYAGE HYPERSPATIAL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arrivée à ${system.emoji} ${system.nom}
⚠️ Niveau de danger: ${"⭐".repeat(system.danger)}
💰 Coût: ${FM(cost)}
🌐 Systèmes explorés: ${space.exploredSystems.length}/6
		`));
}

async function cmdMarket(message, space) {
    const system = SYSTEMS.find(s => s.id === space.currentSystem);
    if (!system) return message.reply(fonts.bold("❌ Système inconnu."));

    let txt = `${fonts.bold("📦 MARCHÉ DE " + system.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `🪙 Crédits: ${FM(space.credits)}\n📦 Cargo: ${space.cargoUsed}/${space.cargo}\n\n`;

    // Afficher les ressources disponibles dans ce système
    const available = system.tradeGoods || [];
    for (const item of available) {
        const res = Object.values(RESOURCES).find(r => r.nom === item);
        if (res) {
            const price = Math.floor(res.basePrice * (0.8 + Math.random() * 0.4));
            const owned = space.cargoItems[res.id] || 0;
            txt += `${res.emoji} ${res.nom} [${res.id}]\n`;
            txt += `   💰 Prix: ${FM(price)}/unité\n`;
            txt += `   📦 Possédé: ${owned}\n\n`;
        }
    }
    txt += `Acheter: space buy <RESSOURCE> <qte>\n`;
    txt += `Vendre: space sell <RESSOURCE> <qte>`;
    return message.reply(txt);
}

async function cmdBuy(message, args, space, user, save) {
    const resId = args[1]?.toUpperCase();
    const qte = parseInt(args[2]) || 1;
    const res = RESOURCES[resId];
    if (!res) {
        return message.reply(fonts.bold(`❌ Ressource inconnue. Utilisez 'space market'.`));
    }

    const system = SYSTEMS.find(s => s.id === space.currentSystem);
    if (!system || !(system.tradeGoods || []).includes(res.nom)) {
        return message.reply(fonts.bold(`❌ Cette ressource n'est pas disponible dans ce système.`));
    }

    const price = Math.floor(res.basePrice * (0.8 + Math.random() * 0.4));
    const totalCost = price * qte;
    const stats = getShipStats(space);
    if (space.cargoUsed + qte > stats.cargo) {
        return message.reply(fonts.bold(`❌ Espace cargo insuffisant. Utilisé: ${space.cargoUsed}/${stats.cargo}`));
    }
    if (space.credits < totalCost) {
        return message.reply(fonts.bold(`❌ Crédits insuffisants. Coût: ${FM(totalCost)}, disponible: ${FM(space.credits)}`));
    }

    space.credits -= totalCost;
    space.cargoItems[resId] = (space.cargoItems[resId] || 0) + qte;
    space.cargoUsed += qte;
    space.tradesDone++;
    addTransaction(space, "trade", -totalCost, `Achat ${qte}x ${res.nom}`);
    await save();

    return message.reply(fonts.bold(`
🛒 ACHAT EFFECTUÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${res.emoji} ${res.nom}
Quantité: ${qte}
Prix unitaire: ${FM(price)}
Total: ${FM(totalCost)}
📦 Cargo restant: ${stats.cargo - space.cargoUsed}
		`));
}

async function cmdSell(message, args, space, save) {
    const resId = args[1]?.toUpperCase();
    const qte = parseInt(args[2]) || 1;
    const res = RESOURCES[resId];
    if (!res) {
        return message.reply(fonts.bold(`❌ Ressource inconnue.`));
    }
    if (!space.cargoItems[resId] || space.cargoItems[resId] < qte) {
        return message.reply(fonts.bold(`❌ Stock insuffisant. Vous avez ${space.cargoItems[resId] || 0} ${res.nom}.`));
    }

    const system = SYSTEMS.find(s => s.id === space.currentSystem);
    if (!system || !(system.tradeGoods || []).includes(res.nom)) {
        return message.reply(fonts.bold(`❌ Cette ressource ne se vend pas bien ici.`));
    }

    const price = Math.floor(res.basePrice * (0.8 + Math.random() * 0.4));
    const totalGain = price * qte;
    const bonus = space.premium ? 1.2 : 1;
    const finalGain = Math.floor(totalGain * bonus);

    space.credits += finalGain;
    space.totalEarned += finalGain;
    space.cargoItems[resId] -= qte;
    if (space.cargoItems[resId] <= 0) delete space.cargoItems[resId];
    space.cargoUsed -= qte;
    space.tradesDone++;
    addTransaction(space, "trade", finalGain, `Vente ${qte}x ${res.nom}`);
    const newAchievements = checkAchievements(space);
    await save();

    return message.reply(fonts.bold(`
💰 VENTE EFFECTUÉE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${res.emoji} ${res.nom}
Quantité: ${qte}
Prix unitaire: ${FM(price)}
Total: ${FM(finalGain)}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdCargo(message, space) {
    if (space.cargoUsed === 0) {
        return message.reply(fonts.bold("📦 Cargo vide."));
    }
    let txt = `${fonts.bold("📦 CARGAISON")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    let total = 0;
    for (const [resId, qte] of Object.entries(space.cargoItems)) {
        const res = RESOURCES[resId];
        if (res) {
            const value = res.basePrice * qte;
            total += value;
            txt += `${res.emoji} ${res.nom}: ${qte} unités (${FM(value)})\n`;
        }
    }
    txt += `\n${L()}\n📊 Valeur totale: ${FM(total)}`;
    return message.reply(txt);
}

async function cmdFight(message, space, save) {
    if (space.activeFight) {
        return message.reply(fonts.bold(`⏳ Un combat est déjà en cours. Vérifiez avec 'space fight check'.`));
    }
    const cd = timeLeft(space.lastFight, COOLDOWNS.FIGHT);
    if (cd) return message.reply(fonts.bold(`⏰ Combat disponible dans ${cd}.`));

    const system = SYSTEMS.find(s => s.id === space.currentSystem);
    if (!system) return message.reply(fonts.bold("❌ Système inconnu."));

    // Sélectionner un ennemi en fonction du danger
    const maxEnemyIndex = Math.min(system.danger, ENEMIES.length - 1);
    const enemy = ENEMIES[rand(0, maxEnemyIndex)];

    // Initialiser le combat
    const stats = getShipStats(space);
    let enemyHP = enemy.hp;
    let playerHP = stats.hp;
    let rounds = 0;
    let damageDealt = 0;
    let damageTaken = 0;

    // Simuler le combat (automatique pour l'instant, mais on peut le faire en plusieurs tours)
    // Pour simplifier, on fait un combat en une fois avec des calculs
    const playerAttack = stats.attack;
    const playerDefense = stats.defense;
    const enemyAttack = enemy.attack;

    // Simulation
    while (playerHP > 0 && enemyHP > 0) {
        rounds++;
        // Attaque du joueur
        let dmg = Math.floor(playerAttack * (0.7 + Math.random() * 0.6));
        // Bonus de défense (réduction des dégâts ennemis)
        const enemyDmg = Math.max(0, Math.floor(enemyAttack * (0.7 + Math.random() * 0.6) - playerDefense * 0.2));
        enemyHP -= dmg;
        damageDealt += dmg;
        if (enemyHP <= 0) break;
        playerHP -= enemyDmg;
        damageTaken += enemyDmg;
    }

    if (enemyHP <= 0) {
        // Victoire
        const reward = rand(enemy.reward[0], enemy.reward[1]);
        const bonus = space.premium ? 1.5 : 1;
        const finalReward = Math.floor(reward * bonus);
        const xpGain = Math.floor(enemy.xp * (1 + system.danger * 0.1));

        space.credits += finalReward;
        space.totalEarned += finalReward;
        space.xp += xpGain;
        space.level = Math.floor(space.xp / 100) + 1;
        space.battlesWon++;
        space.shipHP = Math.max(1, playerHP); // Conservation des PV restants
        space.lastFight = Date.now();
        addTransaction(space, "fight", finalReward, `Victoire contre ${enemy.nom}`);
        const newAchievements = checkAchievements(space);
        await save();

        return message.reply(fonts.bold(`
⚔️ VICTOIRE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${enemy.emoji} ${enemy.nom} vaincu!
Rounds: ${rounds}
💥 Dégâts infligés: ${damageDealt}
💢 Dégâts subis: ${damageTaken}
❤️ PV restants: ${playerHP}

💰 Récompense: ${FM(finalReward)}
⭐ XP: +${xpGain}
📈 Niveau: ${space.level}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
    } else {
        // Défaite
        const perte = Math.floor(space.credits * 0.1);
        space.credits = Math.max(0, space.credits - perte);
        space.battlesLost++;
        space.shipHP = Math.max(1, playerHP);
        space.lastFight = Date.now();
        addTransaction(space, "fight", -perte, `Défaite contre ${enemy.nom}`);
        await save();

        return message.reply(fonts.bold(`
💀 DÉFAITE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${enemy.emoji} ${enemy.nom} vous a vaincu!
Rounds: ${rounds}
💢 Dégâts subis: ${damageTaken}
❤️ PV restants: ${playerHP}
💸 Perte: ${FM(perte)}

💡 Réparez votre vaisseau avec 'space repair'.
		`));
    }
}

async function cmdRepair(message, space, user, save) {
    const cd = timeLeft(space.lastRepair, COOLDOWNS.REPAIR);
    if (cd) return message.reply(fonts.bold(`⏰ Réparation disponible dans ${cd}.`));

    const stats = getShipStats(space);
    if (space.shipHP >= stats.maxHP) {
        return message.reply(fonts.bold(`✅ Vaisseau déjà en parfait état.`));
    }

    const cost = 500;
    const totalCash = (user.money || 0) + space.credits;
    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = cost;
    if (space.credits >= reste) {
        space.credits -= reste;
        reste = 0;
    } else {
        reste -= space.credits;
        space.credits = 0;
        user.money = (user.money || 0) - reste;
    }

    space.shipHP = stats.maxHP;
    space.lastRepair = Date.now();
    addTransaction(space, "repair", -cost, "Réparation du vaisseau");
    await save();

    return message.reply(fonts.bold(`
🔧 RÉPARATION TERMINÉE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❤️ PV: ${space.shipHP}/${stats.maxHP}
💰 Coût: ${FM(cost)}
		`));
}

async function cmdCrewList(message) {
    let txt = `${fonts.bold("👥 MEMBRES D'ÉQUIPAGE DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const c of CREW_TYPES) {
        txt += `${c.emoji} ${c.nom} [${c.id}]\n`;
        txt += `   💰 Coût: ${FM(c.cost)}\n`;
        txt += `   📊 Bonus: ${c.bonus} +${pct(c.bonusValue)}\n\n`;
    }
    txt += `Recruter: space crew hire <ID>`;
    return message.reply(txt);
}

async function cmdCrewHire(message, args, space, user, save) {
    const cd = timeLeft(space.lastRecruit, COOLDOWNS.RECRUIT);
    if (cd) return message.reply(fonts.bold(`⏰ Recrutement disponible dans ${cd}.`));

    const crewId = args[1]?.toUpperCase();
    const crew = CREW_TYPES.find(c => c.id === crewId);
    if (!crew) {
        return message.reply(fonts.bold(`❌ Membre inconnu. Utilisez 'space crew list'.`));
    }
    if (space.crew.length >= 6) {
        return message.reply(fonts.bold(`❌ Équipage complet (6/6).`));
    }
    if (space.crew.includes(crewId)) {
        return message.reply(fonts.bold(`❌ Vous avez déjà recruté ${crew.nom}.`));
    }

    const totalCash = (user.money || 0) + space.credits;
    if (totalCash < crew.cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(crew.cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = crew.cost;
    if (space.credits >= reste) {
        space.credits -= reste;
        reste = 0;
    } else {
        reste -= space.credits;
        space.credits = 0;
        user.money = (user.money || 0) - reste;
    }

    space.crew.push(crewId);
    space.lastRecruit = Date.now();
    // Recalculer les stats du vaisseau
    const stats = getShipStats(space);
    space.maxShipHP = stats.maxHP;
    space.shipHP = stats.maxHP;
    space.attack = stats.attack;
    space.defense = stats.defense;
    space.cargo = stats.cargo;
    addTransaction(space, "recruit", -crew.cost, `Recrutement: ${crew.nom}`);
    const newAchievements = checkAchievements(space);
    await save();

    return message.reply(fonts.bold(`
${crew.emoji} MEMBRE RECRUTÉ: ${crew.nom}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Coût: ${FM(crew.cost)}
📊 Bonus: ${crew.bonus} +${pct(crew.bonusValue)}
👥 Équipage: ${space.crew.length}/6
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdCrewStats(message, space) {
    if (space.crew.length === 0) {
        return message.reply(fonts.bold("👥 Vous n'avez pas encore recruté d'équipage."));
    }
    let txt = `${fonts.bold("👥 VOTRE ÉQUIPAGE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const cId of space.crew) {
        const c = CREW_TYPES.find(ct => ct.id === cId);
        if (c) {
            txt += `${c.emoji} ${c.nom}\n`;
            txt += `   📊 ${c.bonus} +${pct(c.bonusValue)}\n\n`;
        }
    }
    return message.reply(txt);
}

async function cmdDaily(message, space, save) {
    const cd = timeLeft(space.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé! Prochain dans ${cd}.`));

    if (Date.now() - (space.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
        space.streak++;
    } else {
        space.streak = 1;
    }

    const baseReward = 2000;
    const streakBonus = Math.min(space.streak * 300, 3000);
    const levelBonus = space.level * 500;
    const premiumMultiplier = space.premium ? 2 : 1;
    const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

    space.credits += totalReward;
    space.totalEarned += totalReward;
    space.xp += 20;
    space.lastDaily = Date.now();
    addTransaction(space, "daily", totalReward, `Récompense quotidienne (série ${space.streak} jours)`);
    const newAchievements = checkAchievements(space);
    await save();

    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Récompense: ${FM(totalReward)}
🔥 Série: ${space.streak} jours
📈 Niveau: ${space.level}
⭐ Premium: ${space.premium ? "2x Bonus!" : "Non"}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdAchievements(message, space) {
    let txt = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${fonts.bold("Progression:")} ${space.achievements.length}/${Object.keys(ACHIEVEMENTS_LIST).length}\n\n`;

    if (space.achievements.length === 0) {
        txt += "🎯 Aucun succès débloqué pour le moment.\n";
    } else {
        txt += `${fonts.bold("🎖️ DÉBLOQUÉS:")}\n`;
        for (const ach of space.achievements.slice(0, 10)) {
            const info = ACHIEVEMENTS_LIST[ach] || { emoji: "🏆", nom: ach };
            txt += `• ${info.emoji} ${info.nom}\n`;
        }
        if (space.achievements.length > 10) txt += `... et ${space.achievements.length - 10} de plus!\n`;
        txt += "\n";
    }

    txt += `${fonts.bold("🎯 PROCHAINS OBJECTIFS:")}\n`;
    const remaining = Object.keys(ACHIEVEMENTS_LIST).filter(a => !space.achievements.includes(a));
    for (const ach of remaining.slice(0, 5)) {
        const info = ACHIEVEMENTS_LIST[ach];
        txt += `• ${info.emoji} ${info.nom}: ${info.desc}\n`;
    }
    return message.reply(txt);
}

async function cmdRank(message, space) {
    let txt = `${fonts.bold("🚀 RANG SPATIAL")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    const ship = getShipData(space);
    txt += `${ship.emoji} Vaisseau: ${ship.nom} (Niv.${space.shipLevel})\n`;
    txt += `📈 Niveau: ${space.level}\n`;
    txt += `⚔️ Batailles: ${space.battlesWon} victoires, ${space.battlesLost} défaites\n`;
    txt += `📦 Échanges: ${space.tradesDone}\n`;
    txt += `🌐 Systèmes explorés: ${space.exploredSystems.length}/6\n`;
    txt += `💎 Patrimoine: ${FM(getTotalWealth(space, 0))}\n\n`;

    // Prochain palier
    const nextLevel = space.level + 1;
    const xpNeeded = nextLevel * 100;
    const xpCurrent = space.xp;
    txt += `${L()}\n⬆️ Prochain niveau: ${nextLevel}\n`;
    txt += `   XP: ${xpCurrent}/${xpNeeded}\n`;
    return message.reply(txt);
}

async function cmdLeaderboard(message, usersData) {
    try {
        const allUsers = await usersData.getAll();
        const joueurs = [];
        for (const [uid, u] of Object.entries(allUsers)) {
            const s = u.data?.space;
            if (s && s.totalEarned > 0) {
                joueurs.push({
                    uid,
                    nom: u.name || `User ${uid.slice(-4)}`,
                    totalEarned: s.totalEarned,
                    level: s.level,
                    battles: s.battlesWon,
                    explored: s.exploredSystems?.length || 0,
                    premium: s.premium || false,
                    achievements: s.achievements?.length || 0,
                    ship: s.ship ? SHIP_TYPES.find(sh => sh.id === s.ship)?.nom : "Inconnu",
                    shipEmoji: s.ship ? SHIP_TYPES.find(sh => sh.id === s.ship)?.emoji : "🛸",
                });
            }
        }
        joueurs.sort((a, b) => b.totalEarned - a.totalEarned);
        const top10 = joueurs.slice(0, 10);

        let txt = `${fonts.bold("👑 CLASSEMENT SPATIAL")}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        txt += `${fonts.bold("TOP 10 DES COMMANDANTS")}\n\n`;

        if (top10.length === 0) {
            txt += `${fonts.bold("📊 Aucun commandant classé pour le moment.")}`;
        } else {
            for (let i = 0; i < top10.length; i++) {
                const j = top10[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
                const crown = i === 0 ? " 👑" : i === 1 ? " ⭐" : i === 2 ? " ✨" : "";
                const premiumIcon = j.premium ? " 💎" : "";
                txt += `${medal} ${fonts.bold(j.nom)}${crown}${premiumIcon}\n`;
                txt += `   ${j.shipEmoji} Vaisseau: ${j.ship}\n`;
                txt += `   💰 Gains: ${FM(j.totalEarned)}\n`;
                txt += `   📈 Niveau: ${j.level}`;
                if (j.battles > 0) txt += ` | ⚔️ ${j.battles} batailles`;
                if (j.explored > 0) txt += ` | 🌐 ${j.explored} systèmes`;
                if (j.achievements > 0) txt += ` | 🏆 ${j.achievements} succès`;
                txt += `\n\n`;
            }
        }
        return message.reply(txt);
    } catch (e) {
        console.error("Leaderboard error:", e);
        return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
    }
}

async function cmdPremium(message, args, space, save) {
    const action = args[1]?.toLowerCase();
    if (action === "buy") {
        const cost = 500000;
        if (space.credits < cost) {
            return message.reply(fonts.bold(`❌ L'abonnement premium coûte ${FM(cost)}.\nVous avez ${FM(space.credits)}.`));
        }
        space.credits -= cost;
        space.premium = true;
        space.multiplier = 2.0;
        addTransaction(space, "premium", -cost, "Achat premium");
        await save();
        return message.reply(fonts.bold(`
💎 BIENVENUE AU CLUB PREMIUM SPATIAL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avantages Premium:
✅ 2x les gains sur toutes les activités
✅ Récompenses quotidiennes doublées
✅ Accès aux systèmes secrets
✅ Support prioritaire
✅ Statistiques avancées
		`));
    }

    return message.reply(fonts.bold(`
💎 ABONNEMENT PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Statut: ${space.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur: ${space.multiplier}x
Coût: ${FM(500000)}
${!space.premium ? "Utilisez 'space premium buy' pour devenir premium!" : ""}
		`));
}

async function cmdHistory(message, space) {
    const txs = space.transactions.slice(-15).reverse();
    if (txs.length === 0) {
        return message.reply(fonts.bold("📋 Aucune transaction enregistrée."));
    }
    let txt = `${fonts.bold("📋 HISTORIQUE (15 dernières)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const tx of txs) {
        const e = getTransactionEmoji(tx.type);
        const sign = tx.montant >= 0 ? "+" : "";
        const date = new Date(tx.date).toLocaleDateString("fr-FR");
        txt += `${e} ${tx.description}\n   ${sign}${FM(tx.montant)} (${date})\n\n`;
    }
    return message.reply(txt);
}

// MAIN EXPORT
module.exports = {
    config: {
        name: "space",
        aliases: [],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "🪐 Jeu de commandement spatial : exploration, commerce, combats et gestion d'équipage."
        },
        category: "economy",
        guide: {
            fr: "Tapez 'space help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, api, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID);
        if (!user) user = { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.space) user.data.space = initSpace();

        const space = user.data.space;
        const walletBalance = user.money || 0;

        const save = async () => {
            user.data.space = space;
            await usersData.set(senderID, user);
        };

        switch (sub) {
            case "help":
            case "aide":
                return message.reply(renderHelp());

            case "stat":
            case "status":
            case "dashboard":
            case "bal":
            case "balance":
                return message.reply(renderDashboard(space, walletBalance));

            case "deposit":
            case "dep":
                return cmdDeposit(message, args, space, user, save, walletBalance);

            case "withdraw":
            case "wd":
                return cmdWithdraw(message, args, space, user, save);

            case "ship":
                const shipAction = args[1]?.toLowerCase();
                if (shipAction === "list" || !shipAction) {
                    return cmdShipList(message);
                }
                if (shipAction === "buy") {
                    return cmdShipBuy(message, args.slice(2), space, user, save);
                }
                if (shipAction === "stats") {
                    return cmdShipStats(message, space);
                }
                if (shipAction === "upgrade") {
                    return cmdShipUpgrade(message, space, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: space ship [list|buy|stats|upgrade]"));

            case "explore":
                return cmdExplore(message, space, save);

            case "warp":
                return cmdWarp(message, args.slice(1), space, user, save);

            case "market":
                return cmdMarket(message, space);

            case "buy":
                return cmdBuy(message, args.slice(1), space, user, save);

            case "sell":
                return cmdSell(message, args.slice(1), space, save);

            case "cargo":
                return cmdCargo(message, space);

            case "fight":
                const fAction = args[1]?.toLowerCase();
                if (fAction === "check") {
                    if (space.activeFight) {
                        // Simuler le combat si déjà en cours (on le fait directement)
                        return message.reply(fonts.bold("⏳ Combat en cours... Utilisez 'space fight' pour le lancer."));
                    }
                    return message.reply(fonts.bold("❌ Aucun combat en cours."));
                }
                return cmdFight(message, space, save);

            case "repair":
                return cmdRepair(message, space, user, save);

            case "crew":
                const crewAction = args[1]?.toLowerCase();
                if (crewAction === "list" || !crewAction) {
                    return cmdCrewList(message);
                }
                if (crewAction === "hire" || crewAction === "recruter") {
                    return cmdCrewHire(message, args.slice(2), space, user, save);
                }
                if (crewAction === "stats") {
                    return cmdCrewStats(message, space);
                }
                return message.reply(fonts.bold("❓ Usage: space crew [list|hire|stats]"));

            case "daily":
                return cmdDaily(message, space, save);

            case "achievements":
            case "succes":
                return cmdAchievements(message, space);

            case "rank":
            case "rang":
                return cmdRank(message, space);

            case "leaderboard":
            case "classement":
                return cmdLeaderboard(message, usersData);

            case "premium":
                return cmdPremium(message, args, space, save);

            case "history":
            case "historique":
                return cmdHistory(message, space);

            default:
                return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'space help' pour voir la liste.`));
        }
    }
};