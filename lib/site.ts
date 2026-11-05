import type { Fragrance } from './types';

/** Host printed on the share card, e.g. "scenttype.app". Placeholder until the domain is chosen. */
export function siteHost(): string {
  if (process.env.NEXT_PUBLIC_SITE_HOST) return process.env.NEXT_PUBLIC_SITE_HOST;
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) return location.host;
  return 'scenttype.app';
}

/**
 * Until the curator adds affiliate links, buttons open a search so testers can still find each scent.
 * Set NEXT_PUBLIC_PLACEHOLDER_LINKS=0 to hide buttons without a curated URL (the spec's launch behaviour).
 */
export const PLACEHOLDER_LINKS = process.env.NEXT_PUBLIC_PLACEHOLDER_LINKS !== '0';

export function sampleUrl(f: Fragrance): string | null {
  if (f.sample_url) return f.sample_url;
  if (!PLACEHOLDER_LINKS) return null;
  return `https://www.google.com/search?q=${encodeURIComponent(`${f.brand} ${f.name} sample Singapore`)}`;
}

export function buyUrl(f: Fragrance): string | null {
  if (f.buy_url) return f.buy_url;
  if (!PLACEHOLDER_LINKS) return null;
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${f.brand} ${f.name} ${f.concentration}`)}`;
}

/** Absolute URL for an app path. The standalone preview build uses hash routing (#/r/...). */
export function absUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const w = window as unknown as { __HASH_ROUTER__?: boolean };
  if (w.__HASH_ROUTER__) return `${location.href.split('#')[0]}#${path}`;
  return `${location.origin}${path}`;
}
