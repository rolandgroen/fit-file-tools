import { BarChart3, FileUp, GitCompareArrows, Menu } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { AppView } from '../../types/app';

const NAV_ITEMS: { view: AppView; label: string; icon: typeof FileUp }[] = [
  { view: 'upload', label: 'Files', icon: FileUp },
  { view: 'inspect', label: 'Inspect', icon: FileUp },
  { view: 'compare', label: 'Compare', icon: GitCompareArrows },
  { view: 'dataFields', label: 'Extra data', icon: BarChart3 },
];

export function Header() {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          FIT File Tools
        </h1>
      </div>
      <nav className="flex gap-1">
        {NAV_ITEMS.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
