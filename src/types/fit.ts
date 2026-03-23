export interface FitRecord {
  timestamp: Date;
  elapsedTime: number;
  heartRate: number | null;
  power: number | null;
  cadence: number | null;
  speed: number | null;
  altitude: number | null;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  temperature: number | null;
  extraFields: Record<string, number>;
}

export interface FitLap {
  startTime: Date;
  totalElapsedTime: number;
  totalDistance: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  avgCadence: number | null;
  avgSpeed: number | null;
}

export interface FitSession {
  sport: string;
  subSport: string;
  startTime: Date;
  totalElapsedTime: number;
  totalTimerTime: number;
  totalDistance: number;
  totalAscent: number | null;
  totalDescent: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  normalizedPower: number | null;
  avgCadence: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
}

export interface FitDevice {
  manufacturer: string;
  product: string;
  serialNumber: number | null;
  softwareVersion: string | null;
  batteryStatus: string | null;
}

export interface ActivityMetrics {
  vo2Max: number | null;
  firstVo2Max: number | null;
  recoveryTime: number | null;
  totalAscent: number | null;
  totalDescent: number | null;
  avgPower: number | null;
  newMaxHeartRate: number | null;
  aerobicTrainingEffect: number | null;
  anaerobicTrainingEffect: number | null;
  sport: string | null;
  primaryBenefit: string | null;
  avgHeartRate: number | null;
}

export interface FileId {
  serialNumber: number | null;
  timeCreated: Date | null;
  manufacturer: string;
  product: string;
  type: string;
}

export interface ZonesTarget {
  functionalThresholdPower: number | null;
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
}

export type ExtraMessageValue = string | number | boolean | null;

export interface ParsedFitFile {
  id: string;
  fileName: string;
  fileSize: number;
  parsedAt: Date;
  session: FitSession;
  laps: FitLap[];
  records: FitRecord[];
  devices: FitDevice[];
  extraMessages: Record<string, Record<string, ExtraMessageValue>[]>;
  activityMetrics: ActivityMetrics | null;
  fileId: FileId | null;
  zonesTarget: ZonesTarget | null;
  hasGps: boolean;
  hasPower: boolean;
  hasHeartRate: boolean;
}

export type MetricKey =
  | 'heartRate'
  | 'power'
  | 'cadence'
  | 'speed'
  | 'altitude';

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  domain: [number, number];
}
