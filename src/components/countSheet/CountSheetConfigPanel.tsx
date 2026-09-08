import React, { useState } from 'react';
import {
  BarcodeType,
  CountSheetConfig,
  CountSheetPreset,
  PaperSize,
} from '../../types';
import {
  DEFAULT_COUNT_SHEET_CONFIG,
  DEFAULT_COUNT_SHEET_PRESETS,
  getCountSheetPaperDimensions,
} from '../../utils/countSheetLayoutEngine';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  LayoutGrid,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  Type,
} from 'lucide-react';

interface CountSheetConfigPanelProps {
  config: CountSheetConfig;
  onUpdateConfig: (newConfig: CountSheetConfig) => void;
  presets: CountSheetPreset[];
  onSelectPreset: (preset: CountSheetPreset) => void;
  onSaveNewPreset: (name: string, description: string) => void;
  onDeletePreset: (presetId: string) => void;
  onResetToDefaults: () => void;
}

export const CountSheetConfigPanel: React.FC<CountSheetConfigPanelProps> = ({
  config,
  onUpdateConfig,
  presets,
  onSelectPreset,
  onSaveNewPreset,
  onDeletePreset,
  onResetToDefaults,
}) => {
  const [activeSection, setActiveSection] = useState<'presets' | 'paper' | 'columns' | 'typography' | 'barcode'>('presets');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Compute paper and printable dimensions
  const paperDims = getCountSheetPaperDimensions(
    config.paperSize,
    config.customWidthMm,
    config.customHeightMm,
    config.orientation
  );

  const printableWidthMm = Math.max(
    50,
    paperDims.widthMm - (config.marginLeftMm + config.marginRightMm)
  );

  const totalColWidthMm =
    (config.columnWidths?.skuMm || 28) +
    (config.columnWidths?.barcodeMm || 42) +
    (config.columnWidths?.descMm || 88) +
    (config.columnWidths?.countMm || 34);

  const isWidthExceeded = totalColWidthMm > printableWidthMm + 1;

  const handleUpdate = <K extends keyof CountSheetConfig>(key: K, value: CountSheetConfig[K]) => {
    onUpdateConfig({
      ...config,
      [key]: value,
    });
  };

  const handleUpdateColWidth = (
    col: 'skuMm' | 'barcodeMm' | 'descMm' | 'countMm',
    value: number
  ) => {
    onUpdateConfig({
      ...config,
      columnWidths: {
        ...config.columnWidths,
        [col]: Math.max(10, value),
      },
    });
  };

  const handleAutoFitColumns = () => {
    // Proportional distribution within printable width
    const targetWidth = printableWidthMm - (config.showRowNumbers ? 6 : 0);
    const sku = Math.round(targetWidth * 0.15);
    const barcode = Math.round(targetWidth * 0.22);
    const count = Math.round(targetWidth * 0.18);
    const desc = Math.max(30, targetWidth - (sku + barcode + count));

    onUpdateConfig({
      ...config,
      columnWidths: {
        skuMm: sku,
        barcodeMm: barcode,
        descMm: desc,
        countMm: count,
      },
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-full text-xs">
      {/* Top Header */}
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <h2 className="font-bold text-zinc-900 text-sm">Count Sheet Settings</h2>
        </div>
        <button
          type="button"
          onClick={onResetToDefaults}
          title="Reset settings to standard 20-row layout"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Tabs / Accordion Selectors */}
      <div className="grid grid-cols-5 border-b border-zinc-200 bg-zinc-100/60 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveSection('presets')}
          className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeSection === 'presets'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('paper')}
          className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeSection === 'paper'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Paper
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('columns')}
          className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeSection === 'columns'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Columns
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('typography')}
          className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeSection === 'typography'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Fonts
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('barcode')}
          className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
            activeSection === 'barcode'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Barcodes
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* SECTION 1: PRESETS */}
        {activeSection === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                SAVED LAYOUT PRESETS
              </span>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Preset</span>
              </button>
            </div>

            <div className="space-y-2">
              {presets.map(p => {
                const isSelected =
                  config.rowsPerPage === p.config.rowsPerPage &&
                  config.paperSize === p.config.paperSize &&
                  config.rowHeightMm === p.config.rowHeightMm;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div
                      className="cursor-pointer flex-1 mr-2"
                      onClick={() => onSelectPreset(p)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900">{p.name}</span>
                        {p.isDefault && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-zinc-200 text-zinc-700 font-bold rounded-xs">
                            Standard
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white font-bold rounded-xs flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{p.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-600 mt-1 font-mono">
                        <span>Rows: {p.config.rowsPerPage}</span>
                        <span>Paper: {p.config.paperSize}</span>
                        <span>Height: {p.config.rowHeightMm}mm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectPreset(p)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        Use
                      </button>

                      {!p.isDefault && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          title="Delete preset"
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Save Modal */}
            {showSaveModal && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="font-bold text-emerald-900 text-xs">Save Current Layout as Preset</div>
                <input
                  type="text"
                  placeholder="Preset Name (e.g. My Selling Area Layout)"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 rounded font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newPresetName.trim()}
                    onClick={() => {
                      if (newPresetName.trim()) {
                        onSaveNewPreset(newPresetName.trim(), newPresetDesc.trim());
                        setNewPresetName('');
                        setNewPresetDesc('');
                        setShowSaveModal(false);
                      }
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded font-bold cursor-pointer"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PAPER & PAGE SETUP */}
        {activeSection === 'paper' && (
          <div className="space-y-3.5">
            {/* Paper Size */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Paper Size</label>
              <select
                value={config.paperSize}
                onChange={e => handleUpdate('paperSize', e.target.value as PaperSize)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md bg-white font-medium focus:ring-1 focus:ring-emerald-500"
              >
                <option value="A4">A4 (210 × 297 mm) - Standard</option>
                <option value="SHORT_BOND">Short Bond (8.5 × 11 in / 216 × 279 mm)</option>
                <option value="LETTER">Letter (8.5 × 11 in / 216 × 279 mm)</option>
                <option value="LONG_BOND">Long Bond (8.5 × 13 in / 216 × 330 mm)</option>
                <option value="LEGAL">US Legal (8.5 × 14 in / 216 × 356 mm)</option>
                <option value="CUSTOM">Custom Size (mm)</option>
              </select>
            </div>

            {config.paperSize === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={config.customWidthMm || 210}
                    onChange={e => handleUpdate('customWidthMm', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={config.customHeightMm || 297}
                    onChange={e => handleUpdate('customHeightMm', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  />
                </div>
              </div>
            )}

            {/* Orientation */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate('orientation', 'portrait')}
                  className={`py-1.5 text-center font-bold rounded border cursor-pointer ${
                    config.orientation === 'portrait'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Portrait (Default)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate('orientation', 'landscape')}
                  className={`py-1.5 text-center font-bold rounded border cursor-pointer ${
                    config.orientation === 'landscape'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Rows Per Page (MANDATED DEFAULT 20) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Rows Per Page</label>
                <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {config.rowsPerPage} rows
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {[10, 15, 20, 25, 30].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleUpdate('rowsPerPage', val)}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer text-xs border ${
                      config.rowsPerPage === val
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {val} {val === 20 && '(Default)'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                max="50"
                value={config.rowsPerPage}
                onChange={e => handleUpdate('rowsPerPage', Math.max(1, Number(e.target.value)))}
                className="w-full px-2.5 py-1 border border-zinc-300 rounded bg-white font-mono"
                placeholder="Or enter custom number of rows"
              />
            </div>

            {/* Row Height */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Row Height</label>
                <span className="font-mono font-bold text-zinc-900">{config.rowHeightMm} mm</span>
              </div>
              <input
                type="range"
                min="7"
                max="22"
                step="0.5"
                value={config.rowHeightMm}
                onChange={e => handleUpdate('rowHeightMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">
                11–14mm provides ample handwriting space for counters.
              </span>
            </div>

            {/* Margins */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Page Margins (mm)</label>
              <div className="grid grid-cols-4 gap-1.5">
                <div>
                  <span className="text-[10px] text-zinc-500">Top</span>
                  <input
                    type="number"
                    value={config.marginTopMm}
                    onChange={e => handleUpdate('marginTopMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Bottom</span>
                  <input
                    type="number"
                    value={config.marginBottomMm}
                    onChange={e => handleUpdate('marginBottomMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Left</span>
                  <input
                    type="number"
                    value={config.marginLeftMm}
                    onChange={e => handleUpdate('marginLeftMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Right</span>
                  <input
                    type="number"
                    value={config.marginRightMm}
                    onChange={e => handleUpdate('marginRightMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Fill page with empty rows toggle */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-800">Pad Remaining Rows</span>
                <p className="text-[10px] text-zinc-500">
                  Fills up to {config.rowsPerPage} rows with blank lines for handwritten extras
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.emptyRowsToFillPage !== false}
                onChange={e => handleUpdate('emptyRowsToFillPage', e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: COLUMN WIDTH CUSTOMIZATION */}
        {activeSection === 'columns' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">Table Columns</span>
              <button
                type="button"
                onClick={handleAutoFitColumns}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Auto-Distribute Width
              </button>
            </div>

            {/* Total Width Indicator */}
            <div
              className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                isWidthExceeded
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span>
                Total Width: <strong>{totalColWidthMm} mm</strong> / Printable:{' '}
                {Math.round(printableWidthMm)} mm
              </span>
              {isWidthExceeded ? (
                <span className="font-bold text-rose-600">Exceeds Page!</span>
              ) : (
                <span className="font-bold text-emerald-700">Fits Page ✓</span>
              )}
            </div>

            {/* SKU Column Width */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-bold text-zinc-700">SKU Width</label>
                <span className="font-mono text-zinc-900 font-bold">
                  {config.columnWidths.skuMm} mm
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={config.columnWidths.skuMm}
                onChange={e => handleUpdateColWidth('skuMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* BARCODE Column Width */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-bold text-zinc-700">BARCODE Width</label>
                <span className="font-mono text-zinc-900 font-bold">
                  {config.columnWidths.barcodeMm} mm
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="80"
                value={config.columnWidths.barcodeMm}
                onChange={e => handleUpdateColWidth('barcodeMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* DESCRIPTION Column Width */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-bold text-zinc-700">DESCRIPTION Width</label>
                <span className="font-mono text-zinc-900 font-bold">
                  {config.columnWidths.descMm} mm
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="130"
                value={config.columnWidths.descMm}
                onChange={e => handleUpdateColWidth('descMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* COUNT Column Width (Writing Area) */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-bold text-zinc-700">COUNT Writing Box Width</label>
                <span className="font-mono text-emerald-800 font-bold">
                  {config.columnWidths.countMm} mm
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                value={config.columnWidths.countMm}
                onChange={e => handleUpdateColWidth('countMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">
                Wider COUNT column makes it easier for manual handwritten counts.
              </span>
            </div>

            {/* Row numbering toggle */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="font-bold text-zinc-800">Show Row Number (#)</span>
              <input
                type="checkbox"
                checked={config.showRowNumbers}
                onChange={e => handleUpdate('showRowNumbers', e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Signatures footer toggle */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">Show Counter/Validator Signatures</span>
              <input
                type="checkbox"
                checked={config.showSignatures}
                onChange={e => handleUpdate('showSignatures', e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: TYPOGRAPHY & TEXT SIZES */}
        {activeSection === 'typography' && (
          <div className="space-y-3.5">
            {/* Header Font */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Header Font Family</label>
              <select
                value={config.headerFontFamily}
                onChange={e => handleUpdate('headerFontFamily', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
              >
                <option value="sans-serif">Sans-Serif (Inter / Helvetica / Arial)</option>
                <option value="serif">Serif (Times / Georgia)</option>
                <option value="monospace">Monospace (Courier / Menlo)</option>
              </select>
            </div>

            {/* Font Sizes Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  SKU Text Size ({config.skuFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={config.skuFontSizePt}
                  onChange={e => handleUpdate('skuFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Desc Text Size ({config.descFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={config.descFontSizePt}
                  onChange={e => handleUpdate('descFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Barcode Text Size ({config.barcodeTextFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="5"
                  max="12"
                  step="0.5"
                  value={config.barcodeTextFontSizePt}
                  onChange={e => handleUpdate('barcodeTextFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Table Header Size ({config.headerFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="7"
                  max="14"
                  step="0.5"
                  value={config.headerFontSizePt}
                  onChange={e => handleUpdate('headerFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Description Text Wrapping */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Wrap Description Text</span>
                <input
                  type="checkbox"
                  checked={config.wrapDescription}
                  onChange={e => handleUpdate('wrapDescription', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {config.wrapDescription && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Max Lines</label>
                    <select
                      value={config.descMaxLines}
                      onChange={e => handleUpdate('descMaxLines', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="1">1 Line (Truncate)</option>
                      <option value="2">2 Lines</option>
                      <option value="3">3 Lines</option>
                      <option value="4">4 Lines</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Line Height</label>
                    <select
                      value={config.descLineHeight}
                      onChange={e => handleUpdate('descLineHeight', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="1.1">Tight (1.1)</option>
                      <option value="1.25">Normal (1.25)</option>
                      <option value="1.4">Spacious (1.4)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: BARCODE & LOCATOR SETTINGS */}
        {activeSection === 'barcode' && (
          <div className="space-y-3.5">
            {/* Table Item Barcode */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                ITEM BARCODE COLUMN
              </span>

              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Show Scannable Barcode</span>
                <input
                  type="checkbox"
                  checked={config.showBarcodeGraphic}
                  onChange={e => handleUpdate('showBarcodeGraphic', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {config.showBarcodeGraphic && (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="font-semibold text-zinc-700">Barcode Height</label>
                      <span className="font-mono text-zinc-900 font-bold">
                        {config.barcodeHeightMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="14"
                      step="0.5"
                      value={config.barcodeHeightMm}
                      onChange={e => handleUpdate('barcodeHeightMm', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Barcode Format</label>
                    <select
                      value={config.barcodeFormat}
                      onChange={e => handleUpdate('barcodeFormat', e.target.value as BarcodeType)}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="CODE128">CODE 128 (Standard)</option>
                      <option value="CODE39">CODE 39</option>
                      <option value="EAN13">EAN-13</option>
                      <option value="UPCA">UPC-A</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700">Show Human-Readable Digits</span>
                    <input
                      type="checkbox"
                      checked={config.showBarcodeValueText !== false}
                      onChange={e => handleUpdate('showBarcodeValueText', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Upper-Right Locator Barcode */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                UPPER-RIGHT LOCATOR BARCODE
              </span>

              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Show Locator Barcode</span>
                <input
                  type="checkbox"
                  checked={config.showLocatorBarcode}
                  onChange={e => handleUpdate('showLocatorBarcode', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {config.showLocatorBarcode && (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="font-semibold text-zinc-700">Locator Barcode Height</label>
                      <span className="font-mono text-zinc-900 font-bold">
                        {config.locatorBarcodeHeightMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="18"
                      step="0.5"
                      value={config.locatorBarcodeHeightMm}
                      onChange={e => handleUpdate('locatorBarcodeHeightMm', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Locator Barcode Format
                    </label>
                    <select
                      value={config.locatorBarcodeFormat}
                      onChange={e =>
                        handleUpdate('locatorBarcodeFormat', e.target.value as BarcodeType)
                      }
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="CODE128">CODE 128 (Standard)</option>
                      <option value="CODE39">CODE 39</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
