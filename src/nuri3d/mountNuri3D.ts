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

/**
 * Living beauty stage: one continuous character cutout (your reference),
 * gently animated in WebGL — breath, sway, behavior tilts.
 * No stacked-sphere blob mesh.
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
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#E8EEF2');

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0.08, 3.05);
  camera.lookAt(0, 0.05, 0);

  scene.add(new THREE.AmbientLight('#ffffff', 1.05));
  const key = new THREE.DirectionalLight('#ffffff', 0.28);
  key.position.set(1.2, 2.2, 2.5);
  scene.add(key);

  const root = new THREE.Group();
  scene.add(root);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 48),
    new THREE.MeshBasicMaterial({ color: '#9aa6b0', transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.05;
  root.add(shadow);

  // Soft card with slight curve feel via high-seg plane (still one image = one silhouette)
  const geo = new THREE.PlaneGeometry(2.2, 2.2, 24, 24);
  // gentle belly bulge in z for a touch of volume without breaking the art
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const bulge = Math.max(0, 1 - r / 1.15);
    pos.setZ(i, bulge * bulge * 0.12);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const card = new THREE.Mesh(geo, mat);
  root.add(card);

  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.06, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.62, -0.95, 0.25);
  root.add(pebble);
  scene.add(new THREE.HemisphereLight('#fff', '#c5d0d8', 0.25));

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let disposed = false;
  let raf = 0;
  let ready = false;

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
      tex.anisotropy = 4;
      tex.premultiplyAlpha = true;
      mat.map = tex;
      mat.needsUpdate = true;
      ready = true;
      renderer.render(scene, camera);
    },
    undefined,
    (err) => console.error('[Nuri3D] texture fail', err),
  );

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    t += 1 / 60;

    const breath = 1 + Math.sin(t * 2.1) * 0.016;
    root.scale.set(breath, breath, 1);
    root.rotation.y = Math.sin(t * 0.65) * 0.05;
    root.position.y = Math.sin(t * 2.1) * 0.018;
    shadow.scale.set(1 / breath, 1, 1);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 2.1) * 0.03;

    if (behavior === 'sleepy') {
      root.rotation.x = 0.08 + Math.sin(t * 1.05) * 0.02;
    } else if (behavior === 'screen') {
      root.rotation.x = Math.sin(t * 7) * 0.015;
    } else {
      root.rotation.x = 0;
    }

    if (behavior === 'walk') {
      const k = (t % 2) / 2;
      if (k < 0.35) {
        const p = k / 0.35;
        pebble.position.set(0.62 + p * 1.05, -0.95 + Math.sin(p * Math.PI) * 0.38, 0.25);
        pebble.rotation.z = p * 5;
      } else {
        pebble.position.set(0.62, -0.95, 0.25);
      }
      root.position.x = Math.sin(t * 3) * 0.03;
    } else {
      pebble.position.set(0.62, -0.95, 0.25);
      root.position.x = 0;
    }

    // idle micro-wave: slight tilt
    if (behavior === 'idle') {
      const c = t % 7;
      if (c > 5.6 && c < 6.5) {
        root.rotation.z = Math.sin(((c - 5.6) / 0.9) * Math.PI) * 0.06;
      } else {
        root.rotation.z = 0;
      }
    } else {
      root.rotation.z = 0;
    }

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
