"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  421 ROYAL — Jeu de dés français classique pour GoatBot
//  Auteur  : Christus
//  Joueurs : 2 à 6 (humains + bots IA)
//  Visuels : Canvas (plateau de jeu) + Texte stylisé
//  Systèmes: Paris, Jetons, Tours limités, IA stratégique
// ═══════════════════════════════════════════════════════════════════════════════

const { createCanvas } = require("canvas");
const Canvas           = require("canvas");
const path             = require("path");
const fs               = require("fs");
const os               = require("os");

try { Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "RF", weight: "bold"   }); } catch (_) {}
try { Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "RF", weight: "normal" }); } catch (_) {}
try { Canvas.registerFont(path.join(__dirname, "assets/font/Emoji.ttf"),            { family: "Emoji" });               } catch (_) {}

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Constantes ───────────────────────────────────────────────────────────────
const GAME_EXPIRE   = 1000 * 60 * 60;   // 1h
const BOT_DELAY     = 1600;
const MAX_PLAYERS   = 6;
const MIN_PLAYERS   = 2;
const STARTING_CHIPS = 8;               // jetons de départ
const MAX_ROUNDS    = 3;                // tours de relance par manche
const TOTAL_ROUNDS  = 5;               // nombre de manches pour la partie complète
const MAX_REROLLS   = 2;               // relances max par tour

const activeGames = new Map();

// ─── Couleurs / Thème ─────────────────────────────────────────────────────────
const PLAYER_COLORS = ["#ef4444","#3b82f6","#22c55e","#facc15","#a855f7","#f97316"];
const PLAYER_DARK   = ["#7f1d1d","#1e3a5f","#14532d","#713f12","#581c87","#7c2d12"];
const PLAYER_LABEL  = ["rouge","bleu","vert","jaune","violet","orange"];

// ─── Valeurs et combinaisons ──────────────────────────────────────────────────
// Le 421 : le plus grand coup possible
// Hiérarchie des combinaisons (du meilleur au moins bon)
// 421, 111, brelan, suite, 211, reste trié

function scoreCombination(dice) {
  const sorted = [...dice].sort((a, b) => b - a);
  const d      = sorted;

  // 421
  if (d[0] === 4 && d[1] === 2 && d[2] === 1) return { name: "421", rank: 100, chips: 0 };
  // 111
  if (d[0] === 1 && d[1] === 1 && d[2] === 1) return { name: "111", rank: 90,  chips: 0 };
  // Brelan (xxx)
  if (d[0] === d[1] && d[1] === d[2]) {
    const v = d[0];
    const ranks = { 6: 86, 5: 85, 4: 84, 3: 83, 2: 82 };
    return { name: `${v}${v}${v}`, rank: ranks[v] || 80, chips: 0 };
  }
  // Suite (456, 345, 234, 123)
  if (d[0] === d[1] + 1 && d[1] === d[2] + 1) {
    const ranks = { 6: 70, 5: 69, 4: 68, 3: 67 };
    return { name: `${d[0]}${d[1]}${d[2]}`, rank: ranks[d[0]] || 66, chips: 0 };
  }
  // 211, 311... (paire avec 1)
  if ((d[0] === d[1] && d[2] === 1) || (d[0] === 1 && d[1] === d[2])) {
    const pair = d[0] === d[1] ? d[0] : d[2];
    const r    = 20 + pair * 5;
    return { name: `${pair}${pair}1`, rank: r, chips: 0 };
  }
  // Paire simple
  if (d[0] === d[1]) return { name: `paire de ${d[0]}`, rank: 10 + d[0], chips: 0 };
  if (d[1] === d[2]) return { name: `paire de ${d[1]}`, rank: 10 + d[1], chips: 0 };

  // Reste — valeur numérique simple
  const val = d[0] * 100 + d[1] * 10 + d[2];
  return { name: d.join(""), rank: val / 1000, chips: 0 };
}

// Jetons à payer selon combinaison gagnante/perdante
function chipsForCombo(combo, isWinner) {
  if (combo.name === "421") return isWinner ? 0 : 8;   // le perdant paie 8
  if (combo.name === "111") return isWinner ? 0 : 4;
  if (/^\d\d\d$/.test(combo.name) && combo.name[0] === combo.name[1] && combo.name[1] === combo.name[2]) return isWinner ? 0 : 3; // brelan
  return isWinner ? 0 : 1;
}

const DIE_FACES_ASCII = {
  1: ["┌─────┐","│     │","│  ●  │","│     │","└─────┘"],
  2: ["┌─────┐","│  ●  │","│     │","│  ●  │","└─────┘"],
  3: ["┌─────┐","│●    │","│  ●  │","│    ●│","└─────┘"],
  4: ["┌─────┐","│●   ●│","│     │","│●   ●│","└─────┘"],
  5: ["┌─────┐","│●   ●│","│  ●  │","│●   ●│","└─────┘"],
  6: ["┌─────┐","│● ● ●│","│     │","│● ● ●│","└─────┘"],
};

