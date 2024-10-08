import * as React from 'react';
import { ToggleButton, ToggleButtonGroup, Stack, Typography, ThemeProvider } from '@mui/material';
import theme from './theme'; 

function DifficultyToggleButtons({ difficulty, setDifficulty }) {
  const handleDifficulty = (event, newDifficulty) => {
    if (newDifficulty !== null) {
      setDifficulty(newDifficulty);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
        <ToggleButtonGroup
          value={difficulty}
          exclusive
          aria-label="text alignment"
          size="medium"
          alignItems="center"
          onChange={handleDifficulty}
        >
          <ToggleButton value="easy" aria-label="left aligned" sx={{ borderWidth:'2px', }}>
              <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
                Easy (Depth 1)
              </Typography>
          </ToggleButton>
          <ToggleButton value="medium" aria-label="centered" sx={{ borderWidth:'2px', }}>
          <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
                Medium (Depth 3)
              </Typography>
          </ToggleButton>
          <ToggleButton value="hard" aria-label="right aligned" sx={{ borderWidth:'2px', }}>
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
                Hard (Depth 8)
              </Typography>
          </ToggleButton>
          <ToggleButton value="master" aria-label="right aligned" sx={{ borderWidth:'2px', }}>
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
                Master (Depth 15+)
              </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </ThemeProvider>
  );
}

function RestartGameAndPlayMoveButton({ restartGame, playMove }) {
  return (
    <ThemeProvider theme={theme}>
      <Stack
        direction="row"
        spacing={4}
        justifyContent="center"
        alignItems="center"
      >
        <ToggleButtonGroup
          value={null}
          exclusive
          aria-label="game actions"
          size="medium"
          onChange={(event, newValue) => {
            if (newValue === "restart") {
              restartGame();
            } else if (newValue === "playMove") {
              playMove();
            }
          }}
        >
          <ToggleButton
            value="playMove"
            aria-label="play move"
            sx={{ borderWidth: '2px' }}
          >
            <Typography
              variant="h8"
              component="div"
              style={{ textTransform: 'none' }}
              color={theme.text.primary.main}
            >
              Play Move
            </Typography>
          </ToggleButton>
          <ToggleButton
            value="restart"
            aria-label="restart"
            sx={{ borderWidth: '2px' }}
          >
            <Typography
              variant="h8"
              component="div"
              style={{ textTransform: 'none' }}
              color={theme.text.primary.main}
            >
              Restart Game
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </ThemeProvider>
  );
}

function GoBackOneMoveButton({ goBackOneMove, goForwardOneMove }) {
  const handleChanges = (event, newChanges) => {
    if (newChanges !== null) {
      if (newChanges === 'goBackOneMove') {
        goBackOneMove();
      } else if (newChanges === 'goForwardOneMove') {
        goForwardOneMove();
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
        <ToggleButtonGroup
          value={null}
          exclusive
          aria-label="text alignment"
          size="medium"
          alignItems="center"
          onChange={handleChanges}
        >
          <ToggleButton value="goBackOneMove" aria-label="centered" sx={{ borderWidth:'2px', }}>
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
              Go Back One Move
            </Typography>
          </ToggleButton>
          <ToggleButton value="goForwardOneMove" aria-label="centered" sx={{ borderWidth:'2px', }}>
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
              Go Forward One Move
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </ThemeProvider>
  );
}


export { DifficultyToggleButtons, RestartGameAndPlayMoveButton as RestartGameButton, GoBackOneMoveButton};
