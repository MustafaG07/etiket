import { LINE_ICONS, type LineIconName } from "../assets/lineIcons";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, AppState, LabelEntry, ParsedLabel } from "../types/label";

const DPI = 450;
const A4_W_MM = 210;
const A4_H_MM = 297;
const CARD_W_MM = 60;
const CARD_H_MM = 79;

export const A4_PX_W = Math.round((A4_W_MM / 25.4) * DPI); // 3720
export const A4_PX_H = Math.round((A4_H_MM / 25.4) * DPI); // 5262

function mmToPx(mm: number): number {
  return (mm / 25.4) * DPI;
}

function ptToPx(pt: number): number {
  return (pt * DPI) / 72;
}

function canvasRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 0
): void {
  if (r > 0) {
    canvasRoundRectPath(ctx, x, y, w, h, r);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, w, h);
  }
}

type IconImageMap = Partial<Record<LineIconName, HTMLImageElement>>;
let cachedIconsPromise: Promise<IconImageMap> | null = null;

function loadSvgIcon(svgMarkup: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  });
}

function loadAllLucideIcons(): Promise<IconImageMap> {
  if (cachedIconsPromise) return cachedIconsPromise;
  cachedIconsPromise = (async () => {
    const map: IconImageMap = {};
    const entries = Object.entries(LINE_ICONS) as [LineIconName, string][];
    const loaded = await Promise.all(
      entries.map(async ([k, svg]) => [k, await loadSvgIcon(svg)] as const)
    );
    for (const [k, img] of loaded) {
      if (img) map[k] = img;
    }
    return map;
  })();
  return cachedIconsPromise;
}

function drawLucideIcon(
  ctx: CanvasRenderingContext2D,
  icons: IconImageMap,
  type: LineIconName,
  x: number,
  y: number,
  size: number
): void {
  const img = icons[type] || icons.extras;
  if (img) {
    ctx.drawImage(img, x, y, size, size);
  }
}

