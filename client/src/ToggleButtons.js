import * as React from 'react';
import { ToggleButton, ToggleButtonGroup, Stack, Typography, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({});

function DifficultyToggleButtons({ difficulty, setDifficulty }) {
  const handleDifficulty = (event, newDifficulty) => {
    if (newDifficulty !== null) {
      setDifficulty(newDifficulty);
    }
  };

  return (
    <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
      <ToggleButtonGroup
        value={difficulty}
        exclusive
        aria-label="text alignment"
        size="medium"
        alignItems="center"
        onChange={handleDifficulty}

      >
        <ToggleButton value="easy" aria-label="left aligned">
          <ThemeProvider theme={theme}>
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }}>
              Easy (Depth 1)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="medium" aria-label="centered">
        <ThemeProvider theme={theme}>
        <Typography variant="h8" component="div" style={{ textTransform: 'none' }}>
              Medium (Depth 3)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="hard" aria-label="right aligned">
        <ThemeProvider theme={theme}>
          <Typography variant="h8" component="div" style={{ textTransform: 'none' }}>
              Hard (Depth 8)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="master" aria-label="right aligned">
        <ThemeProvider theme={theme}>
          <Typography variant="h8" component="div" style={{ textTransform: 'none' }}>
              Master (1 second per move)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

export default DifficultyToggleButtons;
