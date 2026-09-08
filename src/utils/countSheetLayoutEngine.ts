import {
  CountSheetColumnId,
  CountSheetColumnWidths,
  CountSheetConfig,
  CountSheetPageData,
  CountSheetPreset,
  CountSheetSummary,
  InventoryItem,
  PaperSize,
} from '../types';
import { PAPER_SPECS } from './shelftagLayoutEngine';

export const DEFAULT_COUNT_SHEET_COLUMN_ORDER: CountSheetColumnId[] = [
  'sku',
  'barcode',
  'description',
  'count',
];

export const DEFAULT_COUNT_SHEET_COLUMN_VISIBILITY: Record<CountSheetColumnId, boolean> = {
  sku: true,
  barcode: true,
  description: true,
  count: true,
};

export const DEFAULT_COUNT_SHEET_CONFIG: CountSheetConfig = {
  paperSize: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  rowsPerPage: 20, // Default 20 rows as mandated
  marginTopMm: 8,
  marginBottomMm: 8,
  marginLeftMm: 8,
  marginRightMm: 8,
  rowHeightMm: 11, // Comfortable handwriting height
  tableWidthPercent: 100,
  columnWidths: {
    skuMm: 28,
    barcodeMm: 42,
    descMm: 88,
    countMm: 34,
  },
  columnOrder: [...DEFAULT_COUNT_SHEET_COLUMN_ORDER],
  columnVisibility: { ...DEFAULT_COUNT_SHEET_COLUMN_VISIBILITY },

  // Typography
  headerFontFamily: 'sans-serif',
  headerFontSizePt: 9,
  headerFontWeight: 'bold',

  bodyFontFamily: 'sans-serif',
  bodyFontSizePt: 8.5,

  skuFontSizePt: 8.5,
  barcodeTextFontSizePt: 7,
  descFontSizePt: 8.5,
  countHeaderFontSizePt: 9,

  // Description text wrapping
  wrapDescription: true,
  descMaxLines: 2,
  descLineHeight: 1.25,

  // Barcode Column
  showBarcodeGraphic: true,
  barcodeHeightMm: 7.5,
  barcodeFormat: 'CODE128',
  showBarcodeValueText: true,
  barcodeAlign: 'center',

  // Locator Barcode (Upper-Right)
  showLocatorBarcode: true,
  locatorBarcodeHeightMm: 11,
  locatorBarcodeWidthScale: 1.3,
  locatorBarcodeFormat: 'CODE128',
  showLocatorBarcodeText: true,

  // Layout & Table Features
  showGridLines: true,
  borderWidthPx: 1,
  showRowNumbers: true,
  showSignatures: true,
  showStoreHeader: true,
  showPageNumbers: true,
  emptyRowsToFillPage: true,
};

export const DEFAULT_COUNT_SHEET_PRESETS: CountSheetPreset[] = [
  {
    id: 'standard_20',
    name: 'Standard Count Sheet (20 Rows)',
    description: 'Default 20 item rows per page on A4 paper with upper-right locator barcode.',
    isDefault: true,
    config: { ...DEFAULT_COUNT_SHEET_CONFIG },
  },
  {
    id: 'large_writing_15',
    name: 'Large Writing Area (15 Rows)',
    description: 'Generous 14.5mm row height with 15 rows/page for fast manual handwriting in selling area.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      rowsPerPage: 15,
      rowHeightMm: 14.5,
      columnWidths: {
        skuMm: 28,
        barcodeMm: 42,
        descMm: 82,
        countMm: 40,
      },
      bodyFontSizePt: 9,
      descFontSizePt: 9,
    },
  },
  {
    id: 'compact_25',
    name: 'Compact Count Sheet (25 Rows)',
    description: 'Paper saver with 25 rows per page, ideal for large inventory audits.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      rowsPerPage: 25,
      rowHeightMm: 8.8,
      bodyFontSizePt: 7.8,
      skuFontSizePt: 7.8,
      descFontSizePt: 7.8,
      barcodeHeightMm: 6,
    },
  },
  {
    id: 'letter_20',
    name: 'Letter Size (20 Rows)',
    description: 'Standard 20 rows on US Letter paper (8.5 × 11 in / 216 × 279 mm).',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      paperSize: 'LETTER',
      rowsPerPage: 20,
      rowHeightMm: 10.2,
      columnWidths: {
        skuMm: 30,
        barcodeMm: 44,
        descMm: 88,
        countMm: 34,
      },
    },
  },
  {
    id: 'long_bond_25',
    name: 'Long Bond (25 Rows)',
    description: 'Optimized for 8.5 × 13 in Long Bond paper with 25 rows per sheet.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      paperSize: 'LONG_BOND',
      rowsPerPage: 25,
      rowHeightMm: 10.8,
      columnWidths: {
        skuMm: 30,
        barcodeMm: 44,
        descMm: 88,
        countMm: 34,
      },
    },
  },
];

