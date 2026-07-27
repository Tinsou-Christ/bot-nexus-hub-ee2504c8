"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  BLACKJACK ROYAL — Jeu de Blackjack complet pour GoatBot
//  Auteur  : Christus
//  Joueurs : 1 à 5 humains + Croupier IA
//  Visuels : Canvas (table de jeu) + Texte stylisé
//  Systèmes: Mises, Assurance, Double, Split, Surrender, Statistiques
// ═══════════════════════════════════════════════════════════════════════════════

const { createCanvas } = require("canvas");
const Canvas           = require("canvas");
const path             = require("path");
const fs               = require("fs");
const os               = require("os");

try { Canvas.registerFont(path.join(__dirname,"assets/font/NotoSans-Bold.ttf"),    { family:"BF", weight:"bold"   }); } catch(_){}
try { Canvas.registerFont(path.join(__dirname,"assets/font/NotoSans-Regular.ttf"), { family:"BF", weight:"normal" }); } catch(_){}
try { Canvas.registerFont(path.join(__dirname,"assets/font/Emoji.ttf"),            { family:"Emoji" });               } catch(_){}

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold:t=>t, sansSerif:t=>t, monospace:t=>t }; }

const sleep = ms => new Promise(r => setTimeout(r,ms));

// ─── Constantes ───────────────────────────────────────────────────────────────
const GAME_EXPIRE     = 1000*60*60;
const BOT_DELAY       = 1400;
const MAX_PLAYERS     = 5;
const BLACKJACK_MULT  = 1.5;   // BJ paie 3:2
const MIN_BET         = 100;
const MAX_BET         = 1_000_000;
const DECKS           = 6;     // 6 jeux de cartes mélangés

const activeGames = new Map();
const playerStats = new Map(); // uid → { wins,losses,draws,blackjacks,busts,totalWon,totalLost }

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const SUIT_COLOR  = { "♠":"#e2e8f0", "♣":"#e2e8f0", "♥":"#ef4444", "♦":"#ef4444" };
const SUIT_DARK   = { "♠":"#64748b", "♣":"#64748b", "♥":"#991b1b", "♦":"#991b1b" };

// ─── Deck ─────────────────────────────────────────────────────────────────────
const SUITS  = ["♠","♥","♦","♣"];
const RANKS  = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildShoe() {
  const shoe = [];
  for (let d = 0; d < DECKS; d++)
    for (const s of SUITS)
      for (const r of RANKS)
        shoe.push({ suit:s, rank:r });
  return shuffleShoe(shoe);
}

function shuffleShoe(shoe) {
  for (let i = shoe.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [shoe[i],shoe[j]] = [shoe[j],shoe[i]];
  }
  return shoe;
}

