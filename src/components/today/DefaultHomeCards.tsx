import React, { useState, useEffect, useRef } from 'react';
import { UserPlan, Entry, HomeLayoutItem } from '../../types';
import { calculateStats, RoundStatus, calculateRoundStatus, calculateSmokeFreeDays, calculateCurrentStreak } from '../../domain/calculations';
import { MILESTONES } from '../../content/milestones';
import { Timer, ArrowRight, ShieldCheck, Heart, Sparkles, TrendingUp, Calendar, Trophy, Pocket, Clock } from 'lucide-react';
import { Sound } from '../../data/sound';

interface DefaultHomeCardsProps {
  plan: UserPlan;
  entries: Entry[];
  homeLayout: HomeLayoutItem[];
  onOpenJourney: () => void;
  onOpenToolkit: () => void;
  onOpenSos: () => void;
  onOpenCustomize: () => void;
}

export const DefaultHomeCards: React.FC<DefaultHomeCardsProps> = ({
  plan,
  entries,
  homeLayout,
  onOpenJourney,
  onOpenToolkit,
  onOpenSos,
  onOpenCustomize,
}) => {
  const [now, setNow] = useState(Date.now());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer live every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = calculateStats(entries, plan, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const streak = stats.currentStreak;
  const round = calculateRoundStatus(streak.totalHours, smokeFree.completedSmokeFreeDays, entries, now);

  // Find next milestone from MILESTONES
  const nextMilestone = MILESTONES.find((m) => m.hours > streak.totalHours) || MILESTONES[MILESTONES.length - 1];
  const hoursUntilMilestone = Math.max(0, nextMilestone.hours - streak.totalHours);
  const daysUntilMilestone = Math.ceil(hoursUntilMilestone / 24);

  // Dot progress calculation for next milestone (10 dots)
  const prevHours = MILESTONES.slice().reverse().find((m) => m.hours <= streak.totalHours)?.hours || 0;
  const milestoneSpan = Math.max(1, nextMilestone.hours - prevHours);
  const milestoneProgress = Math.min(1, Math.max(0, (streak.totalHours - prevHours) / milestoneSpan));
  const filledDots = Math.min(10, Math.floor(milestoneProgress * 10));

  // Long press shortcut to open customize
  const handleCardTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      Sound.doubleTick();
      onOpenCustomize();
    }, 700);
  };

  const handleCardTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const visibleCards = homeLayout.filter((item) => item.visible);
  const visibleCardIds = new Set(visibleCards.map((c) => c.cardId));

  // Determine which cards to render
  const showTimer = visibleCardIds.has('TIMER');
  const showMoney = visibleCardIds.has('MONEY_SAVED');
  const showNotSmoked = visibleCardIds.has('NOT_SMOKED');
  const showMilestone = visibleCardIds.has('NEXT_MILESTONE');

  // Format currency
  const currencySymbol = plan.currency || '৳';
  const formattedMoney = `${currencySymbol}${stats.moneySaved.toLocaleString()}`;

  // Card container base: Nothing OS rounded corners, 1dp border, pure black background
  const cardBase =
    'bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-3xl p-5 transition-all select-none hover:border-black dark:hover:border-white shadow-xs';

  return (
    <div className="w-full space-y-3">
      {/* 1. Hero Timer Card */}
      {showTimer && (
        <section
          aria-label="Smoke-free streak timer"
          onClick={onOpenJourney}
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          onMouseDown={handleCardTouchStart}
          onMouseUp={handleCardTouchEnd}
          className={`${cardBase} cursor-pointer group`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-[#8A8A8A] text-xs font-semibold tracking-wider uppercase">
              Smoke-free for
            </span>
            <span className="text-[11px] font-mono text-[#8A8A8A]">
              {round.currentRoundName}
            </span>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="font-doto font-black text-5xl sm:text-6xl text-black dark:text-white tracking-tight">
                {streak.days}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#8A8A8A] uppercase tracking-wider font-mono">
                {streak.days === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="font-doto font-bold text-lg sm:text-xl text-black dark:text-white tracking-wider tabular-nums">
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
              <span>View progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </section>
      )}

      {/* 2. Two Stat Cards Side by Side */}
      {(showMoney || showNotSmoked) && (
        <div className="grid grid-cols-2 gap-3">
          {/* Card A: Money Saved */}
          {showMoney && (
            <div
              onClick={onOpenJourney}
              onTouchStart={handleCardTouchStart}
              onTouchEnd={handleCardTouchEnd}
              onMouseDown={handleCardTouchStart}
              onMouseUp={handleCardTouchEnd}
              className={`${cardBase} cursor-pointer p-4`}
            >
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] tracking-wider block mb-1">
                Money saved
              </span>
              <div className="font-bold text-2xl sm:text-3xl text-black dark:text-white tracking-tight my-1 truncate flex items-baseline gap-1">
                <span className="font-sans font-bold text-lg sm:text-xl text-[#8A8A8A]">{currencySymbol}</span>
                <span className="font-doto">{stats.moneySaved.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-[#8A8A8A] block">
                never burned
              </span>
            </div>
          )}

          {/* Card B: Cigarettes Not Smoked */}
          {showNotSmoked && (
            <div
              onClick={onOpenJourney}
              onTouchStart={handleCardTouchStart}
              onTouchEnd={handleCardTouchEnd}
              onMouseDown={handleCardTouchStart}
              onMouseUp={handleCardTouchEnd}
              className={`${cardBase} cursor-pointer p-4`}
            >
              <span className="text-[11px] font-mono uppercase text-[#8A8A8A] tracking-wider block mb-1">
                Not smoked
              </span>
              <div className="font-doto font-bold text-2xl sm:text-3xl text-black dark:text-white tracking-tight my-1 truncate">
                {stats.cigarettesNotSmoked}
              </div>
              <span className="text-[10px] text-[#8A8A8A] block">
                cigarettes avoided
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Next Health Milestone with Dot Progress Bar */}
      {showMilestone && (
        <section
          onClick={onOpenJourney}
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          onMouseDown={handleCardTouchStart}
          onMouseUp={handleCardTouchEnd}
          className={`${cardBase} cursor-pointer group`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-black dark:text-white flex items-center gap-1.5 truncate">
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

          {/* Dot Progress Bar (10 dots) */}
          <div className="flex items-center gap-1.5 w-full my-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-xs transition-colors ${
                  i < filledDots
                    ? 'bg-black dark:bg-white'
                    : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] mt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-black dark:text-white" />
              <span>{nextMilestone.source} certified</span>
            </span>
            <span className="group-hover:text-black dark:group-hover:text-white transition">
              {nextMilestone.message.slice(0, 48)}…
            </span>
          </div>
        </section>
      )}

      {/* Render any optional cards configured in Customize Home */}
      {visibleCards
        .filter((c) => !['TIMER', 'MONEY_SAVED', 'NOT_SMOKED', 'NEXT_MILESTONE'].includes(c.cardId))
        .map((item) => {
          if (item.cardId === 'CRAVINGS_RESISTED') {
            return (
              <div
                key={item.cardId}
                onClick={onOpenSos}
                className={`${cardBase} cursor-pointer flex items-center justify-between`}
              >
                <div>
                  <span className="text-xs font-mono uppercase text-[#8A8A8A] block">
                    Cravings resisted
                  </span>
                  <span className="font-doto font-bold text-2xl text-black dark:text-white">
                    {stats.cravingsResisted}
                  </span>
                </div>
                <span className="text-xs text-[#8A8A8A]">That's {stats.cravingsResisted} cravings beaten</span>
              </div>
            );
          }

          if (item.cardId === 'LONGEST_STREAK') {
            return (
              <div key={item.cardId} onClick={onOpenJourney} className={`${cardBase} cursor-pointer`}>
                <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">
                  Longest streak & Total Days
                </span>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-[10px] text-[#8A8A8A] block">Personal record</span>
                    <span className="font-doto font-bold text-2xl text-black dark:text-white">
                      {stats.longestStreakDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A8A8A] block">Total smoke-free</span>
                    <span className="font-doto font-bold text-2xl text-black dark:text-white">
                      {stats.totalSmokeFreeDays} days
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (item.cardId === 'DOT_CALENDAR') {
            return (
              <div key={item.cardId} onClick={onOpenJourney} className={`${cardBase} cursor-pointer`}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono uppercase text-[#8A8A8A]">Dot calendar (last 4 weeks)</span>
                  <span className="text-[10px] text-[#8A8A8A]">White: clear · Red: slip</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 my-1">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const isPassed = i < Math.min(28, stats.totalSmokeFreeDays);
                    return (
                      <div
                        key={i}
                        className={`h-4 rounded-xs ${
                          isPassed
                            ? 'bg-black dark:bg-white'
                            : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          }

          if (item.cardId === 'SAVINGS_GOAL') {
            const goal = plan.savingsGoal || { name: 'Reward goal', targetAmount: 100 };
            const pct = Math.min(100, Math.round((stats.moneySaved / Math.max(1, goal.targetAmount)) * 100));
            return (
              <div key={item.cardId} onClick={onOpenToolkit} className={`${cardBase} cursor-pointer`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-black dark:text-white">{goal.name}</span>
                  <span className="font-mono text-[#8A8A8A]">{pct}% reached</span>
                </div>
                <div className="h-2 rounded-xs bg-[#C4C4C4] dark:bg-[#2A2A2A] overflow-hidden my-1">
                  <div className="h-full bg-black dark:bg-white transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-[#8A8A8A]">
                  {currencySymbol}{stats.moneySaved} of {currencySymbol}{goal.targetAmount}
                </span>
              </div>
            );
          }

          if (item.cardId === 'LIFE_REGAINED') {
            const minutes = stats.cigarettesNotSmoked * 20;
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            return (
              <div key={item.cardId} onClick={onOpenJourney} className={`${cardBase} cursor-pointer`}>
                <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">
                  Time of life regained (~20m / cig)
                </span>
                <span className="font-doto font-bold text-2xl text-black dark:text-white">
                  {days > 0 ? `${days}d ${hours % 24}h` : `${hours} hours`}
                </span>
              </div>
            );
          }

          if (item.cardId === 'REASONS') {
            return (
              <div key={item.cardId} onClick={onOpenToolkit} className={`${cardBase} cursor-pointer`}>
                <span className="text-xs font-mono uppercase text-[#8A8A8A] block mb-1">
                  My reasons to quit
                </span>
                <p className="text-xs font-medium text-black dark:text-white">
                  {plan.reasons && plan.reasons.length > 0 ? plan.reasons.join(' · ') : 'Health · Freedom · Money'}
                </p>
              </div>
            );
          }

          return null;
        })}
    </div>
  );
};
