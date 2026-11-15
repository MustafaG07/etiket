import { cleanBulletText, foldTrI } from "./turkish";

/**
 * Splits multi-ad text blocks only on explicit divider lines (`---`, `===`, `***`).
 */
export function splitMultipleAds(rawText: string): string[] {
  const normalized = String(rawText || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of normalized.split("\n")) {
    if (/^\s*(?:---|===|\*\*\*+)\s*$/.test(line)) {
      const joined = current.join("\n").trim();
      if (joined) blocks.push(joined);
      current = [];
    } else {
      current.push(line);
    }
  }
  const tail = current.join("\n").trim();
  if (tail) blocks.push(tail);

  return blocks.length > 0 ? blocks : [normalized];
}

/**
 * Returns true if a line is store/location/marketing/shipping/status boilerplate
 * rather than actual hardware specifications.
 */
export function isNonComputerFeatureLine(rawLine: string): boolean {
  const cleaned = cleanBulletText(rawLine);
  if (!cleaned) return true;

  const t = foldTrI(cleaned);

  // Explicit desktop disclaimer that mentions "Ekran Kartı" without actually naming any GPU model!
  if (/ekran\s+kart[iı]\s+dahil\s+t[uü]m\s+par[cç]alar/i.test(t)) return true;
  if (/ekran\s+kart[iı]\s+kapal[iı]\s+kutu\s+demonte/i.test(t)) return true;
  if (/kapal[iı]\s+kutu\s+demonte\s+[sş]ekildedir/i.test(t)) return true;
  if (/demonte\s+(?:olarak\s+)?g[oö]nderil/i.test(t)) return true;

  // Store / location / contact / meta lines
  if (/^(?:kongoru|serdivan|sakarya|istanbul|ankara|izmir|bursa|kocaeli|konum|adres|ma[gğ]aza)\b/i.test(t)) {
    return true;
  }
  if (/^(?:[a-zçğıöşü\s]{2,25}\s*\/\s*[a-zçğıöşü\s]{2,25})$/i.test(t) && !/(?:gb|tb|rtx|gtx|rx|ram|ssd|ddr)/i.test(t)) {
    return true;
  }
  if (/^(?:stok\s*kodu|ilan\s*no|fiyat|ücret|ucret|tutar|kimden|durumu|takas|konum|telefon|tel|ileti[sş]im|whatsapp)\b/i.test(t)) {
    return true;
  }
  if (/^(?:\+?90\s*)?0?\s*5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}$/.test(cleaned)) {
    return true;
  }
  if (/^(?:\d{1,3}(?:[.,]\d{3})+|\d{4,7})\s*(?:tl|₺|usd|\$|eur|€)$/i.test(cleaned)) {
    return true;
  }
  if (/^https?:\/\//i.test(cleaned) || /sahibinden\.com/i.test(t)) {
    return true;
  }

  // Marketing / generic prose without concrete hardware tokens
  const hasHardwareSignal =
    /(?:i[3579][-\s]?\d{4,5}|ryzen\s*(?:[3579]|ai)|ultra\s+[3579]|apple\s+m[1-5]|\bm[1-5]\s*(?:pro|max|ultra|[cç]ip|chip)|\brtx\b|\bgtx\b|\brx\s*\d{3,4}|arc\s*[ab]\d{3}|\d+\s*(?:gb|tb|mhz|hz|w\b|mm\b)|nvme|ddr[345]|lpddr|anakart|b\d{3}|h\d{3}|z\d{3}|x\d{3}|a\d{3}|psu|g[uü][cç]\s+kayna[gğ][iı]|s[iı]v[iı]\s+so[gğ]ut|hava\s+so[gğ]ut|kule\s+tipi|win(?:dows)?\s*1[01]|freedos|parmak\s*izi|mux\s*switch|klavye|thunderbolt|face\s*id|y[uü]z\s*tan[iı]ma)/i.test(
      t
    );

  if (
    !hasHardwareSignal &&
    /(?:hayırlı\s+olsun|alıcısına|pazarlık|kredi\s+kart[ıi]|taksit|elden\s+teslim|mağazamızda|mağazamızdan|diğer\s+ilan|termal\s+macun|bakımları|temiz\s+kullanılmış|kozmetik|test\s+edil|kurulumu\s+yapıl|format\s+atıl|memnuniyet|güvenilir|ücretsiz\s+kargo)/i.test(
      t
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts and cleans warranty detail text for bottom-left badge on label.
 */
export function cleanWarrantyDetailText(text: string): string {
  const s = cleanBulletText(text)
    .replace(/\b(?:durumu|garantisi|garanti)\s*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  return s.length > 52 ? s.slice(0, 49).trim() + "..." : s;
}

export interface WarrantyBoxExtraction {
  warrantyTitle: string;
  warrantyDuration: string;
  warrantyDetail: string;
  boxTitle: string;
  boxLine1: string;
  boxLine2: string;
}

export function extractWarrantyAndBox(lines: string[], defaultOrg: string): WarrantyBoxExtraction {
  let warrantyDuration = "";
  let warrantyDetail = "";
  let hasBox = false;
  let hasInvoice = false;
  let hasCharger = false;
  let hasBag = false;
  let hasMouse = false;
  let isBrandNewSealed = false;
  let hasDemonteGpu = false;
  let customBoxNotes: string[] = [];

  for (const raw of lines) {
    const cleaned = cleanBulletText(raw);
    if (!cleaned) continue;
    const t = foldTrI(cleaned);

    // Check brand-new / warranty mentions
    const hasYearMonth = t.match(
      /(\d+\s*(?:y[iı]l|sene|ay))(?:\s+(?:resmi|distrib[uü]t[oö]r|t[uü]rkiye|firma|ma[gğ]aza|apple|lenovo|asus|hp|msi|monster|yetkili|servis))*\s*garanti/i
    );
    if (hasYearMonth) {
      warrantyDuration = hasYearMonth[1]
        .replace(/yil/i, "Yıl")
        .replace(/sene/i, "Yıl")
        .replace(/ay/i, "Ay")
        .replace(/\s+/g, " ")
        .trim() + " Garantili";
    } else if (/garanti\s*:\s*var,?\s*devam\s+ediyor/i.test(t) || /devam\s+ediyor/i.test(t)) {
      if (!warrantyDuration) warrantyDuration = "Garantisi Devam Ediyor";
    } else if (/t[uü]m\s+par[cç]alar\s+s[iı]f[iı]r\s+ve\s+garantili/i.test(t) || (/s[iı]f[iı]r/i.test(t) && /garantili/i.test(t))) {
      if (!warrantyDuration) warrantyDuration = "Sıfır · Garantili";
      isBrandNewSealed = true;
    } else if (/firma\s+garanti/i.test(t)) {
      if (!warrantyDuration) warrantyDuration = "Firma Garantili";
    } else if (/resmi\s+distrib[uü]t[oö]r|t[uü]rkiye\s+garantili/i.test(t)) {
      if (!warrantyDuration) warrantyDuration = "TR Distribütör Garantili";
    } else if (/\bgarantili\b/i.test(t) && !warrantyDuration) {
      warrantyDuration = "Garantili";
    }

    if (/distrib[uü]t[oö]r|yetkili\s+servis|fatural[iı]\s+garanti|kongoru\s+firma/i.test(t)) {
      warrantyDetail = cleanWarrantyDetailText(cleaned);
    }

    // Check box / invoice / accessories
    if (/kutu\s*(?:ve|\+|\/|&)?\s*fatura/i.test(t) || /kutulu\s+fatural[iı]/i.test(t)) {
      hasBox = true;
      hasInvoice = true;
    } else {
      if (/(?:orijinal\s+)?kutu(?:su|lu)?\b/i.test(t) && !/kapal[iı]\s+kutu\s+demonte/i.test(t)) hasBox = true;
      if (/\bfatura(?:s[iı]|l[iı])?\b/i.test(t)) hasInvoice = true;
    }
    if (/kapal[iı]\s+kutu\s+demonte/i.test(t)) {
      hasDemonteGpu = true;
    } else if (/kapal[iı]\s+kutu|a[cç][iı]lmam[iı][sş]/i.test(t)) {
      isBrandNewSealed = true;
      hasBox = true;
    }

    if (/[sş]arj\s*(?:aleti|adapt[oö]r[uü]|cihaz[iı])|orijinal\s+adapt[oö]r|type-?c\s+adapt[oö]r/i.test(t)) {
      hasCharger = true;
    }
    if (/[cç]anta(?:s[iı])?\s*(?:hediye|mevcut|dahil|var)/i.test(t)) {
      hasBag = true;
    }
    if (/mouse\s*(?:hediye|mevcut|dahil|var)/i.test(t)) {
      hasMouse = true;
    }
  }

  // Fallback defaults matching Kongoru clean template
  if (!warrantyDuration) {
    warrantyDuration = isBrandNewSealed ? "Sıfır · Garantili" : "2. El / Kontrol Edilmiş";
  }
  if (!warrantyDetail) {
    warrantyDetail = isBrandNewSealed
      ? "Resmi Distribütör / Kongoru Güvencesi"
      : defaultOrg || "Kongoru Firma Garantisi";
  }

  let boxLine1 = "";
  let boxLine2 = "";

  if (hasBox && hasInvoice) {
    boxLine1 = "Orijinal Kutu · Fatura";
  } else if (hasBox) {
    boxLine1 = "Orijinal Kutulu";
  } else if (hasInvoice) {
    boxLine1 = "Faturalı";
  } else if (hasCharger) {
    boxLine1 = "Orijinal Şarj Aleti";
  } else {
    boxLine1 = "Mağaza Test & Kontrolü Tam";
  }

  if (hasDemonteGpu) {
    boxLine2 = "Ekran Kartı Kapalı Kutu Demonte";
  } else if (hasCharger && (hasBox || hasInvoice)) {
    boxLine2 = "Orijinal Şarj Adaptörü Dahil";
  } else if (hasBag || hasMouse) {
    const giftParts = [];
    if (hasBag) giftParts.push("Çanta");
    if (hasMouse) giftParts.push("Mouse");
    boxLine2 = giftParts.join(" · ") + " Hediyeli";
  } else if (isBrandNewSealed) {
    boxLine2 = "Tüm Parçalar Sıfır & Adınıza Fatura";
  } else {
    boxLine2 = customBoxNotes[0] || "Tam Bakımlı & Kullanıma Hazır";
  }

  return {
    warrantyTitle: "GARANTİ DURUMU",
    warrantyDuration,
    warrantyDetail,
    boxTitle: "KUTU & İÇERİK",
    boxLine1,
    boxLine2,
  };
}