// ─── Création de partie ───────────────────────────────────────────────────────
function createGame(threadID, players, betAmount, commandName) {
  return {
    id:           `${threadID}_${Date.now()}`,
    key:          threadID,
    threadID,
    commandName,
    players:      players.map((p, i) => ({
      ...p,
      chips:      STARTING_CHIPS,
      color:      PLAYER_COLORS[i],
      dark:       PLAYER_DARK[i],
      label:      PLAYER_LABEL[i],
      score:      0,          // score sur les manches
      lostChips:  0,
      wonChips:   0,
      totalRolls: 0,
      best:       null,
    })),
    phase:        "roll",      // roll | keep | ended
    turnIndex:    0,
    round:        1,           // manche (sur TOTAL_ROUNDS)
    subRound:     0,           // tour de relance dans la manche (0 à MAX_REROLLS)
    currentDice:  [0,0,0],
    keptDice:     [],          // indices des dés gardés (pour relance)
    rollCount:    0,           // nombre de relances ce tour (0 = pas encore lancé)
    roundResults: [],          // { playerID, combo, chips }
    log:          [],
    moveCount:    0,
    startedAt:    Date.now(),
    updatedAt:    Date.now(),
    betAmount,
    pot:          betAmount * players.filter(p => !p.bot).length,
    replyMessageID: null,
    winner:       null,
    // Résultats actuels de la manche (un résultat par joueur)
    mancheResults: [],
  };
}

function currentPlayer(game) { return game.players[game.turnIndex]; }

function advanceTurn(game) {
  game.turnIndex = (game.turnIndex + 1) % game.players.length;
  game.rollCount = 0;
  game.keptDice  = [];
  game.currentDice = [0,0,0];
}

// ─── Lancer les dés ───────────────────────────────────────────────────────────
function rollDice(kept = []) {
  const dice = [0,0,0];
  for (let i = 0; i < 3; i++) {
    dice[i] = kept.includes(i) ? dice[i] : Math.floor(Math.random() * 6) + 1;
  }
  return dice;
}

function rollFresh() {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

function rerollSelected(current, keepIndices) {
  return current.map((v, i) => keepIndices.includes(i) ? v : Math.floor(Math.random() * 6) + 1);
}

// ─── IA stratégique ───────────────────────────────────────────────────────────
// L'IA décide quels dés garder pour maximiser le score
function botDecideKeep(dice) {
  const sorted  = [...dice].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const current = scoreCombination(dice);

  // Déjà une combinaison top → garder tout
  if (current.rank >= 66) return { keep: [0,1,2], reason: "combo top" };

  // 4-2 présents → garder pour viser 421
  const has4 = dice.indexOf(4), has2 = dice.indexOf(2), has1 = dice.indexOf(1);
  if (has4 !== -1 && has2 !== -1) return { keep: [has4, has2], reason: "vise 421" };
  if (has4 !== -1 && has1 !== -1) return { keep: [has4, has1], reason: "vise 421" };
  if (has2 !== -1 && has1 !== -1) return { keep: [has2, has1], reason: "vise 421" };

  // Brelan partiel (paire) → garder la paire
  if (dice[0] === dice[1]) return { keep: [0,1], reason: "paire" };
  if (dice[0] === dice[2]) return { keep: [0,2], reason: "paire" };
  if (dice[1] === dice[2]) return { keep: [1,2], reason: "paire" };

  // Garder le dé le plus haut
  return { keep: [sorted[0].i], reason: "meilleur dé" };
}

// ─── Résolution d'une manche ──────────────────────────────────────────────────
function resolveManche(game) {
  const results = game.mancheResults;
  if (!results.length) return [];

  // Trier par rang décroissant (meilleur = index 0)
  results.sort((a, b) => b.combo.rank - a.combo.rank);

  const winner   = results[0];
  const losers   = results.slice(1);
  const messages = [];

  // Cas spécial 421 : le perdant paie 8 jetons
  // Cas spécial 111 : le perdant paie 4 jetons
  // Sinon : le perdant paie 1 jeton au gagnant
  const loser = losers[losers.length - 1]; // le pire
  const chips = winner.combo.name === "421" ? 8 : winner.combo.name === "111" ? 4 :
                /^(\d)\1\1$/.test(winner.combo.name) ? 3 : 1;

  const loserPlayer  = game.players.find(p => p.id === loser.playerID);
  const winnerPlayer = game.players.find(p => p.id === winner.playerID);

  if (loserPlayer && winnerPlayer) {
    const actual = Math.min(chips, loserPlayer.chips);
    loserPlayer.chips  -= actual;
    winnerPlayer.chips += actual;
    loserPlayer.lostChips  += actual;
    winnerPlayer.wonChips  += actual;
    winnerPlayer.score++;
    messages.push(`✦ ${winnerPlayer.name} remporte la manche avec ${winner.combo.name} !`);
    messages.push(`  ${loserPlayer.name} perd ${actual} jeton(s). (${loserPlayer.chips} restants)`);
    if (loserPlayer.chips <= 0) {
      messages.push(`  ☠ ${loserPlayer.name} est éliminé !`);
    }
  }

  // Cas 421 : tous les autres paient
  if (winner.combo.name === "421") {
    for (const r of losers.slice(0, -1)) {
      const lp = game.players.find(p => p.id === r.playerID);
      if (lp && lp.chips > 0) {
        const a = Math.min(1, lp.chips);
        lp.chips -= a;
        if (winnerPlayer) winnerPlayer.chips += a;
        messages.push(`  ${lp.name} paie aussi 1 jeton supplémentaire (421 !)`);
      }
    }
  }

  return messages;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
function drawMixedText(ctx, text, x, y) {
  const savedFont = ctx.font;
  const sizeM     = savedFont.match(/(\d+(?:\.\d+)?)px/);
  const sz        = sizeM ? parseFloat(sizeM[1]) : 16;
  const re        = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}(?:\uFE0F)?)/gu;
  const segs      = [];
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ e: false, s: text.slice(last, m.index) });
    segs.push({ e: true, s: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ e: false, s: text.slice(last) });
  const saved = ctx.textAlign;
  let cur     = x;
  if (saved === "center") {
    let tw = 0;
    for (const seg of segs) { ctx.font = seg.e ? `${sz}px Emoji` : savedFont; tw += ctx.measureText(seg.s).width; }
    cur = x - tw / 2; ctx.textAlign = "left";
  }
  for (const seg of segs) {
    ctx.font = seg.e ? `${sz}px Emoji` : savedFont;
    ctx.fillText(seg.s, cur, y);
    cur += ctx.measureText(seg.s).width;
  }
  ctx.font = savedFont; ctx.textAlign = saved;
}

