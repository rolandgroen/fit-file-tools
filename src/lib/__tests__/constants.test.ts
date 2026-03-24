import { METRICS, METRIC_MAP } from '../constants';

describe('METRICS', () => {
  it('has 5 entries', () => {
    expect(METRICS).toHaveLength(5);
  });

  it('has correct keys', () => {
    const keys = METRICS.map((m) => m.key);
    expect(keys).toEqual(['heartRate', 'power', 'cadence', 'speed', 'altitude']);
  });

  it('each metric has required fields', () => {
    for (const m of METRICS) {
      expect(m).toHaveProperty('key');
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('unit');
      expect(m).toHaveProperty('color');
      expect(m).toHaveProperty('domain');
      expect(m.domain).toHaveLength(2);
      expect(typeof m.domain[0]).toBe('number');
      expect(typeof m.domain[1]).toBe('number');
    }
  });
});

describe('METRIC_MAP', () => {
  it('maps each key correctly', () => {
    for (const m of METRICS) {
      expect(METRIC_MAP[m.key]).toBe(m);
    }
  });

  it('has the same number of entries as METRICS', () => {
    expect(Object.keys(METRIC_MAP)).toHaveLength(METRICS.length);
  });
});