function fitSingleLineInfo(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontWeight: string,
  startPt: number,
  minPt: number,
  fontFamily: string
): { text: string; pt: number } {
  let sizePt = startPt;
  while (sizePt > minPt) {
    ctx.font = `${fontWeight} ${ptToPx(sizePt)}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) {
      return { text, pt: sizePt };
    }
    sizePt = Math.round((sizePt - 0.25) * 100) / 100;
  }
  ctx.font = `${fontWeight} ${ptToPx(minPt)}px ${fontFamily}`;
  if (ctx.measureText(text).width <= maxWidth) {
    return { text, pt: minPt };
  }
  let out = text;
  while (out.length > 3 && ctx.measureText(out + "...").width > maxWidth) {
    out = out.slice(0, -1);
  }
  return { text: out === text ? text : out.trimEnd() + "...", pt: minPt };
}

function wrapWordsAtPt(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontWeight: string,
  pt: number,
  fontFamily: string
): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  ctx.font = `${fontWeight} ${ptToPx(pt)}px ${fontFamily}`;
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else if (!line) {
      return null;
    } else {
      lines.push(line);
      if (ctx.measureText(word).width > maxWidth) return null;
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapLinesNoEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  fontWeight: string,
  startPt: number,
  minPt: number,
  fontFamily: string
): { lines: string[]; pt: number } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [], pt: startPt };

  const tryWrapAt = (pt: number, lineLimit: number): string[] | null => {
    ctx.font = `${fontWeight} ${ptToPx(pt)}px ${fontFamily}`;
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else if (!line) {
        return null;
      } else {
        lines.push(line);
        line = word;
        if (lines.length >= lineLimit) {
          return null;
        }
      }
    }

    if (line) {
      if (ctx.measureText(line).width > maxWidth) return null;
      lines.push(line);
    }
    return lines.length <= lineLimit ? lines : null;
  };

  let pt = startPt;
  const twoLineFloor = Math.min(minPt, 4.8);
  while (pt >= twoLineFloor) {
    const fitted = tryWrapAt(pt, maxLines);
    if (fitted) return { lines: fitted, pt };
    pt = Math.round((pt - 0.25) * 100) / 100;
  }

  // If 2 lines are still too tight, try maxLines + 1 (3 lines) from 5.6pt down to 3.6pt for readability
  if (maxLines < 3) {
    let threePt = Math.min(startPt, 5.6);
    while (threePt >= 3.6) {
      const fitted3 = tryWrapAt(threePt, 3);
      if (fitted3) return { lines: fitted3, pt: threePt };
      threePt = Math.round((threePt - 0.25) * 100) / 100;
    }
  }

  let extraPt = twoLineFloor;
  while (extraPt >= 3.6) {
    const fitted = tryWrapAt(extraPt, maxLines);
    if (fitted) return { lines: fitted, pt: extraPt };
    extraPt = Math.round((extraPt - 0.25) * 100) / 100;
  }

  ctx.font = `${fontWeight} ${ptToPx(3.6)}px ${fontFamily}`;
  const mid = Math.ceil(words.length / 2);
  return {
    lines: maxLines > 1 && words.length > 1
      ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
      : [words.join(" ")],
    pt: 3.6,
  };
}

function getEntryParsed(entry: LabelEntry, settings: AppSettings): ParsedLabel {
  return applyOverrides(parseAdDescription(entry.rawText, settings), entry.overrides);
}

function drawCanvasLabelCard(
  ctx: CanvasRenderingContext2D,
  data: ParsedLabel,
  settings: AppSettings,
  slotX: number,
  slotY: number,
  icons: IconImageMap
): void {
  const cardW = mmToPx(CARD_W_MM);
  const cardH = mmToPx(CARD_H_MM);
  const outerPad = mmToPx(0.55);
  const fx = slotX + outerPad;
  const fy = slotY + outerPad;
  const fw = cardW - outerPad * 2;
  const fh = cardH - outerPad * 2;
  const borderW = mmToPx(0.42);
  const padX = mmToPx(0.95);
  const innerX = fx + padX;
  const innerW = fw - padX * 2;
  const fontFamily = "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(slotX, slotY, cardW, cardH);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = borderW;
  strokeRoundRect(ctx, fx, fy, fw, fh, mmToPx(2.0));

  // Match .bw-frame top padding (0.65mm) + .bw-title padding-top (0.15mm) inside border
  let curY = fy + mmToPx(0.21 + 0.65 + 0.15);

  const titleStartPt = data.title.length > 34 ? 7.9 : data.title.length > 24 ? 9.2 : 10.6;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const fittedTitle = fitSingleLineInfo(
    ctx,
    data.title.toUpperCase(),
    innerW - mmToPx(0.7),
    "900",
    titleStartPt,
    4.2,
    fontFamily
  );
  ctx.fillText(fittedTitle.text, innerX + mmToPx(0.35), curY);
  curY += ptToPx(fittedTitle.pt) * 1.10 + mmToPx(0.35);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = mmToPx(0.38);
  ctx.beginPath();
  ctx.moveTo(innerX, curY);
  ctx.lineTo(innerX + innerW, curY);
  ctx.stroke();
  curY += mmToPx(0.19 + 0.22);

  // Subtitle & stock code row (framed stock code slightly lower below header line, matching .bw-subtitle-row & .bw-stock)
  let stockW = 0;
  let stockBottomY = 0;
  if (settings.showStockCode && data.stockCode) {
    ctx.font = `900 ${ptToPx(6.2)}px ${fontFamily}`;
    const textW = ctx.measureText(data.stockCode).width;
    const boxW = textW + mmToPx(2.0);
    const boxH = mmToPx(3.30);
    const sx = innerX + innerW - boxW - mmToPx(0.15);
    const sy = curY + mmToPx(0.42);
    stockW = boxW + mmToPx(0.2);

    ctx.fillStyle = "#ffffff";
    canvasRoundRectPath(ctx, sx, sy, boxW, boxH, mmToPx(0.45));
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = mmToPx(0.30);
    strokeRoundRect(ctx, sx, sy, boxW, boxH, mmToPx(0.45));

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.stockCode, sx + boxW / 2, sy + boxH / 2 + mmToPx(0.05));
    ctx.textBaseline = "top";
    stockBottomY = sy + boxH + mmToPx(0.20);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  const subAvail = innerW - mmToPx(0.35) - (stockW ? stockW + mmToPx(0.8) : 0);
  const ctxWithLs = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const hasLetterSpacing = "letterSpacing" in ctxWithLs;
  if (hasLetterSpacing) {
    ctxWithLs.letterSpacing = `${ptToPx(0.2)}px`;
  }
  const fittedSub = fitSingleLineInfo(ctx, data.subtitle, subAvail, "800", 6.2, 4.0, fontFamily);
  ctx.fillText(fittedSub.text, innerX + mmToPx(0.35), curY + mmToPx(0.14));
  if (hasLetterSpacing) {
    ctxWithLs.letterSpacing = "0px";
  }
  const subBottomY = curY + mmToPx(0.14) + ptToPx(fittedSub.pt) * 1.15 + mmToPx(0.22);
  curY = Math.max(subBottomY, stockBottomY);

  // Pre-measure bottom grid tiles so bottomBoxH fits 3-4 lines cleanly without squeezing or overlapping specs
  const halfW = (innerW - mmToPx(0.6)) / 2;
  const leftX = innerX;
  const rightX = innerX + halfW + mmToPx(0.6);
  const bottomIcSize = mmToPx(3.25);
  const bottomTextOffset = mmToPx(3.6);
  const bottomTw = halfW - mmToPx(3.75);

  type BottomBlock = { lines: string[]; pt: number; weight: string };
  const prepareBottomBlocks = (title: string, line1: string, line2: string): BottomBlock[] => {
    const blocks: BottomBlock[] = [];
    if (!title && !line1 && !line2) return blocks;
    if (title) {
      const fittedH = fitSingleLineInfo(ctx, title, bottomTw, "900", 5.8, 4.2, fontFamily);
      blocks.push({ lines: [fittedH.text], pt: fittedH.pt, weight: "900" });
    }
    if (line1) {
      const w1 = wrapLinesNoEllipsis(ctx, line1, bottomTw, line2 ? 2 : 3, "900", 6.0, 4.3, fontFamily);
      blocks.push({ ...w1, weight: "900" });
    }
    if (line2) {
      const w2 = wrapLinesNoEllipsis(ctx, line2, bottomTw, 2, "800", 5.5, 4.1, fontFamily);
      blocks.push({ ...w2, weight: "800" });
    }
    return blocks;
  };

  const measureBlocksHeight = (blocks: BottomBlock[]): number =>
    blocks.reduce((acc, b) => acc + b.lines.length * ptToPx(b.pt) * 1.12, 0);

  const leftBlocks = prepareBottomBlocks(data.warrantyTitle, data.warrantyDuration, data.warrantyDetail);
  const rightBlocks = prepareBottomBlocks(data.boxTitle, data.boxLine1, data.boxLine2);
  const leftNatH = measureBlocksHeight(leftBlocks);
  const rightNatH = measureBlocksHeight(rightBlocks);
  const rawBottomContentH = Math.max(bottomIcSize, leftNatH, rightNatH);
  const bottomBoxH = Math.min(mmToPx(11.0), Math.max(mmToPx(8.2), rawBottomContentH + mmToPx(0.95)));

  const frameInnerBottom = fy + fh - mmToPx(0.21 + 0.30);
  const panelY = frameInnerBottom - bottomBoxH;
  const specsAvailH = Math.max(mmToPx(24), panelY - curY);

  // Uniform font auto-fitting across ALL spec rows (1-to-1 with LabelCard.tsx --spec-k-pt / --spec-v-pt)
  const specs = data.specs.slice(0, 7);
  const iconSize = mmToPx(4.3);
  const dividerX = innerX + mmToPx(5.25);
  const textX = dividerX + mmToPx(0.8);
  const textMaxW = innerX + innerW - textX;

  type SpecLayoutRow = {
    keyText: string;
    keyPtUsed: number;
    lines: string[];
    blockH: number;
    minRowH: number;
    keyH: number;
    keyValGap: number;
    valStep: number;
  };

  let chosenKeyPt = 8.4;
  let chosenValPt = 7.3;
  let chosenRows: SpecLayoutRow[] = [];

  for (let step = 0; step < 20; step++) {
    const candKeyPt = Math.max(4.4, Math.round((8.4 - step * 0.3) * 100) / 100);
    const candValPt = Math.max(3.6, Math.round((7.3 - step * 0.25) * 100) / 100);

    let failedWrap = false;
    const rows: SpecLayoutRow[] = [];

    for (const row of specs) {
      const lines = wrapWordsAtPt(ctx, row.v, textMaxW, "900", candValPt, fontFamily);
      if (!lines) {
        failedWrap = true;
        break;
      }
      const keyFit = fitSingleLineInfo(ctx, row.k, textMaxW, "900", candKeyPt, 4.0, fontFamily);
      const keyH = ptToPx(keyFit.pt) * 1.04;
      const valLineH = ptToPx(candValPt) * 1.06;
      const valStep = ptToPx(candValPt) * 1.12;
      const keyValGap = mmToPx(0.18);
      const blockH = keyH + keyValGap + valLineH + Math.max(0, lines.length - 1) * valStep;
      const minRowH = Math.max(iconSize + mmToPx(0.45), blockH + mmToPx(0.72));
      rows.push({
        keyText: keyFit.text,
        keyPtUsed: keyFit.pt,
        lines,
        blockH,
        minRowH,
        keyH,
        keyValGap,
        valStep,
      });
    }

    if (failedWrap) continue;

    chosenKeyPt = candKeyPt;
    chosenValPt = candValPt;
    chosenRows = rows;

    const totalMinH = rows.reduce((acc, r) => acc + r.minRowH, 0);
    if (totalMinH <= specsAvailH) break;
  }

  // Fallback if an extreme card still couldn't wrap cleanly without breaking words
  if (chosenRows.length === 0 && specs.length > 0) {
    chosenKeyPt = 4.6;
    chosenValPt = 4.0;
    chosenRows = specs.map((row) => {
      const wrapped = wrapLinesNoEllipsis(ctx, row.v, textMaxW, 3, "900", chosenValPt, 3.6, fontFamily);
      const keyFit = fitSingleLineInfo(ctx, row.k, textMaxW, "900", chosenKeyPt, 3.8, fontFamily);
      const keyH = ptToPx(keyFit.pt) * 1.04;
      const valLineH = ptToPx(wrapped.pt) * 1.06;
      const valStep = ptToPx(wrapped.pt) * 1.12;
      const keyValGap = mmToPx(0.15);
      const blockH = keyH + keyValGap + valLineH + Math.max(0, wrapped.lines.length - 1) * valStep;
      const minRowH = Math.max(iconSize + mmToPx(0.35), blockH + mmToPx(0.6));
      return {
        keyText: keyFit.text,
        keyPtUsed: keyFit.pt,
        lines: wrapped.lines,
        blockH,
        minRowH,
        keyH,
        keyValGap,
        valStep,
      };
    });
  }

  const totalIntrinsicH = chosenRows.reduce((acc, r) => acc + r.minRowH, 0);
  const scaleRowsY = totalIntrinsicH > specsAvailH && totalIntrinsicH > 0 ? specsAvailH / totalIntrinsicH : 1;
  const extraPerRow =
    chosenRows.length > 0 && totalIntrinsicH < specsAvailH
      ? (specsAvailH - totalIntrinsicH) / chosenRows.length
      : 0;
  const rowHeights = chosenRows.map((r) => r.minRowH * scaleRowsY + extraPerRow);

  let rowTopY = curY;
  specs.forEach((row, i) => {
    const rowH = rowHeights[i];
    const layout = chosenRows[i];
    const ry = rowTopY;
    rowTopY += rowH;

    drawLucideIcon(
      ctx,
      icons,
      row.icon,
      innerX + mmToPx(0.15),
      ry + Math.max(0, (rowH - iconSize) / 2),
      iconSize
    );

    const maxBlockH = Math.max(mmToPx(2.8), rowH - mmToPx(0.5));
    const fitScale = layout.blockH > maxBlockH ? maxBlockH / layout.blockH : 1;

    const keyPt = layout.keyPtUsed * fitScale;
    const valPt = chosenValPt * fitScale;
    const keyH = layout.keyH * fitScale;
    const valStep = layout.valStep * fitScale;
    const keyValGap = layout.keyValGap * fitScale;
    const blockH = layout.blockH * fitScale;
    const blockStartY = ry + Math.max(mmToPx(0.22), (rowH - blockH) / 2 - mmToPx(0.06));

    // Vertical divider spans text column height (.bw-text-col border-left) inside centered row
    const barTop = Math.max(ry + mmToPx(0.25), blockStartY - mmToPx(0.1));
    const barBottom = Math.min(ry + rowH - mmToPx(0.32), blockStartY + blockH + mmToPx(0.1));
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = mmToPx(0.32);
    ctx.beginPath();
    ctx.moveTo(dividerX, barTop);
    ctx.lineTo(dividerX, Math.max(barTop + mmToPx(1.5), barBottom));
    ctx.stroke();

    // Bottom separator drawn on ALL spec rows including the last one above .bw-bottom-grid
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = mmToPx(0.24);
    ctx.beginPath();
    ctx.moveTo(innerX, ry + rowH - mmToPx(0.12));
    ctx.lineTo(innerX + innerW, ry + rowH - mmToPx(0.12));
    ctx.stroke();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.font = `900 ${ptToPx(keyPt)}px ${fontFamily}`;
    ctx.fillText(layout.keyText, textX, blockStartY);

    ctx.fillStyle = "#000000";
    ctx.font = `900 ${ptToPx(valPt)}px ${fontFamily}`;
    const valStartY = blockStartY + keyH + keyValGap;
    layout.lines.forEach((ln, li) => {
      ctx.fillText(ln, textX, valStartY + li * valStep);
    });
  });

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = mmToPx(0.28);
  ctx.beginPath();
  ctx.moveTo(innerX + halfW + mmToPx(0.3), panelY + mmToPx(0.35));
  ctx.lineTo(innerX + halfW + mmToPx(0.3), frameInnerBottom - mmToPx(0.2));
  ctx.stroke();

  const maxBottomAvail = bottomBoxH - mmToPx(0.45);
  const sharedBottomScale = Math.min(
    1,
    leftNatH > maxBottomAvail ? maxBottomAvail / leftNatH : 1,
    rightNatH > maxBottomAvail ? maxBottomAvail / rightNatH : 1
  );

  const drawBottomTile = (
    bx: number,
    icon: LineIconName,
    blocks: BottomBlock[],
    natH: number
  ) => {
    if (blocks.length === 0) return;
    drawLucideIcon(ctx, icons, icon, bx, panelY + (bottomBoxH - bottomIcSize) / 2, bottomIcSize);
    const tx = bx + bottomTextOffset;
    const actualTotal = natH * sharedBottomScale;
    let yCur = panelY + Math.max(mmToPx(0.22), (bottomBoxH - actualTotal) / 2);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    for (const b of blocks) {
      const ptScaled = b.pt * sharedBottomScale;
      const step = ptToPx(ptScaled) * 1.12;
      ctx.font = `${b.weight} ${ptToPx(ptScaled)}px ${fontFamily}`;
      for (const ln of b.lines) {
        ctx.fillText(ln, tx, yCur);
        yCur += step;
      }
    }
  };

  drawBottomTile(leftX, "shield", leftBlocks, leftNatH);
  drawBottomTile(rightX, "box", rightBlocks, rightNatH);

  ctx.restore();
}

export async function buildA4PageCanvases(state: AppState): Promise<HTMLCanvasElement[]> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const filledLabels = state.labels.filter((l) => l.rawText.trim().length > 0);
  const icons = await loadAllLucideIcons();

  const perPage = 9;
  const pageCount = Math.max(1, Math.ceil(filledLabels.length / perPage));
  const gapMm = state.settings.gap === "0mm" ? 0 : 2;
  const gridWMm = CARD_W_MM * 3 + gapMm * 2;
  const gridHMm = CARD_H_MM * 3 + gapMm * 2;
  const marginXMm = (A4_W_MM - gridWMm) / 2;
  const marginYMm = (A4_H_MM - gridHMm) / 2;

  const canvases: HTMLCanvasElement[] = [];

  for (let p = 0; p < pageCount; p++) {
    const canvas = document.createElement("canvas");
    canvas.width = A4_PX_W;
    canvas.height = A4_PX_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_PX_W, A4_PX_H);

    for (let slot = 0; slot < perPage; slot++) {
      const idx = p * perPage + slot;
      const entry = filledLabels[idx];
      if (!entry) continue;

      const col = slot % 3;
      const row = Math.floor(slot / 3);
      const sx = mmToPx(marginXMm + col * (CARD_W_MM + gapMm));
      const sy = mmToPx(marginYMm + row * (CARD_H_MM + gapMm));

      const parsed = getEntryParsed(entry, state.settings);
      drawCanvasLabelCard(ctx, parsed, state.settings, sx, sy, icons);

      if (state.settings.showCutLines) {
        const cardW = mmToPx(CARD_W_MM);
        const cardH = mmToPx(CARD_H_MM);
        ctx.save();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = mmToPx(0.14);
        ctx.lineCap = "round";
        ctx.setLineDash([mmToPx(1.1), mmToPx(1.0)]);

        const drawSeg = (x1: number, y1: number, x2: number, y2: number) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        };

        // 0mm bitişik modda ortak iç kenarları tek sefer çiz
        if (gapMm > 0 || row === 0) {
          drawSeg(sx, sy, sx + cardW, sy);
        }
        if (gapMm > 0 || col === 0) {
          drawSeg(sx, sy, sx, sy + cardH);
        }
        drawSeg(sx + cardW, sy, sx + cardW, sy + cardH);
        drawSeg(sx, sy + cardH, sx + cardW, sy + cardH);
        ctx.restore();
      }
    }

    canvases.push(canvas);
  }

  return canvases;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function encodeCanvasLosslessFlate(canvas: HTMLCanvasElement): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const { width, height } = canvas;
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }

  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  void writer.write(rgb);
  void writer.close();
  const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
  return compressed;
}

export async function buildPdfFromCanvases(canvases: HTMLCanvasElement[]): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;
  const encoder = new TextEncoder();

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    cursor += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    cursor += b.length;
  };

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  const pageCount = canvases.length;
  const pageKids: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageKids.push(`${3 + i * 3} 0 R`);
  }

  offsets[1] = cursor;
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets[2] = cursor;
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${pageKids.join(" ")}] /Count ${pageCount} >>\nendobj\n`);

  const ptW = 595.28;
  const ptH = 841.89;

  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const pageId = 3 + i * 3;
    const contentId = 4 + i * 3;
    const imgId = 5 + i * 3;

    const streamStr = `q ${ptW.toFixed(2)} 0 0 ${ptH.toFixed(2)} 0 0 cm /Im${i} Do Q\n`;

    offsets[pageId] = cursor;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW.toFixed(2)} ${ptH.toFixed(
        2
      )}] /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    offsets[contentId] = cursor;
    pushStr(`${contentId} 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}endstream\nendobj\n`);

    const flateBytes = await encodeCanvasLosslessFlate(canvas);
    offsets[imgId] = cursor;
    if (flateBytes) {
      pushStr(
        `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${flateBytes.length} >>\nstream\n`
      );
      pushBytes(flateBytes);
    } else {
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.99);
      const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
      pushStr(
        `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
      );
      pushBytes(jpegBytes);
    }
    pushStr("\nendstream\nendobj\n");
  }

  const xrefOffset = cursor;
  const totalObjs = 2 + pageCount * 3;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjs; id++) {
    const off = String(offsets[id] || 0).padStart(10, "0");
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(cursor);
  let pos = 0;
  for (const ch of chunks) {
    out.set(ch, pos);
    pos += ch.length;
  }
  return out;
}

export async function renderPrintPageDataUrls(state: AppState): Promise<string[]> {
  const canvases = await buildA4PageCanvases(state);
  return canvases.map((c) => c.toDataURL("image/png"));
}

export async function triggerDirectPdfDownload(state: AppState): Promise<number> {
  const canvases = await buildA4PageCanvases(state);
  const pdfBytes = await buildPdfFromCanvases(canvases);
  const blobCopy = new Uint8Array(pdfBytes);
  const blob = new Blob([blobCopy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "KONGORU_Vitrin_Etiketleri_A4.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return canvases.length;
}
