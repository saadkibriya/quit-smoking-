import React, { useEffect, useState } from 'react';
import { UserPlan, Entry } from '../../types';
import {
  calculatePaceProfile,
  calculateDailyPace,
  calculateHourlyLoad,
  formatGapMinutes,
  formatClockTime,
  formatSignedMinutes,
} from '../../domain/pacing';
import { calculateIdentityLedger, MINDSET_PRINCIPLES } from '../../content/identity';
import { PaceMeter } from '../today/PaceMeter';
import { Sound } from '../../data/sound';
import { Plus, Info, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PaceTabProps {
  plan: UserPlan;
  entries: Entry[];
  onLog: () => void;
  onOpenSos: () => void;
}

const card = 'bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-3xl p-4 sm:p-5';

/**
 * Pace — the dashboard that answers "am I widening the distance?"
 * Everything here is one idea measured several ways: the gap between cigarettes.
 */
export const PaceTab: React.FC<PaceTabProps> = ({ plan, entries, onLog, onOpenSos }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const profile = calculatePaceProfile(entries, plan, now);
  const daily = calculateDailyPace(entries, plan, 7, now);
  const hourly = calculateHourlyLoad(entries, 30, now);
  const ledger = calculateIdentityLedger(entries, plan, now);

  const recentGaps = profile.gaps.slice(-12);
  const chartMax = Math.max(profile.targetMinutes * 1.15, ...recentGaps.map((g) => g.minutes), 1);
  const targetLinePct = Math.min(100, (profile.targetMinutes / chartMax) * 100);

  // Consecutive gaps that met the target — the "stretch streak".
  let stretchStreak = 0;
  for (let i = profile.gaps.length - 1; i >= 0; i -= 1) {
    if (profile.gaps[i].minutes >= profile.targetMinutes) stretchStreak += 1;
    else break;
  }

  const maxHourly = Math.max(1, ...hourly.hours);

  const trendIcon =
    profile.trendDirection === 'STRETCHING' ? (
      <TrendingUp className="w-4 h-4" />
    ) : profile.trendDirection === 'TIGHTENING' ? (
      <TrendingDown className="w-4 h-4" />
    ) : (
      <Minus className="w-4 h-4" />
    );

  return (
    <div className="w-full px-4 pt-3 pb-24 space-y-3">
      <header className="px-0.5">
        <h1 className="text-2xl font-black tracking-tight">Pace</h1>
        <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
          Widen the distance between cigarettes. One honest log at a time.
        </p>
      </header>

      <PaceMeter plan={plan} entries={entries} onLog={onLog} />

      {/* Gap trend */}
      <section className={card} aria-label="Gap between cigarettes, last 12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            Your last 12 gaps
          </span>
          <span className="text-[10px] font-mono text-[#8A8A8A] flex items-center gap-1">
            {trendIcon}
            {profile.trendDirection === 'UNKNOWN'
              ? 'learning'
              : profile.trendDirection === 'STEADY'
              ? 'steady'
              : `${formatSignedMinutes(profile.trendMinutes)}/gap`}
          </span>
        </div>

        {recentGaps.length === 0 ? (
          <p className="text-xs text-[#8A8A8A] mt-3">
            Log two cigarettes and the shape of your habit appears here.
          </p>
        ) : (
          <>
            <div className="relative mt-4 h-30 flex items-end gap-1.5">
              {/* Target line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-[#8A8A8A] pointer-events-none"
                style={{ bottom: `${targetLinePct}%` }}
              >
                <span className="absolute -top-4 right-0 text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A]">
                  target {formatGapMinutes(profile.targetMinutes)}
                </span>
              </div>

              {recentGaps.map((g, i) => {
                const heightPct = Math.max(4, (g.minutes / chartMax) * 100);
                const hitTarget = g.minutes >= profile.targetMinutes;
                return (
                  <div key={`${g.endMs}-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      title={`${formatGapMinutes(g.minutes)} · ${formatClockTime(g.endMs)}`}
                      className={`w-full rounded-t-[2px] transition-all ${
                        hitTarget ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {recentGaps.map((g, i) => (
                <span
                  key={`label-${g.endMs}-${i}`}
                  className="flex-1 text-center text-[8px] font-mono text-[#8A8A8A] truncate"
                >
                  {new Date(g.endMs).getHours().toString().padStart(2, '0')}
                </span>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#C4C4C4] dark:border-[#2A2A2A] flex items-center justify-between text-[11px]">
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                {stretchStreak > 0
                  ? `${stretchStreak} gap${stretchStreak === 1 ? '' : 's'} in a row above target`
                  : 'Solid bars are gaps that beat your target'}
              </span>
              <span className="font-mono font-bold">{formatGapMinutes(profile.longestGapTodayMinutes)} today</span>
            </div>
          </>
        )}
      </section>

      {/* Daily distance table */}
      <section className={card} aria-label="Daily distance summary">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            Distance, day by day
          </span>
          <span className="text-[10px] font-mono text-[#8A8A8A]">last 7 days</span>
        </div>

        <div className="grid grid-cols-4 text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] pb-1.5 border-b border-[#C4C4C4] dark:border-[#2A2A2A]">
          <span>Day</span>
          <span className="text-center">Smoked</span>
          <span className="text-center">Longest</span>
          <span className="text-right">Average</span>
        </div>

        {daily.map((d) => (
          <div
            key={d.dateStr}
            className={`grid grid-cols-4 py-2 border-b border-[#E2E2E2] dark:border-[#1F1F1F] last:border-0 text-xs ${
              d.isToday ? 'font-bold' : ''
            }`}
          >
            <span className="font-mono text-[11px]">
              {d.isToday ? 'TODAY' : d.label}
              <span className="text-[#8A8A8A] font-normal"> {d.dateStr.slice(8)}</span>
            </span>
            <span className={`text-center font-doto ${d.cigaretteCount === 0 ? 'text-[#8A8A8A]' : ''}`}>
              {d.cigaretteCount === 0 ? '—' : d.cigaretteCount}
            </span>
            <span className="text-center font-mono text-[11px]">{formatGapMinutes(d.longestGapMinutes)}</span>
            <span className="text-right font-mono text-[11px]">{formatGapMinutes(d.averageGapMinutes)}</span>
          </div>
        ))}
      </section>

      {/* When the pull is strongest */}
      <section className={card} aria-label="Strongest hours of the day">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            When the pull is strongest
          </span>
          <span className="text-[10px] font-mono text-[#8A8A8A]">30 days</span>
        </div>

        <div className="mt-4 flex items-end gap-[3px] h-20" role="img" aria-label="Hour of day vs cigarette and craving count">
          {hourly.hours.map((count, hour) => {
            const isPeak = hour === hourly.peakHour && count > 0;
            return (
              <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  title={`${hour.toString().padStart(2, '0')}:00 · ${count}`}
                  className={`w-full rounded-t-[1px] ${
                    isPeak ? 'bg-[#D71921]' : count > 0 ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
                  }`}
                  style={{ height: `${Math.max(3, (count / maxHourly) * 100)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-mono text-[#8A8A8A]">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
        <p className="mt-2.5 text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] leading-snug">
          {hourly.peakCount > 0 ? (
            <>
              Your hardest hour is{' '}
              <span className="font-bold text-black dark:text-white">
                {hourly.peakHour.toString().padStart(2, '0')}:00–{((hourly.peakHour + 1) % 24)
                  .toString()
                  .padStart(2, '0')}
                :00
              </span>
              . Put one ready substitute in that hour — water, a walk, gum. Design the moment instead of
              fighting it.
            </>
          ) : (
            'Log a few cigarettes or cravings and your pattern will show up here.'
          )}
        </p>
      </section>

      {/* Identity + method */}
      <section className={card} aria-label="The method behind the meter">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
          The method
        </span>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] p-3">
            <div className="font-doto font-bold text-xl leading-none">{ledger.total}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] mt-1">identity votes</div>
          </div>
          <div className="rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] p-3">
            <div className="font-doto font-bold text-xl leading-none">{stretchStreak}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A] mt-1">stretch streak</div>
          </div>
        </div>

        <ul className="mt-3 space-y-2.5">
          {MINDSET_PRINCIPLES.slice(0, 4).map((p) => (
            <li key={p.id} className="border-l-2 border-black dark:border-white pl-2.5">
              <span className="text-xs font-bold block leading-tight">{p.title}</span>
              <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] leading-snug block mt-0.5">
                {p.action}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Your pre-decided plans */}
      {plan.ifThenPlans && plan.ifThenPlans.length > 0 && (
        <section className={card} aria-label="If then plans">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            Decided in advance
          </span>
          <ul className="mt-2.5 space-y-2">
            {plan.ifThenPlans.slice(0, 4).map((item) => (
              <li key={item.id} className="text-[11px] leading-snug">
                <span className="font-bold capitalize">When {item.trigger.replace(/_/g, ' ')}:</span>{' '}
                <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">{item.action}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Evidence note: honest about what pacing can and cannot do */}
      <section className="rounded-3xl border border-dashed border-[#C4C4C4] dark:border-[#3D3D3D] p-4">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#8A8A8A] shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-[#5E5E5E] dark:text-[#A6A6A6]">
            Stretching the interval is a recognised cut-down method (NICE, <em>Cut Down to Stop</em>), and
            scheduled stretching reduced craving and withdrawal in a 2023 randomised trial. Cutting down is
            an on-ramp, not the destination: abrupt quitting still has the strongest evidence for lasting
            freedom. Use the meter to prove you are not powerless — then set a quit date.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            Sound.tick();
            onLog();
          }}
          className="h-13 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
        >
          <Plus className="w-4 h-4" /> Log a cigarette
        </button>
        <button
          onClick={() => {
            Sound.tick();
            onOpenSos();
          }}
          className="h-13 rounded-full border-2 border-[#D71921] text-[#D71921] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
        >
          Ride out an urge <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
