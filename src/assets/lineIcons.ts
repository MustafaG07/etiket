import type { SpecIconKey } from "../types/label";

export type LineIconName = SpecIconKey | "shield" | "box";

export const LINE_ICONS: Record<LineIconName, string> = {
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="6" width="12" height="12" rx="1.5"/>
        <rect x="9.5" y="9.5" width="5" height="5"/>
        <path d="M9.5 2.5v3.5M14.5 2.5v3.5M9.5 18v3.5M14.5 18v3.5M2.5 9.5h3.5M2.5 14.5h3.5M18 9.5h3.5M18 14.5h3.5"/>
      </svg>`,
  gpu: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 5.5h2.5v13"/>
        <rect x="4.5" y="6.5" width="17" height="10.5" rx="1.5"/>
        <circle cx="14.5" cy="11.75" r="3.2"/>
        <circle cx="14.5" cy="11.75" r="1" fill="#000000" stroke="none"/>
        <path d="M8 9.5v4.5"/>
      </svg>`,
  ram: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2.5" y="7" width="19" height="9" rx="1.2"/>
        <path d="M7.5 7v9M12 7v9M16.5 7v9"/>
      </svg>`,
  ssd: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <text x="12" y="14.5" text-anchor="middle" font-size="7" font-weight="900" font-family="Arial, sans-serif" fill="#000000" stroke="none">SSD</text>
      </svg>`,
  screen: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.2"/>
        <path d="M12 16v3M6 19h12"/>
      </svg>`,
  battery: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.5 2.5h5v2h-5z"/>
        <rect x="6.5" y="4.5" width="11" height="17" rx="1.8"/>
        <path d="M12.6 8l-3 5h2.5l-0.7 4.5 3-5h-2.5z" fill="#000000" stroke="none"/>
      </svg>`,
  extras: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3L12 3z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`,
  mobo: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3.5" width="16" height="17" rx="1.6"/>
        <rect x="7.5" y="7" width="5.5" height="5.5" rx="0.8"/>
        <path d="M16 7v4M18 7v4M7.5 16.5h6M16.5 14v3.5"/>
      </svg>`,
  psu: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3.5" y="5" width="17" height="14" rx="2"/>
        <circle cx="9.5" cy="12" r="3.4"/>
        <path d="M15.8 8.5l-1.5 3.3h2.1l-1.5 3.7"/>
      </svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.5l7.5 3.2v5.8c0 4.9-3.2 9.1-7.5 10.5-4.3-1.4-7.5-5.6-7.5-10.5V5.7L12 2.5z"/>
        <path d="M8.8 12.2l2.3 2.3 4.4-4.6"/>
      </svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2l8-4.4z"/>
        <path d="M12 12l8-4.8M12 12L4 7.2M12 12v9.2"/>
      </svg>`,
};
