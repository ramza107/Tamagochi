import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NuriPet } from '../components/NuriPet';
import { MetricSimulator } from '../components/MetricSimulator';
import { ShopPanel } from '../components/ShopPanel';
import { behaviorFromMetrics, behaviorLetter } from '../logic/behavior';
import { stageFromVitality, scoreVitality } from '../logic/vitality';
import {
  STARTING_BALANCE,
  emptyEquipped,
  type Equipped,
  type ItemSlot,
  type ShopItem,
} from '../shop/catalog';
import { colors } from '../theme';
import { defaultMetrics, type DayMetrics } from '../types';

const METRICS_KEY = 'pulsepet.metrics.v1';
const WALLET_KEY = 'pulsepet.wallet.v2';

type Wallet = {
  balance: number;
  owned: string[];
  equipped: Equipped;
};

const defaultWallet: Wallet = {
  balance: STARTING_BALANCE,
  owned: [],
  equipped: emptyEquipped,
};

const sky = ['#C9DCE8', '#E5E1D4', '#F4EBDD'] as const;

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const [metrics, setMetrics] = useState<DayMetrics>(defaultMetrics);
  const [wallet, setWallet] = useState<Wallet>(defaultWallet);
  const [shopTab, setShopTab] = useState<ItemSlot>('costume');
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(METRICS_KEY), AsyncStorage.getItem(WALLET_KEY)])
      .then(([metricsRaw, walletRaw]) => {
        if (metricsRaw) setMetrics(JSON.parse(metricsRaw) as DayMetrics);
        if (walletRaw) setWallet(JSON.parse(walletRaw) as Wallet);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(METRICS_KEY, JSON.stringify(metrics)).catch(() => undefined);
  }, [metrics, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(WALLET_KEY, JSON.stringify(wallet)).catch(() => undefined);
  }, [wallet, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const vitality = useMemo(() => scoreVitality(metrics), [metrics]);
  const stage = stageFromVitality(vitality);
  const behavior = useMemo(() => behaviorFromMetrics(metrics), [metrics]);
  const letter = behaviorLetter(behavior);
  const petSize = Math.min(320, width * 0.82);

  function buy(item: ShopItem) {
    setWallet((w) => {
      if (w.owned.includes(item.id)) return w;
      if (w.balance < item.price) {
        setToast('Не хватает Pulse');
        return w;
      }
      setToast(`Куплено: ${item.name}`);
      return {
        ...w,
        balance: w.balance - item.price,
        owned: [...w.owned, item.id],
        equipped: { ...w.equipped, [item.slot]: item.id },
      };
    });
  }

  function equip(item: ShopItem) {
    setWallet((w) => {
      if (!w.owned.includes(item.id)) return w;
      setToast(`Надето: ${item.name}`);
      return { ...w, equipped: { ...w.equipped, [item.slot]: item.id } };
    });
  }

  function unequip(slot: ItemSlot) {
    setWallet((w) => ({ ...w, equipped: { ...w.equipped, [slot]: null } }));
  }

  return (
    <LinearGradient colors={[...sky]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.brand}>Pulsepet</Text>
            <Text style={styles.tagline}>Красивый Nuri с картинок — живой и точно на экране.</Text>
          </View>

          <View style={styles.stage}>
            <View style={styles.stageFrame}>
              <NuriPet
                behavior={behavior}
                stage={stage}
                equipped={wallet.equipped}
                size={petSize}
              />
            </View>
            <Text style={styles.petName}>Nuri</Text>
            <Text style={styles.behaviorTag}>{behaviorLabel(behavior)}</Text>
            <Text style={styles.letter}>«{letter}»</Text>
            {toast ? <Text style={styles.toast}>{toast}</Text> : null}
          </View>

          <View style={styles.vitals}>
            <VitalChip label="Жизнь" value={`${vitality}`} />
            <VitalChip label="Поведение" value={behaviorLabel(behavior)} />
            <VitalChip label="Стадия" value={`${stage}/3`} />
          </View>

          <Text style={styles.guide}>
            Мало сна → засыпает. Много экрана → закрывает глаза. Мало шагов → пинает камушек.
            В покое сам моргает и машет.
          </Text>

          <ShopPanel
            balance={wallet.balance}
            owned={wallet.owned}
            equipped={wallet.equipped}
            tab={shopTab}
            onTabChange={setShopTab}
            onBuy={buy}
            onEquip={equip}
            onUnequip={unequip}
          />

          <MetricSimulator metrics={metrics} onChange={setMetrics} />

          <Pressable
            onPress={() => {
              setMetrics(defaultMetrics);
              setWallet(defaultWallet);
              setToast('Сброшено');
            }}
            style={({ pressed }) => [styles.reset, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.resetText}>Сбросить день и покупки</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function behaviorLabel(b: ReturnType<typeof behaviorFromMetrics>) {
  switch (b) {
    case 'sleepy':
      return 'Хочет спать';
    case 'screen':
      return 'Много экрана';
    case 'walk':
      return 'Хочет гулять';
    default:
      return 'Спокоен';
  }
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 16,
  },
  hero: { gap: 6, paddingTop: 8 },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 42,
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -0.8,
  },
  tagline: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkSoft,
    maxWidth: 320,
  },
  stage: { alignItems: 'center', gap: 4 },
  stageFrame: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  petName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.ink,
    marginTop: 4,
  },
  behaviorTag: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.mossDeep,
  },
  letter: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: 320,
  },
  toast: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.mossDeep,
  },
  vitals: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(36,48,40,0.06)',
    gap: 2,
  },
  chipLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
  chipValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  guide: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  reset: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  resetText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.mossDeep,
  },
});
