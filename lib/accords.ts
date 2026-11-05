import type { Dim, L10n, Tag } from './types';

/** Short words for the radar and the "top accords" line. Never show the 3-letter codes to users. */
export const ACCORD_WORD: Record<Dim, L10n> = {
  CIT: { en: 'citrus', zh: '柑橘' },
  GRN: { en: 'green', zh: '青绿' },
  AQU: { en: 'aquatic', zh: '水感' },
  FLR: { en: 'floral', zh: '花香' },
  FRU: { en: 'fruity', zh: '果香' },
  GOU: { en: 'sweet', zh: '甜香' },
  WOO: { en: 'woody', zh: '木质' },
  MUS: { en: 'musky', zh: '麝香' },
  AMB: { en: 'spicy', zh: '辛香' },
  SMK: { en: 'smoky', zh: '烟熏' },
};

/** Phrases for the "why this" line. */
export const ACCORD_PHRASE: Record<Dim, L10n> = {
  CIT: { en: 'bright citrus', zh: '明亮柑橘' },
  GRN: { en: 'green leaves', zh: '青绿叶子' },
  AQU: { en: 'sea air', zh: '海风' },
  FLR: { en: 'soft florals', zh: '柔和花香' },
  FRU: { en: 'juicy fruit', zh: '多汁果香' },
  GOU: { en: 'warm vanilla', zh: '温暖香草' },
  WOO: { en: 'dry woods', zh: '干燥木质' },
  MUS: { en: 'clean musk', zh: '干净麝香' },
  AMB: { en: 'warm spice', zh: '温暖香料' },
  SMK: { en: 'soft smoke', zh: '淡淡烟熏' },
};

/** Q7 occasion tags → accord nudges (component O). */
export const TAG_VEC: Record<Tag, Partial<Record<Dim, number>>> = {
  heat: { CIT: 2, AQU: 2, GRN: 1, MUS: 1 },
  office: { MUS: 2, CIT: 1, WOO: 1 },
  evening: { AMB: 2, FLR: 1, GOU: 1, SMK: 1 },
  casual: { FRU: 1, GRN: 1, AQU: 1 },
};

/** 16-type letter nudges (component P). */
export const LETTER_VEC: Record<string, Partial<Record<Dim, number>>> = {
  E: { FRU: 1, AMB: 1 },
  I: { MUS: 1, WOO: 1 },
  S: { FLR: 1, CIT: 1 },
  N: { SMK: 1, GRN: 1 },
  T: { WOO: 1, CIT: 1 },
  F: { FLR: 1, GOU: 1 },
  J: { CIT: 1, MUS: 1 },
  P: { FRU: 1, GRN: 1 },
};

/** Star-sign element nudges (component Z). */
export const ELEMENT_VEC: Record<string, Partial<Record<Dim, number>>> = {
  fire: { AMB: 2, SMK: 1 },
  earth: { WOO: 2, GRN: 1 },
  air: { CIT: 2, AQU: 1 },
  water: { AQU: 1, MUS: 1, FLR: 1 },
};
