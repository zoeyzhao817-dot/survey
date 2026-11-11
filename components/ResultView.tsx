'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './Header';
import CardPreview from './CardPreview';
import Radar from './Radar';
import PickCard from './PickCard';
import Stars from './Stars';
import { DATA, QUESTIONS } from '@/lib/data';
import { decodeAnswers, shortCode } from '@/lib/encode';
import { match, type MatchResult } from '@/lib/match';
import { compare } from '@/lib/compare';
import { useI18n } from '@/lib/i18n';
import { isMine, rememberMine, useQuiz } from '@/lib/quiz-state';
import { resultCopy } from '@/lib/result-copy';
import { ACCORD_WORD } from '@/lib/accords';
import { canvasToBlob, isLight, renderCard, type CardFormat } from '@/lib/card';
import { absUrl, PLACEHOLDER_LINKS, siteHost } from '@/lib/site';
import { setAnalyticsContext, track } from '@/lib/analytics';

function useResult(id: string | null): MatchResult | null {
  return useMemo(() => {
    if (!id) return null;
    const a = decodeAnswers(id, QUESTIONS);
    return a ? match(a, DATA) : null;
  }, [id]);
}

export default function ResultView({ id }: { id: string }) {
  const { t, l, lang } = useI18n();
  const quiz = useQuiz();
  const params = useSearchParams();
  const refParam = params.get('ref');
  const result = useResult(id);
  const friend = useResult(refParam && refParam !== id ? refParam : null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dlOpen, setDlOpen] = useState(false);
  const tracked = useRef(false);

  useEffect(() => setMounted(true), []);
  const ready = mounted && quiz.loaded;
  const fresh = ready && quiz.fresh === id;
  const mine = ready && (fresh || isMine(id));

  useEffect(() => {
    if (!ready || !result || tracked.current) return;
    tracked.current = true;
    if (fresh) rememberMine(id);
    setAnalyticsContext({ mode: result.mode, ref: refParam && friend ? refParam : null });
    track('result_view', { scent_type: result.type.id, wear_style: result.wearStyle.id, pick_ids: result.picks.map((p) => p.fragrance.id), return_visit: !fresh && mine });
    if (fresh && friend) track('compare_complete', { band: compare(result, friend, DATA).band.id });
  }, [ready, result, fresh, mine, friend, id, refParam]);

  const cardInput = useMemo(() => (result ? { result, lang, host: siteHost(), code: shortCode(id) } : null), [result, lang, id]);

  if (!result || !cardInput) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="font-display text-2xl font-semibold">{t('broken.title')}</h1>
          <p className="mt-2 text-muted">{t('broken.sub')}</p>
          <Link href="/" className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-white">
            {t('viewer.cta')}
          </Link>
        </div>
      </main>
    );
  }

  const gift = result.mode === 'gift';
  const words = resultCopy(result, lang);
  const typeName = l(result.type.name);
  const resultUrl = absUrl(`/r/${id}`);
  const inviteUrl = absUrl(`/?ref=${encodeURIComponent(id)}`);
  const shareText = t(gift ? 'shareTextGift' : 'shareText', { type: typeName });

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    flash(t('copied'));
  };

  const download = async (format: CardFormat) => {
    setDlOpen(false);
    const blob = await canvasToBlob(await renderCard(format, cardInput));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scent-type-${result.type.id}-${format}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    track('card_download', { format });
  };

  const share = async () => {
    try {
      const blob = await canvasToBlob(await renderCard('9x16', cardInput));
      const file = new File([blob], `scent-type-${result.type.id}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        track('share_click', { channel: 'native' });
        await navigator.share({ files: [file], text: `${shareText} ${resultUrl}` });
        return;
      }
      if (navigator.share) {
        track('share_click', { channel: 'native' });
        await navigator.share({ text: shareText, url: resultUrl });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    track('share_click', { channel: 'copy' });
    copy(`${shareText} ${resultUrl}`);
  };

  const invite = async () => {
    track('share_click', { channel: 'compare' });
    const text = t('landing.invite', { type: typeName });
    try {
      if (navigator.share) {
        await navigator.share({ text, url: inviteUrl });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    copy(inviteUrl);
  };

  const cmp = friend && mine ? compare(result, friend, DATA) : null;
  const echo = result.echo;
  const anchorName = echo ? `${echo.anchor.brand} ${echo.anchor.name}` : '';

  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Header />

      {ready && !mine ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm ring-1 ring-line">
          <span>{t('viewer.banner')}</span>
          <Link href={`/?ref=${encodeURIComponent(id)}`} className="shrink-0 rounded-full bg-ink px-4 py-2 font-semibold text-white">
            {t('viewer.cta')}
          </Link>
        </div>
      ) : null}

      <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{words.label}</p>
      <h1 className="mt-0.5 text-center font-display text-xl font-semibold leading-tight text-ink">{words.fullLabel}</h1>
      <p className="mb-3 text-center text-xs text-muted">{words.wearLine}</p>

      <div className="mx-auto w-[72%] max-w-[300px]">
        <CardPreview input={cardInput} alt={[words.typeZh, words.cardSubline, words.rarity, words.tagline, ...words.lines].filter(Boolean).join('. ')} />
      </div>


      {/* Peak interest: lead with the friend invite, then saving the card. Share/copy stay as quiet links. */}
      <div className="relative mt-4 flex flex-col gap-2">
        {mine ? (
          <>
            <button onClick={invite} className="btn-primary h-14 w-full text-base">
              {t('compare.title')}
            </button>
            <p className="-mt-0.5 mb-1 text-center text-xs text-muted">{t('compare.short')}</p>
          </>
        ) : null}
        <button onClick={() => setDlOpen((x) => !x)} className="btn-secondary h-12 w-full" aria-expanded={dlOpen}>
          {t('download')}
        </button>
        {dlOpen ? (
          <div className="flex overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-line">
            <button onClick={() => download('9x16')} className="flex-1 px-3 py-3 text-sm hover:bg-paper">
              {t('download916')}
            </button>
            <button onClick={() => download('3x4')} className="flex-1 border-l border-line px-3 py-3 text-sm hover:bg-paper">
              {t('download34')}
            </button>
          </div>
        ) : null}
        <div className="flex justify-center gap-5 pt-1 text-sm text-muted">
          <button onClick={share} className="underline underline-offset-4">
            {t('share')}
          </button>
          <button
            onClick={() => {
              track('share_click', { channel: 'copy' });
              copy(resultUrl);
            }}
            className="underline underline-offset-4"
          >
            {t('copy')}
          </button>
        </div>
      </div>

      {cmp && friend ? (
        <section className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t('compare.heading')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              [t('compare.you'), result],
              [t('compare.friend'), friend],
            ].map(([who, r]) => {
              const rr = r as MatchResult;
              const light = isLight(rr.type.color);
              return (
                <div key={who as string} className="rounded-xl p-3 text-center" style={{ background: rr.type.color, color: light ? '#2B2522' : '#fff' }}>
                  <p className="text-xs opacity-80">{who as string}</p>
                  <p className="font-display text-lg font-semibold leading-tight">{rr.type.name.zh}</p>
                  <p className="text-xs">{rr.type.name.en}</p>
                  <p className="mt-1 text-xs opacity-80">{[rr.type16, rr.sign ? l(rr.sign.label) : null].filter(Boolean).join(' · ')}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center font-display text-xl font-semibold">{l(cmp.band.title)}</p>
          <p className="text-center text-sm text-muted">{l(cmp.band.line)}</p>
          {cmp.shared ? (
            <p className="mt-3 text-center text-sm">
              <span className="text-muted">{t('compare.both')}: </span>
              <span className="font-semibold">
                {cmp.shared.brand} {cmp.shared.name}
              </span>
            </p>
          ) : null}
        </section>
      ) : null}

      {echo ? (
        <p className="mt-8 rounded-2xl p-4 text-center font-display text-lg leading-snug" style={{ background: result.type.color + '26' }}>
          {t(`result.echo${echo.same ? 'Same' : 'Diff'}${gift ? 'Gift' : ''}` as 'result.echoSame', { anchor: anchorName, type: typeName })}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t(gift ? 'result.accordsGift' : 'result.accords')}</h2>
        <p className="mt-1 text-center font-display text-xl">{result.topAccords.map((d) => l(ACCORD_WORD[d])).join(lang === 'zh' ? '、' : ', ')}</p>
        <Radar u={result.ctx.u} top={result.topAccords} color={result.type.color} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t(gift ? 'result.picksGift' : 'result.picks')}</h2>
        <div className="flex flex-col gap-3">
          {result.picks.map((p, i) => (
            <PickCard key={p.fragrance.id} pick={p} index={i} gift={gift} askTried={mine && !fresh && !gift} resultId={id} />
          ))}
        </div>
        {PLACEHOLDER_LINKS ? <p className="mt-2 text-center text-xs text-muted">{t('placeholderLinks')}</p> : null}
      </section>

      {mine ? (
        <div className="mt-8">
          <Stars resultId={id} scentType={result.type.id} gift={gift} />
        </div>
      ) : null}

      <footer className="mt-10 space-y-2 text-center text-xs leading-relaxed text-muted">
        <p>{t('footer.aff')}</p>
        <p>{t('footer.fun')}</p>
        <p>{t('rarity.estimate')}</p>
        <div className="flex justify-center gap-4 pt-2">
          <Link href="/" className="font-semibold text-ink underline underline-offset-4">
            {t('retake')}
          </Link>
          <Link href="/about" className="underline underline-offset-4">
            {t('about')}
          </Link>
        </div>
      </footer>

      {toast ? (
        <div className="fixed inset-x-0 bottom-6 z-20 mx-auto w-max rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
