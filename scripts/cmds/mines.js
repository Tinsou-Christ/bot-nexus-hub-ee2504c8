"use strict";

const fonts = require('../../func/font.js');

const COOLDOWNS = {
    DAILY: 24 * 60 * 60 * 1000,
    MINE: 3 * 60 * 1000,
    EXPEDITION: 8 * 60 * 60 * 1000,
    FUSION: 0,
    VENTE: 0,
};

const MINERAUX = {
    PIERRE: { id: "PIERRE", nom: "Pierre", valeur: 10, fusion: null, reqPick: 0, couleur: "⬜", rare: 40 },
    CHARBON: { id: "CHARBON", nom: "Charbon", valeur: 35, fusion: null, reqPick: 0, couleur: "⬛", rare: 30 },
    FER: { id: "FER", nom: "Fer", valeur: 120, fusion: ["PIERRE", 3], reqPick: 1, couleur: "🟫", rare: 16 },
    OR: { id: "OR", nom: "Or", valeur: 450, fusion: ["FER", 3], reqPick: 2, couleur: "🟨", rare: 8 },
    RUBIS: { id: "RUBIS", nom: "Rubis", valeur: 1800, fusion: ["OR", 3], reqPick: 3, couleur: "🟥", rare: 4 },
    SAPHIR: { id: "SAPHIR", nom: "Saphir", valeur: 6000, fusion: ["RUBIS", 3], reqPick: 4, couleur: "🟦", rare: 1.5 },
    DIAMANT: { id: "DIAMANT", nom: "Diamant", valeur: 20000, fusion: ["SAPHIR", 3], reqPick: 5, couleur: "💎", rare: 0.4 },
    ORICHALQUE: { id: "ORICHALQUE", nom: "Orichalque", valeur: 80000, fusion: ["DIAMANT", 3], reqPick: 6, couleur: "✨", rare: 0.1 },
};

const PIOCHE_NIVEAUX = [
    { id: 0, nom: "Pioche en Bois", mult: 1.0, slots: 1, cout: 0 },
    { id: 1, nom: "Pioche en Pierre", mult: 1.4, slots: 2, cout: 500 },
    { id: 2, nom: "Pioche en Fer", mult: 2.0, slots: 2, cout: 3000 },
    { id: 3, nom: "Pioche en Or", mult: 3.0, slots: 3, cout: 15000 },
    { id: 4, nom: "Pioche en Rubis", mult: 4.5, slots: 3, cout: 70000 },
    { id: 5, nom: "Pioche en Saphir", mult: 6.5, slots: 4, cout: 300000 },
    { id: 6, nom: "Pioche en Diamant", mult: 10.0, slots: 5, cout: 1500000 },
    { id: 7, nom: "Pioche Légendaire", mult: 18.0, slots: 6, cout: 8000000 },
];

const MINES = [
    { id: "CARRIERE", nom: "Carrière", cout: 0, debloquer: 0, bonus: 0, mineraux: ["PIERRE", "CHARBON", "FER"] },
    { id: "GROTTE", nom: "Grotte Sombre", cout: 5000, debloquer: 1, bonus: 0.10, mineraux: ["FER", "OR", "RUBIS"] },
    { id: "VOLCAN", nom: "Cratère Volcanique", cout: 40000, debloquer: 2, bonus: 0.20, mineraux: ["RUBIS", "SAPHIR", "OR"] },
    { id: "ABYSSES", nom: "Abysses Marines", cout: 200000, debloquer: 3, bonus: 0.35, mineraux: ["SAPHIR", "DIAMANT", "RUBIS"] },
    { id: "ASTRAL", nom: "Faille Astrale", cout: 2000000, debloquer: 5, bonus: 0.60, mineraux: ["DIAMANT", "ORICHALQUE", "SAPHIR"] },
];

const EXPEDITIONS = [
    { id: "E1", nom: "Tunnel Abandonné", duree: "8h", gain: [500, 3000], xp: 50, reqNvl: 0 },
    { id: "E2", nom: "Montagne Gelée", duree: "8h", gain: [3000, 15000], xp: 150, reqNvl: 2 },
    { id: "E3", nom: "Île Volcanique", duree: "8h", gain: [15000, 80000], xp: 400, reqNvl: 4 },
    { id: "E4", nom: "Noyau Terrestre", duree: "8h", gain: [80000, 500000], xp: 1200, reqNvl: 6 },
];

