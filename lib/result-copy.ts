import { copyFor } from './copy';
import { RARITY } from './data';
import type { MatchResult } from './match';
import type { Lang } from './types';

/** Share of people with this scent type, in percent (estimate until analytics replace it). */
export function rarityPct(typeId: string): number | null {
  return RARITY.types[typeId] ?? null;
}

/** All the words that describe a result, in one language. Shared by the page, the share card and the OG image. */
export function resultCopy(r: MatchResult, lang: Lang) {
  const c = copyFor(lang);
  const typeName = r.type.name[lang];
  const wear = r.wearStyle.name[lang];
  const sign = r.sign ? r.sign.label[lang] : null;
  const tagParts = [r.type16, sign].filter(Boolean) as string[];
  const pct = rarityPct(r.type.id);
  const rarity = pct === null ? null : c.t(pct < 10 ? 'rarity.rare' : 'rarity.common', { pct, type: typeName });
  return {
    label: c.t(r.mode === 'gift' ? 'result.theirType' : 'result.yourType'),
    typeZh: r.type.name.zh,
    typeEn: r.type.name.en,
    typeName,
    wear,
    wearLine: r.wearStyle.line[lang],
    /** Two-part identity label, e.g. "Night Spice · Close-to-skin" / "夜色香料 · 贴肤系". */
    fullLabel: `${typeName} · ${wear}`,
    /** Second card line: the English type name plus the wear-style in the current language. */
    cardSubline: `${r.type.name.en} · ${wear}`,
    headline: [lang === 'zh' ? `${typeName}型 · ${wear}` : `${typeName} · ${wear}`, ...tagParts].join(' · '),
    tagline: tagParts.join(' · '),
    rarity,
    rarityPct: pct,
    lines: [r.type.read[lang], c.type16Line(r.type16), c.signLine(r.sign?.id ?? null)].filter(Boolean) as string[],
  };
}
