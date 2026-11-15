import { isCoolingSpecText, isMoboSpecText, isPcCaseSpecText, isPsuSpecText } from "../desktopDetect";
import { cleanBulletText, foldTrI, formatTitleBrandWords } from "../turkish";

const VALID_RAM_GB = new Set([4, 6, 8, 12, 16, 18, 24, 32, 36, 48, 64, 96, 128, 192, 256]);

const RAM_BRANDS_RE =
  /\b(crucial\s+pro|crucial|kingston\s+fury\s+beast|kingston\s+fury\s+renegade|kingston\s+fury|kingston|corsair\s+vengeance(?:\s+rgb)?|corsair\s+dominator|corsair|g\.?skill\s+trident\s+z5?|g\.?skill\s+ripjaws|g\.?skill|xpg\s+lancer|xpg|lexar\s+ares|lexar\s+thor|team\s+t-force|t-force|patriot\s+viper)\b/i;

export function extractRamStrict(rawSegment: string): string {
  let seg = cleanBulletText(rawSegment).replace(/^\s*(?:ram(?:\s+bellek)?|bellek|memory)\s*:\s*/i, "").trim();
  if (!seg) return "";
  // Strip parenthetical or trailing upgrade-limit hints before matching actual installed RAM
  seg = seg
    .replace(/\([^)]*(?:art[iı]r[iı]l|deste[gğ]i|destekli|maksimum|max)[^)]*\)/gi, " ")
    .replace(/\b\d+\s*gb\s*(?:'?[ae])?\s*kadar\s+art[iı]r[iı]l[a-zğüşıöç]*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!seg) return "";
  const folded = foldTrI(seg);

  // Strict guard: never pull DDR/6400MHz from motherboard, or VRAM from GPU, or pure max-support prose
  if (isMoboSpecText(seg) || isCoolingSpecText(seg) || isPsuSpecText(seg) || isPcCaseSpecText(seg)) {
    return "";
  }
  if (/(?:gddr\d|vram|ekran\s*kart[iı])/i.test(folded) && !/\bram\b|\bbellek\b/i.test(folded)) {
    return "";
  }
  if (/^\s*(?:maksimum|max)\s+\d+\s*gb/i.test(folded)) {
    return "";
  }

  // Reject pure storage segments ("512 GB NVMe SSD", "1 TB SSD") unless explicit RAM token appears too
  const hasRamKeyword = /\b(?:ram|bellek|lpddr[345]x?|ddr[345]|unified|mhz|mt\/s)\b/i.test(folded);
  const hasStickNotation = /\b([124])\s*x\s*(4|8|16|24|32|48|64)\s*gb\b/i.test(seg);
  const hasStorageKeyword = /\b(?:ssd|nvme|m\.2|hdd|depolama|sata|pcie|gen\d)\b/i.test(folded);

  if (hasStorageKeyword && !hasRamKeyword && !hasStickNotation) {
    return "";
  }

  let stickStr = "";
  let totalGb = 0;

  // 1. Stick notation like "1x16GB", "2x16 GB", "(2x8GB)"
  const stickMatch = seg.match(/\b([124])\s*x\s*(4|8|16|24|32|48|64)\s*gb\b/i);
  if (stickMatch) {
    const count = Number(stickMatch[1]);
    const perStick = Number(stickMatch[2]);
    totalGb = count * perStick;
    stickStr = `${count}x${perStick} GB`;
  } else {
    // 2. Single capacity paired with RAM/DDR context (handles "8GB RAM 256GB SSD" cleanly!)
    const ramPaired = seg.match(
      /\b(4|6|8|12|16|18|24|32|36|48|64|96|128|192|256)\s*gb\s*(?:(?:ddr[345]|lpddr[45]x?)\b(?:\s*\d{3,4}\s*(?:mhz|mt\/s))?|\s*(?:ram|bellek|unified\s+memory|b[iı]rle[sş]ik\s+bellek))/i
    );
    if (ramPaired) {
      totalGb = Number(ramPaired[1]);
    } else if (!hasStorageKeyword) {
      const capMatches = [...seg.matchAll(/\b(\d{1,3})\s*gb\b/gi)]
        .map((m) => Number(m[1]))
        .filter((n) => VALID_RAM_GB.has(n));
      if (capMatches.length === 1) {
        totalGb = capMatches[0];
      } else if (capMatches.length > 1 && hasRamKeyword) {
        // e.g. "16 GB DDR5 4800MHz" only has one GB, or "2x16 (32 GB)"
        totalGb = capMatches.find((n) => n !== 256) ?? capMatches[0];
      }
    } else if (hasRamKeyword) {
      // Mixed string like "16GB DDR5 RAM 512GB NVMe SSD" or "8GB RAM 256GB SSD"
      const mFirst = seg.match(/\b(4|6|8|12|16|18|24|32|36|48|64|96|128)\s*gb\b/i);
      if (mFirst && VALID_RAM_GB.has(Number(mFirst[1]))) {
        totalGb = Number(mFirst[1]);
      }
    }
  }

  if (!totalGb || !VALID_RAM_GB.has(totalGb)) return "";

  const ddrMatch = seg.match(/\b(LPDDR5X|LPDDR5|LPDDR4X|LPDDR4|DDR5|DDR4|DDR3)\b/i);
  const ddr = ddrMatch ? ddrMatch[1].toUpperCase() : "";

  const freqMatch = seg.match(/\b([1-9]\d{3})\s*(mhz|mt\/s)\b/i);
  const freq = freqMatch ? `${freqMatch[1]} ${freqMatch[2].toLowerCase() === "mhz" ? "MHz" : "MT/s"}` : "";

  const brandMatch = seg.match(RAM_BRANDS_RE);
  const brand = brandMatch ? formatTitleBrandWords(brandMatch[1], false) : "";

  const baseCap = stickStr
    ? stickStr.startsWith("1x")
      ? stickStr
      : `${totalGb} GB (${stickStr})`
    : `${totalGb} GB`;

  const head = brand ? `${baseCap} ${brand}` : baseCap;
  const tailParts: string[] = [];
  if (freq) tailParts.push(freq);
  if (ddr) tailParts.push(ddr);

  if (tailParts.length === 0) return head;
  if (brand) return `${head} · ${tailParts.join(" ")}`;
  return `${head} ${tailParts.join(" ")}`;
}

export function extractShorthandRamSsd(rawSegment: string): { ram: string; ssd: string } | null {
  const seg = cleanBulletText(rawSegment);
  const m = seg.match(
    /(?:^|[\s|(])(4|8|12|16|24|32|48|64)\s*(?:gb)?\s*[/+]\s*(128|240|250|256|480|500|512|1|2|4)\s*(gb|tb)?(?=$|[\s|)/,])/i
  );
  if (!m) return null;

  const ramGb = Number(m[1]);
  const diskNum = Number(m[2]);
  if (!VALID_RAM_GB.has(ramGb)) return null;

  let diskUnit = (m[3] || "").toUpperCase();
  if (!diskUnit) {
    diskUnit = diskNum <= 8 ? "TB" : "GB";
  }

  const ssdLabel = diskNum >= 120 || diskUnit === "TB" ? `${diskNum} ${diskUnit} SSD` : "";
  if (!ssdLabel) return null;

  return {
    ram: `${ramGb} GB`,
    ssd: ssdLabel,
  };
}
