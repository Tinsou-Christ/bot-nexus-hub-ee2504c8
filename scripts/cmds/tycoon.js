// tycoon.js
"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    DAILY: 24 * 60 * 60 * 1000,
    WORK: 4 * 60 * 60 * 1000,
    COLLECT: 1 * 60 * 60 * 1000,
    INVEST: 6 * 60 * 60 * 1000,
    UPGRADE: 12 * 60 * 60 * 1000,
    MARKET: 2 * 60 * 60 * 1000,
};

const INDUSTRIES = [
    { id: "TECH", nom: "Technologie", emoji: "💻", baseCost: 10000, revenue: 2000, employees: 5 },
    { id: "RETAIL", nom: "Commerce de détail", emoji: "🛍️", baseCost: 15000, revenue: 2500, employees: 8 },
    { id: "FOOD", nom: "Restauration", emoji: "🍽️", baseCost: 8000, revenue: 1800, employees: 6 },
    { id: "REAL_ESTATE", nom: "Immobilier", emoji: "🏠", baseCost: 50000, revenue: 8000, employees: 3 },
    { id: "MANUFACTURING", nom: "Manufacture", emoji: "🏭", baseCost: 30000, revenue: 6000, employees: 15 },
    { id: "LOGISTICS", nom: "Logistique", emoji: "🚚", baseCost: 25000, revenue: 4500, employees: 10 },
    { id: "ENERGY", nom: "Énergie", emoji: "⚡", baseCost: 75000, revenue: 12000, employees: 7 },
    { id: "FINANCE", nom: "Finance", emoji: "🏦", baseCost: 100000, revenue: 15000, employees: 12 },
];

const SKILLS = {
    MANAGEMENT: { id: "MANAGEMENT", nom: "Gestion", emoji: "📊", maxLevel: 50 },
    MARKETING: { id: "MARKETING", nom: "Marketing", emoji: "📈", maxLevel: 50 },
    FINANCE: { id: "FINANCE", nom: "Finance", emoji: "💰", maxLevel: 50 },
    INNOVATION: { id: "INNOVATION", nom: "Innovation", emoji: "💡", maxLevel: 50 },
    NEGOTIATION: { id: "NEGOTIATION", nom: "Négociation", emoji: "🤝", maxLevel: 50 },
};

const RANKS = [
    { id: "STARTUP", nom: "Startup", emoji: "🌱", minRevenue: 0, bonus: 0 },
    { id: "SME", nom: "PME", emoji: "🏢", minRevenue: 100000, bonus: 0.1 },
    { id: "CORPORATION", nom: "Corporation", emoji: "🏛️", minRevenue: 500000, bonus: 0.2 },
    { id: "CONGLOMERATE", nom: "Conglomérat", emoji: "🌐", minRevenue: 2000000, bonus: 0.35 },
    { id: "MONOPOLY", nom: "Monopole", emoji: "👑", minRevenue: 10000000, bonus: 0.5 },
];

const MARKET_ITEMS = {
    STOCKS: { id: "STOCKS", nom: "Actions Boursières", emoji: "📊", price: 1000, volatility: 0.3 },
    BONDS: { id: "BONDS", nom: "Obligations", emoji: "📜", price: 5000, volatility: 0.1 },
    COMMODITIES: { id: "COMMODITIES", nom: "Matières Premières", emoji: "⛏️", price: 2000, volatility: 0.4 },
    REAL_ESTATE: { id: "REAL_ESTATE", nom: "Fonds Immobilier", emoji: "🏗️", price: 10000, volatility: 0.2 },
};

const EVENTS = [
    { id: "BOOM", texte: "📈 BOOM ÉCONOMIQUE! Tous vos revenus augmentent de 30% pendant 2h.", effet: "revenue_boost", val: 0.3 },
    { id: "CRISIS", texte: "📉 CRISE FINANCIÈRE! Vos revenus diminuent de 20% pendant 2h.", effet: "revenue_malus", val: -0.2 },
    { id: "INNOVATION", texte: "💡 PERCÉE TECHNOLOGIQUE! Bonus de +50% sur l'innovation.", effet: "innovation_boost", val: 0.5 },
    { id: "COMPETITOR", texte: "⚔️ UN CONCURRENT S'EST EFFONDRÉ! Opportunité de rachat.", effet: "buyout_opportunity", val: 0 },
    { id: "TALENT", texte: "🌟 UN TALENT EXCEPTIONNEL REJOINT VOTRE ÉQUIPE! +2 niveaux de compétence.", effet: "talent_boost", val: 2 },
    { id: "DIVIDEND", texte: "💰 DIVIDENDES EXTRAORDINAIRES! +$50,000 sur votre compte.", effet: "bonus_cash", val: 50000 },
];

function initTycoon() {
    return {
        cash: 0,
        revenue: 0,
        totalEarned: 0,
        rank: "STARTUP",
        companies: [],
        skills: {
            MANAGEMENT: 0,
            MARKETING: 0,
            FINANCE: 0,
            INNOVATION: 0,
            NEGOTIATION: 0,
        },
        investments: {},
        employees: 0,
        reputation: 0,
        level: 1,
        xp: 0,
        lastDaily: null,
        lastWork: null,
        lastCollect: null,
        lastInvest: null,
        lastUpgrade: null,
        lastMarket: null,
        streak: 0,
        achievements: [],
        transactions: [],
        activeEvent: null,
        eventExpire: null,
        premium: false,
        multiplier: 1.0,
        totalInvested: 0,
        totalDividends: 0,
        networkSize: 0,
        rating: 100,
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

function getRank(tycoon) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (tycoon.totalEarned >= r.minRevenue) rank = r;
        else break;
    }
    return rank;
}

