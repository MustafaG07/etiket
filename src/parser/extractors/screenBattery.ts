import { cleanBulletText, foldTrI, formatTitleBrandWords } from "../turkish";

export function extractScreenValue(rawSegment: string): string {
  const seg = cleanBulletText(rawSegment)
    .replace(/^\s*(?:ekran(?:\s+boyutu|\s+[oö]zellikleri)?|ekran\s+panel|[cç][oö]z[uü]n[uü]rl[uü]k|panel|display|screen)\s*:\s*/i, "")
    .trim();
  if (!seg) return "";
  const f = foldTrI(seg);

  const hasExplicitScreenInch = /\b1[1-8](?:[.,]\d)?\s*(?:in[cç]|inch|["″''])/i.test(f);
  const hasExplicitHz = /\b(?:60|90|100|120|144|165|240|300|360|480)\s*hz\b/i.test(f);

  // Reject GPU-only lines unless inline screen tokens (inches or Hz) explicitly appear
  if (/ekran\s*kart[iı]|\brtx\b|\bgtx\b|\bgddr\b/i.test(f) && !hasExplicitScreenInch && !hasExplicitHz) {
    return "";
  }

  const parts: string[] = [];

  // Screen size in inches (use folded string so Turkish "İNÇ" works consistently)
  const sizeMatch =
    f.match(/\b(1[1-8](?:[.,]\d)?)\s*(?:in[cç]|inch|["″''])/i) ||
    (/(?:ekran|boyut|ips|oled|fhd|qhd|wuxga|retina|hz)/i.test(f) ? f.match(/\b(1[1-8](?:[.,]\d)?)\b/) : null);

  if (sizeMatch) {
    const num = sizeMatch[1].replace(",", ".");
    // Guard against random numbers like 16 GB or 14 Çekirdek
    const after = f.slice((sizeMatch.index || 0) + sizeMatch[0].length, (sizeMatch.index || 0) + sizeMatch[0].length + 14);
    if (!/^\s*(?:gb|tb|cekirdek|çekirdek|core|saat|ay|yil|yıl)/i.test(after)) {
      parts.push(`${num} inç`);
    }
  }

  // Resolution tags
  const resPatterns: [RegExp, string][] = [
    [/\bliquid\s+retina\s+xdr\b/i, "Liquid Retina XDR"],
    [/\bliquid\s+retina\b/i, "Liquid Retina"],
    [/\bretina\b/i, "Retina"],
    [/\buhd\b|\b4k\b/i, "4K UHD"],
    [/\bwqxga\b/i, "WQXGA (2560×1600)"],
    [/\bwuxga\b/i, "WUXGA"],
    [/\bqhd\+\b/i, "QHD+"],
    [/\bqhd\b|\b2k\b|\b2\.5k\b|\b2560\s*[x×*]\s*1440\b/i, "QHD"],
    [/\b3k\b/i, "3K"],
    [/\bfhd\+\b/i, "FHD+"],
    [/\bfhd\b|\bfull\s*hd\b|\b1920\s*[x×*]\s*1080\b/i, "FHD"],
    [/\b(\d{4}\s*[x×*]\s*\d{4})\b/i, "$1"],
  ];
  for (const [re, label] of resPatterns) {
    const m = seg.match(re);
    if (m) {
      const val = label === "$1" ? m[1].replace(/\s+/g, "").replace(/[x*]/i, "×") : label;
      if (!parts.some((p) => p.includes(val))) {
        parts.push(val);
        break;
      }
    }
  }

  // Panel type
  const panelMatch = seg.match(/\b(mini[-\s]?led|amoled|oled|ips|va|tn)\b/i);
  if (panelMatch) {
    const p = panelMatch[1].toUpperCase().replace(/\s+/g, "-");
    if (!parts.some((x) => x.includes(p))) parts.push(p);
  }

  // Refresh rate
  const hzMatch = seg.match(/\b(60|90|100|120|144|165|240|300|360|480)\s*hz\b/i);
  if (hzMatch) {
    parts.push(`${hzMatch[1]} Hz`);
  }

  // Touch / 2-in-1 / color gamut
  if (/dokunmatik|touchscreen|\btouch\b/i.test(f)) parts.push("Dokunmatik");
  const srgbMatch = seg.match(/%?\s*100\s*%?\s*(srgb|dci-p3|ntsc)/i);
  if (srgbMatch) parts.push(`%100 ${srgbMatch[1].toUpperCase()}`);

  return parts.join(" ");
}

export function extractBatteryValue(rawSegment: string): string {
  const seg = cleanBulletText(rawSegment)
    .replace(/^\s*(?:batarya|pil(?:\s+durumu|\s+sa[gğ]l[iı][gğ][iı])?|battery)\s*:\s*/i, "")
    .trim();
  if (!seg) return "";
  const f = foldTrI(seg);

  const hasBatteryKeyword = /\b(?:pil|batarya|sarj|[sş]arj|devir|cycle|whr?)\b/i.test(f);
  if (!hasBatteryKeyword) return "";
  // Ignore charger-only mention unless it carries battery health/duration
  if (/[sş]arj\s*(?:aleti|adapt[oö]r|cihaz[iı]|kablosu)/i.test(f) && !/(?:pil|batarya|saat|%|devir)/i.test(f)) {
    return "";
  }

  const parts: string[] = [];

  const pctMatch = seg.match(/(?:%\s*(\d{2,3})|(\d{2,3})\s*%)/);
  if (pctMatch) {
    const pct = Number(pctMatch[1] || pctMatch[2]);
    if (pct >= 30 && pct <= 100) parts.push(`Sağlık %${pct}`);
  }

  const cycleMatch = f.match(/(?:devir(?:\s+say[iı]s[iı])?|cycle)\s*[:=]?\s*(\d{1,4})|(\d{1,4})\s*(?:devir|cycle)/i);
  if (cycleMatch) {
    parts.push(`${cycleMatch[1] || cycleMatch[2]} Devir`);
  }

  const hoursMatch = f.match(/(\d+(?:\s*[-–]\s*\d+)?\s*\+?)\s*saat/i);
  if (hoursMatch) {
    parts.push(`${hoursMatch[1].replace(/\s+/g, "")} Saat Kullanım`);
  }

  const whMatch = seg.match(/\b(\d{2,3}(?:[.,]\d)?)\s*wh\b/i);
  if (whMatch) {
    parts.push(`${whMatch[1].replace(",", ".")} Wh`);
  }

  if (parts.length > 0) return parts.join(" · ");

  if (/(?:iyi|sa[gğ]lam|sorunsuz|s[iı]f[iı]r|m[uü]kemmel|uzun|orijinal)/i.test(f)) {
    return formatTitleBrandWords(seg, false);
  }
  return "";
}

const KNOWN_EXTRA_TAGS: [RegExp, string][] = [
  [/parmak\s*izi|fingerprint/i, "Parmak İzi Okuyucu"],
  [/ayd[iı]nlatmal[iı](?:\s+t[uü]rk[cç]e(?:\s+q)?)?\s*klavye|rgb\s*(?:ayd[iı]nlatmal[iı]\s*)?(?:t[uü]rk[cç]e(?:\s+q)?\s*)?klavye|backlit/i, "Aydınlatmalı Klavye"],
  [/t[uü]rk[cç]e\s*q/i, "Türkçe Q Klavye"],
  [/win(?:dows)?\s*11\s*pro/i, "Windows 11 Pro"],
  [/win(?:dows)?\s*11(?:\s*home)?/i, "Windows 11"],
  [/win(?:dows)?\s*10/i, "Windows 10"],
  [/freedos/i, "FreeDOS"],
  [/thunderbolt\s*[345]?/i, "Thunderbolt"],
  [/wi-?fi\s*6e|wi-?fi\s*7/i, "Wi-Fi 6E / 7"],
  [/face\s*id|y[uü]z\s*tan[iı]ma/i, "Yüz Tanıma"],
  [/kalem(?:li)?|stylus|s-?pen/i, "Kalem Desteği"],
  [/mux\s*switch/i, "MUX Switch"],
  [/metal\s+kasa|al[uü]minyum\s+kasa|magnezyum\s+kasa/i, "Metal / Alüminyum Kasa"],
];

export function extractExtrasTokens(rawSegment: string): string[] {
  const seg = cleanBulletText(rawSegment);
  if (!seg) return [];
  const f = foldTrI(seg);
  const hits: string[] = [];

  for (const [re, label] of KNOWN_EXTRA_TAGS) {
    if (re.test(f) && !hits.includes(label)) {
      hits.push(label);
    }
  }
  return hits;
}
