/**
 * Pure, deterministic matching: match(answers, data) → result.
 * Same answers always give the same type and picks. No I/O, no randomness, no clock.
 */
import { ACCORD_PHRASE, ELEMENT_VEC, LETTER_VEC, TAG_VEC } from './accords';
import type { Anchor, Answers, Archetype, Dim, Fragrance, Gender, L10n, Option, QuizData, Tag, Tier, Vec } from './types';
import { DIMS } from './types';
import { add, argmax, cosine, norm, toVec, zero } from './vec';

export const WEIGHTS = { A: 0.4, S: 0.35, O: 0.1, P: 0.1, Z: 0.05 } as const;
export const DISLIKE_DAMP = 0.3;
type CompKey = keyof typeof WEIGHTS;

export type Slot = 'best' | 'also' | 'wild' | 'easy' | 'treat';

export interface Pick {
  fragrance: Fragrance;
  slot: Slot;
  score: number;
  matchPct: number;
  why: L10n;
}

export interface UserContext {
  u: Vec;
  proj: number;
  tags: Tag[];
  disliked: Dim[];
  anchorIds: string[];
  budget: Tier | 'all';
  style: Gender | null;
}

export interface MatchResult {
  mode: 'self' | 'gift';
  ctx: UserContext;
  type: Archetype;
  typeScores: { id: string; cos: number }[];
  picks: Pick[];
  type16: string | null;
  sign: Option | null;
  echo: { anchor: Anchor; anchorType: Archetype; same: boolean } | null;
  topAccords: Dim[];
  /** Which filter rules had to be relaxed to find 3 picks (for debugging and tests). */
  relaxed: string[];
}

// ---------- answer helpers ----------

function opts(data: QuizData, answers: Answers, qid: string): Option[] {
  const q = data.questions.find((x) => x.id === qid);
  if (!q) return [];
  const ids = answers[qid] ?? [];
  return ids.map((id) => q.options.find((o) => o.id === id)).filter((o): o is Option => !!o);
}
const one = (data: QuizData, answers: Answers, qid: string) => opts(data, answers, qid)[0];

export function anchorLookup(data: QuizData) {
  const m = new Map<string, Anchor>();
  for (const f of data.fragrances) m.set(f.id, f);
  for (const a of data.anchors) m.set(a.id, a);
  return m;
}

// ---------- step 1: user vector ----------

interface Part {
  label: L10n | null; // null = never named in "why" lines (personality, sign)
  vec: Vec;
}

export function buildUserVector(answers: Answers, data: QuizData) {
  const lookup = anchorLookup(data);
  const parts: Record<CompKey, Part[]> = { A: [], S: [], O: [], P: [], Z: [] };

  const anchors = (answers.q2 ?? []).map((id) => lookup.get(id)).filter((a): a is Anchor => !!a);
  for (const a of anchors) {
    const name = `${a.brand} ${a.name}`;
    parts.A.push({ label: { en: name, zh: name }, vec: toVec(a.accords).map((x) => x / anchors.length) });
  }
  for (const qid of ['q4', 'q5', 'q6']) {
    const o = one(data, answers, qid);
    if (o) parts.S.push({ label: o.why ?? o.label, vec: toVec(o.vec) });
  }
  for (const o of opts(data, answers, 'q7')) {
    if (o.tag) parts.O.push({ label: o.why ?? o.label, vec: toVec(TAG_VEC[o.tag]) });
  }
  const t16 = one(data, answers, 'q9');
  if (t16?.letters) {
    for (const ch of t16.letters) parts.P.push({ label: null, vec: toVec(LETTER_VEC[ch]) });
  }
  const sign = one(data, answers, 'q10');
  if (sign?.element) parts.Z.push({ label: null, vec: toVec(ELEMENT_VEC[sign.element]) });

  // Combine with weights; a missing component's weight moves to S.
  const comp = {} as Record<CompKey, Vec>;
  const w: Record<CompKey, number> = { ...WEIGHTS };
  for (const k of Object.keys(parts) as CompKey[]) {
    comp[k] = parts[k].reduce((acc, p) => add(acc, p.vec), zero());
    if (k !== 'S' && norm(comp[k]) === 0) {
      w.S += w[k];
      w[k] = 0;
    }
  }

  let u = zero();
  // contrib[d] = best (label, amount) for dimension d, from named answers only.
  const contrib: ({ label: L10n; amount: number } | null)[] = DIMS.map(() => null);
  for (const k of Object.keys(parts) as CompKey[]) {
    const n = norm(comp[k]);
    if (!w[k] || n === 0) continue;
    u = add(u, comp[k], w[k] / n);
    for (const p of parts[k]) {
      if (!p.label) continue;
      p.vec.forEach((x, d) => {
        const amount = (w[k] * x) / n;
        if (amount > 0 && (!contrib[d] || amount > contrib[d]!.amount)) contrib[d] = { label: p.label!, amount };
      });
    }
  }

  const disliked = [...new Set(opts(data, answers, 'q3').flatMap((o) => o.dims ?? []))] as Dim[];
  for (const d of disliked) u[DIMS.indexOf(d)] *= DISLIKE_DAMP;

  return { u, contrib, anchors, weights: w, disliked };
}

