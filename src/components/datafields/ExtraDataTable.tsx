import { useMemo } from 'react';
import type { ExtraMessageValue } from '../../types/fit';

interface ExtraDataTableProps {
  messageType: string;
  label: string;
  data: Record<string, ExtraMessageValue>[];
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

export function ExtraDataTable({ messageType, label, data }: ExtraDataTableProps) {
  const columns = useMemo(() => {
    const colSet = new Set<string>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        colSet.add(key);
      }
    }
    const cols = [...colSet].sort();
    for (const first of ['elapsed_time', 'timestamp']) {
      const idx = cols.indexOf(first);
      if (idx > 0) {
        cols.splice(idx, 1);
        cols.unshift(first);
      }
    }
    return cols;
  }, [data]);

  return (
    <details className="group rounded-lg border border-gray-200 dark:border-gray-700">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <span className="transition-transform group-open:rotate-90">&#9654;</span>
        {label}
        <span className="font-normal text-gray-400">({data.length} rows)</span>
      </summary>
      <div className="max-h-96 overflow-auto border-t border-gray-200 dark:border-gray-700" data-type={messageType}>
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
            {data.map((row, i) => (
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
    </details>
  );
}
