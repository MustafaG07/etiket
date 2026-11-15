import { isCoolingSpecText, isMoboSpecText, isPcCaseSpecText, isPsuSpecText } from "../desktopDetect";
import { cleanBulletText, foldTrI, formatTitleBrandWords } from "../turkish";

const VALID_SSD_GB = new Set([120, 128, 240, 250, 256, 480, 500, 512]);
const VALID_TB = new Set([1, 2, 4, 8]);

const SSD_BRANDS_RE =
  /\b(lexar\s+nq\d{3}|lexar\s+nm\d{3}|samsung\s+\d{3}\s*(?:pro|evo(?:\s+plus)?)|samsung|wd\s*(?:black|blue|green)?\s*(?:sn\d{3,4}x?)?|western\s+digital(?:\s+sn\d{3,4}x?)?|kingston\s+(?:nv[23]|kc\d{4}|fury\s+renegade)|crucial\s+(?:p[35](?:\s+plus)?|t\d{3})|kioxia\s+exceria|micron|sk\s*hynix|hynix|corsair\s+mp\d{3}|goodram)\b/i;

function extractSingleDrive(part: string, allowBareCapacity: boolean): string {
  const cleaned = cleanBulletText(part);
  if (!cleaned) return "";
  const folded = foldTrI(cleaned);

  if (isMoboSpecText(cleaned) || isCoolingSpecText(cleaned) || isPsuSpecText(cleaned) || isPcCaseSpecText(cleaned)) {
    return "";
  }
  if (/(?:gddr\d|vram|ekran\s*kart[iı])/i.test(folded) && !/\b(?:ssd|nvme|hdd|depolama)\b/i.test(folded)) {
    return "";
  }
  if (/\b(?:ddr[345]|lpddr|ram|bellek)\b/i.test(folded) && !/\b(?:ssd|nvme|hdd|m\.2|depolama)\b/i.test(folded)) {
    return "";
  }

  let capStr = "";
  const capMatches = [...cleaned.matchAll(/\b(\d{1,4})\s*(tb|gb)\b/gi)];
  for (const m of capMatches) {
    const val = Number(m[1]);
    const unit = m[2].toUpperCase();
    // Skip capacity if immediately followed by RAM/DDR tokens (e.g. "8GB RAM 256GB SSD")
    const afterSlice = folded.slice((m.index || 0) + m[0].length, (m.index || 0) + m[0].length + 18);
    if (/^\s*(?:ram|bellek|ddr|lpddr|gddr)/i.test(afterSlice)) continue;

    if (unit === "TB" && VALID_TB.has(val)) {
      capStr = `${val} TB`;
      break;
    }
    if (unit === "GB" && VALID_SSD_GB.has(val)) {
      capStr = `${val} GB`;
      break;
    }
  }

  if (!capStr) return "";

  const hasExplicitStorageWord = /\b(?:ssd|nvme|m\.2|m2|hdd|sata|pcie|pcle|gen\s*[345]|depolama|sabit\s+disk)\b/i.test(folded);
  if (!hasExplicitStorageWord && !allowBareCapacity) {
    return "";
  }

  const brandMatch = cleaned.match(SSD_BRANDS_RE);
  const brand = brandMatch ? formatTitleBrandWords(brandMatch[1], true) : "";

  const genMatch = cleaned.match(/\b(?:pcie|pcle)\s*(?:gen\s*)?([345])(?:\.0)?\b|\bgen\s*([345])\b/i);
  const genNum = genMatch ? genMatch[1] || genMatch[2] : "";
  const hasPcie = /\b(?:pcie|pcle)\b/i.test(folded);
  const hasSata = /\bsata\b/i.test(folded);
  const hasNvme = /\bnvme\b/i.test(folded);
  const hasM2 = /\bm\.?2\b/i.test(folded);
  const hasHdd = /\bhdd\b/i.test(folded);
  const hasSsd = /\bssd\b/i.test(folded) || hasNvme || hasM2 || (!hasHdd && allowBareCapacity);

  const techTokens: string[] = [];
  if (genNum) {
    techTokens.push(`PCIe Gen${genNum}`);
  } else if (hasPcie) {
    techTokens.push("PCIe");
  }
  if (hasSata && !hasNvme) techTokens.push("SATA");
  if (hasNvme) techTokens.push("NVMe");
  if (hasM2) techTokens.push("M.2");
  if (hasHdd && !hasSsd) {
    techTokens.push("HDD");
  } else if (hasSsd) {
    techTokens.push("SSD");
  }

  const uniqueTech = [...new Set(techTokens)];
  const techText = uniqueTech.join(" ");

  if (brand && techText) return `${capStr} ${brand} · ${techText}`;
  if (brand) return `${capStr} ${brand} SSD`;
  return techText ? `${capStr} ${techText}` : `${capStr} SSD`;
}

export function extractStorageStrict(rawSegment: string, allowBareCapacity = false): string {
  const seg = cleanBulletText(rawSegment)
    .replace(/^\s*(?:sabit\s+disk(?:\s*\(ssd\))?|ssd\s*\/?\s*depolama|depolama|ssd|hdd|disk|storage)\s*:\s*/i, "")
    .trim();
  if (!seg) return "";
  if (isMoboSpecText(seg) || isCoolingSpecText(seg) || isPsuSpecText(seg) || isPcCaseSpecText(seg)) {
    return "";
  }

  // Split multi-drive expressions like "1 TB NVMe SSD + 1 TB HDD" or "8GB RAM 256GB SSD"
  const subParts = seg.split(/\s+\+\s+/);
  const extracted: string[] = [];

  for (const sub of subParts) {
    // Handle inline "8GB RAM 256GB SSD" without separator
    const inlineSsdMatch = sub.match(
      /(?:^|\s)((?:\d{1,4}\s*(?:tb|gb)\b.{0,45}?\b(?:nvme|m\.?2|ssd|hdd)\b)|(?:(?:nvme|m\.?2|ssd|hdd)\b.{0,20}?\d{1,4}\s*(?:tb|gb)\b))/i
    );
    const target = inlineSsdMatch && /\b(?:ram|ddr|lpddr|bellek)\b/i.test(sub) ? sub.slice(inlineSsdMatch.index || 0) : sub;
    const drive = extractSingleDrive(target, allowBareCapacity || subParts.length > 1);
    if (drive && !extracted.includes(drive)) {
      extracted.push(drive);
    }
  }

  if (extracted.length > 0) return extracted.join(" + ");

  return extractSingleDrive(seg, allowBareCapacity);
}
