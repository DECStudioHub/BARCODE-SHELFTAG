import { jsPDF } from 'jspdf';
import { InventoryItem, Module2LayoutConfig } from '../types';
import { generateBarcodeDataUrl } from './barcode';

export interface Module2PdfProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

export async function generateModule2Pdf(
  items: { item: InventoryItem; copies: number }[],
  config: Module2LayoutConfig,
  onProgress?: (progress: Module2PdfProgress) => void
): Promise<jsPDF> {
  // Expand items based on copies
  const expandedItems: InventoryItem[] = [];
  for (const entry of items) {
    const count = Math.max(1, entry.copies || 1);
    for (let c = 0; c < count; c++) {
      expandedItems.push(entry.item);
    }
  }

  if (expandedItems.length === 0) {
    throw new Error('No items selected for printing. Please select at least one item.');
  }

  // Page dimensions
  let pageWidth = 210;
  let pageHeight = 297;

  if (config.paperSize === 'LETTER') {
    pageWidth = 215.9;
    pageHeight = 279.4;
  } else if (config.paperSize === 'CUSTOM') {
    pageWidth = Math.max(50, Number(config.customWidthMm) || 210);
    pageHeight = Math.max(50, Number(config.customHeightMm) || 297);
  }

  if (config.orientation === 'landscape') {
    const temp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = temp;
  }

  const doc = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const marginLeft = Math.max(0, Number(config.marginLeftMm) || 0);
  const marginRight = Math.max(0, Number(config.marginRightMm) || 0);
  const marginTop = Math.max(0, Number(config.marginTopMm) || 0);
  const marginBottom = Math.max(0, Number(config.marginBottomMm) || 0);

  const usableWidth = pageWidth - marginLeft - marginRight;
  const usableHeight = pageHeight - marginTop - marginBottom;

  const tagWidth = Math.max(20, Number(config.tagWidthMm) || 64);
  const tagHeight = Math.max(20, Number(config.tagHeightMm) || 40);
  const gapCol = Math.max(0, Number(config.gapColMm) || 0);
  const gapRow = Math.max(0, Number(config.gapRowMm) || 0);

  const columns = Math.max(1, Number(config.columns) || 1);
  const rows = Math.max(1, Math.floor((usableHeight + gapRow) / (tagHeight + gapRow)));

  const tagsPerPage = columns * rows;
  const totalPages = Math.ceil(expandedItems.length / tagsPerPage);

  // Cache barcode images for performance
  const barcodeCache = new Map<string, string | null>();
  const getBarcode = (val: string): string | null => {
    if (!val) return null;
    if (barcodeCache.has(val)) return barcodeCache.get(val)!;
    const url = generateBarcodeDataUrl(val, config.barcodeType, 40);
    barcodeCache.set(val, url);
    return url;
  };

  const isShelfTag = config.tagType === 'shelftag';

  for (let i = 0; i < expandedItems.length; i++) {
    const item = expandedItems[i];
    const pageIndex = Math.floor(i / tagsPerPage);
    const indexOnPage = i % tagsPerPage;

    if (i > 0 && indexOnPage === 0) {
      doc.addPage([pageWidth, pageHeight], config.orientation);
    }

    if (onProgress && indexOnPage === 0) {
      onProgress({
        currentPage: pageIndex + 1,
        totalPages,
        percent: Math.round(((pageIndex + 1) / totalPages) * 100),
      });
    }

    const col = indexOnPage % columns;
    const row = Math.floor(indexOnPage / columns);

    const x = marginLeft + col * (tagWidth + gapCol);
    const y = marginTop + row * (tagHeight + gapRow);

    // 1. Tag Background & Border
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, tagWidth, tagHeight, 'F');

    if (config.showBorder) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.rect(x, y, tagWidth, tagHeight, 'S');
    }

    // Cut Guides
    if (config.showCutGuides) {
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      const markLen = 2.5;
      // Top-left
      doc.line(x - 0.5, y, x - 0.5 - markLen, y);
      doc.line(x, y - 0.5, x, y - 0.5 - markLen);
      // Top-right
      doc.line(x + tagWidth + 0.5, y, x + tagWidth + 0.5 + markLen, y);
      doc.line(x + tagWidth, y - 0.5, x + tagWidth, y - 0.5 - markLen);
      // Bottom-left
      doc.line(x - 0.5, y + tagHeight, x - 0.5 - markLen, y + tagHeight);
      doc.line(x, y + tagHeight + 0.5, x, y + tagHeight + 0.5 + markLen);
      // Bottom-right
      doc.line(x + tagWidth + 0.5, y + tagHeight, x + tagWidth + 0.5 + markLen, y + tagHeight);
      doc.line(x + tagWidth, y + tagHeight + 0.5, x + tagWidth, y + tagHeight + 0.5 + markLen);
    }

    // 2. Header Bar
    const headerHeight = Math.min(8, tagHeight * 0.22);
    if (isShelfTag) {
      doc.setFillColor(30, 30, 30);
    } else {
      doc.setFillColor(49, 46, 129); // Indigo 900
    }
    doc.rect(x, y, tagWidth, headerHeight, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isShelfTag ? 8 : 8.5);
    const tagLabel = isShelfTag ? 'SHELF TAG' : 'PP TAG';
    doc.text(tagLabel, x + 2, y + headerHeight * 0.7);

    // Locator
    if (item.locator) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.text(`LOC: ${item.locator}`, x + tagWidth - 2, y + headerHeight * 0.7, { align: 'right' });
    }

    // 3. Item Description
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.min(9, config.fontSizeTitle * 0.8));
    const descText = (item.description || 'UNTITLED ITEM').toUpperCase();
    const splitDesc = doc.splitTextToSize(descText, tagWidth - 4);
    const descY = y + headerHeight + 3.5;
    doc.text(splitDesc.slice(0, 2), x + 2, descY);

    // 4. SKU & UPC
    const infoY = descY + (splitDesc.length > 1 ? 5.5 : 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`SKU: ${item.sku || 'N/A'}`, x + 2, infoY);
    doc.text(`UPC: ${item.upcNo || item.barcode || 'N/A'}`, x + tagWidth - 2, infoY, { align: 'right' });

    // 5. Barcode
    const barcodeCode = item.barcode || item.upcNo || item.sku;
    const barcodeData = barcodeCode ? getBarcode(barcodeCode) : null;
    if (barcodeData) {
      const barcodeW = tagWidth - 6;
      const barcodeH = Math.min(config.barcodeHeightMm, tagHeight - (infoY - y) - 3);
      const barcodeX = x + 3;
      const barcodeY = y + tagHeight - barcodeH - 1.5;

      try {
        doc.addImage(barcodeData, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);
      } catch {
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`* ${barcodeCode} *`, x + tagWidth / 2, y + tagHeight - 2, { align: 'center' });
      }
    }
  }

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      percent: 100,
    });
  }

  return doc;
}
