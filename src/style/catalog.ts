export type CostumeId = 'none' | 'hoodie' | 'sailor' | 'cape';
export type HairId = 'none' | 'bow' | 'beanie' | 'captain';
export type AccessoryId = 'none' | 'glasses' | 'scarf';

export type LookId = 'classic' | 'hoodie' | 'sailor' | 'bow' | 'autumn';

export type StyleLoadout = {
  costume: CostumeId;
  hair: HairId;
  accessory: AccessoryId;
};

/** Map style picks to a full painted look we ship as one sprite. */
export function resolveLook(style: StyleLoadout): LookId {
  if (style.costume === 'hoodie') return 'hoodie';
  if (style.costume === 'sailor' || style.hair === 'captain' || style.accessory === 'scarf') return 'sailor';
  if (style.hair === 'bow' || style.accessory === 'glasses') return 'bow';
  if (style.costume === 'cape' || style.hair === 'beanie') return 'autumn';
  return 'classic';
}

export const defaultStyle: StyleLoadout = {
  costume: 'none',
  hair: 'none',
  accessory: 'none',
};

export const costumeOptions: { id: CostumeId; label: string }[] = [
  { id: 'none', label: 'Без костюма' },
  { id: 'hoodie', label: 'Худи' },
  { id: 'sailor', label: 'Моряк' },
  { id: 'cape', label: 'Лиственный плащ' },
];

export const hairOptions: { id: HairId; label: string }[] = [
  { id: 'none', label: 'Как есть' },
  { id: 'bow', label: 'Бантик' },
  { id: 'beanie', label: 'Шапка-жёлудь' },
  { id: 'captain', label: 'Фуражка' },
];

export const accessoryOptions: { id: AccessoryId; label: string }[] = [
  { id: 'none', label: 'Без аксессуаров' },
  { id: 'glasses', label: 'Очки' },
  { id: 'scarf', label: 'Шарф' },
];
