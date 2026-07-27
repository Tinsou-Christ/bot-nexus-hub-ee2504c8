// hacker.js
"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    SCAN: 2 * 60 * 1000,
    ATTACK: 30 * 60 * 1000,
    DOWNLOAD: 10 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
    UPGRADE: 6 * 60 * 60 * 1000,
    TRAIN: 4 * 60 * 60 * 1000,
};

const SERVERS = [
    { id: "PUBLIC", nom: "Serveur Public", emoji: "🌐", niveau: 1, defense: 10, dataWorth: 100, reward: 500, xp: 10 },
    { id: "CORPORATE", nom: "Serveur Corporate", emoji: "🏢", niveau: 2, defense: 25, dataWorth: 500, reward: 2000, xp: 30 },
    { id: "BANK", nom: "Serveur Bancaire", emoji: "🏦", niveau: 3, defense: 40, dataWorth: 2000, reward: 8000, xp: 60 },
    { id: "GOVERNMENT", nom: "Serveur Gouvernemental", emoji: "🏛️", niveau: 4, defense: 60, dataWorth: 5000, reward: 20000, xp: 120 },
    { id: "MILITARY", nom: "Serveur Militaire", emoji: "⚔️", niveau: 5, defense: 85, dataWorth: 10000, reward: 50000, xp: 250 },
    { id: "BLACK_MARKET", nom: "Marché Noir", emoji: "💀", niveau: 6, defense: 100, dataWorth: 25000, reward: 100000, xp: 500 },
    { id: "DARK_WEB", nom: "Dark Web Hub", emoji: "👾", niveau: 7, defense: 150, dataWorth: 50000, reward: 250000, xp: 1000 },
];

const SOFTWARE = {
    EXPLOIT: { id: "EXPLOIT", nom: "Exploit Kit", emoji: "🔧", prix: 5000, bonus: 10, desc: "+10% chance de succès" },
    FIREWALL: { id: "FIREWALL", nom: "Firewall Bypass", emoji: "🛡️", prix: 10000, bonus: 15, desc: "-15% défense ennemie" },
    CRYPTER: { id: "CRYPTER", nom: "Crypteur", emoji: "🔐", prix: 15000, bonus: 20, desc: "+20% de discrétion" },
    ROOTKIT: { id: "ROOTKIT", nom: "Rootkit", emoji: "🗝️", prix: 25000, bonus: 25, desc: "Accès root permanent" },
    AI_HACK: { id: "AI_HACK", nom: "IA de Hacking", emoji: "🤖", prix: 50000, bonus: 35, desc: "+35% efficacité" },
    ZERO_DAY: { id: "ZERO_DAY", nom: "Zero-Day Exploit", emoji: "💥", prix: 100000, bonus: 50, desc: "Contourne toutes les défenses" },
};

const SKILLS = {
    CODING: { id: "CODING", nom: "Programmation", emoji: "💻", max: 50 },
    NETWORK: { id: "NETWORK", nom: "Réseaux", emoji: "🌐", max: 50 },
    CRYPTOGRAPHY: { id: "CRYPTOGRAPHY", nom: "Cryptographie", emoji: "🔑", max: 50 },
    SOCIAL: { id: "SOCIAL", nom: "Ingénierie Sociale", emoji: "🎭", max: 50 },
    FORENSICS: { id: "FORENSICS", nom: "Anti-Forensique", emoji: "🧹", max: 50 },
};

const RANKS = [
    { id: "SCRIPT_KIDDIE", nom: "Script Kiddie", emoji: "👶", minData: 0, bonus: 0 },
    { id: "HACKER", nom: "Hacker", emoji: "💻", minData: 10000, bonus: 0.1 },
    { id: "CRACKER", nom: "Cracker", emoji: "🔓", minData: 50000, bonus: 0.2 },
    { id: "PHREAKER", nom: "Phreaker", emoji: "📡", minData: 200000, bonus: 0.35 },
    { id: "CYBER_GOD", nom: "Cyber God", emoji: "👾", minData: 1000000, bonus: 0.5 },
];

