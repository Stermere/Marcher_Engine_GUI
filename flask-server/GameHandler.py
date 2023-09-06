import sys
import os
from BoardOpperations import Board, check_jump_required, update_board, check_win, check_tie, generate_all_options
from BitboardConverter import convert_bit_move, convert_matrix_move, convert_to_bitboard, convert_to_matrix
import search_engine

# handles the move generation and the engine that acts as the Computer Player
class GameHandler:
    def __init__ (self):
        pass
        
    def get_move(self, board, player, p_time, ply):
        p1, p2, p1k, p2k = convert_to_bitboard(board)
        results = search_engine.search_position(p1, p2, p1k, p2k, player, p_time, ply)

        depth = results[-1][0]
        depth_extended = results[-1][1]
        leafs = results[-1][2]
        eval_ = results[-1][4]
        hashes = results[-1][3]
        best_move = convert_bit_move(results[-2])

        return best_move, depth, depth_extended, leafs, eval_, hashes

    def get_possible_moves(self, board, player):
        jump_required = check_jump_required(board, player)
        
        return generate_all_options(board, player, jump_required)
        
    def get_start_board(self):
        return Board().board
        
    