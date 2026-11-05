export const DIMS = ['CIT', 'GRN', 'AQU', 'FLR', 'FRU', 'GOU', 'WOO', 'MUS', 'AMB', 'SMK'] as const;
export type Dim = (typeof DIMS)[number];
export type Vec = number[]; // length 10, ordered as DIMS
export type Accords = Partial<Record<Dim, number>>;

export type Lang = 'en' | 'zh';
export type L10n = { en: string; zh: string };

export type Tag = 'office' | 'heat' | 'evening' | 'casual';
export type Gender = 'fem' | 'uni' | 'masc';
export type Tier = 1 | 2 | 3;

export interface Fragrance {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  accords: Accords;
  gender: Gender;
  projection: 1 | 2 | 3;
  crowd_pleaser: number; // 0..1
  heat_ok: boolean;
  occasions: Tag[];
  price_tier: Tier;
  price_sgd: number;
  price_note: string;
  available_sg: boolean;
  recommendable: boolean;
  sample_url: string | null;
  buy_url: string | null;
  gift_url?: string | null;
  blurb_en: string;
  blurb_zh: string;
}

/** Searchable in Q2 only; never recommended. */
export interface Anchor {
  id: string;
  brand: string;
  name: string;
  accords: Accords;
}

export interface Option {
  id: string;
  label: L10n;
  /** Short noun used in "why this" lines, e.g. "rainforest". */
  why?: L10n;
  emoji?: string;
  /** Optional photo at /tiles/{image}. Falls back to gradient + emoji. */
  image?: string;
  colors?: [string, string];
  sub?: L10n;
  vec?: Accords;
  dims?: Dim[];
  tag?: Tag | null;
  value?: number;
  tier?: Tier | 'all';
  style?: Gender | null;
  letters?: string;
  element?: 'fire' | 'earth' | 'air' | 'water';
  /** Choosing this option ends the multi-select immediately (e.g. "None of these"). */
  exclusive?: boolean;
}

export type QuestionKind = 'single' | 'multi' | 'anchors' | 'grid16' | 'signs';

export interface Question {
  id: string;
  n: number;
  kind: QuestionKind;
  required: boolean;
  max?: number;
  cols?: number;
  title: L10n;
  titleGift?: L10n;
  hint?: L10n;
  hintGift?: L10n;
  options: Option[];
}

export interface Archetype {
  id: string;
  name: L10n;
  vec: Accords;
  color: string;
  read: L10n;
}

/** Raw answers keyed by question id. Each value is a list of option ids (Q2: fragrance ids). Empty list = skipped. */
export type Answers = Record<string, string[]>;

export interface QuizData {
  fragrances: Fragrance[];
  anchors: Anchor[];
  questions: Question[];
  archetypes: Archetype[];
}