function initHacker() {
    return {
        bitcoin: 0,
        totalEarned: 0,
        dataStolen: 0,
        rank: "SCRIPT_KIDDIE",
        level: 1,
        xp: 0,
        reputation: 0,
        serversHacked: [],
        software: [],
        skills: {
            CODING: 0,
            NETWORK: 0,
            CRYPTOGRAPHY: 0,
            SOCIAL: 0,
            FORENSICS: 0,
        },
        activeHack: null,
        lastScan: null,
        lastAttack: null,
        lastDownload: null,
        lastDaily: null,
        lastUpgrade: null,
        lastTrain: null,
        streak: 0,
        achievements: [],
        transactions: [],
        traceLevel: 0,
        encryptedBackup: 0,
        proxyLevel: 1,
        darkNetContacts: 0,
        premium: false,
        multiplier: 1.0,
    };
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function BTC(n) { return `₿${(n).toFixed(4)}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }
function L(char = "─", n = 44) { return char.repeat(n); }

function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRank(hacker) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (hacker.dataStolen >= r.minData) rank = r;
        else break;
    }
    return rank;
}

function getHackChance(hacker, server) {
    const baseChance = 0.3;
    const skillBonus = (hacker.skills.CODING + hacker.skills.NETWORK + hacker.skills.CRYPTOGRAPHY) / 300;
    const softwareBonus = hacker.software.reduce((sum, s) => sum + (SOFTWARE[s]?.bonus || 0) / 100, 0);
    const levelBonus = hacker.level * 0.005;
    const proxyBonus = hacker.proxyLevel * 0.02;
    const traceMalus = Math.max(0, hacker.traceLevel * 0.01);
    const chance = Math.min(0.95, baseChance + skillBonus + softwareBonus + levelBonus + proxyBonus - traceMalus);
    return Math.max(0.05, chance);
}

function getHackReward(hacker, server) {
    const baseReward = server.reward;
    const rankBonus = getRank(hacker).bonus;
    const skillBonus = (hacker.skills.CODING + hacker.skills.NETWORK) / 50;
    const multiplier = hacker.multiplier || 1;
    return Math.floor(baseReward * (1 + rankBonus + skillBonus) * multiplier);
}

function getXPForHack(server) {
    return server.xp * (1 + Math.random() * 0.5);
}

function checkAchievements(hacker) {
    const list = [];
    if (!hacker.achievements.includes("FIRST_HACK") && hacker.serversHacked.length >= 1)
        list.push("FIRST_HACK");
    if (!hacker.achievements.includes("DATA_10K") && hacker.dataStolen >= 10000)
        list.push("DATA_10K");
    if (!hacker.achievements.includes("DATA_100K") && hacker.dataStolen >= 100000)
        list.push("DATA_100K");
    if (!hacker.achievements.includes("DATA_1M") && hacker.dataStolen >= 1000000)
        list.push("DATA_1M");
    if (!hacker.achievements.includes("HACKER_RANK") && hacker.rank === "HACKER")
        list.push("HACKER_RANK");
    if (!hacker.achievements.includes("CYBER_GOD_RANK") && hacker.rank === "CYBER_GOD")
        list.push("CYBER_GOD_RANK");
    if (!hacker.achievements.includes("SOFTWARE_5") && hacker.software.length >= 5)
        list.push("SOFTWARE_5");
    if (!hacker.achievements.includes("SKILL_25") && Object.values(hacker.skills).some(s => s >= 25))
        list.push("SKILL_25");
    if (!hacker.achievements.includes("SKILL_50") && Object.values(hacker.skills).some(s => s >= 50))
        list.push("SKILL_50");
    if (!hacker.achievements.includes("STREAK_7") && hacker.streak >= 7)
        list.push("STREAK_7");
    if (!hacker.achievements.includes("STREAK_30") && hacker.streak >= 30)
        list.push("STREAK_30");
    if (!hacker.achievements.includes("PREMIUM") && hacker.premium)
        list.push("PREMIUM");
    if (!hacker.achievements.includes("PROXY_10") && hacker.proxyLevel >= 10)
        list.push("PROXY_10");
    if (!hacker.achievements.includes("TRACE_ZERO") && hacker.traceLevel === 0 && hacker.dataStolen > 0)
        list.push("TRACE_ZERO");
    for (const a of list) hacker.achievements.push(a);
    return list;
}

function addTransaction(hacker, type, montant, description) {
    hacker.transactions.push({ type, montant, description, date: Date.now() });
    if (hacker.transactions.length > 30) hacker.transactions = hacker.transactions.slice(-30);
}

function getTransactionEmoji(type) {
    const emojis = {
        hack: "💻", sell_data: "💰", buy_software: "🛒", upgrade_proxy: "🔄",
        train: "📚", daily: "🎁", backup: "💾", trace_clean: "🧹",
        premium: "💎", achievement: "🏆",
    };
    return emojis[type] || "💼";
}

function renderDashboard(hacker, walletBalance) {
    const rank = getRank(hacker);
    const totalWealth = walletBalance + hacker.bitcoin * 50000 + hacker.encryptedBackup * 1000;

    let threatLevel = "🟢 Faible";
    let threatEmoji = "🟢";
    if (hacker.traceLevel >= 80) { threatLevel = "🔴 Critique"; threatEmoji = "🔴"; }
    else if (hacker.traceLevel >= 50) { threatLevel = "🟠 Élevé"; threatEmoji = "🟠"; }
    else if (hacker.traceLevel >= 20) { threatLevel = "🟡 Moyen"; threatEmoji = "🟡"; }

    return `
${fonts.bold("👾 HACKER SYSTEM")} ${rank.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold("🧑‍💻 Niveau " + hacker.level)}${hacker.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💳 Portefeuille : ${fonts.bold(FM(walletBalance))}
₿ Bitcoin : ${fonts.bold(BTC(hacker.bitcoin))} (${FM(hacker.bitcoin * 50000)})
💾 Données volées : ${fonts.bold(FM(hacker.dataStolen))}
📊 Revenus totaux : ${fonts.bold(FM(hacker.totalEarned))}
💎 Patrimoine : ${fonts.bold(FM(totalWealth))}

${fonts.bold("🖥️ SYSTÈME")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔐 Proxy : ${fonts.bold("Niveau " + hacker.proxyLevel)}
👾 Logiciels : ${fonts.bold(hacker.software.length + "/6")}
💾 Backup chiffré : ${fonts.bold(FM(hacker.encryptedBackup))}
📡 Contacts DarkNet : ${fonts.bold(hacker.darkNetContacts)}

${fonts.bold("⚠️ SÉCURITÉ")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${threatEmoji} Traçage : ${fonts.bold(hacker.traceLevel + "/100")} (${threatLevel})
${rank.emoji} Rang : ${fonts.bold(rank.nom)}
⭐ XP : ${fonts.bold(hacker.xp.toLocaleString("fr-FR"))}
🏆 Succès : ${fonts.bold(hacker.achievements.length + "/50")}
🔥 Série : ${fonts.bold(hacker.streak + " jours")}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📡 Scan : ${timeLeft(hacker.lastScan, COOLDOWNS.SCAN) || "✅ Prêt"}
💥 Attack : ${hacker.activeHack ? "⏳ En cours" : timeLeft(hacker.lastAttack, COOLDOWNS.ATTACK) || "✅ Prêt"}
⬇️ Download : ${timeLeft(hacker.lastDownload, COOLDOWNS.DOWNLOAD) || "✅ Prêt"}
🎁 Daily : ${timeLeft(hacker.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
⬆️ Upgrade : ${timeLeft(hacker.lastUpgrade, COOLDOWNS.UPGRADE) || "✅ Prêt"}
📚 Train : ${timeLeft(hacker.lastTrain, COOLDOWNS.TRAIN) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
    return `
${fonts.bold("👾 HACKER SYSTEM - GUIDE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📊 TABLEAU DE BORD")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 hacker stat - Tableau de bord

${fonts.bold("💻 HACKING")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📡 hacker scan - Scanner les serveurs
💥 hacker hack <ID> - Attaquer un serveur
⬇️ hacker download - Récupérer les données
🔄 hacker cancel - Annuler la mission
📋 hacker servers - Voir les serveurs hackés

${fonts.bold("🛒 MARCHÉ NOIR")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📦 hacker market - Voir les logiciels disponibles
🛒 hacker buy <ID> - Acheter un logiciel
💰 hacker sell_data - Vendre des données volées

${fonts.bold("🛡️ SÉCURITÉ")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🔐 hacker proxy <niveau> - Améliorer le proxy
🧹 hacker trace - Nettoyer les traces
💾 hacker backup - Sauvegarder les données

${fonts.bold("📚 COMPÉTENCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 hacker skill list - Voir les compétences
📚 hacker train <SKILL> - S'entraîner

${fonts.bold("🎯 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 hacker rank - Votre rang
🏆 hacker achievements - Succès débloqués
👑 hacker leaderboard - Classement des hackers

${fonts.bold("🎁 RÉCOMPENSES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎁 hacker daily - Récompense quotidienne
💎 hacker premium buy - Devenir premium (2x gains)
`.trim();
}

async function cmdDeposit(message, args, hacker, user, save, walletBalance) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💰 DÉPÔT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: hacker deposit <montant>
Portefeuille: ${FM(walletBalance)}
Bitcoin: ${BTC(hacker.bitcoin)}
		`));
    }
    if (walletBalance < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(walletBalance)}`));
    }
    user.money = walletBalance - amount;
    hacker.bitcoin += amount / 50000;
    addTransaction(hacker, "deposit", amount, "Achat de Bitcoin");
    await save();
    return message.reply(fonts.bold(`
💰 DÉPÔT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Bitcoin: ${BTC(hacker.bitcoin)}
Portefeuille restant: ${FM(user.money)}
		`));
}

async function cmdWithdraw(message, args, hacker, user, save) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💸 RETRAIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: hacker withdraw <montant>
Bitcoin: ${BTC(hacker.bitcoin)} (${FM(hacker.bitcoin * 50000)})
		`));
    }
    const btcNeeded = amount / 50000;
    if (hacker.bitcoin < btcNeeded) {
        return message.reply(fonts.bold(`❌ Bitcoin insuffisant. Vous avez ${BTC(hacker.bitcoin)} (${FM(hacker.bitcoin * 50000)})`));
    }
    hacker.bitcoin -= btcNeeded;
    user.money = (user.money || 0) + amount;
    addTransaction(hacker, "withdrawal", -amount, "Vente de Bitcoin");
    await save();
    return message.reply(fonts.bold(`
💸 RETRAIT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Bitcoin restant: ${BTC(hacker.bitcoin)}
Nouveau portefeuille: ${FM(user.money)}
		`));
}

async function cmdDaily(message, hacker, save) {
    const cd = timeLeft(hacker.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé! Prochain dans ${cd}.`));

    if (Date.now() - (hacker.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
        hacker.streak++;
    } else {
        hacker.streak = 1;
    }

    const baseReward = 2000;
    const streakBonus = Math.min(hacker.streak * 300, 3000);
    const levelBonus = hacker.level * 500;
    const premiumMultiplier = hacker.premium ? 2 : 1;
    const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

    hacker.bitcoin += totalReward / 50000;
    hacker.totalEarned += totalReward;
    hacker.lastDaily = Date.now();
    addTransaction(hacker, "daily", totalReward, `Récompense quotidienne (série ${hacker.streak} jours)`);
    const newAchievements = checkAchievements(hacker);
    await save();

    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Récompense: ${FM(totalReward)}
₿ Bitcoin: ${BTC(totalReward / 50000)}
🔥 Série: ${hacker.streak} jours
📈 Niveau: ${hacker.level}
⭐ Premium: ${hacker.premium ? "2x Bonus!" : "Non"}
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdScan(message, hacker, save) {
    const cd = timeLeft(hacker.lastScan, COOLDOWNS.SCAN);
    if (cd) return message.reply(fonts.bold(`⏰ Scan disponible dans ${cd}.`));

    hacker.lastScan = Date.now();
    await save();

    const availableServers = SERVERS.filter(s => !hacker.serversHacked.includes(s.id));
    if (availableServers.length === 0) {
        return message.reply(fonts.bold("🌐 Tous les serveurs ont été hackés! De nouveaux serveurs apparaîtront bientôt."));
    }

    let txt = `${fonts.bold("📡 SCAN TERMINÉ")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${fonts.bold("🔍 SERVEURS DÉTECTÉS:")}\n\n`;

    for (const server of availableServers) {
        const chance = Math.min(0.95, 0.3 + hacker.level * 0.02 + hacker.skills.NETWORK / 100);
        const detected = Math.random() < chance;
        if (detected) {
            txt += `${server.emoji} ${server.nom} [${server.id}]\n`;
            txt += `   🛡️ Défense: ${server.defense}\n`;
            txt += `   💾 Données: ${FM(server.dataWorth)}\n`;
            txt += `   💰 Récompense: ${FM(server.reward)}\n`;
            txt += `   ⭐ XP: ${server.xp}\n\n`;
        } else {
            txt += `❓ Serveur inconnu (niveau ${server.niveau})\n\n`;
        }
    }

    txt += `Attaquer: hacker hack <ID>`;
    return message.reply(txt);
}

async function cmdHack(message, args, hacker, save) {
    const cd = timeLeft(hacker.lastAttack, COOLDOWNS.ATTACK);
    if (cd) return message.reply(fonts.bold(`⏰ Attaque disponible dans ${cd}.`));

    if (hacker.activeHack) {
        return message.reply(fonts.bold("⚠️ Une attaque est déjà en cours. Tapez 'hacker download' pour récupérer les données."));
    }

    const serverId = args[1]?.toUpperCase();
    const server = SERVERS.find(s => s.id === serverId);
    if (!server) {
        return message.reply(fonts.bold(`❌ Serveur inconnu. Utilisez 'hacker scan' pour voir les serveurs disponibles.`));
    }
    if (hacker.serversHacked.includes(server.id)) {
        return message.reply(fonts.bold(`❌ Vous avez déjà hacké ce serveur.`));
    }

    const chance = getHackChance(hacker, server);
    const success = Math.random() < chance;

    if (success) {
        hacker.activeHack = {
            serverId: server.id,
            startTime: Date.now(),
            endTime: Date.now() + COOLDOWNS.DOWNLOAD,
            reward: getHackReward(hacker, server),
            xp: getXPForHack(server),
        };
        hacker.lastAttack = Date.now();
        addTransaction(hacker, "hack", 0, `Hacking ${server.nom}...`);
        await save();

        return message.reply(fonts.bold(`
💥 ATTAQUE RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${server.emoji} ${server.nom}
🛡️ Défense contournée: ${server.defense}
📊 Taux de succès: ${pct(chance)}
⏳ Téléchargement des données: ${COOLDOWNS.DOWNLOAD / 60000} min
💰 Récompense estimée: ${FM(hacker.activeHack.reward)}
⭐ XP estimé: ${Math.floor(hacker.activeHack.xp)}

Tapez 'hacker download' pour récupérer les données.
		`));
    } else {
        const traceIncrease = Math.floor(server.defense * 0.1);
        hacker.traceLevel = Math.min(100, hacker.traceLevel + traceIncrease);
        hacker.lastAttack = Date.now();
        await save();

        return message.reply(fonts.bold(`
❌ ÉCHEC!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${server.emoji} ${server.nom}
🛡️ Défense trop élevée: ${server.defense}
📊 Taux de succès: ${pct(chance)}
⚠️ Traçage augmenté de ${traceIncrease}% (total: ${hacker.traceLevel}%)

💡 Améliorez vos compétences ou achetez des logiciels!
		`));
    }
}

async function cmdDownload(message, hacker, user, save) {
    if (!hacker.activeHack) {
        return message.reply(fonts.bold("❌ Aucune attaque en cours. Lancez 'hacker hack <ID>' d'abord."));
    }

    const now = Date.now();
    if (now < hacker.activeHack.endTime) {
        const remaining = Math.ceil((hacker.activeHack.endTime - now) / 60000);
        return message.reply(fonts.bold(`⏳ Téléchargement en cours... ${remaining} min restants.`));
    }

    const server = SERVERS.find(s => s.id === hacker.activeHack.serverId);
    if (!server) return message.reply(fonts.bold("❌ Erreur: serveur introuvable."));

    const reward = hacker.activeHack.reward;
    const xp = hacker.activeHack.xp;

    hacker.bitcoin += reward / 50000;
    hacker.totalEarned += reward;
    hacker.dataStolen += server.dataWorth;
    hacker.xp += Math.floor(xp);
    hacker.serversHacked.push(server.id);
    hacker.reputation = Math.min(1000, hacker.reputation + server.niveau * 5);
    hacker.traceLevel = Math.max(0, hacker.traceLevel - Math.floor(server.niveau * 2));

    addTransaction(hacker, "sell_data", reward, `Données vendues: ${server.nom}`);

    // Level up check
    const xpNeeded = hacker.level * 100;
    while (hacker.xp >= xpNeeded) {
        hacker.xp -= xpNeeded;
        hacker.level++;
        hacker.reputation = Math.min(1000, hacker.reputation + 10);
    }

    const newAchievements = checkAchievements(hacker);
    const oldRank = getRank(hacker);
    const newRank = getRank(hacker);

    hacker.activeHack = null;
    hacker.lastDownload = Date.now();

    await save();

    let msg = `⬇️ DONNÉES RÉCUPÉRÉES!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `${server.emoji} ${server.nom}\n`;
    msg += `💰 Récompense: ${FM(reward)}\n`;
    msg += `₿ Bitcoin gagné: ${BTC(reward / 50000)}\n`;
    msg += `💾 Données volées: ${FM(server.dataWorth)}\n`;
    msg += `⭐ XP gagnés: ${Math.floor(xp)}\n`;
    msg += `📊 Niveau: ${hacker.level}\n`;
    if (oldRank.id !== newRank.id) {
        msg += `\n🎉 NOUVEAU RANG: ${newRank.emoji} ${newRank.nom}!`;
    }
    if (newAchievements.length > 0) {
        msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    }

    return message.reply(fonts.bold(msg));
}

async function cmdCancel(message, hacker, save) {
    if (!hacker.activeHack) {
        return message.reply(fonts.bold("❌ Aucune attaque en cours."));
    }
    const server = SERVERS.find(s => s.id === hacker.activeHack.serverId);
    hacker.activeHack = null;
    hacker.traceLevel = Math.min(100, hacker.traceLevel + 5);
    await save();
    return message.reply(fonts.bold(`🔄 Attaque sur ${server?.nom || "serveur"} annulée. Traçage augmenté de 5%.`));
}

async function cmdServers(message, hacker) {
    if (hacker.serversHacked.length === 0) {
        return message.reply(fonts.bold("❌ Vous n'avez encore hacké aucun serveur."));
    }

    let txt = `${fonts.bold("🖥️ SERVEURS HACKÉS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    let totalData = 0;
    for (const id of hacker.serversHacked) {
        const server = SERVERS.find(s => s.id === id);
        if (server) {
            txt += `${server.emoji} ${server.nom}\n`;
            txt += `   💾 Données: ${FM(server.dataWorth)}\n\n`;
            totalData += server.dataWorth;
        }
    }
    txt += `${L()}\n💾 Données totales volées: ${FM(totalData)}`;
    return message.reply(txt);
}

async function cmdMarket(message, hacker) {
    let txt = `${fonts.bold("🛒 MARCHÉ NOIR - LOGICIELS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, sw] of Object.entries(SOFTWARE)) {
        const owned = hacker.software.includes(id);
        txt += `${sw.emoji} ${sw.nom} [${id}]\n`;
        txt += `   💰 Prix: ${FM(sw.prix)}\n`;
        txt += `   ✨ ${sw.desc}\n`;
        txt += `   ${owned ? "✅ POSSÉDÉ" : "🔒 Non acquis"}\n\n`;
    }
    txt += `Acheter: hacker buy <ID>`;
    return message.reply(txt);
}

async function cmdBuy(message, args, hacker, user, save) {
    const swId = args[1]?.toUpperCase();
    const sw = SOFTWARE[swId];
    if (!sw) {
        return message.reply(fonts.bold(`❌ Logiciel inconnu. Utilisez 'hacker market'.`));
    }
    if (hacker.software.includes(swId)) {
        return message.reply(fonts.bold(`❌ Vous possédez déjà ${sw.nom}.`));
    }

    const totalCash = (user.money || 0) + hacker.bitcoin * 50000;
    if (totalCash < sw.prix) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Prix: ${FM(sw.prix)}, disponible: ${FM(totalCash)}`));
    }

    let reste = sw.prix;
    // Use Bitcoin first
    const btcValue = hacker.bitcoin * 50000;
    if (btcValue >= reste) {
        const btcNeeded = reste / 50000;
        hacker.bitcoin -= btcNeeded;
        reste = 0;
    } else {
        reste -= btcValue;
        hacker.bitcoin = 0;
        user.money = (user.money || 0) - reste;
    }

    hacker.software.push(swId);
    addTransaction(hacker, "buy_software", -sw.prix, `Achat: ${sw.nom}`);
    await save();

    return message.reply(fonts.bold(`
🛒 LOGICIEL ACHETÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sw.emoji} ${sw.nom}
💰 Prix: ${FM(sw.prix)}
✨ ${sw.desc}
📦 Logiciels possédés: ${hacker.software.length}
		`));
}

async function cmdSellData(message, hacker, save) {
    const totalData = hacker.serversHacked.reduce((sum, id) => {
        const server = SERVERS.find(s => s.id === id);
        return sum + (server?.dataWorth || 0);
    }, 0);

    if (totalData === 0) {
        return message.reply(fonts.bold("❌ Aucune donnée à vendre."));
    }

    const price = Math.floor(totalData * 0.5);
    hacker.bitcoin += price / 50000;
    hacker.totalEarned += price;
    hacker.serversHacked = [];
    addTransaction(hacker, "sell_data", price, "Vente de données volées");
    await save();

    return message.reply(fonts.bold(`
💰 DONNÉES VENDUES!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Données: ${FM(totalData)}
💰 Reçu: ${FM(price)}
₿ Bitcoin: ${BTC(price / 50000)}
📊 Tous les serveurs hackés sont réinitialisés.
		`));
}

async function cmdProxy(message, args, hacker, user, save) {
    const cd = timeLeft(hacker.lastUpgrade, COOLDOWNS.UPGRADE);
    if (cd) return message.reply(fonts.bold(`⏰ Amélioration disponible dans ${cd}.`));

    const level = parseInt(args[1]) || hacker.proxyLevel + 1;
    if (level <= hacker.proxyLevel) {
        return message.reply(fonts.bold(`❌ Votre niveau de proxy actuel est ${hacker.proxyLevel}. Spécifiez un niveau supérieur.`));
    }

    const costPerLevel = 10000;
    const totalCost = (level - hacker.proxyLevel) * costPerLevel;
    const totalCash = (user.money || 0) + hacker.bitcoin * 50000;

    if (totalCash < totalCost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(totalCost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = totalCost;
    const btcValue = hacker.bitcoin * 50000;
    if (btcValue >= reste) {
        const btcNeeded = reste / 50000;
        hacker.bitcoin -= btcNeeded;
        reste = 0;
    } else {
        reste -= btcValue;
        hacker.bitcoin = 0;
        user.money = (user.money || 0) - reste;
    }

    hacker.proxyLevel = level;
    hacker.lastUpgrade = Date.now();
    addTransaction(hacker, "upgrade_proxy", -totalCost, `Proxy Niveau ${level}`);
    await save();

    return message.reply(fonts.bold(`
🔐 PROXY AMÉLIORÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Niveau: ${hacker.proxyLevel}
💰 Coût: ${FM(totalCost)}
📈 +${hacker.proxyLevel * 2}% de chances de succès
🛡️ -${hacker.proxyLevel}% de traces
		`));
}

async function cmdTrace(message, hacker, save) {
    if (hacker.traceLevel === 0) {
        return message.reply(fonts.bold("✅ Aucune trace détectée!"));
    }

    const cost = Math.floor(hacker.traceLevel * 500);
    const totalCash = (user.money || 0) + hacker.bitcoin * 50000;

    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants pour nettoyer ${hacker.traceLevel}% de traces. Coût: ${FM(cost)}`));
    }

    let reste = cost;
    const btcValue = hacker.bitcoin * 50000;
    if (btcValue >= reste) {
        const btcNeeded = reste / 50000;
        hacker.bitcoin -= btcNeeded;
        reste = 0;
    } else {
        reste -= btcValue;
        hacker.bitcoin = 0;
        user.money = (user.money || 0) - reste;
    }

    hacker.traceLevel = 0;
    addTransaction(hacker, "trace_clean", -cost, "Nettoyage des traces");
    await save();

    return message.reply(fonts.bold(`
🧹 TRACES NETTOYÉES!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Coût: ${FM(cost)}
🟢 Niveau de traçage: 0%
🛡️ Vous êtes invisible!
		`));
}

async function cmdBackup(message, hacker, save) {
    const cost = 10000;
    const totalCash = (user.money || 0) + hacker.bitcoin * 50000;

    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(cost)}`));
    }

    let reste = cost;
    const btcValue = hacker.bitcoin * 50000;
    if (btcValue >= reste) {
        const btcNeeded = reste / 50000;
        hacker.bitcoin -= btcNeeded;
        reste = 0;
    } else {
        reste -= btcValue;
        hacker.bitcoin = 0;
        user.money = (user.money || 0) - reste;
    }

    hacker.encryptedBackup += 1;
    addTransaction(hacker, "backup", -cost, "Backup chiffré");
    await save();

    return message.reply(fonts.bold(`
💾 BACKUP CHIFFRÉ CRÉÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Coût: ${FM(cost)}
📦 Backups: ${hacker.encryptedBackup}
🛡️ En cas de perte de données, vous pourrez les restaurer.
		`));
}

