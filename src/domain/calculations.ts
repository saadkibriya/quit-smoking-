import { Entry, UserPlan, WeekStartDay } from '../types';

export interface DayMetrics {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  cigarettesCount: number;
  cravingsBeatenCount: number;
  isSmokeFree: boolean;
  entries: Entry[];
}

export interface ComparisonResult {
  currentValue: number;
  previousValue: number;
  diff: number;
  percentChange: number | null; // null if previous was 0 -> shows "New"
  isImprovement: boolean; // For cigarettes, decrease is good; for savings/beaten/smoke-free, increase is good
}

export interface PeriodComparison {
  cigarettes: ComparisonResult;
  smokeFreeDays: ComparisonResult;
  cravingsBeaten: ComparisonResult;
  moneyKept: ComparisonResult;
}

export interface RoundStatus {
  currentRoundNumber: number; // 1, 2, 3
  currentRoundName: string;
  roundTargetDays: number;
  daysIntoRound: number;
  isComplete: boolean;
  isAlmostThere: boolean; // reached target days but smoked in last 7 days
  daysNeededToComplete: number; // consecutive smoke-free days needed to clear the last-7-day rule
  consecutiveSmokeFreeLast7: number;
  nextMilestoneHours: number;
  nextMilestoneTitle: string;
  nextMilestoneWhy: string;
  hoursUntilNextMilestone: number;
}

// Format local date YYYY-MM-DD
export function toLocalDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

// Heaviness of Smoking Index (0 to 6)
export function calculateDependenceScore(usualPerDay: number, ttfc: string): {
  score: number;
  category: 'LOW' | 'MODERATE' | 'HIGH';
  label: string;
  cpdPoints: number;
  ttfcPoints: number;
} {
  let cpdPoints = 0;
  if (usualPerDay <= 10) cpdPoints = 0;
  else if (usualPerDay <= 20) cpdPoints = 1;
  else if (usualPerDay <= 30) cpdPoints = 2;
  else cpdPoints = 3;

  let ttfcPoints = 0;
  if (ttfc === 'after_60') ttfcPoints = 0;
  else if (ttfc === '31_to_60') ttfcPoints = 1;
  else if (ttfc === '6_to_30') ttfcPoints = 2;
  else ttfcPoints = 3; // 'within_5'

  const score = cpdPoints + ttfcPoints;
  let category: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  let label = 'Low Dependence (0-1)';

  if (score >= 5) {
    category = 'HIGH';
    label = 'High Dependence (5-6)';
  } else if (score >= 2) {
    category = 'MODERATE';
    label = 'Moderate Dependence (2-4)';
  }

  return { score, category, label, cpdPoints, ttfcPoints };
}

// Current streak in hours and breakdown
export function calculateCurrentStreak(
  entries: Entry[],
  quitStartDate: string,
  nowTimestamp: number = Date.now()
): {
  streakHours: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  lastCigaretteTimestamp: number | null;
  effectiveStartTimestamp: number;
} {
  const quitStartMs = new Date(quitStartDate).getTime();
  const cigaretteEntries = entries
    .filter((e) => e.type === 'CIGARETTE' && e.timestamp <= nowTimestamp)
    .sort((a, b) => b.timestamp - a.timestamp);

  const lastCigarette = cigaretteEntries.length > 0 ? cigaretteEntries[0].timestamp : null;
  const effectiveStart = lastCigarette ? Math.max(quitStartMs, lastCigarette) : quitStartMs;

  const diffMs = Math.max(0, nowTimestamp - effectiveStart);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const streakHours = diffMs / (1000 * 3600);

  return {
    streakHours,
    days,
    hours,
    minutes,
    seconds,
    lastCigaretteTimestamp: lastCigarette,
    effectiveStartTimestamp: effectiveStart,
  };
}

