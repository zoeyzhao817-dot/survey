import { ImageResponse } from 'next/og';
import { DATA, QUESTIONS } from '@/lib/data';
import { decodeAnswers, shortCode } from '@/lib/encode';
import { match } from '@/lib/match';
import { resultCopy } from '@/lib/result-copy';
import { isLight, mix } from '@/lib/card';

export const runtime = 'edge';

/** Subset a Google font to just the characters we draw (keeps CJK fonts tiny). Satori needs TTF/OTF. */
async function loadFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    return src ? await (await fetch(src[1])).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const id = decodeURIComponent(resultId);
  const answers = decodeAnswers(id, QUESTIONS);
  const host = process.env.NEXT_PUBLIC_SITE_HOST || new URL(req.url).host;

  if (!answers) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF7F2', fontSize: 72 }}>
          What&apos;s your scent type?
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const r = match(answers, DATA);
  const en = resultCopy(r, 'en');
  const pick = r.picks[0]?.fragrance;
  const ink = isLight(r.type.color) ? '#2B2522' : '#FFFFFF';
  const allText = `${en.typeZh}${en.typeEn}${en.label}${en.tagline}${en.lines.join('')}${pick ? pick.brand + pick.name : ''}${host}code ${shortCode(id)}·`;
  const [serifZh, sans] = await Promise.all([loadFont('Noto+Serif+SC', 700, en.typeZh), loadFont('Inter', 500, allText)]);
  const fonts = [
    ...(serifZh ? [{ name: 'SerifZH', data: serifZh, weight: 700 as const }] : []),
    ...(sans ? [{ name: 'Inter', data: sans, weight: 500 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '56px 72px',
          background: `linear-gradient(135deg, ${r.type.color}, ${mix(r.type.color, '#FFFFFF', 0.2)})`,
          color: ink,
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '52%', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, letterSpacing: 4, opacity: 0.75 }}>{en.label.toUpperCase()}</div>
          <div style={{ fontSize: 112, fontFamily: serifZh ? 'SerifZH' : 'Inter', lineHeight: 1.1, marginTop: 12 }}>{en.typeZh}</div>
          <div style={{ fontSize: 48, marginTop: 4 }}>{en.typeEn}</div>
          {en.tagline ? <div style={{ fontSize: 30, marginTop: 14, opacity: 0.8 }}>{en.tagline}</div> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '48%', justifyContent: 'space-between', paddingLeft: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
            {en.lines.map((line) => (
              <div key={line} style={{ fontSize: 30, lineHeight: 1.3 }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 26, opacity: 0.85 }}>
            {pick ? <div style={{ fontSize: 30, opacity: 1 }}>{`${pick.brand} ${pick.name}`}</div> : null}
            <div style={{ marginTop: 8 }}>{`${host} · code ${shortCode(id)}`}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  );
}
