import assert from 'node:assert';
import { readFileSync } from 'node:fs';

console.log('--- RUNNING WIDGET AND ICON COPY TESTS ---');

const conflictScript = readFileSync('scripts/add-widget.sh', 'utf8');
const capacitor = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const icons = readFileSync('scripts/generate-icons.mjs', 'utf8');
const simulator = readFileSync('src/components/widgets/HomeScreenWidgetSimulator.tsx', 'utf8');

// Test 1: the launcher name is the discreet one, and the applicationId keeps
// the old package so updates install over the previous version with its data.
assert.strictEqual(capacitor.appName, 'Quiter', 'launcher name');
assert.strictEqual(capacitor.appId, 'com.unlit.app', 'appId must stay stable for updates');
console.log('✓ Test 1: launcher name is Quiter and appId is unchanged.');

// Test 2: everything the widget picker shows stays generic. Descriptions and
// names appear in a list anyone holding the phone can open.
const stringsBlock = conflictScript.match(/widget_strings\.xml" <<'EOF'\n([\s\S]*?)\nEOF/);
assert.ok(stringsBlock, 'widget strings block must exist');
// Resource keys are internal (widget_streak_name), so only the visible values
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
for (const name of ['Days', 'Streak', 'Both']) {
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

// Test 5: exactly three widgets — smoke, second habit, and both — each pinned
// to the Google search bar's 4x1 footprint.
for (const provider of ['SmokeWidgetProvider', 'FapWidgetProvider', 'BothWidgetProvider']) {
  assert.ok(conflictScript.includes(`${provider}.java`), `${provider} must be generated`);
  assert.ok(
    conflictScript.includes(`('${provider}',`),
    `${provider} must be registered in the manifest`,
  );
  assert.ok(
    conflictScript.includes('android:name=".{cls}"'),
    'the manifest loop must write each receiver name',
  );
}
assert.ok(conflictScript.includes('targetCellWidth="4"'), 'widgets must target 4 columns');
assert.ok(conflictScript.includes('targetCellHeight="1"'), 'widgets must target 1 row');
assert.ok(conflictScript.includes('resizeMode="none"'), 'the 4x1 footprint is fixed');
assert.ok(conflictScript.includes('minWidth="250dp"'), 'bar width matches the search bar');
assert.ok(conflictScript.includes('minHeight="40dp"'), 'bar height matches one row');
const infoFiles = [...conflictScript.matchAll(/widget_info "([a-z_]+\.xml)"/g)].map((m) => m[1]);
assert.deepStrictEqual(
  infoFiles,
  ['smoke_widget_info.xml', 'fap_widget_info.xml', 'both_widget_info.xml'],
  'each widget gets its own provider info',
);
console.log('✓ Test 5: three fixed 4x1 widgets are generated.');

// Test 6: each widget has its own settings sheet: theme, accent and the figure
// it shows, persisted per widget id.
assert.ok(conflictScript.includes('WidgetConfigActivity.java'), 'config activity must exist');
assert.ok(
  conflictScript.includes('android.appwidget.action.APPWIDGET_CONFIGURE'),
  'config activity must answer the configure action',
);
assert.ok(conflictScript.includes('android:configure=".WidgetConfigActivity"'), 'widget info must point at it');
assert.ok(conflictScript.includes('android:widgetFeatures="reconfigurable"'), 'long-press Edit must work');
for (const value of ['"auto"', '"light"', '"dark"', '"mono"', '"green"', '"amber"', '"blue"']) {
  assert.ok(conflictScript.includes(value), `settings must offer ${value}`);
}
assert.ok(conflictScript.includes('"widget_" + id + "_"'), 'settings are stored per widget id');
console.log('✓ Test 6: per-widget theme, accent and display settings exist.');

// Test 7: no "tap the number to log" style hint text on the bar. The widget
// should read as a number, not as an instruction manual.
for (const hint of ['TAP THE NUMBER', 'TAP TO OPEN', 'TAP TO LOG']) {
  assert.ok(!conflictScript.includes(hint), `on-widget hint "${hint}" must not ship`);
}
assert.ok(!/id="@\+id\/hint"/.test(conflictScript), 'the hint view is gone');
assert.ok(
  !simulator.includes('Tap the number to log') && !simulator.includes('tap the number to log'),
  'the in-app preview must not promise instruction text',
);
console.log('✓ Test 7: no instructional hint text on the widgets.');
