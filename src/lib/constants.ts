import type { MetricDefinition } from '../types/fit';

export const METRICS: MetricDefinition[] = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444', domain: [60, 200] },
  { key: 'power', label: 'Power', unit: 'W', color: '#8b5cf6', domain: [0, 500] },
  { key: 'cadence', label: 'Cadence', unit: 'rpm', color: '#06b6d4', domain: [0, 130] },
  { key: 'speed', label: 'Speed', unit: 'km/h', color: '#22c55e', domain: [0, 60] },
  { key: 'altitude', label: 'Altitude', unit: 'm', color: '#f59e0b', domain: [0, 2000] },
];

export const METRIC_MAP = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<
  string,
  MetricDefinition
>;
