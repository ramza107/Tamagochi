import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
  resize: (cssSize: number) => void;
  dispose: () => void;
};

type Parts = {
  root: THREE.Group;
  body: THREE.Object3D;
  headPivot: THREE.Group;
  leftLid: THREE.Mesh;
  rightLid: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  heart: THREE.Mesh;
  pebble: THREE.Mesh;
  blushL: THREE.Mesh;
  blushR: THREE.Mesh;
  zzz: THREE.Group;
};

function toonRamp() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 1;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 4, 0);
  g.addColorStop(0, '#4a4a4a');
  g.addColorStop(0.45, '#a0a0a0');
  g.addColorStop(0.55, '#ffffff');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function toon(color: string, ramp: THREE.Texture) {
  return new THREE.MeshToonMaterial({ color, gradientMap: ramp });
}

function outlineOf(mesh: THREE.Mesh, scale = 1.06) {
  const m = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color: '#2A332C', side: THREE.BackSide }),
  );
  m.scale.copy(mesh.scale).multiplyScalar(scale);
  m.position.copy(mesh.position);
  m.rotation.copy(mesh.rotation);
  return m;
}

function heartShapeGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.2);
  s.bezierCurveTo(0, 0.2, -0.22, 0.02, -0.22, -0.12);
  s.bezierCurveTo(-0.22, -0.32, 0, -0.36, 0, -0.55);
  s.bezierCurveTo(0, -0.36, 0.22, -0.32, 0.22, -0.12);
  s.bezierCurveTo(0.22, 0.02, 0, 0.2, 0, 0.2);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 3,
    curveSegments: 18,
  });
}