function rrect(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if (fill)  { ctx.fillStyle   = fill;  ctx.fill();   }
  if (stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

function drawDie(ctx, value, x, y, size, glowColor) {
  // Fond du dé
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 18; }
  rrect(ctx, x, y, size, size, size * 0.18, "#1e1b2e", glowColor || "#7c3aed", 3);
  ctx.restore();

  // Points
  const dotR   = size * 0.085;
  const margin = size * 0.22;
  const mid    = size * 0.5;
  const positions = {
    1: [[mid,mid]],
    2: [[margin,margin],[size-margin,size-margin]],
    3: [[margin,margin],[mid,mid],[size-margin,size-margin]],
    4: [[margin,margin],[size-margin,margin],[margin,size-margin],[size-margin,size-margin]],
    5: [[margin,margin],[size-margin,margin],[mid,mid],[margin,size-margin],[size-margin,size-margin]],
    6: [[margin,margin],[size-margin,margin],[margin,mid],[size-margin,mid],[margin,size-margin],[size-margin,size-margin]],
  };
  const pts = positions[value] || [];
  ctx.save();
  ctx.shadowColor = glowColor || "#a78bfa"; ctx.shadowBlur = 6;
  ctx.fillStyle   = "#ffffff";
  pts.forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, dotR, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

function renderGame(game) {
  const W = 1100, H = 820;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // ── Fond ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#050510"); bg.addColorStop(0.5, "#0d0a1a"); bg.addColorStop(1, "#050510");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grille déco
  ctx.strokeStyle = "rgba(124,58,237,0.06)"; ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 45) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 45) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

  // Halos
  [[W*0.15,H*0.2,"#7c3aed"],[W*0.85,H*0.3,"#db2777"],[W*0.5,H*0.8,"#0ea5e9"]].forEach(([hx,hy,hc]) => {
    const hg = ctx.createRadialGradient(hx,hy,0,hx,hy,280);
    hg.addColorStop(0,hc+"33"); hg.addColorStop(1,"transparent");
    ctx.fillStyle = hg; ctx.fillRect(0,0,W,H);
  });

  // ── Titre ──
  ctx.save();
  ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 30;
  ctx.font = "bold 52px RF"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
  ctx.fillText("421 ROYAL", W/2, 55);
  ctx.restore();

  // Sous-titre
  ctx.font = "18px RF"; ctx.fillStyle = "#6b7280"; ctx.textAlign = "center";
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  ctx.fillText(`Manche ${game.round} / ${TOTAL_ROUNDS}  ●  Tour ${game.moveCount + 1}  ●  ${elapsed}min${game.betAmount > 0 ? "  ●  Cagnotte $" + game.pot.toLocaleString() : ""}`, W/2, 82);

  // Séparateur
  const sepG = ctx.createLinearGradient(0, 98, W, 98);
  sepG.addColorStop(0,"transparent"); sepG.addColorStop(0.5,"#7c3aed88"); sepG.addColorStop(1,"transparent");
  ctx.strokeStyle = sepG; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 98); ctx.lineTo(W-60, 98); ctx.stroke();

  // ── Zone des dés ──
  const diceY   = 140;
  const diceSize = 130;
  const diceGap  = 30;
  const diceStartX = W/2 - (3 * diceSize + 2 * diceGap) / 2;
  const current  = currentPlayer(game);

  ctx.font = "bold 17px RF"; ctx.fillStyle = "#a78bfa"; ctx.textAlign = "center";
  ctx.fillText("DES ACTUELS", W/2, diceY - 18);

  game.currentDice.forEach((val, i) => {
    const dx     = diceStartX + i * (diceSize + diceGap);
    const kept   = game.keptDice.includes(i);
    const glow   = kept ? "#22c55e" : (val > 0 ? "#7c3aed" : "#374151");
    if (val > 0) {
      drawDie(ctx, val, dx, diceY, diceSize, glow);
      if (kept) {
        ctx.font = "bold 13px RF"; ctx.fillStyle = "#22c55e"; ctx.textAlign = "center";
        ctx.fillText("GARDE", dx + diceSize/2, diceY + diceSize + 18);
      }
    } else {
      // Dé vide (avant premier lancer)
      rrect(ctx, dx, diceY, diceSize, diceSize, diceSize*0.18, "#111827", "#374151", 2);
      ctx.font = "bold 22px RF"; ctx.fillStyle = "#374151"; ctx.textAlign = "center";
      ctx.fillText("?", dx + diceSize/2, diceY + diceSize/2 + 8);
    }
    // Numéro de dé
    ctx.font = "bold 12px RF"; ctx.fillStyle = "#4b5563"; ctx.textAlign = "center";
    ctx.fillText(`DE ${i+1}`, dx + diceSize/2, diceY + diceSize + 36);
  });

  // Combinaison actuelle
  if (game.currentDice[0] > 0) {
    const combo = scoreCombination(game.currentDice);
    ctx.save();
    ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 20;
    rrect(ctx, W/2 - 160, diceY + diceSize + 50, 320, 54, 14, "#1f1a00", "#f59e0b", 2);
    ctx.restore();
    ctx.font = "bold 22px RF"; ctx.fillStyle = "#fde68a"; ctx.textAlign = "center";
    ctx.fillText(`${combo.name.toUpperCase()}  ✦  Rang ${combo.rank >= 66 ? "TOP" : combo.rank >= 10 ? "MOY" : "BAS"}`, W/2, diceY + diceSize + 84);
  }

  // ── Joueurs ──
  const panelY  = diceY + diceSize + 120;
  const panelH  = H - panelY - 60;
  const cols    = game.players.length <= 3 ? game.players.length : Math.ceil(game.players.length / 2);
  const rows    = Math.ceil(game.players.length / cols);
  const colW    = (W - 80) / cols;
  const rowH    = panelH / rows;

  game.players.forEach((player, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const px  = 40 + col * colW;
    const py  = panelY + row * rowH;
    const pw  = colW - 12;
    const ph  = rowH - 12;
    const isCurrent = idx === game.turnIndex && game.phase !== "ended";

    // Fond carte joueur
    ctx.save();
    if (isCurrent) { ctx.shadowColor = player.color; ctx.shadowBlur = 22; }
    const cardBg = ctx.createLinearGradient(px, py, px+pw, py+ph);
    cardBg.addColorStop(0, isCurrent ? player.dark + "dd" : "#0f0c1a");
    cardBg.addColorStop(1, "#0a0812");
    rrect(ctx, px, py, pw, ph, 14, null, null, 0);
    ctx.fillStyle = cardBg; ctx.fill();
    rrect(ctx, px, py, pw, ph, 14, null, isCurrent ? player.color : "#2d2540", isCurrent ? 3 : 1);
    ctx.stroke();
    ctx.restore();

    // Barre de couleur latérale
    rrect(ctx, px, py + 10, 5, ph - 20, 3, player.color);

    // Nom + statut
    ctx.font = `bold ${Math.min(18, ph*0.15)}px RF`;
    ctx.fillStyle = isCurrent ? "#ffffff" : "#d1d5db";
    ctx.textAlign = "left";
    const nameLabel = (player.bot ? "[IA] " : "") + player.name.slice(0, 16);
    ctx.fillText(nameLabel, px + 16, py + 26);

    if (isCurrent) {
      ctx.font = "bold 11px RF"; ctx.fillStyle = player.color; ctx.textAlign = "right";
      ctx.fillText("► SON TOUR", px + pw - 8, py + 26);
    }

    // Jetons
    const chipsY = py + 46;
    ctx.font = "bold 14px RF"; ctx.fillStyle = "#fde68a"; ctx.textAlign = "left";
    ctx.fillText("Jetons :", px + 16, chipsY + 16);

    // Cercles jetons
    const maxDisplay = Math.min(player.chips, 12);
    for (let ci = 0; ci < maxDisplay; ci++) {
      const cx2 = px + 80 + ci * 18;
      const cy2 = chipsY + 8;
      ctx.beginPath(); ctx.arc(cx2, cy2, 7, 0, Math.PI*2);
      ctx.fillStyle   = player.color; ctx.shadowColor = player.color; ctx.shadowBlur = 8; ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (player.chips > 12) {
      ctx.font = "12px RF"; ctx.fillStyle = "#9ca3af"; ctx.textAlign = "left";
      ctx.fillText(`+${player.chips - 12}`, px + 80 + 12 * 18 + 4, chipsY + 14);
    }
    ctx.font = "bold 15px RF"; ctx.fillStyle = "#9ca3af";
    ctx.fillText(`(${player.chips})`, px + 82 + maxDisplay * 18, chipsY + 14);

    // Score manches
    ctx.font = "13px RF"; ctx.fillStyle = "#6b7280"; ctx.textAlign = "left";
    ctx.fillText(`Manches gagnees : ${player.score}`, px + 16, chipsY + 40);

    // Meilleure combinaison
    if (player.best) {
      ctx.font = "bold 12px RF"; ctx.fillStyle = "#a78bfa";
      ctx.fillText(`Best : ${player.best}`, px + 16, chipsY + 58);
    }

    // Résultat manche actuelle
    const mancheRes = game.mancheResults.find(r => r.playerID === player.id);
    if (mancheRes) {
      ctx.save();
      ctx.shadowColor = player.color; ctx.shadowBlur = 10;
      rrect(ctx, px + pw - 90, py + ph - 30, 80, 22, 6, player.dark, player.color, 1);
      ctx.restore();
      ctx.font = "bold 11px RF"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
      ctx.fillText(mancheRes.combo.name.toUpperCase(), px + pw - 50, py + ph - 14);
    }

    // Joueur éliminé
    if (player.chips <= 0 && game.phase !== "ended") {
      ctx.save(); ctx.globalAlpha = 0.55;
      rrect(ctx, px, py, pw, ph, 14, "#000000cc");
      ctx.restore();
      ctx.font = "bold 16px RF"; ctx.fillStyle = "#ef4444"; ctx.textAlign = "center";
      ctx.fillText("ELIMINE", px + pw/2, py + ph/2 + 6);
    }
  });

  // ── Log ──
  const logY = H - 48;
  const logG = ctx.createLinearGradient(0, logY-4, 0, logY+44);
  logG.addColorStop(0,"transparent"); logG.addColorStop(0.2,"#0d0a1a");
  ctx.fillStyle = logG; ctx.fillRect(0, logY-4, W, 52);

  const recent = game.log.slice(-2);
  recent.forEach((line, i) => {
    ctx.font = i === 0 ? "bold 15px RF" : "14px RF";
    ctx.fillStyle = i === 0 ? "#fde68a" : "#4b5563";
    ctx.textAlign = "center";
    const clean = (line || "").replace(/\[.*?\]/g,"").trim();
    ctx.fillText(clean.slice(0, 90), W/2, logY + 4 + i * 22);
  });

  return canvas;
}

