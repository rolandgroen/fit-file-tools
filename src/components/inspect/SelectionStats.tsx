import { useMemo } from 'react';
import type { FitRecord, MetricKey } from '../../types/fit';
import { METRICS } from '../../lib/constants';
import { formatDuration, formatNumber, formatDistance } from '../../lib/formatters';
import type { TimeRange } from '../../stores/uiStore';
import { useUIStore } from '../../stores/uiStore';
import { X } from 'lucide-react';

interface BasicStats {
  mean: number;
  min: number;
  max: number;
  count: number;
}

function computeBasicStats(records: FitRecord[], metric: MetricKey): BasicStats | null {
  const values: number[] = [];
  for (const r of records) {
    const v = r[metric];
    if (v !== null) values.push(v);
  }
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    mean: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeDistance(records: FitRecord[]): number | null {
  if (records.length < 2) return null;
  const first = records[0].distance;
  const last = records[records.length - 1].distance;
  if (first === null || last === null) return null;
  return last - first;
}

interface SelectionStatsProps {
  records: FitRecord[];
  timeRange: TimeRange;
  comparisonRecords?: FitRecord[];
  primaryLabel?: string;
  comparisonLabel?: string;
}

const ALL_METRICS: MetricKey[] = ['heartRate', 'power', 'cadence', 'speed', 'altitude'];

export function SelectionStats({
  records,
  timeRange,
  comparisonRecords,
  primaryLabel,
  comparisonLabel,
}: SelectionStatsProps) {
  const setTimeRange = useUIStore((s) => s.setTimeRange);

  const selectedA = useMemo(
    () => records.filter((r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime),
    [records, timeRange],
  );

  const selectedB = useMemo(
    () => comparisonRecords?.filter((r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime),
    [comparisonRecords, timeRange],
  );

  const duration = timeRange.endTime - timeRange.startTime;
  const distanceA = useMemo(() => computeDistance(selectedA), [selectedA]);
  const isCompare = !!selectedB;

  // Single-file mode: compute full stats with median
  const singleStats = useMemo(() => {
    if (isCompare) return null;
    return ALL_METRICS
      .map((m) => {
        const def = METRICS.find((d) => d.key === m);
        if (!def) return null;
        const values: number[] = [];
        for (const r of selectedA) {
          const v = r[m];
          if (v !== null) values.push(v);
        }
        if (values.length === 0) return null;
        const sum = values.reduce((a, b) => a + b, 0);
        return {
          key: m, label: def.label, unit: def.unit, color: def.color,
          mean: sum / values.length, median: median(values),
          min: Math.min(...values), max: Math.max(...values),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [isCompare, selectedA]);

  // Compare mode: compute stats for both files
  const compareStats = useMemo(() => {
    if (!isCompare || !selectedB) return null;
    return ALL_METRICS
      .map((m) => {
        const def = METRICS.find((d) => d.key === m);
        if (!def) return null;
        const a = computeBasicStats(selectedA, m);
        const b = computeBasicStats(selectedB, m);
        if (!a && !b) return null;
        return { key: m, label: def.label, unit: def.unit, color: def.color, a, b };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [isCompare, selectedA, selectedB]);

  if (!singleStats?.length && !compareStats?.length) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Selection Statistics
          <span className="ml-2 font-normal text-blue-600 dark:text-blue-400">
            {formatDuration(duration)}
            {distanceA !== null && <> &middot; {formatDistance(distanceA)}</>}
            {' '}&middot; {selectedA.length} records
          </span>
        </h3>
        <button
          onClick={() => setTimeRange(null)}
          className="rounded p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-800"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Single-file mode */}
        {singleStats && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-200 dark:border-blue-700">
                <th className="py-1.5 pr-4 text-left text-xs font-semibold text-blue-600 dark:text-blue-400">Metric</th>
                <th className="px-3 py-1.5 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">Mean</th>
                <th className="px-3 py-1.5 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">Median</th>
                <th className="px-3 py-1.5 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">Min</th>
                <th className="px-3 py-1.5 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">Max</th>
              </tr>
            </thead>
            <tbody>
              {singleStats.map((s) => (
                <tr key={s.key} className="border-b border-blue-100 last:border-0 dark:border-blue-800">
                  <td className="py-1.5 pr-4">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                      <span className="text-xs text-gray-400">({s.unit})</span>
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{formatNumber(s.mean, 1)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{formatNumber(s.median, 1)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{formatNumber(s.min, 1)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{formatNumber(s.max, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Compare mode */}
        {compareStats && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-200 dark:border-blue-700">
                <th className="py-1.5 pr-4 text-left text-xs font-semibold text-blue-600 dark:text-blue-400">Metric</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400" colSpan={2}>Mean</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400" colSpan={2}>Min</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400" colSpan={2}>Max</th>
              </tr>
              <tr className="border-b border-blue-100 dark:border-blue-800">
                <th></th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-blue-500">{primaryLabel}</th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-purple-500">{comparisonLabel}</th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-blue-500">{primaryLabel}</th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-purple-500">{comparisonLabel}</th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-blue-500">{primaryLabel}</th>
                <th className="px-2 py-1 text-right text-[10px] font-medium text-purple-500">{comparisonLabel}</th>
              </tr>
            </thead>
            <tbody>
              {compareStats.map((s) => (
                <tr key={s.key} className="border-b border-blue-100 last:border-0 dark:border-blue-800">
                  <td className="py-1.5 pr-4">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                      <span className="text-xs text-gray-400">({s.unit})</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.a ? formatNumber(s.a.mean, 1) : '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.b ? formatNumber(s.b.mean, 1) : '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.a ? formatNumber(s.a.min, 1) : '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.b ? formatNumber(s.b.min, 1) : '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.a ? formatNumber(s.a.max, 1) : '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{s.b ? formatNumber(s.b.max, 1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
