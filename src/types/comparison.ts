import type { FitRecord, MetricKey } from './fit';

export interface SyncPoint {
  fileATime: number;
  fileBTime: number;
}

export interface SyncResult {
  offsetSeconds: number;
  method: 'manual' | 'gps';
  confidence?: number;
}

export interface AlignedRecord {
  elapsedTime: number;
  fileA: FitRecord | null;
  fileB: FitRecord | null;
}

export interface ComparisonState {
  fileAId: string | null;
  fileBId: string | null;
  syncPoint: SyncPoint | null;
  syncResult: SyncResult | null;
  alignedRecords: AlignedRecord[];
  activeMetric: MetricKey;
}
