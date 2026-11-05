/**
 * Turns the curator seed files (data/seed/*.psv) into the JSON the app ships:
 * data/fragrances.json (recommendable catalogue + overlay fields) and data/anchors.json (Q2-only search list).
 *
 * Once a fragrance API is licensed, the weekly sync (see README) writes the API half of these fields
 * and the curator overlay keeps price, stock, links and heat_ok.
 *
 * Run: npx tsx scripts/build-catalogue.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DIMS, type Accords, type Anchor, type Dim, type Fragrance, type Tag } from '../lib/types';

const root = path.resolve(import.meta.dirname, '..');

function rows(file: string): string[][] {
  return readFileSync(path.join(root, file), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((c) => c.trim()));
}

function parseAccords(s: string): Accords {
  const out: Accords = {};
  for (const tok of s.split(/\s+/)) {
    const m = /^([A-Z]{3})([0-5])$/.exec(tok);
    if (!m || !DIMS.includes(m[1] as Dim)) throw new Error(`Bad accord token "${tok}" in "${s}"`);
    out[m[1] as Dim] = Number(m[2]);
  }
  return out;
}

const OCC: Record<string, Tag> = { o: 'office', h: 'heat', e: 'evening', c: 'casual' };

const fragrances: Fragrance[] = rows('data/seed/catalogue.psv').map((r, i) => {
  if (r.length !== 15) throw new Error(`catalogue.psv row ${i + 1} has ${r.length} columns: ${r[0]}`);
  const [id, brand, name, concentration, acc, gender, proj, crowd, heat, occ, tier, price, size, blurbEn, blurbZh] = r;
  return {
    id,
    brand,
    name,
    concentration,
    accords: parseAccords(acc),
    gender: gender as Fragrance['gender'],
    projection: Number(proj) as Fragrance['projection'],
    crowd_pleaser: Number(crowd),
    heat_ok: heat === '1',
    occasions: [...occ].map((c) => OCC[c]),
    price_tier: Number(tier) as Fragrance['price_tier'],
    price_sgd: Number(price),
    price_note: `~S$${price} / ${size}`,
    available_sg: true,
    recommendable: true,
    sample_url: null,
    buy_url: null,
    gift_url: null,
    blurb_en: blurbEn,
    blurb_zh: blurbZh,
  };
});

const anchors: Anchor[] = rows('data/seed/anchors.psv').map(([id, brand, name, acc]) => ({
  id,
  brand,
  name,
  accords: parseAccords(acc),
}));

writeFileSync(path.join(root, 'data/fragrances.json'), JSON.stringify(fragrances, null, 1) + '\n');
writeFileSync(path.join(root, 'data/anchors.json'), JSON.stringify(anchors, null, 1) + '\n');
console.log(`Wrote ${fragrances.length} fragrances and ${anchors.length} anchors.`);
