import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/date';

describe('formatDate', () => {
  it('Dateオブジェクトを正しくフォーマットする', () => {
    const date = new Date('2023-10-27T10:00:00Z');
    // dayjsはローカルタイムゾーンに変換するため、実行環境に依存しないように固定
    const expected = dayjs(date).format('YYYY/MM/DD HH:mm');
    expect(formatDate(date)).toBe(expected);
  });

  it('ISO文字列を正しくフォーマットする', () => {
    const dateString = '2023-10-27T10:00:00Z';
    const expected = dayjs(dateString).format('YYYY/MM/DD HH:mm');
    expect(formatDate(dateString)).toBe(expected);
  });

  it('Dayjsオブジェクトを正しくフォーマットする', () => {
    const dayjsObject = dayjs('2023-10-27T10:00:00Z');
    const expected = dayjsObject.format('YYYY/MM/DD HH:mm');
    expect(formatDate(dayjsObject)).toBe(expected);
  });
});