export function getCountSheetPaperDimensions(
  paperSize: PaperSize,
  customWidthMm: number,
  customHeightMm: number,
  orientation: 'portrait' | 'landscape'
) {
  let width = 210;
  let height = 297;

  if (paperSize === 'CUSTOM') {
    width = customWidthMm || 210;
    height = customHeightMm || 297;
  } else if (PAPER_SPECS[paperSize]) {
    width = PAPER_SPECS[paperSize].widthMm;
    height = PAPER_SPECS[paperSize].heightMm;
  }

  if (orientation === 'landscape') {
    return {
      widthMm: Math.max(width, height),
      heightMm: Math.min(width, height),
    };
  }

  return {
    widthMm: Math.min(width, height),
    heightMm: Math.max(width, height),
  };
}

/**
 * Group inventory items by locator
 */
export function groupItemsByLocator(items: InventoryItem[]): Record<string, InventoryItem[]> {
  const groups: Record<string, InventoryItem[]> = {};

  items.forEach(item => {
    const loc = String(item.locator || '').trim().toUpperCase() || 'UNASSIGNED';
    if (!groups[loc]) {
      groups[loc] = [];
    }
    groups[loc].push(item);
  });

  // Sort groups alphabetically by locator name, putting UNASSIGNED last if present
  const sortedLocators = Object.keys(groups).sort((a, b) => {
    if (a === 'UNASSIGNED') return 1;
    if (b === 'UNASSIGNED') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const sortedGroups: Record<string, InventoryItem[]> = {};
  sortedLocators.forEach(loc => {
    sortedGroups[loc] = groups[loc];
  });

  return sortedGroups;
}

/**
 * Paginate items by locator and rowsPerPage
 */
export function paginateCountSheetItems(
  items: InventoryItem[],
  rowsPerPage: number = 20,
  filterLocator?: string
): CountSheetPageData[] {
  const selectedItems = items.filter(it => it.isSelected !== false);
  const grouped = groupItemsByLocator(selectedItems);
  const pages: CountSheetPageData[] = [];

  let globalPageIndex = 1;
  const targetLocators = filterLocator && filterLocator !== 'ALL'
    ? [filterLocator]
    : Object.keys(grouped);

  // First count total global pages
  let totalGlobalPages = 0;
  targetLocators.forEach(loc => {
    const locItems = grouped[loc] || [];
    const locPages = Math.max(1, Math.ceil(locItems.length / Math.max(1, rowsPerPage)));
    totalGlobalPages += locPages;
  });

  targetLocators.forEach(loc => {
    const locItems = grouped[loc] || [];
    const totalPagesForLoc = Math.max(1, Math.ceil(locItems.length / Math.max(1, rowsPerPage)));

    if (locItems.length === 0) {
      // Empty page for locator
      pages.push({
        pageNumber: 1,
        totalPagesForLocator: 1,
        globalPageIndex: globalPageIndex++,
        totalGlobalPages,
        locator: loc,
        items: [],
        startIndex: 0,
        endIndex: 0,
      });
      return;
    }

    for (let p = 0; p < totalPagesForLoc; p++) {
      const start = p * rowsPerPage;
      const end = Math.min(start + rowsPerPage, locItems.length);
      const pageItems = locItems.slice(start, end);

      pages.push({
        pageNumber: p + 1,
        totalPagesForLocator: totalPagesForLoc,
        globalPageIndex: globalPageIndex++,
        totalGlobalPages,
        locator: loc,
        items: pageItems,
        startIndex: start,
        endIndex: end,
      });
    }
  });

  return pages;
}

/**
 * Calculate count sheet summary statistics
 */
export function calculateCountSheetSummary(
  items: InventoryItem[],
  rowsPerPage: number = 20
): CountSheetSummary {
  const selectedItems = items.filter(it => it.isSelected !== false);
  const grouped = groupItemsByLocator(selectedItems);
  const locatorKeys = Object.keys(grouped);

  let totalPages = 0;
  const locatorCounts = locatorKeys.map(loc => {
    const count = grouped[loc].length;
    const pages = Math.max(1, Math.ceil(count / Math.max(1, rowsPerPage)));
    totalPages += pages;
    return { locator: loc, count, pages };
  });

  return {
    totalItems: selectedItems.length,
    totalLocators: locatorKeys.length,
    rowsPerPage: Math.max(1, rowsPerPage),
    estimatedPages: totalPages,
    locatorCounts,
  };
}
