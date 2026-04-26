import { useState, useRef, useCallback } from 'react';
import { BallisticsRK4, weaponsData, runAudit } from '../lib/ballisticsEngine';
import type { SimulationState, TelemetryPoint, CameraMode, ChargeType, AuditResult } from '../types/ballistics';
import * as THREE from 'three';

export function useBallistics(
  setBarrelAngle: (angleRad: number) => void,
  setProjectileVisible: (visible: boolean) => void,
  setProjectilePosition: (x: number, y: number, z: number) => void,
  setProjectileOrientation: (vx: number, vy: number, vz: number) => void,
  updateTrail: (points: THREE.Vector3[]) => void,
  clearTrail: () => void,
  showImpactMarker: (x: number, z: number) => void,
  hideImpactMarker: () => void,
  triggerFireEffects: (angleRad: number) => void,
  updateCameraFollow: (targetPos: THREE.Vector3) => void,
  setCameraFixed: () => void,
  setCameraGod: () => void,
  cameraModeRef: React.MutableRefObject<CameraMode>
) {
  const [calibre, setCalibre] = useState('155');
  const [ammoId, setAmmoId] = useState('HE_M106');
  const [chargeIndex, setChargeIndex] = useState(0);
  const [chargeType, setChargeType] = useState<ChargeType>('catrachas');
  const [angle, setAngle] = useState(45);
  const [windX, setWindX] = useState(0);
  const [windZ, setWindZ] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [currentV0, setCurrentV0] = useState(827);
  const [tacticalNetwork, setTacticalNetwork] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [impactData, setImpactData] = useState<{
    range: number;
    tof: number;
    impactV: number;
    audit: AuditResult | null;
  }>({ range: 0, tof: 0, impactV: 0, audit: null });
  const [lastFlightData, setLastFlightData] = useState<{
    ammoName: string;
    chargeName: string;
    angle: number;
    v0: number;
  } | null>(null);

  const integratorRef = useRef(new BallisticsRK4());
  const stateRef = useRef<SimulationState>({ x: 0, y: 0.1, z: 0, vx: 0, vy: 0, vz: 0 });
  const pathPointsRef = useRef<THREE.Vector3[]>([]);
  const animFrameRef = useRef<number>(0);
  const simTimeRef = useRef(0);
  const isFlyingRef = useRef(false);

  const activeAmmo = weaponsData[calibre].ammo.find(a => a.id === ammoId) || weaponsData[calibre].ammo[0];
  const activeCharge = weaponsData[calibre].charges[chargeType][chargeIndex];

  const updatePhysics = useCallback((dt: number) => {
    if (!isFlyingRef.current) return;

    simTimeRef.current += dt;
    const params = {
      mass: activeAmmo.mass,
      windX: windX,
      windZ: windZ
    };

    const s = stateRef.current;
    const stateArray = [s.x, s.y, s.z, s.vx, s.vy, s.vz];
    const newState = integratorRef.current.step(stateArray, dt, params);

    stateRef.current = {
      x: newState[0], y: newState[1], z: newState[2],
      vx: newState[3], vy: newState[4], vz: newState[5]
    };

    if (stateRef.current.y <= 0) {
      stateRef.current.y = 0;
      finishSimulation();
      return;
    }

    const pos = new THREE.Vector3(stateRef.current.x, stateRef.current.y, stateRef.current.z);
    setProjectilePosition(stateRef.current.x, stateRef.current.y, stateRef.current.z);
    setProjectileOrientation(stateRef.current.vx, stateRef.current.vy, stateRef.current.vz);

    pathPointsRef.current.push(pos);
    updateTrail(pathPointsRef.current);

    const v = Math.sqrt(stateRef.current.vx ** 2 + stateRef.current.vy ** 2 + stateRef.current.vz ** 2);

    setSimTime(simTimeRef.current);
    setTelemetry(prev => {
      if (prev.length === 0 || stateRef.current.x - prev[prev.length - 1].x >= 100) {
        return [...prev, { t: simTimeRef.current, x: stateRef.current.x, y: stateRef.current.y, v }];
      }
      return prev;
    });

    if (cameraModeRef.current === 'follow') {
      updateCameraFollow(pos);
    }
  }, [activeAmmo, windX, windZ, setProjectilePosition, setProjectileOrientation, updateTrail, updateCameraFollow, cameraModeRef]);

  const finishSimulation = useCallback(() => {
    isFlyingRef.current = false;
    setIsFlying(false);
    setProjectileVisible(false);

    const s = stateRef.current;
    showImpactMarker(s.x, s.z);

    const vImpact = Math.sqrt(s.vx ** 2 + s.vy ** 2 + s.vz ** 2);
    const audit = runAudit(s.x, simTimeRef.current, activeAmmo.id, angle);

    setImpactData({
      range: s.x,
      tof: simTimeRef.current,
      impactV: vImpact,
      audit
    });

    setLastFlightData({
      ammoName: activeAmmo.name,
      chargeName: activeCharge.name,
      angle,
      v0: currentV0
    });

    setShowReport(true);
  }, [activeAmmo, activeCharge, angle, currentV0, setProjectileVisible, showImpactMarker]);

  const fireProjectile = useCallback(() => {
    if (isFlyingRef.current) return;

    isFlyingRef.current = true;
    setIsFlying(true);
    simTimeRef.current = 0;
    pathPointsRef.current = [];
    clearTrail();
    setTelemetry([]);
    setShowReport(false);
    hideImpactMarker();
    setProjectileVisible(true);

    const angleRad = angle * Math.PI / 180;
    const v0 = currentV0;

    stateRef.current = {
      x: 0, y: 2.5, z: 0,
      vx: v0 * Math.cos(angleRad),
      vy: v0 * Math.sin(angleRad),
      vz: 0
    };

    setProjectilePosition(0, 2.5, 0);
    setBarrelAngle(angleRad);
    triggerFireEffects(angleRad);

    const animate = () => {
      if (!isFlyingRef.current) return;
      updatePhysics(0.016);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [angle, currentV0, setBarrelAngle, setProjectileVisible, setProjectilePosition, clearTrail, hideImpactMarker, triggerFireEffects, updatePhysics]);

  const updateBallistics = useCallback((cal: string, chgIdx: number, chgType: ChargeType) => {
    const charge = weaponsData[cal].charges[chgType][chgIdx];
    setCurrentV0(charge.v0);
  }, []);

  const handleCalibreChange = useCallback((cal: string) => {
    setCalibre(cal);
    const firstAmmo = weaponsData[cal].ammo[0];
    setAmmoId(firstAmmo.id);
    setChargeIndex(0);
    updateBallistics(cal, 0, chargeType);
  }, [chargeType, updateBallistics]);

  const handleAmmoChange = useCallback((id: string) => {
    setAmmoId(id);
  }, []);

  const handleChargeChange = useCallback((idx: number) => {
    setChargeIndex(idx);
    updateBallistics(calibre, idx, chargeType);
  }, [calibre, chargeType, updateBallistics]);

  const handleChargeTypeChange = useCallback((type: ChargeType) => {
    setChargeType(type);
    setChargeIndex(0);
    updateBallistics(calibre, 0, type);
  }, [calibre, updateBallistics]);

  const handleAngleChange = useCallback((val: number) => {
    setAngle(val);
  }, []);

  const handleWindChange = useCallback((x: number, z: number) => {
    setWindX(x);
    setWindZ(z);
  }, []);

  const toggleTacticalNetwork = useCallback(() => {
    setTacticalNetwork(prev => !prev);
  }, []);

  const toggleTables = useCallback(() => {
    setShowTables(prev => !prev);
  }, []);

  return {
    calibre,
    ammoId,
    chargeIndex,
    chargeType,
    angle,
    windX,
    windZ,
    isFlying,
    simTime,
    telemetry,
    currentV0,
    tacticalNetwork,
    showReport,
    showTables,
    impactData,
    lastFlightData,
    activeAmmo,
    activeCharge,
    fireProjectile,
    handleCalibreChange,
    handleAmmoChange,
    handleChargeChange,
    handleChargeTypeChange,
    handleAngleChange,
    handleWindChange,
    toggleTacticalNetwork,
    toggleTables,
    setShowReport,
    setShowTables,
    updateCameraFollow,
    setCameraFixed,
    setCameraGod,
    stateRef,
    isFlyingRef
  };
}