function cardValue(rank) {
  if (["J","Q","K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

function handValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBust(hand)      { return handValue(hand) > 21; }
function isBlackjack(hand) { return hand.length === 2 && handValue(hand) === 21; }
function isSoft(hand)      { let t=0,a=0; for(const c of hand){t+=cardValue(c.rank);if(c.rank==="A")a++;} return a>0 && t<=21 && t-10>=1; }

function cardLabel(card, hidden=false) {
  if (hidden) return "🂠";
  return `${card.rank}${card.suit}`;
}

// ─── Statistiques ─────────────────────────────────────────────────────────────
function getStat(uid) {
  if (!playerStats.has(uid)) playerStats.set(uid,{wins:0,losses:0,draws:0,blackjacks:0,busts:0,totalWon:0,totalLost:0,games:0});
  return playerStats.get(uid);
}

// ─── Création de partie ───────────────────────────────────────────────────────
function createGame(threadID, players, commandName) {
  return {
    id:          `${threadID}_${Date.now()}`,
    key:         threadID,
    threadID,
    commandName,
    shoe:        buildShoe(),
    shoeIndex:   0,
    dealer: {
      id:     "dealer",
      name:   "Croupier",
      hand:   [],
      hidden: true,   // cache la 2ème carte jusqu'à la fin
    },
    players: players.map((p,i) => ({
      ...p,
      hand:        [],
      splitHand:   null,    // main après split
      bet:         0,
      sideBet:     0,       // assurance
      doubleDown:  false,
      surrendered: false,
      playing:     "main",  // "main" | "split"
      result:      null,    // "win"|"lose"|"push"|"blackjack"|"bust"|"surrender"
      splitResult: null,
      done:        false,
    })),
    phase:       "bet",    // bet | deal | player | dealer | result | ended
    turnIndex:   0,
    log:         [],
    moveCount:   0,
    startedAt:   Date.now(),
    updatedAt:   Date.now(),
    replyMessageID: null,
    roundNumber: 1,
  };
}

function dealCard(game, hidden=false) {
  if (game.shoeIndex >= game.shoe.length - 20) {
    game.shoe      = buildShoe();
    game.shoeIndex = 0;
    game.log.push("✦ Sabot mélangé !");
  }
  const card = game.shoe[game.shoeIndex++];
  return hidden ? { ...card, hidden:true } : card;
}

function currentPlayer(game) { return game.players[game.turnIndex]; }

function advanceTurn(game) {
  // Passe au joueur suivant qui n'a pas terminé
  let next = game.turnIndex + 1;
  while (next < game.players.length && game.players[next].done) next++;
  if (next >= game.players.length) {
    game.phase = "dealer";
  } else {
    game.turnIndex = next;
  }
}

// ─── Calcul des gains ─────────────────────────────────────────────────────────
function resolveResults(game) {
  const dealer    = game.dealer;
  const dVal      = handValue(dealer.hand);
  const dBust     = isBust(dealer.hand);
  const dBJ       = isBlackjack(dealer.hand);

  const summary = [];

  for (const p of game.players) {
    const hands = [{ hand: p.hand, bet: p.bet, result: null, key: "result" }];
    if (p.splitHand) hands.push({ hand: p.splitHand, bet: p.bet, result: null, key: "splitResult" });

    for (const h of hands) {
      const pVal = handValue(h.hand);
      const pBJ  = isBlackjack(h.hand) && hands.length === 1; // BJ uniquement si pas split
      const pBust = isBust(h.hand);

      let outcome, payout = 0;

      if (p.surrendered && h.key === "result") {
        outcome = "surrender"; payout = -Math.floor(h.bet / 2);
      } else if (pBust) {
        outcome = "bust"; payout = -h.bet;
      } else if (dBJ && pBJ) {
        outcome = "push"; payout = 0;
      } else if (pBJ) {
        outcome = "blackjack"; payout = Math.floor(h.bet * BLACKJACK_MULT);
      } else if (dBJ) {
        outcome = "lose"; payout = -h.bet;
      } else if (dBust) {
        outcome = "win"; payout = h.bet;
      } else if (pVal > dVal) {
        outcome = "win"; payout = h.bet;
      } else if (pVal === dVal) {
        outcome = "push"; payout = 0;
      } else {
        outcome = "lose"; payout = -h.bet;
      }

      p[h.key] = outcome;
      p.payout = (p.payout || 0) + payout;

      // Assurance
      if (h.key === "result" && p.sideBet > 0) {
        if (dBJ) p.payout += p.sideBet * 2;  // assurance gagne 2:1
        else     p.payout -= p.sideBet;        // assurance perdue
      }

      const stat = getStat(p.id);
      stat.games++;
      if (outcome === "win" || outcome === "blackjack") { stat.wins++; if(pBJ) stat.blackjacks++; stat.totalWon += Math.abs(payout); }
      else if (outcome === "lose" || outcome === "bust") { stat.losses++; if(pBust) stat.busts++; stat.totalLost += Math.abs(payout); }
      else stat.draws++;

      const sign  = payout > 0 ? "+" : "";
      const icon  = { win:"✦ GAGNE", lose:"✗ PERDU", push:"= EGALITE", blackjack:"★ BLACKJACK!", bust:"✗ BUST", surrender:"~ ABANDON" }[outcome] || outcome;
      summary.push(`${p.name} : ${icon}  (${sign}$${Math.abs(payout).toLocaleString()})`);
    }
  }

  return summary;
}

async function payoutAll(game, usersData) {
  if (!usersData) return;
  for (const p of game.players.filter(x => !x.bot)) {
    if (!p.payout) continue;
    try {
      const ud = await usersData.get(p.id);
      await usersData.set(p.id, { money: (ud?.money||0) + p.payout });
    } catch(e) { console.error("[BJ] Payout:", e.message); }
  }
}

// ─── IA Croupier (règles standard : tire jusqu'à 17) ─────────────────────────
function dealerPlay(game) {
  // Révéler la carte cachée
  game.dealer.hidden = false;
  game.dealer.hand   = game.dealer.hand.map(c => ({ ...c, hidden:false }));

  while (handValue(game.dealer.hand) < 17 ||
         (isSoft(game.dealer.hand) && handValue(game.dealer.hand) === 17)) {
    game.dealer.hand.push(dealCard(game));
  }
}

// ─── IA Joueur Bot (Basic Strategy simplifiée) ────────────────────────────────
function botAction(hand, dealerUpCard, canDouble, canSplit, canSurrender) {
  const pVal   = handValue(hand);
  const dVal   = cardValue(dealerUpCard.rank);
  const isPair = hand.length === 2 && hand[0].rank === hand[1].rank;
  const soft   = isSoft(hand);

  // Split
  if (canSplit && isPair) {
    const r = hand[0].rank;
    if (r === "A" || r === "8") return "split";
    if (r === "9" && ![7,10,11].includes(dVal)) return "split";
    if (r === "7" && dVal <= 7) return "split";
    if (r === "6" && dVal <= 6) return "split";
    if (r === "2" || r === "3") { if (dVal <= 7) return "split"; }
  }

  // Double
  if (canDouble) {
    if (!soft) {
      if (pVal === 11) return "double";
      if (pVal === 10 && dVal <= 9) return "double";
      if (pVal === 9  && dVal >= 3 && dVal <= 6) return "double";
    } else {
      if ((pVal === 17 || pVal === 18) && dVal >= 3 && dVal <= 6) return "double";
    }
  }

  // Surrender
  if (canSurrender) {
    if (pVal === 16 && dVal >= 9) return "surrender";
    if (pVal === 15 && dVal === 10) return "surrender";
  }

  // Soft hand
  if (soft) {
    if (pVal >= 19) return "stand";
    if (pVal === 18) { if (dVal >= 2 && dVal <= 8) return "stand"; return "hit"; }
    return "hit";
  }

  // Hard hand
  if (pVal >= 17)            return "stand";
  if (pVal >= 13 && dVal <= 6) return "stand";
  if (pVal === 12 && dVal >= 4 && dVal <= 6) return "stand";
  return "hit";
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
function fillMixed(ctx, text, x, y) {
  const savedFont = ctx.font;
  const szM = savedFont.match(/(\d+(?:\.\d+)?)px/);
  const sz  = szM ? parseFloat(szM[1]) : 16;
  const re  = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}(?:\uFE0F)?)/gu;
  const segs=[]; let last=0, m;
  while ((m=re.exec(text))!==null) {
    if (m.index>last) segs.push({e:false,s:text.slice(last,m.index)});
    segs.push({e:true,s:m[0]});
    last=m.index+m[0].length;
  }
  if (last<text.length) segs.push({e:false,s:text.slice(last)});
  const saved=ctx.textAlign; let cur=x;
  if (saved==="center") {
    let tw=0;
    for (const sg of segs) { ctx.font=sg.e?`${sz}px Emoji`:savedFont; tw+=ctx.measureText(sg.s).width; }
    cur=x-tw/2; ctx.textAlign="left";
  }
  for (const sg of segs) {
    ctx.font=sg.e?`${sz}px Emoji`:savedFont;
    ctx.fillText(sg.s,cur,y); cur+=ctx.measureText(sg.s).width;
  }
  ctx.font=savedFont; ctx.textAlign=saved;
}

function rrect(ctx,x,y,w,h,r,fill,stroke,lw) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if (fill)  { ctx.fillStyle=fill;   ctx.fill();  }
  if (stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1; ctx.stroke(); }
}

function drawCard(ctx, card, x, y, cW, cH, faceDown=false) {
  ctx.save();
  // Ombre
  ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=10; ctx.shadowOffsetX=3; ctx.shadowOffsetY=3;
  rrect(ctx,x,y,cW,cH,8,"#f8fafc",faceDown?"#1e40af":"#f8fafc",0);
  ctx.restore();

  if (faceDown) {
    // Dos de carte (motif)
    rrect(ctx,x,y,cW,cH,8,"#1e3a8a","#1e40af",2);
    // Motif diamant
    ctx.strokeStyle="#3b82f688"; ctx.lineWidth=1;
    for (let gi=4; gi<cW-4; gi+=8) { ctx.beginPath(); ctx.moveTo(x+gi,y+2); ctx.lineTo(x+gi,y+cH-2); ctx.stroke(); }
    for (let gj=4; gj<cH-4; gj+=8) { ctx.beginPath(); ctx.moveTo(x+2,y+gj); ctx.lineTo(x+cW-2,y+gj); ctx.stroke(); }
    // Logo central
    ctx.font=`bold ${cW*0.42}px BF`; ctx.fillStyle="#60a5fa"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("BJ",x+cW/2,y+cH/2);
    ctx.textBaseline="alphabetic";
    return;
  }

  // Face visible
  rrect(ctx,x,y,cW,cH,8,"#ffffff","#e2e8f0",1.5);

  const color = SUIT_COLOR[card.suit] === "#ef4444" ? "#dc2626" : "#1e293b";

  // Rang coin haut-gauche
  ctx.font=`bold ${cW*0.22}px BF`; ctx.fillStyle=color; ctx.textAlign="left"; ctx.textBaseline="top";
  ctx.fillText(card.rank, x+5, y+4);
  ctx.font=`${cW*0.18}px BF`;
  ctx.fillText(card.suit, x+5, y+4+cW*0.24);

  // Rang coin bas-droit (inversé)
  ctx.save(); ctx.translate(x+cW-5, y+cH-4);
  ctx.rotate(Math.PI);
  ctx.font=`bold ${cW*0.22}px BF`; ctx.fillStyle=color; ctx.textAlign="left"; ctx.textBaseline="top";
  ctx.fillText(card.rank, 0, 0);
  ctx.font=`${cW*0.18}px BF`;
  ctx.fillText(card.suit, 0, cW*0.24);
  ctx.restore();

  // Symbole central grand
  ctx.font=`${cW*0.38}px BF`; ctx.fillStyle=color; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(card.suit, x+cW/2, y+cH/2);
  ctx.textBaseline="alphabetic";
}

function renderTable(game) {
  const W=1200, H=900;
  const canvas=createCanvas(W,H);
  const ctx=canvas.getContext("2d");

  // ── Fond feutré vert ──
  const felt=ctx.createRadialGradient(W/2,H/2,100,W/2,H/2,800);
  felt.addColorStop(0,"#166534"); felt.addColorStop(0.6,"#14532d"); felt.addColorStop(1,"#052e16");
  ctx.fillStyle=felt; ctx.fillRect(0,0,W,H);

  // Motif feutré
  ctx.strokeStyle="rgba(255,255,255,0.03)"; ctx.lineWidth=1;
  for (let gx=0; gx<W; gx+=30) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy=0; gy<H; gy+=30) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

  // ── Bord doré ──
  ctx.save();
  ctx.shadowColor="#d97706"; ctx.shadowBlur=20;
  rrect(ctx,15,15,W-30,H-30,24,null,"#d97706",4);
  rrect(ctx,25,25,W-50,H-50,20,null,"#fbbf24",1.5);
  ctx.restore();

  // ── Titre ──
  ctx.save();
  const titleG=ctx.createLinearGradient(W/2-200,0,W/2+200,0);
  titleG.addColorStop(0,"#fbbf24"); titleG.addColorStop(0.5,"#ffffff"); titleG.addColorStop(1,"#fbbf24");
  ctx.font="bold 44px BF"; ctx.fillStyle=titleG; ctx.textAlign="center";
  ctx.shadowColor="#000"; ctx.shadowBlur=10;
  ctx.fillText("BLACKJACK ROYAL", W/2, 58);
  ctx.restore();

  ctx.font="16px BF"; ctx.fillStyle="#86efac"; ctx.textAlign="center";
  ctx.fillText(`Manche ${game.roundNumber}  ✦  ${game.players.length} joueur${game.players.length>1?"s":""}  ✦  Sabot: ${game.shoe.length-game.shoeIndex} cartes`, W/2, 84);

  // Séparateur doré
  const sepG=ctx.createLinearGradient(60,98,W-60,98);
  sepG.addColorStop(0,"transparent"); sepG.addColorStop(0.5,"#d97706aa"); sepG.addColorStop(1,"transparent");
  ctx.strokeStyle=sepG; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(60,98); ctx.lineTo(W-60,98); ctx.stroke();

  const cW=72, cH=105, cGap=10;

  // ── Main du Croupier ──
  const dealerY=115;
  rrect(ctx,40,dealerY,W-80,cH+50,14,"rgba(0,0,0,0.3)","rgba(255,255,255,0.08)",1);

  ctx.font="bold 14px BF"; ctx.fillStyle="#fbbf24"; ctx.textAlign="left";
  ctx.fillText("CROUPIER", 55, dealerY+18);

  const dealerHand=game.dealer.hand;
  const dealerValStr = game.dealer.hidden
    ? `${cardValue(dealerHand[0]?.rank||"2")} + ?`
    : `${handValue(dealerHand)}${isBust(dealerHand)?" BUST":isBlackjack(dealerHand)?" BLACKJACK!":""}`;

  ctx.font="bold 16px BF"; ctx.fillStyle="#ffffff"; ctx.textAlign="right";
  ctx.fillText(dealerValStr, W-55, dealerY+18);

  dealerHand.forEach((card,i) => {
    const cx=55+i*(cW+cGap);
    const hidden=i===1 && game.dealer.hidden;
    drawCard(ctx,card,cx,dealerY+24,cW,cH,hidden);
  });

  // ── Joueurs ──
  const cols = Math.min(game.players.length, 3);
  const rows = Math.ceil(game.players.length / cols);
  const cellW=(W-80)/cols, cellH=(H-280-dealerY-cH-60)/rows;
  const startY=dealerY+cH+70;

  game.players.forEach((p,idx) => {
    const col=idx%cols, row=Math.floor(idx/cols);
    const px=40+col*cellW, py=startY+row*cellH;
    const pw=cellW-12, ph=cellH-12;
    const isTurn=idx===game.turnIndex && game.phase==="player";

    // Fond carte joueur
    ctx.save();
    if (isTurn) { ctx.shadowColor="#f59e0b"; ctx.shadowBlur=25; }
    const cardBg=ctx.createLinearGradient(px,py,px+pw,py+ph);
    cardBg.addColorStop(0, isTurn ? "#292400dd" : "rgba(0,0,0,0.45)");
    cardBg.addColorStop(1, "rgba(0,0,0,0.3)");
    rrect(ctx,px,py,pw,ph,14,null,null,0);
    ctx.fillStyle=cardBg; ctx.fill();
    rrect(ctx,px,py,pw,ph,14,null,
      isTurn ? "#f59e0b" :
      p.result==="win"||p.result==="blackjack" ? "#22c55e" :
      p.result==="bust"||p.result==="lose" ? "#ef4444" :
      p.result==="push" ? "#94a3b8" : "#4b5563",
      isTurn?3:1.5);
    ctx.restore();

    // Barre supérieure couleur
    const barC=["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7"][idx]||"#6b7280";
    rrect(ctx,px,py,pw,5,3,barC);

    // Nom + bet
    ctx.font=`bold ${Math.min(16,ph*0.1)}px BF`; ctx.fillStyle="#f1f5f9"; ctx.textAlign="left";
    ctx.fillText((p.bot?"[IA] ":"")+p.name.slice(0,14), px+10, py+22);

    if (p.bet>0) {
      ctx.font="13px BF"; ctx.fillStyle="#fbbf24"; ctx.textAlign="right";
      ctx.fillText(`Mise: $${p.bet.toLocaleString()}${p.sideBet>0?" +Ass.$"+p.sideBet.toLocaleString():""}${p.doubleDown?" [X2]":""}`, px+pw-8, py+22);
    }

    // Main principale
    const handY=py+34;
    const maxCards=Math.min(p.hand.length,7);
    const handCW=Math.min(cW, Math.floor((pw-20)/(maxCards+0.3)));
    const handCH=Math.round(handCW*1.46);

    p.hand.forEach((card,ci) => {
      drawCard(ctx,card,px+10+ci*(handCW+5),handY,handCW,handCH);
    });

    // Valeur main
    if (p.hand.length>0) {
      const pv=handValue(p.hand);
      const pvColor=pv>21?"#ef4444":pv===21?"#fbbf24":"#86efac";
      ctx.font=`bold ${Math.min(20,ph*0.12)}px BF`; ctx.fillStyle=pvColor; ctx.textAlign="right";
      ctx.fillText(`${pv}${isBust(p.hand)?" BUST":isBlackjack(p.hand)&&p.hand.length===2?" BJ!":""}`, px+pw-8, handY+handCH+18);
    }

    // Split hand
    if (p.splitHand) {
      const sHandY=handY+handCH+28;
      ctx.font="bold 11px BF"; ctx.fillStyle="#a78bfa"; ctx.textAlign="left";
      ctx.fillText("SPLIT :", px+10, sHandY-2);
      p.splitHand.forEach((card,ci) => {
        drawCard(ctx,card,px+10+ci*(handCW+5),sHandY,handCW,handCH);
      });
      if (p.splitHand.length>0) {
        const sv=handValue(p.splitHand);
        ctx.font=`bold ${Math.min(14,ph*0.09)}px BF`; ctx.fillStyle=sv>21?"#ef4444":"#86efac"; ctx.textAlign="right";
        ctx.fillText(`${sv}${isBust(p.splitHand)?" BUST":""}`, px+pw-8, sHandY+handCH+14);
      }
    }

    // Badge résultat
    if (p.result) {
      const resMap={ win:"GAGNE",lose:"PERDU",push:"EGALITE",blackjack:"BLACKJACK!",bust:"BUST",surrender:"ABANDON" };
      const resC  ={ win:"#22c55e",lose:"#ef4444",push:"#94a3b8",blackjack:"#fbbf24",bust:"#ef4444",surrender:"#f97316" };
      const resText=resMap[p.result]||p.result.toUpperCase();
      const rC    =resC[p.result]||"#ffffff";
      ctx.save();
      ctx.shadowColor=rC; ctx.shadowBlur=15;
      rrect(ctx,px+pw/2-60,py+ph-32,120,26,8,rC+"33",rC,2);
      ctx.restore();
      ctx.font="bold 13px BF"; ctx.fillStyle="#ffffff"; ctx.textAlign="center";
      ctx.fillText(resText, px+pw/2, py+ph-14);
      // Payout
      if (p.payout!==undefined) {
        ctx.font="bold 12px BF";
        ctx.fillStyle=p.payout>0?"#86efac":p.payout<0?"#fca5a5":"#94a3b8";
        ctx.fillText(`${p.payout>0?"+":""}$${p.payout.toLocaleString()}`, px+pw/2, py+ph+2);
      }
    }

    // Indicateur tour
    if (isTurn && game.phase==="player") {
      ctx.save(); ctx.shadowColor="#f59e0b"; ctx.shadowBlur=10;
      ctx.font="bold 12px BF"; ctx.fillStyle="#f59e0b"; ctx.textAlign="center";
      ctx.fillText("▼ VOTRE TOUR", px+pw/2, py-4);
      ctx.restore();
    }
  });

  // ── Log bas ──
  const logY=H-55;
  const logBg=ctx.createLinearGradient(0,logY-10,0,H);
  logBg.addColorStop(0,"transparent"); logBg.addColorStop(0.3,"rgba(0,0,0,0.7)");
  ctx.fillStyle=logBg; ctx.fillRect(0,logY-10,W,H-(logY-10));

  game.log.slice(-2).forEach((line,i) => {
    ctx.font=i===0?"bold 15px BF":"13px BF";
    ctx.fillStyle=i===0?"#fde68a":"#4b5563"; ctx.textAlign="center";
    ctx.fillText((line||"").slice(0,95), W/2, logY+i*22);
  });

  return canvas;
}

