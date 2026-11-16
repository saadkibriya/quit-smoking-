import assert from 'node:assert';
import {
  calculatePaceProfile,
  calculateTargetGap,
  collectGaps,
  formatGapMinutes,
  formatSignedMinutes,
  calculateDailyPace,
  calculateHourlyLoad,
  estimateBaselineFromPlan,
  MAX_RHYTHM_GAP_MINUTES,
} from '../src/domain/pacing';
import { calculateIdentityLedger, getTodaysPrinciple, MINDSET_PRINCIPLES } from '../src/content/identity';
import { Entry, UserPlan } from '../src/types';
import { DEFAULT_PLAN } from '../src/data/storage';
import { toLocalDateString } from '../src/domain/calculations';

console.log('--- RUNNING RATE METER (PACING) UNIT TESTS ---');

// Local-time anchored helpers so the suite behaves the same in any timezone.
const DAY = new Date(2026, 10, 14, 0, 0, 0, 0); // Sat 14 Nov 2026, local midnight
const at = (hours: number, minutes: number = 0) => DAY.getTime() + (hours * 60 + minutes) * 60000;

const plan: UserPlan = {
  ...DEFAULT_PLAN,
  quitStartDate: new Date(2026, 10, 1, 8, 0, 0).toISOString(),
  usualPerDay: 15,
  wakeTime: '07:00',
  sleepTime: '23:00',
};

const cig = (id: string, timestamp: number): Entry => ({
  id,
  timestamp,
  timezoneOffset: new Date().getTimezoneOffset(),
  type: 'CIGARETTE',
});

// Test 1: gaps are measured between consecutive cigarettes, oldest first
{
  const entries = [cig('a', at(8)), cig('b', at(10)), cig('c', at(12, 30))];
  const gaps = collectGaps(entries, at(16));

  assert.strictEqual(gaps.length, 2);
  assert.strictEqual(gaps[0].minutes, 120); // 08:00 -> 10:00
  assert.strictEqual(gaps[1].minutes, 150); // 10:00 -> 12:30
  console.log('✓ Test 1: consecutive gap collection passed.');
}

// Test 2: overnight gaps are excluded so sleep does not flatter the numbers
{
  const entries = [cig('a', at(18) - 86400000), cig('b', at(8))]; // 14 hours apart
  const gaps = collectGaps(entries, at(12));
  assert.strictEqual(gaps.length, 0);
  assert.ok(MAX_RHYTHM_GAP_MINUTES === 720);
  console.log('✓ Test 2: overnight gaps are ignored.');
}

// Test 3: personal baseline (median) drives a target that is ~20% wider
{
  const entries = [cig('a', at(8)), cig('b', at(10)), cig('c', at(12, 30))];
  const profile = calculatePaceProfile(entries, plan, at(16));

  assert.strictEqual(profile.baselineSource, 'HISTORY');
  assert.strictEqual(profile.baselineMinutes, 135); // median of 120 and 150
  assert.strictEqual(profile.targetMinutes, 160); // round5(max(145, 162))
  assert.strictEqual(profile.currentGapMinutes, 210); // 12:30 -> 16:00
  assert.strictEqual(profile.status, 'STRETCHED');
  assert.strictEqual(profile.anchor, 'CIGARETTE');
  assert.ok(profile.minutesUntilWindow < 0); // window is behind us
  console.log('✓ Test 3: baseline, target and stretched status passed.');
}

// Test 4: a cigarette that arrives early is flagged, not punished
{
  const entries = [cig('a', at(8)), cig('b', at(10)), cig('c', at(12, 30))];
  const profile = calculatePaceProfile(entries, plan, at(13));

  assert.strictEqual(profile.currentGapMinutes, 30);
  assert.strictEqual(profile.status, 'EARLY');
  assert.ok(profile.minutesUntilWindow > 0);
  console.log('✓ Test 4: early gap flagged with remaining window time.');
}

// Test 5: comparison against the previous gap and the usual gap
{
  const entries = [cig('a', at(8)), cig('b', at(10)), cig('c', at(12, 30))];
  const profile = calculatePaceProfile(entries, plan, at(15));

  // Current gap 150m, previous gap 150m, baseline 135m
  assert.strictEqual(profile.lastGapMinutes, 150);
  assert.strictEqual(profile.vsLastGapMinutes, 0);
  assert.strictEqual(profile.vsBaselineMinutes, 15);
  console.log('✓ Test 5: comparison with earlier entries passed.');
}

