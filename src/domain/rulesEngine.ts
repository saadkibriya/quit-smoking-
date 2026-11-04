import { UserPlan, Entry, ToolStat } from '../types';
import { calculateDependenceScore, calculateCurrentStreak } from './calculations';

export interface CopingTool {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badge?: string;
}

export const ALL_COPING_TOOLS: CopingTool[] = [
  {
    id: 'breathe',
    name: 'Breathe',
    description: 'Paced 4-4-6 breathing with a calm tactile pulse.',
    iconName: 'wind',
  },
  {
    id: 'play_tape',
    name: 'Play the tape forward',
    description: 'Walk through what really happens an hour after smoking.',
    iconName: 'film',
  },
  {
    id: 'my_why',
    name: 'My Why',
    description: 'Your personal reasons and anchor photo.',
    iconName: 'heart',
  },
  {
    id: 'delay_5m',
    name: 'Delay 5 minutes',
    description: 'Ride out the urge curve with a visual countdown.',
    iconName: 'clock',
  },
  {
    id: 'do_something_else',
    name: 'Do something else',
    description: 'Drink freezing water, walk, chew mint gum, wash face.',
    iconName: 'activity',
  },
  {
    id: 'call_person',
    name: 'Call my person',
    description: 'Direct tap to ring your support contact or quitline.',
    iconName: 'phone',
  },
  {
    id: 'tap_game',
    name: 'Tap game',
    description: '60 seconds of tapping popping squares to break the urge loop.',
    iconName: 'gamepad-2',
  },
];

// Determine prioritized tool order based on triggers and user feedback votes
export function getRankedCopingTools(plan: UserPlan, toolStats: ToolStat[] = []): CopingTool[] {
  const topTrigger = plan.triggers[0] || 'stress';

  // Base priority by trigger
  const triggerOrder: Record<string, string[]> = {
    stress: ['breathe', 'play_tape', 'delay_5m', 'do_something_else', 'my_why', 'tap_game', 'call_person'],
    after_argument: ['breathe', 'call_person', 'play_tape', 'do_something_else', 'delay_5m', 'tap_game', 'my_why'],
    boredom: ['tap_game', 'do_something_else', 'breathe', 'delay_5m', 'my_why', 'play_tape', 'call_person'],
    phone_scrolling: ['tap_game', 'do_something_else', 'breathe', 'delay_5m', 'play_tape', 'my_why', 'call_person'],
    coffee_tea: ['do_something_else', 'breathe', 'delay_5m', 'play_tape', 'my_why', 'call_person', 'tap_game'],
    after_meals: ['do_something_else', 'breathe', 'delay_5m', 'play_tape', 'my_why', 'call_person', 'tap_game'],
    waking_up: ['do_something_else', 'breathe', 'my_why', 'delay_5m', 'play_tape', 'call_person', 'tap_game'],
    alcohol: ['play_tape', 'call_person', 'my_why', 'delay_5m', 'do_something_else', 'breathe', 'tap_game'],
    friends_who_smoke: ['play_tape', 'call_person', 'my_why', 'delay_5m', 'do_something_else', 'breathe', 'tap_game'],
    driving: ['do_something_else', 'breathe', 'play_tape', 'delay_5m', 'my_why', 'tap_game', 'call_person'],
  };

  const preferredIds = triggerOrder[topTrigger] || triggerOrder.stress;

  // Boost by positive helpfulness votes
  const statsMap = new Map<string, number>();
  for (const s of toolStats) {
    const netHelped = s.timesHelped - (s.timesUsed - s.timesHelped);
    statsMap.set(s.toolId, netHelped);
  }

  const sorted = [...ALL_COPING_TOOLS].sort((a, b) => {
    const scoreA = (statsMap.get(a.id) || 0) * 2 - preferredIds.indexOf(a.id);
    const scoreB = (statsMap.get(b.id) || 0) * 2 - preferredIds.indexOf(b.id);
    return scoreB - scoreA;
  });

  return sorted;
}

