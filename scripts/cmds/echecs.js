"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  ECHECS ROYAL — Jeu d'échecs complet pour GoatBot
//  Auteur   : Christus
//  Modes    : Solo vs IA | 1v1 humain | Tournoi
//  Visuels  : Canvas (plateau) + texte selon la situation
//  Systèmes : Paris, ELO, IA avec niveaux, historique des coups
// ═══════════════════════════════════════════════════════════════════════════════

const { createCanvas } = require("canvas");
const Canvas           = require("canvas");
const path             = require("path");
const fs               = require("fs");
const os               = require("os");

// ─── Enregistrement font + emoji ─────────────────────────────────────────────
try { Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Bold.ttf"),    { family: "CF", weight: "bold" }); } catch (_) {}
try { Canvas.registerFont(path.join(__dirname, "assets/font/NotoSans-Regular.ttf"), { family: "CF", weight: "normal" }); } catch (_) {}
try { Canvas.registerFont(path.join(__dirname, "assets/font/Emoji.ttf"),            { family: "Emoji" }); } catch (_) {}

let fonts;
try { fonts = require("../../func/font.js"); }
catch { fonts = { bold: t => t, sansSerif: t => t, monospace: t => t }; }

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Constantes ───────────────────────────────────────────────────────────────
const GAME_EXPIRE  = 1000 * 60 * 120; // 2h
const BOT_DELAY    = 1500;
const BOARD_SIZE   = 8;

const activeGames  = new Map(); // threadID → game
const eloData      = new Map(); // userID → { elo, wins, losses, draws, games }

// Pièces : lettre majuscule = Blanc, minuscule = Noir
// K=Roi Q=Dame R=Tour B=Fou N=Cavalier P=Pion
const PIECE_UNICODE = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};
const PIECE_NAME_FR = {
  K: "Roi", Q: "Dame", R: "Tour", B: "Fou", N: "Cavalier", P: "Pion",
  k: "Roi", q: "Dame", r: "Tour", b: "Fou", n: "Cavalier", p: "Pion",
};
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// ─── ELO ─────────────────────────────────────────────────────────────────────
function getElo(uid) {
  if (!eloData.has(uid)) eloData.set(uid, { elo: 1200, wins: 0, losses: 0, draws: 0, games: 0 });
  return eloData.get(uid);
}
function updateElo(wID, lID, draw = false) {
  if (!wID || !lID || wID.startsWith("bot_") || lID.startsWith("bot_")) return;
  const K = 32;
  const w = getElo(wID), l = getElo(lID);
  const exp = 1 / (1 + Math.pow(10, (l.elo - w.elo) / 400));
  const score = draw ? 0.5 : 1;
  const gain  = Math.round(K * (score - exp));
  w.elo += gain; l.elo -= gain;
  if (l.elo < 100) l.elo = 100;
  w.games++; l.games++;
  if (draw) { w.draws++; l.draws++; }
  else      { w.wins++;  l.losses++; }
}

// ─── Plateau initial ──────────────────────────────────────────────────────────
function initBoard() {
  // Tableau 8x8, [row][col], row 0 = rangée 8 (noirs), row 7 = rangée 1 (blancs)
  return [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"],
  ];
}

// ─── Notation algébrique ──────────────────────────────────────────────────────
// "e2e4" → { fromRow, fromCol, toRow, toCol }
function parseMove(notation) {
  const n = notation.toLowerCase().trim().replace(/[-x+#=]/g, "");
  if (n.length < 4) return null;
  const fc = n.charCodeAt(0) - 97; // a=0 … h=7
  const fr = 8 - parseInt(n[1]);
  const tc = n.charCodeAt(2) - 97;
  const tr = 8 - parseInt(n[3]);
  const promo = n[4] ? n[4].toUpperCase() : null;
  if (fc < 0 || fc > 7 || fr < 0 || fr > 7 || tc < 0 || tc > 7 || tr < 0 || tr > 7) return null;
  return { fromRow: fr, fromCol: fc, toRow: tr, toCol: tc, promo };
}

function moveToAlg(fromRow, fromCol, toRow, toCol, promo) {
  const files = "abcdefgh";
  return files[fromCol] + (8 - fromRow) + files[toCol] + (8 - toRow) + (promo ? promo.toLowerCase() : "");
}

// ─── Logique de mouvement ─────────────────────────────────────────────────────
function isWhite(p) { return p && p === p.toUpperCase(); }
function isBlack(p) { return p && p === p.toLowerCase(); }
function sameColor(a, b) { return (isWhite(a) && isWhite(b)) || (isBlack(a) && isBlack(b)); }
function opponent(piece, turn) { return turn === "white" ? isBlack(piece) : isWhite(piece); }
function ownPiece(piece, turn) { return turn === "white" ? isWhite(piece) : isBlack(piece); }

function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// Génère les cases de destination pseudo-légales pour une pièce
function pseudoLegalTargets(board, row, col, state) {
  const piece = board[row][col];
  if (!piece) return [];
  const type  = piece.toLowerCase();
  const white = isWhite(piece);
  const dir   = white ? -1 : 1;
  const moves = [];

  const slide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      if (board[r][c]) {
        if (!sameColor(piece, board[r][c])) moves.push([r, c]);
        break;
      }
      moves.push([r, c]);
      r += dr; c += dc;
    }
  };

  switch (type) {
    case "p": {
      // Avancer
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        const startRow = white ? 6 : 1;
        if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
      }
      // Capturer en diagonale
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (inBounds(nr, nc)) {
          if (board[nr][nc] && !sameColor(piece, board[nr][nc])) moves.push([nr, nc]);
          // En passant
          if (state && state.enPassant && state.enPassant[0] === nr && state.enPassant[1] === nc) {
            moves.push([nr, nc, "ep"]);
          }
        }
      }
      break;
    }
    case "n": {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && !sameColor(piece, board[nr][nc])) moves.push([nr, nc]);
      }
      break;
    }
    case "b": {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;
    }
    case "r": {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    }
    case "q": {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    }
    case "k": {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && !sameColor(piece, board[nr][nc])) moves.push([nr, nc]);
      }
      // Roque
      if (state) {
        const castleKey = white ? "white" : "black";
        const kingRow   = white ? 7 : 0;
        if (row === kingRow && col === 4) {
          // Petit roque
          if (state.castling[castleKey].kingSide &&
              !board[kingRow][5] && !board[kingRow][6] &&
              !isSquareAttacked(board, kingRow, 4, white ? "black" : "white") &&
              !isSquareAttacked(board, kingRow, 5, white ? "black" : "white")) {
            moves.push([kingRow, 6, "castle_k"]);
          }
          // Grand roque
          if (state.castling[castleKey].queenSide &&
              !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] &&
              !isSquareAttacked(board, kingRow, 4, white ? "black" : "white") &&
              !isSquareAttacked(board, kingRow, 3, white ? "black" : "white")) {
            moves.push([kingRow, 2, "castle_q"]);
          }
        }
      }
      break;
    }
  }
  return moves;
}

