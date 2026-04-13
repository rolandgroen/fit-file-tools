import { useMemo, useCallback, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Brush,
} from 'recharts';
import type { FitRecord } from '../../types/fit';
import { formatElapsedTime } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';
import { findNearestRecordByTime, findFirstRecordAtOrAfter, findLastRecordAtOrBefore } from '../../lib/geoUtils';
import { RotateCcw } from 'lucide-react';

const MAX_BRUSH_POINTS = 500;

interface RangeBrushProps {
  records: FitRecord[];
  comparisonRecords?: FitRecord[];
}

/** Compute contiguous ranges where data exists as [startFraction, endFraction] */
function computeDataRanges(
  records: FitRecord[],
  tStart: number,
  tEnd: number,
  step: number,
): [number, number][] {
  const duration = tEnd - tStart;
  if (duration <= 0) return [];

  const ranges: [number, number][] = [];
  let rangeStart: number | null = null;

  for (let t = tStart; t <= tEnd; t += step) {
    const idx = findNearestRecordByTime(records, t);
    const gap = Math.abs(records[idx].elapsedTime - t);
    const hasData = gap <= step * 2;

    if (hasData && rangeStart === null) {
      rangeStart = t;
    } else if (!hasData && rangeStart !== null) {
      ranges.push([(rangeStart - tStart) / duration, (t - tStart) / duration]);
      rangeStart = null;
    }
  }
  if (rangeStart !== null) {
    ranges.push([(rangeStart - tStart) / duration, 1]);
  }
  return ranges;
}

