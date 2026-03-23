import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { FileCard } from '../upload/FileCard';
import { FileDropZone } from '../upload/FileDropZone';

export function Sidebar() {
  const files = useFileStore((s) => s.files);
  const fileOrder = useFileStore((s) => s.fileOrder);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${
        sidebarOpen ? '' : 'hidden lg:flex'
      }`}
    >
      <div className="p-3">
        <FileDropZone compact />
      </div>
      <div className="flex-1 overflow-y-auto p-3 pt-0">
        {fileOrder.length === 0 ? (
          <p className="mt-4 text-center text-sm text-gray-400">
            No files loaded yet
          </p>
        ) : (
          <div className="space-y-2">
            {fileOrder.map((id) => {
              const file = files[id];
              return file ? <FileCard key={id} file={file} /> : null;
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