// ─── ASCII des dés ────────────────────────────────────────────────────────────
function buildDiceAscii(dice) {
  const lines = ["", "", "", "", ""];
  dice.forEach(v => {
    const face = DIE_FACES_ASCII[v] || DIE_FACES_ASCII[1];
    face.forEach((row, i) => lines[i] += row + "  ");
  });
  return lines.join("\n");
}

// ─── Texte de statut ─────────────────────────────────────────────────────────
function buildStatusText(game, extra = "") {
  const current = currentPlayer(game);
  const combo   = game.currentDice[0] > 0 ? scoreCombination(game.currentDice) : null;
  const lines   = [];

  lines.push(`✦ 421 ROYAL ✦ Manche ${game.round}/${TOTAL_ROUNDS}`);
  if (game.betAmount > 0) lines.push(`Cagnotte : $${game.pot.toLocaleString()}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (game.currentDice[0] > 0) {
    lines.push(`Des : ${game.currentDice.join(" - ")}`);
    lines.push(`\`\`\``);
    lines.push(buildDiceAscii(game.currentDice));
    lines.push(`\`\`\``);
    if (combo) lines.push(`Combinaison : ${combo.name.toUpperCase()}`);
    lines.push(`Relances : ${game.rollCount}/${MAX_REROLLS}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Tour : ${current.name}${current.bot ? " [IA]" : ""}`);

  if (game.phase === "roll" || game.phase === "keep") {
    if (game.rollCount === 0) {
      lines.push(`→ Tapez "lancer" pour lancer les des`);
    } else if (game.rollCount < MAX_REROLLS) {
      lines.push(`→ Tapez "garder 1 2 3" (indices des des a garder) puis "relancer"`);
      lines.push(`→ Ou tapez "rester" pour valider votre combinaison`);
    } else {
      lines.push(`→ Relances epuisees. Tapez "rester" pour valider.`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  game.players.forEach(p => {
    const mr = game.mancheResults.find(r => r.playerID === p.id);
    const chip = `[${p.chips} jeton${p.chips !== 1 ? "s" : ""}]`;
    const res  = mr ? ` → ${mr.combo.name.toUpperCase()}` : "";
    lines.push(`${p.name}${p.bot?"[IA]":""} ${chip}${res}`);
  });

  if (extra) { lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`); lines.push(extra); }
  return lines.join("\n");
}

// ─── Publish ──────────────────────────────────────────────────────────────────
async function publish(message, game, body, withCanvas = true) {
  game.updatedAt = Date.now();
  const current  = currentPlayer(game);

  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }

  const mentions = current && !current.bot && game.phase !== "ended"
    ? [{ id: current.id, tag: current.name }] : [];

  if (withCanvas) {
    const tmp = path.join(os.tmpdir(), `421_${game.id}_${Date.now()}.png`);
    try {
      const canvas = renderGame(game);
      fs.writeFileSync(tmp, canvas.toBuffer("image/png"));
    } catch (e) {
      console.error("[421] Canvas:", e.message);
      return message.reply({ body: body + "\n\n" + buildDiceAscii(game.currentDice), mentions });
    }
    return new Promise(resolve => {
      message.reply({ body, attachment: fs.createReadStream(tmp), mentions }, (err, info) => {
        try { fs.unlinkSync(tmp); } catch (_) {}
        if (!err && info) regReply(game, info.messageID, current);
        if (game.phase === "ended") endGame(game);
        resolve();
      });
    });
  }

  return new Promise(resolve => {
    message.reply({ body, mentions }, (err, info) => {
      if (!err && info) regReply(game, info.messageID, current);
      if (game.phase === "ended") endGame(game);
      resolve();
    });
  });
}

function regReply(game, msgID, current) {
  game.replyMessageID = msgID;
  if (game.phase !== "ended" && current && !current.bot && global.GoatBot?.onReply) {
    global.GoatBot.onReply.set(msgID, {
      commandName: game.commandName,
      messageID: msgID,
      author: current.id,
      threadID: game.threadID,
      gameKey: game.key,
      gameID: game.id,
    });
  }
}

// ─── Fin de partie ────────────────────────────────────────────────────────────
function buildEndText(game) {
  const ranked = [...game.players].sort((a, b) => b.chips - a.chips || b.score - a.score);
  const winner = ranked[0];
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  const medals = ["or", "argent", "bronze"];
  const lines = [
    `✦ 421 ROYAL — RESULTAT FINAL ✦`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Duree : ${elapsed} min | ${game.moveCount} tours joues`,
    ``,
    `CLASSEMENT FINAL :`,
  ];
  ranked.forEach((p, i) => {
    lines.push(`  ${["[Or]","[Argent]","[Bronze]"][i] || (i+1)+"."} ${p.name}${p.bot?"[IA]":""} — ${p.chips} jetons | ${p.score} manche(s)`);
  });
  if (game.betAmount > 0 && !winner.bot) {
    lines.push(``, `Gain : ${winner.name} remporte $${game.pot.toLocaleString()} !`);
  }
  return lines.join("\n");
}

async function handlePayout(game, usersData) {
  if (!game.betAmount || !usersData) return;
  const ranked = [...game.players].sort((a, b) => b.chips - a.chips || b.score - a.score);
  const winner = ranked[0];
  if (winner.bot) {
    for (const p of game.players.filter(x => !x.bot)) {
      try { const ud = await usersData.get(p.id); await usersData.set(p.id, { money: (ud?.money||0) + game.betAmount }); } catch (_) {}
    }
  } else {
    try { const ud = await usersData.get(winner.id); await usersData.set(winner.id, { money: (ud?.money||0) + game.pot }); } catch (_) {}
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.replyMessageID);
}

function cleanupExpiredGames() {
  const now = Date.now();
  for (const g of activeGames.values()) if (now - g.updatedAt > GAME_EXPIRE) endGame(g);
}

async function getUserName(api, usersData, uid) {
  if (uid?.startsWith("bot_")) return uid;
  try {
    if (usersData?.getName) return await usersData.getName(uid);
    const info = await api.getUserInfo(uid);
    return info[uid]?.name || "Joueur";
  } catch { return "Joueur"; }
}

// ─── Avancer la manche (tous les joueurs ont joué) ────────────────────────────
async function advanceManche(message, game, api, usersData) {
  // Résoudre la manche
  const mancheMsgs = resolveManche(game);
  mancheMsgs.forEach(m => game.log.push(m));

  // Vérifier éliminations
  const alive = game.players.filter(p => p.chips > 0);

  if (alive.length <= 1 || game.round >= TOTAL_ROUNDS) {
    // Fin de partie
    game.phase = "ended";
    await handlePayout(game, usersData);
    const endText = buildEndText(game);
    await publish(message, game, endText, true);
    return;
  }

  // Prochaine manche
  game.round++;
  game.mancheResults = [];
  game.turnIndex     = 0;
  game.rollCount     = 0;
  game.currentDice   = [0,0,0];
  game.keptDice      = [];

  const mancheSummary = mancheMsgs.join("\n");
  const body = buildStatusText(game, `Manche ${game.round}/${TOTAL_ROUNDS} commence ! ${alive[0].name}, tapez "lancer" !`);
  await publish(message, game, body + "\n\n" + mancheSummary, true);
  await runBots(message, game, api, usersData);
}

// ─── Bot runner ───────────────────────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  let safety = 0;
  while (activeGames.get(game.key) === game && game.phase !== "ended" && safety < 80) {
    const current = currentPlayer(game);
    if (!current?.bot) break;
    if (current.chips <= 0) { advanceTurn(game); safety++; continue; }
    safety++;

    await sleep(BOT_DELAY);
    if (activeGames.get(game.key) !== game) break;

    // Premier lancer
    if (game.rollCount === 0) {
      game.currentDice = rollFresh();
      game.rollCount   = 1;
      game.moveCount++;
      const combo = scoreCombination(game.currentDice);
      if (combo.best) {
        if (!current.best || scoreCombination([...combo.name.replace(/\D/g,"").split("").map(Number)]).rank > scoreCombination([...current.best.replace(/\D/g,"").split("").map(Number)]).rank) {
          current.best = combo.name;
        }
      }
      current.totalRolls++;
      game.log.push(`[IA] ${current.name} lance : ${game.currentDice.join("-")} → ${combo.name.toUpperCase()}`);
    }

    // Décision de garder / relancer
    const combo   = scoreCombination(game.currentDice);
    let shouldStop = false;

    if (combo.rank >= 80) {
      shouldStop = true; // brelan ou mieux → on garde
    } else if (game.rollCount >= MAX_REROLLS) {
      shouldStop = true;
    } else {
      // Relancer selon stratégie
      const decision = botDecideKeep(game.currentDice);
      await sleep(500);
      game.keptDice    = decision.keep;
      game.currentDice = rerollSelected(game.currentDice, decision.keep);
      game.rollCount++;
      const newCombo = scoreCombination(game.currentDice);
      game.log.push(`[IA] ${current.name} relance (garde ${decision.keep.map(k=>k+1).join(",")}) : ${game.currentDice.join("-")} → ${newCombo.name.toUpperCase()}`);
      if (newCombo.rank >= 66) shouldStop = true;
    }

    if (shouldStop || game.rollCount >= MAX_REROLLS) {
      // Valider
      const finalCombo = scoreCombination(game.currentDice);
      if (!current.best || finalCombo.rank > (game.mancheResults.find(r=>r.playerID===current.id)?.combo.rank||0)) {
        current.best = finalCombo.name;
      }
      game.mancheResults.push({ playerID: current.id, combo: finalCombo });
      game.log.push(`[IA] ${current.name} valide : ${finalCombo.name.toUpperCase()}`);
      game.keptDice  = [];
      game.rollCount = 0;

      // Tous les joueurs ont joué cette manche ?
      const allPlayed = game.players.every(p => p.chips <= 0 || game.mancheResults.find(r => r.playerID === p.id));
      if (allPlayed) {
        await advanceManche(message, game, api, usersData);
        return;
      }

      advanceTurn(game);
      if (!currentPlayer(game)?.bot) {
        const body = buildStatusText(game, `C'est a ${currentPlayer(game).name} de jouer. Tapez "lancer" !`);
        await publish(message, game, body, true);
        return;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "421",
    aliases: ["quatrevingtun", "quatredeuxa", "jeu421"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "✦ 421 Royal — Jeu de des francais classique avec bots IA et paris !" },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("✦ 421 ROYAL ✦")}\n\n` +
        `${fonts.bold("Lancer une partie :")}\n` +
        `  ${fonts.monospace("421 bot")} — Solo vs 1 bot\n` +
        `  ${fonts.monospace("421 bot 4")} — 4 joueurs dont 3 bots\n` +
        `  ${fonts.monospace("421 @joueur")} — 1v1 humain\n` +
        `  ${fonts.monospace("421 @j2 @j3")} — 3 joueurs\n` +
        `  ${fonts.monospace("421 @j2 5000")} — avec mise de 5000$\n` +
        `  ${fonts.monospace("421 stop")} — abandonner\n\n` +
        `${fonts.bold("Comment jouer :")}\n` +
        `  1. Tapez ${fonts.monospace("lancer")} pour lancer les 3 des\n` +
        `  2. Tapez ${fonts.monospace("garder 1 3")} pour garder les des 1 et 3\n` +
        `  3. Tapez ${fonts.monospace("relancer")} pour relancer les autres\n` +
        `  4. Tapez ${fonts.monospace("rester")} pour valider votre combinaison\n` +
        `  (max 2 relances par tour)\n\n` +
        `${fonts.bold("Combinaisons (du meilleur au moins bon) :")}\n` +
        `  421 — Le roi (8 jetons)\n` +
        `  111 — As triplette (4 jetons)\n` +
        `  666/555/.../222 — Brelan (3 jetons)\n` +
        `  456/345/234/123 — Suite\n` +
        `  661/551/.../221 — Paire + As\n` +
        `  Reste — valeur numerique\n\n` +
        `${fonts.bold("Regles :")}\n` +
        `  Chaque joueur commence avec ${STARTING_CHIPS} jetons\n` +
        `  Le perdant de chaque manche paie des jetons\n` +
        `  Partie en ${TOTAL_ROUNDS} manches — le plus de jetons gagne`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") return message.reply(this.config.guide.fr);

    if (sub === "stop") {
      const g = activeGames.get(event.threadID);
      if (!g || !g.players.some(p => p.id === event.senderID)) return message.reply(fonts.bold("❌ Aucune partie en cours pour vous."));
      endGame(g);
      return message.reply(fonts.bold("Partie abandonnee."));
    }

    if (activeGames.has(event.threadID)) return message.reply(fonts.bold("❌ Une partie est deja en cours ! Tapez '421 stop' d'abord."));

    const senderID = event.senderID;
    const myName   = await getUserName(api, usersData, senderID);
    const betArg   = args.find(a => /^\d{3,}$/.test(a) && parseInt(a) > 0);
    let betAmount  = betArg ? parseInt(betArg) : 0;

    const botNames = ["Bot Ace","Bot Nova","Bot Rex","Bot Jinx","Bot Zara"];
    const players  = [{ id: senderID, name: myName, bot: false }];

    if (sub === "bot" || sub === "bots") {
      const count = Math.min(MAX_PLAYERS, parseInt(args.find(a => /^[2-6]$/.test(a)) || "2", 10));
      while (players.length < count) {
        const bi = players.length - 1;
        players.push({ id: `bot_${bi}_${Date.now()}`, name: botNames[bi] || `Bot${bi}`, bot: true });
      }
      betAmount = 0;
    } else {
      const mentionedIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
      for (let i = 0; i < Math.min(mentionedIDs.length, MAX_PLAYERS - 1); i++) {
        const id = mentionedIDs[i];
        players.push({ id, name: await getUserName(api, usersData, id), bot: false });
      }
      if (players.length < MIN_PLAYERS) return message.reply(this.config.guide.fr);
    }

    if (betAmount > 0) {
      for (const p of players.filter(x => !x.bot)) {
        const ud = await usersData.get(p.id);
        if ((ud?.money || 0) < betAmount) return message.reply(fonts.bold(`${p.name} n'a pas assez d'argent ! (necessaire : $${betAmount.toLocaleString()})`));
      }
      for (const p of players.filter(x => !x.bot)) {
        const ud = await usersData.get(p.id);
        await usersData.set(p.id, { money: (ud?.money||0) - betAmount });
      }
    }

    const game = createGame(event.threadID, players, betAmount, commandName);
    game.usersData = usersData;
    activeGames.set(game.key, game);

    const pList   = game.players.map(p => `${p.name}${p.bot?" [IA]":""}`).join("  ✦  ");
    const betInfo = betAmount > 0 ? `\nMise : $${betAmount.toLocaleString()}  ✦  Cagnotte : $${game.pot.toLocaleString()}` : "";
    const body    = buildStatusText(game, `✦ La partie commence ! ✦\n${pList}${betInfo}\n${game.players[0].name}, tapez "lancer" !`);

    await publish(message, game, body, true);
    await runBots(message, game, api, usersData);
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey || Reply.threadID);
    if (!game || game.id !== Reply.gameID) return;

    if (game.replyMessageID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.replyMessageID);
    if (game.phase === "ended") return;

    const current = currentPlayer(game);
    if (!current || current.bot) return;
    if (event.senderID !== current.id) {
      return publish(message, game, buildStatusText(game, `Ce n'est pas votre tour ! C'est a ${current.name}.`), false);
    }

    const input = (event.body || "").trim().toLowerCase();
    if (!input) return;

    if (input === "stop" || input === "quitter") { endGame(game); return message.reply(fonts.bold("Partie abandonnee.")); }

    // ── LANCER ──
    if (input === "lancer" || input === "roll" || input === "l") {
      if (game.rollCount > 0 && game.keptDice.length === 0) {
        // Déjà lancé, doit garder ou rester
        return publish(message, game, buildStatusText(game, `Vous avez deja lance ! Tapez "garder 1 2 3" pour garder des des, "relancer" ou "rester".`), false);
      }
      game.currentDice = game.rollCount === 0 ? rollFresh() : rerollSelected(game.currentDice, game.keptDice);
      game.keptDice    = [];
      game.rollCount++;
      game.moveCount++;
      current.totalRolls++;

      const combo = scoreCombination(game.currentDice);
      if (!current.best || combo.rank > scoreCombination([...(current.best.match(/\d/g)||[1,1,1]).map(Number)]).rank) {
        current.best = combo.name;
      }

      game.log.push(`${current.name} lance : ${game.currentDice.join("-")} → ${combo.name.toUpperCase()}`);
      const canReroll = game.rollCount < MAX_REROLLS;
      const hint = canReroll
        ? `Tapez "garder 1 2 3" puis "relancer", ou "rester" pour valider.`
        : `Relances epuisees. Tapez "rester" pour valider.`;
      await publish(message, game, buildStatusText(game, hint), true);
      return;
    }

    // ── GARDER ──
    if (input.startsWith("garder") || input.startsWith("keep") || input.startsWith("g ")) {
      if (game.rollCount === 0) return publish(message, game, buildStatusText(game, `Lancez d'abord les des ! Tapez "lancer".`), false);
      const nums = (input.match(/\d/g) || []).map(Number).filter(n => n >= 1 && n <= 3).map(n => n - 1);
      if (!nums.length) return publish(message, game, buildStatusText(game, `Precisez les indices : "garder 1 2" pour garder les des 1 et 2.`), false);
      game.keptDice = [...new Set(nums)];
      const kept = game.keptDice.map(i => `De ${i+1} (${game.currentDice[i]})`).join(", ");
      return publish(message, game, buildStatusText(game, `Garde : ${kept}. Tapez "relancer" ou "rester".`), false);
    }

    // ── RELANCER ──
    if (input === "relancer" || input === "reroll" || input === "r") {
      if (game.rollCount === 0) return publish(message, game, buildStatusText(game, `Lancez d'abord ! Tapez "lancer".`), false);
      if (game.rollCount >= MAX_REROLLS) return publish(message, game, buildStatusText(game, `Relances epuisees ! Tapez "rester" pour valider.`), false);

      game.currentDice = rerollSelected(game.currentDice, game.keptDice);
      game.keptDice    = [];
      game.rollCount++;
      current.totalRolls++;

      const combo = scoreCombination(game.currentDice);
      game.log.push(`${current.name} relance : ${game.currentDice.join("-")} → ${combo.name.toUpperCase()}`);
      const canMore = game.rollCount < MAX_REROLLS;
      const hint2   = canMore
        ? `Tapez "garder 1 2 3" puis "relancer", ou "rester".`
        : `Derniere relance ! Tapez "rester" pour valider.`;
      await publish(message, game, buildStatusText(game, hint2), true);
      return;
    }

    // ── RESTER ──
    if (input === "rester" || input === "valider" || input === "ok" || input === "stop rester") {
      if (game.rollCount === 0) return publish(message, game, buildStatusText(game, `Lancez d'abord ! Tapez "lancer".`), false);

      const finalCombo = scoreCombination(game.currentDice);
      if (!current.best || finalCombo.rank > scoreCombination([...(current.best.match(/\d/g)||[1,1,1]).map(Number)]).rank) {
        current.best = finalCombo.name;
      }
      game.mancheResults.push({ playerID: current.id, combo: finalCombo });
      game.log.push(`${current.name} valide : ${finalCombo.name.toUpperCase()} !`);
      game.rollCount = 0;
      game.keptDice  = [];

      // Tous les joueurs vivants ont joué ?
      const allPlayed = game.players.every(p => p.chips <= 0 || game.mancheResults.find(r => r.playerID === p.id));
      if (allPlayed) {
        await advanceManche(message, game, api, usersData);
        return;
      }

      advanceTurn(game);
      const next = currentPlayer(game);
      const body2 = buildStatusText(game, `${current.name} valide ${finalCombo.name.toUpperCase()}. A ${next.name}${next.bot?" [IA]":""} !`);
      await publish(message, game, body2, true);
      await runBots(message, game, api, usersData);
      return;
    }

    // Commande inconnue
    await publish(message, game, buildStatusText(game, `Commande inconnue. Tapez "lancer", "garder 1 2", "relancer" ou "rester".`), false);
  },
};
