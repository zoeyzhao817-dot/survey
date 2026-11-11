import fragrances from '@/data/fragrances.json';
import anchors from '@/data/anchors.json';
import questions from '@/data/questions.json';
import archetypes from '@/data/archetypes.json';
import wearStyles from '@/data/wear-styles.json';
import rarity from '@/data/rarity.json';
import tileManifest from '@/data/tile-manifest.json';
import type { Anchor, Archetype, Fragrance, Question, QuizData, Rarity, WearStyle } from './types';

/** All app data, shipped with the bundle. Schema is validated at build time by scripts/validate-data.ts. */
export const DATA: QuizData = {
  fragrances: fragrances as Fragrance[],
  anchors: anchors as Anchor[],
  questions: withPhotos(questions as unknown as Question[]),
  archetypes: archetypes as Archetype[],
  wearStyles: wearStyles as WearStyle[],
};

export const RARITY = rarity as Rarity;

/** Photo tiles are drop-in: files in public/tiles/ named {questionId}-{optionId}.webp, indexed by `npm run tiles`. */
function withPhotos(qs: Question[]): Question[] {
  const m = tileManifest as Record<string, string>;
  return qs.map((q) => ({ ...q, options: q.options.map((o) => (m[`${q.id}-${o.id}`] && !o.image ? { ...o, image: m[`${q.id}-${o.id}`] } : o)) }));
}
export const nextQuestionImages = (step: number): string[] =>
  (DATA.questions[step]?.options ?? []).flatMap((o) => (o.image ? [`/tiles/${o.image}`] : []));

export const QUESTIONS = DATA.questions;
export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id)!;
export const archetypeById = (id: string) => DATA.archetypes.find((a) => a.id === id)!;

/** Everything a user can pick in Q2: the curated catalogue plus search-only anchors. */
export const SEARCHABLE: Anchor[] = [
  ...DATA.fragrances.map(({ id, brand, name, accords }) => ({ id, brand, name, accords })),
  ...DATA.anchors,
];
const searchIndex = new Map(SEARCHABLE.map((a) => [a.id, a]));
export const findAnchor = (id: string) => searchIndex.get(id);

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9一-鿿 ]+/g, ' ');

export function searchAnchors(q: string, limit = 6): Anchor[] {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { a: Anchor; s: number }[] = [];
  for (const a of SEARCHABLE) {
    const name = fold(a.name);
    const hay = `${fold(a.brand)} ${name}`;
    if (!terms.every((t) => hay.includes(t))) continue;
    // Prefer name-prefix hits, then shorter names.
    const s = (name.startsWith(terms[0]) ? 0 : 1) * 100 + hay.length;
    scored.push({ a, s });
  }
  return scored.sort((x, y) => x.s - y.s).slice(0, limit).map((x) => x.a);
}
