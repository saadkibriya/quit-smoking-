# design change.md — Simple Home, Craving Help, "I smoked", Nothing OS Style

## Goal
A first-time user understands the home screen in 3 seconds and can get craving help in 1 tap. Power users can still build their own dashboard.

Principle: **progressive disclosure** — essentials on the main screen, advanced features one tap away.

---

## 1. New default home screen (top to bottom)
1. **Hero timer** — small label "Smoke-free for", then `12 days` (large, Doto font) and `4 h 37 m` under it. Updates every minute in the app.
2. **Two stat cards side by side** — "Money saved: ৳1,240" and "Cigarettes not smoked: 248".
3. **Next health milestone** — one line + dot progress bar, e.g. "Next: [milestone name] in 2 days". Milestone text must come from a named health authority (NHS, CDC or WHO); show the source in the full timeline screen. Do not invent timings.
4. **Primary button (large, white, full width): "Ride out a craving"** — subtitle: "3-minute breathing to get through the urge".
5. **Secondary button (outlined, smaller): "I smoked"** — subtitle: "Logs it and restarts your timer".
6. **Text link at the bottom: "Customize home"**.

Nothing else on the default screen. No charts, no achievements grid, no tips feed.

---

## 2. Default vs optional cards
| Card | Default | Optional (in "Customize home") |
|---|---|---|
| Smoke-free timer | ✅ (cannot be removed) | |
| Money saved | ✅ | |
| Cigarettes not smoked | ✅ | |
| Next health milestone | ✅ | |
| Full health timeline | | ✅ |
| Cravings resisted (count) | | ✅ |
| Longest streak / total smoke-free days | | ✅ |
| Dot calendar (last 4 weeks) | | ✅ |
| Daily smoked / craving chart | | ✅ |
| Triggers / craving log | | ✅ |
| My reasons to quit | | ✅ |
| Savings goal ("New headphones: 62%") | | ✅ |
| Achievements | | ✅ |
| Time of life regained | | ✅ |
| Any other existing tile found in the audit | | ✅ (keep, move here) |

---

## 3. "Customize home" (keep the tile editor, reframe it)
- No edit icons visible on the home screen by default.
- Edit mode opens via the "Customize home" link (long-press on a card = shortcut).
- The edit screen has two sections:
  - **"On your home"** — drag to reorder, tap ✕ to hide.
  - **"Add a card"** — the optional list above, each with a one-line description of what it shows.
- At the bottom: **"Reset to simple layout"** (with confirm dialog).
- Save to `homeLayout` with `layoutVersion`.
- **Existing users who already customized keep their layout.** Only new users and anyone tapping "Reset to simple layout" get the new default.

---

## 4. Craving help screen (replaces "SOS")
Cravings usually last only 3–5 minutes, so help must be instant and short.

1. Opens **straight into breathing**. No menu first.
2. Big animated dot circle grows (inhale 4 s) and shrinks (exhale 6 s). Text: "Breathe in… Breathe out…". Haptic tick at each switch so the user can close their eyes.
3. Visible 3:00 countdown. Line under it: "Cravings usually pass in 3–5 minutes."
4. Small options at the bottom:
   - "Distract me" — shows one random quick task (drink a glass of water, walk for 2 minutes, text a friend)
   - "My reasons" — shows the user's reasons
   - "Change breathing" — box 4-4-4-4, or 4-7-8
5. When the timer ends: **"Did the urge pass?"**
   - **"Yes, it passed"** → logs `craving_resisted`, shows "That's [N] cravings beaten"
   - **"Still strong"** → restarts 3 minutes + shows tips: Delay, Distract, Deep breathing, Drink water
   - **"I smoked"** → logs the slip with the kind message (see below)
6. Route / deep link: `/craving` (web) or `app://craving` (Android). Must be reachable directly from widgets.

---

## 5. "I smoked" behavior (app and widget must behave identically)
- One tap logs a `smoked` event at the current time → current timer restarts from 0.
- Message: "Logged. Your timer restarted. You still have [X] smoke-free days behind you." **Never** "You failed" or "Start over."
- **Undo** button visible for 2 minutes (marks the event `undone: true`).
- Optional setting "Ask before logging" (off by default).
- **Money saved and history are NOT reset.** Only that one cigarette is subtracted. Longest streak is kept.
- Advanced: "Log a cigarette at a different time" (for logging later).

Why: one slip often makes people feel they failed and give up completely. The app should never wipe progress.

---

## 6. Nothing OS-inspired visual style
- **Colors**
  - Background: pure black `#000000` (dark) / off-white `#F2F2F2` (light)
  - Text: white / near-black
  - Secondary: grey `#8A8A8A`
  - **One accent red `#D71921`** — only for "I smoked" and slip markers
  - No gradients
- **Fonts**
  - **Doto** (Google Fonts, free, SIL Open Font License) — big numbers and short headings only, ≥ 24 sp
  - Clean sans (Inter or system font) for everything else
  - **Do NOT bundle Nothing's NDot font files** (trademarked)
- **Shapes:** rounded-square cards (corner radius 20–24 dp), thin 1 dp grey outlines instead of shadows, dot-grid progress bars
- **Motion:** minimal — only the breathing circle animates
- **Dark mode is default.** Light mode must also work (follow system setting).

---

## 7. Step-by-step change instructions (do in order, test after each)
1. Run the audit (Prompt 0). Fill the file map in `infos.md`.
2. Add a labels/strings file and replace all button text using `labels.md`.
3. Add the data-model calculations from `infos.md` in one "stats" helper. All cards read from it.
4. Build the new default home layout (4 cards + 2 buttons + link).
5. Move every other existing tile into the "Add a card" list. Do not delete code.
6. Rebuild edit mode as the "Customize home" screen; add "Reset to simple layout".
7. Replace SOS with the Craving help screen; give it its own deep link route.
8. Implement "I smoked" with Undo.
9. Apply the visual style (colors, Doto font, card shapes).
10. Run every test in `test app.md`.
