#!/usr/bin/env node
/**
 * Quiter MCP server (stdio) — `npm run mcp`.
 *
 * The same tools are also served by the app itself over Streamable HTTP at
 * POST /api/mcp (see server.ts), which is what you point Gemini CLI at when the
 * app is running. Both share mcp/register.ts, so they can never drift.
 *
 * Store: one JSON file (QUITER_STORE, default <repo>/data/quiter-store.json)
 * in the same shape as the app's Export JSON.
 *
 * This file is never imported by src/, so it stays out of the Vite bundle.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createQuiterServer } from './register';
import { storePath } from './store';

const server = createQuiterServer();
const transport = new StdioServerTransport();
await server.connect(transport);
// stdout is the protocol channel; all diagnostics go to stderr.
console.error(`Quiter MCP server ready (store: ${storePath()})`);
