import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dragonPng = require('../../assets/nuri3d/cutouts/dragon.png');

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
 * Living stage: one continuous beauty cutout (full silhouette),
 * soft spring motion — no fractured relief mesh.
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#E8EEF2');

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0.06, 3.0);
  camera.lookAt(0, 0.04, 0);

  scene.add(new THREE.AmbientLight('#ffffff', 1.0));
  const key = new THREE.DirectionalLight('#ffffff', 0.22);
  key.position.set(1.1, 2.0, 2.4);
  scene.add(key);

  const root = new THREE.Group();
  scene.add(root);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 64),
    new THREE.MeshBasicMaterial({ color: '#9aa6b0', transparent: true, opacity: 0.24 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.02;
  root.add(shadow);

  // Soft continuous card — slight belly bulge, one silhouette
  const geo = new THREE.PlaneGeometry(2.15, 2.15, 48, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const bulge = Math.max(0, 1 - r / 1.2);
    pos.setZ(i, bulge * bulge * 0.1);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    premultipliedAlpha: true,
  });
  const card = new THREE.Mesh(geo, mat);
  root.add(card);

  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.055, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.64, -0.96, 0.28);
  root.add(pebble);
  scene.add(new THREE.HemisphereLight('#fff', '#c5d0d8', 0.2));

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let disposed = false;
  let raf = 0;
  let ready = false;

  const pose = { x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 };
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

  new THREE.TextureLoader().load(
    assetUrl(dragonPng),
    (tex) => {
      if (disposed) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.premultiplyAlpha = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      mat.map = tex;
      mat.needsUpdate = true;
      ready = true;
      onReady?.();
      renderer.render(scene, camera);
    },
    undefined,
    (err) => console.error('[Nuri3D] texture fail', err),
  );

  let last = performance.now();
  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    target.scale = 1 + Math.sin(t * 1.75) * 0.015;
    target.y = Math.sin(t * 1.75) * 0.016;
    target.rotY = Math.sin(t * 0.5) * 0.045;
    target.rotZ = Math.sin(t * 0.35) * 0.02;
    target.rotX = Math.sin(t * 0.4) * 0.015;
    target.x = 0;

    if (behavior === 'sleepy') {
      target.rotX = 0.09 + Math.sin(t * 0.85) * 0.02;
      target.scale = 1 + Math.sin(t * 1.05) * 0.01;
      target.y = Math.sin(t * 1.05) * 0.01 - 0.035;
    } else if (behavior === 'screen') {
      target.rotX = -0.03 + Math.sin(t * 5.2) * 0.01;
    } else if (behavior === 'walk') {
      const k = (t % 2.2) / 2.2;
      if (k < 0.4) {
        const p = k / 0.4;
        pebble.position.set(0.64 + p * 1.0, -0.96 + Math.sin(p * Math.PI) * 0.34, 0.28);
        pebble.rotation.z = p * 5;
      } else {
        pebble.position.set(0.64, -0.96, 0.28);
      }
      target.x = Math.sin(t * 2.5) * 0.03;
      target.rotZ = Math.sin(t * 2.5) * 0.035;
    } else {
      pebble.position.set(0.64, -0.96, 0.28);
      const c = t % 7.2;
      if (c > 5.7 && c < 6.7) {
        const p = (c - 5.7) / 1.0;
        target.rotZ = Math.sin(p * Math.PI) * 0.07;
        target.rotY = 0.04 + Math.sin(p * Math.PI) * 0.04;
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
    root.scale.set(pose.scale, pose.scale, 1);
    shadow.scale.set(1 / pose.scale, 1, 1);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.2 + (pose.scale - 1) * 3.5;

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
      mat.map?.dispose();
      geo.dispose();
      mat.dispose();
      pebble.geometry.dispose();
      (pebble.material as THREE.Material).dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
