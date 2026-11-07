import React, { useState, useEffect } from 'react';
import { UserPlan, Entry } from '../../types';
import { Sound } from '../../data/sound';
import {
  calculateStats,
  calculateSmokeFreeDays,
  calculateRoundStatus,
} from '../../domain/calculations';
import { MILESTONES } from '../../content/milestones';
import {
  X,
  Wind,
  RotateCcw,
  Info,
  Smartphone,
  LayoutGrid,
  Search,
  Phone,
  MessageSquare,
  Camera,
  Flame,
  ArrowRight,
  Download,
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
  const [now, setNow] = useState(Date.now());
  const [viewMode, setViewMode] = useState<'launcher' | 'catalog'>('launcher');
  const [activeCatalogFilter, setActiveCatalogFilter] = useState<'all' | 'phase1' | 'phase2' | 'phase3'>('all');
  const [activeLauncherWidget, setActiveLauncherWidget] = useState<'w1' | 'w4' | 'w5' | 'w6' | 'w7' | 'w8' | 'w9'>('w1');
  const [w1Size, setW1Size] = useState<'4x2' | '3x2' | '2x2'>('4x2');
  const [simulatedUndoUntil, setSimulatedUndoUntil] = useState<number | null>(null);

  // Live ticking timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = calculateStats(entries || [], plan, now);
  const smokeFree = calculateSmokeFreeDays(entries || [], plan.quitStartDate, now);
  const streak = stats.currentStreak;
  const round = calculateRoundStatus(streak.totalHours, smokeFree.completedSmokeFreeDays, entries || [], now);

  const safeMilestones = MILESTONES && MILESTONES.length > 0 ? MILESTONES : [];
  const nextMilestone =
    safeMilestones.find((m) => m.hours > streak.totalHours) ||
    safeMilestones[0] || {
      title: 'First 24 Hours',
      subtitle: 'Carbon monoxide normalizes',
      hours: 24,
      source: 'WHO',
      message: 'Blood oxygen levels return to normal.',
    };

  const hoursUntilNext = Math.max(0, nextMilestone.hours - streak.totalHours);
  const daysUntilNext = Math.ceil(hoursUntilNext / 24);

  const isUndoActive = simulatedUndoUntil !== null && now < simulatedUndoUntil;
  const undoSecondsLeft = simulatedUndoUntil ? Math.max(0, Math.ceil((simulatedUndoUntil - now) / 1000)) : 0;

  const handleSimulatedSmoked = (e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.tick();
    onQuickLog();
    // 2-minute undo window per spec
    setSimulatedUndoUntil(Date.now() + 120 * 1000);
  };

  const handleSimulatedUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.doubleTick();
    setSimulatedUndoUntil(null);
  };

  // Safe currency symbol (BDT ৳ or user preference)
  const curr = plan?.currency || '৳';

  // Check if quit date is in the future
  const isFutureQuit = new Date(plan.quitStartDate).getTime() > now;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nothing OS Launcher and Home-Screen Widget Simulator"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-[#000000] border border-[#2A2A2A] rounded-3xl p-4 sm:p-6 shadow-2xl text-white my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A] mb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] animate-pulse" />
              <h3 className="text-base font-extrabold tracking-tight">
                Nothing OS Launcher & Home Screen
              </h3>
            </div>
            <p className="text-[11px] text-[#8A8A8A]">
              Live interactive preview of widgets running on Android 15 with Chronometer
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close launcher"
            className="w-9 h-9 rounded-full border border-[#2A2A2A] flex items-center justify-center hover:bg-[#141414] active:scale-95 transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* View Mode Switcher: Launcher vs Catalog */}
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex p-0.5 bg-[#141414] rounded-full border border-[#2A2A2A]">
            <button
              onClick={() => {
                Sound.tick();
                setViewMode('launcher');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'launcher'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-[#8A8A8A] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Launcher</span>
            </button>
            <button
              onClick={() => {
                Sound.tick();
                setViewMode('catalog');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'catalog'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-[#8A8A8A] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All 9 Widgets (W1–W9)</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-[#8A8A8A] hidden sm:inline">
            Active: <span className="text-white font-bold">{curr}</span>
          </span>
        </div>

        {/* ================= VIEW A: PHONE LAUNCHER ================= */}
        {viewMode === 'launcher' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Widget switcher for the launcher */}
            <div className="flex items-center justify-between bg-[#111111] p-2 rounded-2xl border border-[#222222] text-xs">
              <span className="font-mono text-[10px] text-[#8A8A8A] uppercase">Active on screen:</span>
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'w1', label: 'W1 (Main)' },
                  { id: 'w4', label: 'W4 (Compact)' },
                  { id: 'w5', label: 'W5 (Strip)' },
                  { id: 'w6', label: 'W6 (Money)' },
                  { id: 'w7', label: 'W7 (Milestone)' },
                  { id: 'w8', label: 'W8 (Calendar)' },
                  { id: 'w9', label: 'W9 (Stats)' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      Sound.tick();
                      setActiveLauncherWidget(w.id as any);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                      activeLauncherWidget === w.id
                        ? 'bg-white text-black'
                        : 'text-[#8A8A8A] hover:text-white border border-[#2A2A2A]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Nothing Phone Bezel */}
            <div className="relative rounded-[32px] p-4 bg-[#050505] border-2 border-[#333333] shadow-2xl flex flex-col justify-between min-h-[460px] select-none">
              {/* Android Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8A8A] px-2 mb-3">
                <span className="font-bold text-white">01:34</span>
                {/* Camera punch-hole */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-[#222222]" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>84%</span>
                </div>
              </div>

              {/* Nothing OS Dot Matrix Clock & Weather */}
              <div className="px-2 mb-3 flex items-start justify-between">
                <div>
                  <div className="font-doto font-bold text-3xl sm:text-4xl text-white tracking-tighter">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <span className="text-[11px] text-[#8A8A8A] font-mono">
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · 24°C Dhaka
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-xs">
                  ☁
                </div>
              </div>

              {/* ACTIVE WIDGET ON HOME SCREEN */}
              <div className="space-y-2.5 my-auto">
                {/* W1: Main Smoke-Free 4x2 */}
                {activeLauncherWidget === 'w1' && (
                  <div
                    onClick={() => onDeepLink('today')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] text-white cursor-pointer hover:border-white transition select-none shadow-lg"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-[#8A8A8A]">
                        SMOKE-FREE
                      </span>
                      <span className="text-[10px] font-mono text-[#8A8A8A]">
                        {isFutureQuit ? 'Starts soon' : round.currentRoundName}
                      </span>
                    </div>

                    <div className="my-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-doto font-black text-4xl sm:text-5xl text-white tracking-tight">
                          {streak.days}
                        </span>
                        <span className="text-sm font-bold text-[#8A8A8A] font-mono uppercase tracking-wider">
                          DAYS
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-white tracking-wider tabular-nums mt-0.5">
                        {isFutureQuit ? `Starts on ${new Date(plan.quitStartDate).toLocaleDateString()}` : streak.formattedClock}
                      </div>
                    </div>

                    {/* Bottom Row Two Buttons */}
                    <div className="mt-3 pt-3 border-t border-[#1C1C1C] flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          Sound.tick();
                          onDeepLink('sos');
                        }}
                        aria-label="Open craving help"
                        className="flex-1 h-10 px-3 rounded-2xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <Wind className="w-3.5 h-3.5 text-black" />
                        <span>Craving help</span>
                      </button>

                      {isUndoActive ? (
                        <button
                          onClick={handleSimulatedUndo}
                          className="flex-1 h-10 px-3 rounded-2xl bg-[#D71921] text-white font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo ({undoSecondsLeft}s)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleSimulatedSmoked}
                          aria-label="Log a cigarette"
                          className="flex-1 h-10 px-3 rounded-2xl bg-transparent border border-[#D71921] text-[#D71921] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#D71921]/10 active:scale-95 transition"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#D71921]" />
                          <span>I smoked</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* W4: Compact 2x2 */}
                {activeLauncherWidget === 'w4' && (
                  <div
                    onClick={() => onDeepLink('today')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] flex flex-col justify-between cursor-pointer hover:border-white transition select-none max-w-xs mx-auto w-full min-h-[140px]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A8A]">
                      <span>SMOKE-FREE</span>
                      <span>W4 · 2×2</span>
                    </div>
                    <div>
                      <div className="font-doto font-bold text-3xl text-white">
                        {streak.days} DAYS
                      </div>
                      <div className="text-xs font-mono font-bold text-[#8A8A8A] tabular-nums mt-0.5">
                        {streak.formattedClock}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        Sound.tick();
                        onDeepLink('sos');
                      }}
                      className="h-8 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1 mt-2 active:scale-95 transition"
                    >
                      <Wind className="w-3 h-3" />
                      <span>Craving help</span>
                    </button>
                  </div>
                )}

                {/* W5: Strip 4x1 */}
                {activeLauncherWidget === 'w5' && (
                  <div
                    onClick={() => onDeepLink('today')}
                    className="p-3.5 rounded-2xl bg-[#000000] border border-[#2A2A2A] flex items-center justify-between cursor-pointer hover:border-white transition select-none text-xs"
                  >
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className="font-doto font-bold text-white text-sm">
                        {streak.days}d {streak.formattedClock}
                      </span>
                      <span className="text-[#8A8A8A]">·</span>
                      <span className="text-white font-bold flex items-baseline">
                        <span className="font-sans font-bold text-xs text-[#8A8A8A] mr-0.5">{curr}</span>
                        <span>{stats.moneySaved.toLocaleString()}</span>
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        Sound.tick();
                        onDeepLink('sos');
                      }}
                      className="h-7 px-2.5 rounded-lg bg-white text-black font-bold text-[11px]"
                    >
                      Craving
                    </button>
                  </div>
                )}

                {/* W6: Money Saved 2x2 */}
                {activeLauncherWidget === 'w6' && (
                  <div
                    onClick={() => onDeepLink('journey')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] flex flex-col justify-between cursor-pointer hover:border-white transition select-none max-w-xs mx-auto w-full min-h-[140px]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A8A]">
                      <span>MONEY SAVED</span>
                      <span>W6 · 2×2</span>
                    </div>
                    <div>
                      <div className="font-bold text-3xl text-white flex items-baseline gap-1">
                        <span className="font-sans font-bold text-2xl text-[#8A8A8A]">{curr}</span>
                        <span className="font-doto">{stats.moneySaved.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-[#8A8A8A]">
                        saved since {new Date(plan.quitStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5 mt-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-xs ${
                            i < 5 ? 'bg-white' : 'bg-[#2A2A2A]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* W7: Milestone 4x2 */}
                {activeLauncherWidget === 'w7' && (
                  <div
                    onClick={() => onDeepLink('journey')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] cursor-pointer hover:border-white transition select-none"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A8A] mb-1">
                      <span>NEXT MILESTONE</span>
                      <span>W7 · 4×2</span>
                    </div>
                    <div className="flex items-center justify-between my-1">
                      <span className="font-bold text-base text-white">{nextMilestone.title}</span>
                      <span className="text-xs font-mono text-[#8A8A8A]">
                        {daysUntilNext > 1 ? `in ${daysUntilNext} days` : `in ${Math.floor(hoursUntilNext)}h`}
                      </span>
                    </div>
                    <div className="flex gap-1 h-2 my-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-xs ${i < 5 ? 'bg-white' : 'bg-[#2A2A2A]'}`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#8A8A8A]">{nextMilestone.source} certified</span>
                  </div>
                )}

                {/* W8: Dot Calendar 4x2 */}
                {activeLauncherWidget === 'w8' && (
                  <div
                    onClick={() => onDeepLink('journey')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] cursor-pointer hover:border-white transition select-none"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A8A] mb-2">
                      <span>DOT CALENDAR (LAST 4 WEEKS)</span>
                      <span>W8 · 4×2</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 my-2">
                      {Array.from({ length: 28 }).map((_, i) => {
                        const isSmokeFree = i < stats.totalSmokeFreeDays;
                        const isSlip = i === stats.totalSmokeFreeDays && stats.todaySmokeCount > 0;
                        return (
                          <div
                            key={i}
                            className={`h-4 rounded-xs ${
                              isSlip ? 'bg-[#D71921]' : isSmokeFree ? 'bg-white' : 'bg-[#222222]'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-[#8A8A8A]">{stats.totalSmokeFreeDays} smoke-free days</span>
                  </div>
                )}

                {/* W9: Stats 4x2 */}
                {activeLauncherWidget === 'w9' && (
                  <div
                    onClick={() => onDeepLink('journey')}
                    className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] cursor-pointer hover:border-white transition select-none"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8A8A] mb-2">
                      <span>UNLIT OVERVIEW</span>
                      <span>W9 · 4×2</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-xl bg-[#141414]">
                        <span className="text-[9px] text-[#8A8A8A] block">Saved</span>
                        <span className="font-bold text-sm text-white flex items-baseline justify-center">
                          <span className="font-sans text-[11px] text-[#8A8A8A] mr-0.5">{curr}</span>
                          <span>{stats.moneySaved.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-[#141414]">
                        <span className="text-[9px] text-[#8A8A8A] block">Avoided</span>
                        <span className="font-doto font-bold text-sm text-white">{stats.cigarettesNotSmoked}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-[#141414]">
                        <span className="text-[9px] text-[#8A8A8A] block">Beaten</span>
                        <span className="font-doto font-bold text-sm text-white">{stats.cravingsResisted}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-[#141414]">
                        <span className="text-[9px] text-[#8A8A8A] block">Record</span>
                        <span className="font-doto font-bold text-sm text-white">{stats.longestStreakDays}d</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* W2 & W3: 1x1 Mini Shortcuts on launcher */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* W2 Craving 1x1 */}
                  <div
                    onClick={() => {
                      Sound.tick();
                      onDeepLink('sos');
                    }}
                    className="p-3 rounded-2xl bg-[#000000] border border-[#2A2A2A] flex items-center gap-2.5 cursor-pointer hover:border-white transition select-none"
                  >
                    <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">Craving</span>
                      <span className="text-[9px] text-[#8A8A8A] font-mono">1×1</span>
                    </div>
                  </div>

                  {/* W3 Quick Log 1x1 */}
                  <div
                    onClick={isUndoActive ? handleSimulatedUndo : handleSimulatedSmoked}
                    className="p-3 rounded-2xl bg-[#000000] border border-[#2A2A2A] flex items-center gap-2.5 cursor-pointer hover:border-white transition select-none"
                  >
                    <div className="w-8 h-8 rounded-full border border-[#D71921] flex items-center justify-center shrink-0">
                      {isUndoActive ? (
                        <RotateCcw className="w-3.5 h-3.5 text-[#D71921]" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D71921]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#D71921] leading-tight">
                        {isUndoActive ? `Undo (${undoSecondsLeft}s)` : 'I smoked'}
                      </span>
                      <span className="text-[9px] text-[#8A8A8A] font-mono">1×1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Pill Search Bar */}
              <div className="my-2.5 px-3 py-2 rounded-full bg-[#181818] border border-[#262626] flex items-center justify-between text-xs text-[#8A8A8A]">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#8A8A8A]" />
                  <span>Search apps, web & contacts</span>
                </div>
                <span className="text-[10px] font-mono">🎙</span>
              </div>

              {/* Phone Home Dock */}
              <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-around">
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8A8A8A]">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8A8A8A]">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                {/* Unlit App Icon (Tapping launches App!) */}
                <div
                  onClick={() => {
                    Sound.tick();
                    onClose();
                  }}
                  title="Launch Unlit App"
                  className="w-11 h-11 rounded-2xl bg-white text-black flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <div className="flex items-end gap-0.5 h-4 w-4" aria-hidden="true">
                    <span className="w-1 h-2 bg-black rounded-xs" />
                    <span className="w-1 h-3 bg-black rounded-xs" />
                    <span className="w-1 h-4 bg-black rounded-xs" />
                  </div>
                  <span className="text-[8px] font-bold font-mono">UNLIT</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8A8A8A]">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW B: WIDGET CATALOG (W1-W9) ================= */}
        {viewMode === 'catalog' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Catalog Filter */}
            <div className="flex gap-1 shrink-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'phase1', label: 'Phase 1 (W1–W3)' },
                { id: 'phase2', label: 'Phase 2 (W4–W6)' },
                { id: 'phase3', label: 'Phase 3 (W7–W9)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCatalogFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    activeCatalogFilter === tab.id
                      ? 'bg-white text-black'
                      : 'bg-[#141414] text-[#8A8A8A] hover:text-white border border-[#2A2A2A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* W1 Detailed */}
            <div className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">W1 — Smoke-Free (Main) 4×2</span>
                <span className="text-[10px] font-mono text-[#8A8A8A]">Chronometer formula: elapsedMs - days*86400000</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-doto font-black text-4xl text-white">{streak.days}</span>
                <span className="text-sm font-bold text-[#8A8A8A] font-mono">DAYS</span>
                <span className="font-mono text-xs text-white ml-2">{streak.formattedClock}</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A]">
                Always ticks live via Android Chronometer layout. Resizable down to 2×2.
              </p>
            </div>

            {/* W2 & W3 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-3xl bg-[#000000] border border-[#2A2A2A] text-center">
                <span className="text-xs font-bold block mb-1">W2 — Craving (1×1)</span>
                <span className="text-[10px] text-[#8A8A8A] block">1-tap opens Craving Help screen directly into breathing.</span>
              </div>
              <div className="p-3.5 rounded-3xl bg-[#000000] border border-[#2A2A2A] text-center">
                <span className="text-xs font-bold text-[#D71921] block mb-1">W3 — Quick Log (1×1)</span>
                <span className="text-[10px] text-[#8A8A8A] block">1-tap logs cigarette, flips to Undo for 2 minutes.</span>
              </div>
            </div>

            {/* W4, W5, W6 */}
            <div className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] space-y-2">
              <span className="font-bold text-xs block">W4, W5, W6 — Compact, Strip, & Money</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8A8A8A]">
                <div className="p-2.5 rounded-2xl bg-[#111111]">
                  <strong className="text-white block">W4 Compact (2×2):</strong>
                  {streak.days} DAYS · {streak.formattedClock} + tiny craving button.
                </div>
                <div className="p-2.5 rounded-2xl bg-[#111111]">
                  <strong className="text-white block">W6 Money (2×2):</strong>
                  <span className="font-sans font-bold text-white">{curr}</span>{stats.moneySaved.toLocaleString()} saved since quit day.
                </div>
              </div>
            </div>

            {/* W7, W8, W9 */}
            <div className="p-4 rounded-3xl bg-[#000000] border border-[#2A2A2A] space-y-2">
              <span className="font-bold text-xs block">W7, W8, W9 — Milestones, Calendar & Stats</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#8A8A8A]">
                <div className="p-2.5 rounded-2xl bg-[#111111]">
                  <strong className="text-white block">W7 Milestone (4×2)</strong>
                  Next: {nextMilestone.title} ({nextMilestone.source})
                </div>
                <div className="p-2.5 rounded-2xl bg-[#111111]">
                  <strong className="text-white block">W8 Dot Calendar</strong>
                  28 dot matrix (white = clear, red = slip)
                </div>
                <div className="p-2.5 rounded-2xl bg-[#111111]">
                  <strong className="text-white block">W9 Stats</strong>
                  Money, avoided count, cravings beaten, record
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Instructions */}
        <div className="pt-3 border-t border-[#2A2A2A] mt-3 flex items-center justify-between text-xs text-[#8A8A8A] shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Install on phone via browser menu → <strong className="text-white">Add to Home screen</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs active:scale-95 transition"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
};
