# prompts for ai studio.md — Copy-Paste Prompts (one at a time)

Paste one prompt, test, back up, then move to the next. Where it says [paste …], paste that section from the named file.

---

## Prompt 0 — Audit (no code changes)
```
Do not change any code. List:
1. The tech stack and framework.
2. Every file and what it does.
3. The home screen component and every tile/card it shows, with the metric each displays.
4. How tiles are edited/added and where the layout is saved.
5. What the SOS feature does, step by step.
6. Every button label in the app.
7. How and where the quit date and cigarette logs are stored (exact keys).
8. Any bugs or duplicated logic you notice.
Output as tables.
```

## Prompt 1 — Labels
```
Replace all user-facing button and title text according to this table:
[paste labels.md]
Don't change behavior. Show me a list of every file you changed.
```

## Prompt 2 — Stats helper
```
Create one stats helper that calculates current streak, cigarettes not smoked,
money saved, longest streak and cravings resisted exactly as defined here:
[paste "Data model" from infos.md]
Make all existing cards use it. Do not change storage keys.
```

## Prompt 3 — Default home
```
Change the default home layout to exactly this:
[paste sections 1, 2 and 3 from design change.md]
Move all other tiles into an "Add a card" list. Do not delete any tile code.
Existing users keep their saved layout.
```

## Prompt 4 — Craving help
```
Replace SOS with the Craving help screen described here:
[paste section 4 from design change.md]
It must open straight into breathing and be reachable by the deep link app://craving.
```

## Prompt 5 — I smoked
```
Implement "I smoked" exactly as described:
[paste section 5 from design change.md]
Never delete history. Add Undo for 2 minutes.
```

## Prompt 6 — Visual style
```
Apply this visual style across the app:
[paste section 6 from design change.md]
Use the Doto font from Google Fonts. Do not use Nothing's NDot fonts.
```

## Prompt 7 — Native widgets (Android project only)
```
Add a Jetpack Glance widget W1 as specified:
[paste W1, "How the live timer works", "Buttons" and "Anti-breakage rules" from widget.md]
Use SizeMode.Exact, actionRunCallback for I smoked / Undo, actionStartActivity
for Craving help, a Chronometer via AndroidRemoteViews for the live time, and the
same DataStore as the app. Then add W2 and W3.
```

## Prompt 8 — More widgets (after Phase 3 tests pass)
```
Add widgets W4, W5 and W6 as specified in widget.md, following every anti-breakage rule.
[paste the Phase 2 widget section + Anti-breakage rules]
```