function makeNuri(ramp: THREE.Texture): Parts {
  const root = new THREE.Group();
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.15, 0);
  root.add(headPivot);

  // pastel cartoon palette — soft & cute
  const moss = toon('#8FD68A', ramp);
  const mossDeep = toon('#5EAB62', ramp);
  const cream = toon('#F7FFE8', ramp);
  const amber = new THREE.MeshToonMaterial({
    color: '#FFC15E',
    gradientMap: ramp,
    emissive: '#E89A2E',
    emissiveIntensity: 0.35,
  });
  const blush = new THREE.MeshBasicMaterial({ color: '#FF9AA8', transparent: true, opacity: 0.45 });
  const line = new THREE.MeshBasicMaterial({ color: '#2E3B32' });

  // BIG chibi head (cartoon)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 48, 48), moss);
  head.position.y = 0.55;
  head.castShadow = true;
  headPivot.add(head, outlineOf(head, 1.045));

  // smaller belly under head — pear chibi
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.72, 48, 48), moss);
  belly.position.y = -0.35;
  belly.scale.set(1.15, 0.95, 1.05);
  belly.castShadow = true;
  headPivot.add(belly, outlineOf(belly, 1.05));

  // tummy patch
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), cream);
  tummy.position.set(0, -0.3, 0.45);
  tummy.scale.set(1, 0.9, 0.55);
  headPivot.add(tummy);

  // soft petal ears (2 cute leaves, not crystal spikes)
  const petalGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const petalL = new THREE.Mesh(petalGeo, amber);
  petalL.position.set(-0.7, 1.15, -0.05);
  petalL.scale.set(0.55, 1.2, 0.28);
  petalL.rotation.z = 0.55;
  const petalR = petalL.clone();
  petalR.position.x *= -1;
  petalR.rotation.z *= -1;
  const petalL2 = petalL.clone();
  petalL2.position.set(-0.4, 1.35, -0.1);
  petalL2.scale.set(0.4, 0.95, 0.22);
  petalL2.rotation.z = 0.2;
  const petalR2 = petalL2.clone();
  petalR2.position.x *= -1;
  petalR2.rotation.z *= -1;
  headPivot.add(petalL, petalR, petalL2, petalR2);

  // HUGE cute eyes
  const makeEye = (x: number) => {
    const g = new THREE.Group();
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), cream);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 28), amber);
    iris.position.z = 0.14;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), line);
    pupil.position.z = 0.24;
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    );
    shine.position.set(0.08, 0.09, 0.3);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    );
    shine2.position.set(-0.06, -0.04, 0.29);
    g.add(white, iris, pupil, shine, shine2);
    g.position.set(x, 0.6, 0.72);
    return g;
  };
  headPivot.add(makeEye(-0.34), makeEye(0.34));

  // eyelids — same fur color, close over eyes
  const leftLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.29, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    moss,
  );
  leftLid.position.set(-0.34, 0.78, 0.76);
  leftLid.rotation.x = -0.1;
  const rightLid = leftLid.clone();
  rightLid.position.x = 0.34;
  headPivot.add(leftLid, rightLid);

  // blush
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), blush);
  blushL.position.set(-0.55, 0.38, 0.82);
  const blushR = blushL.clone();
  blushR.position.x = 0.55;
  headPivot.add(blushL, blushR);

  // tiny smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 10, 24, Math.PI), line);
  smile.position.set(0, 0.28, 0.9);
  smile.rotation.set(0.2, 0, Math.PI);
  headPivot.add(smile);

  // cute heart on chest
  const heart = new THREE.Mesh(heartShapeGeo(), amber);
  heart.position.set(0, -0.15, 0.75);
  heart.rotation.x = Math.PI;
  heart.scale.setScalar(0.9);
  headPivot.add(heart);
  const heartLight = new THREE.PointLight('#FFC15E', 0.7, 3);
  heartLight.position.set(0, -0.1, 1.1);
  headPivot.add(heartLight);

  // stubby arms
  const makeArm = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.95 * side, -0.05, 0.1);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.26, 28, 28), moss);
    a.scale.set(0.75, 1.15, 0.75);
    a.position.y = -0.15;
    a.castShadow = true;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), mossDeep);
    paw.position.y = -0.4;
    g.add(a, outlineOf(a, 1.06), paw);
    return g;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  root.add(leftArm, rightArm);

  // stubby feet
  const makeFoot = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.32 * side, -1.0, 0.12);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), mossDeep);
    f.scale.set(1.2, 0.55, 1.35);
    f.castShadow = true;
    g.add(f);
    return g;
  };
  const leftFoot = makeFoot(-1);
  const rightFoot = makeFoot(1);
  root.add(leftFoot, rightFoot);

  // pebble
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.1, 0),
    toon('#A39E94', ramp),
  );
  pebble.position.set(0.55, -1.12, 0.5);
  pebble.castShadow = true;
  root.add(pebble);

  // zzz
  const zzz = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const z = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18 + i * 0.04, 0.18 + i * 0.04),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 }),
    );
    z.position.set(0.8 + i * 0.15, 1.2 + i * 0.2, 0.4);
    zzz.add(z);
  }
  root.add(zzz);

  root.position.y = 0.4;
  return {
    root,
    body: headPivot,
    headPivot,
    leftLid,
    rightLid,
    leftArm,
    rightArm,
    leftFoot,
    rightFoot,
    heart,
    pebble,
    blushL,
    blushR,
    zzz,
  };
}

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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // soft cartoon sky
  scene.background = new THREE.Color('#D9E8F2');
  scene.fog = new THREE.Fog('#D9E8F2', 8, 18);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.35, 5.0);
  camera.lookAt(0, 0.2, 0);

  const hemi = new THREE.HemisphereLight('#ffffff', '#b7c4a8', 1.05);
  const key = new THREE.DirectionalLight('#ffffff', 1.15);
  key.position.set(2.5, 5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const fill = new THREE.DirectionalLight('#ffe6f0', 0.45);
  fill.position.set(-3, 2, 2);
  scene.add(hemi, key, fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 64),
    new THREE.MeshStandardMaterial({ color: '#C5D5C8', roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.15;
  ground.receiveShadow = true;
  scene.add(ground);

  const ramp = toonRamp();
  const parts = makeNuri(ramp);
  scene.add(parts.root);

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let blinkT = 0;
  let nextBlink = 1.6;
  let disposed = false;
  let raf = 0;

  const applySize = (css: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(160, Math.floor(css || canvas.clientWidth || 320));
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;
    renderer.setPixelRatio(dpr);
    renderer.setSize(px, px, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  applySize(cssSize);

  const lidOpenY = 0.78;
  const lidClosedY = 0.55;

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    t += 1 / 60;
    blinkT += 1 / 60;

    // soft squash & stretch — cartoon life
    const breath = 1 + Math.sin(t * 2.3) * 0.03;
    parts.body.scale.set(breath, 2 - breath, breath);
    parts.root.rotation.y = Math.sin(t * 0.75) * 0.12;
    parts.heart.scale.setScalar(0.9 * (1 + Math.sin(t * 4) * 0.07));
    (parts.blushL.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2) * 0.08;
    (parts.blushR.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2) * 0.08;

    let lidClose = 0;
    parts.headPivot.rotation.x = 0;
    parts.rightArm.rotation.set(0, 0, 0);
    parts.leftArm.rotation.set(0, 0, 0);
    parts.rightFoot.rotation.x = 0;
    parts.pebble.position.set(0.55, -1.12, 0.5);
    parts.zzz.children.forEach((c) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0;
    });

    if (behavior === 'idle') {
      if (blinkT > nextBlink) {
        const phase = blinkT - nextBlink;
        if (phase < 0.12) lidClose = Math.sin((phase / 0.12) * Math.PI);
        else {
          blinkT = 0;
          nextBlink = 1.4 + Math.random() * 2.2;
        }
      }
      const waveCycle = t % 6.5;
      if (waveCycle > 5.1 && waveCycle < 6.2) {
        const w = (waveCycle - 5.1) / 1.1;
        parts.rightArm.rotation.z = -Math.sin(w * Math.PI * 2) * 1.25 - 0.35;
        parts.rightArm.rotation.x = 0.35;
      }
    }

    if (behavior === 'sleepy') {
      lidClose = 0.88 + Math.sin(t * 1.15) * 0.06;
      parts.headPivot.rotation.x = 0.25 + Math.sin(t * 1.0) * 0.1;
      parts.zzz.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.45 + Math.sin(t * 2 + i) * 0.25;
        c.position.y = 1.2 + i * 0.2 + Math.sin(t * 2 + i) * 0.08;
      });
    }

    if (behavior === 'screen') {
      const cycle = t % 2.3;
      if (cycle < 0.9) lidClose = Math.abs(Math.sin(cycle * 17)) > 0.5 ? 1 : 0.05;
      else lidClose = 0.95;
    }

    if (behavior === 'walk') {
      const cycle = t % 2.0;
      if (cycle < 0.48) {
        const k = cycle / 0.48;
        parts.rightFoot.rotation.x = -k * 1.25;
        parts.pebble.position.set(0.55 + k * 1.3, -1.12 + Math.sin(k * Math.PI) * 0.55, 0.5 + k * 0.2);
        parts.pebble.rotation.z = k * 5;
        parts.rightArm.rotation.z = -0.25;
        parts.leftArm.rotation.z = 0.2;
      }
      parts.root.position.x = Math.sin(t * 3) * 0.05;
    } else {
      parts.root.position.x = 0;
    }

    parts.leftLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.rightLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.leftLid.scale.set(1, 0.4 + lidClose * 1.0, 1);
    parts.rightLid.scale.set(1, 0.4 + lidClose * 1.0, 1);

    renderer.render(scene, camera);
  };

  tick();

  return {
    setBehavior: (b) => {
      behavior = b;
      blinkT = 0;
    },
    resize: applySize,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      ramp.dispose();
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
