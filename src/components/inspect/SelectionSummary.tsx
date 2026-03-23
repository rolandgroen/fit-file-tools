import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { FitRecord } from '../../types/fit';
import { formatDuration, formatDistance, formatNumber } from '../../lib/formatters';
import type { TimeRange } from '../../stores/uiStore';
import { StatCard } from './ActivitySummary';

interface SelectionSummaryProps {
  records: FitRecord[];
  timeRange: TimeRange | null;
}

export function SelectionSummary({ records, timeRange }: SelectionSummaryProps) {
  const stats = useMemo(() => {
    const selected = timeRange
      ? records.filter((r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime)
      : records;
    if (selected.length === 0) return null;

    const duration = selected[selected.length - 1].elapsedTime - selected[0].elapsedTime;

    const first = selected[0].distance;
    const last = selected[selected.length - 1].distance;
    const distance = first !== null && last !== null ? last - first : null;

    let hrSum = 0, hrCount = 0, hrMax = -Infinity;
    let pwrSum = 0, pwrCount = 0, pwrMax = -Infinity;
    let cadSum = 0, cadCount = 0;
    let spdSum = 0, spdCount = 0;

    for (const r of selected) {
      if (r.heartRate !== null) { hrSum += r.heartRate; hrCount++; if (r.heartRate > hrMax) hrMax = r.heartRate; }
      if (r.power !== null) { pwrSum += r.power; pwrCount++; if (r.power > pwrMax) pwrMax = r.power; }
      if (r.cadence !== null) { cadSum += r.cadence; cadCount++; }
      if (r.speed !== null) { spdSum += r.speed; spdCount++; }
    }

    return {
      duration,
      distance,
      avgHeartRate: hrCount > 0 ? hrSum / hrCount : null,
      maxHeartRate: hrCount > 0 ? hrMax : null,
      avgPower: pwrCount > 0 ? pwrSum / pwrCount : null,
      maxPower: pwrCount > 0 ? pwrMax : null,
      avgCadence: cadCount > 0 ? cadSum / cadCount : null,
      avgSpeed: spdCount > 0 ? spdSum / spdCount : null,
    };
  }, [records, timeRange]);

  if (!stats) return null;

  const hi = !!timeRange;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <BarChart3 className="h-4 w-4" />
        Stats
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Duration" value={formatDuration(stats.duration)} highlight={hi} />
        {stats.distance !== null && (
          <StatCard label="Distance" value={formatDistance(stats.distance)} highlight={hi} />
        )}
        {stats.avgHeartRate !== null && (
          <StatCard label="Avg HR" value={formatNumber(stats.avgHeartRate)} unit="bpm" highlight={hi} />
        )}
        {stats.maxHeartRate !== null && (
          <StatCard label="Max HR" value={formatNumber(stats.maxHeartRate)} unit="bpm" highlight={hi} />
        )}
        {stats.avgPower !== null && (
          <StatCard label="Avg Power" value={formatNumber(stats.avgPower)} unit="W" highlight={hi} />
        )}
        {stats.maxPower !== null && (
          <StatCard label="Max Power" value={formatNumber(stats.maxPower)} unit="W" highlight={hi} />
        )}
        {stats.avgCadence !== null && (
          <StatCard label="Avg Cadence" value={formatNumber(stats.avgCadence)} unit="rpm" highlight={hi} />
        )}
        {stats.avgSpeed !== null && (
          <StatCard label="Avg Speed" value={formatNumber(stats.avgSpeed, 1)} unit="km/h" highlight={hi} />
        )}
      </div>
    </div>
  );
}
