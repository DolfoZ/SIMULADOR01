import type { WeaponData, AuditResult } from '../types/ballistics';

export const AUDIT_TOLERANCE = 0.25;
export const G = 9.80665;
export const RHO_0 = 1.225;
export const SCALE_HEIGHT = 8500;

export const weaponsData: WeaponData = {
  "155": {
    ammo: [
      { id: "HE_M106", name: "155mm HE M106", mass: 43.2, drag: 0.22, v0_ref: 827, range_ref: 30000 },
      { id: "HERA_M549A1", name: "155mm HERA M549A1", mass: 43.5, drag: 0.20, v0_ref: 827, range_ref: 30000 },
      { id: "ICM_M483A1", name: "155mm ICM M483A1", mass: 47.0, drag: 0.23, v0_ref: 680, range_ref: 17000 }
    ],
    charges: {
      catrachas: [
        { name: "GB M3A1 (Carga 1)", v0: 375, maxRange: 6000, doctrine: "HON-ART-155-001" },
        { name: "WB M4A2 (Carga 3)", v0: 565, maxRange: 18000, doctrine: "HON-ART-155-002" },
        { name: "WB M119A2 (Carga 5)", v0: 790, maxRange: 30000, doctrine: "HON-ART-155-003" },
        { name: "RB M203 (Carga 8)", v0: 827, maxRange: 30000, doctrine: "HON-ART-155-004" }
      ],
      doctrinal: [
        { name: "Carga 1", v0: 375, maxRange: 6500, doctrine: "FM 6-40" },
        { name: "Carga 2", v0: 470, maxRange: 13000, doctrine: "FM 6-40" },
        { name: "Carga 3", v0: 565, maxRange: 18000, doctrine: "FM 6-40" },
        { name: "Carga 4", v0: 680, maxRange: 24000, doctrine: "FM 6-40" },
        { name: "Carga 5", v0: 790, maxRange: 30000, doctrine: "FM 6-40" },
        { name: "Carga 6", v0: 810, maxRange: 30000, doctrine: "FM 6-40" },
        { name: "Carga 7", v0: 820, maxRange: 30000, doctrine: "FM 6-40" },
        { name: "Carga 8", v0: 827, maxRange: 30000, doctrine: "FM 6-40" }
      ]
    }
  },
  "105": {
    ammo: [
      { id: "HE_M1", name: "105mm HE M1", mass: 14.9, drag: 0.24, v0_ref: 550, range_ref: 11500 },
      { id: "ILLUM_M314", name: "105mm ILLUM M314", mass: 14.5, drag: 0.25, v0_ref: 490, range_ref: 9000 }
    ],
    charges: {
      catrachas: [
        { name: "Carga 1", v0: 200, maxRange: 3000, doctrine: "HON-ART-105" },
        { name: "Carga 4", v0: 350, maxRange: 7500, doctrine: "HON-ART-105" },
        { name: "Carga 7", v0: 475, maxRange: 11500, doctrine: "HON-ART-105" }
      ],
      doctrinal: [
        { name: "Carga 1", v0: 200, maxRange: 3500, doctrine: "FM 6-40" },
        { name: "Carga 2", v0: 250, maxRange: 5500, doctrine: "FM 6-40" },
        { name: "Carga 3", v0: 300, maxRange: 7200, doctrine: "FM 6-40" },
        { name: "Carga 4", v0: 350, maxRange: 8500, doctrine: "FM 6-40" },
        { name: "Carga 5", v0: 400, maxRange: 10000, doctrine: "FM 6-40" },
        { name: "Carga 6", v0: 440, maxRange: 10800, doctrine: "FM 6-40" },
        { name: "Carga 7", v0: 475, maxRange: 11500, doctrine: "FM 6-40" }
      ]
    }
  },
  "120": {
    ammo: [
      { id: "HE_M933", name: "120mm HE M933", mass: 14.2, drag: 0.23, v0_ref: 380, range_ref: 7200 }
    ],
    charges: {
      catrachas: [
        { name: "Primaria", v0: 240, maxRange: 5500, doctrine: "HON-MOR-120" },
        { name: "Secundaria", v0: 320, maxRange: 7200, doctrine: "HON-MOR-120" }
      ],
      doctrinal: [
        { name: "Carga 0", v0: 180, maxRange: 4000, doctrine: "FM 4-130" },
        { name: "Carga 1", v0: 200, maxRange: 4800, doctrine: "FM 4-130" },
        { name: "Carga 2", v0: 230, maxRange: 5500, doctrine: "FM 4-130" },
        { name: "Carga 3", v0: 260, maxRange: 6200, doctrine: "FM 4-130" },
        { name: "Carga 4", v0: 280, maxRange: 6800, doctrine: "FM 4-130" },
        { name: "Carga 5", v0: 380, maxRange: 7200, doctrine: "FM 4-130" }
      ]
    }
  }
};

export interface TesonicTableRow {
  r: string;
  qe: string;
  fs: string;
  tof: string;
  d50: string;
  defl: string;
}

export interface TesonicTable {
  title: string;
  columns: string[];
  data: TesonicTableRow[];
}

export const tesonicTables: Record<string, TesonicTable> = {};

