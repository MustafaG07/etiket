import { isCoolingSpecText, isMoboSpecText, isPcCaseSpecText, isPsuSpecText } from "../desktopDetect";
import { cleanBulletText, foldTrI, formatTitleBrandWords } from "../turkish";

export function extractMoboValue(rawSegment: string): string {
  if (!isMoboSpecText(rawSegment)) return "";
  let s = cleanBulletText(rawSegment)
    .replace(/^\s*(?:anakart|motherboard|mainboard|mobo)\s*:\s*/i, "")
    .trim();
  // Remove trailing redundant "Anakart" word & noisy bus promo tags while preserving model/WiFi/DDR
  s = s
    .replace(/\s*\bgen4\s+m\.?2\s+anakart\b/gi, "")
    .replace(/\s*\banakart\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return formatTitleBrandWords(s, true);
}

export function extractCoolingValue(rawSegment: string): string {
  if (!isCoolingSpecText(rawSegment)) return "";
  let s = cleanBulletText(rawSegment)
    .replace(/^\s*(?:so[gğ]utma|so[gğ]utucu|cooler|aio)\s*:\s*/i, "")
    .trim();

  // Remove misleading thermal rating token when radiator mm size is present (e.g. "240W 240mm PB-LCS-CR240W")
  if (/\b(?:120|240|280|360)mm\b/i.test(s)) {
    s = s.replace(/\b\d{3}w\b\s*/gi, "");
  }
  s = s
    .replace(/\bi[sş]lemci\s+s[iı]v[iı]\s+so[gğ]utma\b/gi, "Sıvı Soğutma")
    .replace(/\bs[iı]v[iı]\s+so[gğ]utma\b/gi, "Sıvı Soğutma")
    .replace(/\bkule\s+tipi\s+so[gğ]utucu\b/gi, "Kule Tipi Soğutucu")
    .replace(/\s+/g, " ")
    .trim();
  return formatTitleBrandWords(s, true);
}

export function extractPsuValue(rawSegment: string): string {
  if (!isPsuSpecText(rawSegment)) return "";
  let s = cleanBulletText(rawSegment)
    .replace(/^\s*(?:g[uü][cç]\s+kayna[gğ][iı]|psu|power\s+supply)\s*:\s*/i, "")
    .trim();
  s = s
    .replace(/\bg[uü][cç]\s+kayna[gğ][iı]\b/gi, "")
    .replace(/\bpower\s+supply\b/gi, "")
    .replace(/\b(\d{3,4})\s*w(?:att)?\b/gi, "$1W")
    .replace(/\b80\s*\+\s*/gi, "80+ ")
    .replace(/\s+/g, " ")
    .trim();
  return formatTitleBrandWords(s, true);
}

export function extractCaseValue(rawSegment: string): string {
  if (!isPcCaseSpecText(rawSegment)) return "";
  let s = cleanBulletText(rawSegment)
    .replace(/^\s*(?:kasa|kasa\s+tipi|bilgisayar\s+kasas[iı]|case)\s*:\s*/i, "")
    .trim();

  const f = foldTrI(s);
  const hasKasaWord = /\bkasa\b/i.test(f);
  s = s.replace(/\bgaming\s+kasa\b/gi, "Gaming Kasa").replace(/\s+/g, " ").trim();
  const formatted = formatTitleBrandWords(s, true);
  return hasKasaWord ? formatted : `${formatted} Kasa`;
}
