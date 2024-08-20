import React, { useState } from 'react';
import { Paper, Typography, Grid, ToggleButton } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

function WinBanner({ winner, startString }) {
  const [showEngineInfo, setShowEngineInfo] = useState(false);

  let text = showEngineInfo ? startString : '';
  if (winner === 1) {
    text = 'You Win! Play again?';
  } else if (winner === 2) {
    text = 'You Lose! Try again?';
  }

  const paperStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    height: '5vh',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <Paper elevation={0} style={paperStyle}>
      <ThemeProvider theme={theme}>
        <Grid container alignItems="center" justifyContent="center" spacing={2}>
          <Grid item xs="auto">
            <Typography variant="h7" color={theme.text.primary.main} textAlign="center">
              {text}
            </Typography>
          </Grid>
          <Grid item xs="auto">
            <ToggleButton
              variant="outlined"
              sx={{
                '&.MuiToggleButton-root.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                },
                '&.MuiToggleButton-root:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => setShowEngineInfo(!showEngineInfo)}
              selected={showEngineInfo}
            >
              <Typography
                variant="h8"
                component="div"
                color={theme.text.primary.main}
                style={{ textTransform: 'none'}}
              >
                Show/Hide Engine Info
              </Typography>
            </ToggleButton>
          </Grid>
        </Grid>
      </ThemeProvider>
    </Paper>
  );
}

export default WinBanner;