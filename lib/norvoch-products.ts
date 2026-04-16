import { promises as fs } from 'node:fs';
import path from 'node:path';

export type BuilderProduct = {
  id: number;
  title: string;
  handle: string;
  description: string;
  price: string;
  material: string;
  category: 'Ends' | 'Clickers' | 'Rings' | 'Charms' | 'Chains';
  badge?: 'New' | 'Best Sellers' | 'Limited';
  compatibleAnchors: string[];
  tags: string[];
  images: string[];
  productType: string;
  available: boolean;
  karatOptions: string[];
  goldOptions: string[];
  pinOptions: string[];
};

export type BuilderProductsSource = 'cache-first' | 'live';

export type BuilderProductsMeta = {
  requestedSource: BuilderProductsSource;
  resolvedSource: 'cache' | 'live' | 'empty';
  usedFallback: boolean;
  cachedCount: number;
  liveCount: number;
  error?: string;
};

type RawProduct = {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  published_at?: string;
  product_type?: string;
  tags?: string[] | string;
  variants?: Array<{ price?: string; available?: boolean }>;
  images?: Array<{ src?: string }>;
};

const SHOP_URL = 'https://norvoch.com/products.json?limit=250&page=';
const cachePath = path.join(process.cwd(), 'data', 'norvoch-products.json');

