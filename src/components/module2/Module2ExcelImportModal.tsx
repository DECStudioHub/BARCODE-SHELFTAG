import React, { useRef, useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ShelfTagItem } from '../../types';

interface Module2ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ShelfTagItem[]) => void;
}

export const Module2ExcelImportModal: React.FC<Module2ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const processWorkbook = (wb: XLSX.WorkBook) => {
    try {
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        setErrorMsg('The uploaded sheet is empty.');
        return;
      }

      // Map rows to ShelfTagItem
      const parsedItems: ShelfTagItem[] = rawRows.map((row, idx) => {
        // Detect SKU
        const sku = String(row.SKU || row['SKU / CODE'] || row.Code || row.ItemCode || row.Item || `SKU-${idx + 1}`).trim();
        // Detect Description
        const desc = String(
          row.Description || row.DESCRIPTION || row.Desc || row['Item Description'] || row.Name || 'UNTITLED ITEM'
        ).trim().toUpperCase();
        // Detect Barcode / UPC
        const barcode = String(row.Barcode || row.BARCODE || row.UPC || row['UPC No'] || row.upcNo || sku).trim();
        // Detect Regular Price
        const regPrice = parseFloat(row['Regular Price'] || row.RegularPrice || row.Price || row.PRICE || row.SRP || '0') || 0;
        // Detect Promo Price
        const promoPriceRaw = row['Promo Price'] || row.PromoPrice || row.Promo || row.SalePrice || '';
        const promoPrice = promoPriceRaw ? parseFloat(promoPriceRaw) || null : null;
        // Detect Tag Style
        const styleRaw = String(row['Tag Style'] || row.Style || row.Type || '').toLowerCase();
        const tagStyle = (styleRaw.includes('yellow') || styleRaw.includes('promo') || (promoPrice != null && promoPrice > 0)) ? 'yellow' : 'white';
        // Detect Unit
        const unit = String(row.Unit || row.UNIT || row.UOM || 'per PC').trim();
        // Detect Locator
        const locator = String(row.Locator || row.LOCATOR || row.Location || row.Aisle || 'A01-01').trim();
        // Detect Category
        const category = String(row.Category || row.Dept || row.Department || 'Grocery').trim();

        return {
          id: `imp-${Date.now()}-${idx}`,
          tagStyle,
          description: desc,
          promoHeader: tagStyle === 'yellow' ? (promoPrice ? `SAVE ₱${Math.max(0, regPrice - promoPrice).toFixed(2)}` : 'PROMO TAG') : undefined,
          promoSubtext: tagStyle === 'yellow' ? 'SPECIAL PROMO PERIOD' : undefined,
          promoValidity: tagStyle === 'yellow' ? 'Special Promo Period' : undefined,
          sku,
          barcode,
          regularPrice: regPrice,
          promoPrice,
          unit,
          locator,
          category,
          isSelected: true,
          copies: 1,
        };
      });

      onImport(parsedItems);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to parse Excel file: ' + (err?.message || 'Unknown format'));
    }
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        processWorkbook(wb);
      } catch (err: any) {
        setErrorMsg('Error reading file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-zinc-900">Import Excel Spreadsheet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
            }`}
          >
            <UploadCloud className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <span className="text-xs font-bold text-zinc-800 block">
              Drag and drop your .xlsx or .xls file here
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">or click to browse files</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {errorMsg && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
            Supported columns include: <strong>Description</strong>, <strong>SKU</strong>,{' '}
            <strong>Barcode / UPC</strong>, <strong>Regular Price</strong>, <strong>Promo Price</strong>,{' '}
            <strong>Tag Style</strong> (White/Yellow), <strong>Locator</strong>, and <strong>Unit</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
