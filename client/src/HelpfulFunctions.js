
// converts a piece to a player
export function convert_to_player_type(piece) {
    if (piece > 2) {
        return piece - 2;
    }
    return piece;
}