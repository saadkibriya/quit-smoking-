# widget.md — Home-Screen Widget Spec + Anti-Breakage Rules

## Platform requirement
Widgets are **native Android only**. Build them in **Kotlin with Jetpack Glance** inside the native Android app (AI Studio "Build an Android app" mode, or Android Studio after export). A web/PWA build cannot do this.

App and widgets must read and write the **same DataStore** (see `infos.md` → Data model).

---

## Widget catalog

### Phase 1 (must ship)

**W1 — Smoke-free (main) · default 4×2 · resizable down to 2×2**
- Top-left small grey label: "SMOKE-FREE"
- Big Doto number: `12` + "DAYS"
- Under it, live ticking time within the current day: `04:37:12` (via Chronometer)
- Bottom row, two buttons:
  - **"Craving help"** (white filled) → opens the Craving help screen directly, breathing already running
  - **"I smoked"** (red outline) → logs + restarts timer, then shows "Logged · Undo" for 2 minutes
- At 3×2: same layout, smaller
- At 2×2: days + time + two icon buttons (breath icon, red dot icon) with content descriptions
- Tapping the timer area opens the app home

**W2 — Craving button · 1×1**
- Round dot-ring icon, label "Craving". One tap → Craving help screen, breathing running.

**W3 — Quick log · 1×1**
- Red dot icon, label "I smoked". Tap → logs; icon changes to "Undo" for 2 minutes.

### Phase 2
- **W4 — Compact timer 2×2:** "12 DAYS" + `04:37` + tiny craving button
- **W5 — Strip 4×1:** `12d 04:37:12 · ৳1,240 saved · [Craving]`
- **W6 — Money saved 2×1 / 2×2:** amount in Doto + "saved since [date]"; optional savings-goal dot bar

### Phase 3
- **W7 — Next health milestone 2×2 / 4×2:** name + dot progress bar + "in 2 days"
- **W8 — Dot calendar 4×2:** 28 dots = last 4 weeks; white = smoke-free day, red = slip day, grey = before quit
- **W9 — Stats 4×2:** money saved, cigarettes not smoked, cravings resisted, longest streak

---

## Nothing OS widget look
- Black rounded-square background (follow system corner radius on Android 12+), white text, grey labels
- Red `#D71921` only for "I smoked" / slips
- Doto font for numbers — rendered as a font, not a picture of text
- Dot motifs: progress bars and calendar made of dots
- Light theme variant: off-white background, black text, same red
- Do NOT use Nothing's NDot font files (trademarked) — Doto is the free substitute

---

## How the live timer works (key engineering decision)
- Widgets cannot redraw every minute on their own (automatic refresh minimum is **30 minutes**, and not guaranteed).
- So use Android's **Chronometer** inside the widget (in Glance via `AndroidRemoteViews` with a Chronometer layout). It ticks on its own without the app running.
- Chronometer shows H:MM:SS, not days. So: **days = text**, **time-of-day = Chronometer started from the start of the current smoke-free day.**

Formula on every widget update:
```
elapsedMs        = now − lastSmokeTime
days             = floor(elapsedMs / 86_400_000)
withinDayMs      = elapsedMs − days × 86_400_000
chronometerBase  = SystemClock.elapsedRealtime() − withinDayMs
```
- Schedule a one-shot update at the next day rollover (when `withinDayMs` hits 24 h) so days +1 and the chronometer restarts.
- Also run a WorkManager periodic refresh (every 15–60 min) as a safety net.
- **Never save `chronometerBase`.** It's based on time since boot and becomes wrong after a reboot. Always recalculate from `lastSmokeTime` (wall clock).

---

## Buttons
- **"I smoked"** → `actionRunCallback<LogCigaretteAction>()`:
  1. Append event to DataStore
  2. Update all widget instances (`updateAll`)
  3. Set `undoUntil = now + 2 min`
- **Undo** → `actionRunCallback<UndoLastAction>()`. Show Undo only while `now < undoUntil`; schedule a refresh at `undoUntil` to hide it.
- **Debounce:** two fast taps = one event.
- **"Craving help"** → `actionStartActivity` to the Craving screen with deep link `app://craving` + flag "start breathing immediately". Must work even if the app was fully closed.
- **Never use lambda click handlers** for these. Use named callback classes (more reliable after the app process is killed).

---

## Data sharing
- App and widgets use the same DataStore.
- The app must trigger a widget update after **any** change: quit date edited, cigarette logged in-app, undo, price change, currency change.

---

## Anti-breakage rules (mandatory)
1. Declare **both** `targetCellWidth/Height` (Android 12+) and `minWidth/minHeight` (older Android). Set `minResizeWidth/Height` to the smallest designed size, plus `resizeMode="horizontal|vertical"`.
2. Use **`SizeMode.Exact`** and branch layout by width thresholds (≈ small < 110 dp, medium < 250 dp, large ≥ 250 dp). Every size must show the timer; extras only when there's room.
3. Widget content must fill its whole grid area. No fixed pixel sizes that leave gaps or clip.
4. Keep layouts shallow and small: no lists, no large images, vector icons only. Overly complex layouts cause "Can't load widget".
5. `provideGlance` reads **only local cached data**. No network, no slow work.
6. `updatePeriodMillis = 0`. Use WorkManager + the one-shot day-rollover alarm instead.
7. Recompute everything on: `BOOT_COMPLETED`, `TIME_SET`, `TIMEZONE_CHANGED`, `DATE_CHANGED`, `MY_PACKAGE_REPLACED` (app update), and when the widget is added or resized.
8. **Never rename or remove a widget receiver class** in an update — existing widgets would show "Can't load widget". Mark these class names as permanent in code comments.
9. Handle missing data: no quit date yet → show "Set your quit date"; tap opens onboarding. Never crash, never blank.
10. Provide a widget-picker preview for every widget (`previewLayout` on Android 12+, `previewImage` fallback) and a `description`.
11. Support dark and light theme (use theme colors; test both).
12. All buttons ≥ 48 dp touch targets with content descriptions ("Log a cigarette", "Open craving help").
13. Don't depend on the app running in the background — Chronometer ticks without it; rule 7 recovers the rest.
14. In app Settings, add **"Widget not updating? Fix it here"** → one-tap link to this app's battery settings (Samsung/Xiaomi battery savers are aggressive).

Test everything in `test widget.md` before release.
