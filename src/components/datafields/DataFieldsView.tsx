import { useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { DeviceInfo } from '../inspect/DeviceInfo';
import { BatteryCharts } from './BatteryCharts';
import { SensorDevices } from './SensorDevices';
import { EventsTable } from './EventsTable';
import { ExtraDataTable } from './ExtraDataTable';

function snakeToLabel(snake: string): string {
  return snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Message types that have dedicated panel components. */
const DEDICATED_TYPES = new Set(['device_battery_status', 'device_infos', 'events']);

export function DataFieldsView() {
  const activeFileId = useUIStore((s) => s.activeFileId);
  const file = useFileStore((s) => (activeFileId ? s.files[activeFileId] : undefined));

  const extra = useMemo(() => file?.extraMessages ?? {}, [file?.extraMessages]);

  const remainingTypes = useMemo(() => {
    return Object.keys(extra)
      .filter((k) => !DEDICATED_TYPES.has(k) && extra[k].length > 0)
      .sort();
  }, [extra]);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Select a file to explore its data fields.
      </div>
    );
  }

  const hasDevices = file.devices.length > 0;

  const batteryData = extra['device_battery_status'];
  const deviceInfos = extra['device_infos'];
  const events = extra['events'];

  const hasAnyContent = hasDevices || batteryData || deviceInfos || events || remainingTypes.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        No extra data found in this file.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <DeviceInfo devices={file.devices} />
      {batteryData && <BatteryCharts batteryData={batteryData} />}
      {deviceInfos && <SensorDevices deviceInfos={deviceInfos} />}
      {events && <EventsTable events={events} />}
      {remainingTypes.map((msgType) => (
        <ExtraDataTable
          key={msgType}
          messageType={msgType}
          label={snakeToLabel(msgType)}
          data={extra[msgType]}
        />
      ))}
    </div>
  );
}
