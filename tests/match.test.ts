import { describe, expect, it } from 'vitest';
import { DATA, QUESTIONS } from '@/lib/data';
import { match, nearestArchetype, selectPicks, userContext } from '@/lib/match';
import { compare } from '@/lib/compare';
import type { Answers } from '@/lib/types';
import { toVec } from '@/lib/vec';
import personas from './personas.json';

const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;
const ids = (id: string) => q(id).options.map((o) => o.id);

// Small deterministic PRNG so the property test is reproducible.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
function randomAnswers(rand: () => number): Answers {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const some = <T,>(xs: T[], max: number) => [...new Set(Array.from({ length: 1 + Math.floor(rand() * max) }, () => pick(xs)))];
  const all = DATA.fragrances.map((f) => f.id).concat(DATA.anchors.map((a) => a.id));
  const avoid = rand() < 0.2 ? ['none'] : some(ids('q3').filter((x) => x !== 'none'), 2);
  const wear = rand() < 0.2 ? ['everywhere'] : some(ids('q7').filter((x) => x !== 'everywhere'), 2);
  return {
    q1: [pick(['self', 'gift'])],
    q2: rand() < 0.3 ? [] : some(all, 3),
    q3: avoid,
    q4: [pick(ids('q4'))],
    q5: [pick(ids('q5'))],
    q6: [pick(ids('q6'))],
    q7: wear,
    q8: [pick(ids('q8'))],
    q9: rand() < 0.3 ? [] : [pick(ids('q9'))],
    q10: rand() < 0.3 ? [] : [pick(ids('q10'))],
    q11: [pick(ids('q11'))],
    q12: rand() < 0.3 ? [] : [pick(ids('q12'))],
  };
}

describe('match', () => {
  it('is deterministic', () => {
    for (const p of personas) {
      const a = match(p.answers, DATA);
      const b = match(JSON.parse(JSON.stringify(p.answers)), DATA);
      expect(b.type.id).toBe(a.type.id);
      expect(b.picks.map((x) => x.fragrance.id)).toEqual(a.picks.map((x) => x.fragrance.id));
    }
  });

  it('works with only the 8 required answers', () => {
    const r = match({ q1: ['self'], q3: ['none'], q4: ['bakery'], q5: ['latte'], q6: ['cashmere'], q7: ['everywhere'], q8: ['arm'], q11: ['t2'] }, DATA);
    expect(r.type).toBeTruthy();
    expect(r.picks).toHaveLength(3);
    expect(r.type16).toBeNull();
    expect(r.sign).toBeNull();
    expect(r.echo).toBeNull();
  });

  it('property: never picks an anchor or anything scoring 3+ on a disliked accord; always 3 distinct picks', () => {
    const rand = rng(42);
    for (let i = 0; i < 3000; i++) {
      const a = randomAnswers(rand);
      const r = match(a, DATA);
      const { ctx } = userContext(a, DATA);
      expect(r.picks.length).toBe(3);
      expect(new Set(r.picks.map((p) => p.fragrance.id)).size).toBe(3);
      for (const p of r.picks) {
        expect(a.q2).not.toContain(p.fragrance.id);
        for (const d of ctx.disliked) expect(p.fragrance.accords[d] ?? 0).toBeLessThan(3);
        expect(p.matchPct).toBeGreaterThanOrEqual(72);
        expect(p.matchPct).toBeLessThanOrEqual(98);
        expect(p.why.en.length).toBeGreaterThan(10);
        expect(p.why.zh.length).toBeGreaterThan(4);
      }
    }
  });

  it('exhaustive: every scent type returns 3 picks under every Q11 tier, Q7 combination and Q12 lean', () => {
    const wearCombos: string[][] = [['everywhere']];
    const tags = ['office', 'heat', 'evening', 'casual'];
    for (let i = 0; i < tags.length; i++) {
      wearCombos.push([tags[i]]);
      for (let j = i + 1; j < tags.length; j++) wearCombos.push([tags[i], tags[j]]);
    }
    let checked = 0;
    const beyondSpec: string[] = [];
    for (const type of DATA.archetypes) {
      for (const tier of ids('q11')) {
        for (const wear of wearCombos) {
          for (const style of [[], ...ids('q12').map((s) => [s])]) {
            for (const proj of ids('q8')) {
              const answers: Answers = { q1: ['self'], q3: ['none'], q4: ['laundry'], q5: ['coconut'], q6: ['cashmere'], q7: wear, q8: [proj], q11: [tier], q12: style };
              const { ctx } = userContext(answers, DATA);
              ctx.u = toVec(type.vec); // put the user exactly on this scent type
              const { picked, relaxed } = selectPicks(ctx, DATA);
              expect(picked.length, `${type.id} ${tier} ${wear} ${style} ${proj}`).toBe(3);
              if (relaxed.includes('price+2') || relaxed.includes('heat')) beyondSpec.push(`${type.id}/${tier}/${wear}/${style}`);
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBe(10 * 4 * 11 * 5 * 3);
    // The spec's relaxation (style, office, price ±1) should be enough everywhere.
    expect(beyondSpec).toEqual([]);
  });

  it('assigns each archetype to its own prototype', () => {
    for (const a of DATA.archetypes) expect(nearestArchetype(toVec(a.vec), DATA.archetypes).type.id).toBe(a.id);
  });

  it('"show me all" returns one pick per price tier', () => {
    const p = personas.find((x) => x.answers.q11[0] === 'all')!;
    const r = match(p.answers, DATA);
    expect(r.picks.map((x) => x.slot)).toEqual(['easy', 'best', 'treat']);
    expect(r.picks.map((x) => x.fragrance.price_tier)).toEqual([1, 2, 3]);
  });

  it('respects the office projection cap and heat filter when stock allows', () => {
    const p = personas.find((x) => x.name.startsWith('Citrus'))!;
    const r = match(p.answers, DATA);
    for (const pick of r.picks) {
      expect(pick.fragrance.projection).toBeLessThan(3);
      expect(pick.fragrance.heat_ok).toBe(true);
    }
  });

  it('echoes a loved anchor', () => {
    const r = match(personas[0].answers, DATA);
    expect(r.echo?.anchor.id).toBe('lelabo-another13');
    expect(r.echo?.same).toBe(true);
  });

  it('compares two results', () => {
    const a = match(personas[0].answers, DATA);
    const b = match(personas[6].answers, DATA);
    const same = compare(a, a, DATA);
    expect(same.band.id).toBe('twins');
    const diff = compare(a, b, DATA);
    expect(diff.sim).toBeLessThan(0.9);
    expect(diff.shared).toBeTruthy();
  });
});
