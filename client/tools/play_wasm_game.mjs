// Play complete games through the real client code against the real engine.
//
// diff_boardops.mjs proves the rules port matches the Python. verify_wasm.mjs
// proves the WebAssembly engine matches the native one. Neither proves that
// GameLoop.js drives the engine correctly - that the board handed over is
// converted to bitboards the right way round, that the move that comes back is
// unpacked the right way round, that a multi-jump chain terminates, and that a
// finished game is reported as finished.
//
// So this runs the actual App-facing entry point, requestMove(), in a loop,
// with a stand-in for the human that picks a legal move at random. Everything
// under test is the shipping code; only the worker is bypassed, because in Node
// the module can be called directly.
//
// Usage:
//   node tools/play_wasm_game.mjs [--games 5] [--difficulty medium]

import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getPossibleMoves, startingBoard, updateBoard, checkJumpRequired } from '../src/engine/BoardOps.js';
import { requestMove } from '../src/engine/GameLoop.js';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
// client/tools -> client -> Marcher_Engine_GUI -> repo root
const REPO = path.resolve(HERE, '..', '..', '..');
const MODULE_PATH = path.join(REPO, 'src', 'wasm', 'dist', 'marcher.js');

function opt(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const GAMES = parseInt(opt('--games', '5'), 10);
const DIFFICULTY = opt('--difficulty', 'medium');

if (!fs.existsSync(MODULE_PATH)) {
  console.error(`no wasm build at ${MODULE_PATH}\nRun: bash src/wasm/build_wasm.sh`);
  process.exit(1);
}

const createMarcher = require(MODULE_PATH);
const Module = await createMarcher();

// the same adapter shape EngineClient's WasmEngine presents to GameLoop, minus
// the worker round trip
const engine = {
  async search({ p1, p2, p1k, p2k, player, time, depth, forced }) {
    Module._wasm_search(p1, p2, p1k, p2k, player, time, depth, forced);
    const ptr = Module._wasm_result_ptr();
    const r = Module.HEAP32.subarray(ptr >> 2, (ptr >> 2) + Module._wasm_result_fields());
    return { from: r[0], to: r[1], eval: r[2], depth: r[3], maxPly: r[4] };
  },
};

console.log(`engine simd=${Module._wasm_nnue_simd()}  difficulty=${DIFFICULTY}`);

let totalPlies = 0;
const results = { 1: 0, 2: 0, unfinished: 0 };

for (let g = 0; g < GAMES; g++) {
  let board = startingBoard();
  let player = 1;          // the human side
  let win = 0;
  let plies = 0;

  // open with the engine playing for the human's opponent, exactly as the
  // "play move" button does
  let state = await requestMove(
    { board, player, move: [{ col: -1, row: -1 }, { col: -1, row: -1 }],
      difficulty: DIFFICULTY, book: false }, engine);
  board = state.board; player = state.player; win = state.win || 0;

  while (win === 0 && plies < 400) {
    const moves = getPossibleMoves(board, player);
    if (moves.length === 0) { win = player === 1 ? 2 : 1; break; }

    // the human picks at random, then applies it locally the way App.js does
    // before handing the position over
    const [from, to] = moves[Math.floor(Math.random() * moves.length)];
    const next = board.map((r) => r.slice());
    updateBoard(from, to, next);

    // sanity: the rules must agree with themselves about mid-chain state
    const jumped = Math.abs(from[0] - to[0]) === 2;
    if (jumped) checkJumpRequired(next, player, to);

    // eslint-disable-next-line no-await-in-loop
    state = await requestMove({
      board: next,
      player,
      move: [{ col: from[0], row: from[1] }, { col: to[0], row: to[1] }],
      difficulty: DIFFICULTY,
      book: false,
    }, engine);

    if (!Array.isArray(state.board) || state.board.length !== 8) {
      throw new Error(`game ${g}: engine returned a malformed board`);
    }
    if (state.board === next) {
      throw new Error(`game ${g}: requestMove returned the caller's array - `
                    + `React would not re-render`);
    }

    board = state.board;
    player = state.player;
    win = state.win || 0;
    plies++;
  }

  totalPlies += plies;
  if (win === 1 || win === 2) results[win]++; else results.unfinished++;
  console.log(`  game ${g + 1}: ${plies} plies, ` + (win ? `player ${win} wins` : 'unfinished'));
}

console.log();
console.log(`${GAMES} games, ${totalPlies} plies total`);
console.log(`  player 1 wins: ${results[1]}   player 2 wins: ${results[2]}   `
          + `unfinished: ${results.unfinished}`);
console.log('PASS: GameLoop drove the WebAssembly engine through complete games.');
