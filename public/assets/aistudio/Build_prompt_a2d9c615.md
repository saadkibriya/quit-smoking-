# Unlit — AI Studio Build Prompt

Nov 3, 2026 · @Prantik Chowdhury

## 1. Role, goal and principles

You are a senior Android engineer and product designer. Build a native Android app in Kotlin with Jetpack Compose and Material 3 Expressive. Working name: Unlit. It is a free, private, offline-first quit-smoking tracker that behaves like a calm mentor and a careful doctor. It must feel simple on day one and grow with the user.

**Who it's for.** Adults who smoke and want to quit or cut down. Many have tried before and feel they "failed". Most aren't tech people, and many use mid-range Android phones. Every user is different, so the app adapts to each person's habits, triggers, schedule, reasons and preferred tone.

**The core job.** Log every cigarette in one tap, with time and date saved automatically. Show progress clearly: today, this week vs last week, this month vs last month, and the whole journey. Help the user through cravings, slips and withdrawal with the research-backed guidance in Section 7.

**Principles. Apply them to every decision:**

1. One tap first. Logging a cigarette and opening craving help each take one tap, from the Today screen and from home-screen widgets.
2. Calm and positive. Celebrate effort and progress. Never shame. Never use the words "failed", "failure", "relapse", "lost your streak" or "back to zero".
3. Honest science. Show only the health facts in Section 7, each with its evidence level and source. Never invent numbers.
4. Free and private. No account, no ads, no paywall, no tracking or analytics SDKs. All data stays on the phone. AI is optional and asks for consent first.
5. Fast. Opens instantly, works fully offline, runs smoothly on mid-range phones, uses no heavy libraries.
6. Simple surface, depth underneath. The Today screen is understandable in 3 seconds. Advanced features live in the Toolkit tab.
7. Personal. Each user gets their own plan, widget layout, reminder timing, coping-tool order and coach tone.
8. Safe. Show doctor-referral prompts where needed, never give medicine doses, and show a safety card when crisis words appear.

## 2. Design: Google Pixel style in black and white

Make it look and feel like a first-party Google Pixel app built with Material 3 Expressive, but strictly monochrome and solid.

**Hard rules**

- Solid surfaces only. No glass, blur, translucency, gradients, glows or "Liquid Glass" effects.
- Only black, white and neutral greys, everywhere: screens, charts, icons, widgets and notifications. Turn off dynamic color (wallpaper colors).
- Two themes. Day: white background, black content. Night: true black #000000 background (saves battery on OLED), white content. Setting options: Day / Night / Follow system (default). Switching is instant, with no restart.

**Color tokens (Day / Night).** Map these into the Material ColorScheme, with primary = black in Day and white in Night.

- background: #FFFFFF / #000000
- surface (cards, sheets): #F2F2F2 / #141414
- surfaceHigh (selected, pressed, chips): #E2E2E2 / #262626
- outline (dividers only): #C4C4C4 / #3D3D3D
- main text and icons: #000000 / #FFFFFF
- secondary text: #5E5E5E / #A6A6A6
- inverse (primary buttons, selected tab): black fill with white text in Day, white fill with black text in Night

**Meaning without color**

- Smoke-free day: filled square. Day with cigarettes: outlined square with the count inside. Today: square with a thick ring. Future days: small grey dot.
- Charts: current period as solid bars, previous period as outlined bars beside them.
- Status always uses an icon plus a word, never color alone.

**Typography**

- Google Sans Flex, the Pixel font (open source, SIL OFL). Bundle it in res/font if possible; otherwise use Compose downloadable Google Fonts with the system sans-serif as fallback.
- Expressive scale: very large bold numbers for the hero (about 64 to 88sp) with tabular figures so the timer doesn't jitter, bold headlines, 16sp body text, nothing smaller than 12sp.

**Shape and components**

- Material 3 Expressive: large rounded cards (24 to 28dp corners), pill buttons, button groups, a short navigation bar, and expressive shapes (MaterialShapes such as cookie and clover) for milestone badges.
- Primary buttons at least 64dp tall. 16dp screen margins, 8dp spacing grid, 48dp minimum touch targets.
- Edge-to-edge layout with correct insets, and predictive back.
- App icon: a simple monochrome mark of three rising blocks (the milestone ladder), with a monochrome layer for themed icons.

**Motion**

- Expressive spring motion, quick and subtle (300ms or less), with a gentle shape morph when a primary button is pressed. Respect the system "Remove animations" setting.
- Milestone celebration: a short burst of small black-and-white shapes (1.2s or less), shown once per milestone, with a light haptic tick.

**Icons.** Material Symbols Rounded, monochrome.

**Tone of voice.** Warm, short, plain words. A coach, not a judge. Examples:

- After a cigarette is logged in quit mode: "Logged. Your smoke-free days still count."
- After a craving is beaten: "You beat that one. That's 23 now."
- Morning on day 4: "Day 4. Nicotine is out of your body. What's left is habit, and habits can change."
- Never use: failed, failure, relapse, lost, back to zero, cheat, weak.

**Accessibility.** TalkBack labels on every control, headings marked as headings, layouts that hold up at 200% font size, text contrast of at least 4.5:1, and haptics that can be turned off.

## 3. Navigation and screens

