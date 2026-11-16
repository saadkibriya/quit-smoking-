import React, { useEffect, useMemo, useState } from 'react';
import { UserPlan, Entry } from '../../types';
import { calculatePaceProfile, formatGapMinutes } from '../../domain/pacing';
import { Sound } from '../../data/sound';
import { X, Clock, Check, Wind } from 'lucide-react';

interface SmokeLogSheetProps {
  isOpen: boolean;
  plan: UserPlan;
  entries: Entry[];
  onClose: () => void;
  onSubmit: (data: Partial<Entry>) => void;
  onResisted?: () => void;
}

const TIME_CHIPS: Array<{ label: string; minutes: number | 'custom' }> = [
  { label: 'Now', minutes: 0 },
  { label: '10m', minutes: 10 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: 'Earlier', minutes: 'custom' },
];

const TRIGGERS: Array<{ id: string; label: string }> = [
  { id: 'stress', label: 'Stress' },
  { id: 'coffee_tea', label: 'Coffee' },
  { id: 'after_meals', label: 'After meal' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'work_breaks', label: 'Work break' },
  { id: 'friends_who_smoke', label: 'Friends' },
  { id: 'boredom', label: 'Boredom' },
  { id: 'driving', label: 'Driving' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Fast, honest logging. One tap for "now", one tap for the nearest time bucket,
 * optional context. The sheet also tells you, before you save, whether this entry
 * shortens or widens your gap — so the input itself teaches the habit.
 */
export const SmokeLogSheet: React.FC<SmokeLogSheetProps> = ({
  isOpen,
  plan,
  entries,
  onClose,
  onSubmit,
  onResisted,
}) => {
  const [offset, setOffset] = useState<number | 'custom'>(0);
  const [customTime, setCustomTime] = useState(() => {
    const d = new Date(Date.now() - 30 * 60000);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [triggers, setTriggers] = useState<string[]>([]);
  const [strength, setStrength] = useState(5);
  const [note, setNote] = useState('');

  // Reset the quick state each time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      setOffset(0);
      setTriggers([]);
      setStrength(5);
      setNote('');
    }
  }, [isOpen]);

  const profile = calculatePaceProfile(entries, plan);

  const timestamp = useMemo(() => {
    if (offset === 'custom') {
      const [h, m] = customTime.split(':').map(Number);
      const d = new Date();
      d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
      // A "future" time almost always means last night, not tomorrow.
      if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1);
      return d.getTime();
    }
    return Date.now() - offset * 60000;
  }, [offset, customTime]);

  if (!isOpen) return null;

  const prospectiveGapMinutes =
    profile.lastCigaretteMs !== null ? Math.round((timestamp - profile.lastCigaretteMs) / 60000) : null;

  const comparison =
    prospectiveGapMinutes === null
      ? null
      : prospectiveGapMinutes - profile.targetMinutes;

  const clockLabel = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const toggleTrigger = (id: string) => {
    Sound.tick();
    setTriggers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    Sound.tick();
    onSubmit({
      timestamp,
      manualEntry: offset !== 0,
      triggers,
      cravingStrength: strength,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log a cigarette"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#0A0A0A] border-t sm:border border-[#C4C4C4] dark:border-[#2A2A2A] rounded-t-[28px] sm:rounded-[28px] p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight">Log it honestly</h3>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
              Truth makes the meter useful. No judgement here.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full border border-[#C4C4C4] dark:border-[#2A2A2A] flex items-center justify-center hover:bg-[#F2F2F2] dark:hover:bg-[#141414] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* When */}
        <div className="mt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A8A] block mb-2">
            When did you smoke?
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {TIME_CHIPS.map((chip) => {
              const active = offset === chip.minutes;
              return (
                <button
                  key={chip.label}
                  onClick={() => {
                    Sound.tick();
                    setOffset(chip.minutes);
                  }}
                  aria-pressed={active}
                  className={`h-11 rounded-2xl text-xs font-bold border transition active:scale-[0.98] ${
                    active
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'border-[#C4C4C4] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {offset === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8A8A8A] shrink-0" />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="flex-1 h-11 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] font-mono text-sm font-bold"
              />
            </div>
          )}
        </div>

        {/* Live pace preview */}
        <div className="mt-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] px-3 py-2.5">
          <p className="text-[11px] leading-snug">
            <span className="font-bold">{clockLabel}</span>
            {prospectiveGapMinutes !== null && prospectiveGapMinutes > 0 ? (
              <>
                {' '}· {formatGapMinutes(prospectiveGapMinutes)} after your last one.{' '}
                <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  {comparison !== null && comparison >= 0
                    ? `That is ${formatGapMinutes(comparison)} wider than your ${formatGapMinutes(
                        profile.targetMinutes
                      )} target — a stretch win.`
                    : `That is ${formatGapMinutes(Math.abs(comparison || 0))} short of your ${formatGapMinutes(
                        profile.targetMinutes
                      )} target.`}
                </span>
              </>
            ) : (
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                {' '}· first cigarette the meter will learn from.
              </span>
            )}
          </p>
        </div>

        {/* Triggers */}
        <div className="mt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A8A] block mb-2">
            What pulled? (optional, multi-select)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TRIGGERS.map((t) => {
              const active = triggers.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTrigger(t.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
                    active
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold'
                      : 'border-[#C4C4C4] dark:border-[#2A2A2A] text-[#5E5E5E] dark:text-[#A6A6A6]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A8A]">
              Urge strength
            </span>
            <span className="font-doto font-bold text-sm">{strength}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            aria-label="Urge strength out of ten"
            className="w-full accent-black dark:accent-white"
          />
        </div>

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="One line of context (optional)"
          className="mt-3 w-full h-11 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#2A2A2A] text-xs"
        />

        <button
          onClick={handleSubmit}
          className="mt-4 w-full h-14 rounded-full bg-[#D71921] text-white font-bold text-sm active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Log at {clockLabel}
        </button>

        {onResisted && (
          <button
            onClick={() => {
              Sound.tick();
              onResisted();
              onClose();
            }}
            className="mt-2 w-full h-12 rounded-full border border-[#C4C4C4] dark:border-[#2A2A2A] text-xs font-bold flex items-center justify-center gap-2 hover:border-black dark:hover:border-white transition"
          >
            <Wind className="w-4 h-4" />
            Actually — I rode it out
          </button>
        )}
      </div>
    </div>
  );
};
