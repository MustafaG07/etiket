import { cleanBulletText, foldTrI, formatTitleBrandWords } from "../turkish";

const AIB_PARTNER_RE = /\b(gigabyte|asus|msi|sapphire|zotac|palit|galax|gainward|inno3d|pny|xfx|powercolor|asrock|evga)\b/i;

const GPU_EDITION_PATTERNS: RegExp[] = [
  /(?:^|\s)(rog\s+strix(?:\s+oc)?|tuf\s+gaming(?:\s+oc)?|aorus\s+(?:master|elite|xtreme)|eagle\s+max\s+oc|eagle\s+oc|eagle|windforce\s+v2|windforce|gaming\s+x\s+slim|gaming\s+x\s+trio|gaming\s+trio|gaming\s+oc|ventus\s+[23]x(?:\s+oc)?|suprim\s+x|dual\s+oc|dual|proart|pulse|nitro\+|pure|hellhound|red\s+devil|fighter|merc\s*\d*|qick\s*\d*|trinity(?:\s+oc)?|twin\s+edge(?:\s+oc)?|amp\s+extreme|jetstream|ghost|phoenix|verto|xlr8|founders\s+edition)(?=$|[\s,.)|/-])/i,
];

function extractVram(seg: string): { vram: string; memType: string; busBit: string } {
  const folded = foldTrI(seg);
  const memMatch = folded.match(/\b(gddr\d+x?)\b/i);
  const memType = memMatch ? memMatch[1].toUpperCase() : "";

  // Match explicit GB or trailing "16G", ignoring sizes tied directly to RAM/SSD tokens
  const vramMatches = [...folded.matchAll(/\b(2|3|4|6|8|10|11|12|16|20|24|32|48)\s*(?:gb|g)\b/gi)].filter(
    (m) => {
      const afterSlice = folded.slice((m.index || 0) + m[0].length, (m.index || 0) + m[0].length + 18);
      return !/^\s*(?:ram|bellek|ddr[345]|lpddr|ssd|nvme|m\.?2|hdd|depolama|sabit)/i.test(afterSlice);
    }
  );
  const chosenVram = vramMatches.length > 0 ? `${vramMatches[vramMatches.length - 1][1]} GB` : "";

  const bitMatch = folded.match(/\b(64|96|128|160|192|256|320|384)\s*(?:bit|b[iı]t)\b/i);
  const busBit = bitMatch ? `${bitMatch[1]} Bit` : "";

  return { vram: chosenVram, memType, busBit };
}