// ─── Texte de statut ─────────────────────────────────────────────────────────
function buildText(game, extra="") {
  const current = game.phase==="player" ? currentPlayer(game) : null;
  const lines   = [];

  lines.push(`★ BLACKJACK ROYAL ★  Manche ${game.roundNumber}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Croupier
  const dh = game.dealer.hand;
  if (dh.length > 0) {
    const dShow = game.dealer.hidden
      ? `${dh[0]?.rank}${dh[0]?.suit} + [?]`
      : dh.map(c=>`${c.rank}${c.suit}`).join(" ");
    const dVal  = game.dealer.hidden
      ? `${cardValue(dh[0]?.rank||"2")} + ?`
      : `${handValue(dh)}${isBust(dh)?" BUST":isBlackjack(dh)?" BLACKJACK!":""}`;
    lines.push(`Croupier: ${dShow}  [${dVal}]`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Joueurs
  for (const p of game.players) {
    const pv = p.hand.length>0 ? handValue(p.hand) : 0;
    const ph = p.hand.map(c=>`${c.rank}${c.suit}`).join(" ") || "-";
    const bet = p.bet>0 ? ` | Mise: $${p.bet.toLocaleString()}` : "";
    const res = p.result ? ` → ${p.result.toUpperCase()}` : "";
    lines.push(`${p.name}${p.bot?"[IA]":""}: ${ph} [${pv>0?pv:"-"}]${bet}${res}`);
    if (p.splitHand) {
      const sv=handValue(p.splitHand);
      const sh=p.splitHand.map(c=>`${c.rank}${c.suit}`).join(" ");
      lines.push(`  └ Split: ${sh} [${sv}]${p.splitResult?` → ${p.splitResult.toUpperCase()}`:""}` );
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Actions disponibles
  if (game.phase==="bet") {
    lines.push(`→ Tapez "mise [montant]" pour placer votre mise`);
    lines.push(`→ Ex: mise 500`);
  } else if (game.phase==="player" && current && !current.bot) {
    const pv   = handValue(current.hand);
    const canD = current.hand.length===2 && !current.doubleDown;
    const canSp= current.hand.length===2 && current.hand[0].rank===current.hand[1].rank && !current.splitHand;
    const canSu= current.hand.length===2;
    const canI = !current.sideBet && game.dealer.hand[0]?.rank==="A" && current.hand.length===2;
    lines.push(`→ tirer    — prendre une carte`);
    lines.push(`→ rester   — ne plus tirer`);
    if (canD)  lines.push(`→ double   — doubler la mise (1 seule carte)`);
    if (canSp) lines.push(`→ split    — séparer la paire`);
    if (canSu) lines.push(`→ abandon  — récupérer la moitié de la mise`);
    if (canI)  lines.push(`→ assurance — parier contre le BJ croupier`);
  }

  if (extra) { lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`); lines.push(extra); }
  return lines.join("\n");
}

