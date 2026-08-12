import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import type { MoodKey } from '../theme';
import { moodPalette } from '../theme';
import { itemById, type Equipped } from '../shop/catalog';
import { SvgClothes } from './SvgClothes';

type Props = {
  mood: MoodKey;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

const moodSprites: Record<MoodKey, number> = {
  thriving: require('../../assets/nuri-thriving.jpg'),
  steady: require('../../assets/nuri-steady.jpg'),
  drowsy: require('../../assets/nuri-drowsy.jpg'),
  drained: require('../../assets/nuri-drained.jpg'),
};

const waveSprite = require('../../assets/nuri-wave.jpg');

/**
 * One base Nuri model + layered cosmetics on top (buyable in shop).
 */
export function NuriPet({ mood, stage, equipped, size = 280 }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const waveTilt = useRef(new Animated.Value(0)).current;
  const [waving, setWaving] = useState(false);

  const palette = moodPalette[mood];
  const drained = mood === 'drained' || mood === 'drowsy';
  const stageScale = 0.92 + stage * 0.04;

  const costume = itemById(equipped.costume);
  const hair = itemById(equipped.hair);
  const accessory = itemById(equipped.accessory);

  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: drained ? 2300 : 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: drained ? 2300 : 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: drained ? 1500 : 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: drained ? 1500 : 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2600,
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

  useEffect(() => {
    if (drained) return;
    const id = setInterval(() => triggerWave(), 8500);
    return () => clearInterval(id);
  }, [drained]);

  function triggerWave() {
    setWaving((already) => {
      if (already) return already;
      waveTilt.setValue(0);
      Animated.sequence([
        Animated.timing(waveTilt, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: -1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setWaving(false), 950);
      return true;
    });
  }

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [stageScale, stageScale * (drained ? 1.015 : 1.035)],
  });
  const translateY = floatY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drained ? 3 : -7],
  });
  const rotate = waveTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, drained ? 1.08 : 1.22],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [drained ? 0.08 : 0.16, drained ? 0.18 : 0.38],
  });

  const layers = [costume, hair, accessory].filter(Boolean);

  return (
    <View style={{ width: size, height: size + 18, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable onPress={triggerWave}>
        <Animated.View style={{ transform: [{ translateY }, { scale }, { rotate }] }}>
          <View style={{ width: size, height: size }}>
            <Image
              source={waving ? waveSprite : moodSprites[mood]}
              style={{ width: size, height: size }}
              resizeMode="contain"
            />
            {!waving && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heartGlow,
                  {
                    width: size * 0.28,
                    height: size * 0.28,
                    borderRadius: size * 0.14,
                    backgroundColor: palette.core,
                    left: size * 0.36,
                    top: size * 0.48,
                    opacity: glowOpacity,
                    transform: [{ scale: glowScale }],
                  },
                ]}
              />
            )}
            {!waving &&
              layers.map((item) => {
                if (!item) return null;
                const box = {
                  position: 'absolute' as const,
                  left: size * item.layout.x,
                  top: size * item.layout.y,
                  width: size * item.layout.w,
                  height: size * item.layout.h,
                };
                if (item.render === 'png' && item.asset) {
                  return (
                    <Image
                      key={item.id}
                      source={item.asset}
                      style={box}
                      resizeMode="contain"
                    />
                  );
                }
                if (item.render === 'svg' && item.svg) {
                  return (
                    <View key={item.id} style={box} pointerEvents="none">
                      <SvgClothes id={item.svg} width={box.width} height={box.height} />
                    </View>
                  );
                }
                return null;
              })}
          </View>
        </Animated.View>
      </Pressable>
      <View style={[styles.shadow, { width: size * 0.42, opacity: drained ? 0.18 : 0.28 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  heartGlow: { position: 'absolute' },
  shadow: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#243028',
    marginTop: -10,
  },
});