function extractGpuEdition(seg: string): string {
  const folded = foldTrI(seg);
  for (const re of GPU_EDITION_PATTERNS) {
    const m = folded.match(re);
    if (m) {
      return formatTitleBrandWords(m[1])
        .replace(/\bOc\b/g, "OC")
        .replace(/\bMax\b/g, "Max")
        .replace(/\b2x\b/gi, "2X")
        .replace(/\b3x\b/gi, "3X")
        .replace(/\bV2\b/gi, "V2")
        .replace(/\bnitro\+/gi, "Nitro+")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

export function extractGpuFromSegment(rawSegment: string): string {
  const seg = cleanBulletText(rawSegment).replace(/^\s*(?:ekran\s*kart[iı]|gpu|vga)\s*:\s*/i, "").trim();
  if (!seg) return "";
  const folded = foldTrI(seg);

  // Reject desktop disclaimer prose or warranty status
  if (
    /ekran\s+kart[iı]\s+dahil\s+t[uü]m\s+par[cç]alar/i.test(folded) ||
    /kapal[iı]\s+kutu\s+demonte/i.test(folded) ||
    /t[uü]m\s+par[cç]alar\s+s[iı]f[iı]r/i.test(folded)
  ) {
    return "";
  }

  let coreModel = "";

  // 1. NVIDIA RTX Workstation / Ada (MUST check before generic RTX 4-digit so "RTX 2000 Ada" doesn't lose "Ada")
  const wsMatch = folded.match(/\b(?:nvidia\s+)?(rtx\s+[at]\d{3,4}(?:\s*ada)?|rtx\s+\d{4}\s+ada|quadro\s+[rtpx]\d{3,4}[a-z]?)\b/i);
  if (wsMatch) {
    coreModel = wsMatch[1].toUpperCase().replace(/\s+/g, " ").replace(/\bADA\b/, "Ada");
  }

  // 2. NVIDIA GeForce RTX 20xx / 30xx / 40xx / 50xx + Ti / SUPER / Ti SUPER (match folded for Turkish "Tİ")
  if (!coreModel) {
    const rtxMatch = folded.match(
      /\b(?:nvidia\s+)?(?:geforce\s+)?rtx\s*(\d{4})\s*(?:(ti)\s*(super)?|(super))?/i
    );
    if (rtxMatch) {
      const parts = [`RTX ${rtxMatch[1]}`];
      if (rtxMatch[2]) parts.push("Ti");
      if (rtxMatch[3] || rtxMatch[4]) parts.push("Super");
      coreModel = parts.join(" ");
    }
  }

  // 3. NVIDIA GeForce GTX / MX / GT
  if (!coreModel) {
    const gtxMatch = folded.match(/\b(?:nvidia\s+)?(?:geforce\s+)?(gtx|mx)\s*(\d{3,4})\s*(ti|super)?\b/i);
    if (gtxMatch) {
      const suffix = gtxMatch[3] ? (gtxMatch[3].toLowerCase() === "ti" ? " Ti" : " Super") : "";
      coreModel = `${gtxMatch[1].toUpperCase()} ${gtxMatch[2]}${suffix}`;
    }
  }

  // 4. AMD Radeon RX series
  if (!coreModel) {
    const rxMatch = seg.match(/\b(?:amd\s+)?(?:radeon\s+)?rx\s*(\d{3,4})\s*(xtx|xt|gre|m|s)?\b/i);
    if (rxMatch) {
      const suffix = rxMatch[2] ? " " + rxMatch[2].toUpperCase() : "";
      coreModel = `RX ${rxMatch[1]}${suffix}`;
    }
  }

  // 5. Intel Arc dedicated GPUs
  if (!coreModel) {
    const arcMatch = seg.match(/\b(?:intel\s+)?arc\s+([ab]\d{3}m?)\b/i);
    if (arcMatch) {
      coreModel = `Intel Arc ${arcMatch[1].toUpperCase()}`;
    }
  }

  // 6. Apple Integrated GPU (e.g. "10 Çekirdek GPU", "16-Core GPU") or integrated AMD/Intel iGPU
  if (!coreModel) {
    const appleGpuMatch = folded.match(/(\d{1,2})[-\s]+(?:core|cekirdek|çekirdek)\s+gpu/i);
    if (appleGpuMatch) {
      coreModel = `${appleGpuMatch[1]} Çekirdek Entegre GPU`;
    } else if (/\bradeon\s*(?:780m|890m|680m|vega\s*\d+|graphics)\b/i.test(folded)) {
      const m = seg.match(/\bradeon\s*(?:780m|890m|680m|vega\s*\d+|graphics)\b/i);
      if (m) coreModel = `AMD ${m[0].replace(/\s+/g, " ").trim()}`;
    } else if (/\b(?:iris\s+xe|intel\s+(?:uhd|arc|hd)\s+graphics)\b/i.test(folded)) {
      const m = seg.match(/\b(?:intel\s+)?(iris\s+xe(?:\s+graphics)?|uhd\s+graphics|arc\s+graphics|hd\s+graphics)\b/i);
      if (m) coreModel = `Intel ${formatTitleBrandWords(m[1], false)}`;
    } else if (/dahili\s+(?:ekran\s+kart[iı]|gpu)|payla[sş][iı]ml[iı]/i.test(folded)) {
      coreModel = "Dahili / Paylaşımlı Grafik";
    }
  }

  if (!coreModel) return "";

  const partnerMatch = seg.match(AIB_PARTNER_RE);
  const edition = extractGpuEdition(seg);
  const { vram, memType, busBit } = extractVram(seg);

  // Extract laptop GPU TGP wattage only when explicitly attached without PSU confusion
  const tgpMatch = seg.match(/\b(3[5-9]|[4-9]\d|1[0-7]\d)\s*w\b/i);
  const tgp = tgpMatch && !/80\+|bronze|gold|psu|güç/i.test(folded) ? `${tgpMatch[1]}W` : "";

  const parts: string[] = [];

  // Put AIB brand + edition together cleanly when present (especially for Desktop AIB cards!)
  const hasDesktopBrand = Boolean(partnerMatch && !/^(?:intel|amd)$/i.test(partnerMatch[1]) && !coreModel.startsWith("Intel") && !coreModel.startsWith("AMD"));
  if (hasDesktopBrand && edition) {
    const brandFmt = formatTitleBrandWords(partnerMatch![1], false);
    parts.push(`${brandFmt} ${coreModel} ${edition}`);
  } else if (edition) {
    parts.push(`${coreModel} ${edition}`);
  } else if (hasDesktopBrand) {
    const brandFmt = formatTitleBrandWords(partnerMatch![1], false);
    parts.push(`${brandFmt} ${coreModel}`);
  } else {
    parts.push(coreModel);
  }

  if (vram) {
    parts.push(memType ? `${vram} ${memType}` : vram);
  }
  if (busBit) {
    parts.push(busBit);
  }
  if (tgp) {
    parts.push(tgp);
  }

  return parts.join(" · ");
}
