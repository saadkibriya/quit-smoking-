# CHANGELOG — Unlit Quit-Smoking Tracker

All notable changes to Unlit are documented here per `infos.md` (Worker Rules) and `roadmap.md`.

## [2026-11-20] — Fix the home-screen widget showing no data

### Fixed
- **The widget never refreshed after the app wrote its values.** It only rebuilt itself
  when first added and on the system's 30-minute tick, so it sat on its placeholder
  text indefinitely. `MainActivity` now rebuilds every placed widget on open, resume
  and leave, plus a delayed rebuild after the first paint so a cold start shows data
  immediately.
- **Widget reads are defensive.** Any failure while reading preferences or attaching
  the tap intent now falls back instead of dropping the whole update, so the widget
  can no longer come out blank.
- **Layout no longer clips in a 2x2 cell**: 44sp day counter (bold, single line) and
  14sp figures instead of 52sp/16sp.
- **Sub-day streaks show hours** (`12h · SMOKE-FREE SO FAR`) instead of a bare `0`.
- Added `android:label` so the picker lists the widget as "Unlit streak", and rebuild
  on resize.

## [2026-11-16] — Installable build: icons, offline shell, app shortcuts

### Install readiness
- **Icons generated from code** (`scripts/generate-icons.mjs`, `npm run icons`): 192/512 maskable
  plus a 180 Apple touch icon. The manifest had been pointing at files that did not exist, which
  blocked browser install entirely.
- **Service worker** (`public/sw.js`) with an offline app shell: network-first navigations with cache
  fallback, cache-first hashed assets. Registered in production builds only.
- **Manifest** gains `id`, `scope`, `lang`, categories and separate `any`/`maskable` icon entries.

### Lazy-user ergonomics
- App shortcut **"Log a cigarette"** (`/#log`) — long-press the launcher icon and log in one tap.
- `#log` deep link opens the log sheet directly; closing it clears the hash.
- **Android home-screen widget now receives real data**: `@capacitor/preferences` is a real dependency
  and `syncWidget()` runs whenever the plan changes (it was dead code before).

### Build pipeline
- Removed the stale duplicate `build-apk.ym` workflow (it pointed at a non-existent `apk/` folder).
- CI installs with `npm ci`, generates icons, and no longer installs Preferences ad hoc.
- `android/` is generated at build time and git-ignored.

## [2026-11-14] — Rate Meter, Nonsmoker Identity, Pace Dashboard

### 1. Rate Meter (new core loop)
- New `src/domain/pacing.ts`: measures the **distance between cigarettes**.
  - Personal baseline = median gap over 28 days, overnight gaps (>12h) excluded.
  - Target = ~20% wider than your own baseline, rounded to 5 minutes.
  - Compares the current gap with your earlier entries (previous gap, personal usual, 7-vs-7 trend).
  - Statuses: `CALIBRATING`, `EARLY`, `ON_PACE`, `STRETCHED` — diagnostic, never punitive.
- Evidence framing kept honest: NICE *Cut Down to Stop* lists interval stretching as a valid
  reduction method, and scheduled stretching reduced craving/withdrawal in a 2023 RCT, but abrupt
  quitting remains the strongest path to lasting abstinence. The meter is an on-ramp, not a destination.

### 2. Nonsmoker identity layer
- New `src/content/identity.ts`: identity statement, vote ledger, and 8 sourced mindset principles
  (Atomic Habits, The Easy Way to Stop Smoking, implementation intentions).
- One-tap daily vote logs a `PLEDGE` entry; votes = urges held + clean days + honest logs.

### 3. Pace dashboard (4th tab)
- Last-12-gap bar chart with a dashed target line and stretch streak.
- 7-day distance table (smoked / longest gap / average gap).
- Hardest-hour histogram (30 days) that turns weak hours into a designed plan.

### 4. Faster logging
- New `SmokeLogSheet`: Now / 10m / 30m / 1h / 2h / earlier chips, trigger chips, urge strength,
  and a live preview of whether the entry widens or shortens your gap before saving.
- Old manual-entry modal removed; long-press or the clock button opens the sheet.
- Slip recovery now only opens for a cigarette smoked just now, not backdated history.

