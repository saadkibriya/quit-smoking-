import React, { useState } from 'react';
import { Entry, UserPlan } from '../../types';
import { calculateStats } from '../../domain/calculations';
import { formatCleanTime, getFapStats } from '../../domain/fap';
import { Sound } from '../../data/sound';
import { Info, Search, X } from 'lucide-react';

interface HomeScreenWidgetSimulatorProps {
  plan: UserPlan;
  entries: Entry[];
  currentTheme: 'DAY' | 'NIGHT';
  onClose: () => void;
  onQuickLog: () => void;
  onDeepLink: (destination: 'today' | 'journey' | 'sos') => void;
}

type Kind = 'days' | 'streak' | 'both';
type Theme = 'auto' | 'light' | 'dark';
type Accent = 'mono' | 'green' | 'amber' | 'blue';

interface WidgetSettings {
  theme: Theme;
  accent: Accent;
  display: number;
}

const ACCENTS: Record<Accent, string> = {
  mono: '#8A8A8A',
  green: '#34C759',
  amber: '#F5A623',
  blue: '#3B82F6',
};

const TABS: { id: Kind; label: string }[] = [
  { id: 'days', label: 'Days' },
  { id: 'streak', label: 'Streak' },
  { id: 'both', label: 'Both' },
];

/** "Nov 1" — the quiet supporting line on the bar. */
function shortDate(value: string | number | Date): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-10 rounded-full text-[12px] font-bold transition ${
        active
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-[#F2F2F2] dark:bg-[#141414] text-[#5E5E5E] dark:text-[#8A8A8A] border border-[#C4C4C4] dark:border-[#2A2A2A]'
      }`}
    >
      {label}
    </button>
  );
}

export const HomeScreenWidgetSimulator: React.FC<HomeScreenWidgetSimulatorProps> = ({
  plan,
  entries,
  currentTheme,
  onClose,
  onQuickLog,
  onDeepLink,
}) => {
  const [active, setActive] = useState<Kind>('days');
  const [settings, setSettings] = useState<Record<Kind, WidgetSettings>>({
    days: { theme: 'auto', accent: 'green', display: 0 },
    streak: { theme: 'auto', accent: 'blue', display: 0 },
    both: { theme: 'auto', accent: 'mono', display: 0 },
  });

  const stats = calculateStats(entries || [], plan, Date.now());
  const streak = stats.currentStreak;
  const fap = getFapStats(entries || [], plan.fapStartDate || plan.quitStartDate, Date.now());
  const tracksFap = (plan.targets || []).includes('FAP');
  const curr = plan?.currency || '৳';

  const current = settings[active];
  const night = current.theme === 'dark' || (current.theme === 'auto' && currentTheme === 'NIGHT');
  const accent = ACCENTS[current.accent];
  const fg = night ? '#FFFFFF' : '#0A0A0A';
  const muted = night ? '#8A8A8A' : '#71717A';
  const surface = night ? '#0A0A0A' : '#FFFFFF';
  const border = night ? '#222222' : '#E4E4E7';

  const smoke = {
    days: streak.days,
    time: streak.formattedClock,
    saved: `${curr}${Math.round(stats.moneySaved).toLocaleString()}`,
    count: Math.round(stats.cigarettesNotSmoked).toLocaleString(),
    since: shortDate(plan.quitStartDate),
  };

  const update = (patch: Partial<WidgetSettings>) => {
    Sound.tick();
    setSettings((prev) => ({ ...prev, [active]: { ...prev[active], ...patch } }));
  };

  const smokeGroup = () => {
    if (current.display === 1) return { hero: smoke.time, label: 'TIME', sub: `SINCE ${smoke.since}` };
    if (current.display === 2) return { hero: smoke.saved, label: 'SAVED', sub: `SINCE ${smoke.since}` };
    if (current.display === 3) return { hero: smoke.count, label: 'AVOIDED', sub: `SINCE ${smoke.since}` };
    return {
      hero: String(smoke.days),
      label: smoke.days === 1 ? 'DAY' : 'DAYS',
      sub: `SINCE ${smoke.since}`,
    };
  };

  const streakGroup = () => {
    if (current.display === 1) {
      return { hero: formatCleanTime(fap), label: 'TIME', sub: `SINCE ${shortDate(plan.fapStartDate || plan.quitStartDate)}` };
    }
    return {
      hero: String(fap.cleanDays),
      label: fap.cleanDays === 1 ? 'DAY' : 'STREAK',
      sub: `SINCE ${shortDate(plan.fapStartDate || plan.quitStartDate)}`,
    };
  };

  const groups =
    active === 'both'
      ? [smokeGroup(), { hero: String(fap.cleanDays), label: 'STREAK', sub: '' }]
      : active === 'streak'
        ? [streakGroup()]
        : [smokeGroup()];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Home screen widget preview"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-white dark:bg-black border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-3xl p-4 sm:p-6 shadow-2xl text-black dark:text-white my-auto flex flex-col max-h-[95vh]">
        <div className="flex items-start justify-between pb-3 border-b border-[#C4C4C4] dark:border-[#2A2A2A] mb-3 shrink-0">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Home screen widgets</h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#8A8A8A]">
              One bar, the same 4 × 1 size as the Google search bar
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close widgets preview"
            className="w-9 h-9 rounded-full border border-[#C4C4C4] dark:border-[#2A2A2A] flex items-center justify-center hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 mb-3 shrink-0">
          {TABS.map((tab) => (
            <Pill
              key={tab.id}
              label={tab.label}
              active={active === tab.id}
              onClick={() => {
                Sound.tick();
                setActive(tab.id);
              }}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Phone-shaped stage with the bar and the Google bar for scale. */}
          <div className="rounded-[28px] bg-[#050505] border border-[#2A2A2A] p-4 space-y-2.5">
            <span className="text-[9px] font-mono tracking-widest text-[#8A8A8A] uppercase">
              {active === 'both' ? 'Both' : active === 'streak' ? 'Streak' : 'Days'} widget · 4 × 1
            </span>

            <div
              onClick={() => onDeepLink('today')}
              className="flex items-center h-14 rounded-[28px] border px-4 cursor-pointer select-none transition hover:brightness-110"
              style={{ background: surface, borderColor: border, color: fg }}
            >
              {groups.map((group, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="w-px h-6 mx-3 shrink-0" style={{ background: border }} />
                  )}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-[9px] leading-none shrink-0" style={{ color: accent }}>
                      ●
                    </span>
                    <div className="min-w-0">
                      <div className="text-[23px] leading-none font-black tabular-nums truncate">
                        {group.hero}
                      </div>
                      <div
                        className="text-[9px] tracking-[0.1em] font-mono uppercase mt-0.5"
                        style={{ color: muted }}
                      >
                        {group.label}
                      </div>
                    </div>
                    {group.sub && groups.length === 1 && (
                      <span
                        className="ml-auto text-[10px] font-mono whitespace-nowrap"
                        style={{ color: muted }}
                      >
                        {group.sub}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Same-size reference bar. */}
            <div className="flex items-center h-14 rounded-[28px] bg-[#181818] border border-[#262626] px-4 text-xs text-[#8A8A8A]">
              <Search className="w-4 h-4 mr-2" />
              <span>Google search bar — same row height</span>
            </div>
          </div>

          {/* The real widgets keep these settings per instance. */}
          <div className="p-4 rounded-3xl border border-[#C4C4C4] dark:border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">This widget's settings</span>
              <span className="text-[10px] font-mono text-[#5E5E5E] dark:text-[#8A8A8A]">
                saved per widget
              </span>
            </div>

            <div>
              <span className="block text-[9px] font-mono tracking-widest uppercase text-[#5E5E5E] dark:text-[#8A8A8A] mb-1.5">
                Appearance
              </span>
              <div className="flex gap-1.5">
                {(['auto', 'light', 'dark'] as Theme[]).map((value) => (
                  <Pill
                    key={value}
                    label={value[0].toUpperCase() + value.slice(1)}
                    active={current.theme === value}
                    onClick={() => update({ theme: value })}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[9px] font-mono tracking-widest uppercase text-[#5E5E5E] dark:text-[#8A8A8A] mb-1.5">
                Accent
              </span>
              <div className="flex gap-1.5">
                {(['mono', 'green', 'amber', 'blue'] as Accent[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => update({ accent: value })}
                    className={`flex-1 h-10 rounded-full text-[12px] font-bold border transition flex items-center justify-center gap-1.5 ${
                      current.accent === value
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#2A2A2A]'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: ACCENTS[value] }}
                    />
                    {value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {active !== 'both' && (
              <div>
                <span className="block text-[9px] font-mono tracking-widest uppercase text-[#5E5E5E] dark:text-[#8A8A8A] mb-1.5">
                  Shows
                </span>
                <div className="flex gap-1.5">
                  {(active === 'streak'
                    ? [
                        { index: 0, label: 'Days' },
                        { index: 1, label: 'Time' },
                      ]
                    : [
                        { index: 0, label: 'Days' },
                        { index: 1, label: 'Time' },
                        { index: 2, label: 'Saved' },
                        { index: 3, label: 'Count' },
                      ]
                  ).map((option) => (
                    <Pill
                      key={option.index}
                      label={option.label}
                      active={current.display === option.index}
                      onClick={() => update({ display: option.index })}
                    />
                  ))}
                </div>
              </div>
            )}

            {active === 'days' && (
              <button
                onClick={onQuickLog}
                className="w-full h-10 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold active:scale-95 transition"
              >
                Tap the number to add a count
              </button>
            )}
          </div>

          {active === 'streak' && !tracksFap && (
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#8A8A8A]">
              Turn on the second tracker in Settings and this bar starts counting.
            </p>
          )}

          <div className="p-4 rounded-3xl border border-[#C4C4C4] dark:border-[#2A2A2A] space-y-1 text-[11px] text-[#5E5E5E] dark:text-[#8A8A8A]">
            <span className="block text-xs font-bold text-black dark:text-white mb-1">How to add one</span>
            <p>Long-press an empty spot on the home screen → Widgets → Quiter.</p>
            <p>Drag out Days, Streak or Both, then long-press it and pick Edit to change how it looks.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#C4C4C4] dark:border-[#2A2A2A] mt-3 flex items-center gap-1.5 text-[11px] text-[#5E5E5E] dark:text-[#8A8A8A] shrink-0">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Tapping a bar opens Quiter. Nothing on it names a habit.</span>
        </div>
      </div>
    </div>
  );
};
