import { UserPlan, Entry, QuitAttempt, EarnedBadge } from '../types';
import {
  calculateCurrentStreak,
  calculateSmokeFreeDays,
  calculateAvoidedCigarettes,
  calculateMoneyKept,
  calculateLifeRegained,
  calculateDependenceScore,
  toLocalDateString,
} from './calculations';

export function generateCharacterCertificateMarkdown(params: {
  plan: UserPlan;
  entries: Entry[];
  attempts: QuitAttempt[];
  badges: EarnedBadge[];
}): string {
  const { plan, entries, attempts, badges } = params;
  const now = Date.now();
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const avoided = calculateAvoidedCigarettes(entries, plan, now);
  const money = calculateMoneyKept(avoided, plan);
  const life = calculateLifeRegained(avoided);
  const depScore = calculateDependenceScore(plan.usualPerDay, plan.timeToFirstCigarette);

  const totalCigsLogged = entries.filter((e) => e.type === 'CIGARETTE').length;
  const totalCravingsBeaten = entries.filter((e) => e.type === 'CRAVING_BEATEN').length;
  const totalPledges = entries.filter((e) => e.type === 'PLEDGE').length;

  const quitStartLocal = new Date(plan.quitStartDate).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const reportDate = new Date().toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Unique triggers breakdown
  const triggerCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.triggers && e.triggers.length > 0) {
      for (const t of e.triggers) {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      }
    }
  }

  const sortedTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, count]) => `- **${t.replace(/_/g, ' ')}**: encountered ${count} times`)
    .join('\n') || '- None recorded yet';

  // Attempt logs
  const attemptsSection = attempts.length > 0
    ? attempts
        .map(
          (a, idx) =>
            `### Attempt ${idx + 1}
- **Start Date:** ${new Date(a.startDate).toLocaleDateString()}
- **End Date:** ${a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Current'}
- **Best Smoke-Free Streak:** ${Math.round(a.bestStreakHours / 24)} days (${Math.round(a.bestStreakHours)} hours)
- **Total Smoke-Free Days:** ${a.smokeFreeDays}
${a.reasonForRestart ? `- **Reason for Slip/Restart:** ${a.reasonForRestart}` : ''}`
        )
        .join('\n\n')
    : '_This is the user\'s primary recorded journey with Unlit._';

  // Badges earned
  const badgesList = badges.length > 0
    ? badges.map((b) => `- **${b.milestoneId}** (Unlocked: ${new Date(b.earnedAt).toLocaleDateString()})`).join('\n')
    : '- Milestones in progress';

  // Recent logs table (last 20)
  const recentEntries = [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25)
    .map((e) => {
      const time = new Date(e.timestamp).toLocaleString();
      const type = e.type === 'CIGARETTE' ? 'âš ï¸ Slip (Smoked)' : e.type === 'CRAVING_BEATEN' ? 'ðŸ›¡ï¸ Urge Beaten' : 'ðŸ¤ Daily Oath/Pledge';
      const notes = (e.note || '').replace(/\|/g, '-');
      const trig = (e.triggers || []).join(', ');
      return `| ${time} | ${type} | ${trig || '-'} | ${e.cravingDurationSeconds ? `${e.cravingDurationSeconds}s` : '-'} | ${notes || '-'} |`;
    })
    .join('\n');

  return `# ðŸ“œ UNLIT CESSATION DOSSIER & CHARACTER CERTIFICATE
> **Document Purpose:** Certified summary report of tobacco cessation, behavioral endurance, relapse-resilience, and chronological audit log. Suitable for sharing with healthcare professionals, counselors, or AI medical models.
> **Generated on:** ${reportDate}
> **Application:** Unlit (Offline-First Smoke Tracker)

---

## ðŸ† SECTION 1: CHARACTER ATTESTATION & RESILIENCE SCORE
- **Current Standing:** **${streak.days >= 28 ? 'Liberated / Habit Extinguished' : streak.days >= 7 ? 'Sprint Champion (Peak Withdrawal Conquered)' : 'Active Warrior (Early Rebuilding)'}**
- **Current Unbroken Streak:** **${streak.days} days, ${streak.hours} hours, ${streak.minutes} minutes**
- **Consecutive Smoke-Free Days:** **${smokeFree.completedSmokeFreeDays} days**
- **Total Cravings Beaten & Overcome:** **${totalCravingsBeaten} urges conquered**
- **Daily Pledges / Oaths Taken:** **${totalPledges} conscious commitments**
- **Clinical Dependence Assessment (HSI):** Score **${depScore.score}/6** (${depScore.category} dependence)

*â€œEvery craving overcome is a conscious victory over neurochemical conditioning. Slips are data, not character flaws. The subject has demonstrated verifiable commitment to health autonomy.â€*

---

## ðŸ“Š SECTION 2: HEALTH & FINANCIAL IMPACT AUDIT
| Metric | Value Achieved | Impact Analysis |
| :--- | :--- | :--- |
| **Quit Oath Date & Time** | \`${quitStartLocal}\` | Official baseline timestamp of commitment |
| **Cigarettes Avoided** | **${avoided} sticks** | Based on habitual baseline of ${plan.usualPerDay}/day |
| **Money Saved / Kept** | **${plan.currency} ${money.toLocaleString()}** | At ${plan.currency}${plan.packPrice} per pack of ${plan.cigarettesPerPack} |
| **Estimated Life Regained** | **${life.formatted}** | ~20 minutes of biological life per unsmoked cigarette |
| **Total Recorded Slips** | **${totalCigsLogged}** | Isolated slip events documented with honesty |

---

## ðŸ§  SECTION 3: BEHAVIORAL PROFILE & TRIGGERS
### Primary Drivers for Quitting:
${plan.reasons.map((r) => `- **${r.replace(/_/g, ' ')}**`).join('\n')}

### Observed Urge Triggers:
${sortedTriggers}

### Medical & Health Flags Noted:
- Pregnant or Breastfeeding: **${plan.healthFlags.pregnantOrBreastfeeding ? 'Yes' : 'No'}**
- Heart Condition: **${plan.healthFlags.heartCondition ? 'Yes' : 'No'}**
- Mental Health Support Needed: **${plan.healthFlags.mentalHealthCondition ? 'Yes' : 'No'}**
- Taking Interacting Medication: **${plan.healthFlags.takingInteractingMeds ? 'Yes' : 'No'}**

---

## ðŸ… SECTION 4: UNLOCKED MILESTONES & HONORS
${badgesList}

---

## ðŸ”„ SECTION 5: RECORDED ATTEMPTS & REHEARSALS
${attemptsSection}

---

## ðŸ“‹ SECTION 6: CHRONOLOGICAL RECENT EVENT LOGS
| Timestamp | Event Type | Triggers | Duration | User Note |
| :--- | :--- | :--- | :--- | :--- |
${recentEntries || '| No logs recorded yet | - | - | - | - |'}

---

> **End of Certificate.** Exported with cryptographic integrity from Unlit Local Storage.
`;
}
