import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  FileText,
  Layers,
} from 'lucide-react';
import { InventoryItem, Module2LayoutConfig } from '../../types';
import { ShelfTagCard } from './ShelfTagCard';
import { PPTagCard } from './PPTagCard';
import { generateModule2Pdf, Module2PdfProgress } from '../../utils/module2PdfGenerator';

interface Module2PreviewProps {
  items: InventoryItem[];
  itemCopies: Record<string, number>;
  config: Module2LayoutConfig;
  onBackToSelection: () => void;
  onOpenConfig: () => void;
}

export const Module2Preview: React.FC<Module2PreviewProps> = ({
  items,
  itemCopies,
  config,
  onBackToSelection,
  onOpenConfig,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<Module2PdfProgress | null>(null);

  // Filter selected items and expand by copies
  const expandedItems = useMemo(() => {
    const list: InventoryItem[] = [];
    items
      .filter(it => it.isSelected !== false)
      .forEach(it => {
        const copies = Math.max(1, itemCopies[it.id] || 1);
        for (let i = 0; i < copies; i++) {
          list.push(it);
        }
      });
    return list;
  }, [items, itemCopies]);

  // Page dimensions in mm
  const paperDimensions = useMemo(() => {
    let width = 210;
    let height = 297;
    if (config.paperSize === 'LETTER') {
      width = 215.9;
      height = 279.4;
    } else if (config.paperSize === 'CUSTOM') {
      width = Math.max(50, Number(config.customWidthMm) || 210);
      height = Math.max(50, Number(config.customHeightMm) || 297);
    }
    if (config.orientation === 'landscape') {
      return { width: height, height: width };
    }
    return { width, height };
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Layout calculation
  const layout = useMemo(() => {
    const usableWidth = paperDimensions.width - config.marginLeftMm - config.marginRightMm;
    const usableHeight = paperDimensions.height - config.marginTopMm - config.marginBottomMm;

    const cols = Math.max(1, Number(config.columns) || 1);
    const rows = Math.max(1, Math.floor((usableHeight + config.gapRowMm) / (config.tagHeightMm + config.gapRowMm)));
    const tagsPerPage = cols * rows;
    const totalPages = Math.max(1, Math.ceil(expandedItems.length / tagsPerPage));

    // Chunk into pages
    const pages: InventoryItem[][] = [];
    for (let p = 0; p < totalPages; p++) {
      pages.push(expandedItems.slice(p * tagsPerPage, (p + 1) * tagsPerPage));
    }

    return { cols, rows, tagsPerPage, totalPages, pages };
  }, [paperDimensions, config, expandedItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (expandedItems.length === 0) return;
    setIsGeneratingPdf(true);
    setPdfProgress({ currentPage: 0, totalPages: layout.totalPages, percent: 0 });

    try {
      const formattedItems = items
        .filter(it => it.isSelected !== false)
        .map(it => ({
          item: it,
          copies: Math.max(1, itemCopies[it.id] || 1),
        }));

      const doc = await generateModule2Pdf(formattedItems, config, progress => {
        setPdfProgress(progress);
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const tagPrefix = config.tagType === 'shelftag' ? 'ShelfTags' : 'PPTags';
      doc.save(`${tagPrefix}_${dateStr}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomScale(prev => Math.min(1.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  return (
    <div className="space-y-4">
      {/* Top Action / Control Bar */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Left: Navigation & Quick Info */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSelection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Items</span>
          </button>
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Layout Settings</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-zinc-200 pl-3 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900">{expandedItems.length}</span> tags on{' '}
            <span className="font-semibold text-zinc-900">{layout.totalPages}</span> sheet
            {layout.totalPages > 1 ? 's' : ''} ({config.columns} col × {layout.rows} row)
          </div>
        </div>

        {/* Right: Zoom & Export Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 hover:bg-zinc-200 rounded text-zinc-700 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-zinc-800">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1.5 hover:bg-zinc-200 rounded text-zinc-700 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className="p-1.5 hover:bg-zinc-200 rounded text-zinc-700 cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tags</span>
          </button>

          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg transition-all border border-zinc-300 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Progress Banner if Generating */}
      {pdfProgress && (
        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-xs print:hidden animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>
              Generating PDF: Page {pdfProgress.currentPage} of {pdfProgress.totalPages}...
            </span>
          </div>
          <span className="font-mono font-bold text-amber-300">{pdfProgress.percent}%</span>
        </div>
      )}

      {/* Multi-Page Canvas View */}
      <div className="flex flex-col items-center gap-8 py-4 bg-zinc-200/60 p-4 sm:p-8 rounded-2xl overflow-x-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
        {layout.pages.map((pageItems, pageIdx) => (
          <div
            key={pageIdx}
            className="relative bg-white shadow-xl print:shadow-none transition-all print:m-0 print:border-none page-break"
            style={{
              width: `${paperDimensions.width * zoomScale}mm`,
              minHeight: `${paperDimensions.height * zoomScale}mm`,
              paddingTop: `${config.marginTopMm * zoomScale}mm`,
              paddingBottom: `${config.marginBottomMm * zoomScale}mm`,
              paddingLeft: `${config.marginLeftMm * zoomScale}mm`,
              paddingRight: `${config.marginRightMm * zoomScale}mm`,
              boxSizing: 'border-box',
            }}
          >
            {/* Sheet Page Label in Preview */}
            <div className="absolute top-2 right-3 font-mono text-[10px] text-zinc-400 select-none print:hidden">
              Page {pageIdx + 1} of {layout.totalPages}
            </div>

            {/* Tags Grid on Page */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                columnGap: `${config.gapColMm * zoomScale}mm`,
                rowGap: `${config.gapRowMm * zoomScale}mm`,
                width: '100%',
              }}
            >
              {pageItems.map((item, itemIdx) => (
                <div key={`${item.id}-${pageIdx}-${itemIdx}`} className="flex justify-center">
                  {config.tagType === 'shelftag' ? (
                    <ShelfTagCard item={item} config={config} scale={zoomScale} />
                  ) : (
                    <PPTagCard item={item} config={config} scale={zoomScale} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
