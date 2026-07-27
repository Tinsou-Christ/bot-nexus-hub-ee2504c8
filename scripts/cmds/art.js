// art.js - Gestion de Galerie d'Art et Collection
"use strict";

const fonts = require('../../func/font.js');

// --- Cooldowns spécifiques ---
const COOLDOWNS = {
    DAILY:       24 * 60 * 60 * 1000,
    AUCTION:      6 * 60 * 60 * 1000,
    EXHIBIT:      4 * 60 * 60 * 1000,
    PATRON:      12 * 60 * 60 * 1000,
    RESTORE:      2 * 60 * 60 * 1000,
    COLLECT:      1 * 60 * 60 * 1000,
};

// --- Catalogue d'œuvres d'art ---
const ARTWORKS = [
    // Peintures
    { id: "MONA",        nom: "Mona Lisa",          categorie: "Peinture",  epoque: "Renaissance",  valeurBase: 800000,  rarete: 5, emoji: "🖼️" },
    { id: "STARRY",      nom: "Nuit étoilée",       categorie: "Peinture",  epoque: "Post-Impressionnisme", valeurBase: 500000, rarete: 4, emoji: "🌌" },
    { id: "SCREAM",      nom: "Le Cri",             categorie: "Peinture",  epoque: "Expressionnisme", valeurBase: 400000, rarete: 4, emoji: "😱" },
    { id: "GUERNICA",    nom: "Guernica",           categorie: "Peinture",  epoque: "Cubisme",       valeurBase: 600000, rarete: 5, emoji: "⚫" },
    { id: "WATERLILIES", nom: "Nymphéas",           categorie: "Peinture",  epoque: "Impressionnisme", valeurBase: 300000, rarete: 3, emoji: "🌺" },
    // Sculptures
    { id: "THINKER",     nom: "Le Penseur",         categorie: "Sculpture", epoque: "Moderne",       valeurBase: 200000, rarete: 3, emoji: "🗿" },
    { id: "DAVID",       nom: "David",              categorie: "Sculpture", epoque: "Renaissance",   valeurBase: 700000, rarete: 5, emoji: "🏛️" },
    { id: "VENUS",       nom: "Vénus de Milo",      categorie: "Sculpture", epoque: "Antiquité",     valeurBase: 500000, rarete: 4, emoji: "♀️" },
    // Photographie
    { id: "AFRICA",      nom: "Femme africaine",    categorie: "Photographie", epoque: "Contemporain", valeurBase: 150000, rarete: 3, emoji: "📷" },
    { id: "MOON",        nom: "Premier pas sur la Lune", categorie: "Photographie", epoque: "Moderne", valeurBase: 250000, rarete: 4, emoji: "🌙" },
    // Art numérique
    { id: "BITCOIN",     nom: "CryptoPunk #1234",   categorie: "Numérique", epoque: "Contemporain", valeurBase: 100000, rarete: 5, emoji: "💻" },
    { id: "NFT_BIRD",    nom: "L'oiseau pixelisé",  categorie: "Numérique", epoque: "Contemporain", valeurBase: 80000,  rarete: 4, emoji: "🐦" },
    // Art abstrait
    { id: "COMPOSITION", nom: "Composition VIII",   categorie: "Abstrait",  epoque: "Moderne",       valeurBase: 300000, rarete: 4, emoji: "🔷" },
    { id: "BLACK_SQUARE",nom: "Carré noir",         categorie: "Abstrait",  epoque: "Moderne",       valeurBase: 200000, rarete: 3, emoji: "⬛" },
];

// --- Expositions (thèmes) ---
const EXHIBITIONS = [
    { id: "RENAISSANCE", nom: "Chefs-d'œuvre de la Renaissance", duree: 6, gainBase: 80000, prestige: 30, emoji: "🏛️" },
    { id: "IMPRESSION",  nom: "Lumière et Couleur",               duree: 4, gainBase: 50000, prestige: 20, emoji: "🎨" },
    { id: "MODERN_ART",  nom: "Art Moderne et Contemporain",     duree: 8, gainBase: 100000, prestige: 40, emoji: "🖌️" },
    { id: "SCULPTURE",   nom: "Sculptures du Monde",             duree: 5, gainBase: 60000, prestige: 25, emoji: "🗿" },
    { id: "NUMERIQUE",   nom: "Art Numérique et NFT",            duree: 3, gainBase: 40000, prestige: 15, emoji: "💻" },
];

// --- Mécènes (patrons) ---
const PATRONS = [
    { id: "MEDICI",      nom: "Mécène Medicis",       cout: 100000, effet: "Réduction de 20% sur les enchères", emoji: "👑" },
    { id: "GUGGENHEIM",  nom: "Fondation Guggenheim", cout: 250000, effet: "Bonus de 30% sur les expositions", emoji: "🏢" },
    { id: "LOUVRE",      nom: "Musée du Louvre",      cout: 500000, effet: "Accès à des œuvres rares", emoji: "🏛️" },
    { id: "ART_DEALER",  nom: "Marchand d'art",       cout: 150000, effet: "Majoration de 25% à la revente", emoji: "🤵" },
];

