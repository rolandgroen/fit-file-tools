import type { FitRecord, MetricKey } from '../types/fit';

const RAMP = [
  [0, 0, 255],     // blue
  [0, 200, 200],   // cyan
  [0, 200, 0],     // green
  [255, 200, 0],   // yellow
  [255, 0, 0],     // red
];

function interpolateColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = clamped * (RAMP.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, RAMP.length - 1);
  const frac = idx - lo;

  const r = Math.round(RAMP[lo][0] + (RAMP[hi][0] - RAMP[lo][0]) * frac);
  const g = Math.round(RAMP[lo][1] + (RAMP[hi][1] - RAMP[lo][1]) * frac);
  const b = Math.round(RAMP[lo][2] + (RAMP[hi][2] - RAMP[lo][2]) * frac);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getMetricRange(records: FitRecord[], metric: MetricKey): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const r of records) {
    const v = r[metric];
    if (v === null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

export function buildColoredRoute(
  records: FitRecord[],
  metric: MetricKey,
): GeoJSON.FeatureCollection {
  const gps = records.filter((r) => r.latitude !== null && r.longitude !== null);
  const [min, max] = getMetricRange(gps, metric);

  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < gps.length - 1; i++) {
    const a = gps[i];
    const b = gps[i + 1];
    const value = a[metric] ?? 0;
    const t = (value - min) / (max - min);

    features.push({
      type: 'Feature',
      properties: { color: interpolateColor(t) },
      geometry: {
        type: 'LineString',
        coordinates: [
          [a.longitude!, a.latitude!],
          [b.longitude!, b.latitude!],
        ],
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function buildRouteLine(
  records: FitRecord[],
): GeoJSON.Feature {
  const gps = records.filter((r) => r.latitude !== null && r.longitude !== null);
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: gps.map((r) => [r.longitude!, r.latitude!]),
    },
  };
}

export function metricToColor(
  value: number | null,
  min: number,
  max: number,
): string {
  if (value === null) return '#888888';
  const t = (value - min) / (max - min);
  return interpolateColor(t);
}
