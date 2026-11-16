import { Preferences } from '@capacitor/preferences';

/**
 * Pushes the handful of values the Android home-screen widget needs into the
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
}): Promise<void> {
  const quitMs = new Date(d.quitDate).getTime();
  if (!Number.isFinite(quitMs)) return;

  try {
    await Promise.all([
      Preferences.set({ key: 'unlit_quit_date', value: String(quitMs) }),
      Preferences.set({ key: 'unlit_cigs_per_day', value: String(d.cigsPerDay) }),
      Preferences.set({ key: 'unlit_pack_size', value: String(d.packSize ?? 20) }),
      Preferences.set({ key: 'unlit_pack_cost', value: String(d.packCost) }),
      Preferences.set({ key: 'unlit_currency', value: d.currency ?? '৳' }),
    ]);
  } catch {
    // Not running inside the native shell, or the plugin is unavailable.
    // The widget is an enhancement; never let it break the app.
  }
}
