import { useLayoutEffect, useRef } from "react";
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
  const titleRef = useRef<HTMLDivElement | null>(null);
  const titleLenClass =
    data.title.length > 34 ? "len-long" : data.title.length > 24 ? "len-med" : "";

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.whiteSpace = "nowrap";
    let sizePt = data.title.length > 34 ? 7.9 : data.title.length > 24 ? 9.2 : 10.6;
    el.style.fontSize = `${sizePt}pt`;
    while (el.scrollWidth > el.clientWidth + 0.5 && sizePt > 4.5) {
      sizePt = Math.round((sizePt - 0.25) * 100) / 100;
      el.style.fontSize = `${sizePt}pt`;
    }
    if (el.scrollWidth > el.clientWidth + 0.5) {
      el.style.whiteSpace = "normal";
      el.style.lineHeight = "1.04";
    } else {
      el.style.lineHeight = "";
    }
  }, [data.title]);

  return (
    <div
      className={`label-card${isSelected ? " selected-on-screen" : ""}`}
      data-label-idx={index}
      onClick={() => onSelect(index)}
      onDoubleClick={() => onDoubleClick(index)}
      title="Seçmek için tıklayın • Düzenlemek için çift tıklayın"
    >
      <div className="bw-frame">
        <div ref={titleRef} className={`bw-title ${titleLenClass}`}>
          {data.title}
        </div>

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
