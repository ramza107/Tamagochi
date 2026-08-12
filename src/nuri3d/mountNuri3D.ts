import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  dispose: () => void;
};

type Parts = {
  root: THREE.Group;
  body: THREE.Mesh;
  headPivot: THREE.Group;
  leftLid: THREE.Mesh;
  rightLid: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  heart: THREE.Mesh;
  pebble: THREE.Mesh;
  zzz: THREE.Group;
};

function mat(color: string, opts: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...opts });
}

function makeNuri(): Parts {
  const root = new THREE.Group();
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.15, 0);
  root.add(headPivot);

  const moss = mat('#6FAF78');
  const mossDeep = mat('#3E6B48');
  const amber = mat('#E8A24A', { emissive: '#C87A20', emissiveIntensity: 0.55, transparent: true, opacity: 0.95 });
  const eyeWhite = mat('#F4FFF6');
  const pupil = mat('#152018');
  const lid = mat('#5F9A6A');

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.92, 48, 48), moss);
  body.scale.set(1, 0.95, 0.95);
  body.castShadow = true;
  headPivot.add(body);

  // petal ears
  const earGeo = new THREE.SphereGeometry(0.28, 24, 24);
  const leftEar = new THREE.Mesh(earGeo, amber);
  leftEar.position.set(-0.72, 0.55, -0.05);
  leftEar.scale.set(0.55, 1.15, 0.35);
  leftEar.rotation.z = 0.45;
  const rightEar = leftEar.clone();
  rightEar.position.x *= -1;
  rightEar.rotation.z *= -1;
  headPivot.add(leftEar, rightEar);

  // eyes
  const eyeBall = (x: number) => {
    const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), eyeWhite);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), pupil);
    p.position.set(0.02, 0.01, 0.11);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mat('#FFFFFF'));
    shine.position.set(0.05, 0.05, 0.18);
    g.add(w, p, shine);
    g.position.set(x, 0.22, 0.78);
    return g;
  };
  headPivot.add(eyeBall(-0.28), eyeBall(0.28));

  // eyelids (move down to close)
  const leftLid = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), lid);
  leftLid.position.set(-0.28, 0.34, 0.8);
  leftLid.rotation.x = -0.2;
  const rightLid = leftLid.clone();
  rightLid.position.x = 0.28;
  headPivot.add(leftLid, rightLid);

  // smile
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 10, 24, Math.PI),
    mossDeep,
  );
  mouth.position.set(0, -0.05, 0.88);
  mouth.rotation.set(0, 0, Math.PI);
  headPivot.add(mouth);

  // heart core
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 28), amber);
  heart.position.set(0, -0.35, 0.7);
  headPivot.add(heart);

  // arms
  const arm = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.85 * side, -0.1, 0.15);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), moss);
    mesh.scale.set(0.7, 1.15, 0.7);
    mesh.position.y = -0.15;
    g.add(mesh);
    return g;
  };
  const leftArm = arm(-1);
  const rightArm = arm(1);
  root.add(leftArm, rightArm);

  // feet
  const foot = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.32 * side, -0.85, 0.15);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), mossDeep);
    mesh.scale.set(1.1, 0.55, 1.2);
    g.add(mesh);
    return g;
  };
  const leftFoot = foot(-1);
  const rightFoot = foot(1);
  root.add(leftFoot, rightFoot);

  // pebble
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.12, 0),
    mat('#8B8578', { roughness: 0.9 }),
  );
  pebble.position.set(0.55, -0.95, 0.55);
  pebble.castShadow = true;
  root.add(pebble);

  // simple Z sprites as planes
  const zzz = new THREE.Group();
  const zMat = new THREE.MeshBasicMaterial({ color: '#5A6B5E', transparent: true, opacity: 0 });
  for (let i = 0; i < 3; i++) {
    const z = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), zMat.clone());
    z.position.set(0.7 + i * 0.15, 0.7 + i * 0.2, 0.6);
    zzz.add(z);
  }
  root.add(zzz);

  root.position.y = 0.2;
  return {
    root,
    body,
    headPivot,
    leftLid,
    rightLid,
    leftArm,
    rightArm,
    leftFoot,
    rightFoot,
    heart,
    pebble,
    zzz,
  };
}

