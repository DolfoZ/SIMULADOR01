import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function useThreeScene(containerRef: React.RefObject<HTMLDivElement | null>) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cannonGroupRef = useRef<THREE.Group | null>(null);
  const barrelGroupRef = useRef<THREE.Group | null>(null);
  const projectileRef = useRef<THREE.Mesh | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const impactMarkerRef = useRef<THREE.Mesh | null>(null);
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const muzzleFlashRef = useRef<THREE.PointLight | null>(null);
  const explosionRef = useRef<THREE.Points | null>(null);
  const recoilAnimRef = useRef<{ active: boolean; t: number }>({ active: false, t: 0 });
  const animFrameRef = useRef<number>(0);

  const init = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a08);
    scene.fog = new THREE.FogExp2(0x050a08, 0.00012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100000);
    camera.position.set(-25, 12, 35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0x3a5a3a, 0.4));
    const dl = new THREE.DirectionalLight(0xccddbb, 1.0);
    dl.position.set(60, 120, 40);
    dl.castShadow = true;
    dl.shadow.mapSize.width = 2048;
    dl.shadow.mapSize.height = 2048;
    dl.shadow.camera.near = 1;
    dl.shadow.camera.far = 300;
    dl.shadow.camera.left = -80;
    dl.shadow.camera.right = 80;
    dl.shadow.camera.top = 80;
    dl.shadow.camera.bottom = -80;
    scene.add(dl);
    const fillLight = new THREE.DirectionalLight(0x446644, 0.2);
    fillLight.position.set(-40, 30, -20);
    scene.add(fillLight);

    // Ground - dark military
    const groundGeo = new THREE.PlaneGeometry(100000, 100000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1408,
      roughness: 0.95,
      metalness: 0.0
    });
    const plane = new THREE.Mesh(groundGeo, groundMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Terrain bumps
    for (let i = 0; i < 80; i++) {
      const r = 3 + Math.random() * 25;
      const ang = Math.random() * Math.PI * 2;
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.3),
        new THREE.MeshStandardMaterial({ color: 0x081005, roughness: 1 })
      );
      bump.position.set(Math.cos(ang) * r, -0.3, Math.sin(ang) * r);
      bump.scale.y = 0.2;
      scene.add(bump);
    }

    // Grid - M.E.C.A. green tactical
    const grid = new THREE.GridHelper(50000, 100, 0x004411, 0x002208);
    grid.position.y = 0.02;
    scene.add(grid);

    // Cannon
    const cannonGroup = buildCannon();
    cannonGroup.position.set(0, 0, 0);
    scene.add(cannonGroup);
    cannonGroupRef.current = cannonGroup;

    // Soldiers
    const soldier1 = buildSoldier(0xd4a574, 0x2d4a1e);
    soldier1.position.set(-6, 0, 5);
    soldier1.rotation.y = 0.5;
    scene.add(soldier1);

    const soldier2 = buildSoldier(0xd4a574, 0x2d4a1e);
    soldier2.position.set(-4.5, 0, 6.5);
    soldier2.rotation.y = 0.3;
    scene.add(soldier2);

    const soldier3 = buildSoldier(0xd4a574, 0x2d4a1e);
    soldier3.position.set(-7.5, 0, 4);
    soldier3.rotation.y = 0.7;
    scene.add(soldier3);

    // Projectile
    const projectile = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 })
    );
    projectile.visible = false;
    projectile.castShadow = true;
    scene.add(projectile);
    projectileRef.current = projectile;

    // Trail
    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xff3333, linewidth: 2 })
    );
    scene.add(trail);
    trailRef.current = trail;

    // Impact marker
    const impactMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    impactMarker.rotation.x = -Math.PI / 2;
    impactMarker.visible = false;
    scene.add(impactMarker);
    impactMarkerRef.current = impactMarker;

    // Muzzle flash
    const muzzleFlash = new THREE.PointLight(0xff5500, 0, 40);
    muzzleFlash.position.set(0, 4, 5);
    scene.add(muzzleFlash);
    muzzleFlashRef.current = muzzleFlash;

    // Smoke particles
    const smokeGeo = new THREE.BufferGeometry();
    const smokeCount = 200;
    const smokePositions = new Float32Array(smokeCount * 3);
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0x666666,
      size: 0.8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);
    smokeParticlesRef.current = smokeParticles;

    // Explosion particles
    const expGeo = new THREE.BufferGeometry();
    const expCount = 300;
    const expPositions = new Float32Array(expCount * 3);
    const expVelocities = new Float32Array(expCount * 3);
    const expColors = new Float32Array(expCount * 3);
    expGeo.setAttribute('position', new THREE.BufferAttribute(expPositions, 3));
    expGeo.setAttribute('color', new THREE.BufferAttribute(expColors, 3));
    const expMat = new THREE.PointsMaterial({
      size: 1.2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    const explosion = new THREE.Points(expGeo, expMat);
    scene.add(explosion);
    explosionRef.current = explosion;
    (explosion as any).velocities = expVelocities;
    (explosion as any).life = 0;

    // Resize
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      controls.update();

      // Recoil
      if (recoilAnimRef.current.active && barrelGroupRef.current) {
        recoilAnimRef.current.t += dt * 8;
        const recoil = Math.sin(recoilAnimRef.current.t) * Math.exp(-recoilAnimRef.current.t * 2) * 2;
        if (recoilAnimRef.current.t > 3) {
          recoilAnimRef.current.active = false;
          recoilAnimRef.current.t = 0;
          barrelGroupRef.current.position.z = 0;
        } else {
          barrelGroupRef.current.position.z = -Math.max(0, recoil);
        }
      }

      // Flash decay
      if (muzzleFlashRef.current && muzzleFlashRef.current.intensity > 0) {
        muzzleFlashRef.current.intensity *= 0.85;
        if (muzzleFlashRef.current.intensity < 0.1) muzzleFlashRef.current.intensity = 0;
      }

      // Smoke
      if (smokeParticlesRef.current) {
        const mat = smokeParticlesRef.current.material as THREE.PointsMaterial;
        if (mat.opacity > 0) {
          mat.opacity -= dt * 0.4;
          const posAttr = smokeParticlesRef.current.geometry.attributes.position;
          for (let i = 0; i < smokeCount; i++) {
            posAttr.setY(i, posAttr.getY(i) + dt * (0.5 + Math.random() * 1.5));
            posAttr.setX(i, posAttr.getX(i) + dt * (Math.random() - 0.5) * 0.5);
          }
          posAttr.needsUpdate = true;
        }
      }

      // Explosion
      if (explosionRef.current) {
        const expData = explosionRef.current as any;
        if (expData.life > 0) {
          expData.life -= dt;
          const mat = explosionRef.current.material as THREE.PointsMaterial;
          mat.opacity = Math.max(0, expData.life * 2);
          const posAttr = explosionRef.current.geometry.attributes.position;
          for (let i = 0; i < expCount; i++) {
            posAttr.setX(i, posAttr.getX(i) + expData.velocities[i * 3] * dt);
            posAttr.setY(i, posAttr.getY(i) + expData.velocities[i * 3 + 1] * dt);
            posAttr.setZ(i, posAttr.getZ(i) + expData.velocities[i * 3 + 2] * dt);
            expData.velocities[i * 3 + 1] -= 9.8 * dt;
          }
          posAttr.needsUpdate = true;
        } else {
          (explosionRef.current.material as THREE.PointsMaterial).opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  useEffect(() => {
    const cleanup = init();
    return () => { if (cleanup) cleanup(); };
  }, [init]);

  const setBarrelAngle = useCallback((angleRad: number) => {
    if (barrelGroupRef.current) barrelGroupRef.current.rotation.x = -angleRad;
  }, []);

  const setProjectileVisible = useCallback((visible: boolean) => {
    if (projectileRef.current) projectileRef.current.visible = visible;
  }, []);

  const setProjectilePosition = useCallback((x: number, y: number, z: number) => {
    if (projectileRef.current) projectileRef.current.position.set(x, y, z);
  }, []);

  const setProjectileOrientation = useCallback((vx: number, vy: number, vz: number) => {
    if (projectileRef.current) {
      const vel = new THREE.Vector3(vx, vy, vz);
      if (vel.lengthSq() > 0.1) {
        projectileRef.current.lookAt(projectileRef.current.position.clone().add(vel));
      }
    }
  }, []);

  const updateTrail = useCallback((points: THREE.Vector3[]) => {
    if (trailRef.current) trailRef.current.geometry.setFromPoints(points);
  }, []);

  const clearTrail = useCallback(() => {
    if (trailRef.current) trailRef.current.geometry.setFromPoints([]);
  }, []);

  const showImpactMarker = useCallback((x: number, z: number) => {
    if (impactMarkerRef.current) {
      impactMarkerRef.current.position.set(x, 0.03, z);
      impactMarkerRef.current.visible = true;
      (impactMarkerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8;
    }
    if (explosionRef.current) {
      const expData = explosionRef.current as any;
      const posAttr = explosionRef.current.geometry.attributes.position;
      for (let i = 0; i < 300; i++) {
        posAttr.setXYZ(i, x, 0.5, z);
        const speed = 5 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        expData.velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
        expData.velocities[i * 3 + 1] = speed * Math.cos(phi) + 5;
        expData.velocities[i * 3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      }
      posAttr.needsUpdate = true;
      expData.life = 1.5;
      (explosionRef.current.material as THREE.PointsMaterial).opacity = 1;
      const colAttr = explosionRef.current.geometry.attributes.color;
      for (let i = 0; i < 300; i++) {
        const t = Math.random();
        if (t < 0.3) { colAttr.setXYZ(i, 1, 0.8, 0.2); }
        else if (t < 0.6) { colAttr.setXYZ(i, 1, 0.4, 0.05); }
        else { colAttr.setXYZ(i, 0.8, 0.8, 0.8); }
      }
      colAttr.needsUpdate = true;
    }
  }, []);

  const hideImpactMarker = useCallback(() => {
    if (impactMarkerRef.current) impactMarkerRef.current.visible = false;
  }, []);

  const triggerFireEffects = useCallback((angleRad: number) => {
    if (muzzleFlashRef.current && barrelGroupRef.current) {
      muzzleFlashRef.current.intensity = 80;
      const barrelLen = 5.5;
      muzzleFlashRef.current.position.set(
        0,
        2.5 + Math.sin(angleRad) * barrelLen,
        Math.cos(angleRad) * barrelLen
      );
    }
    if (smokeParticlesRef.current) {
      const mat = smokeParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.6;
      const posAttr = smokeParticlesRef.current.geometry.attributes.position;
      for (let i = 0; i < 200; i++) {
        posAttr.setXYZ(i,
          (Math.random() - 0.5) * 1.5,
          2.2 + Math.random() * 1.5,
          4 + Math.random() * 2
        );
      }
      posAttr.needsUpdate = true;
    }
    recoilAnimRef.current.active = true;
    recoilAnimRef.current.t = 0;
  }, []);

  const updateCameraFollow = useCallback((targetPos: THREE.Vector3) => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.target.lerp(targetPos, 0.1);
      const offset = new THREE.Vector3(-30, 15, 30);
      cameraRef.current.position.lerp(targetPos.clone().add(offset), 0.05);
    }
  }, []);

  const setCameraFixed = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.target.set(0, 2, 0);
      cameraRef.current.position.set(-25, 12, 35);
    }
  }, []);

  const setCameraGod = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(0, 2000, 800);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, []);

  return {
    sceneRef, setBarrelAngle, setProjectileVisible, setProjectilePosition,
    setProjectileOrientation, updateTrail, clearTrail, showImpactMarker,
    hideImpactMarker, triggerFireEffects, updateCameraFollow, setCameraFixed,
    setCameraGod, projectileRef, impactMarkerRef, cameraRef, controlsRef
  };
}

