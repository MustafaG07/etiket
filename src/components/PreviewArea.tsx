import { useEffect, useRef, useState } from "react";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, LabelEntry, ZoomSetting } from "../types/label";
import { IconPencil, IconPlus } from "./Icons";
import { LabelCard } from "./LabelCard";

interface PreviewAreaProps {
  labels: LabelEntry[];
  selectedIndex: number;
  settings: AppSettings;
  hasCopiedLabel: boolean;
  onSelectLabel: (index: number) => void;
  onOpenEditModal: (index: number) => void;
  onFocusAddInput: () => void;
  onPasteCopiedLabel: () => void;
  onSetZoom: (zoom: ZoomSetting) => void;
}

// Physical CSS dimensions at 96 DPI: 210mm x 297mm
const MM_TO_CSS_PX = 96 / 25.4;
const SHEET_W_PX = Math.round(210 * MM_TO_CSS_PX * 10) / 10; // ~793.7px
const SHEET_H_PX = Math.round(297 * MM_TO_CSS_PX * 10) / 10; // ~1122.5px

const FIT_ZOOM_OPTIONS: { value: ZoomSetting; label: string }[] = [
  { value: "fit", label: "Tam Genişlik" },
  { value: "fit-page", label: "Sayfaya Sığdır" },
];

const PCT_ZOOM_OPTIONS: { value: ZoomSetting; label: string }[] = [
  { value: 0.8, label: "%80" },
  { value: 1, label: "%100" },
  { value: 2, label: "%200" },
];

export function PreviewArea({
  labels,
  selectedIndex,
  settings,
  hasCopiedLabel,
  onSelectLabel,
  onOpenEditModal,
  onFocusAddInput,
  onPasteCopiedLabel,
  onSetZoom,
}: PreviewAreaProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 960,
    height: 760,
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0) {
        setViewportSize({ width: w, height: h > 0 ? h : 760 });
      }
    };
    updateSize();

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const filledEntries = labels
    .map((entry, idx) => ({ entry, idx }))
    .filter((item) => item.entry.rawText.trim().length > 0);

  const filledCount = filledEntries.length;
  const perPage = 9;
  const pageCount = Math.max(1, Math.ceil(filledCount / perPage));

  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const isCompactViewport = viewportWidth <= 700;
  const deskPadX = isCompactViewport ? 24 : 48;
  const deskPadY = isCompactViewport ? 24 : 48;

  const effectiveScale = (() => {
    if (settings.zoom === "fit") {
      return Math.min(1.6, Math.max(0.25, (viewportWidth - deskPadX) / SHEET_W_PX));
    }
    if (settings.zoom === "fit-page") {
      if (isCompactViewport) {
        return Math.min(1.18, Math.max(0.25, (viewportWidth - deskPadX) / SHEET_W_PX));
      }
      const scaleW = (viewportWidth - deskPadX) / SHEET_W_PX;
      const scaleH = (viewportHeight - deskPadY) / SHEET_H_PX;
      return Math.min(1.18, Math.max(0.25, Math.min(scaleW, scaleH)));
    }
    return settings.zoom;
  })();

  const scaledW = Math.round(SHEET_W_PX * effectiveScale);
  const scaledH = Math.round(SHEET_H_PX * effectiveScale);

  const gridClasses = [
    "label-grid",
    settings.showCutLines ? "show-cut-lines" : "",
    settings.gap === "0mm" ? "gap-zero" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="preview-area">
      <div className="preview-toolbar">
        <div className="preview-stats">
          <span id="previewSummary" className="preview-summary">
            {filledCount} dolu etiket · {pageCount} sayfa A4 (6 × 7.9 cm)
          </span>
          {filledCount > 0 ? (
            <span className="preview-hint">Düzenlemek için karta çift tıklayın</span>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm mobile-preview-edit-btn"
          id="mobilePreviewEditBtn"
          onClick={() => onOpenEditModal(selectedIndex)}
          disabled={labels.length === 0}
        >
          <IconPencil />
          <span>Seçili etiketi düzenle</span>
        </button>

        <div className="zoom-controls">
          <span className="zoom-controls-label">Görünüm</span>
          <div className="zoom-segmented" role="group" aria-label="Önizleme ölçeği">
            {FIT_ZOOM_OPTIONS.map((opt) => {
              const isActive = settings.zoom === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`zoom-btn${isActive ? " active" : ""}`}
                  data-zoom={String(opt.value)}
                  onClick={() => onSetZoom(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
            <span className="zoom-divider" aria-hidden="true" />
            {PCT_ZOOM_OPTIONS.map((opt) => {
              const isActive = settings.zoom === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`zoom-btn zoom-btn-mono${isActive ? " active" : ""}`}
                  data-zoom={String(opt.value)}
                  onClick={() => onSetZoom(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pages-viewport" id="pagesViewport" ref={viewportRef}>
        {Array.from({ length: pageCount }).map((_, pIdx) => (
          <div key={pIdx} className="page-block">
            <div
              className="page-wrapper"
              style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
            >
              <div
                className="zoom-box"
                style={{
                  width: `${SHEET_W_PX}px`,
                  height: `${SHEET_H_PX}px`,
                  transform: `scale(${effectiveScale})`,
                }}
              >
                <div className="a4-sheet">
                  <div
                    className={gridClasses}
                    style={{ "--label-gap": settings.gap } as React.CSSProperties}
                  >
                    {Array.from({ length: perPage }).map((__, slotOffset) => {
                      const slotPos = pIdx * perPage + slotOffset;
                      const item = filledEntries[slotPos];
                      if (!item) {
                        const isNextEmpty = slotPos === filledCount;
                        const slotNum = String(slotPos + 1).padStart(2, "0");
                        return (
                          <div className="label-slot" key={`empty-${slotPos}`}>
                            <div
                              className={`empty-slot-placeholder${isNextEmpty ? " is-next" : ""}`}
                              onClick={onFocusAddInput}
                              title={`Yuva #${slotPos + 1} için soldan ilan metni ekleyin`}
                            >
                              <span className="empty-slot-num">{slotNum}</span>
                              {isNextEmpty ? (
                                <div className="empty-slot-cta">
                                  <IconPlus width={14} height={14} strokeWidth={1.5} />
                                  <span>Etiket ekle</span>
                                </div>
                              ) : null}
                              {hasCopiedLabel && isNextEmpty ? (
                                <button
                                  type="button"
                                  className="empty-paste-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPasteCopiedLabel();
                                  }}
                                >
                                  Kopyalananı yapıştır
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      }

                      const parsed = applyOverrides(
                        parseAdDescription(item.entry.rawText, settings),
                        item.entry.overrides
                      );
                      return (
                        <div className="label-slot has-label" key={`filled-${item.idx}`}>
                          <LabelCard
                            index={item.idx}
                            data={parsed}
                            settings={settings}
                            isSelected={item.idx === selectedIndex}
                            onSelect={onSelectLabel}
                            onDoubleClick={onOpenEditModal}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="page-sheet-meta">
              Sayfa {pIdx + 1} / {pageCount} · 210 × 297 mm
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