function getTotalRevenue(tycoon) {
    let total = 0;
    for (const company of tycoon.companies) {
        const industry = INDUSTRIES.find(i => i.id === company.industry);
        if (industry) {
            let revenue = industry.revenue * (1 + company.level * 0.2);
            if (company.specialized) revenue *= 1.5;
            total += revenue;
        }
    }
    const rank = getRank(tycoon);
    total += total * rank.bonus;
    if (tycoon.activeEvent === "BOOM" && Date.now() < tycoon.eventExpire) {
        total *= 1.3;
    }
    if (tycoon.activeEvent === "CRISIS" && Date.now() < tycoon.eventExpire) {
        total *= 0.8;
    }
    return Math.floor(total * (tycoon.multiplier || 1));
}

function getSkillLevel(tycoon, skillId) {
    return tycoon.skills[skillId] || 0;
}

function getTotalAssets(tycoon) {
    let total = tycoon.cash || 0;
    for (const company of tycoon.companies) {
        const industry = INDUSTRIES.find(i => i.id === company.industry);
        if (industry) {
            total += industry.baseCost * (1 + company.level * 0.3);
        }
    }
    for (const [key, value] of Object.entries(tycoon.investments || {})) {
        const item = MARKET_ITEMS[key];
        if (item) total += item.price * value;
    }
    return total;
}

function checkAchievements(tycoon) {
    const list = [];
    if (!tycoon.achievements.includes("FIRST_COMPANY") && tycoon.companies.length >= 1)
        list.push("FIRST_COMPANY");
    if (!tycoon.achievements.includes("REVENUE_100K") && tycoon.totalEarned >= 100000)
        list.push("REVENUE_100K");
    if (!tycoon.achievements.includes("REVENUE_1M") && tycoon.totalEarned >= 1000000)
        list.push("REVENUE_1M");
    if (!tycoon.achievements.includes("REVENUE_10M") && tycoon.totalEarned >= 10000000)
        list.push("REVENUE_10M");
    if (!tycoon.achievements.includes("EMPLOYEES_50") && tycoon.employees >= 50)
        list.push("EMPLOYEES_50");
    if (!tycoon.achievements.includes("EMPLOYEES_100") && tycoon.employees >= 100)
        list.push("EMPLOYEES_100");
    if (!tycoon.achievements.includes("CORPORATION") && tycoon.rank === "CORPORATION")
        list.push("CORPORATION");
    if (!tycoon.achievements.includes("CONGLOMERATE") && tycoon.rank === "CONGLOMERATE")
        list.push("CONGLOMERATE");
    if (!tycoon.achievements.includes("MONOPOLY") && tycoon.rank === "MONOPOLY")
        list.push("MONOPOLY");
    if (!tycoon.achievements.includes("SKILL_MASTER") && Object.values(tycoon.skills).some(s => s >= 30))
        list.push("SKILL_MASTER");
    if (!tycoon.achievements.includes("INVESTOR") && tycoon.totalInvested >= 100000)
        list.push("INVESTOR");
    if (!tycoon.achievements.includes("STREAK_7") && tycoon.streak >= 7)
        list.push("STREAK_7");
    if (!tycoon.achievements.includes("STREAK_30") && tycoon.streak >= 30)
        list.push("STREAK_30");
    if (!tycoon.achievements.includes("PREMIUM") && tycoon.premium)
        list.push("PREMIUM");
    for (const a of list) tycoon.achievements.push(a);
    return list;
}

function addTransaction(tycoon, type, montant, description) {
    tycoon.transactions.push({ type, montant, description, date: Date.now() });
    if (tycoon.transactions.length > 30) tycoon.transactions = tycoon.transactions.slice(-30);
}

function getTransactionEmoji(type) {
    const emojis = {
        deposit: "💰", withdrawal: "💸", invest: "📈", dividend: "💵",
        company_found: "🏢", company_upgrade: "⬆️", salary: "💼",
        market_buy: "🛒", market_sell: "💰", event: "🎯",
        daily: "🎁", bonus: "✨", achievement: "🏆",
    };
    return emojis[type] || "💼";
}

function renderDashboard(tycoon, walletBalance) {
    const rank = getRank(tycoon);
    const revenue = getTotalRevenue(tycoon);
    const totalAssets = getTotalAssets(tycoon);
    const totalWealth = walletBalance + tycoon.cash + totalAssets;
    const totalEmployees = tycoon.employees;

    let wealthTier = "🌱 Débutant";
    if (totalWealth >= 10000000) wealthTier = "👑 Monopole";
    else if (totalWealth >= 2000000) wealthTier = "🌐 Conglomérat";
    else if (totalWealth >= 500000) wealthTier = "🏛️ Corporation";
    else if (totalWealth >= 100000) wealthTier = "🏢 PME";
    else if (totalWealth >= 10000) wealthTier = "🌱 Startup";

    return `
${fonts.bold("🏢 TYCOON BUSINESS")} ${rank.emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts.bold(wealthTier)} • ${fonts.bold("Niveau " + tycoon.level)}${tycoon.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 FINANCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💳 Portefeuille : ${fonts.bold(FM(walletBalance))}
🏦 Trésorerie : ${fonts.bold(FM(tycoon.cash))}
📊 Revenus : ${fonts.bold(FM(revenue))}/h
💎 Patrimoine : ${fonts.bold(FM(totalWealth))}
📈 Revenus totaux : ${fonts.bold(FM(tycoon.totalEarned))}

${fonts.bold("🏢 EMPIRE COMMERCIAL")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏗️ Entreprises : ${fonts.bold(tycoon.companies.length)}
👥 Employés : ${fonts.bold(totalEmployees)}
📊 Réputation : ${fonts.bold(tycoon.reputation + "/1000")}
⭐ Multiplicateur : ${fonts.bold(tycoon.multiplier + "x")}

${fonts.bold("📈 PERFORMANCE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${rank.emoji} Rang : ${fonts.bold(rank.nom)}
⭐ XP : ${fonts.bold(tycoon.xp.toLocaleString("fr-FR"))}
🏆 Succès : ${fonts.bold(tycoon.achievements.length + "/50")}
🔥 Série : ${fonts.bold(tycoon.streak + " jours")}

${fonts.bold("⏳ COOLDOWNS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💼 Travail : ${timeLeft(tycoon.lastWork, COOLDOWNS.WORK) || "✅ Prêt"}
💰 Collecte : ${timeLeft(tycoon.lastCollect, COOLDOWNS.COLLECT) || "✅ Prêt"}
📈 Invest : ${timeLeft(tycoon.lastInvest, COOLDOWNS.INVEST) || "✅ Prêt"}
⬆️ Upgrade : ${timeLeft(tycoon.lastUpgrade, COOLDOWNS.UPGRADE) || "✅ Prêt"}
🛒 Marché : ${timeLeft(tycoon.lastMarket, COOLDOWNS.MARKET) || "✅ Prêt"}
🎁 Daily : ${timeLeft(tycoon.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}
`.trim();
}

