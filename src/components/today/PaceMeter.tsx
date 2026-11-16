import React, { useEffect, useState } from 'react';
import { UserPlan, Entry } from '../../types';
import {
  calculatePaceProfile,
  formatGapMinutes,
  formatClockTime,
  formatSignedMinutes,
  getPaceHeadline,
  getPaceAdvice,
} from '../../domain/pacing';
import { Sound } from '../../data/sound';
import { Plus, ArrowUpRight, Wind, Timer } from 'lucide-react';

interface PaceMeterProps {
  plan: UserPlan;
  entries: Entry[];
  onLog?: () => void;
  onOpenPace?: () => void;
  showActions?: boolean;
}

/**
 * The Rate Meter.
 *
 * A single glance answers: how long since my last cigarette, and is the next one
 * coming earlier or later than my own personal rhythm? The arc's target tick is
 * the gap we are trying to beat; passing it is a stretch win.
 */
export const PaceMeter: React.FC<PaceMeterProps> = ({
  plan,
  entries,
  onLog,
  onOpenPace,
  showActions = true,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const profile = calculatePaceProfile(entries, plan, now);

  // Geometry: a 180° arc. Scale runs to 150% of target so the target tick sits
  // at two thirds, leaving visible room to overshoot.
  const R = 78;
  const CX = 100;
  const CY = 100;
  const maxScale = Math.max(30, profile.targetMinutes * 1.5);
  const arcLength = Math.PI * R;
  const progress = Math.min(1, Math.max(0, profile.currentGapMinutes / maxScale));
  const baselineT = Math.min(1, profile.baselineMinutes / maxScale);
  const targetT = Math.min(1, profile.targetMinutes / maxScale);

  const pointAt = (t: number, radius: number = R) => ({
    x: CX - radius * Math.cos(Math.PI * t),
    y: CY - radius * Math.sin(Math.PI * t),
  });

  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  const baselineTick = pointAt(baselineT);
  const targetTick = pointAt(targetT);
  const targetInner = pointAt(targetT, R - 14);

  const isEarly = profile.status === 'EARLY';
  const isStretched = profile.status === 'STRETCHED';
  const accent = isEarly ? '#D71921' : 'currentColor';

  const statusChip = isStretched
    ? 'bg-black text-white dark:bg-white dark:text-black border border-transparent'
    : isEarly
    ? 'border border-[#D71921] text-[#D71921]'
    : 'border border-[#C4C4C4] dark:border-[#3D3D3D] text-[#5E5E5E] dark:text-[#A6A6A6]';

  return (
    <section
      aria-label="Rate meter: time since your last cigarette compared with your usual gap"
      className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-3xl p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          Rate meter
        </span>
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusChip}`}
        >
          {isEarly ? 'early' : isStretched ? 'stretched' : profile.status === 'CALIBRATING' ? 'learning' : 'on pace'}
        </span>
      </div>

      {/* Gauge */}
      <div className="relative w-full max-w-[260px] mx-auto mt-3">
        <svg
          viewBox="0 0 200 112"
          className="w-full h-auto text-black dark:text-white"
          role="img"
          aria-label={`Gap ${formatGapMinutes(profile.currentGapMinutes)} against a target of ${formatGapMinutes(
            profile.targetMinutes
          )}`}
        >
          {/* Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="#C4C4C4"
            className="dark:stroke-[#2A2A2A]"
            strokeWidth={11}
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d={arcPath}
            fill="none"
            stroke={accent}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={`${progress * arcLength} ${arcLength}`}
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          {/* Baseline tick: your personal usual */}
          <line
            x1={pointAt(baselineT, R - 10).x}
            y1={pointAt(baselineT, R - 10).y}
            x2={baselineTick.x}
            y2={baselineTick.y}
            stroke="#8A8A8A"
            strokeWidth={2}
          />
          {/* Target tick: the gap to beat */}
          <line
            x1={targetInner.x}
            y1={targetInner.y}
            x2={targetTick.x}
            y2={targetTick.y}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="font-doto font-black text-4xl sm:text-5xl leading-none tracking-tight">
            {formatGapMinutes(profile.currentGapMinutes)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A8A] mt-1.5">
            {profile.anchor === 'CIGARETTE' ? 'since last cigarette' : 'smoke-free'}
          </div>
        </div>
      </div>

      {/* Beat-the-target line */}
      <div className="mt-4 text-center">
        {profile.minutesUntilWindow > 0 ? (
          <p className="text-xs font-medium">
            <span className="font-bold">{profile.minutesUntilWindow}m</span>
            <span className="text-[#8A8A8A]"> until your usual window opens ({formatClockTime(profile.nextWindowMs)})</span>
          </p>
        ) : (
          <p className="text-xs font-bold">
            Window beaten by {formatGapMinutes(Math.abs(profile.minutesUntilWindow))}
            <span className="font-normal text-[#8A8A8A]"> · hold the line</span>
          </p>
        )}
      </div>

      {/* Rhythm facts */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-[#C4C4C4] dark:divide-[#2A2A2A] border-t border-[#C4C4C4] dark:border-[#2A2A2A] pt-3 text-center">
        <div className="px-1">
          <div className="font-doto font-bold text-base leading-tight">{formatGapMinutes(profile.baselineMinutes)}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] mt-0.5">usual gap</div>
        </div>
        <div className="px-1">
          <div className="font-doto font-bold text-base leading-tight">{formatGapMinutes(profile.targetMinutes)}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] mt-0.5">target</div>
        </div>
        <div className="px-1">
          <div className="font-doto font-bold text-base leading-tight">{formatGapMinutes(profile.recordGapMinutes)}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] mt-0.5">your record</div>
        </div>
      </div>

      {/* The comparison with your earlier entry — the whole point of the meter */}
      <div className="mt-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] px-3 py-2.5">
        <p className="text-[11px] leading-snug">
          {profile.lastGapMinutes === null ? (
            <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">{getPaceAdvice(profile)}</span>
          ) : (
            <>
              <span className="font-bold">{getPaceHeadline(profile)}.</span>{' '}
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                Previous gap {formatGapMinutes(profile.lastGapMinutes)} · this one{' '}
                {formatSignedMinutes(profile.vsLastGapMinutes)} vs that,{' '}
                {formatSignedMinutes(profile.vsBaselineMinutes)} vs your usual.
              </span>
            </>
          )}
        </p>
      </div>

      {showActions && (
        <div className="mt-3 flex items-center gap-2">
          {onLog && (
            <button
              onClick={() => {
                Sound.tick();
                onLog();
              }}
              className="flex-1 h-11 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-black dark:hover:border-white active:scale-[0.99] transition"
            >
              <Plus className="w-4 h-4" />
              Log a cigarette
            </button>
          )}
          {onOpenPace && (
            <button
              onClick={() => {
                Sound.tick();
                onOpenPace();
              }}
              className="h-11 px-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 active:scale-[0.99] transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Pace
            </button>
          )}
        </div>
      )}

      {profile.status === 'EARLY' && onLog && (
        <p className="mt-2 text-[10px] text-[#8A8A8A] flex items-center gap-1">
          <Wind className="w-3 h-3" /> The pull passed early? Ride it out for two minutes instead.
        </p>
      )}
    </section>
  );
};