// ─── Publish ──────────────────────────────────────────────────────────────────
async function publish(message, game, body, withCanvas=true) {
  game.updatedAt = Date.now();
  const current  = game.phase==="player" ? currentPlayer(game) : null;

  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }

  const mentions = current && !current.bot ? [{ id:current.id, tag:current.name }] : [];

  if (withCanvas) {
    const tmp=path.join(os.tmpdir(),`bj_${game.id}_${Date.now()}.png`);
    try {
      const cnv=renderTable(game);
      fs.writeFileSync(tmp, cnv.toBuffer("image/png"));
    } catch(e) {
      console.error("[BJ] Canvas:",e.message);
      return message.reply({ body, mentions });
    }
    return new Promise(resolve => {
      message.reply({ body, attachment:fs.createReadStream(tmp), mentions }, (err,info) => {
        try { fs.unlinkSync(tmp); } catch(_) {}
        if (!err && info) regReply(game, info.messageID, current);
        if (game.phase==="ended") endGame(game);
        resolve();
      });
    });
  }
  return new Promise(resolve => {
    message.reply({ body, mentions }, (err,info) => {
      if (!err && info) regReply(game, info.messageID, current);
      if (game.phase==="ended") endGame(game);
      resolve();
    });
  });
}

function regReply(game, msgID, current) {
  game.replyMessageID = msgID;
  if (game.phase!=="ended" && current && !current.bot && global.GoatBot?.onReply) {
    global.GoatBot.onReply.set(msgID, {
      commandName: game.commandName, messageID: msgID,
      author: current.id, threadID: game.threadID,
      gameKey: game.key, gameID: game.id,
    });
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.replyMessageID);
}

