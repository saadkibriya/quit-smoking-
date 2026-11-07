# test widget.md — Widget Test Checklist

Run on at least these phones/launchers:
- **Nothing Phone** (Nothing Launcher)
- **Pixel** (Pixel Launcher)
- **Samsung** (One UI Home)
- **Xiaomi / Redmi** (HyperOS / MIUI launcher)

For each test record: **Pass/Fail · phone model · Android version · notes**.

| # | Test | Steps | Expected | Result |
|---|---|---|---|---|
| 1 | Add each widget | Long-press home → Widgets → add W1, W2, W3 | Preview shown in picker; widget appears filled, no "Can't load widget" | |
| 2 | No quit date | Fresh install, add W1 before onboarding | Shows "Set your quit date"; tap opens onboarding | |
| 3 | Timer accuracy | Set quit date 3 days 2 h ago | Shows 3 DAYS and 02:xx:xx; matches app within 1 minute | |
| 4 | Day rollover | Set last smoke to 23 h 58 m ago, wait 3 min | Days +1, chronometer restarts near 00:00 | |
| 5 | Resize | Resize W1 to 2×2, 3×2, 4×2, 4×3, 5×2 | Layout adapts; nothing clipped; buttons usable | |
| 6 | "I smoked" | Tap on widget | Timer → 0 DAYS 00:00:0x; "Undo" appears; app shows slip in history | |
| 7 | Undo | Tap Undo within 2 min | Timer returns to previous value; event marked undone | |
| 8 | Undo expires | Wait 2+ min | Undo disappears | |
| 9 | Double tap | Tap "I smoked" twice fast | Only one event logged | |
| 10 | Craving help (app closed) | Force-stop app, tap Craving help | Opens directly into breathing within ~2 s | |
| 11 | Reboot | Reboot phone, wait 2 min, unlock | Timer correct (not reset, not huge) | |
| 12 | Time zone change | Change phone time zone | Timer still correct | |
| 13 | Manual clock change | Set clock +1 day, then back | Widget recalculates; no negative times | |
| 14 | App update | Install newer build over old one | Widgets stay, keep working, no "Can't load widget" | |
| 15 | Battery saver | Turn on battery saver / Ultra saver, wait 1 h | Chronometer still ticking; tap actions still work | |
| 16 | Dark ↔ light | Switch system theme | Widget colors switch correctly; readable | |
| 17 | Font / display size | Set largest font and display size | Text not clipped; numbers still fit | |
| 18 | In-app change syncs | Log a slip in the app | Widget updates within a few seconds | |
| 19 | Price change | Change pack price in settings | Money widget updates | |
| 20 | Multiple instances | Add two W1s on different pages | Both update after one tap | |
| 21 | Launcher restart | Switch launcher or clear launcher cache | Widgets reload correctly | |
| 22 | Accessibility | Turn on TalkBack | Buttons read "Log a cigarette", "Open craving help" | |
| 23 | 24-hour soak | Leave for 24 h, compare to app | Days and time match | |
| 24 | Cache clear | Clear app cache (not data) | Widget unaffected | |

**Most important for catching timer bugs:** tests 4, 11 and 23.

If any test fails: note the phone + steps, send the failure back to the worker with the matching rule number from `widget.md` → Anti-breakage rules.
