import AsyncStorage from '@react-native-async-storage/async-storage';
import { shiftISO } from './engine';

const STREAK_KEY = 'derzhi.streak';
const LAST_KEY = 'derzhi.lastOfficial';

export type OfficialResult = {
  dateISO: string;
  ms: number;
  won: boolean;
  killer?: string;
  survived: number;
};

export async function loadStreak(): Promise<number> {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function loadOfficial(): Promise<OfficialResult | null> {
  const raw = await AsyncStorage.getItem(LAST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfficialResult;
  } catch {
    return null;
  }
}

export async function saveOfficial(result: OfficialResult, prev: OfficialResult | null): Promise<number> {
  const yesterday = shiftISO(result.dateISO, -1);
  const prevStreak = await loadStreak();
  let streak = 1;
  if (prev?.dateISO === result.dateISO) {
    streak = prevStreak;
  } else if (prev?.dateISO === yesterday) {
    streak = prevStreak + 1;
  }
  await AsyncStorage.setItem(STREAK_KEY, String(streak));
  await AsyncStorage.setItem(LAST_KEY, JSON.stringify(result));
  return streak;
}
