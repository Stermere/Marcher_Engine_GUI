import sys
import os
import random
from BoardOpperations import Board, check_jump_required, update_board, check_win, check_tie, generate_all_options
from BitboardConverter import convert_bit_move, convert_matrix_move, convert_to_bitboard, convert_to_matrix

# engine build directory for the running python version (falls back to any local pyd)
_build_dir = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'build',
    f'lib.win-amd64-cpython-{sys.version_info.major}{sys.version_info.minor}'))
sys.path.insert(0, _build_dir)

# tell the engine where the endgame tablebase lives (local db/ next to the server
# wins, otherwise the repo-root db/); must be set before the first search
if 'CHECKERS_DB_DIR' not in os.environ:
    _db_local = os.path.abspath(os.path.join(os.path.dirname(__file__), 'db'))
    _db_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'db'))
    os.environ['CHECKERS_DB_DIR'] = _db_local if os.path.isdir(_db_local) else _db_root

import search_engine

# handles the move generation and the engine that acts as the Computer Player
class GameHandler:
    def __init__ (self):
        pass

    def get_move(self, board, player, p_time, ply, book, forced=-1):
        """forced: square index (0-63) of a piece mid multi-jump that must continue
        jumping, or -1 for a normal position."""
        p1, p2, p1k, p2k = convert_to_bitboard(board)

        if book and forced < 0:
            best_move = self.get_book_move(board)
            if best_move != None:
                depth = "book"
                depth_extended = "?"
                leafs = 0
                eval_ = 0
                hashes = 0

                return best_move, depth, depth_extended, leafs, eval_, hashes, True

        results = search_engine.search_position(p1, p2, p1k, p2k, player, p_time, ply, forced)
        depth = results[-1][0]
        depth_extended = results[-1][1]
        leafs = results[-1][2]
        eval_ = results[-1][4]
        hashes = results[-1][3]
        best_move = convert_bit_move(results[-2])
        return best_move, depth, depth_extended, leafs, eval_, hashes, False

    def get_possible_moves(self, board, player):
        jump_required = check_jump_required(board, player)
        
        return generate_all_options(board, player, jump_required)
        
    def get_start_board(self):
        return Board().board
    
    def get_book_move(self, board):
        # Convert the board into engine bitboard representation.
        p1, p2, p1k, p2k = convert_to_bitboard(board)
        # Generate a key in the same format as the book file.
        key = f"{p1:016X}_{p2:016X}_{p1k:016X}_{p2k:016X}"
        # Open the book file and look for a matching key.
        try:
            with open("book_moves.txt", "r") as f:
                for line in f:
                    tokens = line.strip().split()
                    if tokens and tokens[0] == key:
                        chosen_move_str = random.choice(tokens[1:])
                        move_int = int(chosen_move_str, 16)

                        start = move_int >> 8
                        end = move_int & 0xff

                        print(start, end)
                        # Convert the engine move string to your internal representation.
                        return convert_bit_move((start, end))
            # If no matching position was found, return None.
            return None
        except Exception as e:
            print(f"Error reading book file: {e}")
            return None