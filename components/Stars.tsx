'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { remember } from '@/lib/quiz-state';
import { track } from '@/lib/analytics';

export default function Stars({ resultId, scentType, gift }: { resultId: string; scentType: string; gift: boolean }) {
  const { t } = useI18n();
  const key = `rated.${resultId}`;
  const [rated, setRated] = useState<number | null>(() => Number(remember(key)) || null);
  return (
    <section className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-line">
      <h2 className="font-display text-lg font-semibold">{t(gift ? 'rate.qGift' : 'rate.q')}</h2>
      <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label={t(gift ? 'rate.qGift' : 'rate.q')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={rated === n}
            aria-label={`${n}`}
            disabled={!!rated}
            onClick={() => {
              setRated(n);
              remember(key, String(n));
              track('accuracy_rating', { stars: n, scent_type: scentType });
            }}
            className={`h-11 w-11 text-3xl transition ${rated && n <= rated ? 'text-[#E3A72F]' : 'text-line'} ${rated ? '' : 'hover:scale-110'}`}
          >
            ★
          </button>
        ))}
      </div>
      {rated ? <p className="mt-1 text-sm text-muted">{t('rate.thanks')}</p> : null}
    </section>
  );
}