// --- Rangs de collectionneur ---
const RANKS = [
    { id: "AMATEUR",     nom: "Amateur d'art",       minValue: 0,      bonus: 0,   emoji: "🎨" },
    { id: "CONNAISSEUR", nom: "Connaisseur",         minValue: 50000,  bonus: 0.05, emoji: "🧐" },
    { id: "COLLECTIONNEUR", nom: "Collectionneur",   minValue: 200000, bonus: 0.10, emoji: "🖼️" },
    { id: "MECENE",      nom: "Mécène",              minValue: 1000000,bonus: 0.20, emoji: "👑" },
    { id: "GALERISTE",   nom: "Galeriste",           minValue: 5000000,bonus: 0.35, emoji: "🏛️" },
    { id: "LEGENDE",     nom: "Légende de l'art",    minValue: 20000000,bonus:0.50, emoji: "⭐" },
];

// --- Événements aléatoires ---
const EVENTS = [
    { id: "FOUND_MASTERPIECE", texte: "🎨 Découverte d'un chef-d'œuvre ! Une œuvre inestimable rejoint votre collection.", effet: "bonus_oeuvre", val: 0 },
    { id: "THEFT", texte: "🚨 Vol dans votre galerie ! Vous perdez 5% de la valeur de votre collection.", effet: "perte_collection", val: -0.05 },
    { id: "AUCTION_BOOM", texte: "📈 Enchères exceptionnelles ! Toutes vos ventes rapportent 30% de plus pendant 2h.", effet: "vente_bonus", val: 0.3 },
    { id: "RESTAURATION", texte: "🛠️ Une œuvre restaurée gagne en valeur (+20%).", effet: "restauration", val: 0.2 },
];

// --- Fonctions utilitaires ---
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function FM(n) { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n) { return `${Math.round(n * 100)}%`; }

// --- Initialisation d'un profil "Art" ---
function initArt() {
    return {
        // Finances
        cash: 0,               // argent liquide (pour achats)
        totalEarned: 0,
        totalSpent: 0,
        // Collection
        collection: [],        // liste d'objets { id, quantite, valeurAchat, dateAchat }
        // Expositions
        currentExhibit: null,  // { id, finAt }
        lastExhibit: null,
        // Enchères
        auctionInProgress: null, // { oeuvreId, prixActuel, finAt, participants } (simplifié)
        lastAuction: null,
        // Mécénat
        patrons: [],
        lastPatron: null,
        // Statistiques
        reputation: 0,
        level: 1,
        xp: 0,
        rank: "AMATEUR",
        streak: 0,
        achievements: [],
        transactions: [],
        // Cooldowns
        lastDaily: null,
        lastCollect: null,
        lastRestore: null,
        // Bonus temporaires
        activeEvent: null,
        eventExpire: null,
        venteBonus: 1.0,
        // Premium
        premium: false,
        multiplier: 1.0,
    };
}

// --- Récupérer le rang ---
function getRank(art) {
    const totalValue = getCollectionValue(art);
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (totalValue >= r.minValue) rank = r;
        else break;
    }
    return rank;
}

// --- Calculer la valeur totale de la collection ---
function getCollectionValue(art) {
    let total = 0;
    for (const item of art.collection) {
        const oeuvre = ARTWORKS.find(o => o.id === item.id);
        if (oeuvre) {
            const valeurActuelle = Math.floor(oeuvre.valeurBase * (1 + (item.quantite || 1) * 0.05));
            total += valeurActuelle * (item.quantite || 1);
        }
    }
    return total;
}

// --- Compter le nombre d'œuvres uniques ---
function countUnique(art) {
    return art.collection.length;
}

// --- Compter le nombre total d'œuvres (avec quantités) ---
function countTotal(art) {
    let total = 0;
    for (const item of art.collection) total += (item.quantite || 1);
    return total;
}

// --- Ajouter une transaction ---
function addTransaction(art, type, montant, description) {
    art.transactions.push({ type, montant, description, date: Date.now() });
    if (art.transactions.length > 30) art.transactions = art.transactions.slice(-30);
}

