// Port of the request_next_move handler in flask-server/server.py.
//
// This is the turn logic that used to live on the server: decide whether the
// human is mid multi-jump, flip the side to move, ask the engine for a move,
// keep asking while it is still jumping, and check for a win at each step. It
// runs on the main thread - the board operations are microseconds, and only the
// searches are slow enough to be worth putting in a worker.
//
// The return shape is deliberately identical to the Flask JSON response
// ({board, player, moves, searchInfo, win, book}), so App.js cannot tell which
// backend produced it and the two can be A/B'd with an env var.
//
// One thing carried over on purpose: the king test in the multi-jump guard
// below is transposed, and reads a square that has already been vacated. It is
// a pre-existing bug in server.py. It is reproduced here exactly, because a
// port and a bug fix in the same change means neither can be verified - if the
// behaviour differs from Flask, that must mean the port is wrong. Fix it
// separately, with its own test.

import { checkJumpRequired, checkWin, getPossibleMoves, updateBoard } from './BoardOps.js';
import { bitMoveToMatrix, colRowToSquare, toBitboard } from './Bitboard.js';

// Seconds the engine may think at the "master" setting. The Flask server used
// 1s; the browser engine measures 1.80x slower than the native build
// (3.06M vs 1.70M nodes/s), and there is no longer an HTTP round trip on top,
// so 2s here is a little stronger than the old site felt while still being a
// perfectly ordinary wait.
const MASTER_MAX_TIME = 2;

export const STARTING_PLAYER = 1;

/** Search depth and time budget for each difficulty. Mirrors get_difficulty. */
export function getDifficulty(difficulty) {
  let ply = 1;
  if (difficulty === 'easy') ply = 1;
  else if (difficulty === 'medium') ply = 3;
  else if (difficulty === 'hard') ply = 8;
  else if (difficulty === 'master') ply = 50;
  return { time: MASTER_MAX_TIME, ply };
}

const other = (player) => (player === 2 ? 1 : 2);

/** Element-wise compare for [col,row] pairs - `===` on arrays is identity. */
const samePos = (a, b) => a[0] === b[0] && a[1] === b[1];

/**
 * Play out one request.
 *
 * @param {object} req   {board, player, move, difficulty, book} - `move` is
 *                       [{col,row},{col,row}], with col -1 meaning "no human
 *                       move, just make the engine play".
 * @param {object} engine  something with `async search({p1,p2,p1k,p2k,player,
 *                         time,depth,forced}) -> {from,to,eval,depth,maxPly}`
 * @returns {Promise<{board,player,moves,searchInfo,win,book}>}
 */
export async function requestMove(req, engine) {
  // A COPY, not the caller's array. updateBoard mutates in place, and the array
  // handed in here is the one React is holding in state - returning it mutated
  // would mean setBoard() sees the same reference and skips the re-render. The
  // Flask backend gets this for free by going through JSON; this is the local
  // equivalent, and it keeps the two backends interchangeable.
  const board = req.board.map((row) => row.slice());
  let player = req.player;
  let book = req.book;
  const difficulty = req.difficulty;

  // [{col,row},{col,row}] -> [[col,row],[col,row]]; the Flask version got this
  // ordering from dict insertion order, which is why it is (col, row)
  const move = req.move.map((p) => [p.col, p.row]);

  // The human just jumped and the piece that landed can jump again: hand the
  // turn straight back without letting the engine move.
  //
  // Reproduced verbatim from server.py:57, transposed index and all - see the
  // header note. The short circuit matters: when there is no human move
  // (col -1) the first test is false and the board is never indexed.
  if (Math.abs(move[0][0] - move[1][0]) === 2
      && (board[move[0][0]][move[0][1]] > 2 || (move[1][1] !== 0 && move[1][1] !== 7))
      && getPossibleMoves(board, player).some(
           (item) => samePos(item[0], move[1]) && Math.abs(item[0][0] - item[1][0]) === 2)) {
    return {
      board,
      player,
      moves: getPossibleMoves(board, player),
      searchInfo: { depth: 0, depthExtended: 0, eval: 0 },
      win: 0,
      book,
    };
  }

  // a real human move means the turn passes
  if (move[0][0] !== -1) player = other(player);

  const originPlayer = player;

  let win = checkWin(board, player);
  if (win !== 0) {
    return { board, player, moves: [], searchInfo: { depth: 0, depthExtended: 0, eval: 0 }, win, book };
  }

  const { time, ply } = getDifficulty(difficulty);
  const searchInfo = { depth: 0, depthExtended: 0, eval: 0 };

  // square of a piece mid multi-jump that must continue, -1 for none
  let forced = -1;

  while (player === originPlayer) {
    const { p1, p2, p1k, p2k } = toBitboard(board);
    const res = await engine.search({
      p1, p2, p1k, p2k, player, time, depth: ply, forced,
    });

    searchInfo.depth = res.depth;
    searchInfo.depthExtended = res.maxPly;
    searchInfo.eval = res.eval;

    const [from, to] = bitMoveToMatrix(res.from, res.to);
    const jumped = updateBoard(from, to, board);

    // if that was a jump and the same piece can jump again, it must - so search
    // again from here with that square pinned
    if (jumped && checkJumpRequired(board, player, to).length > 0) {
      forced = colRowToSquare(to[0], to[1]);
      continue;
    }
    forced = -1;

    win = checkWin(board, other(player));
    if (win !== 0) {
      return { board, player: other(player), moves: [], searchInfo, win, book };
    }

    player = other(player);
  }

  return { board, player, moves: getPossibleMoves(board, player), searchInfo, win, book };
}

/** The GET /api/get_board response. */
export function newGame(startingBoard) {
  return {
    board: startingBoard,
    player: STARTING_PLAYER,
    moves: getPossibleMoves(startingBoard, STARTING_PLAYER),
  };
}
