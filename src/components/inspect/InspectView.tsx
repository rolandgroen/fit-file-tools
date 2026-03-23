import { useMemo, useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { ActivitySummary } from './ActivitySummary';
import { ActivityMetricsPanel } from './ActivityMetricsPanel';
import { ChartStack } from './ChartStack';
import { MapView } from './MapView';
import { DataTable } from './DataTable';
import { Loader2 } from 'lucide-react';

export function InspectView() {
  const activeFileId = useUIStore((s) => s.activeFileId);
  const timeRange = useUIStore((s) => s.timeRange);
  const isRangeUpdating = useUIStore((s) => s.isRangeUpdating);
  const files = useFileStore((s) => s.files);

  const [showTable, setShowTable] = useState(false);
  const file = activeFileId ? files[activeFileId] : null;

  // Defer heavy chart/map rendering so a loading spinner can paint first
  const [readyFileId, setReadyFileId] = useState<string | null>(null);
  useEffect(() => {
    if (file && readyFileId !== file.id) {
      const id = setTimeout(() => setReadyFileId(file.id), 20);
      return () => clearTimeout(id);
    }
  }, [file, readyFileId]);
  const isInitialLoading = !!file && readyFileId !== file.id;

  const mapRecords = useMemo(() => {
    if (!file) return [];
    if (!timeRange) return file.records;
    return file.records.filter(
      (r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime,
    );
  }, [file, timeRange]);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Select a file from the sidebar to inspect
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {file.fileName}
        </h2>
        <p className="text-sm text-gray-500">
          {file.session.sport} &middot; {file.records.length.toLocaleString()} records
        </p>
        {file.fileId && (
          <p className="text-xs text-gray-400">
            {file.fileId.manufacturer} {file.fileId.product}
            {file.fileId.serialNumber != null && <> &middot; SN: {file.fileId.serialNumber}</>}
            {file.fileId.type !== 'unknown' && <> &middot; {file.fileId.type}</>}
          </p>
        )}
      </div>

      <ActivitySummary session={file.session} />
      <ActivityMetricsPanel activityMetrics={file.activityMetrics} zonesTarget={file.zonesTarget} />
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Loading charts and map...</span>
        </div>
      ) : (
        <div className="relative">
          {isRangeUpdating && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-white/50 pt-24 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg dark:bg-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Updating selection...</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-6">
            <ChartStack records={file.records} enableBrush />
            {file.hasGps && (
              <MapView
                records={timeRange ? mapRecords : file.records}
                allRecords={timeRange ? file.records : undefined}
              />
            )}
          </div>
        </div>
      )}
      <div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {showTable ? 'Hide data table' : 'Show data table'}
        </button>
        {showTable && <DataTable records={file.records} />}
      </div>
    </div>
  );
}
