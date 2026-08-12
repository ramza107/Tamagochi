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

type Handle = {
  setBehavior: (b: Behavior) => void;
  resize: (n: number) => void;
  dispose: () => void;
};

/**
 * Realtime Three.js mesh Nuri — continuously animated limbs/face.
 * Not Image pose swaps. Not textured photo planes.
 */
export function LivingNuri({ behavior, size = 320 }: Props) {
  const hostRef = useRef<View>(null);
  const handleRef = useRef<Handle | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    let raf = 0;

    const start = async () => {
      const node = hostRef.current as unknown as HTMLElement | null;
      if (!node || cancelled) return;

      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = '28px';
      node.innerHTML = '';
      node.appendChild(canvas);

      const { mountNuri3D } = await import('../nuri3d/mountNuri3D');
      if (cancelled) return;

      handleRef.current = mountNuri3D(canvas, size, behavior);
    };

    // wait one frame so RNW lays out the host (non-zero clientWidth)
    raf = requestAnimationFrame(() => {
      start().catch((e) => console.error('[LivingNuri]', e));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
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

  useEffect(() => {
    handleRef.current?.resize(size);
  }, [size]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>3D Nuri сейчас в веб-версии</Text>
      </View>
    );
  }

  return (
    <View
      ref={hostRef}
      style={{
        width: size,
        height: size,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#D9E8F2',
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fallbackText: {
    fontFamily: 'Manrope_500Medium',
    color: '#5A6B5E',
    padding: 16,
    textAlign: 'center',
  },
});
