import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Module2Config, ShelfTagItem, ShelfTagStyle } from '../../types';
import { AddEditTagModal } from './AddEditTagModal';
import { Module2ExcelImportModal } from './Module2ExcelImportModal';

interface ShelfTagItemsTabProps {
  items: ShelfTagItem[];
  setItems: React.Dispatch<React.SetStateAction<ShelfTagItem[]>>;
  config: Module2Config;
  onResetSamples: () => void;
}

export const ShelfTagItemsTab: React.FC<ShelfTagItemsTabProps> = ({
  items,
  setItems,
  config,
  onResetSamples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState<'all' | 'white' | 'yellow'>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ShelfTagItem | null>(null);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

  // Counts
  const totalCount = items.length;
  const whiteCount = useMemo(() => items.filter(i => i.tagStyle === 'white').length, [items]);
  const yellowCount = useMemo(() => items.filter(i => i.tagStyle === 'yellow').length, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Style filter
      if (filterStyle !== 'all' && item.tagStyle !== filterStyle) {
        return false;
      }
      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.description.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        item.barcode.toLowerCase().includes(term) ||
        (item.locator && item.locator.toLowerCase().includes(term)) ||
        (item.promoHeader && item.promoHeader.toLowerCase().includes(term))
      );
    });
  }, [items, filterStyle, searchTerm]);

  // Selection tracking
  const selectedCount = useMemo(() => items.filter(i => i.isSelected).length, [items]);
  const isAllSelected = items.length > 0 && items.every(i => i.isSelected);

  const toggleSelectAll = () => {
    const nextVal = !isAllSelected;
    setItems(prev => prev.map(item => ({ ...item, isSelected: nextVal })));
  };

  const toggleItemSelect = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  // Bulk tag style change
  const setBulkTagStyle = (style: ShelfTagStyle) => {
    if (selectedCount === 0) return;
    setItems(prev =>
      prev.map(item => {
        if (!item.isSelected) return item;
        return {
          ...item,
          tagStyle: style,
          promoPrice:
            style === 'yellow'
              ? item.promoPrice || (item.regularPrice > 10 ? Math.round(item.regularPrice * 0.85) : null)
              : null,
          promoHeader: style === 'yellow' ? item.promoHeader || 'SPECIAL BUY' : undefined,
          promoSubtext: style === 'yellow' ? item.promoSubtext || 'SPECIAL PROMO PERIOD' : undefined,
          promoValidity: style === 'yellow' ? item.promoValidity || 'Special Promo Period' : undefined,
        };
      })
    );
  };

  // Bulk delete
  const deleteSelected = () => {
    if (selectedCount === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected tag(s)?`)) {
      setItems(prev => prev.filter(i => !i.isSelected));
    }
  };

  // Single item delete
  const deleteSingleItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Save add/edit
  const handleSaveTag = (savedTag: ShelfTagItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === savedTag.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedTag;
        return next;
      } else {
        return [savedTag, ...prev];
      }
    });
  };

  // Import Excel
  const handleImportExcel = (newItems: ShelfTagItem[]) => {
    setItems(prev => [...newItems, ...prev]);
  };

  const currency = config.currencySymbol || '₱';

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Left: Search input & Style Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search description, SKU, bar..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterStyle('all')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                filterStyle === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStyle('white')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStyle === 'white'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>⚪</span>
              <span>White ({whiteCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStyle('yellow')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStyle === 'yellow'
                  ? 'bg-amber-400 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>🟡</span>
              <span>Yellow ({yellowCount})</span>
            </button>
          </div>
        </div>

        {/* Right: Import Excel, + Add Single Tag, Reset Samples */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExcelOpen(true)}
            className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTag(null);
              setIsAddEditOpen(true);
            }}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Single Tag</span>
          </button>

          <button
            type="button"
            onClick={onResetSamples}
            title="Reset to 12 Sample Retail Tags"
            className="p-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 rounded-lg text-xs shadow-2xs cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Select All Checkbox */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 font-bold text-zinc-800 cursor-pointer hover:text-black"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-zinc-900 fill-zinc-900 stroke-white" />
            ) : (
              <Square className="w-4 h-4 text-zinc-400" />
            )}
            <span>Select All ({totalCount})</span>
          </button>

          {/* Bulk Tag Color for selected */}
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
            <span className="text-zinc-600 font-medium">
              Bulk Tag Color for selected ({selectedCount}):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setBulkTagStyle('white')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border text-xs flex items-center gap-1 ${
                  selectedCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200'
                    : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-2xs'
                }`}
              >
                <span>⚪</span>
                <span>Set to White Tag (Regular)</span>
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setBulkTagStyle('yellow')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border text-xs flex items-center gap-1 ${
                  selectedCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200'
                    : 'bg-amber-400 hover:bg-amber-500 text-zinc-950 border-amber-500 shadow-2xs'
                }`}
              >
                <span>🟡</span>
                <span>Set to Yellow Tag (Promo/PP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Selected */}
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={deleteSelected}
            className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedCount})</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold text-[11px] tracking-wider uppercase">
                <th className="py-2.5 px-3 w-10 text-center">SEL</th>
                <th className="py-2.5 px-3 w-36">TAG STYLE</th>
                <th className="py-2.5 px-3">DESCRIPTION</th>
                <th className="py-2.5 px-3 w-28">SKU / CODE</th>
                <th className="py-2.5 px-3 w-36">BARCODE</th>
                <th className="py-2.5 px-3 w-28 text-right">REGULAR PRICE</th>
                <th className="py-2.5 px-3 w-28 text-right">PROMO PRICE</th>
                <th className="py-2.5 px-3 w-20">UNIT</th>
                <th className="py-2.5 px-3 w-20">LOCATOR</th>
                <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400">
                    No items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isYellow = item.tagStyle === 'yellow';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        item.isSelected ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!item.isSelected}
                          onChange={() => toggleItemSelect(item.id)}
                          className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Tag Style Badge */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            // Toggle tag style on click
                            setItems(prev =>
                              prev.map(i =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      tagStyle: i.tagStyle === 'yellow' ? 'white' : 'yellow',
                                      promoPrice:
                                        i.tagStyle === 'white'
                                          ? i.promoPrice || Math.round(i.regularPrice * 0.85)
                                          : null,
                                      promoHeader:
                                        i.tagStyle === 'white'
                                          ? i.promoHeader || 'SAVE ₱15.00'
                                          : undefined,
                                      promoValidity:
                                        i.tagStyle === 'white'
                                          ? i.promoValidity || 'Valid until Sept 30'
                                          : undefined,
                                    }
                                  : i
                              )
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10.5px] cursor-pointer transition-all border ${
                            isYellow
                              ? 'bg-amber-400 text-zinc-950 border-amber-500 hover:bg-amber-300'
                              : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                          }`}
                          title="Click to toggle Tag Style"
                        >
                          <span>{isYellow ? '🟡' : '⚪'}</span>
                          <span>{isYellow ? 'YELLOW (PP)' : 'WHITE (REG)'}</span>
                        </button>
                      </td>

                      {/* Description + Promo Subtext */}
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">
                        <div className="uppercase line-clamp-1">{item.description}</div>
                        {isYellow && item.promoSubtext && (
                          <div className="text-[10.5px] font-bold text-red-600 mt-0.5 tracking-tight">
                            {item.promoSubtext}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-700">
                        {item.sku}
                      </td>

                      {/* Barcode */}
                      <td className="py-2.5 px-3 font-mono text-zinc-600">
                        {item.barcode}
                      </td>

                      {/* Regular Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                        {currency} {item.regularPrice ? item.regularPrice.toFixed(0) : '0'}
                      </td>

                      {/* Promo Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        {isYellow && item.promoPrice != null ? (
                          <span className="text-red-600">
                            {currency} {item.promoPrice.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">--</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-3 font-medium text-zinc-600">
                        {item.unit}
                      </td>

                      {/* Locator */}
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-800">
                        {item.locator || '--'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTag(item);
                              setIsAddEditOpen(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md cursor-pointer"
                            title="Edit Tag"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSingleItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tag Modal */}
      <AddEditTagModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingTag(null);
        }}
        onSave={handleSaveTag}
        initialTag={editingTag}
      />

      {/* Excel Import Modal */}
      <Module2ExcelImportModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onImport={handleImportExcel}
      />
    </div>
  );
};