async function cmdSkillList(message, hacker) {
    let txt = `${fonts.bold("📚 COMPÉTENCES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, skill] of Object.entries(SKILLS)) {
        const level = hacker.skills[id] || 0;
        const nextCost = Math.floor(1000 * (level + 1) * 1.2);
        txt += `${skill.emoji} ${skill.nom}: ${fonts.bold(level + "/" + skill.max)}\n`;
        txt += `   Prochain niveau: ${FM(nextCost)}\n\n`;
    }
    txt += `S'entraîner: hacker train <SKILL_ID>`;
    return message.reply(txt);
}

async function cmdTrain(message, args, hacker, user, save) {
    const cd = timeLeft(hacker.lastTrain, COOLDOWNS.TRAIN);
    if (cd) return message.reply(fonts.bold(`⏰ Entraînement disponible dans ${cd}.`));

    const skillId = args[1]?.toUpperCase();
    const skill = SKILLS[skillId];
    if (!skill) {
        return message.reply(fonts.bold(`❌ Compétence inconnue. Utilisez 'hacker skill list'.`));
    }

    const currentLevel = hacker.skills[skillId] || 0;
    if (currentLevel >= skill.max) {
        return message.reply(fonts.bold(`❌ Compétence ${skill.nom} déjà au niveau max!`));
    }

    const cost = Math.floor(1000 * (currentLevel + 1) * 1.2);
    const totalCash = (user.money || 0) + hacker.bitcoin * 50000;

    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = cost;
    const btcValue = hacker.bitcoin * 50000;
    if (btcValue >= reste) {
        const btcNeeded = reste / 50000;
        hacker.bitcoin -= btcNeeded;
        reste = 0;
    } else {
        reste -= btcValue;
        hacker.bitcoin = 0;
        user.money = (user.money || 0) - reste;
    }

    hacker.skills[skillId] = (hacker.skills[skillId] || 0) + 1;
    hacker.lastTrain = Date.now();
    addTransaction(hacker, "train", -cost, `Entraînement: ${skill.nom} Niv.${currentLevel + 1}`);
    await save();

    return message.reply(fonts.bold(`
📚 ENTRAÎNEMENT TERMINÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${skill.emoji} ${skill.nom} → Niveau ${currentLevel + 1}
💰 Coût: ${FM(cost)}
📈 +${(currentLevel + 1) * 2}% d'efficacité
		`));
}

