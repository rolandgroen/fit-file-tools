import { METRICS } from '../../lib/constants';
import { useUIStore } from '../../stores/uiStore';

export function MetricSelector() {
  const mapMetric = useUIStore((s) => s.mapMetric);
  const setMapMetric = useUIStore((s) => s.setMapMetric);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Color by:</span>
      <div className="flex gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMapMetric(m.key)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              mapMetric === m.key
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            }`}
            style={mapMetric === m.key ? { backgroundColor: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
