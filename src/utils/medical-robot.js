import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Silence benign DirectX/HLSL ANGLE double-precision shader compiler warning (X4122)
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = function (...args) {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('warning X4122') ||
       args[0].includes('THREE.WebGLProgram: Program Info Log'))
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

export function createMedicalRobot(container, options = {}) {
  const CFG = Object.assign(
    {
      maxPixelRatio: 2,
      responsiveness: 1.0,   // global motion multiplier
      idleAmplitude: 1.0,
      // glass barrel uses a real refraction pass; set false on very low-end
      // devices to fall back to plain alpha blending
      useTransmission: true,
      // true  → the robot watches the pointer anywhere on the page/screen,
      //         measured relative to its own on-screen centre
      // false → it only reacts while the pointer is inside its container
      trackWindow: true
    },
    options
  );

  /* ------------------------------------------------------------------ state */
  const state = {
    pointer: new THREE.Vector2(0, 0),      // normalized -1..1 (y up)
    target: new THREE.Vector2(0, 0),       // eased pointer target
    active: false,
    zone: 'idle',
    time: 0
  };

  let scene, camera, renderer, lastTime, pmrem, envRT;
  let robot, root, head, neck, torso, chest, pelvis;
  let leftShoulder, rightShoulder, leftUpperArm, rightUpperArm;
  let leftElbow, rightElbow, leftForearm, rightForearm;
  let leftWrist, rightWrist, leftHand, rightHand;
  let syringe, scalpel;
  let eyeL, eyeR, mouth, chestGlow;
  const emissiveParts = [];
  const fingerJoints = [];   // { joint, base, phase }
  let rafId = null;

  /* -------------------------------------------------------------- materials */
  const MAT = {};

  function buildMaterials() {
    MAT.shell = new THREE.MeshPhysicalMaterial({
      color: 0xf2f5f8, roughness: 0.18, metalness: 0.05,
      clearcoat: 1.0, clearcoatRoughness: 0.06, sheen: 0.25,
      sheenColor: new THREE.Color(0xbcd4e6)
    });
    MAT.shellShade = new THREE.MeshPhysicalMaterial({
      color: 0xd3dae2, roughness: 0.3, metalness: 0.08,
      clearcoat: 0.8, clearcoatRoughness: 0.12
    });
    MAT.polymer = new THREE.MeshStandardMaterial({
      color: 0x22282f, roughness: 0.55, metalness: 0.25
    });
    MAT.jointDark = new THREE.MeshStandardMaterial({
      color: 0x14181d, roughness: 0.42, metalness: 0.45
    });
    MAT.brushed = new THREE.MeshStandardMaterial({
      color: 0x9aa3ad, roughness: 0.34, metalness: 0.95
    });
    MAT.polished = new THREE.MeshStandardMaterial({
      color: 0xd7dde3, roughness: 0.06, metalness: 1.0
    });
    MAT.visor = new THREE.MeshPhysicalMaterial({
      color: 0x05070c, roughness: 0.05, metalness: 0.3,
      clearcoat: 1.0, clearcoatRoughness: 0.02
    });
    MAT.glass = new THREE.MeshPhysicalMaterial({
      color: 0xeaf6ff, roughness: 0.05, metalness: 0.0,
      transmission: CFG.useTransmission ? 0.94 : 0.0,
      thickness: 0.35, ior: 1.46,
      transparent: true, opacity: CFG.useTransmission ? 0.55 : 0.4,
      clearcoat: 1.0
    });
    MAT.fluid = new THREE.MeshPhysicalMaterial({
      color: 0xbfe9ff, roughness: 0.1, transmission: 0.7,
      thickness: 0.2, transparent: true, opacity: 0.5
    });
    MAT.glow = new THREE.MeshStandardMaterial({
      color: 0x0a1a24, emissive: new THREE.Color(0x27c9ff),
      emissiveIntensity: 2.4, roughness: 0.3, metalness: 0.1,
      toneMapped: false
    });
    MAT.glowSoft = new THREE.MeshStandardMaterial({
      color: 0x0a1a24, emissive: new THREE.Color(0x1ea9e8),
      emissiveIntensity: 1.4, roughness: 0.4, metalness: 0.1,
      toneMapped: false
    });
    emissiveParts.push(MAT.glow, MAT.glowSoft);
  }

  /* ------------------------------------------------------------ scene setup */
  function initScene() {
    scene = new THREE.Scene();
    scene.background = null;                    // transparent — no environment shown

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 700;

    camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 1.32, 6.1);
    camera.lookAt(0, 1.22, 0);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CFG.maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    if (renderer.debug) {
      renderer.debug.checkShaderErrors = false;
    }
    renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;background:transparent;touch-action:none;';
    container.appendChild(renderer.domElement);

    // Reflection environment only (never rendered as a visible background).
    pmrem = new THREE.PMREMGenerator(renderer);
    envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    lastTime = performance.now();
  }

  function setupLighting() {
    scene.add(new THREE.HemisphereLight(0xdff1ff, 0x1b232c, 0.85));
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(2.6, 4.2, 3.4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xbcd8ff, 0.85);
    fill.position.set(-3.4, 1.6, 2.2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x7fd9ff, 1.25);
    rim.position.set(-1.4, 2.4, -3.6);
    scene.add(rim);

    const spec = new THREE.PointLight(0xffffff, 5.5, 9, 2);
    spec.position.set(0.9, 2.7, 1.9);
    scene.add(spec);

    const under = new THREE.PointLight(0x2ec4ff, 2.2, 6, 2);
    under.position.set(0, 0.35, 1.4);
    scene.add(under);
  }

  /* ------------------------------------------------------------- primitives */
  const box = (w, h, d, m, r = 4) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d, r, r, r), m);
  const cyl = (rt, rb, h, m, s = 24) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m);
  const cap = (r, l, m, s = 12) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, s), m);
  const sph = (r, m, s = 32) => new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.round(s * 0.7)), m);
  const tor = (r, t, m, s = 32, arc = Math.PI * 2) =>
    new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, s, arc), m);

  /* ------------------------------------------------------------------- head */
  function createHead() {
    head = new THREE.Group();
    head.name = 'head';

    // glossy dome skull
    const skull = sph(0.42, MAT.shell, 48);
    skull.scale.set(1.0, 1.0, 0.94);
    head.add(skull);

    // fine engineering seams, sunk flush into the dome surface
    const flushSeam = (y, tube, mat) => {
      const r = Math.sqrt(Math.max(0.42 * 0.42 - y * y, 0.001)) - tube * 0.35;
      const t = tor(r, tube, mat, 72);
      t.rotation.x = Math.PI / 2;
      t.position.y = y;
      t.scale.set(1.0, 0.94, 1.0);
      head.add(t);
      return t;
    };
    flushSeam(0.235, 0.0045, MAT.shellShade);
    flushSeam(0.152, 0.0055, MAT.brushed);   // brow strip above the visor

    // dark curved visor patch on the front (+Z)
    const vLen = 2.15, vStart = Math.PI / 2 - vLen / 2;
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.4235, 72, 44, vStart, vLen, 1.02, 1.02),
      MAT.visor
    );
    visor.scale.set(1.0, 1.0, 0.94);
    head.add(visor);

    // thin brushed gasket sunk just behind the visor edge
    const gasket = new THREE.Mesh(
      new THREE.SphereGeometry(0.4185, 72, 44, vStart - 0.045, vLen + 0.09, 0.985, 1.09),
      MAT.brushed
    );
    gasket.scale.set(1.0, 1.0, 0.94);
    head.add(gasket);

    // ---- expressive digital face (emissive, sits just off the visor) -------
    const face = new THREE.Group();
    face.position.z = 0.012;
    head.add(face);

    const eyeGeo = new THREE.TorusGeometry(0.062, 0.0125, 10, 30, Math.PI * 0.95);
    const mkEye = (x) => {
      const g = new THREE.Group();
      const arc = new THREE.Mesh(eyeGeo, MAT.glow);
      arc.rotation.z = -Math.PI * 0.02;
      g.add(arc);
      g.position.set(x, 0.035, 0.397);
      g.rotation.y = x * 0.55;
      return g;
    };
    eyeL = mkEye(0.145);   // robot's left eye (viewer right)
    eyeR = mkEye(-0.145);
    face.add(eyeL, eyeR);

    mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.0115, 10, 32, Math.PI * 0.72),
      MAT.glow
    );
    mouth.rotation.z = Math.PI + Math.PI * 0.14;
    mouth.position.set(0, -0.09, 0.392);
    face.add(mouth);

    // side sensor pods ("ears")
    [-1, 1].forEach((s) => {
      const pod = new THREE.Group();
      const shellPod = sph(0.105, MAT.shell, 24);
      shellPod.scale.set(0.55, 1.0, 1.0);
      const ring = tor(0.062, 0.012, MAT.glowSoft, 28);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = s * 0.035;
      const core = cyl(0.03, 0.03, 0.03, MAT.jointDark, 20);
      core.rotation.z = Math.PI / 2;
      core.position.x = s * 0.04;
      pod.add(shellPod, ring, core);
      pod.position.set(s * 0.4, 0.015, 0.0);
      head.add(pod);
    });

    // crown antenna detail
    const antBase = cyl(0.026, 0.032, 0.03, MAT.brushed, 20);
    antBase.position.y = 0.418;
    const antTip = sph(0.017, MAT.glowSoft, 18);
    antTip.position.y = 0.452;
    head.add(antBase, antTip);

    head.position.set(0, 0.3, 0.01);
    return head;
  }

  /* ------------------------------------------------------------------ torso */
  function createTorso() {
    torso = new THREE.Group();
    torso.name = 'torso';

    chest = sph(0.33, MAT.shell, 40);
    chest.scale.set(1.0, 1.05, 0.86);
    chest.position.y = 0.06;
    torso.add(chest);

    const backPlate = new THREE.Mesh(
      new THREE.SphereGeometry(0.332, 40, 28, Math.PI * 0.55, Math.PI * 0.9),
      MAT.shellShade
    );
    backPlate.scale.set(1.0, 1.05, 0.86);
    backPlate.position.y = 0.06;
    torso.add(backPlate);

    // waist / hip block
    const waist = cyl(0.16, 0.2, 0.12, MAT.polymer, 28);
    waist.position.y = -0.25;
    torso.add(waist);
    pelvis = cyl(0.215, 0.2, 0.15, MAT.shell, 28);
    pelvis.position.y = -0.36;
    torso.add(pelvis);
    const beltGlow = tor(0.207, 0.008, MAT.glowSoft, 40);
    beltGlow.rotation.x = Math.PI / 2;
    beltGlow.position.y = -0.315;
    torso.add(beltGlow);

    // chest medical emblem
    const badge = new THREE.Group();
    const disc = cyl(0.092, 0.092, 0.01, MAT.polymer, 40);
    disc.rotation.x = Math.PI / 2;
    const ring = tor(0.091, 0.0105, MAT.glowSoft, 44);
    const inner = cyl(0.072, 0.072, 0.012, MAT.glowSoft, 40);
    inner.rotation.x = Math.PI / 2;
    const crossA = box(0.062, 0.019, 0.012, MAT.shell, 2);
    const crossB = box(0.019, 0.062, 0.012, MAT.shell, 2);
    crossA.position.z = crossB.position.z = 0.013;
    chestGlow = ring;
    badge.add(disc, ring, inner, crossA, crossB);
    badge.position.set(0, 0.035, 0.298);
    badge.rotation.x = -0.05;
    torso.add(badge);

    // flush chest vent slots, low and to the side
    for (let i = 0; i < 3; i++) {
      const vent = box(0.05, 0.0075, 0.012, MAT.jointDark, 1);
      vent.position.set(0.105 - i * 0.0, -0.15 - i * 0.028, 0.222 - i * 0.012);
      vent.rotation.y = -0.45;
      torso.add(vent);
      const vent2 = vent.clone();
      vent2.position.x = -vent.position.x;
      vent2.rotation.y = 0.45;
      torso.add(vent2);
    }

    // shoulder sockets so the arms read as mechanically attached
    [-1, 1].forEach((s) => {
      const socket = sph(0.115, MAT.polymer, 22);
      socket.scale.set(0.85, 1.0, 1.0);
      socket.position.set(s * 0.29, 0.185, 0.02);
      torso.add(socket);
    });

    neck = new THREE.Group();
    neck.name = 'neck';
    const neckCol = cyl(0.088, 0.1, 0.12, MAT.jointDark, 24);
    neckCol.position.y = 0.03;
    const neckRing = tor(0.093, 0.012, MAT.brushed, 30);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = 0.075;
    neck.add(neckCol, neckRing);
    neck.position.set(0, 0.35, 0.0);
    torso.add(neck);
    neck.add(createHead());

    torso.position.set(0, 1.16, 0);
    return torso;
  }

  /* ------------------------------------------------------------------- legs */
  function createLeg(side) {
    const leg = new THREE.Group();

    const hip = sph(0.095, MAT.jointDark, 20);
    leg.add(hip);

    const thigh = cap(0.085, 0.2, MAT.shell, 16);
    thigh.position.y = -0.19;
    leg.add(thigh);

    const thighPlate = box(0.13, 0.16, 0.06, MAT.shellShade, 3);
    thighPlate.position.set(0, -0.2, 0.06);
    leg.add(thighPlate);

    const knee = new THREE.Group();
    knee.position.y = -0.36;
    const kneeBall = sph(0.082, MAT.polymer, 20);
    const kneeRing = tor(0.045, 0.009, MAT.glowSoft, 26);
    kneeRing.position.z = 0.062;
    knee.add(kneeBall, kneeRing);
    leg.add(knee);

    const shin = cap(0.082, 0.17, MAT.shell, 16);
    shin.position.y = -0.16;
    knee.add(shin);
    const shinRing = tor(0.055, 0.008, MAT.glowSoft, 26);
    shinRing.position.set(0, -0.2, 0.055);
    knee.add(shinRing);

    const ankle = sph(0.062, MAT.jointDark, 16);
    ankle.position.y = -0.3;
    knee.add(ankle);

    const foot = new THREE.Group();
    foot.position.set(0, -0.33, 0.02);
    const sole = box(0.16, 0.075, 0.3, MAT.shell, 4);
    sole.position.z = 0.05;
    const toe = sph(0.08, MAT.shell, 20);
    toe.scale.set(1.0, 0.62, 1.1);
    toe.position.set(0, -0.008, 0.185);
    const grip = box(0.15, 0.03, 0.26, MAT.polymer, 3);
    grip.position.set(0, -0.038, 0.06);
    foot.add(sole, toe, grip);
    knee.add(foot);

    leg.position.set(side * 0.15, 0.78, 0);
    leg.rotation.z = side * 0.03;
    return leg;
  }

  /* ------------------------------------------------------------------- hand */
  // Builds a hand whose fist axis (the tube a gripped tool passes through)
  // runs along local X, centred slightly in front of the palm (+Z).
  function createHand(side, name) {
    const hand = new THREE.Group();
    hand.name = name;

    const palm = box(0.075, 0.105, 0.055, MAT.shell, 4);
    palm.position.set(0, -0.045, 0);
    hand.add(palm);
    const palmPad = box(0.05, 0.07, 0.016, MAT.shellShade, 3);
    palmPad.position.set(0, -0.048, 0.028);
    hand.add(palmPad);
    const knuckleBar = cyl(0.03, 0.03, 0.078, MAT.jointDark, 16);
    knuckleBar.rotation.z = Math.PI / 2;
    knuckleBar.position.set(0, -0.09, 0.008);
    hand.add(knuckleBar);

    // four curled fingers wrapping the tool axis
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const x = -0.028 + i * 0.0187;
      const len = 0.038 - Math.abs(i - 1.4) * 0.003;

      const prox = new THREE.Group();
      prox.position.set(x, -0.095, 0.012);
      prox.rotation.x = -1.28;
      const seg1 = cap(0.0125, len, MAT.shell, 10);
      seg1.position.y = -len / 2 - 0.004;
      prox.add(seg1);
      const k1 = sph(0.0135, MAT.jointDark, 12);
      prox.add(k1);

      const mid = new THREE.Group();
      mid.position.y = -len - 0.012;
      mid.rotation.x = -1.34;
      const seg2 = cap(0.0115, len * 0.82, MAT.shell, 10);
      seg2.position.y = -len * 0.41 - 0.004;
      mid.add(seg2);
      const k2 = sph(0.0125, MAT.jointDark, 12);
      mid.add(k2);
      const tip = sph(0.0115, MAT.polished, 12);
      tip.position.y = -len * 0.82 - 0.008;
      mid.add(tip);
      prox.add(mid);

      hand.add(prox);
      fingers.push({ prox, mid, home: prox.position.clone() });
      fingerJoints.push({ joint: prox, base: prox.rotation.x, phase: i * 0.7 + (side > 0 ? 1.1 : 0) });
      fingerJoints.push({ joint: mid, base: mid.rotation.x, phase: i * 0.9 + 2.2 });
    }

    // opposed thumb closing the grip from the other side
    const thumb = new THREE.Group();
    thumb.position.set(side > 0 ? -0.036 : 0.036, -0.058, 0.028);
    thumb.rotation.set(-1.32, side > 0 ? 0.42 : -0.42, side > 0 ? 0.95 : -0.95);
    const tSeg = cap(0.0145, 0.036, MAT.shell, 10);
    tSeg.position.y = -0.026;
    const tKn = sph(0.016, MAT.jointDark, 12);
    const tMid = new THREE.Group();
    tMid.position.y = -0.05;
    tMid.rotation.x = -0.72;
    const tSeg2 = cap(0.0135, 0.026, MAT.shell, 10);
    tSeg2.position.y = -0.018;
    const tTip = sph(0.0135, MAT.polished, 12);
    tTip.position.y = -0.036;
    tMid.add(tSeg2, tTip);
    thumb.add(tSeg, tKn, tMid);
    hand.add(thumb);
    fingerJoints.push({ joint: thumb, base: thumb.rotation.x, phase: 4.1 });

    // centre of the tube enclosed by the curled fingers; a gripped tool's
    // long axis runs through this point along the hand's local X.
    hand.userData.gripPoint = new THREE.Vector3(0, -0.112, 0.033);
    hand.userData.fingers = fingers;   // index → pinky
    hand.userData.thumb = thumb;
    hand.userData.side = side;
    return hand;
  }

  /**
   * Re-shapes a hand into a specific clinical grip and re-bases the idle
   * micro-motion so the servo jitter animates around the new pose.
   *  'syringe' → barrel between index and middle finger, thumb up on the
   *              plunger pad (the way a clinician primes a dose)
   *  'scalpel' → pencil/precision grip: pad of the index on the blade spine,
   *              thumb opposing, ring and little finger tucked away
   */
  function applyGrip(hand, kind) {
    const s = hand.userData.side;   // -1 robot's right, +1 robot's left
    const F = hand.userData.fingers;
    const T = hand.userData.thumb;

    // Every finger keeps a firm wrap on the same tool axis; only the lead
    // finger and the thumb change role between the two grips.
    // [proximal, middle, splay] per finger: index, middle, ring, little
    const curls = kind === 'syringe'
      ? [[-1.20, -1.30, 0.10], [-1.30, -1.36, 0.04], [-1.34, -1.40, -0.02], [-1.38, -1.44, -0.08]]
      : [[-0.95, -0.55, 0.55], [-1.26, -1.34, 0.05], [-1.36, -1.42, -0.02], [-1.42, -1.48, -0.08]];

    F.forEach((f, i) => {
      f.prox.rotation.x = curls[i][0];
      f.mid.rotation.x = curls[i][1];
      // splay rotates the finger around the tool axis: for the scalpel the
      // index finger lies flat along the handle spine, the way a surgeon
      // steadies the blade
      f.prox.rotation.z = curls[i][2] * -s;
      f.prox.position.copy(f.home);
    });

    // the extended index finger has to ride on top of the handle, not through
    // it, so it is lifted clear of the tool axis by the handle's half-thickness
    if (kind === 'scalpel') F[0].prox.position.set(F[0].home.x, -0.096, 0.026);

    if (kind === 'syringe') {
      // thumb crosses to the plunger side of the plunger pad
      T.rotation.set(-0.60, 0.22 * -s, 1.34 * -s);
      T.children.forEach((c) => { if (c.isGroup) c.rotation.x = -0.20; });
      T.position.set(0.030 * s, -0.070, 0.030);
    } else {
      // thumb pinches the handle against the middle finger
      T.rotation.set(-1.12, s > 0 ? 0.58 : -0.58, s > 0 ? 1.05 : -1.05);
      T.children.forEach((c) => { if (c.isGroup) c.rotation.x = -0.92; });
      T.position.set(s > 0 ? -0.030 : 0.030, -0.076, 0.038);
    }

    // re-base idle servo motion on the new grip angles
    fingerJoints.forEach((fj) => {
      if (fj.joint === T || F.some((f) => f.prox === fj.joint || f.mid === fj.joint)) {
        fj.base = fj.joint.rotation.x;
      }
    });

    // axis of the tube enclosed by the wrapped fingers
    hand.userData.gripPoint = new THREE.Vector3(0, -0.112, 0.034);
  }

  /* ---------------------------------------------------------------- syringe */
  function createSyringe() {
    const g = new THREE.Group();
    g.name = 'syringe';

    const barrel = cyl(0.0235, 0.0235, 0.2, MAT.glass, 28);
    g.add(barrel);
    // liquid volume inside the barrel
    const fluid = cyl(0.019, 0.019, 0.1, MAT.fluid, 24);
    fluid.position.y = -0.045;
    g.add(fluid);

    // graduation markings
    for (let i = 0; i < 7; i++) {
      const long = i % 2 === 0;
      const mk = box(long ? 0.014 : 0.008, 0.0018, 0.0022, MAT.brushed, 1);
      mk.position.set(0, 0.075 - i * 0.022, 0.0235);
      g.add(mk);
    }

    // flange + plunger assembly
    const flange = cyl(0.032, 0.032, 0.005, MAT.shell, 26);
    flange.scale.z = 0.4;
    flange.position.y = 0.1;
    g.add(flange);
    const rod = box(0.009, 0.026, 0.009, MAT.shell, 2);
    rod.position.y = 0.115;
    g.add(rod);
    const rodX = box(0.009, 0.026, 0.009, MAT.shell, 2);
    rodX.rotation.y = Math.PI / 2;
    rodX.position.y = 0.115;
    g.add(rodX);
    const thumbPad = cyl(0.026, 0.023, 0.007, MAT.polymer, 26);
    thumbPad.position.y = 0.131;
    g.add(thumbPad);
    const seal = cyl(0.0225, 0.0225, 0.014, MAT.polymer, 24);
    seal.position.y = 0.005;
    g.add(seal);

    // luer tip + hub + needle
    const shoulderCone = cyl(0.0235, 0.011, 0.02, MAT.glass, 24);
    shoulderCone.position.y = -0.11;
    g.add(shoulderCone);
    const hub = cyl(0.011, 0.0125, 0.02, MAT.brushed, 20);
    hub.position.y = -0.13;
    g.add(hub);
    const needle = cyl(0.0022, 0.0016, 0.15, MAT.polished, 12);
    needle.position.y = -0.215;
    g.add(needle);

    const body = new THREE.Group();
    body.name = 'syringeBody';
    body.position.y = -0.062;
    [...g.children].forEach((c) => body.add(c));
    g.add(body);
    return g;
  }

  /* ---------------------------------------------------------------- scalpel */
  function createScalpel() {
    const g = new THREE.Group();
    g.name = 'scalpel';

    const handle = box(0.019, 0.15, 0.0085, MAT.brushed, 3);
    g.add(handle);
    const butt = cyl(0.009, 0.006, 0.014, MAT.brushed, 16);
    butt.position.y = -0.08;
    g.add(butt);
    for (let i = 0; i < 12; i++) {
      const rib = box(0.0205, 0.0035, 0.0105, MAT.polished, 1);
      rib.position.y = -0.04 + i * 0.0085;
      g.add(rib);
    }
    const collar = cyl(0.0115, 0.0105, 0.016, MAT.polished, 18);
    collar.scale.z = 0.8;
    collar.position.y = 0.083;
    g.add(collar);

    const shape = new THREE.Shape();
    shape.moveTo(-0.007, 0);
    shape.lineTo(-0.007, 0.036);
    shape.quadraticCurveTo(-0.004, 0.052, 0.006, 0.056);
    shape.quadraticCurveTo(0.0, 0.03, 0.0075, 0.012);
    shape.quadraticCurveTo(0.005, 0.0, -0.007, 0);
    const bladeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0016, bevelEnabled: true,
      bevelThickness: 0.0008, bevelSize: 0.0006, bevelSegments: 2, curveSegments: 10
    });
    bladeGeo.center();
    const blade = new THREE.Mesh(bladeGeo, MAT.polished);
    blade.position.set(0.0005, 0.113, 0);
    g.add(blade);

    const body = new THREE.Group();
    body.name = 'scalpelBody';
    body.position.y = -0.028;
    [...g.children].forEach((c) => body.add(c));
    g.add(body);
    return g;
  }

  /* -------------------------------------------------------------------- arm */
  function createArm(side, prefix) {
    const shoulder = new THREE.Group();
    shoulder.name = prefix + 'Shoulder';

    const pauldron = sph(0.122, MAT.shell, 30);
    pauldron.scale.set(1.0, 0.96, 1.0);
    shoulder.add(pauldron);
    const shoulderRing = tor(0.098, 0.0085, MAT.jointDark, 30);
    shoulderRing.rotation.y = Math.PI / 2;
    shoulderRing.position.x = -side * 0.028;
    shoulder.add(shoulderRing);
    const deltoid = sph(0.098, MAT.shellShade, 22);
    deltoid.scale.set(0.95, 1.05, 0.95);
    deltoid.position.set(side * 0.012, -0.055, 0);
    shoulder.add(deltoid);

    const upperArm = new THREE.Group();
    upperArm.name = prefix + 'UpperArm';
    const uaShell = cap(0.053, 0.13, MAT.shell, 16);
    uaShell.position.y = -0.095;
    upperArm.add(uaShell);
    const uaPlate = cap(0.03, 0.075, MAT.shellShade, 12);
    uaPlate.position.set(0, -0.1, 0.036);
    upperArm.add(uaPlate);
    const uaSeam = tor(0.05, 0.007, MAT.jointDark, 22);
    uaSeam.rotation.x = Math.PI / 2;
    uaSeam.position.y = -0.05;
    upperArm.add(uaSeam);
    upperArm.position.y = -0.075;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.name = prefix + 'Elbow';
    const elbowBall = sph(0.058, MAT.polymer, 20);
    elbow.add(elbowBall);
    const elbowCap = tor(0.038, 0.009, MAT.glowSoft, 24);
    elbowCap.position.z = 0.042;
    elbow.add(elbowCap);
    elbow.position.y = -0.185;
    upperArm.add(elbow);

    const forearm = new THREE.Group();
    forearm.name = prefix + 'Forearm';
    const faShell = cap(0.05, 0.115, MAT.shell, 16);
    faShell.position.y = -0.085;
    forearm.add(faShell);
    const faPlate = cap(0.028, 0.07, MAT.shellShade, 12);
    faPlate.position.set(0, -0.09, 0.033);
    forearm.add(faPlate);
    const faVent = tor(0.049, 0.006, MAT.glowSoft, 24);
    faVent.rotation.x = Math.PI / 2;
    faVent.position.set(0, -0.055, 0);
    forearm.add(faVent);
    forearm.position.y = -0.01;
    elbow.add(forearm);

    const wrist = new THREE.Group();
    wrist.name = prefix + 'Wrist';
    const wristJoint = cyl(0.042, 0.042, 0.03, MAT.jointDark, 20);
    wrist.add(wristJoint);
    const wristRing = tor(0.044, 0.008, MAT.brushed, 24);
    wristRing.rotation.x = Math.PI / 2;
    wrist.add(wristRing);
    wrist.position.y = -0.165;
    forearm.add(wrist);

    const hand = createHand(side, prefix + 'Hand');
    hand.position.y = -0.028;
    wrist.add(hand);

    shoulder.position.set(side * 0.352, 0.185, 0.035);
    return { shoulder, upperArm, elbow, forearm, wrist, hand };
  }

  /* ------------------------------------------------------------------ robot */
  function createRobot() {
    root = new THREE.Group();          // outer transform (breathing / lean)
    robot = new THREE.Group();
    robot.name = 'robot';
    root.add(robot);

    robot.add(createTorso());
    robot.add(createLeg(-1));
    robot.add(createLeg(1));

    const R = createArm(-1, 'right');
    const L = createArm(1, 'left');
    torso.add(R.shoulder, L.shoulder);

    rightShoulder = R.shoulder; rightUpperArm = R.upperArm; rightElbow = R.elbow;
    rightForearm = R.forearm; rightWrist = R.wrist; rightHand = R.hand;
    leftShoulder = L.shoulder; leftUpperArm = L.upperArm; leftElbow = L.elbow;
    leftForearm = L.forearm; leftWrist = L.wrist; leftHand = L.hand;

    // ---- instruments, parented into the hand hierarchy --------------------
    applyGrip(rightHand, 'syringe');
    applyGrip(leftHand, 'scalpel');

    syringe = createSyringe();
    const rGrip = rightHand.userData.gripPoint;
    syringe.position.copy(rGrip);
    syringe.rotation.set(0.24, 0.1, -1.16);
    syringe.userData.base = syringe.rotation.clone();
    rightHand.add(syringe);                    // Hand > Syringe

    scalpel = createScalpel();
    const lGrip = leftHand.userData.gripPoint;
    scalpel.position.copy(lGrip);
    scalpel.rotation.set(0.24, -0.34, -1.98);
    scalpel.userData.base = scalpel.rotation.clone();
    leftHand.add(scalpel);                     // Hand > Scalpel

    // ---- neutral pose (arms raised, tools presented to camera) -----------
    const pose = (o, x, y, z) => { o.rotation.set(x, y, z); o.userData.base = o.rotation.clone(); };

    pose(rightShoulder, -0.24, 0.12, -0.72);
    pose(rightUpperArm, -0.14, 0.0, -0.10);
    pose(rightElbow, -1.16, 0.18, 0.26);
    pose(rightForearm, 0.0, 1.40, 0.0);    // supination turns the needle up
    pose(rightWrist, 1.00, 0.60, 0.40);

    pose(leftShoulder, -0.24, -0.12, 0.72);
    pose(leftUpperArm, -0.14, 0.0, 0.10);
    pose(leftElbow, -1.16, -0.18, -0.26);
    pose(leftForearm, 0.0, -1.00, 0.0);    // supination turns the blade up
    pose(leftWrist, 1.00, 0.20, 0.0);

    pose(torso, 0, 0, 0);
    pose(neck, 0, 0, 0);
    pose(head, 0, 0, 0);
    head.userData.base = new THREE.Euler(0, 0, 0);

    scene.add(root);
    return robot;
  }

  /* -------------------------------------------------------- pointer tracking */
  const ZONES = [
    'right', 'top-right', 'up', 'top-left',
    'left', 'bottom-left', 'down', 'bottom-right'
  ];

  function detectDirection(x, y) {
    const mag = Math.hypot(x, y);
    if (mag < 0.12) return 'center';
    let a = Math.atan2(y, x);                       // -PI..PI, y up
    if (a < 0) a += Math.PI * 2;
    const idx = Math.round(a / (Math.PI / 4)) % 8;  // 8 directional sectors
    return ZONES[idx];
  }

  function setupPointerTracking() {
    const normalizeWindow = (e) => {
      const r = container.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const spanX = Math.max(dx < 0 ? cx : vw - cx, 1);
      const spanY = Math.max(dy < 0 ? cy : vh - cy, 1);
      return [
        THREE.MathUtils.clamp(dx / spanX, -1, 1),
        THREE.MathUtils.clamp(-dy / spanY, -1, 1)
      ];
    };

    const normalizeLocal = (e) => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return [
        THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1)
      ];
    };

    const onMove = (e) => {
      const n = CFG.trackWindow ? normalizeWindow(e) : normalizeLocal(e);
      if (!n) return;
      state.pointer.set(n[0], n[1]);
      state.active = true;
      state.zone = detectDirection(n[0], n[1]);
      if (options.onZone) options.onZone(state.zone, n[0], n[1]);
    };

    const onLeave = () => {
      state.active = false;
      state.pointer.set(0, 0);
      state.zone = 'idle';
      if (options.onZone) options.onZone('idle', 0, 0);
    };

    const surface = CFG.trackWindow ? window : container;
    surface.addEventListener('pointermove', onMove, { passive: true });
    surface.addEventListener('pointerdown', onMove, { passive: true });
    surface.addEventListener('pointercancel', onLeave, { passive: true });

    if (CFG.trackWindow) {
      document.addEventListener('pointerleave', onLeave, { passive: true });
      window.addEventListener('blur', onLeave, { passive: true });
      window.addEventListener('scroll', () => {
        if (state.active) state.pointer.set(state.pointer.x, state.pointer.y);
      }, { passive: true });
    } else {
      container.addEventListener('pointerenter', onMove, { passive: true });
      container.addEventListener('pointerleave', onLeave, { passive: true });
    }

    return () => {
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerdown', onMove);
      surface.removeEventListener('pointercancel', onLeave);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      container.removeEventListener('pointerenter', onMove);
      container.removeEventListener('pointerleave', onLeave);
    };
  }

  /* ------------------------------------------------------- motion utilities */
  const L = THREE.MathUtils.lerp;
  const damp = (cur, tgt, lambda, dt) => L(cur, tgt, 1 - Math.exp(-lambda * dt));

  function updateHead(px, py, dt, t) {
    const b = head.userData.base;
    const ty = b.y + px * 0.52;
    const tx = b.x - py * 0.30;
    const tz = b.z - px * py * 0.16;
    head.rotation.y = damp(head.rotation.y, ty, 6.0, dt);
    head.rotation.x = damp(head.rotation.x, tx + Math.sin(t * 0.9) * 0.008 * CFG.idleAmplitude, 6.0, dt);
    head.rotation.z = damp(head.rotation.z, tz + Math.sin(t * 0.62) * 0.006 * CFG.idleAmplitude, 5.0, dt);

    neck.rotation.y = damp(neck.rotation.y, px * 0.14, 5.0, dt);
    neck.rotation.x = damp(neck.rotation.x, -py * 0.06, 5.0, dt);
  }

  function updateArms(px, py, dt) {
    const swing = px * 0.32 * CFG.responsiveness;
    const lift = py * 0.30 * CFG.responsiveness;
    const twist = px * 0.16 * CFG.responsiveness;
    const clear = Math.abs(swing) * 0.85 + Math.max(0, -lift) * 0.4;

    const apply = (sh, ua, el, fa, side) => {
      const bS = sh.userData.base, bU = ua.userData.base, bE = el.userData.base;
      sh.rotation.z = damp(sh.rotation.z, bS.z + swing, 5.0, dt);
      sh.rotation.x = damp(sh.rotation.x, bS.x - lift * 0.55 - clear, 5.0, dt);
      sh.rotation.y = damp(sh.rotation.y, bS.y + twist * 0.5, 5.0, dt);

      ua.rotation.z = damp(ua.rotation.z, bU.z + swing * 0.45, 4.6, dt);
      ua.rotation.x = damp(ua.rotation.x, bU.x - lift * 0.3, 4.6, dt);

      el.rotation.x = damp(el.rotation.x, bE.x - lift * 0.34 + Math.abs(swing) * 0.1, 4.4, dt);
      el.rotation.y = damp(el.rotation.y, bE.y + twist * 0.7 * side, 4.4, dt);
      el.rotation.z = damp(el.rotation.z, bE.z + swing * 0.22, 4.4, dt);
    };

    apply(rightShoulder, rightUpperArm, rightElbow, rightForearm, -1);
    apply(leftShoulder, leftUpperArm, leftElbow, leftForearm, 1);
  }

  function updateHands(px, py, dt) {
    const lift = py * 0.30 * CFG.responsiveness;
    const swing = px * 0.32 * CFG.responsiveness;
    [rightWrist, leftWrist].forEach((w, i) => {
      const b = w.userData.base;
      const s = i === 0 ? -1 : 1;
      w.rotation.x = damp(w.rotation.x, b.x - lift * 0.42, 5.5, dt);
      w.rotation.z = damp(w.rotation.z, b.z + swing * 0.24, 5.5, dt);
      w.rotation.y = damp(w.rotation.y, b.y + px * 0.1 * s, 5.5, dt);
    });
  }

  function updateMedicalInstruments(dt, t) {
    const s = Math.sin(t * 1.6) * 0.006;
    syringe.rotation.z = damp(syringe.rotation.z, syringe.userData.base.z + s, 3.0, dt);
    scalpel.rotation.z = damp(scalpel.rotation.z, scalpel.userData.base.z - s, 3.0, dt);
  }

  function updateIdleAnimation(dt, t) {
    const a = CFG.idleAmplitude;
    const br = 1 + Math.sin(t * 1.15) * 0.006 * a;
    chest.scale.set(1.0, 1.05 * br, 0.86 * br);
    root.position.y = Math.sin(t * 1.15) * 0.006 * a;
    torso.rotation.z = damp(torso.rotation.z, Math.sin(t * 0.5) * 0.01 * a, 3.0, dt);

    const pulse = 2.2 + Math.sin(t * 2.1) * 0.35 + (state.active ? 0.5 : 0);
    MAT.glow.emissiveIntensity = pulse;
    MAT.glowSoft.emissiveIntensity = 1.25 + Math.sin(t * 1.4) * 0.2 + (state.active ? 0.3 : 0);

    for (let i = 0; i < fingerJoints.length; i++) {
      const f = fingerJoints[i];
      f.joint.rotation.x = f.base + Math.sin(t * 1.3 + f.phase) * 0.012 * a;
    }
  }

  function updateRobotMovement(dt) {
    const t = state.time;
    const goal = state.active ? state.pointer : new THREE.Vector2(0, 0);
    state.target.x = damp(state.target.x, goal.x, state.active ? 4.5 : 2.2, dt);
    state.target.y = damp(state.target.y, goal.y, state.active ? 4.5 : 2.2, dt);
    const px = state.target.x, py = state.target.y;

    updateHead(px, py, dt, t);
    updateArms(px, py, dt);
    updateHands(px, py, dt);
    updateMedicalInstruments(dt, t);
    updateIdleAnimation(dt, t);

    robot.rotation.y = damp(robot.rotation.y, px * 0.16, 4.0, dt);
    robot.position.x = damp(robot.position.x, px * 0.045, 4.0, dt);
    torso.rotation.x = damp(torso.rotation.x, -py * 0.05, 4.0, dt);
  }

  /* ----------------------------------------------------------------- resize */
  function handleResize() {
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 700;
    camera.aspect = w / h;
    const fit = THREE.MathUtils.clamp(1.0 / camera.aspect, 0.85, 2.1);
    camera.fov = THREE.MathUtils.clamp(26 + (fit - 1.2) * 9, 24, 40);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CFG.maxPixelRatio));
    renderer.setSize(w, h, false);
  }

  /* ------------------------------------------------------------------ loop */
  function animate() {
    rafId = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    state.time += dt;
    updateRobotMovement(dt);
    renderer.render(scene, camera);
  }

  /* ------------------------------------------------------------------- boot */
  buildMaterials();
  initScene();
  setupLighting();
  createRobot();
  const disposePointer = setupPointerTracking();
  handleResize();

  const ro = ('ResizeObserver' in window) ? new ResizeObserver(handleResize) : null;
  if (ro) ro.observe(container);
  window.addEventListener('resize', handleResize);

  const onVis = () => {
    if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = null; }
    else if (!rafId) { lastTime = performance.now(); animate(); }
  };
  document.addEventListener('visibilitychange', onVis);

  animate();

  /* ------------------------------------------------------------- public API */
  return {
    scene, camera, renderer,
    parts: {
      robot, head, neck, torso,
      leftShoulder, rightShoulder, leftUpperArm, rightUpperArm,
      leftElbow, rightElbow, leftForearm, rightForearm,
      leftWrist, rightWrist, leftHand, rightHand,
      syringe, scalpel
    },
    getZone: () => state.zone,
    getState: () => ({
      zone: state.zone, active: state.active,
      pointer: [state.pointer.x, state.pointer.y],
      eased: [state.target.x, state.target.y]
    }),
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      disposePointer();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVis);
      if (ro) ro.disconnect();
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.remove();
    }
  };
}
