/**
 * Client-side share card, drawn on a canvas so the on-page card and the downloaded PNG are pixel-identical.
 * 1080 x 1920 (9:16, Stories) and 1080 x 1440 (3:4, RedNote/feed). All text is 36px or larger.
 */
import type { MatchResult } from './match';
import { resultCopy } from './result-copy';
import type { Lang } from './types';
import { copyFor } from './copy';

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
  const soft = light ? 'rgba(43,37,34,0.72)' : 'rgba(255,255,255,0.8)';
  const tall = format === '9x16';
  const M = 100; // side margin
  const maxW = W - 2 * M;

  // Background: card colour → 20% lighter tint.
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, color);
  g.addColorStop(1, mix(color, '#FFFFFF', 0.2));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Soft glow for depth.
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, W * 0.7);
  glow.addColorStop(0, 'rgba(255,255,255,0.28)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = tall ? 210 : 120;

  // Top third
  ctx.fillStyle = soft;
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText(words.label.toUpperCase(), W / 2, y);
  y += tall ? 190 : 150;

  ctx.fillStyle = ink;
  const zhSize = fitFont(ctx, words.typeZh, DISPLAY, 700, tall ? 168 : 148, maxW);
  ctx.fillText(words.typeZh, W / 2, y);
  y += Math.round(zhSize * 0.62);

  fitFont(ctx, words.typeEn, DISPLAY, 500, tall ? 72 : 62, maxW);
  ctx.fillText(words.typeEn, W / 2, y);
  y += tall ? 84 : 70;

  if (words.tagline) {
    ctx.fillStyle = soft;
    ctx.font = `600 ${tall ? 46 : 42}px ${SANS}`;
    ctx.fillText(words.tagline, W / 2, y);
    y += tall ? 70 : 50;
  }

  // Divider
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = ink;
  ctx.fillRect(W / 2 - 60, y, 120, 4);
  ctx.globalAlpha = 1;
  y += tall ? 100 : 64;

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
    if (i < words.lines.length - 1) y += Math.round(lh * 0.35);
  }

  // Bottom block (measured from the bottom up)
  const pick = result.picks[0]?.fragrance;
  const bottomUrlY = H - (tall ? 130 : 90);
  const pickNameY = bottomUrlY - (tall ? 150 : 120);
  const pickLabelY = pickNameY - (tall ? 64 : 54);

  // Radar fills the space between the read and the bottom block.
  const top = y + 10;
  const bottom = pick ? pickLabelY - 50 : bottomUrlY - 80;
  const r = Math.max(90, Math.min(tall ? 250 : 170, (bottom - top) / 2 - 6));
  drawRadar(ctx, result.ctx.u, W / 2, (top + bottom) / 2, r, ink);

  if (pick) {
    ctx.fillStyle = soft;
    ctx.font = `600 38px ${SANS}`;
    ctx.fillText(t('card.pick').toUpperCase(), W / 2, pickLabelY);
    ctx.fillStyle = ink;
    const name = `${pick.brand} ${pick.name}`;
    fitFont(ctx, name, DISPLAY, 600, tall ? 58 : 52, maxW);
    ctx.fillText(name, W / 2, pickNameY);
  }

  ctx.fillStyle = soft;
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(`${host} · ${t('card.code')} ${code}`, W / 2, bottomUrlY);
  return c;
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
