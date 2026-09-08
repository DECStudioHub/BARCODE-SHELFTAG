import React from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Type,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sliders,
  Barcode as BarcodeIcon,
  Tag as TagIcon,
  DollarSign,
  MapPin,
  Square,
  Sparkles,
} from 'lucide-react';
import { BarcodeType, Module2TagType, TagFieldConfig, TagFieldId, TextTransformMode } from '../../types';
import { ALL_TAG_FIELDS, AVAILABLE_FONTS } from './fieldDefaults';

interface TagFieldPropertyPanelProps {
  tagType: Module2TagType;
  tagWidthMm: number;
  tagHeightMm: number;
  fields: Record<TagFieldId, TagFieldConfig>;
  selectedFieldId: TagFieldId;
  onSelectField: (id: TagFieldId) => void;
  onUpdateField: (id: TagFieldId, updates: Partial<TagFieldConfig>) => void;
  onResetField: (id: TagFieldId) => void;
}

export const TagFieldPropertyPanel: React.FC<TagFieldPropertyPanelProps> = ({
  tagType,
  tagWidthMm,
  tagHeightMm,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onResetField,
}) => {
  const field = fields[selectedFieldId];

  if (!field) {
    return (
      <div className="p-6 text-center text-zinc-400 text-xs">
        Select a field on the canvas to configure properties.
      </div>
    );
  }

  const isBarcode = field.id === 'barcode';
  const isPrice = field.id === 'regularPrice' || field.id === 'promoPrice' || field.id === 'priceUnit';
  const isLocator = field.id === 'locator';
  const isPromoHeader = field.id === 'promoHeader';
  const isLogo = field.id === 'logo';
  const isDescription = field.id === 'description';

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs text-xs">
      {/* 1. Field Selector Strip */}
      <div className="p-3 border-b border-zinc-200 bg-zinc-50/70">
        <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2">
          Select Field to Customize
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_TAG_FIELDS.map(meta => {
            const f = fields[meta.id];
            const isSelected = selectedFieldId === meta.id;
            const isVisible = f?.visible;

            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => onSelectField(meta.id)}
                className={`px-2 py-1.5 rounded-lg text-left font-bold text-[11px] flex items-center justify-between gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : isVisible
                    ? 'bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                    : 'bg-zinc-100/60 border border-zinc-200 text-zinc-400 hover:bg-zinc-100'
                }`}
                title={`${meta.label} (${isVisible ? 'Visible' : 'Hidden'})`}
              >
                <span className="truncate">{meta.label}</span>
                <span
                  onClick={e => {
                    e.stopPropagation();
                    onUpdateField(meta.id, { visible: !isVisible });
                  }}
                  className={`p-0.5 rounded hover:bg-zinc-200/50 cursor-pointer ${
                    isVisible ? 'text-emerald-500' : 'text-zinc-400'
                  }`}
                  title={isVisible ? 'Hide Field' : 'Show Field'}
                >
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Field Header with Visibility & Reset */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-amber-100 text-amber-900">
            {isBarcode ? (
              <BarcodeIcon className="w-4 h-4" />
            ) : isPrice ? (
              <DollarSign className="w-4 h-4" />
            ) : isLocator ? (
              <MapPin className="w-4 h-4" />
            ) : (
              <Type className="w-4 h-4" />
            )}
          </span>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-[13px] leading-tight flex items-center gap-1.5">
              <span>{field.name}</span>
            </h3>
            <span className="text-[10.5px] text-zinc-500">
              {ALL_TAG_FIELDS.find(m => m.id === field.id)?.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Show / Hide Toggle */}
          <button
            type="button"
            onClick={() => onUpdateField(field.id, { visible: !field.visible })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              field.visible
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
            }`}
          >
            {field.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{field.visible ? 'Visible' : 'Hidden'}</span>
          </button>

          {/* Reset Single Field Button */}
          <button
            type="button"
            onClick={() => onResetField(field.id)}
            className="p-1.5 rounded-lg border border-zinc-300 text-zinc-600 hover:text-amber-800 hover:bg-zinc-100 transition cursor-pointer"
            title="Reset this field to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Scrollable Properties Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Section A: Position & Dimensions (mm) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-700 flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5 text-zinc-500" />
              <span>Position & Dimensions (mm)</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Max: {tagWidthMm} × {tagHeightMm} mm
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">X Position</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={tagWidthMm - 2}
                  value={field.x}
                  onChange={e => onUpdateField(field.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Y Position</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={tagHeightMm - 2}
                  value={field.y}
                  onChange={e => onUpdateField(field.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Width</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max={tagWidthMm}
                  value={field.width}
                  onChange={e => onUpdateField(field.id, { width: Math.max(4, parseFloat(e.target.value) || 4) })}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Height</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max={tagHeightMm}
                  value={field.height}
                  onChange={e => onUpdateField(field.id, { height: Math.max(2, parseFloat(e.target.value) || 2) })}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Typography (Not for Logo) */}
        {!isLogo && (
          <div className="space-y-3 pt-3 border-t border-zinc-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-700 flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-zinc-500" />
              <span>Typography</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Font Family */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Font Family</label>
                <select
                  value={field.fontFamily || 'Arial'}
                  onChange={e => onUpdateField(field.id, { fontFamily: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  {AVAILABLE_FONTS.map(font => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size in Points (pt) */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">
                  Font Size ({field.fontSizePt} pt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="28"
                    step="0.5"
                    value={field.fontSizePt}
                    onChange={e => onUpdateField(field.id, { fontSizePt: parseFloat(e.target.value) || 8 })}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="36"
                    value={field.fontSizePt}
                    onChange={e => onUpdateField(field.id, { fontSizePt: parseFloat(e.target.value) || 8 })}
                    className="w-16 px-2 py-1 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-center text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Font Weight, Style, Decoration & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Styling Buttons */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Format & Weight</label>
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  {/* Weight */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateField(field.id, {
                        fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`p-1.5 rounded flex-1 text-center font-black transition cursor-pointer ${
                      field.fontWeight === 'bold' ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5 mx-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateField(field.id, {
                        fontWeight: field.fontWeight === 'medium' ? 'normal' : 'medium',
                      })
                    }
                    className={`px-2 py-1 rounded text-[10.5px] font-bold transition cursor-pointer ${
                      field.fontWeight === 'medium' ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Medium Weight"
                  >
                    Med
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateField(field.id, {
                        fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-1.5 rounded flex-1 text-center italic transition cursor-pointer ${
                      field.fontStyle === 'italic' ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5 mx-auto" />
                  </button>

                  {/* Underline */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateField(field.id, {
                        textDecoration: field.textDecoration === 'underline' ? 'none' : 'underline',
                      })
                    }
                    className={`p-1.5 rounded flex-1 text-center underline transition cursor-pointer ${
                      field.textDecoration === 'underline' ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Text Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={field.textColor || '#000000'}
                    onChange={e => onUpdateField(field.id, { textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-300 cursor-pointer p-0.5"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    {['#000000', '#E31B23', '#2563eb', '#15803d', '#ffffff'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdateField(field.id, { textColor: c })}
                        className="w-5 h-5 rounded-full border border-zinc-300 shadow-2xs hover:scale-110 transition cursor-pointer"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section C: Alignment & Text Transformation */}
        {!isLogo && (
          <div className="space-y-3 pt-3 border-t border-zinc-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-700 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
              <span>Alignment & Transformation</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Horizontal Alignment */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Horizontal Align</label>
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => onUpdateField(field.id, { textAlign: align })}
                      className={`p-1.5 rounded flex-1 text-center font-bold capitalize transition cursor-pointer ${
                        field.textAlign === align ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Alignment */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Vertical Align</label>
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  {(['top', 'middle', 'bottom'] as const).map(valign => (
                    <button
                      key={valign}
                      type="button"
                      onClick={() => onUpdateField(field.id, { verticalAlign: valign })}
                      className={`px-2 py-1.5 rounded flex-1 text-center font-bold capitalize text-[10.5px] transition cursor-pointer ${
                        field.verticalAlign === valign ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {valign}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Transformation */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Text Transformation</label>
              <div className="grid grid-cols-4 gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                {([
                  { id: 'none', label: 'Normal' },
                  { id: 'uppercase', label: 'UPPER' },
                  { id: 'lowercase', label: 'lower' },
                  { id: 'capitalize', label: 'Title' },
                ] as const).map(tf => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => onUpdateField(field.id, { textTransform: tf.id as TextTransformMode })}
                    className={`py-1 rounded font-bold text-[10.5px] text-center transition cursor-pointer ${
                      field.textTransform === tf.id ? 'bg-white shadow-xs text-blue-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Wrapping (Especially for Description) */}
            <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-zinc-800 text-[11px] block">Text Wrapping</span>
                <span className="text-[10px] text-zinc-500">Wrap long text within field width</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.textWrap}
                    onChange={e => onUpdateField(field.id, { textWrap: e.target.checked })}
                    className="rounded accent-blue-600"
                  />
                  <span className="font-bold text-[11px] text-zinc-700">Enabled</span>
                </label>

                {field.textWrap && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-bold">Max Lines:</span>
                    <select
                      value={field.maxLines || 2}
                      onChange={e => onUpdateField(field.id, { maxLines: parseInt(e.target.value, 10) || 2 })}
                      className="px-1.5 py-0.5 font-bold bg-white border border-zinc-300 rounded text-xs"
                    >
                      <option value="1">1 Line</option>
                      <option value="2">2 Lines</option>
                      <option value="3">3 Lines</option>
                      <option value="4">4 Lines</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section D: Field Border & Padding */}
        <div className="space-y-3 pt-3 border-t border-zinc-200">
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-700 flex items-center gap-1">
            <Square className="w-3.5 h-3.5 text-zinc-500" />
            <span>Border & Padding</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Border Style */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Border</label>
              <select
                value={field.borderStyle || 'none'}
                onChange={e => onUpdateField(field.id, { borderStyle: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Corner Radius</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={field.borderRadiusMm || 0}
                  onChange={e => onUpdateField(field.id, { borderRadiusMm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>

            {/* Padding All Sides (mm) */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Inner Padding</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.2"
                  min="0"
                  max="5"
                  value={field.paddingLeftMm || 0}
                  onChange={e => {
                    const p = parseFloat(e.target.value) || 0;
                    onUpdateField(field.id, {
                      paddingLeftMm: p,
                      paddingRightMm: p,
                      paddingTopMm: p,
                      paddingBottomMm: p,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section E: Specialized Controls */}
        {/* BARCODE Controls */}
        {isBarcode && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-900 flex items-center gap-1.5">
              <BarcodeIcon className="w-3.5 h-3.5" />
              <span>Barcode Specialized Settings</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Barcode Format */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-700 mb-1">Barcode Format</label>
                <select
                  value={field.barcodeFormat || 'CODE128'}
                  onChange={e => onUpdateField(field.id, { barcodeFormat: e.target.value as BarcodeType })}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold"
                >
                  <option value="CODE128">Code 128 (Standard)</option>
                  <option value="EAN13">EAN-13 (Grocery Retail)</option>
                  <option value="CODE39">Code 39</option>
                  <option value="UPCA">UPC-A</option>
                </select>
              </div>

              {/* Barcode Alignment */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-700 mb-1">Barcode Alignment</label>
                <select
                  value={field.barcodeAlign || 'left'}
                  onChange={e => onUpdateField(field.id, { barcodeAlign: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-semibold"
                >
                  <option value="left">Left Aligned</option>
                  <option value="center">Centered</option>
                  <option value="right">Right Aligned</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Display: Barcode only vs Barcode + Human readable text */}
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.showBarcodeText !== false}
                  onChange={e => onUpdateField(field.id, { showBarcodeText: e.target.checked })}
                  className="rounded accent-blue-600"
                />
                <span className="font-bold text-zinc-800 text-[11px]">Show Human-Readable Number</span>
              </label>

              {field.showBarcodeText !== false && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-bold text-zinc-600">Text Size:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="14"
                    value={field.barcodeTextSizePt || 6.5}
                    onChange={e => onUpdateField(field.id, { barcodeTextSizePt: parseFloat(e.target.value) || 6.5 })}
                    className="w-16 px-1.5 py-1 bg-white border border-zinc-300 rounded text-center font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-zinc-400">pt</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRICE Controls (Regular, Promo, Unit) */}
        {isPrice && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
              <span>Price Formatting & Prefix</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Prefix / Label */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Prefix / Label</label>
                <input
                  type="text"
                  placeholder="e.g. WAS, NOW, RETAIL"
                  value={field.prefixText || ''}
                  onChange={e => onUpdateField(field.id, { prefixText: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold"
                />
              </div>

              {/* Currency Symbol */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={field.currencySymbol || '₱'}
                  onChange={e => onUpdateField(field.id, { currencySymbol: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-center"
                />
              </div>

              {/* Show Currency Symbol Toggle */}
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Currency Display</label>
                <button
                  type="button"
                  onClick={() => onUpdateField(field.id, { showCurrencySymbol: field.showCurrencySymbol === false ? true : false })}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    field.showCurrencySymbol !== false
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-zinc-300 text-zinc-500'
                  }`}
                >
                  {field.showCurrencySymbol !== false ? 'Show Symbol' : 'No Symbol'}
                </button>
              </div>
            </div>

            {/* Strike-Through Toggle (especially useful for Regular / WAS price) */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!field.strikeThrough}
                  onChange={e => onUpdateField(field.id, { strikeThrough: e.target.checked })}
                  className="rounded accent-red-600"
                />
                <span className="font-bold text-zinc-800 text-[11px]">
                  Strike-Through Line (Strikethrough Price)
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-zinc-600">Decimals:</span>
                <select
                  value={field.decimalPlaces != null ? field.decimalPlaces : 2}
                  onChange={e => onUpdateField(field.id, { decimalPlaces: parseInt(e.target.value, 10) })}
                  className="px-2 py-0.5 font-bold bg-white border border-zinc-300 rounded text-xs"
                >
                  <option value="2">2 (.00)</option>
                  <option value="0">0 (Whole)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* LOCATOR Controls */}
        {isLocator && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-zinc-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-600" />
              <span>Locator Badge Appearance</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateField(field.id, { locatorBadge: true, borderStyle: 'solid', borderWidthPx: 1 })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  field.locatorBadge
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-300'
                }`}
              >
                Framed Badge / Box
              </button>
              <button
                type="button"
                onClick={() => onUpdateField(field.id, { locatorBadge: false, borderStyle: 'none' })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  !field.locatorBadge
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-300'
                }`}
              >
                Plain Text
              </button>
            </div>
          </div>
        )}

        {/* PROMO HEADER Banner Controls */}
        {isPromoHeader && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 bg-red-50 p-3 rounded-xl border border-red-200">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-red-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Promotional Banner Bar</span>
            </span>

            <div>
              <label className="block text-[10.5px] font-bold text-zinc-700 mb-1">Banner Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={field.backgroundColor || '#E31B23'}
                  onChange={e => onUpdateField(field.id, { backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-zinc-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs font-bold text-zinc-600">
                  {field.backgroundColor || '#E31B23'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
