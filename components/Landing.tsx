'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import Header from './Header';
import { useI18n } from '@/lib/i18n';
import { useQuiz } from '@/lib/quiz-state';
import { decodeAnswers } from '@/lib/encode';
import { DATA, QUESTIONS } from '@/lib/data';
import { match } from '@/lib/match';
import { track, setAnalyticsContext } from '@/lib/analytics';

export default function Landing() {
  const { t, l } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const quiz = useQuiz();
  const ref = params.get('ref');

  const friend = useMemo(() => {
    if (!ref) return null;
    const a = decodeAnswers(ref, QUESTIONS);
    return a ? match(a, DATA) : null;
  }, [ref]);

  const startQuiz = () => {
    const validRef = friend ? ref : null;
    quiz.start(validRef);
    setAnalyticsContext({ ref: validRef, mode: 'self' });
    const source = validRef ? 'ref' : params.get('utm_source') ? 'utm' : 'direct';
    track('quiz_start', { source, utm_source: params.get('utm_source') });
    router.push('/q/1');
  };

  const swatches = DATA.archetypes.map((a) => a.color);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4">
      <Header />
      <div className="flex flex-1 flex-col justify-center pb-10">
        <div className="mb-8 flex gap-1.5" aria-hidden>
          {swatches.map((c) => (
            <span key={c} className="h-10 flex-1 rounded-full" style={{ background: c }} />
          ))}
        </div>

        {friend ? (
          <div className="mb-6 rounded-2xl p-4 text-sm" style={{ background: friend.type.color + '33' }}>
            <p className="font-semibold">{t('landing.invite', { type: l(friend.type.name) })}</p>
            <p className="text-muted">{t('landing.inviteSub')}</p>
          </div>
        ) : null}

        <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink">{t('landing.title')}</h1>
        <p className="mt-3 text-lg font-medium text-ink/80">{t('landing.sub')}</p>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{t('landing.blurb')}</p>

        <button
          onClick={startQuiz}
          className="mt-8 h-14 w-full rounded-full bg-ink text-lg font-semibold text-white shadow-lg shadow-ink/20 transition active:scale-[0.98]"
        >
          {t('landing.start')}
        </button>
        <p className="mt-6 text-center text-xs text-muted">
          {t('footer.fun')}{' '}
          <Link href="/about" className="underline underline-offset-2">
            {t('about')}
          </Link>
        </p>
      </div>
    </main>
  );
}
