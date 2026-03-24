import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { ParsedFitFile } from '../types/fit';
import type { StateStorage } from 'zustand/middleware';

/** Revive ISO-8601 date strings back to Date objects when reading from IndexedDB. */
export function reviveDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
    return new Date(obj) as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(reviveDates) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = reviveDates(value);
    }
    return result as T;
  }
  return obj;
}

/** IndexedDB-backed storage adapter for zustand persist. */
const idbStorage: StateStorage = {
  getItem: async (name: string) => {
    const value = await idbGet(name);
    if (value === undefined) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

interface FileState {
  files: Record<string, ParsedFitFile>;
  fileOrder: string[];
}

interface FileActions {
  addFile: (file: ParsedFitFile) => void;
  removeFile: (id: string) => void;
  getFile: (id: string) => ParsedFitFile | undefined;
  clearAll: () => void;
}

export const useFileStore = create<FileState & FileActions>()(
  persist(
    (set, get) => ({
      files: {},
      fileOrder: [],
      addFile: (file) =>
        set((state) => ({
          files: { ...state.files, [file.id]: file },
          fileOrder: [...state.fileOrder, file.id],
        })),
      removeFile: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.files;
          return {
            files: rest,
            fileOrder: state.fileOrder.filter((fid) => fid !== id),
          };
        }),
      getFile: (id) => get().files[id],
      clearAll: () => set({ files: {}, fileOrder: [] }),
    }),
    {
      name: 'fit-file-tools-files',
      storage: {
        getItem: async (name) => {
          const raw = await idbStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return reviveDates(parsed);
        },
        setItem: async (name, value) => {
          await idbStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await idbStorage.removeItem(name);
        },
      },
    },
  ),
);

/** Migrate data from localStorage to IndexedDB (one-time). */
async function migrateFromLocalStorage() {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return;
  const LS_KEY = 'fit-file-tools-files';
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;

  // Check if IndexedDB already has data
  const existing = await idbGet(LS_KEY);
  if (existing) {
    // IndexedDB already populated, just remove localStorage
    localStorage.removeItem(LS_KEY);
    return;
  }

  // Move the data over
  await idbSet(LS_KEY, raw);
  localStorage.removeItem(LS_KEY);
}

migrateFromLocalStorage();
