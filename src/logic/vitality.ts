import type { DayMetrics } from '../types';
import type { MoodKey } from '../theme';

/** 0–100 score from simulated day metrics (HealthKit later). */
export function scoreVitality(m: DayMetrics): number {
  const sleep = clamp((m.sleepHours - 4) / 4, 0, 1) * 45;
  const steps = clamp(m.steps / 9000, 0, 1) * 35;
  const screenPenalty = clamp((m.screenHours - 2) / 6, 0, 1) * 30;
  return Math.round(clamp(sleep + steps - screenPenalty + 20, 0, 100));
}

export function moodFromVitality(v: number): MoodKey {
  if (v >= 75) return 'thriving';
  if (v >= 55) return 'steady';
  if (v >= 35) return 'drowsy';
  return 'drained';
}

export function stageFromVitality(v: number): 1 | 2 | 3 {
  if (v >= 70) return 3;
  if (v >= 40) return 2;
  return 1;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
