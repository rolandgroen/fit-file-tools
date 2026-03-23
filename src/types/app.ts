import type { MetricKey } from './fit';

export type AppView = 'upload' | 'inspect' | 'compare' | 'dataFields';

export interface HoverState {
  elapsedTime: number | null;
  source: 'chart' | 'map' | 'table' | null;
}

export interface UIState {
  view: AppView;
  activeFileId: string | null;
  hover: HoverState;
  sidebarOpen: boolean;
  mapMetric: MetricKey;
}
