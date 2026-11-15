import { useEffect, useRef, useState } from "react";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, LabelEntry, ZoomSetting } from "../types/label";
import { LabelCard } from "./LabelCard";

interface PreviewAreaProps {
  labels: LabelEntry[];
  selectedIndex: number;
  settings: AppSettings;
  onSelectLabel: (index: number) => void;
  onOpenEditModal: (index: number) => void;
  onFocusAddInput: () => void;
  onSetZoom: (zoom: ZoomSetting) => void;
}

// Physical CSS dimensions at 96 DPI: 210mm x 297mm
const MM_TO_CSS_PX = 96 / 25.4;
const SHEET_W_PX = Math.round(210 * MM_TO_CSS_PX * 10) / 10; // ~793.7px
const SHEET_H_PX = Math.round(297 * MM_TO_CSS_PX * 10) / 10; // ~1122.5px

const ZOOM_OPTIONS: { value: ZoomSetting; label: string }[] = [
  { value: 0.65, label: "%65" },
  { value: 0.8, label: "%80" },
  { value: 1, label: "%100" },
  { value: "fit", label: "Tam Genişlik" },
  { value: 2, label: "Geniş (%200)" },
];

export function PreviewArea({
  labels,
  selectedIndex,
  settings,
  onSelectLabel,
  onOpenEditModal,
  onFocusAddInput,
  onSetZoom,
}: PreviewAreaProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(900);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) setViewportWidth(w);
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

  const effectiveScale =
    settings.zoom === "fit"
      ? Math.min(1.18, Math.max(0.25, (viewportWidth - 4) / SHEET_W_PX))
      : settings.zoom;

  const scaledW = Math.round(SHEET_W_PX * effectiveScale);
  const scaledH = Math.round(SHEET_H_PX * effectiveScale);
  const needsHorizontalPan = scaledW > viewportWidth - 2;
  const wrapperWidthStyle = needsHorizontalPan ? `${scaledW}px` : "100%";
  const centerLeftOffset = needsHorizontalPan
    ? 0
    : Math.max(0, Math.floor((viewportWidth - scaledW) / 2));

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
          <span id="previewSummary">
            Toplam {filledCount} Dolu Etiket • {pageCount} Sayfa A4 (6 × 7.9 cm)
          </span>
          <span className="print-tip-pill">
            Düzenlemek için soldaki Seçili Etiketi Düzenle butonuna tıklayın (veya karta çift tıklayın)
          </span>
        </div>

        <button
          type="button"
          className="btn btn-edit mobile-preview-edit-btn"
          id="mobilePreviewEditBtn"
          onClick={() => onOpenEditModal(selectedIndex)}
          disabled={labels.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Seçili Etiketi Düzenle
        </button>

        <div className="zoom-controls">
          <span
            className="zoom-controls-label"
            style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginRight: "6px" }}
          >
            Yakınlaştır:
          </span>
          <div className="zoom-segmented">
            {ZOOM_OPTIONS.map((opt) => {
              const isActive = settings.zoom === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`btn btn-sm ${isActive ? "btn-primary" : "btn-light"}`}
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
          <div
            key={pIdx}
            className="page-wrapper"
            style={{ width: wrapperWidthStyle, height: `${scaledH}px` }}
          >
            <div
              className="zoom-box"
              style={{
                width: `${SHEET_W_PX}px`,
                height: `${SHEET_H_PX}px`,
                left: `${centerLeftOffset}px`,
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
                      return (
                        <div className="label-slot" key={`empty-${slotPos}`}>
                          <div
                            className="empty-slot-placeholder"
                            onClick={onFocusAddInput}
                          >
                            <div>+</div>
                            <div>Yuva #{slotPos + 1} Boş</div>
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
        ))}
      </div>
    </main>
  );
}
