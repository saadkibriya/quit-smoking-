import { Preferences } from '@capacitor/preferences';

/**
 * Pushes the handful of values the Android home-screen widgets need into the
 * Preferences store (which the native widget reads from `CapacitorStorage`).
 *
 * On the web this resolves to a harmless no-op wrapper, so callers never need
 * to branch on platform.
 */
export async function syncWidget(d: {
  quitDate: string | number | Date;
  cigsPerDay: number;
  packSize?: number;
  packCost: number;
  currency?: string;
  /** Cigarettes actually logged since the quit date, so the widget can net them out. */
  loggedCigs?: number;
  /** Second-habit streak anchor and lapse count, used by the "Streak" widget. */
  fapStartDate?: string | number | Date;
  fapSlips?: number;
}): Promise<void> {
  const quitMs = new Date(d.quitDate).getTime();
  if (!Number.isFinite(quitMs)) return;

  const fapMs = d.fapStartDate === undefined ? 0 : new Date(d.fapStartDate).getTime();

  try {
    await Promise.all([
      Preferences.set({ key: 'unlit_quit_date', value: String(quitMs) }),
      Preferences.set({ key: 'unlit_cigs_per_day', value: String(d.cigsPerDay) }),
      Preferences.set({ key: 'unlit_pack_size', value: String(d.packSize ?? 20) }),
      Preferences.set({ key: 'unlit_pack_cost', value: String(d.packCost) }),
      Preferences.set({ key: 'unlit_currency', value: d.currency ?? '৳' }),
      Preferences.set({ key: 'unlit_logged_total', value: String(d.loggedCigs ?? 0) }),
      Preferences.set({ key: 'unlit_fap_start', value: String(Number.isFinite(fapMs) ? fapMs : 0) }),
      Preferences.set({ key: 'unlit_fap_slips', value: String(d.fapSlips ?? 0) }),
    ]);
  } catch {
    // Not running inside the native shell, or the plugin is unavailable.
    // The widget is an enhancement; never let it break the app.
  }
}
