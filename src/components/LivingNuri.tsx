import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';

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
 * Beautiful rendered Nuri that always shows + continuous motion.
 * No fragile WebGL texture loading — Image is reliable on Pages.
 */
export function LivingNuri({ behavior, stage, size = 320 }: Props) {
  const [pose, setPose] = useState<Pose>('idle');
  const [prevPose, setPrevPose] = useState<Pose>('idle');
  const breath = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const stageScale = 0.96 + stage * 0.02;

  // always alive
  useEffect(() => {
    const a = Animated.loop(
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
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [bob, breath]);

  const switchPose = (next: Pose) => {
    setPose((cur) => {
      if (cur === next) return cur;
      setPrevPose(cur);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      return next;
    });
  };

  // behavior director
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (behavior === 'sleepy') {
      switchPose('sleepy');
      return () => {
        alive = false;
      };
    }

    if (behavior === 'walk') {
      switchPose('kick');
      return () => {
        alive = false;
      };
    }

    if (behavior === 'screen') {
      let closed = false;
      switchPose('idle');
      timer = setInterval(() => {
        if (!alive) return;
        closed = !closed;
        switchPose(closed ? 'blink' : 'idle');
      }, 240);
      timeout = setTimeout(() => {
        if (!alive) return;
        clearInterval(timer);
        switchPose('blink');
      }, 1600);
      return () => {
        alive = false;
        clearInterval(timer);
        if (timeout) clearTimeout(timeout);
      };
    }

    // idle life: blink + wave
    switchPose('idle');
    timer = setInterval(() => {
      if (!alive) return;
      switchPose('blink');
      timeout = setTimeout(() => {
        if (!alive) return;
        switchPose('wave');
        timeout = setTimeout(() => {
          if (alive) switchPose('idle');
        }, 900);
      }, 160);
    }, 4500);

    return () => {
      alive = false;
      clearInterval(timer);
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behavior]);

  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [stageScale, stageScale * 1.025],
  });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = bob.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <View style={{ width: size, height: size + 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateY }, { scale }, { rotate }],
        }}
      >
        {/* previous pose under current for soft crossfade feel */}
        <Image
          source={poses[prevPose]}
          style={[styles.img, { width: size, height: size, opacity: 0.35 }]}
          resizeMode="cover"
        />
        <Animated.Image
          source={poses[pose]}
          style={[styles.img, { width: size, height: size, opacity: fade }]}
          resizeMode="cover"
        />
      </Animated.View>
      <View style={[styles.shadow, { width: size * 0.42 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 28,
  },
  shadow: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1a2430',
    opacity: 0.28,
    marginTop: 2,
  },
});
