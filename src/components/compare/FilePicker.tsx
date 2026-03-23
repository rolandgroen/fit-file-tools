import { useFileStore } from '../../stores/fileStore';

interface FilePickerProps {
  fileAId: string | null;
  fileBId: string | null;
  onSelectA: (fileAId: string | null) => void;
  onSelectB: (fileBId: string | null) => void;
}

export function FilePicker({ fileAId, fileBId, onSelectA, onSelectB }: FilePickerProps) {
  const files = useFileStore((s) => s.files);
  const fileOrder = useFileStore((s) => s.fileOrder);

  const fileList = fileOrder.map((id) => files[id]).filter(Boolean);

  if (fileList.length < 2) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
        Upload at least two FIT files to compare
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
          File A
        </label>
        <select
          value={fileAId ?? ''}
          onChange={(e) => onSelectA(e.target.value || null)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select file...</option>
          {fileList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fileName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
          File B
        </label>
        <select
          value={fileBId ?? ''}
          onChange={(e) => onSelectB(e.target.value || null)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select file...</option>
          {fileList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fileName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