// Vérifie si une case est attaquée par le camp "byColor"
function isSquareAttacked(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (byColor === "white" && !isWhite(p)) continue;
      if (byColor === "black" && !isBlack(p)) continue;
      const targets = pseudoLegalTargets(board, r, c, null);
      if (targets.some(([tr, tc]) => tr === row && tc === col)) return true;
    }
  }
  return false;
}

// Applique un coup sur une copie du plateau, renvoie { board, enPassant, captured }
function applyMove(board, fromRow, fromCol, toRow, toCol, promoChoice, state) {
  const b = board.map(r => [...r]);
  const piece = b[fromRow][fromCol];
  const captured = b[toRow][toCol];
  let enPassant = null;
  let epCapture = null;

  // En passant
  const targets = pseudoLegalTargets(board, fromRow, fromCol, state);
  const epMove  = targets.find(m => m[0] === toRow && m[1] === toCol && m[2] === "ep");
  if (epMove) {
    const capRow = fromRow; // la case où est le pion capturé
    epCapture = b[capRow][toCol];
    b[capRow][toCol] = null;
  }

  // Roque
  const castleMove = targets.find(m => m[0] === toRow && m[1] === toCol && (m[2] === "castle_k" || m[2] === "castle_q"));
  if (castleMove) {
    if (castleMove[2] === "castle_k") {
      b[toRow][5] = b[toRow][7];
      b[toRow][7] = null;
    } else {
      b[toRow][3] = b[toRow][0];
      b[toRow][0] = null;
    }
  }

  // Promotion
  let movedPiece = piece;
  if (piece.toLowerCase() === "p" && (toRow === 0 || toRow === 7)) {
    const promoPiece = promoChoice || "Q";
    movedPiece = isWhite(piece) ? promoPiece.toUpperCase() : promoPiece.toLowerCase();
  }

  b[toRow][toCol]     = movedPiece;
  b[fromRow][fromCol] = null;

  // Calcul en passant pour le prochain coup
  if (piece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
    enPassant = [(fromRow + toRow) / 2, fromCol];
  }

  return { board: b, enPassant, captured: captured || epCapture };
}

// Génère tous les coups légaux (roi ne peut pas être en échec après)
function legalMoves(board, turn, state) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (turn === "white" && !isWhite(p)) continue;
      if (turn === "black" && !isBlack(p)) continue;
      const targets = pseudoLegalTargets(board, r, c, state);
      for (const [tr, tc] of targets) {
        const { board: nb } = applyMove(board, r, c, tr, tc, null, state);
        const kingPos = findKing(nb, turn);
        if (!kingPos) continue;
        const attackColor = turn === "white" ? "black" : "white";
        if (!isSquareAttacked(nb, kingPos[0], kingPos[1], attackColor)) {
          moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc });
        }
      }
    }
  }
  return moves;
}

function findKing(board, color) {
  const k = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === k) return [r, c];
  return null;
}

function isInCheck(board, color) {
  const kp = findKing(board, color);
  if (!kp) return false;
  return isSquareAttacked(board, kp[0], kp[1], color === "white" ? "black" : "white");
}

function isCheckmate(board, turn, state) {
  return isInCheck(board, turn) && legalMoves(board, turn, state).length === 0;
}
function isStalemate(board, turn, state) {
  return !isInCheck(board, turn) && legalMoves(board, turn, state).length === 0;
}

// ─── IA (Minimax + alpha-beta, profondeur variable) ───────────────────────────
function evalBoard(board) {
  let score = 0;
  const posBonus = {
    p: [[0,0,0,0,0,0,0,0],[5,10,10,-20,-20,10,10,5],[5,-5,-10,0,0,-10,-5,5],[0,0,0,20,20,0,0,0],[5,5,10,25,25,10,5,5],[10,10,20,30,30,20,10,10],[50,50,50,50,50,50,50,50],[0,0,0,0,0,0,0,0]],
    n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
    b: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
    r: [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
    q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
    k: [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]],
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const t = p.toLowerCase();
      const v = (PIECE_VALUE[t] || 0) * 100;
      const pb = posBonus[t] ? (isWhite(p) ? posBonus[t][r][c] : posBonus[t][7 - r][c]) : 0;
      score += isWhite(p) ? (v + pb) : -(v + pb);
    }
  }
  return score;
}