function cleanupExpiredGames() {
  const now=Date.now();
  for (const g of activeGames.values()) if (now-g.updatedAt>GAME_EXPIRE) endGame(g);
}

async function getUserName(api, usersData, uid) {
  if (uid?.startsWith("bot_")) return uid;
  try {
    if (usersData?.getName) return await usersData.getName(uid);
    const info=await api.getUserInfo(uid);
    return info[uid]?.name||"Joueur";
  } catch { return "Joueur"; }
}

// ─── Déroulement d'une manche ─────────────────────────────────────────────────
async function startDeal(message, game, api, usersData) {
  // Distribuer 2 cartes à chacun + 2 au croupier (2e cachée)
  for (const p of game.players) {
    p.hand = [dealCard(game), dealCard(game)];
    p.done = false; p.result = null; p.splitResult = null; p.payout = 0;
  }
  game.dealer.hand   = [dealCard(game), dealCard(game, true)];
  game.dealer.hidden = true;
  game.phase         = "player";
  game.turnIndex     = 0;
  game.log.push(`★ Distribution — ${game.players.map(p=>p.name).join(", ")}`);

  // Vérifier BJ immédiat pour les joueurs
  for (const p of game.players) {
    if (isBlackjack(p.hand)) {
      game.log.push(`★ BLACKJACK pour ${p.name} !`);
    }
  }

  // Passer les joueurs BJ si croupier n'a pas As en 1ère carte
  if (game.dealer.hand[0]?.rank !== "A") {
    for (const p of game.players) {
      if (isBlackjack(p.hand)) { p.done = true; }
    }
    // Si tous done → passer au croupier
    if (game.players.every(p=>p.done)) {
      await runDealer(message, game, api, usersData);
      return;
    }
    // Avancer jusqu'au premier non-done
    while (game.turnIndex < game.players.length && game.players[game.turnIndex].done) {
      game.turnIndex++;
    }
    if (game.turnIndex >= game.players.length) {
      await runDealer(message, game, api, usersData);
      return;
    }
  }

  const body = buildText(game, `★ A ${currentPlayer(game).name} de jouer !`);
  await publish(message, game, body, true);
  await runBots(message, game, api, usersData);
}

