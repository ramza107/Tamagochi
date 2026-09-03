export type Behavior = 'idle' | 'sleepy' | 'screen' | 'walk';

export type DayMetrics = {
  sleepHours: number;
  steps: number;
  screenHours: number;
};

/** Pick the strongest need so Nuri acts, not just changes a picture. */
export function behaviorFromMetrics(m: DayMetrics): Behavior {
  const needSleep = m.sleepHours < 6.5;
  const tooMuchScreen = m.screenHours >= 5;
  const needWalk = m.steps < 4000;

  // priority: urgent care signals first
  if (needSleep && m.sleepHours <= 5) return 'sleepy';
  if (tooMuchScreen && m.screenHours >= 7) return 'screen';
  if (needWalk && m.steps < 2500) return 'walk';
  if (needSleep) return 'sleepy';
  if (tooMuchScreen) return 'screen';
  if (needWalk) return 'walk';
  return 'idle';
}

export function behaviorLetter(b: Behavior): string {
  switch (b) {
    case 'sleepy':
      return 'Хочу спать… давай ляжем пораньше.';
    case 'screen':
      return 'Слишком много экрана. Я закрою глаза — и ты тоже.';
    case 'walk':
      return 'Пойдём! Я пну камушек, если встанешь.';
    default:
      return 'Я рядом. Держи ритм.';
  }
}
