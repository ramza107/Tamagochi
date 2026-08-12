import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import type { MoodKey } from '../theme';
import { moodPalette } from '../theme';

type Props = {
  mood: MoodKey;
  stage: 1 | 2 | 3;
  size?: number;
};

/**
 * Nuri — soft moss pebble with an amber glass pulse-core.
 * Not an egg, not a cat: a living barometer you can feel.
 */
export function NuriPet({ mood, stage, size = 260 }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const palette = moodPalette[mood];
  const drained = mood === 'drained' || mood === 'drowsy';
  const earScale = 0.85 + stage * 0.08;
  const coreR = 18 + stage * 4;

  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: drained ? 2200 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: drained ? 2200 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: drained ? 1400 : 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: drained ? 1400 : 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    breathLoop.start();
    pulseLoop.start();
    floatLoop.start();

    return () => {
      breathLoop.stop();
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [breath, drained, floatY, pulse]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, drained ? 1.02 : 1.045] });
  const translateY = floatY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drained ? 4 : -8],
  });
  const coreScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, drained ? 1.06 : 1.14],
  });

  const eyeOpen = mood === 'drained' ? 0.55 : mood === 'drowsy' ? 0.7 : 1;

  return (
    <View style={{ width: size, height: size + 24, alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <Defs>
            <RadialGradient id="fur" cx="40%" cy="32%" r="70%">
              <Stop offset="0%" stopColor={palette.body} stopOpacity="1" />
              <Stop offset="70%" stopColor={palette.body} stopOpacity="1" />
              <Stop offset="100%" stopColor={palette.bodyShadow} stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="core" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor={palette.coreInner} stopOpacity="1" />
              <Stop offset="55%" stopColor={palette.core} stopOpacity="1" />
              <Stop offset="100%" stopColor={palette.core} stopOpacity="0.35" />
            </RadialGradient>
          </Defs>

          <G opacity={0.95}>
            <Ellipse
              cx={88}
              cy={78}
              rx={22 * earScale}
              ry={34 * earScale}
              fill={palette.body}
              transform="rotate(-28 88 78)"
            />
            <Ellipse
              cx={172}
              cy={78}
              rx={22 * earScale}
              ry={34 * earScale}
              fill={palette.body}
              transform="rotate(28 172 78)"
            />
            <Ellipse
              cx={88}
              cy={82}
              rx={10 * earScale}
              ry={18 * earScale}
              fill={palette.core}
              opacity={0.35}
              transform="rotate(-28 88 82)"
            />
            <Ellipse
              cx={172}
              cy={82}
              rx={10 * earScale}
              ry={18 * earScale}
              fill={palette.core}
              opacity={0.35}
              transform="rotate(28 172 82)"
            />
          </G>

          <Ellipse cx={130} cy={145} rx={86} ry={78} fill="url(#fur)" />
          <Ellipse cx={108} cy={120} rx={28} ry={18} fill="#FFFFFF" opacity={0.18} />

          <Circle cx={78} cy={150} r={10} fill={palette.core} opacity={0.28} />
          <Circle cx={182} cy={150} r={10} fill={palette.core} opacity={0.28} />

          <G opacity={eyeOpen}>
            <Ellipse cx={104} cy={132} rx={9} ry={12} fill="#243028" />
            <Ellipse cx={156} cy={132} rx={9} ry={12} fill="#243028" />
            <Circle cx={101} cy={128} r={3} fill="#FFFFFF" opacity={0.85} />
            <Circle cx={153} cy={128} r={3} fill="#FFFFFF" opacity={0.85} />
          </G>

          {(mood === 'drowsy' || mood === 'drained') && (
            <G opacity={0.55}>
              <Path
                d="M94 126 Q104 120 114 126"
                stroke="#243028"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M146 126 Q156 120 166 126"
                stroke="#243028"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          )}

          {mood === 'thriving' ? (
            <Path
              d="M118 162 Q130 172 142 162"
              stroke="#243028"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          ) : mood === 'drained' ? (
            <Path
              d="M118 168 Q130 162 142 168"
              stroke="#243028"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <Path
              d="M122 164 Q130 168 138 164"
              stroke="#243028"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          )}

          <Circle cx={130} cy={188} r={coreR} fill="url(#core)" />
          <Circle cx={122} cy={180} r={coreR * 0.28} fill="#FFFFFF" opacity={0.45} />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: coreR * 2.8,
            height: coreR * 2.8,
            borderRadius: coreR * 1.4,
            backgroundColor: palette.core,
            bottom: size * 0.18,
            transform: [{ scale: coreScale }],
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] }),
          },
        ]}
      />
      <View style={[styles.shadow, { width: size * 0.55, opacity: drained ? 0.2 : 0.3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    height: 16,
    borderRadius: 999,
    backgroundColor: '#243028',
    marginTop: -6,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
