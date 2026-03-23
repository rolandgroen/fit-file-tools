import { useMemo, useEffect, useRef, memo } from 'react';
import { Map, Source, Layer, Marker } from '@vis.gl/react-maplibre';
import type { MapRef } from '@vis.gl/react-maplibre';
import type { FitRecord } from '../../types/fit';
import { useUIStore } from '../../stores/uiStore';
import { buildColoredRoute, buildRouteLine } from '../../lib/colorScales';
import { computeBounds, findNearestRecordByTime } from '../../lib/geoUtils';
import { MetricSelector } from './MetricSelector';

interface MapViewProps {
  records: FitRecord[];
  secondaryRecords?: FitRecord[];
  /** Full route records for background when a selection is active */
  allRecords?: FitRecord[];
  /** Full secondary route records for background when a selection is active */
  allSecondaryRecords?: FitRecord[];
}

export const MapView = memo(function MapView({ records, secondaryRecords, allRecords, allSecondaryRecords }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const mapMetric = useUIStore((s) => s.mapMetric);
  const hoverTime = useUIStore((s) => s.hover.elapsedTime);

  const gpsRecords = useMemo(
    () => records.filter((r) => r.latitude !== null && r.longitude !== null),
    [records],
  );

  const allGpsRecords = useMemo(
    () => allRecords?.filter((r) => r.latitude !== null && r.longitude !== null),
    [allRecords],
  );

  // Background route line (full route, shown faded when selection active)
  const bgRouteLine = useMemo(
    () => allGpsRecords ? buildRouteLine(allGpsRecords) : null,
    [allGpsRecords],
  );

  const routeLine = useMemo(() => buildRouteLine(gpsRecords), [gpsRecords]);

  const geojson = useMemo(
    () => buildColoredRoute(gpsRecords, mapMetric),
    [gpsRecords, mapMetric],
  );

  const allSecondaryGpsRecords = useMemo(
    () => allSecondaryRecords?.filter((r) => r.latitude !== null && r.longitude !== null),
    [allSecondaryRecords],
  );

  const bgSecondaryRouteLine = useMemo(
    () => allSecondaryGpsRecords ? buildRouteLine(allSecondaryGpsRecords) : null,
    [allSecondaryGpsRecords],
  );

  const secondaryRouteLine = useMemo(() => {
    if (!secondaryRecords) return null;
    const gps = secondaryRecords.filter((r) => r.latitude !== null && r.longitude !== null);
    return buildRouteLine(gps);
  }, [secondaryRecords]);

  const secondaryGeojson = useMemo(() => {
    if (!secondaryRecords) return null;
    const gps = secondaryRecords.filter((r) => r.latitude !== null && r.longitude !== null);
    return buildColoredRoute(gps, mapMetric);
  }, [secondaryRecords, mapMetric]);

  // Use allRecords bounds when available so the map doesn't jump on selection change
  const boundsRecords = useMemo(() => {
    const primary = allGpsRecords ?? gpsRecords;
    const secondary = allSecondaryGpsRecords ?? (secondaryRecords?.filter((r) => r.latitude !== null && r.longitude !== null));
    return secondary ? [...primary, ...secondary] : primary;
  }, [allGpsRecords, gpsRecords, allSecondaryGpsRecords, secondaryRecords]);
  const bounds = useMemo(() => computeBounds(boundsRecords), [boundsRecords]);

  const hoverMarker = useMemo(() => {
    if (hoverTime === null || gpsRecords.length === 0) return null;
    const idx = findNearestRecordByTime(gpsRecords, hoverTime);
    const r = gpsRecords[idx];
    if (!r || r.latitude === null || r.longitude === null) return null;
    return { lat: r.latitude, lng: r.longitude };
  }, [hoverTime, gpsRecords]);

  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 0 });
    }
  }, [bounds]);

  if (gpsRecords.length === 0 && !allGpsRecords?.length) return null;

  const centerRecords = allGpsRecords ?? gpsRecords;
  const center = centerRecords[Math.floor(centerRecords.length / 2)];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Route Map
          {allRecords && (
            <span className="ml-2 font-normal text-blue-500">
              (showing selected segment)
            </span>
          )}
        </h3>
        <MetricSelector />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" style={{ height: 400 }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: center.longitude!,
            latitude: center.latitude!,
            zoom: 12,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          {/* Background full route (faded) when selection is active */}
          {bgRouteLine && (
            <Source id="route-bg" type="geojson" data={bgRouteLine}>
              <Layer
                id="route-bg-line"
                type="line"
                paint={{
                  'line-color': '#94a3b8',
                  'line-width': 3,
                  'line-opacity': 0.35,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          )}
          {/* Primary route outline */}
          <Source id="route-outline" type="geojson" data={routeLine}>
            <Layer
              id="route-outline-line"
              type="line"
              paint={{
                'line-color': '#1e293b',
                'line-width': 8,
                'line-opacity': 0.6,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>
          <Source id="route" type="geojson" data={geojson}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 4,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>
          {bgSecondaryRouteLine && (
            <Source id="route-secondary-bg" type="geojson" data={bgSecondaryRouteLine}>
              <Layer
                id="route-secondary-bg-line"
                type="line"
                paint={{
                  'line-color': '#94a3b8',
                  'line-width': 3,
                  'line-opacity': 0.25,
                  'line-dasharray': [2, 2],
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          )}
          {secondaryRouteLine && (
            <Source id="route-secondary-outline" type="geojson" data={secondaryRouteLine}>
              <Layer
                id="route-secondary-outline-line"
                type="line"
                paint={{
                  'line-color': '#1e293b',
                  'line-width': 8,
                  'line-opacity': 0.4,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </Source>
          )}
          {secondaryGeojson && (
            <Source id="route-secondary" type="geojson" data={secondaryGeojson}>
              <Layer
                id="route-secondary-line"
                type="line"
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': 4,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          )}
          {hoverMarker && (
            <Marker
              longitude={hoverMarker.lng}
              latitude={hoverMarker.lat}
            >
              <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
});
