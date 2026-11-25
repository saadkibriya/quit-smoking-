/**
 * Discreet wording.
 *
 * This app can sit on a phone a partner, colleague or child picks up. When the
 * person turns discreet wording on, every screen swaps "porn" and "fap" for
 * neutral words before it is drawn. Nothing on disk changes: entries, storage
 * keys and exports stay exactly as they were, and turning it back off restores
 * the normal copy immediately.
 */

let enabled = false;

/** Called once per render by App, from the saved plan. */
export const setDiscreetMode = (on: boolean): void => {
  enabled = on;
};

export const isDiscreetMode = (): boolean => enabled;

/** Strings that read badly word by word get a hand-written replacement. */
const EXACT: Record<string, string> = {
  'compulsive porn use or masturbation': 'a compulsive habit you want to stop',
  'porn or fap': 'something else',
  'porn & fap setup': 'second habit setup',
  'porn / fap setup': 'second habit setup',
};

/** Order matters: longer phrases first, the bare words last. */
const RULES: Array<[RegExp, string]> = [
  [/porn\s*[/&]\s*fap/gi, 'habit'],
  [/pornography/gi, 'adult content'],
  [/porn-free/gi, 'habit-free'],
  [/\bno\s*fap\b/gi, 'community'],
  [/fap-free/gi, 'habit-free'],
  [/\bporn\b/gi, 'adult content'],
  [/\bfap\b/gi, 'habit'],
  [/masturbation/gi, 'the habit'],
];

const keepCase = (source: string, replacement: string): string => {
  const first = source.trimStart()[0] ?? '';
  if (first !== first.toUpperCase()) return replacement;
  return replacement[0].toUpperCase() + replacement.slice(1);
};

/**
 * Replace the explicit words in one string. `force` overrides the module flag
 * so onboarding can mask its own copy while the setting is still being chosen.
 */
export const maskDiscreet = (text: string, force?: boolean): string => {
  const active = force === undefined ? enabled : force;
  if (!active || !text) return text;

  const exact = EXACT[text.trim().toLowerCase()];
  if (exact) return keepCase(text.trim(), exact);

  return RULES.reduce(
    (result, [pattern, replacement]) =>
      result.replace(pattern, (match) => keepCase(match, replacement)),
    text,
  );
};
