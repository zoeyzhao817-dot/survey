import { describe, expect, it } from 'vitest';
import { DATA, RARITY } from '@/lib/data';
import { match } from '@/lib/match';
import { resultCopy } from '@/lib/result-copy';
import personas from './personas.json';

describe('two-part label and rarity', () => {
  it('derives wear-style from Q8 and never changes the picks', () => {
    const base = personas[6].answers; // Night Spice fan, "Fills the room"
    const r = match(base, DATA);
    expect(r.type.id).toBe('spice');
    expect(r.wearStyle.id).toBe('statement');
    const ids = new Set<string>();
    for (const [opt, style] of [['hug', 'close'], ['arm', 'trail'], ['room', 'statement']] as const) {
      const x = match({ ...base, q8: [opt] }, DATA);
      expect(x.wearStyle.id).toBe(style);
      ids.add(`${x.type.id} · ${x.wearStyle.id}`);
    }
    expect(ids.size).toBe(3);
  });

  it('gives all 30 type × wear-style combinations a label in both languages', () => {
    for (const a of DATA.archetypes)
      for (const w of DATA.wearStyles) {
        expect(`${a.name.en} · ${w.name.en}`).toMatch(/^.+ · .+$/);
        expect(w.name.zh.length).toBeGreaterThan(1);
      }
  });

  it('has a rarity for every type, summing to about 100%', () => {
    const sum = DATA.archetypes.reduce((s, a) => s + (RARITY.types[a.id] ?? 0), 0);
    expect(DATA.archetypes.every((a) => RARITY.types[a.id] > 0)).toBe(true);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(3);
  });

  it('writes a brag line: "Only X%" for rare types', () => {
    const r = match(personas[7].answers, DATA); // Smoke and Incense
    expect(resultCopy(r, 'en').rarity).toBe(`Only ${RARITY.types.smoke}% of people are Smoke and Incense.`);
    expect(resultCopy(r, 'zh').rarity).toContain('只有');
    expect(resultCopy(r, 'en').fullLabel).toBe('Smoke and Incense · Statement');
  });
});
