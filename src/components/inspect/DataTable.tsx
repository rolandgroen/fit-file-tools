import { useRef, useState, useEffect, useMemo } from 'react';
import type { FitRecord } from '../../types/fit';
import { formatElapsedTime, formatNumber } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';
import { findNearestRecordByTime } from '../../lib/geoUtils';

const ROW_HEIGHT = 32;
const VISIBLE_ROWS = 15;

const COLUMNS = [
  { key: 'elapsedTime', label: 'Time', format: (r: FitRecord) => formatElapsedTime(r.elapsedTime) },
  { key: 'heartRate', label: 'HR', format: (r: FitRecord) => formatNumber(r.heartRate) },
  { key: 'power', label: 'Power', format: (r: FitRecord) => formatNumber(r.power) },
  { key: 'cadence', label: 'Cadence', format: (r: FitRecord) => formatNumber(r.cadence) },
  { key: 'speed', label: 'Speed', format: (r: FitRecord) => formatNumber(r.speed, 1) },
  { key: 'altitude', label: 'Alt', format: (r: FitRecord) => formatNumber(r.altitude, 1) },
  { key: 'latitude', label: 'Lat', format: (r: FitRecord) => formatNumber(r.latitude, 5) },
  { key: 'longitude', label: 'Lng', format: (r: FitRecord) => formatNumber(r.longitude, 5) },
] as const;

export function DataTable({ records }: { records: FitRecord[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const hoverTime = useUIStore((s) => s.hover.elapsedTime);
  const setHover = useUIStore((s) => s.setHover);

  const highlightedIdx = useMemo(() => {
    if (hoverTime === null || records.length === 0) return -1;
    return findNearestRecordByTime(records, hoverTime);
  }, [hoverTime, records]);

  // Auto-scroll to highlighted row
  useEffect(() => {
    if (highlightedIdx >= 0 && containerRef.current) {
      const scrollTarget = highlightedIdx * ROW_HEIGHT - (VISIBLE_ROWS / 2) * ROW_HEIGHT;
      const current = containerRef.current.scrollTop;
      const diff = Math.abs(scrollTarget - current);
      if (diff > VISIBLE_ROWS * ROW_HEIGHT) {
        containerRef.current.scrollTop = scrollTarget;
      }
    }
  }, [highlightedIdx]);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
  const endIdx = Math.min(records.length, startIdx + VISIBLE_ROWS + 10);
  const visibleRecords = records.slice(startIdx, endIdx);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Data Table ({records.length.toLocaleString()} records)
      </h3>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 z-10 flex bg-gray-50 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex-1 px-2 py-2 text-right first:text-left">
              {col.label}
            </div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="overflow-y-auto bg-white dark:bg-gray-900"
          style={{ height: VISIBLE_ROWS * ROW_HEIGHT }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div style={{ height: records.length * ROW_HEIGHT, position: 'relative' }}>
            {visibleRecords.map((record, i) => {
              const actualIdx = startIdx + i;
              const isHighlighted = actualIdx === highlightedIdx;
              return (
                <div
                  key={actualIdx}
                  className={`flex text-xs ${
                    isHighlighted
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'
                      : actualIdx % 2 === 0
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                  }`}
                  style={{
                    position: 'absolute',
                    top: actualIdx * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    width: '100%',
                  }}
                  onMouseEnter={() =>
                    setHover({ elapsedTime: record.elapsedTime, source: 'table' })
                  }
                >
                  {COLUMNS.map((col) => (
                    <div
                      key={col.key}
                      className="flex flex-1 items-center px-2 text-right tabular-nums first:text-left"
                    >
                      {col.format(record)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
