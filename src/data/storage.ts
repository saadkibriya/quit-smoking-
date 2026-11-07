import { Entry, UserPlan, QuitAttempt, EarnedBadge, ToolStat, ChatMessage, OtherHabit, HomeLayoutItem, HomeCardId } from '../types';
import { generateDemoData } from '../domain/demoData';

const STORAGE_KEYS = {
  ENTRIES: 'unlit_entries_v1',
  PLAN: 'unlit_plan_v1',
  ATTEMPTS: 'unlit_attempts_v1',
  BADGES: 'unlit_badges_v1',
  TOOL_STATS: 'unlit_tool_stats_v1',
  CHAT_MESSAGES: 'unlit_chat_messages_v1',
  OTHER_HABITS: 'unlit_other_habits_v1',
};

// Section 1 & 2 default home layout (Progressive disclosure: 4 cards only)
export const DEFAULT_HOME_LAYOUT: HomeLayoutItem[] = [
  { cardId: 'TIMER', visible: true, size: 'W' },
  { cardId: 'MONEY_SAVED', visible: true, size: 'S' },
  { cardId: 'NOT_SMOKED', visible: true, size: 'S' },
  { cardId: 'NEXT_MILESTONE', visible: true, size: 'W' },
];

export interface CardMeta {
  id: HomeCardId;
  label: string;
  description: string;
  defaultSize: 'S' | 'W' | 'L';
  isPermanent?: boolean;
}

export const ALL_HOME_CARDS: CardMeta[] = [
  { id: 'TIMER', label: 'Smoke-free timer', description: 'Live-ticking smoke-free days and hours timer', defaultSize: 'W', isPermanent: true },
  { id: 'MONEY_SAVED', label: 'Money saved', description: 'Real-time calculation of money saved since quitting', defaultSize: 'S' },
  { id: 'NOT_SMOKED', label: 'Cigarettes not smoked', description: 'Total count of avoided cigarettes based on usual intake', defaultSize: 'S' },
  { id: 'NEXT_MILESTONE', label: 'Next health milestone', description: 'WHO/NHS certified milestone with dot progress bar', defaultSize: 'W' },
  { id: 'HEALTH_TIMELINE', label: 'Full health timeline', description: 'Upcoming bodily recovery stages and clinical sources', defaultSize: 'W' },
  { id: 'CRAVINGS_RESISTED', label: 'Cravings resisted', description: 'Total urge waves you successfully rode out', defaultSize: 'S' },
  { id: 'LONGEST_STREAK', label: 'Longest streak & total days', description: 'Personal record streak and total smoke-free days', defaultSize: 'W' },
  { id: 'DOT_CALENDAR', label: 'Dot calendar (last 4 weeks)', description: '28-dot matrix showing smoke-free and slip days', defaultSize: 'W' },
  { id: 'DAILY_CHART', label: 'Daily smoked / craving chart', description: 'Visual trend of daily cigarette count and cravings', defaultSize: 'W' },
  { id: 'TRIGGERS_LOG', label: 'Triggers & craving log', description: 'Top situational triggers and craving patterns', defaultSize: 'W' },
  { id: 'REASONS', label: 'My reasons to quit', description: 'Your personal motivation anchors and photos', defaultSize: 'W' },
  { id: 'SAVINGS_GOAL', label: 'Savings goal', description: 'Track progress toward a tangible purchase reward', defaultSize: 'W' },
  { id: 'ACHIEVEMENTS', label: 'Achievements', description: 'Earned milestones and clinical achievement badges', defaultSize: 'W' },
  { id: 'LIFE_REGAINED', label: 'Time of life regained', description: 'Estimated life hours gained back (~20 min/cigarette)', defaultSize: 'W' },
  { id: 'NORMAL_TODAY', label: "What's normal today", description: 'Evidence-based symptoms and sensations expected today', defaultSize: 'W' },
  { id: 'TOUGHEST_HOURS', label: 'Toughest hours', description: 'Peak craving hours of day based on your logging history', defaultSize: 'W' },
  { id: 'GROWTH_PLANT', label: 'Growth visualization', description: 'Digital plant/blocks flourishing with your clean streak', defaultSize: 'L' },
  { id: 'DAILY_PLEDGE', label: 'Daily pledge card', description: 'Morning commitment: "Today I will not smoke"', defaultSize: 'S' },
  { id: 'COACH_TIP', label: 'Coach tip of the day', description: 'Evidence-based behavioral nudge from cessation science', defaultSize: 'W' },
];


