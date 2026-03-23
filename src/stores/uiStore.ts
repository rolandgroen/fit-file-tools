import { create } from 'zustand';
import type { AppView, HoverState } from '../types/app';
import type { MetricKey } from '../types/fit';
import { useComparisonStore } from './comparisonStore';

export interface TimeRange {
  startTime: number;
  endTime: number;
}

interface UIState {
  view: AppView;
  activeFileId: string | null;
  hover: HoverState;
  sidebarOpen: boolean;
  mapMetric: MetricKey;
  timeRange: TimeRange | null;
  isRangeUpdating: boolean;
}

interface UIActions {
  setView: (view: AppView) => void;
  setActiveFile: (id: string | null) => void;
  setActiveFileForView: (id: string, view: AppView) => void;
  setHover: (hover: HoverState) => void;
  clearHover: () => void;
  toggleSidebar: () => void;
  setMapMetric: (metric: MetricKey) => void;
  setTimeRange: (range: TimeRange | null) => void;
}

let _rangeTimer: ReturnType<typeof setTimeout> | null = null;

const RANGE_STORAGE_KEY = 'fit-tools-ranges';

function loadSavedRanges(): Record<string, TimeRange> {
  try {
    const raw = localStorage.getItem(RANGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRange(fileId: string, range: TimeRange | null) {
  const ranges = loadSavedRanges();
  if (range) {
    ranges[fileId] = range;
  } else {
    delete ranges[fileId];
  }
  localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(ranges));
}

function loadRange(key: string): TimeRange | null {
  return loadSavedRanges()[key] ?? null;
}

function getRangeKey(view: AppView, activeFileId: string | null): string | null {
  if (view === 'inspect') return activeFileId;
  if (view === 'compare') {
    const { fileAId, fileBId } = useComparisonStore.getState();
    if (fileAId && fileBId) return `compare:${fileAId}:${fileBId}`;
  }
  return null;
}

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  view: 'upload',
  activeFileId: null,
  hover: { elapsedTime: null, source: null },
  sidebarOpen: true,
  mapMetric: 'heartRate',
  timeRange: null,
  isRangeUpdating: false,

  setView: (view) => {
    const { activeFileId } = get();
    const key = getRangeKey(view, activeFileId);
    const savedRange = key ? loadRange(key) : null;
    set({ view, timeRange: savedRange, isRangeUpdating: false });
  },
  setActiveFile: (id) => {
    const savedRange = id ? loadRange(id) : null;
    set({ activeFileId: id, view: id ? 'inspect' : 'upload', timeRange: savedRange, isRangeUpdating: false });
  },
  setActiveFileForView: (id, view) => {
    const savedRange = loadRange(id);
    set({ activeFileId: id, view, timeRange: savedRange, isRangeUpdating: false });
  },
  setHover: (hover) => set({ hover }),
  clearHover: () => set({ hover: { elapsedTime: null, source: null } }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMapMetric: (metric) => set({ mapMetric: metric }),
  setTimeRange: (range) => {
    // Persist with context-aware key (file id for inspect, composite for compare)
    const { view, activeFileId } = get();
    const key = getRangeKey(view, activeFileId);
    if (key) saveRange(key, range);
    // Show loading indicator immediately, defer heavy update so the browser can paint
    if (_rangeTimer) clearTimeout(_rangeTimer);
    set({ isRangeUpdating: true });
    _rangeTimer = setTimeout(() => {
      _rangeTimer = null;
      set({ timeRange: range, isRangeUpdating: false });
    }, 20);
  },
}));