function minimax(board, depth, alpha, beta, maximizing, turn, state) {
  const opp = turn === "white" ? "black" : "white";
  if (isCheckmate(board, turn, state)) return maximizing ? -100000 : 100000;
  if (isStalemate(board, turn, state)) return 0;
  if (depth === 0) return evalBoard(board);

  const moves = legalMoves(board, turn, state);

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const { board: nb, enPassant } = applyMove(board, m.fromRow, m.fromCol, m.toRow, m.toCol, null, state);
      const val = minimax(nb, depth - 1, alpha, beta, false, opp, { ...state, enPassant });
      best  = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const { board: nb, enPassant } = applyMove(board, m.fromRow, m.fromCol, m.toRow, m.toCol, null, state);
      const val = minimax(nb, depth - 1, alpha, beta, true, opp, { ...state, enPassant });
      best  = Math.min(best, val);
      beta  = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function botBestMove(board, botColor, depth, state) {
  const moves  = legalMoves(board, botColor, state);
  if (!moves.length) return null;
  let bestMove = null, bestVal = botColor === "white" ? -Infinity : Infinity;
  const opp = botColor === "white" ? "black" : "white";

  // Ordre des coups : captures en premier
  moves.sort((a, b) => {
    const ca = board[a.toRow][a.toCol] ? 1 : 0;
    const cb = board[b.toRow][b.toCol] ? 1 : 0;
    return cb - ca;
  });

  for (const m of moves) {
    const { board: nb, enPassant } = applyMove(board, m.fromRow, m.fromCol, m.toRow, m.toCol, null, state);
    const val = minimax(nb, depth - 1, -Infinity, Infinity, botColor === "black", opp, { ...state, enPassant });
    if (botColor === "white" ? val > bestVal : val < bestVal) {
      bestVal = val;
      bestMove = m;
    }
  }
  return bestMove;
}

// ─── Création de partie ───────────────────────────────────────────────────────
function createGame(threadID, white, black, bet, commandName, botDepth) {
  return {
    id:        `${threadID}_${Date.now()}`,
    key:       threadID,
    threadID,
    commandName,
    white,     // { id, name, bot }
    black,     // { id, name, bot }
    board:     initBoard(),
    turn:      "white",
    state: {
      enPassant: null,
      castling: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true },
      },
    },
    history:         [],   // { alg, piece, captured, check }
    capturedWhite:   [],   // pièces blanches capturées par noir
    capturedBlack:   [],   // pièces noires capturées par blanc
    phase:           "play",  // play | promotion | ended
    promotionPending: null,
    check:           false,
    checkmate:       false,
    stalemate:       false,
    result:          null,  // "white" | "black" | "draw"
    replyMessageID:  null,
    startedAt:       Date.now(),
    updatedAt:       Date.now(),
    bet,
    moveCount:       0,
    botDepth:        botDepth || 3,
    lastMove:        null,  // { fromRow, fromCol, toRow, toCol }
  };
}

// ─── Rendu Canvas ─────────────────────────────────────────────────────────────
function fillMixedText(ctx, text, x, y) {
  const savedFont = ctx.font;
  const sizeMatch = savedFont.match(/(\d+(?:\.\d+)?)px/);
  const fontSize  = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
  const emojiRe   = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}(?:\uFE0F)?)/gu;
  const segs = [];
  let last = 0, m;
  while ((m = emojiRe.exec(text)) !== null) {
    if (m.index > last) segs.push({ type: "text", s: text.slice(last, m.index) });
    segs.push({ type: "emoji", s: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type: "text", s: text.slice(last) });
  const savedAlign = ctx.textAlign;
  let cursor = x;
  if (savedAlign === "center") {
    let tw = 0;
    for (const seg of segs) { ctx.font = seg.type === "emoji" ? `${fontSize}px Emoji` : savedFont; tw += ctx.measureText(seg.s).width; }
    cursor = x - tw / 2;
    ctx.textAlign = "left";
  }
  for (const seg of segs) {
    ctx.font = seg.type === "emoji" ? `${fontSize}px Emoji` : savedFont;
    ctx.fillText(seg.s, cursor, y);
    cursor += ctx.measureText(seg.s).width;
  }
  ctx.font      = savedFont;
  ctx.textAlign = savedAlign;
}

