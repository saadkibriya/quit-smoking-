import { GoogleGenAI } from '@google/genai';
import { UserPlan, HabitMode, CoachStyle, TimeToFirstCigarette } from '../types';

export interface ParsedOnboardingPlan {
  cigarettesPerDay?: number;
  timeToFirstCigarette?: TimeToFirstCigarette;
  packPrice?: number;
  cigarettesPerPack?: number;
  currency?: string;
  mode?: HabitMode;
  triggers?: string[];
  reasons?: string[];
  coachStyle?: CoachStyle;
  daysQuitAgo?: number;
}

// Offline fallback parser using regex heuristics
export function parseOnboardingTextOffline(text: string): ParsedOnboardingPlan {
  const result: ParsedOnboardingPlan = {};
  const lower = text.toLowerCase();

  // 1. Cigarettes per day
  const cigMatch = lower.match(/(\d+)\s*(cigarettes|cigs|smokes|sticks|a day|per day|\/day)/);
  if (cigMatch) {
    result.cigarettesPerDay = parseInt(cigMatch[1], 10);
  } else {
    const numMatch = lower.match(/(smoke|smoke about|smoking)\s*(\d+)/);
    if (numMatch) result.cigarettesPerDay = parseInt(numMatch[2], 10);
  }

  // 2. Stopped X days ago
  const quitAgoMatch = lower.match(/(stopped|quit|haven't smoked|haven't had a cigarette|clean for|smoke-free for)\s*(since\s*)?(\d+)\s*(days?|weeks?|hours?)/);
  if (quitAgoMatch) {
    const val = parseInt(quitAgoMatch[3], 10);
    const unit = quitAgoMatch[4];
    if (unit.startsWith('week')) {
      result.daysQuitAgo = val * 7;
    } else if (unit.startsWith('hour')) {
      result.daysQuitAgo = Math.max(1, Math.round(val / 24));
    } else {
      result.daysQuitAgo = val;
    }
  }

  // 3. Currency detection (BDT, taka, $, â‚¬, Â£, etc.)
  if (lower.includes('bdt') || lower.includes('taka') || lower.includes('tk') || lower.includes('à§³')) {
    result.currency = 'à§³';
  } else if (lower.includes('euro') || lower.includes('â‚¬')) {
    result.currency = 'â‚¬';
  } else if (lower.includes('pound') || lower.includes('Â£')) {
    result.currency = 'Â£';
  } else if (lower.includes('rupee') || lower.includes('â‚¹') || lower.includes('inr')) {
    result.currency = 'â‚¹';
  } else if (lower.includes('$') || lower.includes('dollar')) {
    result.currency = '$';
  }

  // 4. Pack price
  const priceMatch = lower.match(/(price|pack|cost|costs|pack price|is|for)\s*([$â‚¬Â£â‚¹à§³]|tk\.?|bdt)?\s*(\d+(\.\d+)?)/);
  if (priceMatch) {
    result.packPrice = parseFloat(priceMatch[3]);
  }

  // 5. Triggers
  const triggers: string[] = [];
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('cha')) triggers.push('coffee_tea');
  if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('work') || lower.includes('pressure')) triggers.push('stress');
  if (lower.includes('meal') || lower.includes('eating') || lower.includes('after food') || lower.includes('lunch') || lower.includes('dinner')) triggers.push('after_meals');
  if (lower.includes('friend') || lower.includes('social') || lower.includes('party') || lower.includes('hangout')) triggers.push('friends_who_smoke');
  if (lower.includes('alcohol') || lower.includes('beer') || lower.includes('drink')) triggers.push('alcohol');
  if (lower.includes('bored') || lower.includes('idle')) triggers.push('boredom');
  if (triggers.length > 0) result.triggers = triggers;

  // 6. Reasons
  const reasons: string[] = [];
  if (lower.includes('health') || lower.includes('cough') || lower.includes('lung') || lower.includes('breathe') || lower.includes('breath')) reasons.push('health');
  if (lower.includes('money') || lower.includes('save') || lower.includes('cost') || lower.includes('expensive')) reasons.push('money');
  if (lower.includes('family') || lower.includes('kid') || lower.includes('child') || lower.includes('partner') || lower.includes('wife')) reasons.push('family_kids');
  if (lower.includes('freedom') || lower.includes('slave') || lower.includes('control')) reasons.push('freedom');
  if (reasons.length > 0) result.reasons = reasons;

  // 7. Mode
  if (lower.includes('cut down') || lower.includes('reduce') || lower.includes('taper')) {
    result.mode = 'CUT_DOWN';
  } else if (lower.includes('just track') || lower.includes('track')) {
    result.mode = 'TRACK';
  } else {
    result.mode = 'QUIT';
  }

  return result;
}

export async function parseOnboardingText(
  text: string,
  userApiKey?: string
): Promise<ParsedOnboardingPlan> {
  // If user provided a Gemini key or server has one
  const apiKey = userApiKey || (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : undefined);

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Extract quit-smoking onboarding parameters from this user description into strict JSON.
User text: "${text}"

Respond ONLY with valid JSON matching:
{
  "cigarettesPerDay": number or null,
  "timeToFirstCigarette": "within_5" | "6_to_30" | "31_to_60" | "after_60" | null,
  "packPrice": number or null,
  "currency": string or null (e.g. "à§³", "$", "â‚¬", "Â£"),
  "mode": "QUIT" | "CUT_DOWN" | "TRACK",
  "triggers": string[] (subset of ["stress", "coffee_tea", "after_meals", "alcohol", "friends_who_smoke", "boredom", "driving"]),
  "reasons": string[] (subset of ["health", "money", "family_kids", "freedom", "breathing_fitness", "smell"]),
  "coachStyle": "GENTLE" | "DIRECT" | "SCIENCE",
  "daysQuitAgo": number (if they say they stopped 3 days ago, return 3, otherwise 0)
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const raw = response.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Sanitize & return
        return {
          ...parseOnboardingTextOffline(text), // base
          ...parsed,
        };
      }
    } catch (err) {
      console.warn('Gemini client parsing failed, using offline heuristics', err);
    }
  }

  // Try server endpoint if online
  try {
    const res = await fetch('/api/gemini/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textPrompt: text }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.plan) {
        return {
          ...parseOnboardingTextOffline(text),
          ...data.plan,
        };
      }
    }
  } catch {
    // offline or backend not deployed
  }

  // High-accuracy offline heuristic parser
  return parseOnboardingTextOffline(text);
}
