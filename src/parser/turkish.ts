export function foldTrI(s: string): string {
  return String(s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase();
}

export function foldTrAscii(s: string): string {
  return foldTrI(s)
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");
}

export function trUpper(s: string): string {
  return String(s || "").toLocaleUpperCase("tr-TR");
}

export function trLower(s: string): string {
  return String(s || "").toLocaleLowerCase("tr-TR");
}

/**
 * Turkish-safe boundary helpers.
 * JavaScript's `\b` treats Turkish letters (`ğüşıöçİĞÜŞÖÇ`) as non-word characters,
 * which causes false matches or missed boundaries in Turkish strings.
 */
export const TR_START = "(?:^|[\\s(\\[{\"'|,;/:-])";
export const TR_END = "(?=$|[\\s)\\]}\"'.,;:!?|,;/:-])";

export function cleanBulletText(s: string): string {
  return String(s || "")
    .replace(/^[\s>]+/, "")
    .replace(/^#{1,6}\s*(?:\d+[.)]\s*)?/, "")
    .replace(/^[\s•●◦▪▫·➤➜➢►★☆✔✅✓☑🔋🎮💻🖥️🖥⚙️📦🛡️🛡🚀📌🔹🔸◾◽\-–—]+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\*\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripAdFiller(s: string): string {
  let out = String(s || "").replace(/\s+/g, " ").trim();
  const fillerPatterns: RegExp[] = [
    /\(\s*oyuncu\s*\)/gi,
    new RegExp(`${TR_START}(?:gaming\\s*\\(oyuncu\\)|oyuncu\\s+ekran\\s+kart[iı]|ekran\\s+kart[iı]\\s+dahil)${TR_END}`, "gi"),
    new RegExp(`${TR_START}(?:t[uü]rkiye\\s+garantili|resmi\\s+distrib[uü]t[oö]r|yetkili\\s+servis|sıfır\\s+ayar[iı]nda|sifir\\s+ayarinda|tertemiz|sorunsuz|hatas[iı]z|kusursuz|kozmetik\\s*10\\s*/\\s*10|acil\\s+sat[iı]l[iı]k|pazarl[iı]ks[iı]z|takas\\s+yok)${TR_END}`, "gi"),
  ];
  for (const re of fillerPatterns) {
    out = out.replace(re, " ");
  }
  return out
    .replace(/^[\s|•·,/:-]+|[\s|•·,/:-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const UPPER_TOKENS = new Set([
  "ASUS", "MSI", "HP", "DELL", "LG", "IBM", "AMD", "ATI", "CPU", "GPU", "RAM", "SSD", "HDD",
  "NVME", "M2", "PCIE", "SATA", "DDR", "DDR3", "DDR4", "DDR5", "LPDDR4", "LPDDR4X", "LPDDR5",
  "LPDDR5X", "GDDR5", "GDDR6", "GDDR6X", "GDDR7", "RTX", "GTX", "GT", "RX", "XT", "XTX",
  "GRE", "TI", "OC", "ROG", "TUF", "LOQ", "OMEN", "XPS", "GS", "GE", "GP", "GL", "GF",
  "IPS", "OLED", "VA", "TN", "LED", "LCD", "FHD", "QHD", "UHD", "WUXGA", "WQXGA", "HDR",
  "RGB", "ARGB", "ATX", "MATX", "ITX", "PSU", "AIO", "WIFI", "WI-FI", "USB", "HDMI", "DP",
  "GB", "TB", "MB", "GHZ", "MHZ", "HZ", "MM", "PC", "AI", "OS", "WIN11", "WIN10",
]);

const BRAND_CASING: Record<string, string> = {
  lenovo: "Lenovo",
  hp: "HP",
  asus: "ASUS",
  msi: "MSI",
  acer: "Acer",
  monster: "Monster",
  casper: "Casper",
  excalibur: "Excalibur",
  apple: "Apple",
  macbook: "MacBook",
  dell: "Dell",
  huawei: "Huawei",
  xiaomi: "Xiaomi",
  samsung: "Samsung",
  razer: "Razer",
  gigabyte: "Gigabyte",
  aorus: "AORUS",
  asrock: "ASRock",
  palit: "Palit",
  zotac: "ZOTAC",
  galax: "GALAX",
  gainward: "Gainward",
  inno3d: "Inno3D",
  pny: "PNY",
  sapphire: "Sapphire",
  powercolor: "PowerColor",
  xfx: "XFX",
  corsair: "Corsair",
  crucial: "Crucial",
  kingston: "Kingston",
  gskill: "G.Skill",
  lexar: "Lexar",
  fazeon: "Fazeon",
  powerboost: "PowerBoost",
  nzxt: "NZXT",
  deepcool: "DeepCool",
  thermalright: "Thermalright",
  arctic: "Arctic",
  noctua: "Noctua",
  fsp: "FSP",
  seasonic: "Seasonic",
  thermaltake: "Thermaltake",
  lian: "Lian",
  vento: "Vento",
  rampage: "Rampage",
  gamepower: "GamePower",
  intel: "Intel",
  nvidia: "NVIDIA",
  geforce: "GeForce",
  radeon: "Radeon",
  ryzen: "Ryzen",
  core: "Core",
  ultra: "Ultra",
  victus: "Victus",
  legion: "Legion",
  nitro: "Nitro",
  predator: "Predator",
  thinkpad: "ThinkPad",
  ideapad: "IdeaPad",
  vivobook: "VivoBook",
  zenbook: "ZenBook",
  pavilion: "Pavilion",
  envy: "Envy",
  spectre: "Spectre",
  latitude: "Latitude",
  inspiron: "Inspiron",
  precision: "Precision",
  pro: "Pro",
  air: "Air",
  max: "Max",
  eagle: "Eagle",
  ventus: "Ventus",
  dual: "Dual",
  prime: "Prime",
  fury: "Fury",
  beast: "Beast",
  renegade: "Renegade",
  vengeance: "Vengeance",
  dominator: "Dominator",
  trident: "Trident",
  ripjaws: "Ripjaws",
  lancer: "Lancer",
  ares: "Ares",
  circle: "Circle",
  white: "White",
  siyah: "Siyah",
  beyaz: "Beyaz",
  gaming: "Gaming",
  twin: "Twin",
  edge: "Edge",
  inspire: "Inspire",
  flare: "Flare",
  hikvision: "Hikvision",
  strong: "Strong",
  western: "Western",
  digital: "Digital",
  optiplex: "OptiPlex",
  thinkcentre: "ThinkCentre",
  prodesk: "ProDesk",
  elitebook: "EliteBook",
  probook: "ProBook",
  compaq: "Compaq",
  aspire: "Aspire",
  cyborg: "Cyborg",
  odyssey: "Odyssey",
  qualcomm: "Qualcomm",
  snapdragon: "Snapdragon",
  oryon: "Oryon",
};

export function formatTitleBrandWords(text: string, preserveModelUpper = true): string {
  return String(text || "")
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const clean = part.replace(/^[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+|[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ.+/-]+$/g, "");
      if (!clean) return part;
      const lower = foldTrAscii(clean);
      const brandHit = BRAND_CASING[lower];
      if (brandHit) {
        return part.replace(clean, brandHit);
      }
      const upper = trUpper(clean);
      if (UPPER_TOKENS.has(upper)) {
        return part.replace(clean, upper);
      }
      if (preserveModelUpper && /^[A-Z0-9][A-Z0-9._/-]*\d[A-Z0-9._/-]*$/.test(clean)) {
        return part;
      }
      return part;
    })
    .join("");
}

export function cleanTextSpaces(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}

export function isNonEmpty(s: string | undefined | null): s is string {
  return typeof s === "string" && s.trim().length > 0;
}
