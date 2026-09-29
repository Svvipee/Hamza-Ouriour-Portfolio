// Interactive quadrotor model for the UAV case study.
// Built from primitives with Three.js (vendored in /vendor). No external requests.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

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
  const HOME = new THREE.Vector3(1.25, 0.85, 1.42);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.28, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.9;
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
  const padBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 64), new THREE.MeshStandardMaterial({ color: 0xdfe5e9, roughness: 0.9 }));
  padBase.receiveShadow = true;
  pad.add(padBase);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.54, 64), new THREE.MeshStandardMaterial({ color: 0x245d80, roughness: 0.8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0065; ring.receiveShadow = true;
  pad.add(ring);
  pad.add(makeMarker());
  scene.add(pad);

  // Drone
  const drone = new THREE.Group();
  scene.add(drone);

  // Center stack: bottom plate, top plate, standoffs
  const bottomPlate = mesh(roundedPlate(0.2, 0.26, 0.012, 0.03), M.carbon);
  bottomPlate.position.y = 0.0;
  drone.add(bottomPlate);
  const topPlate = mesh(roundedPlate(0.17, 0.22, 0.008, 0.03), M.plate);
  topPlate.position.y = 0.07;
  drone.add(topPlate);
  for (const [x, z] of [[0.065, 0.09], [-0.065, 0.09], [0.065, -0.09], [-0.065, -0.09]]) {
    const s = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 12), M.alu);
    s.position.set(x, 0.035, z); drone.add(s);
  }
  // Flight controller board and status LEDs
  const fc = mesh(new THREE.BoxGeometry(0.075, 0.006, 0.075), M.board);
  fc.position.y = 0.035; drone.add(fc);
  const ledA = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), M.ledG); ledA.position.set(0.02, 0.041, 0.03); drone.add(ledA);
  const ledB = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), M.ledR); ledB.position.set(-0.02, 0.041, 0.03); drone.add(ledB);

  // Battery strapped on top
  const battery = mesh(roundedBox(0.075, 0.045, 0.15, 0.01), M.battery);
  battery.position.y = 0.1; drone.add(battery);
  const strap = mesh(new THREE.BoxGeometry(0.082, 0.05, 0.016), M.accent);
  strap.position.set(0, 0.1, 0.02); drone.add(strap);

  // LiDAR puck on a mast (VLP-16 style)
  const mast = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 12), M.alu);
  mast.position.set(0, 0.15, -0.09); drone.add(mast);
  const lidar = new THREE.Group();
  lidar.position.set(0, 0.2, -0.09);
  lidar.add(mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 32), M.alu));
  const window_ = mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.032, 32, 1, true), M.lens);
  window_.position.y = 0.025; lidar.add(window_);
  const cap = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.012, 32), M.alu);
  cap.position.y = 0.047; lidar.add(cap);
  drone.add(lidar);
  const lidarSpinner = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.026, 0.004), new THREE.MeshBasicMaterial({ color: 0x5fd0ff }));
  lidarSpinner.position.set(0.039, 0.025, 0);
  const lidarRotor = new THREE.Group(); lidarRotor.add(lidarSpinner); lidarRotor.position.copy(lidar.position); drone.add(lidarRotor);

  // Downward camera gimbal under the frame (landing target tracking)
  const camMount = mesh(new THREE.BoxGeometry(0.05, 0.02, 0.04), M.dark);
  camMount.position.set(0, -0.016, 0.07); drone.add(camMount);
  const camBody = mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.028, 20), M.dark);
  camBody.position.set(0, -0.04, 0.07); drone.add(camBody);
  const camLens = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.006, 20), M.lens);
  camLens.position.set(0, -0.056, 0.07); drone.add(camLens);

  // Front marker (orange nose) to show heading
  const nose = mesh(new THREE.ConeGeometry(0.014, 0.035, 16), M.accent);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.004, 0.145); drone.add(nose);

  // Arms, motors, props (X configuration)
  const ARM = 0.36;
  const props = [];
  const armAngles = [45, 135, 225, 315];
  armAngles.forEach((deg, i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const arm = mesh(new THREE.BoxGeometry(0.03, 0.012, ARM), M.carbon);
    arm.position.copy(dir.clone().multiplyScalar(ARM / 2 + 0.03));
    arm.rotation.y = a;
    drone.add(arm);

    const tip = dir.clone().multiplyScalar(ARM + 0.03);
    // motor mount
    const mount = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 24), M.carbon);
    mount.position.set(tip.x, 0.006, tip.z); drone.add(mount);
    // stator base and bell
    const stator = mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.012, 24), M.dark);
    stator.position.set(tip.x, 0.016, tip.z); drone.add(stator);
    const bell = mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.028, 28), M.bell);
    bell.position.set(tip.x, 0.036, tip.z); drone.add(bell);
    const shaft = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 10), M.alu);
    shaft.position.set(tip.x, 0.058, tip.z); drone.add(shaft);

    // landing leg under the motor
    const leg = mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.12, 10), M.dark);
    leg.position.set(tip.x * 0.92, -0.056, tip.z * 0.92); drone.add(leg);
    const foot = mesh(new THREE.SphereGeometry(0.011, 12, 12), M.dark);
    foot.position.set(tip.x * 0.92, -0.117, tip.z * 0.92); drone.add(foot);

    // propeller: CW on 45/225, CCW on 135/315
    const spin = (i % 2 === 0) ? 1 : -1;
    const prop = makeProp(spin);
    prop.position.set(tip.x, 0.064, tip.z);
    prop.userData.spin = spin;
    drone.add(prop);
    props.push(prop);
  });

  // Hover height: feet sit 0.117 below origin, pad top at 0.006
  const BASE_Y = 0.36;
  drone.position.y = BASE_Y;

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
    camera.position.copy(HOME); controls.target.set(0, 0.28, 0); controls.update(); wake();
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
    if (propsOn) props.forEach(p => { p.rotation.y += p.userData.spin * dt * 60; });
    lidarRotor.rotation.y += dt * (propsOn ? 12 : 0);
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
  host.classList.add('ready');
  wake();

  // Geometry helpers
  function makeProp(spin) {
    const g = new THREE.Group();
    const hub = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16), M.dark);
    g.add(hub);
    for (let k = 0; k < 2; k++) {
      const shape = new THREE.Shape();
      const L = 0.125;
      shape.moveTo(0, -0.006);
      shape.bezierCurveTo(L * 0.3, -0.022, L * 0.8, -0.018, L, -0.004);
      shape.bezierCurveTo(L * 1.02, 0.004, L * 0.95, 0.012, L * 0.8, 0.012);
      shape.bezierCurveTo(L * 0.5, 0.014, L * 0.2, 0.014, 0, 0.006);
      const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.003, bevelEnabled: false }), M.prop);
      blade.castShadow = true;
      // lay the blade flat, then add pitch about its long axis
      blade.rotation.set(-Math.PI / 2 + spin * 0.18, 0, 0);
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.y = k * Math.PI;
      g.add(arm);
    }
    return g;
  }

  function roundedPlate(w, d, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, z = -d / 2;
    s.moveTo(x + r, z);
    s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
    s.lineTo(x + w, z + d - r); s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r);
    s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, h / 2, 0);
    return geo;
  }

  function roundedBox(w, h, d, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    return geo;
  }

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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.0068; m.receiveShadow = true;
    return m;
  }
}
