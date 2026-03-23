import { useMemo } from 'react';
import type { ExtraMessageValue } from '../../types/fit';

interface EventsTableProps {
  events: Record<string, ExtraMessageValue>[];
}

function snakeToLabel(snake: string): string {
  return snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatCell(value: ExtraMessageValue): string {
  if (value === null || value === undefined) return '\u2014';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function EventsTable({ events }: EventsTableProps) {
  const columns = useMemo(() => {
    const colSet = new Set<string>();
    for (const row of events) {
      for (const key of Object.keys(row)) {
        colSet.add(key);
      }
    }
    const cols = [...colSet].sort();
    // Put timestamp and event first
    for (const first of ['event', 'timestamp']) {
      const idx = cols.indexOf(first);
      if (idx > 0) {
        cols.splice(idx, 1);
        cols.unshift(first);
      }
    }
    return cols;
  }, [events]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Events <span className="font-normal text-gray-400">({events.length} rows)</span>
      </h3>
      <div className="max-h-96 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-2 font-semibold text-gray-500 dark:text-gray-400"
                >
                  {snakeToLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {events.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-1.5 tabular-nums text-gray-400">{i + 1}</td>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="whitespace-nowrap px-3 py-1.5 tabular-nums text-gray-700 dark:text-gray-300"
                  >
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
