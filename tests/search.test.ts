import { describe, expect, it } from 'vitest';
import { searchAnchors } from '@/lib/data';

const top = (q: string) => searchAnchors(q, 6).map((a) => a.id);

describe('Q2 search', () => {
  it('still finds English names', () => {
    expect(top('sauvage')[0]).toBe('dior-sauvage');
    expect(top('santal 33')[0]).toBe('lelabo-santal33');
    expect(top('Kolnisch')).toContain('4711-original');
  });

  it('finds Chinese brand names', () => {
    expect(top('香奈儿').length).toBeGreaterThan(0);
    expect(top('香奈儿').every((id) => id.startsWith('chanel-'))).toBe(true);
    expect(top('祖玛珑').every((id) => id.startsWith('jm-'))).toBe(true);
  });

  it('finds Chinese nicknames', () => {
    expect(top('旷野')[0]).toBe('dior-sauvage');
    expect(top('黑鸦片')[0]).toBe('ysl-black-opium');
    expect(top('小雏菊')[0]).toBe('mj-daisy');
    expect(top('百家乐')[0]).toBe('mfk-br540');
  });

  it('matches brand + name typed without a space, with or without 香水', () => {
    expect(top('迪奥旷野')[0]).toBe('dior-sauvage');
    expect(top('迪奥 旷野')[0]).toBe('dior-sauvage');
    expect(top('迪奥旷野香水')[0]).toBe('dior-sauvage');
    expect(top('香奈儿5号')[0]).toBe('chanel-no5');
    expect(top('迪奥sauvage')[0]).toBe('dior-sauvage');
  });

  it('accepts Traditional characters and full-width input', () => {
    expect(top('香奈兒').every((id) => id.startsWith('chanel-'))).toBe(true);
    expect(top('迪奧曠野')[0]).toBe('dior-sauvage');
    expect(top('祖瑪瓏 英國梨')[0]).toBe('jm-pear-freesia');
    expect(top('Ｓａｎｔａｌ　３３')[0]).toBe('lelabo-santal33');
  });

  it('returns nothing for filler-only or unknown queries', () => {
    expect(top('香水')).toEqual([]);
    expect(top('不存在的牌子')).toEqual([]);
  });
});
