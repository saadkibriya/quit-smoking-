import { GoogleGenAI } from '@google/genai';
import { UserPlan, Entry, ChatMessage } from '../types';

export interface CoachResponse {
  reply: string;
  isSafetyAlert?: boolean;
  suggestedPlanUpdates?: Partial<UserPlan>;
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
  const totalCigsLogged = entries.filter((e) => e.type === 'CIGARETTE').length;
  const totalCravingsBeaten = entries.filter((e) => e.type === 'CRAVING_BEATEN').length;

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
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are the empathetic, doctor-backed, and proactive AI coach inside the Unlit quit-smoking app.
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
If no plan update is needed, do NOT output a json code block. Just speak normally. Keep your text reply under 100 words unless detail is requested.`;

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
        model: 'gemini-2.5-flash',
        contents: contents as any,
        config: {
          systemInstruction,
        },
      });

      const fullReply = response.text || "I'm with you. What feels like the hardest part right now?";

      // Check if model returned JSON updates
      let suggestedPlanUpdates: Partial<UserPlan> | undefined = undefined;
      let actionTakenDescription: string | undefined = undefined;
      let cleanedReply = fullReply;

      const jsonMatch = fullReply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.updates) {
            suggestedPlanUpdates = parsed.updates;
            actionTakenDescription = parsed.action;
          }
          cleanedReply = fullReply.replace(/```json[\s\S]*?```/, '').trim();
        } catch {
          // ignore parsing error
        }
      }

      return {
        reply: cleanedReply,
        suggestedPlanUpdates,
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
        chatHistory: chatMessages.slice(-6),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply || "I'm here with you. What strategy can we use right now?",
        isSafetyAlert: data.isSafetyAlert,
      };
    }
  } catch {
    // offline
  }

  // 5. Intelligent offline rules engine that also parses change commands
  const lower = userMessage.toLowerCase();
  const updates: Partial<UserPlan> = {};
  let actionDesc = '';

  // Check if user is asking to change quit date offline
  const quitAgoMatch = lower.match(/(quit|stopped|haven't smoked)\s*(since\s*)?(\d+)\s*(days?|hours?)/);
  if (quitAgoMatch) {
    const val = parseInt(quitAgoMatch[3], 10);
    const unit = quitAgoMatch[4];
    const msAgo = unit.startsWith('hour') ? val * 3600 * 1000 : val * 86400 * 1000;
    const newQuitDate = new Date(Date.now() - msAgo).toISOString();
    updates.quitStartDate = newQuitDate;
    actionDesc = `Updated your quit time to ${val} ${unit} ago.`;
  }

  // Check if user wants BDT/taka or currency change
  if (lower.includes('bdt') || lower.includes('taka') || lower.includes('à§³')) {
    updates.currency = 'à§³';
    actionDesc = (actionDesc ? actionDesc + ' ' : '') + 'Set currency to Bangladeshi Taka (à§³).';
  }

  // Check price change
  const priceMatch = lower.match(/(price|pack)\s*(is|to)?\s*(\d+(\.\d+)?)/);
  if (priceMatch) {
    const p = parseFloat(priceMatch[3]);
    updates.packPrice = p;
    actionDesc = (actionDesc ? actionDesc + ' ' : '') + `Updated pack price to ${p}.`;
  }

  const hasUpdates = Object.keys(updates).length > 0;

  return {
    reply: hasUpdates
      ? `Got it! I have updated your tracking plan accordingly (${actionDesc}). How are your cravings feeling right now?`
      : `I hear you. Take a slow, calm breath. Every craving rises like a wave and peaks within 3 to 5 minutes, then recedes. You are stronger than any urge. What activity or drink can we swap to right now?`,
    suggestedPlanUpdates: hasUpdates ? updates : undefined,
    actionTakenDescription: actionDesc || undefined,
  };
}
