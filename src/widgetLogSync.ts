import { Preferences } from '@capacitor/preferences';
import { Storage } from './data/storage';
import { Entry } from './types';

const PENDING_KEY = 'unlit_pending_logs';

interface PendingLog {
  id?: string;
  ts?: number;
  count?: number;
}

/**
 * The days widget lets the user type a smoke count straight from the home
 * screen. A widget cannot host a text field, so the native dialog queues the
 * count in CapacitorStorage and this drains it into real entries the next time
 * the app is in front.
 *
 * Returns how many entries were added.
 */
export async function drainWidgetLogs(): Promise<number> {
  let raw: string | null = null;
  try {
    const res = await Preferences.get({ key: PENDING_KEY });
    raw = res.value;
  } catch {
    return 0;
  }
  if (!raw) return 0;

  let items: PendingLog[] = [];
  try {
    const parsed = JSON.parse(raw);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    // Unreadable queue: clear it so it cannot pile up.
    await Preferences.remove({ key: PENDING_KEY }).catch(() => undefined);
    return 0;
  }

  const entries = Storage.getEntries();
  const known = new Set(entries.map((e) => e.id));
  let added = 0;

  for (const item of items) {
    const count = Math.min(99, Math.max(1, Math.floor(Number(item?.count) || 0)));
    const ts = Number(item?.ts) || Date.now();
    const batchId = item?.id || `widget_${ts}`;
    for (let i = 0; i < count; i++) {
      const id = `${batchId}_${i}`;
      if (known.has(id)) continue;
      const entry: Entry = {
        id,
        timestamp: ts - i * 1000,
        timezoneOffset: new Date().getTimezoneOffset(),
        type: 'CIGARETTE',
        habitId: 'smoking',
        source: 'widget',
        note: 'Logged from the widget',
      };
      entries.push(entry);
      known.add(id);
      added += 1;
    }
  }

  if (added > 0) Storage.saveEntries(entries);
  await Preferences.remove({ key: PENDING_KEY }).catch(() => undefined);
  return added;
}