function renderBoard(game) {
  const CELL     = 88;
  const MARGIN   = 44;
  const INFO_W   = 280;
  const W        = CELL * 8 + MARGIN * 2 + INFO_W;
  const H        = CELL * 8 + MARGIN * 2 + 80;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // ── Fond ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d1117");
  bg.addColorStop(1, "#161b22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Titre ──
  ctx.font      = "bold 28px CF";
  ctx.fillStyle = "#f0c040";
  ctx.textAlign = "left";
  ctx.fillText("ECHECS ROYAL", MARGIN, 32);
  ctx.font      = "18px CF";
  ctx.fillStyle = "#8b949e";
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  ctx.fillText(`Tour ${game.moveCount + 1} | ${elapsed}min | ${game.bet > 0 ? "Mise $" + game.bet.toLocaleString() : "Amical"}`, MARGIN, 58);

  const bx = MARGIN, by = MARGIN + 16;

  // ── Cases ──
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const light = (r + c) % 2 === 0;
      let color   = light ? "#f0d9b5" : "#b58863";

      // Surbrillance dernier coup
      if (game.lastMove) {
        const { fromRow: fr, fromCol: fc, toRow: tr, toCol: tc } = game.lastMove;
        if ((r === fr && c === fc) || (r === tr && c === tc)) {
          color = light ? "#cdd16f" : "#aaa23a";
        }
      }
      ctx.fillStyle = color;
      ctx.fillRect(bx + c * CELL, by + r * CELL, CELL, CELL);
    }
  }

  // ── Coordonnées ──
  const files = "abcdefgh";
  ctx.font      = "bold 13px CF";
  ctx.textAlign = "center";
  for (let c = 0; c < 8; c++) {
    ctx.fillStyle = (c % 2 === 0) ? "#b58863" : "#f0d9b5";
    ctx.fillText(files[c], bx + c * CELL + CELL / 2, by + 8 * CELL + 16);
  }
  ctx.textAlign = "right";
  for (let r = 0; r < 8; r++) {
    ctx.fillStyle = (r % 2 === 0) ? "#f0d9b5" : "#b58863";
    ctx.fillText(String(8 - r), bx - 6, by + r * CELL + CELL / 2 + 5);
  }

  // ── Pièces ──
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = game.board[r][c];
      if (!p) continue;
      const unicode = PIECE_UNICODE[p];
      ctx.font      = `${CELL * 0.72}px Emoji`;
      ctx.fillStyle = "#000";
      // Ombre portée
      ctx.shadowColor   = "rgba(0,0,0,0.5)";
      ctx.shadowBlur    = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      fillMixedText(ctx, unicode, bx + c * CELL + CELL / 2, by + r * CELL + CELL / 2 + 4);
      ctx.shadowColor   = "transparent";
      ctx.shadowBlur    = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  ctx.textBaseline = "alphabetic";

  // ── Panneau info droite ──
  const ix = bx + 8 * CELL + 20;
  const iy = by;

  // Joueur Noir (haut)
  drawPlayerCard(ctx, game, "black", ix, iy, INFO_W - 20);
  // Joueur Blanc (milieu)
  drawPlayerCard(ctx, game, "white", ix, iy + 130, INFO_W - 20);

  // Historique des 8 derniers coups
  ctx.font      = "bold 14px CF";
  ctx.fillStyle = "#8b949e";
  ctx.textAlign = "left";
  ctx.fillText("HISTORIQUE", ix, iy + 285);

  const recent = game.history.slice(-10);
  recent.forEach((h, i) => {
    const isW = i % 2 === 0;
    ctx.font      = "13px CF";
    ctx.fillStyle = isW ? "#e6c87a" : "#a8c4e0";
    const num = Math.floor(i / 2) + Math.max(1, game.history.length - 9);
    ctx.fillText(`${isW ? num + "." : "   "} ${h.alg}${h.check ? "+" : ""}`, ix + (isW ? 0 : 80), iy + 305 + Math.floor(i / 2) * 22);
  });

  // Captures
  const capY = iy + 520;
  ctx.font      = "bold 13px CF";
  ctx.fillStyle = "#8b949e";
  ctx.fillText("CAPTURES :", ix, capY);
  ctx.font      = "20px Emoji";
  const capB = game.capturedBlack.map(p => PIECE_UNICODE[p]).join("");
  const capW = game.capturedWhite.map(p => PIECE_UNICODE[p]).join("");
  fillMixedText(ctx, capB.slice(0, 14), ix, capY + 22);
  fillMixedText(ctx, capW.slice(0, 14), ix, capY + 46);

  // Statut
  const statusY = H - 30;
  ctx.font      = "bold 17px CF";
  ctx.textAlign = "center";
  if (game.checkmate) {
    ctx.fillStyle = "#f85149";
    ctx.fillText(`ECHEC ET MAT — ${game.result === "white" ? game.white.name : game.black.name} gagne !`, W / 2, statusY);
  } else if (game.stalemate) {
    ctx.fillStyle = "#8b949e";
    ctx.fillText("PAT — Match nul !", W / 2, statusY);
  } else if (game.check) {
    ctx.fillStyle = "#ff7b72";
    const inCheckPlayer = game.turn === "white" ? game.white.name : game.black.name;
    ctx.fillText(`ECHEC au Roi de ${inCheckPlayer} !`, W / 2, statusY);
  } else {
    const current = game.turn === "white" ? game.white : game.black;
    ctx.fillStyle = "#58a6ff";
    ctx.fillText(`Tour des ${game.turn === "white" ? "BLANCS" : "NOIRS"} — ${current.name}${current.bot ? " [IA]" : ""}`, W / 2, statusY);
  }

  return canvas;
}

function drawPlayerCard(ctx, game, color, x, y, w) {
  const player = color === "white" ? game.white : game.black;
  const isCurrentTurn = game.turn === color && game.phase === "play";
  const h = 110;

  // Fond carte
  ctx.save();
  if (isCurrentTurn) { ctx.shadowColor = color === "white" ? "#f0c040" : "#58a6ff"; ctx.shadowBlur = 16; }
  const cardBg = ctx.createLinearGradient(x, y, x + w, y + h);
  cardBg.addColorStop(0, isCurrentTurn ? (color === "white" ? "#2d2a00" : "#001a2d") : "#1c2128");
  cardBg.addColorStop(1, "#161b22");
  ctx.fillStyle = cardBg;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = isCurrentTurn ? (color === "white" ? "#f0c040" : "#58a6ff") : "#30363d";
  ctx.lineWidth   = isCurrentTurn ? 2 : 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();

  // Icône couleur
  ctx.font      = "28px Emoji";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fillMixedText(ctx, color === "white" ? "♔" : "♚", x + 24, y + 30);
  ctx.textBaseline = "alphabetic";

  // Nom joueur
  ctx.font      = "bold 16px CF";
  ctx.fillStyle = color === "white" ? "#f0c040" : "#a8c4e0";
  ctx.textAlign = "left";
  ctx.fillText(player.name.slice(0, 18) + (player.bot ? " [IA]" : ""), x + 44, y + 26);

  // ELO
  const elo = getElo(player.id);
  ctx.font      = "13px CF";
  ctx.fillStyle = "#8b949e";
  ctx.fillText(`ELO ${elo.elo} | V:${elo.wins} D:${elo.losses}`, x + 44, y + 44);

  // Score matériel
  const material = calcMaterial(game.board, color);
  ctx.fillText(`Matériel : ${material > 0 ? "+" : ""}${material}`, x + 44, y + 62);

  // Indicateur tour
  if (isCurrentTurn) {
    ctx.font      = "bold 13px CF";
    ctx.fillStyle = color === "white" ? "#f0c040" : "#58a6ff";
    ctx.fillText("● À VOUS DE JOUER", x + 10, y + 90);
  }
}

