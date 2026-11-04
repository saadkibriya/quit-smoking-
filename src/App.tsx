import React, { useState, useEffect } from 'react';
import { UserPlan, Entry, QuitAttempt, EarnedBadge, ToolStat, ChatMessage, WidgetLayoutItem } from './types';
import { Storage, DEFAULT_PLAN, subscribeStorage } from './data/storage';
import { Sound } from './data/sound';
import { TopBar } from './components/TopBar';
import { BottomNav, TabId } from './components/BottomNav';
import { HeroCard } from './components/today/HeroCard';
import { QuickActions } from './components/today/QuickActions';
import { InAppWidgetGrid } from './components/today/InAppWidgetGrid';
import { JourneyTab } from './components/journey/JourneyTab';
import { ToolkitTab } from './components/toolkit/ToolkitTab';
import { CravingSosModal } from './components/sos/CravingSosModal';
import { SlipRecoverySheet } from './components/slip/SlipRecoverySheet';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeScreenWidgetSimulator } from './components/widgets/HomeScreenWidgetSimulator';
import { MilestoneBurst } from './components/celebration/MilestoneBurst';
import { calculateCurrentStreak, calculateSmokeFreeDays, calculateRoundStatus } from './domain/calculations';
import { MILESTONES } from './content/milestones';
import { RotateCcw, Check, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [plan, setPlan] = useState<UserPlan>(() => Storage.getPlan());
  const [entries, setEntries] = useState<Entry[]>(() => Storage.getEntries());
  const [attempts, setAttempts] = useState<QuitAttempt[]>(() => Storage.getAttempts());
  const [badges, setBadges] = useState<EarnedBadge[]>(() => Storage.getBadges());
  const [toolStats, setToolStats] = useState<ToolStat[]>(() => Storage.getToolStats());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => Storage.getChatMessages());

  // Modal & Overlay states
  const [showSosModal, setShowSosModal] = useState(false);
  const [showSlipSheet, setShowSlipSheet] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !plan.onboardingCompleted);
  const [showWidgetSimulator, setShowWidgetSimulator] = useState(false);

  // Undo snackbar state (6 seconds duration)
  const [undoEntryId, setUndoEntryId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(6);

  // Milestone celebration burst
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | undefined>(undefined);

  // Re-sync on storage changes
  useEffect(() => {
    const unsubscribe = subscribeStorage(() => {
      setPlan(Storage.getPlan());
      setEntries(Storage.getEntries());
      setAttempts(Storage.getAttempts());
      setBadges(Storage.getBadges());
      setToolStats(Storage.getToolStats());
      setChatMessages(Storage.getChatMessages());
    });
    return unsubscribe;
  }, []);

  // Theme synchronization (Day / Night / Auto)
  const [resolvedTheme, setResolvedTheme] = useState<'DAY' | 'NIGHT'>('DAY');

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (plan.themePreference === 'DAY') {
        isDark = false;
      } else if (plan.themePreference === 'NIGHT') {
        isDark = true;
      } else {
        // AUTO: Follow system
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setResolvedTheme(isDark ? 'NIGHT' : 'DAY');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (plan.themePreference === 'AUTO') applyTheme();
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [plan.themePreference]);

  // Undo countdown timer
  useEffect(() => {
    if (!undoEntryId) return;
    const interval = setInterval(() => {
      setUndoCountdown((c) => {
        if (c <= 1) {
          setUndoEntryId(null);
          return 6;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undoEntryId]);

  // Milestone badge checker
  useEffect(() => {
    const streak = calculateCurrentStreak(entries, plan.quitStartDate);
    for (const m of MILESTONES) {
      if (streak.streakHours >= m.hours) {
        const alreadyEarned = badges.some((b) => b.milestoneId === m.id);
        if (!alreadyEarned) {
          Storage.addBadge(m.id);
          Sound.celebrate();
          setCelebrationMessage(`Milestone reached: ${m.title}!`);
          setCelebrationActive(true);
          break;
        }
      }
    }
  }, [entries, plan.quitStartDate, badges]);

  // Handle logging a cigarette
  const handleLogCigarette = (extraData?: Partial<Entry>) => {
    const newEntry: Entry = {
      id: `entry_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'CIGARETTE',
      habitId: 'smoking',
      ...extraData,
    };

    Storage.addEntry(newEntry);
    setUndoEntryId(newEntry.id);
    setUndoCountdown(6);

    // In quit mode, open non-punitive slip recovery sheet
    if (plan.mode === 'QUIT') {
      setTimeout(() => {
        setShowSlipSheet(true);
      }, 350);
    }
  };

  const handleUndo = () => {
    if (!undoEntryId) return;
    Sound.doubleTick();
    Storage.removeEntry(undoEntryId);
    setUndoEntryId(null);
    setShowSlipSheet(false);
  };

  // Handle Craving Beaten
  const handleCravingBeaten = (durationSeconds: number, toolUsed?: string) => {
    const entry: Entry = {
      id: `craving_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'CRAVING_BEATEN',
      cravingDurationSeconds: durationSeconds,
      toolUsed,
    };
    Storage.addEntry(entry);
    setCelebrationMessage('You beat that urge!');
    setCelebrationActive(true);
  };

  // Handle Daily Pledge
  const handlePledge = () => {
    const entry: Entry = {
      id: `pledge_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'PLEDGE',
      note: "Today I won't smoke.",
    };
    Storage.addEntry(entry);
    Sound.celebrate();
  };

  const handleToolFeedback = (toolId: string, helped: boolean) => {
    Storage.recordToolUse(toolId, helped);
  };

  const handleToggleTheme = () => {
    const next = resolvedTheme === 'DAY' ? 'NIGHT' : 'DAY';
    const updated = { ...plan, themePreference: next as any };
    setPlan(updated);
    Storage.savePlan(updated);
  };

  // Compute round status for top bar greeting
  const streak = calculateCurrentStreak(entries, plan.quitStartDate);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate);
  const round = calculateRoundStatus(streak.streakHours, smokeFree.completedSmokeFreeDays, entries);

  const dayGreeting =
    plan.mode === 'QUIT'
      ? `Day ${smokeFree.completedSmokeFreeDays + 1} of ${round.currentRoundName}`
      : plan.mode === 'CUT_DOWN'
      ? 'Cut-Down Mode'
      : 'Track Mode';

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white flex flex-col items-center transition-colors">
      {/* Celebration Particle Burst (1.2s monochrome) */}
      <MilestoneBurst
        active={celebrationActive}
        message={celebrationMessage}
        onComplete={() => setCelebrationActive(false)}
      />

      {/* Main Pixel Phone Frame */}
      <div className="w-full max-w-2xl min-h-screen flex flex-col relative bg-[#FFFFFF] dark:bg-[#000000] border-x-0 sm:border-x border-[#C4C4C4] dark:border-[#3D3D3D]">
        {/* Top App Bar */}
        <TopBar
          plan={plan}
          currentTheme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
          onOpenSos={() => setShowSosModal(true)}
          dayGreeting={dayGreeting}
        />

        {/* Tab Content */}
        <main className="flex-1 w-full">
          {activeTab === 'today' && (
            <div className="space-y-4 px-4 pt-3 pb-24">
              {/* 1. Hero Card */}
              <HeroCard
                plan={plan}
                entries={entries}
                onOpenMilestones={() => setActiveTab('journey')}
                onOpenPlan={() => setActiveTab('toolkit')}
              />

              {/* 2. Quick Actions (I smoked & Craving) */}
              <QuickActions
                mode={plan.mode}
                onLogCigarette={handleLogCigarette}
                onOpenSos={() => setShowSosModal(true)}
              />

              {/* 3. In-App Widget Grid */}
              <InAppWidgetGrid
                plan={plan}
                entries={entries}
                onUpdateLayout={(newLayout) => {
                  const updated = { ...plan, widgetLayout: newLayout };
                  setPlan(updated);
                  Storage.savePlan(updated);
                }}
                onOpenSos={() => setShowSosModal(true)}
                onOpenJourney={() => setActiveTab('journey')}
                onOpenToolkit={() => setActiveTab('toolkit')}
                onQuickLog={() => handleLogCigarette()}
                onPledge={handlePledge}
              />
            </div>
          )}

          {activeTab === 'journey' && (
            <JourneyTab
              plan={plan}
              entries={entries}
              attempts={attempts}
              badges={badges}
              onOpenSos={() => setShowSosModal(true)}
              onDeleteEntry={(id) => Storage.removeEntry(id)}
            />
          )}

          {activeTab === 'toolkit' && (
            <ToolkitTab
              plan={plan}
              entries={entries}
              chatMessages={chatMessages}
              currentTheme={resolvedTheme}
              onUpdatePlan={(updated) => {
                setPlan(updated);
                Storage.savePlan(updated);
              }}
              onOpenSos={() => setShowSosModal(true)}
              onOpenSlipRecovery={() => setShowSlipSheet(true)}
              onRedoOnboarding={() => setShowOnboarding(true)}
              onSaveChatMessage={(msg) => {
                const updated = [...chatMessages, msg];
                setChatMessages(updated);
                Storage.saveChatMessages(updated);
              }}
              onClearChat={() => {
                setChatMessages([]);
                Storage.saveChatMessages([]);
              }}
              onOpenWidgetSimulator={() => setShowWidgetSimulator(true)}
            />
          )}
        </main>

        {/* 6-Second Undo Snackbar */}
        {undoEntryId && (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-black dark:bg-white text-white dark:text-black rounded-2xl p-3.5 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-150">
            <div>
              <span className="text-xs font-bold block">Cigarette logged.</span>
              <span className="text-[11px] opacity-80">
                Smoke-free days remain intact ({undoCountdown}s)
              </span>
            </div>
            <button
              onClick={handleUndo}
              className="px-3.5 py-1.5 rounded-full border border-current text-xs font-bold flex items-center gap-1 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* Craving SOS Full-Screen Modal */}
      {showSosModal && (
        <CravingSosModal
          plan={plan}
          toolStats={toolStats}
          onClose={() => setShowSosModal(false)}
          onCravingBeaten={(duration, tool) => {
            handleCravingBeaten(duration, tool);
            setShowSosModal(false);
          }}
          onSmokedDuringCraving={() => {
            handleLogCigarette();
            setShowSosModal(false);
          }}
          onRecordToolFeedback={handleToolFeedback}
        />
      )}

      {/* Slip Recovery Sheet (Non-Punitive) */}
      {showSlipSheet && (
        <SlipRecoverySheet
          plan={plan}
          entries={entries}
          onComplete={({ trigger, ifThenPlan, restartRound }) => {
            if (restartRound) {
              // Create new attempt
              const newAttempt: QuitAttempt = {
                id: `att_${Date.now()}`,
                startDate: new Date().toISOString(),
                bestStreakHours: streak.streakHours,
                smokeFreeDays: smokeFree.completedSmokeFreeDays,
              };
              Storage.saveAttempts([...attempts, newAttempt]);
              const updatedPlan: UserPlan = {
                ...plan,
                quitStartDate: new Date().toISOString(),
              };
              setPlan(updatedPlan);
              Storage.savePlan(updatedPlan);
            }
            if (ifThenPlan) {
              const newPlanItem = {
                id: `plan_${Date.now()}`,
                trigger: trigger || 'urge',
                action: ifThenPlan,
              };
              const updatedPlans = [...(plan.ifThenPlans || []), newPlanItem];
              const updated = { ...plan, ifThenPlans: updatedPlans };
              setPlan(updated);
              Storage.savePlan(updated);
            }
            setShowSlipSheet(false);
          }}
          onOpenCoach={() => {
            setShowSlipSheet(false);
            setActiveTab('toolkit');
          }}
          onOpenSos={() => {
            setShowSlipSheet(false);
            setShowSosModal(true);
          }}
        />
      )}

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard
          initialPlan={plan}
          onFinishOnboarding={(newPlan) => {
            setPlan(newPlan);
            Storage.savePlan(newPlan);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Home-Screen Widget Simulator */}
      {showWidgetSimulator && (
        <HomeScreenWidgetSimulator
          plan={plan}
          entries={entries}
          currentTheme={resolvedTheme}
          onClose={() => setShowWidgetSimulator(false)}
          onQuickLog={() => handleLogCigarette()}
          onDeepLink={(dest) => {
            setShowWidgetSimulator(false);
            if (dest === 'today') setActiveTab('today');
            else if (dest === 'journey') setActiveTab('journey');
            else if (dest === 'sos') setShowSosModal(true);
          }}
        />
      )}
    </div>
  );
}
