import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Behavior } from '../logic/behavior';

// Metro resolves these to URLs on web.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nuriGlb = require('../../assets/nuri3d/nuri.glb');
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
 * Realtime WebGL Nuri from a Blender relief GLB (beauty cutout as textured mesh).
 * Continuously animated — not React Image, not sphere chibi.
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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2B3138');
  scene.fog = new THREE.Fog('#2B3138', 6, 14);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0.35, 4.2);
  camera.lookAt(0, 0.15, 0);

  scene.add(new THREE.HemisphereLight('#f7f1e8', '#2a3038', 0.95));
  const key = new THREE.DirectionalLight('#fff6ea', 1.55);
  key.position.set(2.4, 4.2, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9ecbff', 0.45);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffd2a8', 0.35);
  fill.position.set(-2, 1.2, 2.5);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 64),
    new THREE.MeshStandardMaterial({ color: '#3A424C', roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.05;
  ground.receiveShadow = true;
  scene.add(ground);

  const stage = new THREE.Group();
  scene.add(stage);

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let disposed = false;
  let raf = 0;
  let mixer: THREE.AnimationMixer | null = null;
  let root: THREE.Object3D | null = null;
  let bodyMat: THREE.MeshStandardMaterial | null = null;
  let pebble: THREE.Object3D | null = null;
  const clock = new THREE.Clock();

  const texLoader = new THREE.TextureLoader();
  const poseTex = {} as Record<Pose, THREE.Texture>;

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

  const loadTex = (pose: Pose, url: string) =>
    new Promise<void>((resolve, reject) => {
      texLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.flipY = false;
          tex.anisotropy = 4;
          poseTex[pose] = tex;
          resolve();
        },
        undefined,
        () => reject(new Error(`tex ${pose}`)),
      );
    });

  const setPose = (pose: Pose) => {
    if (!bodyMat || !poseTex[pose]) return;
    bodyMat.map = poseTex[pose];
    bodyMat.needsUpdate = true;
  };

  const desiredPose = (): Pose => {
    if (behavior === 'sleepy') return 'sleepy';
    if (behavior === 'walk') return 'kick';
    if (behavior === 'screen') return Math.sin(t * 10) > 0.2 ? 'blink' : 'idle';
    const c = t % 7.2;
    if (c > 5.6 && c < 5.85) return 'blink';
    if (c >= 5.85 && c < 6.7) return 'wave';
    return 'idle';
  };

  Promise.all([
    loadTex('idle', assetUrl(idlePng)),
    loadTex('sleepy', assetUrl(sleepyPng)),
    loadTex('blink', assetUrl(blinkPng)),
    loadTex('wave', assetUrl(wavePng)),
    loadTex('kick', assetUrl(kickPng)),
    new Promise<void>((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        assetUrl(nuriGlb),
        (gltf) => {
          if (disposed) return;
          root = gltf.scene;
          root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                const mat = m as THREE.MeshStandardMaterial;
                if (mat.map) {
                  mat.map.colorSpace = THREE.SRGBColorSpace;
                  mat.map.flipY = false;
                  bodyMat = mat;
                  mat.transparent = true;
                  mat.alphaTest = 0.12;
                }
                if (mat.emissive) {
                  mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.8);
                }
              });
            }
            if (obj.name === 'Pebble') pebble = obj;
          });
          root.scale.setScalar(1.15);
          root.position.y = -0.15;
          stage.add(root);

          if (gltf.animations?.length) {
            mixer = new THREE.AnimationMixer(root);
            gltf.animations.forEach((clip) => {
              const action = mixer!.clipAction(clip);
              action.play();
            });
          }
          setPose('idle');
          resolve();
        },
        undefined,
        (err) => reject(err),
      );
    }),
  ]).catch((e) => console.error('[Nuri3D]', e));

  let lastPose: Pose = 'idle';

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    t += dt;
    mixer?.update(dt);

    const pose = desiredPose();
    if (pose !== lastPose) {
      setPose(pose);
      lastPose = pose;
    }

    // Extra live motion on top of GLB clips
    stage.rotation.y = Math.sin(t * 0.7) * 0.08;
    stage.position.y = Math.sin(t * 2.1) * 0.02;
    const breath = 1 + Math.sin(t * 2.15) * 0.018;
    stage.scale.set(breath, breath, breath);

    if (behavior === 'sleepy') {
      stage.rotation.x = 0.12 + Math.sin(t * 1.1) * 0.04;
    } else {
      stage.rotation.x = Math.sin(t * 0.9) * 0.02;
    }

    if (behavior === 'walk' && pebble) {
      const k = (t % 2) / 2;
      if (k < 0.4) {
        const p = k / 0.4;
        pebble.position.x = 0.5 + p * 1.1;
        pebble.position.z = -0.9 + Math.sin(p * Math.PI) * 0.45;
        pebble.rotation.z = p * 5;
      }
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
      mixer?.stopAllAction();
      Object.values(poseTex).forEach((tex) => tex.dispose());
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          const m = mesh.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose();
        }
      });
    },
  };
}
