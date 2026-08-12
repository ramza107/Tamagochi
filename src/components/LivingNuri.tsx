import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const idleCutout = require('../../assets/nuri3d/nuri_preview.png');

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
 * WebGL GLB Nuri with an always-visible beauty cutout underneath,
 * so the stage is never an empty dark box if WebGL/GLB fails.
 */
export function LivingNuri({ behavior, size = 320 }: Props) {
  const hostRef = useRef<View>(null);
  const handleRef = useRef<Handle | null>(null);
  const [webglOk, setWebglOk] = useState(false);

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
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      // clear only previous canvases, keep layout
      node.querySelectorAll('canvas').forEach((c) => c.remove());
      node.appendChild(canvas);

      try {
        const { mountNuri3D } = await import('../nuri3d/mountNuri3D');
        if (cancelled) return;
        handleRef.current = mountNuri3D(canvas, size, behavior);
        setWebglOk(true);
      } catch (e) {
        console.error('[LivingNuri]', e);
        setWebglOk(false);
        canvas.remove();
      }
    };

    raf = requestAnimationFrame(() => {
      start().catch((e) => {
        console.error('[LivingNuri]', e);
        setWebglOk(false);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      handleRef.current?.dispose();
      handleRef.current = null;
      const node = hostRef.current as unknown as HTMLElement | null;
      if (node) node.querySelectorAll('canvas').forEach((c) => c.remove());
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
        <Image source={idleCutout} style={{ width: size, height: size }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#E8EEF2',
      }}
    >
      {/* Always-on beauty poster so stage is never empty */}
      <Image
        source={idleCutout}
        style={[
          StyleSheet.absoluteFillObject,
          { width: size, height: size, opacity: webglOk ? 0 : 1 },
        ]}
        resizeMode="contain"
      />
      <View ref={hostRef} style={StyleSheet.absoluteFillObject} />
      {!webglOk ? (
        <Text style={styles.loadingHint}>Загрузка 3D Nuri…</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#2B3138',
  },
  loadingHint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
});
