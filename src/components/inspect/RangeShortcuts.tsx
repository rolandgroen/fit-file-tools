import { useState, useMemo, useCallback } from 'react';
import { Timer } from 'lucide-react';
import type { FitRecord, MetricKey } from '../../types/fit';
import { METRICS, METRIC_MAP } from '../../lib/constants';
import { findBestWindow } from '../../lib/bestWindow';
import { formatNumber } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';

const DURATIONS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '60 min', seconds: 3600 },
];

interface RangeShortcutsProps {
  records: FitRecord[];
}

export function RangeShortcuts({ records }: RangeShortcutsProps) {
  const setTimeRange = useUIStore((s) => s.setTimeRange);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);

  const activityDuration = useMemo(() => {
    if (records.length < 2) return 0;
    return records[records.length - 1].elapsedTime - records[0].elapsedTime;
  }, [records]);

  const availableMetrics = useMemo(
    () => METRICS.filter((m) => records.some((r) => r[m.key] !== null)),
    [records],
  );

  const availableDurations = useMemo(
    () => DURATIONS.filter((d) => activityDuration >= d.seconds),
    [activityDuration],
  );

  const handleDurationClick = useCallback(
    (seconds: number) => {
      if (!selectedMetric) return;
      const result = findBestWindow(records, selectedMetric, seconds);
      if (result) {
        const def = METRIC_MAP[selectedMetric];
        const decimals = selectedMetric === 'speed' ? 1 : 0;
        setResultLabel(`Avg ${formatNumber(result.average, decimals)} ${def.unit}`);
        setTimeRange({ startTime: result.startTime, endTime: result.endTime });
      } else {
        setResultLabel('No data');
      }
    },
    [records, selectedMetric, setTimeRange],
  );

  const handleMetricClick = useCallback((key: MetricKey) => {
    setSelectedMetric((prev) => (prev === key ? null : key));
    setResultLabel(null);
  }, []);

  if (availableMetrics.length === 0 || availableDurations.length === 0) return null;

  return (
    <div className="px-4 pt-4 pb-3">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <Timer className="h-4 w-4" />
        Best Window
      </h3>

      {/* Metric pills */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {availableMetrics.map((m) => {
          const active = selectedMetric === m.key;
          return (
            <button
              key={m.key}
              onClick={() => handleMetricClick(m.key)}
              className={
                active
                  ? 'rounded-full px-3 py-1 text-xs font-medium transition-colors text-white'
                  : 'rounded-full px-3 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }
              style={active ? { backgroundColor: m.color } : undefined}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Duration buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {availableDurations.map((d) => (
          <button
            key={d.seconds}
            onClick={() => handleDurationClick(d.seconds)}
            disabled={!selectedMetric}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {d.label}
          </button>
        ))}

        {resultLabel && (
          <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {resultLabel}
          </span>
        )}
      </div>
    </div>
  );
}
