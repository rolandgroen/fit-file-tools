import FitParser from 'fit-file-parser';
import type { ParsedFitFile, FitRecord, FitLap, FitSession, FitDevice, ExtraMessageValue, ActivityMetrics, FileId, ZonesTarget } from '../types/fit';

const parser = new FitParser({
  force: true,
  speedUnit: 'km/h',
  lengthUnit: 'km',
  temperatureUnit: 'celsius',
  elapsedRecordField: true,
  mode: 'list',
});

function num(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function str(value: unknown): string {
  if (value === undefined || value === null) return 'unknown';
  return String(value);
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

const KNOWN_RECORD_KEYS = new Set([
  'timestamp', 'elapsed_time', 'timer_time', 'heart_rate', 'power', 'cadence',
  'speed', 'enhanced_speed', 'enhanced_altitude', 'altitude', 'distance',
  'position_lat', 'position_long', 'temperature',
]);

function normalizeRecord(raw: Record<string, unknown>, startTime: number): FitRecord {
  const timestamp = toDate(raw.timestamp);
  const elapsedTime = num(raw.elapsed_time) ?? (timestamp.getTime() - startTime) / 1000;

  const extraFields: Record<string, number> = {};
  for (const key of Object.keys(raw)) {
    if (KNOWN_RECORD_KEYS.has(key)) continue;
    const val = raw[key];
    if (typeof val === 'number' && !isNaN(val)) {
      extraFields[key] = val;
    } else if (val && typeof val === 'object' && 'value' in val) {
      const inner = (val as { value: unknown }).value;
      if (typeof inner === 'number' && !isNaN(inner)) {
        extraFields[key] = inner;
      }
    }
  }

  return {
    timestamp,
    elapsedTime: Math.max(0, elapsedTime),
    heartRate: num(raw.heart_rate),
    power: num(raw.power),
    cadence: num(raw.cadence),
    speed: num(raw.enhanced_speed ?? raw.speed),
    altitude: num(raw.enhanced_altitude ?? raw.altitude),
    distance: num(raw.distance),
    latitude: num(raw.position_lat),
    longitude: num(raw.position_long),
    temperature: num(raw.temperature),
    extraFields,
  };
}

function normalizeLap(raw: Record<string, unknown>): FitLap {
  return {
    startTime: toDate(raw.start_time ?? raw.timestamp),
    totalElapsedTime: num(raw.total_elapsed_time) ?? 0,
    totalDistance: num(raw.total_distance) ?? 0,
    avgHeartRate: num(raw.avg_heart_rate),
    maxHeartRate: num(raw.max_heart_rate),
    avgPower: num(raw.avg_power),
    maxPower: num(raw.max_power),
    avgCadence: num(raw.avg_cadence),
    avgSpeed: num(raw.avg_speed ?? raw.enhanced_avg_speed),
  };
}

function normalizeSession(raw: Record<string, unknown>): FitSession {
  return {
    sport: str(raw.sport),
    subSport: str(raw.sub_sport),
    startTime: toDate(raw.start_time ?? raw.timestamp),
    totalElapsedTime: num(raw.total_elapsed_time) ?? 0,
    totalTimerTime: num(raw.total_timer_time) ?? 0,
    totalDistance: num(raw.total_distance) ?? 0,
    totalAscent: kmToM(raw.total_ascent),
    totalDescent: kmToM(raw.total_descent),
    avgHeartRate: num(raw.avg_heart_rate),
    maxHeartRate: num(raw.max_heart_rate),
    avgPower: num(raw.avg_power),
    maxPower: num(raw.max_power),
    normalizedPower: num(raw.normalized_power),
    avgCadence: num(raw.avg_cadence),
    avgSpeed: num(raw.avg_speed ?? raw.enhanced_avg_speed),
    maxSpeed: num(raw.max_speed ?? raw.enhanced_max_speed),
  };
}

function normalizeDevice(raw: Record<string, unknown>): FitDevice {
  return {
    manufacturer: str(raw.manufacturer),
    product: str(raw.product_name ?? raw.product),
    serialNumber: num(raw.serial_number),
    softwareVersion: raw.software_version != null ? str(raw.software_version) : null,
    batteryStatus: raw.battery_status != null ? str(raw.battery_status) : null,
  };
}

function kmToM(val: unknown): number | null {
  const n = num(val);
  return n !== null ? Math.round(n * 1000) : null;
}

function normalizeActivityMetrics(raw: Record<string, unknown>): ActivityMetrics {
  return {
    vo2Max: num(raw.vo2_max),
    firstVo2Max: num(raw.first_vo2_max),
    recoveryTime: num(raw.recovery_time),
    totalAscent: kmToM(raw.total_ascent),
    totalDescent: kmToM(raw.total_descent),
    avgPower: num(raw.avg_power),
    newMaxHeartRate: num(raw.new_max_heart_rate),
    aerobicTrainingEffect: num(raw.aerobic_training_effect) ?? num(raw.total_training_effect),
    anaerobicTrainingEffect: num(raw.anaerobic_training_effect) ?? num(raw.total_anaerobic_training_effect),
    sport: raw.sport != null ? str(raw.sport) : null,
    primaryBenefit: raw.primary_benefit != null ? str(raw.primary_benefit) : null,
    avgHeartRate: num(raw.avg_heart_rate),
  };
}

function normalizeFileId(raw: Record<string, unknown>): FileId {
  return {
    serialNumber: num(raw.serial_number),
    timeCreated: raw.time_created ? toDate(raw.time_created) : null,
    manufacturer: str(raw.manufacturer),
    product: str(raw.garmin_product ?? raw.product),
    type: str(raw.type),
  };
}

function normalizeZonesTarget(raw: Record<string, unknown>): ZonesTarget {
  return {
    functionalThresholdPower: num(raw.functional_threshold_power),
    maxHeartRate: num(raw.max_heart_rate),
    thresholdHeartRate: num(raw.threshold_heart_rate),
  };
}

/** Message types already handled by dedicated parsing or not useful for data fields. */
const HANDLED_MESSAGE_TYPES = new Set([
  'sessions', 'laps', 'records', 'devices',
  'file_id', 'file_creator', 'activity', 'software',
  'user_profile', 'device_settings', 'zones_target',
  'hr_zone', 'power_zone', 'sport', 'sports',
  'developer_data_id', 'field_description', 'developer_data_ids', 'field_descriptions',
  'definitions',
  'activity_metrics', 'file_ids', 'time_in_zone',
]);

function toPrimitive(val: unknown): ExtraMessageValue {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object' && 'value' in val) {
    return toPrimitive((val as { value: unknown }).value);
  }
  return String(val);
}

function extractExtraMessages(
  rawData: Record<string, unknown>,
): Record<string, Record<string, ExtraMessageValue>[]> {
  const result: Record<string, Record<string, ExtraMessageValue>[]> = {};

  for (const [msgType, msgArray] of Object.entries(rawData)) {
    if (HANDLED_MESSAGE_TYPES.has(msgType)) continue;
    if (!Array.isArray(msgArray) || msgArray.length === 0) continue;

    const entries = msgArray as Record<string, unknown>[];
    if (typeof entries[0] !== 'object' || !entries[0]) continue;

    const rows: Record<string, ExtraMessageValue>[] = [];
    for (const entry of entries) {
      const row: Record<string, ExtraMessageValue> = {};
      for (const [key, val] of Object.entries(entry)) {
        row[key] = toPrimitive(val);
      }
      rows.push(row);
    }
    if (rows.length > 0) result[msgType] = rows;
  }

  return result;
}

export async function parseFitFile(file: File): Promise<ParsedFitFile> {
  const buffer = await file.arrayBuffer();

  const raw = await new Promise<Record<string, unknown>>((resolve, reject) => {
    parser.parse(buffer, (error: Error | null, data: Record<string, unknown>) => {
      if (error) reject(error);
      else resolve(data);
    });
  });

  const sessions = (raw.sessions ?? []) as Record<string, unknown>[];
  const sessionRaw = sessions[0] ?? {};
  const session = normalizeSession(sessionRaw);
  const startTime = session.startTime.getTime();

  const rawRecords = (raw.records ?? []) as Record<string, unknown>[];
  const allRecords = rawRecords.map((r) => normalizeRecord(r, startTime));

  // Trim leading dead time: find the first record with actual data
  // (speed > 0, or heart rate, or power) and rebase elapsed times from there.
  const firstDataIdx = allRecords.findIndex(
    (r) => (r.speed !== null && r.speed > 0.5) || r.heartRate !== null || r.power !== null,
  );
  const trimOffset = firstDataIdx > 0 ? allRecords[firstDataIdx].elapsedTime : 0;
  const records = (firstDataIdx > 0 ? allRecords.slice(firstDataIdx) : allRecords).map((r) => ({
    ...r,
    elapsedTime: r.elapsedTime - trimOffset,
  }));

  const rawLaps = (raw.laps ?? []) as Record<string, unknown>[];
  const laps = rawLaps.map(normalizeLap);
  const rawDevices = (raw.device_infos ?? raw.devices ?? []) as Record<string, unknown>[];
  const devices = rawDevices.map(normalizeDevice);

  // Extract dedicated message types before generic extra messages
  const rawActivityMetrics = (raw.activity_metrics ?? []) as Record<string, unknown>[];
  const activityMetrics = rawActivityMetrics.length > 0
    ? normalizeActivityMetrics(rawActivityMetrics[0])
    : null;

  const rawFileId = (raw.file_id ?? raw.file_ids ?? []) as Record<string, unknown>[];
  const fileId = rawFileId.length > 0
    ? normalizeFileId(Array.isArray(rawFileId) ? rawFileId[0] : rawFileId)
    : null;

  const rawZonesTarget = (raw.zones_target ?? []) as Record<string, unknown>[];
  const zonesTarget = rawZonesTarget.length > 0
    ? normalizeZonesTarget(rawZonesTarget[0])
    : null;

  const extraMessages = extractExtraMessages(raw);

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileSize: file.size,
    parsedAt: new Date(),
    session,
    laps,
    records,
    devices,
    extraMessages,
    activityMetrics,
    fileId,
    zonesTarget,
    hasGps: records.some((r) => r.latitude !== null && r.longitude !== null),
    hasPower: records.some((r) => r.power !== null),
    hasHeartRate: records.some((r) => r.heartRate !== null),
  };
}
