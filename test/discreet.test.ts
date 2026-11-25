import assert from 'node:assert';
import { isDiscreetMode, maskDiscreet, setDiscreetMode } from '../src/content/discreet';
import { RED_FLAG_CRISIS_ALERTS } from '../src/content/doctorContent';
import { ACADEMIC_SOURCES } from '../src/content/sources';

console.log('--- RUNNING DISCREET WORDING TESTS ---');

// Test 1: off by default, nothing is rewritten.
setDiscreetMode(false);
assert.strictEqual(isDiscreetMode(), false, 'discreet mode starts off');
assert.strictEqual(maskDiscreet('Porn / fap-free'), 'Porn / fap-free');
console.log('✓ Test 1: with the setting off, copy is untouched.');

// Test 2: on, the explicit words are swapped for neutral ones.
setDiscreetMode(true);
assert.strictEqual(maskDiscreet('Porn / fap-free'), 'Habit-free');
assert.strictEqual(maskDiscreet('Porn & fap setup'), 'Second habit setup');
assert.strictEqual(maskDiscreet('Fap log'), 'Habit log');
assert.strictEqual(maskDiscreet('Porn-free'), 'Habit-free');
assert.strictEqual(
  maskDiscreet('Compulsive porn use or masturbation'),
  'A compulsive habit you want to stop',
);
console.log('✓ Test 2: known UI labels get their neutral wording.');

// Test 3: free prose is cleaned too, so sources and timeline copy cannot leak
// the words either.
const prose = maskDiscreet(
  'Pornography use and masturbation are discussed in NoFap and porn-free threads.',
);
assert.ok(!/porn|fap|masturbat/i.test(prose), `prose still leaks: ${prose}`);
console.log('✓ Test 3: prose is masked as well.');

// Test 4: the long-form content that used to slip through (health red flags,
// citation titles and takeaways) is covered too.
for (const text of [
  ...RED_FLAG_CRISIS_ALERTS,
  ...ACADEMIC_SOURCES.map((s) => `${s.title} ${s.takeaway}`),
]) {
  const masked = maskDiscreet(text);
  assert.ok(!/porn|fap|masturbat/i.test(masked), `content still leaks: ${masked}`);
}
console.log('✓ Test 4: red flags and citation copy are masked as well.');

// Test 5: turning it back off restores the original copy immediately.
setDiscreetMode(false);
assert.strictEqual(maskDiscreet('Porn / fap'), 'Porn / fap');
console.log('✓ Test 5: switching it off restores the normal words.');

console.log('--- DISCREET WORDING TESTS COMPLETED SUCCESSFULLY! ---');
