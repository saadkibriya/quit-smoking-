export interface ScientificFact {
  id: string;
  headline: string;
  detail: string;
  source: string;
}

export const ENCOURAGEMENT_FACTS: ScientificFact[] = [
  {
    id: 'f_multiple_attempts',
    headline: 'Quitting takes practice — many tries is normal',
    detail: 'A study of over 1,200 smokers estimated that many adults need 30 or more quit attempts before succeeding (Chaiton et al. 2016, BMJ Open). Every attempt builds neural and behavioral resilience.',
    source: 'Chaiton et al. 2016, BMJ Open',
  },
  {
    id: 'f_slips_dont_erase',
    headline: 'A slip never erases your progress',
    detail: "Researchers' standard measure of cessation success (the Russell Standard) explicitly counts individuals as continuously abstinent even with up to 5 early slips during initial weeks. What matters is never missing twice.",
    source: 'West et al. 2005 (Russell Standard)',
  },
  {
    id: 'f_abrupt_beats_gradual',
    headline: 'A set quit date beats slow tapering for ready quitters',
    detail: 'In randomized trials, stopping abruptly on a chosen quit day achieved 49% abstinence at 4 weeks vs 39% for gradual tapering, and 22% vs 16% at 6 months (Lindson-Hawley et al. 2016).',
    source: 'Lindson-Hawley et al. 2016, Annals of Internal Medicine',
  },
  {
    id: 'f_life_regained',
    headline: 'Every cigarette avoided returns ~20 minutes of life',
    detail: 'Recent population modeling estimates roughly 20 minutes of life preserved per cigarette not smoked (Jackson, Jarvis & West, Addiction 2025). A pack avoided preserves nearly 7 hours of life.',
    source: 'Jackson, Jarvis & West 2025, Addiction',
  },
  {
    id: 'f_light_still_harms',
    headline: 'Zero is the goal: even 1 to 4 cigarettes harms your heart',
    detail: 'Cutting down is a valuable stepping stone to quit day, but light smoking (1–4 a day) still carries nearly half the excess coronary heart disease risk of heavy smoking. True healing comes at zero.',
    source: 'Hackshaw et al. 2018 BMJ; Tverdal 2006',
  },
  {
    id: 'f_mental_health',
    headline: 'Quitting actually reduces anxiety, depression, and stress',
    detail: 'Smokers often believe cigarettes relieve stress, but cigarettes only relieve the withdrawal they caused. Cochrane reviews show that after ~6 weeks of quitting, anxiety, depression and perceived stress drop significantly.',
    source: 'Taylor et al. 2021, Cochrane Review',
  },
  {
    id: 'f_withdrawal_temporary',
    headline: 'Withdrawal peaks in week 1 and fades within 2 to 4 weeks',
    detail: 'Nicotine is completely cleared from blood plasma within 72 hours. Receptor down-regulation follows over 2 to 4 weeks. Somatic distress is proof of biological recalibration, not personal weakness.',
    source: 'Hughes 2007, Nicotine & Tobacco Research',
  },
];