// --- Gestion des cooldowns ---
function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// --- Vérifier les succès ---
function checkAchievements(art) {
    const list = [];
    const totalVal = getCollectionValue(art);
    const unique = countUnique(art);
    const total = countTotal(art);

    if (!art.achievements.includes("FIRST_ART") && total >= 1) list.push("FIRST_ART");
    if (!art.achievements.includes("COLLECTOR_10") && total >= 10) list.push("COLLECTOR_10");
    if (!art.achievements.includes("COLLECTOR_50") && total >= 50) list.push("COLLECTOR_50");
    if (!art.achievements.includes("VALUE_100K") && totalVal >= 100000) list.push("VALUE_100K");
    if (!art.achievements.includes("VALUE_1M") && totalVal >= 1000000) list.push("VALUE_1M");
    if (!art.achievements.includes("VALUE_10M") && totalVal >= 10000000) list.push("VALUE_10M");
    if (!art.achievements.includes("EXHIBIT_1") && art.currentExhibit) list.push("EXHIBIT_1");
    if (!art.achievements.includes("PATRON_1") && art.patrons.length >= 1) list.push("PATRON_1");
    if (!art.achievements.includes("PATRON_3") && art.patrons.length >= 3) list.push("PATRON_3");
    if (!art.achievements.includes("RANK_MECENE") && art.rank === "MECENE") list.push("RANK_MECENE");
    if (!art.achievements.includes("RANK_LEGENDE") && art.rank === "LEGENDE") list.push("RANK_LEGENDE");
    if (!art.achievements.includes("STREAK_7") && art.streak >= 7) list.push("STREAK_7");
    if (!art.achievements.includes("PREMIUM_ART") && art.premium) list.push("PREMIUM_ART");

    for (const a of list) art.achievements.push(a);
    return list;
}

// --- Rendu du tableau de bord (style épuré et artistique) ---
function renderDashboard(art, walletBalance) {
    const rank = getRank(art);
    const totalVal = getCollectionValue(art);
    const totalWealth = walletBalance + art.cash + totalVal;
    const unique = countUnique(art);
    const total = countTotal(art);

    let tier = "🖌️ Apprenti";
    if (totalWealth >= 20000000) tier = "⭐ Légende de l'art";
    else if (totalWealth >= 5000000) tier = "🏛️ Galeriste";
    else if (totalWealth >= 1000000) tier = "👑 Mécène";
    else if (totalWealth >= 200000) tier = "🖼️ Collectionneur";
    else if (totalWealth >= 50000) tier = "🧐 Connaisseur";

    // Décorations artistiques
    const deco = "✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦";

    return `
┌─────────────────────────────────────────────┐
│  ${fonts.bold("🎨 GALERIE D'ART")}  ${rank.emoji}  ${fonts.bold(tier)}  │
├─────────────────────────────────────────────┤
│  ${fonts.bold("💰 FINANCES")}                                │
│  💳 Portefeuille : ${fonts.bold(FM(walletBalance))}        │
│  💵 Trésorerie   : ${fonts.bold(FM(art.cash))}           │
│  🖼️ Collection   : ${fonts.bold(FM(totalVal))}            │
│  💎 Patrimoine   : ${fonts.bold(FM(totalWealth))}         │
│  📈 Revenus tot. : ${fonts.bold(FM(art.totalEarned))}     │
├─────────────────────────────────────────────┤
│  ${fonts.bold("🖼️ COLLECTION")}                             │
│  Œuvres uniques : ${fonts.bold(unique)}                    │
│  Total d'œuvres : ${fonts.bold(total)}                     │
│  ${rank.emoji} Rang : ${fonts.bold(rank.nom)}              │
│  ⭐ XP : ${fonts.bold(art.xp.toLocaleString("fr-FR"))}     │
├─────────────────────────────────────────────┤
│  ${fonts.bold("⏳ COOLDOWNS")}                             │
│  Enchères : ${timeLeft(art.lastAuction, COOLDOWNS.AUCTION) || "✅"} │
│  Exposition : ${art.currentExhibit ? "⏳ En cours" : timeLeft(art.lastExhibit, COOLDOWNS.EXHIBIT) || "✅"} │
│  Mécénat : ${timeLeft(art.lastPatron, COOLDOWNS.PATRON) || "✅"} │
│  Daily : ${timeLeft(art.lastDaily, COOLDOWNS.DAILY) || "✅"} │
├─────────────────────────────────────────────┤
│  ${fonts.bold("🎯 PROGRESSION")}                           │
│  🔥 Série : ${art.streak} jours                           │
│  🏆 Succès : ${art.achievements.length}/50                │
│  ${art.premium ? "💎 Premium actif" : "💎 Premium inactif"} │
└─────────────────────────────────────────────┘
${deco}
`.trim();
}

