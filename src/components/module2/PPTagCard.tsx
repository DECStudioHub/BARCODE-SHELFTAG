import React, { useMemo } from 'react';
import { InventoryItem, Module2LayoutConfig } from '../../types';
import { generateBarcodeSvgString } from '../../utils/barcode';

interface PPTagCardProps {
  item: InventoryItem;
  config: Module2LayoutConfig;
  scale?: number;
  className?: string;
}

export const PPTagCard: React.FC<PPTagCardProps> = ({
  item,
  config,
  scale = 1,
  className = '',
}) => {
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvgString(
      item.barcode || item.upcNo || item.sku,
      config.barcodeType,
      Math.max(26, Math.round(config.barcodeHeightMm * 2.8)),
      true,
      10
    );
  }, [item.barcode, item.upcNo, item.sku, config.barcodeType, config.barcodeHeightMm]);

  return (
    <div
      className={`relative bg-white flex flex-col justify-between select-none overflow-hidden transition-shadow ${
        config.showBorder ? 'border-2 border-indigo-950 shadow-2xs' : 'border border-dashed border-zinc-300'
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
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-400 pointer-events-none" />
        </>
      )}

      {/* Top Header: PP Tag badge */}
      <div className="bg-indigo-900 text-white px-2.5 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-black uppercase tracking-wider text-cyan-300"
            style={{ fontSize: `${Math.max(7, config.fontSizeTitle * 0.75 * scale)}px` }}
          >
            PP TAG
          </span>
          <span
            className="text-[9px] text-indigo-200 font-mono hidden sm:inline"
            style={{ fontSize: `${Math.max(6, 7 * scale)}px` }}
          >
            (Pending Sample Layout)
          </span>
        </div>
        {item.locator && (
          <div
            className="font-mono font-bold bg-indigo-950 text-indigo-100 px-1.5 py-0.5 rounded-xs"
            style={{ fontSize: `${Math.max(8, config.fontSizeLocator * 0.85 * scale)}px` }}
          >
            LOC: {item.locator}
          </div>
        )}
      </div>

      {/* Body: Description, SKU, UPC */}
      <div className="px-2.5 py-1.5 flex-1 flex flex-col justify-between">
        <div>
          <div
            className="font-black text-zinc-950 leading-snug line-clamp-2 uppercase tracking-tight"
            style={{ fontSize: `${Math.max(9, config.fontSizeTitle * scale)}px` }}
            title={item.description}
          >
            {item.description || 'UNTITLED ITEM'}
          </div>

          <div
            className="mt-1 grid grid-cols-2 gap-1 text-zinc-700 border-t border-zinc-200 pt-1"
            style={{ fontSize: `${Math.max(7.5, config.fontSizeSku * scale)}px` }}
          >
            <div>
              <span className="text-zinc-500 font-medium">SKU: </span>
              <span className="font-mono font-bold text-zinc-900">{item.sku || 'N/A'}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 font-medium">UPC: </span>
              <span className="font-mono font-bold text-zinc-900">{item.upcNo || item.barcode || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Barcode */}
        <div className="mt-1 pt-1 border-t border-zinc-200 flex flex-col items-center justify-center">
          <div
            className="w-full flex items-center justify-center overflow-hidden"
            style={{ minHeight: `${config.barcodeHeightMm * scale * 0.85}mm` }}
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

          {/* Printable Document Branding Footer */}
          <div
            className="w-full text-center font-sans font-medium text-zinc-900 select-none pointer-events-none pt-0.5 tracking-tight leading-none"
            style={{
              opacity: 0.3,
              fontSize: `${Math.max(5, 5.5 * scale)}px`,
            }}
          >
            Powered by: DECStudioHub
          </div>
        </div>
      </div>
    </div>
  );
};
