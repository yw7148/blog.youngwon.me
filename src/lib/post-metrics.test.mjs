import assert from 'node:assert/strict';
import test from 'node:test';
import { getKoreanDayWindow } from './post-metrics.ts';

test('uses the Asia/Seoul calendar day before midnight', () => {
  const result = getKoreanDayWindow(new Date('2026-09-12T14:59:59.000Z'));

  assert.deepEqual(result, {
    day: '2026-09-12',
    expiresAt: Date.parse('2026-09-12T15:00:00.000Z') / 1000,
  });
});

test('moves to the next day at Korean midnight', () => {
  const result = getKoreanDayWindow(new Date('2026-09-12T15:00:00.000Z'));

  assert.deepEqual(result, {
    day: '2026-09-13',
    expiresAt: Date.parse('2026-09-13T15:00:00.000Z') / 1000,
  });
});