// ---------- step 2: filter ----------

interface Relax {
  style: boolean;
  office: boolean;
  widen: number; // price tiers either side
  heat: boolean; // beyond spec: last resort only, logged in `relaxed`
}

function passes(f: Fragrance, ctx: UserContext, r: Relax, tierOverride?: Tier): boolean {
  if (!f.recommendable || !f.available_sg) return false;
  const tier = tierOverride ?? ctx.budget;
  if (tier !== 'all' && Math.abs(f.price_tier - tier) > r.widen) return false; // rule 1
  if (ctx.anchorIds.includes(f.id)) return false; // rule 2: never relaxed
  for (const d of ctx.disliked) if ((f.accords[d] ?? 0) >= 3) return false; // rule 3: never relaxed
  if (!r.heat && ctx.tags.includes('heat') && !f.heat_ok) return false; // rule 4
  if (!r.office && ctx.tags.includes('office') && f.projection >= 3) return false; // rule 5
  if (!r.style && ctx.style) {
    // rule 6
    const ok = ctx.style === 'fem' ? f.gender !== 'masc' : ctx.style === 'masc' ? f.gender !== 'fem' : f.gender === 'uni';
    if (!ok) return false;
  }
  return true;
}

const RELAX_STEPS: [string, Relax][] = [
  ['none', { style: false, office: false, widen: 0, heat: false }],
  ['style', { style: true, office: false, widen: 0, heat: false }],
  ['office', { style: true, office: true, widen: 0, heat: false }],
  ['price+1', { style: true, office: true, widen: 1, heat: false }],
  ['price+2', { style: true, office: true, widen: 2, heat: false }],
  ['heat', { style: true, office: true, widen: 2, heat: true }],
];

function filterWithRelax(data: QuizData, ctx: UserContext, min: number, tier?: Tier) {
  const relaxed: string[] = [];
  for (const [name, r] of RELAX_STEPS) {
    if (name !== 'none') relaxed.push(name);
    const list = data.fragrances.filter((f) => passes(f, ctx, r, tier));
    if (list.length >= min || name === 'heat') return { list, relaxed };
  }
  return { list: [], relaxed };
}

// ---------- step 3: score ----------

export function scoreFragrance(f: Fragrance, ctx: UserContext): number {
  const fv = toVec(f.accords);
  const tagHits = ctx.tags.filter((t) => f.occasions.includes(t)).length;
  return cosine(ctx.u, fv) - 0.06 * Math.abs(f.projection - ctx.proj) + 0.03 * tagHits + 0.04 * f.crowd_pleaser;
}

interface Scored {
  f: Fragrance;
  v: Vec;
  score: number;
}

function rank(list: Fragrance[], ctx: UserContext): Scored[] {
  return list
    .map((f) => ({ f, v: toVec(f.accords), score: scoreFragrance(f, ctx) }))
    .sort((a, b) => b.score - a.score || b.f.crowd_pleaser - a.f.crowd_pleaser || a.f.price_sgd - b.f.price_sgd || (a.f.id < b.f.id ? -1 : 1));
}

// ---------- step 4: pick 3 ----------

const DIVERSITY = 0.95;

function choose(ranked: Scored[], picked: Scored[], ...prefs: ((s: Scored) => boolean)[]): Scored | undefined {
  const fresh = ranked.filter((s) => !picked.includes(s));
  const diverse = fresh.filter((s) => picked.every((p) => cosine(s.v, p.v) < DIVERSITY));
  for (const pref of prefs) {
    const hit = diverse.find(pref);
    if (hit) return hit;
  }
  return diverse[0] ?? fresh[0];
}

// ---------- step 5: explanations ----------

function whyLine(f: Fragrance, ctx: UserContext, contrib: ReturnType<typeof buildUserVector>['contrib']): L10n {
  const fv = toVec(f.accords);
  const dims = DIMS.map((_, i) => i)
    .filter((i) => ctx.u[i] * fv[i] > 0)
    .sort((a, b) => ctx.u[b] * fv[b] - ctx.u[a] * fv[a])
    .slice(0, 2);
  const [d1, d2] = dims.length === 2 ? dims : [argmax(fv), dims[0] ?? argmax(fv)];
  const p1 = ACCORD_PHRASE[DIMS[d1]];
  const p2 = ACCORD_PHRASE[DIMS[d2]];
  const labels = [contrib[d1]?.label, contrib[d2]?.label].filter((l): l is L10n => !!l);
  const uniq = labels.filter((l, i) => labels.findIndex((x) => x.en === l.en) === i);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const accEn = d1 === d2 ? cap(p1.en) : `${cap(p1.en)} and ${p2.en}`;
  const accZh = d1 === d2 ? p1.zh : `${p1.zh}和${p2.zh}`;
  let en: string;
  let zh: string;
  if (uniq.length) {
    en = `${accEn}, like the ${uniq.map((l) => l.en).join(' and ')} you picked.`;
    zh = `${accZh}，就像你选的${uniq.map((l) => l.zh).join('和')}。`;
  } else {
    en = `${accEn}, right where your answers lean.`;
    zh = `${accZh}，正是你答案里偏爱的味道。`;
  }

  const t = ctx.tags;
  if (t.includes('office') && f.projection <= 2) {
    en += ' Stays close in aircon.';
    zh += '在冷气房里也刚刚好。';
  } else if (t.includes('heat') && f.heat_ok) {
    en += ' Holds up in the heat.';
    zh += '大热天也不闷。';
  } else if (t.includes('evening') && f.occasions.includes('evening')) {
    en += ' Made for after dark.';
    zh += '很适合夜晚。';
  } else if (t.includes('casual') && f.occasions.includes('casual')) {
    en += ' Easy on weekends.';
    zh += '周末随手一喷。';
  }
  return { en, zh };
}

