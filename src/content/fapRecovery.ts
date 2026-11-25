import { EvidenceLevel } from './milestones';

/**
 * Research-backed "what happens next" content for the porn / fap tracker.
 *
 * This is deliberately more conservative than the smoking timeline: there is no
 * nicotine-equivalent clearance curve here, the withdrawal literature is mixed,
 * and the popular "90 days and you're cured" number has no trial behind it.
 * Every stage therefore carries its real evidence level, and the unsupported
 * community lore is labelled as such instead of being repeated back as fact.
 */

export interface FapRecoveryStage {
  id: string;
  hours: number;
  timeLabel: string;
  /** Terse version for the home card. */
  short: string;
  whatHappens: string;
  /** What a clinician would actually say about this stage. */
  doctorNote: string;
  evidence: EvidenceLevel;
  source: string;
}

export const FAP_RECOVERY_TIMELINE: FapRecoveryStage[] = [
  {
    id: 'fap_1h',
    hours: 1,
    timeLabel: '1 hour',
    short: 'prolactin still high, drive low',
    whatHappens:
      'Prolactin, the hormone that surges at orgasm, is still elevated an hour afterwards — measured in blood sampling studies in both men and women. Arousal is usually at its lowest and the pull to do it again is weakest right now.',
    doctorNote:
      'This calm is physiology, not willpower, and it is the cheapest moment of the day to stand up and change rooms.',
    evidence: 'MODERATE',
    source: 'Krüger & Exton, orgasm prolactin studies 2001–2002',
  },
  {
    id: 'fap_12h',
    hours: 12,
    timeLabel: '12 hours',
    short: 'nothing is being flushed out',
    whatHappens:
      'Nothing is leaving your body and nothing needs flushing out. Sexual desire drifts back up over hours to a couple of days, faster when you are tired, bored, angry or stressed.',
    doctorNote:
      'Clinicians do not treat porn use as a toxin. What is being treated is the compulsion and the time it takes, not a substance in the blood.',
    evidence: 'MODERATE',
    source: 'Sexual medicine physiology reviews',
  },
  {
    id: 'fap_24h',
    hours: 24,
    timeLabel: '1 day',
    short: 'first real urge if you were daily',
    whatHappens:
      'For most people, little happens on day one. If you were using every day, this is where the first genuine urge to go back usually shows up.',
    doctorNote:
      'A single clean day is still worth logging: it tells you which hour and which mood you need to redesign.',
    evidence: 'MODERATE',
    source: 'Archives of Sexual Behavior 2023, 7-day abstinence RCT',
  },
  {
    id: 'fap_72h',
    hours: 72,
    timeLabel: '2 to 3 days',
    short: 'cravings can peak here',
    whatHappens:
      'In a randomised 7-day trial of regular users, abstaining produced no measurable withdrawal symptoms — except in daily users, who did report stronger craving. If you were in that group, days two and three are usually the loudest.',
    doctorNote:
      'Most reported symptoms are intrusive sexual thoughts, irritability and broken sleep. They are distressing, not dangerous, and a study of people seeking help found distress easing from day three onward.',
    evidence: 'EARLY_RESEARCH',
    source: 'Archives of Sexual Behavior 2023; Frontiers in Psychiatry 2024',
  },
  {
    id: 'fap_7d',
    hours: 168,
    timeLabel: '1 week',
    short: 'the pattern becomes visible',
    whatHappens:
      'A week is where the streak stops feeling like a countdown. The most consistent thing people report is time back — the half hour you used to lose is now visibly yours.',
    doctorNote:
      'Week one shows you the shape of the habit: which hour, which room, which feeling. That pattern is what treatment targets, not the streak itself.',
    evidence: 'EARLY_RESEARCH',
    source: 'Analyses of abstinence journals, Archives of Sexual Behavior 2021',
  },
  {
    id: 'fap_2_4w',
    hours: 336,
    timeLabel: '2 to 4 weeks',
    short: 'less pull, steadier mood',
    whatHappens:
      'People who got this far in abstinence journals reported less craving, less mental pull toward porn, steadier mood and a stronger sense of control. Not superpowers — just less noise.',
    doctorNote:
      'This is self-report from people who also changed their routines and had support, so treat it as encouraging rather than guaranteed. Nobody has run the controlled trial that would prove the cause.',
    evidence: 'EARLY_RESEARCH',
    source: 'Fernandez & Griffiths 2021, Archives of Sexual Behavior',
  },
  {
    id: 'fap_flatline',
    hours: 672,
    timeLabel: '4 to 8 weeks',
    short: 'a flat stretch is often reported',
    whatHappens:
      'Some people hit a stretch of low libido and flat mood somewhere in the first two months and read it as damage. It is reported constantly in abstinence communities, but it is not a defined medical syndrome and has no measured timeline.',
    doctorNote:
      'Low mood lasting more than two weeks, or coming with hopelessness, deserves a doctor or therapist on its own terms. Do not wait it out because a forum called it a flatline.',
    evidence: 'ESTIMATE',
    source: 'Community reports; no clinical definition',
  },
  {
    id: 'fap_8_12w',
    hours: 1344,
    timeLabel: '2 to 3 months',
    short: 'erections often recover',
    whatHappens:
      'Men whose erections worked with porn but not with a partner have been reported to improve after stopping internet porn. Reviews describe this as clinical-report evidence, not proof.',
    doctorNote:
      'Erection problems also have ordinary medical causes: blood pressure, diabetes, medication, sleep apnoea, anxiety. If things have not improved in a few months, get examined instead of assuming it is porn.',
    evidence: 'EARLY_RESEARCH',
    source: 'Current Sexual Health Reports 2024; clinical case reports',
  },
  {
    id: 'fap_90d',
    hours: 2160,
    timeLabel: '90 days',
    short: 'no measured cure date',
    whatHappens:
      'Ninety days is a community landmark, not a measured cure. No trial establishes a fixed reboot length, and a 2025 study of month-long abstinence found no measurable change in sexual wellbeing either way.',
    doctorNote:
      'The goal that helps is a life you would choose, not a number. A slip at day 89 costs you one day, not the streak that came before it.',
    evidence: 'ESTIMATE',
    source: 'No trial supports a fixed reboot length; J Sex Med 2025',
  },
];