### 5. Fixes
- `npm install` failed outright: root `esbuild@^0.25` conflicted with Vite 8's peer range. Aligned to `^0.28`.
- `src/domain/aiCoach.ts` referenced an undefined `chatMessages`, so the backend coach fallback
  always threw and silently degraded to the offline engine. Now uses `chatHistory`.
- Home layout migrates to version 2 so existing users receive the new cards without losing order.

## [2026-11-07] — Nothing OS Redesign, Simple Home, Craving Help & W1–W9 Widget Suite

### 1. Simple Home Screen (Section 1)
- **Top-to-bottom progressive disclosure default layout**:
  1. Hero timer: "Smoke-free for", large Doto font `12 days`, live ticking within-day Chronometer `04:37:12`.
  2. Two stat cards side by side: "Money saved" (`৳1,240`) and "Cigarettes not smoked" (`248`) in Doto font.
  3. Next health milestone: One line + 10-dot progress bar with certified health authority attribution (WHO / NHS / CDC).
  4. Large white filled full-width button: **"Ride out a craving"** (subtitle: "3-minute breathing to get through the urge", ≥ 64dp touch target).
  5. Red-outlined secondary button: **"I smoked"** (subtitle: "Logs it and restarts your timer", `#D71921` accent).
  6. Text link at bottom: **"Customize home"** (long-press on any card also triggers customizer).

### 2. "Customize home" Drawer (Section 2 & 3)
- Replaces raw edit icons with a clean two-section drawer:
  - **"On your home"**: Reorder cards (Up/Down), toggle sizes (`S`, `W`, `L`), hide cards (✕).
  - **"Add a card"**: Optional cards catalog (`Full health timeline`, `Cravings resisted`, `Longest streak / total smoke-free days`, `Dot calendar`, `Daily chart`, `Triggers log`, `My reasons`, `Savings goal`, `Achievements`, `Life regained`).
  - **"Reset to simple layout"** with confirmation dialog.
- Preserves existing layouts via `layoutVersion`.

### 3. Craving Help Screen (Section 4)
- Replaced confusing "SOS" terminology with **Craving help**.
- Opens directly into 3:00 breathing exercise with no intermediate menus.
- Animated breathing dot circle with haptic-synchronized sound ticks:
  - 4s Inhale / 6s Exhale (default), Box 4-4-4-4, or 4-7-8 Relax.
