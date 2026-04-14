'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

const products = [
  {
    name: 'Solstice Necklace',
    material: '18k gold vermeil',
    price: '$220',
  },
  {
    name: 'Celeste Earrings',
    material: 'Freshwater pearl',
    price: '$180',
  },
  {
    name: 'Aster Cuff',
    material: 'Recycled silver',
    price: '$195',
  },
];

export function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) {
      return;
    }

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <Stack id="collections" spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
      >
        <Box>
          <Typography variant="overline" color="secondary.main">
            Featured pieces
          </Typography>
          <Typography variant="h4">Touch-friendly product slider</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={scrollPrev}>
            Prev
          </Button>
          <Button variant="contained" onClick={scrollNext}>
            Next
          </Button>
        </Stack>
      </Stack>

      <Box ref={emblaRef} sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {products.map((product) => (
            <Box key={product.name} sx={{ flex: '0 0 min(100%, 320px)' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography color="text.secondary">{product.material}</Typography>
                    <Typography variant="subtitle1" color="primary.main">
                      {product.price}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      <Stack direction="row" spacing={1}>
        {products.map((product, index) => (
          <Box
            key={product.name}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: index === selectedIndex ? 'secondary.main' : 'divider',
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}
