import { memo } from 'react';
import type { FitRecord, MetricKey } from '../../types/fit';
import { METRICS } from '../../lib/constants';
import { useUIStore } from '../../stores/uiStore';
import { ChartPanel } from './ChartPanel';
import { RangeBrush } from './RangeBrush';
import { RangeShortcuts } from './RangeShortcuts';
import { SelectionSummary } from './SelectionSummary';

interface ChartStackProps {
  records: FitRecord[];
  syncId?: string;
  onTimeClick?: (elapsedTime: number) => void;
  comparisonRecords?: FitRecord[];
  primaryLabel?: string;
  comparisonLabel?: string;
  enableBrush?: boolean;
}

function hasMetricData(records: FitRecord[], metric: MetricKey): boolean {
  return records.some((r) => r[metric] !== null);
}

export const ChartStack = memo(function ChartStack({
  records,
  syncId,
  onTimeClick,
  comparisonRecords,
  primaryLabel,
  comparisonLabel,
  enableBrush = false,
}: ChartStackProps) {
  const timeRange = useUIStore((s) => s.timeRange);
  const availableMetrics = METRICS.filter((m) => hasMetricData(records, m.key));

  if (availableMetrics.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-800">
        No metric data available in this file
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enableBrush && (
        <div className="overflow-hidden rounded-lg border border-blue-200/60 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/20">
          <RangeShortcuts records={records} />
          <div className="mx-4 border-t border-blue-200/60 dark:border-blue-800/40" />
          <RangeBrush records={records} comparisonRecords={comparisonRecords} />
        </div>
      )}
      {enableBrush && (
        <SelectionSummary records={records} timeRange={timeRange} />
      )}
      {availableMetrics.map((m) => (
        <ChartPanel
          key={m.key}
          records={records}
          metric={m.key}
          syncId={syncId}
          onTimeClick={onTimeClick}
          comparisonRecords={comparisonRecords}
          primaryLabel={primaryLabel}
          comparisonLabel={comparisonLabel}
          enableDragSelect={enableBrush}
        />
      ))}
    </div>
  );
});