// Three coach voice variants (Gentle / Direct / Science)
export function getToneMessage(
  key: 'DAY_1' | 'DAY_4' | 'SLIP' | 'CRAVING_BEATEN' | 'STRETCH_WIN',
  style: UserPlan['coachStyle'],
  data?: { smokeFreeDays?: number; beatenCount?: number; daysRemaining?: number }
): string {
  const messages = {
    DAY_1: {
      GENTLE: "You've taken the kindest step for yourself today. One hour at a time.",
      DIRECT: 'Day 1. Clear out the lighters and cigarettes. You got this.',
      SCIENCE: 'Day 1. Within 12 hours, carbon monoxide levels drop and blood oxygen climbs back to normal.',
    },
    DAY_4: {
      GENTLE: 'Day 4. Nicotine has fully cleared your body. Be proud of getting through the peak.',
      DIRECT: 'Day 4. The drug is out of your blood. What is left is habit, and habits can change.',
      SCIENCE: 'Day 4. Blood cotinine and nicotine levels are now near zero. Ciliary clearing is commencing.',
    },
    SLIP: {
      GENTLE: `Logged. Your ${data?.smokeFreeDays || 0} smoke-free days still count. Take a slow breath.`,
      DIRECT: `Logged. That was one cigarette, not a surrender. Your ${data?.smokeFreeDays || 0} days stand. What happened?`,
      SCIENCE: `Slip recorded. Cumulative harm reduction is intact. Science allows early slips; the next cigarette is the one that matters.`,
    },
    CRAVING_BEATEN: {
      GENTLE: `You rode that wave out beautifully. That's ${data?.beatenCount || 1} cravings beaten now.`,
      DIRECT: `Urge beaten. That's ${data?.beatenCount || 1}. Momentum is building.`,
      SCIENCE: `Craving episode neutralized. Dopamine neural pathways are uncoupling from nicotine cues.`,
    },
    STRETCH_WIN: {
      GENTLE: 'Great patience! Waiting past your craving strengthens your freedom.',
      DIRECT: 'Target stretch reached. Strong discipline.',
      SCIENCE: 'Extending the interval between doses lowers peak arterial nicotine spikes.',
    },
  };

  return messages[key][style] || messages[key].GENTLE;
}

// Rules engine contextual cards generator for Today and Toolkit
export function getActiveRuleAlerts(plan: UserPlan, entries: Entry[]): Array<{
  id: string;
  type: 'DOCTOR' | 'HEADS_UP' | 'MORNING' | 'WEEKEND';
  title: string;
  message: string;
}> {
  const alerts: Array<{
    id: string;
    type: 'DOCTOR' | 'HEADS_UP' | 'MORNING' | 'WEEKEND';
    title: string;
    message: string;
  }> = [];

  const dep = calculateDependenceScore(plan.usualPerDay, plan.timeToFirstCigarette);
  const streak = calculateCurrentStreak(entries, plan.quitStartDate);

  // High dependence in first 14 days
  if ((dep.score >= 5 || plan.pastAttemptsCount === '6+') && streak.days < 14) {
    alerts.push({
      id: 'high_dep_doctor',
      type: 'DOCTOR',
      title: 'Doctor Corner: Combination Support',
      message:
        'With high nicotine dependence, clinical guidelines strongly recommend combining a long-acting patch with fast-acting lozenges or gum. Medicine plus support doubles your odds.',
    });
  }

  // Morning smoker check
  if (plan.timeToFirstCigarette === 'within_5' || plan.timeToFirstCigarette === '6_to_30') {
    alerts.push({
      id: 'morning_routine_swap',
      type: 'MORNING',
      title: 'Morning Routine Swap',
      message:
        'Because your first cigarette was usually right after waking, swap your morning sequence: drink ice water before coffee, and step outside for 2 minutes of deep breathing.',
    });
  }

  // Weekend alcohol check on Friday/Saturday
  const todayDow = new Date().getDay();
  if ((todayDow === 5 || todayDow === 6) && plan.triggers.includes('alcohol')) {
    alerts.push({
      id: 'weekend_alcohol',
      type: 'WEEKEND',
      title: 'Weekend Heads-Up: Alcohol & Parties',
      message:
        'Alcohol lowers inhibition and sharpens cigarette cravings. Have your non-alcoholic substitute ready, and remind yourself: not one puff.',
    });
  }

  return alerts;
}
