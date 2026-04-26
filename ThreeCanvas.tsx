import { useRef, useEffect } from 'react';
import { useThreeScene } from '../hooks/useThreeScene';

interface ThreeCanvasProps {
  onSceneReady: (sceneApi: ReturnType<typeof useThreeScene>) => void;
}

export default function ThreeCanvas({ onSceneReady }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneApi = useThreeScene(containerRef);

  useEffect(() => {
    onSceneReady(sceneApi);
  }, [onSceneReady, sceneApi]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1
      }}
    />
  );
}
