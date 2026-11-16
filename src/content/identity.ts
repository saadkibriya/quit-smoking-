import { Entry, UserPlan } from '../types';
import { isCravingResistedEvent, calculateSmokeFreeDays, calculateCurrentStreak } from '../domain/calculations';

/**
 * Identity layer: "I am a nonsmoker" rather than "I am trying to quit".
 *
 * This is the difference between fighting a habit forever and becoming a person
 * who no longer needs it. The copy and mechanics here draw on:
 * - James Clear, *Atomic Habits*: identity-based habits, "every action is a vote
 *   for the type of person you wish to become", the 2-minute rule,
 *   environment design, and "never miss twice".
 * - Allen Carr, *The Easy Way to Stop Smoking*: the pleasure of a cigarette is
 *   only relief from the withdrawal the previous one created; there is nothing
 *   to give up, so there is nothing to grieve.
 * - Peter Gollwitzer's implementation intentions research: pre-deciding
 *   "when X happens, I will Y" beats in-the-moment willpower.
 * - NICE "Cut Down to Stop": lengthening the interval between cigarettes is a
 *   legitimate reduction method, best used as a short on-ramp to a quit date.
 */

export const IDENTITY_STATEMENT = 'I am a nonsmoker.';
export const IDENTITY_SUBLINE =
  'Not someone escaping smoke. Someone who saw the trap and stepped around it.';

export interface MindsetPrinciple {
  id: string;
  title: string;
  body: string;
  action: string;
  source: string;
  tag: 'IDENTITY' | 'ENVIRONMENT' | 'URGE' | 'RECOVERY' | 'REWARD';
}

export const MINDSET_PRINCIPLES: MindsetPrinciple[] = [
  {
    id: 'vote',
    title: 'Every urge is a vote',
    body:
      'You are not "quitting smoking". You are becoming a person who does not smoke. Each time you ride an urge out, you cast a vote for that person. You never need a unanimous vote — just a majority.',
    action: 'Next urge: say "this is a vote" before you do anything else.',
    source: 'Atomic Habits — James Clear',
    tag: 'IDENTITY',
  },
  {
    id: 'no-loss',
    title: 'Nothing is being taken from you',
    body:
      'A cigarette never gave you calm. It ended the withdrawal the last one created, then started the next one. You are not giving up a pleasure; you are refusing to pay for a problem you did not have before you started.',
    action: 'Say "I don\'t smoke" — not "I can\'t smoke". One is an identity, the other is a cage.',
    source: 'The Easy Way to Stop Smoking — Allen Carr',
    tag: 'IDENTITY',
  },
  {
    id: 'environment',
    title: 'Make it invisible',
    body:
      'Willpower is a terrible long-term strategy; environment is a great one. People who quit successfully change their surroundings, not just their intentions.',
    action: 'Remove every pack, lighter and ashtray from sight tonight. Change one smoking spot.',
    source: 'Atomic Habits — James Clear',
    tag: 'ENVIRONMENT',
  },
  {
    id: 'two-minute',
    title: 'Only two minutes',
    body:
      'You never have to resist forever. A craving rises, peaks and falls on its own — usually inside ten minutes. Shrink the commitment until it is impossible to fail.',
    action: 'Commit to two minutes of slow breathing. Then decide again.',
    source: 'Atomic Habits — James Clear',
    tag: 'URGE',
  },
  {
    id: 'if-then',
    title: 'Decide before the urge',
    body:
      'Pre-decided responses ("when I finish a meal, I brush my teeth") outperform intentions formed in the middle of a craving, when the brain is already bargaining.',
    action: 'Write one if-then plan for your strongest trigger and keep it on screen.',
    source: 'Implementation intentions — Peter Gollwitzer',
    tag: 'URGE',
  },
  {
    id: 'never-twice',
    title: 'Never miss twice',
    body:
      'One cigarette is a data point. A second one in the same pattern is the beginning of a new habit. Missing once is an accident; missing twice is the start of a relapse.',
    action: 'After a slip: log it honestly within the hour, and take one vote back before bed.',
    source: 'Atomic Habits — James Clear',
    tag: 'RECOVERY',
  },
  {
    id: 'stretch',
    title: 'Widen the distance',
    body:
      'Instead of one impossible leap, stretch the gap between cigarettes a little at a time. Scheduled stretching lowers craving and withdrawal — and every extra minute is proof you are not powerless.',
    action: 'Beat your meter target by ten minutes. Then let it reset.',
    source: 'NICE Cut Down to Stop; JMIR Form Res 2023',
    tag: 'URGE',
  },
  {
    id: 'reward',
    title: 'Make the win visible',
    body:
      'What gets rewarded gets repeated. Money not burned is real money. A streak you can see is a streak you protect.',
    action: 'Pick one thing you will buy with the money you keep this month.',
    source: 'Atomic Habits — James Clear',
    tag: 'REWARD',
  },
];

/** Stable per-day rotation so the card does not flicker between renders. */
export function getTodaysPrinciple(date: Date = new Date()): MindsetPrinciple {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayIndex = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return MINDSET_PRINCIPLES[((dayIndex % MINDSET_PRINCIPLES.length) + MINDSET_PRINCIPLES.length) % MINDSET_PRINCIPLES.length];
}

export interface IdentityLedger {
  /** Cravings ridden out: direct votes for "I don't need it". */
  urgesBeaten: number;
  /** Completed smoke-free days: the slow, compounding votes. */
  cleanDays: number;
  /** Every honest log is also a vote — honesty is the mechanism, not shame. */
  honestLogs: number;
  total: number;
  pledgedToday: boolean;
  /** 0–1, today's single required vote. */
  todayProgress: number;
}

export function calculateIdentityLedger(
  entries: Entry[] = [],
  plan: UserPlan,
  nowTimestamp: number = Date.now()
): IdentityLedger {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const urgesBeaten = safeEntries.filter(isCravingResistedEvent).length;
  const cleanDays = calculateSmokeFreeDays(safeEntries, plan.quitStartDate, nowTimestamp).completedSmokeFreeDays;
  const honestLogs = safeEntries.filter((e) => !e.undone && (e.type === 'CIGARETTE' || e.type === 'smoked')).length;

  const todayStr = new Date(nowTimestamp).toDateString();
  const pledgedToday = safeEntries.some(
    (e) => !e.undone && e.type === 'PLEDGE' && new Date(e.timestamp).toDateString() === todayStr
  );

  return {
    urgesBeaten,
    cleanDays,
    honestLogs,
    total: urgesBeaten + cleanDays,
    pledgedToday,
    todayProgress: pledgedToday ? 1 : 0,
  };
}

/** One-line identity status for headers. */
export function getIdentityLine(entries: Entry[], plan: UserPlan, nowTimestamp: number = Date.now()): string {
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, nowTimestamp);
  if (streak.streakHours >= 24) {
    const days = Math.floor(streak.streakHours / 24);
    return `A nonsmoker for ${days} day${days === 1 ? '' : 's'}.`;
  }
  return 'A nonsmoker, one decision at a time.';
}
