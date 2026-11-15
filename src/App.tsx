import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { EditModal } from "./components/EditModal";
import { PreviewArea } from "./components/PreviewArea";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { applyOverrides, expandAdsByStockCodes, parseAdDescription, splitMultipleAds } from "./parser";
import { renderPrintPageDataUrls, triggerDirectPdfDownload } from "./pdf/canvasPdf";
import {
  buildStatePayload,
  clearPersistedStorage,
  createInitialAppState,
  DRAFT_STORAGE_KEY,
  ensurePersistentBrowserStorage,
  idbGetValue,
  idbSetValue,
  loadPersistedStateSync,
  normalizeLoadedState,
  persistState,
  saveDraftInput,
  STORAGE_KEY,
} from "./storage/localDb";
import type {
  AppSettings,
  AppState,
  LabelEntry,
  LabelOverrides,
  ParsedLabel,
  ToastMessage,
  ZoomSetting,
} from "./types/label";

function readInputValue(id: string): string | null {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return el ? el.value : null;
}

function cloneLabelEntry(entry: LabelEntry): LabelEntry {
  return {
    rawText: entry.rawText,
    overrides: entry.overrides ? JSON.parse(JSON.stringify(entry.overrides)) : undefined,
  };
}

export function App() {
  const initialSync = useRef(loadPersistedStateSync());
  const [state, setState] = useState<AppState>(initialSync.current.state);
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  const adInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [draftText, setDraftText] = useState<string>(initialSync.current.draftText);
  const [dbStatusText, setDbStatusText] = useState<string>(
    "Yerel bellek etkin (IndexedDB)"
  );

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSlotIndex, setEditSlotIndex] = useState(0);
  const [modalKey, setModalKey] = useState(0);
  const editModalOpenRef = useRef(false);
  editModalOpenRef.current = editModalOpen;
  const editSlotIndexRef = useRef(0);
  editSlotIndexRef.current = editSlotIndex;

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [printPageUrls, setPrintPageUrls] = useState<string[]>([]);
  const [copiedLabel, setCopiedLabel] = useState<LabelEntry | null>(null);
  const copiedLabelRef = useRef<LabelEntry | null>(null);
  copiedLabelRef.current = copiedLabel;

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [...prev.slice(-1), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const commitState = useCallback((next: AppState, shouldPersist = true) => {
    stateRef.current = next;
    if (shouldPersist) {
      persistState(next);
    }
    flushSync(() => {
      setState(next);
    });
  }, []);

  // Hydrate from IndexedDB if localStorage was cleared externally, and request persistent storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await ensurePersistentBrowserStorage();
      if (!cancelled) {
        setDbStatusText(
          persisted
            ? "Kalıcı yerel bellek etkin (IndexedDB · Korumalı)"
            : "Yerel bellek etkin (IndexedDB)"
        );
      }

      if (!initialSync.current.hasLocalStorageState) {
        const saved = await idbGetValue<unknown>("main_state");
        if (!cancelled && saved) {
          const recovered = normalizeLoadedState(saved);
          if (recovered.labels.length > 0) {
            stateRef.current = recovered;
            setState(recovered);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStatePayload(recovered)));
            } catch {
              // ignore
            }
          }
        }
      }

      if (!initialSync.current.draftText) {
        const savedDraft = await idbGetValue<string>("draft_input");
        if (!cancelled && typeof savedDraft === "string" && savedDraft.length > 0) {
          setDraftText(savedDraft);
          if (adInputRef.current) {
            adInputRef.current.value = savedDraft;
          }
          try {
            localStorage.setItem(DRAFT_STORAGE_KEY, savedDraft);
          } catch {
            // ignore
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectLabel = useCallback(
    (index: number) => {
      const cur = stateRef.current;
      if (cur.labels.length === 0) return;
      const clamped = Math.max(0, Math.min(index, cur.labels.length - 1));
      commitState({ ...cur, selectedIndex: clamped });
    },
    [commitState]
  );

  const addNewSlot = useCallback(() => {
    const domVal = adInputRef.current ? adInputRef.current.value : draftText;
    const trimmed = domVal.trim();
    if (!trimmed) {
      showToast("Önce ilan metnini yapıştırın", "error");
      return;
    }

    const segments = expandAdsByStockCodes(splitMultipleAds(trimmed));
    const entries: LabelEntry[] = segments.map((raw) => ({ rawText: raw }));

    const cur = stateRef.current;
    const nextLabels = [...cur.labels, ...entries];
    const nextIdx = nextLabels.length - 1;

    commitState({
      ...cur,
      labels: nextLabels,
      selectedIndex: nextIdx,
    });

    if (adInputRef.current) {
      adInputRef.current.value = "";
    }
    flushSync(() => {
      setDraftText("");
    });
    saveDraftInput("");

    showToast(
      entries.length > 1
        ? `${entries.length} etiket eklendi`
        : "Etiket sayfaya eklendi",
      "success"
    );
  }, [commitState, draftText, showToast]);

  // Keep global onclick="addNewSlot()" synchronous even before useEffect runs
  (window as unknown as Record<string, unknown>).addNewSlot = addNewSlot;

  const moveLabelSlot = useCallback(
    (index: number, delta: -1 | 1) => {
      const cur = stateRef.current;
      const target = index + delta;
      if (target < 0 || target >= cur.labels.length) return;
      const nextLabels = [...cur.labels];
      const [moved] = nextLabels.splice(index, 1);
      nextLabels.splice(target, 0, moved);
      const nextSelected =
        cur.selectedIndex === index
          ? target
          : cur.selectedIndex === target
          ? index
          : cur.selectedIndex;
      commitState({
        ...cur,
        labels: nextLabels,
        selectedIndex: nextSelected,
      });
    },
    [commitState]
  );

  const deleteSelectedSlot = useCallback(
    (index?: number) => {
      const cur = stateRef.current;
      const idx = typeof index === "number" ? index : cur.selectedIndex;
      if (idx < 0 || idx >= cur.labels.length) return;
      const nextLabels = cur.labels.filter((_, i) => i !== idx);
      const nextSelected =
        nextLabels.length === 0 ? 0 : Math.min(cur.selectedIndex, nextLabels.length - 1);
      commitState({
        ...cur,
        labels: nextLabels,
        selectedIndex: nextSelected,
      });
      showToast("Etiket yuvası silindi");
    },
    [commitState, showToast]
  );

  const copyLabelSlot = useCallback(
    (index?: number) => {
      const cur = stateRef.current;
      if (cur.labels.length === 0) {
        showToast("Kopyalanacak etiket yok", "error");
        return;
      }
      const idx =
        typeof index === "number"
          ? Math.max(0, Math.min(index, cur.labels.length - 1))
          : cur.selectedIndex;
      const entry = cur.labels[idx];
      if (!entry) return;
      const cloned = cloneLabelEntry(entry);
      copiedLabelRef.current = cloned;
      setCopiedLabel(cloned);
      showToast(`Yuva #${idx + 1} kopyalandı`, "success");
    },
    [showToast]
  );

  const pasteCopiedLabel = useCallback(() => {
    const src = copiedLabelRef.current;
    if (!src) {
      showToast("Önce bir etiket kopyalayın", "error");
      return;
    }
    const cur = stateRef.current;
    const cloned = cloneLabelEntry(src);
    const nextLabels = [...cur.labels, cloned];
    const nextIdx = nextLabels.length - 1;
    commitState({
      ...cur,
      labels: nextLabels,
      selectedIndex: nextIdx,
    });
    showToast(`Etiket Yuva #${nextIdx + 1} olarak yapıştırıldı`, "success");
  }, [commitState, showToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editModalOpenRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          editModalOpenRef.current = false;
          flushSync(() => {
            setEditModalOpen(false);
          });
        }
        return;
      }
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const active = document.activeElement;
      const tag = active ? active.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (window.getSelection()?.toString()) return;

      const key = e.key.toLowerCase();
      if (key === "c") {
        if (stateRef.current.labels.length > 0) {
          e.preventDefault();
          copyLabelSlot();
        }
      } else if (key === "v") {
        if (copiedLabelRef.current) {
          e.preventDefault();
          pasteCopiedLabel();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyLabelSlot, pasteCopiedLabel]);

  const clearAllLabels = useCallback(() => {
    const cur = stateRef.current;
    if (cur.labels.length > 0 && typeof window.confirm === "function") {
      const ok = window.confirm(
        "Tüm kayıtlı etiketler ve yerel taslak bellekten kalıcı olarak silinsin mi?"
      );
      if (!ok) return;
    }

    const empty = createInitialAppState();
    empty.settings = cur.settings;
    stateRef.current = empty;
    if (adInputRef.current) adInputRef.current.value = "";

    flushSync(() => {
      setDraftText("");
      setState(empty);
      setEditModalOpen(false);
    });
    void clearPersistedStorage(empty);
    showToast("Tüm etiketler temizlendi");
  }, [showToast]);

  const openEditModal = useCallback(
    (index?: number) => {
      const cur = stateRef.current;
      if (cur.labels.length === 0) {
        showToast("Düzenlenecek etiket yok", "error");
        return;
      }
      const targetIdx =
        typeof index === "number"
          ? Math.max(0, Math.min(index, cur.labels.length - 1))
          : cur.selectedIndex;

      if (targetIdx !== cur.selectedIndex) {
        stateRef.current = { ...cur, selectedIndex: targetIdx };
        persistState(stateRef.current);
      }
      editSlotIndexRef.current = targetIdx;
      editModalOpenRef.current = true;

      flushSync(() => {
        setState(stateRef.current);
        setEditSlotIndex(targetIdx);
        setModalKey((k) => k + 1);
        setEditModalOpen(true);
      });
    },
    [showToast]
  );

  const editSelectedSlot = useCallback(() => {
    openEditModal(stateRef.current.selectedIndex);
  }, [openEditModal]);

  const closeEditModal = useCallback(() => {
    editModalOpenRef.current = false;
    flushSync(() => {
      setEditModalOpen(false);
    });
  }, []);

  const saveEditModal = useCallback(() => {
    const cur = stateRef.current;
    const idx = editSlotIndexRef.current;
    const entry = cur.labels[idx];
    if (!entry) {
      closeEditModal();
      return;
    }

    const baseParsed = parseAdDescription(entry.rawText, cur.settings);
    const nextOverrides: LabelOverrides = {};

    const topKeys: (keyof Omit<ParsedLabel, "specs">)[] = [
      "title",
      "subtitle",
      "stockCode",
      "warrantyTitle",
      "warrantyDuration",
      "warrantyDetail",
      "boxTitle",
      "boxLine1",
      "boxLine2",
    ];
    for (const k of topKeys) {
      const val = readInputValue(`em_${k}`);
      if (val !== null && val !== baseParsed[k]) {
        nextOverrides[k] = val;
      }
    }

    const specOverrides: Record<number, { k?: string; v?: string }> = {};
    baseParsed.specs.slice(0, 7).forEach((row, rIdx) => {
      const kVal = readInputValue(`em_spec_k_${rIdx}`);
      const vVal = readInputValue(`em_spec_v_${rIdx}`);
      const rowOv: { k?: string; v?: string } = {};
      if (kVal !== null && kVal !== row.k) rowOv.k = kVal;
      if (vVal !== null && vVal !== row.v) rowOv.v = vVal;
      if (rowOv.k !== undefined || rowOv.v !== undefined) {
        specOverrides[rIdx] = rowOv;
      }
    });
    if (Object.keys(specOverrides).length > 0) {
      nextOverrides.specs = specOverrides;
    }

    const nextLabels = [...cur.labels];
    nextLabels[idx] = {
      ...entry,
      overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined,
    };

    editModalOpenRef.current = false;
    stateRef.current = { ...cur, labels: nextLabels };
    persistState(stateRef.current);

    flushSync(() => {
      setState(stateRef.current);
      setEditModalOpen(false);
    });
    showToast("Etiket güncellendi", "success");
  }, [closeEditModal, showToast]);

  const resetSelectedOverrides = useCallback(() => {
    const cur = stateRef.current;
    const idx = cur.selectedIndex;
    const entry = cur.labels[idx];
    if (!entry || !entry.overrides) return;
    const nextLabels = [...cur.labels];
    nextLabels[idx] = { rawText: entry.rawText };
    commitState({ ...cur, labels: nextLabels });
    showToast("Etiket ilan metnine sıfırlandı");
  }, [commitState, showToast]);

  const resetEditModalFromText = useCallback(() => {
    const cur = stateRef.current;
    const idx = editSlotIndexRef.current;
    const entry = cur.labels[idx];
    if (!entry) return;
    const nextLabels = [...cur.labels];
    nextLabels[idx] = { rawText: entry.rawText };
    stateRef.current = { ...cur, labels: nextLabels };
    persistState(stateRef.current);
    flushSync(() => {
      setState(stateRef.current);
      setModalKey((k) => k + 1);
    });
    showToast("Alanlar ilan metninden yenilendi");
  }, [showToast]);

  const setZoom = useCallback(
    (zoom: ZoomSetting) => {
      const cur = stateRef.current;
      commitState({
        ...cur,
        settings: { ...cur.settings, zoom },
      });
    },
    [commitState]
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const cur = stateRef.current;
      commitState({
        ...cur,
        settings: { ...cur.settings, ...patch },
      });
    },
    [commitState]
  );

  const downloadDirectPdf = useCallback(async () => {
    const cur = stateRef.current;
    if (cur.labels.filter((l) => l.rawText.trim()).length === 0) {
      showToast("Önce en az bir etiket ekleyin", "error");
      return;
    }
    setIsBusy(true);
    try {
      const pages = await triggerDirectPdfDownload(cur);
      showToast(`PDF indirildi (${pages} sayfa A4 · 450 DPI)`, "success");
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      showToast("PDF oluşturulurken hata oluştu", "error");
    } finally {
      setIsBusy(false);
    }
  }, [showToast]);

  const executeDirectPrint = useCallback(async () => {
    const cur = stateRef.current;
    if (cur.labels.filter((l) => l.rawText.trim()).length === 0) {
      showToast("Önce en az bir etiket ekleyin", "error");
      return;
    }
    setIsBusy(true);
    try {
      const urls = await renderPrintPageDataUrls(cur);
      flushSync(() => {
        setPrintPageUrls(urls);
      });
      await new Promise((r) => setTimeout(r, 80));
      window.print();
    } catch (err) {
      console.error("Yazdırma hazırlık hatası:", err);
      showToast("Yazdırma sayfası hazırlanırken hata oluştu", "error");
    } finally {
      setIsBusy(false);
    }
  }, [showToast]);

  // Expose legacy window.* E2E testing bridge cleanly
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    Object.defineProperty(win, "state", {
      get: () => stateRef.current,
      configurable: true,
    });
    win.STORAGE_KEY = STORAGE_KEY;
    win.idbSetValue = idbSetValue;
    win.buildStatePayload = () => buildStatePayload(stateRef.current);
    win.saveDraftInput = saveDraftInput;
    win.getParsedLabel = (entry: LabelEntry) =>
      applyOverrides(parseAdDescription(entry.rawText, stateRef.current.settings), entry.overrides);
    win.addNewSlot = addNewSlot;
    win.selectLabel = selectLabel;
    win.moveLabelSlot = moveLabelSlot;
    win.editSelectedSlot = editSelectedSlot;
    win.openEditModal = openEditModal;
    win.closeEditModal = closeEditModal;
    win.saveEditModal = saveEditModal;
    win.resetEditModalFromText = resetEditModalFromText;
    win.resetSelectedOverrides = resetSelectedOverrides;
    win.deleteSelectedSlot = deleteSelectedSlot;
    win.clearAllLabels = clearAllLabels;
    win.setZoom = setZoom;
    win.downloadDirectPdf = downloadDirectPdf;
    win.executeDirectPrint = executeDirectPrint;
  }, [
    addNewSlot,
    clearAllLabels,
    closeEditModal,
    deleteSelectedSlot,
    downloadDirectPdf,
    editSelectedSlot,
    executeDirectPrint,
    moveLabelSlot,
    openEditModal,
    resetEditModalFromText,
    resetSelectedOverrides,
    saveEditModal,
    selectLabel,
    setZoom,
  ]);

  const modalEntry = state.labels[editSlotIndex];
  const modalBaseParsed = modalEntry
    ? parseAdDescription(modalEntry.rawText, state.settings)
    : null;
  const modalEffectiveParsed =
    modalBaseParsed && modalEntry
      ? applyOverrides(modalBaseParsed, modalEntry.overrides)
      : null;

  return (
    <>
      <Topbar
        onClearAll={clearAllLabels}
        onPrint={() => void executeDirectPrint()}
        onDownloadPdf={() => void downloadDirectPdf()}
        isBusy={isBusy}
      />

      <div className="workspace">
        <Sidebar
          labels={state.labels}
          selectedIndex={state.selectedIndex}
          settings={state.settings}
          adInputRef={adInputRef}
          initialDraftText={draftText}
          dbStatusText={dbStatusText}
          hasCopiedLabel={Boolean(copiedLabel)}
          onDraftChange={(val) => {
            setDraftText(val);
            saveDraftInput(val);
          }}
          onEditSelectedSlot={editSelectedSlot}
          onResetSelectedOverrides={resetSelectedOverrides}
          onCopyLabel={copyLabelSlot}
          onPasteCopiedLabel={pasteCopiedLabel}
          onSelectLabel={selectLabel}
          onMoveLabelSlot={moveLabelSlot}
          onDeleteSlot={deleteSelectedSlot}
          onUpdateSettings={updateSettings}
        />

        <PreviewArea
          labels={state.labels}
          selectedIndex={state.selectedIndex}
          settings={state.settings}
          hasCopiedLabel={Boolean(copiedLabel)}
          onSelectLabel={selectLabel}
          onOpenEditModal={(idx) => openEditModal(idx)}
          onFocusAddInput={() => adInputRef.current?.focus()}
          onPasteCopiedLabel={pasteCopiedLabel}
          onSetZoom={setZoom}
        />
      </div>

      <div className="toast-container" id="toastContainer" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-dot" aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <EditModal
        isOpen={editModalOpen}
        slotIndex={editSlotIndex}
        baseParsed={modalBaseParsed}
        effectiveParsed={modalEffectiveParsed}
        modalKey={modalKey}
        onClose={closeEditModal}
        onSave={saveEditModal}
        onResetFromText={resetEditModalFromText}
      />

      {createPortal(
        <div id="printRoot">
          {printPageUrls.map((url, idx) => (
            <img
              key={idx}
              className="print-page-img"
              src={url}
              alt={`A4 Sayfa ${idx + 1}`}
            />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
export default App;
