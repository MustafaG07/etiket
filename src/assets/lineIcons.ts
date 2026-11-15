import type { SpecIconKey } from "../types/label";

export type LineIconName = SpecIconKey | "shield" | "box";

/**
 * Official Lucide v1.73.0 SVG icons (ISC License), tuned with thin 1.35px stroke
 * for crisp readability on 60x79mm vitrine labels and 450 DPI PDF output.
 */
export const LINE_ICONS: Record<LineIconName, string> = {
  cpu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/>
    <path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/>
    <path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/>
    <path d="M7 20v2"/><path d="M7 2v2"/>
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="8" y="8" width="8" height="8" rx="1"/>
  </svg>`,
  gpu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 17h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2"/>
    <path d="M2 21V3"/>
    <path d="M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3"/>
    <circle cx="16" cy="11" r="2"/>
    <circle cx="8" cy="11" r="2"/>
  </svg>`,
  ram: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 12v-2"/><path d="M12 18v-2"/>
    <path d="M16 12v-2"/><path d="M16 18v-2"/>
    <path d="M2 11h1.5"/><path d="M20 18v-2"/><path d="M20.5 11H22"/>
    <path d="M4 18v-2"/><path d="M8 12v-2"/><path d="M8 18v-2"/>
    <rect x="2" y="6" width="20" height="10" rx="2"/>
  </svg>`,
  ssd: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 16h.01"/>
    <path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    <path d="M21.946 12.013H2.054"/>
    <path d="M6 16h.01"/>
  </svg>`,
  screen: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <line x1="8" x2="16" y1="21" y2="21"/>
    <line x1="12" x2="12" y1="17" y2="21"/>
  </svg>`,
  battery: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="m11 7-3 5h4l-3 5"/>
    <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935"/>
    <path d="M22 14v-4"/>
    <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936"/>
  </svg>`,
  extras: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
  </svg>`,
  mobo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M11 9h4a2 2 0 0 0 2-2V3"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="M7 21v-4a2 2 0 0 1 2-2h4"/>
    <circle cx="15" cy="15" r="2"/>
  </svg>`,
  psu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/>
    <path d="m2 22 3-3"/>
    <path d="M7.5 13.5 10 11"/>
    <path d="M10.5 16.5 13 14"/>
    <path d="m18 3-4 4h6l-4 4"/>
  </svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>`,
  box: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22V12"/>
    <path d="m16 17 2 2 4-4"/>
    <path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"/>
    <path d="M3.29 7 12 12l8.71-5"/>
    <path d="m7.5 4.27 8.997 5.148"/>
  </svg>`,
};
