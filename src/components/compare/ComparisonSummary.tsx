import { useMemo } from 'react';
import type { ParsedFitFile, FitRecord } from '../../types/fit';
import { formatDuration, formatDistance, formatNumber } from '../../lib/formatters';

interface ComparisonSummaryProps {
  fileA: ParsedFitFile;
  fileB: ParsedFitFile;
  /** When provided, stats are computed from these records instead of session data */
  filteredRecordsA?: FitRecord[];
  filteredRecordsB?: FitRecord[];
}

interface RowProps {
  label: string;
  valueA: string;
  valueB: string;
  rawA: number | null;
  rawB: number | null;
  unit?: string;
  /** Format function for the diff value (defaults to formatNumber with 1 decimal) */
  formatDiff?: (v: number) => string;
  /** If true, a lower value for B is "better" (shown green). Default false (higher B = green). */
  lowerIsBetter?: boolean;
}

function Row({ label, valueA, valueB, rawA, rawB, unit, formatDiff, lowerIsBetter = false }: RowProps) {
  const diff = rawA !== null && rawB !== null ? rawB - rawA : null;
  const fmt = formatDiff ?? ((v: number) => formatNumber(v, 1));
  let diffStr = '—';
  let diffColor = 'text-gray-400';
  if (diff !== null) {
    const abs = Math.abs(diff);
    if (abs < 0.05) {
      diffStr = '0';
      diffColor = 'text-gray-400';
    } else {
      const sign = diff > 0 ? '+' : '\u2212';
      diffStr = `${sign}${fmt(abs)}`;
      const isGood = lowerIsBetter ? diff < 0 : diff > 0;
      diffColor = isGood
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-500 dark:text-red-400';
    }
  }
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700">
      <td className="py-2 pr-4 text-xs font-medium text-gray-500">{label}</td>
      <td className="py-2 px-2 text-right text-sm tabular-nums text-gray-900 dark:text-white">
        {valueA}
        {unit && <span className="ml-1 text-xs text-gray-400">{unit}</span>}
      </td>
      <td className="py-2 px-2 text-right text-sm tabular-nums text-gray-900 dark:text-white">
        {valueB}
        {unit && <span className="ml-1 text-xs text-gray-400">{unit}</span>}
      </td>
      <td className={`py-2 px-2 text-right text-sm tabular-nums ${diffColor}`}>
        {diffStr}
        {diff !== null && unit && <span className="ml-1 text-xs opacity-60">{unit}</span>}
      </td>
    </tr>
  );
}

function avg(records: FitRecord[], key: 'heartRate' | 'power' | 'cadence' | 'speed'): number | null {
  let sum = 0;
  let count = 0;
  for (const r of records) {
    const v = r[key];
    if (v !== null) { sum += v; count++; }
  }
  return count > 0 ? sum / count : null;
}

function max(records: FitRecord[], key: 'heartRate' | 'power' | 'speed'): number | null {
  let m: number | null = null;
  for (const r of records) {
    const v = r[key];
    if (v !== null && (m === null || v > m)) m = v;
  }
  return m;
}

function totalAscent(records: FitRecord[]): number | null {
  let ascent = 0;
  let prev: number | null = null;
  for (const r of records) {
    if (r.altitude !== null) {
      if (prev !== null && r.altitude > prev) {
        ascent += r.altitude - prev;
      }
      prev = r.altitude;
    }
  }
  return ascent > 0 ? ascent : null;
}

function totalDistance(records: FitRecord[]): number {
  if (records.length < 2) return 0;
  const first = records[0].distance;
  const last = records[records.length - 1].distance;
  if (first === null || last === null) return 0;
  return last - first;
}

function totalDuration(records: FitRecord[]): number {
  if (records.length < 2) return 0;
  return records[records.length - 1].elapsedTime - records[0].elapsedTime;
}

interface StatValue {
  formatted: string;
  raw: number | null;
}

interface ComputedStats {
  duration: StatValue;
  distance: StatValue;
  avgHR: StatValue;
  maxHR: StatValue;
  avgPower: StatValue;
  maxPower: StatValue;
  avgCadence: StatValue;
  avgSpeed: StatValue;
  ascent: StatValue;
}

function sv(raw: number | null, formatted: string): StatValue {
  return { raw, formatted };
}

