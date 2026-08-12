import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

/**
 * Realtime 3D Nuri (Three.js) — continuously animated character, not image swaps.
 * Web-first (GitHub Pages / Expo web).
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
      canvas.style.borderRadius = '24px';

      // RNW View -> DOM node
      const node = hostRef.current as unknown as HTMLElement | null;
      if (!node) return;
      node.innerHTML = '';
      node.appendChild(canvas);

      const handle = mountNuri3D(canvas, behavior);
      handleRef.current = handle;
    })();

    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
      const node = hostRef.current as unknown as HTMLElement | null;
      if (node) node.innerHTML = '';
    };
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setBehavior(behavior);
  }, [behavior]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>3D Nuri сейчас в веб-версии</Text>
      </View>
    );
  }

  return <View ref={hostRef} style={{ width: size, height: size }} />;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fallbackText: {
    fontFamily: 'Manrope_500Medium',
    color: '#5A6B5E',
    padding: 16,
    textAlign: 'center',
  },
});
