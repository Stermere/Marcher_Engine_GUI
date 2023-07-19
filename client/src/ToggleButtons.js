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
            <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.palette.primary.dark}>
              Easy (Depth 1)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="medium" aria-label="centered">
        <ThemeProvider theme={theme}>
        <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.palette.primary.dark}>
              Medium (Depth 3)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="hard" aria-label="right aligned" >
        <ThemeProvider theme={theme}>
          <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.palette.primary.dark}>
              Hard (Depth 8)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
        <ToggleButton value="master" aria-label="right aligned">
        <ThemeProvider theme={theme}>
          <Typography variant="h8" component="div" style={{ textTransform: 'none' }} color={theme.palette.primary.dark}>
              Master (Depth 15+)
            </Typography>
          </ThemeProvider>
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

export default DifficultyToggleButtons;
