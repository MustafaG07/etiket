import { foldTrI } from "./turkish";

export function isMoboSpecText(raw: string): boolean {
  const t = foldTrI(raw);
  if (/^\s*(?:anakart|motherboard|mainboard|mobo)\s*:/i.test(t)) return true;
  if (/\banakart\b|\bmotherboard\b|\bmainboard\b/i.test(t)) return true;
  // Explicit chipset/board models without CPU/GPU words overriding
  if (
    /\b(?:a320|a520|a620|b350|b450|b550|b650|b650e|b760|b850|h310|h410|h510|h610|h810|z490|z590|z690|z790|z890|x570|x670|x670e|x870|x870e)[a-z0-9-]*\b/i.test(
      t
    ) &&
    !/(?:laptop|notebook|ekran\s*kart[iı]|rtx|gtx|rx\s*\d)/i.test(t)
  ) {
    return true;
  }
  if (/\b(?:asrock|tuf\s+gaming\s+[abxhz]\d{3}|rog\s+strix\s+[abxz]\d{3}|prime\s+[abxhz]\d{3}|pro\s+rs|aorus\s+elite\s+[abxz]\d{3})\b/i.test(t)) {
    return true;
  }
  return false;
}

export function isCoolingSpecText(raw: string): boolean {
  const t = foldTrI(raw);
  if (/^\s*(?:so[gğ]utma|so[gğ]utucu|cooler|aio|fan)\s*:/i.test(t)) return true;
  if (/s[iı]v[iı]\s+so[gğ]ut|hava\s+so[gğ]ut|kule\s+tipi|i[sş]lemci\s+so[gğ]ut|liquid\s+cool/i.test(t)) {
    return true;
  }
  if (/\b(?:240mm|360mm|280mm|120mm)\b/i.test(t) && !/kasa|atx|m-atx|mid\s*tower/i.test(t)) {
    return true;
  }
  if (/\b(?:peerless\s+assassin|phantom\s+spirit|deepcool\s+(?:ak|ls|lt|ag)|arctic\s+liquid|powerboost\s+circle|pb-lcs|nzxt\s+kraken|corsair\s+h\d{2,3})\b/i.test(t)) {
    return true;
  }
  return false;
}

export function isPsuSpecText(raw: string): boolean {
  const t = foldTrI(raw);
  if (/^\s*(?:g[uü][cç]\s+kayna[gğ][iı]|psu|power\s+supply)\s*:/i.test(t)) return true;
  if (/g[uü][cç]\s+kayna[gğ][iı]|\bpsu\b|power\s+supply|80\s*\+\s*(?:white|bronze|silver|gold|platinum|titanium)?/i.test(t)) {
    return true;
  }
  // Standalone PSU lines like "CORSAIR RM750e 750W" without GPU/CPU/Screen context
  if (
    /\b\d{3,4}\s*w(?:att)?\b/i.test(t) &&
    /(?:fazeon|corsair|fsp|seasonic|thermaltake|cooler\s*master|nzxt|high\s*power|aerocool|rampage|gamepower|msi\s+mag\s+a\d{3}|asus\s+tuf\s+\d{3,4}w)/i.test(
      t
    ) &&
    !/(?:rtx|gtx|rx\s*\d|cpu|i[3579]|ryzen|ultra\s+[579]|adapt[oö]r|şarj|sarj|laptop)/i.test(t)
  ) {
    return true;
  }
  return false;
}

export function isPcCaseSpecText(raw: string): boolean {
  const t = foldTrI(raw);
  // Ignore laptop chassis mentions ("alüminyum kasa", "temiz kasa", "metal kasa")
  if (/(?:al[uü]minyum|magnezyum|metal|karbon|plastik|temiz|hatas[iı]z|kusursuz)\s+kasa/i.test(t)) {
    return false;
  }
  if (/^\s*(?:kasa|kasa\s+tipi|bilgisayar\s+kasas[iı]|case)\s*:/i.test(t)) return true;
  if (
    /(?:gaming\s+kasa|oyuncu\s+kasas[iı]|akvaryum\s+kasa|mesh\s+kasa|atx\s+(?:beyaz|siyah)?\s*(?:gaming\s+)?kasa|temperli\s+cam|4x120mm|3x120mm|argb\s+fanl[iı])/i.test(
      t
    )
  ) {
    return true;
  }
  if (/\b(?:fazeon\s+white\s+f19|nzxt\s+h[5679]|lian\s+li\s+(?:o11|lancool)|darkflash|vento\s+vg)\b/i.test(t)) {
    return true;
  }
  if (/\bkasa\b/i.test(t) && /\b(?:atx|m-atx|micro-atx|mini-itx|mid\s*tower|full\s*tower|rgb|argb|fan)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function detectIsDesktopAd(lines: string[], fullText: string): boolean {
  const folded = foldTrI(fullText);

  let desktopPartCount = 0;
  for (const line of lines) {
    if (isMoboSpecText(line)) desktopPartCount++;
    if (isCoolingSpecText(line)) desktopPartCount++;
    if (isPsuSpecText(line)) desktopPartCount++;
    if (isPcCaseSpecText(line)) desktopPartCount++;
  }

  if (desktopPartCount >= 2) return true;

  const hasExplicitDesktopKeyword =
    /(?:masa[uü]st[uü]|haz[iı]r\s+sistem|oyuncu\s+(?:sistemi|bilgisayar[iı]|kasas[iı])|beyaz\s+sistem|gaming\s+sistem|workstation\s+kasa|oyuncu\s+pc|render\s+kasas[iı])/i.test(
      folded
    );

  const hasLaptopSignal =
    /(?:laptop|notebook|diz[uü]st[uü]|macbook|ultrabook|pil\s+sa[gğ]l[iı][gğ][iı]|batarya|devir\s+say[iı]s[iı]|(?:13\.3|13\.6|14(?:\.\d)?|15\.6|16(?:\.[012])?|17\.3)\s*(?:in[cç]|"|''|inch))/i.test(
      folded
    );

  if (hasLaptopSignal && desktopPartCount === 0) return false;
  if (hasExplicitDesktopKeyword && !hasLaptopSignal) return true;
  if (desktopPartCount >= 1 && !hasLaptopSignal) return true;

  return false;
}
