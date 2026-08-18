/**
 * Headless Three.js screenshot of nuri.glb for visual QA.
 * Run: node scripts/render_nuri_preview.mjs
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GLB = path.join(ROOT, 'assets/nuri3d/nuri.glb');
const OUT = path.join(ROOT, 'assets/nuri3d/nuri_three_preview.png');

const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#2B3138">
<canvas id="c" width="768" height="768"></canvas>
<script type="importmap">
{"imports":{
  "three":"https://unpkg.com/three@0.170.0/build/three.module.js",
  "three/addons/":"https://unpkg.com/three@0.170.0/examples/jsm/"
}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.__ready = true;
</script>
</body></html>`;

async function main() {
  const glbB64 = fs.readFileSync(GLB).toString('base64');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
  });
  const page = await browser.newPage({ viewport: { width: 768, height: 768 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true);

  await page.evaluate(async (b64) => {
    const THREE = window.THREE;
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(768, 768, false);
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

    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bin], { type: 'model/gltf-binary' }));
    const gltf = await new Promise((resolve, reject) => {
      new window.GLTFLoader().load(url, resolve, undefined, reject);
    });
    const root = gltf.scene;
    root.traverse((obj) => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m && m.isMeshStandardMaterial) {
            const name = (m.name || '').toLowerCase();
            if (name.includes('amber') || name.includes('iris') || name.includes('heart') || name.includes('frill')) {
              m.emissiveIntensity = Math.min(Math.max(m.emissiveIntensity || 1, 0.9), 2.6);
            }
          }
        }
      }
      if (obj.name === 'Pebble') obj.visible = false;
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.85 / maxDim;
    root.scale.setScalar(scale);
    root.position.sub(center.multiplyScalar(scale));
    root.position.y += 0.05;
    scene.add(root);

    if (gltf.animations?.length) {
      const mixer = new THREE.AnimationMixer(root);
      for (const clip of gltf.animations) mixer.clipAction(clip).play();
      mixer.update(0.7);
    }
    renderer.render(scene, camera);
    window.__done = true;
  }, glbB64);

  await page.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
  await page.locator('#c').screenshot({ path: OUT });
  await browser.close();
  console.log('WROTE', OUT, fs.statSync(OUT).size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
