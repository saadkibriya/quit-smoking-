import assert from 'node:assert';
import { Entry, UserPlan } from '../src/types';
import { DEFAULT_PLAN } from '../src/data/storage';
import {
  formatDuration,
  formatDurationLong,
  getFapStats,
  isFapLapse,
} from '../src/domain/fap';
import {
  calculateAverageCravingLength,
  calculateAverageTimeBetweenCigarettes,
  calculateFirstCigaretteOfDayTrend,
  calculatePeriodComparison,
  calculateToughestHours,
} from '../src/domain/calculations';

console.log('--- RUNNING REGRESSION TESTS ---');

const NOW = new Date('2026-11-23T12:00:00Z').getTime();
const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

let seq = 0;
function entry(partial: Partial<Entry> & { timestamp: number; type: Entry['type'] }): Entry {
  seq += 1;
  return { id: `reg_${seq}`, timezoneOffset: 0, ...partial };
}

// Test 1: an urge ridden out is a win, never a lapse
{
  const start = new Date(NOW - 3 * DAY).toISOString();
  const entries = [
    entry({ timestamp: NOW - 2 * DAY, type: 'FAP', habitId: 'fap' }),
    entry({ timestamp: NOW - 1 * DAY, type: 'FAP_URGE_BEATEN', habitId: 'fap' }),
  ];

  assert.strictEqual(isFapLapse(entries[1]), false, 'urge must not be a lapse');
  const stats = getFapStats(entries, start, NOW);
  assert.strictEqual(stats.totalLapses, 1, 'only the real slip counts');
  assert.strictEqual(stats.cleanMs, 2 * DAY, 'urge must not reset the clean timer');
  assert.strictEqual(stats.todayLapses, 0);
  assert.strictEqual(stats.weekLapses, 1);
  console.log('✓ Test 1: urge beaten is not a slip and does not reset the timer.');
}

// Test 2: undone slips are ignored entirely
{
  const start = new Date(NOW - 3 * DAY).toISOString();
  const entries = [
    entry({ timestamp: NOW - DAY, type: 'FAP', habitId: 'fap', undone: true }),
  ];
  const stats = getFapStats(entries, start, NOW);
  assert.strictEqual(stats.totalLapses, 0);
  assert.strictEqual(stats.cleanMs, 3 * DAY, 'an undone slip must not restart the timer');
  console.log('✓ Test 2: undone fap slips are ignored.');
}

// Test 3: the widget anchor matches the in-app clean streak after a slip
{
  const start = new Date(NOW - 5 * DAY).toISOString();
  const entries = [entry({ timestamp: NOW - 2 * DAY, type: 'FAP', habitId: 'fap' })];
  const stats = getFapStats(entries, start, NOW);
  const widgetAnchor = NOW - stats.cleanMs;
  assert.strictEqual(widgetAnchor, NOW - 2 * DAY, 'widget must count from the last slip');
  assert.strictEqual(stats.totalLapses, 1);
  console.log('✓ Test 3: widget anchor follows the last slip, not the plan start date.');
}

// Test 4: duration formatting is driven by the duration, not stale streak fields
{
  assert.strictEqual(formatDuration(45 * MIN), '45m');
  assert.strictEqual(formatDuration(5 * HOUR + 12 * MIN), '5h 12m');
  assert.strictEqual(formatDurationLong(2 * DAY + 3 * HOUR + 4 * MIN), '2d 3h 04m');
  assert.strictEqual(formatDurationLong(2 * HOUR + 3 * MIN), '2h 03m');
  assert.strictEqual(formatDuration(-5), '0m', 'negative durations clamp to zero');
  console.log('✓ Test 4: "last slip" durations format from the elapsed time.');
}

// Test 5: undone cigarettes never inflate period comparisons
{
  const plan: UserPlan = { ...DEFAULT_PLAN, quitStartDate: new Date(NOW - 30 * DAY).toISOString() };
  const comparison = calculatePeriodComparison(
    [
      entry({ timestamp: NOW - 1000, type: 'CIGARETTE' }),
      entry({ timestamp: NOW - 2000, type: 'CIGARETTE', undone: true }),
    ],
    'WEEK',
    plan,
    NOW
  );
  assert.strictEqual(comparison.cigarettes.currentValue, 1);
  console.log('✓ Test 5: undone cigarettes are excluded from weekly comparison.');
}

// Test 6: undone cigarettes never inflate the toughest-hours heatmap
{
  const realNow = Date.now();
  const toughest = calculateToughestHours(
    [
      entry({ timestamp: realNow - MIN, type: 'CIGARETTE' }),
      entry({ timestamp: realNow - 2 * MIN, type: 'CIGARETTE', undone: true }),
      entry({ timestamp: realNow - 3 * MIN, type: 'CRAVING_BEATEN', undone: true }),
    ],
    30
  );
  assert.strictEqual(toughest.maxCount, 1);
  console.log('✓ Test 6: undone entries are excluded from toughest hours.');
}

// Test 7: undone cravings never skew the median craving length
{
  const result = calculateAverageCravingLength([
    entry({ timestamp: NOW - 3 * HOUR, type: 'CRAVING_BEATEN', cravingDurationSeconds: 100 }),
    entry({ timestamp: NOW - 2 * HOUR, type: 'CRAVING_BEATEN', cravingDurationSeconds: 200 }),
    entry({ timestamp: NOW - 1 * HOUR, type: 'CRAVING_BEATEN', cravingDurationSeconds: 300 }),
    entry({
      timestamp: NOW - 30 * MIN,
      type: 'CRAVING_BEATEN',
      cravingDurationSeconds: 600,
      undone: true,
    }),
  ]);
  assert.strictEqual(result.medianSeconds, 200);
  console.log('✓ Test 7: undone cravings are excluded from the median.');
}

// Test 8: undone cigarettes do not shorten the average gap between cigarettes
{
  const base = NOW - 8 * HOUR;
  const result = calculateAverageTimeBetweenCigarettes([
    entry({ timestamp: base, type: 'CIGARETTE' }),
    entry({ timestamp: base + 30 * MIN, type: 'CIGARETTE', undone: true }),
    entry({ timestamp: base + 60 * MIN, type: 'CIGARETTE' }),
  ]);
  assert.strictEqual(result.averageMinutes, 60);
  console.log('✓ Test 8: undone cigarettes are excluded from spacing.');
}

// Test 9: the first-cigarette trend ignores an undone morning cigarette
{
  const day = new Date();
  day.setDate(day.getDate() - 2);
  day.setHours(8, 0, 0, 0);
  const trend = calculateFirstCigaretteOfDayTrend(
    [
      entry({ timestamp: day.getTime(), type: 'CIGARETTE', undone: true }),
      entry({ timestamp: day.getTime() + 2 * HOUR, type: 'CIGARETTE' }),
    ],
    '07:00'
  );
  assert.strictEqual(trend.averageMinutesAfterWake, 180);
  console.log('✓ Test 9: first-cigarette trend ignores undone entries.');
}

console.log('--- ALL REGRESSION TESTS PASSED ---');
