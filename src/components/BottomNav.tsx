import React from 'react';
import { Calendar, Compass, Wrench } from 'lucide-react';
import { Sound } from '../data/sound';

export type TabId = 'today' | 'journey' | 'toolkit';

interface BottomNavProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'today', label: 'Today', icon: <Calendar className="w-5 h-5" /> },
    { id: 'journey', label: 'Journey', icon: <Compass className="w-5 h-5" /> },
    { id: 'toolkit', label: 'Toolkit', icon: <Wrench className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] transition-colors"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-3 h-16 items-center px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                Sound.tick();
                onChangeTab(tab.id);
              }}
              aria-selected={isActive}
              role="tab"
              className="flex flex-col items-center justify-center h-full gap-1 active:scale-95 transition"
            >
              <div
                className={`flex items-center justify-center px-4 py-1 rounded-full transition-colors ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                    : 'text-[#5E5E5E] dark:text-[#A6A6A6] hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[11px] tracking-tight leading-none ${
                  isActive
                    ? 'font-bold text-black dark:text-white'
                    : 'font-medium text-[#5E5E5E] dark:text-[#A6A6A6]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
