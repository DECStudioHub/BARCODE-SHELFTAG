import { jsPDF } from 'jspdf';
import { Module2Config, ShelfTagItem, TagFieldConfig } from '../types';
import { generateBarcodeDataUrl } from './barcode';
import { YELLOW_PALETTES } from '../components/module2/constants';
import {
  ALL_TAG_FIELDS,
  createDefaultFieldsForShelftag,
  createDefaultFieldsForPPTag,
} from '../components/module2/fieldDefaults';
import { computeShelftagSheetLayout } from './shelftagLayoutEngine';

export interface ShelftagPdfProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

export async function generateShelftagPdf(
  items: ShelfTagItem[],
  config: Module2Config,
  onProgress?: (progress: ShelftagPdfProgress) => void
): Promise<jsPDF> {
  const printItems = items.filter(i => i.isSelected !== false);
  if (printItems.length === 0) {
    throw new Error('No items selected to print. Please select at least one tag.');
  }

  // Use the shared layout calculation engine
  const layout = computeShelftagSheetLayout(config, printItems.length);
  const pageWidth = layout.paperWidthMm;
  const pageHeight = layout.paperHeightMm;
  const orientation = layout.orientation;
  const tagsPerPage = layout.tagsPerSheet;
  const totalPages = layout.totalPages;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const tagWidth = layout.tagWidthMm;
  const tagHeight = layout.tagHeightMm;

  // Active yellow color RGB
  const activePalette = YELLOW_PALETTES.find(p => p.id === config.yellowPalette) || YELLOW_PALETTES[0];
  const yellowHex = activePalette.bgHex;
  const rYellow = parseInt(yellowHex.slice(1, 3), 16) || 254;
  const gYellow = parseInt(yellowHex.slice(3, 5), 16) || 237;
  const bYellow = parseInt(yellowHex.slice(5, 7), 16) || 1;

  // Barcode image cache
  const barcodeCache = new Map<string, string>();
  const getBarcode = (val: string, format?: any, showText?: boolean): string => {
    const key = `${val}_${format}_${showText}`;
    if (barcodeCache.has(key)) return barcodeCache.get(key)!;
    const url = generateBarcodeDataUrl(val, format || config.barcodeFormat, 45);
    if (url) barcodeCache.set(key, url);
    return url;
  };

  const currency = config.currencySymbol || '₱';

  for (let i = 0; i < printItems.length; i++) {
    const item = printItems[i];
    const pageIndex = Math.floor(i / tagsPerPage);
    const indexOnPage = i % tagsPerPage;

    if (i > 0 && indexOnPage === 0) {
      doc.addPage([pageWidth, pageHeight], 'portrait');
    }

    if (onProgress && indexOnPage === 0) {
      onProgress({
        currentPage: pageIndex + 1,
        totalPages,
        percent: Math.round(((pageIndex + 1) / totalPages) * 100),
      });
    }

    const placement = layout.getTagPlacement(indexOnPage);
    const x = placement.xMm;
    const y = placement.yMm;

    const isYellow = item.tagStyle === 'yellow';

    // 1. Tag Background
    if (isYellow) {
      doc.setFillColor(rYellow, gYellow, bYellow);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(x, y, tagWidth, tagHeight, 'F');

    // Tag Border
    if (config.showBorder) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(isYellow ? 0.35 : 0.2);
      doc.rect(x, y, tagWidth, tagHeight, 'S');
    }

    // Cutting Guides
    if (config.showCutGuides) {
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.15);
      const mLen = 2;
      doc.line(x - 0.5, y, x - 0.5 - mLen, y);
      doc.line(x, y - 0.5, x, y - 0.5 - mLen);
      doc.line(x + tagWidth + 0.5, y, x + tagWidth + 0.5 + mLen, y);
      doc.line(x + tagWidth, y - 0.5, x + tagWidth, y - 0.5 - mLen);
      doc.line(x - 0.5, y + tagHeight, x - 0.5 - mLen, y + tagHeight);
      doc.line(x, y + tagHeight + 0.5, x, y + tagHeight + 0.5 + mLen);
      doc.line(x + tagWidth + 0.5, y + tagHeight, x + tagWidth + 0.5 + mLen, y + tagHeight);
      doc.line(x + tagWidth, y + tagHeight + 0.5, x + tagWidth, y + tagHeight + 0.5 + mLen);
    }

    // 2. DYNAMIC FIELD LAYOUT RENDERING ENGINE (Section 22 & 26)
    const activePreset = isYellow
      ? config.ppTagConfig || {
          fields: createDefaultFieldsForPPTag(tagWidth, tagHeight),
          promoHeader: 'SPECIAL BUY',
        }
      : config.shelftagConfig || {
          fields: createDefaultFieldsForShelftag(tagWidth, tagHeight),
        };

    const fields = activePreset.fields;

    // Render Promo Header Banner first if present & visible
    const promoHeaderField = fields?.promoHeader;
    if (isYellow && promoHeaderField && promoHeaderField.visible) {
      const bannerH = promoHeaderField.height || 6;
      doc.setFillColor(227, 27, 35);
      doc.rect(x + promoHeaderField.x, y + promoHeaderField.y, promoHeaderField.width, bannerH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(promoHeaderField.fontSizePt || 8);
      const hText = (item.promoHeader || (activePreset as any).promoHeader || 'SPECIAL BUY').toUpperCase();
      doc.text(hText, x + promoHeaderField.x + 2, y + promoHeaderField.y + bannerH * 0.72);
      doc.text('PROMO TAG', x + promoHeaderField.x + promoHeaderField.width - 2, y + promoHeaderField.y + bannerH * 0.72, { align: 'right' });
    }

    // Render SKU Field
    const skuField = fields?.sku;
    if (skuField && skuField.visible) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', skuField.fontWeight === 'bold' ? 'bold' : 'normal');
      doc.setFontSize(skuField.fontSizePt || 7.5);
      const prefix = skuField.prefixText || 'SKU: ';
      doc.text(`${prefix}${item.sku}`, x + skuField.x, y + skuField.y + skuField.height * 0.75);
    }

    // Render Locator Field
    const locatorField = fields?.locator;
    if (locatorField && locatorField.visible && item.locator) {
      const locX = x + locatorField.x;
      const locY = y + locatorField.y;
      if (locatorField.locatorBadge) {
        if (isYellow) {
          doc.setFillColor(0, 0, 0);
          doc.roundedRect(locX, locY, locatorField.width, locatorField.height, 0.5, 0.5, 'F');
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.2);
          doc.roundedRect(locX, locY, locatorField.width, locatorField.height, 0.5, 0.5, 'S');
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.setFont('courier', 'bold');
      doc.setFontSize(locatorField.fontSizePt || 7);
      doc.text(item.locator, locX + locatorField.width / 2, locY + locatorField.height * 0.72, { align: 'center' });
    }

    // Render Description Field
    const descField = fields?.description;
    if (descField && descField.visible) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', descField.fontWeight === 'bold' ? 'bold' : 'normal');
      doc.setFontSize(descField.fontSizePt || 9);

      let textToPrint = item.description;
      if (descField.textTransform === 'uppercase') textToPrint = textToPrint.toUpperCase();
      else if (descField.textTransform === 'lowercase') textToPrint = textToPrint.toLowerCase();

      const splitDesc = doc.splitTextToSize(textToPrint, descField.width);
      const maxL = descField.maxLines || 2;
      doc.text(splitDesc.slice(0, maxL), x + descField.x, y + descField.y + (descField.fontSizePt * 0.35));
    }

    // Render Barcode Field
    const barcodeField = fields?.barcode;
    if (barcodeField && barcodeField.visible) {
      const codeVal = item.barcode || item.sku;
      const bImg = getBarcode(codeVal, barcodeField.barcodeFormat, barcodeField.showBarcodeText !== false);
      const bX = x + barcodeField.x;
      const bY = y + barcodeField.y;
      const bW = barcodeField.width;
      const bH = barcodeField.height;

      if (bImg) {
        try {
          doc.addImage(bImg, 'PNG', bX, bY, bW, bH);
        } catch {
          doc.setFont('courier', 'normal');
          doc.setFontSize(6);
          doc.text(codeVal, bX, bY + bH);
        }
      }
    }

    // Render Regular Price Field
    const regularField = fields?.regularPrice;
    if (regularField && regularField.visible) {
      const regX = x + regularField.x + regularField.width;
      const regY = y + regularField.y + regularField.height * 0.75;
      const isRed = isYellow || regularField.textColor === '#E31B23';

      if (isRed) {
        doc.setTextColor(227, 27, 35);
      } else {
        doc.setTextColor(0, 0, 0);
      }

      doc.setFont('helvetica', regularField.fontWeight === 'bold' ? 'bold' : 'normal');
      doc.setFontSize(regularField.fontSizePt || 8);

      const symbolStr = regularField.showCurrencySymbol !== false ? (regularField.currencySymbol || currency) : '';
      const prefixStr = regularField.prefixText ? `${regularField.prefixText} ` : '';
      const valStr = regularField.decimalPlaces === 0
        ? Math.round(item.regularPrice || 0).toString()
        : (item.regularPrice ? item.regularPrice.toFixed(2) : '0.00');

      const fullPriceStr = `${prefixStr}${symbolStr}${valStr}`;
      doc.text(fullPriceStr, regX, regY, { align: 'right' });

      // Strike-through line if configured
      if (regularField.strikeThrough) {
        const textW = doc.getTextWidth(fullPriceStr);
        doc.setDrawColor(227, 27, 35);
        doc.setLineWidth(0.25);
        doc.line(regX - textW, regY - 0.7, regX, regY - 0.7);
      }
    }

    // Render Promo Price Field
    const promoField = fields?.promoPrice;
    if (promoField && promoField.visible) {
      const pX = x + promoField.x + promoField.width;
      const pY = y + promoField.y + promoField.height * 0.8;

      doc.setTextColor(227, 27, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(promoField.fontSizePt || 14);

      const symbolStr = promoField.showCurrencySymbol !== false ? `${promoField.currencySymbol || currency} ` : '';
      const val = item.promoPrice != null ? item.promoPrice : item.regularPrice;
      const valStr = promoField.decimalPlaces === 0
        ? Math.round(val || 0).toString()
        : (val ? val.toFixed(2) : '0.00');

      doc.text(`${symbolStr}${valStr}`, pX, pY, { align: 'right' });
    }

    // Render Price Unit Field
    const unitField = fields?.priceUnit;
    if (unitField && unitField.visible) {
      const uX = x + unitField.x + unitField.width;
      const uY = y + unitField.y + unitField.height * 0.75;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(unitField.fontSizePt || 6.5);
      const unitText = (item.unit || 'PER PC').toUpperCase();
      doc.text(unitText, uX, uY, { align: 'right' });
    }

    // Tag Branding Footer: Powered by: DECStudioHub (30% opacity inside tag boundary)
    try {
      if (typeof (doc as any).GState === 'function') {
        (doc as any).saveGraphicsState();
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.3 }));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.5);
        doc.setTextColor(0, 0, 0);
        doc.text('Powered by: DECStudioHub', x + tagWidth - 1, y + tagHeight - 0.7, { align: 'right' });
        (doc as any).restoreGraphicsState();
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.5);
        doc.setTextColor(179, 179, 179);
        doc.text('Powered by: DECStudioHub', x + tagWidth - 1, y + tagHeight - 0.7, { align: 'right' });
      }
    } catch {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(179, 179, 179);
      doc.text('Powered by: DECStudioHub', x + tagWidth - 1, y + tagHeight - 0.7, { align: 'right' });
    }
  }

  return doc;
}
