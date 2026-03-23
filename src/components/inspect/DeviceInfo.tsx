import { Cpu } from 'lucide-react';
import type { FitDevice } from '../../types/fit';

export function DeviceInfo({ devices }: { devices: FitDevice[] }) {
  if (devices.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <Cpu className="h-4 w-4" />
        Devices
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device, i) => (
          <div
            key={i}
            className="rounded border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {device.manufacturer} {device.product}
            </p>
            <div className="mt-0.5 text-xs text-gray-500">
              {device.serialNumber && <span>SN: {device.serialNumber}</span>}
              {device.softwareVersion && <span> &middot; v{device.softwareVersion}</span>}
              {device.batteryStatus && <span> &middot; {device.batteryStatus}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