// Group entries by local calendar day
export function groupEntriesByDay(
  entries: Entry[],
  startDateStr?: string,
  endDateStr?: string
): Map<string, DayMetrics> {
  const map = new Map<string, DayMetrics>();

  for (const entry of entries) {
    const dStr = toLocalDateString(entry.timestamp);
    if (!map.has(dStr)) {
      const d = parseLocalDateString(dStr);
      map.set(dStr, {
        dateStr: dStr,
        dayOfWeek: d.getDay(),
        cigarettesCount: 0,
        cravingsBeatenCount: 0,
        isSmokeFree: true,
        entries: [],
      });
    }
    const day = map.get(dStr)!;
    day.entries.push(entry);
    if (entry.type === 'CIGARETTE') {
      day.cigarettesCount += 1;
      day.isSmokeFree = false;
    } else if (entry.type === 'CRAVING_BEATEN') {
      day.cravingsBeatenCount += 1;
    }
  }

  // Ensure continuous dates if start and end are provided
  if (startDateStr && endDateStr) {
    const cur = parseLocalDateString(startDateStr);
    const end = parseLocalDateString(endDateStr);
    while (cur <= end) {
      const dStr = toLocalDateString(cur.getTime());
      if (!map.has(dStr)) {
        map.set(dStr, {
          dateStr: dStr,
          dayOfWeek: cur.getDay(),
          cigarettesCount: 0,
          cravingsBeatenCount: 0,
          isSmokeFree: true,
          entries: [],
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  return map;
}

// Calculate cumulative smoke-free days (never decrements on slips!)
export function calculateSmokeFreeDays(
  entries: Entry[],
  quitStartDate: string,
  nowTimestamp: number = Date.now()
): {
  completedSmokeFreeDays: number;
  isTodaySoFarSmokeFree: boolean;
  todayCigarettesCount: number;
} {
  const quitStart = new Date(quitStartDate);
  const startDayStr = toLocalDateString(quitStart.getTime());
  const todayStr = toLocalDateString(nowTimestamp);

  const dayMap = groupEntriesByDay(entries, startDayStr, todayStr);
  let completedSmokeFree = 0;
  let todayCount = 0;

  for (const [dStr, day] of dayMap.entries()) {
    if (dStr === todayStr) {
      todayCount = day.cigarettesCount;
    } else if (dStr >= startDayStr) {
      if (day.cigarettesCount === 0) {
        completedSmokeFree += 1;
      }
    }
  }

  return {
    completedSmokeFreeDays: completedSmokeFree,
    isTodaySoFarSmokeFree: todayCount === 0,
    todayCigarettesCount: todayCount,
  };
}

// Cigarettes avoided calculation (grows smoothly throughout the day)
export function calculateAvoidedCigarettes(
  entries: Entry[],
  plan: UserPlan,
  nowTimestamp: number = Date.now()
): number {
  const quitStartMs = new Date(plan.quitStartDate).getTime();
  if (nowTimestamp <= quitStartMs) return 0;

  const elapsedDays = (nowTimestamp - quitStartMs) / (1000 * 86400);
  const baselineExpected = elapsedDays * plan.usualPerDay;

  const smokedSinceQuit = entries
    .filter((e) => e.type === 'CIGARETTE' && e.timestamp >= quitStartMs && e.timestamp <= nowTimestamp)
    .length;

  return Math.max(0, Math.round((baselineExpected - smokedSinceQuit) * 10) / 10);
}

// Calculate money kept based on price history
export function calculateMoneyKept(avoidedCigarettes: number, plan: UserPlan): number {
  const pricePerCigarette = plan.packPrice / Math.max(1, plan.cigarettesPerPack);
  return Math.max(0, Math.round(avoidedCigarettes * pricePerCigarette * 100) / 100);
}

// Life regained estimate: 20 minutes per avoided cigarette
export function calculateLifeRegained(avoidedCigarettes: number): {
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const totalMinutes = Math.round(avoidedCigarettes * 20);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (days > 0) formatted = `${days}d ${hours}h`;
  else if (hours > 0) formatted = `${hours}h ${minutes}m`;
  else formatted = `${minutes}m`;

  return { totalMinutes, days, hours, minutes, formatted };
}

// Like-for-like period comparisons:
// This week so far vs same weekdays last week;
// This month so far vs same number of days last month
export function calculatePeriodComparison(
  entries: Entry[],
  period: 'WEEK' | 'MONTH' | 'ALL_TIME',
  plan: UserPlan,
  nowTimestamp: number = Date.now(),
  weekStart: WeekStartDay = 'MONDAY'
): PeriodComparison {
  const today = new Date(nowTimestamp);
  const currentDaysList: string[] = [];
  const previousDaysList: string[] = [];

  if (period === 'WEEK') {
    // Determine start of current week
    const currentDayOfWeek = today.getDay(); // 0 = Sun
    let daysSinceWeekStart = 0;
    if (weekStart === 'MONDAY') {
      daysSinceWeekStart = (currentDayOfWeek + 6) % 7;
    } else if (weekStart === 'SUNDAY') {
      daysSinceWeekStart = currentDayOfWeek;
    } else {
      // SATURDAY
      daysSinceWeekStart = (currentDayOfWeek + 1) % 7;
    }

    // Days in current week so far: from 0 to daysSinceWeekStart
    for (let i = 0; i <= daysSinceWeekStart; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (daysSinceWeekStart - i));
      currentDaysList.push(toLocalDateString(d.getTime()));

      // Same weekday last week (exactly 7 days prior)
      const prevD = new Date(d);
      prevD.setDate(d.getDate() - 7);
      previousDaysList.push(toLocalDateString(prevD.getTime()));
    }
  } else if (period === 'MONTH') {
    const currentDayOfMonth = today.getDate(); // 1..31
    for (let i = 1; i <= currentDayOfMonth; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      currentDaysList.push(toLocalDateString(d.getTime()));

      // Same day number in previous month (or capped to last day of previous month)
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      const prevDayNum = Math.min(i, prevMonthLastDay);
      const prevD = new Date(today.getFullYear(), today.getMonth() - 1, prevDayNum);
      previousDaysList.push(toLocalDateString(prevD.getTime()));
    }
  } else {
    // ALL TIME - compare last 30 days vs prior 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      currentDaysList.push(toLocalDateString(d.getTime()));

      const prevD = new Date(today);
      prevD.setDate(today.getDate() - 30 - i);
      previousDaysList.push(toLocalDateString(prevD.getTime()));
    }
  }

  // Count aggregates for current vs previous
  const currentMap = new Map<string, { cigs: number; beaten: number }>();
  const previousMap = new Map<string, { cigs: number; beaten: number }>();

  for (const e of entries) {
    const dStr = toLocalDateString(e.timestamp);
    if (currentDaysList.includes(dStr)) {
      if (!currentMap.has(dStr)) currentMap.set(dStr, { cigs: 0, beaten: 0 });
      const item = currentMap.get(dStr)!;
      if (e.type === 'CIGARETTE') item.cigs += 1;
      else if (e.type === 'CRAVING_BEATEN') item.beaten += 1;
    }
    if (previousDaysList.includes(dStr)) {
      if (!previousMap.has(dStr)) previousMap.set(dStr, { cigs: 0, beaten: 0 });
      const item = previousMap.get(dStr)!;
      if (e.type === 'CIGARETTE') item.cigs += 1;
      else if (e.type === 'CRAVING_BEATEN') item.beaten += 1;
    }
  }

  const curCigs = currentDaysList.reduce((acc, d) => acc + (currentMap.get(d)?.cigs || 0), 0);
  const prevCigs = previousDaysList.reduce((acc, d) => acc + (previousMap.get(d)?.cigs || 0), 0);

  const curBeaten = currentDaysList.reduce((acc, d) => acc + (currentMap.get(d)?.beaten || 0), 0);
  const prevBeaten = previousDaysList.reduce((acc, d) => acc + (previousMap.get(d)?.beaten || 0), 0);

  const curSmokeFree = currentDaysList.filter((d) => (currentMap.get(d)?.cigs || 0) === 0).length;
  const prevSmokeFree = previousDaysList.filter((d) => (previousMap.get(d)?.cigs || 0) === 0).length;

  const pricePerCig = plan.packPrice / Math.max(1, plan.cigarettesPerPack);
  const curAvoided = Math.max(0, currentDaysList.length * plan.usualPerDay - curCigs);
  const prevAvoided = Math.max(0, previousDaysList.length * plan.usualPerDay - prevCigs);
  const curMoney = Math.round(curAvoided * pricePerCig);
  const prevMoney = Math.round(prevAvoided * pricePerCig);

  function makeComparison(cur: number, prev: number, lowerIsBetter: boolean): ComparisonResult {
    const diff = cur - prev;
    let percentChange: number | null = null;
    if (prev > 0) {
      percentChange = Math.round((Math.abs(diff) / prev) * 100);
    }
    const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;
    return {
      currentValue: cur,
      previousValue: prev,
      diff,
      percentChange,
      isImprovement,
    };
  }

  return {
    cigarettes: makeComparison(curCigs, prevCigs, true),
    smokeFreeDays: makeComparison(curSmokeFree, prevSmokeFree, false),
    cravingsBeaten: makeComparison(curBeaten, prevBeaten, false),
    moneyKept: makeComparison(curMoney, prevMoney, false),
  };
}

// Toughest hours: 7-day x 24-hour count of cigarettes & cravings
export function calculateToughestHours(
  entries: Entry[],
  daysLookback: number = 30
): {
  matrix: number[][]; // [dayOfWeek: 0-6][hour: 0-23]
  peakHour: number;
  peakDayOfWeek: number;
  maxCount: number;
} {
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const cutoff = Date.now() - daysLookback * 86400 * 1000;

  let peakHour = 20; // default 8pm
  let peakDayOfWeek = 5; // Friday default
  let maxCount = 0;

  for (const e of entries) {
    if (e.timestamp >= cutoff && (e.type === 'CIGARETTE' || e.type === 'CRAVING_BEATEN')) {
      const d = new Date(e.timestamp);
      const dow = d.getDay();
      const hour = d.getHours();
      matrix[dow][hour] += 1;
      if (matrix[dow][hour] > maxCount) {
        maxCount = matrix[dow][hour];
        peakHour = hour;
        peakDayOfWeek = dow;
      }
    }
  }

  return { matrix, peakHour, peakDayOfWeek, maxCount };
}

// Average craving length (median of durations, only after >= 3 entries)
export function calculateAverageCravingLength(entries: Entry[]): {
  medianSeconds: number | null;
  formattedMinutes: string | null;
  totalLoggedWithDuration: number;
} {
  const durations = entries
    .filter((e) => e.type === 'CRAVING_BEATEN' && typeof e.cravingDurationSeconds === 'number' && e.cravingDurationSeconds > 0)
    .map((e) => e.cravingDurationSeconds!)
    .sort((a, b) => a - b);

  if (durations.length < 3) {
    return {
      medianSeconds: null,
      formattedMinutes: null,
      totalLoggedWithDuration: durations.length,
    };
  }

  const mid = Math.floor(durations.length / 2);
  const medianSec =
    durations.length % 2 !== 0 ? durations[mid] : Math.round((durations[mid - 1] + durations[mid]) / 2);

  const mins = Math.max(1, Math.round(medianSec / 60));
  return {
    medianSeconds: medianSec,
    formattedMinutes: `about ${mins} minute${mins === 1 ? '' : 's'}`,
    totalLoggedWithDuration: durations.length,
  };
}

// Section 4 Rounds and Milestones logic:
// Round 1: Days 1 to 28. Round 2: Days 29 to 90. Round 3: Days 91 to 365.
// A round cannot be failed. It completes when its target day count is reached
// AND the last 7 days were smoke-free. If smoked in last 7 days, "Almost there: X more smoke-free days..."
export function calculateRoundStatus(
  streakHours: number,
  smokeFreeDays: number,
  entries: Entry[],
  nowTimestamp: number = Date.now()
): RoundStatus {
  // Check last 7 days for any cigarettes
  const sevenDaysAgoMs = nowTimestamp - 7 * 86400 * 1000;
  const recentCigarettes = entries.filter((e) => e.type === 'CIGARETTE' && e.timestamp >= sevenDaysAgoMs);

  let consecutiveSmokeFreeLast7 = 7 - recentCigarettes.length;
  if (consecutiveSmokeFreeLast7 < 0) consecutiveSmokeFreeLast7 = 0;

  const last7SmokeFree = recentCigarettes.length === 0;

  // Round selection: only advance to Round 2 or 3 if target days AND last 7 smoke-free days rule are met!
  let currentRoundNumber = 1;
  let currentRoundName = 'Round 1';
  let roundTargetDays = 28;

  if (smokeFreeDays >= 28 && last7SmokeFree) {
    if (smokeFreeDays >= 90 && last7SmokeFree) {
      currentRoundNumber = 3;
      currentRoundName = 'Round 3';
      roundTargetDays = 365;
    } else {
      currentRoundNumber = 2;
      currentRoundName = 'Round 2';
      roundTargetDays = 90;
    }
  }

  const daysIntoRound = Math.min(smokeFreeDays, roundTargetDays);
  const reachedDays = daysIntoRound >= roundTargetDays;

  const isComplete = reachedDays && last7SmokeFree;
  const isAlmostThere = reachedDays && !last7SmokeFree;
  const daysNeededToComplete = isAlmostThere ? 7 - consecutiveSmokeFreeLast7 : 0;

  // Next milestone calculation on current streak
  const MILESTONE_HOURS = [24, 72, 168, 336, 672, 1008, 2160, 4320, 8760];
  const MILESTONE_DATA: Record<number, { title: string; why: string }> = {
    24: { title: '24 hours', why: 'Carbon monoxide normalizes' },
    72: { title: '72 hours', why: 'Nicotine cleared from body' },
    168: { title: '7 days', why: 'Peak withdrawal week passed' },
    336: { title: '14 days', why: 'Strongest predictor of long-term success' },
    672: { title: '28 days', why: 'Round 1 complete (5x quit likelihood)' },
    1008: { title: '6 weeks', why: 'Mood & anxiety improve significantly' },
    2160: { title: '90 days', why: 'Receptor upregulation normalized' },
    4320: { title: '6 months', why: 'Airways and lung cilia clear' },
    8760: { title: '1 year', why: 'Excess heart risk halved' },
  };

  let nextHours = 24;
  for (const h of MILESTONE_HOURS) {
    if (streakHours < h) {
      nextHours = h;
      break;
    }
  }

  const nextMilestoneTitle = MILESTONE_DATA[nextHours]?.title || '1 year';
  const nextMilestoneWhy = MILESTONE_DATA[nextHours]?.why || 'Excess heart risk halved';
  const hoursUntilNextMilestone = Math.max(0, nextHours - streakHours);

  return {
    currentRoundNumber,
    currentRoundName,
    roundTargetDays,
    daysIntoRound,
    isComplete,
    isAlmostThere,
    daysNeededToComplete: Math.max(1, daysNeededToComplete),
    consecutiveSmokeFreeLast7,
    nextMilestoneHours: nextHours,
    nextMilestoneTitle,
    nextMilestoneWhy,
    hoursUntilNextMilestone,
  };
}

// Cut-down mode target calculation
export function calculateCutDownLimitToday(
  schedule: { startDate: string; planWeeks: number; initialUsual: number },
  nowTimestamp: number = Date.now()
): {
  limitToday: number;
  weekNumber: number;
  percentReduced: number;
} {
  const startMs = parseLocalDateString(schedule.startDate).getTime();
  const daysDiff = Math.max(0, Math.floor((nowTimestamp - startMs) / (86400 * 1000)));
  const currentWeek = Math.floor(daysDiff / 7) + 1;

  let limitToday = schedule.initialUsual;
  if (schedule.planWeeks === 2) {
    if (currentWeek === 1) limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.5));
    else limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.25));
  } else {
    // 4 weeks plan
    if (currentWeek === 1) limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.75));
    else if (currentWeek === 2) limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.5));
    else if (currentWeek === 3) limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.25));
    else limitToday = Math.max(1, Math.round(schedule.initialUsual * 0.15));
  }

  const percentReduced = Math.round(((schedule.initialUsual - limitToday) / schedule.initialUsual) * 100);

  return {
    limitToday,
    weekNumber: currentWeek,
    percentReduced,
  };
}
