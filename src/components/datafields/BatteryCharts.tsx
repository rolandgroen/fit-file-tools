import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ExtraMessageValue } from '../../types/fit';
import { formatElapsedTime, formatNumber } from '../../lib/formatters';

interface BatteryChartsProps {
  batteryData: Record<string, ExtraMessageValue>[];
}

interface BatteryPoint {
  time: number;
  batteryLevel: number | undefined;
  voltage: number | undefined;
  temperature: number | undefined;
}

function toNum(val: ExtraMessageValue): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

const charts: { dataKey: keyof BatteryPoint; label: string; unit: string; color: string; domain?: [number, number] }[] = [
  { dataKey: 'batteryLevel', label: 'Battery Level', unit: '%', color: '#22c55e', domain: [0, 100] },
  { dataKey: 'voltage', label: 'Voltage', unit: 'V', color: '#3b82f6' },
  { dataKey: 'temperature', label: 'Temperature', unit: '°C', color: '#f59e0b' },
];

function toSeconds(val: ExtraMessageValue): number | undefined {
  if (val === null || val === undefined) return undefined;
  // ISO date string from toPrimitive
  if (typeof val === 'string') {
    const ms = new Date(val).getTime();
    return isNaN(ms) ? undefined : ms / 1000;
  }
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export function BatteryCharts({ batteryData }: BatteryChartsProps) {
  const normalizedData = useMemo<BatteryPoint[]>(() => {
    const points = batteryData.map((row) => ({
      // Prefer elapsed_time if available, otherwise derive from timestamp
      rawTime: toNum(row.elapsed_time) ?? toSeconds(row.timestamp),
      batteryLevel: toNum(row.battery_level),
      voltage: toNum(row.battery_voltage),
      temperature: toNum(row.temperature),
    }));

    // Find the base time to convert absolute timestamps to elapsed seconds
    const firstTime = points.find((p) => p.rawTime !== undefined)?.rawTime ?? 0;
    // If values look like epoch seconds (> year 2000), rebase to elapsed
    const isAbsolute = firstTime > 946684800; // 2000-01-01 in epoch seconds

    return points
      .map((p) => ({
        time: p.rawTime !== undefined
          ? (isAbsolute ? p.rawTime - firstTime : p.rawTime)
          : 0,
        batteryLevel: p.batteryLevel,
        voltage: p.voltage,
        temperature: p.temperature,
      }))
      .sort((a, b) => a.time - b.time);
  }, [batteryData]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Garmin device data
      </h3>
      {charts.map((chart) => {
        const hasData = normalizedData.some((d) => d[chart.dataKey] !== undefined);
        if (!hasData) return null;
        return (
          <div
            key={chart.dataKey}
            className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chart.color }} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {chart.label} ({chart.unit})
              </span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={normalizedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v: unknown) => formatElapsedTime(Number(v) || 0)}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  width={45}
                  domain={chart.domain ?? ['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: unknown) => [formatNumber(Number(value), 2), chart.label]}
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
                  dataKey={chart.dataKey}
                  stroke={chart.color}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
