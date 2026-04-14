import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2d2926',
    },
    secondary: {
      main: '#bea667',
      contrastText: '#1f1a17',
    },
    background: {
      default: '#fbf8f3',
      paper: '#ffffff',
    },
    text: {
      primary: '#211d1a',
      secondary: '#6d5d4c',
    },
    divider: '#e6ddd2',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    overline: {
      letterSpacing: '0.16em',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
  },
});
