import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CountSheetConfig,
  CountSheetPageData,
  CountSheetPreset,
  InventoryItem,
  InventorySession,
  SystemSettings,
} from '../../types';
import {
  calculateCountSheetSummary,
  DEFAULT_COUNT_SHEET_CONFIG,
  DEFAULT_COUNT_SHEET_PRESETS,
  paginateCountSheetItems,
} from '../../utils/countSheetLayoutEngine';
import { CountSheetPage } from './CountSheetPage';
import { CountSheetConfigPanel } from './CountSheetConfigPanel';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Grid,
  Maximize2,
  Printer,
  Sliders,
  Tag,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CountSheetGeneratorProps {
  items: InventoryItem[];
  session: InventorySession;
  settings: SystemSettings;
  onBackToValidate: () => void;
  onSwitchToCountTags: () => void;
}

export const CountSheetGenerator: React.FC<CountSheetGeneratorProps> = ({
  items,
  session,
  settings,
  onBackToValidate,
  onSwitchToCountTags,
}) => {
  // Preset management stored in localStorage
  const [presets, setPresets] = useState<CountSheetPreset[]>(() => {
    try {
      const saved = localStorage.getItem('count_sheet_presets');
      if (saved) {
        const parsed: CountSheetPreset[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_COUNT_SHEET_PRESETS;
  });

  // Active configuration
  const [config, setConfig] = useState<CountSheetConfig>(() => {
    try {
      const saved = localStorage.getItem('count_sheet_active_config');
      if (saved) {
        return { ...DEFAULT_COUNT_SHEET_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_COUNT_SHEET_CONFIG;
  });

  // View state
  const [selectedLocator, setSelectedLocator] = useState<string>('ALL');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'single' | 'continuous' | 'grid'>('continuous');

  // Persist config on update
  const handleUpdateConfig = (newConfig: CountSheetConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('count_sheet_active_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not save count sheet config:', e);
    }
  };

  const handleSelectPreset = (preset: CountSheetPreset) => {
    handleUpdateConfig(preset.config);
  };

  const handleSaveNewPreset = (name: string, description: string) => {
    const newPreset: CountSheetPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      config: { ...config },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    try {
      localStorage.setItem('count_sheet_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save preset:', e);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = presets.filter(p => p.id !== presetId);
    setPresets(updated);
    try {
      localStorage.setItem('count_sheet_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save presets after deletion:', e);
    }
  };

  const handleResetToDefaults = () => {
    handleUpdateConfig(DEFAULT_COUNT_SHEET_CONFIG);
  };

  // Generate paginated pages
  const pages: CountSheetPageData[] = useMemo(() => {
    return paginateCountSheetItems(items, config.rowsPerPage, selectedLocator);
  }, [items, config.rowsPerPage, selectedLocator]);

  // Generate summary
  const summary = useMemo(() => {
    return calculateCountSheetSummary(items, config.rowsPerPage);
  }, [items, config.rowsPerPage]);

  // Adjust active page index if out of range
  useEffect(() => {
    if (activePageIndex >= pages.length) {
      setActivePageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, activePageIndex]);

  // Handle direct printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP SUMMARY & ACTION BAR (MANDATED SECTION 27) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToValidate}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Back to item validation"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase">
                COUNT SHEET GENERATOR
              </h1>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              PHYSICAL INVENTORY FORM
            </span>
          </div>

          {/* Mandatory Summary Metrics */}
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-600">
            <div>
              <span className="text-zinc-400 font-medium">Total Items: </span>
              <span className="font-mono font-bold text-zinc-900">{summary.totalItems}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Total Locators: </span>
              <span className="font-mono font-bold text-zinc-900">{summary.totalLocators}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Rows Per Page: </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {config.rowsPerPage}
              </span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Estimated Pages: </span>
              <span className="font-mono font-bold text-zinc-900">{pages.length}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Switch to Count Tags */}
          <button
            type="button"
            onClick={onSwitchToCountTags}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
            title="Generate Count Tags using the same Excel data"
          >
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span>Generate Count Tags</span>
          </button>

          {/* Toggle Config Drawer */}
          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
              showConfigDrawer
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConfigDrawer ? 'Hide Settings' : 'Layout Settings'}</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Count Sheets</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR: LOCATOR FILTER & PREVIEW CONTROLS */}
      <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        {/* Locator Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-700 text-[11px] uppercase tracking-wider">
            FILTER LOCATOR:
          </span>
          <select
            value={selectedLocator}
            onChange={e => {
              setSelectedLocator(e.target.value);
              setActivePageIndex(0);
            }}
            className="px-2.5 py-1.5 border border-zinc-300 rounded-lg bg-white font-medium text-xs text-zinc-900 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Locators ({summary.totalLocators} locators, {summary.estimatedPages} pages)</option>
            {summary.locatorCounts.map(lc => (
              <option key={lc.locator} value={lc.locator}>
                {lc.locator} — {lc.count} items ({lc.pages} {lc.pages === 1 ? 'page' : 'pages'})
              </option>
            ))}
          </select>
        </div>

        {/* View mode & Zoom controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              title="Continuous Vertical Scroll"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'continuous'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              title="Single Page View"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid Thumbnail View"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Single Page Pagination controls */}
          {viewMode === 'single' && pages.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activePageIndex === 0}
                onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
                className="p-1 border border-zinc-200 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2 font-bold text-zinc-800">
                {activePageIndex + 1} / {pages.length}
              </span>
              <button
                type="button"
                disabled={activePageIndex >= pages.length - 1}
                onClick={() => setActivePageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                className="p-1 border border-zinc-200 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
              title="Zoom out"
              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-zinc-700 font-bold min-w-[38px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
              title="Zoom in"
              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 font-semibold px-1 rounded cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: CONFIG DRAWER + LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Settings Drawer */}
        {showConfigDrawer && (
          <div className="lg:col-span-4 sticky top-4 print:hidden">
            <CountSheetConfigPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              presets={presets}
              onSelectPreset={handleSelectPreset}
              onSaveNewPreset={handleSaveNewPreset}
              onDeletePreset={handleDeletePreset}
              onResetToDefaults={handleResetToDefaults}
            />
          </div>
        )}

        {/* Live Sheet Preview Container */}
        <div
          className={`${
            showConfigDrawer ? 'lg:col-span-8' : 'lg:col-span-12'
          } flex flex-col items-center justify-center p-6 bg-zinc-200/70 rounded-xl border border-zinc-300/80 overflow-x-auto print:p-0 print:m-0 print:border-none print:bg-transparent`}
        >
          {pages.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="font-bold text-sm">No items found for the selected locator.</p>
              <p className="text-xs text-zinc-400 mt-1">Please select "All Locators" or check your inventory items.</p>
            </div>
          ) : viewMode === 'single' ? (
            // Single page view
            <div className="flex flex-col items-center">
              <div className="mb-2 text-xs font-bold text-zinc-600">
                Sheet {pages[activePageIndex].globalPageIndex} of {pages[activePageIndex].totalGlobalPages} — Locator:{' '}
                <span className="font-mono text-zinc-900 font-black">
                  {pages[activePageIndex].locator}
                </span>{' '}
                (Page {pages[activePageIndex].pageNumber} of {pages[activePageIndex].totalPagesForLocator})
              </div>
              <div className="shadow-xl rounded-xs">
                <CountSheetPage
                  pageData={pages[activePageIndex]}
                  config={config}
                  session={session}
                  scale={zoomScale}
                  isPrint={false}
                />
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid layout
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl justify-items-center">
              {pages.map((p, idx) => (
                <div key={`grid-${idx}`} className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-600 mb-1">
                    Sheet {p.globalPageIndex} — {p.locator} (P.{p.pageNumber}/{p.totalPagesForLocator})
                  </span>
                  <div
                    className="shadow-lg rounded-xs cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                    onClick={() => {
                      setActivePageIndex(idx);
                      setViewMode('single');
                    }}
                  >
                    <CountSheetPage
                      pageData={p}
                      config={config}
                      session={session}
                      scale={zoomScale * 0.6}
                      isPrint={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Continuous vertical preview (Default)
            <div className="flex flex-col items-center gap-8 w-full">
              {pages.map((p, idx) => (
                <div key={`page-${idx}`} className="flex flex-col items-center">
                  <div className="mb-1 text-[11px] font-bold text-zinc-500 flex items-center gap-2">
                    <span>Sheet {p.globalPageIndex} of {p.totalGlobalPages}</span>
                    <span>•</span>
                    <span>Locator: <strong className="text-zinc-800">{p.locator}</strong></span>
                    <span>•</span>
                    <span>{p.items.length} items</span>
                  </div>
                  <div className="shadow-xl rounded-xs bg-white">
                    <CountSheetPage
                      pageData={p}
                      config={config}
                      session={session}
                      scale={zoomScale}
                      isPrint={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. DEDICATED PRINT ENGINE CONTAINER (ACTIVE ONLY DURING @media print) */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${config.orientation === 'landscape' ? 'landscape' : 'portrait'};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-page {
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
              }
            }
          `
        }} />
        {pages.map((p, idx) => (
          <div key={`print-page-${idx}`} className="print-page">
            <CountSheetPage
              pageData={p}
              config={config}
              session={session}
              scale={1}
              isPrint={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
