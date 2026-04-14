import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6f4e37',
    },
    secondary: {
      main: '#d4af37',
    },
    background: {
      default: '#fffdfa',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: 'var(--font-display), serif',
      fontWeight: 700,
    },
  },
});
