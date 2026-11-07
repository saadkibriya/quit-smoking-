import assert from 'node:assert';
import {
  calculateDependenceScore,
  calculateCurrentStreak,
  calculateSmokeFreeDays,
  calculateAvoidedCigarettes,
  calculateMoneyKept,
  calculateLifeRegained,
  calculatePeriodComparison,
  calculateRoundStatus,
  calculateCutDownLimitToday,
  calculateAverageTimeBetweenCigarettes,
  calculateTopTriggers,
  toLocalDateString,
  groupEntriesByDay,
} from '../src/domain/calculations';
import { Entry, UserPlan } from '../src/types';
import { DEFAULT_PLAN } from '../src/data/storage';

console.log('--- RUNNING UNLIT SECTION 4 CALCULATION UNIT TESTS ---');

// Test 1: Dependence Score (Heaviness of Smoking Index 0-6)
{
  const low = calculateDependenceScore(8, 'after_60');
  assert.strictEqual(low.score, 0);
  assert.strictEqual(low.category, 'LOW');

  const mod = calculateDependenceScore(18, '6_to_30');
  assert.strictEqual(mod.score, 3); // 1 cpd + 2 ttfc
  assert.strictEqual(mod.category, 'MODERATE');

  const high = calculateDependenceScore(35, 'within_5');
  assert.strictEqual(high.score, 6); // 3 cpd + 3 ttfc
  assert.strictEqual(high.category, 'HIGH');
  console.log('✓ Test 1: Dependence Score (HSI 0-6) passed.');
}

// Test 2: Streak & Non-decrementing Smoke-Free Days after Slip on Day 10
{
  const now = new Date('2026-11-15T12:00:00Z').getTime();
  const quitStart = new Date('2026-11-05T12:00:00Z').toISOString(); // 10 days ago

  const entries: Entry[] = [
    // Slip on day 10 (today)
    {
      id: 'slip_1',
      timestamp: now - 3600 * 1000, // 1 hour ago
      timezoneOffset: 0,
      type: 'CIGARETTE',
    },
  ];

  const streak = calculateCurrentStreak(entries, quitStart, now);
  // Streak restarts 1 hour ago
  assert.strictEqual(streak.hours, 1);
  assert.strictEqual(streak.days, 0);

  // Completed smoke-free days prior to today (Nov 5 through Nov 14 = 10 days) must NOT be wiped!
  const smokeFree = calculateSmokeFreeDays(entries, quitStart, now);
  assert.strictEqual(smokeFree.completedSmokeFreeDays, 10);
  assert.strictEqual(smokeFree.isTodaySoFarSmokeFree, false);
  assert.strictEqual(smokeFree.todayCigarettesCount, 1);
  console.log('✓ Test 2: Streak restart & non-punitive smoke-free preservation passed.');
}

// Test 3: Avoided Cigarettes & Money Kept Calculation
{
  const now = new Date('2026-11-10T12:00:00Z').getTime();
  const quitStart = new Date('2026-11-05T12:00:00Z').toISOString(); // exactly 5 days ago

  const testPlan: UserPlan = {
    ...DEFAULT_PLAN,
    quitStartDate: quitStart,
    usualPerDay: 20,
    packPrice: 10,
    cigarettesPerPack: 20, // $0.50 per cigarette
  };

  const entries: Entry[] = [
    // 1 slip 2 days ago
    {
      id: 'e1',
      timestamp: now - 2 * 86400 * 1000,
      timezoneOffset: 0,
      type: 'CIGARETTE',
    },
  ];

  // Expected 5 * 20 = 100. Minus 1 smoked = 99 avoided.
  const avoided = calculateAvoidedCigarettes(entries, testPlan, now);
  assert.strictEqual(avoided, 99);

  // Money kept = 99 * $0.50 = $49.50
  const money = calculateMoneyKept(avoided, testPlan);
  assert.strictEqual(money, 49.5);

  // Life regained = 99 * 20 min = 1980 min = 33 hours = 1d 9h
  const life = calculateLifeRegained(avoided);
  assert.strictEqual(life.totalMinutes, 1980);
  assert.strictEqual(life.days, 1);
  assert.strictEqual(life.hours, 9);
  console.log('✓ Test 3: Avoided cigarettes, money kept, and ~20m life estimate passed.');
}

