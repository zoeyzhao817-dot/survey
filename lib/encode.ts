/**
 * Answers ⇄ resultId. The id is "v1." + base64url(JSON of a compact array), one entry per question:
 * Q2 → list of fragrance ids; multi-select → list of option indexes; single-select → option index or -1 when skipped.
 * Decoding is versioned so a later quiz change can add "v2." without breaking old links.
 */
import type { Answers, Question } from './types';

const VERSION = 'v1';

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeAnswers(answers: Answers, questions: Question[]): string {
  const arr = questions.map((q) => {
    const ids = answers[q.id] ?? [];
    if (q.kind === 'anchors') return ids;
    const idx = ids.map((id) => q.options.findIndex((o) => o.id === id)).filter((i) => i >= 0);
    return q.kind === 'multi' ? idx : (idx[0] ?? -1);
  });
  return `${VERSION}.${b64urlEncode(JSON.stringify(arr))}`;
}

/** Returns null for anything malformed or missing a required answer. Never throws. */
export function decodeAnswers(id: string, questions: Question[]): Answers | null {
  try {
    const [ver, body] = id.split('.');
    if (ver !== VERSION || !body) return null;
    const arr = JSON.parse(b64urlDecode(body));
    if (!Array.isArray(arr) || arr.length !== questions.length) return null;
    const answers: Answers = {};
    questions.forEach((q, i) => {
      const v = arr[i];
      let ids: string[];
      if (q.kind === 'anchors') {
        if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) throw new Error('bad anchors');
        ids = v.slice(0, q.max ?? 3);
      } else if (q.kind === 'multi') {
        if (!Array.isArray(v)) throw new Error('bad multi');
        ids = v.map((n: number) => q.options[n]?.id).filter(Boolean).slice(0, q.max ?? 2);
      } else {
        if (typeof v !== 'number') throw new Error('bad single');
        ids = q.options[v] ? [q.options[v].id] : [];
      }
      if (q.required && !ids.length) throw new Error(`missing ${q.id}`);
      answers[q.id] = ids;
    });
    return answers;
  } catch {
    return null;
  }
}

/** 4-character display code for the share card, e.g. "K7QP". Deterministic per resultId. */
export function shortCode(id: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += alphabet[(h >>> 0) % 32];
    h = Math.floor((h >>> 0) / 32);
  }
  return out;
}
