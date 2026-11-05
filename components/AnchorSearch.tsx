'use client';

import { useMemo, useState } from 'react';
import { findAnchor, searchAnchors } from '@/lib/data';
import { useI18n } from '@/lib/i18n';

const POPULAR = ['dior-sauvage', 'lelabo-santal33', 'mj-daisy', 'chanel-coco-mademoiselle', 'mfk-br540', 'jm-wood-sage', 'ysl-black-opium', 'armani-acqua-di-gio'];

export default function AnchorSearch({
  value,
  max,
  onChange,
}: {
  value: string[];
  max: number;
  onChange: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const results = useMemo(
    () =>
      (q.trim() ? searchAnchors(q, 6) : POPULAR.map((id) => findAnchor(id)!).filter(Boolean)).filter((a) => !value.includes(a.id)).slice(0, 6),
    [q, value],
  );
  const full = value.length >= max;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[2.25rem] flex-wrap gap-2">
        {value.map((id) => {
          const a = findAnchor(id);
          if (!a) return null;
          return (
            <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-ink py-1.5 pl-3 pr-1.5 text-sm text-white">
              <span className="truncate">
                {a.brand} {a.name}
              </span>
              <button
                onClick={() => onChange(value.filter((x) => x !== id))}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-xs"
                aria-label={`Remove ${a.name}`}
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        disabled={full}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('q2.placeholder')}
        className="mt-3 h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-muted/70 focus:border-ink disabled:opacity-50"
        aria-label={t('q2.placeholder')}
      />
      {!q.trim() && !full ? <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{t('q2.popular')}</p> : null}
      <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {(full ? [] : results).map((a) => (
          <li key={a.id}>
            <button
              onClick={() => {
                onChange([...value, a.id].slice(0, max));
                setQ('');
              }}
              className="flex w-full items-baseline gap-2 border-b border-line/70 px-1 py-2.5 text-left active:bg-black/5"
            >
              <span className="text-xs uppercase tracking-wide text-muted">{a.brand}</span>
              <span className="font-medium text-ink">{a.name}</span>
            </button>
          </li>
        ))}
        {q.trim().length >= 2 && !results.length ? <li className="px-1 py-3 text-sm text-muted">{t('q2.noresults')}</li> : null}
      </ul>
    </div>
  );
}
