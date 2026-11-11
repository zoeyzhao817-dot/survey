/**
 * Replace the estimated rarity with real numbers.
 * Export result_view counts per scent_type from your analytics (first views only) as JSON, e.g.
 *   { "citrus": 412, "fig": 198, ... }
 * then run: npm run rarity -- counts.json
 * Refuses until there are 1,000 results and 30 per type, so one viral type can't skew the card.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const file = process.argv[2];
if (!file) throw new Error('usage: npm run rarity -- counts.json');
const counts = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number>;
const types = (JSON.parse(readFileSync(path.join(root, 'data/archetypes.json'), 'utf8')) as { id: string }[]).map((a) => a.id);
const total = types.reduce((s, t) => s + (counts[t] ?? 0), 0);
const thin = types.filter((t) => (counts[t] ?? 0) < 30);
if (total < 1000 || thin.length) {
  console.error(`Not enough data yet: ${total} results; under 30 for: ${thin.join(', ') || 'none'}. Keeping the estimate.`);
  process.exit(1);
}
const pct = Object.fromEntries(types.map((t) => [t, Math.max(1, Math.round((100 * counts[t]) / total))]));
const out = {
  source: 'analytics',
  updated: new Date().toISOString().slice(0, 10),
  note: `From ${total} results. Re-run monthly.`,
  types: pct,
};
writeFileSync(path.join(root, 'data/rarity.json'), JSON.stringify(out, null, 2) + '\n');
console.log(out);