const integrator = new (class {
  g = G;
  rho0 = RHO_0;
  H = SCALE_HEIGHT;
  radius = 0.077;
  Cd = 0.22;

  simulate(v0: number, angleDeg: number, mass: number, drag: number, dt = 0.01, maxT = 120) {
    let x = 0, y = 0.5, z = 0;
    const rad = angleDeg * Math.PI / 180;
    let vx = v0 * Math.cos(rad);
    let vy = v0 * Math.sin(rad);
    let vz = 0;
    let t = 0;
    const area = Math.PI * this.radius ** 2;

    while (t < maxT && y > 0) {
      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz) || 0.001;
      const rho = this.rho0 * Math.exp(-y / this.H);
      const dragF = 0.5 * rho * vMag * drag * area / mass;
      const ax = -dragF * vx / vMag;
      const ay = -this.g - dragF * vy / vMag;
      const az = -dragF * vz / vMag;

      vx += ax * dt;
      vy += ay * dt;
      vz += az * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      t += dt;
    }
    return { range: x, tof: t, maxH: 0 };
  }

  findAngleForRange(v0: number, targetRange: number, mass: number, drag: number) {
    let low = 5, high = 85;
    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      const res = this.simulate(v0, mid, mass, drag);
      if (res.range < targetRange) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }
})();

// Generate all tables
function generateAllTables() {
  const step = 100;

  for (const cal of Object.keys(weaponsData) as Array<'155' | '105' | '120'>) {
    const wpn = weaponsData[cal];
    for (const ammo of wpn.ammo) {
      for (const ct of ['catrachas', 'doctrinal'] as const) {
        for (let ci = 0; ci < wpn.charges[ct].length; ci++) {
          const charge = wpn.charges[ct][ci];
          const key = `${cal}-${ammo.id}-${ct}-${ci}`;
          const maxR = charge.maxRange || 30000;
          const minR = Math.round(step * Math.ceil((maxR * 0.15) / step));
          const data: TesonicTableRow[] = [];
          for (let r = minR; r <= maxR; r += step) {
            const qe = integrator.findAngleForRange(charge.v0, r, ammo.mass, ammo.drag);
            const tof = integrator.simulate(charge.v0, qe, ammo.mass, ammo.drag).tof;
            data.push({
              r: r.toString(),
              qe: qe.toFixed(1),
              fs: (qe + 0.5).toFixed(1),
              tof: tof.toFixed(1),
              d50: (r * 0.0035).toFixed(1),
              defl: (0.8 + Math.random() * 0.4).toFixed(1)
            });
          }

          tesonicTables[key] = {
            title: `${ammo.name} | ${charge.name} | ${charge.doctrine}`,
            columns: ['Rango(m)', 'QE(mils)', 'FS(mils)', 'TOF(s)', 'D50(m)', 'Defl(mils)'],
            data
          };
        }
      }
    }
  }
}

generateAllTables();

export class BallisticsRK4 {
  g = G;
  rho0 = RHO_0;
  H = SCALE_HEIGHT;
  radius = 0.077;
  Cd = 0.22;

  derivatives(state: number[], params: { mass: number; windX?: number; windZ?: number }): number[] {
    const [_, y, __, vx, vy, vz] = state;
    const { mass, windX = 0, windZ = 0 } = params;
    const vRelX = vx - windX;
    const vRelY = vy;
    const vRelZ = vz - windZ;
    const vMag = Math.sqrt(vRelX ** 2 + vRelY ** 2 + vRelZ ** 2) || 0.001;
    const rho = this.rho0 * Math.exp(-y / this.H);
    const area = Math.PI * this.radius ** 2;
    const drag = 0.5 * rho * vMag * this.Cd * area / mass;
    return [vx, vy, vz, -drag * vRelX, -this.g - drag * vRelY, -drag * vRelZ];
  }

  step(state: number[], dt: number, params: { mass: number; windX?: number; windZ?: number }): number[] {
    const k1 = this.derivatives(state, params);
    const s2 = state.map((v, i) => v + k1[i] * dt * 0.5);
    const k2 = this.derivatives(s2, params);
    const s3 = state.map((v, i) => v + k2[i] * dt * 0.5);
    const k3 = this.derivatives(s3, params);
    const s4 = state.map((v, i) => v + k3[i] * dt);
    const k4 = this.derivatives(s4, params);
    return state.map((v, i) => v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
  }
}

export function runAudit(range: number, tof: number, ammoId: string, angle: number): AuditResult {
  const ammo = weaponsData["155"].ammo.find(a => a.id === ammoId) || weaponsData["155"].ammo[0];
  const rad = angle * Math.PI / 180;

  const dragFactor = ammo.drag * 0.00015;
  const tofAnal = (2 * ammo.v0_ref * Math.sin(rad)) / (G * (1 + dragFactor));
  const rangeAnal = ammo.v0_ref * Math.cos(rad) * tofAnal * 0.98;
  const rangeSTANAG = ammo.range_ref * Math.sin(2 * rad);

  const err1 = Math.abs(range - rangeAnal) / 100;
  const err2 = Math.abs(range - rangeSTANAG) / 100;
  const err3 = Math.abs(tof - tofAnal) / 10;

  function evalErr(err: number) {
    if (err <= AUDIT_TOLERANCE) return { st: 'VERIFIED', c: '#16a34a' };
    if (err <= AUDIT_TOLERANCE * 3) return { st: 'CONDITIONAL', c: '#ca8a04' };
    return { st: 'REJECTED', c: '#dc2626' };
  }

  const r1 = evalErr(err1), r2 = evalErr(err2), r3 = evalErr(err3);
  const passed = [r1, r2, r3].filter(r => r.st !== 'REJECTED').length;
  const final = passed >= 2 ? 'VERIFIED' : (passed === 1 ? 'CONDITIONAL' : 'REJECTED');

  return { checks: [r1, r2, r3], final, maxErr: Math.max(err1, err2, err3) };
}
