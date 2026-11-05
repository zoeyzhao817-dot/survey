import { NextResponse } from 'next/server';
import { searchAnchors } from '@/lib/data';

/**
 * Q2 autocomplete proxy. Searches the synced catalogue first. When an API provider is licensed, set
 * FRAGRANCE_API_URL / FRAGRANCE_API_KEY and implement `searchUpstream` so the key never reaches the browser.
 * The browser already searches the bundled catalogue directly; this route is the server-side fallback.
 */
export const runtime = 'edge';

async function searchUpstream(q: string) {
  const url = process.env.FRAGRANCE_API_URL;
  const key = process.env.FRAGRANCE_API_KEY;
  if (!url || !key) return [];
  // TODO: map the provider's response to { id, brand, name, accords } with data/accord-map.json once a provider is chosen.
  void q;
  return [];
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.slice(0, 60) ?? '';
  let results: { id: string; brand: string; name: string }[] = searchAnchors(q, 8).map(({ id, brand, name }) => ({ id, brand, name }));
  if (!results.length && q.trim().length >= 3) results = await searchUpstream(q);
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } });
}
