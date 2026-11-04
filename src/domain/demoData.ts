import { Entry, UserPlan, QuitAttempt, EarnedBadge } from '../types';

export function generateDemoData(): {
  entries: Entry[];
  plan: UserPlan;
  attempts: QuitAttempt[];
  badges: EarnedBadge[];
} {
  const now = Date.now();
  const entries: Entry[] = [];

  // Quit date was 18 days ago
  const quitStartDate = new Date(now - 18 * 86400 * 1000).toISOString();

  // Past 60 days to 19 days ago: tapering pre-quit phase
  for (let i = 60; i >= 19; i--) {
    const dayStart = now - i * 86400 * 1000;
    // Smoked 8 to 15 per day
    const count = Math.max(3, Math.round(15 - (60 - i) * 0.18));
    for (let c = 0; c < count; c++) {
      const hourOffset = 7 + Math.floor((c / count) * 15);
      const entryTime = dayStart + hourOffset * 3600 * 1000 + Math.floor(Math.random() * 1800000);
      entries.push({
        id: `demo_pre_${i}_${c}`,
        timestamp: entryTime,
        timezoneOffset: new Date().getTimezoneOffset(),
        type: 'CIGARETTE',
        triggers: ['coffee_tea', 'after_meals', 'work_breaks'],
        mood: 3,
        cravingStrength: 6,
      });
    }
  }

  // Days 18 to 1 ago: quit mode with cravings beaten, pledges, and ONE isolated slip 6 days ago
  const cravingDurations = [180, 240, 310, 360, 420, 290, 340, 260, 380, 410, 300];

  for (let i = 18; i >= 1; i--) {
    const dayStart = now - i * 86400 * 1000;

    // Morning pledge
    entries.push({
      id: `demo_pledge_${i}`,
      timestamp: dayStart + 8 * 3600 * 1000,
      timezoneOffset: new Date().getTimezoneOffset(),
      type: 'PLEDGE',
      note: 'Today I choose freedom.',
    });

    // 1 to 3 cravings beaten per day
    const cravingsToday = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < cravingsToday; c++) {
      const dur = cravingDurations[Math.floor(Math.random() * cravingDurations.length)];
      entries.push({
        id: `demo_craving_${i}_${c}`,
        timestamp: dayStart + (11 + c * 4) * 3600 * 1000 + Math.floor(Math.random() * 1800000),
        timezoneOffset: new Date().getTimezoneOffset(),
        type: 'CRAVING_BEATEN',
        cravingDurationSeconds: dur,
        toolUsed: c === 0 ? 'breathe' : 'do_something_else',
        triggers: ['stress', 'after_meals'],
        mood: 4,
      });
    }

    // Single isolated slip on day 6 ago (1 cigarette logged)
    if (i === 6) {
      entries.push({
        id: `demo_slip_day6`,
        timestamp: dayStart + 21 * 3600 * 1000, // 9 PM evening slip
        timezoneOffset: new Date().getTimezoneOffset(),
        type: 'CIGARETTE',
        triggers: ['friends_who_smoke', 'alcohol'],
        mood: 2,
        cravingStrength: 8,
        note: 'Went out for dinner with smoking friends. Logged immediately.',
      });
    }
  }

  // Today (smoke-free so far, 2 cravings beaten)
  entries.push({
    id: `demo_pledge_today`,
    timestamp: now - 3 * 3600 * 1000,
    timezoneOffset: new Date().getTimezoneOffset(),
    type: 'PLEDGE',
    note: "Today I won't smoke.",
  });

  entries.push({
    id: `demo_craving_today_1`,
    timestamp: now - 2 * 3600 * 1000,
    timezoneOffset: new Date().getTimezoneOffset(),
    type: 'CRAVING_BEATEN',
    cravingDurationSeconds: 320,
    toolUsed: 'breathe',
    triggers: ['coffee_tea'],
  });

  entries.push({
    id: `demo_craving_today_2`,
    timestamp: now - 45 * 60 * 1000,
    timezoneOffset: new Date().getTimezoneOffset(),
    type: 'CRAVING_BEATEN',
    cravingDurationSeconds: 270,
    toolUsed: 'delay_5m',
    triggers: ['work_breaks'],
  });

  const plan: UserPlan = {
    mode: 'QUIT',
    quitStartDate,
    usualPerDay: 15,
    cigarettesPerPack: 20,
    packPrice: 12.5,
    packPriceHistory: [{ price: 12.5, effectiveFromDate: '2026-01-01' }],
    currency: '$',
    weekStartDay: 'MONDAY',
    wakeTime: '07:00',
    sleepTime: '23:00',
    timeToFirstCigarette: '6_to_30',
    pastAttemptsCount: '3 to 5',
    pastLongestStreakDays: '14',
    pastRelapseReasons: ['Stress at work', 'Weekend drinks with friends'],
    triggers: ['coffee_tea', 'after_meals', 'stress', 'friends_who_smoke'],
    reasons: ['health', 'family_kids', 'money', 'breathing_fitness'],
    coachStyle: 'GENTLE',
    age: 34,
    healthFlags: {
      pregnantOrBreastfeeding: false,
      heartCondition: false,
      mentalHealthCondition: false,
      takingInteractingMeds: false,
    },
    supportContact: {
      name: 'Sarah (Partner)',
      phone: '555-0199',
    },
    onboardingCompleted: true,
    themePreference: 'DAY',
    aiCoachEnabled: true,
    quietHoursEnabled: true,
    riskyHourNudgeEnabled: true,
    maxNotificationsPerDay: 2,
    customMilestones: [],
    widgetLayout: [
      { id: 'w1', type: 'TIMER', size: 'W' },
      { id: 'w2', type: 'QUICK_LOG', size: 'S' },
      { id: 'w3', type: 'SOS', size: 'S' },
      { id: 'w4', type: 'MONEY_KEPT', size: 'S' },
      { id: 'w5', type: 'CIGS_AVOIDED', size: 'S' },
      { id: 'w6', type: 'LIFE_REGAINED', size: 'W' },
      { id: 'w7', type: 'ROUND_PROGRESS', size: 'W' },
      { id: 'w8', type: 'WEEK_COMPARISON', size: 'W' },
      { id: 'w9', type: 'WHAT_IS_NORMAL', size: 'W' },
      { id: 'w10', type: 'MY_WHY', size: 'W' },
    ],
    ifThenPlans: [
      {
        id: 'p1',
        trigger: 'coffee_tea',
        action: 'Drink ice water first, and drink coffee in the garden with 5 deep breaths.',
      },
      {
        id: 'p2',
        trigger: 'stress',
        action: 'Step away from screen, do 4-4-6 paced breathing, and text Sarah.',
      },
      {
        id: 'p3',
        trigger: 'after_meals',
        action: 'Immediately stand up, brush teeth or chew cinnamon gum.',
      },
    ],
  };

  const attempts: QuitAttempt[] = [
    {
      id: 'att_1',
      startDate: new Date(now - 120 * 86400 * 1000).toISOString(),
      endDate: new Date(now - 106 * 86400 * 1000).toISOString(),
      bestStreakHours: 336, // 14 days
      smokeFreeDays: 14,
      reasonForRestart: 'Work deadline stress',
    },
    {
      id: 'att_2',
      startDate: quitStartDate,
      bestStreakHours: 144, // 6 days current
      smokeFreeDays: 17,
    },
  ];

  const badges: EarnedBadge[] = [
    { milestoneId: 'm_24h', earnedAt: new Date(now - 17 * 86400 * 1000).toISOString() },
    { milestoneId: 'm_72h', earnedAt: new Date(now - 15 * 86400 * 1000).toISOString() },
    { milestoneId: 'm_7d', earnedAt: new Date(now - 11 * 86400 * 1000).toISOString() },
    { milestoneId: 'm_14d', earnedAt: new Date(now - 4 * 86400 * 1000).toISOString() },
  ];

  return { entries, plan, attempts, badges };
}
