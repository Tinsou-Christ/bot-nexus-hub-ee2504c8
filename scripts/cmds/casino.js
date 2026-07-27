"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  CASINO ROYALE v1.0  —  Systeme de casino complet
//  Auteur  : Christus
//  Canvas  : Roulette 800x800  |  Zéro emoji dans le rendu Canvas
//  Jeux    : Roulette, Dés Royaux, Jackpot, Tournoi, VIP
// ═══════════════════════════════════════════════════════════════════════════════

const { createCanvas } = require("canvas");
const Canvas = require("canvas");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, outline: t => t, fancy: t => t, monospace: t => t, sansSerif: t => t, fraktur: t => t }; }

try {
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "CasinoFont", weight: "bold" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "CasinoFont", weight: "normal" });
  Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-SemiBold.ttf"),{ family: "CasinoFont", weight: "600" });
} catch(e) { console.log("[Casino] Font:", e.message); }

const CF = {
  bold:    s => `bold ${s}px CasinoFont, Arial`,
  semi:    s => `600 ${s}px CasinoFont, Arial`,
  regular: s => `${s}px CasinoFont, Arial`,
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const GAME_EXPIRE_MS = 1000 * 60 * 30;
const activeGames    = new Map();

const COOLDOWNS = {
  ROULETTE:  0,
  DICE:      0,
  JACKPOT:   30 * 60 * 1000,
  DAILY:     24 * 60 * 60 * 1000,
  TOURNOI:   6  * 60 * 60 * 1000,
};

// Roulette européenne: 0-36
const ROULETTE_REDS  = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const ROULETTE_BLACK = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

const NIVEAUX_VIP = [
  { id: "BRONZE",   nom: "Bronze",    min: 0,          bonus: 0,    mult: 1.0,  color: "#CD7F32" },
  { id: "ARGENT",   nom: "Argent",    min: 50_000,     bonus: 0.05, mult: 1.1,  color: "#C0C0C0" },
  { id: "OR",       nom: "Or",        min: 250_000,    bonus: 0.10, mult: 1.25, color: "#FFD700" },
  { id: "PLATINE",  nom: "Platine",   min: 1_000_000,  bonus: 0.15, mult: 1.5,  color: "#E5E4E2" },
  { id: "DIAMANT",  nom: "Diamant",   min: 5_000_000,  bonus: 0.25, mult: 2.0,  color: "#00FFFF" },
  { id: "ROYALE",   nom: "Royale",    min: 25_000_000, bonus: 0.40, mult: 3.0,  color: "#FF00FF" },
];

const DES_COMBINAISONS = [
  { id: "SNAKE_EYES",  nom: "Snake Eyes",   condition: d => d[0]===1&&d[1]===1, mult: 10, desc: "Double 1" },
  { id: "BOXCAR",      nom: "Boxcar",        condition: d => d[0]===6&&d[1]===6, mult: 10, desc: "Double 6" },
  { id: "LUCKY_SEVEN", nom: "Lucky Seven",   condition: d => d[0]+d[1]===7,     mult: 4,  desc: "Total = 7" },
  { id: "ELEVENS",     nom: "Elevens",       condition: d => d[0]+d[1]===11,    mult: 3,  desc: "Total = 11" },
  { id: "DOUBLE",      nom: "Double",        condition: d => d[0]===d[1],       mult: 2,  desc: "Doublet" },
  { id: "HIGH",        nom: "Haut",          condition: d => d[0]+d[1]>=10,     mult: 1.5,desc: "Total >= 10" },
  { id: "LOW",         nom: "Bas",           condition: d => d[0]+d[1]<=4,      mult: 1.5,desc: "Total <= 4" },
];

const JACKPOT_SYMBOLS = ["A","K","Q","J","10","9"];
const JACKPOT_REELS   = 3;
let   GLOBAL_JACKPOT  = 100_000;

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const rand  = (mn,mx) => Math.floor(Math.random()*(mx-mn+1))+mn;
const pick  = arr => arr[Math.floor(Math.random()*arr.length)];
const fmt   = n => {
  if (!Number.isFinite(n)||n==null) return "$0";
  if (n>=1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n>=1e6)  return `$${(n/1e6).toFixed(2)}M`;
  if (n>=1e3)  return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
const L = (c="─",n=44) => c.repeat(n);
const timeLeft = (ts,cd) => {
  const diff = cd-(Date.now()-(ts||0));
  if (diff<=0) return null;
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000);
  return h>0?`${h}h ${m}m`:`${m}m`;
};

function getVIP(casino) {
  let v = NIVEAUX_VIP[0];
  for (const n of NIVEAUX_VIP) { if (casino.totalMise>=n.min) v=n; else break; }
  return v;
}

function initCasino() {
  return {
    totalMise:       0,
    totalGagne:      0,
    totalPerdu:      0,
    partiesJouees:   0,
    rouletteGagne:   0,
    diceGagne:       0,
    jackpotGagne:    0,
    bestWin:         0,
    streak:          0,
    bestStreak:      0,
    lastJackpot:     null,
    lastDaily:       null,
    lastTournoi:     null,
    vip:             "BRONZE",
    chips:           0,
    achievements:    [],
    historique:      [],
  };
}

// ─── Canvas: Roulette ─────────────────────────────────────────────────────────

function drawRoulette(numero, mise, gain, betType) {
  const W = 800, H = 800;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // Fond
  const bgGrad = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.6);
  bgGrad.addColorStop(0,"#0a0a14"); bgGrad.addColorStop(1,"#020208");
  ctx.fillStyle=bgGrad; ctx.fillRect(0,0,W,H);

  // Particules fond
  for (let i=0;i<60;i++){
    ctx.beginPath();
    ctx.arc(Math.random()*W,Math.random()*H,Math.random()*1.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,215,0,${Math.random()*0.25})`;
    ctx.fill();
  }

  const cx=W/2, cy=H/2, R=300, innerR=90;
  const numCount=37;
  const ORDER_EU=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

  // Ombre roue
  ctx.shadowColor="#000"; ctx.shadowBlur=60;
  ctx.beginPath(); ctx.arc(cx,cy,R+12,0,Math.PI*2);
  ctx.fillStyle="#1a0800"; ctx.fill();
  ctx.shadowBlur=0;

  // Sections
  const arc = (Math.PI*2)/numCount;
  const spinOffset = ORDER_EU.indexOf(numero)*arc + arc/2 + Math.PI*1.5;

  for (let i=0;i<numCount;i++){
    const n = ORDER_EU[i];
    const a1 = i*arc - arc/2 + spinOffset;
    const a2 = a1 + arc;
    const isRed   = ROULETTE_REDS.has(n);
    const isBlack = ROULETTE_BLACK.has(n);

    // Couleur section
    if (n===0)         ctx.fillStyle = "#006600";
    else if (isRed)    ctx.fillStyle = "#CC0000";
    else if (isBlack)  ctx.fillStyle = "#111111";
    else               ctx.fillStyle = "#006600";

    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,a1,a2);
    ctx.closePath();
    ctx.fill();

    // Bordure section
    ctx.strokeStyle="rgba(255,215,0,0.3)"; ctx.lineWidth=0.8;
    ctx.stroke();

    // Numero dans la section
    const midA = i*arc + spinOffset;
    const tx = cx + (R*0.72)*Math.cos(midA);
    const ty = cy + (R*0.72)*Math.sin(midA);
    ctx.save();
    ctx.translate(tx,ty);
    ctx.rotate(midA+Math.PI/2);
    ctx.font = CF.bold(numCount>30?11:13);
    ctx.fillStyle="#FFFFFF";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.shadowColor="rgba(0,0,0,0.8)"; ctx.shadowBlur=4;
    ctx.fillText(String(n),0,0);
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // Anneau doré extérieur
  ctx.beginPath(); ctx.arc(cx,cy,R+2,0,Math.PI*2);
  ctx.strokeStyle="#FFD700"; ctx.lineWidth=4; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,R+10,0,Math.PI*2);
  ctx.strokeStyle="rgba(255,215,0,0.4)"; ctx.lineWidth=1.5; ctx.stroke();

  // Centre hub
  const hubGrad = ctx.createRadialGradient(cx,cy,0,cx,cy,innerR);
  hubGrad.addColorStop(0,"#2a1a00"); hubGrad.addColorStop(0.6,"#1a0d00"); hubGrad.addColorStop(1,"#0d0600");
  ctx.beginPath(); ctx.arc(cx,cy,innerR,0,Math.PI*2);
  ctx.fillStyle=hubGrad; ctx.fill();
  ctx.strokeStyle="#FFD700"; ctx.lineWidth=3; ctx.stroke();

  // Logo centre
  ctx.font=CF.bold(18); ctx.fillStyle="#FFD700";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("CASINO",cx,cy-12);
  ctx.font=CF.bold(13); ctx.fillStyle="rgba(255,215,0,0.6)";
  ctx.fillText("ROYALE",cx,cy+8);

  // Bille sur le numero gagnant (top)
  const ballA = spinOffset + ORDER_EU.indexOf(numero)*arc;
  const bx = cx+(R*0.86)*Math.cos(ballA);
  const by = cy+(R*0.86)*Math.sin(ballA);
  const ballGrad = ctx.createRadialGradient(bx-3,by-3,0,bx,by,10);
  ballGrad.addColorStop(0,"#FFFFFF"); ballGrad.addColorStop(0.4,"#E0E0E0"); ballGrad.addColorStop(1,"#888888");
  ctx.beginPath(); ctx.arc(bx,by,10,0,Math.PI*2);
  ctx.fillStyle=ballGrad;
  ctx.shadowColor="#fff"; ctx.shadowBlur=15;
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle="rgba(0,0,0,0.5)"; ctx.lineWidth=1.5; ctx.stroke();

  // Panneau résultat bas
  const panY=H-165, panH=145;
  ctx.fillStyle="rgba(5,5,15,0.96)";
  ctx.beginPath();
  ctx.roundRect(50,panY,W-100,panH,16);
  ctx.fill();
  ctx.strokeStyle="#FFD700"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(50,panY,W-100,panH,16); ctx.stroke();

  // Ligne déco haut panneau
  ctx.fillStyle="#FFD700"; ctx.fillRect(60,panY+2,W-120,1.5);

  // Numéro résultat (grand)
  const numColor = numero===0?"#00CC00":ROULETTE_REDS.has(numero)?"#FF3333":"#CCCCCC";
  ctx.font=CF.bold(68); ctx.fillStyle=numColor;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.shadowColor=numColor; ctx.shadowBlur=25;
  ctx.fillText(String(numero),cx,panY+48);
  ctx.shadowBlur=0;

  // Couleur label
  const colorLabel = numero===0?"VERT":ROULETTE_REDS.has(numero)?"ROUGE":"NOIR";
  ctx.font=CF.semi(16); ctx.fillStyle="rgba(255,255,255,0.65)";
  ctx.fillText(colorLabel, cx, panY+88);

  // Mise / Gain
  ctx.textAlign="left";
  ctx.font=CF.regular(16); ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillText("MISE", 80,panY+112);
  ctx.font=CF.bold(17); ctx.fillStyle="#FFFFFF";
  ctx.fillText(fmt(mise), 80,panY+132);

  ctx.textAlign="right";
  ctx.font=CF.regular(16); ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillText("RESULTAT", W-80,panY+112);
  ctx.font=CF.bold(17); ctx.fillStyle=gain>0?"#00FF88":"#FF4444";
  ctx.fillText(gain>0?`+${fmt(gain)}`:`-${fmt(mise)}`, W-80,panY+132);

  // Type de pari
  ctx.textAlign="center";
  ctx.font=CF.semi(14); ctx.fillStyle="rgba(255,215,0,0.5)";
  ctx.fillText(betType.toUpperCase(), cx,panY+115);

  // Titre haut
  ctx.font=CF.bold(22); ctx.fillStyle="#FFD700";
  ctx.textAlign="center"; ctx.textBaseline="top";
  ctx.shadowColor="#FFD700"; ctx.shadowBlur=12;
  ctx.fillText("ROULETTE EUROPEENNE", cx, 18);
  ctx.shadowBlur=0;

  return canvas;
}

// ─── Canvas: Jackpot ──────────────────────────────────────────────────────────

function drawJackpot(reels, totalWin, mise) {
  const W=800, H=340;
  const canvas=createCanvas(W,H);
  const ctx=canvas.getContext("2d");

  // Fond
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#08000e"); bg.addColorStop(0.5,"#120022"); bg.addColorStop(1,"#08000e");
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Lignes néon
  ctx.strokeStyle="rgba(180,0,255,0.08)"; ctx.lineWidth=1;
  for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Glows coins
  [[0,0,"#8800ff"],[W,0,"#ff00cc"],[0,H,"#ff00cc"],[W,H,"#8800ff"]].forEach(([gx,gy,gc])=>{
    const g=ctx.createRadialGradient(gx,gy,0,gx,gy,250);
    g.addColorStop(0,gc+"33"); g.addColorStop(1,"transparent");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  });

  // Titre
  ctx.font=CF.bold(28); ctx.fillStyle="#FF00FF";
  ctx.textAlign="center"; ctx.textBaseline="top";
  ctx.shadowColor="#FF00FF"; ctx.shadowBlur=20;
  ctx.fillText("MACHINE A SOUS - JACKPOT", W/2, 18);
  ctx.shadowBlur=0;

  // Cadre rouleaux
  const cellW=180, cellH=130, gapX=30;
  const totalW=JACKPOT_REELS*cellW+(JACKPOT_REELS-1)*gapX;
  const startX=(W-totalW)/2;
  const cellY=68;

  reels.forEach((sym,i)=>{
    const cx=startX+i*(cellW+gapX);
    const isWin=totalWin>0;

    // Ombre cell
    ctx.shadowColor=isWin?"#FF00FF":"rgba(0,0,0,0.5)"; ctx.shadowBlur=isWin?20:8;

    // Fond cell
    const cg=ctx.createLinearGradient(cx,cellY,cx,cellY+cellH);
    cg.addColorStop(0,"#1a0030"); cg.addColorStop(1,"#0d0018");
    ctx.fillStyle=cg;
    ctx.beginPath(); ctx.roundRect(cx,cellY,cellW,cellH,12); ctx.fill();
    ctx.shadowBlur=0;

    // Bordure
    ctx.strokeStyle=isWin?"#FF00FF":"rgba(150,0,255,0.5)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(cx,cellY,cellW,cellH,12); ctx.stroke();

    // Symbole
    ctx.font=CF.bold(56); ctx.fillStyle="#FFFFFF";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.shadowColor=isWin?"#FF00FF":"rgba(255,255,255,0.3)"; ctx.shadowBlur=isWin?24:0;
    ctx.fillText(sym, cx+cellW/2, cellY+cellH/2);
    ctx.shadowBlur=0;
  });

  // Ligne de gain (milieu des rouleaux)
  ctx.strokeStyle="rgba(255,0,255,0.4)"; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(startX-10,cellY+cellH/2); ctx.lineTo(startX+totalW+10,cellY+cellH/2); ctx.stroke();
  ctx.setLineDash([]);

  // Résultat bas
  const resY=220;
  ctx.textAlign="center"; ctx.textBaseline="middle";

  if (totalWin>0) {
    ctx.font=CF.bold(36); ctx.fillStyle="#00FF88";
    ctx.shadowColor="#00FF88"; ctx.shadowBlur=20;
    ctx.fillText(`GAIN: +${fmt(totalWin)}`, W/2, resY);
    ctx.shadowBlur=0;
    ctx.font=CF.semi(18); ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.fillText("COMBINAISON GAGNANTE", W/2, resY+38);
  } else {
    ctx.font=CF.bold(32); ctx.fillStyle="#FF4444";
    ctx.fillText(`PERDU: -${fmt(mise)}`, W/2, resY);
    ctx.font=CF.semi(18); ctx.fillStyle="rgba(255,255,255,0.4)";
    ctx.fillText("Aucune combinaison", W/2, resY+38);
  }

  // Jackpot pool bas
  ctx.font=CF.bold(15); ctx.fillStyle="rgba(255,0,255,0.7)";
  ctx.fillText(`[ JACKPOT POOL: ${fmt(GLOBAL_JACKPOT)} ]`, W/2, H-18);

  return canvas;
}

// ─── Sauvegarde image temp ─────────────────────────────────────────────────────

function saveTmp(canvas) {
  const tmp = path.join(os.tmpdir(), `casino_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(tmp, canvas.toBuffer("image/png"));
  return tmp;
}

// ─── Logique Roulette ─────────────────────────────────────────────────────────

function parseRouletteBet(args) {
  // casino roulette <mise> <type> [valeur]
  // types: rouge, noir, vert, pair, impair, numero X, moitie (1-18 / 19-36), douzaine (1/2/3), colonne (1/2/3)
  const mise = parseInt(args[1]);
  if (!mise||mise<50) return null;
  const type = (args[2]||"").toLowerCase();
  const val  = args[3];
  return { mise, type, val };
}

function evalRoulette(numero, bet) {
  const { mise, type, val } = bet;
  let mult = 0;
  let label = type;

  switch (type) {
    case "rouge":
      if (ROULETTE_REDS.has(numero)) mult=2;
      label="Rouge"; break;
    case "noir":
      if (ROULETTE_BLACK.has(numero)) mult=2;
      label="Noir"; break;
    case "vert":
      if (numero===0) mult=35;
      label="Vert (0)"; break;
    case "pair":
      if (numero!==0&&numero%2===0) mult=2;
      label="Pair"; break;
    case "impair":
      if (numero!==0&&numero%2!==0) mult=2;
      label="Impair"; break;
    case "moitie": {
      const h=parseInt(val)||1;
      if (h===1&&numero>=1&&numero<=18) mult=2;
      if (h===2&&numero>=19&&numero<=36) mult=2;
      label=`${h===1?"1-18":"19-36"}`; break;
    }
    case "douzaine": {
      const d=parseInt(val)||1;
      if (d===1&&numero>=1&&numero<=12)  mult=3;
      if (d===2&&numero>=13&&numero<=24) mult=3;
      if (d===3&&numero>=25&&numero<=36) mult=3;
      label=`Douzaine ${d}`; break;
    }
    case "colonne": {
      const c=parseInt(val)||1;
      const cols=[[1,4,7,10,13,16,19,22,25,28,31,34],[2,5,8,11,14,17,20,23,26,29,32,35],[3,6,9,12,15,18,21,24,27,30,33,36]];
      if (cols[c-1]&&cols[c-1].includes(numero)) mult=3;
      label=`Colonne ${c}`; break;
    }
    case "numero": {
      const n=parseInt(val);
      if (!isNaN(n)&&n>=0&&n<=36&&numero===n) mult=36;
      label=`Numero ${val}`; break;
    }
    default: return null;
  }

  const gain = mult>0 ? Math.floor(mise*mult)-mise : 0;
  return { gain, mult, label, win: mult>0 };
}

// ─── Logique Dés ──────────────────────────────────────────────────────────────

function rollDice() { return [rand(1,6),rand(1,6)]; }

function evalDice(dice, betType) {
  for (const combo of DES_COMBINAISONS) {
    if (combo.id===betType && combo.condition(dice)) {
      return { combo, win: true };
    }
  }
  const combo = DES_COMBINAISONS.find(c=>c.id===betType);
  return { combo, win: false };
}

// ─── Logique Jackpot ──────────────────────────────────────────────────────────

function spinJackpot() {
  const reels=[];
  for (let i=0;i<JACKPOT_REELS;i++) reels.push(pick(JACKPOT_SYMBOLS));
  return reels;
}

function evalJackpot(reels, mise) {
  const [a,b,c]=reels;
  let gain=0;
  if (a===b&&b===c) {
    if (a==="A") { gain=GLOBAL_JACKPOT; GLOBAL_JACKPOT=100_000; }
    else gain=mise*8;
  } else if (a===b||b===c||a===c) {
    gain=Math.floor(mise*1.5);
  }
  return gain;
}

// ─── Render textes ────────────────────────────────────────────────────────────

function renderHelp() {
  return [
    fonts.fraktur("CASINO ROYALE — Menu Principal"),
    L(),
    fonts.bold("Roulette"),
    "  casino roulette <mise> rouge/noir/vert",
    "  casino roulette <mise> pair/impair",
    "  casino roulette <mise> numero <0-36>",
    "  casino roulette <mise> moitie <1|2>",
    "  casino roulette <mise> douzaine <1|2|3>",
    "  casino roulette <mise> colonne <1|2|3>",
    "",
    fonts.bold("Des Royaux"),
    "  casino des <mise> <combinaison>",
    "  Combos: SNAKE_EYES BOXCAR LUCKY_SEVEN",
    "          ELEVENS DOUBLE HIGH LOW",
    "",
    fonts.bold("Machine a sous"),
    "  casino jackpot <mise>",
    "",
    fonts.bold("Autres"),
    "  casino daily      — Bonus quotidien",
    "  casino stat       — Vos statistiques",
    "  casino vip        — Statut VIP",
    "  casino classement — Top joueurs",
    L(),
    fonts.sansSerif("Mise minimum : $50"),
  ].join("\n");
}

function renderDashboard(casino, walletBalance) {
  const vip = getVIP(casino);
  const ratio = casino.partiesJouees>0
    ? `${Math.round((casino.rouletteGagne+casino.diceGagne+casino.jackpotGagne)/casino.partiesJouees*100)}%`
    : "N/A";

  return [
    fonts.fraktur("CASINO ROYALE — Votre Profil"),
    L(),
    `${fonts.bold("Portefeuille")} : ${fmt(walletBalance)}`,
    `${fonts.bold("Statut VIP")}   : ${fonts.fancy(vip.nom)}`,
    `${fonts.bold("Mult. VIP")}    : x${vip.mult}`,
    L("─",22),
    fonts.sansSerif("STATISTIQUES"),
    `  Total mise   : ${fmt(casino.totalMise)}`,
    `  Total gagne  : ${fmt(casino.totalGagne)}`,
    `  Total perdu  : ${fmt(casino.totalPerdu)}`,
    `  Parties      : ${casino.partiesJouees}`,
    `  Meilleur win : ${fmt(casino.bestWin)}`,
    `  Win rate     : ${ratio}`,
    L("─",22),
    fonts.sansSerif("PAR JEU"),
    `  Roulette     : ${casino.rouletteGagne} victoires`,
    `  Des Royaux   : ${casino.diceGagne} victoires`,
    `  Jackpot      : ${casino.jackpotGagne} victoires`,
    L("─",22),
    `Streak actuel  : ${casino.streak}`,
    `Meilleur streak: ${casino.bestStreak}`,
    L(),
    fonts.monospace(`Jackpot pool : ${fmt(GLOBAL_JACKPOT)}`),
  ].join("\n");
}

function renderDiceBoard() {
  return [
    fonts.bold("DES ROYAUX — Combinaisons disponibles"),
    L(),
    ...DES_COMBINAISONS.map(c=>`  ${fonts.sansSerif(c.id.padEnd(12))} — x${c.mult}  (${c.desc})`),
    L(),
    fonts.monospace("Usage: casino des <mise> <COMBO>"),
  ].join("\n");
}

function addHisto(casino, type, mise, gain) {
  casino.historique.unshift({ type, mise, gain, ts: Date.now() });
  if (casino.historique.length>10) casino.historique.pop();
}

// ─── Commandes ────────────────────────────────────────────────────────────────

async function cmdRoulette(message, args, casino, user, save, walletBalance) {
  const bet = parseRouletteBet(args);
  if (!bet) {
    return message.reply([
      fonts.bold("Roulette — Usage incorrect"),
      "casino roulette <mise> <type> [valeur]",
      "Types: rouge noir vert pair impair moitie douzaine colonne numero",
      "Exemple: casino roulette 500 rouge",
      "         casino roulette 200 numero 17",
    ].join("\n"));
  }
  if (bet.mise>walletBalance)
    return message.reply(fonts.bold(`Fonds insuffisants. Portefeuille: ${fmt(walletBalance)}`));

  const numero = rand(0,36);
  const result = evalRoulette(numero, bet);
  if (!result) return message.reply(fonts.bold("Type de pari invalide. Voir casino help."));

  const vip = getVIP(casino);
  const gainNet = result.win ? Math.floor(result.gain * vip.mult) : -bet.mise;

  user.money = (user.money||0) + gainNet;
  casino.totalMise  += bet.mise;
  casino.partiesJouees++;
  if (result.win) { casino.totalGagne+=gainNet; casino.rouletteGagne++; casino.streak++; if (casino.streak>casino.bestStreak) casino.bestStreak=casino.streak; if (gainNet>casino.bestWin) casino.bestWin=gainNet; }
  else            { casino.totalPerdu+=bet.mise; casino.streak=0; }
  GLOBAL_JACKPOT += Math.floor(bet.mise*0.01);
  addHisto(casino, "ROULETTE", bet.mise, gainNet);
  await save();

  const canvas  = drawRoulette(numero, bet.mise, result.win?gainNet:0, result.label);
  const tmpPath = saveTmp(canvas);

  const body = result.win
    ? [fonts.bold(`Roulette: ${numero} — ${result.label}`), `Gain: +${fmt(gainNet)} (x${result.mult} * ${vip.mult} VIP)`, `Streak: ${casino.streak}`].join("\n")
    : [fonts.bold(`Roulette: ${numero} — ${result.label}`), `Perdu: -${fmt(bet.mise)}`, "Streak reinitialise."].join("\n");

  message.reply({ body, attachment: fs.createReadStream(tmpPath) }, () => {
    fs.unlink(tmpPath, ()=>{});
  });
}

async function cmdDice(message, args, casino, user, save, walletBalance) {
  const mise = parseInt(args[1]);
  const betId = (args[2]||"").toUpperCase();

  if (!mise||mise<50)
    return message.reply(renderDiceBoard());

  const combo = DES_COMBINAISONS.find(c=>c.id===betId);
  if (!combo)
    return message.reply(renderDiceBoard());

  if (mise>walletBalance)
    return message.reply(fonts.bold(`Fonds insuffisants. Portefeuille: ${fmt(walletBalance)}`));

  const dice  = rollDice();
  const vip   = getVIP(casino);
  const res   = evalDice(dice, betId);
  const gain  = res.win ? Math.floor((mise*combo.mult - mise)*vip.mult) : -mise;

  user.money = (user.money||0) + gain;
  casino.totalMise+=mise; casino.partiesJouees++;
  if (res.win) { casino.totalGagne+=gain; casino.diceGagne++; casino.streak++; if(casino.streak>casino.bestStreak)casino.bestStreak=casino.streak; if(gain>casino.bestWin)casino.bestWin=gain; }
  else         { casino.totalPerdu+=mise; casino.streak=0; }
  GLOBAL_JACKPOT += Math.floor(mise*0.01);
  addHisto(casino, "DES", mise, gain);
  await save();

  const diceIcons = dice.map(d=>fonts.outline(String(d))).join(" — ");
  return message.reply([
    fonts.fraktur("DES ROYAUX"),
    L(),
    `Des: ${diceIcons}  (total: ${dice[0]+dice[1]})`,
    `Pari: ${combo.nom} (${combo.desc})`,
    L("─",22),
    res.win
      ? fonts.bold(`Gagne! +${fmt(gain)}  (x${combo.mult} * ${vip.mult} VIP)`)
      : fonts.bold(`Perdu. -${fmt(mise)}`),
    `Streak: ${casino.streak} | VIP: ${vip.nom}`,
  ].join("\n"));
}

async function cmdJackpot(message, args, casino, user, save, walletBalance) {
  const mise = parseInt(args[1]);
  if (!mise||mise<100)
    return message.reply([
      fonts.bold("Machine a sous — Jackpot"),
      `Pool actuel: ${fmt(GLOBAL_JACKPOT)}`,
      "Usage: casino jackpot <mise> (min $100)",
      "3 x A = JACKPOT TOTAL",
      "3 identiques = x8 mise",
      "2 identiques = x1.5 mise",
    ].join("\n"));

  const cd = timeLeft(casino.lastJackpot, COOLDOWNS.JACKPOT);
  if (cd) return message.reply(fonts.bold(`Machine en cooldown. Prochaine partie dans: ${cd}`));

  if (mise>walletBalance)
    return message.reply(fonts.bold(`Fonds insuffisants. Portefeuille: ${fmt(walletBalance)}`));

  const reels    = spinJackpot();
  const vip      = getVIP(casino);
  const gainBrut = evalJackpot(reels, mise);
  const gainNet  = gainBrut>0 ? Math.floor(gainBrut*vip.mult) - mise : -mise;

  user.money = (user.money||0) + gainNet;
  casino.totalMise+=mise; casino.partiesJouees++;
  casino.lastJackpot = Date.now();
  if (gainBrut>0) { casino.totalGagne+=gainNet; casino.jackpotGagne++; casino.streak++; if(casino.streak>casino.bestStreak)casino.bestStreak=casino.streak; if(gainNet>casino.bestWin)casino.bestWin=gainNet; }
  else            { casino.totalPerdu+=mise; casino.streak=0; }
  GLOBAL_JACKPOT += Math.floor(mise*0.02);
  addHisto(casino, "JACKPOT", mise, gainNet);
  await save();

  const canvas  = drawJackpot(reels, gainBrut>0?gainNet:0, mise);
  const tmpPath = saveTmp(canvas);

  const body = gainBrut>0
    ? `${fonts.bold("Jackpot!")} +${fmt(gainNet)} (x${vip.mult} VIP)\nStreak: ${casino.streak}`
    : `${fonts.bold("Perdu.")} -${fmt(mise)} | Prochain: 30 min`;

  message.reply({ body, attachment: fs.createReadStream(tmpPath) }, () => {
    fs.unlink(tmpPath, ()=>{});
  });
}

async function cmdDaily(message, casino, user, save) {
  const cd = timeLeft(casino.lastDaily, COOLDOWNS.DAILY);
  if (cd) return message.reply(fonts.bold(`Daily deja recupere. Reviens dans: ${cd}`));

  const vip  = getVIP(casino);
  const base = 500;
  const bonus= Math.floor(base * vip.mult);
  user.money = (user.money||0) + bonus;
  casino.lastDaily = Date.now();
  await save();

  return message.reply([
    fonts.fancy("Daily Casino Bonus"),
    L(),
    `Statut VIP : ${vip.nom} (x${vip.mult})`,
    `Bonus recus: ${fmt(bonus)}`,
    fonts.monospace("Reviens dans 24h!"),
  ].join("\n"));
}

async function cmdVIP(message, casino, walletBalance) {
  const vip     = getVIP(casino);
  const vipIdx  = NIVEAUX_VIP.indexOf(vip);
  const nextVip = NIVEAUX_VIP[vipIdx+1];
  const prog    = nextVip
    ? Math.min(100, ((casino.totalMise-vip.min)/(nextVip.min-vip.min)*100)).toFixed(1)
    : "MAX";

  return message.reply([
    fonts.fraktur("STATUT VIP"),
    L(),
    `Niveau actuel : ${fonts.bold(vip.nom)}`,
    `Multiplicateur: x${vip.mult}`,
    `Bonus daily   : +${vip.bonus*100}%`,
    L("─",22),
    nextVip
      ? [`Prochain: ${nextVip.nom}`, `Total mis requis: ${fmt(nextVip.min)}`, `Total mise actuel: ${fmt(casino.totalMise)}`, `Progression: ${prog}%`].join("\n")
      : fonts.bold("Rang maximum atteint!"),
    L(),
    ...NIVEAUX_VIP.map(v=>`  ${v.id===vip.id?">>>":   "   "} ${v.nom.padEnd(8)} — x${v.mult}  (req: ${fmt(v.min)})`),
  ].join("\n"));
}

async function cmdLeaderboard(message, usersData) {
  let all;
  try { all = await usersData.getAll(); } catch(e){ all=[]; }
  const scores = [];
  for (const [uid, u] of Object.entries(all||{})) {
    if (u?.data?.casino) {
      scores.push({ nom: u.name||`User#${uid.slice(-4)}`, total: u.data.casino.totalGagne||0 });
    }
  }
  scores.sort((a,b)=>b.total-a.total);
  const top = scores.slice(0,10);
  if (!top.length) return message.reply(fonts.bold("Aucun joueur pour le moment."));

  return message.reply([
    fonts.fraktur("CLASSEMENT — Top Joueurs"),
    L(),
    ...top.map((p,i)=>`  ${String(i+1).padStart(2,"0")}. ${p.nom.slice(0,18).padEnd(18)} — ${fmt(p.total)}`),
    L(),
    fonts.monospace(`Jackpot pool: ${fmt(GLOBAL_JACKPOT)}`),
  ].join("\n"));
}

function cmdHistorique(message, casino) {
  if (!casino.historique.length) return message.reply(fonts.bold("Aucune partie jouee."));
  return message.reply([
    fonts.bold("10 DERNIERES PARTIES"),
    L(),
    ...casino.historique.map(h=>{
      const ago = Math.floor((Date.now()-h.ts)/60000);
      const g   = h.gain>0?`+${fmt(h.gain)}`:`-${fmt(h.mise)}`;
      return `  ${h.type.padEnd(8)} ${g.padStart(10)}  (il y a ${ago}m)`;
    }),
  ].join("\n"));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  config: {
    name: "casino",
    aliases: ["cas", "royale"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: {
      fr: "Casino Royale — Roulette, Des, Jackpot, VIP. Tentez votre chance et montez les rangs!"
    },
    category: "economy",
    guide: {
      fr: "Tapez 'casino help' pour voir tous les jeux disponibles."
    }
  },

  onStart: async function ({ message, event, args, api, usersData }) {
    const { senderID } = event;
    const sub = (args[0]||"help").toLowerCase();

    let user = await usersData.get(senderID);
    if (!user) user = { money: 0, exp: 0, data: {} };
    if (!user.data) user.data = {};
    if (!user.data.casino) user.data.casino = initCasino();

    const casino        = user.data.casino;
    const walletBalance = user.money || 0;

    const save = async () => {
      casino.vip = getVIP(casino).id;
      user.data.casino = casino;
      await usersData.set(senderID, user);
    };

    switch (sub) {
      case "help":
      case "aide":
        return message.reply(renderHelp());

      case "stat":
      case "stats":
      case "profil":
      case "dashboard":
        return message.reply(renderDashboard(casino, walletBalance));

      case "roulette":
        return cmdRoulette(message, args, casino, user, save, walletBalance);

      case "des":
      case "dice":
        return cmdDice(message, args, casino, user, save, walletBalance);

      case "jackpot":
      case "slot":
        return cmdJackpot(message, args, casino, user, save, walletBalance);

      case "daily":
        return cmdDaily(message, casino, user, save);

      case "vip":
        return cmdVIP(message, casino, walletBalance);

      case "classement":
      case "top":
      case "leaderboard":
        return cmdLeaderboard(message, usersData);

      case "historique":
      case "histo":
        return cmdHistorique(message, casino);

      default:
        return message.reply(fonts.bold(`Commande inconnue. Tapez 'casino help' pour voir la liste.`));
    }
  }
};
