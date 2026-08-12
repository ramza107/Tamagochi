import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  accessoryOptions,
  costumeOptions,
  hairOptions,
  type AccessoryId,
  type CostumeId,
  type HairId,
  type StyleLoadout,
} from '../style/catalog';
import { colors } from '../theme';

type Tab = 'costume' | 'hair' | 'accessory';

type Props = {
  styleLoadout: StyleLoadout;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onChange: (next: StyleLoadout) => void;
};

export function StylePanel({ styleLoadout, tab, onTabChange, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Образ Nuri</Text>
      <View style={styles.tabs}>
        {([
          ['costume', 'Костюм'],
          ['hair', 'Причёска'],
          ['accessory', 'Аксессуары'],
        ] as const).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => onTabChange(id)}
            style={[styles.tab, tab === id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'costume' && (
        <OptionRow
          options={costumeOptions}
          value={styleLoadout.costume}
          onSelect={(costume) => onChange(applyCostume(styleLoadout, costume))}
        />
      )}
      {tab === 'hair' && (
        <OptionRow
          options={hairOptions}
          value={styleLoadout.hair}
          onSelect={(hair) => onChange(applyHair(styleLoadout, hair))}
        />
      )}
      {tab === 'accessory' && (
        <OptionRow
          options={accessoryOptions}
          value={styleLoadout.accessory}
          onSelect={(accessory) => onChange(applyAccessory(styleLoadout, accessory))}
        />
      )}
      <Text style={styles.hint}>Нажми на Nuri — он помашет лапкой</Text>
    </View>
  );
}

function OptionRow<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { id: T; label: string }[];
  value: T;
  onSelect: (id: T) => void;
}) {
  return (
    <View style={styles.options}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function applyCostume(prev: StyleLoadout, costume: CostumeId): StyleLoadout {
  if (costume === 'hoodie') return { costume, hair: 'none', accessory: 'none' };
  if (costume === 'sailor') return { costume, hair: 'captain', accessory: 'scarf' };
  if (costume === 'cape') return { costume, hair: 'beanie', accessory: 'none' };
  return { ...prev, costume: 'none' };
}

function applyHair(prev: StyleLoadout, hair: HairId): StyleLoadout {
  if (hair === 'bow') return { costume: 'none', hair, accessory: 'glasses' };
  if (hair === 'beanie') return { costume: 'cape', hair, accessory: 'none' };
  if (hair === 'captain') return { costume: 'sailor', hair, accessory: 'scarf' };
  return { ...prev, hair: 'none' };
}

function applyAccessory(prev: StyleLoadout, accessory: AccessoryId): StyleLoadout {
  if (accessory === 'glasses') return { costume: 'none', hair: 'bow', accessory };
  if (accessory === 'scarf') return { costume: 'sailor', hair: 'captain', accessory };
  return { ...prev, accessory: 'none' };
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 12 },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.ink,
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
    fontSize: 13,
    color: colors.inkSoft,
  },
  tabTextActive: { color: '#F4EBDD' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(36,48,40,0.08)',
  },
  chipActive: {
    backgroundColor: colors.moss,
    borderColor: colors.mossDeep,
  },
  chipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.ink,
  },
  chipTextActive: { color: '#F7F3EA' },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
});
