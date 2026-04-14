'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const tabs = ['All', 'Ends', 'Clickers', 'Rings', 'Charms', 'Chains', 'New', 'Best Sellers'] as const;

type Tab = (typeof tabs)[number];

type Anchor = {
  id: string;
  label: string;
  top: string;
  left: string;
  occupied?: boolean;
  compatibility: string;
  currentItem?: string;
};

type Product = {
  name: string;
  price: string;
  material: string;
  category: Exclude<Tab, 'All'>;
  badge?: 'New' | 'Best Seller' | 'Limited';
  compatibleAnchors: string[];
};

const anchors: Anchor[] = [
  {
    id: 'helix',
    label: 'Helix',
    top: '20%',
    left: '50%',
    occupied: true,
    compatibility: 'Best with clickers, rings, and chains.',
    currentItem: 'Celestial Clicker',
  },
  {
    id: 'flat',
    label: 'Flat',
    top: '34%',
    left: '38%',
    compatibility: 'Ideal for ends and low-profile clusters.',
  },
  {
    id: 'conch',
    label: 'Conch',
    top: '50%',
    left: '44%',
    occupied: true,
    compatibility: 'Strong fit for statement rings or clickers.',
    currentItem: 'Marine Hoop',
  },
  {
    id: 'lobe-1',
    label: 'First Lobe',
    top: '70%',
    left: '56%',
    compatibility: 'Perfect for daily studs and charms.',
  },
  {
    id: 'lobe-2',
    label: 'Second Lobe',
    top: '80%',
    left: '50%',
    occupied: true,
    compatibility: 'Pairs well with delicate ends and chains.',
    currentItem: 'Botanical Stud',
  },
];

const products: Product[] = [
  {
    name: 'Botanical Stud',
    price: '$120',
    material: '14k gold · white opal',
    category: 'Ends',
    badge: 'Best Seller',
    compatibleAnchors: ['flat', 'lobe-1', 'lobe-2'],
  },
  {
    name: 'Celestial Clicker',
    price: '$168',
    material: '14k gold · pavé crystal',
    category: 'Clickers',
    badge: 'New',
    compatibleAnchors: ['helix', 'conch'],
  },
  {
    name: 'Marine Hoop',
    price: '$154',
    material: 'yellow gold vermeil',
    category: 'Rings',
    compatibleAnchors: ['conch', 'helix', 'lobe-1'],
  },
  {
    name: 'Orbit Charm',
    price: '$92',
    material: '14k gold · pearl drop',
    category: 'Charms',
    compatibleAnchors: ['lobe-1', 'lobe-2'],
  },
  {
    name: 'Aster Chain',
    price: '$110',
    material: 'solid gold chain',
    category: 'Chains',
    badge: 'Limited',
    compatibleAnchors: ['helix', 'lobe-2'],
  },
  {
    name: 'Nova Ring',
    price: '$146',
    material: '14k gold · champagne stone',
    category: 'Best Sellers',
    compatibleAnchors: ['helix', 'conch', 'lobe-1'],
  },
];

