import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Behavior } from '../logic/behavior';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nuriGlb = require('../../assets/nuri3d/nuri.glb');

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  resize: (cssSize: number) => void;
  dispose: () => void;
};

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

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

/**
 * Soft textured dragon relief — one continuous mesh + springy motion.
 */
export function mountNuri3D(
  canvas: HTMLCanvasElement,
  cssSize: number,
  initialBehavior: Behavior = 'idle',
  onReady?: () => void,
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
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#E6EDF2');
  scene.fog = new THREE.Fog('#E6EDF2', 4.5, 8.5);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0.12, 3.15);
  camera.lookAt(0, 0.08, 0);

  scene.add(new THREE.HemisphereLight('#f7fbff', '#c5d0d8', 0.95));
  const key = new THREE.DirectionalLight('#ffffff', 0.55);
  key.position.set(1.4, 2.4, 2.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#d9e8f5', 0.35);
  rim.position.set(-1.6, 1.2, -1.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#fff5ef', 0.22);
  fill.position.set(-0.8, 0.4, 2.4);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 64),
    new THREE.MeshBasicMaterial({ color: '#8f9aa5', transparent: true, opacity: 0.26 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.08;
  root.add(shadow);

  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.055, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.68, -0.98, 0.28);
  root.add(pebble);

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let disposed = false;
  let raf = 0;
  let ready = false;
  let pet: THREE.Object3D | null = null;

  const pose = {
    x: 0,
    y: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 1,
  };
  const target = { ...pose };

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

  const loader = new GLTFLoader();
  loader.load(
    assetUrl(nuriGlb),
    (gltf) => {
      if (disposed) return;
      pet = gltf.scene;
      pet.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial;
          if (std.map) {
            std.map.colorSpace = THREE.SRGBColorSpace;
            std.map.anisotropy = 8;
          }
          std.transparent = true;
          std.alphaTest = 0.22;
          std.depthWrite = true;
          std.side = THREE.FrontSide;
          std.roughness = Math.min(std.roughness ?? 0.55, 0.58);
          std.metalness = 0;
          std.envMapIntensity = 0.25;
          // Avoid white sparkle from leftover fringe
          if (std.map) {
            std.map.premultiplyAlpha = false;
          }
          std.needsUpdate = true;
        }
      });
      const box = new THREE.Box3().setFromObject(pet);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
      const s = 2.05 / maxDim;
      pet.scale.setScalar(s);
      box.setFromObject(pet);
      const center = box.getCenter(new THREE.Vector3());
      pet.position.sub(center);
      pet.position.y += 0.05;
      root.add(pet);
      ready = true;
      onReady?.();
      renderer.render(scene, camera);
    },
    undefined,
    (err) => console.error('[Nuri3D] glb fail', err),
  );

  let last = performance.now();
  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    const breath = 1 + Math.sin(t * 1.85) * 0.018;
    target.scale = breath;
    target.y = Math.sin(t * 1.85) * 0.02;
    target.rotY = Math.sin(t * 0.55) * 0.07;
    target.rotZ = Math.sin(t * 0.38) * 0.025;
    target.rotX = Math.sin(t * 0.42) * 0.02;
    target.x = 0;

    if (behavior === 'sleepy') {
      target.rotX = 0.1 + Math.sin(t * 0.9) * 0.025;
      target.scale = 1 + Math.sin(t * 1.1) * 0.012;
      target.y = Math.sin(t * 1.1) * 0.012 - 0.04;
    } else if (behavior === 'screen') {
      target.rotX = -0.04 + Math.sin(t * 5.5) * 0.012;
      target.rotY = Math.sin(t * 0.8) * 0.04;
    } else if (behavior === 'walk') {
      const k = (t % 2.2) / 2.2;
      if (k < 0.4) {
        const p = k / 0.4;
        pebble.position.set(0.68 + p * 1.0, -0.98 + Math.sin(p * Math.PI) * 0.36, 0.28);
        pebble.rotation.z = p * 5;
      } else {
        pebble.position.set(0.68, -0.98, 0.28);
      }
      target.x = Math.sin(t * 2.6) * 0.035;
      target.rotZ = Math.sin(t * 2.6) * 0.04;
    } else {
      pebble.position.set(0.68, -0.98, 0.28);
      const c = t % 7.2;
      if (c > 5.7 && c < 6.7) {
        const p = (c - 5.7) / 1.0;
        target.rotZ = Math.sin(p * Math.PI) * 0.08;
        target.rotY = 0.05 + Math.sin(p * Math.PI) * 0.05;
      }
    }

    pose.x = damp(pose.x, target.x, 4.5, dt);
    pose.y = damp(pose.y, target.y, 5.5, dt);
    pose.rotX = damp(pose.rotX, target.rotX, 5.0, dt);
    pose.rotY = damp(pose.rotY, target.rotY, 4.2, dt);
    pose.rotZ = damp(pose.rotZ, target.rotZ, 5.0, dt);
    pose.scale = damp(pose.scale, target.scale, 6.0, dt);

    root.position.set(pose.x, pose.y, 0);
    root.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    root.scale.set(pose.scale, pose.scale, pose.scale);
    shadow.scale.set(1 / pose.scale, 1, 1);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.2 + (pose.scale - 1) * 4;

    if (ready) renderer.render(scene, camera);
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
      if (pet) {
        pet.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const std = m as THREE.MeshStandardMaterial;
            std.map?.dispose();
            std.dispose();
          }
        });
      }
      pebble.geometry.dispose();
      (pebble.material as THREE.Material).dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
