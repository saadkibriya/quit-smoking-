import { Entry, UserPlan } from '../types';
import { isSmokeEvent, isCravingResistedEvent, toLocalDateString, parseLocalDateString } from './calculations';

/**
 * Pacing engine: the "distance between cigarettes" model.
 *
 * The idea: your smoking habit has a natural rhythm (a median gap between
 * cigarettes). Instead of only counting cigarettes, we measure the *distance*
 * between them and try to widen it. This turns a quit attempt into a series of
 * small, winnable stretches rather than one enormous act of willpower.
 *
 * Grounding:
 * - NICE "Cut Down to Stop" lists "increasing the time interval between
 *   cigarettes" as an accepted reduction method (up to ~6 weeks before a quit date).
 * - Scheduled smoking + pre-cessation NRT reduced withdrawal and craving in a
 *   randomised trial (JMIR Form Res 2023), with benefit tied to schedule compliance.
 * - Abrupt quitting still has the strongest evidence for lasting abstinence
 *   (Lindson et al., Cochrane 2019; Hughes et al., JAMA Intern Med 2016), so the
 *   pacing meter is framed as an on-ramp and awareness tool, never a substitute
 *   for a quit date.
 */

/** Gaps longer than this are treated as sleep/overnight, not smoking rhythm. */
export const MAX_RHYTHM_GAP_MINUTES = 12 * 60;

/** How many days of history feed the personal baseline. */
export const BASELINE_LOOKBACK_DAYS = 28;

export type PaceStatus = 'CALIBRATING' | 'EARLY' | 'ON_PACE' | 'STRETCHED';

export type PaceTrend = 'STRETCHING' | 'TIGHTENING' | 'STEADY' | 'UNKNOWN';

export interface PaceGap {
  /** Timestamp of the cigarette that started the gap. */
  startMs: number;
  /** Timestamp of the cigarette that ended the gap. */
  endMs: number;
  minutes: number;
  /** Local date (YYYY-MM-DD) of the later cigarette. */
  dateStr: string;
}

export interface PaceProfile {
  /** Personal median gap, in minutes. Always a usable number (falls back to an estimate). */
  baselineMinutes: number;
  baselineSource: 'HISTORY' | 'ESTIMATE';
  /** The gap we are currently trying to beat. */
  targetMinutes: number;
  /** Minutes since the last cigarette (or since the quit date if none logged). */
  currentGapMinutes: number;
  currentGapMs: number;
  /** currentGap / target. 1.0 = you matched your usual rhythm. */
  ratio: number;
  status: PaceStatus;
  /** Where the current gap started. */
  anchor: 'CIGARETTE' | 'QUIT_START';
  lastCigaretteMs: number | null;
  /** When the "usual" window closes (last cigarette + target). */
  nextWindowMs: number | null;
  /** Positive = window still ahead. Negative = already past it. */
  minutesUntilWindow: number;
  /** Current gap minus personal median. */
  vsBaselineMinutes: number;
  /** The gap immediately before the current one, if any. */
  lastGapMinutes: number | null;
  /** Current gap minus the previous gap. */
  vsLastGapMinutes: number | null;
  trendMinutes: number;
  trendDirection: PaceTrend;
  /** Widest gap recorded today (within rhythm bounds). */
  longestGapTodayMinutes: number;
  /** All-time widest gap within rhythm bounds. */
  recordGapMinutes: number;
  recordGapMs: number | null;
  /** Chronological gaps used by the charts. */
  gaps: PaceGap[];
  /** Number of gaps available inside the baseline window. */
  sampleSize: number;
}

export interface DailyPace {
  dateStr: string;
  label: string; // e.g. "MON"
  cigaretteCount: number;
  longestGapMinutes: number | null;
  averageGapMinutes: number | null;
  isToday: boolean;
}

