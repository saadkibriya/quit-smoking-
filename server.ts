import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { sanitizeEntryCommands, sanitizePlanUpdates } from './src/domain/coachCommands';
import { createQuiterServer } from './mcp/register';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Crisis safety terms check on server as well (defense in depth)
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

function containsCrisisTerms(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_TERMS.some((term) => lower.includes(term));
}

// Lazy/safe init of Gemini client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ status: 'ok', geminiAvailable: hasKey });
});

// MCP endpoint: the app hosts its own Model Context Protocol server.
// Gemini CLI (or any MCP client) connects to it by URL, exactly like the app
// this is modelled on:
//   gemini mcp add -s user --transport http quiter http://localhost:3001/api/mcp
// Tools: log_entry, update_plan, get_stats. Same registrations as `npm run mcp`.
// Stateless: one server + transport per request, so no session state to lose.
app.post('/api/mcp', async (req: Request, res: Response) => {
  const server = createQuiterServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err: any) {
    console.error('MCP request error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: err?.message || 'Internal MCP error' },
        id: null,
      });
    }
  }
});

// This endpoint offers no server-initiated SSE stream and keeps no session, so
// GET/DELETE (and anything else) get 405 with Allow: POST, per the Streamable
// HTTP spec. The client only ever needs POST.
app.all('/api/mcp', (_req: Request, res: Response) => {
  res.set('Allow', 'POST').status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Use POST /api/mcp (Streamable HTTP); no SSE stream or session is offered.' },
    id: null,
  });
});

// Coach Chat Endpoint
app.post('/api/gemini/coach', async (req: Request, res: Response) => {
  try {
    const { userMessage, summaryJson, factsList, coachStyle, chatHistory } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (containsCrisisTerms(userMessage)) {
      res.json({
        isSafetyAlert: true,
        reply:
          'You matter. If you might act on these thoughts, please contact local emergency services or a crisis line now, or reach out to someone you trust.',
      });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Switching to offline rules coach.',
        useOffline: true,
      });
      return;
    }

    const systemInstruction = `You are the coach inside Quiter, a quit-smoking app. You talk with an adult who wants to quit or cut down. Style: ${coachStyle || 'Gentle friend'}. Be warm, practical and brief: under 80 words unless asked for more. Use their data below. Use motivational interviewing: reflect what they say, support their own reasons, and ask one open question at a time. Teach practical skills: riding out urges, if-then plans, changing routines, delaying and breathing. Rules: never shame or lecture; call a slip a slip, never a failure; never suggest "just one", a planned cigarette, or cutting down as a safe end goal; never give medicine doses or diagnoses, and suggest a doctor or pharmacist for medicine questions; only state health facts from the facts list, and say you're not sure otherwise. If they mention self-harm, suicide or wanting to die, respond with care, urge them to contact local emergency services or a crisis line now, and suggest reaching out to someone they trust.

When the user says something already happened, you may also log it: append one JSON block at the very end with an "entries" array (type: CIGARETTE | CRAVING_BEATEN | FAP | FAP_URGE_BEATEN | PLEDGE, plus minutesAgo or an ISO timestamp, optional triggers/note), and/or an "updates" object for plan fields, plus an "action" sentence. Only log what they state already happened — never a hypothetical, plan, question or worry. Never invent an entry.
Example: \`\`\`json {"entries":[{"type":"CIGARETTE","minutesAgo":10}],"action":"Logged your cigarette from 10 minutes ago."} \`\`\`
User data: ${JSON.stringify(summaryJson || {})}. Facts: ${factsList || ''}.`;

    // Multi-turn chat contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-8)) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
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

    // Pull the optional data block out of the reply and validate it before it
    // ever reaches the app; a bad block must not block the message.
    let reply = fullReply;
    let entries: unknown;
    let updates: unknown;
    let action: string | undefined;
    const jsonMatch = fullReply.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        entries = parsed.entries;
        updates = parsed.updates;
        action = typeof parsed.action === 'string' ? parsed.action : undefined;
        reply = fullReply.replace(/```json[\s\S]*?```/, '').trim() || fullReply;
      } catch {
        // Keep the original reply when the block is malformed.
      }
    }

    res.json({
      reply,
      isSafetyAlert: false,
      entries: sanitizeEntryCommands(entries),
      updates: sanitizePlanUpdates(updates),
      ...(action ? { action } : {}),
    });
  } catch (err: any) {
    console.error('Gemini coach error:', err);
    res.status(500).json({
      error: err?.message || 'Error communicating with coach',
      useOffline: true,
    });
  }
});

// Weekly review generator
app.post('/api/gemini/weekly-review', async (req: Request, res: Response) => {
  try {
    const { summaryJson, coachStyle } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({ error: 'No API key', useOffline: true });
      return;
    }

    const systemInstruction = `You are the coach inside Quiter. Provide a 4 to 5 sentence weekly review based on the user's data. Cover: 1) Concrete wins and progress (smoke-free days, money kept, cravings beaten). 2) One key pattern identified from their toughest hour or triggers. 3) One practical tip tailored to them. 4) One specific if-then plan to test this week. Never shame or use words like 'failed' or 'relapse'. Keep it strictly under 110 words. Tone: ${coachStyle || 'Gentle friend'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate my weekly review using this data: ${JSON.stringify(summaryJson || {})}`,
      config: {
        systemInstruction,
      },
    });

    res.json({ review: response.text });
  } catch (err: any) {
    console.error('Gemini weekly review error:', err);
    res.status(500).json({ error: err?.message, useOffline: true });
  }
});

// Onboarding helper (interprets natural language answers into structured plan)
app.post('/api/gemini/onboard', async (req: Request, res: Response) => {
  try {
    const { textPrompt } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({ error: 'No API key', useOffline: true });
      return;
    }

    const systemInstruction = `You extract quit-smoking onboarding parameters from the user's brief text description into structured JSON.
Return JSON matching:
{
  "cigarettesPerDay": number (default 15),
  "timeToFirstCigarette": "within_5" | "6_to_30" | "31_to_60" | "after_60" (default "6_to_30"),
  "packPrice": number (default 10),
  "cigarettesPerPack": number (default 20),
  "mode": "QUIT" | "CUT_DOWN" | "TRACK" (default "QUIT"),
  "triggers": string[] (from: waking_up, coffee_tea, after_meals, work_breaks, stress, boredom, alcohol, friends_who_smoke, driving, phone_scrolling, after_argument, late_night),
  "reasons": string[] (from: health, family_kids, money, breathing_fitness, smell_looks, freedom, doctor_advice, pregnancy),
  "coachStyle": "GENTLE" | "DIRECT" | "SCIENCE" (default "GENTLE")
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Extract my quit plan from this text: "${textPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ plan: parsed });
  } catch (err: any) {
    console.error('Gemini onboard error:', err);
    res.status(500).json({ error: err?.message, useOffline: true });
  }
});

// If-then plan generator for newly added triggers
app.post('/api/gemini/ifthen-plan', async (req: Request, res: Response) => {
  try {
    const { trigger, context } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({ error: 'No API key', useOffline: true });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create 2 short, practical implementation intentions ("If [trigger], then I will [competing response]") for smoking trigger: "${trigger}". User context: ${context || 'general'}. Return JSON: { "plans": ["If ..., then I will ...", "If ..., then I will ..."] }`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"plans":[]}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini if-then error:', err);
    res.status(500).json({ error: err?.message, useOffline: true });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiter server running on port ${PORT} (Prod: ${isProd})`);
  });
}

startServer();
