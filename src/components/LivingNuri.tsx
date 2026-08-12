import { useEffect, useRef } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

const poseModules = {
  idle: require('../../assets/nuri3d/idle.jpg'),
  sleepy: require('../../assets/nuri3d/sleepy.jpg'),
  blink: require('../../assets/nuri3d/blink.jpg'),
  wave: require('../../assets/nuri3d/wave.jpg'),
  kick: require('../../assets/nuri3d/kick.jpg'),
};

function uriOf(mod: number) {
  const src = Image.resolveAssetSource(mod);
  return src?.uri ?? '';
}

/**
 * The pretty rendered Nuri — same look as the good pictures —
 * living in a realtime 3D stage (breath/sway + behavior poses).
 */
export function LivingNuri({ behavior, size = 320 }: Props) {
  const hostRef = useRef<View>(null);
  const handleRef = useRef<{ setBehavior: (b: Behavior) => void; dispose: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;

    (async () => {
      const { mountNuri3D } = await import('../nuri3d/mountNuri3D');
      if (cancelled) return;

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.borderRadius = '28px';

      const node = hostRef.current as unknown as HTMLElement | null;
      if (!node) return;
      node.innerHTML = '';
      node.appendChild(canvas);

      const handle = mountNuri3D(
        canvas,
        {
          idle: uriOf(poseModules.idle),
          sleepy: uriOf(poseModules.sleepy),
          blink: uriOf(poseModules.blink),
          wave: uriOf(poseModules.wave),
          kick: uriOf(poseModules.kick),
        },
        behavior,
      );
      handleRef.current = handle;
    })();

    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
      const node = hostRef.current as unknown as HTMLElement | null;
      if (node) node.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setBehavior(behavior);
  }, [behavior]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Image source={poseModules.idle} style={{ width: size, height: size, borderRadius: 28 }} />
      </View>
    );
  }

  return <View ref={hostRef} style={{ width: size, height: size }} />;
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