Three tabs in a bottom navigation bar: **Today**, **Journey** and **Toolkit**. Every tab has a small "SOS" button in the top app bar that opens Craving SOS. Everything lives in one activity. Widgets, shortcuts, the Quick Settings tile and notifications open screens through deep links.

### First run: onboarding (under 2 minutes)

Chat-style: one question per screen, big tap-to-answer chips, progress dots, Back and Skip. Typing is optional. It works fully without AI. If the AI coach is on, the user can also answer in their own words (Section 5). Only questions 1 to 5 are required; the rest can be skipped and filled in later.

1. Welcome screen: one line on what Unlit does, "Your data stays on this phone", and a note that vapes and other habits can be tracked later in Toolkit → Labs.
2. How many a day, usually? A stepper plus quick chips (5, 10, 15, 20, 30).
3. How soon after waking do you have the first one? Within 5 minutes / 6 to 30 minutes / 31 to 60 minutes / after an hour.
4. Price: pack price, cigarettes per pack, and currency (default from the phone's locale).
5. What do you want right now? "Quit on a set day" / "Cut down first" / "Just track for now".
6. Quit day (if quitting): Today, Tomorrow, Next Monday, 1st of next month, or pick a date. Suggest a day within the next 2 weeks, and mention that Mondays and the 1st of the month are popular fresh-start days.
7. Past tries: how many (none, 1 to 2, 3 to 5, 6+), the longest time smoke-free, and what brought them back (chips).
8. Triggers (multi-select): waking up, coffee or tea, after meals, work breaks, stress, boredom, alcohol, friends who smoke, driving, phone scrolling, after an argument, late at night, other.
9. Reasons (multi-select plus own words): health, family or kids, money, breathing and fitness, smell and looks, freedom, doctor's advice, pregnancy. Optional photo for "My why".
10. Coach style: Gentle friend / Straight talker / Science buff.
11. Daily rhythm: usual wake and sleep times, used for reminder timing and quiet hours.
12. Private health check (optional, with a clear note that answers stay on the phone): pregnant or breastfeeding; a heart condition; a mental health condition; taking clozapine, olanzapine, theophylline or warfarin. Any "yes" pins a "Talk to your doctor" card in Doctor corner.
13. Optional: age (for life-expectancy facts) and a support person's name and number (for "Call my person" in SOS).
14. Notifications: explain the benefit, then ask for permission.

Finish with a **Your plan** card: mode and quit day; Round 1 target; top 3 triggers, each with an if-then plan ("If I have coffee, then I'll drink it in a different spot and take 5 slow breaths"); top 3 craving tools; reminder times; coach style; and the starting widget set. Buttons: "Looks good" and "Edit". The user can redo onboarding anytime from Toolkit → My plan.

### Today tab: the home screen, understandable in 3 seconds

Top: a one-line greeting with day context ("Good morning. Day 4 of Round 1.") and the SOS button. Then only three things:

1. **Hero card**, which changes with the user's mode:
   - Quit mode: a big live timer, "2d 14h 32m smoke-free". Below it: "Round 1 · Day 3 of 28" and a progress bar of blocks to the next milestone: "Next: 72 hours, nicotine leaves your body · in 9h 12m".
   - Before quit day: "Quit day in 2 days" with a prep checklist: remove cigarettes and lighters, tell someone, plan for your top trigger, ask a doctor or pharmacist about medicines that help. Logging still works.
   - Cut-down mode: "6 of 10 today" in big type, "Last one 1h 22m ago", a stretch hint ("Try to wait until 3:40 PM"), and the quit day.
   - Track mode: "8 today · 11 yesterday" and a "Ready to pick a quit day?" chip.
2. **Two big buttons side by side: "I smoked" and "Craving".**
   - "I smoked" logs instantly with the current time, gives a haptic tick, and shows a snackbar with Undo (6 seconds) and "Add details". Details are optional: triggers (chips), mood (5 faces), craving strength (1 to 10) and a note. In quit mode, the Slip recovery sheet follows.
   - Long-press "I smoked" to log an earlier one with a time picker.
   - "Craving" opens Craving SOS.
3. **Widget grid**: the user's chosen widgets in a 2-column grid (Section 6). An "Edit widgets" button at the end opens edit mode: add from the gallery, remove, resize (small, wide, large), and reorder by drag handle or Move up / Move down buttons.

Nothing else goes on Today.

### Journey tab: progress and history

- Segmented button: Week / Month / All time.
- Summary row: cigarettes, smoke-free days, cravings beaten and money kept, each with the change vs the previous period. Compare like for like: this week so far vs the same days last week, and this month so far vs the same number of days last month.
- Bar chart of cigarettes per day, with the previous period as outlined bars. Tap a bar to see that day's entries.
- Month calendar of squares: filled = smoke-free, outlined with a count = smoked.
- Milestone ladder: 24h → 72h → 7d → 14d → 28d → 6 weeks → 90d → 6 months → 1 year. Each step shows reached (with date), in progress, or ahead, plus a one-line "why it matters" (Section 7). Earned badges use expressive shapes.
- Body recovery timeline (Section 7), with reached markers, and an evidence label and source on tap.
- Patterns: top triggers; toughest hours (a 7-day × 24-hour grid of squares, darker = more); average time between cigarettes; first cigarette of the day trend; and the user's average craving length ("Your cravings usually pass in about 6 minutes").
- History: entries grouped by day. Tap to edit the time or details; swipe to delete with Undo.
- Attempts: each quit attempt with start date, best streak and smoke-free days, under the line "Most ex-smokers needed several tries. Every attempt teaches you something."

### Toolkit tab: help, coach, health, plan and advanced

At the top, a Day / Night / Auto segmented button. Then short grouped lists:

- **Help now**: Craving SOS, Slip recovery, "What's normal today" (the withdrawal guide).
- **Coach**: Talk to your coach, Weekly review, My if-then plans.
- **Health**: Body recovery timeline, Doctor corner, Medicines that help, Hunger and weight tips, Sleep tips.
- **My plan**: mode (quit / cut down / track), quit day, usual number per day, price, triggers, reasons and "My why" photo, coach style, support person, reminders, redo onboarding.
- **Widgets**: the widget gallery, and a guide to adding home-screen widgets.
- **Advanced** (collapsed by default, for power users): custom milestones; manual and back-dated entries; price history (a new price applies from a chosen date); week starts on Monday, Saturday or Sunday; export and import (JSON and CSV through the system file picker); dependence score details; notification fine-tuning (risky-hour nudge, quiet hours, maximum per day); AI settings (on/off, "What the coach sees", delete chat history); Labs: track another habit (Section 4); demo data (load or clear 60 days of sample data); erase all data (two confirmations).
- **About**: how the science works with a sources list, privacy, and "Information, not medical advice."

### Craving SOS (full screen)

Opens from the SOS button, the Craving button, a widget, an app shortcut, the Quick Settings tile or a notification.

- It opens straight into an "urge wave": a large animated wave and a count-up timer, with the text "Cravings rise, peak and pass. Ride this one out." The user taps "It passed" when the craving is gone. The app saves the duration and learns the user's average.
- Tools sit below the wave, ordered by what has helped this user before, then by their profile:
  - Breathe: paced breathing with a gentle haptic pulse.
  - Play the tape forward: three short prompts ("If I smoke now, in an hour I'll feel…").
  - My why: their reasons and photo.
  - Delay 5 minutes: a countdown.
  - Do something else: drink water, walk, chew gum, brush teeth, text a friend.
  - Call my person.
  - Tap game: 60 seconds of tapping squares that pop up on a grid.
- After a tool: "Did this help?" (yes / no), which improves the ranking.
- At the end: "Did you smoke?" "No, I beat it" saves a craving beaten (with duration and tool) and shows a small celebration. "Yes" logs a cigarette and opens Slip recovery.

### Slip recovery (bottom sheet, quit mode only, every step skippable)

1. "Slip logged. Your 9 smoke-free days still count." Show that smoke-free days, money kept and badges are unchanged, the streak restarts now, and the round continues.
2. "What happened?" Trigger chips and an optional note.
3. "Next time, I will…" Pick or edit an if-then plan suggested for that trigger.
4. "The next cigarette is the one that matters." Within the first 14 days, add: "The first two weeks matter most. Staying smoke-free through week two is one of the strongest signs of success." Buttons: Done / Start a craving tool / Talk to coach.

If there were cigarettes on 3 or more of the last 7 days, add a gentle choice card: "Want a fresh start? Restart Round 1 now, or switch to cut-down for a while. Both are fine." Include a link to Medicines that help, with the line "Medicine plus support makes quitting easier."

## 4. Core logic

### Data (stored only on the phone)

- **Entry**: id; timestamp (UTC milliseconds) plus the time-zone offset at that moment; type (CIGARETTE, CRAVING\_BEATEN, PLEDGE); triggers; mood 1 to 5 (optional); craving strength 1 to 10 (optional); craving duration in seconds (optional); tool used (optional); note (optional); entered manually (yes/no); habit id (default: smoking).
- **Plan and profile**: mode (QUIT, CUT\_DOWN, TRACK); quit start time; usual number per day; cigarettes per pack; pack price history (price plus the date it applies from); currency; week start day; wake and sleep times; dependence answers; triggers; reasons; coach style; age (optional); health flags (optional, never leave the phone); support contact (optional); cut-down schedule.
- **Attempt**: id, start, end (optional).
- **Tool stats**: tool id, times used, times it helped.
- **Widget layout**: an ordered list of widget type plus size.
- **Earned badges**: milestone id plus date earned. A slip never deletes them.

### Calculations (pure Kotlin functions, each with unit tests)

- Days are local calendar days using java.time. Handle time-zone changes and daylight saving time correctly.
- **Comparisons are like for like**: this week so far vs the same weekdays last week, and this month so far vs the same number of days last month. Show the change as a number and a percentage. When the previous value is 0, show "New" instead of a percentage.
- **Current streak** (quit mode) = now minus the later of quit start and the last cigarette.
- **Smoke-free days** = completed local days since quit start with zero cigarettes; the quit day itself counts if nothing was logged after the quit time. This number never goes down. Show today separately as "Today so far: smoke-free".
- **Cigarettes avoided** = max(0, usual number per day × days since quit start, counted as a decimal so it grows through the day, minus cigarettes logged since quit start). In cut-down mode, count from the plan start.
- **Money kept** = cigarettes avoided × (pack price ÷ cigarettes per pack), using the price in effect on each day.
- **Life regained** = cigarettes avoided × 20 minutes, always labelled "estimate".
- **Cravings beaten** = the count of CRAVING\_BEATEN entries. **Average craving length** = the median of saved durations, shown only after 3 or more.
- **Toughest hours** = cigarettes and cravings counted by weekday × hour over the last 30 days.
- **Dependence score** (Heaviness of Smoking Index, 0 to 6) = points for cigarettes per day (10 or fewer = 0, 11 to 20 = 1, 21 to 30 = 2, 31 or more = 3) plus points for time to first cigarette (over 60 minutes = 0, 31 to 60 = 1, 6 to 30 = 2, 5 or less = 3). 0 to 1 = low, 2 to 4 = moderate, 5 to 6 = high.

### Rounds and milestones (the heart of the app)

- **Milestone ladder**, measured on the current streak: 24 hours, 72 hours, 7 days, 14 days, 28 days, 6 weeks, 90 days, 6 months, 1 year. Each step has a title and a "why it matters" line from Section 7.
- The Today hero shows the next ladder step above the current streak. Badges are earned once and kept forever. Reaching a step again after a slip shows a smaller "Back at 72 hours" celebration, with no duplicate badge.
- **Rounds**: Round 1 = days 1 to 28. Round 2 = up to day 90. Round 3 = up to 1 year. Round days count calendar days from the round's start.
- **A round can't be failed.** It completes when its day count is reached AND the last 7 days were smoke-free. If the user smoked in the last 7 days, show "Almost there: 4 more smoke-free days to complete Round 1." The round extends automatically until that's true.
- **A slip** logs the cigarette and restarts the current streak. Everything cumulative stays: smoke-free days, cigarettes avoided, money kept, cravings beaten and earned badges. The round keeps going.
- **Fresh start**: the user can restart Round 1 anytime. This creates a new attempt and keeps all history.
- In quit mode the app never suggests, schedules or "allows" a cigarette. Nowhere does it describe any amount of smoking as safe.

### Cut-down mode: a route to a quit day, not a destination

- Default 2-week plan: in week 1, halve the usual number; in week 2, cut to a quarter; then quit day. Option: a 4-week plan (about 25% less each week). The user can adjust the plan.
- The hero shows today's limit. Going over it gets a calm note: "Noted. Tomorrow is a fresh day."
- Stretch timer: encourage waiting at least until last cigarette + (waking hours ÷ today's limit), shown as "Try to wait until 3:40 PM". Each stretch reached counts as a win. Never phrase it as "time for a cigarette".
- Always show the quit day. When the plan ends, offer to switch to quit mode. Gentle note: "Even 1 to 4 a day still harms your heart, so the goal is zero."

### Track mode

Logging and insights only. Once a week, show a gentle card based on the "5 R's" (relevance, risks, rewards, roadblocks, repetition), plus a "Pick a quit day" button that suggests fresh-start dates.

### Daily rhythm

- Optional morning pledge card: "Today I won't smoke." Tap to pledge, which saves a PLEDGE entry.
- Optional evening check-in: "How did today go?" with 5 faces.

### Labs: track another habit

A simple version of the same engine for another habit, such as alcohol, sugar or scrolling: name, unit, cost per unit, daily goal, current streak, free days, and week and month comparisons. Same slip-friendly rules. No medical content for these habits.

## 5. Personalization and the Gemini coach

The app adapts to each user through an on-device rules engine that always works. An optional Gemini coach makes it smarter.

### Rules engine (on the phone, always on)

- High dependence (score 5 to 6) or 3+ past tries: in week 1, show a Doctor corner card ("Medicine plus support makes quitting easier"), and turn on daily check-ins for days 1 to 14.
- The top trigger decides the SOS tool order:
  - stress or arguments: Breathe first
  - boredom or scrolling: Do something else and Tap game
  - coffee, meals or waking up: if-then routine swaps
  - alcohol or friends: a Friday-evening heads-up card for the weekend
  - driving: a "keep gum in the car" plan
- Morning smoker (first cigarette within 30 minutes of waking): morning pledge plus a morning plan card.
- The main reason picks the default widgets: money → Money kept; health → Body recovery; family → My why with photo.
- Coach style picks the wording of key messages. Write three variants (gentle, direct, science) of every core message.
- Learned from the user's own data:
  - Toughest hour: one nudge 15 minutes before it, at most once a day, outside quiet hours.
  - Tool ranking: from the "Did this help?" votes.
  - Average craving length, shown in SOS.
  - "What's normal today" follows the current streak day.
- Notification defaults: milestone celebrations and the risky-hour nudge, at most 2 a day, with quiet hours from the user's sleep time. All adjustable.

### Gemini coach (optional, needs internet)

- **Setup**: use AI Studio's Firebase integration with Firebase AI Logic and Firebase App Check. Never put an API key in the app. Keep the Firebase project on the no-cost Spark plan (Gemini Developer API free tier). Use a fast free-tier Gemini Flash or Flash-Lite model, the newest one Firebase AI Logic supports. Don't use Firestore or Firebase Authentication; user data stays on the phone.
- If Firebase AI Logic's hybrid on-device inference works cleanly, use "prefer on-device" for single-turn tasks (daily tip, weekly review), so they run privately on supported phones and fall back to the cloud.
- **Off until the user turns it on.** Consent text: "Want an AI coach? It sends a summary of your quit stats to Google's Gemini to personalize advice. It never sends your name, contacts, notes or health answers." Buttons: Turn on / Not now.
- **What it does:**
  1. Onboarding helper: turns free-text answers into the onboarding fields using structured JSON output that mirrors the onboarding questions. The user always reviews the "Your plan" card.
  2. Coach chat: short, warm replies tailored to the user's data.
  3. Weekly review at the start of each week: 4 to 5 sentences with wins, one pattern, one tip and one if-then plan to try.
  4. New if-then plans when the user adds a trigger.
- **What the coach sees**: a small JSON summary — mode, round day, streak, today/week/month counts and changes, top triggers, toughest hours, tool ratings, coach style, and reasons as chip labels. A "What the coach sees" screen shows the exact JSON. Never sent: name, photo, contacts, notes or health-check answers.
- **Coach system instruction** (store as a constant):

> You are the coach inside Unlit, a quit-smoking app. You talk with an adult who wants to quit or cut down. Style: {coachStyle}. Be warm, practical and brief: under 80 words unless asked for more. Use their data below. Use motivational interviewing: reflect what they say, support their own reasons, and ask one open question at a time. Teach practical skills: riding out urges, if-then plans, changing routines, delaying and breathing. Rules: never shame or lecture; call a slip a slip, never a failure; never suggest "just one", a planned cigarette, or cutting down as a safe end goal; never give medicine doses or diagnoses, and suggest a doctor or pharmacist for medicine questions; only state health facts from the facts list, and say you're not sure otherwise. If they mention self-harm, suicide or wanting to die, respond with care, urge them to contact local emergency services or a crisis line now, and suggest reaching out to someone they trust. User data: {summaryJson}. Facts: {factsList}.

- **Safety check on the phone first**: before any message goes to Gemini, check it for crisis phrases (for example "kill myself", "suicide", "self-harm", "want to die", "end it all"). On a match, don't call the AI. Show a Safety card at once: "You matter. If you might act on these thoughts, please contact local emergency services or a crisis line now, or reach out to someone you trust." Add a "Call my person" button if a support contact is saved.
- **Limits**: at most 30 coach messages a day, with a friendly note when reached; cache the weekly review; keep max output tokens short.
- **Without AI** (off, offline, unavailable or an error): the Coach area shows the rules-engine tip of the day, the if-then plans and a template-based weekly review. Never show an error dead end.

## 6. Widgets: in the app and on the home screen

Widgets are a core feature. Build one widget catalogue and use it in two places:

- **In-app widgets** on the Today tab: Compose cards in a 2-column grid. Sizes: Small (1 cell), Wide (2 cells across), Large (2 × 2).
- **Home-screen widgets** built with Jetpack Glance and GlanceTheme: monochrome, following the app's Day/Night setting, with responsive layouts for each size and generated previews for the widget picker.

### Widget catalogue

| # | Widget | Shows | Sizes | Tap opens |
| --- | --- | --- | --- | --- |
| 1 | Smoke-free timer | Days, hours, minutes since the last cigarette, plus the round day | S, W, L | Today |
| 2 | Quick log | A big +1 button and today's count | S, W | Logs a cigarette without opening the app, then shows "Logged · Undo" for 10 seconds |
| 3 | Craving SOS | One big SOS button | S | Craving SOS |
| 4 | Today vs limit | "6 / 10" and time since the last one | S, W | Today |
| 5 | Money kept | Amount in the user's currency | S, W | Journey |
| 6 | Cigarettes avoided | Count | S | Journey |
| 7 | Life regained | Estimate in days and hours | S, W | Journey |
| 8 | Next milestone | Countdown plus a one-line "why it matters" | W, L | Milestone ladder |
| 9 | Round progress | "Round 1 · Day 12 of 28" plus 28 squares | W, L | Journey |
| 10 | Week vs last week | 7 mini bars and the % change | W, L | Journey, Week |
| 11 | Month vs last month | Mini chart and the % change | W, L | Journey, Month |
| 12 | Cravings beaten | Count plus average craving length | S, W | Craving SOS |
| 13 | What's normal today | One short note for today's streak day | W, L | Withdrawal guide |
| 14 | Body recovery | Latest change reached and the next one | W, L | Body recovery timeline |
| 15 | My why | Top reason plus optional photo, shown in greyscale | W, L | My why |
| 16 | Toughest hour today | "Your toughest time is around 9 PM. Plan ready?" | W | If-then plans |
| 17 | Daily pledge | "Today I won't smoke" | S, W | Saves a pledge |
| 18 | Coach tip | Rules-based or AI tip of the day | W, L | Coach |
| 19 | Growth | A small plant made of blocks: one block per smoke-free day. A slip pauses growth and never removes blocks | L | Journey |
| 20 | Streak calendar | This month's squares | L | Journey |

### Home-screen widgets (first version)

- Ship at least these 8 as Glance widgets: Smoke-free timer, Quick log, Craving SOS, Money kept, Next milestone, Round progress, Week vs last week, What's normal today. Add more from the catalogue if time allows.
- Widgets read from the same repository as the app. Update them right after any log or settings change, and every 30 minutes through WorkManager for timers. No per-second updates; timers show minutes.
- Quick log uses a Glance action callback that writes the entry directly and refreshes all widgets. The next time the app opens in quit mode, it shows the Slip recovery sheet.
- Widgets open screens through deep links into the single activity. Configure widgets inside the app, not in a separate configuration activity.
- In Toolkit → Widgets, show how to add widgets ("Touch and hold your home screen → Widgets → Unlit") and an "Add to home screen" button that uses requestPinAppWidget where the launcher supports it.

### Other quick entry points

- App shortcuts (touch and hold the app icon): "Log a cigarette", "Craving SOS" and "Today". Set them as dynamic shortcuts in code.
- A Quick Settings tile: "Craving SOS".

## 7. Research-backed content (use exactly this, nothing more)

Store all content as data in Kotlin files (for example content/Milestones.kt). Each item has: text, evidence level (STRONG, MODERATE, EARLY\_RESEARCH or ESTIMATE) and source name. Show the evidence label and source when the user taps an item. Don't add any other health claims.

### Milestone ladder: "why it matters"

| Milestone | Message | Evidence | Source |
| --- | --- | --- | --- |
| 24 hours | One full day. Carbon monoxide in your blood is back to normal; that takes about 12 hours. | Moderate | WHO |
| 72 hours | Nicotine is essentially out of your body (its half-life is about 2 hours). From here, cravings are mostly habit and cues, and those can be retrained. | Strong | Nicotine pharmacology |
| 7 days | The hardest week is behind you. Withdrawal usually peaks in the first week. | Strong | Hughes 2007, Nicotine & Tobacco Research |
| 14 days | Two weeks smoke-free. Staying smoke-free through week two is one of the strongest signs of long-term success. | Strong | Kenford et al. 1994, JAMA |
| 28 days (Round 1) | Round 1 complete. Experts estimate that people who stay smoke-free for 28 days are about five times more likely to quit for good. | Estimate | West & Stapleton 2008, the basis of England's Stoptober |
| 6 weeks | From about 6 weeks, people who quit report less anxiety, low mood and stress than when they smoked. | Moderate | Cochrane review, Taylor et al. 2021 |
| 90 days (Round 2) | Your brain's nicotine receptors have had time to return to near non-smoker levels (about 6 to 12 weeks). | Early research | Cosgrove et al. 2009 |
| 6 months | Coughing and shortness of breath keep easing; they improve over 1 to 9 months. | Moderate | WHO |
| 1 year (Round 3) | Your extra risk of heart disease is now about half that of a smoker. | Strong | WHO, US Surgeon General |

### Body recovery timeline (time since last cigarette)

| Time | What happens | Evidence | Source |
| --- | --- | --- | --- |
| 20 minutes | Heart rate and blood pressure drop. | Moderate | WHO |
| 12 hours | Carbon monoxide in the blood drops to normal. | Moderate | WHO |
| 72 hours | Nicotine is essentially cleared from the body. | Strong | Nicotine pharmacology |
| 2 to 12 weeks | Circulation improves and lung function increases. | Moderate | WHO |
| 1 to 9 months | Coughing and shortness of breath decrease. | Moderate | WHO |
| 1 year | Risk of coronary heart disease is about half that of a smoker. | Strong | WHO |
| 5 to 15 years | Stroke risk falls to that of a non-smoker. | Strong | WHO |
| 10 years | Lung cancer risk is about half that of a smoker; risk of cancers of the mouth, throat, esophagus, bladder, cervix and pancreas decreases. | Strong | WHO |
| 15 years | Risk of coronary heart disease is that of a non-smoker. | Strong | WHO |

Life expectancy, shown only if the user gave their age: on average, quitting at 25 to 34 gains about 10 years of life, at 35 to 44 about 9, and at 45 to 54 about 6 (Jha et al. 2013, NEJM; Strong). Quitting at 60 still gains about 3 years (Doll et al. 2004, BMJ; Strong).

**Never show these** (weak or unsourced): "24 hours: heart attack risk starts to fall", "48 hours: nerve endings regrow", "72 hours: bronchial tubes relax", "quitter's flu" as a withdrawal symptom, and "a craving lasts exactly 3 to 5 minutes".

### "What's normal now" guide (typical; everyone is different)

| When | What's common | What to tell yourself |
| --- | --- | --- |
| First 24 hours | Cravings start within hours; feeling restless and irritable. | This is withdrawal starting. It's temporary. |
| Days 1 to 3 | Often the toughest stretch: cravings, irritability, anxiety, trouble concentrating. | Nicotine is leaving my body. By day 3 it's essentially gone. |
| Days 4 to 7 | Still strong but starting to ease; sleep trouble, vivid smoking dreams, more hunger. | Dreams about smoking are common. They don't mean I'll smoke. |
| Week 2 | Mood symptoms easing; cravings come less often. | The first two weeks matter most. Not a puff. |
| Weeks 3 to 4 | Most mood symptoms fade (they usually last 2 to 4 weeks); appetite may stay up. | For most people, the worst is behind them now. |
| Weeks 5 to 12 | Mood usually better than when smoking (from about 6 weeks); sudden cue cravings with alcohol, parties or stress. | A sudden craving now is a memory, not a need. |
| Months 3 to 12 | Cravings are rare; "just one" thoughts are the classic trap. | One is never just one. I keep my plan for parties and stress. |

Sources: Hughes 2007; Kenford et al. 1994; Cochrane review 2021.

### Symptom cards

| Symptom | Typical course | Tip | See a doctor if |
| --- | --- | --- | --- |
| Cravings | Strongest in the first days; most single urges pass within minutes; cue cravings can return for months, less often | Urge wave, delay 5 minutes, change place | — |
| Irritability, anger, impatience | Peak in week 1; usually gone in 2 to 4 weeks | Warn people around you; walk; breathe | — |
| Anxiety | Peaks in week 1; usually 2 to 4 weeks; lower than while smoking after about 6 weeks | Paced breathing | It's severe or doesn't ease |
| Low mood | Usually 2 to 4 weeks | Daylight, movement, talk to someone | It's severe, or there are thoughts of self-harm (get help now) |
| Restlessness | Usually 2 to 4 weeks | Move: a short walk | — |
| Poor concentration | Usually 2 to 4 weeks | Lighten your load in week 1 | — |
| Sleep problems, vivid dreams | First weeks | Cut caffeine (it can feel stronger after quitting); keep a routine | It lasts beyond a month |
| Hunger and weight gain | Can last months; average gain about 4.7 kg in the first year without support, mostly in the first 3 months; some people lose weight | Plan snacks, drink water, stay active. A few kilos is far less harmful than smoking. | — |
| Constipation | First weeks (possible symptom) | Water, fibre, movement | It lasts beyond 4 weeks |
| Mouth ulcers | First weeks (possible symptom) | Usually temporary | They last beyond 3 weeks |
| Cough | Can rise briefly as the airways clear (possible symptom) | Warm drinks, water | It lasts beyond 4 weeks, or there's blood or chest pain |
| Dizziness | Usually the first day or two (possible symptom) | Sit down, drink water | It continues |

Sources: Hughes 2007; Aubin et al. 2012, BMJ; Cochrane review 2021.

### Doctor corner

- **Medicines that help** (WHO 2024 guideline): varenicline, cytisine, nicotine replacement (a patch plus a fast form such as gum or lozenge) and bupropion. Medicine plus support gives the best chance. "Ask a doctor or pharmacist which suits you. This app doesn't give doses. Availability varies by country."
- **Nicotine e-cigarettes**: strong evidence shows they help some people quit, more than nicotine replacement (Cochrane living review). Rules differ by country, and they aren't for people who don't smoke.
- **Talk to a doctor before quitting if** you're pregnant or breastfeeding; you've had a recent heart attack or stroke, or have a heart condition; you have a mental health condition; or you take clozapine, olanzapine, theophylline or warfarin (smoking changes how the body processes them, so levels can rise after quitting and doses may need checking).
- **Get help now if** you have severe low mood or thoughts of self-harm, chest pain, or you cough up blood.
- **Caffeine**: coffee and tea can feel stronger after quitting. Consider cutting back a little.
- Don't hardcode helpline numbers. Let the user save their own doctor, quitline and support numbers.
- Footer on every health screen: "Information, not medical advice."

### Encouragement facts (for tips and the coach's facts list)

- Quitting often takes many attempts. One large study estimated that many smokers need 30 or more (Chaiton et al. 2016, BMJ Open). Every attempt is practice.
- A slip doesn't erase a quit. Even researchers' standard measure of success (the Russell Standard) still counts someone as quit if they had a few early slips and then stopped. Use this only as reassurance, never as permission.
- For people ready to quit, stopping on a set day worked better than cutting down slowly: 22% vs 16% were still smoke-free at 6 months (Lindson-Hawley et al. 2016, Annals of Internal Medicine).
- Each cigarette costs about 20 minutes of life on average (Jackson, Jarvis & West, Addiction 2025). Always label it an estimate.
- Light smoking still harms: even 1 to 4 a day raises heart-disease risk.
- Quitting improves mood: anxiety, depression and stress go down (Cochrane review 2021).
- Withdrawal is temporary: most mood symptoms peak in week 1 and fade within 2 to 4 weeks (Hughes 2007).

### Sources to list in About

- WHO, health benefits of quitting: https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation
- WHO 2024 tobacco cessation guideline: https://www.ncbi.nlm.nih.gov/books/n/who377825/fm-ch2/
- Cochrane review 2021, quitting and mental health: https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013522.pub2/full
- Kenford et al. 1994, JAMA: https://pubmed.ncbi.nlm.nih.gov/8301790/
- Hughes, Keely & Naud 2004, Addiction: https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1360-0443.2004.00540.x
- NCSCT "not a puff" rule: https://www.ncsct.co.uk/library/view/pdf/not-a-puff-rule.pdf
- Also name: Hughes 2007 (Nicotine & Tobacco Research), Aubin et al. 2012 (BMJ), Jha et al. 2013 (NEJM), Doll et al. 2004 (BMJ), Chaiton et al. 2016 (BMJ Open), Lindson-Hawley et al. 2016 (Annals of Internal Medicine), Cosgrove et al. 2009, West & Stapleton 2008, Jackson, Jarvis & West 2025 (Addiction), and the Cochrane living review of e-cigarettes.

## 8. Technical requirements

- **Project**: an AI Studio Android project in Kotlin with Jetpack Compose and Material 3 (Expressive APIs where available). Single activity, single module, no XML layouts, no Java, no native code. Navigation Compose. MVVM with ViewModels, StateFlow and a repository layer. Simple manual dependency injection (an AppContainer class), no Hilt.
- **Versions**: minSdk 26, targetSdk = latest. applicationId com.unlit.quitsmoking (may change before publishing). versionName 1.0.0.
- **Storage**: Room for entries, attempts, tool stats and badges, with schema export and planned migrations. DataStore for settings, profile and widget layout. No core feature needs the network.
- **Background work**: WorkManager for widget refresh, milestone checks and reminders. Inexact timing is fine; no exact alarms. Notification channels: Milestones, Reminders, Check-ins. Ask for POST\_NOTIFICATIONS with a clear reason.
- **Widgets**: Jetpack Glance (glance-appwidget and glance-material3).
- **AI**: Firebase AI Logic and App Check through AI Studio's Firebase integration. Put all AI code behind an AiCoach interface, with an OfflineCoach implementation used whenever AI is off, offline, unavailable or failing. The app must work completely without AI.
- **Permissions**: only POST\_NOTIFICATIONS, and INTERNET for AI. No location, contacts, storage or phone permissions. The support number is typed in or picked through the system contact picker. "Call my person" opens the dialer with the number filled in. Export and import use the system file picker.
- **Performance**: cold start under 1 second on mid-range phones. No chart or UI libraries beyond Jetpack; draw charts with Compose Canvas. Only the timer text recomposes every second. Use lazy lists, and baseline profiles if available.
- **Robustness**: survives rotation and process death (SavedStateHandle). Handles time-zone and daylight-saving changes. No crashes on empty data, and a friendly empty state on every screen.
- **Text**: all strings in strings.xml (English for now) with plurals. Dates, numbers and currency formatted by locale. Layouts mirror correctly for right-to-left languages, so translation is easy later.
- **Privacy**: no ads, no analytics or tracking SDKs, no account, no cloud database. A privacy screen explains what's stored (on the phone) and what's sent (only the coach summary, only when AI is on). Export and erase-all are always available.
- **Quality**: unit tests for every Section 4 calculation: day boundaries, like-for-like comparisons, streak, smoke-free days, rounds, money, dependence score and the cut-down schedule. A demo-data generator for 60 realistic days.
- **Code layout**: ui/ (theme, components, today, journey, toolkit, onboarding, sos, slip, coach), widgets/ (catalogue, glance), data/ (room, datastore, repository, export), domain/ (calculations, rounds, rules engine), content/ (milestones, timeline, guide, doctor, facts), ai/ (AiCoach, FirebaseCoach, OfflineCoach, safety), work/ and notifications/.
- **Hand-off**: a README covering what the app does, how to build and test it, how the AI coach is set up, and the folder structure. Add a GitHub Actions workflow (.github/workflows/android.yml) that runs the unit tests and builds a debug APK on every push, uploading it as an artifact. Never commit keystores or secrets.

## 9. Build order and acceptance checklist

Build in this order, and make each step work in the emulator before moving on:

1. Theme (Day/Night monochrome), the three tabs and SOS button, the data layer, and one-tap logging with Undo.
2. Onboarding, the Your plan card, and the Today hero states.
3. Every Section 4 calculation with unit tests, then the Journey tab.
4. Craving SOS, Slip recovery, rounds and milestones, and the Section 7 content.
5. Toolkit: Doctor corner, guides, My plan, and Advanced (export/import, demo data, Labs).
6. The in-app widget grid and gallery, then the Glance home-screen widgets, app shortcuts and the Quick Settings tile.
7. Notifications and the rules engine.
8. The optional Gemini coach with its safety check.
9. Polish, README and the GitHub Actions workflow.

**Acceptance checklist.** The build is done when all of these are true:

- A new user finishes onboarding in under 2 minutes, and Today makes sense at a glance.
- "I smoked" logs in one tap, Undo works, and details are optional.
- After a slip on day 10: the streak restarts; smoke-free days, money kept and badges don't drop; the round continues; and the Slip recovery sheet uses no shaming words.
- Round 1 completes only at day 28 or later with the last 7 days smoke-free; otherwise it shows "Almost there".
- Week vs last week and month vs last month compare the same number of days.
- Day / Night / Auto works on every screen and widget, and nothing but black, white and grey appears anywhere.
- At least 8 home-screen widgets work, resize well and update after a log. Quick log works without opening the app.
- The app works fully offline with AI off, and nothing breaks if Firebase isn't available.
- Every health fact comes from Section 7 with its evidence label and source, and none of the "Never show" claims appear.
- Demo data makes every chart and widget look right.
- All unit tests pass, there are no hardcoded strings, and every control has a TalkBack label.

## 10. When you finish

Reply with a short report: what's built and working, what isn't built yet, any place you departed from this spec and why, and how to test the main flows in the emulator (onboarding, logging and a slip, Craving SOS, home-screen widgets, and switching Day/Night).
