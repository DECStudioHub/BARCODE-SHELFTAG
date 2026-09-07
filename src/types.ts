export interface InventoryItem {
  id: string;
  locator: string;
  sku: string;
  upcNo: string;
  description: string;
  barcode: string;
  count: number | string;
  counter: string;
  scanner: string;
  validator: string;
  isSelected?: boolean;
  rawRowIndex?: number;
}

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  itemId: string;
  row: number;
  field: keyof InventoryItem;
  fieldName: string;
  severity: IssueSeverity;
  message: string;
  value?: any;
}

export interface ValidationSummary {
  totalRows: number;
  validItems: number;
  warningItems: number;
  errorItems: number;
  issues: ValidationIssue[];
  missingRequiredColumns: string[];
  duplicateSKUs: string[];
  duplicateUPCs: string[];
}

export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'UPCA';

export type PaperSize = 'A4' | 'LETTER' | 'CUSTOM';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
  label: string;
}

export interface LayoutConfig {
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: 'portrait' | 'landscape';
  columns: number;
  tagWidthMm: number;
  tagHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapRowMm: number;
  gapColMm: number;
  barcodeType: BarcodeType;
  barcodeHeightMm: number;
  fontSizeDesc: number;
  fontSizeSku: number;
  fontSizeLocator: number;
  fontSizeFields: number;
  printBlankCountFields: boolean;
  showCutGuides: boolean;
  showBorders: boolean;
  showSessionHeader: boolean;
  headerStyle: 'filled' | 'bordered' | 'minimal';
  showLogo?: boolean;
  logoUrl?: string;
  logoHeightMm?: number;
  showTagNumber?: boolean;
  countBoxHeightMm?: number;
  countBoxWidthPercent?: number;
  countBoxGapTopMm?: number;
  countBoxFontSize?: number;
  countBoxBorderWidth?: number;
}

export interface InventorySession {
  branch: string;
  store: string;
  inventoryDate: string;
  preparedBy: string;
  sessionNotes: string;
}

export type AppStep = 'import' | 'validate' | 'configure' | 'preview' | 'settings';

export type ColorPaletteId = 'emerald' | 'blue' | 'indigo' | 'crimson' | 'amber' | 'violet' | 'slate' | 'custom';

export interface ColorPaletteTheme {
  id: ColorPaletteId;
  name: string;
  description: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  ringColor: string;
  hex: string;
}

export interface SystemSettings {
  systemName: string;
  systemTagline: string;
  systemSubtitle: string;
  paletteId: ColorPaletteId;
  customPrimaryColor?: string;
  customLogoUrl: string;
  applyLogoToShelfTags: boolean;
}
