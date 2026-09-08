import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  Sparkles,
  Tag,
  Sliders,
  Eye,
  Loader2,
  Maximize2,
  Palette,
} from 'lucide-react';
import { InventoryItem, InventorySession, Module2Config, ShelfTagItem } from '../../types';
import { DEFAULT_MODULE2_CONFIG, SAMPLE_SHELF_TAGS } from './constants';
import { ShelfTagItemsTab } from './ShelfTagItemsTab';
import { LayoutColorSetupTab } from './LayoutColorSetupTab';
import { LiveSheetPreviewTab } from './LiveSheetPreviewTab';
import { TagFieldLayoutEditorTab } from './TagFieldLayoutEditorTab';
import { generateShelftagPdf } from '../../utils/shelftagPdfService';
import { DEFAULT_SHELFTAG_PRESETS, DEFAULT_PPTAG_PRESETS, loadPresetsFromStorage } from './fieldDefaults';

interface ShelfTagPPModuleProps {
  items: InventoryItem[];
  session: InventorySession;
  onUpdateItems: (newItems: InventoryItem[]) => void;
  onLoadSampleData: () => void;
  onSwitchToImport: () => void;
}

export const ShelfTagPPModule: React.FC<ShelfTagPPModuleProps> = ({
  items: _m1Items,
  session: _session,
  onUpdateItems: _onUpdateItems,
  onLoadSampleData: _onLoadSampleData,
  onSwitchToImport: _onSwitchToImport,
}) => {
  // Tabs: 'items' | 'field_editor' | 'layout' | 'preview'
  const [activeTab, setActiveTab] = useState<'items' | 'field_editor' | 'layout' | 'preview'>('items');

  // Shelf Tag Items state (initialized with sample items)
  const [shelfTagItems, setShelfTagItems] = useState<ShelfTagItem[]>(SAMPLE_SHELF_TAGS);

  // Configuration state with initialized preset lists
  const [config, setConfig] = useState<Module2Config>(() => {
    const shelftagPresets = loadPresetsFromStorage('shelftag', DEFAULT_SHELFTAG_PRESETS);
    const ppTagPresets = loadPresetsFromStorage('pp_tag', DEFAULT_PPTAG_PRESETS);

    return {
      ...DEFAULT_MODULE2_CONFIG,
      activeTagType: 'shelftag',
      shelftagPresets,
      ppTagPresets,
      shelftagConfig: shelftagPresets[0],
      ppTagConfig: ppTagPresets[0],
    };
  });

  // PDF Export loading state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Selected counts
  const totalCount = shelfTagItems.length;
  const selectedCount = useMemo(
    () => shelfTagItems.filter(i => i.isSelected !== false).length,
    [shelfTagItems]
  );

  // Sample items for live comparison
  const sampleWhite = useMemo(
    () => shelfTagItems.find(i => i.tagStyle === 'white') || SAMPLE_SHELF_TAGS[0],
    [shelfTagItems]
  );
  const sampleYellow = useMemo(
    () => shelfTagItems.find(i => i.tagStyle === 'yellow') || SAMPLE_SHELF_TAGS[1],
    [shelfTagItems]
  );

  // Reset to original 12 samples
  const handleResetSamples = () => {
    setShelfTagItems(SAMPLE_SHELF_TAGS);
  };

  // Top header print & export handlers
  const handlePrintSheet = () => {
    if (selectedCount === 0) {
      alert('Please select at least one tag to print.');
      return;
    }
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportPdf = async () => {
    const printItems = shelfTagItems.filter(i => i.isSelected !== false);
    if (printItems.length === 0) {
      alert('Please select at least one tag to export as PDF.');
      return;
    }

    try {
      setIsExportingPdf(true);
      const pdf = await generateShelftagPdf(printItems, config);
      pdf.save(`PRG-Shelftags-${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200 shadow-2xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-amber-400 text-zinc-950">
                SHELFTAG / PP TAG
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <span>🏷️</span>
                <span>Shelftag / PP Tag Printing (White & Yellow)</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
              Print high-clarity retail shelf edge tags and promotional Price Point (PP) tags. Fully customize individual tag field positions, dimensions, fonts, and barcodes with the visual layout editor.
            </p>
          </div>

          {/* Top Right Action Buttons: [Print Sheet] [Export PDF] */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={handlePrintSheet}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Custom Layout Ready Callout Box */}
        <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-zinc-800">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-extrabold text-amber-950">Tag Field Layout Editor:</strong> You can now customize the exact position, millimeter dimensions, font family/size, border, alignment, and barcode format for every single field on both White ShelfTags and Yellow PP Tags! Use the &quot;Tag Field Layout Editor&quot; tab below to drag, resize, and save custom layout presets.
          </div>
        </div>

        {/* Navigation Tabs row */}
        <div className="mt-6 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-4 flex-wrap">
            {/* Tab 1: Items */}
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`pb-3 px-1 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>1. Shelf Tag Items ({totalCount})</span>
            </button>

            {/* Tab 2: Tag Field Layout Editor (FEATURE) */}
            <button
              type="button"
              onClick={() => setActiveTab('field_editor')}
              className={`pb-3 px-1 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'field_editor'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="flex items-center gap-1.5">
                <span>2. Tag Field Layout Editor</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black text-[9px] uppercase tracking-wide">
                  Visual
                </span>
              </span>
            </button>

            {/* Tab 3: Sheet & Color Setup */}
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`pb-3 px-1 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'layout'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>3. Sheet & Color Setup</span>
            </button>

            {/* Tab 4: Live Sheet Preview */}
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-3 px-1 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>4. Live Sheet Preview & Print</span>
            </button>
          </div>

          {/* Right Status Badge */}
          <div className="pb-3 text-xs font-bold text-zinc-700">
            Selected:{' '}
            <span className="font-extrabold text-amber-700">
              {selectedCount} / {totalCount} tags
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="print:m-0">
        {activeTab === 'items' && (
          <ShelfTagItemsTab
            items={shelfTagItems}
            setItems={setShelfTagItems}
            config={config}
            onResetSamples={handleResetSamples}
          />
        )}

        {activeTab === 'field_editor' && (
          <TagFieldLayoutEditorTab
            config={config}
            setConfig={setConfig}
            sampleWhiteItem={sampleWhite}
            sampleYellowItem={sampleYellow}
          />
        )}

        {activeTab === 'layout' && (
          <LayoutColorSetupTab
            config={config}
            setConfig={setConfig}
            sampleWhiteItem={sampleWhite}
            sampleYellowItem={sampleYellow}
          />
        )}

        {activeTab === 'preview' && (
          <LiveSheetPreviewTab
            items={shelfTagItems}
            config={config}
          />
        )}
      </div>
    </div>
  );
};
