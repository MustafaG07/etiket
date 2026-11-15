import { BRAND_LOGO_DATA_URI } from "../assets/brandLogo";

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
        <div>
          <div className="brand-title">KONGORU — Vitrin Etiketi Oluşturucu</div>
          <div className="brand-sub">A4 Sayfada 9 Etiket (6 × 7.9 cm) • Siyah-Beyaz Milimetrik Çıktı</div>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-clear"
          onClick={onClearAll}
          disabled={isBusy}
          title="Tüm etiket yuvalarını ve yerel tarayıcı belleğini temizler"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Tümünü Temizle
        </button>

        <button
          type="button"
          className="btn btn-dark"
          onClick={onPrint}
          disabled={isBusy}
          title="300 DPI yüksek çözünürlüklü A4 yazdırma penceresini açar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Yazdır
        </button>

        <button
          type="button"
          id="pdfDownloadBtn"
          className="btn btn-success"
          onClick={onDownloadPdf}
          disabled={isBusy}
          title="Doğrudan A4 boyutunda yüksek çözünürlüklü PDF dosyası indirir"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PDF İndir
        </button>
      </div>
    </header>
  );
}
