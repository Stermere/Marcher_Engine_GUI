import React, { useState, useEffect } from 'react'
import { Paper, Box } from '@mui/material';
import { convert_to_player_type, is_valid_move, is_only_option, is_valid_start_square, parse_engine_info } from './HelpfulFunctions.js'
import { DifficultyToggleButtons, GoBackOneMoveButton, RestartGameButton } from './ToggleButtons';
import CheckersRules from './CheckersRules.js';
import WinBanner from './WinBanner.js';
import GitHubBanner from './GitHubBanner';
import './ToggleButtons.js'
import './PieceAnimation.css'
import './BackgroundColor.css'
import './IndicatorPiece.css'
import './ValidPieceIndicator.css'

import king from './king.png';

function App() {
  const player1 = 1
  const player2 = 2
  
  const [startSquare, setStartSquare] = useState(null)
  const [endSquare, setEndSquare] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState([])
  const [board, setBoard] = useState([]);
  const [moveTable, setMoveTable] = useState([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [waitingOnServer, setWaitingOnServer] = useState(false);
  const [moveStack, setMoveStack] = useState([]);
  const [moveStackPointer, setMoveStackPointer] = useState(0);
  const [win, setWin] = useState(0);
  const [engineInfo, setEngineInfo] = useState("Depth ?/? Score ?");

  // Background color for each difficulty level
  const difficultyColors = {
    master: '#3d1212',
    hard: '#552e1f',
    medium: '#172538',
    easy: '#23421c',
  };

  document.body.style.backgroundColor = difficultyColors[difficulty];

  useEffect(() => {
    document.body.style.backgroundColor = difficultyColors[difficulty];
  }, [difficulty]);

  // Setup the game to be new when the page loads
  useEffect(() => {
    fetch('/api/get_board')
      .then(response => response.json())
      .then(data => {setBoard(data.board);
                    setMoveTable(data.moves);
                    setCurrentPlayer(data.player);
                    setMoveStack([{board:structuredClone(data.board), moves: data.moves, player: data.player}]);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  // Reset the game to the initial state
  const restartGame = () => {
    fetch('/api/get_board')
      .then(response => response.json())
      .then(data => {setBoard(data.board);
                    setMoveTable(data.moves);
                    setCurrentPlayer(data.player);
                    setMoveStack([{board:structuredClone(data.board), moves: data.moves, player: data.player}]);
      })
      .catch(error => console.error('Error:', error));

      setStartSquare(null);
      setMoveStackPointer(0);
      setEngineInfo("Depth ?/? Score ?");
      setWin(0);
  }

  // Fetch a move for the current player from the server and update the board
  const playMove = () => {
    if (waitingOnServer || win !== 0) {
      return;
    }

    const tempMoveStack = moveStack.slice(0, moveStackPointer + 1);

    // Send the move to the server along with the current player and the board
    setWaitingOnServer(true);
    fetch('/api/request_move', {
      method: 'POST',
      body: JSON.stringify({
        board: board,
        player: currentPlayer,
        move: [{'col': -1, 'row': -1}, {'col': -1, 'row': -1}],
        difficulty: difficulty
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      setWaitingOnServer(false);
      setBoard(data.board);
      setCurrentPlayer(data.player);
      setMoveTable(data.moves);
      setWin(data.win);
      tempMoveStack.push({ board:structuredClone(data.board), moves:structuredClone(data.moves), player: data.player });
      setEngineInfo(parse_engine_info(data.searchInfo));
    })
    .catch(error => {
      console.error('Error:', error);
    });

    // Push to the move stack
    setMoveStack(tempMoveStack);
    setMoveStackPointer(moveStackPointer + 1);

    // Reset startSquare and endSquare after the move
    setStartSquare(null);
    setEndSquare(null);
    
  }

  const undoMove = () => {
    if (moveStackPointer > 0) {
      const lastState = moveStack[moveStackPointer - 1];
      setBoard(structuredClone(lastState.board));
      setMoveTable(structuredClone(lastState.moves));
      setCurrentPlayer(lastState.player);
      setMoveStackPointer(moveStackPointer - 1);
      setStartSquare(null);
    }
  };

  const redoMove = () => {
    if (moveStackPointer < moveStack.length - 1) {
      const nextState = moveStack[moveStackPointer + 1];
      setBoard(structuredClone(nextState.board));
      setMoveTable(structuredClone(nextState.moves));
      setCurrentPlayer(nextState.player);
      setStartSquare(null);
      setMoveStackPointer(moveStackPointer + 1);
    }
  };

  const handleCellClick = (row, col) => {
    if (waitingOnServer) {
      return;
    }

    if (convert_to_player_type(board[row][col]) === currentPlayer &&
        is_valid_start_square({ row, col }, moveTable)) {
      setStartSquare({ col, row });
    }
    else if (startSquare !== null && is_valid_move(startSquare, { row, col }, moveTable)) {
      setEndSquare({ col, row });
    }
    else if (!is_valid_start_square({ row, col }, moveTable) && moveTable.length > 1) {
      setStartSquare(null);
      setEndSquare(null);
    }
  };

  // 
  useEffect(() => {
    // If we have a startSquare and endSquare, a move has been made
    if (startSquare !== null && endSquare !== null) {
      // Update the board
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

      // Clear the move indicator from that square
      const newMoveTable = [];
      for (let i = 0; i < moveTable.length; i++) {
        if (moveTable[i][0][0] !== startSquare.col || moveTable[i][0][1] !== startSquare.row) {
          newMoveTable.push(moveTable[i]);
        }
      }
      newMoveTable.push([[-1, -1], [-1, -1]]);
      setMoveTable(newMoveTable);
      
      const tempMoveStack = moveStack.slice(0, moveStackPointer + 1);
      
      // Send the move to the server along with the current player and the board
      setWaitingOnServer(true);
      fetch('/api/request_move', {
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
        setBoard(data.board);
        setCurrentPlayer(data.player);
        setMoveTable(data.moves);
        setWin(data.win);
        tempMoveStack.push({ board:structuredClone(data.board), moves:structuredClone(data.moves), player: data.player });
        setEngineInfo(parse_engine_info(data.searchInfo));
        setWaitingOnServer(false);
        setStartSquare(null);
        setEndSquare(null);
      })
      .catch(error => {
        console.error('Error:', error);
      });

      // Push to the move stack
      setMoveStack(tempMoveStack);
      setMoveStackPointer(moveStackPointer + 1);

      // Reset startSquare and endSquare after the move
      setStartSquare(null);
      setEndSquare(null);
    }


  }, [startSquare, endSquare]);

  useEffect(() => {
    if (moveTable.length <= 0) {
      return;
    }
    if (is_only_option({ col:moveTable[0][0][0], row:moveTable[0][0][1] }, moveTable)) {
      setStartSquare({ col:moveTable[0][0][0], row:moveTable[0][0][1] });
    }
  }, [moveTable]);

  // Renders a indicator over pieces that have a valid move
  const renderAvaliablePiece = (rowIndex, colIndex, color) => {
    const isValid = is_valid_start_square({ row:rowIndex, col:colIndex }, moveTable) && !waitingOnServer && (startSquare === null || (startSquare.row === rowIndex && startSquare.col === colIndex));

    return (
      <div
        className="validPieceIndicator"
        elevation={24}
        style={{
          backgroundColor: color,
          opacity: .15,
          borderRadius: "50%",
          height: isValid ? "40%" : "0%",
          width: isValid ? "40%" : "0%", 
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "width 0.3s, height 0.3s",
        }}
      />
    );
  };

  // Renders an indicator over the destination square of a selected piece
  const renderMoveIndicator = (rowIndex, colIndex, color) => {
    const shouldRenderCircle = is_valid_move(startSquare, { row:rowIndex, col:colIndex }, moveTable);

    return (
      <div
        className="indicatorPiece"
        elevation={24}
        style={{
          backgroundColor: color,
          borderRadius: "50%",
          height: shouldRenderCircle ? "20%" : "0%",
          width: shouldRenderCircle ? "20%" : "0%", 
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "width 0.1s, height 0.1s",
        }}
      />
    );
  };

  const renderPiece = (rowIndex, colIndex, cell, pallet) => {
    const shouldRenderPiece =
      convert_to_player_type(board[rowIndex][colIndex]) === player1 ||
      convert_to_player_type(board[rowIndex][colIndex]) === player2;

    const isKing = (cell === 3 || cell === 4)
  
    return (
      <div>
        <div
          className="piece"
          elevation={24}
          style={{
            backgroundColor:
              convert_to_player_type(cell) === player1
                ? pallet.player1
                : convert_to_player_type(cell) === player2
                  ? pallet.player2 
                  : pallet.pieceTransition,
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
        <Box
        className='piece'
        component="img"
        sx={{
          height: isKing ? "50%" : "0%",
          width: isKing ? "100%" : "0%", 
        }}
        src={king}
        style={{
          position: "absolute",
          transform: "translate(-50%, -50%)",
          transition: "width 0.3s, height 0.3s",
        }}
      />
      </div>
    );
  };

  const renderCheckerboard = () => {
    const pallet = {main: '#b4762b',
      secondary: '#dbc289',
      possibleMove: '#e3f2fd',
      player1: '#bc3031',
      player2: '#00433c',
      pieceTransition: '#00233c',
      pieceAvailableIndicator: '#1c0726',
      };
    return board.map((row, rowIndex) => (
      <Box alignItems="center" justifyContent="center" display="flex" key={rowIndex}>
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
                height: 'min(12.5vw, 9vh)',
                width: 'min(12.5vw, 9vh)',
                backgroundColor: (rowIndex + colIndex) % 2 === 0 ? pallet.main : pallet.secondary,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {renderPiece(rowIndex, colIndex, cell, pallet)}
              {renderMoveIndicator(rowIndex, colIndex, pallet.possibleMove)}
              {renderAvaliablePiece(rowIndex, colIndex, pallet.pieceAvailableIndicator)}
            </Paper>


          </Box>
        ))}
      </Box>
    ));
  };


  useEffect(() => {
    // Apply smooth scrolling to html, body, and document
    document.documentElement.style.overflowY = 'scroll';
    document.body.style.overflowY = 'scroll';
    document.documentElement.style.WebkitOverflowScrolling = 'touch';
    document.body.style.WebkitOverflowScrolling = 'touch';

    // Cleanup effect on unmount
    return () => {
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
      document.documentElement.style.WebkitOverflowScrolling = 'auto';
      document.body.style.WebkitOverflowScrolling = 'auto';
    };
  }, []);
  
  return (
    <div className={`smooth-transition bg-${difficulty}`} style={{ paddingBottom: '80px' }}>
      <WinBanner winner={win} startString={engineInfo} />
      {renderCheckerboard()} 
      <DifficultyToggleButtons difficulty={difficulty} setDifficulty={setDifficulty} />
      <GoBackOneMoveButton goBackOneMove={undoMove} goForwardOneMove={redoMove} />
      <RestartGameButton restartGame={restartGame} playMove={playMove} />
      <CheckersRules />
      <GitHubBanner colorMap={difficultyColors} difficulty={difficulty} />
    </div>
  );
}

export default App;