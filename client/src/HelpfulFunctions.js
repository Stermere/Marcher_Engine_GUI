
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