function calcMaterial(board, color) {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const v = PIECE_VALUE[p.toLowerCase()] || 0;
      if (color === "white") score += isWhite(p) ? v : -v;
      else                   score += isBlack(p) ? v : -v;
    }
  return score;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Publish ──────────────────────────────────────────────────────────────────
async function publishState(message, game, body, withCanvas = true) {
  game.updatedAt = Date.now();
  const current  = game.turn === "white" ? game.white : game.black;

  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }

  const mentions = (!current.bot && game.phase === "play")
    ? [{ id: current.id, tag: current.name }]
    : [];

  if (withCanvas) {
    const tmpPath = path.join(os.tmpdir(), `chess_${game.id}_${Date.now()}.png`);
    try {
      const canvas = renderBoard(game);
      fs.writeFileSync(tmpPath, canvas.toBuffer("image/png"));
    } catch (e) {
      console.error("[Echecs] Canvas:", e.message);
      return message.reply({ body, mentions });
    }
    return new Promise(resolve => {
      message.reply({ body, attachment: fs.createReadStream(tmpPath), mentions }, (err, info) => {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
        if (!err && info) registerReply(game, info.messageID, current);
        if (game.phase === "ended") endGame(game);
        resolve();
      });
    });
  }

  return new Promise(resolve => {
    message.reply({ body, mentions }, (err, info) => {
      if (!err && info) registerReply(game, info.messageID, current);
      if (game.phase === "ended") endGame(game);
      resolve();
    });
  });
}

function registerReply(game, msgID, current) {
  game.replyMessageID = msgID;
  if (game.phase !== "ended" && !current.bot && global.GoatBot?.onReply) {
    global.GoatBot.onReply.set(msgID, {
      commandName: game.commandName,
      messageID:   msgID,
      author:      current.id,
      threadID:    game.threadID,
      gameKey:     game.key,
      gameID:      game.id,
    });
  }
}

// ─── Bot runner ───────────────────────────────────────────────────────────────
async function runBot(message, game, api, usersData) {
  let safety = 0;
  while (activeGames.get(game.key) === game && game.phase === "play") {
    const current = game.turn === "white" ? game.white : game.black;
    if (!current.bot) break;
    if (++safety > 300) break;

    await sleep(BOT_DELAY);
    if (activeGames.get(game.key) !== game) break;

    const move = botBestMove(game.board, game.turn, game.botDepth, game.state);
    if (!move) {
      // Checkmate or stalemate
      game.stalemate = isStalemate(game.board, game.turn, game.state);
      game.checkmate = isCheckmate(game.board, game.turn, game.state);
      game.phase     = "ended";
      game.result    = game.stalemate ? "draw" : (game.turn === "white" ? "black" : "white");
      break;
    }

    executeMove(game, move.fromRow, move.fromCol, move.toRow, move.toCol, null);

    const nextTurn = game.turn;
    const nextCurrent = nextTurn === "white" ? game.white : game.black;

    if (game.phase === "ended") {
      const winMsg = buildEndMessage(game, usersData);
      await handlePayout(game, usersData);
      await publishState(message, game, winMsg, true);
      return;
    }

    if (!nextCurrent.bot) {
      const alg  = game.history[game.history.length - 1]?.alg || "";
      const body = buildTurnText(game, `🤖 L'IA joue ${alg}. À vous !`);
      await publishState(message, game, body, true);
      return;
    }
  }
}

// ─── Exécuter un coup ─────────────────────────────────────────────────────────
function executeMove(game, fromRow, fromCol, toRow, toCol, promoChoice) {
  const piece     = game.board[fromRow][fromCol];
  const { board: nb, enPassant, captured } = applyMove(
    game.board, fromRow, fromCol, toRow, toCol, promoChoice, game.state
  );

  game.board      = nb;
  game.lastMove   = { fromRow, fromCol, toRow, toCol };
  game.moveCount++;

  // Mise à jour captures
  if (captured) {
    if (isWhite(captured)) game.capturedWhite.push(captured);
    else                   game.capturedBlack.push(captured);
  }

  // Mise à jour roque
  const pt = piece.toLowerCase();
  if (pt === "k") {
    const side = isWhite(piece) ? "white" : "black";
    game.state.castling[side].kingSide  = false;
    game.state.castling[side].queenSide = false;
  }
  if (pt === "r") {
    if (fromCol === 0) {
      const side = isWhite(piece) ? "white" : "black";
      game.state.castling[side].queenSide = false;
    }
    if (fromCol === 7) {
      const side = isWhite(piece) ? "white" : "black";
      game.state.castling[side].kingSide = false;
    }
  }
  game.state.enPassant = enPassant;

  // Notation
  const alg = moveToAlg(fromRow, fromCol, toRow, toCol, promoChoice);

  // Passer au tour suivant
  game.turn = game.turn === "white" ? "black" : "white";

  // Vérifier fin de partie
  game.check     = isInCheck(game.board, game.turn, game.state);
  game.checkmate = isCheckmate(game.board, game.turn, game.state);
  game.stalemate = isStalemate(game.board, game.turn, game.state);

  game.history.push({ alg, piece, captured, check: game.check });

  if (game.checkmate) {
    game.phase  = "ended";
    game.result = game.turn === "white" ? "black" : "white";
  } else if (game.stalemate || isInsufficientMaterial(game.board)) {
    game.phase  = "ended";
    game.result = "draw";
  }
}

