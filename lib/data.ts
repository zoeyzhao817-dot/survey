import fragrances from '@/data/fragrances.json';
import anchors from '@/data/anchors.json';
import questions from '@/data/questions.json';
import archetypes from '@/data/archetypes.json';
import zhNames from '@/data/zh-names.json';
import zhFold from '@/data/zh-fold.json';
import type { Anchor, Archetype, Fragrance, Question, QuizData } from './types';

/** All app data, shipped with the bundle. Schema is validated at build time by scripts/validate-data.ts. */
export const DATA: QuizData = {
  fragrances: fragrances as Fragrance[],
  anchors: anchors as Anchor[],
  questions: questions as unknown as Question[],
  archetypes: archetypes as Archetype[],
};

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

const ZH_BRANDS = zhNames.brands as Record<string, string[]>;
const ZH_NAMES = zhNames.names as Record<string, string[]>;
const T2S = zhFold as Record<string, string>;

/** Chinese brand and scent name to show in 中文 mode, when we have them. */
export const zhLabel = (a: Anchor) => ({ brand: ZH_BRANDS[a.brand]?.[0], name: ZH_NAMES[a.id]?.[0] });

/** Lowercase, strip accents, full-width -> half-width, Traditional -> Simplified, punctuation -> spaces. */
export const fold = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\p{Script=Han}/gu, (c) => T2S[c] ?? c)
    .replace(/[^a-z0-9\p{Script=Han} ]+/gu, ' ');

const nospace = (s: string) => s.replace(/\s+/g, '');
// People often add "perfume" to a Chinese search (迪奥香水); it says nothing about which scent.
const FILLER = /淡香精|淡香水|香水/g;

const INDEX = SEARCHABLE.map((a) => {
  const brands = [a.brand, ...(ZH_BRANDS[a.brand] ?? [])].map(fold);
  const names = [a.name, ...(ZH_NAMES[a.id] ?? [])].map(fold);
  return {
    a,
    names,
    hay: [...brands, ...names].join(' '),
    // Chinese is typed without spaces (迪奥旷野), so also match against brand+name glued together.
    glued: [...brands.flatMap((b) => names.map((n) => nospace(b + n))), ...names.map(nospace)],
    len: fold(`${a.brand} ${a.name}`).length,
  };
});

export function searchAnchors(q: string, limit = 6): Anchor[] {
  const terms = fold(q.replace(FILLER, ' ')).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const whole = terms.join('');
  const scored: { a: Anchor; s: number }[] = [];
  for (const { a, names, hay, glued, len } of INDEX) {
    if (!terms.every((t) => hay.includes(t)) && !glued.some((g) => g.includes(whole))) continue;
    // Prefer name-prefix hits, then shorter names.
    const prefix = names.some((n) => n.startsWith(terms[0]) || nospace(n).startsWith(whole));
    scored.push({ a, s: (prefix ? 0 : 1) * 100 + len });
  }
  return scored.sort((x, y) => x.s - y.s).slice(0, limit).map((x) => x.a);
}
