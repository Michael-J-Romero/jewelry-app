'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { EarCustomizer } from './ear-customizer';

// Toggle this flag to show/hide the left ear customizer panel
const noViewer = true;
 
const tabs = ['All', 'Ends', 'Clickers', 'Rings', 'Charms', 'Chains', 'New', 'Best Sellers'] as const;
const filterOptions = ['14k Gold', 'Pearl', 'Opal'] as const;

type Tab = (typeof tabs)[number];
type FilterOption = (typeof filterOptions)[number];
type Category = 'Ends' | 'Clickers' | 'Rings' | 'Charms' | 'Chains';

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
  category: Category;
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

const anchors: Anchor[] = [
  {
    id: 'helix',
    label: 'Helix',
    top: '20%',
    left: '50%',
    compatibility: 'Best with clickers, rings, and chains.',
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
    compatibility: 'Strong fit for statement rings or clickers.',
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
    compatibility: 'Pairs well with delicate ends and chains.',
  },
];

const mockProducts: Product[] = [
  {
    id: 1,
    title: 'test product',
    price: '$100',
    material: 'demo material',
    description: 'demo description',
    category: 'Ends',
    badge: 'Best Sellers',
    compatibleAnchors: ['flat'],
    tags: ['14k Gold'],
    images: [],
    productType: 'Ends with Gems',
    available: true,
  },
  {
    id: 2,
    title: 'Celestial Clicker',
    price: '$168',
    material: '14k gold · pavé crystal',
    description: 'A luminous clicker with a premium sparkle for helix and conch placements.',
    category: 'Clickers',
    badge: 'New',
    compatibleAnchors: ['helix', 'conch'],
    tags: ['14k Gold'],
    images: [],
    productType: 'Clickers',
    available: true,
  },
  {
    id: 3,
    title: 'Marine Hoop',
    price: '$154',
    material: 'yellow gold vermeil',
    description: 'A smooth statement hoop with a sculptural curve inspired by ocean forms.',
    category: 'Rings',
    compatibleAnchors: ['conch', 'helix', 'lobe-1'],
    tags: ['14k Gold'],
    images: [],
    productType: 'Rings',
    available: true,
  },
  {
    id: 4,
    title: 'Orbit Charm',
    price: '$92',
    material: '14k gold · pearl drop',
    description: 'A delicate charm meant to soften a stack with movement and a pearl accent.',
    category: 'Charms',
    compatibleAnchors: ['lobe-1', 'lobe-2'],
    tags: ['14k Gold', 'Pearl'],
    images: [],
    productType: 'Charms',
    available: true,
  },
  {
    id: 5,
    title: 'Aster Chain',
    price: '$110',
    material: 'solid gold chain',
    description: 'A draped connector chain for a more curated editorial styling moment.',
    category: 'Chains',
    badge: 'Limited',
    compatibleAnchors: ['helix', 'lobe-2'],
    tags: ['14k Gold'],
    images: [],
    productType: 'Chains',
    available: true,
  },
  {
    id: 6,
    title: 'Nova Ring',
    price: '$146',
    material: '14k gold · champagne stone',
    description: 'A warm-toned ring with a subtle gemstone accent for elevated daily wear.',
    category: 'Rings',
    badge: 'Best Sellers',
    compatibleAnchors: ['helix', 'conch', 'lobe-1'],
    tags: ['14k Gold'],
    images: [],
    productType: 'Rings',
    available: true,
  },
];

const collections = [
  {
    title: 'Botanical',
    note: 'Soft floral shapes and opal accents.',
    tone: 'linear-gradient(135deg, #f8eee5 0%, #f3e3d5 100%)',
  },
  {
    title: 'Space',
    note: 'Celestial curves with brighter pavé details.',
    tone: 'linear-gradient(135deg, #f3efe8 0%, #e7dece 100%)',
  },
  {
    title: 'Marine',
    note: 'Sculptural forms inspired by tide and shell lines.',
    tone: 'linear-gradient(135deg, #efe8df 0%, #e3d7ca 100%)',
  },
];

