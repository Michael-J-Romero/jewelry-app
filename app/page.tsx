import { NorvochBuilderShell } from '@/components/norvoch-builder-shell';
import { getBuilderProductsWithMeta } from '@/lib/norvoch-products';

export default async function Home() {
  const { products } = await getBuilderProductsWithMeta({ source: 'cache-first' });
  return <NorvochBuilderShell initialProducts={products} />;
}
