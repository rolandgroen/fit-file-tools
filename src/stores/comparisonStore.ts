import { create } from 'zustand';
import type { SyncPoint, SyncResult, AlignedRecord } from '../types/comparison';
import type { MetricKey } from '../types/fit';

const FILES_STORAGE_KEY = 'fit-tools-compare-files';

function loadSavedFiles(): { fileAId: string | null; fileBId: string | null } {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    if (!raw) return { fileAId: null, fileBId: null };
    const parsed = JSON.parse(raw);
    return { fileAId: parsed.fileAId ?? null, fileBId: parsed.fileBId ?? null };
  } catch { return { fileAId: null, fileBId: null }; }
}

function saveFiles(fileAId: string | null, fileBId: string | null) {
  localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify({ fileAId, fileBId }));
}

interface ComparisonState {
  fileAId: string | null;
  fileBId: string | null;
  syncPoint: SyncPoint | null;
  syncResult: SyncResult | null;
  alignedRecords: AlignedRecord[];
  activeMetric: MetricKey;
  syncMode: 'none' | 'pickingA' | 'pickingB';
}

interface ComparisonActions {
  setFiles: (fileAId: string, fileBId: string) => void;
  setFileA: (fileAId: string | null) => void;
  setFileB: (fileBId: string | null) => void;
  setSyncPoint: (point: SyncPoint) => void;
  setSyncResult: (result: SyncResult) => void;
  setAlignedRecords: (records: AlignedRecord[]) => void;
  setActiveMetric: (metric: MetricKey) => void;
  setSyncMode: (mode: 'none' | 'pickingA' | 'pickingB') => void;
  reset: () => void;
}

const saved = loadSavedFiles();

const initialState: Omit<ComparisonState, never> = {
  fileAId: null,
  fileBId: null,
  syncPoint: null,
  syncResult: null,
  alignedRecords: [],
  activeMetric: 'heartRate',
  syncMode: 'none',
};

export const useComparisonStore = create<ComparisonState & ComparisonActions>()(
  (set) => ({
    ...initialState,
    fileAId: saved.fileAId,
    fileBId: saved.fileBId,
    setFiles: (fileAId, fileBId) => {
      saveFiles(fileAId, fileBId);
      set({ ...initialState, fileAId, fileBId });
    },
    setFileA: (fileAId) => set((s) => {
      saveFiles(fileAId, s.fileBId);
      return { ...initialState, fileAId, fileBId: s.fileBId };
    }),
    setFileB: (fileBId) => set((s) => {
      saveFiles(s.fileAId, fileBId);
      return { ...initialState, fileAId: s.fileAId, fileBId };
    }),
    setSyncPoint: (syncPoint) => set({ syncPoint }),
    setSyncResult: (syncResult) => set({ syncResult }),
    setAlignedRecords: (alignedRecords) => set({ alignedRecords }),
    setActiveMetric: (activeMetric) => set({ activeMetric }),
    setSyncMode: (syncMode) => set({ syncMode }),
    reset: () => {
      saveFiles(null, null);
      set(initialState);
    },
  }),
);
