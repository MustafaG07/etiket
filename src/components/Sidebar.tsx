import type { RefObject } from "react";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, LabelEntry } from "../types/label";

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

  return (
    <aside className="sidebar">
      <div className="slot-header">
        <div>
          <div className="slot-header-title" id="selectedSlotHeader">
            {currentEntry ? `Yuva #${selectedIndex + 1}` : "Yeni Etiket Girişi"}
          </div>
          <div className="slot-header-meta" id="selectedSlotMeta">
            {currentEntry
              ? `Sayfa ${Math.floor(selectedIndex / 9) + 1} • Sıra ${(selectedIndex % 9) + 1}`
              : "İlan metnini aşağıya yapıştırıp ekleyin"}
          </div>
        </div>

        <button
          type="button"
          className="chip-btn"
          id="resetOverridesBtn"
          onClick={onResetSelectedOverrides}
          style={{ display: hasOverrides ? "inline-flex" : "none" }}
          title="Seçili etiketteki el ile düzenlemeleri temizler ve ilandan yeniden oluşturur"
        >
          Metne Sıfırla
        </button>
      </div>

      <textarea
        id="adInput"
        ref={adInputRef}
        className="ad-input"
        defaultValue={initialDraftText}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={`Sahibinden ilan açıklamasını veya teknik tablosunu buraya yapıştırın...\n\nÖrnek:\nMSI CYBORG 15 | i7-13620H | RTX 4060 8GB | 16 GB DDR5 | 512 GB SSD | 15.6" 144Hz\n\nÇoklu eklemek için ilanları --- satırıyla ayırabilirsiniz.`}
      />

      <div className="sidebar-actions">
        <button
          type="button"
          className="btn btn-primary"
          ref={(el) => {
            if (el) el.setAttribute("onclick", "addNewSlot()");
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Etiket Ekle (Sayfaya Ekle)
        </button>

        <button
          type="button"
          id="sidebarEditBtn"
          className="btn btn-edit"
          onClick={onEditSelectedSlot}
          disabled={labels.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Seçili Etiketi Düzenle
        </button>

        <div className="sidebar-copy-row">
          <button
            type="button"
            id="copySlotBtn"
            className="btn btn-copy"
            onClick={() => onCopyLabel()}
            disabled={labels.length === 0}
            title="Seçili etiketi tüm düzenlemeleriyle kopyalar (Ctrl/Cmd + C)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Kopyala
          </button>
          <button
            type="button"
            id="pasteSlotBtn"
            className="btn btn-paste"
            onClick={onPasteCopiedLabel}
            disabled={!hasCopiedLabel}
            title="Kopyalanan etiketi yeni yuvaya yapıştırır (Ctrl/Cmd + V)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11v6" />
              <path d="M9 14h6" />
            </svg>
            Yeni Yuvaya Yapıştır
          </button>
        </div>
      </div>

      <div className="sidebar-settings-card">
        <div className="sidebar-settings-toggles">
          <label className={`setting-toggle${settings.showCutLines ? " active" : ""}`}>
            <input
              type="checkbox"
              checked={settings.showCutLines}
              onChange={(e) => onUpdateSettings({ showCutLines: e.target.checked })}
            />
            <span className="setting-toggle-dot" aria-hidden="true" />
            <span>Kesim Çizgisi</span>
          </label>

          <label className={`setting-toggle${settings.showStockCode ? " active" : ""}`}>
            <input
              type="checkbox"
              checked={settings.showStockCode}
              onChange={(e) => onUpdateSettings({ showStockCode: e.target.checked })}
            />
            <span className="setting-toggle-dot" aria-hidden="true" />
            <span>Stok Kodu</span>
          </label>
        </div>

        <div className="sidebar-gap-row">
          <span className="sidebar-gap-label">Etiket Aralığı</span>
          <div className="gap-segmented" role="group" aria-label="Etiket Aralığı">
            <button
              type="button"
              className={`gap-seg-btn${settings.gap === "2mm" ? " active" : ""}`}
              onClick={() => onUpdateSettings({ gap: "2mm" })}
            >
              2 mm Aralıklı
            </button>
            <button
              type="button"
              className={`gap-seg-btn${settings.gap === "0mm" ? " active" : ""}`}
              onClick={() => onUpdateSettings({ gap: "0mm" })}
            >
              0 mm Bitişik
            </button>
          </div>
        </div>
      </div>

      <div className="slot-list-section">
        <div className="slot-list-header">
          <span>Etiket Yuvaları</span>
          <span id="listCount">{labels.length}</span>
        </div>

        <div className="label-list-items" id="labelListContainer">
          {labels.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#6fa3a0", padding: "8px 2px" }}>
              Henüz etiket eklenmedi. Metni yapıştırıp "Etiket Ekle" butonuna basın.
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
                .join(" • ");

              return (
                <div
                  key={`${idx}-${entry.rawText.slice(0, 18)}`}
                  className={`label-list-item${idx === selectedIndex ? " active" : ""}`}
                  onClick={() => onSelectLabel(idx)}
                >
                  <div className="label-list-info">
                    <div className="label-list-title">
                      {idx + 1}. {parsed.title || "Boş Etiket"}
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
                        style={{ color: "#5eead4" }}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn"
                        disabled={idx === 0}
                        onClick={() => onMoveLabelSlot(idx, -1)}
                        title="Yukarı taşı"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn"
                        disabled={idx === labels.length - 1}
                        onClick={() => onMoveLabelSlot(idx, 1)}
                        title="Aşağı taşı"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="slot-move-btn"
                        onClick={() => onDeleteSlot(idx)}
                        title="Etiketi sil"
                        style={{ color: "#fda4af" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          id="localDbStatus"
          style={{
            fontSize: "11px",
            color: "#6fa3a0",
            paddingTop: "4px",
            lineHeight: 1.35,
          }}
        >
          {dbStatusText}
        </div>
      </div>
    </aside>
  );
}
