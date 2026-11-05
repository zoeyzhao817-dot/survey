'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function Header({ onBack, right }: { onBack?: () => void; right?: React.ReactNode }) {
  const { lang, setLang, t } = useI18n();
  return (
    <header className="flex h-12 shrink-0 items-center justify-between">
      <div className="flex items-center gap-1">
        {onBack ? (
          <button onClick={onBack} aria-label={t('back')} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          {t('brand')}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <div className="flex rounded-full border border-line bg-white/70 p-0.5 text-xs font-medium" role="group" aria-label="Language">
          {(['zh', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-2.5 py-1 transition ${lang === l ? 'bg-ink text-white' : 'text-muted'}`}
            >
              {l === 'zh' ? '中文' : 'EN'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