function statsFromRecords(records: FitRecord[]): ComputedStats {
  const dur = totalDuration(records);
  const dist = totalDistance(records);
  const aHR = avg(records, 'heartRate');
  const mHR = max(records, 'heartRate');
  const aPow = avg(records, 'power');
  const mPow = max(records, 'power');
  const aCad = avg(records, 'cadence');
  const aSpd = avg(records, 'speed');
  const asc = totalAscent(records);
  return {
    duration: sv(dur, formatDuration(dur)),
    distance: sv(dist, formatDistance(dist)),
    avgHR: sv(aHR, formatNumber(aHR)),
    maxHR: sv(mHR, formatNumber(mHR)),
    avgPower: sv(aPow, formatNumber(aPow)),
    maxPower: sv(mPow, formatNumber(mPow)),
    avgCadence: sv(aCad, formatNumber(aCad)),
    avgSpeed: sv(aSpd, formatNumber(aSpd, 1)),
    ascent: sv(asc, formatNumber(asc)),
  };
}

function statsFromSession(file: ParsedFitFile): ComputedStats {
  const s = file.session;
  return {
    duration: sv(s.totalElapsedTime, formatDuration(s.totalElapsedTime)),
    distance: sv(s.totalDistance, formatDistance(s.totalDistance)),
    avgHR: sv(s.avgHeartRate, formatNumber(s.avgHeartRate)),
    maxHR: sv(s.maxHeartRate, formatNumber(s.maxHeartRate)),
    avgPower: sv(s.avgPower, formatNumber(s.avgPower)),
    maxPower: sv(s.maxPower, formatNumber(s.maxPower)),
    avgCadence: sv(s.avgCadence, formatNumber(s.avgCadence)),
    avgSpeed: sv(s.avgSpeed, formatNumber(s.avgSpeed, 1)),
    ascent: sv(s.totalAscent, formatNumber(s.totalAscent)),
  };
}

export function ComparisonSummary({ fileA, fileB, filteredRecordsA, filteredRecordsB }: ComparisonSummaryProps) {
  const statsA = useMemo(
    () => filteredRecordsA ? statsFromRecords(filteredRecordsA) : statsFromSession(fileA),
    [fileA, filteredRecordsA],
  );
  const statsB = useMemo(
    () => filteredRecordsB ? statsFromRecords(filteredRecordsB) : statsFromSession(fileB),
    [fileB, filteredRecordsB],
  );

  const isFiltered = !!filteredRecordsA;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Summary Comparison
        {isFiltered && (
          <span className="ml-2 font-normal text-blue-500">(selected range)</span>
        )}
      </h3>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-600">
            <th className="py-2 text-left text-xs text-gray-500"></th>
            <th className="py-2 px-2 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">
              {fileA.fileName}
            </th>
            <th className="py-2 px-2 text-right text-xs font-semibold text-purple-600 dark:text-purple-400">
              {fileB.fileName}
            </th>
            <th className="py-2 px-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
              Diff
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="Duration" valueA={statsA.duration.formatted} valueB={statsB.duration.formatted}
            rawA={statsA.duration.raw} rawB={statsB.duration.raw}
            formatDiff={(v) => formatDuration(v)} lowerIsBetter />
          <Row label="Distance" valueA={statsA.distance.formatted} valueB={statsB.distance.formatted}
            rawA={statsA.distance.raw} rawB={statsB.distance.raw}
            formatDiff={(v) => formatDistance(v)} />
          <Row label="Avg HR" valueA={statsA.avgHR.formatted} valueB={statsB.avgHR.formatted}
            rawA={statsA.avgHR.raw} rawB={statsB.avgHR.raw} unit="bpm" />
          <Row label="Max HR" valueA={statsA.maxHR.formatted} valueB={statsB.maxHR.formatted}
            rawA={statsA.maxHR.raw} rawB={statsB.maxHR.raw} unit="bpm" />
          <Row label="Avg Power" valueA={statsA.avgPower.formatted} valueB={statsB.avgPower.formatted}
            rawA={statsA.avgPower.raw} rawB={statsB.avgPower.raw} unit="W" />
          <Row label="Max Power" valueA={statsA.maxPower.formatted} valueB={statsB.maxPower.formatted}
            rawA={statsA.maxPower.raw} rawB={statsB.maxPower.raw} unit="W" />
          <Row label="Avg Cadence" valueA={statsA.avgCadence.formatted} valueB={statsB.avgCadence.formatted}
            rawA={statsA.avgCadence.raw} rawB={statsB.avgCadence.raw} unit="rpm" />
          <Row label="Avg Speed" valueA={statsA.avgSpeed.formatted} valueB={statsB.avgSpeed.formatted}
            rawA={statsA.avgSpeed.raw} rawB={statsB.avgSpeed.raw} unit="km/h" />
          <Row label="Ascent" valueA={statsA.ascent.formatted} valueB={statsB.ascent.formatted}
            rawA={statsA.ascent.raw} rawB={statsB.ascent.raw} unit="m" />
        </tbody>
      </table>
    </div>
  );
}
