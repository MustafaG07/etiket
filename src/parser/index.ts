import type { LabelOverrides, ParsedLabel, SpecRow } from "../types/label";
import {
  extractWarrantyAndBox,
  isNonComputerFeatureLine,
  splitMultipleAds,
} from "./boilerplateFilter";
import {
  detectIsDesktopAd,
  isCoolingSpecText,
  isMoboSpecText,
  isPcCaseSpecText,
  isPsuSpecText,
} from "./desktopDetect";
import { extractCpuFromSegment } from "./extractors/cpu";
import {
  extractCaseValue,
  extractCoolingValue,
  extractMoboValue,
  extractPsuValue,
} from "./extractors/desktopParts";
import { extractGpuFromSegment } from "./extractors/gpu";
import { extractRamStrict, extractShorthandRamSsd } from "./extractors/ram";
import {
  extractBatteryValue,
  extractExtrasTokens,
  extractScreenValue,
} from "./extractors/screenBattery";
import { extractStorageStrict } from "./extractors/storage";
import { cleanBulletText, foldTrAscii, foldTrI, stripAdFiller, trUpper } from "./turkish";

export { splitMultipleAds };

const SAHIBINDEN_TABLE_KEYS: Record<string, string> = {
  islemci: "cpu",
  cpu: "cpu",
  processor: "cpu",
  "ekran karti": "gpu",
  gpu: "gpu",
  vga: "gpu",
  "ekran karti hafizasi": "vram",
  ram: "ram",
  bellek: "ram",
  "ram bellek": "ram",
  "ram (sistem bellegi)": "ram",
  ssd: "ssd",
  "sabit disk": "ssd",
  "sabit disk (ssd)": "ssd",
  depolama: "ssd",
  hdd: "ssd",
  disk: "ssd",
  "ekran boyutu": "screen",
  ekran: "screen",
  cozunurluk: "screen_res",
  anakart: "mobo",
  motherboard: "mobo",
  sogutma: "cooler",
  "islemci sogutucu": "cooler",
  "guc kaynagi": "psu",
  psu: "psu",
  kasa: "case",
  "kasa tipi": "case",
  batarya: "battery",
  pil: "battery",
  "pil durumu": "battery",
  garanti: "warranty",
  "garanti durumu": "warranty",
  "stok kodu": "stockCode",
  "urun kodu": "stockCode",
};

interface ExtractedFields {
  cpu: string;
  gpu: string;
  ram: string;
  ssd: string;
  screen: string;
  battery: string;
  mobo: string;
  cooler: string;
  psu: string;
  pcCase: string;
  extras: string[];
  vramHint: string;
}

