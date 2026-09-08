import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Layers,
  FileSpreadsheet,
  Sparkles,
  UploadCloud,
  Check,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { InventoryItem, Module2LayoutConfig } from '../../types';

interface Module2ItemSelectionProps {
  items: InventoryItem[];
  itemCopies: Record<string, number>;
  onUpdateCopies: (newCopies: Record<string, number>) => void;
  onToggleItemSelect: (itemId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onLoadSampleData: () => void;
  onTriggerImport: () => void;
  onProceedToPreview: () => void;
  tagType: 'shelftag' | 'pp_tag';
}

export const Module2ItemSelection: React.FC<Module2ItemSelectionProps> = ({
  items,
  itemCopies,
  onUpdateCopies,
  onToggleItemSelect,
  onSelectAll,
  onLoadSampleData,
  onTriggerImport,
  onProceedToPreview,
  tagType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkCopiesInput, setBulkCopiesInput] = useState('1');

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase().trim();
    return items.filter(
      it =>
        (it.sku && it.sku.toLowerCase().includes(term)) ||
        (it.description && it.description.toLowerCase().includes(term)) ||
        (it.locator && it.locator.toLowerCase().includes(term)) ||
        (it.upcNo && it.upcNo.toLowerCase().includes(term)) ||
        (it.barcode && it.barcode.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const selectedItems = useMemo(() => {
    return items.filter(it => it.isSelected !== false);
  }, [items]);

  const totalCopies = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + Math.max(1, itemCopies[it.id] || 1), 0);
  }, [selectedItems, itemCopies]);

  const allSelected = filteredItems.length > 0 && filteredItems.every(it => it.isSelected !== false);

  const handleApplyBulkCopies = () => {
    const num = Math.max(1, parseInt(bulkCopiesInput) || 1);
    const updated = { ...itemCopies };
    selectedItems.forEach(it => {
      updated[it.id] = num;
    });
    onUpdateCopies(updated);
  };

  const handleCopyChange = (itemId: string, val: number) => {
    onUpdateCopies({
      ...itemCopies,
      [itemId]: Math.max(1, val),
    });
  };

  // If no items loaded yet
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-700">
          <FileSpreadsheet className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">
          No Inventory Data Loaded Yet
        </h3>
        <p className="text-sm text-zinc-600 mb-6 max-w-md mx-auto leading-relaxed">
          Both Count Tag and ShelfTag / PP Tag share the same inventory records. You can upload an Excel spreadsheet or load sample inventory data to begin generating {tagType === 'shelftag' ? 'Shelf Tags' : 'PP Tags'}.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onTriggerImport}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Excel File in Count Tag
          </button>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all border border-zinc-300 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Load Sample Supermarket Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar & Stats */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by SKU, UPC, description, or locator..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-zinc-800"
          />
        </div>

        {/* Middle & Right: Bulk copies & Continue button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
            <span className="text-[11px] font-semibold text-zinc-600">Copies for selected:</span>
            <input
              type="number"
              min="1"
              max="99"
              value={bulkCopiesInput}
              onChange={e => setBulkCopiesInput(e.target.value)}
              className="w-12 text-xs font-mono font-bold bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-center"
            />
            <button
              type="button"
              onClick={handleApplyBulkCopies}
              className="px-2 py-0.5 text-[11px] font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-semibold text-zinc-700">
              <span className="font-bold text-zinc-900">{selectedItems.length}</span> items /{' '}
              <span className="font-bold text-zinc-900">{totalCopies}</span> tags
            </span>
          </div>

          <button
            type="button"
            onClick={onProceedToPreview}
            disabled={selectedItems.length === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedItems.length > 0
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <span>Preview {tagType === 'shelftag' ? 'Shelf Tags' : 'PP Tags'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[11px] sticky top-0 z-10 border-b border-zinc-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectAll(!allSelected)}
                    className="cursor-pointer text-zinc-700 hover:text-zinc-950"
                    title={allSelected ? 'Deselect All' : 'Select All'}
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-zinc-900" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-28">Locator</th>
                <th className="p-3 w-32">SKU</th>
                <th className="p-3 w-36">UPC / Barcode</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-28 text-center">Tag Copies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
              {filteredItems.map(item => {
                const isSelected = item.isSelected !== false;
                const copies = itemCopies[item.id] || 1;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50 transition-colors ${
                      !isSelected ? 'opacity-40 bg-zinc-50/50' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleItemSelect(item.id, !isSelected)}
                        className="cursor-pointer text-zinc-700 hover:text-zinc-950"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-zinc-900" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-900">
                      {item.locator || '-'}
                    </td>
                    <td className="p-3 font-mono font-semibold text-zinc-800">
                      {item.sku || '-'}
                    </td>
                    <td className="p-3 font-mono text-zinc-600">
                      {item.upcNo || item.barcode || '-'}
                    </td>
                    <td className="p-3 font-semibold text-zinc-900 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyChange(item.id, copies - 1)}
                          disabled={copies <= 1}
                          className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded text-zinc-700 font-bold cursor-pointer text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={copies}
                          onChange={e => handleCopyChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center font-mono font-bold text-xs bg-zinc-50 border border-zinc-200 rounded py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyChange(item.id, copies + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 font-bold cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
