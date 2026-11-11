/**
 * Build-time schema check for everything in data/. Runs before `next build` (prebuild) and in CI.
 * Fails the build on schema errors; prints warnings for curation-rule gaps.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { DIMS } from '../lib/types';
import { nearestArchetype } from '../lib/match';
import { toVec } from '../lib/vec';

const root = path.resolve(import.meta.dirname, '..');
const load = (f: string) => JSON.parse(readFileSync(path.join(root, 'data', f), 'utf8'));

const accords = z.record(z.enum(DIMS), z.number().int().min(0).max(5));
const l10n = z.object({ en: z.string().min(1), zh: z.string().min(1) });
const tag = z.enum(['office', 'heat', 'evening', 'casual']);

const fragrance = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    brand: z.string().min(1),
    name: z.string().min(1),
    concentration: z.string(),
    accords,
    gender: z.enum(['fem', 'uni', 'masc']),
    projection: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    crowd_pleaser: z.number().min(0).max(1),
    heat_ok: z.boolean(),
    occasions: z.array(tag),
    price_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    price_sgd: z.number().positive(),
    price_note: z.string(),
    available_sg: z.boolean(),
    recommendable: z.boolean(),
    sample_url: z.string().url().nullable(),
    buy_url: z.string().url().nullable(),
    gift_url: z.string().url().nullable().optional(),
    blurb_en: z.string().min(1),
    blurb_zh: z.string().min(1),
  })
  .strict(); // no commission field, ever: ranking must not see it

const option = z
  .object({
    id: z.string(),
    label: l10n,
    why: l10n.optional(),
    emoji: z.string().optional(),
    image: z.string().optional(),
    colors: z.tuple([z.string(), z.string()]).optional(),
    sub: l10n.optional(),
    vec: accords.optional(),
    dims: z.array(z.enum(DIMS)).optional(),
    tag: tag.nullable().optional(),
    value: z.number().optional(),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal('all')]).optional(),
    style: z.enum(['fem', 'uni', 'masc']).nullable().optional(),
    letters: z.string().length(4).optional(),
    element: z.enum(['fire', 'earth', 'air', 'water']).optional(),
    exclusive: z.boolean().optional(),
  })
  .strict();

const question = z
  .object({
    id: z.string(),
    n: z.number(),
    kind: z.enum(['single', 'multi', 'anchors', 'grid16', 'signs']),
    required: z.boolean(),
    max: z.number().optional(),
    cols: z.number().optional(),
    title: l10n,
    titleGift: l10n.optional(),
    hint: l10n.optional(),
    hintGift: l10n.optional(),
    options: z.array(option),
  })
  .strict();

const archetype = z.object({ id: z.string(), name: l10n, vec: accords, color: z.string().regex(/^#[0-9A-F]{6}$/i), read: l10n }).strict();
const anchor = z.object({ id: z.string(), brand: z.string(), name: z.string(), accords }).strict();
const copy = z.object({ ui: z.record(z.string()), type16: z.record(z.string()), sign: z.record(z.string()) });

const fr = z.array(fragrance).parse(load('fragrances.json'));
const an = z.array(anchor).parse(load('anchors.json'));
const qs = z.array(question).length(12).parse(load('questions.json'));
const ar = z.array(archetype).length(10).parse(load('archetypes.json'));
const en = copy.parse(load('copy.en.json'));
const zh = copy.parse(load('copy.zh.json'));

const errors: string[] = [];
const warn: string[] = [];

const ids = [...fr.map((f) => f.id), ...an.map((a) => a.id)];
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) errors.push(`Duplicate fragrance ids: ${dupes.join(', ')}`);

const zhNames = z
  .object({ _note: z.string().optional(), brands: z.record(z.array(z.string().min(1)).min(1)), names: z.record(z.array(z.string().min(1)).min(1)) })
  .strict()
  .parse(load('zh-names.json'));
const brands = new Set([...fr, ...an].map((f) => f.brand));
for (const b of Object.keys(zhNames.brands)) if (!brands.has(b)) errors.push(`zh-names.json: unknown brand "${b}"`);
for (const id of Object.keys(zhNames.names)) if (!ids.includes(id)) errors.push(`zh-names.json: unknown scent id "${id}"`);

for (const k of Object.keys(en.ui)) if (!(k in zh.ui)) errors.push(`copy.zh.json missing ui.${k}`);
for (const k of Object.keys(zh.ui)) if (!(k in en.ui)) errors.push(`copy.en.json missing ui.${k}`);
const types = qs.find((q) => q.id === 'q9')!.options.map((o) => o.id);
const signs = qs.find((q) => q.id === 'q10')!.options.map((o) => o.id);
for (const c of [en, zh]) {
  for (const t of types) if (!c.type16[t]) errors.push(`copy missing type16.${t}`);
  for (const s of signs) if (!c.sign[s]) errors.push(`copy missing sign.${s}`);
}

// Curation rules (warnings)
const rec = fr.filter((f) => f.recommendable && f.available_sg);
const heatShare = rec.filter((f) => f.heat_ok).length / rec.length;
if (heatShare < 0.3) warn.push(`Only ${(heatShare * 100).toFixed(0)}% of recommendable scents are heat_ok (target 30%+).`);
const perType: Record<string, number> = {};
for (const f of rec) {
  const t = nearestArchetype(toVec(f.accords), ar).type.id;
  perType[t] = (perType[t] ?? 0) + 1;
}
for (const a of ar) if ((perType[a.id] ?? 0) < 8) warn.push(`Scent type ${a.id} has ${perType[a.id] ?? 0} recommendable scents (target 8+).`);
for (const f of rec) {
  const v = f.accords;
  const fresh = (v.CIT ?? 0) + (v.GRN ?? 0) + (v.AQU ?? 0) + (v.MUS ?? 0);
  const heavy = (v.GOU ?? 0) + (v.AMB ?? 0);
  const suggested = fresh >= 8 && heavy <= 4;
  if (suggested && !f.heat_ok) warn.push(`${f.id}: heat rule suggests heat_ok, curator says no.`);
}

for (const w of warn) console.warn(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}
console.log(`Data OK: ${fr.length} fragrances (${rec.length} recommendable), ${an.length} anchors, ${qs.length} questions, ${ar.length} types.`);