// --- Commande HELP (style artistique) ---
function renderHelp() {
    return `
┌────────────────────────────────────────────────────────┐
│  ${fonts.bold("🎨 GALERIE D'ART - AIDE COMPLÈTE")}                     │
├────────────────────────────────────────────────────────┤
│  ${fonts.bold("📊 TABLEAU DE BORD")}                                 │
│  art stat - Voir votre galerie et vos finances                       │
│                                                                      │
│  ${fonts.bold("🖼️ COLLECTION")}                                      │
│  art gallery - Lister vos œuvres                                     │
│  art buy <ID> - Acheter une œuvre (enchères)                         │
│  art sell <ID> [qte] - Vendre une œuvre de votre collection         │
│  art auction - Participer aux enchères en cours                      │
│                                                                      │
│  ${fonts.bold("🏛️ EXPOSITION")}                                     │
│  art exhibit list - Voir les expositions disponibles                 │
│  art exhibit start <ID> - Lancer une exposition                      │
│  art exhibit check - Vérifier l'avancement                           │
│                                                                      │
│  ${fonts.bold("👑 MÉCÉNAT")}                                        │
│  art patron list - Voir les mécènes disponibles                      │
│  art patron buy <ID> - Devenir mécène (effets permanents)            │
│                                                                      │
│  ${fonts.bold("💰 FINANCES")}                                       │
│  art deposit <montant> - Déposer dans la trésorerie                  │
│  art withdraw <montant> - Retirer de la trésorerie                   │
│  art collect - Collecter les revenus de l'exposition                 │
│                                                                      │
│  ${fonts.bold("🎁 RÉCOMPENSES")}                                    │
│  art daily - Récompense quotidienne                                  │
│  art premium buy - Devenir premium (2x gains)                        │
│                                                                      │
│  ${fonts.bold("🏆 PROGRESSION")}                                    │
│  art rank - Voir votre rang                                          │
│  art achievements - Succès débloqués                                 │
│  art leaderboard - Classement des collectionneurs                    │
│  art history - Historique des transactions                           │
└────────────────────────────────────────────────────────┘
`.trim();
}

// --- Commandes ---

// 1. Dépôt
async function cmdDeposit(message, args, art, user, save, walletBalance) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
┌─────────────────────────────┐
│ 💰 DÉPÔT                     │
├─────────────────────────────┤
│ Usage: art deposit <montant> │
│ Portefeuille: ${FM(walletBalance)} │
│ Trésorerie: ${FM(art.cash)}     │
└─────────────────────────────┘
        `));
    }
    if (walletBalance < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Portefeuille: ${FM(walletBalance)}`));
    }
    user.money = walletBalance - amount;
    art.cash += amount;
    addTransaction(art, "deposit", amount, "Dépôt en trésorerie");
    await save();
    return message.reply(fonts.bold(`
✅ Dépôt de ${FM(amount)} effectué.
Nouvelle trésorerie : ${FM(art.cash)}
Portefeuille restant : ${FM(user.money)}
    `));
}

// 2. Retrait
async function cmdWithdraw(message, args, art, user, save) {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(fonts.bold(`
┌─────────────────────────────┐
│ 💸 RETRAIT                   │
├─────────────────────────────┤
│ Usage: art withdraw <montant>│
│ Trésorerie: ${FM(art.cash)}     │
└─────────────────────────────┘
        `));
    }
    if (art.cash < amount) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Trésorerie: ${FM(art.cash)}`));
    }
    art.cash -= amount;
    user.money = (user.money || 0) + amount;
    addTransaction(art, "withdrawal", amount, "Retrait de trésorerie");
    await save();
    return message.reply(fonts.bold(`
✅ Retrait de ${FM(amount)} effectué.
Nouvelle trésorerie : ${FM(art.cash)}
Portefeuille : ${FM(user.money)}
    `));
}

// 3. Daily
async function cmdDaily(message, art, save) {
    const cd = timeLeft(art.lastDaily, COOLDOWNS.DAILY);
    if (cd) return message.reply(fonts.bold(`⏰ Daily déjà réclamé. Prochain dans ${cd}.`));

    if (Date.now() - (art.lastDaily || 0) < COOLDOWNS.DAILY * 2) art.streak++;
    else art.streak = 1;

    const baseReward = 3000;
    const streakBonus = Math.min(art.streak * 300, 3000);
    const levelBonus = art.level * 500;
    const repBonus = Math.floor(art.reputation * 5);
    const premiumMult = art.premium ? 2 : 1;
    const total = Math.floor((baseReward + streakBonus + levelBonus + repBonus) * premiumMult);

    art.cash += total;
    art.totalEarned += total;
    art.lastDaily = Date.now();
    art.reputation = Math.min(1000, art.reputation + 2);
    addTransaction(art, "daily", total, `Récompense quotidienne (série ${art.streak})`);
    const newAch = checkAchievements(art);
    await save();

    let msg = `🎁 Daily : +${FM(total)}\n🔥 Série : ${art.streak} jours\n⭐ XP : +${Math.floor(total/1000)}`;
    if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
    return message.reply(fonts.bold(msg));
}

// 4. Collection (gallery)
async function cmdGallery(message, art) {
    if (art.collection.length === 0) {
        return message.reply(fonts.bold("🖼️ Votre galerie est vide. Achetez des œuvres avec 'art buy'."));
    }
    let txt = `┌─────────────── ${fonts.bold("🖼️ MA GALERIE")} ───────────────┐\n`;
    let total = 0;
    for (const item of art.collection) {
        const oeuvre = ARTWORKS.find(o => o.id === item.id);
        if (oeuvre) {
            const val = Math.floor(oeuvre.valeurBase * (1 + (item.quantite || 1) * 0.05));
            const qte = item.quantite || 1;
            total += val * qte;
            txt += `│ ${oeuvre.emoji} ${oeuvre.nom} (${oeuvre.categorie}) x${qte} — ${FM(val)} pièce │\n`;
        }
    }
    txt += `├─────────────────────────────────────────────┤\n`;
    txt += `│ Valeur totale : ${FM(total)}                        │\n`;
    txt += `└─────────────────────────────────────────────┘`;
    return message.reply(fonts.bold(txt));
}

// 5. Acheter une œuvre (enchères)
async function cmdBuy(message, args, art, user, save) {
    const oeuvreId = args[1]?.toUpperCase();
    const oeuvre = ARTWORKS.find(o => o.id === oeuvreId);
    if (!oeuvre) {
        return message.reply(fonts.bold("❌ Œuvre inconnue. Consultez 'art auction' pour la liste."));
    }

    // Prix de base + variation aléatoire
    const variation = 0.8 + Math.random() * 0.4;
    const prix = Math.floor(oeuvre.valeurBase * variation);

    const totalCash = (user.money || 0) + art.cash;
    if (totalCash < prix) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Prix : ${FM(prix)}, disponible : ${FM(totalCash)}`));
    }

    // Débiter
    let reste = prix;
    if (art.cash >= reste) {
        art.cash -= reste;
        reste = 0;
    } else {
        reste -= art.cash;
        art.cash = 0;
        user.money = (user.money || 0) - reste;
    }

    // Ajouter à la collection
    const existing = art.collection.find(item => item.id === oeuvreId);
    if (existing) {
        existing.quantite = (existing.quantite || 1) + 1;
    } else {
        art.collection.push({ id: oeuvreId, quantite: 1, valeurAchat: prix, dateAchat: Date.now() });
    }

    art.totalSpent += prix;
    art.xp += Math.floor(prix / 5000);
    art.reputation = Math.min(1000, art.reputation + 5);
    addTransaction(art, "buy", -prix, `Achat : ${oeuvre.nom}`);
    const newAch = checkAchievements(art);
    await save();

    let msg = `✅ Achat réussi : ${oeuvre.emoji} ${oeuvre.nom}\nPrix : ${FM(prix)}\n`;
    if (newAch.length) msg += `🏆 Succès : ${newAch.join(", ")}`;
    return message.reply(fonts.bold(msg));
}