export const DEFAULT_PLAN: UserPlan = {
  mode: 'QUIT',
  quitStartDate: new Date().toISOString(),
  usualPerDay: 15,
  cigarettesPerPack: 20,
  packPrice: 10,
  packPriceHistory: [{ price: 10, effectiveFromDate: '2026-01-01' }],
  currency: '৳',
  weekStartDay: 'MONDAY',
  wakeTime: '07:00',
  sleepTime: '23:00',
  timeToFirstCigarette: '6_to_30',
  pastAttemptsCount: '1 to 2',
  pastLongestStreakDays: '3',
  pastRelapseReasons: ['Stress', 'Social pressure'],
  triggers: ['stress', 'coffee_tea', 'after_meals'],
  reasons: ['health', 'freedom', 'money'],
  coachStyle: 'GENTLE',
  age: 30,
  healthFlags: {
    pregnantOrBreastfeeding: false,
    heartCondition: false,
    mentalHealthCondition: false,
    takingInteractingMeds: false,
  },
  supportContact: {
    name: '',
    phone: '',
  },
  onboardingCompleted: false,
  themePreference: 'NIGHT',
  aiCoachEnabled: true,
  quietHoursEnabled: true,
  riskyHourNudgeEnabled: true,
  maxNotificationsPerDay: 2,
  customMilestones: [],
  homeLayout: DEFAULT_HOME_LAYOUT,
  layoutVersion: 1,
  breathingPattern: '4-in / 6-out',
  confirmBeforeLog: false,
  haptics: true,
  savingsGoal: { name: 'Reward goal', targetAmount: 100 },
  widgetLayout: [
    { id: 'w_timer', type: 'TIMER', size: 'W' },
    { id: 'w_quick_log', type: 'QUICK_LOG', size: 'S' },
    { id: 'w_sos', type: 'SOS', size: 'S' },
    { id: 'w_round', type: 'ROUND_PROGRESS', size: 'W' },
    { id: 'w_money', type: 'MONEY_KEPT', size: 'S' },
    { id: 'w_beaten', type: 'CRAVINGS_BEATEN', size: 'S' },
    { id: 'w_what_normal', type: 'WHAT_IS_NORMAL', size: 'W' },
    { id: 'w_week_comp', type: 'WEEK_COMPARISON', size: 'W' },
  ],
  ifThenPlans: [
    {
      id: 'plan_default_1',
      trigger: 'stress',
      action: 'Pause immediately, do 4-4-6 paced breathing, and remember cravings peak and pass.',
    },
    {
      id: 'plan_default_2',
      trigger: 'coffee_tea',
      action: 'Drink a glass of cold water first, and drink coffee in a new spot.',
    },
    {
      id: 'plan_default_3',
      trigger: 'after_meals',
      action: 'Stand up immediately, brush teeth, or chew strong cinnamon gum.',
    },
  ],
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeStorage(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export const Storage = {
  getEntries(): Entry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveEntries(entries: Entry[]) {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    notify();
  },

  addEntry(entry: Entry) {
    const entries = this.getEntries();
    entries.push(entry);
    this.saveEntries(entries);
  },

  removeEntry(id: string) {
    const entries = this.getEntries().filter((e) => e.id !== id);
    this.saveEntries(entries);
  },

  updateEntry(id: string, updates: Partial<Entry>) {
    const entries = this.getEntries().map((e) => (e.id === id ? { ...e, ...updates } : e));
    this.saveEntries(entries);
  },

  markEntryUndone(id: string) {
    const entries = this.getEntries().map((e) => (e.id === id ? { ...e, undone: true } : e));
    this.saveEntries(entries);
  },

  getPlan(): UserPlan {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PLAN);
      if (!raw) return DEFAULT_PLAN;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PLAN,
        ...parsed,
        homeLayout: parsed.homeLayout && parsed.homeLayout.length > 0 ? parsed.homeLayout : DEFAULT_HOME_LAYOUT,
      };
    } catch {
      return DEFAULT_PLAN;
    }
  },

  savePlan(plan: UserPlan) {
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
    notify();
  },

  getAttempts(): QuitAttempt[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAttempts(attempts: QuitAttempt[]) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    notify();
  },

  getBadges(): EarnedBadge[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BADGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addBadge(milestoneId: string) {
    const badges = this.getBadges();
    if (!badges.some((b) => b.milestoneId === milestoneId)) {
      badges.push({ milestoneId, earnedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
      notify();
    }
  },

  getToolStats(): ToolStat[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TOOL_STATS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  recordToolUse(toolId: string, helped: boolean) {
    const stats = this.getToolStats();
    let existing = stats.find((s) => s.toolId === toolId);
    if (!existing) {
      existing = { toolId, timesUsed: 0, timesHelped: 0 };
      stats.push(existing);
    }
    existing.timesUsed += 1;
    if (helped) existing.timesHelped += 1;
    localStorage.setItem(STORAGE_KEYS.TOOL_STATS, JSON.stringify(stats));
    notify();
  },

  getChatMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: ChatMessage[]) {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    notify();
  },

  getOtherHabits(): OtherHabit[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OTHER_HABITS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveOtherHabits(habits: OtherHabit[]) {
    localStorage.setItem(STORAGE_KEYS.OTHER_HABITS, JSON.stringify(habits));
    notify();
  },

  loadDemo() {
    const demo = generateDemoData();
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(demo.entries));
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(demo.plan));
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(demo.attempts));
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(demo.badges));
    notify();
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.PLAN);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.TOOL_STATS);
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.OTHER_HABITS);
    notify();
  },

  exportJson(): string {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      plan: this.getPlan(),
      entries: this.getEntries(),
      attempts: this.getAttempts(),
      badges: this.getBadges(),
      toolStats: this.getToolStats(),
      otherHabits: this.getOtherHabits(),
    };
    return JSON.stringify(bundle, null, 2);
  },

  exportCsv(): string {
    const entries = this.getEntries();
    const headers = ['id', 'date_iso', 'type', 'triggers', 'mood', 'craving_strength', 'craving_duration_sec', 'tool_used', 'note'];
    const rows = entries.map((e) => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.type,
      (e.triggers || []).join(';'),
      e.mood ?? '',
      e.cravingStrength ?? '',
      e.cravingDurationSeconds ?? '',
      e.toolUsed ?? '',
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  importJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.plan) this.savePlan(data.plan);
      if (Array.isArray(data.entries)) this.saveEntries(data.entries);
      if (Array.isArray(data.attempts)) this.saveAttempts(data.attempts);
      if (Array.isArray(data.badges)) localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(data.badges));
      if (Array.isArray(data.toolStats)) localStorage.setItem(STORAGE_KEYS.TOOL_STATS, JSON.stringify(data.toolStats));
      notify();
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  },
};
