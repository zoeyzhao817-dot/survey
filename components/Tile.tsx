'use client';

import type { Option } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function Tile({
  option,
  selected,
  onClick,
  compact,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const { l } = useI18n();
  const [a, b] = option.colors ?? ['#F3EDE6', '#E2D6C9'];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-2xl text-center text-ink shadow-sm transition active:scale-[0.97] ${
        selected ? 'ring-[3px] ring-ink ring-offset-2 ring-offset-paper' : 'ring-1 ring-black/5'
      } ${compact ? 'gap-0.5 px-1 py-1.5' : 'gap-1.5 px-2 py-2'}`}
      style={option.image ? undefined : { background: `linear-gradient(150deg, ${a}, ${b})` }}
    >
      {option.image ? (
        <>
          <img src={`/tiles/${option.image}`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        </>
      ) : option.emoji ? (
        <span className={compact ? 'text-2xl leading-none' : 'text-[2.1rem] leading-none'} aria-hidden>
          {option.emoji}
        </span>
      ) : null}
      <span className={`relative font-medium leading-tight ${compact ? 'text-[0.95rem] font-semibold tracking-wide' : 'text-[0.95rem]'} ${option.image ? 'mt-auto text-white' : ''}`}>
        {l(option.label)}
      </span>
      {option.sub ? <span className="relative text-[0.68rem] leading-none text-ink/60">{l(option.sub)}</span> : null}
      {selected ? (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-[0.7rem] text-white" aria-hidden>
          ✓
        </span>
      ) : null}
    </button>
  );
}
