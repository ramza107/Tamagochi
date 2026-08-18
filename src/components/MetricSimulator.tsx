import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DayMetrics } from '../types';
import { colors } from '../theme';

type Props = {
  metrics: DayMetrics;
  onChange: (next: DayMetrics) => void;
};

const rows: { key: keyof DayMetrics; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'sleepHours', label: 'Сон', min: 3, max: 10, step: 0.5, unit: 'ч' },
  { key: 'steps', label: 'Шаги', min: 0, max: 12000, step: 500, unit: '' },
  { key: 'screenHours', label: 'Экран', min: 0.5, max: 10, step: 0.5, unit: 'ч' },
];

export function MetricSimulator({ metrics, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Симулятор дня · позже HealthKit</Text>
      {rows.map((row) => {
        const value = metrics[row.key];
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>
                {row.key === 'steps' ? Math.round(value).toLocaleString('ru-RU') : value.toFixed(1)}
                {row.unit ? ` ${row.unit}` : ''}
              </Text>
            </View>
            <View style={styles.controls}>
              <RoundButton
                label="−"
                onPress={() =>
                  onChange({
                    ...metrics,
                    [row.key]: Math.max(row.min, Number((value - row.step).toFixed(1))),
                  })
                }
              />
              <RoundButton
                label="+"
                onPress={() =>
                  onChange({
                    ...metrics,
                    [row.key]: Math.min(row.max, Number((value + row.step).toFixed(1))),
                  })
                }
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 14,
    paddingTop: 8,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  value: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: colors.inkSoft,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(36,48,40,0.08)',
  },
  btnPressed: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  btnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 22,
    color: colors.ink,
    marginTop: -2,
  },
});
