'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Tile from './Tile';
import AnchorSearch from './AnchorSearch';
import LoadingScreen from './LoadingScreen';
import { DATA, QUESTIONS } from '@/lib/data';
import { useI18n } from '@/lib/i18n';
import { useQuiz } from '@/lib/quiz-state';
import { encodeAnswers } from '@/lib/encode';
import { match } from '@/lib/match';
import { setAnalyticsContext, track } from '@/lib/analytics';
import type { Answers } from '@/lib/types';

export default function QuizStep({ step }: { step: number }) {
  const q = QUESTIONS[step - 1];
  const router = useRouter();
  const quiz = useQuiz();
  const { t, l } = useI18n();
  const shownAt = useRef(Date.now());
  const busy = useRef(false);
  const [finishing, setFinishing] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const gift = quiz.answers.q1?.[0] === 'gift';

  // Reset per-screen state when the step changes.
  useEffect(() => {
    shownAt.current = Date.now();
    busy.current = false;
    setPending(quiz.answers[q?.id] ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, quiz.loaded]);

  // Deep link or reload: start a session, and never land past an unanswered required question.
  useEffect(() => {
    if (!quiz.loaded || !q) return;
    if (!quiz.startedAt) {
      quiz.start(null);
      track('quiz_start', { source: 'direct' });
      if (step !== 1) router.replace('/q/1');
      return;
    }
    const missing = QUESTIONS.slice(0, step - 1).find((x) => x.required && !quiz.answers[x.id]?.length);
    if (missing) router.replace(`/q/${missing.n}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.loaded, step]);

  if (!q) return null;
  if (finishing) return <LoadingScreen />;

  const finish = (answers: Answers) => {
    setFinishing(true);
    const id = encodeAnswers(answers, QUESTIONS);
    const r = match(answers, DATA);
    track('quiz_complete', {
      duration_s: quiz.startedAt ? Math.round((Date.now() - quiz.startedAt) / 1000) : 0,
      anchors_count: answers.q2?.length ?? 0,
      has_16type: !!r.type16,
      has_sign: !!r.sign,
    });
    // Deliberate 1.5s pause: the result should feel computed.
    setTimeout(() => {
      quiz.markFresh(id);
      router.push(`/r/${id}${quiz.ref ? `?ref=${encodeURIComponent(quiz.ref)}` : ''}`);
    }, 1500);
  };

  const commit = (ids: string[], delay = 0) => {
    if (busy.current) return;
    busy.current = true;
    const answers = quiz.setAnswer(q.id, ids);
    track('question_answered', { q: q.id, option_ids: ids, skipped: ids.length === 0, ms_on_screen: Date.now() - shownAt.current });
    if (q.id === 'q1') setAnalyticsContext({ mode: ids[0] === 'gift' ? 'gift' : 'self' });
    setTimeout(() => {
      if (step < QUESTIONS.length) router.push(`/q/${step + 1}`);
      else finish(answers);
    }, delay);
  };

  const back = () => router.push(step > 1 ? `/q/${step - 1}` : '/');

  const toggle = (id: string) => {
    const opt = q.options.find((o) => o.id === id)!;
    if (opt.exclusive) {
      setPending([id]);
      commit([id], 200);
      return;
    }
    const exclusiveIds = q.options.filter((o) => o.exclusive).map((o) => o.id);
    const base = pending.filter((x) => !exclusiveIds.includes(x));
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    setPending(next);
    if (next.length >= (q.max ?? 2)) commit(next, 280);
  };

  const title = l(gift && q.titleGift ? q.titleGift : q.title);
  const cols = q.cols ?? 2;
  const compact = q.kind === 'grid16' || q.kind === 'signs';
  const rows = Math.ceil(q.options.length / cols);
  const maxRow = compact ? 78 : cols === 1 ? 96 : 150;
  const selected = q.kind === 'multi' ? pending : (quiz.answers[q.id] ?? []);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col px-4 pb-4">
      <Header
        onBack={back}
        right={gift ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.7rem] font-semibold text-accent">{t('giftBadge')}</span> : null}
      />
      <div className="flex items-center gap-3" aria-label={t('progress', { n: step, total: QUESTIONS.length })}>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-all duration-300" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="whitespace-nowrap text-right text-xs tabular-nums text-muted">{t('progress', { n: step, total: QUESTIONS.length })}</span>
      </div>

      <div className="mb-3 mt-4">
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {q.hint || !q.required ? (
          <p className="mt-1 text-sm text-muted">
            {[q.kind === 'anchors' ? null : l(q.hint), !q.required ? t('optional') : null].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>

      {q.kind === 'anchors' ? (
        <AnchorSearch value={pending} max={q.max ?? 3} onChange={setPending} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              height: `min(100%, ${rows * maxRow + (rows - 1) * 10}px)`,
            }}
          >
            {q.options.map((o) => (
              <Tile
                key={o.id}
                option={o}
                compact={compact}
                selected={selected.includes(o.id)}
                onClick={() => (q.kind === 'multi' ? toggle(o.id) : commit([o.id], 160))}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 pt-3">
        {!q.required ? (
          <button onClick={() => commit([])} className="h-11 px-2 text-[0.95rem] font-medium text-muted underline underline-offset-4">
            {q.kind === 'anchors' ? t(gift ? 'q2.newGift' : 'q2.new') : q.kind === 'grid16' ? t('q9.notsure') : t('skip')}
          </button>
        ) : (
          <span />
        )}
        {(q.kind === 'multi' || q.kind === 'anchors') && pending.length > 0 ? (
          <button onClick={() => commit(pending)} className="h-11 rounded-full bg-ink px-7 font-semibold text-white active:scale-[0.98]">
            {t('done')}
          </button>
        ) : null}
      </div>
    </main>
  );
}
