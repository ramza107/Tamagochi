import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  dispose: () => void;
};

export type NuriPoseUrls = {
  idle: string;
  sleepy: string;
  blink: string;
  wave: string;
  kick: string;
};

type Pose = keyof NuriPoseUrls;

/**
 * Beautiful rendered Nuri (the pretty pictures) living in a realtime 3D stage:
 * continuous breath/sway + pose crossfades + real 3D pebble kick.
 */
export function mountNuri3D(
  canvas: HTMLCanvasElement,
  urls: NuriPoseUrls,
  initialBehavior: Behavior = 'idle',
): NuriHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2B3138');
  scene.fog = new THREE.Fog('#2B3138', 6, 14);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0.2, 3.6);
  camera.lookAt(0, 0.05, 0);

  const hemi = new THREE.HemisphereLight('#fff2e8', '#3a4550', 0.9);
  const key = new THREE.DirectionalLight('#ffffff', 1.3);
  key.position.set(2, 4, 3);
  key.castShadow = true;
  const rim = new THREE.DirectionalLight('#9ecbff', 0.4);
  rim.position.set(-3, 2, -1);
  scene.add(hemi, key, rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 64),
    new THREE.MeshStandardMaterial({ color: '#3A424C', roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.05;
  ground.receiveShadow = true;
  scene.add(ground);

  const root = new THREE.Group();
  root.position.y = -0.05;
  scene.add(root);

  // two planes for crossfade between beautiful renders
  const geo = new THREE.PlaneGeometry(2.1, 2.1);
  const matA = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const matB = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const planeA = new THREE.Mesh(geo, matA);
  const planeB = new THREE.Mesh(geo, matB);
  planeA.position.z = 0.01;
  planeB.position.z = 0.02;
  root.add(planeA, planeB);

  // soft contact shadow under character
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 32),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -1.04;
  root.add(contact);

  // real 3D pebble for walk behavior
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.09, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.92 }),
  );
  pebble.position.set(0.55, -1.0, 0.45);
  pebble.castShadow = true;
  root.add(pebble);

  const loader = new THREE.TextureLoader();
  const textures: Partial<Record<Pose, THREE.Texture>> = {};
  const loadTex = (pose: Pose) =>
    new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(
        urls[pose],
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          textures[pose] = tex;
          resolve(tex);
        },
        undefined,
        reject,
      );
    });

  let ready = false;
  let frontIsA = true;
  let currentPose: Pose = 'idle';
  let behavior: Behavior = initialBehavior;
  let t = 0;
  let poseTimer = 0;
  let disposed = false;
  let raf = 0;
  let fading = false;
  let fadeT = 0;
  let pendingPose: Pose | null = null;

  Promise.all([
    loadTex('idle'),
    loadTex('sleepy'),
    loadTex('blink'),
    loadTex('wave'),
    loadTex('kick'),
  ]).then(() => {
    if (disposed) return;
    matA.map = textures.idle!;
    matA.needsUpdate = true;
    ready = true;
  });

  const showPose = (pose: Pose) => {
    if (!ready || pose === currentPose || fading) {
      pendingPose = pose;
      return;
    }
    const next = textures[pose];
    if (!next) return;
    fading = true;
    fadeT = 0;
    pendingPose = null;
    if (frontIsA) {
      matB.map = next;
      matB.opacity = 0;
      matB.needsUpdate = true;
    } else {
      matA.map = next;
      matA.opacity = 0;
      matA.needsUpdate = true;
    }
    currentPose = pose;
  };

  const setSize = () => {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 320;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  setSize();

  const pickPoseForBehavior = (): Pose => {
    if (behavior === 'sleepy') return 'sleepy';
    if (behavior === 'walk') return 'kick';
    if (behavior === 'screen') {
      // blink rhythm
      return Math.sin(t * 10) > 0 ? 'blink' : 'idle';
    }
    // idle life cycle: mostly idle, occasional blink/wave
    const cycle = t % 7;
    if (cycle > 5.6 && cycle < 5.85) return 'blink';
    if (cycle > 5.85 && cycle < 6.7) return 'wave';
    return 'idle';
  };

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    t += 1 / 60;
    poseTimer += 1 / 60;

    if (ready) {
      const desired = pickPoseForBehavior();
      if (desired !== currentPose && !fading) showPose(desired);
      if (pendingPose && !fading && pendingPose !== currentPose) showPose(pendingPose);
    }

    // crossfade
    if (fading) {
      fadeT += 1 / 60;
      const k = Math.min(1, fadeT / 0.18);
      if (frontIsA) {
        matA.opacity = 1 - k;
        matB.opacity = k;
      } else {
        matB.opacity = 1 - k;
        matA.opacity = k;
      }
      if (k >= 1) {
        fading = false;
        frontIsA = !frontIsA;
        if (frontIsA) matB.opacity = 0;
        else matA.opacity = 0;
      }
    }

    // continuous life — same beautiful character always on screen
    const breath = 1 + Math.sin(t * 2.2) * 0.018;
    root.scale.set(breath, breath, breath);
    root.rotation.y = Math.sin(t * 0.7) * 0.06;
    root.position.y = -0.05 + Math.sin(t * 2.2) * 0.02;
    contact.scale.setScalar(0.95 + Math.sin(t * 2.2) * 0.04);

    // pebble kick when walking
    if (behavior === 'walk') {
      const cycle = t % 2.0;
      if (cycle < 0.55) {
        const k = cycle / 0.55;
        pebble.position.set(0.55 + k * 1.2, -1.0 + Math.sin(k * Math.PI) * 0.45, 0.45);
        pebble.rotation.z = k * 5;
        pebble.visible = true;
      } else {
        pebble.position.set(0.55, -1.0, 0.45);
      }
    } else {
      pebble.position.set(0.55, -1.0, 0.45);
      pebble.rotation.z = t * 0.2;
    }

    renderer.render(scene, camera);
  };

  tick();

  return {
    setBehavior: (b) => {
      behavior = b;
      poseTimer = 0;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      Object.values(textures).forEach((tex) => tex?.dispose());
      geo.dispose();
      matA.dispose();
      matB.dispose();
      pebble.geometry.dispose();
      (pebble.material as THREE.Material).dispose();
    },
  };
}
