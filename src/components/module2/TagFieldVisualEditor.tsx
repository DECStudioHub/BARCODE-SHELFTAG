import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Eye,
  EyeOff,
  Move,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { Module2TagType, TagFieldConfig, TagFieldId, TagLayoutPreset } from '../../types';
import { ALL_TAG_FIELDS, AVAILABLE_FONTS } from './fieldDefaults';
import { generateBarcodeSvgString } from '../../utils/barcode';

interface TagFieldVisualEditorProps {
  tagType: Module2TagType;
  preset: TagLayoutPreset;
  selectedFieldId: TagFieldId;
  onSelectField: (id: TagFieldId) => void;
  onUpdateField: (id: TagFieldId, updates: Partial<TagFieldConfig>) => void;
  onResetField: (id: TagFieldId) => void;
}

export const TagFieldVisualEditor: React.FC<TagFieldVisualEditorProps> = ({
  tagType,
  preset,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onResetField,
}) => {
  const [zoom, setZoom] = useState<number>(1.6); // 1.6x zoom by default for comfortable editing
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridStepMm, setGridStepMm] = useState<number>(1); // 1mm snap

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se' | 'e' | 's'
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; initialW: number; initialH: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
  });

  // Millimeters to pixels scale factor
  // 96 DPI: 1 inch = 25.4 mm => 96 / 25.4 = 3.7795 px/mm
  const BASE_PX_PER_MM = 3.7795;
  const pxPerMm = BASE_PX_PER_MM * zoom;

  const tagWidthPx = preset.tagWidthMm * pxPerMm;
  const tagHeightPx = preset.tagHeightMm * pxPerMm;

  const activeField = preset.fields[selectedFieldId];

  // Helper to snap mm to grid
  const snapMm = useCallback(
    (valMm: number): number => {
      if (!snapToGrid) return Math.round(valMm * 10) / 10;
      return Math.round(valMm / gridStepMm) * gridStepMm;
    },
    [snapToGrid, gridStepMm]
  );

  // Mouse / Pointer Dragging Logic
  const handlePointerDownField = (e: React.PointerEvent, fieldId: TagFieldId) => {
    e.stopPropagation();
    onSelectField(fieldId);
    setIsDragging(true);
    setIsResizing(null);

    const f = preset.fields[fieldId];
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: f.x,
      initialY: f.y,
      initialW: f.width,
      initialH: f.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (e: React.PointerEvent, handle: 'se' | 'e' | 's', fieldId: TagFieldId) => {
    e.stopPropagation();
    onSelectField(fieldId);
    setIsResizing(handle);
    setIsDragging(false);

    const f = preset.fields[fieldId];
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: f.x,
      initialY: f.y,
      initialW: f.width,
      initialH: f.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return;
    const dxMm = (e.clientX - dragStartRef.current.startX) / pxPerMm;
    const dyMm = (e.clientY - dragStartRef.current.startY) / pxPerMm;

    if (isDragging && activeField) {
      let newX = snapMm(dragStartRef.current.initialX + dxMm);
      let newY = snapMm(dragStartRef.current.initialY + dyMm);

      // Clamp within tag bounds
      newX = Math.max(0, Math.min(preset.tagWidthMm - activeField.width, newX));
      newY = Math.max(0, Math.min(preset.tagHeightMm - activeField.height, newY));

      onUpdateField(selectedFieldId, { x: newX, y: newY });
    } else if (isResizing && activeField) {
      let newW = activeField.width;
      let newH = activeField.height;

      if (isResizing === 'se' || isResizing === 'e') {
        newW = snapMm(dragStartRef.current.initialW + dxMm);
        newW = Math.max(5, Math.min(preset.tagWidthMm - activeField.x, newW));
      }
      if (isResizing === 'se' || isResizing === 's') {
        newH = snapMm(dragStartRef.current.initialH + dyMm);
        newH = Math.max(3, Math.min(preset.tagHeightMm - activeField.y, newH));
      }

      onUpdateField(selectedFieldId, { width: newW, height: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging || isResizing) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setIsDragging(false);
    setIsResizing(null);
  };

  // Keyboard Nudge (Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is inside an input field, do not hijack arrows
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (!activeField) return;

      const step = e.shiftKey ? 2 : 0.5;
      let handled = false;

      if (e.key === 'ArrowLeft') {
        onUpdateField(selectedFieldId, { x: Math.max(0, activeField.x - step) });
        handled = true;
      } else if (e.key === 'ArrowRight') {
        onUpdateField(selectedFieldId, { x: Math.min(preset.tagWidthMm - activeField.width, activeField.x + step) });
        handled = true;
      } else if (e.key === 'ArrowUp') {
        onUpdateField(selectedFieldId, { y: Math.max(0, activeField.y - step) });
        handled = true;
      } else if (e.key === 'ArrowDown') {
        onUpdateField(selectedFieldId, { y: Math.min(preset.tagHeightMm - activeField.height, activeField.y + step) });
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, activeField, preset.tagWidthMm, preset.tagHeightMm, onUpdateField]);

  // Sample Barcode SVG for visual preview
  const sampleBarcodeSvg = useMemo(() => {
    const f = preset.fields.barcode;
    if (!f) return '';
    const hPx = Math.max(16, Math.round(f.height * pxPerMm * 0.7));
    return generateBarcodeSvgString(
      '123456789012',
      f.barcodeFormat || 'CODE128',
      hPx,
      f.showBarcodeText !== false,
      Math.max(8, Math.round(f.barcodeTextSizePt ? f.barcodeTextSizePt * (pxPerMm / BASE_PX_PER_MM) : 9))
    );
  }, [preset.fields.barcode, pxPerMm, BASE_PX_PER_MM]);

  // Generate Millimeter Ruler Ticks
  const hRulerTicks = useMemo(() => {
    const ticks = [];
    for (let mm = 0; mm <= preset.tagWidthMm; mm += 5) {
      const isMajor = mm % 10 === 0;
      ticks.push(
        <div
          key={`h-${mm}`}
          className="absolute top-0 flex flex-col items-center select-none pointer-events-none"
          style={{ left: `${mm * pxPerMm}px` }}
        >
          <div
            className={`w-[1px] bg-zinc-400 ${isMajor ? 'h-3.5 bg-zinc-700' : 'h-2'}`}
          />
          {isMajor && (
            <span className="text-[8px] font-mono text-zinc-500 font-bold -mt-0.5 transform -translate-x-1/2">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  }, [preset.tagWidthMm, pxPerMm]);

  const vRulerTicks = useMemo(() => {
    const ticks = [];
    for (let mm = 0; mm <= preset.tagHeightMm; mm += 5) {
      const isMajor = mm % 10 === 0;
      ticks.push(
        <div
          key={`v-${mm}`}
          className="absolute left-0 flex items-center select-none pointer-events-none"
          style={{ top: `${mm * pxPerMm}px` }}
        >
          <div
            className={`h-[1px] bg-zinc-400 ${isMajor ? 'w-3.5 bg-zinc-700' : 'w-2'}`}
          />
          {isMajor && (
            <span className="text-[8px] font-mono text-zinc-500 font-bold -ml-0.5 transform -translate-y-1/2">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  }, [preset.tagHeightMm, pxPerMm]);

  const isYellow = tagType === 'pp_tag';
  const tagBg = isYellow ? '#FEED01' : '#ffffff';

  return (
    <div className="flex flex-col h-full bg-zinc-100/90 rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="bg-white px-4 py-2.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Current Active Tag & Status */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
              isYellow ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-white'
            }`}
          >
            <span>{isYellow ? '🟡' : '⚪'}</span>
            <span>{isYellow ? 'PP Tag Layout' : 'ShelfTag Layout'}</span>
          </span>

          <span className="text-zinc-500 font-mono text-[11px] font-bold">
            {preset.tagWidthMm} × {preset.tagHeightMm} mm
          </span>

          {activeField && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[10.5px]">
              <span className="text-zinc-400">Selected:</span>
              <strong className="text-zinc-900">{activeField.name}</strong>
              <span className="text-amber-600 font-bold ml-1">
                ({activeField.x.toFixed(1)}, {activeField.y.toFixed(1)}) mm
              </span>
            </span>
          )}
        </div>

        {/* Right Controls: Zoom, Grid, Snap */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-zinc-700 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[10.5px] font-bold text-zinc-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3, Math.round((prev + 0.25) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-zinc-700 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.6)}
              className="px-1.5 py-0.5 text-[9.5px] font-bold hover:bg-white rounded text-zinc-600 ml-0.5 transition cursor-pointer"
              title="Reset Zoom to 160%"
            >
              Fit
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              showGrid ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
            title="Toggle Visual Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grid</span>
          </button>

          {/* Snap to Grid Toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              snapToGrid ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
            title="Toggle Snap to Grid (1mm)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Snap</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Work Area with Rulers */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 overflow-auto p-8 relative flex items-center justify-center select-none bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div className="relative inline-block m-auto">
          {/* Top Horizontal Ruler */}
          <div
            className="absolute -top-7 left-7 h-6 bg-zinc-200/90 border border-zinc-300 rounded-t overflow-hidden"
            style={{ width: `${tagWidthPx}px` }}
          >
            {hRulerTicks}
          </div>

          {/* Left Vertical Ruler */}
          <div
            className="absolute top-0 -left-7 w-6 bg-zinc-200/90 border border-zinc-300 rounded-l overflow-hidden"
            style={{ height: `${tagHeightPx}px` }}
          >
            {vRulerTicks}
          </div>

          {/* Ruler Corner Junction Box */}
          <div className="absolute -top-7 -left-7 w-7 h-7 bg-zinc-300 border border-zinc-400 rounded-tl flex items-center justify-center text-[8px] font-mono font-bold text-zinc-600">
            mm
          </div>

          {/* The Actual Physical Tag Canvas */}
          <div
            className="relative border-2 border-zinc-900 shadow-xl transition-colors overflow-hidden"
            style={{
              width: `${tagWidthPx}px`,
              height: `${tagHeightPx}px`,
              backgroundColor: tagBg,
              boxSizing: 'border-box',
            }}
          >
            {/* Grid Overlay Lines (10mm major, 2mm minor) */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-30 z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #71717a 1px, transparent 1px),
                    linear-gradient(to bottom, #71717a 1px, transparent 1px),
                    linear-gradient(to right, #d4d4d8 1px, transparent 1px),
                    linear-gradient(to bottom, #d4d4d8 1px, transparent 1px)
                  `,
                  backgroundSize: `
                    ${10 * pxPerMm}px ${10 * pxPerMm}px,
                    ${10 * pxPerMm}px ${10 * pxPerMm}px,
                    ${2 * pxPerMm}px ${2 * pxPerMm}px,
                    ${2 * pxPerMm}px ${2 * pxPerMm}px
                  `,
                }}
              />
            )}

            {/* Corner Cutting Guides */}
            {preset.showCutGuides && (
              <>
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-600 pointer-events-none z-30" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-600 pointer-events-none z-30" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-600 pointer-events-none z-30" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-600 pointer-events-none z-30" />
              </>
            )}

            {/* RENDER ALL FIELDS AS INTERACTIVE BOUNDING BOXES */}
            {ALL_TAG_FIELDS.map(meta => {
              const field = preset.fields[meta.id];
              if (!field) return null;
              const isSelected = selectedFieldId === meta.id;

              const leftPx = field.x * pxPerMm;
              const topPx = field.y * pxPerMm;
              const widthPx = field.width * pxPerMm;
              const heightPx = field.height * pxPerMm;

              // Hide if not visible and not selected
              if (!field.visible && !isSelected) {
                return null;
              }

              return (
                <div
                  key={meta.id}
                  onPointerDown={e => handlePointerDownField(e, meta.id)}
                  className={`absolute transition-shadow group select-none cursor-move ${
                    !field.visible ? 'opacity-40 border-dashed' : ''
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    zIndex: isSelected ? 40 : meta.id === 'promoHeader' ? 5 : 10,
                    boxSizing: 'border-box',
                    paddingTop: `${field.paddingTopMm * pxPerMm}px`,
                    paddingBottom: `${field.paddingBottomMm * pxPerMm}px`,
                    paddingLeft: `${field.paddingLeftMm * pxPerMm}px`,
                    paddingRight: `${field.paddingRightMm * pxPerMm}px`,
                    backgroundColor: field.backgroundColor || (meta.id === 'promoHeader' ? '#E31B23' : undefined),
                    border: isSelected
                      ? '2px solid #2563eb'
                      : field.borderStyle && field.borderStyle !== 'none'
                      ? `${field.borderWidthPx || 1}px ${field.borderStyle} ${field.borderColor || '#000'}`
                      : '1px dashed rgba(161, 161, 170, 0.4)',
                    borderRadius: field.borderRadiusMm ? `${field.borderRadiusMm * pxPerMm}px` : undefined,
                  }}
                >
                  {/* Selected Field Label Tag Badge */}
                  {isSelected && (
                    <div className="absolute -top-5 left-0 bg-blue-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-t shadow flex items-center gap-1 z-50 pointer-events-none whitespace-nowrap">
                      <span>{field.name}</span>
                      <span className="opacity-75">
                        {field.width}×{field.height}mm
                      </span>
                    </div>
                  )}

                  {/* Field Content Simulation */}
                  <div
                    className="w-full h-full overflow-hidden flex flex-col pointer-events-none"
                    style={{
                      fontFamily: field.fontFamily || 'Arial',
                      fontSize: `${Math.max(7, field.fontSizePt * (pxPerMm / BASE_PX_PER_MM))}px`,
                      fontWeight: field.fontWeight === 'bold' ? 800 : field.fontWeight === 'medium' ? 600 : 400,
                      fontStyle: field.fontStyle || 'normal',
                      textDecoration: field.textDecoration || 'none',
                      color: field.textColor || (isYellow ? '#000000' : '#18181b'),
                      textAlign: field.textAlign || 'left',
                      justifyContent:
                        field.verticalAlign === 'top'
                          ? 'flex-start'
                          : field.verticalAlign === 'bottom'
                          ? 'flex-end'
                          : 'center',
                      alignItems:
                        field.textAlign === 'left'
                          ? 'flex-start'
                          : field.textAlign === 'right'
                          ? 'flex-end'
                          : 'center',
                      textTransform: field.textTransform === 'none' ? undefined : field.textTransform,
                      lineHeight: field.lineHeightPt ? `${field.lineHeightPt * (pxPerMm / BASE_PX_PER_MM)}px` : 1.15,
                    }}
                  >
                    {meta.id === 'description' && (
                      <div className={field.textWrap ? `line-clamp-${field.maxLines || 2}` : 'truncate w-full'}>
                        SAN MIGUEL PALE PILSEN 330ML CAN
                      </div>
                    )}

                    {meta.id === 'sku' && (
                      <div className="truncate w-full">
                        {field.prefixText || 'SKU: '}480001600123
                      </div>
                    )}

                    {meta.id === 'locator' && (
                      <div
                        className={
                          field.locatorBadge
                            ? isYellow
                              ? 'bg-black text-white px-1.5 py-0.2 rounded-xs font-mono font-bold'
                              : 'border border-black font-mono font-bold px-1 rounded-xs'
                            : 'font-mono font-bold'
                        }
                      >
                        A02-04-12
                      </div>
                    )}

                    {meta.id === 'barcode' && (
                      <div
                        className="w-full h-full flex flex-col justify-end overflow-hidden"
                        style={{
                          alignItems:
                            field.barcodeAlign === 'center'
                              ? 'center'
                              : field.barcodeAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                        }}
                      >
                        <div
                          className="max-w-full overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }}
                        />
                      </div>
                    )}

                    {meta.id === 'regularPrice' && (
                      <div className="flex flex-col items-end leading-none">
                        {field.prefixText && (
                          <span
                            className="uppercase font-bold tracking-wider opacity-70 mb-0.5"
                            style={{ fontSize: `${Math.max(6, (field.fontSizePt * 0.55) * (pxPerMm / BASE_PX_PER_MM))}px` }}
                          >
                            {field.prefixText}
                          </span>
                        )}
                        <span className={field.strikeThrough ? 'line-through' : ''}>
                          {field.showCurrencySymbol !== false ? (field.currencySymbol || '₱') + ' ' : ''}
                          199.00
                        </span>
                      </div>
                    )}

                    {meta.id === 'promoPrice' && (
                      <div className="flex flex-col items-end leading-none">
                        {field.prefixText && (
                          <span
                            className="uppercase font-bold tracking-wider opacity-70 mb-0.5"
                            style={{ fontSize: `${Math.max(6, (field.fontSizePt * 0.55) * (pxPerMm / BASE_PX_PER_MM))}px` }}
                          >
                            {field.prefixText}
                          </span>
                        )}
                        <span>
                          {field.showCurrencySymbol !== false ? (field.currencySymbol || '₱') + ' ' : ''}
                          179.00
                        </span>
                      </div>
                    )}

                    {meta.id === 'priceUnit' && (
                      <div className="truncate w-full font-bold uppercase tracking-wider">
                        PER CAN
                      </div>
                    )}

                    {meta.id === 'promoHeader' && (
                      <div className="text-white font-black tracking-tight uppercase flex items-center justify-between w-full px-1">
                        <span>{preset.promoHeader || 'SPECIAL BUY'}</span>
                        <span className="text-[9px] opacity-90">PROMO TAG</span>
                      </div>
                    )}

                    {meta.id === 'logo' && (
                      <img
                        src="/prince-logo.svg"
                        alt="Logo"
                        className="object-contain max-h-full max-w-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Resize Handles (When Field is Selected) */}
                  {isSelected && (
                    <>
                      {/* South-East (Bottom-Right) Corner Handle */}
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 'se', meta.id)}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow z-50 hover:scale-125 transition-transform"
                        title="Resize Width & Height"
                      />
                      {/* East (Right Edge) Handle */}
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 'e', meta.id)}
                        className="absolute top-1/2 -right-1 w-2 h-4 -translate-y-1/2 bg-blue-600 border border-white rounded-sm cursor-e-resize shadow z-50 hover:scale-125 transition-transform"
                        title="Resize Width"
                      />
                      {/* South (Bottom Edge) Handle */}
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 's', meta.id)}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-600 border border-white rounded-sm cursor-s-resize shadow z-50 hover:scale-125 transition-transform"
                        title="Resize Height"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Status / Instructions Bar */}
      <div className="bg-white px-4 py-2 border-t border-zinc-200 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-zinc-400" />
            <span>Click & Drag to reposition</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Drag blue handle to resize</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-[9.5px] font-mono">
              ↑↓←→
            </kbd>
            <span>Nudge 0.5mm</span>
          </span>
          <span className="hidden lg:inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-[9.5px] font-mono">
              Shift + Arrows
            </kbd>
            <span>Nudge 2mm</span>
          </span>
        </div>

        {activeField && (
          <button
            type="button"
            onClick={() => onResetField(selectedFieldId)}
            className="inline-flex items-center gap-1 text-zinc-600 hover:text-amber-700 font-semibold cursor-pointer transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset {activeField.name} to Default</span>
          </button>
        )}
      </div>
    </div>
  );
};
