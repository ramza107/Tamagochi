import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

/**
 * Realtime WebGL Nuri — loads the cute polished character GLB only.
 * Behavior extras: sleepy tilt, walk pebble. No image slideshow, no relief mesh.
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
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2B3138');

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.2, 3.4);
  camera.lookAt(0, 0.15, 0);

  scene.add(new THREE.HemisphereLight('#fff6e8', '#3a4a3c', 1.05));
  const key = new THREE.DirectionalLight('#fff8ef', 1.35);
  key.position.set(1.8, 2.8, 2.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#b8d4ff', 0.45);
  fill.position.set(-2.2, 1.2, 1.0);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffb45a', 0.55);
  rim.position.set(0.2, 1.0, -2.2);
  scene.add(rim);
  // Warm bounce so amber frills / heart read clearly
  const heartLight = new THREE.PointLight('#ff9a3a', 1.1, 4.5, 2);
  heartLight.position.set(0, 0.15, 0.6);
  scene.add(heartLight);

  const stage = new THREE.Group();
  scene.add(stage);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 48),
    new THREE.MeshBasicMaterial({ color: '#11151a', transparent: true, opacity: 0.32 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.95;
  stage.add(shadow);

  // Runtime walk pebble (in case GLB pebble is nested awkwardly)
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.07, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.65, -0.9, 0.35);
  stage.add(pebble);

  let mixer: THREE.AnimationMixer | null = null;
  let modelRoot: THREE.Object3D | null = null;
  let ready = false;
  let behavior: Behavior = initialBehavior;
  let t = 0;
  let disposed = false;
  let raf = 0;
  const clock = new THREE.Clock();

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
    (gltf: GLTF) => {
      if (disposed) return;
      modelRoot = gltf.scene;
      modelRoot.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const std = m as THREE.MeshStandardMaterial;
            if (std && std.isMeshStandardMaterial) {
              std.envMapIntensity = 0.85;
              // Keep amber readable — clamp nuclear emissive from exporters
              if (std.emissive && std.emissiveIntensity != null) {
                const name = (std.name || '').toLowerCase();
                if (name.includes('amber') || name.includes('iris') || name.includes('heart') || name.includes('frill')) {
                  std.emissiveIntensity = Math.min(Math.max(std.emissiveIntensity, 0.9), 2.6);
                }
              }
              std.needsUpdate = true;
            }
          }
        }
        // Hide embedded pebble if present — we drive our own for walk
        if (obj.name === 'Pebble') {
          obj.visible = false;
        }
      });

      // Fit & center
      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.85 / maxDim;
      modelRoot.scale.setScalar(scale);
      modelRoot.position.sub(center.multiplyScalar(scale));
      modelRoot.position.y += 0.05;
      stage.add(modelRoot);

      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(modelRoot);
        for (const clip of gltf.animations) {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }
      }

      ready = true;
      renderer.render(scene, camera);
    },
    undefined,
    (err) => console.error('[Nuri3D] GLB load failed', err),
  );

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    t += dt;

    if (mixer) mixer.update(dt);

    // Soft stage sway / breath on top of clip (subtle)
    const breath = 1 + Math.sin(t * 2.1) * 0.012;
    stage.scale.set(breath, breath, breath);
    stage.rotation.y = Math.sin(t * 0.55) * 0.05;
    shadow.scale.set(1 / breath, 1, 1 / breath);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.26 + Math.sin(t * 2.1) * 0.04;
    heartLight.intensity = 0.95 + Math.sin(t * 3.2) * 0.25;

    if (behavior === 'walk') {
      const k = (t % 2) / 2;
      if (k < 0.35) {
        const p = k / 0.35;
        pebble.position.set(0.65 + p * 1.15, -0.9 + Math.sin(p * Math.PI) * 0.42, 0.35);
        pebble.rotation.z = p * 5;
        pebble.visible = true;
      } else {
        pebble.position.set(0.65, -0.9, 0.35);
      }
      // little hop on stage
      stage.position.y = Math.abs(Math.sin(t * 8)) * 0.04;
      stage.rotation.z = Math.sin(t * 8) * 0.03;
    } else {
      pebble.position.set(0.65, -0.9, 0.35);
      stage.position.y = 0;
      stage.rotation.z = 0;
    }

    if (behavior === 'sleepy') {
      stage.rotation.x = 0.12 + Math.sin(t * 1.0) * 0.025;
      stage.position.y = Math.sin(t * 1.0) * 0.01 - 0.02;
      if (mixer) mixer.timeScale = 0.55;
    } else if (behavior === 'screen') {
      stage.rotation.x = Math.sin(t * 6) * 0.02;
      if (mixer) mixer.timeScale = 1.15;
    } else {
      stage.rotation.x = 0;
      if (mixer) mixer.timeScale = 1;
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
      mixer?.stopAllAction();
      mixer = null;
      if (modelRoot) {
        modelRoot.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m?.dispose?.());
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