// 6. Vendre une œuvre
async function cmdSell(message, args, art, save) {
    const oeuvreId = args[1]?.toUpperCase();
    const qte = parseInt(args[2]) || 1;
    const oeuvre = ARTWORKS.find(o => o.id === oeuvreId);
    if (!oeuvre) return message.reply(fonts.bold("❌ Œuvre inconnue."));

    const existing = art.collection.find(item => item.id === oeuvreId);
    if (!existing || (existing.quantite || 1) < qte) {
        return message.reply(fonts.bold(`❌ Vous n'avez pas assez d'exemplaires de ${oeuvre.nom}.`));
    }

    // Prix de vente : base * (0.7~1.1) + bonus éventuel
    let prixVente = Math.floor(oeuvre.valeurBase * (0.7 + Math.random() * 0.4));
    if (art.activeEvent === "AUCTION_BOOM" && Date.now() < art.eventExpire) {
        prixVente = Math.floor(prixVente * 1.3);
    }
    // Bonus mécène
    if (art.patrons.some(p => p.id === "ART_DEALER")) prixVente = Math.floor(prixVente * 1.25);

    const total = prixVente * qte;
    art.cash += total;
    art.totalEarned += total;
    existing.quantite -= qte;
    if (existing.quantite <= 0) {
        art.collection = art.collection.filter(item => item.id !== oeuvreId);
    }
    addTransaction(art, "sell", total, `Vente : ${qte}x ${oeuvre.nom}`);
    await save();

    return message.reply(fonts.bold(`✅ Vente réussie : ${qte}x ${oeuvre.nom} pour ${FM(total)} (${FM(prixVente)}/pièce).`));
}

// 7. Enchères (afficher les œuvres disponibles à l'achat)
async function cmdAuction(message, art) {
    let txt = `┌─────────────── ${fonts.bold("🏛️ ENCHÈRES EN COURS")} ──────────────┐\n`;
    for (const oeuvre of ARTWORKS) {
        const variation = 0.8 + Math.random() * 0.4;
        const prix = Math.floor(oeuvre.valeurBase * variation);
        txt += `│ ${oeuvre.emoji} ${oeuvre.nom} (${oeuvre.categorie}) — ${FM(prix)} │\n`;
    }
    txt += `├─────────────────────────────────────────────┤\n`;
    txt += `│ Utilisez 'art buy <ID>' pour acheter.        │\n`;
    txt += `└─────────────────────────────────────────────┘`;
    return message.reply(fonts.bold(txt));
}

// 8. Exposition : liste
async function cmdExhibitList(message, art) {
    let txt = `┌────────────── ${fonts.bold("🏛️ EXPOSITIONS DISPONIBLES")} ─────────────┐\n`;
    for (const ex of EXHIBITIONS) {
        txt += `│ ${ex.emoji} ${ex.nom} [${ex.id}]\n`;
        txt += `│   Durée : ${ex.duree}h, Gain : ${FM(ex.gainBase)}, Prestige : +${ex.prestige}\n`;
    }
    txt += `├─────────────────────────────────────────────┤\n`;
    txt += `│ Lancez : art exhibit start <ID>              │\n`;
    txt += `└─────────────────────────────────────────────┘`;
    return message.reply(fonts.bold(txt));
}

