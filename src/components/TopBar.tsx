import React from 'react';
import { ShieldAlert, Sun, Moon, Sparkles } from 'lucide-react';
import { UserPlan } from '../types';
import { Sound } from '../data/sound';

interface TopBarProps {
  plan: UserPlan;
  currentTheme: 'DAY' | 'NIGHT';
  onToggleTheme: () => void;
  onOpenSos: () => void;
  dayGreeting?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  plan,
  currentTheme,
  onToggleTheme,
  onOpenSos,
  dayGreeting = 'Day 4 · Round 1',
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFFFFF] dark:bg-[#000000] border-b border-[#C4C4C4] dark:border-[#3D3D3D] px-4 py-2.5 transition-colors">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand mark with rising 3-block milestone icon */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-end gap-0.5 h-6 w-6 p-0.5" aria-hidden="true">
            <span className="w-1.5 h-2 bg-black dark:bg-white rounded-xs" />
            <span className="w-1.5 h-3.5 bg-black dark:bg-white rounded-xs" />
            <span className="w-1.5 h-5 bg-black dark:bg-white rounded-xs" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-black dark:text-white leading-none">
              Unlit
            </h1>
            <p className="text-[11px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5 leading-none">
              {dayGreeting}
            </p>
          </div>
        </div>

        {/* Right actions: Theme toggle and prominent SOS button */}
        <div className="flex items-center gap-2">
          {/* Day / Night quick toggle */}
          <button
            onClick={() => {
              Sound.tick();
              onToggleTheme();
            }}
            aria-label={`Switch to ${currentTheme === 'DAY' ? 'Night' : 'Day'} mode`}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95 transition"
          >
            {currentTheme === 'DAY' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* SOS button */}
          <button
            onClick={() => {
              Sound.tick();
              onOpenSos();
            }}
            aria-label="Open Craving SOS"
            className="h-10 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
