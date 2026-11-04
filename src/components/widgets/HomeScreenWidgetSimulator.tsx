import React, { useState } from 'react';
import { UserPlan, Entry } from '../../types';
import { Sound } from '../../data/sound';
import {
  calculateCurrentStreak,
  calculateAvoidedCigarettes,
  calculateMoneyKept,
  calculateLifeRegained,
  calculateSmokeFreeDays,
  calculateRoundStatus,
  calculatePeriodComparison,
} from '../../domain/calculations';
import { getNormalGuideForDay } from '../../content/withdrawalGuide';
import {
  X,
  Timer,
  Plus,
  ShieldAlert,
  Coins,
  Milestone,
  CheckSquare,
  BarChart2,
  Activity,
  Sprout,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface HomeScreenWidgetSimulatorProps {
  plan: UserPlan;
  entries: Entry[];
  currentTheme: 'DAY' | 'NIGHT';
  onClose: () => void;
  onQuickLog: () => void;
  onDeepLink: (destination: 'today' | 'journey' | 'sos') => void;
}

export const HomeScreenWidgetSimulator: React.FC<HomeScreenWidgetSimulatorProps> = ({
  plan,
  entries,
  currentTheme,
  onClose,
  onQuickLog,
  onDeepLink,
}) => {
  const [quickLogFeedback, setQuickLogFeedback] = useState<string | null>(null);

  const now = Date.now();
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const avoided = calculateAvoidedCigarettes(entries, plan, now);
  const money = calculateMoneyKept(avoided, plan);
  const round = calculateRoundStatus(streak.streakHours, smokeFree.completedSmokeFreeDays, entries, now);
  const weekComp = calculatePeriodComparison(entries, 'WEEK', plan);
  const guide = getNormalGuideForDay(smokeFree.completedSmokeFreeDays);

  const handleSimulatedQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.tick();
    onQuickLog();
    setQuickLogFeedback('Logged · Undo (10s)');
    setTimeout(() => setQuickLogFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-5 sm:p-6 shadow-2xl text-black dark:text-white my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#C4C4C4] dark:border-[#3D3D3D] mb-4">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              Android Home-Screen Widgets (Glance)
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Live interactive preview of Unlit's 8 Glance home-screen widgets
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close widget simulator"
            className="w-9 h-9 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-center hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Pixel Home Screen Canvas */}
        <div className="p-4 rounded-3xl bg-[#E2E2E2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
            <span>Google Pixel Launcher</span>
            <span>Android 15 · Glance M3</span>
          </div>

          {/* Grid of Glance Widgets */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Smoke-free timer widget (Wide) */}
            <div
              onClick={() => onDeepLink('today')}
              className="col-span-2 p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer hover:border-black dark:hover:border-white transition"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Smoke-Free Timer
                </span>
                <span>{round.currentRoundName}</span>
              </div>
              <div className="text-2xl font-black tabular-nums tracking-tight my-0.5">
                {streak.days}d {streak.hours}h {streak.minutes}m
              </div>
              <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                {smokeFree.completedSmokeFreeDays} smoke-free days total
              </p>
            </div>

            {/* 2. Quick Log Widget (Small) */}
            <div className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
                Quick Log
              </span>
              <button
                onClick={handleSimulatedQuickLog}
                className="w-full h-10 my-1 rounded-xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Log</span>
              </button>
              <span className="text-[10px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6] text-center">
                {quickLogFeedback || `${smokeFree.todayCigarettesCount} today`}
              </span>
            </div>

            {/* 3. Craving SOS Widget (Small) */}
            <div
              onClick={() => onDeepLink('sos')}
              className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] flex flex-col justify-between cursor-pointer hover:border-black dark:hover:border-white transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
                Craving SOS
              </span>
              <div className="w-full h-10 my-1 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Urge Wave</span>
              </div>
              <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6] text-center">
                Instant distraction
              </span>
            </div>

            {/* 4. Money Kept (Small) */}
            <div
              onClick={() => onDeepLink('journey')}
              className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Money Kept
              </span>
              <div className="text-xl font-extrabold tabular-nums my-1">
                {plan.currency}{money}
              </div>
              <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                never burned
              </span>
            </div>

            {/* 5. Next Milestone (Wide) */}
            <div
              onClick={() => onDeepLink('journey')}
              className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] flex items-center gap-1">
                <Milestone className="w-3 h-3" />
                Next Milestone
              </span>
              <div className="text-sm font-bold truncate my-1">
                {round.nextMilestoneTitle}
              </div>
              <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                {round.hoursUntilNextMilestone > 0
                  ? `in ${Math.round(round.hoursUntilNextMilestone)}h`
                  : 'Reached!'}
              </span>
            </div>

            {/* 6. Round Progress Widget (Wide) */}
            <div
              onClick={() => onDeepLink('journey')}
              className="col-span-2 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] mb-1">
                <span>{round.currentRoundName} Progress</span>
                <span>Day {Math.min(28, smokeFree.completedSmokeFreeDays + 1)} of 28</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-xs ${
                      i < smokeFree.completedSmokeFreeDays
                        ? 'bg-black dark:bg-white'
                        : i === smokeFree.completedSmokeFreeDays
                        ? 'border border-black dark:border-white'
                        : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 7. Week vs Last Week (Wide) */}
            <div
              onClick={() => onDeepLink('journey')}
              className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
                Week vs Last
              </span>
              <span className="text-sm font-extrabold block my-0.5">
                {weekComp.cigarettes.currentValue} vs {weekComp.cigarettes.previousValue}
              </span>
              <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                {weekComp.cigarettes.percentChange !== null
                  ? `${weekComp.cigarettes.isImprovement ? '↓' : '↑'} ${weekComp.cigarettes.percentChange}%`
                  : 'New'}
              </span>
            </div>

            {/* 8. What's normal today (Wide) */}
            <div
              onClick={() => onDeepLink('today')}
              className="col-span-1 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
                What's Normal
              </span>
              <span className="text-xs font-bold line-clamp-1 my-0.5">
                {guide.whatsCommon}
              </span>
              <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6] line-clamp-1">
                {guide.whatToTellYourself}
              </span>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs">
          <p className="font-bold text-black dark:text-white mb-1">
            How to add Unlit widgets to your Android device:
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-[#5E5E5E] dark:text-[#A6A6A6] text-[11px]">
            <li>Touch and hold any empty space on your Android home screen.</li>
            <li>Tap <strong className="text-black dark:text-white">Widgets</strong>.</li>
            <li>Scroll down to <strong className="text-black dark:text-white">Unlit</strong>.</li>
            <li>Touch and hold your preferred widget, then drag it onto your screen.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