// 9. Démarrer une exposition
async function cmdExhibitStart(message, args, art, save) {
    const cd = timeLeft(art.lastExhibit, COOLDOWNS.EXHIBIT);
    if (cd) return message.reply(fonts.bold(`⏰ Exposition disponible dans ${cd}.`));
    if (art.currentExhibit) return message.reply(fonts.bold("⏳ Une exposition est déjà en cours."));

    const exId = args[2]?.toUpperCase();
    const ex = EXHIBITIONS.find(e => e.id === exId);
    if (!ex) return message.reply(fonts.bold("❌ Exposition inconnue. Utilisez 'art exhibit list'."));

    // Coût : 10% du gain de base
    const cout = Math.floor(ex.gainBase * 0.1);
    if (art.cash < cout) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${FM(cout)}, trésorerie : ${FM(art.cash)}`));
    }
    art.cash -= cout;
    art.currentExhibit = {
        id: ex.id,
        finAt: Date.now() + ex.duree * 60 * 60 * 1000,
        gainBase: ex.gainBase,
        prestige: ex.prestige,
    };
    addTransaction(art, "exhibit_start", -cout, `Lancement de l'exposition : ${ex.nom}`);
    await save();

    return message.reply(fonts.bold(`
✅ Exposition "${ex.nom}" lancée !
Durée : ${ex.duree}h
Coût : ${FM(cout)}
Gain potentiel : ${FM(ex.gainBase)}
Vérifiez l'avancement avec 'art exhibit check'.
    `));
}

// 10. Vérifier l'exposition (collecter les gains)
async function cmdExhibitCheck(message, art, save) {
    if (!art.currentExhibit) return message.reply(fonts.bold("❌ Aucune exposition en cours."));
    const ex = EXHIBITIONS.find(e => e.id === art.currentExhibit.id);
    if (!ex) return message.reply(fonts.bold("❌ Exposition introuvable."));

    const now = Date.now();
    if (now < art.currentExhibit.finAt) {
        const reste = art.currentExhibit.finAt - now;
        const heures = Math.floor(reste / 3600000);
        const minutes = Math.floor((reste % 3600000) / 60000);
        return message.reply(fonts.bold(`⏳ Exposition en cours. Fin dans ${heures}h ${minutes}m.`));
    }

    // Terminée : calcul du gain
    const gain = Math.floor(ex.gainBase * (1 + art.reputation / 1000));
    const prestigeGain = Math.floor(ex.prestige * (1 + art.reputation / 2000));
    art.cash += gain;
    art.totalEarned += gain;
    art.reputation = Math.min(1000, art.reputation + prestigeGain);
    art.xp += Math.floor(gain / 2000);
    art.lastExhibit = Date.now();
    addTransaction(art, "exhibit_gain", gain, `Exposition terminée : ${ex.nom}`);
    art.currentExhibit = null;
    await save();

    return message.reply(fonts.bold(`
🏛️ EXPOSITION TERMINÉE !
Gain : ${FM(gain)}
Prestige gagné : +${prestigeGain}
XP : +${Math.floor(gain/2000)}
    `));
}

// 11. Mécénat : liste
async function cmdPatronList(message, art) {
    let txt = `┌────────────── ${fonts.bold("👑 MÉCÈNES DISPONIBLES")} ─────────────┐\n`;
    for (const p of PATRONS) {
        const owned = art.patrons.some(pat => pat.id === p.id);
        txt += `│ ${p.emoji} ${p.nom} [${p.id}]\n`;
        txt += `│   Coût : ${FM(p.cout)}, Effet : ${p.effet}\n`;
        txt += `│   ${owned ? "✅ Recruté" : "🔒 Non recruté"}\n`;
    }
    txt += `├─────────────────────────────────────────────┤\n`;
    txt += `│ Recruter : art patron buy <ID>              │\n`;
    txt += `└─────────────────────────────────────────────┘`;
    return message.reply(fonts.bold(txt));
}