const UPGRADES = [
    { id: "LAMPE", nom: "Lampe Frontale", cout: 2000, effet: "+10% chance mineraux rares", bonus: { rarety: 0.10 } },
    { id: "DYNAMITE", nom: "Réserve Dynamite", cout: 8000, effet: "+1 mineral par mine", bonus: { slots: 1 } },
    { id: "TAPIS", nom: "Tapis Convoyeur", cout: 25000, effet: "+20% valeur vente", bonus: { sellMult: 0.20 } },
    { id: "CASQUE", nom: "Casque Renforcé", cout: 80000, effet: "+25% gains expedition", bonus: { expMult: 0.25 } },
    { id: "FOREUSE", nom: "Foreuse Mécanique", cout: 350000, effet: "+40% vitesse (cd -30%)", bonus: { cdReduc: 0.30 } },
    { id: "ANALYSE", nom: "Analyseur Géo", cout: 1500000, effet: "Double les fusions", bonus: { fusionX2: true } },
];

const PRESTIGE_SEUIL = 10000000;

function initMine() {
    return {
        pickaxe: 0,
        mineActive: "CARRIERE",
        minesDebloquees: ["CARRIERE"],
        inventaire: {},
        upgrades: [],
        xp: 0,
        niveau: 1,
        totalMine: 0,
        totalVendu: 0,
        totalGagne: 0,
        prestige: 0,
        prestigeBonus: 0,
        expedActive: null,
        expedDebut: null,
        lastMine: null,
        lastExpedition: null,
        lastDaily: null,
        streak: 0,
        bestVente: 0,
        fusionsTotal: 0,
        achievements: [],
    };
}

function rand(mn, mx) { return Math.floor(Math.random() * (mx - mn + 1)) + mn; }

function FM(n) {
    if (!n || isNaN(n)) return "$0";
    n = Number(n);
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.round(n).toLocaleString()}`;
}

function FMN(n) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(Math.round(n));
}

function timeLeft(ts, cd) {
    const diff = cd - (Date.now() - (ts || 0));
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getNiveau(xp) {
    const nv = Math.floor(Math.sqrt(xp / 100)) + 1;
    return Math.min(nv, 50);
}

function getXPNiveau(nv) { return (nv - 1) * (nv - 1) * 100; }

function getMineBonus(mine_data) {
    let sell = 0, slots = 0, rarety = 0, expMult = 0, cdReduc = 0, fusX2 = false;
    for (const uid of mine_data.upgrades) {
        const u = UPGRADES.find(x => x.id === uid);
        if (!u) continue;
        if (u.bonus.sellMult) sell += u.bonus.sellMult;
        if (u.bonus.slots) slots += u.bonus.slots;
        if (u.bonus.rarety) rarety += u.bonus.rarety;
        if (u.bonus.expMult) expMult += u.bonus.expMult;
        if (u.bonus.cdReduc) cdReduc += u.bonus.cdReduc;
        if (u.bonus.fusionX2) fusX2 = true;
    }
    return { sell, slots, rarety, expMult, cdReduc, fusX2 };
}

function getMineraux(mine_data) {
    const pick = PIOCHE_NIVEAUX[mine_data.pickaxe];
    const mine = MINES.find(m => m.id === mine_data.mineActive);
    const bonus = getMineBonus(mine_data);
    const nSlots = pick.slots + bonus.slots;
    const resultats = [];

    for (let i = 0; i < nSlots; i++) {
        const pool = mine.mineraux;
        const roll = Math.random() * 100;
        let accum = 0;
        let choisi = null;
        for (const mid of pool) {
            const m = MINERAUX[mid];
            if (!m || m.reqPick > mine_data.pickaxe) continue;
            const chance = m.rare + bonus.rarety * m.rare;
            accum += chance;
            if (roll <= accum) { choisi = m; break; }
        }
        if (!choisi) {
            for (const mid of pool) {
                const m = MINERAUX[mid];
                if (m && m.reqPick <= mine_data.pickaxe) { choisi = m; break; }
            }
        }
        if (choisi) resultats.push(choisi);
    }
    return resultats;
}

function ajouterInv(inv, id, qte = 1) {
    inv[id] = (inv[id] || 0) + qte;
}

function totalInventaire(inv) {
    return Object.values(inv).reduce((a, b) => a + b, 0);
}

function valeurInventaire(inv, mine_data) {
    const bonus = getMineBonus(mine_data);
    let total = 0;
    for (const [id, qte] of Object.entries(inv)) {
        const m = MINERAUX[id];
        if (m) total += m.valeur * qte * (1 + bonus.sell) * (1 + mine_data.prestigeBonus);
    }
    return Math.floor(total);
}

function barre(val, max, len = 20, car = "█", vide = "░") {
    const pct = Math.min(1, val / Math.max(1, max));
    const fill = Math.round(len * pct);
    return `${car.repeat(fill)}${vide.repeat(len - fill)} ${Math.round(pct * 100)}%`;
}

function renderHelp() {
    return `
