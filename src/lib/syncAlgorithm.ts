import type { FitRecord } from '../types/fit';
import type { SyncPoint, SyncResult, AlignedRecord } from '../types/comparison';
import { haversineDistance } from './geoUtils';

export function manualSync(syncPoint: SyncPoint): SyncResult {
  return {
    offsetSeconds: syncPoint.fileATime - syncPoint.fileBTime,
    method: 'manual',
  };
}

export function gpsAutoSync(
  recordsA: FitRecord[],
  recordsB: FitRecord[],
): SyncResult {
  const gpsA = recordsA.filter((r) => r.latitude !== null && r.longitude !== null);
  const gpsB = recordsB.filter((r) => r.latitude !== null && r.longitude !== null);

  if (gpsA.length === 0 || gpsB.length === 0) {
    throw new Error('Both files must have GPS data for auto-sync');
  }

  const SAMPLE_INTERVAL = 10;
  const DISTANCE_THRESHOLD = 50; // meters
  const BIN_SIZE = 5; // seconds

  const offsets: number[] = [];

  for (let i = 0; i < gpsA.length; i += SAMPLE_INTERVAL) {
    const a = gpsA[i];
    for (const b of gpsB) {
      const dist = haversineDistance(
        a.latitude!, a.longitude!,
        b.latitude!, b.longitude!,
      );
      if (dist < DISTANCE_THRESHOLD) {
        offsets.push(a.elapsedTime - b.elapsedTime);
      }
    }
  }

  if (offsets.length === 0) {
    throw new Error('No matching GPS points found between files');
  }

  // Bin offsets
  const bins = new Map<number, number[]>();
  for (const offset of offsets) {
    const binKey = Math.round(offset / BIN_SIZE) * BIN_SIZE;
    const bin = bins.get(binKey);
    if (bin) bin.push(offset);
    else bins.set(binKey, [offset]);
  }

  // Find largest bin
  let bestBin: number[] = [];
  for (const bin of bins.values()) {
    if (bin.length > bestBin.length) bestBin = bin;
  }

  // Median of best bin
  bestBin.sort((a, b) => a - b);
  const median = bestBin[Math.floor(bestBin.length / 2)];
  const confidence = bestBin.length / offsets.length;

  return {
    offsetSeconds: median,
    method: 'gps',
    confidence,
  };
}

export function alignRecords(
  recordsA: FitRecord[],
  recordsB: FitRecord[],
  offsetSeconds: number,
  resolution = 1,
): AlignedRecord[] {
  if (recordsA.length === 0 && recordsB.length === 0) return [];

  const aStart = recordsA.length > 0 ? recordsA[0].elapsedTime : 0;
  const aEnd = recordsA.length > 0 ? recordsA[recordsA.length - 1].elapsedTime : 0;
  const bStart = recordsB.length > 0 ? recordsB[0].elapsedTime + offsetSeconds : 0;
  const bEnd = recordsB.length > 0 ? recordsB[recordsB.length - 1].elapsedTime + offsetSeconds : 0;

  const start = Math.min(aStart, bStart);
  const end = Math.max(aEnd, bEnd);

  const aligned: AlignedRecord[] = [];
  let aIdx = 0;
  let bIdx = 0;

  for (let t = start; t <= end; t += resolution) {
    // Find nearest A record
    while (aIdx < recordsA.length - 1 && recordsA[aIdx + 1].elapsedTime <= t) aIdx++;
    const fileA =
      recordsA.length > 0 && Math.abs(recordsA[aIdx].elapsedTime - t) <= 2
        ? recordsA[aIdx]
        : null;

    // Find nearest B record (with offset applied)
    while (
      bIdx < recordsB.length - 1 &&
      recordsB[bIdx + 1].elapsedTime + offsetSeconds <= t
    )
      bIdx++;
    const fileB =
      recordsB.length > 0 &&
      Math.abs(recordsB[bIdx].elapsedTime + offsetSeconds - t) <= 2
        ? recordsB[bIdx]
        : null;

    aligned.push({ elapsedTime: t, fileA, fileB });
  }

  return aligned;
}
