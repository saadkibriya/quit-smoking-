import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createQuiterServer } from '../mcp/register';
import { readStore } from '../mcp/store';

console.log('--- RUNNING MCP SERVER TESTS ---');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiter-mcp-'));
process.env.QUITER_STORE = path.join(dir, 'quiter-store.json');

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const server = createQuiterServer();
const client = new Client({ name: 'quiter-test', version: '0.0.0' });

await server.connect(serverTransport);
await client.connect(clientTransport);

function parse(result: Awaited<ReturnType<typeof client.callTool>>): any {
  const content = (result as { content: Array<{ type: string; text?: string }> }).content;
  assert.equal(content[0].type, 'text');
  return JSON.parse(content[0].text as string);
}

// 1. The same three tools as the stdio server.
const tools = await client.listTools();
const names = tools.tools.map((tool) => tool.name).sort();
assert.deepEqual(names, ['get_stats', 'log_entry', 'update_plan']);
for (const tool of tools.tools) {
  assert.ok(tool.description && tool.description.length > 20, `${tool.name} has a description`);
  assert.ok(tool.inputSchema, `${tool.name} has an input schema`);
}
console.log('✓ Test 1: log_entry, update_plan and get_stats are advertised with schemas.');

// 2. A fresh store is seeded from defaults rather than failing.
const empty = parse(await client.callTool({ name: 'get_stats', arguments: {} }));
assert.equal(empty.ok, true);
assert.equal(empty.storeMissing, true);
assert.equal(empty.storePath, process.env.QUITER_STORE);
assert.equal(empty.smoking.cigarettesLoggedInWindow, 0);
assert.equal(empty.totals.entries, 0);
console.log('✓ Test 2: get_stats works on a store that does not exist yet.');

// 3. log_entry writes one backdated cigarette.
const logResult = parse(
  await client.callTool({
    name: 'log_entry',
    arguments: { type: 'CIGARETTE', minutesAgo: 10, triggers: ['stress'], cravingStrength: 7 },
  })
);
assert.equal(logResult.ok, true);
assert.equal(logResult.logged.type, 'CIGARETTE');
assert.equal(logResult.logged.habitId, 'smoking');
assert.deepEqual(logResult.logged.triggers, ['stress']);
assert.equal(logResult.logged.cravingStrength, 7);
const ageMinutes = (Date.now() - logResult.logged.timestamp) / 60_000;
assert.ok(Math.abs(ageMinutes - 10) < 1, `timestamp should be ~10 minutes back, was ${ageMinutes}`);
assert.equal(logResult.now.cigarettesToday, 1);
assert.ok(fs.existsSync(process.env.QUITER_STORE));
console.log('✓ Test 3: log_entry writes an app-shaped entry ~10 minutes back.');

// 4. The write is in the app's export shape, so Import JSON accepts it.
const stored = readStore().store;
assert.equal(stored.entries.length, 1);
assert.equal(stored.entries[0].type, 'CIGARETTE');
assert.ok(stored.plan && typeof stored.plan.packPrice === 'number');
console.log('✓ Test 4: the store file is a valid app export.');

// 5. update_plan patches only the fields given and leaves entries alone.
const planResult = parse(
  await client.callTool({ name: 'update_plan', arguments: { packPrice: 12, usualPerDay: 15 } })
);
assert.equal(planResult.ok, true);
assert.equal(planResult.plan.packPrice, 12);
assert.ok(planResult.changed.some((line: string) => line.includes('packPrice')));
assert.equal(readStore().store.entries.length, 1, 'entries untouched');
assert.equal(readStore().store.plan.packPrice, 12);
console.log('✓ Test 5: update_plan patches the plan and never the log.');

// 6. Stats reflect what was just written.
const stats = parse(await client.callTool({ name: 'get_stats', arguments: { days: 7, includeRecentEntries: true } }));
assert.equal(stats.smoking.cigarettesLoggedInWindow, 1);
assert.equal(stats.totals.entries, 1);
assert.equal(stats.plan.packPrice, 12);
assert.equal(stats.recentEntries[0].type, 'CIGARETTE');
assert.ok(stats.smoking.moneyKeptDisplay.startsWith(stats.plan.currency));
console.log('✓ Test 6: get_stats reports the new entry and plan.');

// 7. A second write keeps the previous file as .bak.
parse(await client.callTool({ name: 'log_entry', arguments: { type: 'CRAVING_BEATEN' } }));
assert.ok(fs.existsSync(`${process.env.QUITER_STORE}.bak`), 'previous version backed up');
assert.equal(readStore().store.entries.length, 2);
console.log('✓ Test 7: each write keeps the previous store as .bak.');

// 8. Unknown entry types are refused, and nothing is written.
const before = readStore().store.entries.length;
let rejected = false;
try {
  const result = await client.callTool({ name: 'log_entry', arguments: { type: 'SMOKED_EVERYTHING' } });
  // The SDK may surface schema failures as a thrown McpError or as an isError result.
  rejected = Boolean((result as { isError?: boolean }).isError);
} catch {
  rejected = true;
}
assert.ok(rejected, 'invalid entry type rejected');
assert.equal(readStore().store.entries.length, before, 'no entry written');
console.log('✓ Test 8: an invalid entry type is rejected before it can be written.');

// 9. Unknown plan fields are refused by the strict input schema, before any write.
let badPlanMessage = '';
try {
  const result = await client.callTool({ name: 'update_plan', arguments: { admin: true } });
  badPlanMessage = String((result as { content?: Array<{ text?: string }> }).content?.[0]?.text ?? '');
} catch (error) {
  badPlanMessage = (error as Error).message;
}
assert.match(badPlanMessage, /Unknown plan field|Unrecognized key/i);
assert.equal(readStore().store.plan.packPrice, 12, 'plan untouched by the rejected call');
console.log('✓ Test 9: unknown plan fields are refused.');

// 10. Future timestamps are refused.
const future = parse(
  await client.callTool({
    name: 'log_entry',
    arguments: { type: 'CIGARETTE', timestamp: new Date(Date.now() + 86_400_000).toISOString() },
  })
);
assert.equal(future.ok, false);
assert.match(future.error, /future/i);
console.log('✓ Test 10: future-dated entries are refused.');

await client.close();
await server.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log('All MCP server tests passed.');
