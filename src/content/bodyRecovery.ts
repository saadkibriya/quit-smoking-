import { EvidenceLevel } from './milestones';

export interface RecoveryStage {
  id: string;
  hours: number;
  timeLabel: string;
  whatHappens: string;
  evidence: EvidenceLevel;
  source: string;
  category: 'Vascular' | 'Chemical' | 'Pulmonary' | 'Long-term';
}

export const BODY_RECOVERY_TIMELINE: RecoveryStage[] = [
  {
    id: 'rec_20m',
    hours: 0.333,
    timeLabel: '20 minutes',
    whatHappens: 'Heart rate and blood pressure drop.',
    evidence: 'MODERATE',
    source: 'WHO',
    category: 'Vascular',
  },
  {
    id: 'rec_12h',
    hours: 12,
    timeLabel: '12 hours',
    whatHappens: 'Carbon monoxide in the blood drops to normal.',
    evidence: 'MODERATE',
    source: 'WHO',
    category: 'Chemical',
  },
  {
    id: 'rec_72h',
    hours: 72,
    timeLabel: '72 hours',
    whatHappens: 'Nicotine is essentially cleared from the body.',
    evidence: 'STRONG',
    source: 'Nicotine pharmacology',
    category: 'Chemical',
  },
  {
    id: 'rec_2_12w',
    hours: 336, // ~2 weeks
    timeLabel: '2 to 12 weeks',
    whatHappens: 'Circulation improves and lung function increases.',
    evidence: 'MODERATE',
    source: 'WHO',
    category: 'Pulmonary',
  },
  {
    id: 'rec_1_9m',
    hours: 720, // ~1 month
    timeLabel: '1 to 9 months',
    whatHappens: 'Coughing and shortness of breath decrease.',
    evidence: 'MODERATE',
    source: 'WHO',
    category: 'Pulmonary',
  },
  {
    id: 'rec_1y',
    hours: 8760,
    timeLabel: '1 year',
    whatHappens: 'Risk of coronary heart disease is about half that of a smoker.',
    evidence: 'STRONG',
    source: 'WHO',
    category: 'Long-term',
  },
  {
    id: 'rec_5_15y',
    hours: 43800, // 5 years
    timeLabel: '5 to 15 years',
    whatHappens: 'Stroke risk falls to that of a non-smoker.',
    evidence: 'STRONG',
    source: 'WHO',
    category: 'Long-term',
  },
  {
    id: 'rec_10y',
    hours: 87600,
    timeLabel: '10 years',
    whatHappens:
      'Lung cancer risk is about half that of a smoker; risk of cancers of the mouth, throat, esophagus, bladder, cervix and pancreas decreases.',
    evidence: 'STRONG',
    source: 'WHO',
    category: 'Long-term',
  },
  {
    id: 'rec_15y',
    hours: 131400,
    timeLabel: '15 years',
    whatHappens: 'Risk of coronary heart disease is that of a non-smoker.',
    evidence: 'STRONG',
    source: 'WHO',
    category: 'Long-term',
  },
];

export function getLifeExpectancyGain(age?: number): string | null {
  if (!age || age < 18) return null;
  if (age <= 34) {
    return 'On average, quitting between ages 25 to 34 gains about 10 years of life expectancy (Jha et al. 2013, NEJM; Strong evidence).';
  }
  if (age <= 44) {
    return 'On average, quitting between ages 35 to 44 gains about 9 years of life expectancy (Jha et al. 2013, NEJM; Strong evidence).';
  }
  if (age <= 54) {
    return 'On average, quitting between ages 45 to 54 gains about 6 years of life expectancy (Jha et al. 2013, NEJM; Strong evidence).';
  }
  if (age <= 64) {
    return 'On average, quitting between ages 55 to 64 gains about 4 years of life expectancy (Jha et al. 2013, NEJM; Strong evidence).';
  }
  return 'Quitting at age 60 or above still gains about 3 years of life on average (Doll et al. 2004, BMJ; Strong evidence).';
}
