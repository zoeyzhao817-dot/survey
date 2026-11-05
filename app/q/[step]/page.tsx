import { notFound } from 'next/navigation';
import QuizStep from '@/components/QuizStep';
import { QUESTIONS } from '@/lib/data';

export function generateStaticParams() {
  return QUESTIONS.map((q) => ({ step: String(q.n) }));
}

export default async function StepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const n = Number(step);
  if (!Number.isInteger(n) || n < 1 || n > QUESTIONS.length) notFound();
  return <QuizStep step={n} />;
}
