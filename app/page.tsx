import { Box, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { HeroSection } from '@/components/hero-section';
import { ProductCarousel } from '@/components/product-carousel';

const highlights = [
  'Ethically sourced stones',
  'Custom bridal design',
  'Worldwide delivery',
];

export default function Home() {
  return (
    <Box component="main" sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          <HeroSection />

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack spacing={2}>
              <Typography variant="overline" color="secondary.main">
                Why this starter
              </Typography>
              <Typography variant="h4">
                Built for a refined jewelry shopping experience.
              </Typography>
              <Grid container spacing={2}>
                {highlights.map((item) => (
                  <Grid key={item} size={{ xs: 12, md: 4 }}>
                    <Chip
                      label={item}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        borderRadius: 2,
                        py: 2.75,
                        backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>

          <ProductCarousel />
        </Stack>
      </Container>
    </Box>
  );
}
