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
import { moodFromVitality, scoreVitality, stageFromVitality } from '../logic/vitality';
import { colors, moodPalette } from '../theme';
import { defaultMetrics, type DayMetrics } from '../types';

const STORAGE_KEY = 'pulsepet.metrics.v1';

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const [metrics, setMetrics] = useState<DayMetrics>(defaultMetrics);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setMetrics(JSON.parse(raw) as DayMetrics);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metrics)).catch(() => undefined);
  }, [metrics, ready]);

  const vitality = useMemo(() => scoreVitality(metrics), [metrics]);
  const mood = moodFromVitality(vitality);
  const stage = stageFromVitality(vitality);
  const palette = moodPalette[mood];
  const petSize = Math.min(280, width * 0.72);

  return (
    <LinearGradient colors={[...palette.sky]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.brand}>Pulsepet</Text>
            <Text style={styles.tagline}>Питомец, которого кормит твоя жизнь</Text>
          </View>

          <View style={styles.stage}>
            <NuriPet mood={mood} stage={stage} size={petSize} />
            <Text style={styles.petName}>Nuri</Text>
            <Text style={styles.letter}>«{palette.letter}»</Text>
          </View>

          <View style={styles.vitals}>
            <VitalChip label="Жизнь" value={`${vitality}`} />
            <VitalChip label="Настрой" value={moodLabel(mood)} />
            <VitalChip label="Стадия" value={`${stage}/3`} />
          </View>

          <MetricSimulator metrics={metrics} onChange={setMetrics} />

          <Pressable
            onPress={() => setMetrics(defaultMetrics)}
            style={({ pressed }) => [styles.reset, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.resetText}>Сбросить день</Text>
          </Pressable>

          <Text style={styles.footnote}>
            Сейчас метрики симулируются. На Mac подключим HealthKit, виджеты и Live Activity.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function moodLabel(mood: keyof typeof moodPalette) {
  switch (mood) {
    case 'thriving':
      return 'Яркий';
    case 'steady':
      return 'Ровный';
    case 'drowsy':
      return 'Сонный';
    case 'drained':
      return 'Пустой';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 18,
  },
  hero: {
    gap: 6,
    paddingTop: 8,
  },
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
    maxWidth: 280,
  },
  stage: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  petName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.ink,
    marginTop: 4,
  },
  letter: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: 300,
  },
  vitals: {
    flexDirection: 'row',
    gap: 10,
  },
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
    fontSize: 18,
    color: colors.ink,
  },
  reset: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.mossDeep,
  },
  footnote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
    textAlign: 'center',
    opacity: 0.85,
  },
});
