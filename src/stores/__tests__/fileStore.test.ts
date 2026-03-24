import { vi } from 'vitest';

// Mock idb-keyval before importing the store (side-effect: migrateFromLocalStorage runs on import)
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
}));

const { reviveDates, useFileStore } = await import('../fileStore');

describe('reviveDates', () => {
  it('converts ISO date strings to Date objects', () => {
    const result = reviveDates('2024-01-15T10:30:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect((result as unknown as Date).toISOString()).toBe('2024-01-15T10:30:00.000Z');
  });

  it('handles nested objects', () => {
    const input = {
      name: 'test',
      startTime: '2024-01-15T10:30:00.000Z',
      nested: {
        endTime: '2024-06-01T12:00:00.000Z',
      },
    };
    const result = reviveDates(input);
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.nested.endTime).toBeInstanceOf(Date);
    expect(result.name).toBe('test');
  });

  it('handles arrays', () => {
    const input = ['2024-01-15T10:30:00.000Z', 'hello', 42];
    const result = reviveDates(input);
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBe('hello');
    expect(result[2]).toBe(42);
  });

  it('leaves non-date strings unchanged', () => {
    expect(reviveDates('hello world')).toBe('hello world');
    expect(reviveDates('not-a-date')).toBe('not-a-date');
  });

  it('leaves numbers unchanged', () => {
    expect(reviveDates(42)).toBe(42);
  });

  it('leaves booleans unchanged', () => {
    expect(reviveDates(true)).toBe(true);
    expect(reviveDates(false)).toBe(false);
  });

  it('handles null and undefined', () => {
    expect(reviveDates(null)).toBeNull();
    expect(reviveDates(undefined)).toBeUndefined();
  });
});

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.getState().clearAll();
  });

  const makeFitFile = (id: string) => ({
    id,
    fileName: `${id}.fit`,
    fileSize: 1024,
    parsedAt: new Date(),
    session: {
      sport: 'cycling',
      subSport: 'road',
      startTime: new Date(),
      totalElapsedTime: 3600,
      totalTimerTime: 3500,
      totalDistance: 40,
      totalAscent: null,
      totalDescent: null,
      avgHeartRate: null,
      maxHeartRate: null,
      avgPower: null,
      maxPower: null,
      normalizedPower: null,
      avgCadence: null,
      avgSpeed: null,
      maxSpeed: null,
    },
    laps: [],
    records: [],
    devices: [],
    extraMessages: {},
    activityMetrics: null,
    fileId: null,
    zonesTarget: null,
    hasGps: false,
    hasPower: false,
    hasHeartRate: false,
  });

  it('addFile adds a file and updates fileOrder', () => {
    const file = makeFitFile('file-1');
    useFileStore.getState().addFile(file);
    expect(useFileStore.getState().files['file-1']).toBeDefined();
    expect(useFileStore.getState().fileOrder).toContain('file-1');
  });

  it('removeFile removes a file and updates fileOrder', () => {
    const file = makeFitFile('file-2');
    useFileStore.getState().addFile(file);
    useFileStore.getState().removeFile('file-2');
    expect(useFileStore.getState().files['file-2']).toBeUndefined();
    expect(useFileStore.getState().fileOrder).not.toContain('file-2');
  });

  it('getFile returns file by id', () => {
    const file = makeFitFile('file-3');
    useFileStore.getState().addFile(file);
    expect(useFileStore.getState().getFile('file-3')).toBeDefined();
    expect(useFileStore.getState().getFile('nonexistent')).toBeUndefined();
  });

  it('clearAll empties files and fileOrder', () => {
    useFileStore.getState().addFile(makeFitFile('a'));
    useFileStore.getState().addFile(makeFitFile('b'));
    useFileStore.getState().clearAll();
    expect(Object.keys(useFileStore.getState().files)).toHaveLength(0);
    expect(useFileStore.getState().fileOrder).toHaveLength(0);
  });

  it('fileOrder tracks insertion order', () => {
    useFileStore.getState().addFile(makeFitFile('x'));
    useFileStore.getState().addFile(makeFitFile('y'));
    useFileStore.getState().addFile(makeFitFile('z'));
    expect(useFileStore.getState().fileOrder).toEqual(['x', 'y', 'z']);
  });
});
