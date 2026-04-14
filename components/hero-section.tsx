'use client';

import { motion } from 'motion/react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,241,230,0.88))',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Stack spacing={3} sx={{ flex: 1, p: { xs: 3, md: 6 } }}>
            <Chip label="New collection" color="secondary" sx={{ width: 'fit-content' }} />
            <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4.1rem' } }}>
              Jewelry that feels heirloom-worthy from day one.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
              Start your storefront with a polished luxury aesthetic powered by Next.js,
              Material UI, Motion animations, and a touch-friendly carousel.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" href="#collections">
                Explore collection
              </Button>
              <Button variant="outlined" size="large" href="#story">
                Brand story
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              minWidth: { md: 320 },
              display: 'grid',
              placeItems: 'center',
              p: { xs: 3, md: 4 },
              background:
                'radial-gradient(circle at top, rgba(212, 175, 55, 0.35), transparent 0 40%), #2d241f',
              color: '#fffaf2',
            }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Paper
                elevation={0}
                sx={{
                  px: 3,
                  py: 4,
                  borderRadius: '50%',
                  aspectRatio: '1 / 1',
                  width: 180,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="overline" sx={{ letterSpacing: 2 }}>
                  Signature drop
                </Typography>
                <Typography variant="h4">Aurora Ring</Typography>
              </Paper>
            </motion.div>
          </Box>
        </Stack>
      </Paper>
    </motion.div>
  );
}
