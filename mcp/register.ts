/**
 * The Quiter MCP tool surface, in one place.
 *
 * Two entry points use it:
 *   mcp/server.ts   → stdio (`npm run mcp`, Gemini CLI local server)
 *   server.ts       → Streamable HTTP at POST /api/mcp (the app hosting its own server)
 *
 * Tools: log_entry, update_plan, get_stats. Backed by one JSON file (QUITER_STORE,
 * default <repo>/data/quiter-store.json) in the same shape as the app's Export JSON.
 *
 * This file is never imported by src/, so nothing here ships in the Vite bundle.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Entry, UserPlan } from '../src/types';
import {
  calculateAvoidedCigarettes,
  calculateCurrentStreak,
  calculateMoneyKept,
  calculateSmokeFreeDays,
  calculateTopTriggers,
  isCravingResistedEvent,
  isSmokeEvent,
} from '../src/domain/calculations';
import { getFapStats, isFapLapse } from '../src/domain/fap';
import { newEntryId, readStore, writeStore, type QuiterStore } from './store';

const DAY_MS = 86_400_000;
const SERVER_VERSION = '1.1.0';

function textResult(payload: unknown, isError = false) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function fail(message: string) {
  return textResult({ ok: false, error: message }, true);
}

/** ISO string or epoch ms → ms, or null when unusable. */
function parseWhen(value: string | undefined): number | null {
  if (!value) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 1_000_000_000) return asNumber;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function iso(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

const ENTRY_TYPES = [
  'CIGARETTE',
  'CRAVING_BEATEN',
  'FAP',
  'FAP_URGE_BEATEN',
  'PLEDGE',
] as const;

const ISO_DATE = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Expected an ISO date/time, e.g. 2026-11-25T14:30:00Z');

const TIME_OF_DAY = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM (24-hour)');

const planPatchSchema = z
  .object({
    mode: z.enum(['QUIT', 'CUT_DOWN', 'TRACK']).optional(),
    targets: z.array(z.enum(['SMOKE', 'FAP'])).min(1).optional(),
    quitStartDate: ISO_DATE.optional(),
    fapStartDate: ISO_DATE.optional(),
    packPrice: z.number().min(0).max(100_000).optional(),
    cigarettesPerPack: z.number().int().min(1).max(200).optional(),
    usualPerDay: z.number().min(0).max(200).optional(),
    fapPerDay: z.number().min(0).max(50).optional(),
    fapGoalPerDay: z.number().min(0).max(50).optional(),
    currency: z.string().min(1).max(4).optional(),
    triggers: z.array(z.string().min(1)).max(40).optional(),
    reasons: z.array(z.string().min(1)).max(40).optional(),
    coachStyle: z.enum(['GENTLE', 'DIRECT', 'SCIENCE']).optional(),
    age: z.number().int().min(13).max(120).optional(),
    wakeTime: TIME_OF_DAY.optional(),
    sleepTime: TIME_OF_DAY.optional(),
    discreetMode: z.boolean().optional(),
    savingsGoal: z
      .object({ name: z.string().min(1).optional(), targetAmount: z.number().min(1).optional() })
      .optional()
      .describe('Partial patch: send only the field you want to change'),
    healthFlags: z
      .object({
        pregnantOrBreastfeeding: z.boolean(),
        heartCondition: z.boolean(),
        mentalHealthCondition: z.boolean(),
        takingInteractingMeds: z.boolean(),
      })
      .partial()
      .optional(),
  })
  .strict();

const PLAN_KEYS = Object.keys(planPatchSchema.shape) as Array<keyof typeof planPatchSchema.shape>;

function describeChange(label: string, before: unknown, after: unknown) {
  const show = (value: unknown) => JSON.stringify(value) ?? String(value);
  return `${label}: ${show(before)} → ${show(after)}`;
}

function statsFor(store: QuiterStore, days: number) {
  const now = Date.now();
  const plan = store.plan;
  const entries = store.entries;
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const avoided = calculateAvoidedCigarettes(entries, plan, now);
  const moneyKept = calculateMoneyKept(avoided, plan);
  const fap = getFapStats(entries, plan.fapStartDate, now);
  const windowStart = now - days * DAY_MS;
  const windowEntries = entries.filter(
    (entry) => !entry.undone && entry.timestamp >= windowStart && entry.timestamp <= now
  );

  const cravingsBeatenWindow = windowEntries.filter(isCravingResistedEvent).length;
  const cigarettesWindow = windowEntries.filter(isSmokeEvent).length;
  const fapLapsesWindow = windowEntries.filter(isFapLapse).length;
  const lastEntry = entries.reduce<Entry | null>(
    (latest, entry) => (!latest || entry.timestamp > latest.timestamp ? entry : latest),
    null
  );

  return {
    asOf: new Date(now).toISOString(),
    windowDays: days,
    plan: {
      mode: plan.mode,
      targets: plan.targets,
      quitStartDate: plan.quitStartDate,
      fapStartDate: plan.fapStartDate,
      usualPerDay: plan.usualPerDay,
      cigarettesPerPack: plan.cigarettesPerPack,
      packPrice: plan.packPrice,
      currency: plan.currency,
      fapGoalPerDay: plan.fapGoalPerDay,
      coachStyle: plan.coachStyle,
      discreetMode: plan.discreetMode,
    },
    smoking: {
      streakDays: streak.days,
      streakHours: streak.hours,
      streakMinutes: streak.minutes,
      lastCigaretteAt: iso(streak.lastCigaretteTimestamp),
      completedSmokeFreeDays: smokeFree.completedSmokeFreeDays,
      smokeFreeToday: smokeFree.isTodaySoFarSmokeFree,
      cigarettesToday: smokeFree.todayCigarettesCount,
      cigarettesLoggedInWindow: cigarettesWindow,
      cigarettesAvoidedTotal: avoided,
      moneyKeptTotal: moneyKept,
      moneyKeptDisplay: `${plan.currency}${moneyKept.toFixed(2)}`,
    },
    cravings: {
      beatenTotal: entries.filter(isCravingResistedEvent).length,
      beatenInWindow: cravingsBeatenWindow,
    },
    secondHabit: {
      tracked: plan.targets.includes('FAP'),
      cleanDays: fap.cleanDays,
      cleanHours: fap.cleanHours,
      cleanToday: fap.cleanToday,
      lapsesTotal: fap.totalLapses,
      lapsesInWindow: fapLapsesWindow,
      longestCleanHours: Math.round(fap.longestCleanHours * 10) / 10,
      lastLapseAt: fap.lastLapseAt ? iso(fap.lastLapseAt) : null,
    },
    topTriggers: calculateTopTriggers(windowEntries).slice(0, 5),
    totals: {
      entries: entries.length,
      attempts: store.attempts.length,
      badges: store.badges.length,
      lastEntryAt: lastEntry ? iso(lastEntry.timestamp) : null,
    },
  };
}

/**
 * Build a fresh MCP server with all three tools registered.
 * A new instance per request keeps the HTTP endpoint stateless.
 */
export function createQuiterServer(): McpServer {
  const server = new McpServer({ name: 'quiter', version: SERVER_VERSION });

  server.registerTool(
    'log_entry',
    {
      title: 'Log a Quiter entry',
      description:
        'Log one tracking entry into the Quiter store: a cigarette (CIGARETTE), a craving you rode out ' +
        '(CRAVING_BEATEN), a second-habit slip (FAP), a second-habit urge you beat (FAP_URGE_BEATEN), or a ' +
        'daily pledge (PLEDGE). Use "minutesAgo" for "20 minutes ago" or an ISO "timestamp".',
      inputSchema: {
        type: z.enum(ENTRY_TYPES).describe('What happened'),
        minutesAgo: z
          .number()
          .min(0)
          .max(60 * 24 * 30)
          .optional()
          .describe('How long ago it happened, in minutes. Ignored when timestamp is given.'),
        timestamp: z
          .string()
          .optional()
          .describe('ISO date/time of the event, e.g. 2026-11-25T14:30:00Z. Defaults to now.'),
        triggers: z
          .array(z.string().min(1))
          .max(20)
          .optional()
          .describe('Situational triggers, e.g. ["stress","coffee_tea"]'),
        cravingStrength: z.number().int().min(1).max(10).optional(),
        urgeStrength: z.number().int().min(1).max(10).optional().describe('For second-habit urges'),
        cravingDurationSeconds: z.number().int().min(0).max(86_400).optional(),
        mood: z.number().int().min(1).max(5).optional(),
        note: z.string().max(500).optional(),
      },
    },
    async (args) => {
      try {
        const when =
          args.timestamp !== undefined
            ? parseWhen(args.timestamp)
            : Date.now() - Math.round((args.minutesAgo ?? 0) * 60_000);

        if (when === null) return fail('Could not read "timestamp"; use an ISO date/time.');
        if (when > Date.now() + 60_000) return fail('That timestamp is in the future. Quiter only logs the past.');

        const { store } = readStore();
        const isFap = args.type === 'FAP' || args.type === 'FAP_URGE_BEATEN';

        const entry: Entry = {
          id: newEntryId(isFap ? 'fap' : args.type.toLowerCase()),
          timestamp: when,
          timezoneOffset: new Date(when).getTimezoneOffset(),
          type: args.type,
          source: 'app',
          habitId: isFap ? 'fap' : 'smoking',
          ...(args.triggers && args.triggers.length > 0 ? { triggers: args.triggers } : {}),
          ...(args.cravingStrength !== undefined ? { cravingStrength: args.cravingStrength } : {}),
          ...(args.urgeStrength !== undefined ? { urgeStrength: args.urgeStrength } : {}),
          ...(args.cravingDurationSeconds !== undefined
            ? { cravingDurationSeconds: args.cravingDurationSeconds }
            : {}),
          ...(args.mood !== undefined ? { mood: args.mood } : {}),
          ...(args.note ? { note: args.note } : {}),
        };

        store.entries.push(entry);
        const written = writeStore(store);
        const stats = statsFor(store, 7);

        return textResult({
          ok: true,
          logged: entry,
          writtenTo: written.path,
          backup: written.backupPath ?? null,
          now: {
            streakDays: stats.smoking.streakDays,
            smokeFreeToday: stats.smoking.smokeFreeToday,
            cigarettesToday: stats.smoking.cigarettesToday,
            cravingsBeatenTotal: stats.cravings.beatenTotal,
            secondHabitCleanDays: stats.secondHabit.cleanDays,
            secondHabitLapsesTotal: stats.secondHabit.lapsesTotal,
          },
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    'update_plan',
    {
      title: 'Update the Quiter plan',
      description:
        'Change plan fields in the Quiter store (quit date, pack price, cigarettes per pack, usual per day, ' +
        'triggers, reasons, targets, currency, coach style, savings goal, health flags). Only the fields you ' +
        'pass are changed; the response lists each before/after. Never touches logged entries.',
      inputSchema: planPatchSchema,
    },
    async (args) => {
      try {
        // planPatchSchema is strict and every field optional, so the only way to
        // reach an empty patch is a call with no fields at all.
        const supplied = Object.entries(args).filter(([, value]) => value !== undefined);
        if (supplied.length === 0) {
          return fail(`No plan fields supplied. Allowed fields: ${PLAN_KEYS.join(', ')}.`);
        }

        const { store, createdFromDefaults } = readStore();
        const next: UserPlan = { ...store.plan };
        const changes: string[] = [];

        for (const [key, value] of supplied) {
          if (key === 'healthFlags') {
            const merged = { ...next.healthFlags, ...(value as Partial<UserPlan['healthFlags']>) };
            changes.push(describeChange('healthFlags', next.healthFlags, merged));
            next.healthFlags = merged;
          } else if (key === 'savingsGoal') {
            const patchGoal = (value ?? {}) as Partial<NonNullable<UserPlan['savingsGoal']>>;
            const currentGoal = next.savingsGoal ?? { name: 'Reward goal', targetAmount: 100 };
            const merged = {
              name: patchGoal.name ?? currentGoal.name,
              targetAmount: patchGoal.targetAmount ?? currentGoal.targetAmount,
            };
            changes.push(describeChange('savingsGoal', next.savingsGoal, merged));
            next.savingsGoal = merged;
          } else {
            const field = key as keyof UserPlan;
            changes.push(describeChange(key, store.plan[field], value));
            (next as unknown as Record<string, unknown>)[key] = value;
          }
        }

        store.plan = next;
        const written = writeStore(store);

        return textResult({
          ok: true,
          changed: changes,
          plan: {
            mode: next.mode,
            targets: next.targets,
            quitStartDate: next.quitStartDate,
            fapStartDate: next.fapStartDate,
            usualPerDay: next.usualPerDay,
            cigarettesPerPack: next.cigarettesPerPack,
            packPrice: next.packPrice,
            currency: next.currency,
            fapGoalPerDay: next.fapGoalPerDay,
            coachStyle: next.coachStyle,
          },
          writtenTo: written.path,
          backup: written.backupPath ?? null,
          seededDefaults: createdFromDefaults,
          note: 'Plan only — logged entries are untouched.',
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  server.registerTool(
    'get_stats',
    {
      title: 'Read Quiter stats',
      description:
        'Read current Quiter numbers: smoke-free streak, completed smoke-free days, cigarettes avoided, money ' +
        'kept, cravings beaten, second-habit clean time and lapses, top triggers, plus the active plan. ' +
        'Use days to widen the window (default 7).',
      inputSchema: {
        days: z.number().int().min(1).max(365).optional().describe('Window for recent activity, default 7'),
        includeRecentEntries: z
          .boolean()
          .optional()
          .describe('Include the most recent entries (default false)'),
        limit: z.number().int().min(1).max(100).optional().describe('Recent entries to return, default 20'),
      },
    },
    async (args) => {
      try {
        const { store, path, createdFromDefaults } = readStore();
        const stats = statsFor(store, args.days ?? 7);
        const recent = args.includeRecentEntries
          ? [...store.entries]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, args.limit ?? 20)
              .map((entry) => ({
                id: entry.id,
                at: iso(entry.timestamp),
                type: entry.type,
                habitId: entry.habitId ?? 'smoking',
                triggers: entry.triggers ?? [],
                note: entry.note ?? null,
                undone: entry.undone ?? false,
              }))
          : undefined;

        return textResult({
          ok: true,
          ...stats,
          storePath: path,
          storeMissing: createdFromDefaults,
          ...(recent ? { recentEntries: recent } : {}),
        });
      } catch (error) {
        return fail((error as Error).message);
      }
    }
  );

  return server;
}
