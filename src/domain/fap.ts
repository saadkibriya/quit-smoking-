import { Entry } from '../types';

const DAY_MS = 86400000;

export interface FapStats {
  /** Clean time since the streak anchor (plan start or the last logged slip). */
  cleanMs: number;
  cleanDays: number;
  cleanHours: number;
  cleanMinutes: number;
  totalLapses: number;
  todayLapses: number;
  weekLapses: number;
  /** Longest clean stretch ever, in hours, including the current one. */
  longestCleanHours: number;
  lastLapseAt: number;
  /** True when nothing was logged today. */
  cleanToday: boolean;
  /** Seconds until the current day ends; handy for "clean today" copy. */
  onTrack: boolean;
}

export function isFapLapse(entry: Entry): boolean {
  if (entry.undone) return false;
  // An urge ridden out is the opposite of a slip: it must never reset the timer
  // or show up in the slip counts (it also carries habitId 'fap').
  if (entry.type === 'FAP_URGE_BEATEN') return false;
  return entry.type === 'FAP' || entry.habitId === 'fap';
}

export function isFapUrgeBeaten(entry: Entry): boolean {
  return !entry.undone && entry.type === 'FAP_URGE_BEATEN';
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getFapStats(entries: Entry[], startDate: string, now = Date.now()): FapStats {
  const lapses = entries
    .filter(isFapLapse)
    .filter((e) => typeof e.timestamp === 'number')
    .sort((a, b) => a.timestamp - b.timestamp);

  const startMs = new Date(startDate).getTime();
  const anchor = lapses.length
    ? Math.max(Number.isFinite(startMs) ? startMs : 0, lapses[lapses.length - 1].timestamp)
    : Number.isFinite(startMs)
    ? startMs
    : now;

  const cleanMs = Math.max(0, now - anchor);
  const dayStart = startOfLocalDay(now);
  const todayLapses = lapses.filter((e) => e.timestamp >= dayStart).length;
  const weekLapses = lapses.filter((e) => e.timestamp >= now - 7 * DAY_MS).length;

  let previous = Number.isFinite(startMs) ? startMs : anchor;
  let longestGap = 0;
  for (const lapse of lapses) {
    longestGap = Math.max(longestGap, lapse.timestamp - previous);
    previous = lapse.timestamp;
  }
  const longestCleanHours = Math.max(longestGap, now - previous) / 3600000;

  return {
    cleanMs,
    cleanDays: Math.floor(cleanMs / DAY_MS),
    cleanHours: Math.floor((cleanMs % DAY_MS) / 3600000),
    cleanMinutes: Math.floor((cleanMs % 3600000) / 60000),
    totalLapses: lapses.length,
    todayLapses,
    weekLapses,
    longestCleanHours,
    lastLapseAt: lapses.length ? lapses[lapses.length - 1].timestamp : 0,
    cleanToday: todayLapses === 0,
    onTrack: todayLapses === 0,
  };
}

/** "3d 4h", "5h 12m", "42m" — any duration, not just a streak. */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY_MS);
  const hours = Math.floor((safe % DAY_MS) / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  if (safe >= DAY_MS) return `${days}d ${hours}h`;
  if (safe >= 3600000) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

/** "3d 4h 05m" — the long form used in supporting lines. */
export function formatDurationLong(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY_MS);
  const hours = Math.floor((safe % DAY_MS) / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  if (safe >= DAY_MS) return `${days}d ${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (safe >= 3600000) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

/** "3d 4h", "5h 12m", "42m" — the clean-streak hero. */
export function formatCleanTime(stats: FapStats): string {
  return formatDuration(stats.cleanMs);
}

export function formatCleanTimeLong(stats: FapStats): string {
  return formatDurationLong(stats.cleanMs);
}

/** Count of urges ridden out in the last `days` days. */
export function countUrgesBeaten(entries: Entry[], days = 7, now = Date.now()): number {
  const cutoff = now - days * DAY_MS;
  return entries.filter((e) => isFapUrgeBeaten(e) && e.timestamp >= cutoff).length;
}