function renderHelp() {
    return `
${fonts.bold("🏢 TYCOON BUSINESS - GUIDE COMPLET")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("📊 TABLEAU DE BORD")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 tycoon stat - Tableau de bord complet

${fonts.bold("🏢 ENTREPRISES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📋 tycoon industry list - Voir les industries disponibles
🏗️ tycoon company create <ID> - Créer une entreprise
📈 tycoon company list - Voir vos entreprises
⬆️ tycoon company upgrade <N> - Améliorer une entreprise
👥 tycoon company hire <N> - Embauche massive

${fonts.bold("💼 GESTION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💼 tycoon work - Travailler pour gagner de l'argent
💰 tycoon collect - Collecter les revenus
📈 tycoon invest <montant> - Investir pour faire fructifier
💎 tycoon dividend - Collecter les dividendes

${fonts.bold("📈 COMPÉTENCES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 tycoon skill list - Voir les compétences
⬆️ tycoon skill upgrade <SKILL> - Améliorer une compétence

${fonts.bold("🛒 MARCHÉ FINANCIER")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 tycoon market - Voir le marché
🛒 tycoon market buy <ID> <qte> - Acheter
💰 tycoon market sell <ID> <qte> - Vendre
📋 tycoon portfolio - Voir votre portfolio

${fonts.bold("🎯 PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🏆 tycoon rank - Votre rang
🏆 tycoon achievements - Succès débloqués
👑 tycoon leaderboard - Classement des joueurs

${fonts.bold("🎁 RÉCOMPENSES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🎁 tycoon daily - Récompense quotidienne
💎 tycoon premium buy - Devenir premium (2x gains)
`.trim();
}

async function cmdDeposit(message, args, tycoon, user, save, walletBalance) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💰 DÉPÔT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: tycoon deposit <montant>
Portefeuille: ${FM(walletBalance)}
Trésorerie: ${FM(tycoon.cash)}
		`));
    }
    if (walletBalance < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(walletBalance)}`));
    }
    user.money = walletBalance - amount;
    tycoon.cash += amount;
    addTransaction(tycoon, "deposit", amount, "Dépôt en trésorerie");
    await save();
    return message.reply(fonts.bold(`
💰 DÉPÔT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Nouvelle trésorerie: ${FM(tycoon.cash)}
Portefeuille restant: ${FM(user.money)}
		`));
}

async function cmdWithdraw(message, args, tycoon, user, save) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
💸 RETRAIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: tycoon withdraw <montant>
Trésorerie: ${FM(tycoon.cash)}
		`));
    }
    if (tycoon.cash < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Trésorerie: ${FM(tycoon.cash)}`));
    }
    tycoon.cash -= amount;
    user.money = (user.money || 0) + amount;
    addTransaction(tycoon, "withdrawal", amount, "Retrait de trésorerie");
    await save();
    return message.reply(fonts.bold(`
💸 RETRAIT RÉUSSI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Montant: ${FM(amount)}
Nouvelle trésorerie: ${FM(tycoon.cash)}
Nouveau portefeuille: ${FM(user.money)}
		`));
}

