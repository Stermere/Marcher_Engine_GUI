import React, { useState, useEffect } from 'react' // import the React library
import { Grid, Paper } from '@mui/material';
import { convert_to_player_type } from './HelpfulFunctions.js'

function App() {
  const [startSquare, setStartSquare] = useState(null)
  const [endSquare, setEndSquare] = useState(null)

  const player1 = 1
  const player2 = 2
  const [currentPlayer, setCurrentPlayer] = useState(player1)
  const [board, setBoard] = useState([]);
  const [moveTable, setMoveTable] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');

  // setup the game to be new when the page loads
  useEffect(() => {
    fetch('/get_board')
      .then(response => response.json())
      .then(data => setBoard(data.board))
      .then(setCurrentPlayer(player1))
      .catch(error => console.error('Error:', error));
  }, []);


  const handleCellClick = (row, col) => {
    if (board[row][col] !== 0 && convert_to_player_type(board[row][col]) === currentPlayer) {
      setStartSquare({ row, col });
    }

    else if (startSquare !== null) {
      // check if this is in the move table 
  
      setEndSquare({ row, col });
    }

    
  };

  useEffect(() => {
    // if we have a startSquare and endSquare, then we have a move
    // lets make the move and request the server to update the board
    if (startSquare !== null && endSquare !== null) {
      // for now just swap the pieces
      board[endSquare.row][endSquare.col] = board[startSquare.row][startSquare.col];
      board[startSquare.row][startSquare.col] = '';

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

        console.log(data);
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



  const renderCheckerboard = () => {
    return board.map((row, rowIndex) => (
      <Grid container spacing={0} key={rowIndex}>
        {row.map((cell, colIndex) => (
          <Grid item xs={1} key={colIndex}>
            <Paper
              className="cell"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                height: '100px',
                width: '100px',
                backgroundColor: (rowIndex + colIndex) % 2 === 0 ? 'white' : 'gray',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {(
                <div
                  style={{
                    backgroundColor: convert_to_player_type(cell) === player1
                      ? 'red'
                      : convert_to_player_type(cell) == player2
                      ? 'black' : 'transparent',
                    borderRadius: '50%',
                    height: '80%',
                    width: '80%',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    ));
  };


  return (
    <div>
      <h1>Checkerboard</h1>
      {renderCheckerboard()}
    </div>
  );
}

export default App;