import React, { useState } from 'react';
import { UserPlan, Entry, QuitAttempt, EarnedBadge } from '../../types';
import {
  calculatePeriodComparison,
  calculateToughestHours,
  calculateAverageCravingLength,
  groupEntriesByDay,
  toLocalDateString,
  calculateSmokeFreeDays,
  calculateAvoidedCigarettes,
  calculateMoneyKept,
  calculateCurrentStreak,
} from '../../domain/calculations';
import { MILESTONES } from '../../content/milestones';
import { BODY_RECOVERY_TIMELINE } from '../../content/bodyRecovery';
import { Sound } from '../../data/sound';
import {
  Calendar,
  Clock,
  TrendingDown,
  Coins,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Flame,
  Award,
  Trash2,
  Edit2,
  Activity,
  History,
} from 'lucide-react';

interface JourneyTabProps {
  plan: UserPlan;
  entries: Entry[];
  attempts: QuitAttempt[];
  badges: EarnedBadge[];
  onOpenSos: () => void;
  onEditEntry?: (entry: Entry) => void;
  onDeleteEntry?: (id: string) => void;
}

export const JourneyTab: React.FC<JourneyTabProps> = ({
  plan,
  entries,
  attempts,
  badges,
  onOpenSos,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'ALL_TIME'>('WEEK');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [selectedRecoveryId, setSelectedRecoveryId] = useState<string | null>(null);
  const [inspectedDateStr, setInspectedDateStr] = useState<string | null>(null);

  const now = Date.now();
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const comparison = calculatePeriodComparison(entries, period, plan, now, plan.weekStartDay);
  const toughestHours = calculateToughestHours(entries, 30);
  const avgCraving = calculateAverageCravingLength(entries);

  // Group entries by day for month calendar and history
  const today = new Date(now);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const monthDayMap = groupEntriesByDay(
    entries,
    toLocalDateString(currentMonthStart.getTime()),
    toLocalDateString(currentMonthEnd.getTime())
  );

  const monthDays = Array.from(monthDayMap.values());

  // Past 7 or 14 days for the Bar Chart
  const barChartDaysCount = period === 'WEEK' ? 7 : 14;
  const barDaysList: Array<{
    dateStr: string;
    dayLabel: string;
    curCount: number;
    prevCount: number;
    isSmokeFree: boolean;
  }> = [];

  for (let i = barChartDaysCount - 1; i >= 0; i--) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() - i);
    const curStr = toLocalDateString(curDate.getTime());

    const prevDate = new Date(curDate);
    prevDate.setDate(curDate.getDate() - (period === 'WEEK' ? 7 : 30));
    const prevStr = toLocalDateString(prevDate.getTime());

    const curCount = entries.filter(
      (e) => e.type === 'CIGARETTE' && toLocalDateString(e.timestamp) === curStr
    ).length;
    const prevCount = entries.filter(
      (e) => e.type === 'CIGARETTE' && toLocalDateString(e.timestamp) === prevStr
    ).length;

    barDaysList.push({
      dateStr: curStr,
      dayLabel: curDate.toLocaleDateString(undefined, { weekday: 'narrow' }),
      curCount,
      prevCount,
      isSmokeFree: curCount === 0,
    });
  }

  const maxBarVal = Math.max(
    5,
    ...barDaysList.map((d) => Math.max(d.curCount, d.prevCount))
  );

  // History entries sorted latest first
  const sortedHistory = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const inspectedEntries = inspectedDateStr
    ? sortedHistory.filter((e) => toLocalDateString(e.timestamp) === inspectedDateStr)
    : sortedHistory.slice(0, 15);

  const earnedBadgeIds = new Set(badges.map((b) => b.milestoneId));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-24 px-4 pt-3">
      {/* 1. Period Selector (Segmented Button) */}
      <div className="flex items-center justify-center p-1 rounded-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        {(['WEEK', 'MONTH', 'ALL_TIME'] as const).map((p) => {
          const isActive = period === p;
          const label = p === 'WEEK' ? 'Week' : p === 'MONTH' ? 'Month' : 'All Time';
          return (
            <button
              key={p}
              onClick={() => {
                Sound.tick();
                setPeriod(p);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-[#5E5E5E] dark:text-[#A6A6A6] hover:text-black dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 2. Summary Row (User POV & Periodic comparisons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Cigarettes smoked */}
        <div className="p-3.5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
            Cigarettes
          </span>
          <span className="text-2xl font-extrabold text-black dark:text-white tabular-nums">
            {comparison.cigarettes.currentValue}
          </span>
          <p className="text-[10px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            {comparison.cigarettes.percentChange !== null
              ? `${comparison.cigarettes.isImprovement ? 'â†“' : 'â†‘'} ${comparison.cigarettes.percentChange}% vs prev`
              : 'New baseline'}
          </p>
        </div>

        {/* Smoke-free days (User POV from Quit Date in All Time, or period count) */}
        <div className="p-3.5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
            Smoke-Free
          </span>
          <span className="text-2xl font-extrabold text-black dark:text-white tabular-nums">
            {period === 'ALL_TIME' ? smokeFree.completedSmokeFreeDays : comparison.smokeFreeDays.currentValue}d
          </span>
          <p className="text-[10px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            {period === 'ALL_TIME'
              ? `Since oath (${new Date(plan.quitStartDate).toLocaleDateString()})`
              : comparison.smokeFreeDays.percentChange !== null
              ? `${comparison.smokeFreeDays.isImprovement ? 'â†‘' : 'â†“'} ${comparison.smokeFreeDays.percentChange}% vs prev`
              : 'New streak'}
          </p>
        </div>

        {/* Cravings beaten */}
        <div className="p-3.5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
            Urges Beaten
          </span>
          <span className="text-2xl font-extrabold text-black dark:text-white tabular-nums">
            {period === 'ALL_TIME'
              ? entries.filter((e) => e.type === 'CRAVING_BEATEN').length
              : comparison.cravingsBeaten.currentValue}
          </span>
          <p className="text-[10px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            {period === 'ALL_TIME'
              ? 'Total cravings defeated'
              : comparison.cravingsBeaten.percentChange !== null
              ? `${comparison.cravingsBeaten.isImprovement ? 'â†‘' : 'â†“'} ${comparison.cravingsBeaten.percentChange}% vs prev`
              : 'New record'}
          </p>
        </div>

        {/* Money kept (User POV: total saved since quit date in All Time) */}
        <div className="p-3.5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
            Money Kept
          </span>
          <span className="text-2xl font-extrabold text-black dark:text-white tabular-nums">
            {plan.currency}{period === 'ALL_TIME' ? Math.round(calculateMoneyKept(calculateAvoidedCigarettes(entries, plan, now), plan)).toLocaleString() : comparison.moneyKept.currentValue}
          </span>
          <p className="text-[10px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            {period === 'ALL_TIME'
              ? 'Saved since quit day'
              : comparison.moneyKept.percentChange !== null
              ? `${comparison.moneyKept.isImprovement ? 'â†‘' : 'â†“'} ${comparison.moneyKept.percentChange}% vs prev`
              : 'New savings'}
          </p>
        </div>
      </div>

      {/* 3. Bar Chart: Current Period (Solid) vs Previous Period (Outlined) */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Cigarettes Per Day
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Solid = Current period Â· Outlined = Previous period
            </p>
          </div>
          {inspectedDateStr && (
            <button
              onClick={() => setInspectedDateStr(null)}
              className="text-xs font-semibold underline text-black dark:text-white"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="h-40 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-1 border-b border-[#C4C4C4] dark:border-[#3D3D3D]">
          {barDaysList.map((day) => {
            const curHeight = Math.max(4, (day.curCount / maxBarVal) * 110);
            const prevHeight = Math.max(4, (day.prevCount / maxBarVal) * 110);
            const isSelected = inspectedDateStr === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  Sound.tick();
                  setInspectedDateStr(isSelected ? null : day.dateStr);
                }}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                title={`${day.dateStr}: ${day.curCount} current vs ${day.prevCount} previous`}
              >
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-32">
                  {/* Outlined previous period bar */}
                  <div
                    style={{ height: `${prevHeight}px` }}
                    className="w-1.5 sm:w-2 border border-[#C4C4C4] dark:border-[#5E5E5E] rounded-xs"
                  />
                  {/* Solid current period bar */}
                  <div
                    style={{ height: `${curHeight}px` }}
                    className={`w-2.5 sm:w-3.5 rounded-xs transition-colors ${
                      isSelected
                        ? 'bg-black dark:bg-white ring-2 ring-black dark:ring-white'
                        : day.curCount === 0
                        ? 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
                        : 'bg-black dark:bg-white'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-[#5E5E5E] dark:text-[#A6A6A6]">
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Month Calendar of Squares */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-black dark:text-white">
            {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h3>
          <span className="text-xs font-semibold text-[#5E5E5E] dark:text-[#A6A6A6]">
            {smokeFree.completedSmokeFreeDays} smoke-free days total
          </span>
        </div>

        {/* 7-column calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayHeader, idx) => (
            <div
              key={idx}
              className="text-center text-[10px] font-bold text-[#5E5E5E] dark:text-[#A6A6A6] pb-1"
            >
              {dayHeader}
            </div>
          ))}

          {/* Blank offset for day 1 of month */}
          {Array.from({ length: currentMonthStart.getDay() }).map((_, i) => (
            <div key={`offset_${i}`} />
          ))}

          {monthDays.map((day) => {
            const isToday = day.dateStr === toLocalDateString(now);
            const isSmokeFree = day.cigarettesCount === 0;
            const dayNum = new Date(day.dateStr).getDate();

            return (
              <button
                key={day.dateStr}
                onClick={() => {
                  Sound.tick();
                  setInspectedDateStr(day.dateStr);
                }}
                className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-transform active:scale-90 ${
                  isSmokeFree
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'border-2 border-black dark:border-white text-black dark:text-white bg-transparent'
                } ${isToday ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-black' : ''}`}
              >
                <span>{dayNum}</span>
                {!isSmokeFree && (
                  <span className="text-[8px] font-mono leading-none opacity-80">
                    {day.cigarettesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-black dark:bg-white inline-block" />
            Smoke-free
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs border border-black dark:border-white inline-block" />
            Smoked (count inside)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs ring-2 ring-black dark:ring-white inline-block" />
            Today
          </span>
        </div>
      </section>

      {/* 5. Milestone Ladder */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Milestone Ladder (The Sprint Engine)
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Badges are earned once and kept forever. A slip restarts streak but never wipes earned badges.
            </p>
          </div>
          <Award className="w-5 h-5 text-black dark:text-white" />
        </div>

        <div className="space-y-2 mt-4">
          {MILESTONES.map((m) => {
            const isEarned = streak.streakHours >= m.hours || earnedBadgeIds.has(m.id);
            const isSelected = selectedMilestoneId === m.id;

            return (
              <div
                key={m.id}
                onClick={() => {
                  Sound.tick();
                  setSelectedMilestoneId(isSelected ? null : m.id);
                }}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                  isEarned
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                    : 'bg-[#E2E2E2] dark:bg-[#262626] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Expressive Badge Shape */}
                    <div
                      className={`w-7 h-7 flex items-center justify-center font-black text-xs ${
                        m.badgeShape === 'cookie'
                          ? 'shape-cookie'
                          : m.badgeShape === 'clover'
                          ? 'shape-clover'
                          : m.badgeShape === 'starburst'
                          ? 'shape-starburst'
                          : 'shape-diamond'
                      } ${isEarned ? 'bg-white text-black dark:bg-black dark:text-white' : 'bg-black text-white dark:bg-white dark:text-black'}`}
                    >
                      âœ“
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{m.title}</span>
                      <span className="text-[11px] opacity-80 block">{m.subtitle}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-current">
                    {m.evidence}
                  </span>
                </div>

                {/* Details on tap */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-current/20 text-xs space-y-1 animate-in fade-in duration-150">
                    <p className="font-medium">{m.message}</p>
                    <p className="text-[11px] opacity-75">Source: {m.source}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Body Recovery Timeline */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Body Recovery Timeline
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Strictly verified facts from WHO and clinical pharmacology.
            </p>
          </div>
          <Activity className="w-5 h-5 text-black dark:text-white" />
        </div>

        <div className="space-y-2 mt-3">
          {BODY_RECOVERY_TIMELINE.map((stage) => {
            const isReached = streak.streakHours >= stage.hours;
            const isSelected = selectedRecoveryId === stage.id;

            return (
              <div
                key={stage.id}
                onClick={() => {
                  Sound.tick();
                  setSelectedRecoveryId(isSelected ? null : stage.id);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  isReached
                    ? 'border-black dark:border-white bg-[#E2E2E2] dark:bg-[#262626]'
                    : 'border-[#C4C4C4] dark:border-[#3D3D3D] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                        isReached
                          ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                          : 'border-current'
                      }`}
                    >
                      {isReached ? 'âœ“' : ''}
                    </span>
                    <span className="font-bold text-black dark:text-white">
                      {stage.timeLabel}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {stage.evidence}
                  </span>
                </div>

                <p className="text-xs text-black dark:text-white mt-1 pl-5.5">
                  {stage.whatHappens}
                </p>

                {isSelected && (
                  <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-2 pl-5.5 pt-1 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
                    Source: {stage.source}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Patterns: Toughest Hours (7x24 Heatmap) & Average Craving */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Toughest Hours (7-Day Ã— 24-Hour Grid)
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Darker squares represent peak craving windows over the past 30 days.
            </p>
          </div>
          <Clock className="w-5 h-5 text-black dark:text-white" />
        </div>

        {/* 7x24 Matrix Visualization */}
        <div className="overflow-x-auto my-3 pb-1">
          <div className="min-w-[320px] space-y-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dIdx) => (
              <div key={dIdx} className="flex items-center gap-1">
                <span className="w-6 text-[9px] font-bold text-[#5E5E5E] dark:text-[#A6A6A6]">
                  {dayName}
                </span>
                <div className="flex-1 flex gap-0.5">
                  {toughestHours.matrix[dIdx].map((val, hIdx) => {
                    const intensity =
                      toughestHours.maxCount > 0
                        ? Math.min(1, val / toughestHours.maxCount)
                        : 0;

                    return (
                      <div
                        key={hIdx}
                        title={`${dayName} ${hIdx}:00 - ${val} logs`}
                        style={{
                          opacity: val > 0 ? 0.2 + intensity * 0.8 : 0.08,
                        }}
                        className="flex-1 h-3 rounded-xs bg-black dark:bg-white"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {avgCraving.formattedMinutes && (
          <div className="p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] text-xs">
            <span className="font-bold text-black dark:text-white block">
              Personal Craving Duration:
            </span>
            <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
              Your cravings usually pass in {avgCraving.formattedMinutes} (median of {avgCraving.totalLoggedWithDuration} episodes).
            </span>
          </div>
        )}
      </section>

      {/* 8. Grouped History with Edit / Delete */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span>Activity History {inspectedDateStr ? `(${inspectedDateStr})` : ''}</span>
          </h3>
          <span className="text-xs font-semibold text-[#5E5E5E] dark:text-[#A6A6A6]">
            {inspectedEntries.length} entries shown
          </span>
        </div>

        {inspectedEntries.length === 0 ? (
          <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] py-3 text-center">
            No entries logged yet for this period.
          </p>
        ) : (
          <div className="space-y-2">
            {inspectedEntries.map((e) => {
              const d = new Date(e.timestamp);
              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

              return (
                <div
                  key={e.id}
                  className="p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        e.type === 'CIGARETTE'
                          ? 'border border-black dark:border-white text-black dark:text-white'
                          : e.type === 'CRAVING_BEATEN'
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
                      }`}
                    >
                      {e.type === 'CIGARETTE' ? 'ðŸš¬' : e.type === 'CRAVING_BEATEN' ? 'âœ“' : 'â˜…'}
                    </span>
                    <div>
                      <span className="font-bold text-black dark:text-white block">
                        {e.type === 'CIGARETTE'
                          ? 'Cigarette Logged'
                          : e.type === 'CRAVING_BEATEN'
                          ? `Craving Beaten (${e.cravingDurationSeconds || 180}s)`
                          : 'Daily Pledge'}
                      </span>
                      <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                        {dateLabel} Â· {timeStr}
                        {e.triggers && e.triggers.length > 0 ? ` Â· ${e.triggers.join(', ')}` : ''}
                      </span>
                      {e.note && (
                        <p className="text-[10px] italic text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
                          "{e.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onDeleteEntry && (
                      <button
                        onClick={() => {
                          Sound.tick();
                          onDeleteEntry(e.id);
                        }}
                        className="p-1.5 rounded-lg text-[#5E5E5E] dark:text-[#A6A6A6] hover:text-red-500 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 9. Past Quit Attempts */}
      <section className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
        <h3 className="text-sm font-bold text-black dark:text-white mb-1">
          Quit Attempts History
        </h3>
        <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-3">
          "Most ex-smokers needed several tries. Every attempt teaches you something."
        </p>

        <div className="space-y-2">
          {attempts.map((att) => (
            <div
              key={att.id}
              className="p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-black dark:text-white block">
                  Started {new Date(att.startDate).toLocaleDateString()}
                </span>
                <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Best streak: {Math.floor(att.bestStreakHours / 24)}d {Math.round(att.bestStreakHours % 24)}h
                  {att.reasonForRestart ? ` Â· Lesson: ${att.reasonForRestart}` : ''}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-black dark:text-white">
                {att.smokeFreeDays} clean days
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
