# CHANGELOG — Unlit Quit-Smoking Tracker

All notable changes to Unlit are documented here per `infos.md` (Worker Rules) and `roadmap.md`.

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

