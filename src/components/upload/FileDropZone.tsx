import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { parseFitFile } from '../../lib/fitParser';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';

export function FileDropZone({ compact = false }: { compact?: boolean }) {
  const addFile = useFileStore((s) => s.addFile);
  const setActiveFile = useUIStore((s) => s.setActiveFile);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      setParsing(true);
      try {
        for (const file of Array.from(files)) {
          if (!file.name.toLowerCase().endsWith('.fit')) {
            setError(`${file.name} is not a .fit file`);
            continue;
          }
          const parsed = await parseFitFile(file);
          addFile(parsed);
          setActiveFile(parsed.id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file');
      } finally {
        setParsing(false);
      }
    },
    [addFile, setActiveFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles],
  );

  if (compact) {
    return (
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">
          {parsing ? 'Parsing...' : 'Drop .fit file or click'}
        </span>
        <input
          type="file"
          accept=".fit"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
      </label>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <label
        className={`flex w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {parsing ? 'Parsing FIT file...' : 'Drop FIT files here'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            or click to browse
          </p>
        </div>
        <input
          type="file"
          accept=".fit"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
      </label>
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
