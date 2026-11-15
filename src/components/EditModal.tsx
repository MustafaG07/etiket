import type { ParsedLabel } from "../types/label";
import { IconRotateCcw, IconX, SpecGlyphIcon } from "./Icons";

interface EditModalProps {
  isOpen: boolean;
  slotIndex: number;
  baseParsed: ParsedLabel | null;
  effectiveParsed: ParsedLabel | null;
  modalKey: number;
  onClose: () => void;
  onSave: () => void;
  onResetFromText: () => void;
}

export function EditModal({
  isOpen,
  slotIndex,
  effectiveParsed,
  modalKey,
  onClose,
  onSave,
  onResetFromText,
}: EditModalProps) {
  return (
    <div
      className={`edit-modal-overlay${isOpen ? " open" : ""}`}
      id="editModalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editModalTitle"
    >
      <div className="edit-modal">
        <div className="edit-modal-header">
          <div className="edit-modal-title-wrap">
            <div className="edit-modal-title" id="editModalTitle">
              Yuva #{slotIndex + 1} düzenle
            </div>
            <div className="edit-modal-sub" id="editModalSub">
              {effectiveParsed?.title || ""}
            </div>
          </div>

          <div className="edit-modal-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              id="modalResetBtn"
              onClick={onResetFromText}
            >
              <IconRotateCcw />
              <span>İlandan yenile</span>
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={onClose}
              aria-label="Kapat"
              title="Kapat (Esc)"
            >
              <IconX />
            </button>
          </div>
        </div>

        <div className="edit-modal-body" id="editModalBody" key={modalKey}>
          {effectiveParsed ? (
            <>
              <div className="edit-section">
                <div className="edit-section-title">Başlık ve üst bilgiler</div>
                <div className="edit-grid-2">
                  <div className="edit-field span-2">
                    <label className="edit-label" htmlFor="em_title">
                      Ürün ana başlığı
                    </label>
                    <input
                      id="em_title"
                      className="edit-input"
                      defaultValue={effectiveParsed.title}
                    />
                  </div>

                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_subtitle">
                      Alt kategori
                    </label>
                    <input
                      id="em_subtitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.subtitle}
                    />
                  </div>

                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_stockCode">
                      Stok kodu
                    </label>
                    <input
                      id="em_stockCode"
                      className="edit-input edit-input-mono"
                      defaultValue={effectiveParsed.stockCode}
                    />
                  </div>
                </div>
              </div>

              <div className="edit-section">
                <div className="edit-section-title">Teknik özellik satırları</div>
                <div className="edit-spec-header" aria-hidden="true">
                  <span className="edit-spec-header-icon" />
                  <span className="edit-label">Satır başlığı</span>
                  <span className="edit-label">Donanım değeri</span>
                </div>
                <div className="edit-spec-list">
                  {effectiveParsed.specs.slice(0, 7).map((row, idx) => (
                    <div className="edit-spec-row" key={`${row.icon}-${idx}`}>
                      <span className="edit-spec-icon" title={`Satır ${idx + 1}`}>
                        <SpecGlyphIcon type={row.icon} />
                      </span>
                      <input
                        id={`em_spec_k_${idx}`}
                        className="edit-input"
                        defaultValue={row.k}
                        aria-label={`Satır ${idx + 1} başlık`}
                      />
                      <input
                        id={`em_spec_v_${idx}`}
                        className="edit-input"
                        defaultValue={row.v}
                        aria-label={`Satır ${idx + 1} donanım değeri`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="edit-section">
                <div className="edit-section-title">Garanti ve kutu</div>
                <div className="edit-grid-2">
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyTitle">
                      Garanti başlık
                    </label>
                    <input
                      id="em_warrantyTitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyTitle}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxTitle">
                      Kutu başlık
                    </label>
                    <input
                      id="em_boxTitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.boxTitle}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyDuration">
                      Garanti durumu
                    </label>
                    <input
                      id="em_warrantyDuration"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyDuration}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxLine1">
                      Kutu satır 1
                    </label>
                    <input
                      id="em_boxLine1"
                      className="edit-input"
                      defaultValue={effectiveParsed.boxLine1}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyDetail">
                      Garanti detay
                    </label>
                    <input
                      id="em_warrantyDetail"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyDetail}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxLine2">
                      Kutu satır 2
                    </label>
                    <input
                      id="em_boxLine2"
                      className="edit-input"
                      defaultValue={effectiveParsed.boxLine2}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="edit-modal-footer">
          <span className="edit-modal-hint">
            Değişiklikler tarayıcı belleğine otomatik kaydedilir
          </span>
          <div className="edit-modal-footer-btns">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Vazgeç
            </button>
            <button
              type="button"
              id="saveEditModalBtn"
              className="btn btn-primary btn-sm"
              onClick={onSave}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
