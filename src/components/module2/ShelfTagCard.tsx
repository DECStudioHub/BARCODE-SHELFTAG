import React, { useMemo } from 'react';
import { InventoryItem, Module2LayoutConfig } from '../../types';
import { generateBarcodeSvgString } from '../../utils/barcode';

interface ShelfTagCardProps {
  item: InventoryItem;
  config: Module2LayoutConfig;
  scale?: number;
  className?: string;
}

export const ShelfTagCard: React.FC<ShelfTagCardProps> = ({
  item,
  config,
  scale = 1,
  className = '',
}) => {
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvgString(
      item.barcode || item.upcNo || item.sku,
      config.barcodeType,
      Math.max(24, Math.round(config.barcodeHeightMm * 2.6)),
      true,
      10
    );
  }, [item.barcode, item.upcNo, item.sku, config.barcodeType, config.barcodeHeightMm]);

  return (
    <div
      className={`relative bg-white flex flex-col justify-between select-none overflow-hidden transition-shadow ${
        config.showBorder ? 'border-2 border-zinc-900 shadow-2xs' : 'border border-dashed border-zinc-300'
      } ${className}`}
      style={{
        width: `${config.tagWidthMm * scale}mm`,
        height: `${config.tagHeightMm * scale}mm`,
        boxSizing: 'border-box',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Corner Cut Guides */}
      {config.showCutGuides && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-400 pointer-events-none" />
        </>
      )}

      {/* Top Bar: Shelf Tag indicator & Locator */}
      <div className="bg-zinc-900 text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="font-black uppercase tracking-wider text-amber-300"
            style={{ fontSize: `${Math.max(7, config.fontSizeTitle * 0.7 * scale)}px` }}
          >
            SHELF TAG
          </span>
          <span
            className="text-[9px] text-zinc-400 font-mono hidden sm:inline"
            style={{ fontSize: `${Math.max(6, 7 * scale)}px` }}
          >
            (Pending Sample Layout)
          </span>
        </div>
        {item.locator && (
          <div
            className="font-mono font-bold bg-zinc-800 text-zinc-100 px-1.5 py-0.5 rounded-xs"
            style={{ fontSize: `${Math.max(8, config.fontSizeLocator * 0.8 * scale)}px` }}
          >
            LOC: {item.locator}
          </div>
        )}
      </div>

      {/* Item Description */}
      <div className="px-2 pt-1 flex-1 flex flex-col justify-start">
        <div
          className="font-bold text-zinc-900 leading-snug line-clamp-2 uppercase tracking-tight"
          style={{ fontSize: `${Math.max(8, config.fontSizeTitle * scale)}px` }}
          title={item.description}
        >
          {item.description || 'UNTITLED ITEM'}
        </div>

        {/* Product Identifiers: SKU & UPC */}
        <div
          className="mt-1 flex items-center justify-between text-zinc-700 font-medium border-t border-zinc-200 pt-1"
          style={{ fontSize: `${Math.max(7, config.fontSizeSku * scale)}px` }}
        >
          <div>
            <span className="text-zinc-500 font-semibold">SKU: </span>
            <span className="font-mono font-bold text-zinc-900">{item.sku || 'N/A'}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-semibold">UPC: </span>
            <span className="font-mono font-bold text-zinc-900">{item.upcNo || item.barcode || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Barcode Display */}
      <div className="px-2 pb-1.5 pt-0.5 flex flex-col items-center justify-center bg-zinc-50/50 border-t border-zinc-200">
        <div
          className="w-full flex items-center justify-center overflow-hidden"
          style={{ minHeight: `${config.barcodeHeightMm * scale * 0.8}mm` }}
        >
          {barcodeSvg ? (
            <div
              className="flex justify-center max-w-full [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          ) : (
            <div className="text-center font-mono text-[10px] py-1 border border-zinc-300 w-full bg-zinc-100 text-zinc-500">
              * {item.barcode || item.upcNo || item.sku || 'NO BARCODE'} *
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
