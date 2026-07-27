// colony.js
"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    EXPLORE: 2 * 60 * 60 * 1000,
    MINE: 1 * 60 * 60 * 1000,
    RESEARCH: 3 * 60 * 60 * 1000,
    BUILD: 4 * 60 * 60 * 1000,
    TRAIN: 2 * 60 * 60 * 1000,
    TRADE: 6 * 60 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
    BATTLE: 8 * 60 * 60 * 1000,
};

const PLANETS = [
    { id: "EARTH", nom: "Terre", emoji: "🌍", type: "Terrestre", ressources: ["EAU", "MINERAI"], habitabilite: 100, distance: 0 },
    { id: "MARS", nom: "Mars", emoji: "🔴", type: "Rocheux", ressources: ["MINERAI", "CARBONE"], habitabilite: 60, distance: 1.5 },
    { id: "LUNA", nom: "Lune", emoji: "🌙", type: "Lunaire", ressources: ["HELIUM", "SILICIUM"], habitabilite: 40, distance: 0.3 },
    { id: "EUROPA", nom: "Europe", emoji: "❄️", type: "Glacé", ressources: ["EAU", "GAZ"], habitabilite: 35, distance: 5.2 },
    { id: "TITAN", nom: "Titan", emoji: "🪐", type: "Gazeux", ressources: ["GAZ", "CARBONE"], habitabilite: 30, distance: 8.5 },
    { id: "PROXIMA", nom: "Proxima B", emoji: "🌟", type: "Exoplanète", ressources: ["CRYSTAL", "ENERGIE"], habitabilite: 75, distance: 4.2 },
    { id: "ANDROMEDA", nom: "Andromède", emoji: "🌌", type: "Galactique", ressources: ["ANTIMATIERE", "ENERGIE"], habitabilite: 50, distance: 12.7 },
];

const RESOURCES = {
    EAU: { id: "EAU", nom: "Eau", emoji: "💧", base: 100 },
    MINERAI: { id: "MINERAI", nom: "Minerai", emoji: "⛏️", base: 50 },
    CARBONE: { id: "CARBONE", nom: "Carbone", emoji: "⚫", base: 30 },
    HELIUM: { id: "HELIUM", nom: "Hélium", emoji: "🎈", base: 20 },
    SILICIUM: { id: "SILICIUM", nom: "Silicium", emoji: "💎", base: 15 },
    GAZ: { id: "GAZ", nom: "Gaz", emoji: "🔥", base: 25 },
    CRYSTAL: { id: "CRYSTAL", nom: "Crystal", emoji: "💠", base: 10 },
    ENERGIE: { id: "ENERGIE", nom: "Énergie", emoji: "⚡", base: 40 },
    ANTIMATIERE: { id: "ANTIMATIERE", nom: "Antimatière", emoji: "☢️", base: 5 },
};

const SHIPS = [
    { id: "SHUTTLE", nom: "Navette", emoji: "🚀", cout: { MINERAI: 20, CARBONE: 10 }, vitesse: 1, capacite: 5, armement: 0 },
    { id: "CRUISER", nom: "Croiseur", emoji: "🛸", cout: { MINERAI: 50, CARBONE: 30, SILICIUM: 20 }, vitesse: 2, capacite: 20, armement: 5 },
    { id: "DREADNOUGHT", nom: "Cuirassé", emoji: "⚔️", cout: { MINERAI: 100, CARBONE: 50, CRYSTAL: 30 }, vitesse: 3, capacite: 50, armement: 15 },
    { id: "CARRIER", nom: "Porte-Avions", emoji: "✈️", cout: { MINERAI: 80, HELIUM: 40, ENERGIE: 30 }, vitesse: 2, capacite: 100, armement: 10 },
];

const TECHNOLOGIES = [
    { id: "WARP", nom: "Propulsion Warp", emoji: "🌀", level: 0, maxLevel: 10, cost: (lvl) => Math.floor(50 * Math.pow(1.5, lvl)), effet: "Augmente la vitesse des vaisseaux" },
    { id: "SHIELD", nom: "Bouclier Énergétique", emoji: "🛡️", level: 0, maxLevel: 10, cost: (lvl) => Math.floor(30 * Math.pow(1.4, lvl)), effet: "Réduit les dégâts subis" },
    { id: "WEAPON", nom: "Armement Avancé", emoji: "🔫", level: 0, maxLevel: 10, cost: (lvl) => Math.floor(40 * Math.pow(1.5, lvl)), effet: "Augmente les dégâts infligés" },
    { id: "SCANNER", nom: "Scanner Deep Space", emoji: "📡", level: 0, maxLevel: 10, cost: (lvl) => Math.floor(20 * Math.pow(1.3, lvl)), effet: "Augmente les chances de découvertes" },
    { id: "TERRAFORM", nom: "Terraformation", emoji: "🌿", level: 0, maxLevel: 10, cost: (lvl) => Math.floor(60 * Math.pow(1.6, lvl)), effet: "Améliore l'habitabilité des planètes" },
];

