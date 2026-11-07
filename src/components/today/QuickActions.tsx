import React, { useState, useRef } from 'react';
import { Wind, Flame, Clock, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Sound } from '../../data/sound';
import { Entry, HabitMode } from '../../types';

interface QuickActionsProps {
  onLogCigarette: (entryData?: Partial<Entry>) => void;
  onOpenSos: () => void;
  onOpenCustomize?: () => void;
  mode: HabitMode;
  confirmBeforeLog?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onLogCigarette,
  onOpenSos,
  onOpenCustomize,
  mode,
  confirmBeforeLog = false,
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [manualTime, setManualTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [manualTriggers, setManualTriggers] = useState<string[]>([]);
  const [manualMood, setManualMood] = useState<number>(3);
  const [manualStrength, setManualStrength] = useState<number>(6);
  const [manualNote, setManualNote] = useState<string>('');

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      Sound.doubleTick();
      setShowManualModal(true);
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

  const submitManual = () => {
    Sound.tick();
    const [hours, minutes] = manualTime.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);

    onLogCigarette({
      timestamp: d.getTime(),
      manualEntry: true,
      triggers: manualTriggers,
      mood: manualMood,
      cravingStrength: manualStrength,
      note: manualNote.trim() || undefined,
    });
    setShowManualModal(false);
  };

  const triggerOptions = [
    { id: 'stress', label: 'Stress' },
    { id: 'coffee_tea', label: 'Coffee / Tea' },
    { id: 'after_meals', label: 'After Meals' },
    { id: 'alcohol', label: 'Alcohol' },
    { id: 'work_breaks', label: 'Work Break' },
    { id: 'friends_who_smoke', label: 'Friends' },
    { id: 'boredom', label: 'Boredom' },
  ];

  return (
    <div className="w-full space-y-3 my-3">
      {/* 4. Primary Button: Large, White, Full Width (min 64dp / h-18) */}
      <button
        onClick={() => {
          Sound.tick();
          onOpenSos();
        }}
        aria-label="Open craving help: 3-minute breathing to get through the urge"
        className="w-full h-18 px-5 rounded-3xl bg-white text-black flex items-center justify-between shadow-xs active:scale-[0.99] transition-all select-none hover:bg-neutral-100"
      >
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight block text-black leading-tight">
              Ride out a craving
            </span>
            <span className="text-xs text-[#5E5E5E] font-medium leading-tight block mt-0.5">
              3-minute breathing to get through the urge
            </span>
          </div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
      </button>

      {/* 5. Secondary Button: Outlined in red #D71921 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSmokedClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          aria-label="I smoked: Logs it and restarts your timer"
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
                Logs it and restarts your timer
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#8A8A8A] font-mono shrink-0 hidden sm:inline">
            Hold to backdate
          </span>
        </button>

        {/* Small button to log earlier time explicitly */}
        <button
          onClick={() => setShowManualModal(true)}
          aria-label="Log a cigarette at a different time"
          title="Log earlier cigarette"
          className="h-16 w-12 rounded-3xl border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-center text-[#8A8A8A] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition shrink-0"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* 6. Text Link: "Customize home" */}
      {onOpenCustomize && (
        <div className="text-center pt-1 pb-0.5">
          <button
            onClick={() => {
              Sound.tick();
              onOpenCustomize();
            }}
            className="text-xs font-semibold text-[#8A8A8A] hover:text-black dark:hover:text-white underline underline-offset-4 decoration-[#8A8A8A]/50 transition-colors py-1 px-3"
          >
            Customize home
          </button>
        </div>
      )}

      {/* Confirmation modal before logging if confirmBeforeLog is active */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#3D3D3D] rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h4 className="font-bold text-base mb-1">Log a cigarette?</h4>
            <p className="text-xs text-[#8A8A8A] mb-5">
              This will restart your current timer. All previous smoke-free days and money saved remain intact.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-11 rounded-full border border-[#3D3D3D] text-xs font-bold hover:bg-[#262626]"
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

      {/* Manual Earlier Log Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-black dark:text-white mb-1">
              Log Earlier Cigarette
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#8A8A8A] mb-4">
              Honest data powers better support. Select the time you smoked:
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black dark:text-white block mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black dark:text-white block mb-1.5">
                  Triggers (optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {triggerOptions.map((trig) => {
                    const isSelected = manualTriggers.includes(trig.id);
                    return (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => {
                          Sound.tick();
                          setManualTriggers((prev) =>
                            isSelected ? prev.filter((t) => t !== trig.id) : [...prev, trig.id]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold'
                            : 'bg-transparent text-[#5E5E5E] dark:text-[#8A8A8A] border-[#C4C4C4] dark:border-[#3D3D3D]'
                        }`}
                      >
                        {trig.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black dark:text-white block mb-1">
                  Craving intensity (1-10): {manualStrength}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={manualStrength}
                  onChange={(e) => setManualStrength(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black dark:text-white block mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tough phone call, after lunch"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs text-black dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="flex-1 h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#262626]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitManual}
                className="flex-1 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
