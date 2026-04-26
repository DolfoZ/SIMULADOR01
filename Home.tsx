import { useCallback, useRef, useState, useEffect } from 'react';
import ThreeCanvas from '../sections/ThreeCanvas';
import LeftPanel from '../sections/LeftPanel';
import RightPanel from '../sections/RightPanel';
import BottomBar from '../sections/BottomBar';
import TablesModal from '../sections/TablesModal';
import ReportModal from '../sections/ReportModal';
import AuditIndicator from '../sections/AuditIndicator';
import { useBallistics } from '../hooks/useBallistics';
import type { useThreeScene } from '../hooks/useThreeScene';
import type { CameraMode } from '../types/ballistics';

export default function Home() {
  const sceneApiRef = useRef<ReturnType<typeof useThreeScene> | null>(null);
  const cameraModeRef = useRef<CameraMode>('fixed');
  const [cameraMode, setCameraMode] = useState<CameraMode>('fixed');

  const handleSceneReady = useCallback((api: ReturnType<typeof useThreeScene>) => {
    sceneApiRef.current = api;
  }, []);

  const ballistics = useBallistics(
    (angleRad) => sceneApiRef.current?.setBarrelAngle(angleRad),
    (visible) => sceneApiRef.current?.setProjectileVisible(visible),
    (x, y, z) => sceneApiRef.current?.setProjectilePosition(x, y, z),
    (vx, vy, vz) => sceneApiRef.current?.setProjectileOrientation(vx, vy, vz),
    (points) => sceneApiRef.current?.updateTrail(points),
    () => sceneApiRef.current?.clearTrail(),
    (x, z) => sceneApiRef.current?.showImpactMarker(x, z),
    () => sceneApiRef.current?.hideImpactMarker(),
    (angleRad) => sceneApiRef.current?.triggerFireEffects(angleRad),
    (targetPos) => sceneApiRef.current?.updateCameraFollow(targetPos),
    () => sceneApiRef.current?.setCameraFixed(),
    () => sceneApiRef.current?.setCameraGod(),
    cameraModeRef
  );

  const handleCameraModeChange = useCallback((mode: CameraMode) => {
    cameraModeRef.current = mode;
    setCameraMode(mode);
    if (mode === 'fixed') sceneApiRef.current?.setCameraFixed();
    if (mode === 'god') sceneApiRef.current?.setCameraGod();
  }, []);

  useEffect(() => {
    if (!ballistics.isFlying || cameraMode !== 'follow') return;
    const interval = setInterval(() => {
      if (sceneApiRef.current?.projectileRef.current?.visible) {
        sceneApiRef.current.updateCameraFollow(sceneApiRef.current.projectileRef.current.position);
      } else if (sceneApiRef.current?.impactMarkerRef.current?.visible) {
        sceneApiRef.current.updateCameraFollow(sceneApiRef.current.impactMarkerRef.current.position);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [ballistics.isFlying, cameraMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex" style={{ background: '#050a08' }}>
      {/* Left: FCS Panel */}
      <LeftPanel
        calibre={ballistics.calibre}
        ammoId={ballistics.ammoId}
        chargeIndex={ballistics.chargeIndex}
        chargeType={ballistics.chargeType}
        angle={ballistics.angle}
        windX={ballistics.windX}
        windZ={ballistics.windZ}
        currentV0={ballistics.currentV0}
        isFlying={ballistics.isFlying}
        onCalibreChange={ballistics.handleCalibreChange}
        onAmmoChange={ballistics.handleAmmoChange}
        onChargeChange={ballistics.handleChargeChange}
        onChargeTypeChange={ballistics.handleChargeTypeChange}
        onAngleChange={ballistics.handleAngleChange}
        onWindChange={ballistics.handleWindChange}
        onFire={ballistics.fireProjectile}
        onToggleTables={ballistics.toggleTables}
        onToggleTacticalNetwork={ballistics.toggleTacticalNetwork}
        tacticalNetwork={ballistics.tacticalNetwork}
      />

      {/* Center: 3D Viewport */}
      <div className="flex-1 relative" style={{ minWidth: 0 }}>
        <ThreeCanvas onSceneReady={handleSceneReady} />

        {/* Overlay title */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 8 }}>
          <h2 className="meca-title text-sm px-4 py-1 bg-black/40" style={{ border: '1px solid rgba(0,255,102,0.3)' }}>
            Visor Balístico Vectorial — RK4 12-DOF
          </h2>
        </div>

        {/* Bottom bar inside center */}
        <BottomBar cameraMode={cameraMode} onCameraModeChange={handleCameraModeChange} />
      </div>

      {/* Right: Telemetry Panel */}
      <RightPanel
        telemetry={ballistics.telemetry}
        simTime={ballistics.simTime}
        stateX={ballistics.stateRef.current.x}
        stateY={ballistics.stateRef.current.y}
        stateV={Math.sqrt(
          ballistics.stateRef.current.vx ** 2 +
          ballistics.stateRef.current.vy ** 2 +
          ballistics.stateRef.current.vz ** 2
        )}
        tacticalNetwork={ballistics.tacticalNetwork}
        onShowReport={() => ballistics.setShowReport(true)}
        hasReport={!!ballistics.impactData.audit}
      />

      <AuditIndicator audit={ballistics.impactData.audit} />

      <TablesModal
        isOpen={ballistics.showTables}
        onClose={() => ballistics.setShowTables(false)}
        calibre={ballistics.calibre}
        ammoId={ballistics.ammoId}
        chargeType={ballistics.chargeType}
        chargeIndex={ballistics.chargeIndex}
      />

      <ReportModal
        isOpen={ballistics.showReport}
        onClose={() => ballistics.setShowReport(false)}
        ammoName={ballistics.lastFlightData?.ammoName || ''}
        chargeName={ballistics.lastFlightData?.chargeName || ''}
        angle={ballistics.lastFlightData?.angle || 0}
        v0={ballistics.lastFlightData?.v0 || 0}
        range={ballistics.impactData.range}
        tof={ballistics.impactData.tof}
        impactV={ballistics.impactData.impactV}
        audit={ballistics.impactData.audit}
      />
    </div>
  );
}