async function cmdDaily(message, tycoon, save) {
    const cd = timeLeft(tycoon.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé! Prochain dans ${cd}.`));

    if (Date.now() - (tycoon.lastDaily || 0) < COOLDOWNS.DAILY * 2) {
        tycoon.streak++;
    } else {
        tycoon.streak = 1;
    }

    const baseReward = 5000;
    const streakBonus = Math.min(tycoon.streak * 500, 5000);
    const levelBonus = tycoon.level * 1000;
    const repBonus = Math.floor(tycoon.reputation * 10);
    const premiumMultiplier = tycoon.premium ? 2 : 1;
    const totalReward = Math.floor((baseReward + streakBonus + levelBonus + repBonus) * premiumMultiplier);

    tycoon.cash += totalReward;
    tycoon.totalEarned += totalReward;
    tycoon.lastDaily = Date.now();
    tycoon.reputation = Math.min(1000, tycoon.reputation + 2);
    addTransaction(tycoon, "daily", totalReward, `Récompense quotidienne (série ${tycoon.streak} jours)`);
    const newAchievements = checkAchievements(tycoon);
    await save();

    return message.reply(fonts.bold(`
🎁 RÉCOMPENSE QUOTIDIENNE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Récompense: ${FM(totalReward)}
🔥 Série: ${tycoon.streak} jours
📈 Niveau: ${tycoon.level}
⭐ Premium: ${tycoon.premium ? "2x Bonus!" : "Non"}
🎯 Réputation: +2
${newAchievements.length > 0 ? `🏆 Succès: ${newAchievements.join(", ")}` : ""}
		`));
}

async function cmdWork(message, tycoon, save) {
    const cd = timeLeft(tycoon.lastWork, COOLDOWNS.WORK);
    if (cd) return message.reply(fonts.bold(`⏰ Travail disponible dans ${cd}.`));

    const jobs = [
        { nom: "Consultant", min: 2000, max: 5000 },
        { nom: "Développeur", min: 3000, max: 7000 },
        { nom: "Manager", min: 4000, max: 8000 },
        { nom: "Analyste financier", min: 5000, max: 10000 },
        { nom: "Architecte d'entreprise", min: 8000, max: 15000 },
    ];

    const job = pick(jobs);
    const baseSalary = rand(job.min, job.max);
    const skillBonus = Math.floor(baseSalary * (getSkillLevel(tycoon, "FINANCE") / 100));
    const totalEarned = Math.floor((baseSalary + skillBonus) * tycoon.multiplier);

    tycoon.cash += totalEarned;
    tycoon.totalEarned += totalEarned;
    tycoon.xp += Math.floor(totalEarned / 1000);
    tycoon.lastWork = Date.now();
    addTransaction(tycoon, "salary", totalEarned, `Travail: ${job.nom}`);
    await save();

    return message.reply(fonts.bold(`
💼 TRAVAIL COMPLÉTÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Poste: ${job.nom}
Salaire: ${FM(baseSalary)}
Bonus compétence: +${FM(skillBonus)}
Total: ${FM(totalEarned)}
⭐ XP: +${Math.floor(totalEarned / 1000)}
		`));
}

async function cmdCollect(message, tycoon, save) {
    const cd = timeLeft(tycoon.lastCollect, COOLDOWNS.COLLECT);
    if (cd) return message.reply(fonts.bold(`⏰ Collecte disponible dans ${cd}.`));

    if (tycoon.companies.length === 0) {
        return message.reply(fonts.bold("❌ Vous n'avez pas d'entreprise. Créez-en une avec 'tycoon company create'!"));
    }

    const revenue = getTotalRevenue(tycoon);
    if (revenue <= 0) return message.reply(fonts.bold("❌ Vos entreprises ne génèrent aucun revenu."));

    tycoon.cash += revenue;
    tycoon.totalEarned += revenue;
    tycoon.xp += Math.floor(revenue / 5000);
    tycoon.lastCollect = Date.now();
    addTransaction(tycoon, "collect", revenue, "Collecte des revenus");

    const newRank = getRank(tycoon);
    const oldRankId = tycoon.rank;
    tycoon.rank = newRank.id;

    const newAchievements = checkAchievements(tycoon);
    await save();

    let msg = `${fonts.bold("💰 COLLECTE EFFECTUÉE!")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const company of tycoon.companies) {
        const industry = INDUSTRIES.find(i => i.id === company.industry);
        if (industry) {
            const companyRevenue = Math.floor(industry.revenue * (1 + company.level * 0.2) * (company.specialized ? 1.5 : 1));
            msg += `${industry.emoji} ${industry.nom} (Niv.${company.level}): +${FM(companyRevenue)}\n`;
        }
    }
    msg += `\n${L()}\n💰 Total: ${FM(revenue)}\n💵 Trésorerie: ${FM(tycoon.cash)}\n⭐ XP: +${Math.floor(revenue / 5000)}`;

    if (oldRankId !== newRank.id) msg += `\n\n🎉 NOUVEAU RANG: ${newRank.emoji} ${newRank.nom}!`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;

    return message.reply(fonts.bold(msg));
}

async function cmdIndustryList(message, tycoon) {
    let txt = `${fonts.bold("🏭 INDUSTRIES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const ind of INDUSTRIES) {
        const owned = tycoon.companies.some(c => c.industry === ind.id);
        txt += `${ind.emoji} ${ind.nom} [${ind.id}]\n`;
        txt += `   💰 Coût: ${FM(ind.baseCost)}\n`;
        txt += `   📈 Revenu: ${FM(ind.revenue)}/h\n`;
        txt += `   👥 Employés: ${ind.employees}\n`;
        txt += `   ${owned ? "✅ POSSÉDÉ" : "🔒 Non acquis"}\n\n`;
    }
    txt += `Créer: tycoon company create <ID>`;
    return message.reply(txt);
}

async function cmdCompanyCreate(message, args, tycoon, user, save) {
    const industryId = args[2]?.toUpperCase();
    const industry = INDUSTRIES.find(i => i.id === industryId);

    if (!industry) {
        return message.reply(fonts.bold(`❌ Industrie inconnue. Utilisez 'tycoon industry list'.`));
    }
    if (tycoon.companies.some(c => c.industry === industryId)) {
        return message.reply(fonts.bold(`❌ Vous possédez déjà une entreprise dans cette industrie.`));
    }

    const totalCash = (user.money || 0) + tycoon.cash;
    if (totalCash < industry.baseCost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(industry.baseCost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = industry.baseCost;
    if (tycoon.cash >= reste) {
        tycoon.cash -= reste;
        reste = 0;
    } else {
        reste -= tycoon.cash;
        tycoon.cash = 0;
        user.money = (user.money || 0) - reste;
    }

    tycoon.companies.push({
        industry: industryId,
        level: 1,
        employees: industry.employees,
        specialized: false,
        founded: Date.now(),
    });
    tycoon.employees += industry.employees;
    tycoon.reputation = Math.min(1000, tycoon.reputation + 20);
    addTransaction(tycoon, "company_found", -industry.baseCost, `Création: ${industry.nom}`);
    const newAchievements = checkAchievements(tycoon);
    await save();

    let msg = `${industry.emoji} ${fonts.bold("ENTREPRISE CRÉÉE: " + industry.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 Coût: ${FM(industry.baseCost)}\n`;
    msg += `📈 Revenu: ${FM(industry.revenue)}/h\n`;
    msg += `👥 Employés: ${industry.employees}\n`;
    msg += `🎯 Réputation: +20`;
    if (newAchievements.length > 0) msg += `\n🏆 Succès: ${newAchievements.join(", ")}`;
    return message.reply(fonts.bold(msg));
}

async function cmdCompanyList(message, tycoon) {
    if (tycoon.companies.length === 0) {
        return message.reply(fonts.bold("❌ Vous n'avez pas d'entreprise. Créez-en une avec 'tycoon company create'!"));
    }

    let txt = `${fonts.bold("🏢 VOS ENTREPRISES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (let i = 0; i < tycoon.companies.length; i++) {
        const comp = tycoon.companies[i];
        const industry = INDUSTRIES.find(ind => ind.id === comp.industry);
        if (industry) {
            const revenue = Math.floor(industry.revenue * (1 + comp.level * 0.2) * (comp.specialized ? 1.5 : 1));
            txt += `[${i + 1}] ${industry.emoji} ${industry.nom}\n`;
            txt += `   📈 Niveau: ${comp.level}\n`;
            txt += `   💰 Revenu: ${FM(revenue)}/h\n`;
            txt += `   👥 Employés: ${comp.employees}\n`;
            txt += `   ${comp.specialized ? "⭐ Spécialisée" : ""}\n\n`;
        }
    }
    txt += `Améliorer: tycoon company upgrade <N>\n`;
    txt += `Spécialiser: tycoon company specialize <N>`;
    return message.reply(txt);
}

async function cmdCompanyUpgrade(message, args, tycoon, user, save) {
    const cd = timeLeft(tycoon.lastUpgrade, COOLDOWNS.UPGRADE);
    if (cd) return message.reply(fonts.bold(`⏰ Amélioration disponible dans ${cd}.`));

    const index = parseInt(args[2]) - 1;
    if (isNaN(index) || index < 0 || index >= tycoon.companies.length) {
        return message.reply(fonts.bold(`❌ Numéro d'entreprise invalide.`));
    }

    const company = tycoon.companies[index];
    const industry = INDUSTRIES.find(i => i.id === company.industry);
    if (!industry) return message.reply(fonts.bold("❌ Industrie introuvable."));

    const upgradeCost = Math.floor(industry.baseCost * (0.5 + company.level * 0.2));
    const totalCash = (user.money || 0) + tycoon.cash;

    if (totalCash < upgradeCost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(upgradeCost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = upgradeCost;
    if (tycoon.cash >= reste) {
        tycoon.cash -= reste;
        reste = 0;
    } else {
        reste -= tycoon.cash;
        tycoon.cash = 0;
        user.money = (user.money || 0) - reste;
    }

    company.level++;
    company.employees += Math.floor(industry.employees * 0.3);
    tycoon.employees += Math.floor(industry.employees * 0.3);
    tycoon.lastUpgrade = Date.now();
    addTransaction(tycoon, "company_upgrade", -upgradeCost, `Amélioration: ${industry.nom} Niv.${company.level}`);
    await save();

    return message.reply(fonts.bold(`
⬆️ AMÉLIORATION RÉUSSIE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${industry.emoji} ${industry.nom} → Niveau ${company.level}
💵 Coût: ${FM(upgradeCost)}
👥 Nouveaux employés: +${Math.floor(industry.employees * 0.3)}
📈 Nouveau revenu: ${FM(Math.floor(industry.revenue * (1 + company.level * 0.2) * (company.specialized ? 1.5 : 1)))}/h
		`));
}

async function cmdSkillList(message, tycoon) {
    let txt = `${fonts.bold("📊 COMPÉTENCES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [id, skill] of Object.entries(SKILLS)) {
        const level = getSkillLevel(tycoon, id);
        const nextCost = Math.floor(1000 * (level + 1) * 1.5);
        txt += `${skill.emoji} ${skill.nom}: ${fonts.bold(level + "/" + skill.maxLevel)}\n`;
        txt += `   Prochain niveau: ${FM(nextCost)}\n\n`;
    }
    txt += `Améliorer: tycoon skill upgrade <SKILL_ID>`;
    return message.reply(txt);
}

async function cmdSkillUpgrade(message, args, tycoon, user, save) {
    const skillId = args[2]?.toUpperCase();
    const skill = SKILLS[skillId];
    if (!skill) {
        return message.reply(fonts.bold(`❌ Compétence inconnue. Utilisez 'tycoon skill list'.`));
    }

    const currentLevel = getSkillLevel(tycoon, skillId);
    if (currentLevel >= skill.maxLevel) {
        return message.reply(fonts.bold(`❌ Compétence ${skill.nom} déjà au niveau max!`));
    }

    const cost = Math.floor(1000 * (currentLevel + 1) * 1.5);
    const totalCash = (user.money || 0) + tycoon.cash;

    if (totalCash < cost) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(cost)}, disponible: ${FM(totalCash)}`));
    }

    let reste = cost;
    if (tycoon.cash >= reste) {
        tycoon.cash -= reste;
        reste = 0;
    } else {
        reste -= tycoon.cash;
        tycoon.cash = 0;
        user.money = (user.money || 0) - reste;
    }

    tycoon.skills[skillId] = (tycoon.skills[skillId] || 0) + 1;
    addTransaction(tycoon, "skill_upgrade", -cost, `Amélioration: ${skill.nom} Niv.${currentLevel + 1}`);
    await save();

    return message.reply(fonts.bold(`
⬆️ COMPÉTENCE AMÉLIORÉE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${skill.emoji} ${skill.nom} → Niveau ${currentLevel + 1}
💵 Coût: ${FM(cost)}
📈 Effet: +${(currentLevel + 1)}% d'efficacité
		`));
}

async function cmdInvest(message, args, tycoon, user, save) {
    const cd = timeLeft(tycoon.lastInvest, COOLDOWNS.INVEST);
    if (cd) return message.reply(fonts.bold(`⏰ Investissement disponible dans ${cd}.`));

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
📈 INVESTISSEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: tycoon invest <montant>
Trésorerie: ${FM(tycoon.cash)}
Rendement estimé: +15% à +40%
Durée: 6h
		`));
    }

    if (tycoon.cash < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Trésorerie: ${FM(tycoon.cash)}`));
    }

    const skillBonus = getSkillLevel(tycoon, "FINANCE") / 200;
    const baseReturn = 0.15 + Math.random() * 0.25 + skillBonus;
    const returnAmount = Math.floor(amount * baseReturn);
    const totalReturn = amount + returnAmount;

    tycoon.cash -= amount;
    tycoon.totalInvested += amount;
    tycoon.lastInvest = Date.now();
    addTransaction(tycoon, "invest", -amount, `Investissement de ${FM(amount)}`);

    // Simulate investment return after cooldown
    setTimeout(async () => {
        tycoon.cash += totalReturn;
        tycoon.totalEarned += totalReturn;
        tycoon.totalDividends += returnAmount;
        addTransaction(tycoon, "dividend", totalReturn, `Retour sur investissement (${pct(baseReturn)})`);
        await save();
    }, COOLDOWNS.INVEST);

    await save();

    return message.reply(fonts.bold(`
📈 INVESTISSEMENT PLACÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Montant: ${FM(amount)}
Rendement estimé: ${pct(baseReturn)}
Gain estimé: ${FM(returnAmount)}
Total retour: ${FM(totalReturn)}
⏰ Délai: 6h

📊 Revenez avec 'tycoon collect' dans 6h pour récupérer!
		`));
}

