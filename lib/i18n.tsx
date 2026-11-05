'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { copyFor, type UiKey } from './copy';
import type { L10n, Lang } from './types';
import { setAnalyticsContext } from './analytics';

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: UiKey, vars?: Record<string, string | number>) => string;
  l: (x: L10n | undefined) => string;
  type16Line: (id: string | null) => string | null;
  signLine: (id: string | null) => string | null;
}

const Ctx = createContext<I18n | null>(null);
const STORAGE_KEY = 'scenttype.lang';

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {}
  if (typeof navigator !== 'undefined' && /^zh\b/i.test(navigator.language || '')) return 'zh';
  return 'en';
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial ?? 'en');

  useEffect(() => {
    if (!initial) setLangState(detectLang());
  }, [initial]);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    setAnalyticsContext({ lang });
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const value = useMemo<I18n>(() => ({ lang, setLang, l: (x) => (x ? x[lang] : ''), ...copyFor(lang) }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
