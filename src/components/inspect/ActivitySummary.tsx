import { ClipboardList } from 'lucide-react';
import type { FitSession } from '../../types/fit';
import { formatDuration, formatDistance, formatNumber } from '../../lib/formatters';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, unit, highlight }: StatCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${
      highlight
        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    }`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}

export function ActivitySummary({ session }: { session: FitSession }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <ClipboardList className="h-4 w-4" />
        Session Summary
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <StatCard label="Duration" value={formatDuration(session.totalElapsedTime)} />
      <StatCard label="Distance" value={formatDistance(session.totalDistance)} />
      {session.avgHeartRate !== null && (
        <StatCard label="Avg HR" value={formatNumber(session.avgHeartRate)} unit="bpm" />
      )}
      {session.maxHeartRate !== null && (
        <StatCard label="Max HR" value={formatNumber(session.maxHeartRate)} unit="bpm" />
      )}
      {session.avgPower !== null && (
        <StatCard label="Avg Power" value={formatNumber(session.avgPower)} unit="W" />
      )}
      {session.maxPower !== null && (
        <StatCard label="Max Power" value={formatNumber(session.maxPower)} unit="W" />
      )}
      {session.normalizedPower !== null && (
        <StatCard label="NP" value={formatNumber(session.normalizedPower)} unit="W" />
      )}
      {session.avgCadence !== null && (
        <StatCard label="Avg Cadence" value={formatNumber(session.avgCadence)} unit="rpm" />
      )}
      {session.avgSpeed !== null && (
        <StatCard label="Avg Speed" value={formatNumber(session.avgSpeed, 1)} unit="km/h" />
      )}
      </div>
    </div>
  );
}
