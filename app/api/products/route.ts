import { NextRequest, NextResponse } from 'next/server';
import { getBuilderProductsWithMeta } from '@/lib/norvoch-products';

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source') === 'cache-first' ? 'cache-first' : 'live';
  const { products, meta } = await getBuilderProductsWithMeta({ source });

  console.info(
    `[api/products] requested=${meta.requestedSource} resolved=${meta.resolvedSource} fallback=${meta.usedFallback} count=${products.length}`,
  );

  if (meta.error) {
    console.warn(`[api/products] ${meta.error}`);
  }

  return NextResponse.json({
    requestedSource: meta.requestedSource,
    resolvedSource: meta.resolvedSource,
    usedFallback: meta.usedFallback,
    cachedCount: meta.cachedCount,
    liveCount: meta.liveCount,
    error: meta.error ?? null,
    count: products.length,
    products,
  });
}
