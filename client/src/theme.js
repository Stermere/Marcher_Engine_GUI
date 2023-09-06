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

export default theme;