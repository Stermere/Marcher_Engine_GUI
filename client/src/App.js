import React, { useState, useEffect } from 'react' // import the React library
import { Paper, Box } from '@mui/material';
import { convert_to_player_type, is_valid_move } from './HelpfulFunctions.js'
import './PieceAnimation.css'

function App() {
  const player1 = 1
  const player2 = 2
  
  const [startSquare, setStartSquare] = useState(null)
  const [endSquare, setEndSquare] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState([])
  const [board, setBoard] = useState([]);
  const [moveTable, setMoveTable] = useState([]);
  const [difficulty, setDifficulty] = useState('master');

  document.body.style.backgroundColor = "grey";

  // setup the game to be new when the page loads
  useEffect(() => {
    fetch('/get_board')
      .then(response => response.json())
      .then(data => {setBoard(data.board);
                    setMoveTable(data.moves);
                    setCurrentPlayer(data.player);
      })
      .catch(error => console.error('Error:', error));
  }, []);


  const handleCellClick = (row, col) => {
    if (convert_to_player_type(board[row][col]) === currentPlayer) {
      setStartSquare({ col, row });
    }
    else if (startSquare !== null && is_valid_move(startSquare, { row, col }, moveTable)) {
      setEndSquare({ col, row });
    }
  };

  useEffect(() => {
    // if we have a startSquare and endSquare, then we have a move
    // lets make the move and request the server to update the board
    if (startSquare !== null && endSquare !== null) {
      // update the board
      board[endSquare.row][endSquare.col] = board[startSquare.row][startSquare.col];
      board[startSquare.row][startSquare.col] = 0;
      if (Math.abs(startSquare.row - endSquare.row) === 2) {
        const jumpedRow = (startSquare.row + endSquare.row) / 2;
        const jumpedCol = (startSquare.col + endSquare.col) / 2;
        board[jumpedRow][jumpedCol] = 0;
      }
      if (endSquare.row === 0 && board[endSquare.row][endSquare.col] === player1) {
        board[endSquare.row][endSquare.col] = 3;
      }
      if (endSquare.row === 7 && board[endSquare.row][endSquare.col] === player2) {
        board[endSquare.row][endSquare.col] = 4;
      }



      setMoveTable([]);


      // send the move to the server along with the current player and the board
      fetch('/request_move', {
        method: 'POST',
        body: JSON.stringify({
          board: board,
          player: currentPlayer,
          move: [startSquare, endSquare],
          difficulty: difficulty
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        // Handle the response data here
        setBoard(data.board);
        setCurrentPlayer(data.player);
        setMoveTable(data.moves);
      })
      .catch(error => {
        // Handle any errors that occurred during the request
        console.error('Error:', error);
      });

      // Reset startSquare and endSquare after the move
      setStartSquare(null);
      setEndSquare(null);

    }
  }, [startSquare, endSquare]);

  const renderMoveIndicator = (rowIndex, colIndex, color) => {
    const shouldRenderCircle = is_valid_move(startSquare, { row:rowIndex, col:colIndex }, moveTable);

    if (shouldRenderCircle) {
      return (
        <div
          className="small-circle"
          style={{
            backgroundColor: color, // Customize the background color of the small circle
            borderRadius: '50%',
            height: '25px',
            width: '25px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    }

    return null;
  };

  const renderPiece = (rowIndex, colIndex, cell, pallet) => {
    const shouldRenderPiece =
      convert_to_player_type(board[rowIndex][colIndex]) === player1 ||
      convert_to_player_type(board[rowIndex][colIndex]) === player2;
  
    return (
      <Box
        className="piece"
        elevation={24}
        style={{
          backgroundColor:
            convert_to_player_type(cell) === player1
              ? player1 === cell
                ? pallet.player1
                : pallet.player1king
              : player2 === cell
              ? pallet.player2
              : pallet.player2king,
          borderRadius: "50%",
          height: shouldRenderPiece ? "80%" : "0%",
          width: shouldRenderPiece ? "80%" : "0%", 
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "width 0.3s, height 0.3s",
        }}
      />
    );
  };

  const renderCheckerboard = () => {
    const pallet = {main: '#b4762b',
      secondary: '#dbc289',
      possibleMove: '#e3f2fd',
      player1: '#bc3031',
      player1king: '#8c1031',
      player2: '#00433c',
      player2king: '#00233c',
      };
    return board.map((row, rowIndex) => (
      <Box alignItems="flex-start" justifyContent="flex-start" display="flex" key={rowIndex}>
        {row.map((cell, colIndex) => (
          <Box
            alignItems="flex-start"
            justifyContent="flex-start"
            item
            xs={1}
            key={colIndex}
          >
            <Paper
              className="cell"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              elevation={12}
              style={{
                height: '100px',
                width: '100px',
                backgroundColor: (rowIndex + colIndex) % 2 === 0 ? pallet.main : pallet.secondary,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {renderPiece(rowIndex, colIndex, cell, pallet)}
              {renderMoveIndicator(rowIndex, colIndex, pallet.possibleMove)}
            </Paper>


          </Box>
        ))}
      </Box>
    ));
  };
  


  return (
    <div>
      {renderCheckerboard()}
      <h2>level: {difficulty}</h2>
    </div>
  );
}

export default App;