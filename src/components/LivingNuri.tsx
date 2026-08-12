import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';
import { itemById } from '../shop/catalog';
import { SvgClothes } from './SvgClothes';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

/** One painted Nuri + live motion/gestures. Never swap to a different creature. */
const BASE = require('../../assets/nuri-steady.jpg');

export function LivingNuri({ behavior, stage, equipped, size = 300 }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const lids = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const kick = useRef(new Animated.Value(0)).current;
  const pebble = useRef(new Animated.Value(0)).current;
  const zzz = useRef(new Animated.Value(0)).current;
  const nod = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  const costume = itemById(equipped.costume);
  const hair = itemById(equipped.hair);
  const accessory = itemById(equipped.accessory);
  const stageScale = 0.94 + stage * 0.03;

  // Always alive
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const c = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [breath, pulse, sway]);

  // Behavior gestures on the same model
  useEffect(() => {
    lids.setValue(0);
    kick.setValue(0);
    pebble.setValue(0);
    zzz.setValue(0);
    nod.setValue(0);
    wave.setValue(0);

    if (behavior === 'idle') {
      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(4500),
          Animated.timing(wave, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(wave, { toValue: -1, duration: 150, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.delay(3500),
        ]),
      );
      // soft blink
      const blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(2800),
          Animated.timing(lids, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(lids, { toValue: 0, duration: 110, useNativeDriver: true }),
          Animated.delay(2200),
        ]),
      );
      waveLoop.start();
      blinkLoop.start();
      return () => {
        waveLoop.stop();
        blinkLoop.stop();
      };
    }

    if (behavior === 'sleepy') {
      lids.setValue(0.75);
      const sleepLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(nod, {
              toValue: 1,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(nod, {
              toValue: 0,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(zzz, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(zzz, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
        ]),
      );
      sleepLoop.start();
      return () => sleepLoop.stop();
    }

    if (behavior === 'screen') {
      const screenLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(lids, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(lids, { toValue: 0.15, duration: 80, useNativeDriver: true }),
          Animated.timing(lids, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(lids, { toValue: 0.15, duration: 80, useNativeDriver: true }),
          Animated.timing(lids, { toValue: 0.95, duration: 220, useNativeDriver: true }),
          Animated.delay(1500),
          Animated.timing(lids, { toValue: 0.2, duration: 280, useNativeDriver: true }),
          Animated.delay(500),
        ]),
      );
      screenLoop.start();
      return () => screenLoop.stop();
    }

    // walk
    const walkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(kick, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(pebble, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0.35, duration: 200, useNativeDriver: true }),
        ]),
        Animated.timing(kick, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(pebble, { toValue: 0, duration: 1, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    walkLoop.start();
    return () => walkLoop.stop();
  }, [behavior, kick, lids, nod, pebble, wave, zzz]);

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [stageScale, stageScale * 1.028],
  });
  const translateX = sway.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const translateY = nod.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const rotate = wave.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });
  const lidOpacity = lids;
  const pebbleX = pebble.interpolate({ inputRange: [0, 1], outputRange: [0, 78] });
  const pebbleY = pebble.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const pebbleOp = pebble.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0.1] });
  const kickNudge = kick.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const zOp = zzz.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });
  const zY = zzz.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.28] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  const layers = [costume, hair, accessory].filter(Boolean);

  return (
    <View style={{ width: size, height: size + 20, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [
            { translateX },
            { translateY },
            { translateX: kickNudge },
            { scale },
            { rotate },
          ],
        }}
      >
        <Image source={BASE} style={{ width: size, height: size }} resizeMode="contain" />

        {/* soft heart glow on chest */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              left: size * 0.38,
              top: size * 0.5,
              width: size * 0.24,
              height: size * 0.24,
              borderRadius: size * 0.12,
              opacity: glow,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* eyelids — same face, just closes eyes */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lid,
            {
              left: size * 0.34,
              top: size * 0.36,
              width: size * 0.13,
              opacity: lidOpacity,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lid,
            {
              left: size * 0.53,
              top: size * 0.36,
              width: size * 0.13,
              opacity: lidOpacity,
            },
          ]}
        />

        {/* sleepy z */}
        {behavior === 'sleepy' && (
          <Animated.View style={[styles.zzzWrap, { opacity: zOp, transform: [{ translateY: zY }] }]}>
            <Text style={styles.zzz}>z z</Text>
          </Animated.View>
        )}

        {/* pebble kick */}
        <Animated.View
          style={[
            styles.pebble,
            {
              left: size * 0.58,
              top: size * 0.78,
              opacity: behavior === 'walk' ? pebbleOp : 0,
              transform: [{ translateX: pebbleX }, { translateY: pebbleY }],
            },
          ]}
        />

        {/* cosmetics on the same body */}
        {layers.map((item) => {
          if (!item) return null;
          const box = {
            position: 'absolute' as const,
            left: size * item.layout.x,
            top: size * item.layout.y,
            width: size * item.layout.w,
            height: size * item.layout.h,
          };
          if (item.render === 'png' && item.asset) {
            return <Image key={item.id} source={item.asset} style={box} resizeMode="contain" />;
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
      </Animated.View>
      <View style={[styles.shadow, { width: size * 0.4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: '#E8A24A',
  },
  lid: {
    position: 'absolute',
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(70, 100, 78, 0.92)',
  },
  zzzWrap: {
    position: 'absolute',
    right: 16,
    top: 28,
  },
  zzz: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: '#5A6B5E',
  },
  pebble: {
    position: 'absolute',
    width: 14,
    height: 11,
    borderRadius: 7,
    backgroundColor: '#8B8578',
  },
  shadow: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#243028',
    opacity: 0.22,
    marginTop: -6,
  },
});
