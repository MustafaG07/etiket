import { cleanBulletText, foldTrI, TR_START, TR_END } from "../turkish";

function formatClockSpeed(segment: string): string {
  const m = segment.match(/(\d+(?:[.,]\d+)?)\s*ghz/i);
  if (!m) return "";
  return `${m[1].replace(",", ".")}GHz`;
}

function formatCoreCount(segment: string): string {
  const m = foldTrI(segment).match(/(\d{1,2})\s*\.?\s*(?!gpu\b)(?:cpu\s+)?(?:cekirdek|çekirdek|core)/i);
  if (!m) return "";
  const count = Number(m[1]);
  if (!Number.isFinite(count) || count < 2 || count > 128) return "";
  return `${count} Çekirdek`;
}

export function extractCpuFromSegment(rawSegment: string): string {
  const seg = cleanBulletText(rawSegment).replace(/^\s*(?:i[sş]lemci|cpu|processor)\s*:\s*/i, "").trim();
  if (!seg) return "";
  const folded = foldTrI(seg);

  // Reject GPU / Motherboard / SSD lines misidentified as CPU
  if (/(?:rtx|gtx|rx\s*\d|gddr\d|anakart|b650|b760|h610|h810|z790|nvme|m\.2)/i.test(folded)) {
    // Unless the line explicitly begins with or cleanly pairs a CPU token before another separator
    if (!/(?:core\s+ultra|i[3579][-\s]?\d{4,5}|ryzen\s*(?:[3579]|ai)|xeon)/i.test(folded)) {
      return "";
    }
  }

  let baseCpu = "";

  // 1. Intel Core Ultra (Series 1 & Series 2: e.g. Ultra 5 245KF, Ultra 5 250KF Plus, Core Ultra 7 155H)
  const ultraMatch = folded.match(/(?:intel\s+)?(?:core\s+)?ultra\s+([3579])\s+(\d{3}[a-z]{0,3})(?:\s+(plus))?/i);
  if (ultraMatch) {
    baseCpu = `Intel Core Ultra ${ultraMatch[1]} ${ultraMatch[2].toUpperCase()}${ultraMatch[3] ? " Plus" : ""}`;
  }

  // 2. Intel Core 3 / 5 / 7 (non-Ultra Core 100U/200H series)
  if (!baseCpu) {
    const coreSeriesMatch = folded.match(/(?:intel\s+)?core\s+([3579])\s+(\d{3}[uh]{1,2})/i);
    if (coreSeriesMatch) {
      baseCpu = `Intel Core ${coreSeriesMatch[1]} ${coreSeriesMatch[2].toUpperCase()}`;
    }
  }

  // 3. Intel Core i3 / i5 / i7 / i9 (supports "i5-12450H", "i7 13620H", "i5-1145G7", "İ5-1235U")
  if (!baseCpu) {
    const intelIMatch = folded.match(/(?:intel\s+)?(?:core\s+)?\b(i[3579])[-\s]?(\d{4,5}(?:g[147]|[a-z]{0,3}))\b/i);
    if (intelIMatch) {
      baseCpu = `Intel Core ${intelIMatch[1].toLowerCase()}-${intelIMatch[2].toUpperCase()}`;
    } else {
      const genOnly = folded.match(/(?:intel\s+)?(?:core\s+)?(i[3579])\s+(\d{1,2})\.\s*nesil/i);
      if (genOnly) {
        baseCpu = `Intel Core ${genOnly[1].toLowerCase()} (${genOnly[2]}. Nesil)`;
      }
    }
  }

  // 4. AMD Ryzen (supports Ryzen 3/5/7/9, R3/R5/R7/R9, Ryzen AI 9 HX 370, X3D chips, Threadripper)
  if (!baseCpu) {
    const ryzenAiMatch = folded.match(
      /(?:amd\s+)?ryzen\s+ai\s+([3579])(?:\s+(?:max\+?|hx|pro))?\s+(\d{3}[a-z]{0,3})/i
    );
    if (ryzenAiMatch) {
      const midToken = seg.match(/ryzen\s+ai\s+[3579]\s+((?:max\+?|hx|pro)\s+)?\d{3}/i)?.[1]?.trim() || "";
      baseCpu = `AMD Ryzen AI ${ryzenAiMatch[1]}${midToken ? " " + midToken.toUpperCase() : ""} ${ryzenAiMatch[2].toUpperCase()}`;
    }
  }
  if (!baseCpu) {
    const ryzenMatch = folded.match(
      new RegExp(`${TR_START}(?:amd\\s+)?(?:ryzen|r)\\s*([3579])[-\\s]+(?:pro\\s+)?(\\d{4,5}(?:x3d|hs|hx|u|h|x|f|g|ge|xt)?)${TR_END}`, "i")
    );
    if (ryzenMatch) {
      const hasPro = /ryzen\s+[3579]\s+pro/i.test(folded);
      baseCpu = `AMD Ryzen ${ryzenMatch[1]}${hasPro ? " Pro" : ""} ${ryzenMatch[2].toUpperCase()}`;
    }
  }
  if (!baseCpu) {
    const trMatch = folded.match(/(?:amd\s+)?(?:ryzen\s+)?threadripper\s+(?:pro\s+)?(\d{4}[a-z]{0,3})/i);
    if (trMatch) {
      baseCpu = `AMD Threadripper ${trMatch[1].toUpperCase()}`;
    }
  }

  // 5. Intel Xeon
  if (!baseCpu) {
    const xeonMatch = folded.match(/(?:intel\s+)?xeon\s+([ew]-?\d{4}(?:\s*v\d)?)/i);
    if (xeonMatch) {
      baseCpu = `Intel Xeon ${xeonMatch[1].toUpperCase().replace(/\s+/g, " ")}`;
    }
  }

  // 5b. Qualcomm Snapdragon X (Oryon / Elite / Plus)
  if (!baseCpu) {
    const snapMatch = folded.match(/(?:qualcomm\s+)?snapdragon\s+(x(?:\s+(?:elite|plus|oryon))?|\d+\s*(?:gen\s*\d)?)/i);
    if (snapMatch) {
      const suffix = snapMatch[1]
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join(" ");
      baseCpu = `Qualcomm Snapdragon ${suffix}`;
    }
  }

  // 6. Apple Silicon (M1 / M2 / M3 / M4 / M5) — NEVER match M.2 / M2 SSD / M2 Anakart!
  if (!baseCpu && !/\bm\.2\b|\bnvme\b|\banakart\b|\bgen[345]\b|\bm2\s*(?:ssd|nvme|slot|anakart)\b/i.test(folded)) {
    const appleMatch = folded.match(
      /(?:apple\s+)?\b(m[1-5])(?:\s+(pro|max|ultra))?\b(?:\s*(?:çip|cip|chip|işlemci|islemci|core))?/i
    );
    if (appleMatch) {
      const hasAppleOrChipContext =
        /\bapple\b|\bmacbook\b|\bmac\b|\bpro\b|\bmax\b|\bultra\b|[çc]ip|chip|i[sş]lemci|çekirdek|cekirdek|core/i.test(
          folded
        );
      if (hasAppleOrChipContext) {
        const tier = appleMatch[2]
          ? " " + appleMatch[2].charAt(0).toUpperCase() + appleMatch[2].slice(1).toLowerCase()
          : "";
        baseCpu = `Apple ${appleMatch[1].toUpperCase()}${tier}`;
      }
    }
  }

  if (!baseCpu) return "";

  const extras: string[] = [];
  const ghz = formatClockSpeed(seg);
  const cores = formatCoreCount(seg);
  if (ghz) extras.push(ghz);
  if (cores) extras.push(cores);

  return extras.length > 0 ? `${baseCpu} · ${extras.join(" · ")}` : baseCpu;
}
