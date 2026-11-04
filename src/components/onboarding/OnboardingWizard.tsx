import React, { useState } from 'react';
import { UserPlan, HabitMode, CoachStyle, TimeToFirstCigarette, IfThenPlan } from '../../types';
import { Sound } from '../../data/sound';
import { ArrowRight, ArrowLeft, Check, Sparkles, Shield, Heart } from 'lucide-react';

interface OnboardingWizardProps {
  initialPlan: UserPlan;
  onFinishOnboarding: (plan: UserPlan) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialPlan,
  onFinishOnboarding,
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 15; // 1 to 14 + 15 (Your Plan summary)

  // Onboarding state
  const [usualCount, setUsualCount] = useState<number>(initialPlan.usualPerDay || 15);
  const [ttfc, setTtfc] = useState<TimeToFirstCigarette>(initialPlan.timeToFirstCigarette || '6_to_30');
  const [packPrice, setPackPrice] = useState<number>(initialPlan.packPrice || 10);
  const [cigsPerPack, setCigsPerPack] = useState<number>(initialPlan.cigarettesPerPack || 20);
  const [currency, setCurrency] = useState<string>(initialPlan.currency || '$');
  const [mode, setMode] = useState<HabitMode>(initialPlan.mode || 'QUIT');
  const [quitDateChoice, setQuitDateChoice] = useState<string>('TODAY');
  const [customQuitDate, setCustomQuitDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [pastTries, setPastTries] = useState<string>('1 to 2');
  const [longestStreak, setLongestStreak] = useState<string>('7');
  const [triggers, setTriggers] = useState<string[]>(initialPlan.triggers || ['stress', 'coffee_tea', 'after_meals']);
  const [reasons, setReasons] = useState<string[]>(initialPlan.reasons || ['health', 'money', 'freedom']);
  const [coachStyle, setCoachStyle] = useState<CoachStyle>(initialPlan.coachStyle || 'GENTLE');
  const [wakeTime, setWakeTime] = useState<string>(initialPlan.wakeTime || '07:00');
  const [sleepTime, setSleepTime] = useState<string>(initialPlan.sleepTime || '23:00');
  const [supportName, setSupportName] = useState<string>(initialPlan.supportContact.name || '');
  const [supportPhone, setSupportPhone] = useState<string>(initialPlan.supportContact.phone || '');
  const [pregnant, setPregnant] = useState(false);
  const [heart, setHeart] = useState(false);
  const [mentalHealth, setMentalHealth] = useState(false);
  const [interactingMeds, setInteractingMeds] = useState(false);

  // Natural language AI assistance state
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const nextStep = () => {
    Sound.tick();
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const prevStep = () => {
    Sound.tick();
    setStep((s) => Math.max(1, s - 1));
  };

  const toggleTrigger = (id: string) => {
    Sound.tick();
    setTriggers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleReason = (id: string) => {
    Sound.tick();
    setReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleAiAutoFill = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    Sound.tick();
    try {
      const res = await fetch('/api/gemini/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt: aiInput }),
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.plan;
        if (p.cigarettesPerDay) setUsualCount(p.cigarettesPerDay);
        if (p.timeToFirstCigarette) setTtfc(p.timeToFirstCigarette);
        if (p.packPrice) setPackPrice(p.packPrice);
        if (p.mode) setMode(p.mode);
        if (Array.isArray(p.triggers)) setTriggers(p.triggers);
        if (Array.isArray(p.reasons)) setReasons(p.reasons);
        if (p.coachStyle) setCoachStyle(p.coachStyle);
        Sound.celebrate();
        setStep(15); // Jump straight to Your Plan confirmation
      }
    } catch {
      alert('Could not parse text. Continuing with step-by-step.');
    } finally {
      setAiLoading(false);
    }
  };

  const buildFinalPlan = (): UserPlan => {
    let finalQuitDate = new Date().toISOString();
    const today = new Date();

    if (quitDateChoice === 'TOMORROW') {
      const d = new Date(today);
      d.setDate(today.getDate() + 1);
      finalQuitDate = d.toISOString();
    } else if (quitDateChoice === 'NEXT_MONDAY') {
      const d = new Date(today);
      d.setDate(today.getDate() + ((7 - today.getDay() + 1) % 7 || 7));
      finalQuitDate = d.toISOString();
    } else if (quitDateChoice === 'FIRST_NEXT_MONTH') {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      finalQuitDate = d.toISOString();
    } else if (quitDateChoice === 'CUSTOM') {
      finalQuitDate = new Date(customQuitDate).toISOString();
    }

    const defaultIfThens: IfThenPlan[] = triggers.slice(0, 3).map((trig, idx) => ({
      id: `plan_${idx}`,
      trigger: trig,
      action:
        trig === 'coffee_tea'
          ? 'Drink a glass of cold water first and drink coffee in a new spot.'
          : trig === 'stress'
          ? 'Take 5 slow breaths and step away from the screen for 2 minutes.'
          : trig === 'after_meals'
          ? 'Immediately stand up and brush teeth or chew cinnamon gum.'
          : 'Delay 5 minutes and drink ice water.',
    }));

    return {
      ...initialPlan,
      mode,
      quitStartDate: finalQuitDate,
      usualPerDay: usualCount,
      cigarettesPerPack: cigsPerPack,
      packPrice,
      currency,
      timeToFirstCigarette: ttfc,
      pastAttemptsCount: pastTries,
      pastLongestStreakDays: longestStreak,
      triggers: triggers.length > 0 ? triggers : ['stress'],
      reasons: reasons.length > 0 ? reasons : ['health'],
      coachStyle,
      wakeTime,
      sleepTime,
      supportContact: { name: supportName, phone: supportPhone },
      healthFlags: {
        pregnantOrBreastfeeding: pregnant,
        heartCondition: heart,
        mentalHealthCondition: mentalHealth,
        takingInteractingMeds: interactingMeds,
      },
      ifThenPlans: defaultIfThens,
      onboardingCompleted: true,
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white overflow-y-auto flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header & Progress */}
      <div className="max-w-lg mx-auto w-full pt-2">
        <div className="flex items-center justify-between text-xs text-[#5E5E5E] dark:text-[#A6A6A6] mb-3">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-1 font-bold text-black dark:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <span className="font-bold tracking-tight text-black dark:text-white">Unlit</span>
          )}
          <span>
            Step {step} of {totalSteps}
          </span>
          {step > 5 && step < totalSteps ? (
            <button
              onClick={() => setStep(15)}
              className="font-bold underline text-black dark:text-white"
            >
              Skip to Plan
            </button>
          ) : (
            <span />
          )}
        </div>

        {/* Progress dots */}
        <div className="w-full flex items-center gap-1 h-1 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-full transition-colors ${
                i + 1 <= step ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Question Body */}
      <div className="max-w-lg mx-auto w-full my-auto py-2">
        {/* STEP 1: Welcome & Natural Language Option */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
              ✓
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Welcome to Unlit.
            </h2>
            <p className="text-sm text-[#5E5E5E] dark:text-[#A6A6A6]">
              A free, private quit-smoking tracker that acts like a calm mentor and a careful doctor.
            </p>
            <div className="p-3.5 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs space-y-1">
              <p className="font-bold text-black dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                100% Private & Offline-First
              </p>
              <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                All logs stay on your phone. No tracking SDKs, no ads, no account required.
              </p>
            </div>

            {/* Natural language AI setup option */}
            <div className="pt-2">
              <label className="text-xs font-bold text-black dark:text-white block mb-1">
                Prefer to answer in your own words? (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. I smoke 15 a day, mostly after coffee and stress. Want to quit today."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 h-11 px-3.5 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs text-black dark:text-white"
                />
                <button
                  onClick={handleAiAutoFill}
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 h-11 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold shrink-0 disabled:opacity-40"
                >
                  {aiLoading ? 'Analyzing...' : 'Auto-fill'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: How many cigarettes per day */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              How many cigarettes a day, usually?
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Used to calculate cigarettes avoided and money preserved.
            </p>

            <div className="flex items-center justify-center gap-4 py-4">
              <button
                onClick={() => setUsualCount((c) => Math.max(1, c - 1))}
                className="w-12 h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xl font-bold"
              >
                -
              </button>
              <span className="text-5xl font-black tabular-nums tracking-tight">
                {usualCount}
              </span>
              <button
                onClick={() => setUsualCount((c) => c + 1)}
                className="w-12 h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xl font-bold"
              >
                +
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {[5, 10, 15, 20, 25, 30].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    Sound.tick();
                    setUsualCount(num);
                  }}
                  className={`px-4 py-2 rounded-full border text-xs font-bold transition ${
                    usualCount === num
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'border-[#C4C4C4] dark:border-[#3D3D3D] text-[#5E5E5E] dark:text-[#A6A6A6]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Time to first cigarette */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              How soon after waking do you have the first one?
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Clinical Heaviness of Smoking Index marker.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'within_5', label: 'Within 5 minutes' },
                { id: '6_to_30', label: '6 to 30 minutes' },
                { id: '31_to_60', label: '31 to 60 minutes' },
                { id: 'after_60', label: 'After an hour' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    Sound.tick();
                    setTtfc(opt.id as any);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left text-xs font-bold transition ${
                    ttfc === opt.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Price & Pack Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Price and pack size
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-black dark:text-white block mb-1">
                  Currency Symbol
                </label>
                <div className="flex gap-2">
                  {['$', '€', '£', '¥', '₹', 'C$'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        currency === c
                          ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                          : 'border-[#C4C4C4] dark:border-[#3D3D3D]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-black dark:text-white block mb-1">
                  Price per pack ({currency})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={packPrice}
                  onChange={(e) => setPackPrice(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-lg font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-black dark:text-white block mb-1">
                  Cigarettes per pack
                </label>
                <input
                  type="number"
                  value={cigsPerPack}
                  onChange={(e) => setCigsPerPack(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-lg font-bold font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: What do you want right now? (Mode) */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              What do you want right now?
            </h2>

            <div className="space-y-2.5">
              {[
                {
                  id: 'QUIT',
                  title: 'Quit on a set day',
                  desc: 'Stopping abruptly with proven sprint milestones (Recommended)',
                },
                {
                  id: 'CUT_DOWN',
                  title: 'Cut down first',
                  desc: 'Taper down over 2-4 weeks with a built-in quit day',
                },
                {
                  id: 'TRACK',
                  title: 'Just track for now',
                  desc: 'Log without goals to understand triggers and patterns',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    Sound.tick();
                    setMode(opt.id as any);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition ${
                    mode === opt.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.title}</span>
                  <span className="text-[11px] opacity-80 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Quit Day Selection (if quitting) */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Choose your quit day
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Temporal landmarks (fresh starts) like Monday or 1st of the month boost commitment.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'TODAY', label: 'Today (Start now)' },
                { id: 'TOMORROW', label: 'Tomorrow morning' },
                { id: 'NEXT_MONDAY', label: 'Next Monday (Fresh start landmark)' },
                { id: 'FIRST_NEXT_MONTH', label: '1st of next month' },
                { id: 'CUSTOM', label: 'Pick a specific date' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    Sound.tick();
                    setQuitDateChoice(opt.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition ${
                    quitDateChoice === opt.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {quitDateChoice === 'CUSTOM' && (
              <input
                type="date"
                value={customQuitDate}
                onChange={(e) => setCustomQuitDate(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-mono font-bold"
              />
            )}
          </div>
        )}

        {/* STEP 7: Past Attempts */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Past quit attempts
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              "Many successful ex-smokers took 30+ tries. Every attempt is rehearsal."
            </p>

            <div>
              <label className="text-xs font-bold block mb-1">How many past tries?</label>
              <div className="grid grid-cols-4 gap-2">
                {['none', '1 to 2', '3 to 5', '6+'].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPastTries(num)}
                    className={`py-2 rounded-xl border text-xs font-bold ${
                      pastTries === num
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'border-[#C4C4C4] dark:border-[#3D3D3D]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">
                Longest time smoke-free previously (days):
              </label>
              <input
                type="number"
                value={longestStreak}
                onChange={(e) => setLongestStreak(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-sm font-bold font-mono"
              />
            </div>
          </div>
        )}

        {/* STEP 8: Triggers (Multi-select) */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Select your top triggers
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              These configure your SOS tool ordering and if-then routine swaps.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'waking_up', label: 'Waking up' },
                { id: 'coffee_tea', label: 'Coffee or tea' },
                { id: 'after_meals', label: 'After meals' },
                { id: 'work_breaks', label: 'Work breaks' },
                { id: 'stress', label: 'Stress' },
                { id: 'boredom', label: 'Boredom' },
                { id: 'alcohol', label: 'Alcohol' },
                { id: 'friends_who_smoke', label: 'Friends who smoke' },
                { id: 'driving', label: 'Driving' },
                { id: 'phone_scrolling', label: 'Phone scrolling' },
                { id: 'after_argument', label: 'After an argument' },
                { id: 'late_night', label: 'Late at night' },
              ].map((t) => {
                const isSelected = triggers.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTrigger(t.id)}
                    className={`px-3.5 py-2 rounded-full border text-xs font-bold transition ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'border-[#C4C4C4] dark:border-[#3D3D3D] text-[#5E5E5E] dark:text-[#A6A6A6]'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 9: Reasons (Multi-select) */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Why are you quitting?
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Powers your "My Why" anchor card in Craving SOS.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'health', label: 'Health' },
                { id: 'family_kids', label: 'Family or kids' },
                { id: 'money', label: 'Money' },
                { id: 'breathing_fitness', label: 'Breathing & fitness' },
                { id: 'smell_looks', label: 'Smell & looks' },
                { id: 'freedom', label: 'Freedom from urges' },
                { id: 'doctor_advice', label: "Doctor's advice" },
                { id: 'pregnancy', label: 'Pregnancy' },
              ].map((r) => {
                const isSelected = reasons.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleReason(r.id)}
                    className={`px-3.5 py-2 rounded-full border text-xs font-bold transition ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'border-[#C4C4C4] dark:border-[#3D3D3D] text-[#5E5E5E] dark:text-[#A6A6A6]'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 10: Coach Style */}
        {step === 10 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Preferred coach tone
            </h2>

            <div className="space-y-2.5">
              {[
                {
                  id: 'GENTLE',
                  title: 'Gentle friend',
                  sample: '"Take a slow breath. Your smoke-free days still count."',
                },
                {
                  id: 'DIRECT',
                  title: 'Straight talker',
                  sample: '"That was one slip, not a surrender. Let’s focus on the next hour."',
                },
                {
                  id: 'SCIENCE',
                  title: 'Science buff',
                  sample: '"Nicotine cleared your plasma. Dopamine receptors down-regulate over 2-4 weeks."',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    Sound.tick();
                    setCoachStyle(opt.id as any);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition ${
                    coachStyle === opt.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.title}</span>
                  <span className="text-[11px] opacity-75 italic block mt-0.5">
                    {opt.sample}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 11: Daily Rhythm (Wake & Sleep) */}
        {step === 11 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Daily sleep & wake rhythm
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Ensures notifications strictly observe quiet hours.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Sleep Time</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: Private Health Check */}
        {step === 12 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Private health check
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Optional. Answers never leave your phone. Flags pin guidance in Doctor corner.
            </p>

            <div className="space-y-2">
              {[
                {
                  state: pregnant,
                  setter: setPregnant,
                  label: 'Pregnant or breastfeeding',
                },
                {
                  state: heart,
                  setter: setHeart,
                  label: 'Recent heart attack, stroke, or heart condition',
                },
                {
                  state: mentalHealth,
                  setter: setMentalHealth,
                  label: 'Current or past mental health condition',
                },
                {
                  state: interactingMeds,
                  setter: setInteractingMeds,
                  label: 'Taking clozapine, olanzapine, theophylline or warfarin',
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.setter(!item.state)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                    item.state
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-[#F2F2F2] dark:bg-[#141414] border-[#C4C4C4] dark:border-[#3D3D3D]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span>{item.state ? 'Yes' : 'No'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 13: Support Contact */}
        {step === 13 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Support person (for Craving SOS)
            </h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Optional. Adds a "Call my person" one-tap dialer button in Craving SOS.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah (Partner)"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 555-0199"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 14: Notifications */}
        {step === 14 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Gentle notifications
            </h2>
            <p className="text-sm text-[#5E5E5E] dark:text-[#A6A6A6]">
              Unlit will only send milestone celebrations and one proactive nudge before your toughest craving window. No spam. Quiet hours strictly respected.
            </p>
            <div className="p-4 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs space-y-1">
              <span className="font-bold block text-black dark:text-white">
                Max 2 notifications per day
              </span>
              <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                You can adjust quiet hours and mute notifications anytime in Toolkit.
              </p>
            </div>
          </div>
        )}

        {/* STEP 15: YOUR PLAN CARD */}
        {step === 15 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <h2 className="text-2xl font-black tracking-tight">Your Plan</h2>
            </div>

            <div className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#C4C4C4] dark:border-[#3D3D3D]">
                <div>
                  <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Mode:</span>
                  <span className="font-bold">{mode}</span>
                </div>
                <div>
                  <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Round 1 Target:</span>
                  <span className="font-bold">28 days smoke-free</span>
                </div>
              </div>

              <div>
                <span className="font-bold block mb-1 text-black dark:text-white">
                  Top Triggers & If-Then Strategy:
                </span>
                <ul className="space-y-1 text-[#5E5E5E] dark:text-[#A6A6A6] text-[11px]">
                  {triggers.slice(0, 3).map((t) => (
                    <li key={t}>
                      • <strong className="text-black dark:text-white capitalize">{t.replace(/_/g, ' ')}: </strong>
                      Swap routine & drink ice water
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold block mb-1 text-black dark:text-white">
                  Top Craving Tools:
                </span>
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6] text-[11px]">
                  Paced 4-4-6 Breathing, Play the tape forward, 5-minute delay
                </p>
              </div>

              <div>
                <span className="font-bold block mb-1 text-black dark:text-white">
                  Coach Tone:
                </span>
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6] text-[11px]">
                  {coachStyle}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  Sound.celebrate();
                  onFinishOnboarding(buildFinalPlan());
                }}
                className="flex-2 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold active:scale-95 transition"
              >
                Looks good · Let's begin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Button (Steps 1 to 14) */}
      {step < 15 && (
        <div className="max-w-lg mx-auto w-full pb-2">
          <button
            onClick={nextStep}
            className="w-full h-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <span>{step === 1 ? 'Start Onboarding' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
