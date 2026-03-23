import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { InspectView } from './components/inspect/InspectView';
import { CompareView } from './components/compare/CompareView';
import { DataFieldsView } from './components/datafields/DataFieldsView';
import { FileDropZone } from './components/upload/FileDropZone';
import { useUIStore } from './stores/uiStore';

export default function App() {
  const view = useUIStore((s) => s.view);

  return (
    <div className="flex h-screen flex-col bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {view === 'upload' && <FileDropZone />}
          {view === 'inspect' && <InspectView />}
          {view === 'compare' && <CompareView />}
          {view === 'dataFields' && <DataFieldsView />}
        </main>
      </div>
    </div>
  );
}
