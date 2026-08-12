export const colors = {
  skyTop: '#C9DCE8',
  skyMid: '#E5E1D4',
  sand: '#F4EBDD',
  moss: '#6F8F73',
  mossDeep: '#4F6B55',
  mossLight: '#A3BFA3',
  amber: '#E39B45',
  amberSoft: '#F2C27A',
  ink: '#243028',
  inkSoft: '#5A6B5E',
  mist: 'rgba(255,255,255,0.45)',
  danger: '#B85C4A',
};

export const moodPalette = {
  thriving: {
    body: '#7FA37F',
    bodyShadow: '#4E6C52',
    core: '#F0B35A',
    coreInner: '#FFF1C9',
    sky: ['#B7D6C8', '#E8E0C8', '#F6EBD8'] as const,
    letter: 'Сегодня я лёгкий. Спасибо.',
  },
  steady: {
    body: '#6F8F73',
    bodyShadow: '#465A49',
    core: '#E39B45',
    coreInner: '#FFE6B0',
    sky: ['#C9DCE8', '#E5E1D4', '#F4EBDD'] as const,
    letter: 'Я рядом. Держи ритм.',
  },
  drowsy: {
    body: '#7A8B90',
    bodyShadow: '#4E5B60',
    core: '#C4A06A',
    coreInner: '#E8D4A8',
    sky: ['#B8C4CC', '#D5D0C6', '#E8DFD2'] as const,
    letter: 'Мне тяжело открывать глаза. Давай чуть раньше спать.',
  },
  drained: {
    body: '#6A6E6C',
    bodyShadow: '#3F4341',
    core: '#9A7A5C',
    coreInner: '#C9B49A',
    sky: ['#9AA4A8', '#B8B4AE', '#D2CBC2'] as const,
    letter: 'Ты не спал. Я тоже.',
  },
} as const;

export type MoodKey = keyof typeof moodPalette;
