import React from 'react';
import {
  Sliders,
  RotateCcw,
  Maximize2,
  FileText,
  Barcode,
  Type,
  LayoutGrid,
} from 'lucide-react';
import { InventoryItem, Module2LayoutConfig, PaperSize, BarcodeType } from '../../types';
import { getDefaultModule2Config } from './defaults';
import { ShelfTagCard } from './ShelfTagCard';
import { PPTagCard } from './PPTagCard';

interface Module2LayoutConfigPanelProps {
  config: Module2LayoutConfig;
  onUpdateConfig: (newConfig: Module2LayoutConfig) => void;
  sampleItem?: InventoryItem;
}

const PAPER_SIZES: { id: PaperSize; label: string; width: number; height: number }[] = [
  { id: 'A4', label: 'A4 (210 x 297 mm)', width: 210, height: 297 },
  { id: 'LETTER', label: 'US Letter (215.9 x 279.4 mm)', width: 215.9, height: 279.4 },
  { id: 'CUSTOM', label: 'Custom Dimensions', width: 210, height: 297 },
];

const BARCODE_TYPES: { id: BarcodeType; label: string }[] = [
  { id: 'CODE128', label: 'CODE 128 (Universal Standard)' },
  { id: 'CODE39', label: 'CODE 39 (Alphanumeric)' },
  { id: 'EAN13', label: 'EAN-13 (Standard Retail)' },
  { id: 'UPCA', label: 'UPC-A (12-digit Retail)' },
];

export const Module2LayoutConfigPanel: React.FC<Module2LayoutConfigPanelProps> = ({
  config,
  onUpdateConfig,
  sampleItem,
}) => {
  const dummyItem: InventoryItem = sampleItem || {
    id: 'demo-sample-01',
    locator: 'A01-02',
    sku: 'SKU-88219',
    upcNo: '7501031311309',
    description: 'PREMIUM BRAND REVERSIBLE SHELF ITEM 500ML',
    barcode: '7501031311309',
    count: 24,
    counter: 'John Doe',
    scanner: 'Jane Smith',
    validator: 'Lead Supv',
  };

  const handleResetDefaults = () => {
    onUpdateConfig(getDefaultModule2Config(config.tagType));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Settings Form (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Header & Reset */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {config.tagType === 'shelftag' ? 'Shelf Tag Layout Settings' : 'PP Tag Layout Settings'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Adjust paper, tag dimensions, margins, and barcode format
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Paper & Page Orientation */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 font-bold text-xs uppercase tracking-wider text-zinc-700">
            <FileText className="w-4 h-4 text-zinc-500" />
            Paper & Page Setup
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Paper Size
              </label>
              <select
                value={config.paperSize}
                onChange={e => onUpdateConfig({ ...config, paperSize: e.target.value as PaperSize })}
                className="w-full text-xs font-medium bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-zinc-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-zinc-800"
              >
                {PAPER_SIZES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, orientation: 'portrait' })}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    config.orientation === 'portrait'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, orientation: 'landscape' })}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    config.orientation === 'landscape'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>
          </div>

          {config.paperSize === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Custom Width (mm)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={config.customWidthMm}
                  onChange={e => onUpdateConfig({ ...config, customWidthMm: Number(e.target.value) || 210 })}
                  className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Custom Height (mm)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={config.customHeightMm}
                  onChange={e => onUpdateConfig({ ...config, customHeightMm: Number(e.target.value) || 297 })}
                  className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tag Dimensions & Grid Columns */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 font-bold text-xs uppercase tracking-wider text-zinc-700">
            <LayoutGrid className="w-4 h-4 text-zinc-500" />
            Tag Dimensions & Grid Layout
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Columns
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={config.columns}
                onChange={e => onUpdateConfig({ ...config, columns: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tag Width (mm)
              </label>
              <input
                type="number"
                min="25"
                max="250"
                value={config.tagWidthMm}
                onChange={e => onUpdateConfig({ ...config, tagWidthMm: Math.max(25, Number(e.target.value) || 25) })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tag Height (mm)
              </label>
              <input
                type="number"
                min="20"
                max="250"
                value={config.tagHeightMm}
                onChange={e => onUpdateConfig({ ...config, tagHeightMm: Math.max(20, Number(e.target.value) || 20) })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Margins & Gaps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Top Margin (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.marginTopMm}
                onChange={e => onUpdateConfig({ ...config, marginTopMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Bottom (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.marginBottomMm}
                onChange={e => onUpdateConfig({ ...config, marginBottomMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Left Margin (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.marginLeftMm}
                onChange={e => onUpdateConfig({ ...config, marginLeftMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Right Margin (mm)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.marginRightMm}
                onChange={e => onUpdateConfig({ ...config, marginRightMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Column Gap (mm)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={config.gapColMm}
                onChange={e => onUpdateConfig({ ...config, gapColMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Row Gap (mm)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={config.gapRowMm}
                onChange={e => onUpdateConfig({ ...config, gapRowMm: Number(e.target.value) || 0 })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-1.5 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Barcode & Typography */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 font-bold text-xs uppercase tracking-wider text-zinc-700">
            <Barcode className="w-4 h-4 text-zinc-500" />
            Barcode & Styling
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Barcode Type
              </label>
              <select
                value={config.barcodeType}
                onChange={e => onUpdateConfig({ ...config, barcodeType: e.target.value as BarcodeType })}
                className="w-full text-xs font-medium bg-zinc-50 border border-zinc-300 rounded-lg p-2"
              >
                {BARCODE_TYPES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Barcode Height (mm)
              </label>
              <input
                type="number"
                min="8"
                max="30"
                value={config.barcodeHeightMm}
                onChange={e => onUpdateConfig({ ...config, barcodeHeightMm: Math.max(8, Number(e.target.value) || 8) })}
                className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-zinc-100 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showBorder}
                onChange={e => onUpdateConfig({ ...config, showBorder: e.target.checked })}
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              Outer Tag Border
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showCutGuides}
                onChange={e => onUpdateConfig({ ...config, showCutGuides: e.target.checked })}
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              Corner Cut Guides
            </label>
          </div>
        </div>
      </div>

      {/* Live Single-Tag Preview (5 cols) */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-2xs sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-zinc-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                Single Tag Live Preview
              </h4>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-700">
              {config.tagWidthMm} × {config.tagHeightMm} mm
            </span>
          </div>

          <div className="p-4 bg-zinc-100/70 rounded-xl border border-zinc-200 flex items-center justify-center min-h-[220px] overflow-auto">
            {config.tagType === 'shelftag' ? (
              <ShelfTagCard item={dummyItem} config={config} scale={1} />
            ) : (
              <PPTagCard item={dummyItem} config={config} scale={1} />
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <p className="font-bold mb-0.5">Design Notice:</p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This layout is an adjustable wireframe foundation. When you provide the sample images/specifications for{' '}
              <span className="font-bold">{config.tagType === 'shelftag' ? 'SHELFTAG' : 'PP TAG'}</span>, the exact visual typography, colors, logos, and placements will be accurately mapped into this card component.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
