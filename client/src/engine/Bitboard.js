// Port of flask-server/BitboardConverter.py.
//
// The engine works on four 64 bit masks; the UI works on an 8x8 array of small
// integers. This is the only place that knows how to get between them.
//
// BigInt is not optional here. Square 63 is a real square, and a JS Number
// starts losing integer precision at 2^53, so `1 << 63` in plain arithmetic is
// simply wrong. Every mask in this file is a BigInt, and they cross into the
// worker as BigInts too (structured clone handles them, and the wasm build is
// compiled with -sWASM_BIGINT so u64 parameters take them directly).

// Cell values, matching the Python and the C: 0 empty, 1/2 men, 3/4 kings.
export const EMPTY = 0;
export const P1_MAN = 1;
export const P2_MAN = 2;
export const P1_KING = 3;
export const P2_KING = 4;

/**
 * 8x8 board[row][col] -> { p1, p2, p1k, p2k } as BigInts.
 *
 * Square index is row * 8 + col, which is the order the Python loop produces
 * and the order the C bit indices assume.
 */
export function toBitboard(board) {
  let p1 = 0n, p2 = 0n, p1k = 0n, p2k = 0n;
  let sq = 0n;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const item = board[row][col];
      const bit = 1n << sq;
      if (item === P2_KING) p2k |= bit;
      else if (item === P1_KING) p1k |= bit;
      else if (item === P2_MAN) p2 |= bit;
      else if (item === P1_MAN) p1 |= bit;
      sq++;
    }
  }
  return { p1, p2, p1k, p2k };
}

/** A square index 0..63 as the UI's { col, row } pair. */
export function squareToColRow(sq) {
  return [sq % 8, Math.floor(sq / 8)];
}

/**
 * The engine's packed move -> [[col,row],[col,row]].
 * Mirror of convert_bit_move: the UI's move tuples are (col, row), not
 * (row, col), and every consumer in App.js indexes them that way.
 */
export function bitMoveToMatrix(from, to) {
  return [squareToColRow(from), squareToColRow(to)];
}

/** [col,row] -> square index, for handing a forced multi-jump square back. */
export function colRowToSquare(col, row) {
  return col + row * 8;
}

/** Total pieces on the board - used to decide when the tablebase starts mattering. */
export function pieceCount(board) {
  let n = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) if (board[row][col] !== EMPTY) n++;
  }
  return n;
}
