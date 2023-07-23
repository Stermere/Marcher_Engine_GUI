import * as React from 'react';
import { ToggleButton, ToggleButtonGroup, Stack, Typography, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';


const theme = createTheme({
  text: {
    primary: {
      main: '#a3c4c1',
    },
    secondary: {
      main: '#b08787',
    },
  },
  backgroundColor: {
    'master': '#3d1212',
    'hard': '#552e1f',
    'medium': '#172538',
    'easy': '#23421c',
  },
});

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

function RestartGameButton({ restartGame }) {
  return (
    <ThemeProvider theme={theme}>
      <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
        <ToggleButtonGroup
          value={null}
          exclusive
          aria-label="text alignment"
          size="medium"
          alignItems="center"
          onChange={restartGame}
        >
          <ToggleButton value="restart" aria-label="centered" sx={{ borderWidth:'2px', }}>
              <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.text.primary.main}>
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


export { DifficultyToggleButtons, RestartGameButton, GoBackOneMoveButton };
