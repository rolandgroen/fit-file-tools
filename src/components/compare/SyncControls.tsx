import { MapPin, MousePointerClick, RotateCcw } from 'lucide-react';
import type { SyncResult } from '../../types/comparison';
import { formatDuration } from '../../lib/formatters';

interface SyncControlsProps {
  syncResult: SyncResult | null;
  syncMode: 'none' | 'pickingA' | 'pickingB';
  hasGps: boolean;
  onAutoSync: () => void;
  onManualSync: () => void;
  onReset: () => void;
}

export function SyncControls({
  syncResult,
  syncMode,
  hasGps,
  onAutoSync,
  onManualSync,
  onReset,
}: SyncControlsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Synchronization
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onAutoSync}
          disabled={!hasGps}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasGps ? 'Auto-align using GPS data' : 'Both files need GPS data'}
        >
          <MapPin className="h-4 w-4" />
          GPS Auto-Sync
        </button>
        <button
          onClick={onManualSync}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            syncMode !== 'none'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <MousePointerClick className="h-4 w-4" />
          {syncMode !== 'none' ? 'Picking sync point...' : 'Manual Sync'}
        </button>
        {syncResult && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>
      {syncResult && (
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Offset: <strong>{syncResult.offsetSeconds > 0 ? '+' : ''}{formatDuration(Math.abs(syncResult.offsetSeconds))}</strong>
          </span>
          <span>Method: <strong>{syncResult.method}</strong></span>
          {syncResult.confidence !== undefined && (
            <span>
              Confidence: <strong>{(syncResult.confidence * 100).toFixed(0)}%</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