async function runDealer(message, game, api, usersData) {
  game.phase = "dealer";
  dealerPlay(game);
  game.phase = "result";

  const summary = resolveResults(game);
  await payoutAll(game, usersData);

  summary.forEach(s => game.log.push(s));
  game.phase = "ended";

  const dVal = handValue(game.dealer.hand);
  const endBody = [
    `★ BLACKJACK ROYAL — Résultats Manche ${game.roundNumber} ★`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Croupier : ${game.dealer.hand.map(c=>`${c.rank}${c.suit}`).join(" ")} [${dVal}${isBust(game.dealer.hand)?" BUST":isBlackjack(game.dealer.hand)?" BLACKJACK!":""}]`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...summary,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Tapez "rejouer" pour une nouvelle manche !`,
    `Tapez "stats" pour voir vos statistiques.`,
    `Tapez "stop" pour quitter.`,
  ].join("\n");

  await publish(message, game, endBody, true);
}

// ─── Bot runner ───────────────────────────────────────────────────────────────
async function runBots(message, game, api, usersData) {
  let safety=0;
  while (activeGames.get(game.key)===game && game.phase==="player" && safety<60) {
    const current=currentPlayer(game);
    if (!current?.bot) break;
    safety++;
    await sleep(BOT_DELAY);
    if (activeGames.get(game.key)!==game) break;

    const dealerUp = game.dealer.hand[0];
    let action = botAction(
      current.hand, dealerUp,
      current.hand.length===2 && !current.doubleDown,
      current.hand.length===2 && current.hand[0].rank===current.hand[1].rank && !current.splitHand,
      current.hand.length===2
    );

    // Assurance bot (si croupier As)
    if (!current.sideBet && dealerUp?.rank==="A" && current.hand.length===2) {
      if (Math.random()<0.3) {
        current.sideBet = Math.floor(current.bet/2);
        game.log.push(`[IA] ${current.name} prend l'assurance ($${current.sideBet.toLocaleString()})`);
      }
    }

    if (action==="split" && !current.splitHand) {
      current.splitHand = [current.hand.pop()];
      current.hand.push(dealCard(game));
      current.splitHand.push(dealCard(game));
      game.log.push(`[IA] ${current.name} : SPLIT`);
      await sleep(400);
      action = botAction(current.hand, dealerUp, false, false, false);
    }

    if (action==="double") {
      current.bet *= 2; current.doubleDown = true;
      current.hand.push(dealCard(game));
      current.done = true;
      game.log.push(`[IA] ${current.name} : DOUBLE → ${handValue(current.hand)}`);
    } else if (action==="surrender") {
      current.surrendered = true; current.done = true;
      game.log.push(`[IA] ${current.name} : ABANDON`);
    } else {
      // Hit / stand loop
      let cont=true;
      while (cont && !isBust(current.hand)) {
        const act2=botAction(current.hand, dealerUp, false, false, false);
        if (act2==="hit") {
          current.hand.push(dealCard(game));
          game.log.push(`[IA] ${current.name} tire → ${handValue(current.hand)}`);
          await sleep(300);
        } else { cont=false; }
      }
      current.done=true;
      game.log.push(`[IA] ${current.name} reste à ${handValue(current.hand)}`);
    }

    // Avancer
    advanceTurn(game);
    if (game.phase==="dealer") {
      await runDealer(message, game, api, usersData);
      return;
    }
    if (!currentPlayer(game)?.bot) {
      const body=buildText(game, `[IA] ${current.name} a joué. A ${currentPlayer(game).name} !`);
      await publish(message, game, body, true);
      return;
    }
  }
  if (game.phase==="dealer") {
    await runDealer(message, game, api, usersData);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "blackjack",
    aliases: ["bj","blackjackroyal","21"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "★ Blackjack Royal — Jeu de blackjack complet avec IA, split, double, assurance et stats !" },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("★ BLACKJACK ROYAL ★")}\n\n` +
        `${fonts.bold("Lancer une partie :")}\n` +
        `  ${fonts.monospace("blackjack")} — Solo vs croupier IA\n` +
        `  ${fonts.monospace("blackjack @j2")} — 2 joueurs vs croupier\n` +
        `  ${fonts.monospace("blackjack @j2 @j3 @j4")} — jusqu'à 5 joueurs\n` +
        `  ${fonts.monospace("blackjack bot 3")} — avec 2 bots supplémentaires\n` +
        `  ${fonts.monospace("blackjack stop")} — quitter\n` +
        `  ${fonts.monospace("blackjack stats")} — voir vos statistiques\n\n` +
        `${fonts.bold("Comment jouer :")}\n` +
        `  1. Tapez ${fonts.monospace("mise [montant]")} — placer votre mise\n` +
        `  2. Tapez ${fonts.monospace("tirer")} — prendre une carte\n` +
        `  3. Tapez ${fonts.monospace("rester")} — ne plus tirer\n` +
        `  4. Tapez ${fonts.monospace("double")} — doubler la mise (1 carte)\n` +
        `  5. Tapez ${fonts.monospace("split")} — séparer une paire\n` +
        `  6. Tapez ${fonts.monospace("abandon")} — récupérer 50% de la mise\n` +
        `  7. Tapez ${fonts.monospace("assurance")} — parier contre le BJ croupier\n\n` +
        `${fonts.bold("Règles :")}\n` +
        `  Blackjack paie 3:2 (x1.5)\n` +
        `  Croupier tire jusqu'à 17\n` +
        `  Assurance paie 2:1\n` +
        `  Sabot de ${DECKS} jeux — 6 jeux de cartes mélangés\n\n` +
        `${fonts.bold("Tapez 'rejouer' après chaque manche !")}`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const sub = (args[0]||"").toLowerCase();

    if (!sub || sub==="help") return message.reply(this.config.guide.fr);

    if (sub==="stop") {
      const g=activeGames.get(event.threadID);
      if (!g||!g.players.some(p=>p.id===event.senderID)) return message.reply(fonts.bold("❌ Aucune partie en cours pour vous."));
      endGame(g);
      return message.reply(fonts.bold("Partie terminée."));
    }

    if (sub==="stats") {
      const st=getStat(event.senderID);
      const wr=st.games>0?Math.round((st.wins/st.games)*100):0;
      return message.reply([
        `★ VOS STATISTIQUES BLACKJACK`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Parties     : ${st.games}`,
        `Victoires   : ${st.wins} (${wr}%)`,
        `Défaites    : ${st.losses}`,
        `Egalités    : ${st.draws}`,
        `Blackjacks  : ${st.blackjacks}`,
        `Busts       : ${st.busts}`,
        `Total gagné : $${st.totalWon.toLocaleString()}`,
        `Total perdu : $${st.totalLost.toLocaleString()}`,
        `Bilan net   : ${st.totalWon-st.totalLost>=0?"+":""}$${(st.totalWon-st.totalLost).toLocaleString()}`,
      ].join("\n"));
    }

    if (activeGames.has(event.threadID)) return message.reply(fonts.bold("❌ Une partie est déjà en cours ! Tapez 'blackjack stop' d'abord."));

    const senderID=event.senderID;
    const myName  =await getUserName(api, usersData, senderID);
    const botNames=["Bot Ace","Bot Nova","Bot Rex","Bot Jinx","Bot Zara"];
    const players =[{ id:senderID, name:myName, bot:false }];

    if (sub==="bot"||sub==="bots") {
      const count=Math.min(MAX_PLAYERS, parseInt(args.find(a=>/^[2-5]$/.test(a))||"2",10));
      while (players.length<count) {
        const bi=players.length-1;
        players.push({ id:`bot_${bi}_${Date.now()}`, name:botNames[bi]||`Bot${bi}`, bot:true });
      }
    } else if (sub==="solo"||sub==="seul") {
      // Solo uniquement
    } else {
      const mentionedIDs=Object.keys(event.mentions||{}).filter(id=>id!==senderID);
      for (let i=0; i<Math.min(mentionedIDs.length, MAX_PLAYERS-1); i++) {
        const id=mentionedIDs[i];
        players.push({ id, name: await getUserName(api, usersData, id), bot:false });
      }
    }

    const game=createGame(event.threadID, players, commandName);
    game.usersData=usersData;
    activeGames.set(game.key, game);

    const pList=game.players.map(p=>`${p.name}${p.bot?" [IA]":""}`).join("  ✦  ");
    const body=buildText(game, `★ Blackjack Royal démarré !\n${pList}\nMise min: $${MIN_BET.toLocaleString()} | max: $${MAX_BET.toLocaleString()}\n\nTapez "mise [montant]" pour commencer !`);
    await publish(message, game, body, false);
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game=activeGames.get(Reply.gameKey||Reply.threadID);
    if (!game||game.id!==Reply.gameID) return;
    if (game.replyMessageID && global.GoatBot?.onReply) global.GoatBot.onReply.delete(game.replyMessageID);

    const player=game.players.find(p=>p.id===event.senderID);
    if (!player) return;

    const input=(event.body||"").trim().toLowerCase();
    if (!input) return;

    // ── STOP ──
    if (input==="stop"||input==="quitter") {
      endGame(game);
      return message.reply(fonts.bold("Partie terminée."));
    }

    // ── STATS ──
    if (input==="stats") {
      const st=getStat(event.senderID);
      const wr=st.games>0?Math.round((st.wins/st.games)*100):0;
      return message.reply([
        `★ VOS STATS`,`V:${st.wins} D:${st.losses} N:${st.draws}`,
        `BJ:${st.blackjacks} Bust:${st.busts}`,
        `Net: ${st.totalWon-st.totalLost>=0?"+":""}$${(st.totalWon-st.totalLost).toLocaleString()}`,
        `Win rate: ${wr}%`,
      ].join("\n"));
    }

    // ── REJOUER ──
    if (input==="rejouer"||input==="replay"||input==="nouvelle") {
      if (game.phase!=="ended") return publish(message, game, buildText(game,"Finissez la manche en cours d'abord !"), false);
      // Reset pour nouvelle manche
      game.roundNumber++;
      game.phase    = "bet";
      game.turnIndex= 0;
      game.log      = [];
      game.dealer   = { id:"dealer", name:"Croupier", hand:[], hidden:true };
      for (const p of game.players) {
        p.hand=[]; p.splitHand=null; p.bet=0; p.sideBet=0;
        p.doubleDown=false; p.surrendered=false; p.done=false;
        p.result=null; p.splitResult=null; p.payout=0; p.playing="main";
      }
      // Remettre en écoute
      const body=buildText(game, `★ Manche ${game.roundNumber} — Tapez "mise [montant]" pour parier !`);
      return publish(message, game, body, false);
    }

    // ── PHASE BET ──
    if (game.phase==="bet") {
      if (!input.startsWith("mise")) return publish(message, game, buildText(game,"Tapez 'mise [montant]' pour placer votre mise. Ex: mise 500"), false);
      const amount=parseInt((input.match(/\d+/)||["0"])[0]);
      if (!amount||amount<MIN_BET||amount>MAX_BET) {
        return publish(message, game, buildText(game,`Mise invalide ! Min $${MIN_BET.toLocaleString()} / Max $${MAX_BET.toLocaleString()}`), false);
      }
      if (!player.bot) {
        const ud=await usersData.get(player.id);
        if ((ud?.money||0)<amount) return publish(message, game, buildText(game,`Solde insuffisant ! Vous avez $${(ud?.money||0).toLocaleString()}`), false);
        await usersData.set(player.id, { money:(ud.money||0)-amount });
      }
      player.bet=amount;
      game.log.push(`${player.name} mise $${amount.toLocaleString()}`);

      // Tous ont misé ?
      const allBet=game.players.filter(p=>!p.bot).every(p=>p.bet>0);
      if (allBet) {
        // Bots misent automatiquement
        for (const p of game.players.filter(p=>p.bot)) {
          p.bet = Math.floor(MIN_BET*(1+Math.random()*9));
        }
        game.phase="deal";
        await startDeal(message, game, api, usersData);
      } else {
        const remaining=game.players.filter(p=>!p.bot&&p.bet===0);
        return publish(message, game, buildText(game,`Mise enregistrée ! En attente de : ${remaining.map(p=>p.name).join(", ")}`), false);
      }
      return;
    }

    // ── PHASE PLAYER ──
    if (game.phase!=="player") return;

    const current=currentPlayer(game);
    if (event.senderID!==current.id) {
      return publish(message, game, buildText(game,`Ce n'est pas votre tour ! C'est à ${current.name}.`), false);
    }

    const dealerUp=game.dealer.hand[0];
    const canDouble=current.hand.length===2 && !current.doubleDown;
    const canSplit =current.hand.length===2 && current.hand[0].rank===current.hand[1].rank && !current.splitHand;
    const canSurr  =current.hand.length===2;
    const canInsur =!current.sideBet && dealerUp?.rank==="A" && current.hand.length===2;

    // ── ASSURANCE ──
    if ((input==="assurance"||input==="insurance") && canInsur) {
      const insBet=Math.floor(current.bet/2);
      const ud=await usersData.get(current.id);
      if ((ud?.money||0)<insBet) return publish(message,game,buildText(game,`Solde insuffisant pour l'assurance ($${insBet.toLocaleString()}).`),false);
      await usersData.set(current.id,{ money:(ud.money||0)-insBet });
      current.sideBet=insBet;
      game.log.push(`${current.name} prend l'assurance ($${insBet.toLocaleString()})`);
      return publish(message, game, buildText(game,"Assurance prise ! Continuez : tirer, rester, double, split, abandon"), false);
    }

    // ── DOUBLE ──
    if ((input==="double"||input==="x2") && canDouble) {
      const extraBet=current.bet;
      const ud=await usersData.get(current.id);
      if (!current.bot && (ud?.money||0)<extraBet) return publish(message,game,buildText(game,`Solde insuffisant pour doubler !`),false);
      if (!current.bot) await usersData.set(current.id,{ money:(ud.money||0)-extraBet });
      current.bet*=2; current.doubleDown=true;
      current.hand.push(dealCard(game));
      current.done=true;
      game.log.push(`${current.name} DOUBLE → ${handValue(current.hand)}${isBust(current.hand)?" BUST":""}`);
      advanceTurn(game);
      if (game.phase==="dealer") { await runDealer(message,game,api,usersData); return; }
      const body=buildText(game,`Double effectué ! A ${currentPlayer(game).name}`);
      await publish(message,game,body,true);
      await runBots(message,game,api,usersData);
      return;
    }

    // ── SPLIT ──
    if ((input==="split"||input==="separer") && canSplit) {
      current.splitHand=[current.hand.pop()];
      current.hand.push(dealCard(game));
      current.splitHand.push(dealCard(game));
      game.log.push(`${current.name} SPLIT → main:${handValue(current.hand)} split:${handValue(current.splitHand)}`);
      const body=buildText(game,"Split effectué ! Jouez votre main principale d'abord.");
      return publish(message,game,body,true);
    }

    // ── ABANDON ──
    if ((input==="abandon"||input==="surrender"||input==="fold") && canSurr) {
      current.surrendered=true; current.done=true;
      const refund=Math.floor(current.bet/2);
      const ud2=await usersData.get(current.id);
      await usersData.set(current.id,{ money:(ud2?.money||0)+refund });
      game.log.push(`${current.name} abandonne — récupère $${refund.toLocaleString()}`);
      advanceTurn(game);
      if (game.phase==="dealer") { await runDealer(message,game,api,usersData); return; }
      const body=buildText(game,`Abandon effectué. A ${currentPlayer(game).name}`);
      await publish(message,game,body,true);
      await runBots(message,game,api,usersData);
      return;
    }

    // ── TIRER ──
    if (input==="tirer"||input==="hit"||input==="t"||input==="h") {
      current.hand.push(dealCard(game));
      game.moveCount++;
      const pv=handValue(current.hand);
      game.log.push(`${current.name} tire → ${pv}${isBust(current.hand)?" BUST":""}`);

      if (isBust(current.hand)||pv===21) {
        current.done=true;
        advanceTurn(game);
        if (game.phase==="dealer") { await runDealer(message,game,api,usersData); return; }
        const body=buildText(game,`${isBust(current.hand)?"BUST !":"21 !"}  A ${currentPlayer(game).name}`);
        await publish(message,game,body,true);
        await runBots(message,game,api,usersData);
        return;
      }
      const body=buildText(game,`Vous avez ${pv}. Tirer encore ou rester ?`);
      return publish(message,game,body,true);
    }

    // ── RESTER ──
    if (input==="rester"||input==="stand"||input==="s"||input==="r") {
      current.done=true;
      game.log.push(`${current.name} reste à ${handValue(current.hand)}`);
      // Si split, jouer la main split
      if (current.splitHand && current.playing==="main") {
        current.playing="split";
        current.done=false;
        game.log.push(`${current.name} joue maintenant son split`);
        const body=buildText(game,"Jouez maintenant votre main split !");
        return publish(message,game,body,true);
      }
      advanceTurn(game);
      if (game.phase==="dealer") { await runDealer(message,game,api,usersData); return; }
      const body=buildText(game,`${current.name} reste. A ${currentPlayer(game).name}`);
      await publish(message,game,body,true);
      await runBots(message,game,api,usersData);
      return;
    }

    // Commande inconnue
    return publish(message,game,buildText(game,"Commande inconnue. Tapez : tirer / rester / double / split / abandon / assurance"),false);
  },
};
