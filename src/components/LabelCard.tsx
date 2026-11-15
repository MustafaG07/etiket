import { LINE_ICONS } from "../assets/lineIcons";
import type { AppSettings, ParsedLabel } from "../types/label";

interface LabelCardProps {
  index: number;
  data: ParsedLabel;
  settings: AppSettings;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onDoubleClick: (index: number) => void;
}

export function LabelCard({
  index,
  data,
  settings,
  isSelected,
  onSelect,
  onDoubleClick,
}: LabelCardProps) {
  const titleLenClass =
    data.title.length > 34 ? "len-long" : data.title.length > 24 ? "len-med" : "";

  return (
    <div
      className={`label-card${isSelected ? " selected-on-screen" : ""}`}
      data-label-idx={index}
      onClick={() => onSelect(index)}
      onDoubleClick={() => onDoubleClick(index)}
      title="Seçmek için tıklayın • Düzenlemek için çift tıklayın"
    >
      <div className="bw-frame">
        <div className={`bw-title ${titleLenClass}`}>{data.title}</div>

        <div className="bw-subtitle-row">
          <div className="bw-subtitle">{data.subtitle}</div>
          {settings.showStockCode && data.stockCode ? (
            <div className="bw-stock">{data.stockCode}</div>
          ) : null}
        </div>

        <div className="bw-specs">
          {data.specs.slice(0, 7).map((row, rIdx) => (
            <div className="bw-spec-row" key={`${row.icon}-${rIdx}`}>
              <div
                className="bw-icon-col"
                dangerouslySetInnerHTML={{ __html: LINE_ICONS[row.icon] || LINE_ICONS.extras }}
              />
              <div className="bw-text-col">
                <div className="bw-spec-k">{row.k}</div>
                <div className="bw-spec-v">{row.v}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bw-bottom-grid">
          <div className="bw-bottom-box">
            <div
              className="bw-bottom-icon"
              dangerouslySetInnerHTML={{ __html: LINE_ICONS.shield }}
            />
            <div className="bw-bottom-text">
              <div className="bw-bottom-title">{data.warrantyTitle}</div>
              <div className="bw-bottom-strong">{data.warrantyDuration}</div>
              <div className="bw-bottom-sub">{data.warrantyDetail}</div>
            </div>
          </div>

          <div className="bw-bottom-box">
            <div
              className="bw-bottom-icon"
              dangerouslySetInnerHTML={{ __html: LINE_ICONS.box }}
            />
            <div className="bw-bottom-text">
              <div className="bw-bottom-title">{data.boxTitle}</div>
              <div className="bw-bottom-strong">{data.boxLine1}</div>
              <div className="bw-bottom-sub">{data.boxLine2}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
