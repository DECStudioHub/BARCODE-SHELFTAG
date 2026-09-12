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
    version: '2.0.0',
    releaseDate: 'September 12, 2026',
    releaseType: 'major',
    title: 'Platform Consolidation & Intelligent Paper-Saving Engine',
    summary:
      'Official DEC v2.0.0 milestone consolidating dual-module inventory workflows, paper-saving slot packing, theme customization, and validated system backup.',
    highlights: [
      'Intelligent Count Tag Packing: Eliminates wasted tag slots by grouping items by locator and packing sheets efficiently',
      'Dual-Module Operations: Seamless switching between Physical Inventory Count Tags/Sheets and Retail ShelfTag / Promo PP Tags',
      'System Identity & Theme Hub: Editable system branding, custom logo upload, reliable Prince Retail logo reset, and 7 color palettes',
      '1:1 Print & PDF Parity: Screen preview, browser print dialog, and high-resolution PDF downloads share identical layouts',
      'System Backup & Restore: Complete state export and import with validated schema version 2.0',
      'Audio & Welcome Experience: Synthesized retail welcome chime and interactive quick-start guide',
    ],
    changes: [
      { type: 'feature', text: 'Added packCountTagPages engine to group locators and maximize tags per sheet' },
      { type: 'feature', text: 'Integrated interactive Version Information popover with release history' },
      { type: 'improvement', text: 'Harmonized StandalonePrintView and PDF generation with on-screen preview' },
      { type: 'fix', text: 'Fixed logo reset and factory reset to reliably restore default Prince Retail SVG logo' },
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