export function mountNuri3D(
  canvas: HTMLCanvasElement,
  initialBehavior: Behavior = 'idle',
): NuriHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d7e3ec', 6, 14);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.55, 4.2);
  camera.lookAt(0, 0.2, 0);

  const hemi = new THREE.HemisphereLight('#f0f5ff', '#7a6a50', 1.1);
  const key = new THREE.DirectionalLight('#ffffff', 1.35);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  const fill = new THREE.DirectionalLight('#b8d4ff', 0.45);
  fill.position.set(-3, 2, 2);
  scene.add(hemi, key, fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 48),
    new THREE.MeshStandardMaterial({ color: '#cfd8e0', roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.95;
  ground.receiveShadow = true;
  scene.add(ground);

  const parts = makeNuri();
  scene.add(parts.root);

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let blinkT = 0;
  let nextBlink = 1.8;
  let disposed = false;
  let raf = 0;

  const setSize = () => {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 320;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  setSize();

  const lidOpenY = 0.34;
  const lidClosedY = 0.18;

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = 1 / 60;
    t += dt;
    blinkT += dt;

    // continuous breath + gentle sway — always alive
    const breath = 1 + Math.sin(t * 2.2) * 0.03;
    parts.body.scale.set(breath, breath * 0.97, breath);
    parts.root.rotation.y = Math.sin(t * 0.7) * 0.08;
    parts.heart.scale.setScalar(1 + Math.sin(t * 4.5) * 0.08);

    // reset defaults each frame then apply behavior
    let lidClose = 0;
    parts.headPivot.rotation.x = 0;
    parts.rightArm.rotation.z = 0;
    parts.leftArm.rotation.z = 0;
    parts.rightFoot.rotation.x = 0;
    parts.pebble.position.set(0.55, -0.95, 0.55);
    parts.zzz.children.forEach((c) => {
      (c as THREE.Mesh).material &&
        (((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0);
    });

    if (behavior === 'idle') {
      // natural blink
      if (blinkT > nextBlink) {
        const phase = blinkT - nextBlink;
        if (phase < 0.12) lidClose = Math.sin((phase / 0.12) * Math.PI);
        else {
          blinkT = 0;
          nextBlink = 1.6 + Math.random() * 2.2;
        }
      }
      // occasional wave
      const waveCycle = (t % 6.5);
      if (waveCycle > 5.2 && waveCycle < 6.1) {
        const w = (waveCycle - 5.2) / 0.9;
        parts.rightArm.rotation.z = -Math.sin(w * Math.PI * 2) * 1.1 - 0.3;
      }
    }

    if (behavior === 'sleepy') {
      lidClose = 0.82 + Math.sin(t * 1.3) * 0.08;
      parts.headPivot.rotation.x = 0.18 + Math.sin(t * 1.1) * 0.12;
      parts.zzz.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.35 + Math.sin(t * 2 + i) * 0.25;
        c.position.y = 0.7 + i * 0.2 + Math.sin(t * 2 + i) * 0.08;
      });
    }

    if (behavior === 'screen') {
      // rapid blink then hold closed
      const cycle = t % 2.4;
      if (cycle < 0.9) {
        lidClose = Math.abs(Math.sin(cycle * 18)) > 0.5 ? 1 : 0.1;
      } else {
        lidClose = 0.92;
      }
      parts.headPivot.rotation.y = Math.sin(t * 0.5) * 0.05;
    }

    if (behavior === 'walk') {
      const cycle = t % 2.0;
      if (cycle < 0.45) {
        const k = cycle / 0.45;
        parts.rightFoot.rotation.x = -k * 1.1;
        parts.pebble.position.set(0.55 + k * 1.1, -0.95 + Math.sin(k * Math.PI) * 0.45, 0.55 + k * 0.2);
        parts.pebble.rotation.z = k * 4;
      } else {
        parts.rightFoot.rotation.x = 0;
        parts.pebble.position.set(0.55, -0.95, 0.55);
      }
      parts.root.position.x = Math.sin(t * 3) * 0.03;
    } else {
      parts.root.position.x = 0;
    }

    parts.leftLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.rightLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.leftLid.scale.set(1, 0.55 + lidClose * 0.7, 1);
    parts.rightLid.scale.set(1, 0.55 + lidClose * 0.7, 1);

    renderer.render(scene, camera);
  };

  tick();

  return {
    setBehavior: (b) => {
      behavior = b;
      blinkT = 0;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
    },
  };
}
