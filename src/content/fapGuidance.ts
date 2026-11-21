/**
 * Warnings and guidance for the porn/fap tracker.
 *
 * Deliberately non-judgemental and evidence-framed: the goal is to interrupt the
 * shame spiral, not to moralise. These strings are shown in settings, in the
 * fap setup step of onboarding, and on the fap dashboard.
 */

export interface FapWarning {
  id: string;
  title: string;
  body: string;
}

export const FAP_WARNINGS: FapWarning[] = [
  {
    id: 'compulsion',
    title: 'Compulsion, not desire',
    body:
      'If it happens when you are bored, stressed, angry or lonely rather than aroused, the urge is a signal to do something else. Treat the trigger, not the feeling.',
  },
  {
    id: 'escalation',
    title: 'Escalation and tolerance',
    body:
      'Needing more extreme content, longer sessions, or a bigger hit of novelty to feel the same is a tolerance sign. Stopping early is far easier than stopping later.',
  },
  {
    id: 'secrecy',
    title: 'Secrecy and shame',
    body:
      'Hiding it, then feeling ashamed, is the loop that keeps it running. A slip is a data point, not a verdict on who you are.',
  },
  {
    id: 'sleep',
    title: 'Sleep and focus',
    body:
      'Late-night sessions shorten sleep and blunt focus the next day. Guard the last hour before bed as a no-screen wind-down.',
  },
  {
    id: 'time',
    title: 'Time you do not get back',
    body:
      'Count minutes, not just sessions. The target is time returned to things you actually chose to do.',
  },
  {
    id: 'body',
    title: 'Body signals',
    body:
      'Desensitisation, trouble with a partner, or performance anxiety are common and usually ease within weeks of cutting down or stopping.',
  },
  {
    id: 'help',
    title: 'When to get help',
    body:
      'If it feels out of control, damages work, relationships or money, or comes with low mood, speak to a doctor or therapist. Compulsive sexual behaviour is common and treatable.',
  },
];

/** Short list used where space is tight (home card, plan summary). */
export const FAP_WARNING_HINTS = ['Secrecy', 'Escalation', 'Late nights'];

export const FAP_SETUP_NOTE =
  'Log a slip honestly and the timer restarts without judgement. Urges you ride out are counted separately, so a hard day still shows progress.';

export const FAP_URGE_TOOLS = [
  'Stand up and leave the room or put the phone down for five minutes.',
  'Cold water on your face and wrists; slow exhale longer than the inhale.',
  'Name the trigger out loud: bored, stressed, lonely, tired, or avoiding something.',
  'Do the smallest useful task for two minutes; momentum beats willpower.',
];
