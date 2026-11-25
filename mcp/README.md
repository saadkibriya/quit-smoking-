# Quiter MCP server

Quiter ships a first-party [MCP](https://modelcontextprotocol.io) server, so Gemini (or any MCP
client) can read and write your data in plain language: **`log_entry`**, **`update_plan`**,
**`get_stats`**.

It is served from two places, the same tool registrations in both (`mcp/register.ts`):

| Transport | Served by | Use it for |
| --- | --- | --- |
| **Streamable HTTP** | the app's own server, `POST /api/mcp` | Gemini CLI and other URL-based clients — the easiest path |
| stdio | `npm run mcp` | editors/agents that launch a local command |

The store is **one JSON file in the same shape as Toolkit → Backup → Export JSON**. That file is
the bridge between the app and the model — the app itself never imports this code, so nothing here
ships in the web/APK bundle.

```
store file ──► MCP tools ──► Gemini CLI
     ▲                            │
     └──── import/export ─────────┘
```

## 1. Install

From the project root:

```bash
npm install
```

`@modelcontextprotocol/sdk` and `zod` are only used by the MCP server.

## 2. Store file

Default: `data/quiter-store.json` (git-ignored, created from defaults on first write).
Override with `QUITER_STORE`.

```bash
QUITER_STORE=/path/to/quiter-store.json npm run dev
```

**Fill it with your real data:** in the app, Toolkit → Backup → *Export JSON*, then copy that file
to `data/quiter-store.json`. Export and store are the same schema, so no conversion is needed.

**See what the agent wrote:** copy `data/quiter-store.json` (or the `.bak` of the previous version)
back into the app with Toolkit → Backup → *Import JSON*.

Every write is atomic and keeps the previous file as `data/quiter-store.json.bak`.

## 3. Connect Gemini CLI — app-hosted HTTP endpoint (recommended)

Start Quiter's server (dev or prod build), which serves the MCP endpoint at `/api/mcp`:

```bash
npm run dev        # or: npm run build && npm start
curl http://localhost:3001/api/health
```

Add the endpoint once, at user scope so it works in every project:

```bash
gemini mcp add -s user --transport http quiter http://localhost:3001/api/mcp
```

Use a different port if Quiter is not on 3001. `--transport http` is required: the default is stdio,
and without it the URL would be treated as a command.

The equivalent `~/.gemini/settings.json` entry is:

```json
{
  "mcpServers": {
    "quiter": {
      "httpUrl": "http://localhost:3001/api/mcp",
      "timeout": 20000
    }
  }
}
```

Verify, then use it:

```bash
gemini mcp list          # quiter should be listed
gemini                   # inside the session:
/mcp                     # lists the three tools
```

The server needs no key, no OAuth and no account — it only reaches the store file on this machine.
Leave `--trust` off: Gemini CLI will ask before each tool call, which is what you want for a server
that writes to your tracking history. Keep the endpoint on localhost; do not expose it publicly, as
it has no authentication.

## 3b. Connect Gemini CLI — stdio instead

Useful when you don't want to run the app server, or your client only launches commands:

```bash
gemini mcp add -s user \
  -e QUITER_STORE=/absolute/path/to/quiter/data/quiter-store.json \
  quiter /absolute/path/to/quiter/node_modules/.bin/tsx /absolute/path/to/quiter/mcp/server.ts
```

`settings.json` equivalent:

```json
{
  "mcpServers": {
    "quiter": {
      "command": "/absolute/path/to/quiter/node_modules/.bin/tsx",
      "args": ["/absolute/path/to/quiter/mcp/server.ts"],
      "cwd": "/absolute/path/to/quiter",
      "env": { "QUITER_STORE": "/absolute/path/to/quiter/data/quiter-store.json" },
      "timeout": 20000
    }
  }
}
```

Both transports run the same code, so a prompt behaves identically either way.

## Example prompts once connected

- "Log that I smoked 20 minutes ago; trigger was stress."
- "I beat a craving just now, it lasted 4 minutes."
- "One slip last night — the second habit."
- "I quit on 1 November 2026 and I now smoke 18 a day — update my plan."
- "How many cigarettes have I avoided and how much money have I kept? Include the last 30 days."

## Tools

| Tool | Input | Behaviour |
| --- | --- | --- |
| `log_entry` | `type` (`CIGARETTE`, `CRAVING_BEATEN`, `FAP`, `FAP_URGE_BEATEN`, `PLEDGE`), `minutesAgo` or `timestamp`, `triggers`, `cravingStrength`, `urgeStrength`, `mood`, `note` | Appends one entry with a generated id, writes atomically, returns the entry plus fresh numbers. Refuses future timestamps and unknown types. |
| `update_plan` | Any of `quitStartDate`, `fapStartDate`, `packPrice`, `cigarettesPerPack`, `usualPerDay`, `fapPerDay`, `fapGoalPerDay`, `targets`, `triggers`, `reasons`, `mode`, `currency`, `coachStyle`, `age`, `wakeTime`, `sleepTime`, `discreetMode`, `savingsGoal`, `healthFlags` | Patches the plan only, refuses unknown fields, returns a before/after list. Never touches entries. |
| `get_stats` | `days` (default 7), `includeRecentEntries`, `limit` | Streak, completed smoke-free days, avoided cigarettes, money kept, cravings beaten, second-habit clean time/lapses, top triggers, active plan. |

Numbers come from the app's own domain code (`src/domain/calculations.ts`, `src/domain/fap.ts`), so
the agent reports exactly what the app shows.

## Check it yourself

```bash
npm test            # includes test/mcpServer.test.ts (tool surface + store round-trip)
```

Or with curl against the running app (initialize handshake):

```bash
curl -s http://localhost:3001/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

The reply advertises `quiter` and the `tools` capability; `GET /api/mcp` answers 405 because this
endpoint offers no server-initiated SSE stream.
