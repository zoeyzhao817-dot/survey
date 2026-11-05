'use client';

import { ACCORD_WORD } from '@/lib/accords';
import { useI18n } from '@/lib/i18n';
import { DIMS, type Dim } from '@/lib/types';
import { isLight, mix } from '@/lib/card';

export default function Radar({ u, top, color }: { u: number[]; top: Dim[]; color: string }) {
  const { l } = useI18n();
  const S = 300;
  const c = S / 2;
  const r = 96;
  const max = Math.max(...u, 0.0001);
  const pt = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / DIMS.length;
    return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k] as const;
  };
  const stroke = isLight(color) ? mix(color, '#2B2522', 0.45) : color;
  const shape = u.map((v, i) => pt(i, 0.08 + (0.92 * Math.max(0, v)) / max).join(',')).join(' ');
  const ring = (k: number) => DIMS.map((_, i) => pt(i, k).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-[320px]" role="img" aria-label={top.map((d) => l(ACCORD_WORD[d])).join(', ')}>
      <polygon points={ring(1)} fill="none" stroke="#2B2522" strokeOpacity="0.15" />
      <polygon points={ring(0.5)} fill="none" stroke="#2B2522" strokeOpacity="0.1" />
      {DIMS.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#2B2522" strokeOpacity="0.1" />;
      })}
      <polygon points={shape} fill={stroke} fillOpacity="0.35" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      {DIMS.map((d, i) => {
        const [x, y] = pt(i, 1.28);
        const hot = top.includes(d);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={hot ? 14 : 12}
            fontWeight={hot ? 700 : 400}
            fill="#2B2522"
            fillOpacity={hot ? 1 : 0.5}
          >
            {l(ACCORD_WORD[d])}
          </text>
        );
      })}
    </svg>
  );
}