// 12. Acheter un mécène
async function cmdPatronBuy(message, args, art, user, save) {
    const cd = timeLeft(art.lastPatron, COOLDOWNS.PATRON);
    if (cd) return message.reply(fonts.bold(`⏰ Mécénat disponible dans ${cd}.`));

    const pId = args[2]?.toUpperCase();
    const patron = PATRONS.find(p => p.id === pId);
    if (!patron) return message.reply(fonts.bold("❌ Mécène inconnu."));
    if (art.patrons.some(p => p.id === pId)) return message.reply(fonts.bold("❌ Vous avez déjà ce mécène."));

    const totalCash = (user.money || 0) + art.cash;
    if (totalCash < patron.cout) {
        return message.reply(fonts.bold(`❌ Fonds insuffisants. Coût : ${FM(patron.cout)}, disponible : ${FM(totalCash)}`));
    }

    let reste = patron.cout;
    if (art.cash >= reste) {
        art.cash -= reste;
        reste = 0;
    } else {
        reste -= art.cash;
        art.cash = 0;
        user.money = (user.money || 0) - reste;
    }

    art.patrons.push({ id: patron.id, nom: patron.nom, date: Date.now() });
    art.reputation = Math.min(1000, art.reputation + 20);
    art.lastPatron = Date.now();
    addTransaction(art, "patron", -patron.cout, `Recrutement : ${patron.nom}`);
    const newAch = checkAchievements(art);
    await save();

    let msg = `✅ Mécène recruté : ${patron.emoji} ${patron.nom}\nEffet : ${patron.effet}`;
    if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
    return message.reply(fonts.bold(msg));
}

// 13. Collecte des revenus passifs (expositions terminées)
// (on utilise exhibit check pour ça, donc pas besoin de commande séparée)

