import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const idlePng = require('../../assets/nuri3d/cutouts/idle.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sleepyPng = require('../../assets/nuri3d/cutouts/sleepy.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const blinkPng = require('../../assets/nuri3d/cutouts/blink.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wavePng = require('../../assets/nuri3d/cutouts/wave.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const kickPng = require('../../assets/nuri3d/cutouts/kick.png');

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  resize: (cssSize: number) => void;
  dispose: () => void;
};

type Pose = 'idle' | 'sleepy' | 'blink' | 'wave' | 'kick';

function assetUrl(mod: unknown): string {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod === 'object' && 'default' in (mod as object)) {
    return assetUrl((mod as { default: unknown }).default);
  }
  if (mod && typeof mod === 'object' && 'uri' in (mod as object)) {
    return String((mod as { uri: string }).uri);
  }
  return String(mod);
}

/**
 * Clean WebGL stage: the beauty cutout as a living textured mesh
 * (breath / sway / soft crossfades). No sphere chibi. No broken relief GLB.
 */
export function mountNuri3D(
  canvas: HTMLCanvasElement,
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2B3138');

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0.05, 3.15);
  camera.lookAt(0, 0.02, 0);

  scene.add(new THREE.AmbientLight('#ffffff', 1.0));
  const key = new THREE.DirectionalLight('#ffffff', 0.35);
  key.position.set(1.5, 2.5, 3);
  scene.add(key);

  const root = new THREE.Group();
  scene.add(root);

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 48),
    new THREE.MeshBasicMaterial({ color: '#11151a', transparent: true, opacity: 0.35 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.05;
  root.add(shadow);

  const geo = new THREE.PlaneGeometry(2.15, 2.15);
  const matA = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const matB = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const planeA = new THREE.Mesh(geo, matA);
  const planeB = new THREE.Mesh(geo, matB);
  planeB.position.z = 0.01;
  root.add(planeA, planeB);

  // Tiny 3D pebble for walk behavior
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.07, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.55, -0.95, 0.3);
  root.add(pebble);
  scene.add(new THREE.HemisphereLight('#fff', '#445', 0.35));

  const loader = new THREE.TextureLoader();
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
    const px = Math.max(160, Math.floor(css || 320));
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;
    renderer.setPixelRatio(dpr);
    renderer.setSize(px, px, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  applySize(cssSize);

  const loadOne = (pose: Pose, url: string) =>
    new Promise<void>((resolve, reject) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          tex.premultiplyAlpha = true;
          textures[pose] = tex;
          resolve();
        },
        undefined,
        () => reject(new Error(`texture ${pose}`)),
      );
    });

  Promise.all([
    loadOne('idle', assetUrl(idlePng)),
    loadOne('sleepy', assetUrl(sleepyPng)),
    loadOne('blink', assetUrl(blinkPng)),
    loadOne('wave', assetUrl(wavePng)),
    loadOne('kick', assetUrl(kickPng)),
  ])
    .then(() => {
      if (disposed) return;
      matA.map = textures.idle;
      matA.needsUpdate = true;
      matA.opacity = 1;
      ready = true;
      renderer.render(scene, camera);
    })
    .catch((err) => console.error('[Nuri3D]', err));

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
      fadeK = Math.min(1, fadeK + 1 / 14);
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

    const breath = 1 + Math.sin(t * 2.15) * 0.018;
    root.scale.set(breath, breath, 1);
    root.rotation.y = Math.sin(t * 0.7) * 0.06;
    root.position.y = Math.sin(t * 2.15) * 0.02;
    shadow.scale.set(1 / breath, 1, 1);
    shadow.material.opacity = 0.28 + Math.sin(t * 2.15) * 0.04;

    if (behavior === 'walk') {
      const k = (t % 2) / 2;
      if (k < 0.35) {
        const p = k / 0.35;
        pebble.position.set(0.55 + p * 1.1, -0.95 + Math.sin(p * Math.PI) * 0.4, 0.3);
        pebble.rotation.z = p * 5;
      } else {
        pebble.position.set(0.55, -0.95, 0.3);
      }
    } else {
      pebble.position.set(0.55, -0.95, 0.3);
    }

    if (behavior === 'sleepy') {
      root.rotation.x = 0.06 + Math.sin(t * 1.1) * 0.02;
    } else {
      root.rotation.x = 0;
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
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
