'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

type Anchor = {
  id: string;
  label: string;
  top: string;
  left: string;
  compatibility: string;
};

type Product = {
  id: number;
  title: string;
  price: string;
  material: string;
  description: string;
  category: 'Ends' | 'Clickers' | 'Rings' | 'Charms' | 'Chains';
  badge?: 'New' | 'Best Sellers' | 'Limited';
  compatibleAnchors: string[];
  tags: string[];
  images: string[];
  productType: string;
  available: boolean;
  karatOptions?: string[];
  goldOptions?: string[];
  pinOptions?: string[];
};

interface EarCustomizerProps {
  anchors: Anchor[];
  placements: Record<string, string>;
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string | null) => void;
  onRemovePlacement: (anchorId: string) => void;
  onClearAll: () => void;
  placedEntries: Array<{ anchor: Anchor; product: Product }>;
  isStackOpen: boolean;
  onToggleStack: () => void;
  pieceCount: number;
  subtotal: number;
}

export function EarCustomizer({
  anchors,
  placements,
  selectedAnchorId,
  onSelectAnchor,
  onRemovePlacement,
  onClearAll,
  placedEntries,
  isStackOpen,
  onToggleStack,
  pieceCount,
  subtotal,
}: EarCustomizerProps) {
  const selectedAnchor = anchors.find((anchor) => anchor.id === selectedAnchorId) ?? null;
  const selectedCurrentItem = selectedAnchorId ? placements[selectedAnchorId] : undefined;

  return (
    <Paper
      square
      sx={{
        height: { xs: 'auto', lg: 'calc(100vh - 88px)' },
        position: { lg: 'sticky' },
        top: { lg: 88 },
        borderRight: { lg: '1px solid' },
        borderColor: 'divider',
        backgroundColor: 'background.default',
      }}
    >
      <Stack sx={{ height: '100%', p: { xs: 2, md: 3 } }} spacing={2.5}>
        <Paper
          sx={{
            p: 1.5,
            display: { xs: 'block', lg: 'none' },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(255,255,255,0.86)',
          }}
        >
          <Typography variant="overline" color="secondary.main">
            Mobile builder status
          </Typography>
          <Typography color="text.secondary">
            {selectedAnchor ? `Editing ${selectedAnchor.label}` : 'Tap a marker to choose a piercing'}
          </Typography>
        </Paper>

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Left Ear" color="secondary" />
            <Chip label="Right Ear" variant="outlined" />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined">Zoom In</Button>
            <Button size="small" variant="outlined">Zoom Out</Button>
            <Button size="small" variant="text">Markers</Button>
          </Stack>
        </Stack>

        <Paper
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: { xs: 400, md: 520 },
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
                const isOccupied = Boolean(placements[anchor.id]);

                return (
                  <motion.div
                    key={anchor.id}
                    whileHover={{ scale: 1.06 }}
                    style={{ position: 'absolute', top: anchor.top, left: anchor.left }}
                  >
                    <Button
                      onClick={() =>
                        onSelectAnchor(selectedAnchorId === anchor.id ? null : anchor.id)
                      }
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
                        '&::after': isOccupied
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

              {placedEntries.map(({ anchor, product }) => (
                <motion.div
                  key={`${anchor.id}-preview`}
                  initial={{ opacity: 0.6, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: `calc(${anchor.top} + 18px)`,
                    left: `calc(${anchor.left} + 12px)`,
                    maxWidth: '92px',
                  }}
                >
                  <Box
                    sx={{
                      px: 1,
                      py: 0.4,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: 'rgba(190, 166, 103, 0.45)',
                      backgroundColor: 'rgba(255,255,255,0.82)',
                      fontSize: '0.68rem',
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {product.title}
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>

          {selectedAnchor && (
            <Chip
              label={`${selectedAnchor.label}${selectedCurrentItem ? ` · ${selectedCurrentItem}` : ''}`}
              sx={{
                position: 'absolute',
                left: 24,
                bottom: 20,
                backgroundColor: 'rgba(255,255,255,0.94)',
              }}
            />
          )}

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
              <Typography variant="body1">{pieceCount} pieces placed · ${subtotal} subtotal</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onToggleStack}>
                {isStackOpen ? 'Hide Stack' : 'View Stack'}
              </Button>
              <Button variant="text" onClick={onClearAll}>Clear All</Button>
            </Stack>
          </Stack>

          {isStackOpen && (
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              {placedEntries.map(({ anchor, product }) => (
                <Paper
                  key={`${anchor.id}-${product.id}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography fontWeight={600}>{anchor.label}</Typography>
                      <Typography color="text.secondary">{product.title} · {product.price}</Typography>
                    </Box>
                    <Button size="small" onClick={() => onRemovePlacement(anchor.id)}>Remove</Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Paper>
  );
}
