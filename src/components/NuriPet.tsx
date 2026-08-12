import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import type { MoodKey } from '../theme';
import { moodPalette } from '../theme';
import type { LookId } from '../style/catalog';

type Props = {
  mood: MoodKey;
  stage: 1 | 2 | 3;
  look: LookId;
  size?: number;
  onWave?: () => void;
};

const moodSprites: Record<MoodKey, number> = {
  thriving: require('../../assets/nuri-thriving.jpg'),
  steady: require('../../assets/nuri-steady.jpg'),
  drowsy: require('../../assets/nuri-drowsy.jpg'),
  drained: require('../../assets/nuri-drained.jpg'),
};

const lookSprites: Record<Exclude<LookId, 'classic'>, number> = {
  hoodie: require('../../assets/look-hoodie.jpg'),
  sailor: require('../../assets/look-sailor.jpg'),
  bow: require('../../assets/look-bow.jpg'),
  autumn: require('../../assets/look-autumn.jpg'),
};

const waveSprite = require('../../assets/nuri-wave.jpg');

export function NuriPet({ mood, stage, look, size = 280, onWave }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const waveTilt = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [waving, setWaving] = useState(false);

  const palette = moodPalette[mood];
  const drained = mood === 'drained' || mood === 'drowsy';
  const stageScale = 0.92 + stage * 0.04;

  const baseSource =
    look === 'classic' ? moodSprites[mood] : lookSprites[look];
  const source = waving ? waveSprite : baseSource;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0.4, duration: 100, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [fade, look, mood]);

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

  // idle wave every ~8s when healthy
  useEffect(() => {
    if (drained) return;
    const id = setInterval(() => triggerWave(false), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drained, look]);

  function triggerWave(fromTap: boolean) {
    setWaving((already) => {
      if (already) return already;
      waveTilt.setValue(0);
      Animated.sequence([
        Animated.timing(waveTilt, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: -1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(waveTilt, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
      onWave?.();
      setTimeout(() => setWaving(false), fromTap ? 1000 : 850);
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

  return (
    <View style={{ width: size, height: size + 18, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable onPress={() => triggerWave(true)}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY }, { scale }, { rotate }] }}>
          <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
          {!waving && look === 'classic' && (
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
