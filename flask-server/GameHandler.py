import sys
import os
from BoardOpperations import Board, check_jump_required, update_board, check_win, check_tie, generate_all_options
from BitboardConverter import convert_bit_move, convert_matrix_move, convert_to_bitboard, convert_to_matrix


sys.path.insert(0, os.getcwd() + "/flask-server")
import search_engine

# handles the move generation and the engine that acts as the Computer Player
class GameHandler:
    def __init__ (self):
        pass
        
    def get_move(self, board, player, p_time, ply):
        p1, p2, p1k, p2k = convert_to_bitboard(board)
        results = search_engine.search_position(p1, p2, p1k, p2k, player, p_time, ply)

        depth = results[-1][0]
        leafs = results[-1][1]
        eval_ = results[-1][3]
        hashes = results[-1][2]
        best_move = convert_bit_move(results[-2])

        return best_move, depth, leafs, eval_, hashes

    def get_possible_moves(self, board, player):
        jump_required = check_jump_required(board, player)
        
        if jump_required:
            return jump_required
        else:
            return generate_all_options(board, player, False)
        
    def get_start_board(self):
        return Board().board
        
    

    