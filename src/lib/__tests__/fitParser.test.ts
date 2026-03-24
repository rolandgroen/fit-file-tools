import {
  num,
  str,
  toDate,
  kmToM,
  toPrimitive,
  normalizeRecord,
  normalizeLap,
  normalizeSession,
  normalizeDevice,
  normalizeActivityMetrics,
  normalizeFileId,
  normalizeZonesTarget,
  extractExtraMessages,
  HANDLED_MESSAGE_TYPES,
  KNOWN_RECORD_KEYS,
} from '../fitParser';

describe('num', () => {
  it('returns number for number', () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
    expect(num(-1.5)).toBe(-1.5);
  });

  it('returns null for null/undefined', () => {
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
  });

  it('returns null for NaN string', () => {
    expect(num('abc')).toBeNull();
  });

  it('converts numeric string to number', () => {
    expect(num('123')).toBe(123);
  });
});

describe('str', () => {
  it('returns "unknown" for null/undefined', () => {
    expect(str(null)).toBe('unknown');
    expect(str(undefined)).toBe('unknown');
  });

  it('converts value to string', () => {
    expect(str(42)).toBe('42');
    expect(str('hello')).toBe('hello');
  });
});

describe('toDate', () => {
  it('returns Date for Date', () => {
    const d = new Date('2024-01-01');
    expect(toDate(d)).toBe(d);
  });

  it('converts string to Date', () => {
    const result = toDate('2024-06-15T12:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
  });

  it('converts number to Date', () => {
    const ts = 1700000000000;
    const result = toDate(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(ts);
  });

  it('returns new Date for other types', () => {
    const result = toDate({});
    expect(result).toBeInstanceOf(Date);
  });
});

describe('kmToM', () => {
  it('converts km to meters', () => {
    expect(kmToM(0.279)).toBe(279);
  });

  it('returns null for null', () => {
    expect(kmToM(null)).toBeNull();
  });

  it('converts 0 to 0', () => {
    expect(kmToM(0)).toBe(0);
  });
});

describe('toPrimitive', () => {
  it('returns number', () => {
    expect(toPrimitive(42)).toBe(42);
  });

  it('returns string', () => {
    expect(toPrimitive('hello')).toBe('hello');
  });

  it('returns boolean', () => {
    expect(toPrimitive(true)).toBe(true);
  });

  it('returns null for null/undefined', () => {
    expect(toPrimitive(null)).toBeNull();
    expect(toPrimitive(undefined)).toBeNull();
  });

  it('converts Date to ISO string', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    expect(toPrimitive(d)).toBe('2024-01-01T00:00:00.000Z');
  });

  it('unwraps {value: x}', () => {
    expect(toPrimitive({ value: 99 })).toBe(99);
  });

  it('returns null for NaN', () => {
    expect(toPrimitive(NaN)).toBeNull();
  });
});

describe('normalizeRecord', () => {
  const startTime = new Date('2024-01-01T10:00:00Z').getTime();

  it('maps known keys correctly', () => {
    const raw = {
      timestamp: new Date('2024-01-01T10:01:00Z'),
      elapsed_time: 60,
      heart_rate: 150,
      power: 200,
      cadence: 90,
      speed: 30,
      altitude: 100,
      distance: 0.5,
      position_lat: 52.37,
      position_long: 4.9,
      temperature: 20,
    };
    const result = normalizeRecord(raw, startTime);
    expect(result.elapsedTime).toBe(60);
    expect(result.heartRate).toBe(150);
    expect(result.power).toBe(200);
    expect(result.cadence).toBe(90);
    expect(result.speed).toBe(30);
    expect(result.altitude).toBe(100);
    expect(result.distance).toBe(0.5);
    expect(result.latitude).toBe(52.37);
    expect(result.longitude).toBe(4.9);
    expect(result.temperature).toBe(20);
  });

  it('collects extra numeric fields', () => {
    const raw = {
      timestamp: new Date('2024-01-01T10:01:00Z'),
      elapsed_time: 60,
      custom_metric: 42,
    };
    const result = normalizeRecord(raw, startTime);
    expect(result.extraFields['custom_metric']).toBe(42);
  });

  it('uses enhanced_speed/altitude as fallback', () => {
    const raw = {
      timestamp: new Date('2024-01-01T10:01:00Z'),
      elapsed_time: 60,
      enhanced_speed: 25,
      enhanced_altitude: 500,
    };
    const result = normalizeRecord(raw, startTime);
    expect(result.speed).toBe(25);
    expect(result.altitude).toBe(500);
  });

  it('handles missing elapsed_time by computing from timestamp', () => {
    const raw = {
      timestamp: new Date('2024-01-01T10:00:30Z'),
    };
    const result = normalizeRecord(raw, startTime);
    expect(result.elapsedTime).toBe(30);
  });

  it('unwraps {value: x} in extra fields', () => {
    const raw = {
      timestamp: new Date('2024-01-01T10:01:00Z'),
      elapsed_time: 60,
      custom_obj: { value: 77 },
    };
    const result = normalizeRecord(raw, startTime);
    expect(result.extraFields['custom_obj']).toBe(77);
  });
});

describe('normalizeLap', () => {
  it('maps all fields', () => {
    const raw = {
      start_time: new Date('2024-01-01T10:00:00Z'),
      total_elapsed_time: 300,
      total_distance: 1.5,
      avg_heart_rate: 140,
      max_heart_rate: 180,
      avg_power: 200,
      max_power: 350,
      avg_cadence: 85,
      avg_speed: 28,
    };
    const result = normalizeLap(raw);
    expect(result.totalElapsedTime).toBe(300);
    expect(result.totalDistance).toBe(1.5);
    expect(result.avgHeartRate).toBe(140);
    expect(result.maxHeartRate).toBe(180);
    expect(result.avgPower).toBe(200);
    expect(result.maxPower).toBe(350);
    expect(result.avgCadence).toBe(85);
    expect(result.avgSpeed).toBe(28);
  });

  it('defaults missing values', () => {
    const raw = { timestamp: new Date('2024-01-01') };
    const result = normalizeLap(raw);
    expect(result.totalElapsedTime).toBe(0);
    expect(result.totalDistance).toBe(0);
    expect(result.avgHeartRate).toBeNull();
  });

  it('uses enhanced_avg_speed fallback', () => {
    const raw = {
      start_time: new Date(),
      enhanced_avg_speed: 32,
    };
    const result = normalizeLap(raw);
    expect(result.avgSpeed).toBe(32);
  });
});

describe('normalizeSession', () => {
  it('maps all fields including kmToM for ascent/descent', () => {
    const raw = {
      sport: 'cycling',
      sub_sport: 'road',
      start_time: new Date('2024-01-01T10:00:00Z'),
      total_elapsed_time: 3600,
      total_timer_time: 3500,
      total_distance: 40,
      total_ascent: 0.5,
      total_descent: 0.3,
      avg_heart_rate: 145,
      max_heart_rate: 185,
      avg_power: 220,
      max_power: 400,
      normalized_power: 235,
      avg_cadence: 88,
      avg_speed: 35,
      max_speed: 55,
    };
    const result = normalizeSession(raw);
    expect(result.sport).toBe('cycling');
    expect(result.subSport).toBe('road');
    expect(result.totalAscent).toBe(500);
    expect(result.totalDescent).toBe(300);
    expect(result.normalizedPower).toBe(235);
  });

  it('uses enhanced speed fallbacks', () => {
    const raw = {
      sport: 'running',
      sub_sport: 'generic',
      start_time: new Date(),
      total_elapsed_time: 1800,
      total_timer_time: 1800,
      total_distance: 5,
      enhanced_avg_speed: 10,
      enhanced_max_speed: 15,
    };
    const result = normalizeSession(raw);
    expect(result.avgSpeed).toBe(10);
    expect(result.maxSpeed).toBe(15);
  });
});

describe('normalizeDevice', () => {
  it('maps all fields', () => {
    const raw = {
      manufacturer: 'garmin',
      product_name: 'Edge 840',
      serial_number: 12345,
      software_version: '10.0',
      battery_status: 'good',
    };
    const result = normalizeDevice(raw);
    expect(result.manufacturer).toBe('garmin');
    expect(result.product).toBe('Edge 840');
    expect(result.serialNumber).toBe(12345);
    expect(result.softwareVersion).toBe('10.0');
    expect(result.batteryStatus).toBe('good');
  });

  it('handles null softwareVersion/batteryStatus', () => {
    const raw = { manufacturer: 'garmin', product: 'Edge' };
    const result = normalizeDevice(raw);
    expect(result.softwareVersion).toBeNull();
    expect(result.batteryStatus).toBeNull();
  });

  it('falls back to product when product_name is missing', () => {
    const raw = { manufacturer: 'garmin', product: 'Edge 530' };
    const result = normalizeDevice(raw);
    expect(result.product).toBe('Edge 530');
  });
});

describe('normalizeActivityMetrics', () => {
  it('maps all 12 fields', () => {
    const raw = {
      vo2_max: 55,
      first_vo2_max: 50,
      recovery_time: 48,
      total_ascent: 0.8,
      total_descent: 0.7,
      avg_power: 230,
      new_max_heart_rate: 192,
      aerobic_training_effect: 3.5,
      anaerobic_training_effect: 2.0,
      sport: 'cycling',
      primary_benefit: 'Base',
      avg_heart_rate: 150,
    };
    const result = normalizeActivityMetrics(raw);
    expect(result.vo2Max).toBe(55);
    expect(result.firstVo2Max).toBe(50);
    expect(result.recoveryTime).toBe(48);
    expect(result.totalAscent).toBe(800);
    expect(result.totalDescent).toBe(700);
    expect(result.avgPower).toBe(230);
    expect(result.newMaxHeartRate).toBe(192);
    expect(result.aerobicTrainingEffect).toBe(3.5);
    expect(result.anaerobicTrainingEffect).toBe(2.0);
    expect(result.sport).toBe('cycling');
    expect(result.primaryBenefit).toBe('Base');
    expect(result.avgHeartRate).toBe(150);
  });

  it('falls back to total_training_effect', () => {
    const raw = { total_training_effect: 4.0 };
    const result = normalizeActivityMetrics(raw);
    expect(result.aerobicTrainingEffect).toBe(4.0);
  });

  it('falls back to total_anaerobic_training_effect', () => {
    const raw = { total_anaerobic_training_effect: 1.5 };
    const result = normalizeActivityMetrics(raw);
    expect(result.anaerobicTrainingEffect).toBe(1.5);
  });
});

describe('normalizeFileId', () => {
  it('maps all fields', () => {
    const raw = {
      serial_number: 99999,
      time_created: '2024-01-01T10:00:00Z',
      manufacturer: 'garmin',
      product: 'edge_840',
      type: 'activity',
    };
    const result = normalizeFileId(raw);
    expect(result.serialNumber).toBe(99999);
    expect(result.timeCreated).toBeInstanceOf(Date);
    expect(result.manufacturer).toBe('garmin');
    expect(result.product).toBe('edge_840');
    expect(result.type).toBe('activity');
  });

  it('uses garmin_product fallback', () => {
    const raw = {
      garmin_product: 'forerunner_955',
      manufacturer: 'garmin',
      type: 'activity',
    };
    const result = normalizeFileId(raw);
    expect(result.product).toBe('forerunner_955');
  });

  it('handles missing time_created', () => {
    const raw = { manufacturer: 'garmin', type: 'activity' };
    const result = normalizeFileId(raw);
    expect(result.timeCreated).toBeNull();
  });
});

describe('normalizeZonesTarget', () => {
  it('maps all 3 fields', () => {
    const raw = {
      functional_threshold_power: 280,
      max_heart_rate: 190,
      threshold_heart_rate: 170,
    };
    const result = normalizeZonesTarget(raw);
    expect(result.functionalThresholdPower).toBe(280);
    expect(result.maxHeartRate).toBe(190);
    expect(result.thresholdHeartRate).toBe(170);
  });

  it('returns null for missing fields', () => {
    const result = normalizeZonesTarget({});
    expect(result.functionalThresholdPower).toBeNull();
    expect(result.maxHeartRate).toBeNull();
    expect(result.thresholdHeartRate).toBeNull();
  });
});

describe('extractExtraMessages', () => {
  it('skips HANDLED_MESSAGE_TYPES', () => {
    const data: Record<string, unknown> = {
      sessions: [{ sport: 'cycling' }],
      records: [{ heart_rate: 120 }],
    };
    const result = extractExtraMessages(data);
    expect(result).toEqual({});
  });

  it('skips non-array values', () => {
    const data: Record<string, unknown> = {
      some_string: 'hello',
      some_number: 42,
    };
    const result = extractExtraMessages(data);
    expect(result).toEqual({});
  });

  it('converts values via toPrimitive', () => {
    const data: Record<string, unknown> = {
      custom_msg: [
        { field1: 42, field2: 'hello', field3: true, field4: null },
      ],
    };
    const result = extractExtraMessages(data);
    expect(result['custom_msg']).toHaveLength(1);
    expect(result['custom_msg'][0]).toEqual({
      field1: 42,
      field2: 'hello',
      field3: true,
      field4: null,
    });
  });

  it('skips empty arrays', () => {
    const data: Record<string, unknown> = { custom_msg: [] };
    const result = extractExtraMessages(data);
    expect(result).toEqual({});
  });
});

describe('KNOWN_RECORD_KEYS', () => {
  it('contains expected keys', () => {
    const expected = [
      'timestamp', 'elapsed_time', 'timer_time', 'heart_rate', 'power',
      'cadence', 'speed', 'enhanced_speed', 'enhanced_altitude', 'altitude',
      'distance', 'position_lat', 'position_long', 'temperature',
    ];
    for (const key of expected) {
      expect(KNOWN_RECORD_KEYS.has(key)).toBe(true);
    }
  });
});

describe('HANDLED_MESSAGE_TYPES', () => {
  it('contains core message types', () => {
    expect(HANDLED_MESSAGE_TYPES.has('sessions')).toBe(true);
    expect(HANDLED_MESSAGE_TYPES.has('records')).toBe(true);
    expect(HANDLED_MESSAGE_TYPES.has('laps')).toBe(true);
    expect(HANDLED_MESSAGE_TYPES.has('devices')).toBe(true);
  });
});
