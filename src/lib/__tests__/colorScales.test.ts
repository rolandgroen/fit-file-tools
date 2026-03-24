import type { FitRecord } from '../../types/fit';
import { buildColoredRoute, buildRouteLine, metricToColor } from '../colorScales';

function makeRecord(overrides: Partial<FitRecord> = {}): FitRecord {
  return {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    elapsedTime: 0,
    heartRate: null,
    power: null,
    cadence: null,
    speed: null,
    altitude: null,
    distance: null,
    latitude: null,
    longitude: null,
    temperature: null,
    extraFields: {},
    ...overrides,
  };
}

describe('metricToColor', () => {
  it('returns gray for null', () => {
    expect(metricToColor(null, 0, 100)).toBe('#888888');
  });

  it('returns blue-ish for min value', () => {
    const color = metricToColor(0, 0, 100);
    // Should be #0000ff (pure blue)
    expect(color).toBe('#0000ff');
  });

  it('returns red-ish for max value', () => {
    const color = metricToColor(100, 0, 100);
    // Should be #ff0000 (pure red)
    expect(color).toBe('#ff0000');
  });

  it('returns green-ish for mid value', () => {
    const color = metricToColor(50, 0, 100);
    // Mid ramp = green area (#00c800)
    expect(color).toBe('#00c800');
  });
});

describe('buildRouteLine', () => {
  it('creates LineString from GPS records', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0 }),
      makeRecord({ latitude: 52.1, longitude: 4.1 }),
      makeRecord({ latitude: 52.2, longitude: 4.2 }),
    ];
    const result = buildRouteLine(records);
    expect(result.type).toBe('Feature');
    expect(result.geometry.type).toBe('LineString');
    const coords = (result.geometry as GeoJSON.LineString).coordinates;
    expect(coords).toHaveLength(3);
    expect(coords[0]).toEqual([4.0, 52.0]);
    expect(coords[2]).toEqual([4.2, 52.2]);
  });

  it('skips records without GPS', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0 }),
      makeRecord({ latitude: null, longitude: null }),
      makeRecord({ latitude: 52.2, longitude: 4.2 }),
    ];
    const result = buildRouteLine(records);
    const coords = (result.geometry as GeoJSON.LineString).coordinates;
    expect(coords).toHaveLength(2);
  });
});

describe('buildColoredRoute', () => {
  it('creates FeatureCollection with colored segments', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0, heartRate: 100 }),
      makeRecord({ latitude: 52.1, longitude: 4.1, heartRate: 150 }),
      makeRecord({ latitude: 52.2, longitude: 4.2, heartRate: 200 }),
    ];
    const result = buildColoredRoute(records, 'heartRate');
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(2);
    for (const feature of result.features) {
      expect(feature.properties?.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(feature.geometry.type).toBe('LineString');
    }
  });

  it('handles equal min/max by expanding range', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0, heartRate: 150 }),
      makeRecord({ latitude: 52.1, longitude: 4.1, heartRate: 150 }),
      makeRecord({ latitude: 52.2, longitude: 4.2, heartRate: 150 }),
    ];
    const result = buildColoredRoute(records, 'heartRate');
    expect(result.features).toHaveLength(2);
    // Should not crash with division by zero
    for (const feature of result.features) {
      expect(feature.properties?.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('skips non-GPS records', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0, heartRate: 100 }),
      makeRecord({ latitude: null, longitude: null, heartRate: 120 }),
      makeRecord({ latitude: 52.2, longitude: 4.2, heartRate: 200 }),
    ];
    const result = buildColoredRoute(records, 'heartRate');
    expect(result.features).toHaveLength(1);
  });
});
