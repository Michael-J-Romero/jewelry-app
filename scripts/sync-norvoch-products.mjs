import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SHOP_URL = 'https://norvoch.com/products.json?limit=250&page=';
const dataDir = path.join(process.cwd(), 'data');

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function inferCategory(product, tags) {
  const haystack = `${product.product_type ?? ''} ${product.title} ${tags.join(' ')}`.toLowerCase();
  if (haystack.includes('clicker')) return 'Clickers';
  if (haystack.includes('ring') || haystack.includes('hoop')) return 'Rings';
  if (haystack.includes('chain')) return 'Chains';
  if (haystack.includes('charm')) return 'Charms';
  return 'Ends';
}

function inferAnchors(tags) {
  const joined = tags.join(' ').toLowerCase();
  const anchors = [];
  if (joined.includes('helix') || joined.includes('vertical helix')) anchors.push('helix');
  if (joined.includes('flat')) anchors.push('flat');
  if (joined.includes('conch')) anchors.push('conch');
  if (joined.includes('lobe')) anchors.push('lobe-1', 'lobe-2');
  return anchors.length ? [...new Set(anchors)] : ['helix', 'flat', 'conch', 'lobe-1', 'lobe-2'];
}

function inferBadge(product, tags) {
  const joined = tags.join(' ').toLowerCase();
  if (joined.includes('limited')) return 'Limited';
  if (joined.includes('best seller') || joined.includes('bestseller')) return 'Best Sellers';
  if (product.published_at) {
    const published = new Date(product.published_at).getTime();
    const daysOld = (Date.now() - published) / (1000 * 60 * 60 * 24);
    if (daysOld <= 45) return 'New';
  }
  return undefined;
}

async function fetchAllProducts() {
  let page = 1;
  const allProducts = [];

  while (true) {
    const response = await fetch(`${SHOP_URL}${page}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const pageProducts = data.products ?? [];

    if (pageProducts.length === 0) break;

    allProducts.push(...pageProducts);
    page += 1;
  }

  return allProducts;
}

function normalizeProduct(product) {
  const tags = normalizeTags(product.tags);
  const firstVariant = product.variants?.[0] ?? {};

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: stripHtml(product.body_html) || `${product.title} from the NorVoch collection.`,
    price: `$${Number(firstVariant.price ?? 0).toFixed(0)}`,
    material: tags.find((tag) => /gold|silver|opal|pearl/i.test(tag)) ?? product.product_type ?? 'Fine jewelry',
    category: inferCategory(product, tags),
    badge: inferBadge(product, tags),
    compatibleAnchors: inferAnchors(tags),
    tags,
    images: (product.images ?? []).map((image) => image.src).filter(Boolean),
    productType: product.product_type ?? 'Jewelry',
    available: Boolean(firstVariant.available ?? true),
  };
}

async function main() {
  const rawProducts = await fetchAllProducts();
  const normalizedProducts = rawProducts.map(normalizeProduct);

  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, 'norvoch-products.raw.json'), JSON.stringify(rawProducts, null, 2));
  await writeFile(path.join(dataDir, 'norvoch-products.json'), JSON.stringify(normalizedProducts, null, 2));

  console.log(`Saved ${rawProducts.length} raw products and ${normalizedProducts.length} normalized products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
