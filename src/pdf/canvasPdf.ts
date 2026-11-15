import { BRAND_LOGO_DATA_URI } from "../assets/brandLogo";
import type { LineIconName } from "../assets/lineIcons";
import { applyOverrides, parseAdDescription } from "../parser";
import type { AppSettings, AppState, LabelEntry, ParsedLabel } from "../types/label";

const DPI = 300;
const A4_W_MM = 210;
const A4_H_MM = 297;
const CARD_W_MM = 60;
const CARD_H_MM = 79;

export const A4_PX_W = Math.round((A4_W_MM / 25.4) * DPI); // 2480
export const A4_PX_H = Math.round((A4_H_MM / 25.4) * DPI); // 3508

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

export function drawCanvasIcon(
  ctx: CanvasRenderingContext2D,
  type: LineIconName,
  x: number,
  y: number,
  size: number
): void {
  const u = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(u, u);
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (type) {
    case "cpu": {
      strokeRoundRect(ctx, 6, 6, 12, 12, 1.5);
      ctx.strokeRect(9.5, 9.5, 5, 5);
      ctx.beginPath();
      ctx.moveTo(9.5, 2.5); ctx.lineTo(9.5, 6);
      ctx.moveTo(14.5, 2.5); ctx.lineTo(14.5, 6);
      ctx.moveTo(9.5, 18); ctx.lineTo(9.5, 21.5);
      ctx.moveTo(14.5, 18); ctx.lineTo(14.5, 21.5);
      ctx.moveTo(2.5, 9.5); ctx.lineTo(6, 9.5);
      ctx.moveTo(2.5, 14.5); ctx.lineTo(6, 14.5);
      ctx.moveTo(18, 9.5); ctx.lineTo(21.5, 9.5);
      ctx.moveTo(18, 14.5); ctx.lineTo(21.5, 14.5);
      ctx.stroke();
      break;
    }
    case "gpu": {
      ctx.beginPath();
      ctx.moveTo(2, 5.5); ctx.lineTo(4.5, 5.5); ctx.lineTo(4.5, 18.5);
      ctx.stroke();
      strokeRoundRect(ctx, 4.5, 6.5, 17, 10.5, 1.5);
      ctx.beginPath();
      ctx.arc(14.5, 11.75, 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(14.5, 11.75, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 9.5); ctx.lineTo(8, 14);
      ctx.stroke();
      break;
    }
    case "ram": {
      strokeRoundRect(ctx, 2.5, 7, 19, 9, 1.2);
      ctx.beginPath();
      ctx.moveTo(7.5, 7); ctx.lineTo(7.5, 16);
      ctx.moveTo(12, 7); ctx.lineTo(12, 16);
      ctx.moveTo(16.5, 7); ctx.lineTo(16.5, 16);
      ctx.stroke();
      break;
    }
    case "ssd": {
      strokeRoundRect(ctx, 3, 5, 18, 14, 2);
      ctx.font = "900 7px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("SSD", 12, 14.5);
      break;
    }
    case "screen": {
      strokeRoundRect(ctx, 3.5, 4.5, 17, 11.5, 1.2);
      ctx.beginPath();
      ctx.moveTo(12, 16); ctx.lineTo(12, 19);
      ctx.moveTo(6, 19); ctx.lineTo(18, 19);
      ctx.stroke();
      break;
    }
    case "battery": {
      ctx.strokeRect(9.5, 2.5, 5, 2);
      strokeRoundRect(ctx, 6.5, 4.5, 11, 17, 1.8);
      ctx.beginPath();
      ctx.moveTo(12.6, 8);
      ctx.lineTo(9.6, 13);
      ctx.lineTo(12.1, 13);
      ctx.lineTo(11.4, 17.5);
      ctx.lineTo(14.4, 12.5);
      ctx.lineTo(11.9, 12.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "extras": {
      ctx.beginPath();
      ctx.moveTo(12, 3);
      ctx.lineTo(19.5, 7.3);
      ctx.lineTo(19.5, 16.7);
      ctx.lineTo(12, 21);
      ctx.lineTo(4.5, 16.7);
      ctx.lineTo(4.5, 7.3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "mobo": {
      strokeRoundRect(ctx, 4, 3.5, 16, 17, 1.6);
      strokeRoundRect(ctx, 7.5, 7, 5.5, 5.5, 0.8);
      ctx.beginPath();
      ctx.moveTo(16, 7); ctx.lineTo(16, 11);
      ctx.moveTo(18, 7); ctx.lineTo(18, 11);
      ctx.moveTo(7.5, 16.5); ctx.lineTo(13.5, 16.5);
      ctx.moveTo(16.5, 14); ctx.lineTo(16.5, 17.5);
      ctx.stroke();
      break;
    }
    case "psu": {
      strokeRoundRect(ctx, 3.5, 5, 17, 14, 2);
      ctx.beginPath();
      ctx.arc(9.5, 12, 3.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(15.8, 8.5);
      ctx.lineTo(14.3, 11.8);
      ctx.lineTo(16.4, 11.8);
      ctx.lineTo(14.9, 15.5);
      ctx.stroke();
      break;
    }
    case "shield": {
      ctx.beginPath();
      ctx.moveTo(12, 2.5);
      ctx.lineTo(19.5, 5.7);
      ctx.lineTo(19.5, 11.5);
      ctx.bezierCurveTo(19.5, 16.4, 16.3, 20.6, 12, 22);
      ctx.bezierCurveTo(7.7, 20.6, 4.5, 16.4, 4.5, 11.5);
      ctx.lineTo(4.5, 5.7);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8.8, 12.2);
      ctx.lineTo(11.1, 14.5);
      ctx.lineTo(15.5, 9.9);
      ctx.stroke();
      break;
    }
    case "box": {
      ctx.lineWidth = 1.95;
      ctx.beginPath();
      ctx.moveTo(12, 2.8);
      ctx.lineTo(20, 7.2);
      ctx.lineTo(20, 16.8);
      ctx.lineTo(12, 21.2);
      ctx.lineTo(4, 16.8);
      ctx.lineTo(4, 7.2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 12); ctx.lineTo(20, 7.2);
      ctx.moveTo(12, 12); ctx.lineTo(4, 7.2);
      ctx.moveTo(12, 12); ctx.lineTo(12, 21.2);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function fitSingleLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontWeight: string,
  startPt: number,
  minPt: number
): string {
  let sizePt = startPt;
  const fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  while (sizePt > minPt) {
    ctx.font = `${fontWeight} ${ptToPx(sizePt)}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return text;
    sizePt -= 0.4;
  }
  ctx.font = `${fontWeight} ${ptToPx(minPt)}px ${fontFamily}`;
  let out = text;
  while (out.length > 3 && ctx.measureText(out + "...").width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out === text ? text : out.trimEnd() + "...";
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  const consumedWordCount = lines.join(" ").split(/\s+/).filter(Boolean).length;
  const remainingWords = words.slice(consumedWordCount);
  if (remainingWords.length > 0) {
    let last = remainingWords.join(" ");
    while (last.length > 3 && ctx.measureText(last + "...").width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines.push(last === remainingWords.join(" ") ? last : last.trimEnd() + "...");
  } else if (line) {
    lines.push(line);
  }

  return lines.slice(0, maxLines);
}

let cachedLogoPromise: Promise<HTMLImageElement | null> | null = null;

function loadBrandLogo(): Promise<HTMLImageElement | null> {
  if (cachedLogoPromise) return cachedLogoPromise;
  cachedLogoPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = BRAND_LOGO_DATA_URI;
  });
  return cachedLogoPromise;
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
  logoImg: HTMLImageElement | null
): void {
  const cardW = mmToPx(CARD_W_MM);
  const cardH = mmToPx(CARD_H_MM);
  const outerPad = mmToPx(1.5);
  const fx = slotX + outerPad;
  const fy = slotY + outerPad;
  const fw = cardW - outerPad * 2;
  const fh = cardH - outerPad * 2;
  const padX = mmToPx(1.8);
  const innerX = fx + padX;
  const innerW = fw - padX * 2;
  const fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";

  ctx.save();
  // Card white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(slotX, slotY, cardW, cardH);

  // Outer frame
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = mmToPx(0.42);
  strokeRoundRect(ctx, fx, fy, fw, fh, mmToPx(1.7));

  let curY = fy + mmToPx(1.5);

  // Title line
  const titlePt = data.title.length > 34 ? 7.8 : data.title.length > 24 ? 9.0 : 10.4;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const fittedTitle = fitSingleLineText(ctx, data.title.toUpperCase(), innerW - mmToPx(1.5), "900", titlePt, 6.8);
  ctx.fillText(fittedTitle, innerX + mmToPx(0.6), curY);
  curY += mmToPx(4.5);

  // Header divider line
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = mmToPx(0.42);
  ctx.beginPath();
  ctx.moveTo(innerX, curY);
  ctx.lineTo(innerX + innerW, curY);
  ctx.stroke();
  curY += mmToPx(0.9);

  // Subtitle + Stock code badge row
  let stockW = 0;
  if (settings.showStockCode && data.stockCode) {
    ctx.font = `700 ${ptToPx(6.1)}px ${fontFamily}`;
    stockW = ctx.measureText(data.stockCode).width + mmToPx(2.8);
    const sx = innerX + innerW - stockW;
    ctx.fillStyle = "#f1f5f9";
    canvasRoundRectPath(ctx, sx, curY - mmToPx(0.2), stockW, mmToPx(3.6), mmToPx(0.6));
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = mmToPx(0.24);
    strokeRoundRect(ctx, sx, curY - mmToPx(0.2), stockW, mmToPx(3.6), mmToPx(0.6));
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText(data.stockCode, sx + stockW / 2, curY + mmToPx(0.45));
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#334155";
  const subAvail = innerW - (stockW ? stockW + mmToPx(1.4) : 0);
  const fittedSub = fitSingleLineText(ctx, data.subtitle, subAvail, "700", 6.4, 5.2);
  ctx.fillText(fittedSub, innerX, curY + mmToPx(0.35));
  curY += mmToPx(4.2);

  // Reserve bottom panel height without overlapping specs
  const bottomBoxH = mmToPx(12.2);
  const bottomStartY = fy + fh - mmToPx(1.0) - bottomBoxH - mmToPx(1.2);
  const specsAvailH = Math.max(mmToPx(24), bottomStartY - curY);

  // Spec rows (up to 7 rows)
  const specs = data.specs.slice(0, 7);
  const rowCount = Math.max(1, specs.length);
  const rowH = Math.min(mmToPx(7.4), specsAvailH / rowCount);
  const iconSize = mmToPx(4.4);
  const dividerX = innerX + mmToPx(5.2) + mmToPx(1.2);
  const textX = dividerX + mmToPx(1.1);
  const textMaxW = innerX + innerW - textX;

  specs.forEach((row, i) => {
    const ry = curY + i * rowH;
    drawCanvasIcon(ctx, row.icon, innerX + mmToPx(0.3), ry + Math.max(0, (rowH - iconSize) / 2), iconSize);

    // Vertical bar next to icon matching CSS .bw-text-col border-left
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = mmToPx(0.25);
    ctx.beginPath();
    ctx.moveTo(dividerX, ry + mmToPx(0.35));
    ctx.lineTo(dividerX, ry + rowH - mmToPx(0.35));
    ctx.stroke();

    // Horizontal separator below every row except last matching .bw-spec-row border-bottom
    if (i < specs.length - 1) {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = mmToPx(0.2);
      ctx.beginPath();
      ctx.moveTo(innerX, ry + rowH - mmToPx(0.1));
      ctx.lineTo(innerX + innerW, ry + rowH - mmToPx(0.1));
      ctx.stroke();
    }

    ctx.fillStyle = "#000000";
    ctx.font = `800 ${ptToPx(5.55)}px ${fontFamily}`;
    ctx.fillText(row.k, textX, ry + mmToPx(0.25));

    ctx.fillStyle = "#1f2937";
    ctx.font = `500 ${ptToPx(5.25)}px ${fontFamily}`;
    const lines = wrapLines(ctx, row.v, textMaxW, 2);
    const lineStep = mmToPx(2.15);
    const valStartY = ry + mmToPx(2.15);
    if (lines.length === 2 && rowH < mmToPx(6.3)) {
      const fittedOne = fitSingleLineText(ctx, row.v, textMaxW, "600", 5.2, 4.3);
      ctx.fillText(fittedOne, textX, valStartY);
    } else {
      lines.forEach((ln, li) => {
        ctx.fillText(ln, textX, valStartY + li * lineStep);
      });
    }
  });

  // Bottom 2-column Guarantee + Box panel matching CSS .bw-bottom-grid
  const halfW = (innerW - mmToPx(0.8)) / 2;
  const panelY = fy + fh - mmToPx(0.9) - bottomBoxH;
  const leftX = innerX;
  const rightX = innerX + halfW + mmToPx(0.8);

  ctx.strokeStyle = "#888888";
  ctx.lineWidth = mmToPx(0.22);
  ctx.beginPath();
  ctx.moveTo(innerX + halfW + mmToPx(0.35), panelY + mmToPx(0.6));
  ctx.lineTo(innerX + halfW + mmToPx(0.35), panelY + bottomBoxH - mmToPx(0.6));
  ctx.stroke();

  const drawBottomTile = (bx: number, icon: LineIconName, title: string, line1: string, line2: string) => {
    const icSize = mmToPx(3.3);
    drawCanvasIcon(ctx, icon, bx, panelY + (bottomBoxH - icSize) / 2, icSize);
    const tx = bx + mmToPx(4.0);
    const tw = halfW - mmToPx(4.3);

    ctx.fillStyle = "#000000";
    ctx.fillText(fitSingleLineText(ctx, title, tw, "800", 5.05, 4.2), tx, panelY + mmToPx(1.2));

    ctx.fillStyle = "#111111";
    ctx.fillText(fitSingleLineText(ctx, line1, tw, "700", 5.15, 4.2), tx, panelY + mmToPx(3.9));

    ctx.fillStyle = "#374151";
    ctx.fillText(fitSingleLineText(ctx, line2, tw, "500", 4.75, 3.9), tx, panelY + mmToPx(6.8));
  };

  drawBottomTile(leftX, "shield", data.warrantyTitle, data.warrantyDuration, data.warrantyDetail);
  drawBottomTile(rightX, "box", data.boxTitle, data.boxLine1, data.boxLine2);
  void logoImg;

  ctx.restore();
}

export async function buildA4PageCanvases(state: AppState): Promise<HTMLCanvasElement[]> {
  const filledLabels = state.labels.filter((l) => l.rawText.trim().length > 0);
  const logoImg = await loadBrandLogo();

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
      drawCanvasLabelCard(ctx, parsed, state.settings, sx, sy, logoImg);

      if (state.settings.showCutLines) {
        const cardW = mmToPx(CARD_W_MM);
        const cardH = mmToPx(CARD_H_MM);
        ctx.save();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = mmToPx(0.2);
        ctx.setLineDash([mmToPx(1.2), mmToPx(1.0)]);
        ctx.strokeRect(sx, sy, cardW, cardH);
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

export function buildPdfFromCanvases(canvases: HTMLCanvasElement[]): Uint8Array {
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

  // 1: Catalog, 2: Pages
  // Per page i: pageObjId = 3 + i*3, contentObjId = 4 + i*3, imgObjId = 5 + i*3
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

  canvases.forEach((canvas, i) => {
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.94);
    const jpegBytes = dataUrlToUint8Array(jpegDataUrl);

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

    offsets[imgId] = cursor;
    pushStr(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr("\nendstream\nendobj\n");
  });

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
  const pdfBytes = buildPdfFromCanvases(canvases);
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
