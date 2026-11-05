'use client';

import Link from 'next/link';
import Header from './Header';
import { useI18n } from '@/lib/i18n';

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
      </div>
      <Link href="/" className="btn-primary mt-8 w-full">
        {t('landing.start')}
      </Link>
    </main>
  );
}
