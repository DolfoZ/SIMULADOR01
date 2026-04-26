import type { CameraMode } from '../types/ballistics';
import { Camera, Eye, Globe } from 'lucide-react';

interface BottomBarProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}

export default function BottomBar({ cameraMode, onCameraModeChange }: BottomBarProps) {
  const modes: { key: CameraMode; label: string; icon: React.ReactNode }[] = [
    { key: 'fixed', label: 'FIJA', icon: <Camera size={10} /> },
    { key: 'follow', label: 'SEGUIMIENTO', icon: <Eye size={10} /> },
    { key: 'god', label: 'GOD', icon: <Globe size={10} /> }
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-auto px-2 py-1"
      style={{
        background: 'rgba(5,10,8,0.7)',
        border: '1px solid rgba(0,255,102,0.2)',
        zIndex: 10
      }}>
      {modes.map(mode => (
        <button key={mode.key} onClick={() => onCameraModeChange(mode.key)}
          className={`px-3 py-1 text-[9px] font-bold tracking-widest border transition-all flex items-center gap-1 ${
            cameraMode === mode.key
              ? 'bg-green-900/40 text-green-300 border-green-500/50'
              : 'bg-transparent text-green-600/40 border-green-800/20 hover:border-green-600/40 hover:text-green-400'
          }`}>
          {mode.icon}{mode.label}
        </button>
      ))}
    </div>
  );
}