function buildCannon(): THREE.Group {
  const group = new THREE.Group();
  const barrelGroup = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.85, roughness: 0.25 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.3 });
  const paintMat = new THREE.MeshStandardMaterial({ color: 0x3d4a2e, metalness: 0.3, roughness: 0.7 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });

  // Spade plates
  for (const sx of [-1.6, 1.6]) {
    const spade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 2.5), paintMat);
    spade.position.set(sx, 0.9, -2.8);
    spade.castShadow = true;
    group.add(spade);
  }

  // Trail body
  const trailBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 5.5), paintMat);
  trailBody.position.set(0, 1.1, -0.3);
  trailBody.castShadow = true;
  group.add(trailBody);

  // Carriage
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 3.5), paintMat);
  carriage.position.set(0, 1.9, 0.5);
  carriage.castShadow = true;
  group.add(carriage);

  for (const sx of [-1.1, 1.1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 3.8), paintMat);
    side.position.set(sx, 1.5, 0.5);
    side.castShadow = true;
    group.add(side);
  }

  // Breech
  const breech = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.2, 16), metalMat);
  breech.rotation.z = Math.PI / 2;
  breech.position.set(0, 2.5, -0.8);
  breech.castShadow = true;
  barrelGroup.add(breech);

  // Barrel
  const barrelOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.5, 20), darkMetalMat);
  barrelOuter.rotation.x = Math.PI / 2;
  barrelOuter.position.set(0, 0, 2.5);
  barrelOuter.castShadow = true;
  barrelGroup.add(barrelOuter);

  const barrelInner = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.2, 16), metalMat);
  barrelInner.rotation.x = Math.PI / 2;
  barrelInner.position.set(0, 0, 2.6);
  barrelGroup.add(barrelInner);

  // Muzzle brake
  const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.8, 16), darkMetalMat);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, 0, 5.4);
  barrelGroup.add(muzzleBrake);

  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), darkMetalMat);
    vent.rotation.z = (i * Math.PI) / 2;
    vent.position.set(0, 0, 5.4);
    barrelGroup.add(vent);
  }

  // Bore evacuator
  const evacuator = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.9, 16), darkMetalMat);
  evacuator.rotation.x = Math.PI / 2;
  evacuator.position.set(0, 0, 3.8);
  barrelGroup.add(evacuator);

  barrelGroup.position.set(0, 2.5, -0.8);
  group.add(barrelGroup);

  // Wheels
  function makeWheel(x: number, z: number) {
    const wheelG = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.25, 12, 24), tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    wheelG.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16), rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelG.add(rim);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.3, 0.06), rimMat);
      spoke.rotation.x = (i * Math.PI) / 3;
      spoke.rotation.z = Math.PI / 2;
      wheelG.add(spoke);
    }
    wheelG.position.set(x, 0.9, z);
    return wheelG;
  }

  group.add(makeWheel(-1.5, -1.5));
  group.add(makeWheel(1.5, -1.5));
  group.add(makeWheel(-1.5, 1.5));
  group.add(makeWheel(1.5, 1.5));

  // Towing eye
  const towEye = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 12), metalMat);
  towEye.rotation.y = Math.PI / 2;
  towEye.position.set(0, 1.0, -3.5);
  group.add(towEye);

  // Firing handles
  for (const sx of [-0.6, 0.6]) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), metalMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(sx, 2.2, -0.5);
    group.add(handle);
  }

  // Equilibrators
  for (const sx of [-1.25, 1.25]) {
    const eq = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), metalMat);
    eq.position.set(sx, 2.0, 0.2);
    eq.rotation.x = -0.3;
    group.add(eq);
  }

  // Shield
  const shield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.08), paintMat);
  shield.position.set(0, 2.2, 2.2);
  shield.rotation.x = -0.15;
  group.add(shield);

  return group;
}

