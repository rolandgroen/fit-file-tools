import type { FitRecord } from '../types/fit';

const DEG_TO_RAD = Math.PI / 180;

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestRecordByTime(
  records: FitRecord[],
  elapsedTime: number,
): number {
  let lo = 0;
  let hi = records.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (records[mid].elapsedTime < elapsedTime) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    const prev = Math.abs(records[lo - 1].elapsedTime - elapsedTime);
    const curr = Math.abs(records[lo].elapsedTime - elapsedTime);
    if (prev < curr) return lo - 1;
  }
  return lo;
}

/** Find the first record at or after the given time */
export function findFirstRecordAtOrAfter(
  records: FitRecord[],
  elapsedTime: number,
): number {
  let lo = 0;
  let hi = records.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (records[mid].elapsedTime < elapsedTime) lo = mid + 1;
    else hi = mid;
  }
  return Math.min(lo, records.length - 1);
}

/** Find the last record at or before the given time */
export function findLastRecordAtOrBefore(
  records: FitRecord[],
  elapsedTime: number,
): number {
  let lo = 0;
  let hi = records.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (records[mid].elapsedTime <= elapsedTime) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function computeBounds(
  records: FitRecord[],
): [[number, number], [number, number]] {
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  for (const r of records) {
    if (r.latitude === null || r.longitude === null) continue;
    if (r.longitude < minLng) minLng = r.longitude;
    if (r.latitude < minLat) minLat = r.latitude;
    if (r.longitude > maxLng) maxLng = r.longitude;
    if (r.latitude > maxLat) maxLat = r.latitude;
  }

  const pad = 0.002;
  return [
    [minLng - pad, minLat - pad],
    [maxLng + pad, maxLat + pad],
  ];
}
