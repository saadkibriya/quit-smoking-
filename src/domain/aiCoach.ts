import { UserPlan, Entry, ChatMessage } from '../types';
import { isCravingResistedEvent, isSmokeEvent } from './calculations';
import {
  parseCoachCommands,
  sanitizeEntryCommands,
  sanitizePlanUpdates,
  type CoachEntryCommand,
} from './coachCommands';

export interface CoachResponse {
  reply: string;
  isSafetyAlert?: boolean;
  suggestedPlanUpdates?: Partial<UserPlan>;
  /** Entries to write verbatim — already validated, never raw model output. */
  suggestedEntries?: CoachEntryCommand[];
  actionTakenDescription?: string;
}

const CRISIS_TERMS = [
  'kill myself',
  'suicide',
  'self-harm',
  'want to die',
  'end it all',
  'end my life',
  'better off dead',
  'take my own life',
];

export function hasCrisisTerms(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_TERMS.some((term) => lower.includes(term));
}

export async function askGeminiCoach(params: {
  userMessage: string;
  plan: UserPlan;
  entries: Entry[];
  chatHistory: ChatMessage[];
  userApiKey?: string;
}): Promise<CoachResponse> {
  const { userMessage, plan, entries, chatHistory, userApiKey } = params;

  // 1. Safety check
  if (hasCrisisTerms(userMessage)) {
    return {
      reply: 'You matter. If you are having thoughts of harming yourself or ending your life, please contact emergency services (999/911/112) or reach out to a trusted family member or crisis helpline right now. We are here to support your quit journey, but your safety is first.',
      isSafetyAlert: true,
    };
  }

  // 2. Prepare user context summary
  const quitDate = new Date(plan.quitStartDate);
  const now = Date.now();
  const streakMs = Math.max(0, now - quitDate.getTime());
  const streakHours = Math.round(streakMs / (1000 * 3600));
  const streakDays = Math.floor(streakHours / 24);
  const totalCigsLogged = entries.filter(isSmokeEvent).length;
  const totalCravingsBeaten = entries.filter(isCravingResistedEvent).length;

  const dataSummary = {
    planMode: plan.mode,
    quitStartDate: plan.quitStartDate,
    streakDays,
    streakHours,
    usualCigarettesPerDay: plan.usualPerDay,
    cigarettesPerPack: plan.cigarettesPerPack,
    packPrice: plan.packPrice,
    currency: plan.currency,
    topTriggers: plan.triggers,
    coreReasons: plan.reasons,
    coachStyle: plan.coachStyle,
    totalCigarettesLoggedSinceTracking: totalCigsLogged,
    totalCravingsBeaten: totalCravingsBeaten,
  };

  const apiKey = userApiKey || plan.geminiApiKey;

  // 3. Direct client-side Gemini if API key is present
  if (apiKey) {
    try {
      // Loaded on demand: the SDK is ~300 kB and most sessions never use it.
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are the empathetic, doctor-backed, and proactive AI coach inside the Quiter quit-smoking app.
Your goals:
1. Support, empower, and listen to the user. Speak warmly and practically.
2. Monitor their live tracking data: ${JSON.stringify(dataSummary)}.
3. You have full permission and capability to adjust the user's plan if they ask you to!
   For example, if the user says:
   - "I stopped smoking 3 days ago" -> update quitStartDate to 3 days ago.
   - "Change my pack price to 350 taka" -> update packPrice: 350, currency: "à§³".
   - "My trigger is driving, add it" -> add trigger "driving".
   - "I smoke 20 a day" -> update usualPerDay: 20.
   - "Reset my quit date to right now" -> update quitStartDate to current timestamp.

CRITICAL FORMAT REQUIREMENT:
If you need to make changes to their plan or data, include a JSON block at the very end of your response in this exact format:
\`\`\`json
{
  "updates": {
    "packPrice": 350,
    "currency": "à§³",
    "usualPerDay": 20,
    "quitStartDate": "2026-11-02T10:00:00.000Z"
  },
  "action": "Updated your pack price to 350 à§³ and set your quit date to 3 days ago."
}
\`\`\`
LOGGING RULES (very important):
- When the user says something happened, log it. Examples:
  - "I smoked 10 minutes ago" -> entries: [{ "type": "CIGARETTE", "minutesAgo": 10 }]
  - "one slip last night" -> entries: [{ "type": "FAP", "minutesAgo": 900 }]
  - "I beat a craving 20 minutes ago" -> entries: [{ "type": "CRAVING_BEATEN", "minutesAgo": 20 }]
  - "I fapped twice today" -> two entries of type "FAP"
- Allowed entry types: "CIGARETTE", "CRAVING_BEATEN", "FAP", "FAP_URGE_BEATEN", "PLEDGE".
- Entry fields: type (required), minutesAgo (preferred) or timestamp (ISO), triggers (array of short strings), cravingStrength/urgeStrength (1-10), note (short).
- Only log what the user states already happened. Never log a hypothetical, a plan, a question, a worry, or "I want to smoke less". Never invent an entry to be helpful.
- If they mention several events, include one entry per event (max 5).

One JSON block may contain both "updates" (plan) and "entries" (logs):
\`\`\`json
{ "updates": { "packPrice": 12 }, "entries": [{ "type": "CIGARETTE", "minutesAgo": 10, "triggers": ["stress"] }], "action": "Logged your cigarette from 10 minutes ago and set the pack price to 12." }
\`\`\`
If neither is needed, do NOT output a json code block. Just speak normally. Keep your text reply under 100 words unless detail is requested.`;

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of chatHistory.slice(-6)) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents as any,
        config: {
          systemInstruction,
        },
      });

      const fullReply = response.text || "I'm with you. What feels like the hardest part right now?";

      // Check if model returned JSON updates
      let suggestedPlanUpdates: Partial<UserPlan> | undefined = undefined;
      let suggestedEntries: CoachEntryCommand[] = [];
      let actionTakenDescription: string | undefined = undefined;
      let cleanedReply = fullReply;

      const jsonMatch = fullReply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          suggestedPlanUpdates = sanitizePlanUpdates(parsed.updates);
          suggestedEntries = sanitizeEntryCommands(parsed.entries, { plan });
          actionTakenDescription =
            typeof parsed.action === 'string' ? parsed.action : undefined;
          cleanedReply = fullReply.replace(/```json[\s\S]*?```/, '').trim();
        } catch {
          // A malformed block means no data changes; the reply still goes through.
        }
      }

      return {
        reply: cleanedReply,
        suggestedPlanUpdates,
        suggestedEntries: suggestedEntries.length > 0 ? suggestedEntries : undefined,
        actionTakenDescription,
      };
    } catch (err: any) {
      console.warn('Direct Gemini call failed:', err);
    }
  }

  // 4. Try backend proxy if available
  try {
    const res = await fetch('/api/gemini/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage,
        summaryJson: dataSummary,
        coachStyle: plan.coachStyle,
        chatHistory: chatHistory.slice(-6),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const entries = sanitizeEntryCommands(data.entries, { plan });
      return {
        reply: data.reply || "I'm here with you. What strategy can we use right now?",
        isSafetyAlert: data.isSafetyAlert,
        suggestedPlanUpdates: sanitizePlanUpdates(data.updates),
        suggestedEntries: entries.length > 0 ? entries : undefined,
        actionTakenDescription: typeof data.action === 'string' ? data.action : undefined,
      };
    }
  } catch {
    // offline
  }

  // 5. Offline rules engine — same command grammar as the live model, so a
  //    logged slip lands the same way whether or not a key is configured.
  const commands = parseCoachCommands(userMessage, { plan });
  const logged = commands.entries;

  if (commands.clarification) {
    return {
      reply: commands.clarification,
      suggestedPlanUpdates: commands.planUpdates,
      actionTakenDescription: undefined,
    };
  }

  const summary: string[] = [];
  if (logged.length > 0) summary.push(logged.length > 1 ? `${logged.length} entries saved.` : 'Saved.');
  if (commands.planUpdates) summary.push('Your plan is updated.');

  const supportive =
    logged.length > 0
      ? 'A slip is information, not a verdict — one entry does not erase your progress. What was happening just before it? You can undo it from the log if it was a mistake.'
      : 'I hear you. Take a slow, calm breath. Every craving rises like a wave and peaks within 3 to 5 minutes, then recedes. You are stronger than any urge. What activity or drink can we swap to right now?';

  return {
    reply: `${summary.join(' ')} ${supportive}`.trim(),
    suggestedPlanUpdates: commands.planUpdates,
    suggestedEntries: logged.length > 0 ? logged : undefined,
    actionTakenDescription: commands.description,
  };
}
