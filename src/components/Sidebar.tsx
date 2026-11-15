import type { RefObject } from "react";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, LabelEntry } from "../types/label";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconPaste,
  IconPencil,
  IconPlus,
  IconRotateCcw,
  IconX,
} from "./Icons";

interface SidebarProps {
  labels: LabelEntry[];
  selectedIndex: number;
  settings: AppSettings;
  adInputRef: RefObject<HTMLTextAreaElement | null>;
  initialDraftText: string;
  dbStatusText: string;
  hasCopiedLabel: boolean;
  onDraftChange: (val: string) => void;
  onEditSelectedSlot: () => void;
  onResetSelectedOverrides: () => void;
  onCopyLabel: (index?: number) => void;
  onPasteCopiedLabel: () => void;
  onSelectLabel: (index: number) => void;
  onMoveLabelSlot: (index: number, delta: -1 | 1) => void;
  onDeleteSlot: (index: number) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export function Sidebar({
  labels,
  selectedIndex,
  settings,
  adInputRef,
  initialDraftText,
  dbStatusText,
  hasCopiedLabel,
  onDraftChange,
  onEditSelectedSlot,
  onResetSelectedOverrides,
  onCopyLabel,
  onPasteCopiedLabel,
  onSelectLabel,
  onMoveLabelSlot,
  onDeleteSlot,
  onUpdateSettings,
}: SidebarProps) {
  const currentEntry = labels[selectedIndex];
  const hasOverrides = Boolean(
    currentEntry?.overrides && Object.keys(currentEntry.overrides).length > 0
  );
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl+";

  return (
    <aside className="sidebar">
      <section className="sidebar-group sidebar-input-group">
        <div className="slot-header">
          <div className="slot-header-info">
            <div className="slot-header-title" id="selectedSlotHeader">
              {currentEntry ? `Yuva #${selectedIndex + 1}` : "Yeni etiket"}
            </div>
            <div
              className={`slot-header-meta${currentEntry ? " active" : ""}`}
              id="selectedSlotMeta"
            >
              {currentEntry
                ? `Sayfa ${Math.floor(selectedIndex / 9) + 1} · Sıra ${(selectedIndex % 9) + 1}`
                : "A4 9'lu şablon · 60 × 79 mm"}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            id="resetOverridesBtn"
            onClick={onResetSelectedOverrides}
            style={{ display: hasOverrides ? "inline-flex" : "none" }}
            title="Seçili etiketteki elle yapılan değişiklikleri ilan metnine sıfırlar"
          >
            <IconRotateCcw />
            <span>Metne sıfırla</span>
          </button>
        </div>

        <textarea
          id="adInput"
          ref={adInputRef}
          className="ad-input"
          defaultValue={initialDraftText}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={`İlan açıklamasını veya teknik tabloyu yapıştırın\n\nÖrnek:\nMSI CYBORG 15 | i7-13620H | RTX 4060 8GB | 16 GB DDR5 | 512 GB SSD | 15.6" 144Hz\n\nÇoklu ekleme için ilanları --- satırıyla ayırın`}
        />

        <div className="sidebar-actions">
          <button
            type="button"
            className="btn btn-accent"
            ref={(el) => {
              if (el) el.setAttribute("onclick", "addNewSlot()");
            }}
          >
            <IconPlus />
            <span>Etiket ekle</span>
          </button>

          <button
            type="button"
            id="sidebarEditBtn"
            className="btn btn-secondary"
            onClick={onEditSelectedSlot}
            disabled={labels.length === 0}
          >
            <IconPencil />
            <span>Seçili etiketi düzenle</span>
          </button>

          <div className="sidebar-copy-row">
            <button
              type="button"
              id="copySlotBtn"
              className="btn btn-secondary btn-sm"
              onClick={() => onCopyLabel()}
              disabled={labels.length === 0}
              title={`Seçili etiketi kopyala (${modKey}C)`}
            >
              <IconCopy />
              <span>Kopyala</span>
              <kbd className="kbd">{modKey}C</kbd>
            </button>
            <button
              type="button"
              id="pasteSlotBtn"
              className="btn btn-secondary btn-sm"
              onClick={onPasteCopiedLabel}
              disabled={!hasCopiedLabel}
              title={`Kopyalanan etiketi yeni yuvaya yapıştır (${modKey}V)`}
            >
              <IconPaste />
              <span>Yapıştır</span>
              <kbd className="kbd">{modKey}V</kbd>
            </button>
          </div>
        </div>
      </section>

      <section className="sidebar-group sidebar-settings-card" aria-label="Baskı ayarları">
        <div className="sidebar-settings-toggles">
          <label className={`setting-toggle${settings.showCutLines ? " active" : ""}`}>
            <input
              type="checkbox"
              checked={settings.showCutLines}
              onChange={(e) => onUpdateSettings({ showCutLines: e.target.checked })}
            />
            <span className="setting-toggle-box" aria-hidden="true">
              {settings.showCutLines ? <IconCheck width={12} height={12} strokeWidth={2.2} /> : null}
            </span>
            <span>Kesim çizgisi</span>
          </label>

          <label className={`setting-toggle${settings.showStockCode ? " active" : ""}`}>
            <input
              type="checkbox"
              checked={settings.showStockCode}
              onChange={(e) => onUpdateSettings({ showStockCode: e.target.checked })}
            />
            <span className="setting-toggle-box" aria-hidden="true">
              {settings.showStockCode ? <IconCheck width={12} height={12} strokeWidth={2.2} /> : null}
            </span>
            <span>Stok kodu</span>
          </label>
        </div>

        <div className="sidebar-gap-row">
          <span className="sidebar-gap-label">Etiket aralığı</span>
          <div className="gap-segmented" role="group" aria-label="Etiket aralığı">
            <button
              type="button"
              className={`gap-seg-btn${settings.gap === "2mm" ? " active" : ""}`}
              onClick={() => onUpdateSettings({ gap: "2mm" })}
            >
              2 mm
            </button>
            <button
              type="button"
              className={`gap-seg-btn${settings.gap === "0mm" ? " active" : ""}`}
              onClick={() => onUpdateSettings({ gap: "0mm" })}
            >
              0 mm bitişik
            </button>
          </div>
        </div>
      </section>

      <section className="sidebar-group slot-list-section">
        <div className="slot-list-header">
          <span>Etiket yuvaları</span>
          <span id="listCount" className="slot-count">
            {labels.length}
          </span>
        </div>

        <div className="label-list-items" id="labelListContainer">
          {labels.length === 0 ? (
            <div className="empty-list-hint">
              Henüz etiket eklenmedi. İlan metnini yukarı yapıştırıp ekleyin
            </div>
          ) : (
            labels.map((entry, idx) => {
              const parsed = applyOverrides(
                parseAdDescription(entry.rawText, settings),
                entry.overrides
              );
              const cpuSpec = parsed.specs.find((s) => s.icon === "cpu")?.v || "";
              const ramSpec = parsed.specs.find((s) => s.icon === "ram")?.v || "";
              const subLine = [parsed.stockCode, cpuSpec, ramSpec]
                .filter((x) => x && x !== "-" && x !== "Belirtilmedi")
                .join(" · ");
              const slotNum = String(idx + 1).padStart(2, "0");

              return (
                <div
                  key={`${idx}-${entry.rawText.slice(0, 18)}`}
                  className={`label-list-item${idx === selectedIndex ? " active" : ""}`}
                  onClick={() => onSelectLabel(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectLabel(idx);
                    }
                  }}
                >
                  <span className="label-list-num">{slotNum}</span>

                  <div className="label-list-info">
                    <div className="label-list-title">
                      {parsed.title || "Boş etiket"}
                    </div>
                    <div className="label-list-sub">
                      {subLine || parsed.subtitle}
                    </div>
                  </div>

                  <div className="slot-item-right" onClick={(e) => e.stopPropagation()}>
                    <div className="slot-move-btns">
                      <button
                        type="button"
                        className="slot-move-btn"
                        onClick={() => onCopyLabel(idx)}
                        title="Bu etiketi kopyala"
                        aria-label={`Yuva ${idx + 1} kopyala`}
                      >
                        <IconCopy />
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn"
                        disabled={idx === 0}
                        onClick={() => onMoveLabelSlot(idx, -1)}
                        title="Yukarı taşı"
                        aria-label={`Yuva ${idx + 1} yukarı taşı`}
                      >
                        <IconChevronUp />
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn"
                        disabled={idx === labels.length - 1}
                        onClick={() => onMoveLabelSlot(idx, 1)}
                        title="Aşağı taşı"
                        aria-label={`Yuva ${idx + 1} aşağı taşı`}
                      >
                        <IconChevronDown />
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn danger"
                        onClick={() => onDeleteSlot(idx)}
                        title="Etiketi sil"
                        aria-label={`Yuva ${idx + 1} sil`}
                      >
                        <IconX />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div id="localDbStatus" className="db-status-text">
          {dbStatusText}
        </div>
      </section>
    </aside>
  );
}
