"""Record what the Python rules do, so the JavaScript port can be held to it.

src/engine/BoardOps.js is a hand port of flask-server/BoardOpperations.py, and a
hand port of game rules is exactly the kind of change that looks finished and is
not: the failures are things like an empty list being falsy in one language and
truthy in the other, which do not show up until a specific board appears.

So instead of trusting the reading, this plays random games through the Python
and writes down every intermediate answer. diff_boardops.mjs replays the same
games through the JavaScript and demands the same answers at every node.

The driver mirrors the turn structure in server.py - including that a jumping
piece keeps the turn, and that a man promoting ends the chain - so the trace
covers multi-jump chains and promotions rather than only quiet moves.

Usage:
    python tools/gen_boardops_trace.py --games 1000 --out trace.jsonl
"""

import argparse
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', 'flask-server')))

from BoardOpperations import (  # noqa: E402
    Board, check_jump_required, check_win, generate_all_options,
    generate_options, update_board,
)


def possible_moves(board, player):
    """GameHandler.get_possible_moves, including its list-as-flag call."""
    jump_required = check_jump_required(board, player)
    return generate_all_options(board, player, jump_required)


def play_game(rng, max_plies=300):
    """Yield one record per node of one random game."""
    board = Board().board
    player = 1

    for _ in range(max_plies):
        win = check_win(board, player)
        jump_required = check_jump_required(board, player)
        moves = possible_moves(board, player)

        record = {
            "board": [row[:] for row in board],
            "player": player,
            "win": win,
            "jumpRequired": [list(p) for p in jump_required],
            "moves": [[list(m[0]), list(m[1])] for m in moves],
        }

        if win != 0 or not moves:
            record["move"] = None
            yield record
            return

        move = rng.choice(moves)
        jumped = update_board(move[0], move[1], board)
        # the same follow-up question server.py asks, with the same
        # piece= argument, so the JS port's handling of it is covered
        continues = bool(jumped and check_jump_required(board, player, piece=move[1]))

        record["move"] = [list(move[0]), list(move[1])]
        record["jumped"] = bool(jumped)
        record["continues"] = continues
        record["boardAfter"] = [row[:] for row in board]
        yield record

        if not continues:
            player = 2 if player == 1 else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=20260809)
    ap.add_argument("--out", default=os.path.join(HERE, "boardops_trace.jsonl"))
    args = ap.parse_args()

    rng = random.Random(args.seed)
    nodes = 0
    with open(args.out, "w") as f:
        for g in range(args.games):
            for record in play_game(rng):
                f.write(json.dumps(record, separators=(",", ":")) + "\n")
                nodes += 1

    print(f"{args.games} games, {nodes} nodes -> {args.out}")


if __name__ == "__main__":
    main()
