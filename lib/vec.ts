import { DIMS, type Accords, type Vec } from './types';

export const zero = (): Vec => DIMS.map(() => 0);

export function toVec(a: Accords | undefined): Vec {
  return DIMS.map((d) => a?.[d] ?? 0);
}

export function add(a: Vec, b: Vec, k = 1): Vec {
  return a.map((x, i) => x + k * b[i]);
}

export function norm(a: Vec): number {
  return Math.sqrt(a.reduce((s, x) => s + x * x, 0));
}

export function dot(a: Vec, b: Vec): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

export function cosine(a: Vec, b: Vec): number {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : dot(a, b) / n;
}

export function argmax(a: Vec): number {
  let best = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
  return best;
}