function buildSoldier(skinColor: number, uniformColor: number): THREE.Group {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
  const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0x3d4a2e, roughness: 0.6 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), uniformMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  // Helmet
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
  helmet.position.y = 1.88;
  helmet.castShadow = true;
  group.add(helmet);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), skinMat);
  neck.position.y = 1.7;
  group.add(neck);

  // Arms
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8), uniformMat);
    arm.position.set(sx * 0.32, 1.4, 0);
    arm.rotation.z = sx * 0.15;
    arm.castShadow = true;
    group.add(arm);
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.5, 8), skinMat);
    forearm.position.set(sx * 0.38, 1.0, 0.05);
    forearm.rotation.x = -0.3;
    forearm.rotation.z = sx * 0.1;
    group.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
    hand.position.set(sx * 0.4, 0.72, 0.1);
    group.add(hand);
  }

  // Legs
  for (const sx of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.55, 8), uniformMat);
    thigh.position.set(sx * 0.13, 0.85, 0);
    thigh.castShadow = true;
    group.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.55, 8), uniformMat);
    shin.position.set(sx * 0.13, 0.38, 0.02);
    shin.castShadow = true;
    group.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.22), bootMat);
    boot.position.set(sx * 0.13, 0.06, 0.05);
    boot.castShadow = true;
    group.add(boot);
  }

  // Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }));
  belt.position.y = 1.08;
  group.add(belt);

  return group;
}
