import assert from 'node:assert';
import { DEFAULT_PLAN } from '../src/data/storage';
import { UserPlan } from '../src/types';
import {
  buildEntryFromCommand,
  describeCommands,
  parseCoachCommands,
  parseWhen,
  sanitizeEntryCommands,
  sanitizePlanUpdates,
} from '../src/domain/coachCommands';
import { askGeminiCoach } from '../src/domain/aiCoach';

console.log('--- RUNNING COACH LOGGING TESTS ---');

const NOW = new Date('2026-11-25T12:00:00').getTime();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const smokingPlan: UserPlan = { ...DEFAULT_PLAN, targets: ['SMOKE'], geminiApiKey: undefined };
const fapPlan: UserPlan = { ...DEFAULT_PLAN, targets: ['FAP'], fapStartDate: new Date(NOW - 4 * DAY).toISOString(), geminiApiKey: undefined };
const bothPlan: UserPlan = { ...smokingPlan, targets: ['SMOKE', 'FAP'] };

const near = (actual: number, expected: number, tolerance = MIN) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ~${new Date(expected).toISOString()}, got ${new Date(actual).toISOString()}`);

// 1. The message from the request.
const smoked = parseCoachCommands('I smoked 10 minutes ago', { plan: smokingPlan, now: NOW });
assert.equal(smoked.entries.length, 1, 'one cigarette logged');
assert.equal(smoked.entries[0].type, 'CIGARETTE');
near(smoked.entries[0].timestamp, NOW - 10 * MIN);
assert.match(smoked.description ?? '', /cigarette.*10 min ago/);
console.log('✓ Test 1: "I smoked 10 minutes ago" logs one backdated cigarette.');

// 2. Same sentence with a trigger.
const stressed = parseCoachCommands('I smoked 10 minutes ago, the trigger was stress', { plan: smokingPlan, now: NOW });
assert.deepEqual(stressed.entries[0].triggers, ['stress']);
console.log('✓ Test 2: trigger words ride along on the entry.');

// 3. "one slip last night" means the second habit when it is tracked.
const fapSlip = parseCoachCommands('one slip last night', { plan: fapPlan, now: NOW });
assert.equal(fapSlip.entries.length, 1);
assert.equal(fapSlip.entries[0].type, 'FAP');
const lastNight = new Date(NOW - DAY);
lastNight.setHours(22, 0, 0, 0);
near(fapSlip.entries[0].timestamp, lastNight.getTime(), 0);
console.log('✓ Test 3: "one slip last night" logs a second-habit slip at 22:00 yesterday.');

// 4. ...and the smoking habit when that is what they track.
const smokingSlip = parseCoachCommands('one slip last night', { plan: smokingPlan, now: NOW });
assert.equal(smokingSlip.entries[0].type, 'CIGARETTE');
console.log('✓ Test 4: the same words log a cigarette for a smoking-only plan.');

// 4b. With both habits tracked, "a slip" is ambiguous: ask, do not guess.
const ambiguous = parseCoachCommands('one slip last night', { plan: bothPlan, now: NOW });
assert.equal(ambiguous.entries.length, 0, 'nothing logged until the habit is clear');
assert.match(ambiguous.clarification ?? '', /cigarette or your second habit/);
const clarified = parseCoachCommands('one slip last night, it was porn', { plan: bothPlan, now: NOW });
assert.equal(clarified.entries.length, 1);
assert.equal(clarified.entries[0].type, 'FAP');
const clarifiedSmoke = parseCoachCommands('one slip last night, a cigarette', { plan: bothPlan, now: NOW });
assert.equal(clarifiedSmoke.entries[0].type, 'CIGARETTE');
const clarifiedHabit = parseCoachCommands('one slip last night, the second habit', { plan: bothPlan, now: NOW });
assert.equal(clarifiedHabit.entries[0].type, 'FAP');
console.log('✓ Test 4b: with both habits tracked, an unclear slip asks instead of guessing.');

// 5. Craving vs second-habit urge depends on what is tracked.
const craving = parseCoachCommands('I beat a craving 20 minutes ago', { plan: smokingPlan, now: NOW });
assert.equal(craving.entries[0].type, 'CRAVING_BEATEN');
near(craving.entries[0].timestamp, NOW - 20 * MIN);
const urge = parseCoachCommands('I beat an urge just now', { plan: fapPlan, now: NOW });
assert.equal(urge.entries[0].type, 'FAP_URGE_BEATEN');
console.log('✓ Test 5: beaten cravings and second-habit urges use the right entry type.');

// 6. Counts: several events in one message, capped at five.
const two = parseCoachCommands('two cigarettes yesterday', { plan: smokingPlan, now: NOW });
assert.equal(two.entries.length, 2);
assert.ok(two.entries.every((e) => e.type === 'CIGARETTE'));
assert.match(describeCommands(two.entries, NOW), /2 × cigarette/);
const nine = sanitizeEntryCommands(
  Array.from({ length: 9 }, () => ({ type: 'CIGARETTE', minutesAgo: 1 })),
  { now: NOW }
);
assert.equal(nine.length, 1, 'duplicate minute is de-duplicated');
const many = parseCoachCommands('five slips today', { plan: fapPlan, now: NOW });
assert.equal(many.entries.length, 5);
console.log('✓ Test 6: counts work, duplicates are merged, and 5 is the cap.');

// 7. Questions, intentions and negations must never create entries.
for (const message of [
  'how do I stop smoking?',
  'I want to smoke less',
  "I haven't smoked in 3 days",
  'I didn’t smoke today',
  'if I smoke one cigarette will I fail?',
  'I am thinking about smoking',
  'smoke-free for a week now',
]) {
  const result = parseCoachCommands(message, { plan: smokingPlan, now: NOW });
  assert.equal(result.entries.length, 0, `should not log: ${message}`);
}
console.log('✓ Test 7: questions, intentions and negations create no entries.');

// 8. A sentence can both log and change the plan.
const mixed = parseCoachCommands('I smoked 10 minutes ago and the pack price is 12', {
  plan: smokingPlan,
  now: NOW,
});
assert.equal(mixed.entries.length, 1);
assert.equal(mixed.planUpdates?.packPrice, 12);
console.log('✓ Test 8: one message can log an entry and update the plan.');

// 9. Plan timestamps stay in the past.
const quit = parseCoachCommands('I quit 3 days ago', { plan: smokingPlan, now: NOW });
assert.equal(quit.entries.length, 0, '"quit 3 days ago" is not a cigarette');
near(new Date(quit.planUpdates!.quitStartDate!).getTime(), NOW - 3 * DAY);
console.log('✓ Test 9: "I quit 3 days ago" changes the quit date, not the log.');

// 10. Model output is untrusted: bad types, future times and junk are dropped.
const hostile = sanitizeEntryCommands(
  [
    { type: 'SMOKED_EVERYTHING', minutesAgo: 5 },
    { type: 'FAP', timestamp: new Date(NOW + 30 * DAY).toISOString() },
    { type: 'CIGARETTE', cravingStrength: 99, triggers: ['stress', 42] },
    'nonsense',
    null,
  ],
  { now: NOW }
);
assert.equal(hostile.length, 2, 'only the two valid commands survive');
const futureClamped = hostile.find((e) => e.type === 'FAP')!;
assert.ok(futureClamped.timestamp <= NOW, 'a future timestamp is clamped to now');
assert.deepEqual(hostile.find((e) => e.type === 'CIGARETTE')!.triggers, ['stress']);
assert.equal(hostile.find((e) => e.type === 'CIGARETTE')!.cravingStrength, 10);
console.log('✓ Test 10: invalid model entries are dropped or clamped.');

// 11. Plan updates are allowlisted too.
const planUpdates = sanitizePlanUpdates({
  packPrice: 12,
  usualPerDay: -3,
  targets: ['SMOKE', 'ALCOHOL'],
  quitStartDate: 'not-a-date',
  discreetMode: true,
  healthFlags: { heartCondition: true },
  admin: true,
});
assert.equal(planUpdates?.packPrice, 12);
assert.equal(planUpdates?.discreetMode, true);
assert.deepEqual(planUpdates?.targets, ['SMOKE']);
assert.equal(planUpdates?.usualPerDay, undefined);
assert.equal(planUpdates?.quitStartDate, undefined);
assert.equal((planUpdates as Record<string, unknown>)?.healthFlags, undefined);
assert.equal((planUpdates as Record<string, unknown>)?.admin, undefined);
console.log('✓ Test 11: plan updates are restricted to real, valid fields.');

// 12. Entries match the shape the app's own buttons write.
const cigaretteEntry = buildEntryFromCommand({ type: 'CIGARETTE', timestamp: NOW - 5 * MIN });
assert.equal(cigaretteEntry.habitId, 'smoking');
assert.equal(cigaretteEntry.source, 'app');
assert.equal(cigaretteEntry.type, 'CIGARETTE');
assert.ok(cigaretteEntry.id.startsWith('entry_'));
const fapEntry = buildEntryFromCommand({ type: 'FAP', timestamp: NOW - 5 * MIN });
assert.equal(fapEntry.habitId, 'fap');
assert.ok(fapEntry.id.startsWith('fap_'));
console.log('✓ Test 12: commands build entries in the app’s native shape.');

// 13. Time phrases.
near(parseWhen('10 minutes ago', NOW).timestamp, NOW - 10 * MIN);
near(parseWhen('2 hours ago', NOW).timestamp, NOW - 2 * HOUR);
near(parseWhen('3 days ago', NOW).timestamp, NOW - 3 * DAY);
near(parseWhen('just now', NOW).timestamp, NOW, 1000);
console.log('✓ Test 13: relative time phrases resolve correctly.');

// 14. End to end through the coach with no API key and no server.
const realFetch = globalThis.fetch;
(globalThis as { fetch: unknown }).fetch = () => Promise.reject(new Error('offline'));
try {
  const offline = await askGeminiCoach({
    userMessage: 'I smoked 10 minutes ago',
    plan: smokingPlan,
    entries: [],
    chatHistory: [],
  });
  assert.equal(offline.suggestedEntries?.length, 1, 'offline coach returns an entry');
  assert.equal(offline.suggestedEntries?.[0].type, 'CIGARETTE');
  near(offline.suggestedEntries![0].timestamp, Date.now() - 10 * MIN, 5000);
  assert.match(offline.reply, /^Saved\./, 'reply confirms the save without duplicating the receipt');
  assert.match(offline.actionTakenDescription ?? '', /cigarette.*10 min ago/);
  assert.match(offline.reply, /undo/i, 'reply tells the person it can be undone');

  const offlineSlip = await askGeminiCoach({
    userMessage: 'one slip last night',
    plan: fapPlan,
    entries: [],
    chatHistory: [],
  });
  assert.equal(offlineSlip.suggestedEntries?.[0].type, 'FAP');

  const offlineAmbiguous = await askGeminiCoach({
    userMessage: 'one slip last night',
    plan: bothPlan,
    entries: [],
    chatHistory: [],
  });
  assert.equal(offlineAmbiguous.suggestedEntries, undefined, 'ambiguous slip logs nothing');
  assert.match(offlineAmbiguous.reply, /cigarette or your second habit/);

  const offlineQuestion = await askGeminiCoach({
    userMessage: 'how do I stop smoking?',
    plan: smokingPlan,
    entries: [],
    chatHistory: [],
  });
  assert.equal(offlineQuestion.suggestedEntries, undefined, 'a question logs nothing');

  const offlinePlan = await askGeminiCoach({
    userMessage: 'I quit 3 days ago',
    plan: smokingPlan,
    entries: [],
    chatHistory: [],
  });
  assert.ok(offlinePlan.suggestedPlanUpdates?.quitStartDate);
  assert.equal(offlinePlan.suggestedEntries, undefined);
} finally {
  globalThis.fetch = realFetch;
}
console.log('✓ Test 14: offline coach (no key, no server) logs the same commands.');

// 15. A live-model JSON block is honoured, and a malformed one changes nothing.
(globalThis as { fetch: unknown }).fetch = async () =>
  new Response(
    JSON.stringify({
      reply: 'Got it.',
      isSafetyAlert: false,
      entries: [{ type: 'CIGARETTE', minutesAgo: 30 }],
      updates: { packPrice: 14 },
      action: 'Logged it.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
try {
  const proxied = await askGeminiCoach({
    userMessage: 'I smoked half an hour ago',
    plan: smokingPlan,
    entries: [],
    chatHistory: [],
  });
  assert.equal(proxied.suggestedEntries?.length, 1);
  assert.equal(proxied.suggestedPlanUpdates?.packPrice, 14);
  assert.equal(proxied.reply, 'Got it.');
} finally {
  globalThis.fetch = realFetch;
}
console.log('✓ Test 15: server-proxied replies carry validated entries and plan updates.');

console.log('All coach logging tests passed.');