async function cmdDividend(message, tycoon, save) {
    if (tycoon.totalDividends <= 0) {
        return message.reply(fonts.bold("❌ Aucun dividende à collecter."));
    }

    const amount = Math.floor(tycoon.totalDividends * 0.1);
    tycoon.cash += amount;
    tycoon.totalDividends -= amount;
    addTransaction(tycoon, "dividend", amount, "Collecte de dividendes");
    await save();

    return message.reply(fonts.bold(`
💎 DIVIDENDES COLLECTÉS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Montant: ${FM(amount)}
Dividendes restants: ${FM(tycoon.totalDividends)}
		`));
}

async function cmdMarket(message, args, tycoon, user, save) {
    const action = args[1]?.toLowerCase();

    if (!action || action === "list") {
        let txt = `${fonts.bold("🛒 MARCHÉ FINANCIER")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        for (const [id, item] of Object.entries(MARKET_ITEMS)) {
            const owned = tycoon.investments[id] || 0;
            const currentPrice = Math.floor(item.price * (1 + (Math.random() - 0.5) * item.volatility));
            txt += `${item.emoji} ${item.nom} [${id}]\n`;
            txt += `   💰 Prix: ${FM(currentPrice)}\n`;
            txt += `   📊 Volatilité: ${pct(item.volatility)}\n`;
            txt += `   📦 Possédé: ${owned} unités\n\n`;
        }
        txt += `Acheter: tycoon market buy <ID> <qte>\n`;
        txt += `Vendre: tycoon market sell <ID> <qte>`;
        return message.reply(txt);
    }

    const itemId = args[2]?.toUpperCase();
    const item = MARKET_ITEMS[itemId];
    if (!item) {
        return message.reply(fonts.bold(`❌ Produit inconnu. Utilisez 'tycoon market'.`));
    }

    const qte = parseInt(args[3]) || 1;
    const currentPrice = Math.floor(item.price * (1 + (Math.random() - 0.5) * item.volatility));

    if (action === "buy") {
        const totalCost = currentPrice * qte;
        const totalCash = (user.money || 0) + tycoon.cash;

        if (totalCash < totalCost) {
            return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût: ${FM(totalCost)}, disponible: ${FM(totalCash)}`));
        }

        let reste = totalCost;
        if (tycoon.cash >= reste) {
            tycoon.cash -= reste;
            reste = 0;
        } else {
            reste -= tycoon.cash;
            tycoon.cash = 0;
            user.money = (user.money || 0) - reste;
        }

        tycoon.investments[itemId] = (tycoon.investments[itemId] || 0) + qte;
        addTransaction(tycoon, "market_buy", -totalCost, `Achat ${qte}x ${item.nom}`);
        await save();

        return message.reply(fonts.bold(`
🛒 ACHAT EFFECTUÉ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${item.emoji} ${item.nom}
Quantité: ${qte}
Prix unitaire: ${FM(currentPrice)}
Total: ${FM(totalCost)}
📦 Nouveau stock: ${tycoon.investments[itemId]}
		`));
    }

    if (action === "sell") {
        const owned = tycoon.investments[itemId] || 0;
        if (owned < qte) {
            return message.reply(fonts.bold(`❌ Stock insuffisant. Vous avez ${owned} unités.`));
        }

        const totalValue = currentPrice * qte;
        tycoon.cash += totalValue;
        tycoon.investments[itemId] -= qte;
        if (tycoon.investments[itemId] <= 0) delete tycoon.investments[itemId];
        addTransaction(tycoon, "market_sell", totalValue, `Vente ${qte}x ${item.nom}`);
        await save();

        return message.reply(fonts.bold(`
💰 VENTE EFFECTUÉE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${item.emoji} ${item.nom}
Quantité: ${qte}
Prix unitaire: ${FM(currentPrice)}
Total: ${FM(totalValue)}
📦 Stock restant: ${tycoon.investments[itemId] || 0}
		`));
    }
}

