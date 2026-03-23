import { useMemo, useCallback, useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useComparisonStore } from '../../stores/comparisonStore';
import { useUIStore } from '../../stores/uiStore';
import { FilePicker } from './FilePicker';
import { SyncControls } from './SyncControls';
import { ComparisonSummary } from './ComparisonSummary';
import { ChartStack } from '../inspect/ChartStack';
import { MapView } from '../inspect/MapView';
import { gpsAutoSync, manualSync, alignRecords } from '../../lib/syncAlgorithm';
import { Loader2 } from 'lucide-react';

export function CompareView() {
  const files = useFileStore((s) => s.files);
  const timeRange = useUIStore((s) => s.timeRange);
  const {
    fileAId,
    fileBId,
    syncPoint,
    syncResult,
    syncMode,
    setFileA,
    setFileB,
    setSyncPoint,
    setSyncResult,
    setAlignedRecords,
    setSyncMode,
    reset,
  } = useComparisonStore();

  const fileA = fileAId ? files[fileAId] : null;
  const fileB = fileBId ? files[fileBId] : null;

  const handleSelectA = useCallback(
    (id: string | null) => setFileA(id),
    [setFileA],
  );

  const handleSelectB = useCallback(
    (id: string | null) => setFileB(id),
    [setFileB],
  );

  const handleAutoSync = useCallback(() => {
    if (!fileA || !fileB) return;
    try {
      const result = gpsAutoSync(fileA.records, fileB.records);
      setSyncResult(result);
      const aligned = alignRecords(fileA.records, fileB.records, result.offsetSeconds);
      setAlignedRecords(aligned);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'GPS sync failed');
    }
  }, [fileA, fileB, setSyncResult, setAlignedRecords]);

  const handleManualSync = useCallback(() => {
    setSyncMode('pickingA');
  }, [setSyncMode]);

  const handleTimeClick = useCallback(
    (elapsedTime: number) => {
      if (syncMode === 'pickingA') {
        setSyncPoint({ fileATime: elapsedTime, fileBTime: syncPoint?.fileBTime ?? 0 });
        setSyncMode('pickingB');
      } else if (syncMode === 'pickingB') {
        const point = { fileATime: syncPoint?.fileATime ?? 0, fileBTime: elapsedTime };
        setSyncPoint(point);
        setSyncMode('none');
        const result = manualSync(point);
        setSyncResult(result);
        if (fileA && fileB) {
          const aligned = alignRecords(fileA.records, fileB.records, result.offsetSeconds);
          setAlignedRecords(aligned);
        }
      }
    },
    [syncMode, syncPoint, fileA, fileB, setSyncPoint, setSyncMode, setSyncResult, setAlignedRecords],
  );

  const offsetRecordsB = useMemo(() => {
    if (!fileB || !syncResult) return fileB?.records;
    return fileB.records.map((r) => ({
      ...r,
      elapsedTime: r.elapsedTime + syncResult.offsetSeconds,
    }));
  }, [fileB, syncResult]);

  // Filter records by time range for summary stats
  const filteredRecordsA = useMemo(() => {
    if (!fileA || !timeRange) return undefined;
    return fileA.records.filter(
      (r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime,
    );
  }, [fileA, timeRange]);

  const filteredRecordsB = useMemo(() => {
    if (!offsetRecordsB || !timeRange) return undefined;
    return offsetRecordsB.filter(
      (r) => r.elapsedTime >= timeRange.startTime && r.elapsedTime <= timeRange.endTime,
    );
  }, [offsetRecordsB, timeRange]);

  // Defer heavy chart/map rendering so a loading spinner can paint first
  const pairKey = fileA && fileB ? `${fileA.id}-${fileB.id}` : null;
  const [readyPairKey, setReadyPairKey] = useState<string | null>(null);
  useEffect(() => {
    if (pairKey && readyPairKey !== pairKey) {
      const id = setTimeout(() => setReadyPairKey(pairKey), 20);
      return () => clearTimeout(id);
    }
  }, [pairKey, readyPairKey]);
  const isInitialLoading = !!pairKey && readyPairKey !== pairKey;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Compare Files
      </h2>

      <FilePicker
        fileAId={fileAId}
        fileBId={fileBId}
        onSelectA={handleSelectA}
        onSelectB={handleSelectB}
      />

      {fileA && fileB && (
        <>
          <SyncControls
            syncResult={syncResult}
            syncMode={syncMode}
            hasGps={fileA.hasGps && fileB.hasGps}
            onAutoSync={handleAutoSync}
            onManualSync={handleManualSync}
            onReset={reset}
          />

          <ComparisonSummary
            fileA={fileA}
            fileB={fileB}
            filteredRecordsA={filteredRecordsA}
            filteredRecordsB={filteredRecordsB}
          />

          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">Loading charts and map...</span>
            </div>
          ) : (
            <>
              <div>
                {syncMode !== 'none' && (
                  <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    {syncMode === 'pickingA'
                      ? 'Click a point on the chart to set the sync marker for File A'
                      : 'Now click a point on the chart to set the sync marker for File B'}
                  </div>
                )}
                <ChartStack
                  records={fileA.records}
                  syncId="compare-charts"
                  onTimeClick={syncMode !== 'none' ? handleTimeClick : undefined}
                  comparisonRecords={offsetRecordsB}
                  primaryLabel={fileA.fileName}
                  comparisonLabel={fileB.fileName}
                  enableBrush={syncMode === 'none'}
                />
              </div>

              {(fileA.hasGps || fileB.hasGps) && (
                <MapView
                  records={filteredRecordsA ?? fileA.records}
                  allRecords={filteredRecordsA ? fileA.records : undefined}
                  secondaryRecords={filteredRecordsB ?? fileB.records}
                  allSecondaryRecords={filteredRecordsB ? fileB.records : undefined}
                />
              )}
            </>
          )}
        </>
      )}

      {!fileA && !fileB && (
        <div className="flex h-64 items-center justify-center text-gray-400">
          Select two files above to compare
        </div>
      )}
    </div>
  );
}