function isInsufficientMaterial(board) {
  const pieces = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]) pieces.push(board[r][c]);
  if (pieces.length === 2) return true; // Roi vs Roi
  if (pieces.length === 3 && pieces.some(p => "nNbB".includes(p))) return true;
  return false;
}

// ─── Textes ───────────────────────────────────────────────────────────────────
function buildTurnText(game, extra = "") {
  const current = game.turn === "white" ? game.white : game.black;
  const lines = [];
  lines.push(`♟️ ECHECS ROYAL | Tour ${game.moveCount + 1}`);
  if (game.bet > 0) lines.push(`💰 Mise : $${game.bet.toLocaleString()}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  if (game.phase === "promotion") {
    lines.push(`👑 PROMOTION ! Choisissez la pièce :`);
    lines.push(`  dame | tour | fou | cavalier`);
  } else if (game.check) {
    lines.push(`⚠️ ECHEC au roi ${game.turn === "white" ? "blanc" : "noir"} !`);
    lines.push(`Tour : ${current.name}${current.bot ? " [IA]" : ""} (${game.turn === "white" ? "Blancs ♔" : "Noirs ♚"})`);
    lines.push(`Entrez votre coup (ex: e2e4)`);
  } else {
    lines.push(`Tour : ${current.name}${current.bot ? " [IA]" : ""} (${game.turn === "white" ? "Blancs ♔" : "Noirs ♚"})`);
    if (!current.bot) lines.push(`Entrez votre coup (ex: e2e4) ou "abandon"`);
  }
  if (extra) lines.push(`━━━━━━━━━━━━━━━━━━━━━`), lines.push(extra);
  return lines.join("\n");
}

function buildEndMessage(game, usersData) {
  const w = game.white, b = game.black;
  const lines = [];
  lines.push(`♟️ ECHECS ROYAL — PARTIE TERMINÉE`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  if (game.checkmate) {
    const winner = game.result === "white" ? w : b;
    const loser  = game.result === "white" ? b : w;
    lines.push(`🏆 ECHEC ET MAT !`);
    lines.push(`Vainqueur : ${winner.name} (${game.result === "white" ? "Blancs ♔" : "Noirs ♚"})`);
    lines.push(`Défaite   : ${loser.name}`);
  } else if (game.stalemate) {
    lines.push(`🤝 PAT — Match nul !`);
    lines.push(`${w.name} vs ${b.name}`);
  } else {
    const winner = game.result === "white" ? w : b;
    lines.push(`🏳️ Abandon — ${winner.name} remporte la partie !`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Coups joués : ${game.moveCount}`);
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  lines.push(`Durée : ${elapsed} min`);
  if (game.bet > 0) lines.push(`💰 Gain : $${(game.bet * 2).toLocaleString()}`);

  // ELO
  if (!w.bot && !b.bot) {
    const wElo = getElo(w.id), bElo = getElo(b.id);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`ELO — ${w.name}: ${wElo.elo} | ${b.name}: ${bElo.elo}`);
  }
  return lines.join("\n");
}

async function handlePayout(game, usersData) {
  if (!game.bet || !usersData) return;
  const w = game.white, b = game.black;
  const prize = game.bet * 2;
  const winner = game.result === "white" ? w : game.result === "black" ? b : null;
  if (!winner || winner.bot) {
    // Remboursement en cas de nul ou gagnant est bot
    for (const p of [w, b].filter(x => !x.bot)) {
      try {
        const ud = await usersData.get(p.id);
        await usersData.set(p.id, { money: (ud?.money || 0) + game.bet });
      } catch (_) {}
    }
  } else {
    try {
      const ud = await usersData.get(winner.id);
      await usersData.set(winner.id, { money: (ud?.money || 0) + prize });
    } catch (_) {}
  }
}

function endGame(game) {
  activeGames.delete(game.key);
  if (game.replyMessageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.delete(game.replyMessageID);
  }
}

function cleanupExpiredGames() {
  const now = Date.now();
  for (const g of activeGames.values()) {
    if (now - g.updatedAt > GAME_EXPIRE) endGame(g);
  }
}

async function getUserName(api, usersData, uid) {
  if (uid.startsWith("bot_")) return uid;
  try {
    if (usersData?.getName) return await usersData.getName(uid);
    const info = await api.getUserInfo(uid);
    return info[uid]?.name || "Joueur";
  } catch { return "Joueur"; }
}

