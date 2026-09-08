import React, { useMemo, useState } from 'react';
import {
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Maximize2,
} from 'lucide-react';
import { Module2Config, ShelfTagItem } from '../../types';
import { ShelftagCardRenderer } from './ShelftagCardRenderer';
import { generateShelftagPdf } from '../../utils/shelftagPdfService';
import { computeShelftagSheetLayout } from '../../utils/shelftagLayoutEngine';

interface LiveSheetPreviewTabProps {
  items: ShelfTagItem[];
  config: Module2Config;
}

export const LiveSheetPreviewTab: React.FC<LiveSheetPreviewTabProps> = ({
  items,
  config,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPercent, setZoomPercent] = useState<65 | 85 | 100>(85);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showMarginGuides, setShowMarginGuides] = useState(false);

  // Filter selected items
  const printItems = useMemo(() => {
    return items.filter(item => item.isSelected !== false);
  }, [items]);

  // Shared Layout Calculation Engine
  const layout = useMemo(() => {
    return computeShelftagSheetLayout(config, printItems.length);
  }, [config, printItems.length]);

  // Clamp current page if total pages change
  const activePage = Math.min(Math.max(1, currentPage), layout.totalPages);

  // Items for the current preview page
  const pageItems = useMemo(() => {
    const startIdx = (activePage - 1) * layout.tagsPerSheet;
    return printItems.slice(startIdx, startIdx + layout.tagsPerSheet);
  }, [printItems, activePage, layout.tagsPerSheet]);

  // Handle Export PDF
  const handleExportPdf = async () => {
    if (printItems.length === 0) {
      alert('Please select at least one tag to export as PDF.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const pdf = await generateShelftagPdf(printItems, config);
      pdf.save(`PRG-Shelftags-${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    if (printItems.length === 0) {
      alert('Please select at least one tag to print.');
      return;
    }
    window.print();
  };

  const zoomScale = zoomPercent / 100;

  // Split all items into chunks for multi-page print renderer
  const allPagesChunks = useMemo(() => {
    const chunks: ShelfTagItem[][] = [];
    for (let i = 0; i < printItems.length; i += layout.tagsPerSheet) {
      chunks.push(printItems.slice(i, i + layout.tagsPerSheet));
    }
    if (chunks.length === 0) chunks.push([]);
    return chunks;
  }, [printItems, layout.tagsPerSheet]);

  return (
    <div className="space-y-4">
      {/* 1. Top Action Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs print:hidden">
        {/* Left: Page Pagination Controls */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-700">Page:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold px-2 py-0.5 bg-zinc-100 rounded-md text-zinc-900">
              {activePage} / {layout.totalPages}
            </span>
            <button
              type="button"
              disabled={activePage >= layout.totalPages}
              onClick={() => setCurrentPage(p => Math.min(layout.totalPages, p + 1))}
              className="p-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-zinc-500 text-[11px] ml-1">
            ({printItems.length} tag{printItems.length !== 1 ? 's' : ''} total)
          </span>
        </div>

        {/* Middle: Zoom Controls & Margin Guide Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-zinc-700">Zoom:</span>
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              {([65, 85, 100] as const).map(zoomVal => (
                <button
                  key={zoomVal}
                  type="button"
                  onClick={() => setZoomPercent(zoomVal)}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    zoomPercent === zoomVal
                      ? 'bg-amber-400 text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {zoomVal}%
                </button>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-zinc-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showMarginGuides}
              onChange={e => setShowMarginGuides(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Printable Area Guides</span>
          </label>
        </div>

        {/* Right: Print Directly & Save as PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDirectPrint}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Directly</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Save as PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Priority Sheet Layout & Fit Status Bar (Section 14, 15, 19) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs space-y-2.5 text-xs print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-zinc-900 uppercase tracking-wider text-[11px]">
              SHEET LAYOUT
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-600">
              Paper: <strong className="text-zinc-900">{layout.paperName}</strong> ({layout.paperWidthMm} × {layout.paperHeightMm} mm)
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-600">
              Orientation: <strong className="text-zinc-900 capitalize">{layout.orientation}</strong>
            </span>
          </div>

          {/* 3-Column Fit Status Badge (Section 19) */}
          <div>
            {layout.fitsWidth ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                {layout.statusBadgeText}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                {layout.statusBadgeText}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Layout Metrics Grid (Section 14 & 15) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[11px]">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Columns</div>
            <div className="font-black text-amber-700 text-sm">{layout.columns}</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Rows</div>
            <div className="font-black text-zinc-900 text-sm">{layout.maxRows}</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Tags / Sheet</div>
            <div className="font-black text-zinc-900 text-sm">{layout.tagsPerSheet}</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Tag Size</div>
            <div className="font-bold text-zinc-800">{layout.tagWidthMm} × {layout.tagHeightMm} mm</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Horizontal Gap</div>
            <div className="font-bold text-zinc-800">{layout.colGapMm} mm</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Vertical Gap</div>
            <div className="font-bold text-zinc-800">{layout.rowGapMm} mm</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
            <div className="text-zinc-500 text-[10px] font-semibold">Estimated Sheets</div>
            <div className="font-black text-zinc-900 text-sm">{layout.totalPages}</div>
          </div>
        </div>

        {/* 3. Overflow Warning Alert (Section 18 & 20) */}
        {!layout.fitsWidth && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 text-rose-900 flex items-start gap-3 mt-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-xs text-rose-950">
                {layout.warningMessage}
              </h4>
              <p className="font-mono text-[11px] font-bold text-rose-800">
                {layout.detailsMessage}
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                To fix this, adjust the <strong>Tag Width</strong>, <strong>Horizontal Gap</strong>, or <strong>Left/Right Margins</strong> in layout settings, or select a wider paper size / landscape orientation. The system does not silently shrink tags to preserve physical millimeter accuracy.
              </p>
            </div>
          </div>
        )}

        {/* Print Instruction Hint (Section 7) */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Physical print recommendation: In browser print dialog, select <strong>Actual Size (100%)</strong> rather than &quot;Fit to Page&quot; for exact 1:1 millimeter alignment.
          </span>
        </div>
      </div>

      {/* 4. Live Screen Sheet Preview (Section 2, 4, 16) */}
      <div className="bg-zinc-200/80 rounded-2xl p-4 sm:p-8 flex justify-center items-start overflow-auto min-h-[600px] border border-zinc-300 print:hidden">
        {printItems.length === 0 ? (
          <div className="my-auto text-center p-8 bg-white/90 rounded-2xl border border-zinc-300 shadow-md max-w-md">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-zinc-900">No Tags Selected</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Please go to Tab 1 (Shelf Tag Items) and check the boxes for the tags you want to print.
            </p>
          </div>
        ) : (
          <div
            className="origin-top transition-transform duration-150"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Paper Sheet Representation */}
            <div
              className="bg-white shadow-2xl relative select-none border border-zinc-200/80"
              style={{
                width: `${layout.paperWidthMm}mm`,
                height: `${layout.paperHeightMm}mm`,
                paddingTop: `${layout.topMarginMm}mm`,
                paddingBottom: `${layout.bottomMarginMm}mm`,
                paddingLeft: `${layout.effectiveLeftMarginMm}mm`,
                paddingRight: `${layout.rightMarginMm}mm`,
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Optional Visual Printable Boundary Guide */}
              {showMarginGuides && (
                <div
                  className="absolute pointer-events-none border border-dashed border-blue-400/70"
                  style={{
                    left: `${layout.effectiveLeftMarginMm}mm`,
                    top: `${layout.topMarginMm}mm`,
                    width: `${layout.requiredWidthMm}mm`,
                    height: `${layout.requiredHeightMm}mm`,
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[8px] font-mono font-bold text-blue-600 bg-blue-50 px-1 rounded">
                    3-Col Width: {layout.requiredWidthMm}mm
                  </span>
                </div>
              )}

              {/* Tag Header Sheet Watermark / Indicator */}
              <div className="absolute top-1 left-3 text-[9px] font-mono text-zinc-400 select-none">
                {layout.paperName} ({layout.paperWidthMm} × {layout.paperHeightMm} mm) • Sheet {activePage} of {layout.totalPages}
              </div>

              {/* Tags Grid - Exactly 3 Columns */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${layout.columns}, ${layout.tagWidthMm}mm)`,
                  columnGap: `${layout.colGapMm}mm`,
                  rowGap: `${layout.rowGapMm}mm`,
                  width: 'fit-content',
                }}
              >
                {pageItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      width: `${layout.tagWidthMm}mm`,
                      height: `${layout.tagHeightMm}mm`,
                      overflow: 'hidden', // Strictly prevent tag fields from crossing into other columns
                    }}
                  >
                    <ShelftagCardRenderer
                      item={item}
                      config={config}
                      scale={1}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Dedicated Multi-Page Browser Print Container (Section 6, 7, 24) */}
      <div id="shelftag-print-container" className="hidden print:block">
        {allPagesChunks.map((chunk, pageIdx) => (
          <div
            key={pageIdx}
            className="shelftag-print-page bg-white"
            style={{
              width: `${layout.paperWidthMm}mm`,
              height: `${layout.paperHeightMm}mm`,
              paddingTop: `${layout.topMarginMm}mm`,
              paddingBottom: `${layout.bottomMarginMm}mm`,
              paddingLeft: `${layout.effectiveLeftMarginMm}mm`,
              paddingRight: `${layout.rightMarginMm}mm`,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              pageBreakAfter: pageIdx < allPagesChunks.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < allPagesChunks.length - 1 ? 'page' : 'auto',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            {/* Tags Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, ${layout.tagWidthMm}mm)`,
                columnGap: `${layout.colGapMm}mm`,
                rowGap: `${layout.rowGapMm}mm`,
                width: 'fit-content',
              }}
            >
              {chunk.map(item => (
                <div
                  key={item.id}
                  style={{
                    width: `${layout.tagWidthMm}mm`,
                    height: `${layout.tagHeightMm}mm`,
                    overflow: 'hidden',
                  }}
                >
                  <ShelftagCardRenderer
                    item={item}
                    config={config}
                    scale={1}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 6. Strict Physical Print CSS (Section 7) */}
      <style>{`
        @media print {
          /* Hide non-print application UI */
          body * {
            visibility: hidden;
          }
          #shelftag-print-container,
          #shelftag-print-container * {
            visibility: visible;
          }
          #shelftag-print-container {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            width: ${layout.paperWidthMm}mm !important;
          }
          .shelftag-print-page {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${layout.paperWidthMm}mm ${layout.paperHeightMm}mm;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
