# infos.md — Project Info & Rules for the Worker

## Project overview
A quit-smoking app for Android. Goals of this round:
1. Make the home screen simple by default.
2. Keep the tile customization for power users (as an optional advanced layer).
3. Rename confusing buttons (e.g. "SOS").
4. Add reliable home-screen widgets in a Nothing OS-inspired style.

## Status of code review
The GitHub repo `saadkibriya/quit-smoking-` could not be opened by the reviewer (it returned an error — likely private, renamed, or wrong URL).

**Worker: before changing anything, run Prompt 0 (Audit) in `prompts for ai studio.md` and paste the result into the "File map" table below.** All instructions in these documents refer to components by their role (e.g. "the Home screen component"). Use the file map to find the real names.

## File map (worker fills this in during the audit)
| Role | Actual file / component name |
|---|---|
| App entry | |
| Home screen | |
| Tile/card grid + edit mode | |
| Each tile component (list all) | |
| SOS / craving feature | |
| Logging a cigarette | |
| Settings / onboarding | |
| Storage layer (where data is saved) | |
| Health milestones data | |

## Tech stack decision
Home-screen widgets **can only be built in native Android code**. A web app / PWA cannot put a widget on the Android home screen.

- **If the repo is a web app** (React / Vite / TypeScript, has `package.json`): recommended path is to create a new project in **AI Studio → Build → "Build an Android app"** (Kotlin + Jetpack Compose) and port features one by one, using the web app as reference. Keep the web app untouched as a backup.
- **Alternative (needs Android Studio, not AI Studio alone):** wrap the web app with Capacitor and write native Kotlin widgets that read shared data (e.g. via `capacitor-widget-bridge`, which stores values in Android SharedPreferences). Two codebases glued together = more ways to break. **Not recommended.**
- **If the repo is already Kotlin / Compose:** add widgets directly with Jetpack Glance.

Note: AI Studio's Android mode launched in May 2026. If its agent struggles with widgets, export the project (ZIP) and finish widgets in Android Studio.

## Data model (single source of truth — app AND widgets read the same store)
Store with **Jetpack DataStore** (native). Do NOT use web `localStorage` for anything widgets need (mobile OSs can clear it).

### Profile
- `quitDateTime` — exact moment of quitting, epoch milliseconds (UTC) + user's time zone
- `cigsPerDay` (number)
- `pricePerPack` (number)
- `cigsPerPack` (default 20)
- `currency` (e.g. BDT ৳, USD $)
- `reasons` — list of short texts ("For my daughter")

### Events (append-only list — never delete)
```
{ id, type: "smoked" | "craving_resisted" | "craving_not_resisted",
  timestamp (epoch ms UTC), source: "app" | "widget", undone: true/false }
```

### Calculated values (never stored — always computed in one "stats" helper)
- `lastSmokeTime` = latest non-undone "smoked" event, or `quitDateTime` if none
- `currentStreak` = now − `lastSmokeTime` → shown as days / hours / minutes
- `cigarettesNotSmoked` = (days since `quitDateTime` × `cigsPerDay`) − number of non-undone "smoked" events (never below 0)
- `moneySaved` = `cigarettesNotSmoked` × (`pricePerPack` ÷ `cigsPerPack`)
- `longestStreak`, `totalSmokeFreeDays`, `cravingsResisted`

### Settings
- `homeLayout` = ordered list of `{ cardId, visible, size }` + `layoutVersion`
- `breathingPattern` (default "4-in / 6-out")
- `confirmBeforeLog` (default off)
- `haptics` (default on)

## Glossary (plain words)
- **Widget** — the mini panel on the phone's home screen, outside the app.
- **Launcher** — the home-screen app (Nothing Launcher, Pixel Launcher, Samsung One UI Home, Xiaomi/HyperOS).
- **Glance** — Google's toolkit for building widgets in Kotlin.
- **Chronometer** — built-in Android counter that ticks by itself on a widget, even when the app is closed.
- **Deep link** — a link that opens a specific screen inside the app (e.g. straight to breathing).
- **Slip** — one cigarette after quitting. Not "failure".
- **Progressive disclosure** — show essentials first; advanced things one tap away.

## Rules for the worker (read before every task)
1. **Never delete a feature — hide it.** Removed tiles become optional cards in "Customize home".
2. **One change per prompt.** Test after each. If it breaks, revert — don't pile fixes on top.
3. **Never rename or restructure saved data without a migration.** Existing users must keep their quit date and history.
4. All times are stored in UTC epoch milliseconds. Format only for display.
5. Every user-facing word comes from `labels.md`. No new jargon.
6. Keep a `CHANGELOG.md`: date, what changed, which files.
7. After each working step: export / back up (ZIP or GitHub).
8. Widgets must follow every rule in `widget.md` → "Anti-breakage rules".

## Related files
- `design change.md` — new home screen, craving screen, "I smoked", visual style
- `widget.md` — widget specs + anti-breakage rules
- `labels.md` — exact wording
- `test app.md`, `test widget.md` — test checklists
- `roadmap.md` — order of work
- `prompts for ai studio.md` — copy-paste prompts