async function cmdRank(message, hacker) {
    const rank = getRank(hacker);
    const nextIndex = RANKS.findIndex(r => r.id === rank.id) + 1;
    const next = RANKS[nextIndex] || null;

    let txt = `${rank.emoji} ${fonts.bold("RANG: " + rank.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `💾 Données volées: ${FM(hacker.dataStolen)}\n`;
    txt += `🖥️ Serveurs hackés: ${hacker.serversHacked.length}\n`;
    txt += `📈 Bonus gains: +${pct(rank.bonus)}\n\n`;

    if (next) {
        const manque = next.minData - hacker.dataStolen;
        txt += `${L()}\n⬆️ Prochain rang: ${next.emoji} ${next.nom}\n`;
        txt += `   Requis: ${FM(next.minData)} données volées\n`;
        txt += `   Manque: ${FM(Math.max(0, manque))}\n`;
    } else {
        txt += "👾 Vous avez atteint le rang MAXIMUM!";
    }

    txt += `\n\n${L()}\n${fonts.bold("📜 TOUS LES RANGS:")}\n`;
    for (const r of RANKS) {
        const actif = r.id === rank.id;
        txt += `${actif ? "▶️ " : "   "}${r.emoji} ${r.nom} — dès ${FM(r.minData)}\n`;
    }
    return message.reply(txt);
}

async function cmdAchievements(message, hacker) {
    const achievementsList = {
        FIRST_HACK: { emoji: "💻", nom: "Premier Hack", desc: "Hacker son 1er serveur" },
        DATA_10K: { emoji: "📊", nom: "10K de Données", desc: "Voler 10 000$ de données" },
        DATA_100K: { emoji: "💰", nom: "100K de Données", desc: "Voler 100 000$ de données" },
        DATA_1M: { emoji: "🤑", nom: "1M de Données", desc: "Voler 1 000 000$ de données" },
        HACKER_RANK: { emoji: "💻", nom: "Hacker Confirmé", desc: "Atteindre le rang Hacker" },
        CYBER_GOD_RANK: { emoji: "👾", nom: "Cyber God", desc: "Atteindre le rang Cyber God" },
        SOFTWARE_5: { emoji: "🛒", nom: "Collectionneur", desc: "Posséder 5 logiciels" },
        SKILL_25: { emoji: "📚", nom: "Étudiant Avancé", desc: "Atteindre niveau 25 dans une compétence" },
        SKILL_50: { emoji: "🎓", nom: "Maître Hacker", desc: "Atteindre niveau 50 dans une compétence" },
        STREAK_7: { emoji: "🔥", nom: "Série 7 Jours", desc: "Maintenir une série de 7 jours" },
        STREAK_30: { emoji: "⭐", nom: "Série 30 Jours", desc: "Maintenir une série de 30 jours" },
        PREMIUM: { emoji: "💎", nom: "Premium", desc: "Devenir Premium" },
        PROXY_10: { emoji: "🔐", nom: "Proxy Niveau 10", desc: "Atteindre le niveau 10 de proxy" },
        TRACE_ZERO: { emoji: "🧹", nom: "Fantôme", desc: "Nettoyer complètement ses traces après un hack" },
    };

    let txt = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${fonts.bold("Progression:")} ${hacker.achievements.length}/${Object.keys(achievementsList).length}\n\n`;

    if (hacker.achievements.length === 0) {
        txt += "🎯 Aucun succès débloqué pour le moment.\n";
    } else {
        txt += `${fonts.bold("🎖️ DÉBLOQUÉS:")}\n`;
        for (const ach of hacker.achievements.slice(0, 10)) {
            const info = achievementsList[ach] || { emoji: "🏆", nom: ach };
            txt += `• ${info.emoji} ${info.nom}\n`;
        }
        if (hacker.achievements.length > 10) {
            txt += `... et ${hacker.achievements.length - 10} de plus!\n`;
        }
        txt += "\n";
    }

    txt += `${fonts.bold("🎯 PROCHAINS OBJECTIFS:")}\n`;
    const remaining = Object.keys(achievementsList).filter(a => !hacker.achievements.includes(a));
    for (const ach of remaining.slice(0, 5)) {
        const info = achievementsList[ach];
        txt += `• ${info.emoji} ${info.nom}: ${info.desc}\n`;
    }
    return message.reply(txt);
}