// 14. Classement
async function cmdLeaderboard(message, usersData) {
    try {
        const allUsers = await usersData.getAll();
        const joueurs = [];
        for (const [uid, u] of Object.entries(allUsers)) {
            const a = u.data?.art;
            if (a && getCollectionValue(a) > 0) {
                joueurs.push({
                    uid,
                    nom: u.name || `User ${uid.slice(-4)}`,
                    value: getCollectionValue(a),
                    rank: getRank(a).nom,
                    rankEmoji: getRank(a).emoji,
                    premium: a.premium || false,
                    achievements: a.achievements?.length || 0,
                });
            }
        }
        joueurs.sort((a, b) => b.value - a.value);
        const top10 = joueurs.slice(0, 10);

        let txt = `┌────────────── ${fonts.bold("👑 CLASSEMENT DES COLLECTIONNEURS")} ──────────────┐\n`;
        if (top10.length === 0) {
            txt += `│ Aucun collectionneur classé pour le moment.                        │\n`;
        } else {
            for (let i = 0; i < top10.length; i++) {
                const j = top10[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;
                const crown = i === 0 ? " 👑" : "";
                txt += `│ ${medal} ${j.nom}${crown} ${j.rankEmoji} ${j.rank} — ${FM(j.value)} │\n`;
                if (j.achievements) txt += `│    🏆 ${j.achievements} succès${j.premium ? " 💎 Premium" : ""}        │\n`;
            }
        }
        txt += `└─────────────────────────────────────────────────────────────┘`;
        return message.reply(fonts.bold(txt));
    } catch (e) {
        console.error("Leaderboard error:", e);
        return message.reply(fonts.bold("❌ Erreur lors du chargement du classement."));
    }
}

// 15. Rang
async function cmdRank(message, art) {
    const rank = getRank(art);
    const nextIndex = RANKS.findIndex(r => r.id === rank.id) + 1;
    const next = RANKS[nextIndex] || null;
    const totalVal = getCollectionValue(art);

    let txt = `${rank.emoji} ${fonts.bold("RANG : " + rank.nom)}\n`;
    txt += `Valeur de collection : ${FM(totalVal)}\n`;
    txt += `Bonus : +${pct(rank.bonus)}\n`;
    if (next) {
        const manque = next.minValue - totalVal;
        txt += `⬆️ Prochain : ${next.emoji} ${next.nom} (${FM(next.minValue)})\n`;
        txt += `   Manque : ${FM(Math.max(0, manque))}`;
    } else {
        txt += "👑 Vous êtes une légende de l'art !";
    }
    return message.reply(fonts.bold(txt));
}

// 16. Succès
async function cmdAchievements(message, art) {
    const allAch = {
        FIRST_ART: { emoji: "🎨", nom: "Première œuvre", desc: "Acheter sa première œuvre" },
        COLLECTOR_10: { emoji: "🖼️", nom: "Collectionneur 10", desc: "Posséder 10 œuvres" },
        COLLECTOR_50: { emoji: "🖼️", nom: "Collectionneur 50", desc: "Posséder 50 œuvres" },
        VALUE_100K: { emoji: "💰", nom: "100K de collection", desc: "Atteindre 100 000$ de valeur" },
        VALUE_1M: { emoji: "💎", nom: "1M de collection", desc: "Atteindre 1 000 000$ de valeur" },
        VALUE_10M: { emoji: "👑", nom: "10M de collection", desc: "Atteindre 10 000 000$ de valeur" },
        EXHIBIT_1: { emoji: "🏛️", nom: "Première exposition", desc: "Lancer une exposition" },
        PATRON_1: { emoji: "👑", nom: "Premier mécène", desc: "Recruter un mécène" },
        PATRON_3: { emoji: "👑", nom: "Mécène accompli", desc: "Recruter 3 mécènes" },
        RANK_MECENE: { emoji: "👑", nom: "Rang Mécène", desc: "Atteindre le rang Mécène" },
        RANK_LEGENDE: { emoji: "⭐", nom: "Légende", desc: "Atteindre le rang Légende" },
        STREAK_7: { emoji: "🔥", nom: "Série 7 jours", desc: "Maintenir une série de 7 jours" },
        PREMIUM_ART: { emoji: "💎", nom: "Premium Art", desc: "Devenir premium" },
    };

    let txt = `🏆 SUCCÈS (${art.achievements.length}/${Object.keys(allAch).length})\n`;
    if (art.achievements.length === 0) {
        txt += "Aucun succès débloqué.\n";
    } else {
        for (const a of art.achievements) {
            const info = allAch[a] || { emoji: "🏆", nom: a };
            txt += `${info.emoji} ${info.nom}\n`;
        }
        txt += "\n";
    }
    txt += "🎯 PROCHAINS OBJECTIFS :\n";
    const remaining = Object.keys(allAch).filter(a => !art.achievements.includes(a));
    for (const a of remaining.slice(0, 5)) {
        const info = allAch[a];
        txt += `${info.emoji} ${info.nom} : ${info.desc}\n`;
    }
    return message.reply(fonts.bold(txt));
}

// 17. Premium
async function cmdPremium(message, args, art, user, save) {
    const action = args[1]?.toLowerCase();
    if (action === "buy") {
        const cost = 500000;
        if (art.cash < cost) return message.reply(fonts.bold(`❌ Premium coûte ${FM(cost)}. Vous avez ${FM(art.cash)}.`));
        art.cash -= cost;
        art.premium = true;
        art.multiplier = 2.0;
        addTransaction(art, "premium", -cost, "Achat premium");
        await save();
        return message.reply(fonts.bold("💎 Premium activé ! Tous vos gains sont doublés."));
    }
    return message.reply(fonts.bold(`
💎 PREMIUM : ${art.premium ? "✅ Actif" : "❌ Inactif"}
Multiplicateur : ${art.multiplier}x
Coût : ${FM(500000)}
${!art.premium ? "Utilisez 'art premium buy' pour devenir premium." : ""}
    `));
}

// 18. Historique
async function cmdHistory(message, art) {
    const txs = art.transactions.slice(-15).reverse();
    if (txs.length === 0) return message.reply(fonts.bold("📋 Aucune transaction."));
    let txt = "📋 DERNIÈRES TRANSACTIONS (15)\n";
    for (const tx of txs) {
        const sign = tx.montant >= 0 ? "+" : "";
        const date = new Date(tx.date).toLocaleDateString("fr-FR");
        txt += `${tx.description} : ${sign}${FM(tx.montant)} (${date})\n`;
    }
    return message.reply(fonts.bold(txt));
}

// 19. Statistiques (dashboard déjà fait)

// --- Export principal ---
module.exports = {
    config: {
        name: "art",
        aliases: ["gallery"],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "🎨 Gestion de galerie d'art, collection et mécénat."
        },
        category: "economy",
        guide: {
            fr: "Tapez 'art help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, api, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID);
        if (!user) user = { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.art) user.data.art = initArt();

        const art = user.data.art;
        const walletBalance = user.money || 0;

        const rank = getRank(art);
        art.rank = rank.id;

        const save = async () => {
            user.data.art = art;
            await usersData.set(senderID, user);
        };

        switch (sub) {
            case "help":
                return message.reply(renderHelp());

            case "stat":
            case "status":
            case "dashboard":
            case "bal":
                return message.reply(renderDashboard(art, walletBalance));

            case "deposit":
                return cmdDeposit(message, args, art, user, save, walletBalance);
            case "withdraw":
                return cmdWithdraw(message, args, art, user, save);

            case "daily":
                return cmdDaily(message, art, save);

            case "gallery":
                return cmdGallery(message, art);

            case "buy":
                return cmdBuy(message, args, art, user, save);

            case "sell":
                return cmdSell(message, args, art, save);

            case "auction":
                return cmdAuction(message, art);

            case "exhibit":
                const exAction = args[1]?.toLowerCase();
                if (exAction === "list") return cmdExhibitList(message, art);
                if (exAction === "start") return cmdExhibitStart(message, args, art, save);
                if (exAction === "check") return cmdExhibitCheck(message, art, save);
                return message.reply(fonts.bold("❓ Usage: art exhibit [list|start|check]"));

            case "patron":
                const patAction = args[1]?.toLowerCase();
                if (patAction === "list") return cmdPatronList(message, art);
                if (patAction === "buy") return cmdPatronBuy(message, args, art, user, save);
                return message.reply(fonts.bold("❓ Usage: art patron [list|buy]"));

            case "rank":
                return cmdRank(message, art);

            case "achievements":
                return cmdAchievements(message, art);

            case "leaderboard":
                return cmdLeaderboard(message, usersData);

            case "premium":
                return cmdPremium(message, args, art, user, save);

            case "history":
                return cmdHistory(message, art);

            default:
                return message.reply(fonts.bold("❓ Commande inconnue. Tapez 'art help'."));
        }
    }
};