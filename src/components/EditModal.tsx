import { LINE_ICONS } from "../assets/lineIcons";
import type { ParsedLabel } from "../types/label";

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
    >
      <div className="edit-modal">
        <div className="edit-modal-header">
          <div className="edit-modal-title-wrap">
            <div className="edit-modal-title" id="editModalTitle">
              Yuva #{slotIndex + 1} Etiketini Düzenle
            </div>
            <div className="edit-modal-sub" id="editModalSub">
              {effectiveParsed?.title || ""}
            </div>
          </div>

          <div className="edit-modal-header-actions">
            <button
              type="button"
              className="chip-btn"
              id="modalResetBtn"
              onClick={onResetFromText}
            >
              İlandan Yenile
            </button>
            <button type="button" className="btn btn-dark btn-sm" onClick={onClose}>
              Kapat ✕
            </button>
          </div>
        </div>

        <div className="edit-modal-body" id="editModalBody" key={modalKey}>
          {effectiveParsed ? (
            <>
              <div className="edit-section">
                <div className="edit-section-title">Başlık &amp; Üst Bilgiler</div>
                <div className="edit-grid-2">
                  <div className="edit-field span-2">
                    <label className="edit-label" htmlFor="em_title">
                      Ürün Ana Başlığı
                    </label>
                    <input
                      id="em_title"
                      className="edit-input"
                      defaultValue={effectiveParsed.title}
                    />
                  </div>

                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_subtitle">
                      Alt Kategori
                    </label>
                    <input
                      id="em_subtitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.subtitle}
                    />
                  </div>

                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_stockCode">
                      Stok Kodu
                    </label>
                    <input
                      id="em_stockCode"
                      className="edit-input"
                      defaultValue={effectiveParsed.stockCode}
                    />
                  </div>
                </div>
              </div>

              <div className="edit-section">
                <div className="edit-section-title">Teknik Özellik Satırları</div>
                <div className="edit-spec-list">
                  {effectiveParsed.specs.slice(0, 7).map((row, idx) => (
                    <div className="edit-spec-row" key={`${row.icon}-${idx}`}>
                      <div className="edit-spec-k-wrap">
                        <div className="edit-spec-badge">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: LINE_ICONS[row.icon] || LINE_ICONS.extras,
                            }}
                          />
                          <span>Satır {idx + 1} Başlık</span>
                        </div>
                        <input
                          id={`em_spec_k_${idx}`}
                          className="edit-input"
                          defaultValue={row.k}
                        />
                      </div>

                      <div className="edit-field">
                        <label className="edit-label" htmlFor={`em_spec_v_${idx}`}>
                          Donanım Değeri
                        </label>
                        <input
                          id={`em_spec_v_${idx}`}
                          className="edit-input"
                          defaultValue={row.v}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="edit-section">
                <div className="edit-section-title">Garanti &amp; Kutu Kutucukları</div>
                <div className="edit-grid-2">
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyTitle">
                      Garanti Başlık
                    </label>
                    <input
                      id="em_warrantyTitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyTitle}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxTitle">
                      Kutu Başlık
                    </label>
                    <input
                      id="em_boxTitle"
                      className="edit-input"
                      defaultValue={effectiveParsed.boxTitle}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyDuration">
                      Garanti Durumu
                    </label>
                    <input
                      id="em_warrantyDuration"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyDuration}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxLine1">
                      Kutu Satır 1
                    </label>
                    <input
                      id="em_boxLine1"
                      className="edit-input"
                      defaultValue={effectiveParsed.boxLine1}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_warrantyDetail">
                      Garanti Detay
                    </label>
                    <input
                      id="em_warrantyDetail"
                      className="edit-input"
                      defaultValue={effectiveParsed.warrantyDetail}
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label" htmlFor="em_boxLine2">
                      Kutu Satır 2
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
            Değişiklikler tarayıcı belleğine otomatik kaydedilir.
          </span>
          <div className="edit-modal-footer-btns">
            <button type="button" className="btn btn-dark btn-sm" onClick={onClose}>
              Vazgeç
            </button>
            <button
              type="button"
              id="saveEditModalBtn"
              className="btn btn-success btn-sm"
              onClick={onSave}
            >
              Kaydet ve Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
