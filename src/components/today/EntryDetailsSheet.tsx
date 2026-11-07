import React, { useState } from 'react';
import { Entry } from '../../types';
import { Sound } from '../../data/sound';
import { X, Check, Clock, Smile, Frown, Meh, AlertCircle } from 'lucide-react';

interface EntryDetailsSheetProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntry: Entry) => void;
}

const COMMON_TRIGGERS = [
  { id: 'waking_up', label: 'Waking up' },
  { id: 'coffee_tea', label: 'Coffee or tea' },
  { id: 'after_meals', label: 'After meals' },
  { id: 'work_breaks', label: 'Work breaks' },
  { id: 'stress', label: 'Stress' },
  { id: 'boredom', label: 'Boredom' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'friends_smoke', label: 'Friends smoking' },
  { id: 'driving', label: 'Driving' },
  { id: 'phone_scrolling', label: 'Phone scrolling' },
  { id: 'argument', label: 'After argument' },
  { id: 'late_night', label: 'Late at night' },
];

const MOOD_OPTIONS = [
  { value: 1, label: 'Very Low', icon: '😭' },
  { value: 2, label: 'Low', icon: '🙁' },
  { value: 3, label: 'Neutral', icon: '😐' },
  { value: 4, label: 'Good', icon: '🙂' },
  { value: 5, label: 'Great', icon: '😊' },
];

export const EntryDetailsSheet: React.FC<EntryDetailsSheetProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(entry.triggers || []);
  const [mood, setMood] = useState<number | undefined>(entry.mood);
  const [cravingStrength, setCravingStrength] = useState<number>(entry.cravingStrength || 5);
  const [note, setNote] = useState<string>(entry.note || '');
  const [customTime, setCustomTime] = useState<string>(() => {
    const d = new Date(entry.timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  if (!isOpen) return null;

  const toggleTrigger = (triggerId: string) => {
    Sound.tick();
    setSelectedTriggers((prev) =>
      prev.includes(triggerId) ? prev.filter((t) => t !== triggerId) : [...prev, triggerId]
    );
  };

  const handleSave = () => {
    Sound.tick();
    // Parse custom time if modified
    let newTimestamp = entry.timestamp;
    if (customTime) {
      const [h, m] = customTime.split(':').map(Number);
      const d = new Date(entry.timestamp);
      d.setHours(h, m, 0, 0);
      newTimestamp = d.getTime();
    }

    onSave({
      ...entry,
      timestamp: newTimestamp,
      triggers: selectedTriggers,
      mood,
      cravingStrength,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#141414] border-t sm:border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl text-black dark:text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#C4C4C4] dark:border-[#3D3D3D] mb-4">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              Log Details
            </h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
              Optional context helps identify your patterns over time
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-center hover:bg-[#F2F2F2] dark:hover:bg-[#262626] active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Time Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
              Time Logged
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-mono font-bold text-black dark:text-white"
              />
              <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                Defaults to exact moment logged
              </span>
            </div>
          </div>

          {/* Trigger Chips */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1.5">
              What triggered it? (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TRIGGERS.map((t) => {
                const isSelected = selectedTriggers.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTrigger(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                        : 'bg-[#F2F2F2] dark:bg-[#262626] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood 1 to 5 (Faces) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1.5">
              How were you feeling?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    Sound.tick();
                    setMood(m.value);
                  }}
                  className={`p-2 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    mood === m.value
                      ? 'border-black dark:border-white bg-[#E2E2E2] dark:bg-[#262626] ring-2 ring-black dark:ring-white'
                      : 'border-[#C4C4C4] dark:border-[#3D3D3D] bg-[#F2F2F2] dark:bg-[#141414]'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[10px] font-bold text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Craving Strength 1 to 10 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
                Craving Intensity: {cravingStrength}/10
              </label>
              <span className="text-[11px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6]">
                {cravingStrength <= 3 ? 'Mild' : cravingStrength <= 7 ? 'Moderate' : 'Severe'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const val = idx + 1;
                const isSelected = val <= cravingStrength;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      Sound.tick();
                      setCravingStrength(val);
                    }}
                    className={`flex-1 h-8 rounded-xs font-bold text-xs transition ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-[#C4C4C4] dark:bg-[#3D3D3D] text-transparent'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
              Personal Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was happening around you?"
              className="w-full p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs text-black dark:text-white placeholder-[#5E5E5E] dark:placeholder-[#A6A6A6]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-bold text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#262626] active:scale-95 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
