import { useState } from 'react';
import { weaponsData } from '../lib/ballisticsEngine';
import type { ChargeType } from '../types/ballistics';
import { Minimize2, Maximize2, Crosshair, Factory, Radio, Table } from 'lucide-react';

interface LeftPanelProps {
  calibre: string;
  ammoId: string;
  chargeIndex: number;
  chargeType: ChargeType;
  angle: number;
  windX: number;
  windZ: number;
  currentV0: number;
  isFlying: boolean;
  onCalibreChange: (cal: string) => void;
  onAmmoChange: (id: string) => void;
  onChargeChange: (idx: number) => void;
  onChargeTypeChange: (type: ChargeType) => void;
  onAngleChange: (val: number) => void;
  onWindChange: (x: number, z: number) => void;
  onFire: () => void;
  onToggleTables: () => void;
  onToggleTacticalNetwork: () => void;
  tacticalNetwork: boolean;
}

export default function LeftPanel(props: LeftPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { calibre, ammoId, chargeIndex, chargeType, angle, windX, windZ, currentV0, isFlying,
    onCalibreChange, onAmmoChange, onChargeChange, onChargeTypeChange, onAngleChange, onWindChange,
    onFire, onToggleTables, onToggleTacticalNetwork, tacticalNetwork } = props;

  const charges = weaponsData[calibre].charges[chargeType];
  const activeCharge = charges[chargeIndex];

  if (collapsed) {
    return (
      <div className="meca-panel pointer-events-auto flex flex-col items-center gap-2 p-2 m-3" style={{ width: '40px' }}>
        <Crosshair size={14} className="text-green-400" />
        <button onClick={() => setCollapsed(false)} className="text-green-400/50 hover:text-green-300"><Maximize2 size={14} /></button>
      </div>
    );
  }

  return (
    <div className="meca-panel pointer-events-auto flex flex-col m-3" style={{ width: '320px', maxHeight: 'calc(100vh - 24px)' }}>
      <div className="meca-title flex justify-between items-center text-sm px-4 py-3">
        <span className="flex items-center gap-2"><Crosshair size={14} /> Actuadores FCS</span>
        <button onClick={() => setCollapsed(true)} className="text-green-400/50 hover:text-green-300"><Minimize2 size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={onToggleTacticalNetwork}
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all ${
              tacticalNetwork
                ? 'bg-red-900/40 text-red-300 border-red-500/40'
                : 'bg-green-900/20 text-green-400 border-green-500/30 hover:border-green-400/50'
            }`}>
            <Radio size={10} className="inline mr-1" />{tacticalNetwork ? 'DESCONECTAR' : 'T-LINK'}
          </button>
          <button onClick={() => alert('⚙️ Secuencia de producción iniciada...\nEstado: ESPERANDO AUTORIZACIÓN NIVEL 4')}
            className="flex-1 py-2 text-[10px] font-bold tracking-widest uppercase bg-amber-900/30 text-amber-400 border border-amber-500/30 hover:border-amber-400/50">
            <Factory size={10} className="inline mr-1" />PRODUCIR
          </button>
        </div>

        <button onClick={onToggleTables}
          className="w-full py-2 text-[10px] font-bold tracking-widest uppercase bg-green-900/20 text-green-400 border border-green-500/30 hover:bg-green-900/30 hover:border-green-400/50 transition-all">
          <Table size={10} className="inline mr-1" />TABLAS TÉSONICAS
        </button>

        {/* Charge Type */}
        <div className="flex gap-1">
          {(['catrachas', 'doctrinal'] as ChargeType[]).map(type => (
            <button key={type} onClick={() => onChargeTypeChange(type)}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider uppercase border transition-all ${
                chargeType === type
                  ? 'bg-green-900/40 text-green-300 border-green-500/50'
                  : 'bg-black/40 text-green-600/50 border-green-800/30 hover:border-green-600/40'
              }`}>
              {type === 'catrachas' ? 'CATRACHAS' : 'DOCTRINAL'}
            </button>
          ))}
        </div>

        <div>
          <label className="meca-label mb-1">Plataforma</label>
          <select value={calibre} onChange={e => onCalibreChange(e.target.value)} className="meca-select w-full text-xs py-1.5 px-2">
            <option value="155">OBÚS 155mm (M198)</option>
            <option value="105">OBÚS 105mm (M102)</option>
            <option value="120">MORTERO 120mm</option>
          </select>
        </div>

        <div>
          <label className="meca-label mb-1">Proyectil</label>
          <select value={ammoId} onChange={e => onAmmoChange(e.target.value)} className="meca-select w-full text-xs py-1.5 px-2">
            {weaponsData[calibre].ammo.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className="meca-label mb-1">Carga</label>
          <select value={chargeIndex} onChange={e => onChargeChange(Number(e.target.value))} className="meca-select w-full text-xs py-1.5 px-2">
            {charges.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
          </select>
          <div className="text-[9px] text-green-500/40 mt-1 tracking-wider">
            Doctrina: {activeCharge?.doctrine} | Max: {activeCharge?.maxRange || 'N/A'}m
          </div>
        </div>

        {/* Elevation */}
        <div>
          <label className="meca-label mb-1">Servo Elevación (Grados)</label>
          <input type="range" min={5} max={85} value={angle} step={0.1}
            onChange={e => onAngleChange(Number(e.target.value))}
            className="w-full mt-1" />
          <div className="meca-readout mt-1">{angle.toFixed(1)}°</div>
        </div>

        {/* V0 */}
        <div>
          <label className="meca-label mb-1">Carga Propulsora (m/s)</label>
          <div className="meca-readout">{currentV0} m/s</div>
        </div>

        {/* Wind */}
        <div className="flex gap-2">
          {['X', 'Z'].map((axis, idx) => (
            <div key={axis} className="w-1/2">
              <label className="meca-label mb-1">Viento {axis}</label>
              <input type="number" value={idx === 0 ? windX : windZ}
                onChange={e => idx === 0 ? onWindChange(Number(e.target.value), windZ) : onWindChange(windX, Number(e.target.value))}
                className="meca-input-num w-full text-xs py-1 px-1" />
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 pt-1">
          <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-green-900/30 text-green-400 border border-green-600/30">RK45</span>
          <span className="text-[9px] text-green-600/40">ISO 80000-2</span>
        </div>

        {/* Fire */}
        <button onClick={onFire} disabled={isFlying} className="meca-btn-fire w-full py-3 text-sm mt-2">
          <Crosshair size={14} className="inline mr-2" />FUEGO
        </button>
      </div>
    </div>
  );
}
