import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { darken_color } from './HelpfulFunctions';
import GitHubIcon from '@mui/icons-material/GitHub';

function GitHubBanner({ colorMap, difficulty }) {
  // Get the background color for the banner
  const backgroundColor = colorMap[difficulty]

  // Darken the background color for the banner
  const backgroundColorDarkened = darken_color(backgroundColor, 5);

  return (
    <Box 
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        bgcolor: backgroundColorDarkened,
        color: 'white',
        textAlign: 'center',
        p: 2,
        boxShadow: 3,
        transition: 'background-color 0.3s ease',
        '@media (max-width: 600px)': {
          position: 'absolute',
        }
      }}
    >
      <Typography variant="body1">
        Want to see the code behind the project? {' '}
        <Link href="https://github.com/Stermere/Checkers-Engine" color="inherit" target="_blank" rel="noopener">
          <GitHubIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Checkers Engine Repo
        </Link>
        {'  |  '}
        <Link href="https://github.com/Stermere/Marcher_Engine_GUI" color="inherit" target="_blank" rel="noopener">
          <GitHubIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Website Source Repo
        </Link>
      </Typography>
    </Box>
  );
}

export default GitHubBanner;