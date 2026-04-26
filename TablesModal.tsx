import { X } from 'lucide-react';
import { tesonicTables } from '../lib/ballisticsEngine';
import type { TesonicTableRow } from '../lib/ballisticsEngine';
import { useState } from 'react';

interface TablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibre: string;
  ammoId: string;
  chargeType: 'catrachas' | 'doctrinal';
  chargeIndex: number;
}

export default function TablesModal({ isOpen, onClose, calibre, ammoId, chargeType, chargeIndex }: TablesModalProps) {
  const [activeTable, setActiveTable] = useState(`${calibre}-${ammoId}-${chargeType}-${chargeIndex}`);

  if (!isOpen) return null;

  const availableKeys = Object.keys(tesonicTables).filter(k => k.startsWith(`${calibre}-${ammoId}-${chargeType}`));
  const table = tesonicTables[activeTable] || tesonicTables[availableKeys[0]] || Object.values(tesonicTables)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="meca-panel rounded-none p-5 w-[95%] max-w-[1100px] max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
        style={{ background: '#050a08' }}
        onClick={e => e.stopPropagation()}>
        <div className="meca-title flex justify-between items-center pb-3 mb-4">
          <h3 className="text-sm font-bold tracking-wider">TABLAS TÉSONICAS — RK4</h3>
          <button onClick={onClose} className="text-green-500/50 hover:text-red-400 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {availableKeys.map(key => {
            const t = tesonicTables[key];
            const chargeName = t?.title.split('|')[1]?.trim() || key;
            return (
              <button key={key} onClick={() => setActiveTable(key)}
                className={`px-3 py-1.5 text-[10px] border transition-all tracking-wider ${
                  activeTable === key
                    ? 'bg-green-900/40 text-green-300 border-green-500/50'
                    : 'bg-black/40 text-green-600/50 border-green-800/30 hover:border-green-600/40'
                }`}>
                {chargeName}
              </button>
            );
          })}
        </div>

        <p className="text-xs mb-2 text-green-300/60 font-mono tracking-wider">{table?.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr>
                {table?.columns.map((col, i) => (
                  <th key={i} className="bg-green-900/20 font-bold p-1.5 border border-green-700/30 text-green-400/60 tracking-wider text-[9px]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table?.data.map((row: TesonicTableRow, i: number) => (
                <tr key={i} className="hover:bg-green-900/5">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className={`border border-green-800/10 p-1 ${j === 0 ? 'text-left font-semibold text-green-300/60' : 'text-right text-green-300/40 font-mono'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
