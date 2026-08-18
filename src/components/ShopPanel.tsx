import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CURRENCY,
  shopItems,
  type Equipped,
  type ItemSlot,
  type ShopItem,
} from '../shop/catalog';
import { colors } from '../theme';

type Props = {
  balance: number;
  owned: string[];
  equipped: Equipped;
  tab: ItemSlot;
  onTabChange: (tab: ItemSlot) => void;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  onUnequip: (slot: ItemSlot) => void;
};

export function ShopPanel({
  balance,
  owned,
  equipped,
  tab,
  onTabChange,
  onBuy,
  onEquip,
  onUnequip,
}: Props) {
  const items = shopItems.filter((i) => i.slot === tab);
  const equippedId = equipped[tab];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Магазин образов</Text>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>
            {balance} {CURRENCY}
          </Text>
        </View>
      </View>
      <Text style={styles.sub}>Одна модель Nuri — вещи надеваются слоями поверх</Text>

      <View style={styles.tabs}>
        {(
          [
            ['costume', 'Костюмы'],
            ['hair', 'Причёски'],
            ['accessory', 'Аксессуары'],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => onTabChange(id)}
            style={[styles.tab, tab === id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const isOwned = owned.includes(item.id);
          const isOn = equippedId === item.id;
          return (
            <View key={item.id} style={[styles.row, isOn && styles.rowOn]}>
              <View style={styles.meta}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.blurb}>{item.blurb}</Text>
                <Text style={styles.price}>
                  {isOwned ? 'Куплено' : `${item.price} ${CURRENCY}`}
                </Text>
              </View>
              <View style={styles.actions}>
                {!isOwned ? (
                  <Pressable
                    onPress={() => onBuy(item)}
                    style={({ pressed }) => [styles.btn, styles.btnBuy, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={styles.btnBuyText}>Купить</Text>
                  </Pressable>
                ) : isOn ? (
                  <Pressable
                    onPress={() => onUnequip(item.slot)}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={styles.btnGhostText}>Снять</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => onEquip(item)}
                    style={({ pressed }) => [styles.btn, styles.btnWear, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={styles.btnWearText}>Надеть</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>Нажми на Nuri — помашет. Вещи стакаются: костюм + причёска + аксессуар.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.ink,
  },
  balancePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(36,48,40,0.9)',
  },
  balanceText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#F4EBDD',
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  tabActive: { backgroundColor: 'rgba(36,48,40,0.88)' },
  tabText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.inkSoft,
  },
  tabTextActive: { color: '#F4EBDD' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(36,48,40,0.06)',
  },
  rowOn: {
    borderColor: colors.moss,
    backgroundColor: 'rgba(127,163,127,0.22)',
  },
  meta: { flex: 1, gap: 2 },
  name: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  blurb: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
  price: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.mossDeep,
    marginTop: 2,
  },
  actions: { gap: 6 },
  btn: {
    minWidth: 84,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnBuy: { backgroundColor: colors.amber },
  btnBuyText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#2A2116',
  },
  btnWear: { backgroundColor: colors.moss },
  btnWearText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#F7F3EA',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(36,48,40,0.1)',
  },
  btnGhostText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.ink,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
});
