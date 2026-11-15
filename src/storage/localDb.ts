import type { AppSettings, AppState, LabelEntry } from "../types/label";

export const STORAGE_KEY = "vitrin_etiket_sistemi_v7";
export const DRAFT_STORAGE_KEY = "vitrin_etiket_taslak_v1";
export const IDB_NAME = "kongoru_etiket_db";
export const IDB_STORE = "kv";
export const IDB_VERSION = 1;

export function createDefaultLabels(): LabelEntry[] {
  return [];
}

export function createDefaultSettings(): AppSettings {
  return {
    gap: "2mm",
    showCutLines: true,
    showStockCode: true,
    slogan: "GÜÇLÜ DONANIM, PROFESYONEL ÇÖZÜMLER",
    defaultWarrantyOrg: "Kongoru Firma Garantisi",
    zoom: "fit",
  };
}

export function createInitialAppState(): AppState {
  return {
    labels: createDefaultLabels(),
    settings: createDefaultSettings(),
    selectedIndex: 0,
  };
}

export function normalizeLoadedState(raw: unknown): AppState {
  const defaults = createDefaultSettings();
  if (!raw || typeof raw !== "object") {
    return createInitialAppState();
  }
  const obj = raw as Record<string, unknown>;
  const rawLabels = Array.isArray(obj.labels) ? obj.labels : [];
  const labels: LabelEntry[] = rawLabels
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      rawText: typeof item.rawText === "string" ? item.rawText : "",
      overrides:
        item.overrides && typeof item.overrides === "object"
          ? (item.overrides as LabelEntry["overrides"])
          : undefined,
    }));

  const rawSettings =
    obj.settings && typeof obj.settings === "object"
      ? (obj.settings as Record<string, unknown>)
      : {};

  const zoomRaw = rawSettings.zoom;
  const zoom: AppSettings["zoom"] =
    zoomRaw === "fit" ||
    zoomRaw === "fit-page" ||
    (typeof zoomRaw === "number" && zoomRaw > 0)
      ? zoomRaw
      : defaults.zoom;

  const settings: AppSettings = {
    gap: rawSettings.gap === "0mm" ? "0mm" : "2mm",
    showCutLines:
      typeof rawSettings.showCutLines === "boolean"
        ? rawSettings.showCutLines
        : defaults.showCutLines,
    showStockCode:
      typeof rawSettings.showStockCode === "boolean"
        ? rawSettings.showStockCode
        : defaults.showStockCode,
    slogan:
      typeof rawSettings.slogan === "string" && rawSettings.slogan.trim()
        ? rawSettings.slogan
        : defaults.slogan,
    defaultWarrantyOrg:
      typeof rawSettings.defaultWarrantyOrg === "string" && rawSettings.defaultWarrantyOrg.trim()
        ? rawSettings.defaultWarrantyOrg
        : defaults.defaultWarrantyOrg,
    zoom,
  };

  let selectedIndex =
    typeof obj.selectedIndex === "number" && Number.isFinite(obj.selectedIndex)
      ? Math.max(0, Math.floor(obj.selectedIndex))
      : 0;
  if (labels.length > 0 && selectedIndex >= labels.length) {
    selectedIndex = labels.length - 1;
  } else if (labels.length === 0) {
    selectedIndex = 0;
  }

  return { labels, settings, selectedIndex };
}

export function buildStatePayload(state: AppState) {
  return {
    version: 7,
    savedAt: Date.now(),
    labels: state.labels,
    settings: state.settings,
    selectedIndex: state.selectedIndex,
  };
}

let idbPromise: Promise<IDBDatabase | null> | null = null;

function openLocalDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbPromise;
}

export async function idbGetValue<T = unknown>(key: string): Promise<T | null> {
  const db = await openLocalDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSetValue(key: string, value: unknown): Promise<boolean> {
  const db = await openLocalDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbDeleteValue(key: string): Promise<boolean> {
  const db = await openLocalDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export function loadPersistedStateSync(): {
  hasLocalStorageState: boolean;
  state: AppState;
  draftText: string;
} {
  let state = createInitialAppState();
  let hasLocalStorageState = false;
  let draftText = "";

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = normalizeLoadedState(JSON.parse(raw));
      hasLocalStorageState = true;
    }
  } catch {
    state = createInitialAppState();
  }

  try {
    draftText = localStorage.getItem(DRAFT_STORAGE_KEY) || "";
  } catch {
    draftText = "";
  }

  return { hasLocalStorageState, state, draftText };
}

export function persistState(state: AppState): void {
  const payload = buildStatePayload(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors and keep IndexedDB
  }
  void idbSetValue("main_state", payload);
}

export function saveDraftInput(text: string): void {
  try {
    if (text) {
      localStorage.setItem(DRAFT_STORAGE_KEY, text);
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
  if (text) {
    void idbSetValue("draft_input", text);
  } else {
    void idbDeleteValue("draft_input");
  }
}

export async function clearPersistedStorage(nextEmptyState: AppState): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
  await Promise.all([
    idbSetValue("main_state", buildStatePayload(nextEmptyState)),
    idbDeleteValue("draft_input"),
  ]);
}

export async function ensurePersistentBrowserStorage(): Promise<boolean> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const persisted = await navigator.storage.persisted();
      if (!persisted) {
        return await navigator.storage.persist();
      }
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
