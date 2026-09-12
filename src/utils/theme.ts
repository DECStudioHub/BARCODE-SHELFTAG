import { ColorPaletteId, ColorPaletteTheme, SystemSettings } from '../types';
import princeLogoAsset from '../assets/prince-logo.svg';

export const PALETTES: Record<Exclude<ColorPaletteId, 'custom'>, ColorPaletteTheme> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    description: 'Classic warehouse & inventory',
    primary: '#047857',
    primaryHover: '#065f46',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    primaryText: '#065f46',
    ringColor: '#10b981',
    hex: '#047857',
  },
  blue: {
    id: 'blue',
    name: 'Sapphire Blue',
    description: 'Corporate & retail distribution',
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    primaryText: '#1e40af',
    ringColor: '#3b82f6',
    hex: '#1d4ed8',
  },
  indigo: {
    id: 'indigo',
    name: 'Modern Indigo',
    description: 'Tech-forward logistics',
    primary: '#4338ca',
    primaryHover: '#3730a3',
    primaryLight: '#eef2ff',
    primaryBorder: '#c7d2fe',
    primaryText: '#3730a3',
    ringColor: '#6366f1',
    hex: '#4338ca',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Red',
    description: 'High contrast & retail branding',
    primary: '#b91c1c',
    primaryHover: '#991b1b',
    primaryLight: '#fef2f2',
    primaryBorder: '#fecaca',
    primaryText: '#991b1b',
    ringColor: '#ef4444',
    hex: '#b91c1c',
  },
  amber: {
    id: 'amber',
    name: 'Safety Amber',
    description: 'Industrial & supply chain',
    primary: '#b45309',
    primaryHover: '#92400e',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    primaryText: '#92400e',
    ringColor: '#f59e0b',
    hex: '#b45309',
  },
  violet: {
    id: 'violet',
    name: 'Royal Violet',
    description: 'Contemporary specialty retail',
    primary: '#6d28d9',
    primaryHover: '#5b21b6',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryText: '#5b21b6',
    ringColor: '#8b5cf6',
    hex: '#6d28d9',
  },
  slate: {
    id: 'slate',
    name: 'Slate Charcoal',
    description: 'Minimalist & monochrome clarity',
    primary: '#334155',
    primaryHover: '#1e293b',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    primaryText: '#1e293b',
    ringColor: '#64748b',
    hex: '#334155',
  },
};

// Built-in Prince Retail vector asset as safe inline data URI fallback
export const PRINCE_LOGO_INLINE_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="100" fill="%23FEED01"/><polygon points="100,56 126,76 113,76 100,66 87,76 74,76" fill="%23E31B23"/><text x="100" y="110" fill="%23E31B23" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-style="italic" font-size="47" letter-spacing="-1.5px">prince</text><polygon points="22,117 178,117 188,125 12,125" fill="%23E31B23"/></svg>';

// Bundled Vite asset URL that resolves correctly under any subpath (e.g. GitHub Pages /PRG-DEC/)
export const DEFAULT_PRINCE_LOGO = princeLogoAsset || PRINCE_LOGO_INLINE_SVG;
export const PRINCE_LOGO_JPG = '/prince-logo.jpg';

/**
 * Resolves the effective logo URL with guaranteed fallback to the built-in Prince Retail logo.
 * If user custom logo is missing, empty, invalid, or an old absolute root path (which 404s on GitHub Pages),
 * automatically returns the built-in Prince Retail logo asset.
 */
export function getEffectiveLogoUrl(customUrl?: string | null): string {
  if (!customUrl || typeof customUrl !== 'string' || !customUrl.trim()) {
    return DEFAULT_PRINCE_LOGO;
  }
  const trimmed = customUrl.trim();
  // Check if it's the legacy absolute path or default preset identifier that maps to built-in logo
  if (
    trimmed === '/prince-logo.svg' ||
    trimmed === 'prince-logo.svg' ||
    trimmed === '/prince-logo.jpg' ||
    trimmed === 'prince-logo.jpg' ||
    trimmed === 'prince' ||
    trimmed === 'default' ||
    trimmed === DEFAULT_PRINCE_LOGO ||
    trimmed.endsWith('/prince-logo.svg') ||
    trimmed.endsWith('/prince-logo.jpg')
  ) {
    return DEFAULT_PRINCE_LOGO;
  }
  return trimmed;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  systemName: 'DEC',
  systemTagline: 'Digital Efficiency & Continuity System',
  systemSubtitle: 'Backup • Continuity • Alternative Process • Process Improvement',
  paletteId: 'emerald',
  customPrimaryColor: '#047857',
  customLogoUrl: null,
  applyLogoToShelfTags: true,
};

export function getPaletteTheme(paletteId: ColorPaletteId, customHex?: string): ColorPaletteTheme {
  if (paletteId === 'custom' && customHex) {
    const cleanHex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    return {
      id: 'custom',
      name: 'Custom Brand Color',
      description: 'User-specified corporate hex color',
      primary: cleanHex,
      primaryHover: adjustColorBrightness(cleanHex, -20),
      primaryLight: adjustColorOpacity(cleanHex, 0.08),
      primaryBorder: adjustColorOpacity(cleanHex, 0.25),
      primaryText: adjustColorBrightness(cleanHex, -15),
      ringColor: cleanHex,
      hex: cleanHex,
    };
  }

  if (paletteId in PALETTES) {
    return PALETTES[paletteId as keyof typeof PALETTES];
  }

  return PALETTES.emerald;
}

function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function adjustColorOpacity(hex: string, opacity: number): string {
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function applyThemeToDocument(theme: ColorPaletteTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--primary-hover', theme.primaryHover);
  root.style.setProperty('--primary-light', theme.primaryLight);
  root.style.setProperty('--primary-border', theme.primaryBorder);
  root.style.setProperty('--primary-text', theme.primaryText);
  root.style.setProperty('--primary-ring', theme.ringColor);
}

export const PRESET_LOGOS = [
  {
    id: 'prince',
    name: 'Prince Retail',
    url: DEFAULT_PRINCE_LOGO,
    description: 'Original Prince Retail badge with crown emblem',
  },
  {
    id: 'barcode',
    name: 'Scan & Tag',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23047857"/><rect x="22" y="25" width="6" height="50" fill="white"/><rect x="32" y="25" width="10" height="50" fill="white"/><rect x="46" y="25" width="4" height="50" fill="white"/><rect x="54" y="25" width="8" height="50" fill="white"/><rect x="66" y="25" width="12" height="50" fill="white"/></svg>',
    description: 'Modern barcode badge icon',
  },
  {
    id: 'store',
    name: 'Retail Store',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%231d4ed8"/><path d="M25 40 L50 22 L75 40 L75 75 L25 75 Z" fill="none" stroke="white" stroke-width="6"/><rect x="42" y="52" width="16" height="23" fill="white"/></svg>',
    description: 'Storefront retail badge',
  },
  {
    id: 'warehouse',
    name: 'Warehouse Hub',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23b45309"/><polygon points="50,22 78,38 78,68 50,84 22,68 22,38" fill="none" stroke="white" stroke-width="6"/><line x1="50" y1="22" x2="50" y2="84" stroke="white" stroke-width="5"/><line x1="50" y1="52" x2="78" y2="38" stroke="white" stroke-width="5"/><line x1="50" y1="52" x2="22" y2="38" stroke="white" stroke-width="5"/></svg>',
    description: 'Logistics cargo cube badge',
  },
];