// Test 6: without smoking history the meter anchors on the quit date and calibrates
{
  const profile = calculatePaceProfile([], plan, at(12));
  assert.strictEqual(profile.anchor, 'QUIT_START');
  assert.strictEqual(profile.status, 'CALIBRATING');
  assert.strictEqual(profile.baselineSource, 'ESTIMATE');
  assert.strictEqual(profile.baselineMinutes, 64); // 16h waking window / 15 per day
  console.log('✓ Test 6: quit-start anchor and plan-based estimate passed.');
}

// Test 7: target formula keeps a real stretch even for tight rhythms
{
  assert.strictEqual(calculateTargetGap(60), 70); // max(70, 72) -> rounded to 5m
  assert.strictEqual(calculateTargetGap(20), 30); // min +10 wins
  assert.strictEqual(estimateBaselineFromPlan({ ...plan, usualPerDay: 1 }), 960); // whole 16h window
  console.log('✓ Test 7: target gap formula passed.');
}

// Test 8: formatting is the app's core unit
{
  assert.strictEqual(formatGapMinutes(45), '45m');
  assert.strictEqual(formatGapMinutes(150), '2h 30m');
  assert.strictEqual(formatGapMinutes(180), '3h');
  assert.strictEqual(formatGapMinutes(null), '—');
  assert.strictEqual(formatSignedMinutes(15), '+15m');
  assert.strictEqual(formatSignedMinutes(-15), '−15m');
  assert.strictEqual(formatSignedMinutes(0), 'same');
  console.log('✓ Test 8: gap formatting passed.');
}

// Test 9: daily distance table
{
  const entries = [cig('a', at(8)), cig('b', at(10)), cig('c', at(12, 30))];
  const daily = calculateDailyPace(entries, plan, 7, at(16));

  assert.strictEqual(daily.length, 7);
  const today = daily[daily.length - 1];
  assert.strictEqual(today.isToday, true);
  assert.strictEqual(today.dateStr, toLocalDateString(at(16)));
  assert.strictEqual(today.cigaretteCount, 3);
  assert.strictEqual(today.longestGapMinutes, 150);
  assert.strictEqual(today.averageGapMinutes, 135);
  console.log('✓ Test 9: daily distance table passed.');
}

// Test 10: hourly load finds the hardest hour
{
  const entries = [cig('a', at(8)), cig('b', at(20)), cig('c', at(20, 30))];
  const hourly = calculateHourlyLoad(entries, 30, at(23));
  assert.strictEqual(hourly.hours.length, 24);
  assert.strictEqual(hourly.peakHour, 20);
  assert.strictEqual(hourly.peakCount, 2);
  console.log('✓ Test 10: hourly load histogram passed.');
}

// Test 11: identity ledger counts votes and the daily pledge
{
  const pledge: Entry = {
    id: 'p1',
    timestamp: at(9),
    timezoneOffset: new Date().getTimezoneOffset(),
    type: 'PLEDGE',
  };
  const beaten: Entry = {
    id: 'b1',
    timestamp: at(11),
    timezoneOffset: new Date().getTimezoneOffset(),
    type: 'CRAVING_BEATEN',
  };

  const ledger = calculateIdentityLedger([pledge, beaten], plan, at(16));
  assert.strictEqual(ledger.urgesBeaten, 1);
  assert.strictEqual(ledger.pledgedToday, true);
  assert.ok(ledger.total >= 1);
  assert.strictEqual(ledger.todayProgress, 1);

  const withoutPledge = calculateIdentityLedger([beaten], plan, at(16));
  assert.strictEqual(withoutPledge.pledgedToday, false);
  console.log('✓ Test 11: identity ledger and daily vote passed.');
}

// Test 12: daily principle rotation is stable and complete
{
  assert.ok(MINDSET_PRINCIPLES.length >= 6);
  const a = getTodaysPrinciple(new Date(2026, 10, 14, 9));
  const b = getTodaysPrinciple(new Date(2026, 10, 14, 21));
  assert.strictEqual(a.id, b.id); // same day -> same principle
  const tomorrow = getTodaysPrinciple(new Date(2026, 10, 15, 9));
  assert.notStrictEqual(a.id, tomorrow.id); // rotates daily
  console.log('✓ Test 12: mindset principle rotation passed.');
}

console.log('--- PACING TESTS COMPLETED SUCCESSFULLY! ---');