export function RangeBrush({ records, comparisonRecords }: RangeBrushProps) {
  const timeRange = useUIStore((s) => s.timeRange);
  const setTimeRange = useUIStore((s) => s.setTimeRange);
  const pendingRange = useRef<{ startIdx: number; endIdx: number } | null>(null);

  const { data, tStart, tEnd, step } = useMemo(() => {
    if (records.length === 0) return { data: [], tStart: 0, tEnd: 0, step: 1 };
    let tStart = records[0].elapsedTime;
    let tEnd = records[records.length - 1].elapsedTime;
    // Extend range to cover comparison records if present
    if (comparisonRecords && comparisonRecords.length > 0) {
      tStart = Math.min(tStart, comparisonRecords[0].elapsedTime);
      tEnd = Math.max(tEnd, comparisonRecords[comparisonRecords.length - 1].elapsedTime);
    }
    const duration = tEnd - tStart;
    if (duration <= 0) return { data: [], tStart, tEnd, step: 1 };

    const step = Math.max(1, Math.ceil(duration / MAX_BRUSH_POINTS));
    const sampled: { time: number; value: number }[] = [];

    for (let t = tStart; t <= tEnd; t += step) {
      const idx = findNearestRecordByTime(records, t);
      const r = records[idx];
      const gap = Math.abs(r.elapsedTime - t);
      const inPause = gap > step * 2;
      sampled.push({
        time: t,
        value: inPause ? 0 : (r.altitude ?? r.speed ?? r.heartRate ?? 0),
      });
    }

    const last = sampled[sampled.length - 1];
    if (last.time !== tEnd) {
      const r = records[records.length - 1];
      sampled.push({
        time: tEnd,
        value: r.altitude ?? r.speed ?? r.heartRate ?? 0,
      });
    }

    return { data: sampled, tStart, tEnd, step };
  }, [records, comparisonRecords]);

  const dataRanges = useMemo(
    () => computeDataRanges(records, tStart, tEnd, step),
    [records, tStart, tEnd, step],
  );

  // Track visible brush position for the duration label
  const [visibleIndices, setVisibleIndices] = useState<{ start: number; end: number } | null>(null);

  const onBrushChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (brushState: any) => {
      if (!brushState || brushState.startIndex === undefined) return;
      pendingRange.current = {
        startIdx: brushState.startIndex,
        endIdx: brushState.endIndex,
      };
      setVisibleIndices({ start: brushState.startIndex, end: brushState.endIndex });
    },
    [],
  );

  const commitRange = useCallback(() => {
    const range = pendingRange.current;
    if (!range) return;
    pendingRange.current = null;

    if (range.startIdx === 0 && range.endIdx === data.length - 1) {
      setTimeRange(null);
    } else {
      // Snap start forward to first data point, end backward to last data point
      const rawStart = data[range.startIdx].time;
      const rawEnd = data[range.endIdx].time;
      const snapStartIdx = findFirstRecordAtOrAfter(records, rawStart);
      const snapEndIdx = findLastRecordAtOrBefore(records, rawEnd);
      if (snapStartIdx > snapEndIdx) return; // no data in range
      setTimeRange({
        startTime: records[snapStartIdx].elapsedTime,
        endTime: records[snapEndIdx].elapsedTime,
      });
    }
  }, [data, records, setTimeRange]);

  // Compute brush indices from external timeRange so the brush syncs
  // when selection is set from chart drag or other sources.
  const brushIndices = useMemo(() => {
    if (!timeRange || data.length === 0) return { startIndex: 0, endIndex: data.length - 1 };
    let startIdx = 0;
    let endIdx = data.length - 1;
    for (let i = 0; i < data.length; i++) {
      if (data[i].time >= timeRange.startTime) { startIdx = i; break; }
    }
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].time <= timeRange.endTime) { endIdx = i; break; }
    }
    return { startIndex: startIdx, endIndex: endIdx };
  }, [data, timeRange]);

  // Key forces Brush to remount when timeRange changes (Brush is uncontrolled)
  const brushKey = timeRange ? `${timeRange.startTime}-${timeRange.endTime}` : 'full';

  // Compute the duration label position and text
  const labelInfo = useMemo(() => {
    if (data.length < 2) return null;
    const indices = visibleIndices ?? brushIndices;
    const { startIndex: si, endIndex: ei } = 'startIndex' in indices ? indices : { startIndex: indices.start, endIndex: indices.end };
    // Don't show label when full range is selected
    if (si === 0 && ei === data.length - 1) return null;
    const startTime = data[si].time;
    const endTime = data[ei].time;
    const duration = endTime - startTime;
    if (duration <= 0) return null;
    const leftFrac = si / (data.length - 1);
    const rightFrac = ei / (data.length - 1);
    const centerPct = ((leftFrac + rightFrac) / 2) * 100;
    return { centerPct, label: formatElapsedTime(duration) };
  }, [data, visibleIndices, brushIndices]);

  if (data.length === 0) return null;

  const handleReset = useCallback(() => {
    setTimeRange(null);
    setVisibleIndices(null);
  }, [setTimeRange]);

  return (
    <div
      className="relative p-4"
      onMouseUp={commitRange}
      onTouchEnd={commitRange}
    >
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        Range selector
        <span className="font-normal text-gray-400">— drag to zoom</span>
      </h3>
      {timeRange && (
        <button
          onClick={handleReset}
          className="absolute top-3.5 right-3 z-20 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          title="Reset range"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
      {/* Data availability bands rendered behind the chart, offset to match YAxis */}
      <div className="pointer-events-none absolute top-10 right-3 bottom-2 left-[57px] overflow-hidden rounded">
        {dataRanges.map(([start, end], i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-blue-100 dark:bg-blue-900/30"
            style={{
              left: `${start * 100}%`,
              width: `${(end - start) * 100}%`,
            }}
          />
        ))}
      </div>
      {/* Duration label centered between brush handles */}
      {labelInfo && (
        <div
          className="pointer-events-none absolute top-10 right-3 bottom-2 left-[57px] z-10"
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${labelInfo.centerPct}%` }}
          >
            <span className="rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
              {labelInfo.label}
            </span>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={50}>
        <AreaChart key={brushKey} data={data} margin={{ left: 45, right: 0, top: 0, bottom: 0 }}>
          <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke="transparent"
            fill="transparent"
            isAnimationActive={false}
            dot={false}
          />
          <Brush
            dataKey="time"
            height={40}
            stroke="#3b82f6"
            fill="transparent"
            tickFormatter={(t: unknown) => formatElapsedTime(Number(t) || 0)}
            onChange={onBrushChange}
            startIndex={brushIndices.startIndex}
            endIndex={brushIndices.endIndex}
            y={5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
