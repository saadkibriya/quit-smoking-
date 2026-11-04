import React from 'react';
import { UserPlan, Entry } from '../../types';
import {
  calculateCurrentStreak,
  calculateAvoidedCigarettes,
  calculateMoneyKept,
  calculateLifeRegained,
  calculateSmokeFreeDays,
  calculatePeriodComparison,
  calculateRoundStatus,
  calculateToughestHours,
  calculateAverageCravingLength,
  toLocalDateString,
} from '../../domain/calculations';
import { getNormalGuideForDay } from '../../content/withdrawalGuide';
import { BODY_RECOVERY_TIMELINE } from '../../content/bodyRecovery';
import {
  Timer,
  Plus,
  ShieldAlert,
  Coins,
  Ban,
  HeartPulse,
  Milestone,
  CheckSquare,
  BarChart2,
  CalendarDays,
  Sparkles,
  Sprout,
  Activity,
  Award,
  Zap,
} from 'lucide-react';
import { Sound } from '../../data/sound';

interface WidgetRendererProps {
  type: string;
  size: 'S' | 'W' | 'L';
  plan: UserPlan;
  entries: Entry[];
  onOpenSos: () => void;
  onOpenJourney: () => void;
  onOpenToolkit: () => void;
  onQuickLog?: () => void;
  onPledge?: () => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  type,
  size,
  plan,
  entries,
  onOpenSos,
  onOpenJourney,
  onOpenToolkit,
  onQuickLog,
  onPledge,
}) => {
  const now = Date.now();
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const avoided = calculateAvoidedCigarettes(entries, plan, now);
  const money = calculateMoneyKept(avoided, plan);
  const life = calculateLifeRegained(avoided);
  const round = calculateRoundStatus(streak.streakHours, smokeFree.completedSmokeFreeDays, entries, now);
  const cravingsBeaten = entries.filter((e) => e.type === 'CRAVING_BEATEN').length;
  const avgCraving = calculateAverageCravingLength(entries);
  const guide = getNormalGuideForDay(smokeFree.completedSmokeFreeDays);

  const containerBase =
    'bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-4 transition-colors flex flex-col justify-between overflow-hidden shadow-xs hover:border-black dark:hover:border-white';

  switch (type) {
    case 'TIMER':
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              Smoke-free timer
            </span>
            <span>{round.currentRoundName}</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {streak.days}d {streak.hours}h {streak.minutes}m
            </span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              {smokeFree.completedSmokeFreeDays} days smoke-free total
            </p>
          </div>
        </div>
      );

    case 'QUICK_LOG':
      return (
        <div className={`${containerBase} min-h-[120px]`}>
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Quick Log
            </span>
            <span>{smokeFree.todayCigarettesCount} today</span>
          </div>
          <button
            onClick={() => {
              Sound.tick();
              onQuickLog?.();
            }}
            className="w-full h-11 mt-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+1 Cigarette</span>
          </button>
        </div>
      );

    case 'SOS':
      return (
        <div className={`${containerBase} min-h-[120px]`}>
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span>SOS Help</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={() => {
              Sound.tick();
              onOpenSos();
            }}
            className="w-full h-11 mt-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <span>Urge Wave</span>
          </button>
        </div>
      );

    case 'MONEY_KEPT':
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              Money Kept
            </span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {plan.currency}{money}
            </span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              never lost to cigarettes
            </p>
          </div>
        </div>
      );

    case 'CIGS_AVOIDED':
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" />
              Avoided
            </span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {Math.floor(avoided)}
            </span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              cigarettes not smoked
            </p>
          </div>
        </div>
      );

    case 'LIFE_REGAINED':
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              Life Regained (Estimate)
            </span>
            <span>~20m / cig</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {life.formatted}
            </span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              based on British & Million Women studies
            </p>
          </div>
        </div>
      );

    case 'ROUND_PROGRESS':
      const roundSquares = 28;
      const currentRoundDay = Math.min(roundSquares, smokeFree.completedSmokeFreeDays + 1);

      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[130px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider mb-2">
            <span>{round.currentRoundName} Progress</span>
            <span>Day {currentRoundDay} of 28</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 my-1">
            {Array.from({ length: roundSquares }).map((_, idx) => {
              const dayNum = idx + 1;
              const isPastSmokeFree = dayNum <= smokeFree.completedSmokeFreeDays;
              const isToday = dayNum === currentRoundDay;

              return (
                <div
                  key={idx}
                  title={`Day ${dayNum}`}
                  className={`h-4.5 rounded-xs flex items-center justify-center text-[9px] font-bold transition-colors ${
                    isPastSmokeFree
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : isToday
                      ? 'border-2 border-black dark:border-white text-black dark:text-white'
                      : 'bg-[#C4C4C4] dark:bg-[#3D3D3D] text-transparent'
                  }`}
                >
                  {isToday ? dayNum : ''}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">
            Filled = smoke-free · Thick ring = today
          </p>
        </div>
      );

    case 'WEEK_COMPARISON':
      const weekComp = calculatePeriodComparison(entries, 'WEEK', plan);
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Week vs Same Days Last Week
            </span>
            <span className="font-semibold text-black dark:text-white">
              {weekComp.cigarettes.percentChange !== null
                ? `${weekComp.cigarettes.isImprovement ? '↓' : '↑'} ${weekComp.cigarettes.percentChange}%`
                : 'New'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-extrabold text-black dark:text-white tabular-nums">
                {weekComp.cigarettes.currentValue} smoked
              </span>
              <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                vs {weekComp.cigarettes.previousValue} last week
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-black dark:text-white">
                {weekComp.smokeFreeDays.currentValue} smoke-free
              </span>
              <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                +{weekComp.moneyKept.currentValue} saved
              </p>
            </div>
          </div>
        </div>
      );

    case 'CRAVINGS_BEATEN':
      return (
        <div
          onClick={onOpenSos}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Urges Beaten
            </span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {cravingsBeaten}
            </span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              {avgCraving.formattedMinutes ? `Avg length: ${avgCraving.formattedMinutes}` : 'Tracking durations'}
            </p>
          </div>
        </div>
      );

    case 'WHAT_IS_NORMAL':
      return (
        <div
          onClick={onOpenToolkit}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span>What's Normal Today ({guide.phaseLabel})</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="my-1">
            <p className="text-xs font-semibold text-black dark:text-white line-clamp-1">
              {guide.whatsCommon}
            </p>
            <p className="text-[11px] italic text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5 line-clamp-2">
              "{guide.whatToTellYourself}"
            </p>
          </div>
        </div>
      );

    case 'MY_WHY':
      const topReason = plan.reasons[0] || 'My Health and Freedom';
      return (
        <div
          onClick={onOpenToolkit}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span>My Why</span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-black dark:text-white capitalize line-clamp-1">
              {topReason.replace(/_/g, ' ')}
            </p>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Tap to see reasons & emergency photo anchor
            </p>
          </div>
        </div>
      );

    case 'DAILY_PLEDGE':
      const todayStr = toLocalDateString(now);
      const hasPledgedToday = entries.some(
        (e) => e.type === 'PLEDGE' && toLocalDateString(e.timestamp) === todayStr
      );

      return (
        <div className={`${containerBase} min-h-[120px]`}>
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span>Daily Pledge</span>
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          {hasPledgedToday ? (
            <div className="py-2">
              <span className="text-xs font-bold text-black dark:text-white block">
                ✓ Pledged for today
              </span>
              <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                "Today I will not smoke."
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                Sound.tick();
                onPledge?.();
              }}
              className="w-full h-11 mt-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>I won't smoke today</span>
            </button>
          )}
        </div>
      );

    case 'GROWTH':
      // Plant made of blocks: 1 block per smoke-free day. Never removed!
      const totalBlocks = Math.max(1, smokeFree.completedSmokeFreeDays);
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[130px]`}
        >
          <div className="flex items-center justify-between text-[#5E5E5E] dark:text-[#A6A6A6] text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" />
              Growth ({totalBlocks} blocks)
            </span>
            <span>Never resets</span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden my-2">
            {Array.from({ length: Math.min(60, totalBlocks) }).map((_, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-xs bg-black dark:bg-white"
                title={`Smoke-free day ${i + 1}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
            One block per smoke-free day. Slips pause growth but never erase blocks.
          </p>
        </div>
      );

    default:
      return (
        <div
          onClick={onOpenJourney}
          className={`${containerBase} cursor-pointer min-h-[120px]`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
            {type}
          </span>
          <span className="text-sm font-semibold text-black dark:text-white">
            Tap to view analytics
          </span>
        </div>
      );
  }
};
