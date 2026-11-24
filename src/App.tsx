import React, { useState, useEffect } from 'react';
import { UserPlan, Entry, QuitAttempt, EarnedBadge, ToolStat, ChatMessage, HomeLayoutItem, HabitTarget } from './types';
import { Storage, DEFAULT_PLAN, DEFAULT_HOME_LAYOUT, subscribeStorage } from './data/storage';
import { Sound } from './data/sound';
import { TopBar } from './components/TopBar';
import { BottomNav, TabId } from './components/BottomNav';
import { HeroCard } from './components/today/HeroCard';
import { DefaultHomeCards } from './components/today/DefaultHomeCards';
import { QuickActions } from './components/today/QuickActions';
import { CustomizeHomeDrawer } from './components/today/CustomizeHomeDrawer';
import { JourneyTab } from './components/journey/JourneyTab';
import { PaceTab } from './components/pace/PaceTab';
import { SmokeLogSheet } from './components/log/SmokeLogSheet';
import { ToolkitTab } from './components/toolkit/ToolkitTab';
import { CravingSosModal } from './components/sos/CravingSosModal';
import { SlipRecoverySheet } from './components/slip/SlipRecoverySheet';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeScreenWidgetSimulator } from './components/widgets/HomeScreenWidgetSimulator';
import { MilestoneBurst } from './components/celebration/MilestoneBurst';
import { EntryDetailsSheet } from './components/today/EntryDetailsSheet';
import { HomeScreen } from './components/home/HomeScreen';
import { FapCard, FapHome } from './components/fap/FapCard';
import './components/home/home.css';
import { calculateCurrentStreak, calculateSmokeFreeDays, calculateRoundStatus } from './domain/calculations';
import { getFapStats } from './domain/fap';
import { syncWidget } from './widgetSync';
import { drainWidgetLogs } from './widgetLogSync';
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
  // People who finished onboarding before habit tracking existed get asked once.
  const [showHabitPrompt, setShowHabitPrompt] = useState(() => {
    const saved = Storage.getPlan();
    return saved.onboardingCompleted && !saved.habitChoiceMade;
  });
  const [showWidgetSimulator, setShowWidgetSimulator] = useState(false);
  const [showCustomizeHome, setShowCustomizeHome] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);

  // 2-Minute Undo snackbar state (120 seconds duration)
  const [undoEntryId, setUndoEntryId] = useState<string | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(120);
  const [undoKind, setUndoKind] = useState<'SMOKE' | 'FAP'>('SMOKE');
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

  // Deep Link Support: /craving or #craving opens craving help directly into breathing,
  // #log opens the fast log sheet (used by the installed app's long-press shortcuts).
  useEffect(() => {
    const handleDeepLink = () => {
      const hash = window.location.hash;
      const isCravingRoute = hash === '#craving' || hash === '#/craving' || window.location.pathname.endsWith('/craving');
      const isLogRoute = hash === '#log' || hash === '#/log' || window.location.pathname.endsWith('/log');
      if (isCravingRoute) setShowSosModal(true);
      if (isLogRoute) setShowLogSheet(true);
    };
    handleDeepLink();
    window.addEventListener('hashchange', handleDeepLink);
    return () => window.removeEventListener('hashchange', handleDeepLink);
  }, []);

  // Keep the Android home-screen widgets' cached values in step with the plan.
  useEffect(() => {
    const quitMs = new Date(plan.quitStartDate).getTime();
    const loggedCigs = entries.filter(
      (e) =>
        !e.undone &&
        (e.type === 'CIGARETTE' || e.type === 'smoked') &&
        Number.isFinite(quitMs) &&
        e.timestamp >= quitMs
    ).length;

    // The fap widget shows the same clean streak as the app: a slip moves the
    // anchor forward. Sending only the plan's start date made the widget keep
    // counting after a slip; sending the effective anchor keeps them in sync.
    const fap = getFapStats(entries, plan.fapStartDate || plan.quitStartDate);
    const fapAnchor = Date.now() - fap.cleanMs;

    void syncWidget({
      quitDate: plan.quitStartDate,
      cigsPerDay: plan.usualPerDay,
      packSize: plan.cigarettesPerPack,
      packCost: plan.packPrice,
      currency: plan.currency,
      loggedCigs,
      fapStartDate: fapAnchor,
      fapSlips: fap.totalLapses,
    });
  }, [
    entries,
    plan.quitStartDate,
    plan.fapStartDate,
    plan.usualPerDay,
    plan.cigarettesPerPack,
    plan.packPrice,
    plan.currency,
  ]);

  // Numbers typed into the widget's quick-log dialog arrive here as a queue.
  useEffect(() => {
    const drain = () => {
      void drainWidgetLogs();
    };
    drain();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') drain();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const clearLogHash = () => {
    if (window.location.hash === '#log' || window.location.hash === '#/log') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const [sosHabit, setSosHabit] = useState<'SMOKE' | 'FAP'>('SMOKE');

  const handleOpenSosModal = () => {
    setSosHabit(tracksFap && !tracksSmoke ? 'FAP' : 'SMOKE');
    window.location.hash = 'craving';
    setShowSosModal(true);
  };

  // Same urge-riding tools, but the win is counted against the fap tracker.
  const handleOpenFapUrge = () => {
    setSosHabit('FAP');
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

  // Which habits this person chose during onboarding. Older saves have none.
  const targets = plan.targets && plan.targets.length > 0 ? plan.targets : ['SMOKE'];
  const tracksSmoke = targets.includes('SMOKE');
  const tracksFap = targets.includes('FAP');
  const fapOnly = tracksFap && !tracksSmoke;

  // Milestone badge checker. These milestones (and their celebration copy) are
  // all about cigarettes, so someone tracking only porn/fap must not collect
  // them the moment they open the app.
  useEffect(() => {
    if (!tracksSmoke) return;
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
  }, [entries, plan.quitStartDate, badges, tracksSmoke]);

  // Pace charts are cigarette-only, so a fap-only user must never sit on that tab.
  useEffect(() => {
    if (!tracksSmoke && activeTab === 'pace') setActiveTab('today');
  }, [tracksSmoke, activeTab]);

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
    setUndoKind('SMOKE');
    setUndoEntryId(newEntry.id);
    setUndoCountdown(120); // 2-minute undo per spec

    // In quit mode, offer non-punitive slip recovery — but only for a cigarette
    // just smoked. Backdated entries are history, not a moment that needs triage.
    const isJustNow = !extraData?.timestamp || Date.now() - extraData.timestamp < 10 * 60 * 1000;
    if (plan.mode === 'QUIT' && isJustNow) {
      setTimeout(() => {
        setShowSlipSheet(true);
      }, 400);
    }
  };

  // Log one porn/fap slip. Same 2-minute undo as smoking, no shame machinery.
  const handleLogFap = () => {
    const entry: Entry = {
      id: `fap_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'FAP',
      habitId: 'fap',
      source: 'app',
    };
    Storage.addEntry(entry);
    setUndoKind('FAP');
    setUndoEntryId(entry.id);
    setUndoCountdown(120);
  };

  // An urge that was ridden out is a win even when the timer later restarts.
  const handleFapUrgeBeaten = () => {
    const entry: Entry = {
      id: `fap_urge_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'FAP_URGE_BEATEN',
      habitId: 'fap',
      source: 'app',
    };
    Storage.addEntry(entry);
    const count = entries.filter((e) => !e.undone && e.type === 'FAP_URGE_BEATEN').length + 1;
    setCelebrationMessage(`That's ${count} urges ridden out`);
    setCelebrationActive(true);
  };

  // Daily identity vote: one tap, one entry, no streak to break
  const handlePledge = () => {
    const entry: Entry = {
      id: `pledge_${Date.now()}`,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'PLEDGE',
      habitId: 'smoking',
      source: 'app',
    };
    Storage.addEntry(entry);
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

  const dayGreeting = !tracksSmoke
    ? 'Porn / fap tracking'
    : plan.mode === 'QUIT'
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
        {/* Top App Bar with Launcher & Widgets switch. The redesigned home carries its own bar. */}
        {!(activeTab === 'today' && (plan.mode === 'QUIT' || fapOnly)) && (
          <TopBar
            plan={plan}
            currentTheme={resolvedTheme}
            onToggleTheme={handleToggleTheme}
            onOpenSos={handleOpenSosModal}
            onOpenLauncher={() => setShowWidgetSimulator(true)}
            dayGreeting={dayGreeting}
          />
        )}

        {/* Tab Content */}
        <main className="flex-1 w-full">
          {activeTab === 'today' && plan.mode === 'QUIT' && !fapOnly && (
            <HomeScreen
              plan={plan}
              entries={entries}
              homeLayout={plan.homeLayout && plan.homeLayout.length > 0 ? plan.homeLayout : DEFAULT_HOME_LAYOUT}
              onOpenJourney={() => setActiveTab('journey')}
              onOpenToolkit={() => setActiveTab('toolkit')}
              onOpenSos={handleOpenSosModal}
              onOpenCustomize={() => setShowCustomizeHome(true)}
              onOpenPace={() => setActiveTab('pace')}
              onOpenLogSheet={() => setShowLogSheet(true)}
              onPledge={handlePledge}
              onLogCigarette={() => handleLogCigarette()}
              onOpenSettings={() => setActiveTab('toolkit')}
              showFap={tracksFap}
              onLogFap={handleLogFap}
              onOpenFapUrge={handleOpenFapUrge}
            />
          )}

          {/* Fap-only home: the smoking dashboard would all be zeroes for them. */}
          {activeTab === 'today' && fapOnly && (
            <FapHome
              plan={plan}
              entries={entries}
              onLogSlip={handleLogFap}
              onOpenUrgeHelp={handleOpenFapUrge}
              onOpenSettings={() => setActiveTab('toolkit')}
            />
          )}

          {/* Cut-down and track modes keep the original home until they get the same treatment. */}
          {activeTab === 'today' && plan.mode !== 'QUIT' && !fapOnly && (
            <div className="space-y-4 px-4 pt-3 pb-40">
              <HeroCard
                plan={plan}
                entries={entries}
                onOpenMilestones={() => setActiveTab('journey')}
                onOpenPlan={() => setActiveTab('toolkit')}
              />

              <QuickActions
                mode={plan.mode}
                confirmBeforeLog={plan.confirmBeforeLog}
                onLogCigarette={handleLogCigarette}
                onOpenSos={handleOpenSosModal}
                onOpenLogSheet={() => setShowLogSheet(true)}
                onOpenCustomize={() => setShowCustomizeHome(true)}
              />

              {/* Cut-down and track modes need the second tracker too. */}
              {tracksFap && (
                <FapCard
                  plan={plan}
                  entries={entries}
                  onLogSlip={handleLogFap}
                  onOpenUrgeHelp={handleOpenFapUrge}
                  onOpenSettings={() => setActiveTab('toolkit')}
                />
              )}
            </div>
          )}

          {activeTab === 'pace' && tracksSmoke && (
            <PaceTab
              plan={plan}
              entries={entries}
              onLog={() => setShowLogSheet(true)}
              onOpenSos={handleOpenSosModal}
            />
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
                {undoKind === 'FAP' ? 'Slip logged. Timer restarted.' : 'Logged. Your timer restarted.'}
              </span>
              <span className="text-[11px] text-[#8A8A8A] block mt-0.5">
                {undoKind === 'FAP'
                  ? `Nothing before this is erased. (${undoMins}:${undoSecs})`
                  : `You still have ${smokeFree.completedSmokeFreeDays} smoke-free days behind you. (${undoMins}:${undoSecs})`}
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
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onCraving={handleOpenSosModal}
          hidePace={!tracksSmoke}
        />
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
          habit={sosHabit}
          toolStats={toolStats}
          onClose={handleCloseSosModal}
          onCravingBeaten={(duration, tool) => {
            if (sosHabit === 'FAP') handleFapUrgeBeaten();
            else handleCravingBeaten(duration, tool);
            handleCloseSosModal();
          }}
          onSmokedDuringCraving={() => {
            if (sosHabit === 'FAP') handleLogFap();
            else handleLogCigarette();
            handleCloseSosModal();
          }}
          onRecordToolFeedback={handleToolFeedback}
        />
      )}

      {/* Fast, honest cigarette logging (time chips + triggers + pace preview) */}
      <SmokeLogSheet
        isOpen={showLogSheet}
        plan={plan}
        entries={entries}
        onClose={() => {
          setShowLogSheet(false);
          clearLogHash();
        }}
        onSubmit={(data) => handleLogCigarette(data)}
        onResisted={() => handleCravingBeaten(0)}
      />

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

      {/* One-time habit question for people who onboarded before it existed */}
      {showHabitPrompt && !showOnboarding && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] dark:bg-[#0A0A0A] text-black dark:text-white border border-[#C4C4C4] dark:border-[#2A2A2A] p-5 space-y-3">
            <h2 className="text-xl font-black tracking-tight">What are you trying to quit?</h2>
            <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
              Tally now tracks smoking and porn/fap separately. Pick what applies; you can
              change it any time in Settings.
            </p>
            {[
              { label: 'Smoking', targets: ['SMOKE'] as HabitTarget[], desc: 'Cigarettes, vapes, shisha' },
              { label: 'Porn or fap', targets: ['FAP'] as HabitTarget[], desc: 'Compulsive porn use or masturbation' },
              { label: 'Both', targets: ['SMOKE', 'FAP'] as HabitTarget[], desc: 'Track both side by side' },
            ].map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  const updated = { ...plan, targets: option.targets, habitChoiceMade: true };
                  setPlan(updated);
                  Storage.savePlan(updated);
                  setShowHabitPrompt(false);
                }}
                className="w-full p-4 rounded-2xl border border-[#C4C4C4] dark:border-[#3D3D3D] text-left hover:border-black dark:hover:border-white transition"
              >
                <span className="text-sm font-bold block">{option.label}</span>
                <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>
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
