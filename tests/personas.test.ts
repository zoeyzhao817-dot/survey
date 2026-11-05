import { expect, it } from 'vitest';
import { DATA } from '@/lib/data';
import { match } from '@/lib/match';
import personas from './personas.json';

// Golden set: re-tune weights only against this. CI fails below 10 of 12.
it('passes at least 10 of 12 golden personas', () => {
  const rows = personas.map((p) => {
    const r = match(p.answers, DATA);
    const typeOk = r.type.id === p.expectType;
    const pickOk = r.picks.some((x) => p.expectAnyPick.includes(x.fragrance.id));
    return { name: p.name, pass: typeOk && pickOk, got: `${r.type.id}: ${r.picks.map((x) => x.fragrance.id).join(', ')}` };
  });
  const passed = rows.filter((r) => r.pass).length;
  for (const r of rows.filter((r) => !r.pass)) console.warn(`persona miss: ${r.name} → ${r.got}`);
  expect(personas).toHaveLength(12);
  expect(passed).toBeGreaterThanOrEqual(10);
});
