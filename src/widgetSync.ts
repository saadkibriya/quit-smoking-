import { registerPlugin } from '@capacitor/core';

const Preferences = registerPlugin<{
  set(options: { key: string; value: string }): Promise<void>;
}>('Preferences');

export async function syncWidget(d: {
  quitDate: string | number | Date;
  cigsPerDay: number;
  packSize?: number;
  packCost: number;
  currency?: string;
}) {
  try {
    await Preferences.set({ key: 'unlit_quit_date', value: String(new Date(d.quitDate).getTime()) });
    await Preferences.set({ key: 'unlit_cigs_per_day', value: String(d.cigsPerDay) });
    await Preferences.set({ key: 'unlit_pack_size', value: String(d.packSize ?? 20) });
    await Preferences.set({ key: 'unlit_pack_cost', value: String(d.packCost) });
    await Preferences.set({ key: 'unlit_currency', value: d.currency ?? '৳' });
  } catch {
    // not running inside the Android app: ignore
  }
}
