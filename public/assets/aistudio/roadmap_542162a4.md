# roadmap.md — Order of Work

Do phases in order. Don't start the next phase until the current one passes its tests.

## Phase 0 — Safety
- Make the repo accessible / back up as ZIP.
- Run Prompt 0 (audit) from `prompts for ai studio.md`.
- Fill the file map in `infos.md`.

## Phase 1 — Simplify the existing app
- Labels (`labels.md`)
- Stats helper (data model in `infos.md`)
- New default home
- Customize home + Reset to simple layout
- Craving help screen (replaces SOS)
- "I smoked" + Undo
- Visual style
- ✅ Run `test app.md`

## Phase 2 — Native Android version
- Create an AI Studio project with **"Build an Android app"** (Kotlin + Jetpack Compose).
- Port in this order: data store → onboarding → home → craving → customize → settings.
- ✅ Re-run `test app.md`

## Phase 3 — Core widgets
- W1 (main 4×2), W2 (1×1 craving), W3 (1×1 quick log)
- All anti-breakage rules in `widget.md`
- ✅ Run `test widget.md` on Nothing, Pixel, Samsung, Xiaomi

## Phase 4 — More widgets
- W4–W6, then W7–W9
- ✅ Re-run `test widget.md`

## Phase 5 — Release
- Google Play internal testing
- Collect feedback
- Wider release

## Fallback
If AI Studio's Android mode can't build the widgets reliably: export the project (ZIP) and finish widgets in Android Studio.
