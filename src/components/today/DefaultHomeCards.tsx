import React, { useState, useEffect, useRef } from 'react';
import { UserPlan, Entry, HomeLayoutItem, HomeCardId } from '../../types';
import {
  calculateStats,
  calculateRoundStatus,
  calculateSmokeFreeDays,
} from '../../domain/calculations';
import { MILESTONES } from '../../content/milestones';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Sound } from '../../data/sound';
import { PaceMeter } from './PaceMeter';
import { IdentityCard } from './IdentityCard';

interface DefaultHomeCardsProps {
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
  /** Cards already represented by the home hero, so they are not shown twice. */
  excludeCardIds?: HomeCardId[];
}

const cardBase = 'home-deck-card p-5 transition-all select-none';

/**
 * Renders the home widget grid in the user's saved order. Cards are real widgets:
 * each one is a single idea you can read in a glance and act on with one tap.
 */
export const DefaultHomeCards: React.FC<DefaultHomeCardsProps> = ({
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
  excludeCardIds = [],
}) => {
  const [now, setNow] = useState(() => Date.now());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = calculateStats(entries, plan, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const streak = stats.currentStreak;
  const round = calculateRoundStatus(streak.totalHours, smokeFree.completedSmokeFreeDays, entries, now);

  const nextMilestone = MILESTONES.find((m) => m.hours > streak.totalHours) || MILESTONES[MILESTONES.length - 1];
  const hoursUntilMilestone = Math.max(0, nextMilestone.hours - streak.totalHours);
  const daysUntilMilestone = Math.ceil(hoursUntilMilestone / 24);

  const prevHours = MILESTONES.slice().reverse().find((m) => m.hours <= streak.totalHours)?.hours || 0;
  const milestoneSpan = Math.max(1, nextMilestone.hours - prevHours);
  const milestoneProgress = Math.min(1, Math.max(0, (streak.totalHours - prevHours) / milestoneSpan));
  const filledDots = Math.min(10, Math.floor(milestoneProgress * 10));

  const startLongPress = () => {
    longPressTimerRef.current = setTimeout(() => {
      Sound.doubleTick();
      onOpenCustomize();
    }, 700);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const longPressProps = {
    onTouchStart: startLongPress,
    onTouchEnd: endLongPress,
    onMouseDown: startLongPress,
    onMouseUp: endLongPress,
    onMouseLeave: endLongPress,
  };

  const currencySymbol = plan.currency || '৳';
  const visibleCards = homeLayout.filter(
    (item) => item.visible && !excludeCardIds.includes(item.cardId)
  );

  const renderCard = (item: HomeLayoutItem) => {
    switch (item.cardId) {
      /* 1. Live smoke-free timer */
      case 'TIMER':
        return (
          <section
            key={item.cardId}
            aria-label="Smoke-free streak timer"
            onClick={onOpenJourney}
            {...longPressProps}
            className={`${cardBase} cursor-pointer group`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-[#8A8A8A] text-[11px] font-semibold tracking-wider uppercase">
                Smoke-free for
              </span>
              <span className="text-[11px] font-mono text-[#8A8A8A]">{round.currentRoundName}</span>
            </div>

            <div className="my-1">
              <div className="flex items-baseline gap-2">
                <span className="font-doto font-black text-5xl sm:text-6xl tracking-tight">{streak.days}</span>
                <span className="text-xl sm:text-2xl font-bold text-[#8A8A8A] uppercase tracking-wider font-mono">
                  {streak.days === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-doto font-bold text-lg sm:text-xl tracking-wider tabular-nums">
                  {streak.formattedClock}
                </span>
                <span className="text-[11px] text-[#8A8A8A] font-mono">
                  ({streak.hours}h {streak.minutes}m {streak.seconds}s)
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#C4C4C4] dark:border-[#2A2A2A] flex items-center justify-between text-xs text-[#8A8A8A]">
              <span>{stats.totalSmokeFreeDays} total smoke-free days</span>
              <span className="group-hover:text-black dark:group-hover:text-white transition flex items-center gap-1">
                <span>Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </section>
        );

      /* 2. Rate meter — the distance between cigarettes */
      case 'PACE_METER':
        return (
          <div key={item.cardId} {...longPressProps}>
            <PaceMeter plan={plan} entries={entries} onLog={onOpenLogSheet} onOpenPace={onOpenPace} />
          </div>
        );

      /* 3. Identity */
      case 'IDENTITY':
        return (
          <div key={item.cardId} {...longPressProps}>
            <IdentityCard plan={plan} entries={entries} onPledge={onPledge} onOpenToolkit={onOpenToolkit} />
          </div>
        );

      case 'MONEY_SAVED':
        return (
          <div
            key={item.cardId}
            onClick={onOpenJourney}
            {...longPressProps}
            className={`${cardBase} cursor-pointer p-4`}
          >
            <span className="text-[11px] font-mono uppercase text-[#8A8A8A] tracking-wider block mb-1">
              Money saved
            </span>
            <div className="font-bold text-2xl sm:text-3xl tracking-tight my-1 truncate flex items-baseline gap-1">
              <span className="font-sans font-bold text-lg sm:text-xl text-[#8A8A8A]">{currencySymbol}</span>
              <span className="font-doto">{stats.moneySaved.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-[#8A8A8A] block">never burned</span>
          </div>
        );

      case 'NOT_SMOKED':
        return (
          <div
            key={item.cardId}
            onClick={onOpenJourney}
            {...longPressProps}
            className={`${cardBase} cursor-pointer p-4`}
          >
            <span className="text-[11px] font-mono uppercase text-[#8A8A8A] tracking-wider block mb-1">
              Not smoked
            </span>
            <div className="font-doto font-bold text-2xl sm:text-3xl tracking-tight my-1 truncate">
              {stats.cigarettesNotSmoked}
            </div>
            <span className="text-[10px] text-[#8A8A8A] block">cigarettes avoided</span>
          </div>
        );

      case 'NEXT_MILESTONE':
        return (
          <section
            key={item.cardId}
            onClick={onOpenJourney}
            {...longPressProps}
            className={`${cardBase} cursor-pointer group`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold flex items-center gap-1.5 truncate">
                <span>Next: {nextMilestone.title}</span>
                <span className="text-[#8A8A8A] font-normal truncate hidden sm:inline">
                  · {nextMilestone.subtitle}
                </span>
              </span>
              <span className="text-[11px] font-mono text-[#8A8A8A] shrink-0">
                {hoursUntilMilestone > 0
                  ? daysUntilMilestone > 1
                    ? `in ${daysUntilMilestone} days`
                    : `in ${Math.floor(hoursUntilMilestone)}h`
                  : 'Reached!'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 w-full my-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-xs transition-colors ${
                    i < filledDots ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] mt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{nextMilestone.source} certified</span>
              </span>
              <span className="group-hover:text-black dark:group-hover:text-white transition truncate max-w-[55%] text-right">
                {nextMilestone.message.slice(0, 48)}…
              </span>
            </div>
          </section>
        );

      case 'CRAVINGS_RESISTED':
        return (
          <div
            key={item.cardId}
            onClick={onOpenSos}
            {...longPressProps}
            className={`${cardBase} cursor-pointer flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-mono uppercase text-[#8A8A8A] block">Cravings resisted</span>
              <span className="font-doto font-bold text-2xl">{stats.cravingsResisted}</span>
            </div>
            <span className="text-xs text-[#8A8A8A]">urges held</span>
          </div>
        );

      case 'LONGEST_STREAK':
        return (
          <div key={item.cardId} onClick={onOpenJourney} {...longPressProps} className={`${cardBase} cursor-pointer`}>
            <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">
              Longest streak & total days
            </span>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-[10px] text-[#8A8A8A] block">Personal record</span>
                <span className="font-doto font-bold text-2xl">{stats.longestStreakDays} days</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8A8A8A] block">Total smoke-free</span>
                <span className="font-doto font-bold text-2xl">{stats.totalSmokeFreeDays} days</span>
              </div>
            </div>
          </div>
        );

      case 'DOT_CALENDAR':
        return (
          <div key={item.cardId} onClick={onOpenJourney} {...longPressProps} className={`${cardBase} cursor-pointer`}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono uppercase text-[#8A8A8A]">Dot calendar (last 4 weeks)</span>
              <span className="text-[10px] text-[#8A8A8A]">filled: clear · empty: slip</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 my-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const isPassed = i < Math.min(28, stats.totalSmokeFreeDays);
                return (
                  <div
                    key={i}
                    className={`h-4 rounded-xs ${
                      isPassed ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'SAVINGS_GOAL': {
        const goal = plan.savingsGoal || { name: 'Reward goal', targetAmount: 100 };
        const pct = Math.min(100, Math.round((stats.moneySaved / Math.max(1, goal.targetAmount)) * 100));
        return (
          <div key={item.cardId} onClick={onOpenToolkit} {...longPressProps} className={`${cardBase} cursor-pointer`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold">{goal.name}</span>
              <span className="font-mono text-[#8A8A8A]">{pct}% reached</span>
            </div>
            <div className="h-2 rounded-xs bg-[#C4C4C4] dark:bg-[#2A2A2A] overflow-hidden my-1">
              <div className="h-full bg-black dark:bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-[#8A8A8A]">
              {currencySymbol}
              {stats.moneySaved} of {currencySymbol}
              {goal.targetAmount}
            </span>
          </div>
        );
      }

      case 'LIFE_REGAINED': {
        const minutes = stats.cigarettesNotSmoked * 20;
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        return (
          <div key={item.cardId} onClick={onOpenJourney} {...longPressProps} className={`${cardBase} cursor-pointer`}>
            <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">
              Time of life regained (~20m / cig)
            </span>
            <span className="font-doto font-bold text-2xl">
              {days > 0 ? `${days}d ${hours % 24}h` : `${hours} hours`}
            </span>
          </div>
        );
      }

      case 'REASONS':
        return (
          <div key={item.cardId} onClick={onOpenToolkit} {...longPressProps} className={`${cardBase} cursor-pointer`}>
            <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">My reasons to quit</span>
            <p className="text-xs font-medium">
              {plan.reasons && plan.reasons.length > 0 ? plan.reasons.join(' · ') : 'Health · Freedom · Money'}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Group consecutive small cards into two-column rows; everything else is full width.
  const rows: React.ReactNode[] = [];
  let smallBuffer: HomeLayoutItem[] = [];

  const flushSmall = () => {
    if (smallBuffer.length === 0) return;
    rows.push(
      <div key={`small-${smallBuffer.map((c) => c.cardId).join('-')}`} className="grid grid-cols-2 gap-3">
        {smallBuffer.map((item) => renderCard(item))}
      </div>
    );
    smallBuffer = [];
  };

  for (const item of visibleCards) {
    const isSmall =
      item.size === 'S' && !['TIMER', 'PACE_METER', 'IDENTITY', 'NEXT_MILESTONE'].includes(item.cardId);
    if (isSmall) {
      smallBuffer.push(item);
      if (smallBuffer.length === 2) flushSmall();
    } else {
      flushSmall();
      rows.push(<React.Fragment key={`full-${item.cardId}`}>{renderCard(item)}</React.Fragment>);
    }
  }
  flushSmall();

  return <div className="w-full space-y-3">{rows}</div>;
};
