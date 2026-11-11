'use client';

import Link from 'next/link';
import Header from './Header';
import { useI18n } from '@/lib/i18n';
import credits from '@/data/photo-credits.json';

export default function About() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Header />
      <h1 className="mt-6 font-display text-3xl font-semibold">{t('about.title')}</h1>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-ink/85">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <p>{t('about.p4')}</p>
        <p>{t('about.p5')}</p>
        <p>{t('rarity.estimate')}</p>
        {Object.keys(credits).length ? (
          <p className="text-xs text-muted">
            Photos:{' '}
            {Object.values(credits as Record<string, { author: string; license: string; source: string }>)
              .map((c) => `${c.author} (${c.license})`)
              .filter((x, i, a) => a.indexOf(x) === i)
              .join(', ')}
          </p>
        ) : null}
      </div>
      <Link href="/" className="btn-primary mt-8 w-full">
        {t('landing.start')}
      </Link>
    </main>
  );
}
