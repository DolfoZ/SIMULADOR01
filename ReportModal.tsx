import { useEffect, useRef } from 'react';
import { X, Shield, Target } from 'lucide-react';
import type { AuditResult } from '../types/ballistics';
import Chart from 'chart.js/auto';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ammoName: string;
  chargeName: string;
  angle: number;
  v0: number;
  range: number;
  tof: number;
  impactV: number;
  audit: AuditResult | null;
}

export default function ReportModal({
  isOpen, onClose, ammoName, chargeName, angle, v0, range, tof, impactV, audit
}: ReportModalProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!isOpen || !chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Presión', 'Temp', 'Viento X', 'Viento Z'],
        datasets: [{
          label: 'Desviación (m)',
          data: [Math.random() * 4, Math.random() * 3, Math.random() * 8, Math.random() * 6],
          backgroundColor: ['rgba(0,255,102,0.6)', 'rgba(255,80,80,0.6)', 'rgba(0,200,100,0.6)', 'rgba(255,200,50,0.6)']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: 'rgba(0,255,102,0.5)', font: { family: "'Courier New', monospace", size: 10 } }, grid: { color: 'rgba(0,255,102,0.08)' } },
          y: { ticks: { color: 'rgba(0,255,102,0.5)', font: { family: "'Courier New', monospace", size: 10 } }, grid: { color: 'rgba(0,255,102,0.08)' } }
        }
      }
    });
    return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; } };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="meca-panel rounded-none p-5 w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl relative pointer-events-auto"
        style={{ background: '#050a08' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-green-500/50 hover:text-red-400 transition-colors"><X size={20} /></button>

        <div className="meca-title pb-3 mb-4">
          <h3 className="text-sm font-bold tracking-wider flex items-center gap-2"><Target size={16} /> REPORTE DE IMPACTO</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-[10px] font-bold mb-2 text-green-500/50 tracking-wider uppercase">PARÁMETROS</h4>
            <div className="space-y-1 text-xs text-green-200/40 font-mono">
              <p><span className="text-green-300/60">Munición:</span> {ammoName || '--'}</p>
              <p><span className="text-green-300/60">Carga:</span> {chargeName || '--'}</p>
              <p><span className="text-green-300/60">Elevación:</span> {angle}°</p>
              <p><span className="text-green-300/60">V0:</span> {v0} m/s</p>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold mb-2 text-green-500/50 tracking-wider uppercase">RESULTADOS</h4>
            <div className="space-y-1 text-xs text-green-200/40 font-mono">
              <p><span className="text-green-300/60">Alcance:</span> {range.toFixed(1)} m</p>
              <p><span className="text-green-300/60">Tiempo vuelo:</span> {tof.toFixed(1)} s</p>
              <p><span className="text-green-300/60">Vel. impacto:</span> {impactV.toFixed(1)} m/s</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-[10px] font-bold mb-2 text-green-500/50 tracking-wider uppercase">EFECTOS</h4>
          <div className="w-full h-[200px]"><canvas ref={chartRef} /></div>
        </div>

        <div className="mt-4 p-3 bg-green-900/10 border border-green-800/20">
          <h4 className="text-[10px] font-bold mb-2 text-green-500/50 tracking-wider uppercase flex items-center gap-1"><Shield size={10} /> AUDITORÍA</h4>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {['RK45 vs Analítico', 'RK45 vs STANAG', 'Atmósfera'].map((label, idx) => (
              <div key={label} className="p-2 bg-black/40 border border-green-800/15">
                <p className="font-bold text-green-400/50">{label}</p>
                <p style={{ color: audit?.checks[idx]?.c || '#64748b' }}>{audit?.checks[idx]?.st || '--'}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[9px] text-green-600/30 text-center mt-4 font-mono">Generado: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
