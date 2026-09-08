import React, { useMemo } from 'react';
import { Module2Config, ShelfTagItem, TagFieldConfig, TagFieldId } from '../../types';
import { generateBarcodeSvgString } from '../../utils/barcode';
import { YELLOW_PALETTES } from './constants';
import {
  ALL_TAG_FIELDS,
  createDefaultFieldsForShelftag,
  createDefaultFieldsForPPTag,
} from './fieldDefaults';

interface ShelftagCardRendererProps {
  item: ShelfTagItem;
  config: Module2Config;
  scale?: number;
  className?: string;
}

export const ShelftagCardRenderer: React.FC<ShelftagCardRendererProps> = ({
  item,
  config,
  scale = 1,
  className = '',
}) => {
  const isYellow = item.tagStyle === 'yellow';

  // Active preset and field layout
  const layoutPreset = isYellow
    ? config.ppTagConfig || {
        tagWidthMm: config.tagWidthMm,
        tagHeightMm: config.tagHeightMm,
        yellowPalette: config.yellowPalette,
        currencySymbol: config.currencySymbol,
        showBorder: config.showBorder,
        showCutGuides: config.showCutGuides,
        showLogo: config.showLogo,
        fields: createDefaultFieldsForPPTag(config.tagWidthMm, config.tagHeightMm),
      }
    : config.shelftagConfig || {
        tagWidthMm: config.tagWidthMm,
        tagHeightMm: config.tagHeightMm,
        yellowPalette: config.yellowPalette,
        currencySymbol: config.currencySymbol,
        showBorder: config.showBorder,
        showCutGuides: config.showCutGuides,
        showLogo: config.showLogo,
        fields: createDefaultFieldsForShelftag(config.tagWidthMm, config.tagHeightMm),
      };

  const tagWidthMm = layoutPreset.tagWidthMm || config.tagWidthMm;
  const tagHeightMm = layoutPreset.tagHeightMm || config.tagHeightMm;
  const fields = layoutPreset.fields;

  // Background color
  const bgColor = useMemo(() => {
    if (!isYellow) return '#ffffff';
    const palette = YELLOW_PALETTES.find(p => p.id === (layoutPreset.yellowPalette || config.yellowPalette)) || YELLOW_PALETTES[0];
    return palette.bgHex;
  }, [isYellow, layoutPreset.yellowPalette, config.yellowPalette]);

  // Barcode SVG calculation
  const barcodeSvg = useMemo(() => {
    const barcodeField = fields?.barcode;
    const format = barcodeField?.barcodeFormat || config.barcodeFormat || 'CODE128';
    const showText = barcodeField?.showBarcodeText !== false;
    const textSize = barcodeField?.barcodeTextSizePt
      ? Math.max(7, Math.round(barcodeField.barcodeTextSizePt * scale * 1.33))
      : Math.max(8, Math.round(9 * scale));

    const heightPx = Math.max(16, Math.round((barcodeField?.height || 14) * 2.8 * scale));
    const codeVal = item.barcode || item.sku || '00000000';

    return generateBarcodeSvgString(codeVal, format, heightPx, showText, textSize);
  }, [fields?.barcode, config.barcodeFormat, scale, item.barcode, item.sku]);

  // Currency & Prices
  const currency = layoutPreset.currencySymbol || config.currencySymbol || '₱';
  const regularPriceFormatted = item.regularPrice ? item.regularPrice.toFixed(2) : '0.00';
  const promoPriceFormatted = item.promoPrice != null ? item.promoPrice.toFixed(2) : null;

  return (
    <div
      className={`relative select-none overflow-hidden transition-shadow ${className}`}
      style={{
        width: `${tagWidthMm * scale}mm`,
        height: `${tagHeightMm * scale}mm`,
        boxSizing: 'border-box',
        backgroundColor: bgColor,
        border: layoutPreset.showBorder !== false && config.showBorder !== false
          ? isYellow
            ? `${Math.max(1.5, 1.5 * scale)}px solid #000000`
            : `${Math.max(1, 1 * scale)}px solid #18181b`
          : '1px dashed #d4d4d8',
      }}
    >
      {/* Corner Cutting Guides */}
      {(layoutPreset.showCutGuides ?? config.showCutGuides) && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500 pointer-events-none z-30" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500 pointer-events-none z-30" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500 pointer-events-none z-30" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500 pointer-events-none z-30" />
        </>
      )}

      {/* DYNAMIC FIELD-DRIVEN RENDERING ENGINE (Section 26) */}
      {ALL_TAG_FIELDS.map(meta => {
        const field = fields?.[meta.id];
        if (!field || !field.visible) return null;

        const leftMm = field.x * scale;
        const topMm = field.y * scale;
        const widthMm = field.width * scale;
        const heightMm = field.height * scale;

        const pTopMm = field.paddingTopMm * scale;
        const pBottomMm = field.paddingBottomMm * scale;
        const pLeftMm = field.paddingLeftMm * scale;
        const pRightMm = field.paddingRightMm * scale;

        const fontSizePx = Math.max(6, field.fontSizePt * scale * 1.333);

        const fieldStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${leftMm}mm`,
          top: `${topMm}mm`,
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          paddingTop: `${pTopMm}mm`,
          paddingBottom: `${pBottomMm}mm`,
          paddingLeft: `${pLeftMm}mm`,
          paddingRight: `${pRightMm}mm`,
          fontFamily: field.fontFamily || 'Arial, sans-serif',
          fontSize: `${fontSizePx}px`,
          fontWeight: field.fontWeight === 'bold' ? 800 : field.fontWeight === 'medium' ? 600 : 400,
          fontStyle: field.fontStyle || 'normal',
          textDecoration: field.textDecoration || 'none',
          color: field.textColor || (isYellow ? '#000000' : '#18181b'),
          textAlign: field.textAlign || 'left',
          textTransform: field.textTransform === 'none' ? undefined : field.textTransform,
          lineHeight: field.lineHeightPt ? `${field.lineHeightPt * scale * 1.333}px` : 1.15,
          border: field.borderStyle && field.borderStyle !== 'none'
            ? `${Math.max(1, (field.borderWidthPx || 1) * scale)}px ${field.borderStyle} ${field.borderColor || '#000000'}`
            : undefined,
          borderRadius: field.borderRadiusMm ? `${field.borderRadiusMm * scale}mm` : undefined,
          backgroundColor: field.backgroundColor || undefined,
          display: 'flex',
          flexDirection: 'column',
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
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: meta.id === 'promoHeader' ? 5 : 10,
        };

        return (
          <div key={meta.id} style={fieldStyle}>
            {/* 1. DESCRIPTION FIELD */}
            {meta.id === 'description' && (
              <div
                className={`w-full font-black ${
                  field.textWrap ? `line-clamp-${field.maxLines || 2}` : 'truncate'
                }`}
                title={item.description}
              >
                {item.description}
              </div>
            )}

            {/* 2. SKU / CODE FIELD */}
            {meta.id === 'sku' && (
              <div className="w-full truncate font-bold tracking-tight">
                {field.prefixText || 'SKU: '}
                {item.sku}
              </div>
            )}

            {/* 3. LOCATOR FIELD */}
            {meta.id === 'locator' && item.locator && (
              <div
                className={
                  field.locatorBadge
                    ? isYellow
                      ? 'bg-black text-white font-mono font-bold px-1.5 py-0.2 rounded-xs'
                      : 'border border-black font-mono font-bold px-1 rounded-xs'
                    : 'font-mono font-bold'
                }
                style={{
                  fontSize: `${fontSizePx}px`,
                }}
              >
                {item.locator}
              </div>
            )}

            {/* 4. BARCODE FIELD */}
            {meta.id === 'barcode' && (
              <div
                className="w-full h-full flex flex-col justify-end overflow-hidden barcode-container"
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
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
              </div>
            )}

            {/* 5. REGULAR PRICE FIELD */}
            {meta.id === 'regularPrice' && (
              <div className="flex flex-col items-end leading-none">
                {field.prefixText && (
                  <span
                    className="uppercase font-bold tracking-wider opacity-70 mb-0.5"
                    style={{ fontSize: `${Math.max(6, fontSizePx * 0.55)}px` }}
                  >
                    {field.prefixText}
                  </span>
                )}
                <span className={field.strikeThrough ? 'line-through' : ''}>
                  {field.showCurrencySymbol !== false ? `${field.currencySymbol || currency} ` : ''}
                  {field.decimalPlaces === 0
                    ? Math.round(item.regularPrice || 0)
                    : regularPriceFormatted}
                </span>
              </div>
            )}

            {/* 6. PRICE PROMO FIELD */}
            {meta.id === 'promoPrice' && (
              <div className="flex flex-col items-end leading-none">
                {field.prefixText && (
                  <span
                    className="uppercase font-bold tracking-wider opacity-70 mb-0.5"
                    style={{ fontSize: `${Math.max(6, fontSizePx * 0.55)}px` }}
                  >
                    {field.prefixText}
                  </span>
                )}
                <span className="font-black">
                  {field.showCurrencySymbol !== false ? `${field.currencySymbol || currency} ` : ''}
                  {field.decimalPlaces === 0
                    ? Math.round(item.promoPrice != null ? item.promoPrice : item.regularPrice || 0)
                    : promoPriceFormatted || regularPriceFormatted}
                </span>
              </div>
            )}

            {/* 7. PRICE UNIT FIELD */}
            {meta.id === 'priceUnit' && (
              <div className="w-full truncate font-bold uppercase tracking-wider">
                {item.unit ? item.unit.toUpperCase() : 'PER PC'}
              </div>
            )}

            {/* 8. PROMO HEADER BAR (For PP Tag) */}
            {meta.id === 'promoHeader' && (
              <div
                className="w-full h-full flex items-center justify-between px-2 text-white font-black tracking-tight uppercase"
                style={{ backgroundColor: field.backgroundColor || '#E31B23' }}
              >
                <span className="truncate">
                  {item.promoHeader || layoutPreset.promoHeader || 'SPECIAL BUY'}
                </span>
                <span className="text-right shrink-0 opacity-90 text-[9px]">
                  PROMO TAG
                </span>
              </div>
            )}

            {/* 9. STORE LOGO FIELD */}
            {meta.id === 'logo' && (layoutPreset.showLogo !== false && config.showLogo !== false) && (
              <img
                src="/prince-logo.svg"
                alt="Prince"
                className="object-contain max-h-full max-w-full"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
