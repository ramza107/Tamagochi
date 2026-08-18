import assert from 'node:assert/strict';
import { moodFromVitality, scoreVitality, stageFromVitality } from '../src/logic/vitality.ts';

const good = scoreVitality({ sleepHours: 8, steps: 9000, screenHours: 2 });
assert.ok(good >= 75, `expected thriving score, got ${good}`);
assert.equal(moodFromVitality(good), 'thriving');
assert.equal(stageFromVitality(good), 3);

const bad = scoreVitality({ sleepHours: 3.5, steps: 800, screenHours: 9 });
assert.ok(bad < 35, `expected drained score, got ${bad}`);
assert.equal(moodFromVitality(bad), 'drained');

console.log('vitality tests ok', { good, bad });
