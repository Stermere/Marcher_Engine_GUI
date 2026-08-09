// Replay the Python rules trace through the JavaScript port and demand equality.
//
// Pair with tools/gen_boardops_trace.py - see that file for why this exists.
// At every node of every recorded game this checks, against the Python:
//
//   * checkWin           - is the game over
//   * checkJumpRequired  - which pieces must capture
//   * getPossibleMoves   - the exact move list, IN ORDER (the UI draws from it,
//                          and the order comes from the direction list in
//                          generateOptions, so an order difference is a real
//                          difference)
//   * updateBoard        - the resulting board and the keep-jumping flag
//   * checkJumpRequired(piece=) - the mid-chain follow-up question
//
// Usage:
//   python tools/gen_boardops_trace.py --games 1000
//   node tools/diff_boardops.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkJumpRequired, checkWin, getPossibleMoves, updateBoard,
} from '../src/engine/BoardOps.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tracePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(HERE, 'boardops_trace.jsonl');

if (!fs.existsSync(tracePath)) {
  console.error(`no trace at ${tracePath}\n`
              + `Generate one first:  python tools/gen_boardops_trace.py --games 1000`);
  process.exit(1);
}

const J = (v) => JSON.stringify(v);

let nodes = 0;
let checks = 0;
const failures = [];

function check(node, what, got, want) {
  checks++;
  if (J(got) !== J(want)) {
    failures.push({ node: nodes, what, got, want, board: node.board, player: node.player });
  }
}

const lines = fs.readFileSync(tracePath, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  const node = JSON.parse(line);
  nodes++;

  check(node, 'checkWin', checkWin(node.board, node.player), node.win);
  check(node, 'checkJumpRequired', checkJumpRequired(node.board, node.player), node.jumpRequired);
  check(node, 'getPossibleMoves', getPossibleMoves(node.board, node.player), node.moves);

  if (node.move === null) continue;

  // apply the move to our own copy and compare the result
  const board = node.board.map((r) => r.slice());
  const jumped = updateBoard(node.move[0], node.move[1], board);
  check(node, 'updateBoard.jumped', jumped, node.jumped);
  check(node, 'updateBoard.board', board, node.boardAfter);

  const follow = checkJumpRequired(board, node.player, node.move[1]);
  check(node, 'continues', jumped && follow.length > 0, node.continues);

  // stop early on the first bad node: everything after it is downstream of a
  // board we already know disagrees, and one clear failure beats a thousand
  if (failures.length) break;
}

console.log(`${nodes} nodes, ${checks} checks`);

if (failures.length) {
  const f = failures[0];
  console.log(`\nFAIL at node ${f.node}: ${f.what}`);
  console.log(`  player: ${f.player}`);
  console.log('  board:');
  for (const row of f.board) console.log('    ' + row.join(' '));
  console.log(`  python: ${J(f.want)}`);
  console.log(`  js:     ${J(f.got)}`);
  process.exit(1);
}
console.log('PASS: the JavaScript rules match the Python rules at every node.');
