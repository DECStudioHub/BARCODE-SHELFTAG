/**
 * Authoritative DEC System Version & Release History Configuration
 * 
 * This file serves as the single source of truth for application versioning,
 * release dates, update notes, and historical milestones.
 * 
 * To release a new version in the future:
 * Simply prepend a new SystemRelease object to the DEC_RELEASES array.
 * The system automatically sets CURRENT_VERSION, DISPLAY_VERSION, and the
 * Latest Update notes from the first entry.
 */

export type ReleaseType = 'major' | 'minor' | 'patch';

export interface ReleaseChangeItem {
  type: 'feature' | 'improvement' | 'fix';
  text: string;
}

export interface SystemRelease {
  version: string;
  releaseDate: string;
  releaseType: ReleaseType;
  title: string;
  summary: string;
  highlights: string[];
  changes?: ReleaseChangeItem[];
}

export const SYSTEM_PREFIX = 'DEC';
export const SYSTEM_FULL_NAME = 'Digital Efficiency & Continuity System';
export const SYSTEM_SUBTITLE = 'Backup • Continuity • Alternative Process • Process Improvement';

export const DEC_RELEASES: SystemRelease[] = [
  {
    version: '2.0.1',
    releaseDate: 'September 12, 2026',
    releaseType: 'patch',
    title: 'Count Sheet Ink-Saving Print Engine & Welcome UI Update',
    summary:
      'Official DEC v2.0.1 release optimizing Count Sheet printing with dynamic actual SKU rows, ink-saving table termination, empty SKU group omission, and Welcome UI synchronization.',
    highlights: [
      'Count Sheet Ink-Saving Fix: Rows Per Page is strictly treated as maximum capacity; table terminates immediately after the last actual SKU row without forced empty bordered rows',
      'Dynamic Table Height: Print preview, browser print, and vector PDF dynamically shrink table dimensions to fit actual SKU count (e.g. 5 SKUs = 5 rows, not 15)',
      'No SKU Data = No Table: Empty locators or groups with zero valid SKU records cleanly omit the table area entirely, preventing wasteful blank bordered boxes',
      'Rigorous SKU Data Validation: Discards empty records and phantom objects so only valid inventory items generate table rows',
      'Multi-Page Ink Efficiency: Large locators split cleanly across pages (e.g. 20 SKUs at 15/page yields Page 1 with 15 rows and Page 2 with 5 rows)',
      'Preview, Print, and PDF Parity: Screen preview, browser print preview, native print output, and downloaded PDF use identical dynamic row rendering logic',
      'Welcome UI Synchronization: System-wide display updated to DEC v2.0.1 while preserving full branding and audio welcome chime',
    ],
    changes: [
      { type: 'improvement', text: 'Treated Count Sheet Rows Per Page strictly as a maximum capacity rather than a requirement to fill the page' },
      { type: 'fix', text: 'Eliminated unnecessary empty bordered table rows from Count Sheet live preview, browser print, and PDF generation' },
      { type: 'feature', text: 'Omitted Count Sheet table structure entirely when a locator contains zero valid SKU records' },
      { type: 'improvement', text: 'Validated SKU records to ignore empty objects, preventing phantom row creation' },
      { type: 'feature', text: 'Updated Welcome UI and system metadata to display DEC v2.0.1' },
    ],
  },
  {
    version: '2.0.0',
    releaseDate: 'September 12, 2026',
    releaseType: 'major',
    title: 'Platform Consolidation & Intelligent Paper-Saving Engine',
    summary:
      'Official DEC v2.0.0 milestone consolidating dual-module inventory workflows, paper-saving slot packing, theme customization, and validated system backup.',
    highlights: [
      'Filter Locator for Count Tags: Filter and print specific locators with Select All, Clear All, Invert, and live tag count tracking without altering original Excel data',
      'Count Tag Printed Indicator: Dynamic tracking of printed locators across browser print and PDF export with full reprint support and print status reset',
      'Optimized Count Sheet Rows: Rows per page is now treated as a maximum, eliminating forced empty rows and tightening table borders to actual items',
      'Independent Barcode Width: Precision barcode width control in millimeters, rendered consistently across screen preview, browser print, and PDF',
      'Production Print Fix for GitHub Pages: Correctly resolved stylesheet links and base URLs for reliable printing under repository subpath deployments',
      'Guaranteed Logo Rendering: Vector Prince Retail logo fallback and custom data URL support ensures logos never go missing during printing or export',
      'Intelligent Count Tag Packing: Eliminates wasted tag slots by grouping items by locator and packing sheets efficiently',
      'Dual-Module Operations: Seamless switching between Physical Inventory Count Tags/Sheets and Retail ShelfTag / Promo PP Tags',
    ],
    changes: [
      { type: 'feature', text: 'Added Filter Locator panel to Count Tags with checkboxes, select all/clear, and real-time page count' },
      { type: 'feature', text: 'Added Printed Indicator badge system for Count Tags with reprint ability and reset option' },
      { type: 'feature', text: 'Added independent Barcode Width setting (in mm) for Count Tags with PDF and print parity' },
      { type: 'improvement', text: 'Removed forced empty row rendering on Count Sheets, respecting rows per page as a maximum' },
      { type: 'fix', text: 'Fixed GitHub Pages production print layout by fully qualifying stylesheet links and document base URI' },
      { type: 'fix', text: 'Fixed store logo display during print and PDF generation with inline vector SVG fallback' },
    ],
  },
  {
    version: '1.4.0',
    releaseDate: 'August 2026',
    releaseType: 'minor',
    title: 'System Settings, Color Palettes & JSON Backup',
    summary:
      'Introduced centralized system settings, dynamic color themes, custom logo management, and complete JSON system backup.',
    highlights: [
      'Settings Hub with live theme color palette switching (Emerald, Sapphire, Indigo, Crimson, Amber, Violet, Slate)',
      'Custom logo upload with URL input, presets, and safe SVG inline fallback',
      'Full JSON backup and restore with schemaVersion 2.0 validation',
      'Welcome guide dialog with persistent dismissal option',
    ],
  },
  {
    version: '1.3.0',
    releaseDate: 'July 2026',
    releaseType: 'minor',
    title: 'Tabular Count Sheet Subsystem & Barcode Sorting',
    summary:
      'Added dedicated Count Sheet generator with movable columns, locator-based sheet splitting, and summary barcodes.',
    highlights: [
      'Movable and toggleable table columns (SKU, Barcode, Description, Count)',
      'Automatic sheet splitting by store locator with header summary barcodes',
      'Alphabetical and SKU-based inventory sorting with asc/desc toggle',
      'Customizable table grid lines, row heights, and font scaling',
    ],
  },
  {
    version: '1.2.0',
    releaseDate: 'June 2026',
    releaseType: 'minor',
    title: 'Retail ShelfTag & Promo PP Tag Visual Designer',
    summary:
      'Introduced visual drag-and-drop coordinate editor for regular White Tags and promotional Yellow PP Tags.',
    highlights: [
      'Interactive coordinate field editor with millimeter precision (X, Y, W, H)',
      'White Tag regular pricing and Yellow Tag promotional formats with validity dates',
      'Multi-tag side-by-side comparison view and customizable layout presets',
      'Dedicated Module 2 PDF generation and print layouts',
    ],
  },
  {
    version: '1.0.0',
    releaseDate: 'May 2026',
    releaseType: 'major',
    title: 'Foundational PRG ShelfTag & Barcode Generator',
    summary:
      'Initial release featuring Excel spreadsheet import, barcode generation, validation, and PDF export.',
    highlights: [
      'Excel spreadsheet import (.xlsx, .xls) with multi-column auto-detection',
      'Real-time data validation for duplicate SKUs, missing UPCs, and required fields',
      '4-step wizard workflow (Import, Validate, Configure, Preview)',
      'Standard barcode rendering using CODE128 and EAN13 symbologies',
    ],
  },
];

// Single authoritative derived exports
export const CURRENT_RELEASE = DEC_RELEASES[0];
export const CURRENT_VERSION = CURRENT_RELEASE.version;
export const DISPLAY_VERSION = `${SYSTEM_PREFIX} v${CURRENT_VERSION}`;
export const SHORT_VERSION = `v${CURRENT_VERSION}`;
export const PREVIOUS_RELEASES = DEC_RELEASES.slice(1);
