import React from 'react';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';

const CheckersRules = () => {
    const theme = createTheme({
        text: {
          primary: {
            main: '#a3c4c1',
          },
          secondary: {
            main: '#b08787',
          },
        },
    });

  const rulesStyle = {
      display: 'grid',
      justifyContent: 'center',
      alignItems: 'start',
      height: '100%',
    };

  return (
    <div style={rulesStyle}>
      <div>
        <Typography variant="h6" gutterBottom style={{ color: theme.text.primary.main }}>
          Rules of Checkers:
        </Typography>
        <Typography variant="body1" gutterBottom style={{ color: theme.text.primary.main }}>
          1. Movement:
          <ul>
            <li>Pieces move diagonally forward (toward the opponent's side) one square at a time.</li>
            <li>Regular pieces cannot move backward, only forward diagonally.</li>
          </ul>
        </Typography>
        <Typography variant="body1" gutterBottom style={{ color: theme.text.primary.main }}>
          2. Jumps:
          <ul>
            <li>
              Jumps are forced. If a player has the opportunity to jump over their opponent's piece, they must take it.
            </li>
            <li>Multiple jumps can be performed in a single turn if the piece that just jumped can jump again.</li>
          </ul>
        </Typography>
        <Typography variant="body1" gutterBottom style={{ color: theme.text.primary.main }}>
          3. King Promotion:
          <ul>
            <li>
              When a regular piece reaches the last row on the opponent's side of the board, it becomes a king.
            </li>
            <li>Kings can move diagonally in both forward and backward directions.</li>
          </ul>
        </Typography>
        <Typography variant="body1" gutterBottom style={{ color: theme.text.primary.main }}>
          4. Winning:
          <ul>
            <li>
              The game ends when either of the following conditions are met:
            </li>
            <li>A player loses all of their pieces due to captures by their opponent.</li>
            <li>A player has no legal moves left for any of their pieces.</li>

          </ul>
        </Typography>
      </div>
    </div>
  );
};

export default CheckersRules;
