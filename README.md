# Unlit — Evidence-Based Quit-Smoking Tracker & Dual-Persona Mentor

**Unlit** is a free, private, offline-first quit-smoking tracker and dual-persona mentor ("The Doctor" + "The Coach") designed around clinical addiction science. Built with strict Google Pixel monochrome aesthetics (solid surfaces, true OLED black #000000 and crisp white #FFFFFF).

---

## Key Features

1. **One-Tap Instant Logging & Non-Punitive Slip Recovery**:
   - One tap on **"I smoked"** instantly logs with the current timestamp and a 6-second Undo countdown snackbar.
   - Dual counters: a slip resets the current streak, but **cumulative smoke-free days, cigarettes avoided, money kept, and milestone badges are NEVER lost or reset**.
   - Cognitive reframing counteracts the *Abstinence Violation Effect (AVE)* with trigger attribution and if-then implementation intentions.

2. **Adaptive Milestone Sprint Ladder**:
   - Progressive milestones: 24h → 72h → 7d → 14d → 28d (Round 1) → 6wk → 90d (Round 2) → 6mo → 1yr (Round 3).
   - Rounds can never be "failed". Round 1 completes when reaching 28 days AND the last 7 days were smoke-free (otherwise automatically extends with "Almost there").

3. **Craving SOS (Full-Screen Modal)**:
   - Dynamic urge wave animation and count-up timer ("Cravings rise, peak, and pass").
   - 7 Evidence-based coping tools ordered by personal efficacy: Paced 4-4-6 Breathing with tactile pulse, Play the tape forward, My why, Delay 5 minutes, Sensory interruptions, Call my person, and 60-second Tap game.
   - "Did this help?" voting continuously personalizes the tool ranking.

4. **Strictly Verified Science & Doctor Corner**:
   - Every health milestone and body recovery stage includes its evidence strength (**Strong**, **Moderate**, **Early Research**, **Estimate**) and peer-reviewed source.
   - Doctor Corner highlights WHO 2024 recommended first-line medicines (Varenicline, Cytisine, Combo NRT, Bupropion), critical **CYP1A2 drug warnings** (Clozapine, Olanzapine, Theophylline, Warfarin levels rise post-cessation), and pregnancy/cardiovascular red flags.
   - Weak or unsourced popular claims are strictly excluded.

5. **Like-for-Like Telemetry & Habit Heatmap**:
   - Compares this week so far vs the exact same weekdays last week, and this month so far vs the same number of days last month.
   - 7-day × 24-hour Toughest Hours matrix visualization.
   - Median craving duration tracker.

6. **Full Android Glance Widget Simulator**:
   - Interactive sandbox demonstrating 8+ glance home-screen widgets (Timer, Quick Log with +1 action callback, SOS, Money Kept, Milestone, Round Progress, Week comparison, What's Normal Today).

7. **Dual-Persona Gemini AI Coach + Offline Rules Coach**:
   - Server-side Express proxy (`/api/gemini/coach`, `/api/gemini/weekly-review`, `/api/gemini/onboard`, `/api/gemini/ifthen-plan`) using `@google/genai` on `gemini-3.8-flash`.
   - On-device client safety filter: crisis phrases immediately show emergency crisis guidance without sending data to AI.
   - Offline rules engine fallback ensures 100% functionality even when offline or without an API key.

---

## Technical Stack & Folder Structure

- **Framework**: React 19 SPA, TypeScript, Vite, Express, Tailwind CSS v4.
- **Data Layer**: Offline-first LocalStorage with JSON and CSV export/import, reactive subscriber bus, and demo data generator.
- **Audio/Haptics**: Native Web Audio API synthesizer for tactile button clicks, breathing tones, and celebration bursts.

```
/
├── server.ts                       # Express backend with Gemini API proxy & Vite dev middleware
├── test/
│   └── calculations.test.ts        # Pure calculation unit test suite
├── src/
│   ├── types/index.ts              # Core data interfaces
│   ├── data/
│   │   ├── storage.ts              # Offline storage, export/import, demo data
│   │   └── sound.ts                # Tactile Web Audio haptics and celebration chime
│   ├── domain/
│   │   ├── calculations.ts         # Pure calculations: streak, smoke-free days, comparisons, HSI
│   │   ├── rulesEngine.ts          # Tool ranking, tone variants, contextual alerts
│   │   └── demoData.ts             # 60-day realistic sample dataset
│   ├── content/
│   │   ├── milestones.ts           # Section 7 milestone ladder & evidence levels
│   │   ├── bodyRecovery.ts         # Section 7 verified body recovery timeline
│   │   ├── withdrawalGuide.ts      # Section 7 day-by-day & 12 symptom cards
│   │   ├── doctorContent.ts        # Section 7 WHO medicines & CYP1A2 drug warnings
│   │   ├── encouragementFacts.ts   # Section 7 clinical encouragement facts
│   │   └── sources.ts              # Full academic references and citations
│   └── components/
│       ├── TopBar.tsx              # Google Pixel header with brand mark & SOS
│       ├── BottomNav.tsx           # 3 Tabs: Today, Journey, Toolkit
│       ├── today/
│       │   ├── HeroCard.tsx        # Mode-adaptive hero with live timer & milestone blocks
│       │   ├── QuickActions.tsx    # 64dp primary buttons ("I smoked" + "Craving")
│       │   └── InAppWidgetGrid.tsx # 2-column customizable widget grid (S, W, L)
│       ├── journey/
│       │   └── JourneyTab.tsx      # Like-for-like comparisons, bar chart, squares, 7x24 heatmap
│       ├── toolkit/
│       │   └── ToolkitTab.tsx      # Help Now, Coach chat, Doctor Corner, Advanced, Labs
│       ├── sos/
│       │   └── CravingSosModal.tsx # Urge wave animation, timer, and 7 coping tools
│       ├── slip/
│       │   └── SlipRecoverySheet.tsx# Anti-AVE non-punitive slip recovery workflow
│       ├── onboarding/
│       │   └── OnboardingWizard.tsx# Under-2-min onboarding with AI auto-fill
│       └── widgets/
│           ├── WidgetCards.tsx     # Section 6 widget catalogue components
│           └── HomeScreenWidgetSimulator.tsx # Glance home-screen interactive sandbox
```

---

## Running and Testing

```bash
# Run unit tests
npm test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build

# Start full-stack dev server
npm run dev
```
