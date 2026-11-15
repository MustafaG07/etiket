export type SpecIconKey =
  | "cpu"
  | "gpu"
  | "ram"
  | "ssd"
  | "screen"
  | "battery"
  | "extras"
  | "mobo"
  | "psu";

export interface SpecRow {
  icon: SpecIconKey;
  k: string;
  v: string;
}

export interface ParsedLabel {
  title: string;
  subtitle: string;
  stockCode: string;
  specs: SpecRow[];
  warrantyTitle: string;
  warrantyDuration: string;
  warrantyDetail: string;
  boxTitle: string;
  boxLine1: string;
  boxLine2: string;
}

export interface SpecRowOverride {
  k?: string;
  v?: string;
}

export type LabelOverrides = Partial<Omit<ParsedLabel, "specs">> & {
  specs?: Record<number, SpecRowOverride>;
};

export interface LabelEntry {
  rawText: string;
  overrides?: LabelOverrides;
}

export type GapSetting = "0mm" | "2mm";
export type ZoomSetting = number | "fit" | "fit-page";

export interface AppSettings {
  gap: GapSetting;
  showCutLines: boolean;
  showStockCode: boolean;
  slogan: string;
  defaultWarrantyOrg: string;
  zoom: ZoomSetting;
}

export interface AppState {
  labels: LabelEntry[];
  settings: AppSettings;
  selectedIndex: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: "info" | "success" | "error";
}
