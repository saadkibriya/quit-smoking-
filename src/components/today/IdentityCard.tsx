import React from 'react';
import { UserPlan, Entry } from '../../types';
import { calculateIdentityLedger, getTodaysPrinciple, IDENTITY_STATEMENT, IDENTITY_SUBLINE } from '../../content/identity';
import { Sound } from '../../data/sound';
import { Check, ArrowUpRight, BookOpen } from 'lucide-react';

interface IdentityCardProps {
  plan: UserPlan;
  entries: Entry[];
  onPledge: () => void;
  onOpenToolkit?: () => void;
}

/**
 * The identity widget. Not a scoreboard of abstinence — a record of who you are
 * becoming. One decision a day is the whole ask.
 */
export const IdentityCard: React.FC<IdentityCardProps> = ({ plan, entries, onPledge, onOpenToolkit }) => {
  const ledger = calculateIdentityLedger(entries, plan);
  const principle = getTodaysPrinciple();

  return (
    <section
      aria-label="Nonsmoker identity"
      className="w-full bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-3xl p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
          Identity
        </span>
        <span className="font-mono text-[11px] text-[#8A8A8A]">
          {ledger.total} vote{ledger.total === 1 ? '' : 's'} cast
        </span>
      </div>

      <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight leading-tight">
        {IDENTITY_STATEMENT}
      </h2>
      <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-1 leading-snug">{IDENTITY_SUBLINE}</p>

      {/* Votes: dots, one per held urge per clean day, capped for rhythm */}
      <div className="mt-3 flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => {
          const filled = i < Math.min(24, ledger.total);
          return (
            <span
              key={i}
              className={`h-3 flex-1 rounded-[1px] ${
                filled ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#2A2A2A]'
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] py-2">
          <div className="font-doto font-bold text-lg leading-tight">{ledger.urgesBeaten}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A]">urges held</div>
        </div>
        <div className="rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] py-2">
          <div className="font-doto font-bold text-lg leading-tight">{ledger.cleanDays}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A]">clean days</div>
        </div>
        <div className="rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] py-2">
          <div className="font-doto font-bold text-lg leading-tight">{ledger.honestLogs}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A]">honest logs</div>
        </div>
      </div>

      {/* Today's single vote */}
      {ledger.pledgedToday ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#C4C4C4] dark:border-[#3D3D3D] px-3 py-2.5">
          <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" />
          </span>
          <span className="text-[11px] font-bold">Today's vote is in.</span>
          <span className="text-[10px] text-[#8A8A8A] ml-auto hidden sm:inline">See you tomorrow</span>
        </div>
      ) : (
        <button
          onClick={() => {
            Sound.celebrate();
            onPledge();
          }}
          className="mt-3 w-full h-11 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold active:scale-[0.99] transition"
        >
          Cast today's vote — I won't smoke today
        </button>
      )}

      {/* Today's principle */}
      <div className="mt-4 pt-3 border-t border-[#C4C4C4] dark:border-[#2A2A2A]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold block truncate">{principle.title}</span>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5 leading-snug">{principle.action}</p>
          </div>
          {onOpenToolkit && (
            <button
              onClick={onOpenToolkit}
              aria-label="Open mindset library"
              className="shrink-0 text-[#8A8A8A] hover:text-black dark:hover:text-white transition p-1"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#8A8A8A]">
          <BookOpen className="w-2.5 h-2.5" />
          {principle.source}
        </span>
      </div>
    </section>
  );
};
