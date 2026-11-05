import { describe, expect, it } from 'vitest';
import { decodeAnswers, encodeAnswers, shortCode } from '@/lib/encode';
import { QUESTIONS } from '@/lib/data';
import personas from './personas.json';

describe('encode/decode', () => {
  it('round-trips every persona', () => {
    for (const p of personas) {
      const id = encodeAnswers(p.answers, QUESTIONS);
      expect(id.startsWith('v1.')).toBe(true);
      expect(id).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
      const back = decodeAnswers(id, QUESTIONS)!;
      for (const q of QUESTIONS) expect(back[q.id] ?? []).toEqual((p.answers as Record<string, string[]>)[q.id] ?? []);
    }
  });

  it('rejects garbage, unknown versions and missing required answers', () => {
    expect(decodeAnswers('nope', QUESTIONS)).toBeNull();
    expect(decodeAnswers('v9.abc', QUESTIONS)).toBeNull();
    expect(decodeAnswers('v1.!!!', QUESTIONS)).toBeNull();
    const id = encodeAnswers({ ...personas[0].answers, q4: [] }, QUESTIONS);
    expect(decodeAnswers(id, QUESTIONS)).toBeNull();
  });

  it('keeps ids short enough to share', () => {
    for (const p of personas) expect(encodeAnswers(p.answers, QUESTIONS).length).toBeLessThan(160);
  });

  it('makes a stable 4-character code', () => {
    const id = encodeAnswers(personas[0].answers, QUESTIONS);
    expect(shortCode(id)).toMatch(/^[A-Z2-9]{4}$/);
    expect(shortCode(id)).toBe(shortCode(id));
  });
});
