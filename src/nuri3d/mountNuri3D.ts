import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  resize: (cssSize: number) => void;
  dispose: () => void;
};

export type NuriPoseUrls = Record<'idle' | 'sleepy' | 'blink' | 'wave' | 'kick', string>;
type Pose = keyof NuriPoseUrls;

export function mountNuri3D(
  canvas: HTMLCanvasElement,
  urls: NuriPoseUrls,
  cssSize: number,
  initialBehavior: Behavior = 'idle',
): NuriHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2B3138');

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0.15, 3.35);
  camera.lookAt(0, 0.05, 0);

  scene.add(new THREE.AmbientLight('#ffffff', 0.95));
  const key = new THREE.DirectionalLight('#ffffff', 0.55);
  key.position.set(2, 3, 4);
  scene.add(key);

  const root = new THREE.Group();
  scene.add(root);

  const geo = new THREE.PlaneGeometry(2.05, 2.05);
  const matA = new THREE.MeshBasicMaterial({ transparent: true });
  const matB = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  const planeA = new THREE.Mesh(geo, matA);
  const planeB = new THREE.Mesh(geo, matB);
  planeB.position.z = 0.01;
  root.add(planeA, planeB);

  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.08, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.9 }),
  );
  pebble.position.set(0.62, -0.95, 0.35);
  root.add(pebble);
  scene.add(new THREE.HemisphereLight('#fff', '#445', 0.4));

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  const textures = {} as Record<Pose, THREE.Texture>;
  let ready = false;
  let behavior: Behavior = initialBehavior;
  let current: Pose = 'idle';
  let frontA = true;
  let fading = false;
  let fadeK = 0;
  let t = 0;
  let disposed = false;
  let raf = 0;

  const applySize = (css: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(160, Math.floor(css));
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;
    renderer.setSize(px, px, false);
    // ensure drawing buffer is non-zero
    canvas.width = Math.floor(px * dpr);
    canvas.height = Math.floor(px * dpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(px, px, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  applySize(cssSize);

  const loadOne = (pose: Pose) =>
    new Promise<void>((resolve, reject) => {
      const url = urls[pose];
      if (!url) {
        reject(new Error(`missing url ${pose}`));
        return;
      }
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          textures[pose] = tex;
          resolve();
        },
        undefined,
        () => reject(new Error(`texture fail ${pose}: ${url}`)),
      );
    });

  Promise.all([
    loadOne('idle'),
    loadOne('sleepy'),
    loadOne('blink'),
    loadOne('wave'),
    loadOne('kick'),
  ])
    .then(() => {
      if (disposed) return;
      matA.map = textures.idle;
      matA.needsUpdate = true;
      matA.opacity = 1;
      ready = true;
      // force first frame visible
      renderer.render(scene, camera);
    })
    .catch((err) => {
      console.error('[Nuri3D]', err);
    });

  const crossTo = (pose: Pose) => {
    if (!ready || pose === current || fading) return;
    const tex = textures[pose];
    if (!tex) return;
    fading = true;
    fadeK = 0;
    if (frontA) {
      matB.map = tex;
      matB.opacity = 0;
      matB.needsUpdate = true;
    } else {
      matA.map = tex;
      matA.opacity = 0;
      matA.needsUpdate = true;
    }
    current = pose;
  };

  const desiredPose = (): Pose => {
    if (behavior === 'sleepy') return 'sleepy';
    if (behavior === 'walk') return 'kick';
    if (behavior === 'screen') return Math.sin(t * 9) > 0.15 ? 'blink' : 'idle';
    const c = t % 7;
    if (c > 5.55 && c < 5.8) return 'blink';
    if (c >= 5.8 && c < 6.65) return 'wave';
    return 'idle';
  };

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    t += 1 / 60;

    if (ready) crossTo(desiredPose());

    if (fading) {
      fadeK = Math.min(1, fadeK + 1 / 12);
      if (frontA) {
        matA.opacity = 1 - fadeK;
        matB.opacity = fadeK;
      } else {
        matB.opacity = 1 - fadeK;
        matA.opacity = fadeK;
      }
      if (fadeK >= 1) {
        fading = false;
        frontA = !frontA;
        if (frontA) matB.opacity = 0;
        else matA.opacity = 0;
      }
    }

    const breath = 1 + Math.sin(t * 2.15) * 0.02;
    root.scale.setScalar(breath);
    root.rotation.y = Math.sin(t * 0.75) * 0.05;
    root.position.y = Math.sin(t * 2.15) * 0.025;

    if (behavior === 'walk') {
      const k = (t % 2) / 2;
      if (k < 0.35) {
        const p = k / 0.35;
        pebble.position.set(0.62 + p * 1.15, -0.95 + Math.sin(p * Math.PI) * 0.4, 0.35);
        pebble.rotation.z = p * 5;
      } else {
        pebble.position.set(0.62, -0.95, 0.35);
      }
    } else {
      pebble.position.set(0.62, -0.95, 0.35);
    }

    renderer.render(scene, camera);
  };
  tick();

  return {
    setBehavior: (b) => {
      behavior = b;
    },
    resize: applySize,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      Object.values(textures).forEach((tex) => tex.dispose());
      geo.dispose();
      matA.dispose();
      matB.dispose();
      pebble.geometry.dispose();
      (pebble.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
