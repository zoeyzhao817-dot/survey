import type { Metadata } from 'next';
import { Suspense } from 'react';
import ResultView from '@/components/ResultView';
import { DATA, QUESTIONS } from '@/lib/data';
import { decodeAnswers } from '@/lib/encode';
import { match } from '@/lib/match';

type Props = { params: Promise<{ resultId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resultId } = await params;
  const id = decodeURIComponent(resultId);
  const answers = decodeAnswers(id, QUESTIONS);
  if (!answers) return { title: 'Scent Type' };
  const r = match(answers, DATA);
  const title = `${r.type.name.zh} ${r.type.name.en} · Scent Type`;
  const description = `${r.type.read.en} What's your scent type? 90 seconds, no sign-up.`;
  const image = `/api/og/${encodeURIComponent(id)}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ResultPage({ params }: Props) {
  const { resultId } = await params;
  return (
    <Suspense>
      <ResultView id={decodeURIComponent(resultId)} />
    </Suspense>
  );
}
