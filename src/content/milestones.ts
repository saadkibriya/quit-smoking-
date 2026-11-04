export type EvidenceLevel = 'STRONG' | 'MODERATE' | 'EARLY_RESEARCH' | 'ESTIMATE';

export interface MilestoneDefinition {
  id: string;
  hours: number;
  title: string;
  subtitle: string;
  roundNumber?: number; // 1, 2, 3
  message: string;
  evidence: EvidenceLevel;
  source: string;
  badgeShape: 'cookie' | 'clover' | 'starburst' | 'diamond';
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'm_24h',
    hours: 24,
    title: '24 Hours',
    subtitle: 'First Full Day',
    message: 'One full day. Carbon monoxide in your blood is back to normal; that takes about 12 hours.',
    evidence: 'MODERATE',
    source: 'WHO',
    badgeShape: 'cookie',
  },
  {
    id: 'm_72h',
    hours: 72,
    title: '72 Hours',
    subtitle: 'Chemical Clearance',
    message: 'Nicotine is essentially out of your body (its half-life is about 2 hours). From here, cravings are mostly habit and cues, and those can be retrained.',
    evidence: 'STRONG',
    source: 'Nicotine pharmacology',
    badgeShape: 'clover',
  },
  {
    id: 'm_7d',
    hours: 168,
    title: '7 Days',
    subtitle: 'Peak Week Passed',
    message: 'The hardest week is behind you. Withdrawal usually peaks in the first week.',
    evidence: 'STRONG',
    source: 'Hughes 2007, Nicotine & Tobacco Research',
    badgeShape: 'starburst',
  },
  {
    id: 'm_14d',
    hours: 336,
    title: '14 Days',
    subtitle: 'Two Weeks Clear',
    message: 'Two weeks smoke-free. Staying smoke-free through week two is one of the strongest signs of long-term success.',
    evidence: 'STRONG',
    source: 'Kenford et al. 1994, JAMA',
    badgeShape: 'diamond',
  },
  {
    id: 'm_28d',
    hours: 672,
    title: '28 Days',
    subtitle: 'Round 1 Complete',
    roundNumber: 1,
    message: 'Round 1 complete. Experts estimate that people who stay smoke-free for 28 days are about five times more likely to quit for good.',
    evidence: 'ESTIMATE',
    source: "West & Stapleton 2008, the basis of England's Stoptober",
    badgeShape: 'cookie',
  },
  {
    id: 'm_6w',
    hours: 1008,
    title: '6 Weeks',
    subtitle: 'Mental Shift',
    message: 'From about 6 weeks, people who quit report less anxiety, low mood and stress than when they smoked.',
    evidence: 'MODERATE',
    source: 'Cochrane review, Taylor et al. 2021',
    badgeShape: 'clover',
  },
  {
    id: 'm_90d',
    hours: 2160,
    title: '90 Days',
    subtitle: 'Round 2 Complete',
    roundNumber: 2,
    message: "Your brain's nicotine receptors have had time to return to near non-smoker levels (about 6 to 12 weeks).",
    evidence: 'EARLY_RESEARCH',
    source: 'Cosgrove et al. 2009',
    badgeShape: 'starburst',
  },
  {
    id: 'm_6m',
    hours: 4320,
    title: '6 Months',
    subtitle: 'Airway Rebound',
    message: 'Coughing and shortness of breath keep easing; they improve over 1 to 9 months.',
    evidence: 'MODERATE',
    source: 'WHO',
    badgeShape: 'diamond',
  },
  {
    id: 'm_1y',
    hours: 8760,
    title: '1 Year',
    subtitle: 'Round 3 Complete',
    roundNumber: 3,
    message: 'Your extra risk of heart disease is now about half that of a smoker.',
    evidence: 'STRONG',
    source: 'WHO, US Surgeon General',
    badgeShape: 'cookie',
  },
];
