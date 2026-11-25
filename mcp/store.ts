/**
 * JSON-file store for the Quiter MCP server.
 *
 * The file is deliberately the *same shape* as Toolkit → Backup → Export JSON,
 * so the two directions are lossless:
 *   app export  → copy over this file  → Gemini/MCP sees current data
 *   this file   → Toolkit → Import JSON → app sees what the model wrote
 *
 * Nothing here is imported by the app bundle; it only runs under `mcp/server.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EarnedBadge,
  Entry,
  OtherHabit,
  QuitAttempt,
  ToolStat,
  UserPlan,
} from '../src/types';
import { DEFAULT_PLAN } from '../src/data/storage';

export interface QuiterStore {
  version: string;
  exportedAt?: string;
  updatedAt?: string;
  plan: UserPlan;
  entries: Entry[];
  attempts: QuitAttempt[];
  badges: EarnedBadge[];
  toolStats: ToolStat[];
  otherHabits: OtherHabit[];
}

export const DEFAULT_STORE_PATH = fileURLToPath(
  new URL('../data/quiter-store.json', import.meta.url)
);

export function storePath(): string {
  const fromEnv = process.env.QUITER_STORE;
  return fromEnv ? path.resolve(fromEnv) : DEFAULT_STORE_PATH;
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Coerce whatever is on disk (an app export, or a hand-edited file) into a usable store. */
export function normalizeStore(raw: unknown): QuiterStore {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const planInput = (data.plan && typeof data.plan === 'object' ? data.plan : {}) as Partial<UserPlan>;
  const defaultGoal = DEFAULT_PLAN.savingsGoal ?? { name: 'Reward goal', targetAmount: 100 };

  const plan: UserPlan = {
    ...DEFAULT_PLAN,
    ...planInput,
    packPrice: asNumber(planInput.packPrice, DEFAULT_PLAN.packPrice),
    cigarettesPerPack: Math.max(1, asNumber(planInput.cigarettesPerPack, DEFAULT_PLAN.cigarettesPerPack)),
    usualPerDay: asNumber(planInput.usualPerDay, DEFAULT_PLAN.usualPerDay),
    fapPerDay: asNumber(planInput.fapPerDay, DEFAULT_PLAN.fapPerDay),
    fapGoalPerDay: asNumber(planInput.fapGoalPerDay, DEFAULT_PLAN.fapGoalPerDay),
    quitStartDate:
      typeof planInput.quitStartDate === 'string' && !Number.isNaN(new Date(planInput.quitStartDate).getTime())
        ? planInput.quitStartDate
        : DEFAULT_PLAN.quitStartDate,
    fapStartDate:
      typeof planInput.fapStartDate === 'string' && !Number.isNaN(new Date(planInput.fapStartDate).getTime())
        ? planInput.fapStartDate
        : DEFAULT_PLAN.fapStartDate,
    targets:
      Array.isArray(planInput.targets) && planInput.targets.length > 0
        ? planInput.targets.filter((t) => t === 'SMOKE' || t === 'FAP')
        : DEFAULT_PLAN.targets,
    healthFlags: { ...DEFAULT_PLAN.healthFlags, ...(planInput.healthFlags || {}) },
    supportContact: { ...DEFAULT_PLAN.supportContact, ...(planInput.supportContact || {}) },
    savingsGoal: {
      name: planInput.savingsGoal?.name || defaultGoal.name,
      targetAmount: asNumber(planInput.savingsGoal?.targetAmount, defaultGoal.targetAmount),
    },
  };

  const entries = asArray<Entry>(data.entries).filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.type === 'string' &&
      Number.isFinite(Number(entry.timestamp))
  ).map((entry) => ({
    ...entry,
    timestamp: Number(entry.timestamp),
    timezoneOffset: asNumber(entry.timezoneOffset, new Date().getTimezoneOffset()),
  }));

  return {
    version: typeof data.version === 'string' ? data.version : '1.0.0',
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    plan,
    entries,
    attempts: asArray<QuitAttempt>(data.attempts),
    badges: asArray<EarnedBadge>(data.badges),
    toolStats: asArray<ToolStat>(data.toolStats),
    otherHabits: asArray<OtherHabit>(data.otherHabits),
  };
}

export interface ReadResult {
  store: QuiterStore;
  path: string;
  createdFromDefaults: boolean;
}

export function readStore(): ReadResult {
  const file = storePath();
  if (!fs.existsSync(file)) {
    return {
      store: normalizeStore({ plan: DEFAULT_PLAN, entries: [] }),
      path: file,
      createdFromDefaults: true,
    };
  }

  const raw = fs.readFileSync(file, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Store at ${file} is not valid JSON (${(error as Error).message}). ` +
        'Fix the file or point QUITER_STORE at a valid Quiter export.'
    );
  }
  return { store: normalizeStore(parsed), path: file, createdFromDefaults: false };
}

export interface WriteResult {
  path: string;
  backupPath?: string;
}

/**
 * Write atomically (temp file + rename) and keep the previous file as `.bak`,
 * so a bad model call can never half-write the person's history.
 */
export function writeStore(store: QuiterStore): WriteResult {
  const file = storePath();
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });

  const payload: QuiterStore = { ...store, updatedAt: new Date().toISOString() };
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  let backupPath: string | undefined;
  if (fs.existsSync(file)) {
    backupPath = `${file}.bak`;
    fs.copyFileSync(file, backupPath);
  }

  fs.renameSync(temp, file);
  return { path: file, backupPath };
}

export function newEntryId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
