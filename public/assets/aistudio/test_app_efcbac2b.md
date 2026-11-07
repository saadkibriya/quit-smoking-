# test app.md — App Test Checklist

Record for each: **Pass/Fail · phone · notes**.

| # | Area | Test | Expected | Result |
|---|---|---|---|---|
| 1 | Onboarding | New user enters quit date/time, cigs/day, pack price, cigs/pack, currency | Home shows correct timer and stats | |
| 2 | Default home | Open app as new user | Only: timer, money saved, not smoked, next milestone, 2 buttons, "Customize home" | |
| 3 | Labels | Check every screen | No "SOS", "Relapse", "Reset" visible; matches `labels.md` | |
| 4 | Craving help | Tap "Ride out a craving" | Breathing starts immediately; 3:00 countdown; haptics | |
| 5 | Craving outcome | Finish → "Yes, it passed" | Cravings resisted +1 | |
| 6 | Still strong | Choose "Still strong" | 3 more minutes + Delay/Distract/Breathe/Drink water tips | |
| 7 | I smoked | Tap "I smoked" | Timer restarts; kind message; Undo for 2 min; money reduced by one cigarette only | |
| 8 | Undo | Tap Undo | Everything restored | |
| 9 | Past slip | Log a cigarette at an earlier time | Timer measured from that time if it's the latest | |
| 10 | Longest streak | Slip after 10 days | Longest streak still shows 10 days | |
| 11 | Customize | Add "Dot calendar", hide "Money saved", reorder | Saved after closing app | |
| 12 | Reset layout | Tap "Reset to simple layout" | Default 4 cards return | |
| 13 | Existing users | Install update over old version with a custom layout | Quit date, history and layout preserved | |
| 14 | Edit quit date | Change quit date | All stats and widgets recalculate | |
| 15 | Math check | 10 cigs/day, pack of 20 = ৳300, 7 days, 0 slips | Not smoked = 70; saved = ৳1,050 | |
| 16 | Time zones | Change time zone | No negative or jumping timer | |
| 17 | Dark / light | Toggle system theme | Both readable; red used only for slips / "I smoked" | |
| 18 | Large text | Largest font size | Nothing overlaps | |
| 19 | Offline | Airplane mode | Everything works | |
| 20 | Deep link | Open `app://craving` | Opens breathing directly | |
| 21 | Kill & reopen | Force stop, reopen | Same state | |
| 22 | Accessibility | TalkBack through home and craving screen | Every button announced clearly | |
