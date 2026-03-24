import type { FitRecord } from '../../types/fit';
import {
  haversineDistance,
  findNearestRecordByTime,
  findFirstRecordAtOrAfter,
  findLastRecordAtOrBefore,
  computeBounds,
} from '../geoUtils';

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

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(52.37, 4.9, 52.37, 4.9)).toBe(0);
  });

  it('computes Amsterdam to Rotterdam (~57km)', () => {
    const dist = haversineDistance(52.3676, 4.9041, 51.9225, 4.4792);
    expect(dist).toBeGreaterThan(55000);
    expect(dist).toBeLessThan(60000);
  });

  it('computes antipodal points (~20000km)', () => {
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(20_000_000);
    expect(dist).toBeLessThan(20_100_000);
  });
});

describe('findNearestRecordByTime', () => {
  const records = [
    makeRecord({ elapsedTime: 0 }),
    makeRecord({ elapsedTime: 5 }),
    makeRecord({ elapsedTime: 10 }),
    makeRecord({ elapsedTime: 15 }),
    makeRecord({ elapsedTime: 20 }),
  ];

  it('returns exact match', () => {
    expect(findNearestRecordByTime(records, 10)).toBe(2);
  });

  it('returns nearest when between records', () => {
    expect(findNearestRecordByTime(records, 12)).toBe(2); // closer to 10 than 15
    expect(findNearestRecordByTime(records, 13)).toBe(3); // closer to 15 than 10
  });

  it('returns 0 for time before first record', () => {
    expect(findNearestRecordByTime(records, -5)).toBe(0);
  });

  it('returns last index for time after last record', () => {
    expect(findNearestRecordByTime(records, 100)).toBe(4);
  });

  it('handles single record', () => {
    const single = [makeRecord({ elapsedTime: 5 })];
    expect(findNearestRecordByTime(single, 0)).toBe(0);
    expect(findNearestRecordByTime(single, 100)).toBe(0);
  });
});

describe('findFirstRecordAtOrAfter', () => {
  const records = [
    makeRecord({ elapsedTime: 0 }),
    makeRecord({ elapsedTime: 5 }),
    makeRecord({ elapsedTime: 10 }),
    makeRecord({ elapsedTime: 15 }),
  ];

  it('returns exact match', () => {
    expect(findFirstRecordAtOrAfter(records, 5)).toBe(1);
  });

  it('returns next record when between', () => {
    expect(findFirstRecordAtOrAfter(records, 7)).toBe(2);
  });

  it('returns 0 for time before first', () => {
    expect(findFirstRecordAtOrAfter(records, -1)).toBe(0);
  });

  it('returns last index when after last', () => {
    expect(findFirstRecordAtOrAfter(records, 100)).toBe(3);
  });
});

describe('findLastRecordAtOrBefore', () => {
  const records = [
    makeRecord({ elapsedTime: 0 }),
    makeRecord({ elapsedTime: 5 }),
    makeRecord({ elapsedTime: 10 }),
    makeRecord({ elapsedTime: 15 }),
  ];

  it('returns exact match', () => {
    expect(findLastRecordAtOrBefore(records, 10)).toBe(2);
  });

  it('returns previous record when between', () => {
    expect(findLastRecordAtOrBefore(records, 7)).toBe(1);
  });

  it('returns 0 for time before first', () => {
    expect(findLastRecordAtOrBefore(records, -1)).toBe(0);
  });

  it('returns last index for time after last', () => {
    expect(findLastRecordAtOrBefore(records, 100)).toBe(3);
  });
});

describe('computeBounds', () => {
  it('computes bounds from GPS records with padding', () => {
    const records = [
      makeRecord({ latitude: 52.0, longitude: 4.0 }),
      makeRecord({ latitude: 53.0, longitude: 5.0 }),
    ];
    const [[minLng, minLat], [maxLng, maxLat]] = computeBounds(records);
    expect(minLng).toBeCloseTo(4.0 - 0.002, 5);
    expect(minLat).toBeCloseTo(52.0 - 0.002, 5);
    expect(maxLng).toBeCloseTo(5.0 + 0.002, 5);
    expect(maxLat).toBeCloseTo(53.0 + 0.002, 5);
  });

  it('skips records without GPS', () => {
    const records = [
      makeRecord({ latitude: null, longitude: null }),
      makeRecord({ latitude: 52.0, longitude: 4.0 }),
      makeRecord({ latitude: null, longitude: null }),
    ];
    const [[minLng, minLat], [maxLng, maxLat]] = computeBounds(records);
    expect(minLng).toBeCloseTo(4.0 - 0.002, 5);
    expect(minLat).toBeCloseTo(52.0 - 0.002, 5);
    expect(maxLng).toBeCloseTo(4.0 + 0.002, 5);
    expect(maxLat).toBeCloseTo(52.0 + 0.002, 5);
  });
});
