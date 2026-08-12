import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';
import { poseDataUrls } from '../nuri3d/poseData';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

/**
 * Realtime WebGL Nuri using the beautiful renders as textures
 * (embedded data-URLs so GitHub Pages never 404s them).
 */
export function LivingNuri({ behavior, size = 320 }: Props) {
  const boxRef = useRef<View>(null);
  const handleRef = useRef<{
    setBehavior: (b: Behavior) => void;
    resize: (n: number) => void;
    dispose: () => void;
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;

    const start = async () => {
      const host = boxRef.current as unknown as HTMLElement | null;
      if (!host || cancelled) return;

      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = '28px';
      host.innerHTML = '';
      host.appendChild(canvas);

      const { mountNuri3D } = await import('../nuri3d/mountNuri3D');
      if (cancelled) return;

      handleRef.current = mountNuri3D(canvas, { ...poseDataUrls }, size, behavior);
    };

    const raf = requestAnimationFrame(() => {
      start().catch((e) => console.error('[LivingNuri]', e));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      handleRef.current?.dispose();
      handleRef.current = null;
      const host = boxRef.current as unknown as HTMLElement | null;
      if (host) host.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setBehavior(behavior);
  }, [behavior]);

  useEffect(() => {
    handleRef.current?.resize(size);
  }, [size]);

  return (
    <View
      ref={boxRef}
      style={{
        width: size,
        height: size,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#2B3138',
      }}
    />
  );
}
