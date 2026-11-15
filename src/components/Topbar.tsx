import { BRAND_LOGO_DATA_URI } from "../assets/brandLogo";
import { IconDownload, IconPrinter, IconTrash } from "./Icons";

interface TopbarProps {
  onClearAll: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  isBusy: boolean;
}

export function Topbar({ onClearAll, onPrint, onDownloadPdf, isBusy }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand-area">
        <img className="brand-logo" src={BRAND_LOGO_DATA_URI} alt="KONGORU Logo" />
        <div className="brand-text">
          <div className="brand-title">KONGORU</div>
          <div className="brand-sub">Vitrin Etiketi Stüdyosu · A4 9'lu (6 × 7.9 cm)</div>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-ghost-danger"
          onClick={onClearAll}
          disabled={isBusy}
          title="Tüm etiket yuvalarını ve yerel tarayıcı belleğini temizler"
        >
          <IconTrash />
          <span>Temizle</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onPrint}
          disabled={isBusy}
          title="450 DPI A4 yazdırma penceresini açar"
        >
          <IconPrinter />
          <span>Yazdır</span>
        </button>

        <button
          type="button"
          id="pdfDownloadBtn"
          className="btn btn-primary"
          onClick={onDownloadPdf}
          disabled={isBusy}
          title="A4 boyutunda 450 DPI PDF dosyası indirir"
        >
          <IconDownload />
          <span>PDF İndir</span>
        </button>
      </div>
    </header>
  );
}