export const FAP_EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  STRONG: 'Strong',
  MODERATE: 'Moderate',
  EARLY_RESEARCH: 'Early research',
  ESTIMATE: 'Estimate',
};

/** The stage a clean streak is currently sitting inside, or null before 1 hour. */
export function getFapStage(cleanHours: number): FapRecoveryStage | null {
  let current: FapRecoveryStage | null = null;
  for (const stage of FAP_RECOVERY_TIMELINE) {
    if (cleanHours >= stage.hours) current = stage;
  }
  return current;
}

/** The next stage ahead — what the home card nudges toward. */
export function getNextFapStage(cleanHours: number): FapRecoveryStage {
  return FAP_RECOVERY_TIMELINE.find((stage) => cleanHours < stage.hours) ??
    FAP_RECOVERY_TIMELINE[FAP_RECOVERY_TIMELINE.length - 1];
}

export interface FapCommunityTip {
  tip: string;
  detail: string;
  source: string;
}

/**
 * Tactics people actually report using, kept close to how they were said.
 * These are community reports, not clinical recommendations, and several of
 * the most popular ones are contradicted by other people in the same threads.
 */
export const FAP_COMMUNITY_TIPS: FapCommunityTip[] = [
  {
    tip: 'Phone charges outside the bedroom',
    detail:
      'The single most repeated rule in long-streak posts. The late-night scroll on the bed is usually the relapse; the porn is just what it lands on.',
    source: 'r/NoFap',
  },
  {
    tip: 'Make relapse take effort, not willpower',
    detail:
      'A blocker at DNS level, deleted apps, logged-out sessions. As one 94-day post put it: "You quit by making it harder to relapse than to stay clean."',
    source: 'r/NoFap',
  },
  {
    tip: 'Never lie on your bed unless you are sleeping',
    detail:
      'Treating the bed as sleep-only removes the highest-risk location without removing anything you actually want.',
    source: 'r/NoFap',
  },
  {
    tip: '120 seconds of cold water',
    detail:
      'The most cited emergency brake: a cold shower long enough to make the urge pass its peak. Repeated across 30-day and 1-year reports.',
    source: 'r/NoFap',
  },
  {
    tip: 'Leave the room before you decide anything',
    detail:
      'Push-ups to failure, a walk outside, standing in the kitchen. The point is a physical action that buys the three to five minutes an urge needs to fade.',
    source: 'r/NoFap, r/pornfree',
  },
  {
    tip: 'One real person who knows',
    detail:
      'An accountability partner beats every app. People say texting is easier than calling, so agree on a text in advance: "struggling, check in tomorrow".',
    source: 'r/NoFap, r/pornfree',
  },
  {
    tip: 'Plan the trigger, not the urge',
    detail:
      'Write the if-then in advance — "if I am alone and bored after 10pm, then the phone stays in the kitchen" — instead of negotiating mid-urge.',
    source: 'r/NoFap',
  },
  {
    tip: 'Keep the target as today',
    detail:
      '"Do not count the day or you will feel overwhelmed, just concentrate on today." Counting a 90-day mountain is what makes day one feel impossible.',
    source: 'r/NoFap',
  },
];

export interface FapCommunityCaveat {
  claim: string;
  reality: string;
  source: string;
}

/** What the same communities say did not work, so the app does not oversell. */
export const FAP_COMMUNITY_CAVEATS: FapCommunityCaveat[] = [
  {
    claim: 'Blockers fix it',
    reality:
      'One 90-day report had tried every blocker available and found a way around each one. What changed the outcome was the routine, not the filter.',
    source: 'r/pornfree',
  },
  {
    claim: 'Superpowers',
    reality:
      'A widely shared 1-year report debunks its own community\'s myth: the gains were libido, confidence and actually feeling things — not a new body or a new brain.',
    source: 'r/NoFap',
  },
  {
    claim: 'One last time',
    reality:
      '"I told myself just this once" is described as the classic trap. The relapse starts at the promise, not at the screen.',
    source: 'r/NoFap',
  },
  {
    claim: 'Shame keeps you clean',
    reality:
      'A 2024 survey of NoFap users linked heavier forum engagement and relapse shame with worse depression, anxiety and sexual function. A slip is a day, not a verdict.',
    source: 'Prause & Binnie 2024, Sexualities',
  },
];

export const FAP_DOCTOR_TAKE = [
  {
    title: 'It has a name, not a diagnosis of "addiction"',
    body:
      'Compulsive sexual behaviour disorder is recognised in ICD-11 as an impulse-control disorder. It is not officially classified as an addiction, and that debate is genuinely unsettled — which is why this app does not call you an addict.',
  },
  {
    title: 'Therapy is the first-line treatment',
    body:
      'CBT and acceptance-and-commitment therapy have the best support. Abstaining is a tool inside that work, not the treatment on its own.',
  },
  {
    title: 'There is no detox drug',
    body:
      'Nothing is licensed to clear porn from your system. SSRIs and naltrexone have small, mixed trials; neither is a routine prescription for this.',
  },
  {
    title: 'Get help sooner than you think',
    body:
      'If it costs you work, money, sleep or a relationship, if you need more extreme content for the same effect, or if it comes with low mood, see a doctor or therapist. It is common and treatable.',
  },
];
