import type { MatchResult } from './match';
import { scoreFragrance } from './match';
import type { Fragrance, L10n, QuizData } from './types';
import { cosine } from './vec';

export interface Band {
  id: string;
  min: number;
  title: L10n;
  line: L10n;
}

export const BANDS: Band[] = [
  { id: 'twins', min: 0.9, title: { en: 'Scent twins', zh: '香味双胞胎' }, line: { en: 'You could share a bottle and nobody would notice.', zh: '你们共用一瓶香，也没人分得出来。' } },
  { id: 'wavelength', min: 0.75, title: { en: 'Same wavelength', zh: '同频共振' }, line: { en: 'Different notes, same mood.', zh: '音符不同，心情一致。' } },
  { id: 'harmony', min: 0.6, title: { en: 'Easy harmony', zh: '默契搭档' }, line: { en: 'You overlap where it counts.', zh: '在最重要的地方，你们刚好重叠。' } },
  { id: 'contrast', min: 0.4, title: { en: 'Good contrast', zh: '恰好互补' }, line: { en: 'Each of you brings what the other is missing.', zh: '彼此带来对方缺少的那一味。' } },
  { id: 'opposites', min: -1, title: { en: 'Opposites attract', zh: '相反相吸' }, line: { en: 'Completely different, which makes swapping fun.', zh: '完全不同，所以互换才好玩。' } },
];

export function compare(a: MatchResult, b: MatchResult, data: QuizData) {
  const sim = cosine(a.ctx.u, b.ctx.u);
  const band = BANDS.find((x) => sim >= x.min)!;
  const banned = new Set([...a.ctx.anchorIds, ...b.ctx.anchorIds]);
  const disliked = [...new Set([...a.ctx.disliked, ...b.ctx.disliked])];
  let shared: Fragrance | null = null;
  let best = -Infinity;
  for (const f of data.fragrances) {
    if (!f.recommendable || !f.available_sg || banned.has(f.id)) continue;
    if (disliked.some((d) => (f.accords[d] ?? 0) >= 3)) continue;
    const s = Math.min(scoreFragrance(f, a.ctx), scoreFragrance(f, b.ctx));
    if (s > best) {
      best = s;
      shared = f;
    }
  }
  return { sim, band, shared };
}
