/**
 * Writes data/zh-fold.json: Traditional -> Simplified for every character used in data/zh-names.json,
 * so a search typed in Traditional (香奈兒, 迪奧, 祖瑪瓏) finds the Simplified names.
 * Only the characters we actually search on are shipped, so the browser bundle stays tiny.
 *
 * Run after editing data/zh-names.json: npm run zh-fold
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as OpenCC from 'opencc-js';

const root = path.resolve(import.meta.dirname, '..');
const names = JSON.parse(readFileSync(path.join(root, 'data/zh-names.json'), 'utf8')) as {
  brands: Record<string, string[]>;
  names: Record<string, string[]>;
};

const chars = new Set<string>();
for (const list of [...Object.values(names.brands), ...Object.values(names.names)])
  for (const s of list) for (const c of s) if (/\p{Script=Han}/u.test(c)) chars.add(c);

const variants = (['t', 'tw', 'hk'] as const).map((to) => OpenCC.Converter({ from: 'cn', to }));
const fold: Record<string, string> = {};
for (const c of [...chars].sort()) {
  for (const toTrad of variants) {
    const t = toTrad(c);
    if (t !== c && [...t].length === 1) fold[t] = c;
  }
}

writeFileSync(path.join(root, 'data/zh-fold.json'), JSON.stringify(fold, Object.keys(fold).sort()) + '\n');
console.log(`Wrote ${Object.keys(fold).length} Traditional -> Simplified pairs for ${chars.size} characters.`);