${fonts.bold("⛏️ MINE ROYALE")} ${fonts.outline("v1.0")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("💰 EXTRACTION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⛏️ mine - Creuser (cooldown 3 min)
📦 mine inventaire - Voir vos mineraux
💰 mine vendre - Tout vendre
💰 mine vendre <ID> <qte> - Vente partielle

${fonts.bold("⬆️ PROGRESSION")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⛏️ mine pioche - Améliorer la pioche
🔧 mine upgrade - Améliorations spéciales
🔧 mine upgrade <ID> - Acheter un upgrade
🏗️ mine mine <ID> - Changer de mine
🔮 mine fusion <ID> - Fusionner des mineraux

${fonts.bold("🗺️ AVENTURE")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
🚀 mine expedition - Lancer une expedition
🏠 mine retour - Rentrer de l'expedition
🎁 mine daily - Bonus quotidien
✨ mine prestige - Réinitialiser + bonus

${fonts.bold("📊 INFOS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📊 mine stat - Tableau de bord
🏆 mine classement - Top mineurs
📋 mine mineraux - Catalogue complet
`.trim();
}

function renderStat(mine_data, walletBalance) {
    const pick = PIOCHE_NIVEAUX[mine_data.pickaxe];
    const mine = MINES.find(m => m.id === mine_data.mineActive);
    const nv = mine_data.niveau;
    const xpCur = mine_data.xp - getXPNiveau(nv);
    const xpNxt = getXPNiveau(nv + 1) - getXPNiveau(nv);
    const bonus = getMineBonus(mine_data);

    return `
${fonts.bold("📊 TABLEAU DE BORD MINIER")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("👤 PROFIL MINEUR")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
📈 Niveau: ${fonts.bold(nv)} | Prestige: ${fonts.outline(String(mine_data.prestige))}
⭐ XP: ${barre(xpCur, xpNxt, 16)}
💳 Portefeuille: ${fonts.bold(FM(walletBalance))}

${fonts.bold("🔧 ÉQUIPEMENT")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⛏️ Pioche: ${fonts.bold(pick.nom)}
📦 Slots: ${pick.slots + bonus.slots} | Multiplicateur: x${pick.mult}
🏗️ Mine active: ${fonts.italic(mine.nom)}
🔧 Upgrades: ${mine_data.upgrades.length}/${UPGRADES.length}

${fonts.bold("📊 STATISTIQUES")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
⛏️ Total miné: ${FMN(mine_data.totalMine)} mineraux
💰 Total vendu: ${FMN(mine_data.totalVendu)} mineraux
💎 Total gagné: ${FM(mine_data.totalGagne)}
🏆 Meilleure vente: ${FM(mine_data.bestVente)}
🔮 Fusions: ${FMN(mine_data.fusionsTotal)}
🔥 Streak daily: ${mine_data.streak} jours

${fonts.bold("💪 BONUS ACTIFS")} ${fonts.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
💰 Vente: +${Math.round(bonus.sell * 100)}%
💎 Rarete: +${Math.round(bonus.rarety * 100)}%
🚀 Expedition: +${Math.round(bonus.expMult * 100)}%
✨ Prestige: +${Math.round(mine_data.prestigeBonus * 100)}%
`.trim();
}

function renderInventaire(mine_data) {
    const inv = mine_data.inventaire;
    const keys = Object.keys(MINERAUX).filter(k => inv[k] > 0);
    const bonus = getMineBonus(mine_data);

    if (!keys.length) {
        return `
${fonts.bold("📦 INVENTAIRE VIDE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⛏️ Utilisez 'mine' pour creuser!
`.trim();
    }

    let txt = `${fonts.bold("📦 INVENTAIRE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    let total = 0;
    for (const k of keys) {
        const m = MINERAUX[k];
        const qte = inv[k] || 0;
        const val = Math.floor(m.valeur * (1 + bonus.sell) * (1 + mine_data.prestigeBonus));
        const totalVal = val * qte;
        total += totalVal;
        txt += `${m.couleur} ${m.nom}: ${qte} unités (${FM(val)}/u) = ${FM(totalVal)}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `💰 Valeur totale: ${fonts.bold(FM(total))}\n`;
    txt += `📦 Objets: ${totalInventaire(inv)}\n`;
    txt += `\n💡 'mine vendre' pour tout vendre`;
    return txt;
}

function renderMineraux(mine_data) {
    let txt = `${fonts.bold("📋 CATALOGUE DES MINERAUX")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const m of Object.values(MINERAUX)) {
        const dispo = m.reqPick <= mine_data.pickaxe;
        txt += `${m.couleur} ${m.nom}\n`;
        txt += `   💰 Valeur: ${FM(m.valeur)}\n`;
        txt += `   🎯 Chance: ${m.rare}%\n`;
        txt += `   ${dispo ? "✅ Accessible" : `🔒 Pioche Niv.${m.reqPick} requis`}\n\n`;
    }
    txt += `💡 Améliorez votre pioche pour débloquer plus de mineraux!`;
    return txt;
}

function renderPioches(mine_data) {
    let txt = `${fonts.bold("⛏️ AMÉLIORATION DE PIOCHE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (let i = 0; i < PIOCHE_NIVEAUX.length; i++) {
        const p = PIOCHE_NIVEAUX[i];
        const actuel = i === mine_data.pickaxe;
        const passe = i < mine_data.pickaxe;
        const mark = actuel ? "✅ [ACTUEL]" : passe ? "✅ [OK]" : "    ";
        const cost = passe || actuel ? "" : FM(p.cout);
        txt += `${mark} ${p.nom.padEnd(22)} ${cost}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    const next = Math.min(mine_data.pickaxe + 1, PIOCHE_NIVEAUX.length - 1);
    txt += `📈 Actuelle: ${PIOCHE_NIVEAUX[mine_data.pickaxe].nom}\n`;
    txt += `⬆️ Prochaine: ${PIOCHE_NIVEAUX[next].nom}\n`;
    txt += `\n💡 'mine pioche acheter' pour améliorer`;
    return txt;
}

function renderUpgrades(mine_data) {
    let txt = `${fonts.bold("🔧 AMÉLIORATIONS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const u of UPGRADES) {
        const owns = mine_data.upgrades.includes(u.id);
        const mark = owns ? "✅" : "   ";
        txt += `${mark} ${fonts.bold(u.id.padEnd(10))} ${u.nom.padEnd(20)} ${owns ? "✅" : FM(u.cout)}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const u of UPGRADES) {
        txt += `📌 ${u.id.padEnd(10)} ${u.effet}\n`;
    }
    txt += `\n💡 'mine upgrade <ID>' pour acheter`;
    return txt;
}

function renderMines(mine_data) {
    let txt = `${fonts.bold("🏗️ MINES DISPONIBLES")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const m of MINES) {
        const active = m.id === mine_data.mineActive;
        const debloq = mine_data.minesDebloquees.includes(m.id);
        const canUnlk = mine_data.pickaxe >= m.debloquer;
        const mark = active ? "▶️ [ACTIVE]" : debloq ? "✅ [OK]" : canUnlk ? "    " : "🔒 [LOCK]";
        const info = active || debloq ? "" : canUnlk ? FM(m.cout) : `Pioche Niv.${m.debloquer}`;
        txt += `${mark} ${m.nom.padEnd(22)} +${Math.round(m.bonus * 100)}% ${info}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `📍 Active: ${MINES.find(m => m.id === mine_data.mineActive)?.nom}\n`;
    txt += `\n💡 'mine mine <ID>' pour changer\n`;
    txt += `📌 IDs: CARRIERE GROTTE VOLCAN ABYSSES ASTRAL`;
    return txt;
}

function renderExpeditions(mine_data) {
    let txt = `${fonts.bold("🚀 EXPEDITIONS (durée: 8h)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const e of EXPEDITIONS) {
        const ok = mine_data.niveau >= e.reqNvl;
        const mark = ok ? "    " : `🔒 Niv.${e.reqNvl}`;
        txt += `${fonts.bold(e.id)} ${e.nom.padEnd(22)} ${mark}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const e of EXPEDITIONS) {
        txt += `📌 ${e.id} Gain: ${FM(e.gain[0])}-${FM(e.gain[1])} | XP: +${e.xp}\n`;
    }
    txt += `\n`;
    if (mine_data.expedActive) {
        txt += `⏳ EN COURS: ${fonts.bold(mine_data.expedActive)} — 'mine retour' pour rentrer\n`;
    } else {
        txt += `💡 'mine expedition <ID>' pour partir\n`;
    }
    return txt;
}

async function cmdMine(message, mine_data, user, save) {
    const bonus = getMineBonus(mine_data);
    const cdMs = Math.floor(COOLDOWNS.MINE * (1 - bonus.cdReduc));
    const cd = timeLeft(mine_data.lastMine, cdMs);
    if (cd) {
        return message.reply(`
${fonts.bold("⏰ PIOCHE EN COOLDOWN")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Prochaine extraction dans: ${fonts.bold(cd)}
💡 Améliorez la FOREUSE pour réduire
`.trim());
    }

    const resultats = getMineraux(mine_data);
    const pick = PIOCHE_NIVEAUX[mine_data.pickaxe];
    const mine = MINES.find(m => m.id === mine_data.mineActive);
    const xpGain = resultats.length * (1 + mine.bonus) * 10;

    resultats.forEach(r => ajouterInv(mine_data.inventaire, r.id));
    mine_data.totalMine += resultats.length;
    mine_data.xp += Math.floor(xpGain);
    mine_data.niveau = getNiveau(mine_data.xp);
    mine_data.lastMine = Date.now();
    await save();

    const compte = {};
    resultats.forEach(r => { compte[r.id] = (compte[r.id] || 0) + 1; });

    let txt = `${fonts.bold("⛏️ EXTRACTION RÉUSSIE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `📍 Mine: ${mine.nom}\n`;
    txt += `⛏️ Pioche: ${pick.nom}\n\n`;
    for (const [id, n] of Object.entries(compte)) {
        const m = MINERAUX[id];
        txt += `${m.couleur} ${m.nom}: x${n}\n`;
    }
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `⭐ XP gagné: +${Math.round(xpGain)}\n`;
    txt += `📈 Niveau: ${mine_data.niveau}\n`;
    txt += `📦 Inventaire: ${totalInventaire(mine_data.inventaire)} mineraux\n`;
    txt += `\n⏳ Prochaine mine dans: ${Math.round(cdMs / 60000)}min`;
    return message.reply(txt);
}

async function cmdVendre(message, args, mine_data, user, save) {
    const inv = mine_data.inventaire;
    const bonus = getMineBonus(mine_data);

    let gainTotal = 0;
    let qteTotale = 0;
    const details = [];

    if (args[1] && args[2]) {
        const id = args[1].toUpperCase();
        const qte = parseInt(args[2]);
        if (!MINERAUX[id]) return message.reply(`❌ Mineral inconnu. Voir 'mine mineraux'.`);
        if (!qte || qte < 1) return message.reply(`❌ Quantité invalide.`);
        const dispo = inv[id] || 0;
        const vendu = Math.min(qte, dispo);
        if (!vendu) return message.reply(`❌ Vous n'avez pas de ${MINERAUX[id].nom}.`);
        const val = Math.floor(MINERAUX[id].valeur * (1 + bonus.sell) * (1 + mine_data.prestigeBonus) * vendu);
        gainTotal = val;
        qteTotale = vendu;
        inv[id] -= vendu;
        if (inv[id] <= 0) delete inv[id];
        details.push(`${MINERAUX[id].couleur} ${MINERAUX[id].nom} x${vendu} = ${FM(val)}`);
    } else {
        for (const [id, qte] of Object.entries(inv)) {
            const m = MINERAUX[id];
            if (!m || !qte) continue;
            const val = Math.floor(m.valeur * (1 + bonus.sell) * (1 + mine_data.prestigeBonus) * qte);
            gainTotal += val;
            qteTotale += qte;
            details.push(`${m.couleur} ${m.nom.padEnd(12)} x${qte}  ${FM(val)}`);
        }
        mine_data.inventaire = {};
    }

    if (!gainTotal) return message.reply(`📦 Inventaire vide! Creusez d'abord.`);

    user.money = (user.money || 0) + gainTotal;
    mine_data.totalVendu += qteTotale;
    mine_data.totalGagne += gainTotal;
    if (gainTotal > mine_data.bestVente) mine_data.bestVente = gainTotal;
    await save();

    let txt = `${fonts.bold("💰 VENTE COMPLÉTÉE")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const d of details) txt += `${d}\n`;
    txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `📦 Mineraux vendus: ${qteTotale}\n`;
    txt += `💰 Recette totale: ${fonts.bold(FM(gainTotal))}\n`;
    txt += `💪 Bonus vente: +${Math.round(bonus.sell * 100)}%\n`;
    txt += `\n💳 Portefeuille: ${FM(user.money)}`;
    return message.reply(txt);
}

async function cmdPioche(message, args, mine_data, user, save) {
    if ((args[1] || "").toLowerCase() === "acheter") {
        const nvlvl = mine_data.pickaxe + 1;
        if (nvlvl >= PIOCHE_NIVEAUX.length)
            return message.reply(`⛏️ Pioche maximale atteinte!`);
        const pick = PIOCHE_NIVEAUX[nvlvl];
        if ((user.money || 0) < pick.cout)
            return message.reply(`❌ Fonds insuffisants.\nBesoin: ${FM(pick.cout)}`);
        user.money -= pick.cout;
        mine_data.pickaxe = nvlvl;
        await save();
        return message.reply(`
${fonts.bold("⛏️ PIOCHE AMÉLIORÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold(pick.nom)}
📈 Multiplicateur: x${pick.mult}
📦 Slots/mine: ${pick.slots}
💰 Coût payé: ${FM(pick.cout)}
`.trim());
    }
    return message.reply(renderPioches(mine_data));
}

async function cmdUpgrade(message, args, mine_data, user, save) {
    const id = (args[1] || "").toUpperCase();
    if (!id) return message.reply(renderUpgrades(mine_data));
    const upg = UPGRADES.find(u => u.id === id);
    if (!upg) return message.reply(`❌ Upgrade "${id}" inconnu.\nVoir 'mine upgrade'`);
    if (mine_data.upgrades.includes(id))
        return message.reply(`❌ ${upg.nom} déjà possédé!`);
    if ((user.money || 0) < upg.cout)
        return message.reply(`❌ Fonds insuffisants.\nBesoin: ${FM(upg.cout)}`);
    user.money -= upg.cout;
    mine_data.upgrades.push(id);
    await save();
    return message.reply(`
${fonts.bold("🔧 UPGRADE INSTALLÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold(upg.nom)}
📌 Effet: ${upg.effet}
💰 Coût: ${FM(upg.cout)}
`.trim());
}

async function cmdChangerMine(message, args, mine_data, user, save) {
    const id = (args[1] || "").toUpperCase();
    if (!id) return message.reply(renderMines(mine_data));
    const mine = MINES.find(m => m.id === id);
    if (!mine) return message.reply(`❌ Mine "${id}" inconnue.\nVoir 'mine mine'`);
    if (mine_data.pickaxe < mine.debloquer)
        return message.reply(`🔒 Requiert pioche niveau ${mine.debloquer}.`);
    if (!mine_data.minesDebloquees.includes(id)) {
        if ((user.money || 0) < mine.cout)
            return message.reply(`❌ Achat requis: ${FM(mine.cout)}`);
        user.money -= mine.cout;
        mine_data.minesDebloquees.push(id);
    }
    mine_data.mineActive = id;
    await save();
    return message.reply(`
${fonts.bold("🏗️ MINE CHANGÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 ${fonts.bold(mine.nom)}
📈 Bonus revenu: +${Math.round(mine.bonus * 100)}%
💎 Mineraux: ${mine.mineraux.join(", ")}
`.trim());
}

async function cmdFusion(message, args, mine_data, user, save) {
    const id = (args[1] || "").toUpperCase();
    const qte = parseInt(args[2]) || 1;
    if (!id) {
        let txt = `${fonts.bold("🔮 FUSION DE MINERAUX")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        for (const m of Object.values(MINERAUX)) {
            if (m.fusion) {
                txt += `${m.couleur} ${m.nom}: ${m.fusion[1]}x ${MINERAUX[m.fusion[0]].nom} -> 1x ${m.nom}\n`;
            }
        }
        txt += `\n💡 'mine fusion <ID> [qte]'`;
        return message.reply(txt);
    }
    const cible = MINERAUX[id];
    if (!cible || !cible.fusion) return message.reply(`❌ ${id}: pas de fusion possible.`);
    const [srcId, ratio] = cible.fusion;
    const bonus = getMineBonus(mine_data);
    const outQte = bonus.fusX2 ? qte * 2 : qte;
    const needed = ratio * qte;
    const dispo = mine_data.inventaire[srcId] || 0;
    if (dispo < needed) return message.reply(`❌ Insuffisant: ${needed} ${MINERAUX[srcId].nom} requis\nVous avez: ${dispo}`);
    mine_data.inventaire[srcId] -= needed;
    if (mine_data.inventaire[srcId] <= 0) delete mine_data.inventaire[srcId];
    ajouterInv(mine_data.inventaire, id, outQte);
    mine_data.fusionsTotal += outQte;
    await save();
    return message.reply(`
${fonts.bold("🔮 FUSION RÉUSSIE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${needed}x ${MINERAUX[srcId].nom}
=> ${outQte}x ${cible.nom}${bonus.fusX2 ? " (x2 Analyseur Géo)" : ""}
💎 Valeur unitaire: ${FM(cible.valeur)}
`.trim());
}

async function cmdExpedition(message, args, mine_data, save) {
    if (mine_data.expedActive) {
        const cd = timeLeft(mine_data.expedDebut, COOLDOWNS.EXPEDITION);
        if (cd) {
            return message.reply(`
${fonts.bold("🚀 EN EXPEDITION")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 ${mine_data.expedActive}
⏳ Retour dans: ${cd}
💡 'mine retour' pour rentrer (bonus si complet)
`.trim());
        }
        return message.reply(`
${fonts.bold("✅ EXPEDITION TERMINÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Utilisez 'mine retour' pour récupérer les gains!
`.trim());
    }
    const id = (args[1] || "").toUpperCase();
    if (!id) return message.reply(renderExpeditions(mine_data));
    const exp = EXPEDITIONS.find(e => e.id === id);
    if (!exp) return message.reply(`❌ Expedition "${id}" inconnue.`);
    if (mine_data.niveau < exp.reqNvl) return message.reply(`🔒 Requiert niveau ${exp.reqNvl}.`);
    mine_data.expedActive = id;
    mine_data.expedDebut = Date.now();
    await save();
    return message.reply(`
${fonts.bold("🚀 EXPEDITION LANCÉE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 ${fonts.bold(exp.nom)}
⏱️ Durée: 8h
💰 Gain prévu: ${FM(exp.gain[0])} - ${FM(exp.gain[1])}
⭐ XP: +${exp.xp}

💡 'mine retour' dans 8h pour rentrer
`.trim());
}

async function cmdRetour(message, mine_data, user, save) {
    if (!mine_data.expedActive) return message.reply(`❌ Vous n'êtes pas en expedition.`);
    const exp = EXPEDITIONS.find(e => e.id === mine_data.expedActive);
    const elapsed = Date.now() - (mine_data.expedDebut || 0);
    const bonus = getMineBonus(mine_data);
    const complet = elapsed >= COOLDOWNS.EXPEDITION;
    const mult = complet ? 1 : 0.4;
    const gainBase = rand(exp.gain[0], exp.gain[1]);
    const gain = Math.floor(gainBase * mult * (1 + bonus.expMult) * (1 + mine_data.prestigeBonus));
    const xp = Math.floor(exp.xp * mult);

    user.money = (user.money || 0) + gain;
    mine_data.totalGagne += gain;
    mine_data.xp += xp;
    mine_data.niveau = getNiveau(mine_data.xp);
    mine_data.expedActive = null;
    mine_data.expedDebut = null;
    mine_data.lastExpedition = Date.now();
    await save();

    return message.reply(`
${fonts.bold("🏠 RETOUR D'EXPEDITION")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 ${fonts.bold(exp.nom)}
${complet ? "✅ Expedition complète!" : "⚠️ Retour anticipé (x0.4)"}

💰 Gain: ${fonts.bold(FM(gain))}
⭐ XP: +${xp}
📈 Niveau: ${mine_data.niveau}

💳 Portefeuille: ${FM(user.money)}
`.trim());
}

async function cmdDaily(message, mine_data, user, save) {
    const cd = timeLeft(mine_data.lastDaily, COOLDOWNS.DAILY);
    if (cd) {
        return message.reply(`
${fonts.bold("🎁 DAILY DÉJÀ RÉCUPÉRÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Reviens dans: ${cd}
`.trim());
    }
    const bonus = getMineBonus(mine_data);
    mine_data.streak++;
    const base = 200;
    const gain = Math.floor(base * (1 + mine_data.niveau * 0.05) * (1 + bonus.sell) * (1 + mine_data.streak * 0.05));
    const ids = Object.keys(MINERAUX);
    const freeM = MINERAUX[ids[Math.floor(Math.random() * Math.min(mine_data.niveau + 2, ids.length))]];
    ajouterInv(mine_data.inventaire, freeM.id, 1);
    user.money = (user.money || 0) + gain;
    mine_data.lastDaily = Date.now();
    mine_data.xp += 30;
    await save();

    return message.reply(`
${fonts.bold("🎁 BONUS QUOTIDIEN")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Argent: ${fonts.bold(FM(gain))}
💎 Mineral: +1 ${freeM.nom} ${freeM.couleur}
⭐ +30 XP

🔥 Streak: ${mine_data.streak} jours
📈 Niveau: ${mine_data.niveau}

💡 Reviens demain!
`.trim());
}

async function cmdPrestige(message, mine_data, user, save) {
    if ((mine_data.totalGagne || 0) < PRESTIGE_SEUIL) {
        return message.reply(`
${fonts.bold("✨ PRESTIGE INDISPONIBLE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requis: ${FM(PRESTIGE_SEUIL)} total gagné
Actuel: ${FM(mine_data.totalGagne)}
Progression: ${barre(mine_data.totalGagne, PRESTIGE_SEUIL, 20)}
`.trim());
    }

    const nvPrestige = mine_data.prestige + 1;
    const nouveauBonus = nvPrestige * 0.10;

    mine_data.prestige = nvPrestige;
    mine_data.prestigeBonus = nouveauBonus;
    mine_data.pickaxe = 0;
    mine_data.mineActive = "CARRIERE";
    mine_data.minesDebloquees = ["CARRIERE"];
    mine_data.inventaire = {};
    mine_data.upgrades = [];
    mine_data.xp = 0;
    mine_data.niveau = 1;
    mine_data.totalMine = 0;
    mine_data.totalVendu = 0;
    mine_data.totalGagne = 0;
    mine_data.expedActive = null;
    mine_data.expedDebut = null;
    await save();

    return message.reply(`
${fonts.bold("✨ PRESTIGE ACTIVÉ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Niveau Prestige: ${fonts.outline(String(nvPrestige))}
💪 Bonus permanent: +${Math.round(nouveauBonus * 100)}% sur tout

🔄 Progression réinitialisée.
💎 Votre bonus prestige est permanent.

🌟 Bonne chance, mineur légendaire!
`.trim());
}

async function cmdClassement(message, usersData) {
    let all;
    try { all = await usersData.getAll(); } catch (e) { all = {}; }
    const scores = [];
    for (const [uid, u] of Object.entries(all || {})) {
        if (u?.data?.mine) {
            scores.push({
                nom: u.name || `User#${uid.slice(-4)}`,
                total: u.data.mine.totalGagne || 0,
                nv: u.data.mine.niveau || 1,
                prestige: u.data.mine.prestige || 0,
            });
        }
    }
    scores.sort((a, b) => b.total - a.total);
    const top = scores.slice(0, 10);
    if (!top.length) return message.reply(`📊 Aucun joueur pour l'instant.`);

    let txt = `${fonts.bold("🏆 CLASSEMENT MINEURS")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (let i = 0; i < top.length; i++) {
        const p = top[i];
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        txt += `${medal} ${p.nom}\n`;
        txt += `   📈 Niveau: ${p.nv} | Prestige: ${p.prestige} | 💰 Gains: ${FM(p.total)}\n\n`;
    }
    return message.reply(txt);
}

module.exports = {
    config: {
        name: "mine",
        aliases: ["miner", "mineur", "mining"],
        version: "1.0",
        author: "Christus",
        countDown: 3,
        role: 0,
        description: {
            fr: "⛏️ Mine Royale: extrayez des mineraux, ameliorez votre pioche, fusionnez, partez en expedition et atteignez le prestige."
        },
        category: "economy",
        guide: {
            fr: "Tapez 'mine help' pour voir toutes les commandes."
        }
    },

    onStart: async function ({ message, event, args, usersData }) {
        const { senderID } = event;
        const sub = (args[0] || "stat").toLowerCase();

        let user = await usersData.get(senderID) || { money: 0, exp: 0, data: {} };
        if (!user.data) user.data = {};
        if (!user.data.mine) user.data.mine = initMine();

        const mine_data = user.data.mine;
        const walletBalance = user.money || 0;

        const save = async () => {
            user.data.mine = mine_data;
            await usersData.set(senderID, user);
        };

        switch (sub) {
            case "help":
            case "aide":
                return message.reply(renderHelp());

            case "stat":
            case "stats":
            case "dashboard":
            case "profil":
                return message.reply(renderStat(mine_data, walletBalance));

            case "inventaire":
            case "inv":
            case "sac":
                return message.reply(renderInventaire(mine_data));

            case "mineraux":
            case "catalogue":
                return message.reply(renderMineraux(mine_data));

            case "creuser":
            case "miner":
            case "dig":
            case undefined:
            case "":
                return cmdMine(message, mine_data, user, save);

            case "vendre":
            case "sell":
                return cmdVendre(message, args, mine_data, user, save);

            case "pioche":
            case "pick":
            case "pickaxe":
                return cmdPioche(message, args, mine_data, user, save);

            case "upgrade":
            case "amelio":
                return cmdUpgrade(message, args, mine_data, user, save);

            case "mine":
            case "mines":
            case "zone":
                return cmdChangerMine(message, args, mine_data, user, save);

            case "fusion":
            case "fusionner":
            case "craft":
                return cmdFusion(message, args, mine_data, user, save);

            case "expedition":
            case "exped":
                return cmdExpedition(message, args, mine_data, save);

            case "retour":
            case "rentrer":
            case "recall":
                return cmdRetour(message, mine_data, user, save);

            case "daily":
                return cmdDaily(message, mine_data, user, save);

            case "prestige":
                return cmdPrestige(message, mine_data, user, save);

            case "classement":
            case "top":
            case "leaderboard":
                return cmdClassement(message, usersData);

            default:
                return cmdMine(message, mine_data, user, save);
        }
    }
};