export function NorvochBuilderShell() {
  const [selectedAnchorId, setSelectedAnchorId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>('All');

  const selectedAnchor = anchors.find((anchor) => anchor.id === selectedAnchorId) ?? null;

  const filteredProducts = products.filter((product) => {
    const anchorMatch = selectedAnchor ? product.compatibleAnchors.includes(selectedAnchor.id) : true;
    const tabMatch = activeTab === 'All' ? true : product.category === activeTab || product.badge === activeTab;

    return anchorMatch && tabMatch;
  });

  return (
    <Box sx={{ height: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          height: 72,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(251, 248, 243, 0.92)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{
            height: '100%',
            px: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="subtitle1" sx={{ letterSpacing: '0.16em' }}>
              NORVOCH
            </Typography>
            <Divider flexItem orientation="vertical" />
            <Typography variant="h6">Build Your Ear</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button color="inherit">Save Look</Button>
            <Button color="inherit">Share</Button>
            <Button color="inherit">Reset</Button>
            <Button variant="contained">Cart · 3</Button>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          pt: '72px',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.35fr 1fr' },
        }}
      >
        <Paper
          square
          elevation={0}
          sx={{
            height: { xs: 'auto', lg: 'calc(100vh - 72px)' },
            borderRight: { lg: '1px solid' },
            borderColor: 'divider',
            backgroundColor: 'background.default',
          }}
        >
          <Stack sx={{ height: '100%', p: { xs: 2, md: 3 } }} spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <Chip label="Left Ear" color="secondary" />
                <Chip label="Right Ear" variant="outlined" />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined">Zoom In</Button>
                <Button size="small" variant="outlined">Zoom Out</Button>
                <Button size="small" variant="text">Markers</Button>
              </Stack>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                flex: 1,
                minHeight: 520,
                overflow: 'hidden',
                borderRadius: 5,
                border: '1px solid',
                borderColor: 'divider',
                background:
                  'radial-gradient(circle at top, rgba(190, 166, 103, 0.18), transparent 0 30%), linear-gradient(180deg, #fffdfa 0%, #f4eee6 100%)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 240, md: 320 },
                    height: { xs: 360, md: 460 },
                    borderRadius: '54% 46% 52% 48% / 20% 28% 72% 80%',
                    border: '1.5px solid',
                    borderColor: 'rgba(109, 93, 76, 0.28)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(238,228,216,0.85))',
                    boxShadow: 'inset -18px 0 30px rgba(156, 132, 110, 0.08)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '18%',
                      left: '28%',
                      width: '42%',
                      height: '54%',
                      border: '1px solid rgba(109, 93, 76, 0.18)',
                      borderRadius: '48% 52% 50% 50% / 30% 30% 70% 70%',
                    }}
                  />

                  {anchors.map((anchor) => {
                    const isSelected = anchor.id === selectedAnchorId;

                    return (
                      <motion.div
                        key={anchor.id}
                        whileHover={{ scale: 1.06 }}
                        style={{ position: 'absolute', top: anchor.top, left: anchor.left }}
                      >
                        <Button
                          onClick={() => setSelectedAnchorId(anchor.id)}
                          sx={{
                            minWidth: 0,
                            width: 28,
                            height: 28,
                            p: 0,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: isSelected ? 'secondary.main' : 'rgba(109, 93, 76, 0.42)',
                            backgroundColor: '#fffdf9',
                            boxShadow: isSelected ? '0 0 0 4px rgba(190,166,103,0.18)' : 'none',
                            '&::after': anchor.occupied
                              ? {
                                  content: '""',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? 'secondary.main' : '#6f6255',
                                  display: 'block',
                                }
                              : undefined,
                          }}
                          aria-label={anchor.label}
                        />
                      </motion.div>
                    );
                  })}
                </Box>
              </Box>

              {!selectedAnchor && (
                <Typography
                  sx={{
                    position: 'absolute',
                    left: 24,
                    bottom: 20,
                    color: 'text.secondary',
                  }}
                >
                  Select a piercing to start building your look.
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'rgba(255,255,255,0.88)',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="secondary.main">
                    Current composition
                  </Typography>
                  <Typography variant="body1">3 pieces placed · $442 subtotal</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined">View Stack</Button>
                  <Button variant="text">Clear All</Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        <Box
          sx={{
            height: { xs: 'auto', lg: 'calc(100vh - 72px)' },
            overflowY: 'auto',
            backgroundColor: '#fcfaf7',
          }}
        >
          <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 }, pb: 12 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              {!selectedAnchor ? (
                <Stack spacing={1}>
                  <Typography variant="overline" color="secondary.main">
                    Start your look
                  </Typography>
                  <Typography variant="h4">Best sellers and featured pieces</Typography>
                  <Typography color="text.secondary">
                    Choose a piercing point on the left to narrow the catalog by compatibility.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="overline" color="secondary.main">
                    Selected piercing
                  </Typography>
                  <Typography variant="h4">{selectedAnchor.label}</Typography>
                  <Typography color="text.secondary">{selectedAnchor.compatibility}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedAnchor.currentItem ? (
                      <Chip label={`Current: ${selectedAnchor.currentItem}`} />
                    ) : (
                      <Chip label="Currently empty" variant="outlined" />
                    )}
                    <Chip label="Remove item" variant="outlined" />
                    <Chip label="Deselect" onClick={() => setSelectedAnchorId(null)} />
                  </Stack>
                </Stack>
              )}
            </Paper>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tabs.map((tab) => (
                <Chip
                  key={tab}
                  label={tab}
                  onClick={() => setActiveTab(tab)}
                  color={activeTab === tab ? 'secondary' : 'default'}
                  variant={activeTab === tab ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="Material: 14k Gold" variant="outlined" />
              <Chip label="Gem: White Opal" variant="outlined" />
              <Chip label="Color: Warm Gold" variant="outlined" />
              <Chip label="Clear All" />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {filteredProducts.map((product) => (
                <motion.div key={product.name} whileHover={{ y: -4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          height: 150,
                          borderRadius: 3,
                          background:
                            'linear-gradient(135deg, rgba(250,244,236,1), rgba(236,225,212,1))',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {product.name}
                        </Typography>
                        {product.badge ? <Chip label={product.badge} size="small" /> : null}
                      </Stack>
                      <Typography color="text.secondary">{product.material}</Typography>
                      <Typography color="primary.main" fontWeight={600}>
                        {product.price}
                      </Typography>
                      <Button variant={selectedAnchor ? 'contained' : 'outlined'}>
                        {selectedAnchor?.currentItem ? 'Replace' : 'Add / Try On'}
                      </Button>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 5,
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
              <Typography>3 pieces · $442 subtotal</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined">Save Look</Button>
                <Button variant="contained">Add All to Cart</Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