function stripHtml(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTags(tags: RawProduct['tags']) {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function extractOptionValues(tags: string[], key: string) {
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
}

function uniqueNormalized(values: string[], normalize: (value: string) => string) {
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
}

function normalizeGoldOption(value: string) {
  return value
    .toLowerCase()
    .replace(/^\s*opt\s*-\s*(?:gold\s*)?color\s*:\s*/i, '')
    .replace(/^\s*color\s*:\s*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(\d{1,2})\s*k\b/g, '$1k')
    .replace(/\bgold\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKaratTokens(values: string[]) {
  const matches = values.flatMap((value) => {
    const found = value.match(/\b(\d{1,2})\s*k\b/gi) ?? [];
    return found.map((token) => `${Number(token.toLowerCase().replace('k', '').trim())}k`);
  });

  const unique = Array.from(new Set(matches));
  unique.sort((a, b) => Number(a.replace('k', '')) - Number(b.replace('k', '')));
  return unique;
}

function extractGoldOptions(tags: string[]) {
  const colorOptions = [
    ...extractOptionValues(tags, 'opt-Gold Color'),
    ...extractOptionValues(tags, 'opt-Color'),
    ...extractOptionValues(tags, 'Color'),
  ];
  const descriptiveTags = tags.filter(
    (tag) => /(\d{1,2}\s*k).*(rose|white|yellow)|(rose|white|yellow).*(\d{1,2}\s*k)/i.test(tag),
  );

  return uniqueNormalized([...colorOptions, ...descriptiveTags], normalizeGoldOption).filter((option) => {
    return option !== 'gold' && /\b\d{1,2}k\b/.test(option) && /\b(rose|white|yellow)\b/.test(option);
  });
}

function extractKaratOptions(tags: string[]) {
  const colorOptions = [
    ...extractOptionValues(tags, 'opt-Gold Color'),
    ...extractOptionValues(tags, 'opt-Color'),
    ...extractOptionValues(tags, 'Color'),
  ];
  const goldRelatedTags = tags.filter((tag) => /\bgold\b/i.test(tag));

  return extractKaratTokens([...colorOptions, ...goldRelatedTags]);
}

function inferCategory(product: RawProduct, tags: string[]): BuilderProduct['category'] {
  const haystack = `${product.product_type ?? ''} ${product.title} ${tags.join(' ')}`.toLowerCase();

  if (haystack.includes('clicker')) return 'Clickers';
  if (haystack.includes('ring') || haystack.includes('hoop')) return 'Rings';
  if (haystack.includes('chain')) return 'Chains';
  if (haystack.includes('charm')) return 'Charms';
  return 'Ends';
}

function inferAnchors(tags: string[]) {
  const joined = tags.join(' ').toLowerCase();
  const anchors: string[] = [];

  if (joined.includes('helix') || joined.includes('vertical helix')) anchors.push('helix');
  if (joined.includes('flat')) anchors.push('flat');
  if (joined.includes('conch')) anchors.push('conch');
  if (joined.includes('lobe')) anchors.push('lobe-1', 'lobe-2');

  return anchors.length > 0 ? Array.from(new Set(anchors)) : ['helix', 'flat', 'conch', 'lobe-1', 'lobe-2'];
}

function inferMaterial(tags: string[], fallback: string) {
  const materialTag = tags.find((tag) => /gold|silver|opal|pearl/i.test(tag));
  return materialTag ?? fallback;
}

function inferBadge(product: RawProduct, tags: string[]): BuilderProduct['badge'] | undefined {
  const joined = tags.join(' ').toLowerCase();

  if (joined.includes('limited')) return 'Limited';
  if (joined.includes('best seller') || joined.includes('bestseller')) return 'Best Sellers';

  if (product.published_at) {
    const published = new Date(product.published_at).getTime();
    const daysOld = (Date.now() - published) / (1000 * 60 * 60 * 24);
    if (daysOld <= 45) {
      return 'New';
    }
  }

  return undefined;
}

function normalizeProduct(product: RawProduct): BuilderProduct {
  const tags = normalizeTags(product.tags);
  const firstVariant = product.variants?.[0];
  const firstPrice = firstVariant?.price ?? '0.00';
  const images = (product.images ?? []).map((image) => image.src).filter(Boolean) as string[];
  const karatOptions = extractKaratOptions(tags);
  const goldOptions = extractGoldOptions(tags);
  const pinOptions = extractOptionValues(tags, 'opt-Pin');

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: stripHtml(product.body_html) || `${product.title} from the NorVoch collection.`,
    price: `$${Number(firstPrice).toFixed(0)}`,
    material: inferMaterial(tags, product.product_type ?? 'Fine jewelry'),
    category: inferCategory(product, tags),
    badge: inferBadge(product, tags),
    compatibleAnchors: inferAnchors(tags),
    tags,
    images,
    productType: product.product_type ?? 'Jewelry',
    available: Boolean(firstVariant?.available ?? true),
    karatOptions,
    goldOptions,
    pinOptions,
  };
}

async function readCachedProducts(): Promise<BuilderProduct[]> {
  try {
    const content = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(content) as BuilderProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchAllNorvochProducts() {
  const allProducts: RawProduct[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${SHOP_URL}${page}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`NorVoch product request failed with status ${response.status}`);
    }

    const data = (await response.json()) as { products?: RawProduct[] };
    const pageProducts = data.products ?? [];

    if (pageProducts.length === 0) {
      break;
    }

    allProducts.push(...pageProducts);
    page += 1;
  }

  return allProducts;
}

export async function getBuilderProductsWithMeta(options?: { source?: BuilderProductsSource }) {
  const source = options?.source ?? 'live';
  const cached = await readCachedProducts();
  const cachedCount = cached.length;

  if (source === 'cache-first' && cached.length > 0) {
    console.info(`[norvoch-products] Using cached products (cache-first), count=${cached.length}`);
    return {
      products: cached,
      meta: {
        requestedSource: source,
        resolvedSource: 'cache',
        usedFallback: false,
        cachedCount,
        liveCount: 0,
      } satisfies BuilderProductsMeta,
    };
  }

  try {
    const rawProducts = await fetchAllNorvochProducts();
    const normalized = rawProducts.map(normalizeProduct).filter((product) => product.available);
    const liveCount = normalized.length;

    console.info(
      `[norvoch-products] Live fetch completed, raw=${rawProducts.length}, available=${liveCount}`,
    );

    if (normalized.length > 0) {
      return {
        products: normalized,
        meta: {
          requestedSource: source,
          resolvedSource: 'live',
          usedFallback: false,
          cachedCount,
          liveCount,
        } satisfies BuilderProductsMeta,
      };
    }

    if (cached.length > 0) {
      console.warn(
        '[norvoch-products] Live fetch returned zero available products, falling back to cache',
      );
      return {
        products: cached,
        meta: {
          requestedSource: source,
          resolvedSource: 'cache',
          usedFallback: true,
          cachedCount,
          liveCount,
          error: 'Live fetch returned zero available products',
        } satisfies BuilderProductsMeta,
      };
    }

    console.warn('[norvoch-products] No live products and no cached fallback available');
    return {
      products: [],
      meta: {
        requestedSource: source,
        resolvedSource: 'empty',
        usedFallback: false,
        cachedCount,
        liveCount,
        error: 'No products available from live source or cache',
      } satisfies BuilderProductsMeta,
    };
  } catch {
    const errorMessage = '[norvoch-products] Live fetch failed';
    console.error(errorMessage);

    if (cached.length > 0) {
      console.warn('[norvoch-products] Falling back to cached products after live fetch failure');
      return {
        products: cached,
        meta: {
          requestedSource: source,
          resolvedSource: 'cache',
          usedFallback: true,
          cachedCount,
          liveCount: 0,
          error: 'Live fetch failed; served cached products',
        } satisfies BuilderProductsMeta,
      };
    }

    return {
      products: [],
      meta: {
        requestedSource: source,
        resolvedSource: 'empty',
        usedFallback: false,
        cachedCount,
        liveCount: 0,
        error: 'Live fetch failed and cache is empty',
      } satisfies BuilderProductsMeta,
    };
  }
}

export async function getBuilderProducts(options?: { source?: BuilderProductsSource }) {
  const result = await getBuilderProductsWithMeta(options);
  return result.products;
}
