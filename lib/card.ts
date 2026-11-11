/**
 * Client-side share card, drawn on a canvas so the on-page card and the downloaded PNG are pixel-identical.
 * 1080 x 1920 (9:16, Stories) and 1080 x 1440 (3:4, RedNote/feed). All text is 36px or larger.
 */
import type { MatchResult } from './match';
import { resultCopy } from './result-copy';
import type { Lang } from './types';
import { copyFor } from './copy';
import { ACCORD_WORD } from './accords';

export type CardFormat = '9x16' | '3x4';
export const CARD_SIZE: Record<CardFormat, [number, number]> = { '9x16': [1080, 1920], '3x4': [1080, 1440] };

const DISPLAY = 'Fraunces, "Noto Serif SC", "Songti SC", "STSong", Georgia, serif';
const SANS = 'Inter, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif';

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(hex: string, withHex: string, k: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(',')})`;
}
export function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex).map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35;
}

/** Word wrap that also breaks CJK text between characters. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+\s*|\s+/g) ?? [text];
  const lines: string[] = [];
  let line = '';
  for (const tok of tokens) {
    const test = line + tok;
    if (ctx.measureText(test.trimEnd()).width > maxWidth && line.trim()) {
      lines.push(line.trimEnd());
      line = tok.trimStart();
    } else line = test;
  }
  if (line.trim()) lines.push(line.trimEnd());
  // Keep CJK punctuation off the start of a line.
  for (let i = 1; i < lines.length; i++) {
    if (/^[，。、；：！？）」』]/.test(lines[i])) {
      lines[i - 1] += lines[i][0];
      lines[i] = lines[i].slice(1);
    }
  }
  return lines;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, start: number, maxWidth: number, min = 36) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function drawRadar(ctx: CanvasRenderingContext2D, u: number[], cx: number, cy: number, r: number, ink: string) {
  const n = u.length;
  const max = Math.max(...u, 0.0001);
  const pt = (i: number, k: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
  };
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  for (const k of [0.5, 1]) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const [x, y] = pt(i % n, k);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(...pt(i, 1));
    ctx.stroke();
  }
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = ink;
  ctx.beginPath();
  u.forEach((v, i) => {
    const [x, y] = pt(i, 0.08 + 0.92 * Math.max(0, v) / max);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

export interface CardInput {
  result: MatchResult;
  lang: Lang;
  host: string;
  code: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing is supported in Chrome/Edge/Safari 17+; older browsers just ignore it.
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

export async function renderCard(format: CardFormat, input: CardInput, canvas?: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const [W, H] = CARD_SIZE[format];
  const c = canvas ?? document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  try {
    await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  } catch {}

  const { result, lang, host, code } = input;
  const words = resultCopy(result, lang);
  const t = copyFor(lang).t;
  const color = result.type.color;
  const light = isLight(color);
  const ink = light ? '#2B2522' : '#FFFFFF';
  const soft = light ? 'rgba(43,37,34,0.68)' : 'rgba(255,255,255,0.78)';
  const tall = format === '9x16';
  const k = tall ? 1 : 0.86; // type scale for 3:4
  const M = 110;
  const maxW = W - 2 * M;

  // Background: card colour → 20% lighter tint, a soft light source and two faint rings for depth.
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, color);
  g.addColorStop(1, mix(color, '#FFFFFF', 0.2));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 0.8);
  glow.addColorStop(0, 'rgba(255,255,255,0.32)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.07;
  ctx.lineWidth = 3;
  for (const r of [W * 0.42, W * 0.58]) {
    ctx.beginPath();
    ctx.arc(W * 0.92, H * 0.06, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Inset frame
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 2;
  roundRect(ctx, 44, 44, W - 88, H - 88, 36);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = tall ? 190 : 140;

  // Label
  ctx.fillStyle = soft;
  ctx.font = `600 38px ${SANS}`;
  spaced(ctx, 8);
  ctx.fillText(words.label.toUpperCase(), W / 2, y);
  spaced(ctx, 0);
  y += Math.round(190 * k);

  // Type name (中文 large), then English type · wear-style
  ctx.fillStyle = ink;
  const zhSize = fitFont(ctx, words.typeZh, DISPLAY, 700, Math.round(176 * k), maxW);
  ctx.fillText(words.typeZh, W / 2, y);
  y += Math.round(zhSize * 0.55);
  fitFont(ctx, words.cardSubline, DISPLAY, 500, Math.round(64 * k), maxW);
  ctx.fillText(words.cardSubline, W / 2, y);
  y += Math.round(48 * k);

  // Rarity pill: the brag line. Inverted colours so it reads first in a feed.
  if (words.rarity) {
    const size = tall ? 40 : 38;
    ctx.font = `700 ${size}px ${SANS}`;
    const lines = wrap(ctx, words.rarity, maxW - 80);
    const lh = Math.round(size * 1.3);
    const pw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 80);
    const ph = lines.length * lh + 34;
    y += 20;
    ctx.fillStyle = ink;
    roundRect(ctx, (W - pw) / 2, y, pw, ph, ph / 2 > 60 ? 40 : ph / 2);
    ctx.fill();
    ctx.fillStyle = light ? '#FFFFFF' : color;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 17 + size * 0.95 + i * lh));
    y += ph + Math.round(62 * k);
  }

  if (words.tagline) {
    ctx.fillStyle = soft;
    ctx.font = `600 ${tall ? 44 : 40}px ${SANS}`;
    spaced(ctx, 2);
    ctx.fillText(words.tagline, W / 2, y);
    spaced(ctx, 0);
    y += tall ? 64 : 44;
  }

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = ink;
  ctx.fillRect(W / 2 - 50, y, 100, 4);
  ctx.globalAlpha = 1;
  y += tall ? 92 : 64;

  // Personality read
  const readSize = tall ? 46 : 38;
  const lh = Math.round(readSize * 1.42);
  ctx.fillStyle = ink;
  ctx.font = `400 ${readSize}px ${lang === 'zh' ? SANS : DISPLAY}`;
  for (const [i, line] of words.lines.entries()) {
    for (const l of wrap(ctx, line, maxW - 20)) {
      ctx.fillText(l, W / 2, y);
      y += lh;
    }
    if (i < words.lines.length - 1) y += Math.round(lh * 0.3);
  }

  // Bottom block, fixed from the bottom edge.
  const pick = result.picks[0]?.fragrance;
  const urlY = H - (tall ? 120 : 92);
  const pickNameY = urlY - (tall ? 130 : 100);
  const pickLabelY = pickNameY - (tall ? 62 : 52);
  const bottom = (pick ? pickLabelY : urlY) - (tall ? 70 : 50);

  // Top notes + radar fill whatever space is left.
  let top = y + 10;
  if (tall && bottom - top > 520) {
    const notes = result.topAccords.map((d) => ACCORD_WORD[d][lang]).join(lang === 'zh' ? ' · ' : ' · ');
    ctx.fillStyle = soft;
    ctx.font = `600 36px ${SANS}`;
    spaced(ctx, 4);
    ctx.fillText(`${t('card.notes').toUpperCase()}  ${notes}`, W / 2, top + 40);
    spaced(ctx, 0);
    top += 70;
  }
  const r = Math.min(tall ? 230 : 160, (bottom - top) / 2 - 6);
  if (r >= 70) drawRadar(ctx, result.ctx.u, W / 2, (top + bottom) / 2, r, ink);

  if (pick) {
    ctx.fillStyle = soft;
    ctx.font = `600 36px ${SANS}`;
    spaced(ctx, 6);
    ctx.fillText(t('card.pick').toUpperCase(), W / 2, pickLabelY);
    spaced(ctx, 0);
    ctx.fillStyle = ink;
    const name = `${pick.brand} ${pick.name}`;
    fitFont(ctx, name, DISPLAY, 600, tall ? 58 : 50, maxW);
    ctx.fillText(name, W / 2, pickNameY);
  }

  ctx.fillStyle = soft;
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText(`${host} · ${t('card.code')} ${code}`, W / 2, urlY);
  return c;
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
