import { buildDailyDeck } from '../src/derzhi/engine.ts';
import {
  buildShare,
  dailyRun,
  formatTime,
  hashString,
  moscowDateISO,
  mulberry32,
  shareGrid,
  shiftISO,
} from '../src/derzhi/engine.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const isoA = '2026-08-18';
const isoB = '2026-08-19';
const d1 = buildDailyDeck(mulberry32(hashString(`derzhi:${isoA}:v1`)), 10);
const d1b = buildDailyDeck(mulberry32(hashString(`derzhi:${isoA}:v1`)), 10);
const d2 = buildDailyDeck(mulberry32(hashString(`derzhi:${isoB}:v1`)), 10);

assert(d1.length === 10, 'deck size');
assert(d1.map((t) => t.id).join() === d1b.map((t) => t.id).join(), 'same day same deck');
assert(d1.map((t) => t.atMs).join() === d1b.map((t) => t.atMs).join(), 'same timings');
assert(d1.map((t) => t.id).join() !== d2.map((t) => t.id).join(), 'next day reshuffles');
assert(d1.every((t, i) => i === 0 || t.atMs > d1[i - 1].atMs), 'monotonic times');

assert(formatTime(12340) === '12,3', `time format ${formatTime(12340)}`);
assert(moscowDateISO(new Date('2026-08-18T12:00:00+03:00')) === '2026-08-18', 'moscow iso');

const grid = shareGrid(d1, d1[2].atMs + 100, false);
assert(grid.includes('💀'), 'death mark');
assert(grid.includes('🟩'), 'survived marks');

const text = buildShare({
  dateISO: isoA,
  ms: 12400,
  won: false,
  killer: 'Мама',
  deck: d1,
  url: 'https://example.com',
});
assert(text.includes('ДЕРЖИ 18.08.2026'), text);
assert(text.includes('сорвался: Мама'), text);
assert(text.includes('https://example.com'), text);

assert(shiftISO('2026-08-18', -1) === '2026-08-17', 'yesterday');
assert(shiftISO('2026-03-01', -1) === '2026-02-28', 'month boundary');

const run = dailyRun(new Date('2026-08-18T18:00:00+03:00'));
assert(run.dateISO === '2026-08-18', run.dateISO);
assert(run.winMs > run.deck[run.deck.length - 1].atMs, 'win after last trap');

console.log('derzhi-check: ok', run.deck.map((t) => t.from).join(' → '));
