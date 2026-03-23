import { useMemo } from 'react';
import { Cpu } from 'lucide-react';
import type { ExtraMessageValue } from '../../types/fit';

interface SensorDevicesProps {
  deviceInfos: Record<string, ExtraMessageValue>[];
}

function strVal(val: ExtraMessageValue): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function snakeToLabel(snake: string): string {
  return snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface DeviceEntry {
  deviceIndex: string;
  deviceType: string;
  manufacturer: string;
  product: string;
  batteryStatus: string;
  batteryLevel: string;
  serialNumber: string;
  softwareVersion: string;
}

export function SensorDevices({ deviceInfos }: SensorDevicesProps) {
  const devices = useMemo<DeviceEntry[]>(() => {
    // Deduplicate by device_index, keeping the latest entry (last in array)
    const byIndex = new Map<string, Record<string, ExtraMessageValue>>();
    for (const row of deviceInfos) {
      const idx = strVal(row.device_index) || strVal(row.device_idx) || '';
      if (idx) byIndex.set(idx, row);
    }

    return Array.from(byIndex.values())
      .filter((row) => row.device_type && strVal(row.device_type) !== '' && strVal(row.device_type) !== 'unknown')
      .map((row) => ({
        deviceIndex: strVal(row.device_index ?? row.device_idx),
        deviceType: snakeToLabel(strVal(row.device_type)),
        manufacturer: snakeToLabel(strVal(row.manufacturer)),
        product: strVal(row.product_name ?? row.product ?? row.garmin_product),
        batteryStatus: strVal(row.battery_status),
        batteryLevel: row.battery_level != null ? `${row.battery_level}%` : '',
        serialNumber: strVal(row.serial_number),
        softwareVersion: strVal(row.software_version),
      }));
  }, [deviceInfos]);

  if (devices.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Sensor Devices
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <div
            key={device.deviceIndex}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {device.deviceType}
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {device.manufacturer} {device.product}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
              {device.serialNumber && <span>SN: {device.serialNumber}</span>}
              {device.softwareVersion && <span>v{device.softwareVersion}</span>}
              {device.batteryStatus && <span>{device.batteryStatus}</span>}
              {device.batteryLevel && <span>{device.batteryLevel}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
