import React, { useState, useEffect } from 'react';
import { UserPlan, Entry, QuitAttempt, EarnedBadge, ToolStat, ChatMessage, HomeLayoutItem } from './types';
import { Storage, DEFAULT_PLAN, DEFAULT_HOME_LAYOUT, subscribeStorage } from './data/storage';
import { Sound } from './data/sound';
import { TopBar } from './components/TopBar';
import { BottomNav, TabId } from './components/BottomNav';
import { HeroCard } from './components/today/HeroCard';
import { DefaultHomeCards } from './components/today/DefaultHomeCards';
import { QuickActions } from './components/today/QuickActions';
import { CustomizeHomeDrawer } from './components/today/CustomizeHomeDrawer';
import { JourneyTab } from './components/journey/JourneyTab';
import { ToolkitTab } from './components/toolkit/ToolkitTab';
import { CravingSosModal } from './components/sos/CravingSosModal';
import { SlipRecoverySheet } from './components/slip/SlipRecoverySheet';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeScreenWidgetSimulator } from './components/widgets/HomeScreenWidgetSimulator';
import { MilestoneBurst } from './components/celebration/MilestoneBurst';
import { EntryDetailsSheet } from './components/today/EntryDetailsSheet';
import { calculateCurrentStreak, calculateSmokeFreeDays, calculateRoundStatus } from './domain/calculations';
import { MILESTONES } from './content/milestones';
import { RotateCcw } from 'lucide-react';

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
  const [showCustomizeHome, setShowCustomizeHome] = useState(false);

  // 2-Minute Undo snackbar state (120 seconds duration)
  const [undoEntryId, setUndoEntryId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(120);
  const [entryForDetails, setEntryForDetails] = useState<Entry | null>(null);

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

  // Deep Link Support: /craving or #craving opens craving help directly into breathing
  useEffect(() => {
    const handleDeepLink = () => {
      const isCravingRoute =
        window.location.hash === '#craving' ||
        window.location.hash === '#/craving' ||
        window.location.pathname.endsWith('/craving');
      if (isCravingRoute) {
        setShowSosModal(true);
      }
    };
    handleDeepLink();
    window.addEventListener('hashchange', handleDeepLink);
    return () => window.removeEventListener('hashchange', handleDeepLink);
  }, []);

  const handleOpenSosModal = () => {
    window.location.hash = 'craving';
    setShowSosModal(true);
  };

  const handleCloseSosModal = () => {
    setShowSosModal(false);
    if (window.location.hash === '#craving' || window.location.hash === '#/craving') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

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

  // Undo countdown timer (counts down 120s = 2 minutes)
  useEffect(() => {
    if (!undoEntryId) return;
    const interval = setInterval(() => {
      setUndoCountdown((c) => {
        if (c <= 1) {
          setUndoEntryId(null);
          return 120;
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

  // Handle logging a cigarette ("I smoked")
  const handleLogCigarette = (extraData?: Partial<Entry>) => {
    const newEntry: Entry = {
      id: `entry_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'CIGARETTE',
      habitId: 'smoking',
      source: 'app',
      ...extraData,
    };

    Storage.addEntry(newEntry);
    setUndoEntryId(newEntry.id);
    setUndoCountdown(120); // 2-minute undo per spec

    // In quit mode, show non-punitive slip recovery sheet after a subtle delay
    if (plan.mode === 'QUIT') {
      setTimeout(() => {
        setShowSlipSheet(true);
      }, 400);
    }
  };

  const handleUndo = () => {
    if (!undoEntryId) return;
    Sound.doubleTick();
    Storage.markEntryUndone(undoEntryId);
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
      source: 'app',
    };
    Storage.addEntry(entry);
    const count = entries.filter((e) => !e.undone && (e.type === 'CRAVING_BEATEN' || e.type === 'craving_resisted')).length + 1;
    setCelebrationMessage(`That's ${count} cravings beaten`);
    setCelebrationActive(true);
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
      ? `Day ${smokeFree.completedSmokeFreeDays + 1} · ${round.currentRoundName}`
      : plan.mode === 'CUT_DOWN'
      ? 'Cut-Down Mode'
      : 'Track Mode';

  // Format undo timer text (e.g., "1:58")
  const undoMins = Math.floor(undoCountdown / 60);
  const undoSecs = String(undoCountdown % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white flex flex-col items-center transition-colors">
      {/* Celebration Particle Burst (monochrome dot explosion) */}
      <MilestoneBurst
        active={celebrationActive}
        message={celebrationMessage}
        onComplete={() => setCelebrationActive(false)}
      />

      {/* Main App Frame */}
      <div className="w-full max-w-2xl min-h-screen flex flex-col relative bg-[#FFFFFF] dark:bg-[#000000] border-x-0 sm:border-x border-[#C4C4C4] dark:border-[#2A2A2A]">
        {/* Top App Bar with Launcher & Widgets switch */}
        <TopBar
          plan={plan}
          currentTheme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
          onOpenSos={handleOpenSosModal}
          onOpenLauncher={() => setShowWidgetSimulator(true)}
          dayGreeting={dayGreeting}
        />

        {/* Tab Content */}
        <main className="flex-1 w-full">
          {activeTab === 'today' && (
            <div className="space-y-4 px-4 pt-3 pb-24">
              {/* Check if in prep phase or non-quit mode */}
              {plan.mode !== 'QUIT' ? (
                <HeroCard
                  plan={plan}
                  entries={entries}
                  onOpenMilestones={() => setActiveTab('journey')}
                  onOpenPlan={() => setActiveTab('toolkit')}
                />
              ) : (
                /* Section 1 & 2: Default 4 cards + any customized cards */
                <DefaultHomeCards
                  plan={plan}
                  entries={entries}
                  homeLayout={plan.homeLayout && plan.homeLayout.length > 0 ? plan.homeLayout : DEFAULT_HOME_LAYOUT}
                  onOpenJourney={() => setActiveTab('journey')}
                  onOpenToolkit={() => setActiveTab('toolkit')}
                  onOpenSos={handleOpenSosModal}
                  onOpenCustomize={() => setShowCustomizeHome(true)}
                />
              )}

              {/* Section 1: Quick Actions (Ride out a craving & I smoked + Customize home link) */}
              <QuickActions
                mode={plan.mode}
                confirmBeforeLog={plan.confirmBeforeLog}
                onLogCigarette={handleLogCigarette}
                onOpenSos={handleOpenSosModal}
                onOpenCustomize={() => setShowCustomizeHome(true)}
              />
            </div>
          )}

          {activeTab === 'journey' && (
            <JourneyTab
              plan={plan}
              entries={entries}
              attempts={attempts}
              badges={badges}
              onOpenSos={handleOpenSosModal}
              onEditEntry={(entry) => setEntryForDetails(entry)}
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
              onOpenSos={handleOpenSosModal}
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

        {/* 2-Minute Undo Snackbar per Section 5 & labels.md */}
        {undoEntryId && (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-[#000000] text-white border border-[#3D3D3D] rounded-3xl p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-150">
            <div className="pr-2">
              <span className="text-xs font-bold block text-white">
                Logged. Your timer restarted.
              </span>
              <span className="text-[11px] text-[#8A8A8A] block mt-0.5">
                You still have {smokeFree.completedSmokeFreeDays} smoke-free days behind you. ({undoMins}:{undoSecs})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  const entry = entries.find((e) => e.id === undoEntryId) || {
                    id: undoEntryId,
                    timestamp: Date.now(),
                    timezoneOffset: new Date().getTimezoneOffset(),
                    type: 'CIGARETTE' as const,
                  };
                  setEntryForDetails(entry);
                }}
                className="px-2.5 py-1.5 rounded-full text-xs font-medium text-[#8A8A8A] hover:text-white underline hover:opacity-80 transition"
              >
                Details
              </button>
              <button
                onClick={handleUndo}
                className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-bold flex items-center gap-1 active:scale-95 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* Customize Home Drawer (Section 3) */}
      <CustomizeHomeDrawer
        isOpen={showCustomizeHome}
        onClose={() => setShowCustomizeHome(false)}
        homeLayout={plan.homeLayout && plan.homeLayout.length > 0 ? plan.homeLayout : DEFAULT_HOME_LAYOUT}
        onSaveLayout={(newLayout) => {
          const updated = {
            ...plan,
            homeLayout: newLayout,
            layoutVersion: (plan.layoutVersion || 1) + 1,
          };
          setPlan(updated);
          Storage.savePlan(updated);
        }}
        onResetToSimple={() => {
          const updated = {
            ...plan,
            homeLayout: DEFAULT_HOME_LAYOUT,
            layoutVersion: (plan.layoutVersion || 1) + 1,
          };
          setPlan(updated);
          Storage.savePlan(updated);
        }}
      />

      {/* Craving Help Full-Screen Modal (Section 4) */}
      {showSosModal && (
        <CravingSosModal
          plan={plan}
          toolStats={toolStats}
          onClose={handleCloseSosModal}
          onCravingBeaten={(duration, tool) => {
            handleCravingBeaten(duration, tool);
            handleCloseSosModal();
          }}
          onSmokedDuringCraving={() => {
            handleLogCigarette();
            handleCloseSosModal();
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
            handleOpenSosModal();
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
          onQuickLog={() => handleLogCigarette({ source: 'widget' })}
          onDeepLink={(dest) => {
            setShowWidgetSimulator(false);
            if (dest === 'today') setActiveTab('today');
            else if (dest === 'journey') setActiveTab('journey');
            else if (dest === 'sos') handleOpenSosModal();
          }}
        />
      )}

      {/* Entry Details & Edit Sheet */}
      {entryForDetails && (
        <EntryDetailsSheet
          entry={entryForDetails}
          isOpen={true}
          onClose={() => setEntryForDetails(null)}
          onSave={(updated) => {
            Storage.updateEntry(updated.id, updated);
            setEntryForDetails(null);
          }}
        />
      )}
    </div>
  );
}
