
// converts a piece to a player
export function convert_to_player_type(piece) {
    if (piece > 2) {
        return piece - 2;
    }
    return piece;
}

// checks if given a start square and end square if the move is valid
export function is_valid_move(startSquare, endSquare, moveList) {
    if (endSquare === null || startSquare === null) {
        return false;
    }

    // check if the move is in the list of valid moves
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] === startSquare.col && moveList[i][0][1] === startSquare.row &&
            moveList[i][1][0] === endSquare.col && moveList[i][1][1] === endSquare.row) {
                return true;
            }
    }

    return false;
}

// checks if a start square is the only option for a move
export function is_only_option(startSquare, moveList) {
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] !== startSquare.col || moveList[i][0][1] !== startSquare.row) {
            return false;
        }
    }

    return true;
}

// checks if the start square is a valid start square
export function is_valid_start_square(startSquare, moveList) {
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] === startSquare.col && moveList[i][0][1] === startSquare.row) {
            return true;
        }
    }

    return false;
}