export interface HourlyLoad {
  hours: number[]; // 24 buckets
  peakHour: number;
  peakCount: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function smokingEntries(entries: Entry[] = [], nowTimestamp: number = Date.now()): Entry[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(isSmokeEvent)
    .filter((e) => typeof e.timestamp === 'number' && e.timestamp <= nowTimestamp)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * All gaps between consecutive cigarettes, within rhythm bounds.
 * Overnight gaps (> 12h) are excluded so sleep does not flatter the numbers.
 */
export function collectGaps(
  entries: Entry[] = [],
  nowTimestamp: number = Date.now(),
  maxGapMinutes: number = MAX_RHYTHM_GAP_MINUTES
): PaceGap[] {
  const cigs = smokingEntries(entries, nowTimestamp);
  const gaps: PaceGap[] = [];

  for (let i = 1; i < cigs.length; i += 1) {
    const startMs = cigs[i - 1].timestamp;
    const endMs = cigs[i].timestamp;
    const minutes = Math.round((endMs - startMs) / 60000);
    if (minutes <= 0 || minutes > maxGapMinutes) continue;
    gaps.push({ startMs, endMs, minutes, dateStr: toLocalDateString(endMs) });
  }

  return gaps;
}

/** Waking-window fallback when there is not enough history yet. */
export function estimateBaselineFromPlan(plan: UserPlan): number {
  let wakeMinutes = 7 * 60;
  let sleepMinutes = 23 * 60;

  const parse = (value: string | undefined, fallback: number) => {
    const [h, m] = (value || '').split(':').map(Number);
    return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : fallback;
  };

  wakeMinutes = parse(plan?.wakeTime, wakeMinutes);
  sleepMinutes = parse(plan?.sleepTime, sleepMinutes);

  let windowMinutes = sleepMinutes - wakeMinutes;
  if (windowMinutes <= 0) windowMinutes += 24 * 60; // overnight waking window
  windowMinutes = clamp(windowMinutes, 8 * 60, 20 * 60);

  const perDay = clamp(plan?.usualPerDay || 15, 1, 80);
  return Math.max(20, Math.round(windowMinutes / perDay));
}

/**
 * The gap we ask the user to beat next: 20% wider than their own rhythm,
 * and at least 10 minutes wider. Rounded to 5 minutes so it reads cleanly.
 */
export function calculateTargetGap(baselineMinutes: number): number {
  const stretched = Math.max(baselineMinutes + 10, baselineMinutes * 1.2);
  return Math.max(15, Math.round(stretched / 5) * 5);
}

export function calculatePaceProfile(
  entries: Entry[] = [],
  plan: UserPlan,
  nowTimestamp: number = Date.now()
): PaceProfile {
  const gaps = collectGaps(entries, nowTimestamp);
  const cutoff = nowTimestamp - BASELINE_LOOKBACK_DAYS * 86400 * 1000;
  const recentGaps = gaps.filter((g) => g.endMs >= cutoff);

  const historyMedian = median(recentGaps.map((g) => g.minutes));
  const baselineSource: PaceProfile['baselineSource'] = historyMedian === null ? 'ESTIMATE' : 'HISTORY';
  const baselineMinutes = historyMedian ?? estimateBaselineFromPlan(plan);
  const targetMinutes = calculateTargetGap(baselineMinutes);

  const cigs = smokingEntries(entries, nowTimestamp);
  const last = cigs.length > 0 ? cigs[cigs.length - 1] : null;

  const parsedQuitMs = new Date(plan?.quitStartDate || '').getTime();
  const quitStartMs = Number.isFinite(parsedQuitMs) ? Math.min(parsedQuitMs, nowTimestamp) : nowTimestamp;

  const anchor: PaceProfile['anchor'] = last ? 'CIGARETTE' : 'QUIT_START';
  const anchorMs = last ? Math.max(last.timestamp, quitStartMs) : quitStartMs;
  const currentGapMs = Math.max(0, nowTimestamp - anchorMs);
  const currentGapMinutes = Math.floor(currentGapMs / 60000);
  const ratio = currentGapMinutes / Math.max(1, targetMinutes);

  let status: PaceStatus = 'EARLY';
  if (historyMedian === null) status = 'CALIBRATING';
  else if (ratio >= 1) status = 'STRETCHED';
  else if (ratio >= 0.8) status = 'ON_PACE';

  const nextWindowMs = last ? last.timestamp + targetMinutes * 60000 : quitStartMs + targetMinutes * 60000;
  const minutesUntilWindow = Math.round((nextWindowMs - nowTimestamp) / 60000);

  // Conversation with your own past: how does this gap compare to the one before?
  const completedGaps = gaps.filter((g) => g.endMs <= (last?.timestamp ?? nowTimestamp));
  const lastGapMinutes = completedGaps.length > 0 ? completedGaps[completedGaps.length - 1].minutes : null;
  const vsLastGapMinutes = lastGapMinutes === null ? null : currentGapMinutes - lastGapMinutes;

  // Trend: last 7 completed gaps vs the 7 before them.
  const recent7 = completedGaps.slice(-7).map((g) => g.minutes);
  const prior7 = completedGaps.slice(-14, -7).map((g) => g.minutes);
  const recentAvg = mean(recent7);
  const priorAvg = mean(prior7);
  let trendMinutes = 0;
  let trendDirection: PaceTrend = 'UNKNOWN';
  if (recentAvg !== null && priorAvg !== null) {
    trendMinutes = Math.round(recentAvg - priorAvg);
    if (Math.abs(trendMinutes) < 5) trendDirection = 'STEADY';
    else trendDirection = trendMinutes > 0 ? 'STRETCHING' : 'TIGHTENING';
  }

  const todayStr = toLocalDateString(nowTimestamp);
  const todayGaps = gaps.filter((g) => g.dateStr === todayStr).map((g) => g.minutes);
  const longestGapTodayMinutes = todayGaps.length > 0 ? Math.max(...todayGaps) : 0;

  const recordGapMinutes = gaps.length > 0 ? Math.max(...gaps.map((g) => g.minutes)) : 0;
  const record = gaps.find((g) => g.minutes === recordGapMinutes) || null;

  return {
    baselineMinutes,
    baselineSource,
    targetMinutes,
    currentGapMinutes,
    currentGapMs,
    ratio,
    status,
    anchor,
    lastCigaretteMs: last ? last.timestamp : null,
    nextWindowMs,
    minutesUntilWindow,
    vsBaselineMinutes: currentGapMinutes - baselineMinutes,
    lastGapMinutes,
    vsLastGapMinutes,
    trendMinutes,
    trendDirection,
    longestGapTodayMinutes,
    recordGapMinutes,
    recordGapMs: record ? record.endMs : null,
    gaps,
    sampleSize: recentGaps.length,
  };
}

/**
 * Per-day distance summary, oldest first. Used by the dashboard table.
 */
export function calculateDailyPace(
  entries: Entry[] = [],
  plan: UserPlan,
  days: number = 7,
  nowTimestamp: number = Date.now()
): DailyPace[] {
  const gaps = collectGaps(entries, nowTimestamp);
  const cigs = smokingEntries(entries, nowTimestamp);
  const todayStr = toLocalDateString(nowTimestamp);
  const out: DailyPace[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const dayStart = new Date(nowTimestamp);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dateStr = toLocalDateString(dayStart.getTime());
    const dayGaps = gaps.filter((g) => g.dateStr === dateStr).map((g) => g.minutes);
    const avg = mean(dayGaps);

    out.push({
      dateStr,
      label: parseLocalDateString(dateStr)
        .toLocaleDateString(undefined, { weekday: 'short' })
        .slice(0, 2)
        .toUpperCase(),
      cigaretteCount: cigs.filter((c) => toLocalDateString(c.timestamp) === dateStr).length,
      longestGapMinutes: dayGaps.length > 0 ? Math.max(...dayGaps) : null,
      averageGapMinutes: avg === null ? null : Math.round(avg),
      isToday: dateStr === todayStr,
    });
  }

  return out;
}

/**
 * When the pull is strongest: 24-hour histogram of cigarettes + cravings.
 * This is the "environment design" input — you plan around your real weak hours.
 */
export function calculateHourlyLoad(
  entries: Entry[] = [],
  days: number = 30,
  nowTimestamp: number = Date.now()
): HourlyLoad {
  const hours = Array(24).fill(0) as number[];
  const cutoff = nowTimestamp - days * 86400 * 1000;

  for (const e of entries) {
    if (!e || e.undone) continue;
    if (e.timestamp < cutoff || e.timestamp > nowTimestamp) continue;
    if (!isSmokeEvent(e) && !isCravingResistedEvent(e)) continue;
    hours[new Date(e.timestamp).getHours()] += 1;
  }

  let peakHour = 0;
  let peakCount = 0;
  hours.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });

  return { hours, peakHour, peakCount };
}

/** "2h 14m", "45m", "1d 3h" — the primary unit of the app. */
export function formatGapMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return '—';
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours < 24) return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest === 0 ? `${days}d` : `${days}d ${rest}h`;
}

/** Signed minutes, for "34m wider than your usual". */
export function formatSignedMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return '—';
  const rounded = Math.round(minutes);
  if (rounded === 0) return 'same';
  return `${rounded > 0 ? '+' : '−'}${formatGapMinutes(Math.abs(rounded))}`;
}

export function formatClockTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Human sentence for the current pace. Non-punitive by design. */
export function getPaceHeadline(profile: PaceProfile): string {
  switch (profile.status) {
    case 'CALIBRATING':
      return 'Learning your rhythm';
    case 'EARLY':
      return 'Earlier than your usual';
    case 'ON_PACE':
      return 'On your usual rhythm';
    case 'STRETCHED':
    default:
      return 'Past your usual';
  }
}

export function getPaceAdvice(profile: PaceProfile): string {
  switch (profile.status) {
    case 'CALIBRATING':
      return 'A few honest logs and this meter learns your real rhythm. No scoring, just data.';
    case 'EARLY':
      return 'The pull came early — that is information, not a verdict. Two minutes of breathing usually outlasts it.';
    case 'ON_PACE':
      return 'Hold ten more minutes and you have stretched the distance. One small vote.';
    case 'STRETCHED':
    default:
      return profile.anchor === 'QUIT_START'
        ? 'Nothing to stretch against yet — you are simply free. Keep it that way.'
        : 'This is the distance growing. Notice it. Remember it next time the pull says it is impossible.';
  }
}