// Test 4: Like-for-Like Comparisons (Week vs same weekdays last week)
{
  const now = new Date('2026-11-11T12:00:00Z').getTime(); // Wednesday
  const testPlan: UserPlan = {
    ...DEFAULT_PLAN,
    weekStartDay: 'MONDAY',
    usualPerDay: 10,
  };

  const entries: Entry[] = [
    // This week (Mon, Tue, Wed): 2 cigarettes total
    { id: 'cw1', timestamp: now - 3600000, timezoneOffset: 0, type: 'CIGARETTE' },
    { id: 'cw2', timestamp: now - 86400000, timezoneOffset: 0, type: 'CIGARETTE' },

    // Last week same days (Mon, Tue, Wed): 10 cigarettes total
    { id: 'pw1', timestamp: now - 7 * 86400000, timezoneOffset: 0, type: 'CIGARETTE' },
    { id: 'pw2', timestamp: now - 8 * 86400000, timezoneOffset: 0, type: 'CIGARETTE' },
  ];

  const comp = calculatePeriodComparison(entries, 'WEEK', testPlan, now, 'MONDAY');
  assert.strictEqual(comp.cigarettes.currentValue, 2);
  assert.strictEqual(comp.cigarettes.previousValue, 2);
  console.log('✓ Test 4: Like-for-like weekly comparison passed.');
}

// Test 5: Rounds & Milestones Logic (Cannot be failed, last 7 days rule)
{
  const now = Date.now();
  // 30 days smoke-free, but smoked yesterday
  const entriesWithRecentSlip: Entry[] = [
    {
      id: 'slip_yesterday',
      timestamp: now - 86400 * 1000,
      timezoneOffset: 0,
      type: 'CIGARETTE',
    },
  ];

  const status = calculateRoundStatus(24, 28, entriesWithRecentSlip, now);
  // Reached 28 days target, but has recent cigarette in last 7 days -> Almost there, extends!
  assert.strictEqual(status.isAlmostThere, true);
  assert.strictEqual(status.isComplete, false);

  // Without recent slip, user graduates from Round 1 into Round 2 (target 90 days)
  const cleanStatus = calculateRoundStatus(680, 28, [], now);
  assert.strictEqual(cleanStatus.currentRoundNumber, 2);
  assert.strictEqual(cleanStatus.isAlmostThere, false);

  // Full completion of final Round 3 (365 days)
  const finalRoundComplete = calculateRoundStatus(8800, 365, [], now);
  assert.strictEqual(finalRoundComplete.isComplete, true);
  console.log('✓ Test 5: Rounds cannot be failed, extension on recent slip verified.');
}

// Test 6: Cut-down schedule limit calculation
{
  const now = Date.now();
  const schedule2w = {
    startDate: toLocalDateString(now),
    planWeeks: 2,
    initialUsual: 20,
  };
  const week1 = calculateCutDownLimitToday(schedule2w, now);
  assert.strictEqual(week1.limitToday, 10); // 50% cut in week 1
  assert.strictEqual(week1.percentReduced, 50);

  // 8 days later (week 2)
  const week2 = calculateCutDownLimitToday(schedule2w, now + 8 * 86400 * 1000);
  assert.strictEqual(week2.limitToday, 5); // 75% cut in week 2
  assert.strictEqual(week2.percentReduced, 75);
  console.log('✓ Test 6: Cut-down mode schedule reduction targets passed.');
}

// Test 7: Patterns - Average time between cigarettes and First cigarette trend
{
  const baseTime = new Date('2026-11-10T08:00:00Z').getTime();
  const testEntries: Entry[] = [
    { id: 'c1', timestamp: baseTime, timezoneOffset: 0, type: 'CIGARETTE', triggers: ['waking_up', 'coffee_tea'] },
    { id: 'c2', timestamp: baseTime + 2 * 3600 * 1000, timezoneOffset: 0, type: 'CIGARETTE', triggers: ['work_breaks'] }, // 2h interval
    { id: 'c3', timestamp: baseTime + 5 * 3600 * 1000, timezoneOffset: 0, type: 'CIGARETTE', triggers: ['coffee_tea'] }, // 3h interval
  ];

  const spacing = calculateAverageTimeBetweenCigarettes(testEntries);
  // Intervals: 120m, 180m -> Avg 150m = 2h 30m
  assert.strictEqual(spacing.averageMinutes, 150);
  assert.strictEqual(spacing.formatted, '2h 30m');

  const top = calculateTopTriggers(testEntries);
  assert.strictEqual(top[0].trigger, 'coffee_tea');
  assert.strictEqual(top[0].count, 2);
  console.log('✓ Test 7: Spacing intervals & top triggers aggregation passed.');
}

console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY! ---');

