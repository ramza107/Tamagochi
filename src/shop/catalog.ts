export type ItemSlot = 'costume' | 'hair' | 'accessory';
export type SvgOverlayId = 'hoodie' | 'cape' | 'beanie';

export type ShopItem = {
  id: string;
  slot: ItemSlot;
  name: string;
  price: number;
  blurb: string;
  render: 'png' | 'svg';
  asset?: number;
  svg?: SvgOverlayId;
  layout: { x: number; y: number; w: number; h: number };
};

export const CURRENCY = 'Pulse';
export const STARTING_BALANCE = 250;

export const shopItems: ShopItem[] = [
  {
    id: 'hoodie',
    slot: 'costume',
    name: 'Кремовое худи',
    price: 120,
    blurb: 'Мягкий слой поверх Nuri',
    render: 'svg',
    svg: 'hoodie',
    layout: { x: 0.16, y: 0.4, w: 0.68, h: 0.5 },
  },
  {
    id: 'cape',
    slot: 'costume',
    name: 'Лиственный плащ',
    price: 180,
    blurb: 'Осенний плащ на мох',
    render: 'svg',
    svg: 'cape',
    layout: { x: 0.1, y: 0.36, w: 0.8, h: 0.58 },
  },
  {
    id: 'bow',
    slot: 'hair',
    name: 'Пастельный бантик',
    price: 80,
    blurb: 'На макушку между лепестками',
    render: 'png',
    asset: require('../../assets/overlays/bow.png'),
    layout: { x: 0.3, y: -0.02, w: 0.4, h: 0.3 },
  },
  {
    id: 'captain-hat',
    slot: 'hair',
    name: 'Фуражка капитана',
    price: 100,
    blurb: 'Маленькая фуражка сверху',
    render: 'png',
    asset: require('../../assets/overlays/captain-hat.png'),
    layout: { x: 0.26, y: -0.04, w: 0.48, h: 0.3 },
  },
  {
    id: 'beanie',
    slot: 'hair',
    name: 'Шапка-жёлудь',
    price: 110,
    blurb: 'Тёплая шапка на мох',
    render: 'svg',
    svg: 'beanie',
    layout: { x: 0.26, y: -0.02, w: 0.48, h: 0.34 },
  },
  {
    id: 'glasses',
    slot: 'accessory',
    name: 'Круглые очки',
    price: 70,
    blurb: 'На глаза поверх мордочки',
    render: 'png',
    asset: require('../../assets/overlays/glasses.png'),
    layout: { x: 0.24, y: 0.26, w: 0.52, h: 0.24 },
  },
  {
    id: 'scarf',
    slot: 'accessory',
    name: 'Моряцкий шарф',
    price: 90,
    blurb: 'Шарф вокруг шейки',
    render: 'png',
    asset: require('../../assets/overlays/scarf.png'),
    layout: { x: 0.2, y: 0.38, w: 0.6, h: 0.34 },
  },
];

export function itemById(id: string | null | undefined) {
  if (!id) return undefined;
  return shopItems.find((i) => i.id === id);
}

export type Equipped = {
  costume: string | null;
  hair: string | null;
  accessory: string | null;
};

export const emptyEquipped: Equipped = {
  costume: null,
  hair: null,
  accessory: null,
};
