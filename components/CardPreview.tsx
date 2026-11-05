'use client';

import { useEffect, useState } from 'react';
import { renderCard, type CardInput } from '@/lib/card';

/** Renders the real share card (3:4) and shows it as an image, so what you see is what you post. */
export default function CardPreview({ input, alt }: { input: CardInput; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    renderCard('3x4', input).then((c) => alive && setSrc(c.toDataURL('image/png')));
    return () => {
      alive = false;
    };
  }, [input]);
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-xl shadow-black/10" style={{ background: input.result.type.color }}>
      {src ? <img src={src} alt={alt} className="h-full w-full" /> : null}
    </div>
  );
}