async function cmdLeaderboard(message, usersData) {
    try {
        const allUsers = await usersData.getAll();
        const joueurs = [];
        for (const [uid, u] of Object.entries(allUsers)) {
            const h = u.data?.hacker;
            if (h && h.dataStolen > 0) {
                joueurs.push({
                    uid,
                    nom: u.name || `User ${uid.slice(-4)}`,
                    dataStolen: h.dataStolen,
                    rank: getRank(h).nom,
                    rankEmoji: getRank(h).emoji,
                    premium: h.premium || false,
                    achievements: h.achievements?.length || 0,
                });
            }
        }
        joueurs.sort((a, b) => b.dataStolen - a.dataStolen);
        const top10 = joueurs.slice(0, 10);

        let txt = `${fonts.bold("👾 CLASSEMENT HACKER")}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        txt += `${fonts.bold("TOP 10 DES HACKERS")}\n\n`;

        if (top10.length === 0) {
            txt += `${fonts.bold("📊 Aucun hacker classé pour le moment.")}`;
        } else {
            for (let i = 0; i < top10.length; i++) {
                const j = top10[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
                const crown = i === 0 ? " 👑" : i === 1 ? " ⭐" : i === 2 ? " ✨" : "";
                const premiumIcon = j.premium ? " 💎" : "";
                txt += `${medal} ${fonts.bold(j.nom)}${crown}${premiumIcon}\n`;
                txt += `   ${j.rankEmoji} Rang: ${j.rank}\n`;
                txt += `   💾 Données: ${FM(j.dataStolen)}`;
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

async function cmdPremium(message, args, hacker, user, save) {
    const action = args[1]?.toLowerCase();

    if (action === "buy") {
        const cost = 500000;
        const totalCash = (user.money || 0) + hacker.bitcoin * 50000;
        if (totalCash < cost) {
            return message.reply(fonts.bold(`❌ L'abonnement premium coûte ${FM(cost)}.\nVous avez ${FM(totalCash)}.`));
        }

        let reste = cost;
        const btcValue = hacker.bitcoin * 50000;
        if (btcValue >= reste) {
            const btcNeeded = reste / 50000;
            hacker.bitcoin -= btcNeeded;
            reste = 0;
        } else {
            reste -= btcValue;
            hacker.bitcoin = 0;
            user.money = (user.money || 0) - reste;
        }

        hacker.premium = true;
        hacker.multiplier = 2.0;
        addTransaction(hacker, "premium", -cost, "Achat premium");
        await save();

        return message.reply(fonts.bold(`
💎 BIENVENUE AU CLUB PREMIUM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Avantages Premium:
✅ 2x les gains sur toutes les activités
✅ Récompenses quotidiennes doublées
✅ Accès aux serveurs exclusifs
✅ Support prioritaire
✅ Statistiques avancées

Vous gagnez maintenant 2x sur toutes vos activités!
		`));
    }

    return message.reply(fonts.bold(`
💎 ABONNEMENT PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statut: ${hacker.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur: ${hacker.multiplier}x
Coût: ${FM(500000)}

${!hacker.premium ? "Utilisez 'hacker premium buy' pour devenir premium!" : ""}
		`));
}

