/**
 * Indexes photo tiles. Drop licensed photos into public/tiles/ named {questionId}-{optionId}.webp
 * (e.g. q4-rainforest.webp), add a credit for each to data/photo-credits.json, then run `npm run tiles`.
 * Options without a photo keep the gradient + emoji tile.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const questions = JSON.parse(readFileSync(path.join(root, 'data/questions.json'), 'utf8')) as { id: string; options: { id: string }[] }[];
const credits = JSON.parse(readFileSync(path.join(root, 'data/photo-credits.json'), 'utf8')) as Record<string, unknown>;
const valid = new Set(questions.flatMap((q) => q.options.map((o) => `${q.id}-${o.id}`)));

const manifest: Record<string, string> = {};
for (const file of readdirSync(path.join(root, 'public/tiles')).sort()) {
  const m = /^(q\d+-[a-z0-9]+)\.(webp|jpe?g|png|avif)$/i.exec(file);
  if (!m) continue;
  if (!valid.has(m[1])) {
    console.warn(`skip ${file}: no option "${m[1]}" in questions.json`);
    continue;
  }
  manifest[m[1]] = file;
  if (!credits[m[1]]) console.warn(`warn ${file}: add a credit to data/photo-credits.json (the build will fail without one)`);
}
writeFileSync(path.join(root, 'data/tile-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const missing = [...valid].filter((k) => /^q[3-7]-/.test(k) && !manifest[k]);
console.log(`${Object.keys(manifest).length} photo tiles indexed. Sensory tiles still without a photo: ${missing.length ? missing.join(', ') : 'none'}`);
