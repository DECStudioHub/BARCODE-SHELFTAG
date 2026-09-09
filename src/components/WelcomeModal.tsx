import React from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Tag,
  Table,
  CheckCircle2,
  Scan,
  ShieldCheck,
  ArrowRight,
  X,
  FileCheck,
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemoData: () => void;
  onOpenImport: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLoadDemoData,
  onOpenImport,
}) => {
  if (!isOpen) return null;

  const handleDontShowAgain = (checked: boolean) => {
    try {
      if (checked) {
        localStorage.setItem('prg_hide_welcome', 'true');
      } else {
        localStorage.removeItem('prg_hide_welcome');
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Tag className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                  PRG Shelftag & Barcode System V2
                </h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase tracking-wider">
                  Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Physical Inventory Count Sheets, Tag Generation & Retail Shelf Labels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Feature 1: Count Sheet */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Table className="w-4 h-4 text-emerald-700" />
              <span>Count Sheet & Tag Module</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Generate standardized physical inventory tally sheets with movable reorderable columns (SKU, Barcode, Description, Count), customizable high-contrast borders, and 15-row layout.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimized 12mm handwriting boxes</span>
            </div>
          </div>

          {/* Feature 2: Scanner Readability */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Scan className="w-4 h-4 text-emerald-700" />
              <span>High-Scan Barcode Engine</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Enhanced Code-128 barcode generator with dedicated optical quiet zones (10px margin padding) and calibrated bar ratios for instant red-laser scanner capture.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% handheld scanner reliability</span>
            </div>
          </div>

          {/* Feature 3: ShelfTag / PP Tag */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>Shelf Tag & PP Tag (Module 2)</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Full retail shelf-edge pricing labels, Price Point promo tags, and customized store branding headers ready for perforated paper or sheet printing.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dual module architecture</span>
            </div>
          </div>

          {/* Feature 4: Raw Excel Safe */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Safe Raw Excel Import</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Client-side read-only parsing ensures your original Excel files are never altered or damaged. Large files with &gt;500 rows are fully supported with non-blocking performance notices.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero data corruption guarantee</span>
            </div>
          </div>
        </div>

        {/* Quick Start Workflow */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <span className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
            Fast 4-Step Workflow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-emerald-950">
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">1. Import</span>
              Upload your .xlsx spreadsheet
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">2. Validate</span>
              Check barcodes and locators
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">3. Configure</span>
              Adjust layout & columns
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">4. Print</span>
              Exact single-copy printout
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-100">
          <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              onChange={e => handleDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
            <span>Don't show this welcome screen on startup</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadDemoData();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-colors"
            >
              Load Demo Data
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImport();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
