import assert from 'node:assert';
import { readFileSync } from 'node:fs';

console.log('--- RUNNING WIDGET AND ICON COPY TESTS ---');

const conflictScript = readFileSync('scripts/add-widget.sh', 'utf8');
const capacitor = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const icons = readFileSync('scripts/generate-icons.mjs', 'utf8');

// Test 1: the launcher name is the discreet one, and the applicationId keeps
// the old package so updates install over the previous version with its data.
assert.strictEqual(capacitor.appName, 'Tally', 'launcher name');
assert.strictEqual(capacitor.appId, 'com.unlit.app', 'appId must stay stable for updates');
console.log('✓ Test 1: launcher name is Tally and appId is unchanged.');

// Test 2: everything the widget picker shows stays generic. Descriptions and
// names appear in a list anyone holding the phone can open.
const stringsBlock = conflictScript.match(/widget_strings\.xml" <<'EOF'\n([\s\S]*?)\nEOF/);
assert.ok(stringsBlock, 'widget strings block must exist');
// Resource keys are internal (widget_clean_name), so only the visible values
// are checked.
const pickerCopy = [...stringsBlock[1].matchAll(/<string name="[^"]+">([^<]*)<\/string>/g)]
  .map((match) => match[1])
  .join(' ')
  .toLowerCase();
assert.ok(pickerCopy.length > 0, 'widget strings must render some copy');
for (const word of [
  'fap',
  'porn',
  'smok',
  'cigarette',
  'nicotine',
  'quit',
  'clean',
  'slip',
  'relapse',
  'addiction',
  'habit',
]) {
  assert.ok(!pickerCopy.includes(word), `widget picker copy must not mention "${word}"`);
}
for (const name of ['Days', 'Time', 'Savings', 'Count', 'Streak']) {
  assert.ok(
    stringsBlock[1].includes(`>${name}</string>`),
    `widget picker should list a neutral "${name}" widget`,
  );
}
console.log('✓ Test 2: widget picker names and descriptions reveal nothing.');

// Test 3: the text painted onto the home screen is neutral too. These literals
// are what a colleague sees over your shoulder, so none of them may come back.
for (const label of [
  'PORN / FAP',
  'SMOKE-FREE',
  'NOT SMOKED',
  'SLIPS LOGGED',
  'DAYS CLEAN',
  'DAY CLEAN',
  'CLEAN FOR',
  'UNLIT',
]) {
  assert.ok(
    !conflictScript.includes(`"${label}`) && !conflictScript.includes(`"${label}"`),
    `on-widget label "${label}" must not ship`,
  );
  assert.ok(
    !conflictScript.includes(`android:text="${label}"`),
    `layout default "${label}" must not ship`,
  );
}
console.log('✓ Test 3: no on-widget label names the habit.');

// Test 4: the icon generator paints every launcher layer Android needs, on the
// same near-black canvas as the adaptive background.
for (const file of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
  assert.ok(icons.includes(file), `icon generator must write ${file}`);
}
assert.ok(icons.includes("'#0A0A0A'") || icons.includes('#0A0A0A'), 'background colour');
assert.ok(icons.includes('mipmap-'), 'icon generator must target Android mipmaps');
console.log('✓ Test 4: launcher icon layers are generated.');
