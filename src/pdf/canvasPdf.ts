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

function fitSingleLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontWeight: string,
  startPt: number,
  minPt: number,
  customFontFamily?: string
): string {
  let sizePt = startPt;
  const fontFamily =
    customFontFamily || "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";
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

  let pt = startPt;
  while (pt >= minPt) {
    ctx.font = `${fontWeight} ${ptToPx(pt)}px ${fontFamily}`;
    const lines: string[] = [];
    let line = "";
    let overflow = false;

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else if (!line) {
        overflow = true;
        break;
      } else {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines) {
          overflow = true;
          break;
        }
      }
    }

    if (!overflow && line) {
      if (ctx.measureText(line).width <= maxWidth) {
        lines.push(line);
        if (lines.length <= maxLines) {
          return { lines, pt };
        }
      }
    }
    pt = Math.round((pt - 0.3) * 10) / 10;
  }

  ctx.font = `${fontWeight} ${ptToPx(minPt)}px ${fontFamily}`;
  const mid = Math.ceil(words.length / 2);
  return {
    lines: maxLines > 1 && words.length > 1
      ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
      : [words.join(" ")],
    pt: minPt,
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
  const padX = mmToPx(0.95);
  const innerX = fx + padX;
  const innerW = fw - padX * 2;
  const fontFamily = "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(slotX, slotY, cardW, cardH);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = mmToPx(0.42);
  strokeRoundRect(ctx, fx, fy, fw, fh, mmToPx(2.0));

  let curY = fy + mmToPx(0.75);

  const titlePt = data.title.length > 34 ? 8.8 : data.title.length > 24 ? 10.4 : 12.2;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const fittedTitle = fitSingleLineText(
    ctx,
    data.title.toUpperCase(),
    innerW - mmToPx(0.6),
    "900",
    titlePt,
    5.0
  );
  ctx.fillText(fittedTitle, innerX + mmToPx(0.25), curY);
  curY += mmToPx(4.3);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = mmToPx(0.38);
  ctx.beginPath();
  ctx.moveTo(innerX, curY);
  ctx.lineTo(innerX + innerW, curY);
  ctx.stroke();
  curY += mmToPx(0.45);

  let stockW = 0;
  if (settings.showStockCode && data.stockCode) {
    ctx.font = `900 ${ptToPx(6.5)}px ${fontFamily}`;
    stockW = ctx.measureText(data.stockCode).width + mmToPx(2.0);
    const sx = innerX + innerW - stockW;
    ctx.fillStyle = "#f1f5f9";
    canvasRoundRectPath(ctx, sx, curY - mmToPx(0.05), stockW, mmToPx(3.05), mmToPx(0.45));
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = mmToPx(0.3);
    strokeRoundRect(ctx, sx, curY - mmToPx(0.05), stockW, mmToPx(3.05), mmToPx(0.45));
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(data.stockCode, sx + stockW / 2, curY + mmToPx(0.3));
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  const subAvail = innerW - (stockW ? stockW + mmToPx(0.9) : 0);
  const fittedSub = fitSingleLineText(ctx, data.subtitle, subAvail, "800", 6.9, 4.0);
  ctx.fillText(fittedSub, innerX, curY + mmToPx(0.2));
  curY += mmToPx(3.3);

  const bottomBoxH = mmToPx(10.8);
  const bottomStartY = fy + fh - mmToPx(0.5) - bottomBoxH - mmToPx(0.45);
  const specsAvailH = Math.max(mmToPx(24), bottomStartY - curY);

  const specs = data.specs.slice(0, 7);
  const iconSize = mmToPx(4.3);
  const dividerX = innerX + mmToPx(4.8) + mmToPx(0.8);
  const textX = dividerX + mmToPx(0.85);
  const textMaxW = innerX + innerW - textX;

  const wrappedSpecs = specs.map((row) =>
    wrapLinesNoEllipsis(ctx, row.v, textMaxW, 2, "900", 7.3, 5.4, fontFamily)
  );
  const weights = wrappedSpecs.map((w) => (w.lines.length >= 2 ? 1.28 : 1.0));
  const totalWeight = Math.max(1, weights.reduce((a, b) => a + b, 0));
  const rowHeights = weights.map((w, idx) => {
    const cap = wrappedSpecs[idx].lines.length >= 2 ? mmToPx(9.6) : mmToPx(7.8);
    return Math.min(cap, (specsAvailH * w) / totalWeight);
  });

  let rowTopY = curY;
  specs.forEach((row, i) => {
    const rowH = rowHeights[i];
    const ry = rowTopY;
    rowTopY += rowH;

    drawLucideIcon(ctx, icons, row.icon, innerX + mmToPx(0.15), ry + Math.max(0, (rowH - iconSize) / 2), iconSize);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = mmToPx(0.32);
    ctx.beginPath();
    ctx.moveTo(dividerX, ry + mmToPx(0.25));
    ctx.lineTo(dividerX, ry + rowH - mmToPx(0.25));
    ctx.stroke();

    if (i < specs.length - 1) {
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = mmToPx(0.24);
      ctx.beginPath();
      ctx.moveTo(innerX, ry + rowH - mmToPx(0.1));
      ctx.lineTo(innerX + innerW, ry + rowH - mmToPx(0.1));
      ctx.stroke();
    }

    const { lines, pt } = wrappedSpecs[i];
    const keyPt = lines.length >= 2 && rowH < mmToPx(8.2) ? 7.8 : 8.2;
    const keyH = ptToPx(keyPt) * 1.02;
    const valLineH = ptToPx(pt) * 1.04;
    const lineStep = ptToPx(pt) * 1.08;
    const keyValGap = mmToPx(0.14);
    const valH = lines.length >= 2 ? valLineH + lineStep : valLineH;
    const blockH = keyH + keyValGap + valH;
    const blockStartY = ry + Math.max(mmToPx(0.15), (rowH - blockH) / 2);

    ctx.fillStyle = "#000000";
    ctx.font = `900 ${ptToPx(keyPt)}px ${fontFamily}`;
    ctx.fillText(row.k, textX, blockStartY);

    ctx.fillStyle = "#000000";
    ctx.font = `900 ${ptToPx(pt)}px ${fontFamily}`;
    const valStartY = blockStartY + keyH + keyValGap;
    lines.forEach((ln, li) => {
      ctx.fillText(ln, textX, valStartY + li * lineStep);
    });
  });

  const halfW = (innerW - mmToPx(0.6)) / 2;
  const panelY = fy + fh - mmToPx(0.5) - bottomBoxH;
  const leftX = innerX;
  const rightX = innerX + halfW + mmToPx(0.6);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = mmToPx(0.28);
  ctx.beginPath();
  ctx.moveTo(innerX + halfW + mmToPx(0.3), panelY + mmToPx(0.45));
  ctx.lineTo(innerX + halfW + mmToPx(0.3), panelY + bottomBoxH - mmToPx(0.45));
  ctx.stroke();

  const drawBottomTile = (bx: number, icon: LineIconName, title: string, line1: string, line2: string) => {
    if (!title && !line1 && !line2) return;
    const icSize = mmToPx(3.3);
    drawLucideIcon(ctx, icons, icon, bx, panelY + (bottomBoxH - icSize) / 2, icSize);
    const tx = bx + mmToPx(3.7);
    const tw = halfW - mmToPx(3.85);

    if (title) {
      ctx.fillStyle = "#000000";
      ctx.fillText(fitSingleLineText(ctx, title, tw, "900", 5.9, 4.5), tx, panelY + mmToPx(0.75));
    }

    if (line1) {
      ctx.fillStyle = "#000000";
      ctx.fillText(fitSingleLineText(ctx, line1, tw, "900", 6.1, 4.5), tx, panelY + mmToPx(3.5));
    }

    if (line2) {
      ctx.fillStyle = "#000000";
      ctx.fillText(fitSingleLineText(ctx, line2, tw, "800", 5.7, 4.3), tx, panelY + mmToPx(6.4));
    }
  };

  drawBottomTile(leftX, "shield", data.warrantyTitle, data.warrantyDuration, data.warrantyDetail);
  drawBottomTile(rightX, "box", data.boxTitle, data.boxLine1, data.boxLine2);

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
