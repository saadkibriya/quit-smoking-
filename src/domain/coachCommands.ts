import { Entry, UserPlan } from '../types';

/**
 * One command grammar for the coach, shared by the live Gemini path and the
 * offline fallback, so "I smoked 10 minutes ago" means the same thing whether
 * or not there is an API key.
 *
 * Nothing here writes to storage; the caller applies the commands, which keeps
 * this module pure and testable.
 */

export type CoachEntryType =
  | 'CIGARETTE'
  | 'CRAVING_BEATEN'
  | 'FAP'
  | 'FAP_URGE_BEATEN'
  | 'PLEDGE';

export interface CoachEntryCommand {
  type: CoachEntryType;
  timestamp: number;
  triggers?: string[];
  cravingStrength?: number;
  urgeStrength?: number;
  cravingDurationSeconds?: number;
  note?: string;
}

export interface CoachCommandResult {
  entries: CoachEntryCommand[];
  planUpdates?: Partial<UserPlan>;
  /** Short, human-readable summary such as "cigarette · 10 min ago". */
  description?: string;
  /** Set when the message could mean either habit; nothing is logged until answered. */
  clarification?: string;
}

const ENTRY_TYPES: CoachEntryType[] = [
  'CIGARETTE',
  'CRAVING_BEATEN',
  'FAP',
  'FAP_URGE_BEATEN',
  'PLEDGE',
];

const MAX_ENTRIES_PER_MESSAGE = 5;
const MAX_AGE_MS = 30 * 86400 * 1000;

const TRIGGER_WORDS: Array<[RegExp, string]> = [
  [/coffee|tea|\bcha\b/, 'coffee_tea'],
  [/stress|anxious|anxiety|work|pressure|argument|fight/, 'stress'],
  [/meal|eating|after (food|lunch|dinner)|lunch|dinner|breakfast/, 'after_meals'],
  [/friend|social|party|hangout|drinks with/, 'friends_who_smoke'],
  [/alcohol|beer|wine|whisk|drunk/, 'alcohol'],
  [/bored|idle|nothing to do/, 'boredom'],
  [/driv|traffic|car\b/, 'driving'],
  [/phone|scroll|instagram|tiktok|youtube/, 'phone_scrolling'],
  [/late night|night time|bed|bedroom/, 'late_night'],
];

