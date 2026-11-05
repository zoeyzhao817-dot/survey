import { copyFor } from './copy';
import type { MatchResult } from './match';
import type { Lang } from './types';

/** All the words that describe a result, in one language. Shared by the page, the share card and the OG image. */
export function resultCopy(r: MatchResult, lang: Lang) {
  const c = copyFor(lang);
  const typeName = r.type.name[lang];
  const sign = r.sign ? r.sign.label[lang] : null;
  const tagParts = [r.type16, sign].filter(Boolean) as string[];
  const headline = [lang === 'zh' ? `${typeName}型` : typeName, ...tagParts].join(' · ');
  const lines = [r.type.read[lang], c.type16Line(r.type16), c.signLine(r.sign?.id ?? null)].filter(Boolean) as string[];
  return {
    label: c.t(r.mode === 'gift' ? 'result.theirType' : 'result.yourType'),
    typeZh: r.type.name.zh,
    typeEn: r.type.name.en,
    typeName,
    headline,
    tagline: tagParts.join(' · '),
    lines,
  };
}
