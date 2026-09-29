// Interactive quadrotor model for the UAV case study.
// Loads the SolidWorks quadcopter (models/quadcopter.glb) with Three.js vendored in /vendor.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';

const MODEL_URL = new URL('./models/quadcopter.glb', import.meta.url).href;

const host = document.getElementById('uav-3d');
if (host) init(host);

function init(host) {
  const canvasWrap = host.querySelector('.model-canvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  let running = false, t = 0, visible = true;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    host.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasWrap.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  const HOME = new THREE.Vector3(0.95, 0.66, 1.08);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.34, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.6;
  controls.maxDistance = 4.2;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 1.1;
  controls.update();

  // Lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9aa6, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 4, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.2; key.shadow.camera.right = 1.2;
  key.shadow.camera.top = 1.2; key.shadow.camera.bottom = -1.2;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb7d0de, 1.0);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  // Materials (site palette: navy #142b3e, blue #245d80, paper #e9eef1)
  const M = {
    carbon: new THREE.MeshStandardMaterial({ color: 0x1b242c, roughness: 0.45, metalness: 0.35 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x142b3e, roughness: 0.5, metalness: 0.25 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xb9c3ca, roughness: 0.3, metalness: 0.85 }),
    bell: new THREE.MeshStandardMaterial({ color: 0x245d80, roughness: 0.3, metalness: 0.7 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0d1318, roughness: 0.7, metalness: 0.1 }),
    prop: new THREE.MeshStandardMaterial({ color: 0xdfe6ea, roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
    accent: new THREE.MeshStandardMaterial({ color: 0xbd701b, roughness: 0.5, metalness: 0.2 }),
    battery: new THREE.MeshStandardMaterial({ color: 0x2d3a45, roughness: 0.6, metalness: 0.1 }),
    lens: new THREE.MeshStandardMaterial({ color: 0x05080b, roughness: 0.05, metalness: 0.9 }),
    board: new THREE.MeshStandardMaterial({ color: 0x1f5a3f, roughness: 0.6, metalness: 0.1 }),
    ledG: new THREE.MeshBasicMaterial({ color: 0x3bd46b }),
    ledR: new THREE.MeshBasicMaterial({ color: 0xff4a3d }),
  };

  const shadowy = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const mesh = (geo, mat) => shadowy(new THREE.Mesh(geo, mat));

  // Landing target pad (vision-guided landing reference)
  const pad = new THREE.Group();
  const padBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.012, 64), new THREE.MeshStandardMaterial({ color: 0xdfe5e9, roughness: 0.9 }));
  padBase.receiveShadow = true;
  pad.add(padBase);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.435, 64), new THREE.MeshStandardMaterial({ color: 0x245d80, roughness: 0.8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0065; ring.receiveShadow = true;
  pad.add(ring);
  pad.add(makeMarker());
  scene.add(pad);

  // Drone: Hamza's SolidWorks quadcopter, converted to a compressed glTF
  const drone = new THREE.Group();
  scene.add(drone);
  const props = [];
  const BASE_Y = 0.22;
  drone.position.y = BASE_Y;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL_URL, (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (/^prop\d/.test(o.name)) {
        props.push(o);
      }
    });
    // alternate spin direction around the X layout
    props.sort((a, b) => Math.atan2(a.position.z, a.position.x) - Math.atan2(b.position.z, b.position.x));
    props.forEach((o, i) => { o.userData.spin = i % 2 ? -1 : 1; });
    drone.add(model);
    host.classList.remove('loading');
    host.classList.add('ready');
    wake();
  }, undefined, () => {
    host.classList.remove('loading');
    host.classList.add('no-webgl');
  });

  // Ground shadow catcher beyond the pad
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true;
  scene.add(ground);

  // UI state
  let propsOn = !reduceMotion;
  let hover = !reduceMotion;
  const btnProps = host.querySelector('[data-uav="props"]');
  const btnRotate = host.querySelector('[data-uav="rotate"]');
  const btnReset = host.querySelector('[data-uav="reset"]');
  const sync = () => {
    btnProps?.setAttribute('aria-pressed', String(propsOn));
    btnRotate?.setAttribute('aria-pressed', String(controls.autoRotate));
  };
  btnProps?.addEventListener('click', () => { propsOn = !propsOn; hover = propsOn; sync(); wake(); });
  btnRotate?.addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; sync(); wake(); });
  btnReset?.addEventListener('click', () => {
    camera.position.copy(HOME); controls.target.set(0, 0.34, 0); controls.update(); wake();
  });
  sync();

  // Pause auto-rotate while the user is dragging, resume after
  let resumeTimer;
  controls.addEventListener('start', () => { clearTimeout(resumeTimer); host.dataset.wasRotating = controls.autoRotate ? '1' : ''; controls.autoRotate = false; sync(); });
  controls.addEventListener('end', () => {
    if (host.dataset.wasRotating) resumeTimer = setTimeout(() => { controls.autoRotate = true; sync(); }, 2500);
  });
  controls.addEventListener('change', wake);

  // Sizing
  const resize = () => {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull the camera back a little on narrow screens
    camera.fov = w < 520 ? 45 : 35;
    camera.updateProjectionMatrix();
    wake();
  };
  new ResizeObserver(resize).observe(canvasWrap);
  resize();

  // Only render while visible
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(host);

  function wake() { if (!running && visible) { running = true; clock.getDelta(); requestAnimationFrame(tick); } }
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    if (propsOn) props.forEach(p => { p.rotation.y += p.userData.spin * dt * 45; });
    if (hover) {
      drone.position.y = BASE_Y + Math.sin(t * 1.6) * 0.012;
      drone.rotation.z = Math.sin(t * 0.9) * 0.018;
      drone.rotation.x = Math.cos(t * 0.7) * 0.014;
    }
    const moved = controls.update();
    renderer.render(scene, camera);
    const animating = propsOn || hover || controls.autoRotate || moved;
    if (visible && animating) requestAnimationFrame(tick);
    else running = false;
  }
  wake();

  // Geometry helpers
  // Fiducial-style landing marker drawn on a canvas texture
  function makeMarker() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#10181f';
    const cell = 256 / 8;
    // border
    x.fillRect(0, 0, 256, cell); x.fillRect(0, 256 - cell, 256, cell);
    x.fillRect(0, 0, cell, 256); x.fillRect(256 - cell, 0, cell, 256);
    const bits = [
      [1,0,1,1,0,1],
      [0,1,0,0,1,1],
      [1,1,0,1,0,0],
      [0,0,1,0,1,1],
      [1,0,1,1,0,0],
      [0,1,1,0,1,0],
    ];
    bits.forEach((row, r) => row.forEach((b, cI) => { if (b) x.fillRect((cI + 1) * cell, (r + 1) * cell, cell, cell); }));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.0068; m.receiveShadow = true;
    return m;
  }
}
