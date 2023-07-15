from flask import Flask, request, jsonify
from GameHandler import GameHandler
from BoardOpperations import update_board, check_jump_required

app = Flask(__name__)

gameHandler = GameHandler()


@app.route("/get_board", methods=['GET'])
def get_board():
    return jsonify({"board": gameHandler.get_start_board(),
                    "player": 1,
                    "moves": gameHandler.get_possible_moves(gameHandler.get_start_board(), 1)})

# takes a board, player, and difficulty and returns the best move and a list of all possible moves 
# that the player could make
@app.route('/request_move', methods=['POST'])
def request_next_move():
    data = request.get_json()

    board = data['board']
    player = data['player']
    move = list(list(item.values()) for item in data['move'])
    difficulty = data['difficulty']
    original_player = player

    # if the player just jumped, check if they can jump again
    if abs(move[0][0] - move[1][0]) == 2 and check_jump_required(board, player, piece=move[1]):
        print("jump again")
        return jsonify({'board': board, 'player': player, 'moves': gameHandler.get_possible_moves(board, player)})

    # update the player to the bot
    player = 1 if player == 2 else 2

    time = 0.1
    if difficulty == "easy":
        ply = 3
    elif difficulty == "medium":
        ply = 6
    elif difficulty == "hard":
        ply = 8
    elif difficulty == "master":
        ply = 30
        time = 1.0

    # get the move from the engine
    while player == (1 if original_player == 2 else 2):
        best_move, depth, leafs, eval_, hashes = gameHandler.get_move(board, player, time, ply)

        # update the board with the move
        jumped = update_board(best_move[0], best_move[1], board)

        # if the player just jumped, check if they can jump again and if so return the board
        if jumped and check_jump_required(board, player, piece=best_move[1]):
            continue

        # update the player to the human
        player = 1 if player == 2 else 2
        possible_moves = gameHandler.get_possible_moves(board, player)

    return jsonify({'board': board, 'player': player, 'moves': possible_moves})

# Run Server
if __name__ == '__main__':
    app.run(debug=True)