const QUESTION_OR_INTENT =
  /\b(how (do|can|should|many|much) i|how many|what should i|should i|help me (stop|not|quit)|i want to (stop|quit|cut down)|i don'?t want to|do i need to|if i|when i|would it|is it (bad|ok)|thinking about|feel like|tempted to|about to)\b/;

/** "I haven't smoked", "no cigarettes today", "smoke-free for 3 days" are not logs. */
const NEGATED_EVENT =
  /\b(haven'?t|hasn'?t|hadn'?t|didn'?t|did not|not|never|no)\s+(smoked|had a (cig|cigarette|smoke)|slipped|lapsed|fapped|watched porn)\b|\bsmoke-?free\b/;

const SMOKE_WORDS = /\b(smoked|had a (cig|cigarette|smoke)|lit (one )?up|puffed|cheated)\b/;
/** "two cigarettes yesterday" / "I had three cigs" — a noun plus a count or a verb. */
const CIGARETTE_NOUN = /\b(cigarettes?|cigs?)\b/;
const CIGARETTE_VERB = /\b(had|have|smoked|lit|finished|another|downed)\b/;
const FAP_WORDS = /\b(fap|fapped|fapping|porn|masturbat\w*|watched porn|relapsed|relapse)\b/;
const SLIP_WORDS = /\b(slip|slipped|slips|lapse|lapsed)\b/;
const CRAVING_WORDS = /\b(craving|cravings|urge|urges|temptation)\b/;
const BEAT_WORDS = /\b(beat|beaten|resisted|rode (it )?out|fought off|held off|ignored|got through|powered through|passed)\b/;
const PLEDGE_WORDS = /\b(i pledge|pledging|i promise (not|i won'?t)|today i won'?t smoke|i won'?t smoke today)\b/;

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function atLocalTime(ts: number, hours: number, minutes = 0): number {
  const d = new Date(ts);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

export interface ParsedTime {
  timestamp: number;
  label: string;
}

/**
 * Resolve the moment the person is talking about. Defaults to now; nothing in
 * the future is ever accepted (a mistyped "10 minutes" must not land tomorrow).
 */
export function parseWhen(text: string, now = Date.now()): ParsedTime {
  const lower = text.toLowerCase();
  const clamp = (ts: number) => Math.min(now, Math.max(now - MAX_AGE_MS, ts));

  const minutesAgo = lower.match(/(\d+)\s*(minutes?|mins?|m)\b\s*(ago|back|earlier)?/);
  if (minutesAgo) {
    const value = Math.min(30 * 24 * 60, parseInt(minutesAgo[1], 10));
    return { timestamp: clamp(now - value * 60_000), label: `${value} min ago` };
  }

  const hoursAgo = lower.match(/(\d+)\s*(hours?|hrs?|h)\b\s*(ago|back|earlier)?/);
  if (hoursAgo) {
    const value = Math.min(30 * 24, parseInt(hoursAgo[1], 10));
    return { timestamp: clamp(now - value * 3_600_000), label: `${value} h ago` };
  }

  const daysAgo = lower.match(/(\d+)\s*(days?|d)\b\s*(ago|back|earlier)?/);
  if (daysAgo) {
    const value = Math.min(30, parseInt(daysAgo[1], 10));
    return { timestamp: clamp(now - value * 86_400_000), label: `${value} d ago` };
  }

  if (/\blast night\b/.test(lower)) {
    return { timestamp: atLocalTime(now - 86_400_000, 22, 0), label: 'last night' };
  }
  if (/\byesterday\b/.test(lower)) {
    return { timestamp: clamp(now - 86_400_000), label: 'yesterday' };
  }
  if (/\bthis morning\b/.test(lower)) {
    return { timestamp: atLocalTime(now, 8, 0), label: 'this morning' };
  }
  if (/\b(just now|right now|a moment ago|just)\b/.test(lower)) {
    return { timestamp: now, label: 'just now' };
  }

  const clock = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (clock) {
    let hour = parseInt(clock[1], 10) % 12;
    if (clock[3] === 'pm') hour += 12;
    const minute = clock[2] ? parseInt(clock[2], 10) : 0;
    let ts = atLocalTime(now, hour, minute);
    if (ts > now) ts -= 86_400_000;
    return { timestamp: clamp(ts), label: `at ${clock[1]}${clock[2] ? `:${clock[2]}` : ''}${clock[3]}` };
  }

  return { timestamp: now, label: 'just now' };
}

/** How many entries the sentence describes ("two cigarettes", "twice", "one slip"). */
export function parseCount(text: string): number {
  const lower = text.toLowerCase();
  if (/\btwice\b/.test(lower)) return 2;
  if (/\bthree times\b/.test(lower)) return 3;
  const digits = lower.match(/(\d+)\s*(cigarettes?|cigs?|smokes?|slips?|times?|urges?|cravings?)/);
  if (digits) return Math.min(MAX_ENTRIES_PER_MESSAGE, Math.max(1, parseInt(digits[1], 10)));
  if (/\b(two|three|four|five|couple of|a few)\b/.test(lower)) {
    if (/\btwo\b/.test(lower)) return 2;
    if (/\bthree\b/.test(lower)) return 3;
    if (/\bfour\b/.test(lower)) return 4;
    if (/\bfive\b/.test(lower)) return 5;
    return 2;
  }
  return 1;
}

function collectTriggers(text: string): string[] | undefined {
  const lower = text.toLowerCase();
  const found = TRIGGER_WORDS.filter(([pattern]) => pattern.test(lower)).map(([, trigger]) => trigger);
  return found.length > 0 ? Array.from(new Set(found)) : undefined;
}

function trackedHabit(plan: UserPlan): 'smoke' | 'fap' | 'both' {
  const smoke = plan.targets.includes('SMOKE');
  const fap = plan.targets.includes('FAP');
  return smoke && fap ? 'both' : fap ? 'fap' : 'smoke';
}

/**
 * Read a chat message as logging commands. Deliberately conservative: a
 * question, a hypothetical or a plan change must never create an entry.
 */
export function parseCoachCommands(
  message: string,
  options: { plan: UserPlan; now?: number }
): CoachCommandResult {
  const now = options.now ?? Date.now();
  const lower = message.toLowerCase();
  const plan = options.plan;
  const when = parseWhen(message, now);
  const triggers = collectTriggers(message);
  const count = parseCount(message);
  const entries: CoachEntryCommand[] = [];

  const isQuestionOrIntent = QUESTION_OR_INTENT.test(lower);
  const isNegated = NEGATED_EVENT.test(lower);
  const habit = trackedHabit(plan);

  const matchesSlip = SLIP_WORDS.test(lower);
  const secondHabitMention = /\b(second habit|other habit|the other one|not a cigarette)\b/.test(lower);
  const matchesSmoke =
    SMOKE_WORDS.test(lower) ||
    (CIGARETTE_NOUN.test(lower) && (count > 1 || CIGARETTE_VERB.test(lower) || matchesSlip));
  const matchesFap = FAP_WORDS.test(lower) || secondHabitMention;
  const matchesCraving = CRAVING_WORDS.test(lower);
  const matchesBeat = BEAT_WORDS.test(lower);

  const cravingBeaten =
    matchesCraving && matchesBeat && !/\bcraving (came|hit|started|is back)\b/.test(lower);

  const make = (type: CoachEntryType): CoachEntryCommand =>
    type === 'CIGARETTE'
      ? { type, timestamp: when.timestamp, ...(triggers ? { triggers } : {}) }
      : type === 'FAP'
      ? { type, timestamp: when.timestamp, ...(triggers ? { triggers } : {}) }
      : type === 'CRAVING_BEATEN'
      ? {
          type,
          timestamp: when.timestamp,
          ...(triggers ? { triggers } : {}),
          cravingStrength: 6,
        }
      : type === 'FAP_URGE_BEATEN'
      ? { type, timestamp: when.timestamp, urgeStrength: 6 }
      : { type, timestamp: when.timestamp };

  // "A slip" with both habits tracked is genuinely ambiguous — asking once beats
  // writing a wrong entry into someone's history.
  const ambiguousSlip = matchesSlip && !matchesSmoke && !matchesFap && habit === 'both';

  if (!isQuestionOrIntent && !isNegated) {
    if (ambiguousSlip) {
      // handled below: no entry, one question
    } else if (PLEDGE_WORDS.test(lower)) {
      entries.push(make('PLEDGE'));
    } else if (cravingBeaten) {
      // Second-habit users who only mention an urge are talking about that habit.
      if (habit === 'fap' && !matchesSmoke) {
        entries.push(make('FAP_URGE_BEATEN'));
      } else {
        entries.push(make('CRAVING_BEATEN'));
      }
    } else if (matchesSmoke) {
      for (let i = 0; i < count; i += 1) entries.push(make('CIGARETTE'));
    } else if (matchesFap) {
      for (let i = 0; i < count; i += 1) entries.push(make('FAP'));
    } else if (matchesSlip) {
      const type: CoachEntryType = habit === 'fap' ? 'FAP' : 'CIGARETTE';
      for (let i = 0; i < count; i += 1) entries.push(make(type));
    }
  }

  const planUpdates = parsePlanCommands(message, plan, now);
  const parts: string[] = [];
  if (entries.length > 0) parts.push(describeCommands(entries, now));
  if (planUpdates) parts.push(describePlanUpdates(plan, planUpdates));

  return {
    entries,
    ...(planUpdates ? { planUpdates } : {}),
    ...(parts.length > 0 ? { description: parts.filter(Boolean).join(' · ') } : {}),
    ...(ambiguousSlip && entries.length === 0
      ? {
          clarification:
            'Happy to log it — was that a cigarette or your second habit? Reply with the whole sentence, e.g. "a cigarette last night" or "the second habit last night", so I record the right one at the right time.',
        }
      : {}),
  };
}

export function describeCommands(entries: CoachEntryCommand[], now = Date.now()): string {
  if (entries.length === 0) return '';
  const label = (type: CoachEntryType) =>
    type === 'CIGARETTE'
      ? 'cigarette'
      : type === 'CRAVING_BEATEN'
      ? 'craving ridden out'
      : type === 'FAP'
      ? 'slip'
      : type === 'FAP_URGE_BEATEN'
      ? 'urge ridden out'
      : 'pledge';

  const groups = new Map<string, number>();
  for (const entry of entries) {
    const key = `${label(entry.type)} · ${relativeWhen(entry.timestamp, now)}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return Array.from(groups.entries())
    .map(([key, n]) => (n > 1 ? `${n} × ${key}` : key))
    .join(', ');
}

export function relativeWhen(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < 90_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const PLAN_NUMBER_FIELDS = ['packPrice', 'cigarettesPerPack', 'usualPerDay', 'fapPerDay', 'fapGoalPerDay'] as const;

function describePlanUpdates(plan: UserPlan, updates: Partial<UserPlan>): string {
  const parts: string[] = [];
  if (updates.quitStartDate) parts.push('quit time updated');
  if (updates.currency && updates.currency !== plan.currency) parts.push(`currency set to ${updates.currency}`);
  if (updates.packPrice !== undefined) parts.push(`pack price ${updates.packPrice}`);
  if (updates.cigarettesPerPack !== undefined) parts.push(`pack size ${updates.cigarettesPerPack}`);
  if (updates.usualPerDay !== undefined) parts.push(`${updates.usualPerDay} a day`);
  if (updates.triggers) parts.push('triggers updated');
  return parts.join(', ');
}

export function parsePlanCommands(message: string, plan: UserPlan, now = Date.now()): Partial<UserPlan> | undefined {
  const lower = message.toLowerCase();
  const updates: Partial<UserPlan> = {};

  const quitAgo = lower.match(/(quit|stopped|haven'?t smoked)\s*(since\s*)?(\d+)\s*(days?|hours?|weeks?)/);
  if (quitAgo) {
    const value = parseInt(quitAgo[3], 10);
    const unit = quitAgo[4];
    const ms = unit.startsWith('hour')
      ? value * 3_600_000
      : unit.startsWith('week')
      ? value * 7 * 86_400_000
      : value * 86_400_000;
    updates.quitStartDate = new Date(Math.max(0, now - ms)).toISOString();
  }

  if (/\b(bdt|taka|tk\b|৳)/.test(lower)) updates.currency = '৳';
  else if (/\b(euro|€)/.test(lower)) updates.currency = '€';
  else if (/\b(pound|£)/.test(lower)) updates.currency = '£';
  else if (/\b(rupee|inr|₹)/.test(lower)) updates.currency = '₹';
  else if (/\b(dollar|usd|\$)/.test(lower)) updates.currency = '$';

  const price = lower.match(/\b(price|pack price|pack costs?|costs?|price is)\b[^\d]{0,12}(\d+(?:\.\d+)?)/);
  if (price) {
    const value = parseFloat(price[2]);
    if (Number.isFinite(value) && value >= 0) updates.packPrice = value;
  }

  const packSize = lower.match(/\b(\d+)\s*(cigarettes?|cigs?)\s*(per|a|in a)\s*pack\b/);
  if (packSize) {
    const value = parseInt(packSize[1], 10);
    if (value > 0) updates.cigarettesPerPack = value;
  }

  const perDay = lower.match(/\b(?:i\s+)?(?:smoke|smoking|use)\s*(\d+)\s*(?:a|per)\s*day\b/);
  if (perDay) {
    const value = parseInt(perDay[1], 10);
    if (value >= 0) updates.usualPerDay = value;
  }

  for (const field of PLAN_NUMBER_FIELDS) {
    const value = updates[field];
    if (value !== undefined && !Number.isFinite(Number(value))) delete updates[field];
  }
  if (updates.quitStartDate && Number.isNaN(new Date(updates.quitStartDate).getTime())) {
    delete updates.quitStartDate;
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}

/**
 * Validate whatever the model returned. A hallucinated type, a future date or
 * a key we do not understand is dropped rather than written.
 */
export function sanitizeEntryCommands(
  raw: unknown,
  options: { now?: number; plan?: UserPlan } = {}
): CoachEntryCommand[] {
  const now = options.now ?? Date.now();
  if (!Array.isArray(raw)) return [];

  const commands: CoachEntryCommand[] = [];
  const seen = new Set<string>();

  for (const item of raw.slice(0, MAX_ENTRIES_PER_MESSAGE)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const type = typeof record.type === 'string' ? (record.type.toUpperCase() as CoachEntryType) : null;
    if (!type || !ENTRY_TYPES.includes(type)) continue;

    let timestamp = now;
    if (typeof record.minutesAgo === 'number' && Number.isFinite(record.minutesAgo)) {
      timestamp = now - Math.min(30 * 24 * 60, Math.max(0, record.minutesAgo)) * 60_000;
    } else if (typeof record.timestamp === 'number' && Number.isFinite(record.timestamp)) {
      timestamp = record.timestamp;
    } else if (typeof record.timestamp === 'string') {
      const parsed = new Date(record.timestamp).getTime();
      if (!Number.isFinite(parsed)) continue;
      timestamp = parsed;
    }

    timestamp = Math.min(now, Math.max(now - MAX_AGE_MS, timestamp));

    const signature = `${type}:${Math.round(timestamp / 60_000)}`;
    if (seen.has(signature)) continue;
    seen.add(signature);

    const triggers = Array.isArray(record.triggers)
      ? record.triggers.filter((t): t is string => typeof t === 'string' && t.length > 0).slice(0, 8)
      : undefined;
    const clampStrength = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.min(10, Math.max(1, Math.round(value)))
        : undefined;

    commands.push({
      type,
      timestamp,
      ...(triggers && triggers.length > 0 ? { triggers } : {}),
      ...(clampStrength(record.cravingStrength) !== undefined
        ? { cravingStrength: clampStrength(record.cravingStrength) }
        : {}),
      ...(clampStrength(record.urgeStrength) !== undefined
        ? { urgeStrength: clampStrength(record.urgeStrength) }
        : {}),
      ...(typeof record.note === 'string' && record.note.trim()
        ? { note: record.note.trim().slice(0, 500) }
        : {}),
    });
  }

  return commands;
}

const ALLOWED_PLAN_FIELDS: Array<keyof UserPlan> = [
  'mode',
  'targets',
  'quitStartDate',
  'fapStartDate',
  'packPrice',
  'cigarettesPerPack',
  'usualPerDay',
  'fapPerDay',
  'fapGoalPerDay',
  'currency',
  'triggers',
  'reasons',
  'coachStyle',
  'discreetMode',
];

/** Keep model-written plan changes inside the fields the app actually owns. */
export function sanitizePlanUpdates(raw: unknown): Partial<UserPlan> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const updates: Partial<UserPlan> = {};

  for (const field of ALLOWED_PLAN_FIELDS) {
    if (!(field in record)) continue;
    const value = record[field];

    if (PLAN_NUMBER_FIELDS.includes(field as (typeof PLAN_NUMBER_FIELDS)[number])) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 0) continue;
      (updates as Record<string, unknown>)[field] = numeric;
      continue;
    }

    if (field === 'quitStartDate' || field === 'fapStartDate') {
      if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) continue;
      updates[field] = value;
      continue;
    }

    if (field === 'currency') {
      if (typeof value !== 'string' || value.length === 0 || value.length > 4) continue;
      updates.currency = value;
      continue;
    }

    if (field === 'triggers' || field === 'reasons') {
      if (!Array.isArray(value)) continue;
      const list = value.filter((v): v is string => typeof v === 'string' && v.length > 0).slice(0, 40);
      if (list.length > 0) updates[field] = list;
      continue;
    }

    if (field === 'targets') {
      if (!Array.isArray(value)) continue;
      const list = value.filter((v): v is 'SMOKE' | 'FAP' => v === 'SMOKE' || v === 'FAP');
      if (list.length > 0) updates.targets = list;
      continue;
    }

    if (field === 'mode') {
      if (value === 'QUIT' || value === 'CUT_DOWN' || value === 'TRACK') updates.mode = value;
      continue;
    }

    if (field === 'coachStyle') {
      if (value === 'GENTLE' || value === 'DIRECT' || value === 'SCIENCE') updates.coachStyle = value;
      continue;
    }

    if (field === 'discreetMode') {
      if (typeof value === 'boolean') updates.discreetMode = value;
    }
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}

/** Turn a validated command into the same Entry shape the app's own buttons write. */
export function buildEntryFromCommand(command: CoachEntryCommand): Entry {
  const isFap = command.type === 'FAP' || command.type === 'FAP_URGE_BEATEN';
  const prefix =
    command.type === 'CIGARETTE'
      ? 'entry'
      : command.type === 'CRAVING_BEATEN'
      ? 'craving'
      : command.type === 'PLEDGE'
      ? 'pledge'
      : command.type === 'FAP_URGE_BEATEN'
      ? 'fap_urge'
      : 'fap';

  return {
    id: `${prefix}_${command.timestamp}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: command.timestamp,
    timezoneOffset: new Date(command.timestamp).getTimezoneOffset(),
    type: command.type,
    habitId: isFap ? 'fap' : 'smoking',
    source: 'app',
    ...(command.triggers ? { triggers: command.triggers } : {}),
    ...(command.cravingStrength !== undefined ? { cravingStrength: command.cravingStrength } : {}),
    ...(command.urgeStrength !== undefined ? { urgeStrength: command.urgeStrength } : {}),
    ...(command.cravingDurationSeconds !== undefined
      ? { cravingDurationSeconds: command.cravingDurationSeconds }
      : {}),
    ...(command.note ? { note: command.note } : {}),
  };
}
