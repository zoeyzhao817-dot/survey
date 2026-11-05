import en from '@/data/copy.en.json';
import zh from '@/data/copy.zh.json';
import type { Lang } from './types';

export const COPY = { en, zh } as const;
export type UiKey = keyof typeof en.ui;

export function format(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

/** Plain (non-React) copy access: used by the canvas card, the OG image and the i18n hook. */
export function copyFor(lang: Lang) {
  const c = COPY[lang];
  return {
    t: (key: UiKey, vars?: Record<string, string | number>) => format(c.ui[key] ?? en.ui[key] ?? key, vars),
    type16Line: (id: string | null) => (id ? ((c.type16 as Record<string, string>)[id] ?? null) : null),
    signLine: (id: string | null) => (id ? ((c.sign as Record<string, string>)[id] ?? null) : null),
  };
}
