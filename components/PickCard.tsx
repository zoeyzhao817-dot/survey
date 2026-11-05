'use client';

import type { Pick } from '@/lib/match';
import { useI18n } from '@/lib/i18n';
import { buyUrl, sampleUrl } from '@/lib/site';
import { track } from '@/lib/analytics';
import { useState } from 'react';
import { remember } from '@/lib/quiz-state';

const SLOT_KEY = { best: 'slot.best', also: 'slot.also', wild: 'slot.wild', easy: 'slot.easy', treat: 'slot.treat' } as const;

export default function PickCard({
  pick,
  index,
  gift,
  askTried,
  resultId,
}: {
  pick: Pick;
  index: number;
  gift: boolean;
  askTried: boolean;
  resultId: string;
}) {
  const { t, l, lang } = useI18n();
  const f = pick.fragrance;
  const sample = sampleUrl(f);
  const buy = buyUrl(f);
  const triedKey = `tried.${resultId}.${f.id}`;
  const [verdict, setVerdict] = useState<string | null>(() => remember(triedKey));
  const props = { fragrance_id: f.id, pick_slot: index + 1, price_tier: f.price_tier };

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
        <span className="text-accent">{t(SLOT_KEY[pick.slot])}</span>
        <span className="rounded-full bg-paper px-2 py-0.5 text-ink/70">{t('match', { pct: pick.matchPct })}</span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted">{f.brand}</p>
      <h3 className="font-display text-xl font-semibold leading-snug text-ink">
        {f.name} <span className="text-sm font-normal text-muted">{f.concentration}</span>
      </h3>
      <p className="mt-1 text-sm text-ink/80">{lang === 'zh' ? f.blurb_zh : f.blurb_en}</p>
      <p className="mt-2 text-sm italic text-ink/70">{l(pick.why)}</p>
      <p className="mt-2 text-xs text-muted">{f.price_note}</p>
      <div className="mt-3 flex gap-2">
        {gift && f.gift_url ? (
          <a href={f.gift_url} target="_blank" rel="noopener sponsored" onClick={() => track('sample_click', { ...props, kind: 'gift_set' })} className="btn-primary">
            {t('giftset')}
          </a>
        ) : null}
        {sample ? (
          <a href={sample} target="_blank" rel="noopener sponsored" onClick={() => track('sample_click', props)} className={gift && f.gift_url ? 'btn-secondary' : 'btn-primary'}>
            {t('sample')}
          </a>
        ) : null}
        {buy ? (
          <a href={buy} target="_blank" rel="noopener sponsored" onClick={() => track('buy_click', props)} className="btn-secondary">
            {t('buy')}
          </a>
        ) : null}
      </div>
      {askTried ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs font-semibold text-muted">{t('tried.title')}</p>
          {verdict ? (
            <p className="mt-1 text-sm text-ink">{t('tried.thanks')}</p>
          ) : (
            <div className="mt-2 flex gap-2">
              {(
                [
                  ['loved', 'tried.loved'],
                  ['ok', 'tried.ok'],
                  ['not_me', 'tried.not'],
                ] as const
              ).map(([v, key]) => (
                <button
                  key={v}
                  onClick={() => {
                    track('tried_feedback', { fragrance_id: f.id, verdict: v });
                    remember(triedKey, v);
                    setVerdict(v);
                  }}
                  className="h-9 flex-1 rounded-full border border-line text-sm active:bg-black/5"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
