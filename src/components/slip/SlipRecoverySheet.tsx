import React, { useState } from 'react';
import { UserPlan, Entry } from '../../types';
import { calculateSmokeFreeDays, calculateMoneyKept, calculateAvoidedCigarettes } from '../../domain/calculations';
import { Sound } from '../../data/sound';
import { Shield, Sparkles, Check, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';

interface SlipRecoverySheetProps {
  plan: UserPlan;
  entries: Entry[];
  onComplete: (data: { trigger?: string; ifThenPlan?: string; restartRound?: boolean }) => void;
  onOpenCoach: () => void;
  onOpenSos: () => void;
}

export const SlipRecoverySheet: React.FC<SlipRecoverySheetProps> = ({
  plan,
  entries,
  onComplete,
  onOpenCoach,
  onOpenSos,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');
  const [chosenIfThen, setChosenIfThen] = useState<string>('');

  const now = Date.now();
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const avoided = calculateAvoidedCigarettes(entries, plan, now);
  const money = calculateMoneyKept(avoided, plan);

  // Check if >= 3 days in last 7 days had cigarettes
  const sevenDaysAgo = now - 7 * 86400 * 1000;
  const recentCigDays = new Set(
    entries
      .filter((e) => e.type === 'CIGARETTE' && e.timestamp >= sevenDaysAgo)
      .map((e) => new Date(e.timestamp).toDateString())
  ).size;

  const showFreshStartChoice = recentCigDays >= 3;

  const triggerSuggestions = [
    { id: 'stress', label: 'Stress or overwhelm' },
    { id: 'alcohol', label: 'Alcohol or night out' },
    { id: 'friends_who_smoke', label: 'Social pressure with smokers' },
    { id: 'after_meals', label: 'Right after a meal' },
    { id: 'boredom', label: 'Boredom / empty moment' },
    { id: 'coffee_tea', label: 'Coffee routine' },
  ];

  const ifThenOptions: Record<string, string[]> = {
    stress: [
      'If I feel sudden work or life stress, then I will immediately take 5 slow breaths and step outside.',
      'If stress hits, then I will text my support person before touching a lighter.',
    ],
    alcohol: [
      'If I go to a party with alcohol, then I will hold a sparkling water with lime in my smoking hand.',
      'If friends step outside to smoke, then I will stay inside and talk to someone else.',
    ],
    friends_who_smoke: [
      'If someone offers a cigarette, then I will smile and say: "No thanks, I quit."',
      'If people around me light up, then I will take 3 sips of ice water and step away.',
    ],
  };

  const currentIfThens = ifThenOptions[selectedTrigger] || [
    'If this exact trigger happens again, then I will delay 5 minutes and drink a tall glass of ice water.',
    'If I feel the urge rise, then I will open Craving SOS and do the 4-4-6 paced breathing.',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#141414] border-t sm:border border-[#C4C4C4] dark:border-[#3D3D3D] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 text-black dark:text-white">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-black dark:text-white" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6]">
              Slip Recovery Protocol (Step {step} of 4)
            </span>
          </div>
          <button
            onClick={() => onComplete({ trigger: selectedTrigger, ifThenPlan: chosenIfThen })}
            className="text-xs font-semibold text-[#5E5E5E] dark:text-[#A6A6A6] hover:text-black dark:hover:text-white"
          >
            Skip all
          </button>
        </div>

        {/* STEP 1: Non-punitive Validation */}
        {step === 1 && (
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2">
              Slip logged. Your {smokeFree.completedSmokeFreeDays} smoke-free days still count.
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-4">
              A lapse is a data point, never a failure. In science (the Russell Standard), early slips are expected and accounted for. Your streak resets, but your progress is permanent.
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] mb-5 text-center">
              <div>
                <span className="text-lg font-bold tabular-nums">
                  {smokeFree.completedSmokeFreeDays}
                </span>
                <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">Days Clean</p>
              </div>
              <div>
                <span className="text-lg font-bold tabular-nums flex items-baseline justify-center">
                  <span className="font-sans font-bold text-sm mr-0.5 text-[#8A8A8A]">{plan.currency}</span>
                  <span>{money.toLocaleString()}</span>
                </span>
                <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">Money Kept</p>
              </div>
              <div>
                <span className="text-lg font-bold">Intact</span>
                <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">Earned Badges</p>
              </div>
            </div>

            <button
              onClick={() => {
                Sound.tick();
                setStep(2);
              }}
              className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs tracking-wide flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>What happened?</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Trigger Attribution */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1">
              What triggered this one?
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-4">
              Identifying the exact context shifts attribution away from self-blame toward actionable changes.
            </p>

            <div className="space-y-2 mb-5">
              {triggerSuggestions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    Sound.tick();
                    setSelectedTrigger(t.id);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition ${
                    selectedTrigger === t.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#262626] border-[#C4C4C4] dark:border-[#3D3D3D]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                Sound.tick();
                setStep(3);
              }}
              className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs tracking-wide flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>Set my plan for next time</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: If-Then Plan */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1">
              Next time, I will...
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-4">
              Implementation intentions ("If X happens, then I will do Y") double resistance against automatic habits.
            </p>

            <div className="space-y-2.5 mb-5">
              {currentIfThens.map((planText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    Sound.tick();
                    setChosenIfThen(planText);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition ${
                    chosenIfThen === planText
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold'
                      : 'bg-[#F2F2F2] dark:bg-[#262626] border-[#C4C4C4] dark:border-[#3D3D3D] text-[#5E5E5E] dark:text-[#A6A6A6]'
                  }`}
                >
                  {planText}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                Sound.tick();
                setStep(4);
              }}
              className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs tracking-wide flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: Next Cigarette Matters + Reassurance */}
        {step === 4 && (
          <div>
            <h3 className="text-xl font-black tracking-tight mb-2">
              The next cigarette is the one that matters.
            </h3>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-3">
              One slip does not restart dependence unless you allow it to snowball. Staying smoke-free right now locks in recovery.
            </p>

            {smokeFree.completedSmokeFreeDays <= 14 && (
              <div className="p-3.5 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs mb-4">
                <span className="font-bold text-black dark:text-white block">
                  Clinical Insight (Kenford et al. 1994, JAMA):
                </span>
                <span className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  The first two weeks matter most. Staying smoke-free through week two is one of the strongest signs of long-term freedom.
                </span>
              </div>
            )}

            {/* Fresh start choice if >= 3 slips in last 7 days */}
            {showFreshStartChoice && (
              <div className="p-4 rounded-2xl border-2 border-black dark:border-white mb-4">
                <p className="text-xs font-bold text-black dark:text-white">
                  Want a fresh start?
                </p>
                <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5 mb-2">
                  You had slips on 3 or more days this week. You can restart Round 1 now, or switch to cut-down mode for a few weeks. Both are completely fine. Medicine plus support makes quitting easier.
                </p>
                <button
                  onClick={() => {
                    Sound.tick();
                    onComplete({ restartRound: true });
                  }}
                  className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                >
                  Restart Round 1 Fresh
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  Sound.tick();
                  onComplete({ trigger: selectedTrigger, ifThenPlan: chosenIfThen });
                }}
                className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs active:scale-95 transition"
              >
                Done · Back to Today
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onComplete({ trigger: selectedTrigger, ifThenPlan: chosenIfThen });
                    onOpenSos();
                  }}
                  className="h-10 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#262626]"
                >
                  Open Craving Tools
                </button>
                <button
                  onClick={() => {
                    onComplete({ trigger: selectedTrigger, ifThenPlan: chosenIfThen });
                    onOpenCoach();
                  }}
                  className="h-10 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#262626]"
                >
                  Talk to Coach
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
