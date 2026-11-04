export type HabitMode = 'QUIT' | 'CUT_DOWN' | 'TRACK';

export type EntryType = 'CIGARETTE' | 'CRAVING_BEATEN' | 'PLEDGE';

export type CoachStyle = 'GENTLE' | 'DIRECT' | 'SCIENCE';

export type WeekStartDay = 'MONDAY' | 'SUNDAY' | 'SATURDAY';

export type TimeToFirstCigarette = 'within_5' | '6_to_30' | '31_to_60' | 'after_60';

export interface Entry {
  id: string;
  timestamp: number; // UTC ms
  timezoneOffset: number; // minutes
  type: EntryType;
  triggers?: string[];
  mood?: number; // 1 to 5
  cravingStrength?: number; // 1 to 10
  cravingDurationSeconds?: number;
  toolUsed?: string;
  note?: string;
  manualEntry?: boolean;
  habitId?: string; // default: 'smoking'
}

export interface PackPriceEntry {
  price: number;
  effectiveFromDate: string; // YYYY-MM-DD
}

export interface HealthFlags {
  pregnantOrBreastfeeding: boolean;
  heartCondition: boolean;
  mentalHealthCondition: boolean;
  takingInteractingMeds: boolean; // clozapine, olanzapine, theophylline, warfarin
}

export interface SupportContact {
  name: string;
  phone: string;
}

export interface CutDownSchedule {
  planWeeks: number; // 2 or 4
  startDate: string; // YYYY-MM-DD
  quitDate: string; // YYYY-MM-DD
  initialUsual: number;
}

export interface CustomMilestone {
  id: string;
  title: string;
  hours: number;
  whyItMatters: string;
}

export interface WidgetLayoutItem {
  id: string;
  type: string;
  size: 'S' | 'W' | 'L'; // Small (1 col), Wide (2 cols), Large (2x2)
}

export interface IfThenPlan {
  id: string;
  trigger: string;
  action: string;
}

export interface UserPlan {
  mode: HabitMode;
  quitStartDate: string; // ISO string when quit streak begins
  usualPerDay: number;
  cigarettesPerPack: number;
  packPrice: number;
  packPriceHistory: PackPriceEntry[];
  currency: string;
  weekStartDay: WeekStartDay;
  wakeTime: string; // e.g. "07:00"
  sleepTime: string; // e.g. "23:00"
  timeToFirstCigarette: TimeToFirstCigarette;
  pastAttemptsCount: string;
  pastLongestStreakDays: string;
  pastRelapseReasons: string[];
  triggers: string[];
  reasons: string[];
  whyPhotoUrl?: string;
  coachStyle: CoachStyle;
  age?: number;
  healthFlags: HealthFlags;
  supportContact: SupportContact;
  cutDownSchedule?: CutDownSchedule;
  onboardingCompleted: boolean;
  themePreference: 'DAY' | 'NIGHT' | 'AUTO';
  aiCoachEnabled: boolean;
  quietHoursEnabled: boolean;
  riskyHourNudgeEnabled: boolean;
  maxNotificationsPerDay: number;
  customMilestones: CustomMilestone[];
  widgetLayout: WidgetLayoutItem[];
  ifThenPlans: IfThenPlan[];
}

export interface QuitAttempt {
  id: string;
  startDate: string;
  endDate?: string;
  bestStreakHours: number;
  smokeFreeDays: number;
  reasonForRestart?: string;
}

export interface ToolStat {
  toolId: string;
  timesUsed: number;
  timesHelped: number;
}

export interface EarnedBadge {
  milestoneId: string;
  earnedAt: string; // ISO
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: number;
  isSafetyAlert?: boolean;
}

export interface OtherHabit {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  dailyGoal: number;
  createdAt: string;
}
