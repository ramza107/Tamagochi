import * as THREE from 'three';
import type { Behavior } from '../logic/behavior';

export type NuriHandle = {
  setBehavior: (b: Behavior) => void;
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
  zzz: THREE.Group;
};

function furTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6FBD78';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 90 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgba(${shade * 0.55},${shade},${shade * 0.6},${0.15 + Math.random() * 0.35})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 3);
  }
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(40,90,50,${Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function bumpTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 12000; i++) {
    const v = 100 + Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  return tex;
}

function heartGeometry() {
  const shape = new THREE.Shape();
  const x = 0;
  const y = 0;
  shape.moveTo(x, y + 0.25);
  shape.bezierCurveTo(x, y + 0.25, x - 0.25, y, x - 0.25, y - 0.15);
  shape.bezierCurveTo(x - 0.25, y - 0.4, x, y - 0.42, x, y - 0.65);
  shape.bezierCurveTo(x, y - 0.42, x + 0.25, y - 0.4, x + 0.25, y - 0.15);
  shape.bezierCurveTo(x + 0.25, y, x, y + 0.25, x, y + 0.25);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 20,
  });
}

function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.35);
  shape.quadraticCurveTo(0.22, -0.05, 0.05, 0.4);
  shape.quadraticCurveTo(0, 0.48, -0.05, 0.4);
  shape.quadraticCurveTo(-0.22, -0.05, 0, -0.35);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  });
}

