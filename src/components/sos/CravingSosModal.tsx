import React, { useState, useEffect, useRef } from 'react';
import { UserPlan, ToolStat } from '../../types';
import { getRankedCopingTools, CopingTool } from '../../domain/rulesEngine';
import { Sound } from '../../data/sound';
import {
  X,
  Wind,
  Film,
  Heart,
  Clock,
  Activity,
  Phone,
  Gamepad2,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface CravingSosModalProps {
  plan: UserPlan;
  toolStats: ToolStat[];
  onClose: () => void;
  onCravingBeaten: (durationSeconds: number, toolUsed?: string) => void;
  onSmokedDuringCraving: () => void;
  onRecordToolFeedback: (toolId: string, helped: boolean) => void;
}

export const CravingSosModal: React.FC<CravingSosModalProps> = ({
  plan,
  toolStats,
  onClose,
  onCravingBeaten,
  onSmokedDuringCraving,
  onRecordToolFeedback,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [toolFeedbackGiven, setToolFeedbackGiven] = useState<Record<string, boolean>>({});
  const [showExitQuestion, setShowExitQuestion] = useState(false);

  // Paced breathing state (Inhale 4s, Hold 4s, Exhale 6s = 14s cycle)
  const [breathePhase, setBreathePhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breatheSeconds, setBreatheSeconds] = useState(4);

  // Delay 5 minutes countdown state
  const [delayRemaining, setDelayRemaining] = useState(300);

  // Tap game state (60s mini-game)
  const [gameScore, setGameScore] = useState(0);
  const [gameTargetIndex, setGameTargetIndex] = useState(4);
  const [gameActive, setGameActive] = useState(false);
  const [gameTimeLeft, setGameTimeLeft] = useState(60);

  // Count-up timer for the craving episode
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Breathing timer
  useEffect(() => {
    if (activeToolId !== 'breathe') return;
    const interval = setInterval(() => {
      setBreatheSeconds((prev) => {
        if (prev <= 1) {
          if (breathePhase === 'Inhale') {
            Sound.breathingTone(false);
            setBreathePhase('Hold');
            return 4;
          } else if (breathePhase === 'Hold') {
            Sound.breathingTone(false);
            setBreathePhase('Exhale');
            return 6;
          } else {
            Sound.breathingTone(true);
            setBreathePhase('Inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeToolId, breathePhase]);

  // Delay 5 min countdown
  useEffect(() => {
    if (activeToolId !== 'delay_5m') return;
    const timer = setInterval(() => {
      setDelayRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeToolId]);

  // Tap game logic
  useEffect(() => {
    if (activeToolId !== 'tap_game' || !gameActive) return;
    const timer = setInterval(() => {
      setGameTimeLeft((prev) => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
      // Move target randomly
      setGameTargetIndex(Math.floor(Math.random() * 9));
    }, 1200);
    return () => clearInterval(timer);
  }, [activeToolId, gameActive]);

  const rankedTools = getRankedCopingTools(plan, toolStats);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handlePassed = () => {
    Sound.celebrate();
    setShowExitQuestion(true);
  };

  const handleToolVote = (toolId: string, helped: boolean) => {
    Sound.tick();
    onRecordToolFeedback(toolId, helped);
    setToolFeedbackGiven((prev) => ({ ...prev, [toolId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white overflow-y-auto flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Bar with Close */}
      <div className="flex items-center justify-between max-w-xl mx-auto w-full pt-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#5E5E5E] dark:text-[#A6A6A6]">
            Craving SOS
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close SOS"
          className="w-10 h-10 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-center hover:bg-[#F2F2F2] dark:hover:bg-[#141414] active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto w-full my-auto py-4">
        {/* Urge Wave Animation & Count-Up Timer */}
        <div className="text-center mb-6">
          <div className="relative w-full h-28 max-w-xs mx-auto flex items-center justify-center">
            {/* SVG Parabolic Wave Visualization */}
            <svg
              viewBox="0 0 200 60"
              className="w-full h-full text-black dark:text-white opacity-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M 10 50 Q 60 50, 100 15 T 190 50"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle
                cx={Math.min(190, 10 + (elapsedSeconds % 120) * 1.5)}
                cy={
                  35 - Math.sin((Math.min(120, elapsedSeconds % 120) / 120) * Math.PI) * 20
                }
                r="4.5"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight mb-1">
            {formatTimer(elapsedSeconds)}
          </div>
          <p className="text-sm font-bold text-black dark:text-white">
            Cravings rise, peak and pass.
          </p>
          <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
            Most single urges naturally subside in a few minutes. Ride this one out.
          </p>

          {/* "It Passed" Primary CTA */}
          <button
            onClick={handlePassed}
            className="mt-4 px-8 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm tracking-wide shadow-sm active:scale-95 transition"
          >
            It passed · I beat it
          </button>
        </div>

        {/* Interactive Active Tool Modal / Card if selected */}
        {activeToolId && (
          <div className="my-4 p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border-2 border-black dark:border-white shadow-lg animate-in fade-in zoom-in-95 duration-150">
            {/* Breathe Tool */}
            {activeToolId === 'breathe' && (
              <div className="text-center py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
                  Paced 4-4-6 Breathing
                </span>
                <div className="w-24 h-24 mx-auto my-3 rounded-full border-4 border-black dark:border-white flex flex-col items-center justify-center transition-all duration-700">
                  <span className="text-lg font-black">{breathePhase}</span>
                  <span className="text-2xl font-bold font-mono">{breatheSeconds}s</span>
                </div>
                <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Slow breathing activates your vagus nerve and dampens acute craving anxiety.
                </p>
              </div>
            )}

            {/* Play the Tape Forward */}
            {activeToolId === 'play_tape' && (
              <div className="space-y-3 py-1 text-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
                  Play the Tape Forward
                </span>
                <div className="p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626]">
                  <p className="font-bold text-black dark:text-white">If I smoke right now:</p>
                  <p className="text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
                    The rush lasts 30 seconds. In 45 minutes, blood nicotine drops again, restarting the craving cycle, accompanied by disappointment.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626]">
                  <p className="font-bold text-black dark:text-white">If I wait 5 minutes:</p>
                  <p className="text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
                    This exact craving wave will fade away on its own. My dopamine receptors down-regulate, and tomorrow I will be proud.
                  </p>
                </div>
              </div>
            )}

            {/* My Why Anchor */}
            {activeToolId === 'my_why' && (
              <div className="text-center py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-2">
                  My Core Reasons
                </span>
                <div className="flex flex-wrap gap-2 justify-center my-2">
                  {plan.reasons.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold capitalize"
                    >
                      {r.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                {plan.whyPhotoUrl && (
                  <img
                    src={plan.whyPhotoUrl}
                    alt="My why"
                    className="max-h-40 mx-auto rounded-2xl mt-3 grayscale object-cover border border-[#C4C4C4] dark:border-[#3D3D3D]"
                  />
                )}
              </div>
            )}

            {/* Delay 5 Minutes */}
            {activeToolId === 'delay_5m' && (
              <div className="text-center py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
                  Delay 5 Minutes
                </span>
                <div className="text-4xl font-black font-mono my-2 tabular-nums">
                  {formatTimer(delayRemaining)}
                </div>
                <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
                  {delayRemaining === 0
                    ? 'Target reached! Notice how the sharp urge has already softened.'
                    : 'Just delay right now. You do not have to decide forever — just for these 5 minutes.'}
                </p>
              </div>
            )}

            {/* Do Something Else */}
            {activeToolId === 'do_something_else' && (
              <div className="space-y-2 py-1 text-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
                  Sensory Interruptions
                </span>
                {[
                  'Drink a tall glass of freezing ice water through a straw.',
                  'Chew strong mint or cinnamon gum.',
                  'Splash cold water on your face or hold an ice cube.',
                  'Take a quick 3-minute brisk walk outside or do 15 jumping jacks.',
                  'Brush your teeth with strong mint toothpaste.',
                ].map((act, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] font-medium"
                  >
                    • {act}
                  </div>
                ))}
              </div>
            )}

            {/* Call Person */}
            {activeToolId === 'call_person' && (
              <div className="text-center py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-2">
                  Call Support Person
                </span>
                {plan.supportContact?.phone ? (
                  <div>
                    <p className="text-base font-bold text-black dark:text-white mb-2">
                      {plan.supportContact.name || 'Support Contact'}
                    </p>
                    <a
                      href={`tel:${plan.supportContact.phone}`}
                      className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {plan.supportContact.phone}</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
                    <p>No contact saved yet. National quitline:</p>
                    <a
                      href="tel:1-800-784-8669"
                      className="inline-block mt-2 font-bold underline text-black dark:text-white"
                    >
                      1-800-QUIT-NOW (US) / 0300 123 1044 (UK)
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tap Game */}
            {activeToolId === 'tap_game' && (
              <div className="text-center py-1">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold">Score: {gameScore}</span>
                  <span className="font-mono text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {gameTimeLeft}s remaining
                  </span>
                </div>
                {!gameActive && gameTimeLeft === 60 ? (
                  <button
                    onClick={() => setGameActive(true)}
                    className="px-6 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                  >
                    Start 60-Second Game
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto my-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i === gameTargetIndex) {
                            Sound.tick();
                            setGameScore((s) => s + 1);
                            setGameTargetIndex(Math.floor(Math.random() * 9));
                          }
                        }}
                        className={`rounded-2xl transition-all ${
                          i === gameTargetIndex
                            ? 'bg-black dark:bg-white active:scale-90'
                            : 'bg-[#C4C4C4] dark:bg-[#3D3D3D] opacity-40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Did this tool help? */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
              <span className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
                Did this exercise help?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToolVote(activeToolId, true)}
                  className="px-2.5 py-1 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs flex items-center gap-1 hover:bg-[#E2E2E2] dark:hover:bg-[#262626]"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Yes</span>
                </button>
                <button
                  onClick={() => handleToolVote(activeToolId, false)}
                  className="px-2.5 py-1 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs flex items-center gap-1 hover:bg-[#E2E2E2] dark:hover:bg-[#262626]"
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>No</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coping Tools List */}
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] mb-2">
            Evidence-Based Coping Tools
          </p>
          <div className="space-y-2">
            {rankedTools.map((tool) => {
              const isSelected = activeToolId === tool.id;
              let icon = <Wind className="w-4 h-4" />;
              if (tool.id === 'play_tape') icon = <Film className="w-4 h-4" />;
              if (tool.id === 'my_why') icon = <Heart className="w-4 h-4" />;
              if (tool.id === 'delay_5m') icon = <Clock className="w-4 h-4" />;
              if (tool.id === 'do_something_else') icon = <Activity className="w-4 h-4" />;
              if (tool.id === 'call_person') icon = <Phone className="w-4 h-4" />;
              if (tool.id === 'tap_game') icon = <Gamepad2 className="w-4 h-4" />;

              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    Sound.tick();
                    setActiveToolId(isSelected ? null : tool.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white hover:border-black dark:hover:border-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{tool.name}</span>
                      <span className="text-[11px] opacity-75 block">{tool.description}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0">
                    {isSelected ? 'Active' : 'Open'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Outcome Confirmation Sheet */}
      {showExitQuestion && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-lg font-extrabold text-black dark:text-white mb-1">
              Did you smoke?
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-6">
              Honest tracking keeps your streak meaningful and accurate.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  Sound.celebrate();
                  onCravingBeaten(elapsedSeconds, activeToolId || undefined);
                  onClose();
                }}
                className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs tracking-wide active:scale-95 transition"
              >
                No, I beat it!
              </button>
              <button
                onClick={() => {
                  Sound.tick();
                  onSmokedDuringCraving();
                  onClose();
                }}
                className="w-full h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#262626]"
              >
                Yes, I had a cigarette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
