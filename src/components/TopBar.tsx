import React from 'react';
import { ShieldAlert, Sun, Moon, Sparkles, Smartphone, LayoutGrid } from 'lucide-react';
import { UserPlan } from '../types';
import { Sound } from '../data/sound';

interface TopBarProps {
  plan: UserPlan;
  currentTheme: 'DAY' | 'NIGHT';
  onToggleTheme: () => void;
  onOpenSos: () => void;
  onOpenLauncher?: () => void;
  dayGreeting?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  plan,
  currentTheme,
  onToggleTheme,
  onOpenSos,
  onOpenLauncher,
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

        {/* Right actions: Launcher button, theme toggle, and craving button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Launcher & Widget quick open */}
          {onOpenLauncher && (
            <button
              onClick={() => {
                Sound.tick();
                onOpenLauncher();
              }}
              aria-label="Open Nothing OS Launcher and Widgets"
              title="Nothing OS Home Screen & Widgets"
              className="h-10 px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95 transition text-xs font-bold"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launcher</span>
            </button>
          )}

          {/* Day / Night quick toggle */}
          <button
            onClick={() => {
              Sound.tick();
              onToggleTheme();
            }}
            aria-label={`Switch to ${currentTheme === 'DAY' ? 'Night' : 'Day'} mode`}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95 transition shrink-0"
          >
            {currentTheme === 'DAY' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* Craving button */}
          <button
            onClick={() => {
              Sound.tick();
              onOpenSos();
            }}
            aria-label="Open craving help"
            className="h-10 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <span className="w-2 h-2 rounded-full border border-current flex items-center justify-center animate-pulse" />
            <span>Craving</span>
          </button>
        </div>
      </div>
    </header>
  );
};
