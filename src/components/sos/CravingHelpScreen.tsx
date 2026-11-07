import React, { useState, useEffect } from 'react';
import { UserPlan, ToolStat } from '../../types';
import { Sound } from '../../data/sound';
import {
  X,
  Wind,
  Sparkles,
  Heart,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CravingHelpScreenProps {
  plan: UserPlan;
  toolStats?: ToolStat[];
  onClose: () => void;
  onCravingBeaten: (durationSeconds: number, toolUsed?: string) => void;
  onSmokedDuringCraving: () => void;
  onRecordToolFeedback?: (toolId: string, helped: boolean) => void;
}

type BreathingPattern = '4-6' | '4-4-4-4' | '4-7-8';

const DISTRACTION_TASKS = [
  'Drink a tall glass of cold water slowly.',
  'Take a 2-minute brisk walk outside or down the hall.',
  'Text a close friend or call your support person.',
  'Wash your face with cold water.',
  'Chew a piece of strong cinnamon or mint gum.',
  'Do 10 slow shoulder rolls and stretch your neck.',
  'Brush your teeth thoroughly for 2 minutes.',
  'Name 5 things you can see, 4 you can touch, and 3 you can hear.',
];

export const CravingHelpScreen: React.FC<CravingHelpScreenProps> = ({
  plan,
  onClose,
  onCravingBeaten,
  onSmokedDuringCraving,
}) => {
  // 3-minute countdown in seconds (180s)
  const [countdown, setCountdown] = useState(180);
  const [elapsedTotal, setElapsedTotal] = useState(0);

  // Breathing configuration
  const [pattern, setPattern] = useState<BreathingPattern>(
    (plan.breathingPattern === '4-4-4-4 box' ? '4-4-4-4' : plan.breathingPattern === '4-7-8' ? '4-7-8' : '4-6')
  );
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);

  // Bottom sheets / options
  const [activeExtra, setActiveExtra] = useState<'distract' | 'reasons' | 'pattern' | null>(null);
  const [randomTask, setRandomTask] = useState(DISTRACTION_TASKS[0]);
  const [showOutcome, setShowOutcome] = useState(false);
  const [showStillStrongTips, setShowStillStrongTips] = useState(false);

  // 1-second interval for 3:00 timer and breathing animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setShowOutcome(true);
          return 0;
        }
        return c - 1;
      });
      setElapsedTotal((e) => e + 1);

      // Phase countdown
      setPhaseSecondsLeft((sec) => {
        if (sec <= 1) {
          // Switch phase based on pattern
          if (pattern === '4-6') {
            if (phase === 'Inhale') {
              setPhase('Exhale');
              Sound.tick();
              Sound.breathingTone(false);
              return 6;
            } else {
              setPhase('Inhale');
              Sound.tick();
              Sound.breathingTone(true);
              return 4;
            }
          } else if (pattern === '4-4-4-4') {
            if (phase === 'Inhale') {
              setPhase('Hold');
              Sound.tick();
              return 4;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              Sound.tick();
              Sound.breathingTone(false);
              return 4;
            } else {
              setPhase('Inhale');
              Sound.tick();
              Sound.breathingTone(true);
              return 4;
            }
          } else {
            // 4-7-8
            if (phase === 'Inhale') {
              setPhase('Hold');
              Sound.tick();
              return 7;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              Sound.tick();
              Sound.breathingTone(false);
              return 8;
            } else {
              setPhase('Inhale');
              Sound.tick();
              Sound.breathingTone(true);
              return 4;
            }
          }
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pattern, phase]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handlePickRandomTask = () => {
    Sound.tick();
    const next = DISTRACTION_TASKS[Math.floor(Math.random() * DISTRACTION_TASKS.length)];
    setRandomTask(next);
  };

  const handleStillStrong = () => {
    Sound.tick();
    setCountdown(180);
    setShowOutcome(false);
    setShowStillStrongTips(true);
  };

  // Breathing animation scale (0 to 1)
  const isInhaling = phase === 'Inhale';
  const isHolding = phase === 'Hold';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Craving Help"
      className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#8A8A8A] block">
            CRAVING HELP
          </span>
          <span className="text-xs font-semibold text-white">
            {pattern === '4-6' ? '4-in / 6-out pacing' : pattern === '4-4-4-4' ? '4-4-4-4 Box breathing' : '4-7-8 Deep breath'}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close craving help"
          className="w-10 h-10 rounded-full border border-[#2A2A2A] flex items-center justify-center hover:bg-[#141414] active:scale-95 transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Center Area: Animated Dot Circle + Countdown */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-4">
        {/* Animated Dot Circle */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
          {/* Outer dot ring outline */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#3D3D3D] opacity-40 animate-spin-slow" />

          {/* Animated breathing pulse circle */}
          <div
            style={{
              transitionDuration: isInhaling ? '4000ms' : isHolding ? '1000ms' : '6000ms',
            }}
            className={`rounded-full border-2 border-white flex items-center justify-center transition-all ease-in-out ${
              isInhaling
                ? 'w-60 h-60 bg-white/10 scale-100'
                : isHolding
                ? 'w-60 h-60 bg-white/15 scale-100'
                : 'w-28 h-28 bg-white/5 scale-75'
            }`}
          >
            {/* Center dot pattern core */}
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-xl sm:text-2xl font-bold tracking-tight uppercase">
                {phase === 'Inhale' ? 'Breathe in…' : phase === 'Hold' ? 'Hold…' : 'Breathe out…'}
              </span>
              <span className="text-xs font-mono text-[#8A8A8A] mt-1">
                {phaseSecondsLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* 3:00 Visible Countdown in Doto Font */}
        <div className="text-center">
          <div className="font-doto text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums">
            {formattedCountdown}
          </div>
          <p className="text-xs text-[#8A8A8A] mt-1.5 font-medium">
            Cravings usually pass in 3–5 minutes.
          </p>
        </div>

        {/* 4 D's Tips if user selected 'Still strong' */}
        {showStillStrongTips && (
          <div className="w-full mt-4 p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] text-xs space-y-1 animate-in slide-in-from-bottom duration-200">
            <span className="font-bold text-white block">The 4 D's Strategy:</span>
            <p className="text-[#8A8A8A]">
              • <strong className="text-white">Delay:</strong> Wait 5 minutes before deciding.<br />
              • <strong className="text-white">Distract:</strong> Move to a different room or task.<br />
              • <strong className="text-white">Deep breath:</strong> Slow exhalations relax your chest.<br />
              • <strong className="text-white">Drink water:</strong> Slowly sip cold water.
            </p>
          </div>
        )}
      </div>

      {/* Outcome Sheet Trigger / End Question */}
      {showOutcome ? (
        <div className="w-full max-w-md mx-auto p-4 rounded-3xl bg-[#141414] border border-[#2A2A2A] shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
          <div className="text-center">
            <h4 className="text-base font-extrabold text-white">Did the urge pass?</h4>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Riding out an urge builds psychological resistance for next time.
            </p>
          </div>

          <div className="space-y-2">
            {/* Yes, it passed (Primary white) */}
            <button
              onClick={() => {
                Sound.celebrate();
                onCravingBeaten(elapsedTotal, 'breathing');
                onClose();
              }}
              className="w-full h-13 rounded-2xl bg-white text-black font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Check className="w-4 h-4 text-black" />
              <span>Yes, it passed</span>
            </button>

            {/* Still strong */}
            <button
              onClick={handleStillStrong}
              className="w-full h-11 rounded-2xl border border-[#3D3D3D] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#262626] active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Still strong (3 more mins)</span>
            </button>

            {/* I smoked (Red Accent) */}
            <button
              onClick={() => {
                Sound.tick();
                onSmokedDuringCraving();
                onClose();
              }}
              className="w-full h-11 rounded-2xl border border-[#D71921] text-[#D71921] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#D71921]/10 active:scale-95 transition"
            >
              <span>I smoked</span>
            </button>
          </div>
        </div>
      ) : (
        /* Bottom Control Bar: Small Options */
        <div className="w-full max-w-md mx-auto space-y-2.5 pb-2">
          {/* Active Extra Drawer if open */}
          {activeExtra === 'distract' && (
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-2.5 animate-in slide-in-from-bottom duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Distract Me
                </span>
                <button
                  onClick={() => setActiveExtra(null)}
                  className="text-xs text-[#8A8A8A] hover:text-white"
                >
                  Close
                </button>
              </div>
              <p className="text-sm font-semibold text-white bg-[#262626] p-3 rounded-xl border border-[#3D3D3D]">
                "{randomTask}"
              </p>
              <button
                onClick={handlePickRandomTask}
                className="w-full h-9 rounded-xl border border-[#3D3D3D] text-xs font-bold text-white hover:bg-[#262626]"
              >
                Another task
              </button>
            </div>
          )}

          {activeExtra === 'reasons' && (
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-2 animate-in slide-in-from-bottom duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  My Reasons
                </span>
                <button
                  onClick={() => setActiveExtra(null)}
                  className="text-xs text-[#8A8A8A] hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 py-1">
                {(plan.reasons || ['Health', 'Freedom', 'Money']).map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[#262626] border border-[#3D3D3D] text-white capitalize"
                  >
                    {r.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              {plan.whyPhotoUrl && (
                <img
                  src={plan.whyPhotoUrl}
                  alt="My Why anchor"
                  className="w-full h-28 object-cover rounded-xl filter grayscale border border-[#3D3D3D]"
                />
              )}
            </div>
          )}

          {activeExtra === 'pattern' && (
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-2 animate-in slide-in-from-bottom duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Breathing Pattern
                </span>
                <button
                  onClick={() => setActiveExtra(null)}
                  className="text-xs text-[#8A8A8A] hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '4-6', label: '4-in / 6-out' },
                  { id: '4-4-4-4', label: 'Box 4-4-4-4' },
                  { id: '4-7-8', label: '4-7-8 Relax' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      Sound.tick();
                      setPattern(opt.id as BreathingPattern);
                      setPhase('Inhale');
                      setPhaseSecondsLeft(4);
                      setActiveExtra(null);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      pattern === opt.id
                        ? 'bg-white text-black border-white'
                        : 'bg-[#262626] border-[#3D3D3D] text-white hover:border-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Three Small Options at Bottom */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                Sound.tick();
                setActiveExtra(activeExtra === 'distract' ? null : 'distract');
              }}
              className="h-10 rounded-xl border border-[#2A2A2A] bg-[#141414] text-xs font-semibold text-white hover:border-white active:scale-95 transition"
            >
              Distract me
            </button>
            <button
              onClick={() => {
                Sound.tick();
                setActiveExtra(activeExtra === 'reasons' ? null : 'reasons');
              }}
              className="h-10 rounded-xl border border-[#2A2A2A] bg-[#141414] text-xs font-semibold text-white hover:border-white active:scale-95 transition"
            >
              My reasons
            </button>
            <button
              onClick={() => {
                Sound.tick();
                setActiveExtra(activeExtra === 'pattern' ? null : 'pattern');
              }}
              className="h-10 rounded-xl border border-[#2A2A2A] bg-[#141414] text-xs font-semibold text-white hover:border-white active:scale-95 transition"
            >
              Change breathing
            </button>
          </div>

          {/* Early Outcome Button */}
          <button
            onClick={() => {
              Sound.tick();
              setShowOutcome(true);
            }}
            className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <span>Did the urge pass?</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Also export as CravingSosModal for backward compatibility
export const CravingSosModal = CravingHelpScreen;