async function cmdPortfolio(message, tycoon) {
    if (Object.keys(tycoon.investments).length === 0) {
        return message.reply(fonts.bold("📊 Votre portfolio est vide. Investissez avec 'tycoon market buy'!"));
    }

    let txt = `${fonts.bold("📊 PORTFOLIO")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    let totalValue = 0;
    for (const [id, qte] of Object.entries(tycoon.investments)) {
        const item = MARKET_ITEMS[id];
        if (item) {
            const currentPrice = Math.floor(item.price * (1 + (Math.random() - 0.5) * item.volatility));
            const value = currentPrice * qte;
            totalValue += value;
            txt += `${item.emoji} ${item.nom}: ${qte} unités (${FM(value)})\n`;
        }
    }
    txt += `\n${L()}\n📊 Valeur totale: ${FM(totalValue)}`;
    return message.reply(txt);
}

async function cmdRank(message, tycoon) {
    const rank = getRank(tycoon);
    const nextIndex = RANKS.findIndex(r => r.id === rank.id) + 1;
    const next = RANKS[nextIndex] || null;

    let txt = `${rank.emoji} ${fonts.bold("RANG: " + rank.nom)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `📊 Revenus totaux: ${FM(tycoon.totalEarned)}\n`;
    txt += `🏢 Entreprises: ${tycoon.companies.length}\n`;
    txt += `👥 Employés: ${tycoon.employees}\n`;
    txt += `📈 Bonus revenus: +${pct(rank.bonus)}\n\n`;

    if (next) {
        const manque = next.minRevenue - tycoon.totalEarned;
        txt += `${L()}\n⬆️ Prochain rang: ${next.emoji} ${next.nom}\n`;
        txt += `   Requis: ${FM(next.minRevenue)} revenus totaux\n`;
        txt += `   Manque: ${FM(Math.max(0, manque))}\n`;
    } else {
        txt += "👑 Vous avez atteint le rang MAXIMUM!";
    }

    txt += `\n\n${L()}\n${fonts.bold("📜 TOUS LES RANGS:")}\n`;
    for (const r of RANGS) {
        const actif = r.id === rank.id;
        txt += `${actif ? "▶️ " : "   "}${r.emoji} ${r.nom} — dès ${FM(r.minRevenue)}\n`;
    }
    return message.reply(txt);
}

async function cmdAchievements(message, tycoon) {
    const achievementsList = {
        FIRST_COMPANY: { emoji: "🏢", nom: "Première Entreprise", desc: "Créer sa 1ère entreprise" },
        REVENUE_100K: { emoji: "💰", nom: "100K de Revenus", desc: "Atteindre 100 000$ de revenus" },
        REVENUE_1M: { emoji: "💵", nom: "Premier Million", desc: "Atteindre 1 000 000$ de revenus" },
        REVENUE_10M: { emoji: "🤑", nom: "10 Millions", desc: "Atteindre 10 000 000$ de revenus" },
        EMPLOYEES_50: { emoji: "👥", nom: "50 Employés", desc: "Avoir 50 employés" },
        EMPLOYEES_100: { emoji: "👥", nom: "100 Employés", desc: "Avoir 100 employés" },
        CORPORATION: { emoji: "🏛️", nom: "Corporation", desc: "Atteindre le rang Corporation" },
        CONGLOMERATE: { emoji: "🌐", nom: "Conglomérat", desc: "Atteindre le rang Conglomérat" },
        MONOPOLY: { emoji: "👑", nom: "Monopole", desc: "Atteindre le rang Monopole" },
        SKILL_MASTER: { emoji: "💡", nom: "Maître des Compétences", desc: "Atteindre niveau 30 dans une compétence" },
        INVESTOR: { emoji: "📈", nom: "Investisseur", desc: "Investir 100 000$ au total" },
        STREAK_7: { emoji: "🔥", nom: "Série 7 Jours", desc: "Maintenir une série de 7 jours" },
        STREAK_30: { emoji: "⭐", nom: "Série 30 Jours", desc: "Maintenir une série de 30 jours" },
        PREMIUM: { emoji: "💎", nom: "Premium", desc: "Devenir Premium" },
    };

    let txt = `${fonts.bold("🏆 SUCCÈS DÉBLOQUÉS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `${fonts.bold("Progression:")} ${tycoon.achievements.length}/${Object.keys(achievementsList).length}\n\n`;

    if (tycoon.achievements.length === 0) {
        txt += "🎯 Aucun succès débloqué pour le moment.\n";
    } else {
        txt += `${fonts.bold("🎖️ DÉBLOQUÉS:")}\n`;
        for (const ach of tycoon.achievements.slice(0, 10)) {
            const info = achievementsList[ach] || { emoji: "🏆", nom: ach };
            txt += `• ${info.emoji} ${info.nom}\n`;
        }
        if (tycoon.achievements.length > 10) {
            txt += `... et ${tycoon.achievements.length - 10} de plus!\n`;
        }
        txt += "\n";
    }

    txt += `${fonts.bold("🎯 PROCHAINS OBJECTIFS:")}\n`;
    const remaining = Object.keys(achievementsList).filter(a => !tycoon.achievements.includes(a));
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
            const t = u.data?.tycoon;
            if (t && t.totalEarned > 0) {
                joueurs.push({
                    uid,
                    nom: u.name || `User ${uid.slice(-4)}`,
                    totalEarned: t.totalEarned,
                    companies: t.companies?.length || 0,
                    rank: getRank(t).nom,
                    rankEmoji: getRank(t).emoji,
                    premium: t.premium || false,
                    achievements: t.achievements?.length || 0,
                });
            }
        }
        joueurs.sort((a, b) => b.totalEarned - a.totalEarned);
        const top10 = joueurs.slice(0, 10);

        let txt = `${fonts.bold("👑 CLASSEMENT TYCOON")}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        txt += `${fonts.bold("TOP 10 DES ENTREPRENEURS")}\n\n`;

        if (top10.length === 0) {
            txt += `${fonts.bold("📊 Aucun joueur classé pour le moment.")}`;
        } else {
            for (let i = 0; i < top10.length; i++) {
                const j = top10[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${fonts.bold(`#${i + 1}`)}`;
                const crown = i === 0 ? " 👑" : i === 1 ? " ⭐" : i === 2 ? " ✨" : "";
                const premiumIcon = j.premium ? " 💎" : "";
                txt += `${medal} ${fonts.bold(j.nom)}${crown}${premiumIcon}\n`;
                txt += `   ${j.rankEmoji} Rang: ${j.rank}\n`;
                txt += `   💰 Revenus: ${FM(j.totalEarned)}\n`;
                txt += `   🏢 Entreprises: ${j.companies}`;
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

async function cmdPremium(message, args, tycoon, user, save) {
    const action = args[1]?.toLowerCase();

    if (action === "buy") {
        const cost = 500000;
        if (tycoon.cash < cost) {
            return message.reply(fonts.bold(`❌ L'abonnement premium coûte ${FM(cost)}.\nVous avez ${FM(tycoon.cash)}.`));
        }
        tycoon.cash -= cost;
        tycoon.premium = true;
        tycoon.multiplier = 2.0;
        addTransaction(tycoon, "premium", -cost, "Achat premium");
        await save();
        return message.reply(fonts.bold(`
💎 BIENVENUE AU CLUB PREMIUM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Avantages Premium:
✅ 2x les gains sur toutes les activités
✅ Récompenses quotidiennes doublées
✅ Accès aux investissements exclusifs
✅ Support prioritaire
✅ Statistiques avancées

Vous gagnez maintenant 2x sur toutes vos activités!
		`));
    }

    return message.reply(fonts.bold(`
💎 ABONNEMENT PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statut: ${tycoon.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur: ${tycoon.multiplier}x
Coût: ${FM(500000)}

${!tycoon.premium ? "Utilisez 'tycoon premium buy' pour devenir premium!" : ""}
		`));
}

async function cmdHistory(message, tycoon) {
    const txs = tycoon.transactions.slice(-15).reverse();
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
        name: "tycoon",
        aliases: [],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "🏢 Simulation de gestion d'entreprise et de construction d'empire commercial."
        },
        category: "economy",
        guide: {
            fr: "Tapez 'tycoon help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, api, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID);
        if (!user) user = { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.tycoon) user.data.tycoon = initTycoon();

        const tycoon = user.data.tycoon;
        const walletBalance = user.money || 0;

        const rank = getRank(tycoon);
        tycoon.rank = rank.id;

        const save = async () => {
            user.data.tycoon = tycoon;
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
                return message.reply(renderDashboard(tycoon, walletBalance));

            case "deposit":
            case "dep":
                return cmdDeposit(message, args, tycoon, user, save, walletBalance);

            case "withdraw":
            case "wd":
                return cmdWithdraw(message, args, tycoon, user, save);

            case "daily":
                return cmdDaily(message, tycoon, save);

            case "work":
                return cmdWork(message, tycoon, save);

            case "collect":
                return cmdCollect(message, tycoon, save);

            case "industry":
            case "industries":
                return cmdIndustryList(message, tycoon);

            case "company":
                const action = args[1]?.toLowerCase();
                if (action === "create" || action === "new") {
                    return cmdCompanyCreate(message, args, tycoon, user, save);
                }
                if (action === "list" || action === "show") {
                    return cmdCompanyList(message, tycoon);
                }
                if (action === "upgrade" || action === "levelup") {
                    return cmdCompanyUpgrade(message, args, tycoon, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: tycoon company [create|list|upgrade]"));

            case "skill":
                const skillAction = args[1]?.toLowerCase();
                if (skillAction === "list" || !skillAction) {
                    return cmdSkillList(message, tycoon);
                }
                if (skillAction === "upgrade") {
                    return cmdSkillUpgrade(message, args, tycoon, user, save);
                }
                return message.reply(fonts.bold("❓ Usage: tycoon skill [list|upgrade]"));

            case "invest":
                return cmdInvest(message, args, tycoon, user, save);

            case "dividend":
                return cmdDividend(message, tycoon, save);

            case "market":
                return cmdMarket(message, args, tycoon, user, save);

            case "portfolio":
                return cmdPortfolio(message, tycoon);

            case "rank":
            case "rang":
                return cmdRank(message, tycoon);

            case "achievements":
            case "succes":
                return cmdAchievements(message, tycoon);

            case "leaderboard":
            case "classement":
                return cmdLeaderboard(message, usersData);

            case "premium":
                return cmdPremium(message, args, tycoon, user, save);

            case "history":
            case "historique":
                return cmdHistory(message, tycoon);

            default:
                return message.reply(fonts.bold(`❓ Commande inconnue. Tapez 'tycoon help' pour voir la liste.`));
        }
    }
};