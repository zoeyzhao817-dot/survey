'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { DATA } from '@/lib/data';

export default function LoadingScreen() {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const lines = [t('loading.1'), t('loading.2', { n: Math.floor(DATA.fragrances.length / 10) * 10 }), t('loading.3')];

  useEffect(() => {
    const id = setInterval(() => setI((x) => Math.min(x + 1, 2)), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center" aria-live="polite">
      <div className="mb-8 flex gap-1.5" aria-hidden>
        {DATA.archetypes.map((a, k) => (
          <span
            key={a.id}
            className="h-10 w-2.5 rounded-full"
            style={{ background: a.color, animation: `pulse-bar 1s ease-in-out ${k * 0.08}s infinite` }}
          />
        ))}
      </div>
      <p key={i} className="animate-[fade-in_0.3s_ease-out] font-display text-xl text-ink">
        {lines[i]}
      </p>
    </main>
  );
}
