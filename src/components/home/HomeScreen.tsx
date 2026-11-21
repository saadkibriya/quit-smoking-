import React, { useEffect, useMemo, useState } from 'react';
import { Entry, HomeCardId, HomeLayoutItem, UserPlan } from '../../types';
import {
  calculateSmokeFreeDays,
  calculateStats,
  isCravingResistedEvent,
  toLocalDateString,
} from '../../domain/calculations';
import { MILESTONES } from '../../content/milestones';
import { ChevronRight, Cigarette, Flame, Leaf, NotebookPen, Settings2, Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { DotArch } from './DotArch';
import { SegmentedBar } from './SegmentedBar';
import { ProgressRing } from './ProgressRing';
import { BubbleStat } from './BubbleStat';
import { DefaultHomeCards } from '../today/DefaultHomeCards';
import { FapCard } from '../fap/FapCard';
import './home.css';

interface HomeScreenProps {
  plan: UserPlan;
  entries: Entry[];
  homeLayout: HomeLayoutItem[];
  onOpenJourney: () => void;
  onOpenToolkit: () => void;
  onOpenSos: () => void;
  onOpenCustomize: () => void;
  onOpenPace: () => void;
  onOpenLogSheet: () => void;
  onPledge: () => void;
  onLogCigarette: () => void;
  onOpenSettings: () => void;
  /** Second tracker: show the porn/fap card when they chose "both". */
  showFap?: boolean;
  onLogFap?: () => void;
  onOpenFapUrge?: () => void;
}

/** Cards whose content already lives in the hero, so the deck must not repeat them. */
const COVERED_CARDS: HomeCardId[] = [
  'TIMER',
  'NEXT_MILESTONE',
  'MONEY_SAVED',
  'CRAVINGS_RESISTED',
  'LONGEST_STREAK',
];

/** Counts up on mount; jumps straight to the value when motion is reduced. */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function formatRemaining(hours: number): string {
  if (hours <= 0) return 'now';
  if (hours >= 48) {
    const days = Math.ceil(hours / 24);
    return `${days} days`;
  }
  // Round once, in minutes, so 42.999h never prints as "42h 60m".
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (wholeHours >= 1) {
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  }
  return `${minutes}m`;
}

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString();
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  plan,
  entries,
  homeLayout,
  onOpenJourney,
  onOpenToolkit,
  onOpenSos,
  onOpenCustomize,
  onOpenPace,
  onOpenLogSheet,
  onPledge,
  onLogCigarette,
  onOpenSettings,
  showFap = false,
  onLogFap,
  onOpenFapUrge,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const [showNextMilestone, setShowNextMilestone] = useState(false);

  // Nothing on this screen shows seconds, so a one-second tick only burned
  // battery and re-rendered the whole deck. Ten seconds keeps the timers honest
  // and stops work while the app is in the background.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => calculateStats(entries, plan, now), [entries, plan, now]);
  const smokeFree = useMemo(
    () => calculateSmokeFreeDays(entries, plan.quitStartDate, now),
    [entries, plan.quitStartDate, now]
  );
  const hours = stats.currentStreak.totalHours;

  const nextMilestone = MILESTONES.find((m) => m.hours > hours) ?? MILESTONES[MILESTONES.length - 1];
  const previousHours =
    [...MILESTONES].reverse().find((m) => m.hours <= hours)?.hours ?? 0;
  const span = Math.max(1, nextMilestone.hours - previousHours);
  const progress = Math.min(1, Math.max(0, (hours - previousHours) / span));
  const percent = Math.round(progress * 100);
  const shownPercent = useCountUp(percent);

  const hoursLeft = Math.max(0, nextMilestone.hours - hours);
  const milestonesCleared = MILESTONES.filter((m) => m.hours <= hours).length;

  const cravings = useMemo(() => {
    const weekStart = now - 7 * 24 * 3600 * 1000;
    const todayStr = toLocalDateString(now);
    let today = 0;
    let week = 0;

    for (const entry of entries) {
      if (!isCravingResistedEvent(entry) || typeof entry.timestamp !== 'number') continue;
      if (entry.timestamp < weekStart || entry.timestamp > now) continue;
      week += 1;
      if (toLocalDateString(entry.timestamp) === todayStr) today += 1;
    }

    return { today, week };
  }, [entries, now]);

  // The savings goal is a real plan field; derive a reachable target when unset.
  const savingsGoal = plan.savingsGoal?.targetAmount;
  const goal =
    savingsGoal && savingsGoal > 0
      ? savingsGoal
      : Math.max(10, Math.round(stats.moneySaved * 1.5) || 10);
  const moneyProgress = Math.min(1, stats.moneySaved / goal);

  const bestDays = Math.max(stats.longestStreakDays, stats.currentStreak.days, 1);

  const deckCards = homeLayout.filter((item) => !COVERED_CARDS.includes(item.cardId));

  const handleDirectLog = () => {
    if (plan.confirmBeforeLog && !window.confirm('Log a cigarette just now? Your timer will restart.')) {
      return;
    }
    onLogCigarette();
  };

  return (
    <div className="home-root">
      <div className="home-blob home-blob-green" aria-hidden="true" />
      <div className="home-blob home-blob-blue" aria-hidden="true" />
      <div className="home-blob home-blob-mint" aria-hidden="true" />

      <div
        className="relative z-10 px-5 pb-40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        {/* ---------- Top bar ---------- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span
                className="absolute h-4 w-4 rounded-full"
                style={{ background: 'var(--green)', animation: 'home-pulse 2.6s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span
                className="relative h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--green)' }}
                aria-hidden="true"
              />
            </span>
            <span className="home-label" style={{ color: 'var(--ink)' }}>
              {stats.isTodaySmokeFree ? 'Smoke-free right now' : `${stats.todaySmokeCount} today`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="home-glass flex h-10 items-center gap-1.5 rounded-full px-3"
              aria-label={`${stats.currentStreak.days} day streak`}
            >
              <Flame className="h-4 w-4" style={{ color: 'var(--green)' }} strokeWidth={2.2} />
              <span className="home-num text-[15px]">{stats.currentStreak.days}</span>
            </div>
            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="home-glass home-press flex h-10 w-10 items-center justify-center rounded-full"
            >
              <Settings2 className="h-[18px] w-[18px]" style={{ color: 'var(--ink)' }} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ---------- Hero: milestone arch ---------- */}
        <div className="home-rise relative mt-4">
          <DotArch progress={progress} caption="TO NEXT MILESTONE" />
          <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex flex-col items-center">
            <div className="home-num text-[56px]">{shownPercent}</div>
            <div className="home-label mt-0.5">Percent</div>
          </div>
        </div>

        <div className="mt-1 flex justify-center">
          <button
            onClick={() => setShowNextMilestone((v) => !v)}
            aria-label="Switch between your day count and your next milestone"
            className="home-press flex items-center gap-1 rounded-full px-3.5 py-2"
            style={{ background: 'var(--chip)', boxShadow: '0 6px 16px rgba(30,90,140,0.07)' }}
          >
            <span className="home-label" style={{ color: 'var(--ink)' }}>
              {showNextMilestone
                ? `Next: ${nextMilestone.title}`
                : `Day ${Math.max(1, smokeFree.completedSmokeFreeDays + 1)} smoke-free`}
            </span>
            <ChevronRight
              className="h-3.5 w-3.5"
              style={{ color: 'var(--muted)', transform: showNextMilestone ? 'rotate(90deg)' : 'none' }}
              strokeWidth={2.4}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ---------- Today's progress ---------- */}
        <div className="home-rise mt-7" style={{ animationDelay: '120ms' }}>
          <h2 className="home-title">Today&rsquo;s Progress</h2>
          <p className="home-body mt-1 text-[13px]">
            {milestonesCleared} of {MILESTONES.length} milestones cleared &middot; next in{' '}
            {formatRemaining(hoursLeft)}
          </p>
        </div>

        {/* ---------- Streak: current vs best ---------- */}
        <GlassCard className="home-rise mt-4" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between">
            <span className="home-label">Streak</span>
            <span className="home-body text-[11px] font-bold">
              {stats.isTodaySmokeFree ? 'On pace today' : 'Restarts tomorrow'}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1">
              <SegmentedBar
                value={stats.currentStreak.days}
                max={bestDays}
                tone="green"
                label="Current streak"
              />
              <div className="home-num mt-2 text-[26px]">
                {stats.currentStreak.days}
                <span className="home-label ml-1" style={{ letterSpacing: '0.12em' }}>
                  d
                </span>
              </div>
            </div>

            <div
              className="mx-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)' }}
              aria-hidden="true"
            >
              <Leaf className="h-4 w-4" style={{ color: 'var(--green)' }} strokeWidth={2.2} />
            </div>

            <div className="flex-1">
              <SegmentedBar
                value={stats.longestStreakDays}
                max={bestDays}
                tone="blue"
                blocks={9}
                delayMs={120}
                label="Personal best"
              />
              <div className="home-num mt-2 text-[26px]">
                {stats.longestStreakDays}
                <span className="home-label ml-1" style={{ letterSpacing: '0.12em' }}>
                  d
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="home-label">Current</span>
            <span className="home-label">Personal best</span>
          </div>
        </GlassCard>

        {/* ---------- Money + Cravings ---------- */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <GlassCard
            className="home-rise"
            style={{ animationDelay: '240ms' }}
            onClick={onOpenJourney}
            ariaLabel="Money saved, open progress"
          >
            <div className="flex items-center justify-between">
              <span className="home-label">Money saved</span>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <ProgressRing
                progress={moneyProgress}
                size={68}
                stroke={10}
                tone="blue"
                label={`${formatMoney(stats.moneySaved)} of ${formatMoney(goal)} ${plan.currency} saved`}
              >
                <span className="home-num text-[12px]">{plan.currency}</span>
              </ProgressRing>

              <div className="min-w-0 flex-1">
                <div className="home-num text-[24px]">{formatMoney(stats.moneySaved)}</div>
                <div className="home-body mt-0.5 text-[10px] font-bold leading-tight">
                  of {formatMoney(goal)}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            className="home-rise"
            style={{ animationDelay: '300ms' }}
            onClick={onOpenToolkit}
            ariaLabel="Cravings resisted, open toolkit"
          >
            <BubbleStat
              label="Cravings"
              value={cravings.today}
              ratio={cravings.week > 0 ? cravings.today / cravings.week : 0}
              tone="green"
              caption={`${cravings.week} this week`}
            />
          </GlassCard>
        </div>

        {/* ---------- Actions ---------- */}
        <div className="home-rise mt-4 flex items-center gap-3" style={{ animationDelay: '360ms' }}>
          <button
            onClick={onOpenLogSheet}
            className="home-press flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-extrabold uppercase"
            style={{
              background: 'var(--ink)',
              color: 'var(--ink-contrast)',
              letterSpacing: '0.1em',
              boxShadow: '0 10px 22px rgba(11,27,43,0.18)',
            }}
          >
            <NotebookPen className="h-4 w-4" strokeWidth={2.2} />
            Log a cigarette
          </button>

          <button
            onClick={handleDirectLog}
            aria-label="I smoked just now"
            className="home-press flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: 'var(--chip)',
              boxShadow: '0 8px 20px rgba(30,90,140,0.1)',
            }}
          >
            <Cigarette className="h-[18px] w-[18px]" style={{ color: 'var(--ink)' }} strokeWidth={2} />
          </button>

          <button
            onClick={onOpenCustomize}
            aria-label="Customize home"
            className="home-press flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: 'var(--chip)',
              boxShadow: '0 8px 20px rgba(30,90,140,0.1)',
            }}
          >
            <Sparkles className="h-[18px] w-[18px]" style={{ color: 'var(--ink)' }} strokeWidth={2} />
          </button>
        </div>

        {/* ---------- Second tracker: porn / fap ---------- */}
        {showFap && onLogFap && onOpenFapUrge && (
          <FapCard
            plan={plan}
            entries={entries}
            onLogSlip={onLogFap}
            onOpenUrgeHelp={onOpenFapUrge}
            onOpenSettings={onOpenSettings}
            className="home-rise mt-4"
            style={{ animationDelay: '400ms' }}
          />
        )}

        {/* ---------- Optional cards the user added in Customize ---------- */}
        {deckCards.length > 0 && (
          <div className="home-rise mt-8 space-y-4" style={{ animationDelay: '420ms' }}>
            <div className="flex items-center justify-between">
              <h3 className="home-title text-[18px]">Your tools</h3>
              <button onClick={onOpenCustomize} className="home-label" style={{ color: 'var(--blue)' }}>
                Edit
              </button>
            </div>

            <DefaultHomeCards
              plan={plan}
              entries={entries}
              homeLayout={deckCards}
              excludeCardIds={COVERED_CARDS}
              onOpenJourney={onOpenJourney}
              onOpenToolkit={onOpenToolkit}
              onOpenSos={onOpenSos}
              onOpenCustomize={onOpenCustomize}
              onOpenPace={onOpenPace}
              onOpenLogSheet={onOpenLogSheet}
              onPledge={onPledge}
            />
          </div>
        )}
      </div>
    </div>
  );
};