const ALIEN_RACES = [
    { id: "ZARGS", nom: "Zargs", emoji: "👾", hostile: true, force: 3 },
    { id: "XELON", nom: "Xelons", emoji: "🖖", hostile: false, force: 2 },
    { id: "NEXUS", nom: "Nexus", emoji: "🌀", hostile: true, force: 5 },
    { id: "AETHER", nom: "Aethériens", emoji: "🌟", hostile: false, force: 4 },
];

function initColony() {
    return {
        resources: {
            EAU: 100,
            MINERAI: 50,
            CARBONE: 30,
            HELIUM: 20,
            SILICIUM: 15,
            GAZ: 25,
            CRYSTAL: 10,
            ENERGIE: 40,
            ANTIMATIERE: 5,
        },
        planets: ["EARTH"],
        colonies: [],
        ships: [],
        technologies: {
            WARP: 0,
            SHIELD: 0,
            WEAPON: 0,
            SCANNER: 0,
            TERRAFORM: 0,
        },
        population: 10,
        reputation: 0,
        credits: 0,
        totalCredits: 0,
        rank: "SETTLER",
        level: 1,
        xp: 0,
        lastExplore: null,
        lastMine: null,
        lastResearch: null,
        lastBuild: null,
        lastTrain: null,
        lastTrade: null,
        lastDaily: null,
        lastBattle: null,
        streak: 0,
        achievements: [],
        discoveries: [],
        tradeRoutes: [],
        currentMission: null,
        premium: false,
        multiplier: 1.0,
        transactions: [],
        alienStatus: "NEUTRAL",
        lastEvent: null,
    };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function L(char = "─", n = 44) { return char.repeat(n); }

function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRank(colony) {
    const ranks = [
        { id: "SETTLER", nom: "Colon", emoji: "👨‍🚀", min: 0 },
        { id: "EXPLORER", nom: "Explorateur", emoji: "🧭", min: 1000 },
        { id: "PIONEER", nom: "Pionnier", emoji: "🚀", min: 5000 },
        { id: "COMMANDER", nom: "Commandant", emoji: "⭐", min: 20000 },
        { id: "OVERLORD", nom: "Seigneur", emoji: "👑", min: 100000 },
    ];
    let rank = ranks[0];
    for (const r of ranks) {
        if (colony.totalCredits >= r.min) rank = r;
        else break;
    }
    return rank;
}

function getTotalResources(colony) {
    return Object.values(colony.resources).reduce((a, b) => a + b, 0);
}

function getResourceValue(resourceId) {
    const values = { EAU: 1, MINERAI: 3, CARBONE: 5, HELIUM: 10, SILICIUM: 8, GAZ: 6, CRYSTAL: 20, ENERGIE: 7, ANTIMATIERE: 50 };
    return values[resourceId] || 1;
}

function getTechLevel(colony, techId) {
    return colony.technologies[techId] || 0;
}

function checkAchievements(colony) {
    const list = [];
    if (!colony.achievements.includes("FIRST_PLANET") && colony.planets.length > 1)
        list.push("FIRST_PLANET");
    if (!colony.achievements.includes("RESOURCE_1000") && getTotalResources(colony) >= 1000)
        list.push("RESOURCE_1000");
    if (!colony.achievements.includes("RESOURCE_10000") && getTotalResources(colony) >= 10000)
        list.push("RESOURCE_10000");
    if (!colony.achievements.includes("POP_100") && colony.population >= 100)
        list.push("POP_100");
    if (!colony.achievements.includes("POP_1000") && colony.population >= 1000)
        list.push("POP_1000");
    if (!colony.achievements.includes("SHIP_5") && colony.ships.length >= 5)
        list.push("SHIP_5");
    if (!colony.achievements.includes("SHIP_10") && colony.ships.length >= 10)
        list.push("SHIP_10");
    if (!colony.achievements.includes("TECH_5") && Object.values(colony.technologies).some(t => t >= 5))
        list.push("TECH_5");
    if (!colony.achievements.includes("TECH_10") && Object.values(colony.technologies).some(t => t >= 10))
        list.push("TECH_10");
    if (!colony.achievements.includes("EXPLORE_10") && (colony.discoveries?.length || 0) >= 10)
        list.push("EXPLORE_10");
    if (!colony.achievements.includes("OVERLORD") && colony.rank === "OVERLORD")
        list.push("OVERLORD");
    if (!colony.achievements.includes("PREMIUM") && colony.premium)
        list.push("PREMIUM");
    if (!colony.achievements.includes("STREAK_7") && colony.streak >= 7)
        list.push("STREAK_7");
    if (!colony.achievements.includes("STREAK_30") && colony.streak >= 30)
        list.push("STREAK_30");
    for (const a of list) colony.achievements.push(a);
    return list;
}

function addTransaction(colony, type, montant, description) {
    colony.transactions.push({ type, montant, description, date: Date.now() });
    if (colony.transactions.length > 30) colony.transactions = colony.transactions.slice(-30);
}

function getTransactionEmoji(type) {
    const emojis = {
        explore: "🔭", mine: "⛏️", research: "🔬", build: "🏗️",
        trade: "🔄", battle: "⚔️", daily: "🎁", upgrade: "⬆️",
        colonize: "🏠", discover: "🌟", salvage: "💰", premium: "💎",
    };
    return emojis[type] || "💼";
}

function renderDashboard(colony, walletBalance) {
    const rank = getRank(colony);
    const totalRes = getTotalResources(colony);
    const totalValue = colony.credits + totalRes * 2 + colony.population * 10;
    const planetCount = colony.planets.length;
    const shipCount = colony.ships.length;

    let tier = "🌱 Colon";
    if (totalValue >= 100000) tier = "👑 Seigneur";
    else if (totalValue >= 20000) tier = "⭐ Commandant";
    else if (totalValue >= 5000) tier = "🚀 Pionnier";
    else if (totalValue >= 1000) tier = "🧭 Explorateur";

    return `
${fonts.bold("🌌 COLONIE SPATIALE")} ${rank.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(tier)} • ${fonts.bold("Niveau " + colony.level)}${colony.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 RESSOURCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💧 Eau: ${fonts.bold(colony.resources.EAU)}
⛏️ Minerai: ${fonts.bold(colony.resources.MINERAI)}
⚫ Carbone: ${fonts.bold(colony.resources.CARBONE)}
🎈 Hélium: ${fonts.bold(colony.resources.HELIUM)}
💎 Silicium: ${fonts.bold(colony.resources.SILICIUM)}
🔥 Gaz: ${fonts.bold(colony.resources.GAZ)}
💠 Crystal: ${fonts.bold(colony.resources.CRYSTAL)}
⚡ Énergie: ${fonts.bold(colony.resources.ENERGIE)}
☢️ Antimatière: ${fonts.bold(colony.resources.ANTIMATIERE)}
├─ ${fonts.bold("Total: " + totalRes + " unités")}

${fonts.bold("🏛️ COLONIE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🌍 Planètes: ${fonts.bold(planetCount)}
👥 Population: ${fonts.bold(colony.population)}
🛸 Vaisseaux: ${fonts.bold(shipCount)}
📡 Découvertes: ${fonts.bold(colony.discoveries?.length || 0)}
🎯 Réputation: ${fonts.bold(colony.reputation + "/1000")}

${fonts.bold("📊 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🪙 Crédits: ${fonts.bold(FM(colony.credits))}
📈 Crédits totaux: ${fonts.bold(FM(colony.totalCredits))}
💳 Portefeuille: ${fonts.bold(FM(walletBalance))}
💎 Valeur totale: ${fonts.bold(FM(totalValue))}

${fonts.bold("📈 RANG & PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${rank.emoji} Rang: ${fonts.bold(rank.nom)}
⭐ XP: ${fonts.bold(colony.xp.toLocaleString("fr-FR"))}
🏆 Succès: ${fonts.bold(colony.achievements.length + "/50")}
🔥 Série: ${fonts.bold(colony.streak + " jours")}
👾 Statut Alien: ${fonts.bold(colony.alienStatus)}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔭 Explorer: ${timeLeft(colony.lastExplore, COOLDOWNS.EXPLORE) || "✅ Prêt"}
⛏️ Miner: ${timeLeft(colony.lastMine, COOLDOWNS.MINE) || "✅ Prêt"}
🔬 Recherche: ${timeLeft(colony.lastResearch, COOLDOWNS.RESEARCH) || "✅ Prêt"}
🏗️ Construire: ${timeLeft(colony.lastBuild, COOLDOWNS.BUILD) || "✅ Prêt"}
⚔️ Bataille: ${timeLeft(colony.lastBattle, COOLDOWNS.BATTLE) || "✅ Prêt"}
🎁 Daily: ${timeLeft(colony.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
    return `
${fonts.bold("🌌 COLONIE SPATIALE - GUIDE COMPLET")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📊 TABLEAU DE BORD")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 colony stat - Tableau de bord complet

${fonts.bold("🔭 EXPLORATION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🌍 colony planets - Voir les planètes disponibles
🔭 colony explore <ID> - Explorer une planète
🏠 colony colonize <ID> - Coloniser une planète
📡 colony discover - Voir vos découvertes

${fonts.bold("⛏️ RESSOURCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📦 colony resources - Voir vos ressources
⛏️ colony mine <PLANET> <RESSOURCE> <qte> - Miner
🔄 colony trade <PLANET> <offre> <demande> - Échanger

${fonts.bold("🔬 TECHNOLOGIES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔬 colony tech list - Voir les technologies
⬆️ colony tech upgrade <ID> - Améliorer une technologie

${fonts.bold("🛸 VAISSEAUX")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🚀 colony ship list - Voir les vaisseaux disponibles
🏗️ colony ship build <ID> - Construire un vaisseau
⚔️ colony ship attack <ALIEN> - Attaquer un ennemi

${fonts.bold("👥 POPULATION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
👥 colony population - Voir votre population
🎓 colony train <nb> - Former des colons

${fonts.bold("🎁 RÉCOMPENSES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎁 colony daily - Récompense quotidienne
💎 colony premium buy - Devenir premium (2x gains)

${fonts.bold("🏆 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 colony rank - Votre rang
🏆 colony achievements - Succès débloqués
👑 colony leaderboard - Classement des joueurs
`.trim();
}

async function cmdExplore(message, args, colony, user, save) {
    const cd = timeLeft(colony.lastExplore, COOLDOWNS.EXPLORE);
    if (cd) return message.reply(fonts.bold(`⏰ Exploration disponible dans ${cd}.`));

    const planetId = args[1]?.toUpperCase();
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) {
        return message.reply(fonts.bold(`❌ Planète inconnue. Utilisez 'colony planets'.`));
    }

    const techLevel = getTechLevel(colony, "SCANNER");
    const discoveryChance = 0.3 + techLevel * 0.03;
    const resourceBonus = Math.floor(techLevel * 2);

    let msg = `${planet.emoji} ${fonts.bold("EXPLORATION: " + planet.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // Découverte de ressources
    if (Math.random() < discoveryChance) {
        const resource = pick(planet.ressources);
        const amount = rand(10, 30) + resourceBonus;
        colony.resources[resource] = (colony.resources[resource] || 0) + amount;
        colony.xp += 50;
        colony.reputation += 5;
        if (!colony.discoveries) colony.discoveries = [];
        colony.discoveries.push({ planet: planetId, resource, amount, date: Date.now() });
        addTransaction(colony, "discover", 0, `Découverte: ${amount} ${RESOURCES[resource]?.nom || resource} sur ${planet.nom}`);
        msg += `🌟 Découverte! ${amount} ${RESOURCES[resource]?.emoji || "📦"} ${RESOURCES[resource]?.nom || resource}\n`;
    } else {
        const salvage = rand(50, 200) + resourceBonus * 10;
        colony.credits += salvage;
        colony.totalCredits += salvage;
        addTransaction(colony, "salvage", salvage, `Récupération sur ${planet.nom}`);
        msg += `💰 Récupération: ${FM(salvage)} crédits\n`;
    }

    // Rencontre alien
    if (Math.random() < 0.15) {
        const alien = pick(ALIEN_RACES);
        if (alien.hostile) {
            if (colony.ships.length > 0) {
                const result = Math.random() < 0.6 + getTechLevel(colony, "WEAPON") * 0.02;
                if (result) {
                    const reward = rand(100, 500) * (1 + getTechLevel(colony, "WEAPON") * 0.1);
                    colony.credits += reward;
                    colony.totalCredits += reward;
                    colony.reputation += 10;
                    msg += `⚔️ Combat contre ${alien.emoji} ${alien.nom}! Victoire! +${FM(reward)} crédits\n`;
                } else {
                    const loss = Math.floor(colony.credits * 0.05);
                    colony.credits = Math.max(0, colony.credits - loss);
                    msg += `💀 Défaite contre ${alien.emoji} ${alien.nom}! Perte de ${FM(loss)} crédits\n`;
                }
            } else {
                const loss = Math.floor(colony.credits * 0.1);
                colony.credits = Math.max(0, colony.credits - loss);
                msg += `⚠️ ${alien.emoji} ${alien.nom} vous attaque! Sans vaisseau, perte de ${FM(loss)} crédits\n`;
            }
        } else {
            const tradeBonus = rand(50, 200);
            colony.credits += tradeBonus;
            colony.totalCredits += tradeBonus;
            colony.reputation += 5;
            msg += `🤝 Rencontre amicale avec ${alien.emoji} ${alien.nom}! Échange +${FM(tradeBonus)} crédits\n`;
        }
    }

    colony.lastExplore = Date.now();
    const newAchievements = checkAchievements(colony);
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    await save();
    return message.reply(fonts.bold(msg));
}

async function cmdMine(message, args, colony, user, save) {
    const cd = timeLeft(colony.lastMine, COOLDOWNS.MINE);
    if (cd) return message.reply(fonts.bold(`⏰ Minage disponible dans ${cd}.`));

    const planetId = args[1]?.toUpperCase();
    const resourceId = args[2]?.toUpperCase();
    const quantity = parseInt(args[3]) || 10;

    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return message.reply(fonts.bold(`❌ Planète inconnue.`));
    if (!colony.planets.includes(planetId)) {
        return message.reply(fonts.bold(`❌ Vous n'avez pas colonisé ${planet.nom}.`));
    }
    if (!planet.ressources.includes(resourceId)) {
        return message.reply(fonts.bold(`❌ ${resourceId} n'est pas disponible sur ${planet.nom}.`));
    }
    if (quantity <= 0 || quantity > 100) {
        return message.reply(fonts.bold("❌ Quantité invalide (1-100)."));
    }

    const techLevel = getTechLevel(colony, "SCANNER");
    const yieldAmount = Math.floor(quantity * (1 + techLevel * 0.1));
    colony.resources[resourceId] = (colony.resources[resourceId] || 0) + yieldAmount;
    colony.xp += Math.floor(yieldAmount / 2);
    colony.lastMine = Date.now();
    addTransaction(colony, "mine", 0, `Minage ${yieldAmount} ${RESOURCES[resourceId]?.nom || resourceId} sur ${planet.nom}`);
    await save();

    return message.reply(fonts.bold(`
⛏️ MINAGE EFFECTUÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${planet.emoji} ${planet.nom}
📦 ${RESOURCES[resourceId]?.emoji || "📦"} ${RESOURCES[resourceId]?.nom || resourceId}: +${yieldAmount}
⭐ XP: +${Math.floor(yieldAmount / 2)}
		`));
}

async function cmdResearch(message, args, colony, user, save) {
    const cd = timeLeft(colony.lastResearch, COOLDOWNS.RESEARCH);
    if (cd) return message.reply(fonts.bold(`⏰ Recherche disponible dans ${cd}.`));

    const techId = args[1]?.toUpperCase();
    const tech = TECHNOLOGIES.find(t => t.id === techId);
    if (!tech) {
        return message.reply(fonts.bold(`❌ Technologie inconnue. Utilisez 'colony tech list'.`));
    }

    const currentLevel = getTechLevel(colony, techId);
    if (currentLevel >= tech.maxLevel) {
        return message.reply(fonts.bold(`❌ ${tech.nom} est déjà au niveau max!`));
    }

    const cost = tech.cost(currentLevel);
    if (colony.credits < cost) {
        return message.reply(fonts.bold(`❌ Crédits insuffisants. Coût: ${FM(cost)}, vous avez ${FM(colony.credits)}.`));
    }

    colony.credits -= cost;
    colony.technologies[techId] = currentLevel + 1;
    colony.xp += 100 * (currentLevel + 1);
    colony.lastResearch = Date.now();
    addTransaction(colony, "research", -cost, `Recherche: ${tech.nom} Niv.${currentLevel + 1}`);
    await save();

    return message.reply(fonts.bold(`
🔬 RECHERCHE RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${tech.emoji} ${tech.nom} → Niveau ${currentLevel + 1}
💵 Coût: ${FM(cost)}
📈 Effet: ${tech.effet}
⭐ XP: +${100 * (currentLevel + 1)}
		`));
}

async function cmdBuildShip(message, args, colony, user, save) {
    const cd = timeLeft(colony.lastBuild, COOLDOWNS.BUILD);
    if (cd) return message.reply(fonts.bold(`⏰ Construction disponible dans ${cd}.`));

    const shipId = args[1]?.toUpperCase();
    const ship = SHIPS.find(s => s.id === shipId);
    if (!ship) {
        return message.reply(fonts.bold(`❌ Vaisseau inconnu. Utilisez 'colony ship list'.`));
    }

    // Vérifier les ressources
    for (const [resId, qte] of Object.entries(ship.cout)) {
        if ((colony.resources[resId] || 0) < qte) {
            return message.reply(fonts.bold(`❌ Ressources insuffisantes pour ${ship.nom}. Besoin de ${qte} ${RESOURCES[resId]?.nom || resId}.`));
        }
    }

    // Consommer les ressources
    for (const [resId, qte] of Object.entries(ship.cout)) {
        colony.resources[resId] -= qte;
    }

    colony.ships.push({
        id: shipId,
        name: ship.nom,
        built: Date.now(),
    });
    colony.xp += 50;
    colony.lastBuild = Date.now();
    addTransaction(colony, "build", 0, `Construction: ${ship.nom}`);
    await save();

    return message.reply(fonts.bold(`
🏗️ VAISSEAU CONSTRUIT!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ship.emoji} ${ship.nom}
⚡ Vitesse: ${ship.vitesse}
📦 Capacité: ${ship.capacite}
⚔️ Armement: ${ship.armement}
⭐ XP: +50
		`));
}

async function cmdBattle(message, args, colony, user, save) {
    const cd = timeLeft(colony.lastBattle, COOLDOWNS.BATTLE);
    if (cd) return message.reply(fonts.bold(`⏰ Bataille disponible dans ${cd}.`));

    if (colony.ships.length === 0) {
        return message.reply(fonts.bold("❌ Vous n'avez pas de vaisseau! Construisez-en un."));
    }

    const alienRace = args[1]?.toUpperCase();
    const alien = ALIEN_RACES.find(a => a.id === alienRace);
    if (!alien) {
        return message.reply(fonts.bold(`❌ Race alien inconnue. Choisissez parmi: ${ALIEN_RACES.map(a => a.id).join(", ")}`));
    }

    const shipCount = colony.ships.length;
    const techWeapon = getTechLevel(colony, "WEAPON");
    const techShield = getTechLevel(colony, "SHIELD");
    const power = shipCount * (5 + techWeapon) + (colony.population / 10);
    const defense = shipCount * (3 + techShield);

    let result = "";
    if (alien.hostile) {
        const alienPower = alien.force * 10 + Math.random() * 20;
        if (power + defense > alienPower) {
            const reward = Math.floor((100 + alien.force * 50) * (1 + techWeapon * 0.1));
            colony.credits += reward;
            colony.totalCredits += reward;
            colony.reputation += 15;
            result = `⚔️ VICTOIRE contre ${alien.emoji} ${alien.nom}!`;
            addTransaction(colony, "battle", reward, `Victoire contre ${alien.nom}`);
        } else {
            const loss = Math.floor(colony.credits * 0.1);
            colony.credits = Math.max(0, colony.credits - loss);
            result = `💀 DÉFAITE contre ${alien.emoji} ${alien.nom}!`;
            addTransaction(colony, "battle", -loss, `Défaite contre ${alien.nom}`);
        }
    } else {
        const reward = Math.floor(100 + alien.force * 30);
        colony.credits += reward;
        colony.totalCredits += reward;
        colony.reputation += 10;
        result = `🤝 ALLIANCE avec ${alien.emoji} ${alien.nom}!`;
        addTransaction(colony, "battle", reward, `Alliance avec ${alien.nom}`);
    }

    colony.lastBattle = Date.now();
    const newAchievements = checkAchievements(colony);
    await save();

    let msg = `${result}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛸 Vaisseaux: ${shipCount}\n`;
    msg += `💪 Puissance: ${Math.floor(power)}\n`;
    msg += `🛡️ Défense: ${Math.floor(defense)}\n`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    return message.reply(fonts.bold(msg));
}

async function cmdDaily(message, colony, save) {
    const cd = timeLeft(colony.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé! Prochain dans ${cd}.`));

    if (Date.now() - (colony.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
        colony.streak++;
    } else {
        colony.streak = 1;
    }

    const baseReward = 200;
    const streakBonus = Math.min(colony.streak * 20, 200);
    const levelBonus = colony.level * 50;
    const premiumMultiplier = colony.premium ? 2 : 1;
    const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

    colony.credits += totalReward;
    colony.totalCredits += totalReward;
    colony.lastDaily = Date.now();
    colony.reputation = Math.min(1000, colony.reputation + 2);
    addTransaction(colony, "daily", totalReward, `Récompense quotidienne (série ${colony.streak} jours)`);
    const newAchievements = checkAchievements(colony);
    await save();

    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪙 Récompense: ${FM(totalReward)}
🔥 Série: ${colony.streak} jours
📈 Niveau: ${colony.level}
⭐ Premium: ${colony.premium ? "2x Bonus!" : "Non"}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

// Main export
module.exports = {
    config: {
        name: "colony",
        aliases: [],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "🌌 Simulation de colonisation spatiale et de gestion interstellaire."
        },
        category: "economy",
        guide: {
            fr: "Tapez 'colony help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, api, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID);
        if (!user) user = { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.colony) user.data.colony = initColony();

        const colony = user.data.colony;
        const walletBalance = user.money || 0;

        const rank = getRank(colony);
        colony.rank = rank.id;

        const save = async () => {
            user.data.colony = colony;
            await usersData.set(senderID, user);
        };

        switch (sub) {
            case "help":
            case "aide":
                return message.reply(renderHelp());

            case "stat":
            case "status":
            case "dashboard":
                return message.reply(renderDashboard(colony, walletBalance));

            case "planets":
                let planetsText = `${fonts.bold("🌍 PLANÈTES CONNUES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                for (const p of PLANETS) {
                    const colonized = colony.planets.includes(p.id);
                    planetsText += `${p.emoji} ${p.nom} [${p.id}]\n`;
                    planetsText += `   🪐 Type: ${p.type}\n`;
                    planetsText += `   📦 Ressources: ${p.ressources.map(r => RESOURCES[r]?.emoji || r).join(" ")}\n`;
                    planetsText += `   🏠 Habitabilité: ${p.habitabilite}%\n`;
                    planetsText += `   ${colonized ? "✅ COLONISÉE" : "🔒 Non colonisée"}\n\n`;
                }
                planetsText += `Explorer: colony explore <ID> | Coloniser: colony colonize <ID>`;
                return message.reply(planetsText);

            case "explore":
                return cmdExplore(message, args.slice(1), colony, user, save);

            case "colonize":
            case "coloniser":
                const planetId = args[1]?.toUpperCase();
                const planet = PLANETS.find(p => p.id === planetId);
                if (!planet) return message.reply(fonts.bold(`❌ Planète inconnue.`));
                if (colony.planets.includes(planetId)) {
                    return message.reply(fonts.bold(`❌ Vous avez déjà colonisé ${planet.nom}.`));
                }
                const cost = planet.distance * 100 + 200;
                if (colony.credits < cost) {
                    return message.reply(fonts.bold(`❌ Crédits insuffisants. Coût: ${FM(cost)}.`));
                }
                colony.credits -= cost;
                colony.planets.push(planetId);
                colony.population += 10;
                colony.reputation += 20;
                addTransaction(colony, "colonize", -cost, `Colonisation de ${planet.nom}`);
                const newAchievements = checkAchievements(colony);
                await save();
                return message.reply(fonts.bold(`
🏠 COLONISATION RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${planet.emoji} ${planet.nom}
💵 Coût: ${FM(cost)}
👥 Nouveaux colons: +10
🎯 Réputation: +20
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));

            case "resources":
            case "ressources":
                let resText = `${fonts.bold("📦 RESSOURCES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                for (const [id, qte] of Object.entries(colony.resources)) {
                    const res = RESOURCES[id];
                    if (res) {
                        resText += `${res.emoji} ${res.nom}: ${qte}\n`;
                    }
                }
                resText += `\nTotal: ${getTotalResources(colony)} unités`;
                return message.reply(resText);

            case "mine":
                return cmdMine(message, args.slice(1), colony, user, save);

            case "trade":
                return message.reply(fonts.bold("🔄 Système de commerce en développement. Revenez plus tard!"));

            case "tech":
                const techAction = args[1]?.toLowerCase();
                if (techAction === "list" || !techAction) {
                    let techText = `${fonts.bold("🔬 TECHNOLOGIES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    for (const tech of TECHNOLOGIES) {
                        const level = getTechLevel(colony, tech.id);
                        const nextCost = tech.cost(level);
                        techText += `${tech.emoji} ${tech.nom}\n`;
                        techText += `   Niveau: ${level}/${tech.maxLevel}\n`;
                        techText += `   Coût prochain: ${FM(nextCost)}\n`;
                        techText += `   Effet: ${tech.effet}\n\n`;
                    }
                    techText += `Améliorer: colony tech upgrade <ID>`;
                    return message.reply(techText);
                }
                if (techAction === "upgrade") {
                    return cmdResearch(message, args.slice(2), colony, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: colony tech [list|upgrade]"));

            case "ship":
                const shipAction = args[1]?.toLowerCase();
                if (shipAction === "list" || !shipAction) {
                    let shipText = `${fonts.bold("🛸 VAISSEAUX DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    for (const ship of SHIPS) {
                        shipText += `${ship.emoji} ${ship.nom} [${ship.id}]\n`;
                        shipText += `   📦 Coût: ${Object.entries(ship.cout).map(([r, q]) => `${RESOURCES[r]?.emoji || r} ${q}`).join(" ")}\n`;
                        shipText += `   ⚡ Vitesse: ${ship.vitesse}\n`;
                        shipText += `   🛡️ Capacité: ${ship.capacite}\n`;
                        shipText += `   ⚔️ Armement: ${ship.armement}\n\n`;
                    }
                    shipText += `Construire: colony ship build <ID>\n`;
                    shipText += `Attaquer: colony ship attack <ALIEN>`;
                    return message.reply(shipText);
                }
                if (shipAction === "build") {
                    return cmdBuildShip(message, args.slice(2), colony, user, save);
                }
                if (shipAction === "attack") {
                    return cmdBattle(message, args.slice(2), colony, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: colony ship [list|build|attack]"));

            case "population":
                return message.reply(fonts.bold(`
👥 POPULATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍🚀 Colons: ${colony.population}
🏠 Planètes colonisées: ${colony.planets.length}
📈 Croissance estimée: +${Math.floor(colony.population * 0.02)}/jour
				`));

            case "train":
                const count = parseInt(args[1]) || 1;
                if (count <= 0 || count > 100) return message.reply(fonts.bold("❌ Nombre invalide (1-100)."));
                const costPerPerson = 10;
                const totalCost = count * costPerPerson;
                if (colony.credits < totalCost) {
                    return message.reply(fonts.bold(`❌ Crédits insuffisants. Coût: ${FM(totalCost)}.`));
                }
                colony.credits -= totalCost;
                colony.population += count;
                addTransaction(colony, "train", -totalCost, `Formation de ${count} colons`);
                await save();
                return message.reply(fonts.bold(`
🎓 FORMATION RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Nouveaux colons: +${count}
👨‍🚀 Population totale: ${colony.population}
💵 Coût: ${FM(totalCost)}
				`));

            case "rank":
            case "rang":
                const rankInfo = getRank(colony);
                const nextRankIdx = ["SETTLER", "EXPLORER", "PIONEER", "COMMANDER", "OVERLORD"].indexOf(rankInfo.id) + 1;
                const nextRank = nextRankIdx < 5 ? { id: ["SETTLER", "EXPLORER", "PIONEER", "COMMANDER", "OVERLORD"][nextRankIdx], min: [0, 1000, 5000, 20000, 100000][nextRankIdx] } : null;
                let rankText = `${rankInfo.emoji} ${fonts.bold("RANG: " + rankInfo.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                rankText += `📊 Crédits totaux: ${FM(colony.totalCredits)}\n`;
                rankText += `🌍 Planètes: ${colony.planets.length}\n`;
                rankText += `👥 Population: ${colony.population}\n`;
                rankText += `🛸 Vaisseaux: ${colony.ships.length}\n\n`;
                if (nextRank) {
                    const manque = nextRank.min - colony.totalCredits;
                    rankText += `${L()}\n⬆️ Prochain rang: ${nextRank.id === "EXPLORER" ? "🧭" : nextRank.id === "PIONEER" ? "🚀" : nextRank.id === "COMMANDER" ? "⭐" : "👑"} ${nextRank.id}\n`;
                    rankText += `   Requis: ${FM(nextRank.min)} crédits totaux\n`;
                    rankText += `   Manque: ${FM(Math.max(0, manque))}\n`;
                } else {
                    rankText += "👑 Vous avez atteint le rang MAXIMUM!";
                }
                return message.reply(rankText);

            case "achievements":
            case "succes":
                const achList = {
                    FIRST_PLANET: { emoji: "🌍", nom: "Première Colonie", desc: "Coloniser une 2ème planète" },
                    RESOURCE_1000: { emoji: "📦", nom: "1000 Ressources", desc: "Atteindre 1000 unités de ressources" },
                    RESOURCE_10000: { emoji: "💎", nom: "10000 Ressources", desc: "Atteindre 10000 unités de ressources" },
                    POP_100: { emoji: "👥", nom: "100 Colons", desc: "Atteindre 100 colons" },
                    POP_1000: { emoji: "👥", nom: "1000 Colons", desc: "Atteindre 1000 colons" },
                    SHIP_5: { emoji: "🛸", nom: "5 Vaisseaux", desc: "Construire 5 vaisseaux" },
                    SHIP_10: { emoji: "🛸", nom: "10 Vaisseaux", desc: "Construire 10 vaisseaux" },
                    TECH_5: { emoji: "🔬", nom: "Tech Niveau 5", desc: "Atteindre niveau 5 dans une technologie" },
                    TECH_10: { emoji: "🔬", nom: "Tech Niveau 10", desc: "Atteindre niveau 10 dans une technologie" },
                    EXPLORE_10: { emoji: "🔭", nom: "10 Explorations", desc: "Effectuer 10 découvertes" },
                    OVERLORD: { emoji: "👑", nom: "Seigneur", desc: "Atteindre le rang Seigneur" },
                    PREMIUM: { emoji: "💎", nom: "Premium", desc: "Devenir Premium" },
                    STREAK_7: { emoji: "🔥", nom: "Série 7 Jours", desc: "Maintenir une série de 7 jours" },
                    STREAK_30: { emoji: "⭐", nom: "Série 30 Jours", desc: "Maintenir une série de 30 jours" },
                };
                let achText = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                achText += `${fonts.bold("Progression:")} ${colony.achievements.length}/${Object.keys(achList).length}\n\n`;
                if (colony.achievements.length === 0) {
                    achText += "🎯 Aucun succès débloqué.\n";
                } else {
                    achText += `${fonts.bold("🎖️ DÉBLOQUÉS:")}\n`;
                    for (const a of colony.achievements.slice(0, 10)) {
                        const info = achList[a] || { emoji: "🏆", nom: a };
                        achText += `• ${info.emoji} ${info.nom}\n`;
                    }
                    if (colony.achievements.length > 10) achText += `... et ${colony.achievements.length - 10} de plus!\n`;
                    achText += "\n";
                }
                achText += `${fonts.bold("🎯 PROCHAINS OBJECTIFS:")}\n`;
                const remaining = Object.keys(achList).filter(a => !colony.achievements.includes(a));
                for (const a of remaining.slice(0, 5)) {
                    const info = achList[a];
                    achText += `• ${info.emoji} ${info.nom}: ${info.desc}\n`;
                }
                return message.reply(achText);

            case "leaderboard":
            case "classement":
                try {
                    const allUsers = await usersData.getAll();
                    const joueurs = [];
                    for (const [uid, u] of Object.entries(allUsers)) {
                        const c = u.data?.colony;
                        if (c && c.totalCredits > 0) {
                            joueurs.push({
                                uid,
                                nom: u.name || `User ${uid.slice(-4)}`,
                                totalCredits: c.totalCredits,
                                planets: c.planets?.length || 0,
                                population: c.population || 0,
                                rank: getRank(c).nom,
                                rankEmoji: getRank(c).emoji,
                                premium: c.premium || false,
                            });
                        }
                    }
                    joueurs.sort((a, b) => b.totalCredits - a.totalCredits);
                    const top10 = joueurs.slice(0, 10);
                    let lbText = `${fonts.bold("👑 CLASSEMENT COLONIAL")}\n`;
                    lbText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                    lbText += `${fonts.bold("TOP 10 DES COLONS")}\n\n`;
                    if (top10.length === 0) {
                        lbText += `${fonts.bold("📊 Aucun joueur classé.")}`;
                    } else {
                        for (let i = 0; i < top10.length; i++) {
                            const j = top10[i];
                            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
                            const crown = i === 0 ? " 👑" : i === 1 ? " ⭐" : i === 2 ? " ✨" : "";
                            const premiumIcon = j.premium ? " 💎" : "";
                            lbText += `${medal} ${fonts.bold(j.nom)}${crown}${premiumIcon}\n`;
                            lbText += `   ${j.rankEmoji} Rang: ${j.rank}\n`;
                            lbText += `   🪙 Crédits: ${FM(j.totalCredits)}\n`;
                            lbText += `   🌍 Planètes: ${j.planets} | 👥 Pop: ${j.population}\n\n`;
                        }
                    }
                    return message.reply(lbText);
                } catch (e) {
                    console.error("Leaderboard error:", e);
                    return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
                }

            case "premium":
                const premAction = args[1]?.toLowerCase();
                if (premAction === "buy") {
                    const cost = 500000;
                    if (colony.credits < cost) {
                        return message.reply(fonts.bold(`❌ Premium coûte ${FM(cost)}. Vous avez ${FM(colony.credits)}.`));
                    }
                    colony.credits -= cost;
                    colony.premium = true;
                    colony.multiplier = 2.0;
                    addTransaction(colony, "premium", -cost, "Achat premium");
                    await save();
                    return message.reply(fonts.bold(`
💎 BIENVENUE AU CLUB PREMIUM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 2x les gains sur toutes les activités
✅ Récompenses quotidiennes doublées
✅ Explorations plus fructueuses
✅ Support prioritaire
					`));
                }
                return message.reply(fonts.bold(`
💎 PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Statut: ${colony.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur: ${colony.multiplier}x
Coût: ${FM(500000)}
${!colony.premium ? "Utilisez 'colony premium buy' pour devenir premium!" : ""}
				`));

            case "daily":
                return cmdDaily(message, colony, save);

            default:
                return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'colony help' pour voir la liste.`));
        }
    }
};