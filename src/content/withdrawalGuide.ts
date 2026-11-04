export interface DayCourseGuide {
  id: string;
  minDay: number;
  maxDay: number;
  phaseLabel: string;
  whatsCommon: string;
  whatToTellYourself: string;
}

export const DAY_BY_DAY_GUIDE: DayCourseGuide[] = [
  {
    id: 'first_24h',
    minDay: 0,
    maxDay: 1,
    phaseLabel: 'First 24 hours',
    whatsCommon: 'Cravings start within hours; feeling restless and irritable.',
    whatToTellYourself: "This is withdrawal starting. It's temporary.",
  },
  {
    id: 'days_1_3',
    minDay: 1,
    maxDay: 3,
    phaseLabel: 'Days 1 to 3',
    whatsCommon: 'Often the toughest stretch: cravings, irritability, anxiety, trouble concentrating.',
    whatToTellYourself: "Nicotine is leaving my body. By day 3 it's essentially gone.",
  },
  {
    id: 'days_4_7',
    minDay: 4,
    maxDay: 7,
    phaseLabel: 'Days 4 to 7',
    whatsCommon: 'Still strong but starting to ease; sleep trouble, vivid smoking dreams, more hunger.',
    whatToTellYourself: "Dreams about smoking are common. They don't mean I'll smoke.",
  },
  {
    id: 'week_2',
    minDay: 8,
    maxDay: 14,
    phaseLabel: 'Week 2',
    whatsCommon: 'Mood symptoms easing; cravings come less often.',
    whatToTellYourself: 'The first two weeks matter most. Not a puff.',
  },
  {
    id: 'weeks_3_4',
    minDay: 15,
    maxDay: 28,
    phaseLabel: 'Weeks 3 to 4',
    whatsCommon: 'Most mood symptoms fade (they usually last 2 to 4 weeks); appetite may stay up.',
    whatToTellYourself: 'For most people, the worst is behind them now.',
  },
  {
    id: 'weeks_5_12',
    minDay: 29,
    maxDay: 84,
    phaseLabel: 'Weeks 5 to 12',
    whatsCommon: 'Mood usually better than when smoking (from about 6 weeks); sudden cue cravings with alcohol, parties or stress.',
    whatToTellYourself: 'A sudden craving now is a memory, not a need.',
  },
  {
    id: 'months_3_12',
    minDay: 85,
    maxDay: 365,
    phaseLabel: 'Months 3 to 12',
    whatsCommon: "Cravings are rare; 'just one' thoughts are the classic trap.",
    whatToTellYourself: 'One is never just one. I keep my plan for parties and stress.',
  },
];

export interface SymptomCard {
  id: string;
  name: string;
  typicalCourse: string;
  tip: string;
  seeDoctorIf?: string;
  isPossibleSymptom?: boolean;
}

export const SYMPTOM_CARDS: SymptomCard[] = [
  {
    id: 'cravings',
    name: 'Cravings & Urges',
    typicalCourse: 'Strongest in the first days; most single urges pass within minutes; cue cravings can return for months, less often.',
    tip: 'Urge wave: delay 5 minutes, change your physical place, take 5 slow breaths.',
  },
  {
    id: 'irritability',
    name: 'Irritability & Anger',
    typicalCourse: 'Peak in week 1; usually gone in 2 to 4 weeks.',
    tip: 'Warn people around you that your brain is recalibrating; walk outside; breathe slowly.',
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    typicalCourse: 'Peaks in week 1; usually 2 to 4 weeks; lower than while smoking after about 6 weeks.',
    tip: 'Paced 4-4-6 breathing; reassure yourself that smoking caused this baseline stress.',
    seeDoctorIf: "It's severe or doesn't ease after 4 weeks.",
  },
  {
    id: 'low_mood',
    name: 'Low Mood & Flatness',
    typicalCourse: 'Usually 2 to 4 weeks as dopamine sensitivity recalibrates.',
    tip: 'Get morning daylight, light movement, talk to someone you trust.',
    seeDoctorIf: "It's severe, or there are thoughts of self-harm (get professional help now).",
  },
  {
    id: 'restlessness',
    name: 'Restlessness',
    typicalCourse: 'Usually 2 to 4 weeks.',
    tip: 'Channel it physically: a brisk 5-minute walk, stretching, or holding a smooth pebble.',
  },
  {
    id: 'poor_concentration',
    name: 'Brain Fog & Poor Concentration',
    typicalCourse: 'Usually 2 to 4 weeks.',
    tip: 'Lighten your cognitive load in week 1; work in 25-minute Pomodoro sprints.',
  },
  {
    id: 'sleep_dreams',
    name: 'Sleep Problems & Vivid Dreams',
    typicalCourse: 'First weeks; vivid dreams about smoking are very common.',
    tip: 'Cut caffeine afternoon (caffeine hits twice as hard now); keep a steady bedtime.',
    seeDoctorIf: 'Insomnia lasts beyond a month.',
  },
  {
    id: 'hunger_weight',
    name: 'Hunger & Appetite Surge',
    typicalCourse: 'Can last months; average gain is about 4.7 kg in the first year without support, mostly in first 3 months. Some lose weight.',
    tip: 'Plan crunchy snacks (carrots, seeds, ice water). A few kilos is vastly less harmful to your heart than smoking.',
  },
  {
    id: 'constipation',
    name: 'Constipation',
    isPossibleSymptom: true,
    typicalCourse: 'First weeks as digestive peristalsis adjusts without nicotine.',
    tip: 'Drink plenty of water, increase dietary fibre, move daily.',
    seeDoctorIf: 'It lasts beyond 4 weeks.',
  },
  {
    id: 'mouth_ulcers',
    name: 'Mouth Ulcers',
    isPossibleSymptom: true,
    typicalCourse: 'First weeks; oral microbiome shifting to non-smoker balance.',
    tip: 'Usually temporary. Warm saltwater rinse, gentle brushing.',
    seeDoctorIf: 'They last beyond 3 weeks.',
  },
  {
    id: 'cough',
    name: 'Quit Cough & Airway Clearing',
    isPossibleSymptom: true,
    typicalCourse: 'Can rise briefly as bronchial cilia wake up and clear out hyper-secreted mucus.',
    tip: 'Warm drinks, plenty of water.',
    seeDoctorIf: 'It lasts beyond 4 weeks, or there is blood or chest pain.',
  },
  {
    id: 'dizziness',
    name: 'Dizziness & Lightheadedness',
    isPossibleSymptom: true,
    typicalCourse: 'Usually the first day or two as blood pressure and oxygen adjust.',
    tip: 'Sit down, drink water slowly, stand up gradually.',
    seeDoctorIf: 'It continues or causes fainting.',
  },
];

export function getNormalGuideForDay(streakDay: number): DayCourseGuide {
  const day = Math.max(0, streakDay);
  const found = DAY_BY_DAY_GUIDE.find((g) => day >= g.minDay && day <= g.maxDay);
  return found || DAY_BY_DAY_GUIDE[DAY_BY_DAY_GUIDE.length - 1];
}
