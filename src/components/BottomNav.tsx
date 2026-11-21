import React from 'react';
import { Calendar, Compass, Gauge, HeartPulse, Wrench } from 'lucide-react';
import { Sound } from '../data/sound';

export type TabId = 'today' | 'pace' | 'journey' | 'toolkit';

interface BottomNavProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  onCraving: () => void;
  /** Pace is cigarette-only; hide it when smoking is not being tracked. */
  hidePace?: boolean;
}

/**
 * Floating glass pill. The active tab expands into a green pill with its label;
 * inactive tabs stay icon-only so the bar stays calm. The round green button is
 * the craving SOS — the one action you might need in a hurry.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onCraving,
  hidePace = false,
}) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'today', label: 'Today', icon: <Calendar className="h-[18px] w-[18px]" strokeWidth={2} /> },
    ...(hidePace
      ? []
      : [{ id: 'pace' as TabId, label: 'Pace', icon: <Gauge className="h-[18px] w-[18px]" strokeWidth={2} /> }]),
    { id: 'journey', label: 'Progress', icon: <Compass className="h-[18px] w-[18px]" strokeWidth={2} /> },
    { id: 'toolkit', label: 'Toolkit', icon: <Wrench className="h-[18px] w-[18px]" strokeWidth={2} /> },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5 px-4">
        <nav
          aria-label="Main Navigation"
          className="home-glass pointer-events-auto flex flex-1 items-center gap-1 rounded-full p-1.5"
          style={{ borderRadius: 9999 }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  Sound.tick();
                  onChangeTab(tab.id);
                }}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className="home-press flex h-11 items-center justify-center gap-1.5 rounded-full px-3 transition-colors"
                style={
                  isActive
                    ? {
                        background: 'var(--green)',
                        color: '#ffffff',
                        flex: '1 1 auto',
                        boxShadow: '0 8px 18px rgba(34,197,94,0.32)',
                      }
                    : { color: 'var(--muted)', flex: '0 0 auto' }
                }
              >
                {tab.icon}
                {isActive && (
                  <span className="text-[12px] font-extrabold" style={{ letterSpacing: '0.02em' }}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => {
            Sound.tick();
            onCraving();
          }}
          aria-label="I'm having a craving, get help now"
          className="home-press pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'var(--green)',
            color: '#ffffff',
            boxShadow: '0 12px 26px rgba(34,197,94,0.4)',
          }}
        >
          <HeartPulse className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};
