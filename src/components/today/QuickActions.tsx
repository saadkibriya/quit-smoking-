import React, { useRef, useState } from 'react';
import { Wind, Clock, SlidersHorizontal } from 'lucide-react';
import { Sound } from '../../data/sound';
import { Entry, HabitMode } from '../../types';

interface QuickActionsProps {
  onLogCigarette: (entryData?: Partial<Entry>) => void;
  onOpenSos: () => void;
  onOpenLogSheet: () => void;
  onOpenCustomize?: () => void;
  mode: HabitMode;
  confirmBeforeLog?: boolean;
}

/**
 * The two things you actually do in this app, both one thumb away:
 * ride out an urge, or log a cigarette honestly.
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  onLogCigarette,
  onOpenSos,
  onOpenLogSheet,
  onOpenCustomize,
  confirmBeforeLog = false,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      Sound.doubleTick();
      onOpenLogSheet();
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSmokedClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (confirmBeforeLog) {
      setShowConfirmModal(true);
      return;
    }
    Sound.tick();
    onLogCigarette();
  };

  return (
    <div className="w-full space-y-3 my-3">
      {/* Primary: the most useful button in the app */}
      <button
        onClick={() => {
          Sound.tick();
          onOpenSos();
        }}
        aria-label="Open craving help: breathing and tools to get through the urge"
        className="w-full h-18 px-5 rounded-3xl bg-white dark:bg-[#141414] text-black dark:text-white border border-[#C4C4C4] dark:border-[#2A2A2A] flex items-center justify-between shadow-xs active:scale-[0.99] transition-all select-none hover:bg-neutral-100 dark:hover:bg-[#1C1C1C]"
      >
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-tight">
              Ride out a craving
            </span>
            <span className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] font-medium leading-tight block mt-0.5">
              Two minutes usually outlasts the urge
            </span>
          </div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/30" />
      </button>

      {/* Secondary: honest logging, instant */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSmokedClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          aria-label="I smoked: logs it now and restarts your timer"
          className="flex-1 h-16 px-4 rounded-3xl bg-transparent border-2 border-[#D71921] text-black dark:text-white flex items-center justify-between active:scale-[0.99] transition-all select-none hover:bg-[#D71921]/5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D71921]/15 flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-[#D71921]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight block text-[#D71921] leading-tight">
                I smoked
              </span>
              <span className="text-[11px] text-[#8A8A8A] font-medium leading-tight block mt-0.5">
                Logs now · hold for an earlier time
              </span>
            </div>
          </div>
        </button>

        {/* Explicit entry point for backdating and context */}
        <button
          onClick={() => {
            Sound.tick();
            onOpenLogSheet();
          }}
          aria-label="Log a cigarette at a different time, with triggers"
          title="Log with time and context"
          className="h-16 w-12 rounded-3xl border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-center text-[#8A8A8A] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition shrink-0"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {onOpenCustomize && (
        <div className="text-center pt-1 pb-0.5">
          <button
            onClick={() => {
              Sound.tick();
              onOpenCustomize();
            }}
            className="text-xs font-semibold text-[#8A8A8A] hover:text-black dark:hover:text-white underline underline-offset-4 decoration-[#8A8A8A]/50 transition-colors py-1 px-3 inline-flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Customize home
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-6 w-full max-w-sm text-black dark:text-white shadow-2xl">
            <h4 className="font-bold text-base mb-1">Log a cigarette?</h4>
            <p className="text-xs text-[#8A8A8A] mb-5">
              This restarts your current timer. Every smoke-free day, saved coin and badge you already earned
              stays exactly where it is.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-11 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-bold hover:bg-[#F2F2F2] dark:hover:bg-[#262626] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  Sound.tick();
                  onLogCigarette();
                }}
                className="flex-1 h-11 rounded-full bg-[#D71921] text-white text-xs font-bold"
              >
                Yes, log it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