function buildLeaderboard() {
  if (!eloData.size) return "📊 Aucune donnée ELO pour l'instant.";
  const sorted = [...eloData.entries()].sort((a, b) => b[1].elo - a[1].elo).slice(0, 10);
  const medals = ["🥇","🥈","🥉"];
  const lines  = ["♟️ CLASSEMENT ECHECS ROYAL — ELO", "━━━━━━━━━━━━━━━━━━━━━━━━━━━"];
  sorted.forEach(([id, d], i) => {
    lines.push(`${medals[i] || (i+1)+"."} ELO ${d.elo} | V:${d.wins} D:${d.losses} N:${d.draws} (${d.games} parties)`);
  });
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "echecs",
    aliases: ["chess", "chesspro", "echemat"],
    version: "1.0",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: { fr: "♟️ Echecs Royal — Jeu d'échecs complet avec IA, ELO et paris !" },
    category: "game",
    guide: {
      fr:
        `${fonts.sansSerif("♟️ ECHECS ROYAL ♟️")}\n\n` +
        `${fonts.bold("Lancer une partie :")}\n` +
        `• ${fonts.monospace("echecs bot")} : Solo vs IA (difficulté normale)\n` +
        `• ${fonts.monospace("echecs bot hard")} : Solo vs IA (difficulté élevée)\n` +
        `• ${fonts.monospace("echecs bot facile")} : Solo vs IA (facile)\n` +
        `• ${fonts.monospace("echecs @joueur")} : 1v1 humain\n` +
        `• ${fonts.monospace("echecs @joueur 5000")} : 1v1 avec 5000$ de mise\n` +
        `• ${fonts.monospace("echecs elo")} : classement ELO\n` +
        `• ${fonts.monospace("echecs stop")} : abandonner\n\n` +
        `${fonts.bold("Notation :")}\n` +
        `Tapez les coups en notation algébrique :\n` +
        `  ex: ${fonts.monospace("e2e4")} | ${fonts.monospace("d7d5")} | ${fonts.monospace("g1f3")}\n\n` +
        `${fonts.bold("Commandes en jeu :")}\n` +
        `• ${fonts.monospace("abandon")} : abandonner la partie\n` +
        `• ${fonts.monospace("nul")} : proposer match nul\n` +
        `• ${fonts.monospace("plateau")} : réafficher le plateau\n\n` +
        `${fonts.bold("Promotion du pion :")}\n` +
        `Tapez ${fonts.monospace("dame")} / ${fonts.monospace("tour")} / ${fonts.monospace("fou")} / ${fonts.monospace("cavalier")}\n\n` +
        `${fonts.bold("Niveaux IA :")}\n` +
        `  facile (profondeur 1), normale (3), hard (4)`
    }
  },

  onStart: async function ({ message, event, args, api, usersData, commandName }) {
    cleanupExpiredGames();
    const sub = (args[0] || "").toLowerCase();

    if (!sub || sub === "help") return message.reply(this.config.guide.fr);

    if (sub === "stop" || sub === "abandon") {
      const g = activeGames.get(event.threadID);
      if (!g || !( g.white.id === event.senderID || g.black.id === event.senderID)) {
        return message.reply(fonts.bold("❌ Aucune partie en cours pour vous."));
      }
      const resColor = g.white.id === event.senderID ? "black" : "white";
      g.result = resColor;
      g.phase  = "ended";
      if (g.bet > 0) await handlePayout(g, usersData);
      const winner = resColor === "white" ? g.white : g.black;
      endGame(g);
      return message.reply(fonts.bold(`🏳️ Abandon. ${winner.name} remporte la partie !`));
    }

    if (sub === "elo") return message.reply(buildLeaderboard());

    if (activeGames.has(event.threadID)) {
      return message.reply(fonts.bold("❌ Une partie est déjà en cours ici ! Tapez 'echecs stop' d'abord."));
    }

    const senderID  = event.senderID;
    const myName    = await getUserName(api, usersData, senderID);
    let betAmount   = 0;
    const betArg    = args.find(a => /^\d+$/.test(a) && parseInt(a) > 0);
    if (betArg) betAmount = parseInt(betArg);

    let white, black, botDepth = 3;

    if (sub === "bot" || sub === "bots") {
      // Difficulté
      if (args.includes("hard") || args.includes("difficile")) botDepth = 4;
      if (args.includes("facile") || args.includes("easy"))    botDepth = 1;

      // Choix couleur aléatoire
      const playerIsWhite = Math.random() < 0.5;
      const botID = `bot_${Date.now()}`;
      white = playerIsWhite
        ? { id: senderID, name: myName, bot: false }
        : { id: botID, name: `IA Niv.${botDepth}`, bot: true };
      black = playerIsWhite
        ? { id: botID, name: `IA Niv.${botDepth}`, bot: true }
        : { id: senderID, name: myName, bot: false };
      betAmount = 0; // Pas de mise contre bot

    } else {
      // 1v1 humain
      const mentionedIDs = Object.keys(event.mentions || {}).filter(id => id !== senderID);
      if (!mentionedIDs.length) return message.reply(this.config.guide.fr);

      const oppID   = mentionedIDs[0];
      const oppName = await getUserName(api, usersData, oppID);

      if (betAmount > 0) {
        for (const [uid, name] of [[senderID, myName], [oppID, oppName]]) {
          const ud = await usersData.get(uid);
          if ((ud?.money || 0) < betAmount) {
            return message.reply(fonts.bold(`💸 ${name} n'a pas assez d'argent !\nNécessaire : $${betAmount.toLocaleString()} | Balance : $${(ud?.money||0).toLocaleString()}`));
          }
        }
        for (const uid of [senderID, oppID]) {
          const ud = await usersData.get(uid);
          await usersData.set(uid, { money: (ud?.money || 0) - betAmount });
        }
      }

      // Qui joue les blancs ?
      const callerIsWhite = Math.random() < 0.5;
      white = callerIsWhite ? { id: senderID, name: myName, bot: false } : { id: oppID, name: oppName, bot: false };
      black = callerIsWhite ? { id: oppID, name: oppName, bot: false } : { id: senderID, name: myName, bot: false };
    }

    const game = createGame(event.threadID, white, black, betAmount, commandName, botDepth);
    game.usersData = usersData;
    activeGames.set(game.key, game);

    const betInfo = betAmount > 0 ? `\n💰 Mise : $${betAmount.toLocaleString()} — Gain potentiel : $${(betAmount * 2).toLocaleString()}` : "";
    const colorInfo = `\n♔ Blancs : ${white.name}${white.bot?" [IA]":""} | ♚ Noirs : ${black.name}${black.bot?" [IA]":""}`;
    const body = `♟️ ECHECS ROYAL démarré !${colorInfo}${betInfo}\nNotation : e2e4, d7d5, g1f3…`;

    await publishState(message, game, body, true);
    await runBot(message, game, api, usersData);
  },

  onReply: async function ({ message, event, Reply, commandName, api, usersData }) {
    cleanupExpiredGames();
    const game = activeGames.get(Reply.gameKey || Reply.threadID);
    if (!game || game.id !== Reply.gameID) return;

    if (game.replyMessageID && global.GoatBot?.onReply) {
      global.GoatBot.onReply.delete(game.replyMessageID);
    }

    if (game.phase === "ended") return;

    const senderID = event.senderID;
    const isWhitePlayer = game.white.id === senderID;
    const isBlackPlayer = game.black.id === senderID;
    if (!isWhitePlayer && !isBlackPlayer) return;

    const isPlayerTurn = (isWhitePlayer && game.turn === "white") || (isBlackPlayer && game.turn === "black");
    if (!isPlayerTurn) {
      const other = game.turn === "white" ? game.white : game.black;
      return publishState(message, game, `⏳ Ce n'est pas votre tour ! C'est à ${other.name}.`, false);
    }

    const input = (event.body || "").trim().toLowerCase();
    if (!input) return;

    // ── Stop / Abandon ──
    if (input === "stop" || input === "abandon" || input === "ff") {
      const resColor = isWhitePlayer ? "black" : "white";
      game.result = resColor;
      game.phase  = "ended";
      if (game.bet > 0) await handlePayout(game, usersData);
      const winner = resColor === "white" ? game.white : game.black;
      if (!game.white.bot && !game.black.bot) {
        updateElo(winner.id, isWhitePlayer ? game.white.id : game.black.id);
      }
      const body = buildEndMessage(game, usersData);
      await publishState(message, game, body, true);
      return;
    }

    // ── Proposition de nul ──
    if (input === "nul" || input === "draw") {
      game.result = "draw";
      game.phase  = "ended";
      if (game.bet > 0) await handlePayout(game, usersData);
      if (!game.white.bot && !game.black.bot) updateElo(game.white.id, game.black.id, true);
      endGame(game);
      return message.reply(fonts.bold(`🤝 Match nul accepté entre ${game.white.name} et ${game.black.name} !`));
    }

    // ── Réafficher le plateau ──
    if (input === "plateau" || input === "board") {
      return publishState(message, game, buildTurnText(game), true);
    }

    // ── Phase de promotion ──
    if (game.phase === "promotion" && game.promotionPending) {
      const promoMap = { dame: "Q", tour: "R", fou: "B", cavalier: "N", q: "Q", r: "R", b: "B", n: "N" };
      const chosen = promoMap[input];
      if (!chosen) return publishState(message, game, buildTurnText(game, "❌ Tapez : dame / tour / fou / cavalier"), false);

      const { fromRow, fromCol, toRow, toCol } = game.promotionPending;
      game.phase = "play";
      game.promotionPending = null;
      executeMove(game, fromRow, fromCol, toRow, toCol, chosen);

      if (game.phase === "ended") {
        if (!game.white.bot && !game.black.bot) {
          if (game.result !== "draw") updateElo(
            game.result === "white" ? game.white.id : game.black.id,
            game.result === "white" ? game.black.id : game.white.id
          );
          else updateElo(game.white.id, game.black.id, true);
        }
        await handlePayout(game, usersData);
        await publishState(message, game, buildEndMessage(game, usersData), true);
        return;
      }

      await publishState(message, game, buildTurnText(game, `✅ Pion promu en ${chosen} !`), true);
      await runBot(message, game, api, usersData);
      return;
    }

    // ── Coup normal ──
    const parsed = parseMove(input);
    if (!parsed) {
      return publishState(message, game, buildTurnText(game, `❌ Notation invalide. Ex: e2e4 | g1f3`), false);
    }

    const { fromRow, fromCol, toRow, toCol } = parsed;
    const piece = game.board[fromRow]?.[fromCol];

    // Vérifications
    if (!piece) return publishState(message, game, buildTurnText(game, "❌ Aucune pièce à cette case."), false);
    if ((game.turn === "white" && !isWhite(piece)) || (game.turn === "black" && !isBlack(piece))) {
      return publishState(message, game, buildTurnText(game, "❌ Ce n'est pas votre pièce."), false);
    }

    // Vérifier si le coup est légal
    const legal = legalMoves(game.board, game.turn, game.state);
    const isLegal = legal.some(m => m.fromRow === fromRow && m.fromCol === fromCol && m.toRow === toRow && m.toCol === toCol);
    if (!isLegal) {
      return publishState(message, game, buildTurnText(game, `❌ Coup illégal ! Vérifiez les règles ou que votre roi ne se retrouve pas en échec.`), false);
    }

    // Promotion en attente ?
    if (piece.toLowerCase() === "p" && (toRow === 0 || toRow === 7)) {
      if (!parsed.promo) {
        game.phase = "promotion";
        game.promotionPending = { fromRow, fromCol, toRow, toCol };
        return publishState(message, game, buildTurnText(game, "👑 Promotion ! Tapez : dame / tour / fou / cavalier"), false);
      }
    }

    executeMove(game, fromRow, fromCol, toRow, toCol, parsed.promo);

    if (game.phase === "ended") {
      if (!game.white.bot && !game.black.bot) {
        if (game.result !== "draw") updateElo(
          game.result === "white" ? game.white.id : game.black.id,
          game.result === "white" ? game.black.id : game.white.id
        );
        else updateElo(game.white.id, game.black.id, true);
      }
      await handlePayout(game, usersData);
      await publishState(message, game, buildEndMessage(game, usersData), true);
      return;
    }

    const alg  = game.history[game.history.length - 1]?.alg || "";
    const body = buildTurnText(game, `✅ Coup joué : ${alg}${game.check ? " — ECHEC !" : ""}`);
    await publishState(message, game, body, true);
    await runBot(message, game, api, usersData);
  }
};
