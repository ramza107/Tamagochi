import assert from 'node:assert/strict';
import { behaviorFromMetrics } from '../src/logic/behavior.ts';

assert.equal(behaviorFromMetrics({ sleepHours: 4, steps: 8000, screenHours: 2 }), 'sleepy');
assert.equal(behaviorFromMetrics({ sleepHours: 8, steps: 8000, screenHours: 8 }), 'screen');
assert.equal(behaviorFromMetrics({ sleepHours: 8, steps: 1000, screenHours: 2 }), 'walk');
assert.equal(behaviorFromMetrics({ sleepHours: 8, steps: 8000, screenHours: 2 }), 'idle');
console.log('behavior tests ok');
