// Port of flask-server/BoardOpperations.py.
//
// These are the rules of checkers as the UI needs them: which moves exist,
// what a move does to the board, and whether the game is over. The engine has
// its own bitboard implementation of the same rules; this one exists because
// the UI works in (col, row) pairs and needs a move list to draw indicators
// from. Keeping it a LITERAL port - same iteration order, same edge cases,
// including the ones that look like accidents - is what lets
// tools/diff_boardops.mjs check it against the Python by replaying real games.
//
// Four things a natural-looking JS translation gets wrong, all of which the
// differential test catches, and all of which are deliberate here:
//
//   1. `check_jump_required` returns a LIST of squares, and GameHandler passes
//      it straight in as the `only_jump` flag. `[]` is falsy in Python and
//      TRUTHY in JS - so a direct port silently makes every move list
//      jump-only, forever. Callers here must use `.length > 0`.
//   2. Moves are (col, row), not (row, col), because the Flask layer built them
//      from a dict whose insertion order was {'col':..., 'row':...}.
//   3. `updateBoard` reads the piece value BEFORE promotion is applied, which
//      is what makes "a man that just promoted stops jumping" come out right.
//   4. `generateOptions`' direction list order decides the order of the move
//      list, so it is preserved exactly.

/** Do these two pieces belong to opposite players? */
export function isEnemyPiece(piece, other) {
  if ((piece === 1 || piece === 3) && (other === 2 || other === 4)) return true;
  if ((piece === 2 || piece === 4) && (other === 1 || other === 3)) return true;
  return false;
}

/**
 * Destination squares for the piece at [col, row].
 *
 * Returns [col, row] pairs. With onlyJump, quiet moves are skipped and only
 * captures are produced - note the Python uses if/elif, so an empty adjacent
 * square is never also tested as an enemy.
 */
export function generateOptions(piecePos, board, onlyJump = false) {
  const out = [];
  const [px, py] = piecePos;
  const piece = board[py][px];
  if (piece === 0) return out;

  // direction order is load-bearing: it fixes the order of the move list
  let options;
  if (piece === 1) options = [[-1, -1], [1, -1]];
  else if (piece === 2) options = [[-1, 1], [1, 1]];
  else options = [[-1, 1], [1, -1], [-1, -1], [1, 1]];

  for (const [dx, dy] of options) {
    let nx = px + dx;
    let ny = py + dy;
    if (nx < 0 || ny < 0 || nx > 7 || ny > 7) continue;

    if (!onlyJump && board[ny][nx] === 0) {
      out.push([nx, ny]);
    } else if (isEnemyPiece(piece, board[ny][nx])) {
      nx += dx;
      ny += dy;
      if (nx < 0 || ny < 0 || nx > 7 || ny > 7) continue;
      if (board[ny][nx] === 0) out.push([nx, ny]);
    }
  }
  return out;
}

/** Every move `state` can make, as [[col,row],[col,row]] pairs. */
export function generateAllOptions(board, state, onlyJump) {
  const king = state === 2 ? 4 : 3;
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = board[y][x];
      if (cell === state || cell === king) {
        for (const m of generateOptions([x, y], board, onlyJump)) {
          moves.push([[x, y], m]);
        }
      }
    }
  }
  return moves;
}

/**
 * Apply a move in place. Returns true if the mover should keep jumping.
 *
 * The `piece` value is captured BEFORE the promotion writes below, so the
 * return expression means "this was a jump, and it was not a man landing on
 * its promotion row" - a man that promotes ends its turn even mid-chain.
 * Reordering these lines breaks multi-jumps in a way that only shows up on
 * specific boards.
 */
export function updateBoard(piecePos, newPos, board) {
  const [px, py] = piecePos;
  const [nx, ny] = newPos;

  board[ny][nx] = board[py][px];
  board[py][px] = 0;
  const piece = board[ny][nx];

  if (piece === 1 && ny === 0) board[ny][nx] = 3;
  if (piece === 2 && ny === 7) board[ny][nx] = 4;

  const jumpDist = px - nx;
  if (jumpDist === 2 || jumpDist === -2) {
    const jx = (px + nx) / 2;
    const jy = (py + ny) / 2;
    board[jy][jx] = 0;
    return !(piece <= 2 && (ny === 0 || ny === 7));
  }
  return false;
}

/**
 * With `piece`, the capture destinations available to that one piece.
 * Without it, the [col,row] of every piece of `player` that has a capture.
 *
 * Both return ARRAYS. Callers must test `.length`, never truthiness - see the
 * header note.
 */
export function checkJumpRequired(board, player, piece = null) {
  if (piece !== null) {
    return generateOptions(piece, board, true);
  }
  const king = player === 1 ? 3 : 4;
  const required = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = board[y][x];
      if (cell === player || cell === king) {
        if (generateOptions([x, y], board, true).length > 0) required.push([x, y]);
      }
    }
  }
  return required;
}

/**
 * 0 if the game continues, otherwise the winning player.
 *
 * `nextPlayer` is whoever is about to move: if they have no move at all, they
 * have lost. Note this asks whether any move exists, not whether a legal move
 * exists under the capture-is-mandatory rule - same as the Python.
 */
export function checkWin(board, nextPlayer) {
  let p1 = false;
  let p2 = false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = board[y][x];
      if (cell === 1 || cell === 3) {
        if (generateOptions([x, y], board).length > 0) p1 = true;
      } else if (cell === 2 || cell === 4) {
        if (generateOptions([x, y], board).length > 0) p2 = true;
      }
    }
  }
  if (nextPlayer === 1 && !p1) return 2;
  if (nextPlayer === 2 && !p2) return 1;
  return 0;
}

/**
 * The move list the UI draws from: captures only when a capture exists.
 * Port of GameHandler.get_possible_moves, including that the list it computes
 * is used as a boolean - hence the explicit `.length > 0`.
 */
export function getPossibleMoves(board, player) {
  const jumpRequired = checkJumpRequired(board, player);
  return generateAllOptions(board, player, jumpRequired.length > 0);
}

/** The starting position, from BoardOpperations.Board. */
export function startingBoard() {
  return [
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
  ];
}
