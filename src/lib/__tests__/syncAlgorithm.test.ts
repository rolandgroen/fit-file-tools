import type { FitRecord } from '../../types/fit';
import { manualSync, gpsAutoSync, alignRecords } from '../syncAlgorithm';

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

describe('manualSync', () => {
  it('returns correct offset from sync point', () => {
    const result = manualSync({ fileATime: 100, fileBTime: 90 });
    expect(result.offsetSeconds).toBe(10);
    expect(result.method).toBe('manual');
  });

  it('handles negative offset', () => {
    const result = manualSync({ fileATime: 50, fileBTime: 80 });
    expect(result.offsetSeconds).toBe(-30);
  });

  it('handles zero offset', () => {
    const result = manualSync({ fileATime: 100, fileBTime: 100 });
    expect(result.offsetSeconds).toBe(0);
  });
});

describe('gpsAutoSync', () => {
  it('finds offset for matching GPS points', () => {
    // File A: GPS at (52.37, 4.90) at elapsed time 100
    // File B: same GPS at elapsed time 110
    // Expected offset: A - B = -10
    const recordsA = [
      makeRecord({ latitude: 52.37, longitude: 4.90, elapsedTime: 100 }),
    ];
    const recordsB = [
      makeRecord({ latitude: 52.37, longitude: 4.90, elapsedTime: 110 }),
    ];
    const result = gpsAutoSync(recordsA, recordsB);
    expect(result.offsetSeconds).toBe(-10);
    expect(result.method).toBe('gps');
  });

  it('throws when no GPS data in file A', () => {
    const recordsA = [makeRecord({ elapsedTime: 0 })];
    const recordsB = [makeRecord({ latitude: 52.37, longitude: 4.90, elapsedTime: 0 })];
    expect(() => gpsAutoSync(recordsA, recordsB)).toThrow('Both files must have GPS data');
  });

  it('throws when no GPS data in file B', () => {
    const recordsA = [makeRecord({ latitude: 52.37, longitude: 4.90, elapsedTime: 0 })];
    const recordsB = [makeRecord({ elapsedTime: 0 })];
    expect(() => gpsAutoSync(recordsA, recordsB)).toThrow('Both files must have GPS data');
  });

  it('throws when no matching GPS points', () => {
    // Points far apart
    const recordsA = [
      makeRecord({ latitude: 52.37, longitude: 4.90, elapsedTime: 0 }),
    ];
    const recordsB = [
      makeRecord({ latitude: 0, longitude: 0, elapsedTime: 0 }),
    ];
    expect(() => gpsAutoSync(recordsA, recordsB)).toThrow('No matching GPS points');
  });
});

describe('alignRecords', () => {
  it('returns empty array for both empty', () => {
    expect(alignRecords([], [], 0)).toEqual([]);
  });

  it('returns only fileA records when fileB is empty', () => {
    const recordsA = [
      makeRecord({ elapsedTime: 0 }),
      makeRecord({ elapsedTime: 1 }),
    ];
    const result = alignRecords(recordsA, [], 0);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.fileB).toBeNull();
    }
  });

  it('returns only fileB records when fileA is empty', () => {
    const recordsB = [
      makeRecord({ elapsedTime: 0 }),
      makeRecord({ elapsedTime: 1 }),
    ];
    const result = alignRecords([], recordsB, 0);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.fileA).toBeNull();
    }
  });

  it('applies offset correctly', () => {
    const recordsA = [
      makeRecord({ elapsedTime: 0, heartRate: 100 }),
      makeRecord({ elapsedTime: 1, heartRate: 110 }),
      makeRecord({ elapsedTime: 2, heartRate: 120 }),
    ];
    const recordsB = [
      makeRecord({ elapsedTime: 5, heartRate: 150 }),
      makeRecord({ elapsedTime: 6, heartRate: 160 }),
      makeRecord({ elapsedTime: 7, heartRate: 170 }),
    ];
    // offset=5 means B's times are shifted by +5, so B at elapsed 5 → aligned time 10
    const result = alignRecords(recordsA, recordsB, 5);
    // At time 0-2, fileA should be present
    const atZero = result.find((r) => r.elapsedTime === 0);
    expect(atZero?.fileA).not.toBeNull();
  });

  it('matches records within 2s window', () => {
    const recordsA = [
      makeRecord({ elapsedTime: 0, heartRate: 100 }),
      makeRecord({ elapsedTime: 2, heartRate: 110 }),
    ];
    const recordsB = [
      makeRecord({ elapsedTime: 0, heartRate: 150 }),
      makeRecord({ elapsedTime: 2, heartRate: 160 }),
    ];
    const result = alignRecords(recordsA, recordsB, 0);
    const atZero = result.find((r) => r.elapsedTime === 0);
    expect(atZero?.fileA).not.toBeNull();
    expect(atZero?.fileB).not.toBeNull();
  });

  it('sets null for records beyond 2s gap', () => {
    const recordsA = [
      makeRecord({ elapsedTime: 0 }),
    ];
    const recordsB = [
      makeRecord({ elapsedTime: 10 }),
    ];
    // offset = 0, so fileA at 0, fileB at 10
    const result = alignRecords(recordsA, recordsB, 0);
    const atZero = result.find((r) => r.elapsedTime === 0);
    expect(atZero?.fileA).not.toBeNull();
    expect(atZero?.fileB).toBeNull();
    const atTen = result.find((r) => r.elapsedTime === 10);
    expect(atTen?.fileA).toBeNull();
    expect(atTen?.fileB).not.toBeNull();
  });
});
