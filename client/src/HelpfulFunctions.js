
// Converts a piece to a player
export function convert_to_player_type(piece) {
    if (piece > 2) {
        return piece - 2;
    }
    return piece;
}

// Checks if given a start square and end square if the move is valid
export function is_valid_move(startSquare, endSquare, moveList) {
    if (endSquare === null || startSquare === null) {
        return false;
    }

    // Check if the move is in the list of valid moves
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] === startSquare.col && moveList[i][0][1] === startSquare.row &&
            moveList[i][1][0] === endSquare.col && moveList[i][1][1] === endSquare.row) {
                return true;
            }
    }

    return false;
}

// Checks if a start square is the only option for a move
export function is_only_option(startSquare, moveList) {
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] !== startSquare.col || moveList[i][0][1] !== startSquare.row) {
            return false;
        }
    }

    return true;
}

// Checks if the start square is a valid start square
export function is_valid_start_square(startSquare, moveList) {
    for (let i = 0; i < moveList.length; i++) {
        if (moveList[i][0][0] === startSquare.col && moveList[i][0][1] === startSquare.row) {
            return true;
        }
    }

    return false;
}

// Returns a formatted string of the engine info
export function parse_engine_info(info) {
    if (info === undefined) {
        return "Depth: 0/0 Score: 0"
    }

    return "Depth: " + info["depth"] + "/" + info["depthExtended"] + " Score: " + info["eval"]
}

// Returns a color darkened by a percentage
export function darken_color(color, percent) {
    let num = parseInt(color.slice(1), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) - amt;
    let G = (num >> 8 & 0x00FF) - amt;
    let B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
}