- Visible 3:00 countdown with reassurance: "Cravings usually pass in 3–5 minutes."
- Bottom quick options: "Distract me", "My reasons", "Change breathing".
- Outcome prompt: "Did the urge pass?" with "Yes, it passed", "Still strong" (4 D's: Delay, Distract, Deep breathing, Drink water), and "I smoked" (with kind slip logging).
- Deep link: Direct route `#craving` / `/craving`.

### 4. "I smoked" & 2-Minute Non-Punitive Undo (Section 5)
- Logging a cigarette immediately restarts current streak timer without wiping overall smoke-free days, money saved, or historical milestones.
- **2-Minute (120-second) Undo**: Persistent snackbar with exact non-shaming copy:
  *"Logged. Your timer restarted. You still have [X] smoke-free days behind you."*
- Marking Undo sets `undone: true`, completely restoring previous timer.
- Optional setting: "Ask before logging" (off by default).
- "Log earlier cigarette" option with time picker, triggers, and craving intensity.

### 5. Nothing OS Visual Design (Section 6)
- **Palette**: Pure black `#000000` (dark) / `#F2F2F2` (light), secondary text `#8A8A8A`, one accent red `#D71921` exclusively for "I smoked" and slips. No gradients.
- **Typography**: Google Fonts **Doto** for expressive numbers and clock tickers; clean sans (Inter) for body.
- **Shapes**: Rounded-square cards (20–24dp radius), 1dp border lines, dot matrix progress bars.

### 6. Native Android Glance Widgets W1–W9 (widget.md)
- **W1 (4×2)**: Smoke-free hero with big Doto font, Chronometer live ticker formula (`elapsedMs - days * 86_400_000`), "Craving help", and "I smoked" with 2-minute undo state. Resizable down to 2×2.
- **W2 (1×1)**: Craving button with dot-ring icon.
- **W3 (1×1)**: Quick log red dot button changing to "Undo" for 2 minutes.
- **W4 (2×2)**: Compact timer.
- **W5 (4×1)**: Strip layout (`12d 04:37:12 · ৳1,240 saved · [Craving]`).
- **W6 (2×2)**: Money saved with savings goal dot bar.
- **W7 (4×2)**: Next health milestone.
- **W8 (4×2)**: Dot calendar (28 dots).
- **W9 (4×2)**: Stats overview.
- Added **"Widget not updating? Fix it here"** card in Toolkit settings with battery optimization instructions.

### 7. Strict `labels.md` Dictionary Compliance
- Zero instances of "You failed", "Start over", "Relapse", or "SOS".
- Tab 2 renamed to **Progress**.
- Top bar button renamed to **Craving**.
- Success feedback: *"That's [N] cravings beaten"*.

### Files Modified & Created:
- `/index.html`: Google Fonts Doto & Inter integration.
- `/src/index.css`: Nothing OS design tokens, `--accent-red: #D71921`, `.font-doto`.
- `/src/types/index.ts`: `HomeCardId`, `HomeLayoutItem`, `UserPlan` settings.
- `/src/domain/calculations.ts`: `calculateStats`, `isSmokeEvent`, `isCravingResistedEvent`.
- `/src/data/storage.ts`: `DEFAULT_HOME_LAYOUT`, `ALL_HOME_CARDS`, `markEntryUndone`.
- `/src/components/today/DefaultHomeCards.tsx`: Default 4 cards + optional custom cards.
- `/src/components/today/QuickActions.tsx`: Primary "Ride out a craving" & outlined "I smoked".
- `/src/components/today/CustomizeHomeDrawer.tsx`: Drag reorder, size toggle, hide, add card, reset.
- `/src/components/sos/CravingHelpScreen.tsx`: Direct 3:00 breathing, animated dot circle, 4 D's.
- `/src/components/widgets/HomeScreenWidgetSimulator.tsx`: Nothing OS W1–W9 Glance preview.
- `/src/components/toolkit/ToolkitTab.tsx`: "Widget not updating? Fix it here" battery card.
- `/src/components/BottomNav.tsx`: Tab 2 "Progress".
- `/src/components/TopBar.tsx`: "Craving" button.
- `/App.tsx`: 2-minute undo timer, deep link `#craving`, layout integration.
- `/CHANGELOG.md`: Created project log.

## [2026-11-07 Update] — Glyph & Currency Fix, Custom Date & Time Picker, Nothing OS Phone Launcher

### 1. Broken Symbols & BDT Currency Fix
- Fixed broken font glyph issue (tofu box) where Unicode currency symbols like `৳` (BDT Taka) or `₹` (INR) failed inside monospace `font-doto`.
- Updated `.font-doto` CSS definition with robust sans-serif fallbacks (`'Doto', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- Isolated currency symbols into `<span className="font-sans font-bold ...">{currency}</span>` across all cards, widgets, and comparison summaries, allowing numbers to remain in Doto font while ensuring symbols never break.
- Added explicit **BDT (`৳`)** option in Onboarding, Toolkit, and storage alongside USD, EUR, GBP, INR, JPY, CAD, and AUD.

### 2. Custom Date & Time Picker (Presets Removed)
- Removed "Tomorrow morning", "Next Monday", and "1st of next month" presets per user request.
- Replaced with a single, dedicated **"Pick your quit date & time"** selector.
- Supports both exact date (`<input type="date">`) and exact time (`<input type="time">`), plus a quick "Set to right now" shortcut.
- Added an inline Date, Time & Currency adjuster directly under *Toolkit → My Plan & Configuration* for anytime adjustments.

### 3. Nothing OS Phone Launcher & Widget Reliability
- Added interactive **Phone Launcher Mode** accessible via the Top Bar ("Launcher" button):
  - Simulated Nothing OS home screen with status bar (`01:34`, 5G, 84%), Nothing OS Dot Matrix Clock & Weather, active interactive widgets (W1–W9), Google search bar, and app dock with Unlit app launcher.
  - Interactive widgets allow immediate "Craving help" launch, "I smoked" logging, and 2-minute undo directly from the simulated phone home screen.
- **Anti-Breakage Safeguards**:
  - Guarded against missing or invalid dates (`NaN` prevention), future quit dates, and empty entries.
  - Widgets never crash, go blank, or show negative numbers.
- Added `/public/manifest.json` and PWA integration for actual Android "Add to Home screen" installation.

