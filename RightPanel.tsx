import { useState } from 'react';
import type { TelemetryPoint } from '../types/ballistics';
import { Minimize2, Maximize2, Activity, FileText } from 'lucide-react';

interface RightPanelProps {
  telemetry: TelemetryPoint[];
  simTime: number;
  stateX: number;
  stateY: number;
  stateV: number;
  tacticalNetwork: boolean;
  onShowReport: () => void;
  hasReport: boolean;
}

export default function RightPanel(props: RightPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { telemetry, simTime, stateX, stateY, stateV, tacticalNetwork, onShowReport, hasReport } = props;

  if (collapsed) {
    return (
      <div className="meca-panel pointer-events-auto flex flex-col items-center gap-2 p-2 m-3" style={{ width: '40px' }}>
        <Activity size={14} className="text-green-400" />
        <button onClick={() => setCollapsed(false)} className="text-green-400/50 hover:text-green-300"><Maximize2 size={14} /></button>
      </div>
    );
  }

  return (
    <div className="meca-panel pointer-events-auto flex flex-col m-3" style={{ width: '280px', maxHeight: 'calc(100vh - 24px)' }}>
      <div className="meca-title flex justify-between items-center text-sm px-4 py-3">
        <span className="flex items-center gap-2"><Activity size={14} /> Telemetría</span>
        <button onClick={() => setCollapsed(true)} className="text-green-400/50 hover:text-green-300"><Minimize2 size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Network */}
        <div className="mb-3 text-[10px] font-bold tracking-wider flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${tacticalNetwork ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-red-500'}`} />
          <span className="text-green-400/50">T-LINK: {tacticalNetwork ? 'CONECTADO' : 'OFF'}</span>
        </div>

        {/* Status */}
        <ul className="list-none p-0 m-0 mb-4 space-y-2">
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Estado Servos</span>
            <span className="text-green-400 font-bold">[NOMINAL]</span>
          </li>
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Presión Fluidos</span>
            <span className="text-green-400 font-bold">3200 PSI</span>
          </li>
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Temp. Cañón</span>
            <span className="text-amber-400 font-bold">82°C</span>
          </li>
        </ul>

        {/* Telemetry Grid */}
        <div className="meca-title text-xs px-2 py-2 mb-3" style={{ borderTop: '1px solid rgba(0,255,102,0.3)', borderBottom: 'none' }}>
          Solución de Tiro
        </div>
        <ul className="list-none p-0 m-0 space-y-2 mb-4">
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Dist. Impacto</span>
            <span className="text-green-400 font-bold font-mono">{stateX.toFixed(1)} m</span>
          </li>
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Altitud Max</span>
            <span className="text-green-400 font-bold font-mono">{stateY.toFixed(1)} m</span>
          </li>
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Tiempo Vuelo</span>
            <span className="text-green-400 font-bold font-mono">{simTime.toFixed(1)} s</span>
          </li>
          <li className="flex justify-between text-xs">
            <span className="text-green-500/50">Velocidad</span>
            <span className="text-amber-400 font-bold font-mono">{stateV.toFixed(1)} m/s</span>
          </li>
        </ul>

        {/* Data table */}
        <div className="overflow-y-auto border-t border-green-800/20 mt-2" style={{ maxHeight: '150px' }}>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr>
                {['T(s)', 'X(m)', 'Y(m)', 'V(m/s)'].map(h => (
                  <th key={h} className="border border-green-800/20 p-1 bg-green-900/10 sticky top-0 font-bold text-green-400/50 text-[9px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {telemetry.map((row, i) => (
                <tr key={i} className="hover:bg-green-900/5">
                  <td className="border border-green-800/10 p-1 text-center text-green-300/40 font-mono">{row.t.toFixed(1)}</td>
                  <td className="border border-green-800/10 p-1 text-center text-green-300/40 font-mono">{row.x.toFixed(0)}</td>
                  <td className="border border-green-800/10 p-1 text-center text-green-300/40 font-mono">{row.y.toFixed(0)}</td>
                  <td className="border border-green-800/10 p-1 text-center text-amber-300/40 font-mono">{row.v.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasReport && (
          <button onClick={onShowReport}
            className="w-full mt-3 py-2 bg-green-900/20 text-green-400 text-[10px] font-bold tracking-wider uppercase border border-green-500/30 hover:bg-green-900/30 transition-all">
            <FileText size={10} className="inline mr-1" />VER INFORME
          </button>
        )}
      </div>
    </div>
  );
}
