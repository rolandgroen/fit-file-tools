import { Activity } from 'lucide-react';
import type { ActivityMetrics, ZonesTarget } from '../../types/fit';
import { formatNumber } from '../../lib/formatters';
import { StatCard } from './ActivitySummary';

function formatRecoveryTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface ActivityMetricsPanelProps {
  activityMetrics?: ActivityMetrics | null;
  zonesTarget?: ZonesTarget | null;
}

export function ActivityMetricsPanel({ activityMetrics, zonesTarget }: ActivityMetricsPanelProps) {
  const am = activityMetrics;
  const hasMetrics = am && Object.values(am).some((v) => v != null);
  const hasZones = zonesTarget && (
    zonesTarget.functionalThresholdPower != null ||
    zonesTarget.thresholdHeartRate != null
  );

  if (!hasMetrics && !hasZones) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <Activity className="h-4 w-4" />
        Activity Metrics
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {am?.sport != null && (
          <StatCard label="Sport" value={am.sport} />
        )}
        {am?.firstVo2Max != null && (
          <StatCard label="First VO2 Max" value={formatNumber(am.firstVo2Max, 1)} />
        )}
        {am?.vo2Max != null && (
          <StatCard label="VO2 Max" value={formatNumber(am.vo2Max, 1)} />
        )}
        {am?.newMaxHeartRate != null && (
          <StatCard label="New Max HR" value={formatNumber(am.newMaxHeartRate)} unit="bpm" />
        )}
        {am?.avgHeartRate != null && (
          <StatCard label="Avg HR" value={formatNumber(am.avgHeartRate)} unit="bpm" />
        )}
        {am?.avgPower != null && (
          <StatCard label="Avg Power" value={formatNumber(am.avgPower)} unit="W" />
        )}
        {am?.recoveryTime != null && (
          <StatCard label="Recovery Time" value={formatRecoveryTime(am.recoveryTime)} />
        )}
        {am?.aerobicTrainingEffect != null && (
          <StatCard label="Aerobic TE" value={formatNumber(am.aerobicTrainingEffect, 1)} />
        )}
        {am?.anaerobicTrainingEffect != null && (
          <StatCard label="Anaerobic TE" value={formatNumber(am.anaerobicTrainingEffect, 1)} />
        )}
        {am?.primaryBenefit != null && (
          <StatCard label="Primary Benefit" value={am.primaryBenefit} />
        )}
        {am?.totalAscent != null && (
          <StatCard label="Ascent" value={formatNumber(am.totalAscent)} unit="m" />
        )}
        {am?.totalDescent != null && (
          <StatCard label="Descent" value={formatNumber(am.totalDescent)} unit="m" />
        )}
        {zonesTarget?.functionalThresholdPower != null && (
          <StatCard label="FTP" value={formatNumber(zonesTarget.functionalThresholdPower)} unit="W" />
        )}
        {zonesTarget?.thresholdHeartRate != null && (
          <StatCard label="LTHR" value={formatNumber(zonesTarget.thresholdHeartRate)} unit="bpm" />
        )}
      </div>
    </div>
  );
}
