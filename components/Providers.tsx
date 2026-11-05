'use client';

import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { QuizProvider } from '@/lib/quiz-state';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <QuizProvider>{children}</QuizProvider>
    </I18nProvider>
  );
}
