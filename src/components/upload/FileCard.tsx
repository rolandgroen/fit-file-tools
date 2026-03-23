import { Trash2, Eye, BarChart3 } from 'lucide-react';
import type { ParsedFitFile } from '../../types/fit';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useComparisonStore } from '../../stores/comparisonStore';
import { formatDate, formatDistance, formatDuration, formatFileSize } from '../../lib/formatters';

export function FileCard({ file }: { file: ParsedFitFile }) {
  const removeFile = useFileStore((s) => s.removeFile);
  const activeFileId = useUIStore((s) => s.activeFileId);
  const view = useUIStore((s) => s.view);
  const setActiveFile = useUIStore((s) => s.setActiveFile);
  const setActiveFileForView = useUIStore((s) => s.setActiveFileForView);
  const fileAId = useComparisonStore((s) => s.fileAId);
  const fileBId = useComparisonStore((s) => s.fileBId);

  const isActive = view !== 'compare' && activeFileId === file.id;
  const isFileA = view === 'compare' && fileAId === file.id;
  const isFileB = view === 'compare' && fileBId === file.id;

  let borderClass: string;
  if (isActive) {
    borderClass = 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20';
  } else if (isFileA) {
    borderClass = 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10';
  } else if (isFileB) {
    borderClass = 'border-purple-400 bg-purple-50/50 dark:border-purple-500 dark:bg-purple-900/10';
  } else {
    borderClass = 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800';
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${borderClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
            {isFileA && (
              <span className="flex-shrink-0 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">A</span>
            )}
            {isFileB && (
              <span className="flex-shrink-0 rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">B</span>
            )}
            <span className="truncate">{file.fileName}</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {file.session.sport} &middot; {formatDate(file.session.startTime)}
          </p>
          <p className="text-xs text-gray-400">
            {formatDistance(file.session.totalDistance)} &middot;{' '}
            {formatDuration(file.session.totalElapsedTime)} &middot;{' '}
            {formatFileSize(file.fileSize)}
          </p>
        </div>
        <div className="ml-2 flex gap-1">
          <button
            onClick={() => setActiveFile(file.id)}
            className={`rounded p-1 ${
              isActive && view === 'inspect'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-400 hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700'
            }`}
            title="Inspect"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveFileForView(file.id, 'dataFields')}
            className={`rounded p-1 ${
              isActive && view === 'dataFields'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-500 dark:hover:bg-gray-700'
            }`}
            title="Extra data"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => removeFile(file.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        {file.hasHeartRate && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
            HR
          </span>
        )}
        {file.hasPower && (
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Power
          </span>
        )}
        {file.hasGps && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
            GPS
          </span>
        )}
      </div>
    </div>
  );
}
