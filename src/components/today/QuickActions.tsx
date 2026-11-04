import React, { useState, useRef } from 'react';
import { Flame, ShieldAlert, Plus, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { Sound } from '../../data/sound';
import { Entry, HabitMode } from '../../types';

interface QuickActionsProps {
  onLogCigarette: (entryData?: Partial<Entry>) => void;
  onOpenSos: () => void;
  mode: HabitMode;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onLogCigarette,
  onOpenSos,
  mode,
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
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
    }, 600); // 600ms long press threshold
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
    <div className="w-full">
      {/* Two Big Primary Buttons Side by Side (min 64dp / h-16 tall) */}
      <div className="grid grid-cols-2 gap-3 my-3">
        {/* "I smoked" Button */}
        <button
          onClick={handleSmokedClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          aria-label="I smoked (Tap to log now, hold for earlier time)"
          className="h-18 px-4 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border-2 border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs group hover:border-black dark:hover:border-white select-none"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-black dark:text-white" />
            <span className="font-extrabold text-base tracking-tight">I smoked</span>
          </div>
          <span className="text-[11px] font-medium text-[#5E5E5E] dark:text-[#A6A6A6]">
            One tap · Hold for earlier
          </span>
        </button>

        {/* "Craving" Button */}
        <button
          onClick={() => {
            Sound.tick();
            onOpenSos();
          }}
          aria-label="Craving SOS (Instant craving help)"
          className="h-18 px-4 rounded-3xl bg-black dark:bg-white text-white dark:text-black flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-sm select-none"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-extrabold text-base tracking-tight">Craving</span>
          </div>
          <span className="text-[11px] font-medium opacity-80">
            Ride the urge wave
          </span>
        </button>
      </div>

      {/* Manual Earlier Log Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-black dark:text-white mb-1">
              Log Earlier Cigarette
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-4">
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
                            : 'bg-transparent text-[#5E5E5E] dark:text-[#A6A6A6] border-[#C4C4C4] dark:border-[#3D3D3D]'
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