function makeNuri(): Parts {
  const root = new THREE.Group();
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.05, 0);
  root.add(headPivot);

  const map = furTexture();
  const bump = bumpTexture();

  const fur = new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 0.045,
    color: '#7EC987',
    roughness: 0.82,
    metalness: 0.0,
  });
  const furDeep = new THREE.MeshStandardMaterial({
    color: '#3F7A4C',
    roughness: 0.9,
    metalness: 0,
  });
  const amber = new THREE.MeshPhysicalMaterial({
    color: '#F0A04A',
    emissive: '#C86818',
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.35,
    thickness: 0.65,
    ior: 1.4,
    transparent: true,
    opacity: 0.98,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });

  const eyeWhite = new THREE.MeshPhysicalMaterial({
    color: '#FFFDF5',
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const iris = new THREE.MeshStandardMaterial({
    color: '#E39B3A',
    emissive: '#A65A10',
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#141A16', roughness: 0.4 });
  const lidMat = new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 0.03,
    color: '#6FB877',
    roughness: 0.85,
  });

  // pear body: big belly + head lobe
  const bodyGroup = new THREE.Group();
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.95, 64, 64), fur);
  belly.scale.set(1.05, 0.95, 0.98);
  belly.position.y = -0.15;
  belly.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.78, 64, 64), fur);
  head.position.y = 0.55;
  head.scale.set(1.02, 0.95, 1);
  head.castShadow = true;
  bodyGroup.add(belly, head);
  headPivot.add(bodyGroup);

  // cheek fluff
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), fur);
  cheekL.position.set(-0.55, 0.35, 0.45);
  cheekL.scale.set(1, 0.85, 0.8);
  const cheekR = cheekL.clone();
  cheekR.position.x *= -1;
  headPivot.add(cheekL, cheekR);

  // crystal leaf crown
  const leafGeo = leafGeometry();
  const leafAngles = [-1.1, -0.65, -0.25, 0.25, 0.65, 1.1];
  leafAngles.forEach((a, i) => {
    const leaf = new THREE.Mesh(leafGeo, amber.clone());
    leaf.position.set(Math.sin(a) * 0.62, 1.05 + Math.cos(a) * 0.08, -0.05 + Math.abs(a) * 0.05);
    leaf.rotation.z = -a * 0.7;
    leaf.rotation.x = -0.35;
    leaf.scale.setScalar(0.85 + (i % 2) * 0.12);
    headPivot.add(leaf);
  });

  // huge cute eyes with amber iris (Talking-Ben style readable face)
  const makeEye = (x: number) => {
    const g = new THREE.Group();
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), eyeWhite);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 28), iris);
    ir.position.z = 0.12;
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20), pupilMat);
    pup.position.z = 0.2;
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    );
    shine.position.set(0.06, 0.07, 0.26);
    const shine2 = shine.clone();
    shine2.scale.setScalar(0.45);
    shine2.position.set(-0.04, -0.02, 0.25);
    g.add(white, ir, pup, shine, shine2);
    g.position.set(x, 0.58, 0.68);
    return g;
  };
  headPivot.add(makeEye(-0.3), makeEye(0.3));

  // brows
  const browMat = furDeep;
  const browL = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 8), browMat);
  browL.position.set(-0.3, 0.82, 0.72);
  browL.rotation.z = 0.25;
  const browR = browL.clone();
  browR.position.x *= -1;
  browR.rotation.z *= -1;
  headPivot.add(browL, browR);

  // eyelids
  const leftLid = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), lidMat);
  leftLid.position.set(-0.3, 0.72, 0.72);
  leftLid.rotation.x = -0.15;
  const rightLid = leftLid.clone();
  rightLid.position.x = 0.3;
  headPivot.add(leftLid, rightLid);

  // smile curve
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.028, 12, 28, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#2A4030', roughness: 0.6 }),
  );
  mouth.position.set(0, 0.32, 0.82);
  mouth.rotation.set(0.15, 0, Math.PI);
  headPivot.add(mouth);

  // heart gem in chest
  const heart = new THREE.Mesh(heartGeometry(), amber.clone());
  heart.position.set(0, -0.05, 0.78);
  heart.rotation.x = Math.PI;
  heart.scale.set(1.15, 1.15, 1.15);
  heart.castShadow = true;
  headPivot.add(heart);
  const heartGlow = new THREE.PointLight('#FFB45A', 0.85, 3.5);
  heartGlow.position.set(0, -0.05, 1.0);
  headPivot.add(heartGlow);

  // arms
  const makeArm = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.95 * side, 0.05, 0.1);
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 28), fur);
    upper.scale.set(0.75, 1.1, 0.75);
    upper.position.y = -0.12;
    upper.castShadow = true;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), furDeep);
    paw.position.set(0.05 * side, -0.38, 0.05);
    paw.scale.set(1.1, 0.7, 1);
    g.add(upper, paw);
    // tiny toes
    for (let i = 0; i < 3; i++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), furDeep);
      toe.position.set(0.05 * side + (i - 1) * 0.07, -0.45, 0.14);
      g.add(toe);
    }
    return g;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  root.add(leftArm, rightArm);

  // feet
  const makeFoot = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.34 * side, -0.95, 0.12);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), furDeep);
    foot.scale.set(1.15, 0.55, 1.35);
    foot.castShadow = true;
    g.add(foot);
    for (let i = 0; i < 3; i++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), furDeep);
      toe.position.set((i - 1) * 0.08, -0.05, 0.22);
      g.add(toe);
    }
    return g;
  };
  const leftFoot = makeFoot(-1);
  const rightFoot = makeFoot(1);
  root.add(leftFoot, rightFoot);

  // pebble
  const pebble = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.11, 0),
    new THREE.MeshStandardMaterial({ color: '#8E877C', roughness: 0.95 }),
  );
  pebble.position.set(0.6, -1.05, 0.55);
  pebble.castShadow = true;
  root.add(pebble);

  // zzz markers
  const zzz = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const z = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16 + i * 0.03, 0.16 + i * 0.03),
      new THREE.MeshBasicMaterial({ color: '#D7E0D8', transparent: true, opacity: 0 }),
    );
    z.position.set(0.75 + i * 0.14, 1.0 + i * 0.18, 0.5);
    zzz.add(z);
  }
  root.add(zzz);

  root.position.y = 0.35;
  return {
    root,
    body: bodyGroup,
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

export function mountNuri3D(canvas: HTMLCanvasElement, initialBehavior: Behavior = 'idle'): NuriHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2A3038');
  scene.fog = new THREE.Fog('#2A3038', 7, 16);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.45, 4.6);
  camera.lookAt(0, 0.25, 0);

  const hemi = new THREE.HemisphereLight('#f5f0e8', '#3a4550', 0.85);
  const key = new THREE.DirectionalLight('#fff5e8', 1.6);
  key.position.set(2.8, 4.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const rim = new THREE.DirectionalLight('#9ecbff', 0.55);
  rim.position.set(-3.5, 2.2, -2);
  const fill = new THREE.DirectionalLight('#ffd8b0', 0.35);
  fill.position.set(-2, 1.5, 3);
  scene.add(hemi, key, rim, fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 64),
    new THREE.MeshStandardMaterial({ color: '#3A424C', roughness: 0.92, metalness: 0.05 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.08;
  ground.receiveShadow = true;
  scene.add(ground);

  // soft spotlight on character
  const spot = new THREE.SpotLight('#ffffff', 1.1, 12, 0.55, 0.45);
  spot.position.set(0, 4.2, 3);
  spot.target.position.set(0, 0.2, 0);
  scene.add(spot, spot.target);

  const parts = makeNuri();
  scene.add(parts.root);

  let behavior: Behavior = initialBehavior;
  let t = 0;
  let blinkT = 0;
  let nextBlink = 1.7;
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

  const lidOpenY = 0.72;
  const lidClosedY = 0.52;

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    t += 1 / 60;
    blinkT += 1 / 60;

    const breath = 1 + Math.sin(t * 2.1) * 0.025;
    parts.body.scale.set(breath, breath * 0.985, breath);
    parts.root.rotation.y = Math.sin(t * 0.65) * 0.1;
    parts.heart.scale.setScalar(1.15 * (1 + Math.sin(t * 4.2) * 0.06));

    let lidClose = 0;
    parts.headPivot.rotation.x = Math.sin(t * 0.8) * 0.02;
    parts.rightArm.rotation.z = 0;
    parts.leftArm.rotation.z = 0;
    parts.rightFoot.rotation.x = 0;
    parts.pebble.position.set(0.6, -1.05, 0.55);
    parts.zzz.children.forEach((c) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0;
    });

    if (behavior === 'idle') {
      if (blinkT > nextBlink) {
        const phase = blinkT - nextBlink;
        if (phase < 0.14) lidClose = Math.sin((phase / 0.14) * Math.PI);
        else {
          blinkT = 0;
          nextBlink = 1.5 + Math.random() * 2.4;
        }
      }
      const waveCycle = t % 7;
      if (waveCycle > 5.4 && waveCycle < 6.4) {
        const w = (waveCycle - 5.4) / 1.0;
        parts.rightArm.rotation.z = -Math.sin(w * Math.PI * 2) * 1.15 - 0.25;
        parts.rightArm.rotation.x = 0.25;
      }
    }

    if (behavior === 'sleepy') {
      lidClose = 0.85 + Math.sin(t * 1.2) * 0.07;
      parts.headPivot.rotation.x = 0.22 + Math.sin(t * 1.05) * 0.1;
      parts.zzz.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.4 + Math.sin(t * 2 + i) * 0.25;
        c.position.y = 1.0 + i * 0.18 + Math.sin(t * 2 + i) * 0.07;
      });
    }

    if (behavior === 'screen') {
      const cycle = t % 2.5;
      if (cycle < 1.0) lidClose = Math.abs(Math.sin(cycle * 16)) > 0.45 ? 1 : 0.08;
      else lidClose = 0.94;
    }

    if (behavior === 'walk') {
      const cycle = t % 2.1;
      if (cycle < 0.5) {
        const k = cycle / 0.5;
        parts.rightFoot.rotation.x = -k * 1.2;
        parts.pebble.position.set(0.6 + k * 1.25, -1.05 + Math.sin(k * Math.PI) * 0.5, 0.55 + k * 0.25);
        parts.pebble.rotation.z = k * 5;
        parts.rightArm.rotation.z = -0.2;
        parts.leftArm.rotation.z = 0.15;
      }
      parts.root.position.x = Math.sin(t * 2.8) * 0.04;
    } else {
      parts.root.position.x = 0;
    }

    parts.leftLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.rightLid.position.y = THREE.MathUtils.lerp(lidOpenY, lidClosedY, lidClose);
    parts.leftLid.scale.set(1, 0.45 + lidClose * 0.9, 1);
    parts.rightLid.scale.set(1, 0.45 + lidClose * 0.9, 1);

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
          else {
            const mat = m as THREE.MeshStandardMaterial;
            mat.map?.dispose();
            mat.bumpMap?.dispose();
            mat.dispose();
          }
        }
      });
    },
  };
}