const initialPlacements: Record<string, string> = {
  helix: '2',
  conch: '3',
  'lobe-2': '1',
};

const formatBadge = (badge?: Product['badge']) => {
  if (!badge) {
    return null;
  }

  return badge === 'Best Sellers' ? 'Best Seller' : badge;
};

const extractOptionValuesFromTags = (tags: string[], key: string) => {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

  return Array.from(
    new Set(
      tags
        .map((tag) => {
          const separatorIndex = tag.indexOf(':');
          if (separatorIndex < 0) {
            return null;
          }

          const lhs = tag.slice(0, separatorIndex).toLowerCase().replace(/[^a-z0-9]/g, '');
          if (lhs !== normalizedKey) {
            return null;
          }

          return tag.slice(separatorIndex + 1).trim();
        })
        .filter(Boolean) as string[],
    ),
  );
};

const uniqueNormalized = (values: string[], normalize: (value: string) => string) => {
  const map = new Map<string, string>();

  values.forEach((value) => {
    const normalized = normalize(value);
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (!map.has(key)) {
      map.set(key, normalized);
    }
  });

  return Array.from(map.values());
};

const normalizeGoldOption = (value: string) => {
  return value
    .toLowerCase()
    .replace(/^\s*opt\s*-\s*(?:gold\s*)?color\s*:\s*/i, '')
    .replace(/^\s*color\s*:\s*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(\d{1,2})\s*k\b/g, '$1k')
    .replace(/\bgold\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractKaratTokens = (values: string[]) => {
  const matches = values.flatMap((value) => {
    const found = value.match(/\b(\d{1,2})\s*k\b/gi) ?? [];
    return found.map((token) => `${Number(token.toLowerCase().replace('k', '').trim())}k`);
  });

  const unique = Array.from(new Set(matches));
  unique.sort((a, b) => Number(a.replace('k', '')) - Number(b.replace('k', '')));
  return unique;
};

const getKaratOptions = (product: Product) => {
  if (product.karatOptions && product.karatOptions.length > 0) {
    return product.karatOptions;
  }

  const fromGoldColors = [
    ...extractOptionValuesFromTags(product.tags, 'opt-Gold Color'),
    ...extractOptionValuesFromTags(product.tags, 'opt-Color'),
    ...extractOptionValuesFromTags(product.tags, 'Color'),
  ];
  const goldRelatedTags = product.tags.filter((tag) => /\bgold\b/i.test(tag));
  return extractKaratTokens([...fromGoldColors, ...goldRelatedTags]);
};

const getGoldOptions = (product: Product) => {
  if (product.goldOptions && product.goldOptions.length > 0) {
    return product.goldOptions;
  }

  const fromTags = [
    ...extractOptionValuesFromTags(product.tags, 'opt-Gold Color'),
    ...extractOptionValuesFromTags(product.tags, 'opt-Color'),
    ...extractOptionValuesFromTags(product.tags, 'Color'),
  ];
  const descriptiveTags = product.tags.filter(
    (tag) => /(\d{1,2}\s*k).*(rose|white|yellow)|(rose|white|yellow).*(\d{1,2}\s*k)/i.test(tag),
  );

  return uniqueNormalized([...fromTags, ...descriptiveTags], normalizeGoldOption).filter((option) => {
    return option !== 'gold' && /\b\d{1,2}k\b/.test(option) && /\b(rose|white|yellow)\b/.test(option);
  });
};

const getPinOptions = (product: Product) => {
  if (product.pinOptions && product.pinOptions.length > 0) {
    return product.pinOptions;
  }

  return extractOptionValuesFromTags(product.tags, 'opt-Pin');
};

const getSubtotal = (placements: Record<string, string>, products: Product[]) => {
  return Object.values(placements).reduce((total, productId) => {
    const match = products.find((product) => String(product.id) === productId);

    if (!match) {
      return total;
    }

    return total + Number(match.price.replace(/[^0-9]/g, ''));
  }, 0);
};

const PAGE_SIZE = 24;

export function NorvochBuilderShell({ initialProducts }: { initialProducts: Product[] }) {
  const products = initialProducts.length > 0 ? initialProducts : mockProducts;
  const [selectedAnchorId, setSelectedAnchorId] = React.useState<string | null>('helix');
  const [activeTab, setActiveTab] = React.useState<Tab>('All');
  const [activeFilters, setActiveFilters] = React.useState<FilterOption[]>([]);
  const [placements, setPlacements] = React.useState<Record<string, string>>(initialPlacements);
  const [focusedProductId, setFocusedProductId] = React.useState<number | null>(null);
  const [isStackOpen, setIsStackOpen] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [savedLooks, setSavedLooks] = React.useState(0);
  const [cartCount, setCartCount] = React.useState(1);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const selectedAnchor = anchors.find((anchor) => anchor.id === selectedAnchorId) ?? null;
  const focusedProduct = products.find((product) => product.id === focusedProductId) ?? null;
  const focusedKaratOptions = focusedProduct ? getKaratOptions(focusedProduct) : [];
  const focusedGoldOptions = focusedProduct ? getGoldOptions(focusedProduct) : [];
  const focusedPinOptions = focusedProduct ? getPinOptions(focusedProduct) : [];

  const filteredProducts = React.useMemo(() => products.filter((product) => {
    const anchorMatch = selectedAnchor ? product.compatibleAnchors.includes(selectedAnchor.id) : true;
    const tabMatch =
      activeTab === 'All'
        ? true
        : activeTab === 'New' || activeTab === 'Best Sellers'
          ? product.badge === activeTab
          : product.category === activeTab;
    const filterMatch =
      activeFilters.length === 0 ? true : activeFilters.every((tag) => product.tags.includes(tag));

    return anchorMatch && tabMatch && filterMatch;
  }), [products, selectedAnchor, activeTab, activeFilters]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedAnchorId, activeTab, activeFilters]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const placedEntries = Object.entries(placements)
    .map(([anchorId, productId]) => {
      const anchor = anchors.find((item) => item.id === anchorId);
      const product = products.find((item) => String(item.id) === productId);

      if (!anchor || !product) {
        return null;
      }

      return { anchor, product };
    })
    .filter(Boolean) as Array<{ anchor: Anchor; product: Product }>;

  const subtotal = getSubtotal(placements, products);
  const pieceCount = placedEntries.length;
  const selectedCurrentItem = selectedAnchorId ? placements[selectedAnchorId] : undefined;

  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  };

  const placeProduct = (product: Product) => {
    if (!selectedAnchorId || !selectedAnchor) {
      setNotice('Select a piercing first.');
      return;
    }

    const hadProduct = Boolean(placements[selectedAnchorId]);

    setPlacements((current) => ({
      ...current,
      [selectedAnchorId]: String(product.id),
    }));
    setNotice(
      hadProduct
        ? `${selectedAnchor.label} updated with ${product.title}.`
        : `${product.title} placed on ${selectedAnchor.label}.`,
    );
  };

  const removePlacement = (anchorId: string) => {
    const anchor = anchors.find((item) => item.id === anchorId);

    setPlacements((current) => {
      const next = { ...current };
      delete next[anchorId];
      return next;
    });

    if (anchor) {
      setNotice(`${anchor.label} cleared.`);
    }
  };

  const clearAll = () => {
    if (Object.keys(placements).length === 0) {
      setNotice('The current stack is already empty.');
      return;
    }

    setPlacements({});
    setFocusedProductId(null);
    setNotice('All placements removed from the current look.');
  };

  const saveLook = () => {
    setSavedLooks((current) => current + 1);
    setNotice('Current ear stack saved to your lookbook.');
  };

  const shareLook = () => {
    setNotice('Share flow prepared for this look.');
  };

  const addAllToCart = () => {
    if (pieceCount === 0) {
      setNotice('Add pieces to the stack before sending them to cart.');
      return;
    }

    setCartCount((current) => current + pieceCount);
    setNotice(`${pieceCount} selected pieces added to cart.`);
  };

  const addFocusedProductToCart = () => {
    if (!focusedProduct) {
      return;
    }

    setCartCount((current) => current + 1);
    setNotice(`${focusedProduct.title} added to cart.`);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          minHeight: 72,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(251, 248, 243, 0.92)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{
            px: { xs: 1.5, md: 3 },
            py: { xs: 1.25, md: 1.5 },
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" sx={{ letterSpacing: '0.16em' }}>
              NORVOCH
            </Typography>
            <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="h6">Build Your Ear</Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            {savedLooks > 0 ? <Chip label={`Saved ${savedLooks}`} size="small" /> : null}
            <Button color="inherit" size="small" onClick={saveLook}>Save Look</Button>
            <Button color="inherit" size="small" onClick={shareLook}>Share</Button>
            <Button color="inherit" size="small" onClick={clearAll}>Reset</Button>
            <Button variant="contained" size="small">Cart · {cartCount}</Button>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          pt: { xs: '118px', md: '88px' },
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: noViewer ? '1fr' : { xs: '1fr', lg: '1.35fr 1fr' },
        }}
      >
        {!noViewer && (
          <EarCustomizer
            anchors={anchors}
            placements={placements}
            selectedAnchorId={selectedAnchorId}
            onSelectAnchor={setSelectedAnchorId}
            onRemovePlacement={removePlacement}
            onClearAll={clearAll}
            placedEntries={placedEntries}
            isStackOpen={isStackOpen}
            onToggleStack={() => setIsStackOpen((current) => !current)}
            pieceCount={pieceCount}
            subtotal={subtotal}
          />
        )}

        <Box
          sx={{
            height: { xs: 'auto', lg: 'calc(100vh - 88px)' },
            overflowY: { xs: 'visible', lg: 'auto' },
            backgroundColor: '#fcfaf7',
          }}
        >
          <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 }, pb: 12 }}>
            <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
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
                    {selectedCurrentItem ? (
                      <Chip label={`Current: ${selectedCurrentItem}`} />
                    ) : (
                      <Chip label="Currently empty" variant="outlined" />
                    )}
                    <Chip
                      label="Remove item"
                      variant="outlined"
                      onClick={() => selectedAnchorId && removePlacement(selectedAnchorId)}
                    />
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
              {filterOptions.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  onClick={() => toggleFilter(filter)}
                  color={activeFilters.includes(filter) ? 'secondary' : 'default'}
                  variant={activeFilters.includes(filter) ? 'filled' : 'outlined'}
                />
              ))}
              <Chip label="Clear All" onClick={() => setActiveFilters([])} />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              {collections.map((collection) => (
                <Paper
                  key={collection.title}
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: collection.tone,
                  }}
                >
                  <Typography variant="overline" color="secondary.main">
                    Collection
                  </Typography>
                  <Typography variant="h6">{collection.title}</Typography>
                  <Typography color="text.secondary">{collection.note}</Typography>
                </Paper>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {visibleProducts.map((product) => {
                const isPlaced = Object.values(placements).includes(String(product.id));

                return (
                  <motion.div key={product.id} whileHover={{ y: -4 }}>
                    <Paper
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: isPlaced ? 'secondary.main' : 'divider',
                        backgroundColor: '#fff',
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            height: 150,
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            background: 'linear-gradient(135deg, rgba(250,244,236,1), rgba(236,225,212,1))',
                          }}
                        >
                          {product.images[0] && (
                            <Box
                              component="img"
                              src={product.images[0]}
                              alt={product.title}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          )}
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {product.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexShrink={0}>
                            {product.badge ? <Chip label={formatBadge(product.badge)} size="small" /> : null}
                            {!product.available ? <Chip label="Sold out" size="small" variant="outlined" /> : null}
                          </Stack>
                        </Stack>
                        <Typography color="text.secondary" variant="body2">{product.material}</Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ minHeight: 42 }}>
                          {product.description}
                        </Typography>
                        <Typography color="primary.main" fontWeight={600}>
                          {product.price}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <Button variant="outlined" fullWidth onClick={() => setFocusedProductId(product.id)}>
                            Details
                          </Button>
                          <Button
                            variant={selectedAnchor ? 'contained' : 'outlined'}
                            fullWidth
                            disabled={!selectedAnchor || !product.available}
                            onClick={() => placeProduct(product)}
                          >
                            {selectedCurrentItem ? 'Replace' : 'Add / Try On'}
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  </motion.div>
                );
              })}
            </Box>

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <Button variant="outlined" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  Show more ({filteredProducts.length - visibleCount} remaining)
                </Button>
              </Box>
            )}

            {filteredProducts.length === 0 && (
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6">No pieces match this filter combination.</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  Try clearing a filter or selecting a different piercing.
                </Typography>
              </Paper>
            )}
          </Stack>

          <Paper
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
              <Typography>{pieceCount} pieces · ${subtotal} subtotal</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="outlined" onClick={saveLook}>Save Look</Button>
                <Button variant="contained" onClick={addAllToCart}>Add All to Cart</Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>

      <Dialog open={Boolean(focusedProduct)} onClose={() => setFocusedProductId(null)} fullWidth maxWidth="sm">
        {focusedProduct ? (
          <>
            <DialogTitle>{focusedProduct.title}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    height: 280,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(135deg, rgba(250,244,236,1), rgba(236,225,212,1))',
                  }}
                >
                  {focusedProduct.images[0] && (
                    <Box
                      component="img"
                      src={focusedProduct.images[0]}
                      alt={focusedProduct.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  )}
                </Box>
                {focusedProduct.images.length > 1 && (
                  <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                    {focusedProduct.images.map((src, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={src}
                        alt={`${focusedProduct.title} view ${i + 1}`}
                        sx={{
                          width: 72,
                          height: 72,
                          flexShrink: 0,
                          borderRadius: 2,
                          objectFit: 'cover',
                          border: '1px solid',
                          borderColor: i === 0 ? 'secondary.main' : 'divider',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Stack>
                )}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography color="primary.main" fontWeight={600} variant="h6">
                    {focusedProduct.price}
                  </Typography>
                  {focusedProduct.badge && (
                    <Chip label={formatBadge(focusedProduct.badge)} size="small" />
                  )}
                  {!focusedProduct.available && (
                    <Chip label="Out of stock" size="small" color="default" variant="outlined" />
                  )}
                </Stack>
                <Typography color="text.secondary">{focusedProduct.material}</Typography>
                <Typography color="text.secondary">{focusedProduct.description}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Type: {focusedProduct.productType} · Compatible with: {focusedProduct.compatibleAnchors.join(', ')}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Gold color/type options
                    {focusedKaratOptions.length > 0 ? ` (${focusedKaratOptions.join(', ')})` : ''}
                  </Typography>
                  {focusedGoldOptions.length > 0 ? (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {focusedGoldOptions.map((option) => (
                        <Chip key={option} label={option} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Not specified for this product.
                    </Typography>
                  )}
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Pin options
                  </Typography>
                  {focusedPinOptions.length > 0 ? (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {focusedPinOptions.map((option) => (
                        <Chip key={option} label={option} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No pin variants listed in tags.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                pb: 3,
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1,
              }}
            >
              <Button onClick={() => setFocusedProductId(null)}>Close</Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    addFocusedProductToCart();
                    setFocusedProductId(null);
                  }}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="contained"
                  disabled={!selectedAnchor}
                  onClick={() => {
                    placeProduct(focusedProduct);
                    setFocusedProductId(null);
                  }}
                >
                  Add to Selected Piercing
                </Button>
              </Stack>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2200}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setNotice('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
