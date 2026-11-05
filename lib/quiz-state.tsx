'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Answers } from './types';
import { setAnalyticsContext } from './analytics';

interface State {
  answers: Answers;
  startedAt: number | null;
  ref: string | null;
  /** resultId the user just computed in this tab (first view, not a return visit). */
  fresh: string | null;
}

interface QuizCtx extends State {
  setAnswer: (qid: string, ids: string[]) => Answers;
  start: (ref: string | null) => void;
  markFresh: (id: string) => void;
}

const EMPTY: State = { answers: {}, startedAt: null, ref: null, fresh: null };
const KEY = 'scenttype.quiz';
const Ctx = createContext<QuizCtx | null>(null);

/** Answers live in memory; sessionStorage only keeps them across an accidental reload in the same tab. */
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
    setAnalyticsContext({ mode: state.answers.q1?.[0] === 'gift' ? 'gift' : 'self', ref: state.ref });
  }, [state, loaded]);

  const setAnswer = useCallback(
    (qid: string, ids: string[]) => {
      const answers = { ...state.answers, [qid]: ids };
      setState((s) => ({ ...s, answers: { ...s.answers, [qid]: ids } }));
      return answers;
    },
    [state.answers],
  );

  const start = useCallback((ref: string | null) => {
    setState({ answers: {}, startedAt: Date.now(), ref, fresh: null });
  }, []);

  const markFresh = useCallback((id: string) => setState((s) => ({ ...s, fresh: id })), []);

  const value = useMemo(() => ({ ...state, setAnswer, start, markFresh, loaded }), [state, setAnswer, start, markFresh, loaded]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQuiz() {
  const v = useContext(Ctx) as (QuizCtx & { loaded: boolean }) | null;
  if (!v) throw new Error('useQuiz outside QuizProvider');
  return v;
}

// Per-viewer convenience: remember which results are "mine" so a return visit can ask "Tried a pick?".
const MINE = 'scenttype.mine';
export function rememberMine(id: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(MINE) || '[]');
    if (!list.includes(id)) localStorage.setItem(MINE, JSON.stringify([id, ...list].slice(0, 20)));
  } catch {}
}
export function isMine(id: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(MINE) || '[]') as string[]).includes(id);
  } catch {
    return false;
  }
}
export function remember(key: string, value?: string): string | null {
  try {
    if (value !== undefined) localStorage.setItem(`scenttype.${key}`, value);
    return localStorage.getItem(`scenttype.${key}`);
  } catch {
    return null;
  }
}
