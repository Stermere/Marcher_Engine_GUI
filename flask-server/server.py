from flask import Flask, request, jsonify, render_template, send_from_directory
from GameHandler import GameHandler
from BoardOpperations import update_board, check_jump_required, check_win
from flask_cors import CORS
import os

STARTING_PLAYER = 1
MASTER_MAX_TIME = 1 # seconds

app = Flask(__name__, static_folder='../client/build', template_folder='../client/build')
CORS(app)

gameHandler = GameHandler()

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/get_board", methods=['GET'])
def get_board():
    return jsonify({"board": gameHandler.get_start_board(),
                    "player": STARTING_PLAYER,
                    "moves": gameHandler.get_possible_moves(gameHandler.get_start_board(), STARTING_PLAYER)})

# Takes a board, player, and difficulty and returns the best move and a list of all possible moves 
# that the player could make
@app.route('/api/request_move', methods=['POST'])
def request_next_move():
    data = request.get_json()

    board = data['board']
    player = data['player']
    move = tuple(tuple(item.values()) for item in data['move'])
    difficulty = data['difficulty']
    original_player = player

    if abs(move[0][0] - move[1][0]) == 2 and any([(item[0] == move[1] and abs(item[0][0] - item[1][0]) == 2) for item in gameHandler.get_possible_moves(board, player)]):
        return jsonify({'board': board, 'player': player, 'moves': gameHandler.get_possible_moves(board, player)})


    # update the player to the bot
    player = 1 if player == 2 else 2

    # check if this is a lost game
    win = check_win(board, player)
    if win != 0:
        return jsonify({'board': board, 'player': player, 'moves': [], 'win': win})

    time = MASTER_MAX_TIME
    if difficulty == "easy":
        ply = 1
    elif difficulty == "medium":
        ply = 3
    elif difficulty == "hard":
        ply = 8
    elif difficulty == "master":
        ply = 50

    search_info = {'depth': 0, 'depthExtended': 0, 'eval': 0}

    # get the move from the engine
    while player == (1 if original_player == 2 else 2):
        best_move, depth, depth_extended, leafs, eval_, hashes = gameHandler.get_move(board, player, time, ply)
        search_info['depth'] = depth
        search_info['depthExtended'] = depth_extended
        search_info['eval'] = eval_



        # update the board with the move
        jumped = update_board(best_move[0], best_move[1], board)

        # if the player just jumped, check if they can jump again and if so make another move
        if jumped and check_jump_required(board, player, piece=best_move[1]):
            continue

        # check if this is a lost game
        win = check_win(board, 1 if player == 2 else 2)
        if win != 0:
            return jsonify({'board': board, 'player': 1 if player == 2 else 2, 'moves': [], 'searchInfo': search_info, 'win': win})


        # update the player to the human
        player = 1 if player == 2 else 2
        possible_moves = gameHandler.get_possible_moves(board, player)

    return jsonify({'board': board, 'player': player, 'moves': possible_moves, 'searchInfo': search_info, 'win': win})

# Run Server
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', threaded=True)