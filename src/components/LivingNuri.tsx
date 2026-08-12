import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
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

type Pose = 'idle' | 'sleepy' | 'blink' | 'wave' | 'kick';

const poses: Record<Pose, number> = {
  idle: require('../../assets/nuri3d/idle.jpg'),
  sleepy: require('../../assets/nuri3d/sleepy.jpg'),
  blink: require('../../assets/nuri3d/blink.jpg'),
  wave: require('../../assets/nuri3d/wave.jpg'),
  kick: require('../../assets/nuri3d/kick.jpg'),
};

/**
 * Talking-Ben style: one finished 3D character, animated via pose frames.
 * Same hero always — never a sketch swap.
 */
export function LivingNuri({ behavior, stage, equipped, size = 320 }: Props) {
  const [pose, setPose] = useState<Pose>('idle');
  const breath = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  const costume = itemById(equipped.costume);
  const hair = itemById(equipped.hair);
  const accessory = itemById(equipped.accessory);
  const stageScale = 0.96 + stage * 0.02;

  // subtle living motion on whatever pose is shown
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // pose director — like Talking Ben reactions
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const show = (next: Pose) => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.35, duration: 90, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
      setPose(next);
    };

    bounce.setValue(0);

    if (behavior === 'idle') {
      show('idle');
      timer = setInterval(() => {
        if (cancelled) return;
        // blink then wave then back — keeps him alive
        show('blink');
        timeout = setTimeout(() => {
          if (cancelled) return;
          show('wave');
          timeout = setTimeout(() => {
            if (!cancelled) show('idle');
          }, 900);
        }, 180);
      }, 4200);
      return () => {
        cancelled = true;
        clearInterval(timer);
        if (timeout) clearTimeout(timeout);
      };
    }

    if (behavior === 'sleepy') {
      show('sleepy');
      return () => {
        cancelled = true;
      };
    }

    if (behavior === 'screen') {
      let closed = false;
      show('idle');
      timer = setInterval(() => {
        closed = !closed;
        show(closed ? 'blink' : 'idle');
      }, 220);
      timeout = setTimeout(() => {
        if (cancelled) return;
        clearInterval(timer);
        show('blink');
      }, 1400);
      return () => {
        cancelled = true;
        clearInterval(timer);
        if (timeout) clearTimeout(timeout);
      };
    }

    // walk / kick pebble — full 3D kick pose looping
    show('kick');
    const kickPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );
    kickPulse.start();
    return () => {
      cancelled = true;
      kickPulse.stop();
    };
  }, [behavior, bounce, fade]);

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [stageScale, stageScale * 1.02],
  });
  const kickY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const layers = [costume, hair, accessory].filter(Boolean);

  return (
    <View style={{ width: size, height: size + 16, alignItems: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          opacity: fade,
          transform: [{ translateY: kickY }, { scale }],
        }}
      >
        <Image source={poses[pose]} style={{ width: size, height: size, borderRadius: 24 }} resizeMode="cover" />

        {/* cosmetics still stack on the same 3D hero */}
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
      <View style={[styles.shadow, { width: size * 0.45 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1a2430',
    opacity: 0.25,
    marginTop: 2,
  },
});