function normalizeTableKey(rawKey: string): string | null {
  const k = foldTrAscii(cleanBulletText(rawKey))
    .replace(/[:\t]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (SAHIBINDEN_TABLE_KEYS[k]) return SAHIBINDEN_TABLE_KEYS[k];
  return null;
}

function extractStockCode(lines: string[]): string {
  for (const raw of lines) {
    const cleaned = cleanBulletText(raw);
    if (!cleaned) continue;
    const explicit = cleaned.match(/^(?:stok|ürün|urun|ilan)?\s*kodu\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{1,20})$/i);
    if (explicit) {
      return explicit[1].toUpperCase();
    }
    const inline = foldTrI(cleaned).match(/stok\s*kodu\s*[:#-]?\s*([a-z0-9][a-z0-9._/-]{1,20})/i);
    if (inline) {
      return inline[1].toUpperCase();
    }
    if (/^[A-Z]{1,3}-\d{2,5}$/i.test(cleaned)) {
      return cleaned.toUpperCase();
    }
  }
  return "";
}

function splitHeaderTitleAndTail(firstLine: string): { title: string; tailSegments: string[] } {
  const cleaned = cleanBulletText(firstLine);
  if (!cleaned) return { title: "", tailSegments: [] };

  // Split by pipe `|`, bullet `•`, spaced slash ` / ` (not 16/512!), or spaced dash ` - ` / ` – ` / ` — `
  const parts = cleaned
    .split(/\s*(?:\||•|\s+\/\s+|(?<=\S)\s+[-–—]\s+(?=\S))\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    // Handle unpiped inline spec headers (e.g. "HP VICTUS 16 RTX 4060 İ5-14500HX 16GB RAM 1TB SSD ...")
    const folded = foldTrI(cleaned);
    const inlineSpecMatch = folded.match(
      /(?:nvidia|geforce|rtx\s*\d|gtx\s*\d|intel\s+core|core\s+ultra|ultra\s+[3579]|\bi[3579][-\s]?\d{4,5}\b|ryzen\s*[3579]|\br[3579][-\s]?\d{4}\b|\d+\s*(?:gb|tb)\s*(?:ram|ssd|nvme|ddr))/i
    );
    if (inlineSpecMatch && typeof inlineSpecMatch.index === "number" && inlineSpecMatch.index >= 5) {
      const prefix = stripAdFiller(cleaned.slice(0, inlineSpecMatch.index).trim());
      const rest = cleaned.slice(inlineSpecMatch.index).trim();
      if (prefix && rest) {
        return { title: prefix, tailSegments: [rest] };
      }
    }
    const cleanTitle = stripAdFiller(cleaned);
    return { title: cleanTitle || cleaned, tailSegments: [] };
  }

  const head = stripAdFiller(parts[0]) || parts[0];
  return {
    title: head,
    tailSegments: parts.slice(1),
  };
}

function inferSubtitle(title: string, fullText: string, isDesktop: boolean): string {
  const combined = foldTrI(`${title} ${fullText}`);

  if (isDesktop) {
    if (/(?:workstation|render|xeon|quadro|rtx\s+[at]\d{3,4}|threadripper)/i.test(combined)) {
      return "WORKSTATION SİSTEM";
    }
    if (/(?:gaming|oyuncu|rtx|gtx|rx\s*\d{3,4}|x3d|argb|s[iı]v[iı]\s+so[gğ]ut)/i.test(combined)) {
      return "GAMING SİSTEM";
    }
    return "MASAÜSTÜ BİLGİSAYAR";
  }

  if (/\bmacbook\s+pro\b/i.test(combined)) return "APPLE MACBOOK PRO";
  if (/\bmacbook\s+air\b/i.test(combined)) return "APPLE MACBOOK AIR";
  if (/\bmacbook\b/i.test(combined)) return "APPLE MACBOOK";

  if (/(?:workstation|precision|zbook|thinkpad\s+p\d|quadro|rtx\s+[at]\d{3,4})/i.test(combined)) {
    return "İŞ İSTASYONU / WORKSTATION";
  }
  if (
    /(?:gaming|oyuncu|rog\b|tuf\b|legion\b|\bloq\b|victus\b|omen\b|nitro\b|predator\b|cyborg\b|katana\b|pulse\b|abra\b|tulpar\b|excalibur\b|alienware\b|razer\s+blade|\brtx\b|\bgtx\b)/i.test(
      combined
    )
  ) {
    return "GAMING LAPTOP";
  }
  if (/(?:thinkpad|latitude|elitebook|probook|ultrabook|xps|zenbook)/i.test(combined)) {
    return "İŞ & ULTRABOOK";
  }
  return "TAŞINABİLİR BİLGİSAYAR";
}

function processSegmentIntoFields(seg: string, fields: ExtractedFields, hintKey?: string): void {
  const cleaned = cleanBulletText(seg);
  if (!cleaned) return;
  if (!hintKey && isNonComputerFeatureLine(cleaned)) return;

  if (hintKey === "vram") {
    const m = cleaned.match(/\b(\d{1,2})\s*gb\b/i);
    if (m) fields.vramHint = `${m[1]} GB`;
    return;
  }
  if (hintKey === "screen_res") {
    const res = extractScreenValue(cleaned);
    if (res && !fields.screen.includes(res)) {
      fields.screen = fields.screen ? `${fields.screen} ${res}` : res;
    }
    return;
  }

  // Handle multi-key single line separated by `|` or `•`
  if (!hintKey && (cleaned.includes("|") || cleaned.includes("•"))) {
    for (const part of cleaned.split(/\s*[|•]\s*/)) {
      processSegmentIntoFields(part, fields);
    }
    return;
  }

  // Handle `+`-joined mixed component segments (e.g. "RTX 4060 + İ7-13620H + 16GB DDR5 + 512GB SSD")
  if (!hintKey && /\s+\+\s+/.test(cleaned)) {
    const fCleaned = foldTrI(cleaned);
    const categoryCount =
      Number(/\b(?:i[3579][-\s]?\d{4}|ryzen|r[3579][-\s]?\d{4}|ultra\s+[3579])\b/i.test(fCleaned)) +
      Number(/\b(?:rtx|gtx|rx\s*\d|radeon|arc)\b/i.test(fCleaned)) +
      Number(/\b(?:ram|ddr[345]|lpddr|bellek)\b/i.test(fCleaned)) +
      Number(/\b(?:ssd|nvme|hdd|m\.?2)\b/i.test(fCleaned));
    if (categoryCount >= 2) {
      for (const part of cleaned.split(/\s+\+\s+/)) {
        processSegmentIntoFields(part, fields);
      }
      return;
    }
  }

  // Check explicit `Key: Value` within segment
  if (!hintKey) {
    const colonMatch = cleaned.match(/^([A-Za-z0-9ğüşıöçĞÜŞİÖÇ\s()/-]{2,26})\s*:\s*(.+)$/);
    if (colonMatch) {
      const mapped = normalizeTableKey(colonMatch[1]);
      if (mapped) {
        processSegmentIntoFields(colonMatch[2], fields, mapped);
        return;
      }
    }
  }

  // Desktop-specific isolation MUST run before RAM & SSD so M2 Anakart / 240mm Soğutma / PSU never leak!
  if (hintKey === "mobo" || (!hintKey && isMoboSpecText(cleaned))) {
    const v = extractMoboValue(cleaned);
    if (v && (hintKey === "mobo" || !fields.mobo)) fields.mobo = v;
    if (hintKey === "mobo" || isMoboSpecText(cleaned)) return;
  }
  if (hintKey === "cooler" || (!hintKey && isCoolingSpecText(cleaned))) {
    const v = extractCoolingValue(cleaned);
    if (v && (hintKey === "cooler" || !fields.cooler)) fields.cooler = v;
    if (hintKey === "cooler" || isCoolingSpecText(cleaned)) return;
  }
  if (hintKey === "psu" || (!hintKey && isPsuSpecText(cleaned))) {
    const v = extractPsuValue(cleaned);
    if (v && (hintKey === "psu" || !fields.psu)) fields.psu = v;
    if (hintKey === "psu" || isPsuSpecText(cleaned)) return;
  }
  if (hintKey === "case" || (!hintKey && isPcCaseSpecText(cleaned))) {
    const v = extractCaseValue(cleaned);
    if (v && (hintKey === "case" || !fields.pcCase)) fields.pcCase = v;
    if (hintKey === "case" || isPcCaseSpecText(cleaned)) return;
  }

  // Shorthand `16/512`
  const shortPair = extractShorthandRamSsd(cleaned);
  if (shortPair) {
    if (!fields.ram) fields.ram = shortPair.ram;
    if (!fields.ssd) fields.ssd = shortPair.ssd;
  }

  // CPU
  if (hintKey === "cpu" || !hintKey) {
    const cpu = extractCpuFromSegment(cleaned);
    if (cpu) {
      if (!fields.cpu || cpu.length > fields.cpu.length) fields.cpu = cpu;
    }
    if (hintKey === "cpu") return;
  }

  // GPU
  if (hintKey === "gpu" || !hintKey) {
    const gpu = extractGpuFromSegment(cleaned);
    if (gpu) {
      if (!fields.gpu || (fields.gpu.startsWith("Dahili") && !gpu.startsWith("Dahili")) || gpu.length > fields.gpu.length) {
        fields.gpu = gpu;
      }
    }
    if (hintKey === "gpu") return;
  }

  // RAM (strict!)
  if (hintKey === "ram" || !hintKey) {
    const ram = extractRamStrict(cleaned);
    if (ram) {
      if (!fields.ram || ram.length > fields.ram.length) fields.ram = ram;
    }
    if (hintKey === "ram") return;
  }

  // SSD / Storage (strict! allow bare capacity when explicit hintKey === "ssd")
  if (hintKey === "ssd" || !hintKey) {
    const ssd = extractStorageStrict(cleaned, hintKey === "ssd");
    if (ssd) {
      if (!fields.ssd || ssd.length > fields.ssd.length) fields.ssd = ssd;
    }
    if (hintKey === "ssd") return;
  }

  // Screen
  if (hintKey === "screen" || !hintKey) {
    const scr = extractScreenValue(cleaned);
    if (scr) {
      if (!fields.screen || scr.length > fields.screen.length) fields.screen = scr;
    }
    if (hintKey === "screen") return;
  }

  // Battery
  if (hintKey === "battery" || !hintKey) {
    const bat = extractBatteryValue(cleaned);
    if (bat && !fields.battery) fields.battery = bat;
    if (hintKey === "battery") return;
  }

  // Extra tags (OS, Fingerprint, Backlit keyboard, etc.)
  for (const tag of extractExtrasTokens(cleaned)) {
    if (!fields.extras.includes(tag)) fields.extras.push(tag);
  }
}

export function parseAdDescription(
  rawText: string,
  settings?: { defaultWarrantyOrg?: string }
): ParsedLabel {
  const normalized = String(rawText || "").replace(/\r\n?/g, "\n").trim();
  const defaultOrg = settings?.defaultWarrantyOrg || "Kongoru Firma Garantisi";

  if (!normalized) {
    return {
      title: "YENİ CİHAZ ETİKETİ",
      subtitle: "ÜRÜN ÖZELLİKLERİ",
      stockCode: "",
      specs: [
        { icon: "cpu", k: "İŞLEMCİ", v: "-" },
        { icon: "gpu", k: "EKRAN KARTI", v: "-" },
        { icon: "ram", k: "RAM", v: "-" },
        { icon: "ssd", k: "SSD / DEPOLAMA", v: "-" },
        { icon: "screen", k: "EKRAN", v: "-" },
      ],
      warrantyTitle: "GARANTİ DURUMU",
      warrantyDuration: "2. El / Kontrol Edilmiş",
      warrantyDetail: defaultOrg,
      boxTitle: "KUTU & İÇERİK",
      boxLine1: "Mağaza Test & Kontrolü Tam",
      boxLine2: "Tam Bakımlı & Kullanıma Hazır",
    };
  }

  const rawLines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stockCode = extractStockCode(rawLines);
  const { title: parsedTitle, tailSegments } = splitHeaderTitleAndTail(rawLines[0] || "");
  const title = trUpper(parsedTitle || "SİSTEM ÖZELLİKLERİ");
  const isDesktop = detectIsDesktopAd(rawLines, normalized);
  const subtitle = inferSubtitle(title, normalized, isDesktop);

  const fields: ExtractedFields = {
    cpu: "",
    gpu: "",
    ram: "",
    ssd: "",
    screen: "",
    battery: "",
    mobo: "",
    cooler: "",
    psu: "",
    pcCase: "",
    extras: [],
    vramHint: "",
  };

  // 1) Process body lines first (higher fidelity than promotional header)
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (i === 0 && rawLines.length === 1 && tailSegments.length === 0) {
      // Single-line ad without pipes: extract inline specs directly from that line
      processSegmentIntoFields(line, fields);
      continue;
    }
    if (i === 0) continue;

    // Handle tab-separated or 3+ spaces table rows: "İşlemci\ti7-13620H"
    const tabSplit = line.split(/\t+|\s{3,}/);
    if (tabSplit.length === 2) {
      const k = normalizeTableKey(tabSplit[0]);
      if (k) {
        processSegmentIntoFields(tabSplit[1], fields, k);
        continue;
      }
    }

    // Handle Sahibinden vertical Key\nValue table pairs!
    const nextLine = rawLines[i + 1];
    const verticalKey = normalizeTableKey(line);
    if (verticalKey && nextLine && !normalizeTableKey(nextLine)) {
      processSegmentIntoFields(nextLine, fields, verticalKey);
      i += 1;
      continue;
    }

    processSegmentIntoFields(line, fields);
  }

  // 2) Process header tail segments as fallback for any missing fields
  for (const seg of tailSegments) {
    processSegmentIntoFields(seg, fields);
  }

  // Append separate VRAM hint if Sahibinden table listed VRAM separately from GPU model
  if (fields.gpu && fields.vramHint && !fields.gpu.includes("GB")) {
    fields.gpu = `${fields.gpu} · ${fields.vramHint}`;
  }

  // Apple Silicon integrated GPU sensible fallback when dedicated GPU isn't listed separately
  if (!fields.gpu && fields.cpu.startsWith("Apple M")) {
    fields.gpu = `${fields.cpu.split(" · ")[0]} Entegre GPU`;
  }

  const warrantyAndBox = extractWarrantyAndBox(rawLines, defaultOrg);

  const specs: SpecRow[] = [];

  if (isDesktop) {
    specs.push({ icon: "cpu", k: "İŞLEMCİ", v: fields.cpu || "-" });
    specs.push({ icon: "gpu", k: "EKRAN KARTI", v: fields.gpu || "Dahili Grafik" });
    specs.push({ icon: "ram", k: "RAM BELLEK", v: fields.ram || "-" });
    specs.push({ icon: "ssd", k: "DEPOLAMA", v: fields.ssd || "-" });

    if (fields.mobo) {
      specs.push({ icon: "mobo", k: "ANAKART", v: fields.mobo });
    }

    if (fields.cooler && fields.psu) {
      specs.push({
        icon: "psu",
        k: "SOĞUTMA & PSU",
        v: `${fields.cooler} · ${fields.psu}`,
      });
    } else if (fields.psu) {
      specs.push({ icon: "psu", k: "GÜÇ KAYNAĞI", v: fields.psu });
    } else if (fields.cooler) {
      specs.push({ icon: "psu", k: "SOĞUTMA", v: fields.cooler });
    }

    const desktopExtras = [fields.pcCase, ...fields.extras].filter(Boolean);
    if (desktopExtras.length > 0) {
      specs.push({
        icon: "extras",
        k: fields.pcCase ? "KASA & ÖZELLİKLER" : "EK ÖZELLİKLER",
        v: desktopExtras.join(" · "),
      });
    }
  } else {
    specs.push({ icon: "cpu", k: "İŞLEMCİ", v: fields.cpu || "-" });
    specs.push({ icon: "gpu", k: "EKRAN KARTI", v: fields.gpu || "Dahili / Paylaşımlı" });
    specs.push({ icon: "ram", k: "RAM", v: fields.ram || "-" });
    specs.push({ icon: "ssd", k: "SSD / DEPOLAMA", v: fields.ssd || "-" });

    if (fields.screen) {
      specs.push({ icon: "screen", k: "EKRAN", v: fields.screen });
    }
    if (fields.battery) {
      specs.push({ icon: "battery", k: "BATARYA & PİL", v: fields.battery });
    }
    if (fields.extras.length > 0) {
      specs.push({ icon: "extras", k: "EK ÖZELLİKLER", v: fields.extras.join(" · ") });
    }
  }

  return {
    title,
    subtitle,
    stockCode,
    specs: specs.slice(0, 7),
    ...warrantyAndBox,
  };
}

export function applyOverrides(parsed: ParsedLabel, overrides?: LabelOverrides): ParsedLabel {
  if (!overrides) return parsed;
  const nextSpecs = parsed.specs.map((row, idx) => {
    const ov = overrides.specs?.[idx];
    if (!ov) return row;
    return {
      ...row,
      k: ov.k !== undefined ? ov.k : row.k,
      v: ov.v !== undefined ? ov.v : row.v,
    };
  });

  return {
    title: overrides.title !== undefined ? overrides.title : parsed.title,
    subtitle: overrides.subtitle !== undefined ? overrides.subtitle : parsed.subtitle,
    stockCode: overrides.stockCode !== undefined ? overrides.stockCode : parsed.stockCode,
    specs: nextSpecs,
    warrantyTitle: overrides.warrantyTitle !== undefined ? overrides.warrantyTitle : parsed.warrantyTitle,
    warrantyDuration: overrides.warrantyDuration !== undefined ? overrides.warrantyDuration : parsed.warrantyDuration,
    warrantyDetail: overrides.warrantyDetail !== undefined ? overrides.warrantyDetail : parsed.warrantyDetail,
    boxTitle: overrides.boxTitle !== undefined ? overrides.boxTitle : parsed.boxTitle,
    boxLine1: overrides.boxLine1 !== undefined ? overrides.boxLine1 : parsed.boxLine1,
    boxLine2: overrides.boxLine2 !== undefined ? overrides.boxLine2 : parsed.boxLine2,
  };
}
