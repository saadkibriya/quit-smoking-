import React, { useEffect, useState } from 'react';
import { Entry, UserPlan } from '../../types';
import { countUrgesBeaten, formatCleanTime, formatCleanTimeLong, getFapStats } from '../../domain/fap';
import { FAP_URGE_TOOLS, FAP_WARNING_HINTS, FAP_WARNINGS } from '../../content/fapGuidance';
import { GlassCard } from '../home/GlassCard';
import { Plus, Settings2, ShieldAlert } from 'lucide-react';

interface FapCardProps {
  plan: UserPlan;
  entries: Entry[];
  onLogSlip: () => void;
  onOpenUrgeHelp: () => void;
  onOpenSettings?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The porn/fap tracker as it appears inside the home deck. The timer only needs
 * minute precision, so it re-renders on a 30s tick rather than every second.
 */
export const FapCard: React.FC<FapCardProps> = ({
  plan,
  entries,
  onLogSlip,
  onOpenUrgeHelp,
  onOpenSettings,
  className = '',
  style,
}) => {
  const [now, setNow] = useState(() => Date.now());
  // Minute-precision timer: tick while the card is on screen only, so a deck
  // full of cards is not re-rendering in the background.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = getFapStats(entries, plan.fapStartDate, now);
  const urges = countUrgesBeaten(entries, 7, now);

  return (
    <GlassCard className={className} style={style}>
      <div className="flex items-start justify-between">
        <div>
          <span className="home-label">Porn / fap-free</span>
          <div className="home-num mt-1 text-[34px]">{formatCleanTime(stats)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="home-label rounded-full px-2.5 py-1"
            style={{
              color: stats.cleanToday ? 'var(--green)' : 'var(--ink)',
              background: stats.cleanToday ? 'rgba(34,197,94,0.12)' : 'var(--chip)',
            }}
          >
            {stats.cleanToday ? 'Clean today' : `${stats.todayLapses} today`}
          </span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Open fap tracking settings"
              className="home-press flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'var(--chip)' }}
            >
              <Settings2 className="h-4 w-4" style={{ color: 'var(--ink)' }} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          {
            label: plan.fapGoalPerDay > 0 ? `Today / ${plan.fapGoalPerDay}` : 'Today',
            value: stats.todayLapses,
          },
          { label: '7 days', value: stats.weekLapses },
          { label: 'Urges beaten', value: urges },
        ].map((item) => (
          <div key={item.label}>
            <div className="home-num text-[18px]">{item.value}</div>
            <div className="home-label mt-0.5" style={{ letterSpacing: '0.1em' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="home-body mt-3 text-[11px]">
        {stats.lastLapseAt
          ? `Last slip ${formatCleanTimeLong({ ...stats, cleanMs: now - stats.lastLapseAt })} ago`
          : 'No slips logged yet.'}{' '}
        &middot; Watch for {FAP_WARNING_HINTS.join(' \u00B7 ').toLowerCase()}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onLogSlip}
          className="home-press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold uppercase"
          style={{ background: 'var(--ink)', color: 'var(--ink-contrast)', letterSpacing: '0.08em' }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Log a slip
        </button>
        <button
          onClick={onOpenUrgeHelp}
          className="home-press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold uppercase"
          style={{ background: 'var(--chip)', color: 'var(--ink)', letterSpacing: '0.08em' }}
        >
          <ShieldAlert className="h-4 w-4" strokeWidth={2.2} />
          Urge help
        </button>
      </div>
    </GlassCard>
  );
};

type FapHomeProps = Omit<FapCardProps, 'className' | 'style'>;

/**
 * Home surface for people tracking only porn/fap. Same visual language as the
 * smoking home: a big calm timer, the numbers that matter, and the warning
 * signs they asked to be reminded about.
 */
export const FapHome: React.FC<FapHomeProps> = ({
  plan,
  entries,
  onLogSlip,
  onOpenUrgeHelp,
  onOpenSettings,
}) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = getFapStats(entries, plan.fapStartDate, now);
  const urges = countUrgesBeaten(entries, 7, now);
  const bestClean =
    stats.longestCleanHours >= 24
      ? `${Math.floor(stats.longestCleanHours / 24)}d`
      : `${Math.max(1, Math.floor(stats.longestCleanHours))}h`;

  return (
    <div className="home-root">
      <div className="home-blob home-blob-green" aria-hidden="true" />
      <div className="home-blob home-blob-blue" aria-hidden="true" />
      <div className="home-blob home-blob-mint" aria-hidden="true" />

      <div
        className="relative z-10 px-5 pb-40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: stats.cleanToday ? 'var(--green)' : 'var(--muted)' }}
              aria-hidden="true"
            />
            <span className="home-label" style={{ color: 'var(--ink)' }}>
              {stats.cleanToday ? 'Clean right now' : `${stats.todayLapses} today`}
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="home-press home-glass flex h-10 w-10 items-center justify-center rounded-full"
            >
              <Settings2 className="h-[18px] w-[18px]" style={{ color: 'var(--ink)' }} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="home-rise mt-6">
          <h1 className="home-title text-[26px]">Porn / fap-free</h1>
          <p className="home-body mt-1 text-[13px]">
            Tracked from {new Date(plan.fapStartDate).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            })}
            . A slip restarts the timer; the days behind you still happened.
          </p>
        </div>

        <GlassCard className="home-rise mt-4" style={{ animationDelay: '100ms' }}>
          <span className="home-label">Current clean streak</span>
          <div className="home-num mt-2 text-[52px]">{formatCleanTime(stats)}</div>
          <div className="home-body mt-2 text-[12px]">
            Best {bestClean} &middot; {stats.totalLapses} slips logged
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Today', value: stats.todayLapses },
              { label: 'This week', value: stats.weekLapses },
              { label: 'Urges beaten', value: urges },
            ].map((item) => (
              <div key={item.label}>
                <div className="home-num text-[20px]">{item.value}</div>
                <div className="home-label mt-0.5" style={{ letterSpacing: '0.1em' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="home-rise mt-4 flex items-center gap-3" style={{ animationDelay: '160ms' }}>
          <button
            onClick={onOpenUrgeHelp}
            className="home-press flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-extrabold uppercase"
            style={{
              background: 'var(--ink)',
              color: 'var(--ink-contrast)',
              letterSpacing: '0.1em',
            }}
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={2.2} />
            Urge right now
          </button>
          <button
            onClick={onLogSlip}
            className="home-press flex h-12 items-center justify-center gap-1.5 rounded-full px-4 text-[12px] font-extrabold uppercase"
            style={{ background: 'var(--chip)', color: 'var(--ink)', letterSpacing: '0.08em' }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Slip
          </button>
        </div>

        <div className="home-rise mt-8" style={{ animationDelay: '220ms' }}>
          <h2 className="home-title text-[18px]">Worth remembering</h2>
          <div className="mt-3 space-y-2">
            {FAP_WARNINGS.slice(0, 4).map((warning) => (
              <GlassCard key={warning.id} padding="p-4">
                <span className="home-body text-[12px] font-extrabold" style={{ color: 'var(--ink)' }}>
                  {warning.title}
                </span>
                <p className="home-body mt-1 text-[12px] leading-snug">{warning.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="home-rise mt-6" style={{ animationDelay: '280ms' }}>
          <h2 className="home-title text-[18px]">If an urge hits</h2>
          <ul className="mt-3 space-y-2">
            {FAP_URGE_TOOLS.map((tip) => (
              <li key={tip} className="home-body flex gap-2 text-[12px] leading-snug">
                <span style={{ color: 'var(--green)' }} aria-hidden="true">
                  &bull;
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