async function cmdHistory(message, hacker) {
    const txs = hacker.transactions.slice(-15).reverse();
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

// Main export
module.exports = {
    config: {
        name: "hacker",
        aliases: ["hack"],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "👾 Simulation de hacking et de cybercriminalité. Devenez le maître du cyberespace!"
        },
        category: "economy",
        guide: {
            fr: "Tapez 'hacker help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, api, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID);
        if (!user) user = { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.hacker) user.data.hacker = initHacker();

        const hacker = user.data.hacker;
        const walletBalance = user.money || 0;

        const rank = getRank(hacker);
        hacker.rank = rank.id;

        const save = async () => {
            user.data.hacker = hacker;
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
                return message.reply(renderDashboard(hacker, walletBalance));

            case "deposit":
            case "dep":
                return cmdDeposit(message, args, hacker, user, save, walletBalance);

            case "withdraw":
            case "wd":
                return cmdWithdraw(message, args, hacker, user, save);

            case "daily":
                return cmdDaily(message, hacker, save);

            case "scan":
                return cmdScan(message, hacker, save);

            case "hack":
            case "attack":
                return cmdHack(message, args, hacker, save);

            case "download":
                return cmdDownload(message, hacker, user, save);

            case "cancel":
                return cmdCancel(message, hacker, save);

            case "servers":
                return cmdServers(message, hacker);

            case "market":
                return cmdMarket(message, hacker);

            case "buy":
                return cmdBuy(message, args, hacker, user, save);

            case "sell_data":
                return cmdSellData(message, hacker, save);

            case "proxy":
                return cmdProxy(message, args, hacker, user, save);

            case "trace":
            case "clean":
                return cmdTrace(message, hacker, save);

            case "backup":
                return cmdBackup(message, hacker, save);

            case "skill":
                const skillAction = args[1]?.toLowerCase();
                if (skillAction === "list" || !skillAction) {
                    return cmdSkillList(message, hacker);
                }
                if (skillAction === "train" || skillAction === "upgrade") {
                    return cmdTrain(message, args, hacker, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: hacker skill [list|train]"));

            case "rank":
            case "rang":
                return cmdRank(message, hacker);

            case "achievements":
            case "succes":
                return cmdAchievements(message, hacker);

            case "leaderboard":
            case "classement":
                return cmdLeaderboard(message, usersData);

            case "premium":
                return cmdPremium(message, args, hacker, user, save);

            case "history":
            case "historique":
                return cmdHistory(message, hacker);

            default:
                return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'hacker help' pour voir la liste.`));
        }
    }
};