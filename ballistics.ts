export interface AmmoType {
  id: string;
  name: string;
  mass: number;
  drag: number;
  v0_ref: number;
  range_ref: number;
}

export interface Charge {
  name: string;
  v0: number;
  maxRange?: number;
  doctrine: string;
}

export interface WeaponConfig {
  ammo: AmmoType[];
  charges: {
    catrachas: Charge[];
    doctrinal: Charge[];
  };
}

export interface WeaponData {
  [key: string]: WeaponConfig;
}

export interface SimulationState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface TelemetryPoint {
  t: number;
  x: number;
  y: number;
  v: number;
}

export interface AuditResult {
  checks: { st: string; c: string }[];
  final: string;
  maxErr: number;
}

export type ChargeType = 'catrachas' | 'doctrinal';
export type CameraMode = 'fixed' | 'follow' | 'god';
