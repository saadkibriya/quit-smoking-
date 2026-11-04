import React, { useState, useEffect } from 'react';
import { UserPlan, Entry } from '../../types';
import {
  calculateCurrentStreak,
  calculateRoundStatus,
  calculateCutDownLimitToday,
  calculateSmokeFreeDays,
  toLocalDateString,
} from '../../domain/calculations';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface HeroCardProps {
  plan: UserPlan;
  entries: Entry[];
  onOpenMilestones?: () => void;
  onOpenPlan?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ plan, entries, onOpenMilestones, onOpenPlan }) => {
  const [now, setNow] = useState(Date.now());

  // Update timer every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const round = calculateRoundStatus(streak.streakHours, smokeFree.completedSmokeFreeDays, entries, now);

  const quitStartMs = new Date(plan.quitStartDate).getTime();
  const isBeforeQuitDay = now < quitStartMs && plan.mode === 'QUIT';

  // 1. BEFORE QUIT DAY PREP HERO
  if (isBeforeQuitDay) {
    const hoursLeft = Math.max(0, Math.round((quitStartMs - now) / (1000 * 3600)));
    const daysLeft = Math.ceil(hoursLeft / 24);

    return (
      <section
        aria-label="Quit Day Preparation"
        className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-5 shadow-xs transition-colors"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#5E5E5E] dark:text-[#A6A6A6] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Preparation Phase
          </span>
          <button
            onClick={onOpenPlan}
            className="text-xs font-semibold text-black dark:text-white underline underline-offset-2 hover:opacity-80"
          >
            Adjust date
          </button>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">
          Quit day in {daysLeft} day{daysLeft === 1 ? '' : 's'}
        </h2>
        <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mt-1 mb-4">
          Starts {new Date(plan.quitStartDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Logging cigarettes still works.
        </p>

        <div className="space-y-2 text-xs">
          <p className="font-bold text-black dark:text-white mb-1">Pre-quit checklist:</p>
          {[
            'Remove cigarettes, ashtrays, and lighters from car and home',
            'Tell a friend or your support person about your quit day',
            'Plan your swap for your top trigger (' + (plan.triggers[0] || 'morning coffee') + ')',
            'Ask a doctor or pharmacist about NRT patches or lozenges',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[#5E5E5E] dark:text-[#A6A6A6]">
              <span className="w-4 h-4 rounded-xs border border-black dark:border-white shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. CUT-DOWN MODE HERO
  if (plan.mode === 'CUT_DOWN') {
    const todayStr = toLocalDateString(now);
    const todayCigs = entries.filter(
      (e) => e.type === 'CIGARETTE' && toLocalDateString(e.timestamp) === todayStr
    ).length;

    const cutDown = calculateCutDownLimitToday(
      plan.cutDownSchedule || {
        startDate: toLocalDateString(quitStartMs),
        planWeeks: 2,
        initialUsual: plan.usualPerDay,
      },
      now
    );

    const cigEntries = entries
      .filter((e) => e.type === 'CIGARETTE')
      .sort((a, b) => b.timestamp - a.timestamp);
    const lastCig = cigEntries[0];
    const minutesSinceLast = lastCig ? Math.floor((now - lastCig.timestamp) / 60000) : null;

    // Stretch target calculation (e.g. wait 2 hours between cigarettes)
    const stretchIntervalMinutes = Math.round((16 * 60) / Math.max(1, cutDown.limitToday));
    const nextStretchTime = lastCig ? new Date(lastCig.timestamp + stretchIntervalMinutes * 60000) : null;
    const isOverLimit = todayCigs > cutDown.limitToday;

    return (
      <section
        aria-label="Cut Down Progress"
        className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-5 shadow-xs transition-colors"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold tracking-wider uppercase text-[#5E5E5E] dark:text-[#A6A6A6]">
            Cut-Down Mode · Week {cutDown.weekNumber}
          </span>
          <span className="text-xs font-semibold text-black dark:text-white">
            Target: {cutDown.limitToday}/day ({cutDown.percentReduced}% cut)
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-black dark:text-white tabular-nums">
              {todayCigs}
            </span>
            <span className="text-xl font-bold text-[#5E5E5E] dark:text-[#A6A6A6]">
              of {cutDown.limitToday} today
            </span>
          </div>
          <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">
            {minutesSinceLast !== null
              ? `Last one ${Math.floor(minutesSinceLast / 60)}h ${minutesSinceLast % 60}m ago`
              : 'None logged yet today'}
          </p>
        </div>

        {nextStretchTime && (
          <div className="mt-3 p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-black dark:text-white block">Stretch win:</span>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                Try to wait until{' '}
                {nextStretchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-black dark:text-white">
              +{stretchIntervalMinutes}m interval
            </span>
          </div>
        )}

        {isOverLimit && (
          <p className="text-xs font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-3">
            Noted. Tomorrow is a fresh day. You're still actively reducing harm.
          </p>
        )}
      </section>
    );
  }

  // 3. TRACK ONLY MODE HERO
  if (plan.mode === 'TRACK') {
    const todayStr = toLocalDateString(now);
    const yesterdayStr = toLocalDateString(now - 86400000);

    const todayCount = entries.filter(
      (e) => e.type === 'CIGARETTE' && toLocalDateString(e.timestamp) === todayStr
    ).length;
    const yesterdayCount = entries.filter(
      (e) => e.type === 'CIGARETTE' && toLocalDateString(e.timestamp) === yesterdayStr
    ).length;

    return (
      <section
        aria-label="Awareness Tracking"
        className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-5 shadow-xs transition-colors"
      >
        <span className="text-xs font-bold tracking-wider uppercase text-[#5E5E5E] dark:text-[#A6A6A6] block mb-2">
          Tracking Mode · Building Awareness
        </span>

        <div className="flex items-baseline gap-3 my-2">
          <span className="text-5xl font-extrabold tracking-tight text-black dark:text-white tabular-nums">
            {todayCount}
          </span>
          <span className="text-sm font-semibold text-[#5E5E5E] dark:text-[#A6A6A6]">
            today · {yesterdayCount} yesterday
          </span>
        </div>

        <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mt-2 mb-4">
          Self-monitoring changes habits automatically. Ready to set a quit date?
        </p>

        <button
          onClick={onOpenPlan}
          className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs tracking-wide flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>Pick a Quit Day</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  // 4. MAIN QUIT MODE HERO (Sprint Ladder + Live Timer)
  const formatTimeParts = () => {
    const { days, hours, minutes, seconds } = streak;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Milestone block progress calculation (0 to 10 blocks)
  const milestoneTargetHours = round.nextMilestoneHours;
  const currentStreakHours = streak.streakHours;
  const progressRatio = Math.min(1, currentStreakHours / Math.max(1, milestoneTargetHours));
  const totalBlocks = 10;
  const filledBlocks = Math.min(totalBlocks, Math.floor(progressRatio * totalBlocks));

  return (
    <section
      aria-label="Quit Progress Hero"
      className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-5 shadow-xs transition-colors"
    >
      {/* Top row: Round and Days */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold tracking-wider uppercase text-[#5E5E5E] dark:text-[#A6A6A6]">
          {round.currentRoundName} · Day {Math.max(1, smokeFree.completedSmokeFreeDays + 1)} of {round.roundTargetDays}
        </span>
        <span className="text-xs font-semibold text-black dark:text-white">
          {smokeFree.completedSmokeFreeDays} smoke-free days total
        </span>
      </div>

      {/* Hero Timer */}
      <div className="my-2">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black dark:text-white tabular-nums select-all">
          {formatTimeParts()}
        </h2>
        <p className="text-xs font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">
          smoke-free streak
        </p>
      </div>

      {/* Round Extension Notification if almost there */}
      {round.isAlmostThere && (
        <div className="mt-3 p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] border border-black dark:border-white text-xs">
          <p className="font-bold text-black dark:text-white">Almost there!</p>
          <p className="text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            Target days reached. Complete {round.daysNeededToComplete} more smoke-free day{round.daysNeededToComplete === 1 ? '' : 's'} to finish {round.currentRoundName}.
          </p>
        </div>
      )}

      {/* Next Milestone Ladder Box */}
      <div
        onClick={onOpenMilestones}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenMilestones?.()}
        className="mt-4 pt-3.5 border-t border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer group"
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-black dark:text-white flex items-center gap-1.5">
            <span>Next: {round.nextMilestoneTitle}</span>
            <span className="text-[#5E5E5E] dark:text-[#A6A6A6] font-normal hidden sm:inline">
              · {round.nextMilestoneWhy}
            </span>
          </span>
          <span className="text-[11px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6] group-hover:text-black dark:group-hover:text-white transition-colors">
            {round.hoursUntilNextMilestone > 0
              ? `in ${Math.floor(round.hoursUntilNextMilestone)}h ${Math.round((round.hoursUntilNextMilestone % 1) * 60)}m`
              : 'Reached!'}
          </span>
        </div>

        {/* Milestone block progress */}
        <div className="flex items-center gap-1 w-full h-2">
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-xs transition-colors ${
                i < filledBlocks
                  ? 'bg-black dark:bg-white'
                  : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