export function nearestArchetype(v: Vec, archetypes: Archetype[]) {
  const scores = archetypes.map((a) => ({ id: a.id, cos: cosine(v, toVec(a.vec)) }));
  let best = 0;
  scores.forEach((s, i) => {
    if (s.cos > scores[best].cos) best = i;
  });
  return { type: archetypes[best], scores };
}

export const displayPct = (score: number) => Math.min(98, Math.max(72, Math.round(100 * score)));

// ---------- main ----------

export function userContext(answers: Answers, data: QuizData) {
  const built = buildUserVector(answers, data);
  const budgetOpt = one(data, answers, 'q11');
  const styleOpt = one(data, answers, 'q12');
  const ctx: UserContext = {
    u: built.u,
    proj: one(data, answers, 'q8')?.value ?? 2,
    tags: opts(data, answers, 'q7')
      .map((o) => o.tag)
      .filter((t): t is Tag => !!t),
    disliked: built.disliked,
    anchorIds: built.anchors.map((a) => a.id),
    budget: budgetOpt?.tier ?? 'all',
    style: styleOpt?.style ?? null,
  };
  return { ctx, built };
}

/** Steps 2 to 4 for a given user context: filter, score, pick. */
export function selectPicks(ctx: UserContext, data: QuizData) {
  const picked: { s: Scored; slot: Slot }[] = [];
  let relaxed: string[] = [];

  if (ctx.budget === 'all') {
    const slots: [Tier, Slot][] = [
      [1, 'easy'],
      [2, 'best'],
      [3, 'treat'],
    ];
    for (const [tier, slot] of slots) {
      const r = filterWithRelax(data, ctx, 1, tier);
      relaxed = [...new Set([...relaxed, ...r.relaxed])];
      const s = choose(rank(r.list, ctx), picked.map((p) => p.s));
      if (s) picked.push({ s, slot });
    }
  } else {
    const r = filterWithRelax(data, ctx, 3);
    relaxed = r.relaxed;
    const ranked = rank(r.list, ctx);
    const p1 = ranked[0];
    if (p1) {
      picked.push({ s: p1, slot: 'best' });
      const p2 = choose(ranked, [p1], (s) => s.f.brand !== p1.f.brand);
      if (p2) picked.push({ s: p2, slot: 'also' });
      const top1 = argmax(p1.v);
      const p3 = choose(ranked, picked.map((p) => p.s), (s) => argmax(s.v) !== top1);
      if (p3) picked.push({ s: p3, slot: 'wild' });
    }
  }
  return { picked, relaxed };
}

export function match(answers: Answers, data: QuizData): MatchResult {
  const { ctx, built } = userContext(answers, data);
  const { type, scores } = nearestArchetype(ctx.u, data.archetypes);
  const { picked, relaxed } = selectPicks(ctx, data);

  const picks: Pick[] = picked.map(({ s, slot }) => ({
    fragrance: s.f,
    slot,
    score: s.score,
    matchPct: displayPct(s.score),
    why: whyLine(s.f, ctx, built.contrib),
  }));

  let echo: MatchResult['echo'] = null;
  if (built.anchors.length) {
    const anchor = [...built.anchors].sort((a, b) => cosine(toVec(b.accords), ctx.u) - cosine(toVec(a.accords), ctx.u))[0];
    const anchorType = nearestArchetype(toVec(anchor.accords), data.archetypes).type;
    echo = { anchor, anchorType, same: anchorType.id === type.id };
  }

  const topAccords = DIMS.map((d, i) => ({ d, x: ctx.u[i] }))
    .filter((x) => x.x > 0)
    .sort((a, b) => b.x - a.x)
    .slice(0, 3)
    .map((x) => x.d);

  return {
    mode: one(data, answers, 'q1')?.id === 'gift' ? 'gift' : 'self',
    ctx,
    type,
    typeScores: scores,
    picks,
    type16: one(data, answers, 'q9')?.id ?? null,
    sign: one(data, answers, 'q10') ?? null,
    echo,
    topAccords,
    relaxed,
  };
}
