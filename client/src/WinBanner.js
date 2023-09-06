import React from 'react';
import { Paper, Typography } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import theme from './theme'; 

function WinBanner({ winner }) {
  let text = "";
  if (winner === 1) {
    text = "You Win! Play again?";
  } else if (winner === 2) {
    text = "You Lose! Try again?";
  }

  const paperStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    height: '5vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Paper elevation={0} style={paperStyle}>
      <Typography variant="h4" color={theme.text.primary.main} textAlign='center'>
        {text}
      </Typography>
    </Paper>
  );
}

export default WinBanner;