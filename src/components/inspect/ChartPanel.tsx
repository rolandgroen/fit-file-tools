import { useMemo, useCallback, useState, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import type { FitRecord, MetricKey } from '../../types/fit';
import { METRIC_MAP } from '../../lib/constants';
import { formatElapsedTime, formatNumber } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';

/** Lighten a hex color by mixing it towards white */
function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

interface ChartPanelProps {
  records: FitRecord[];
  metric: MetricKey;
  syncId?: string;
  height?: number;
  onTimeClick?: (elapsedTime: number) => void;
  comparisonRecords?: FitRecord[];
  primaryLabel?: string;
  comparisonLabel?: string;
  enableDragSelect?: boolean;
}

export function ChartPanel({
  records,
  metric,
  syncId = 'inspect-charts',
  height = 180,
  onTimeClick,
  comparisonRecords,
  primaryLabel,
  comparisonLabel,
  enableDragSelect = false,
}: ChartPanelProps) {
  const def = METRIC_MAP[metric];
  const hoverTime = useUIStore((s) => s.hover.elapsedTime);
  const setHover = useUIStore((s) => s.setHover);
  const clearHover = useUIStore((s) => s.clearHover);
  const timeRange = useUIStore((s) => s.timeRange);
  const setTimeRange = useUIStore((s) => s.setTimeRange);

  // Use refs for drag tracking to avoid stale closures + RAF to throttle renders
  const dragLeftRef = useRef<number | null>(null);
  const dragRightRef = useRef<number | null>(null);
  const rafId = useRef(0);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  const data = useMemo(() => {
    return records.map((r) => ({
      time: r.elapsedTime,
      value: r[metric] ?? undefined,
    }));
  }, [records, metric]);

  const compData = useMemo(() => {
    if (!comparisonRecords) return null;
    return comparisonRecords.map((r) => ({
      time: r.elapsedTime,
      value: r[metric] ?? undefined,
    }));
  }, [comparisonRecords, metric]);

  const chartData = useMemo(() => {
    if (!compData) return data;
    const merged = new Map<number, { time: number; value: number | undefined; comp: number | undefined }>();
    for (const d of data) {
      merged.set(d.time, { time: d.time, value: d.value, comp: undefined });
    }
    for (const d of compData) {
      const existing = merged.get(d.time);
      if (existing) {
        existing.comp = d.value;
      } else {
        merged.set(d.time, { time: d.time, value: undefined, comp: d.value });
      }
    }
    return Array.from(merged.values()).sort((a, b) => a.time - b.time);
  }, [data, compData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = useCallback(
    (e: any) => {
      if (!enableDragSelect || !e?.activeLabel) return;
      const t = Number(e.activeLabel);
      dragLeftRef.current = t;
      dragRightRef.current = null;
      setRefAreaLeft(t);
      setRefAreaRight(null);
    },
    [enableDragSelect],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback(
    (e: any) => {
      if (e?.activePayload?.[0]) {
        const time = e.activePayload[0].payload.time as number;
        setHover({ elapsedTime: time, source: 'chart' });
      }
      // Track drag via ref, throttle state updates with RAF
      if (dragLeftRef.current !== null && e?.activeLabel) {
        dragRightRef.current = Number(e.activeLabel);
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          setRefAreaRight(dragRightRef.current);
        });
      }
    },
    [setHover],
  );

  const handleMouseUp = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    const left = dragLeftRef.current;
    const right = dragRightRef.current;
    dragLeftRef.current = null;
    dragRightRef.current = null;

    if (left === null || right === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    const start = Math.min(left, right);
    const end = Math.max(left, right);

    if (end - start > 2) {
      setTimeRange({ startTime: start, endTime: end });
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, [setTimeRange]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback(
    (state: any) => {
      if (onTimeClick && state?.activePayload?.[0]) {
        onTimeClick(state.activePayload[0].payload.time);
      }
    },
    [onTimeClick],
  );

  const handleDoubleClick = useCallback(() => {
    if (enableDragSelect && timeRange) {
      setTimeRange(null);
    }
  }, [enableDragSelect, timeRange, setTimeRange]);

  const selLeft = refAreaLeft !== null && refAreaRight !== null
    ? Math.min(refAreaLeft, refAreaRight) : null;
  const selRight = refAreaLeft !== null && refAreaRight !== null
    ? Math.max(refAreaLeft, refAreaRight) : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-1 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: def.color }} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {def.label} ({def.unit})
        </span>
        {compData && primaryLabel && (
          <span className="ml-auto flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: def.color }} />
              <span className="text-gray-500 dark:text-gray-400">{primaryLabel}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: lightenColor(def.color, 0.65) }} />
              <span className="text-gray-500 dark:text-gray-400">{comparisonLabel}</span>
            </span>
          </span>
        )}
        {enableDragSelect && !timeRange && !compData && (
          <span className="text-xs text-gray-400">— drag to select range</span>
        )}
        {enableDragSelect && timeRange && (
          <span className="text-xs text-gray-400">— double-click to clear</span>
        )}
      </div>
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: enableDragSelect ? 'crosshair' : undefined,
          userSelect: 'none',
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            syncId={syncId}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={clearHover}
            onClick={handleClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v: unknown) => formatElapsedTime(Number(v) || 0)}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              allowDataOverflow
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              width={45}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => [formatNumber(Number(value), 1), String(name)]}
              labelFormatter={(label: unknown) => formatElapsedTime(Number(label))}
              contentStyle={{
                backgroundColor: 'rgba(55,65,81,0.95)',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#e5e7eb',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={def.color}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls
              name={primaryLabel ?? def.label}
            />
            {compData && (
              <Line
                type="monotone"
                dataKey="comp"
                stroke={lightenColor(def.color, 0.65)}
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
                connectNulls
                name={comparisonLabel ?? 'File B'}
              />
            )}
            {hoverTime !== null && (
              <ReferenceLine
                x={hoverTime}
                stroke="#6b7280"
                strokeDasharray="2 2"
              />
            )}
            {selLeft !== null && selRight !== null && (
              <ReferenceArea
                x1={selLeft}
                x2={selRight}
                fill="#3b82f6"
                fillOpacity={0.15}
                stroke="#3b82f6"
                strokeOpacity={0.5}
              />
            )}
            {timeRange && refAreaLeft === null && (
              <ReferenceArea
                x1={timeRange.startTime}
                x2={timeRange.endTime}
                fill="#3b82f6"
                fillOpacity={0.1}
                stroke="#3b82f6"
                strokeOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
