import { findBestWindow } from '../bestWindow';
import type { FitRecord } from '../../types/fit';

/** Helper to create a minimal FitRecord with elapsed time and optional metric values */
function rec(
  elapsedTime: number,
  overrides: Partial<Pick<FitRecord, 'heartRate' | 'power' | 'cadence' | 'speed' | 'altitude'>> = {},
): FitRecord {
  return {
    timestamp: new Date(0),
    elapsedTime,
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

describe('findBestWindow', () => {
  it('returns null for empty records', () => {
    expect(findBestWindow([], 'power', 300)).toBeNull();
  });

  it('returns null when activity is shorter than window', () => {
    const records = [
      rec(0, { power: 200 }),
      rec(60, { power: 250 }),
    ];
    expect(findBestWindow(records, 'power', 300)).toBeNull();
  });

  it('returns null when metric has no data', () => {
    const records = [
      rec(0),
      rec(300),
      rec(600),
    ];
    expect(findBestWindow(records, 'heartRate', 300)).toBeNull();
  });

  it('finds the best window with low-then-high values', () => {
    // 0-600s: power 100, 600-1200s: power 300
    const records: FitRecord[] = [];
    for (let t = 0; t <= 1200; t += 10) {
      records.push(rec(t, { power: t < 600 ? 100 : 300 }));
    }

    const result = findBestWindow(records, 'power', 600);
    expect(result).not.toBeNull();
    // Best 600s window should be in the high-power region
    expect(result!.average).toBe(300);
    expect(result!.startTime).toBeGreaterThanOrEqual(600);
  });

  it('handles null values within the window', () => {
    const records = [
      rec(0, { heartRate: 150 }),
      rec(100, { heartRate: null }),   // gap
      rec(200, { heartRate: null }),   // gap
      rec(300, { heartRate: 160 }),
      rec(400, { heartRate: 170 }),
      rec(500, { heartRate: 180 }),
      rec(600, { heartRate: 180 }),
    ];

    const result = findBestWindow(records, 'heartRate', 300);
    expect(result).not.toBeNull();
    // sampleCount should only reflect non-null values
    expect(result!.sampleCount).toBeGreaterThan(0);
    // All counted values should contribute to average
    expect(result!.average).toBeGreaterThan(0);
  });

  it('works when activity exactly equals window duration', () => {
    const records = [
      rec(0, { power: 200 }),
      rec(150, { power: 250 }),
      rec(300, { power: 300 }),
    ];

    const result = findBestWindow(records, 'power', 300);
    expect(result).not.toBeNull();
    expect(result!.startTime).toBe(0);
    expect(result!.endTime).toBe(300);
    expect(result!.sampleCount).toBe(3);
    expect(result!.average).toBe(250);
  });

  it('handles gaps/pauses in elapsed time', () => {
    // Records with a time gap (like a pause)
    const records = [
      rec(0, { power: 100 }),
      rec(100, { power: 100 }),
      rec(200, { power: 100 }),
      // gap — no records between 200 and 800
      rec(800, { power: 300 }),
      rec(900, { power: 300 }),
      rec(1000, { power: 300 }),
      rec(1100, { power: 300 }),
    ];

    const result = findBestWindow(records, 'power', 300);
    expect(result).not.toBeNull();
    expect(result!.average).toBe(300);
  });

  it('works across different metric types', () => {
    const records = [
      rec(0, { cadence: 80, speed: 20 }),
      rec(300, { cadence: 90, speed: 30 }),
      rec(600, { cadence: 95, speed: 35 }),
    ];

    const cadResult = findBestWindow(records, 'cadence', 300);
    expect(cadResult).not.toBeNull();
    expect(cadResult!.average).toBeGreaterThanOrEqual(90);

    const spdResult = findBestWindow(records, 'speed', 300);
    expect(spdResult).not.toBeNull();
    expect(spdResult!.average).toBeGreaterThanOrEqual(30);
  });

  it('sampleCount reflects non-null values only', () => {
    const records = [
      rec(0, { power: 200 }),
      rec(100, { power: null }),
      rec(200, { power: null }),
      rec(300, { power: 250 }),
    ];

    const result = findBestWindow(records, 'power', 300);
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(2); // only 2 non-null values in window
  });
});
