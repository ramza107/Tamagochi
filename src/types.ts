import type { MoodKey } from './theme';

export type DayMetrics = {
  sleepHours: number;
  steps: number;
  screenHours: number;
};

export type PetSnapshot = {
  name: string;
  mood: MoodKey;
  vitality: number;
  stage: 1 | 2 | 3;
  metrics: DayMetrics;
  updatedAt: string;
};

export const defaultMetrics: DayMetrics = {
  sleepHours: 7.2,
  steps: 6200,
  screenHours: 3.5,
};
