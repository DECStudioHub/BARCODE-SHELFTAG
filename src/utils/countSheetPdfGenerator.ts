import { jsPDF } from 'jspdf';
import {
  CountSheetColumnId,
  CountSheetConfig,
  CountSheetPageData,
  InventoryItem,
  InventorySession,
} from '../types';
import {
  getCountSheetPaperDimensions,
  paginateCountSheetItems,
} from './countSheetLayoutEngine';
import {
  generateBarcodeDataUrl,
  generateLocatorBarcodeDataUrl,
} from './barcode';
import { triggerFileDownload } from './pdfGenerator';

export interface CountSheetPdfProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

/**
 * Generate high-fidelity vector PDF for Count Sheets that matches Preview and Print.
 * Real vector lines, selectable text, crisp 300+ DPI barcodes, and scanner-readable locator barcodes.
 */
export async function generateCountSheetPdf(
  items: InventoryItem[],
  config: CountSheetConfig,
  session: InventorySession,
  selectedLocator: string | string[] = 'ALL',
  onProgress?: (progress: CountSheetPdfProgress) => void
): Promise<jsPDF> {
  const selectedItems = items.filter(it => it.isSelected !== false);
  if (selectedItems.length === 0) {
    throw new Error('No items selected to generate Count Sheet. Please select items first.');
  }

  // Use the EXACT SAME pagination as Preview & Print
  const pages: CountSheetPageData[] = paginateCountSheetItems(
    items,
    config.rowsPerPage || 15,
    selectedLocator,
    config.sortField,
    config.sortOrder
  );

  if (pages.length === 0) {
    throw new Error('No items found for the selected locator.');
  }

  const paperDims = getCountSheetPaperDimensions(
    config.paperSize,
    config.customWidthMm,
    config.customHeightMm,
    config.orientation
  );

  const pageWidth = paperDims.widthMm;
  const pageHeight = paperDims.heightMm;

  const doc = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const marginTop = Math.max(2, Number(config.marginTopMm) || 8);
  const marginBottom = Math.max(2, Number(config.marginBottomMm) || 8);
  const marginLeft = Math.max(2, Number(config.marginLeftMm) || 8);
  const marginRight = Math.max(2, Number(config.marginRightMm) || 8);

  const printableWidth = pageWidth - marginLeft - marginRight;
  const totalRows = Math.max(1, config.rowsPerPage || 15);
  const rowHeight = Math.max(6, Number(config.rowHeightMm) || 12);

  // Active columns in order
  const defaultOrder: CountSheetColumnId[] = ['sku', 'barcode', 'description', 'count'];
  const baseOrder = config.columnOrder && config.columnOrder.length > 0 ? config.columnOrder : defaultOrder;
  const activeColumns: CountSheetColumnId[] = baseOrder.filter(colId => {
    return !config.columnVisibility || config.columnVisibility[colId] !== false;
  });

  // Calculate Column Widths proportionally to fit printableWidth
  const rawColWidths = config.columnWidths || {
    skuMm: 28,
    barcodeMm: 42,
    descMm: 88,
    countMm: 34,
  };

  const rowNumWidth = config.showRowNumbers !== false ? 7 : 0;
  const availableForCols = printableWidth - rowNumWidth;

  const sumRawWidths = activeColumns.reduce((acc, colId) => {
    switch (colId) {
      case 'sku': return acc + (rawColWidths.skuMm || 28);
      case 'barcode': return acc + (rawColWidths.barcodeMm || 42);
      case 'description': return acc + (rawColWidths.descMm || 88);
      case 'count': return acc + (rawColWidths.countMm || 34);
      default: return acc + 25;
    }
  }, 0);

  const scaleFactor = availableForCols / Math.max(1, sumRawWidths);
  const colWidthsMap: Record<string, number> = {};
  activeColumns.forEach(colId => {
    let raw = 25;
    if (colId === 'sku') raw = rawColWidths.skuMm || 28;
    else if (colId === 'barcode') raw = rawColWidths.barcodeMm || 42;
    else if (colId === 'description') raw = rawColWidths.descMm || 88;
    else if (colId === 'count') raw = rawColWidths.countMm || 34;
    colWidthsMap[colId] = Number((raw * scaleFactor).toFixed(2));
  });

  // Table border settings
  const borderEnabled = config.tableBorderEnabled !== false;
  const tableBorderColorHex = config.tableBorderColor || '#27272a';
  // Parse hex to RGB
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };
  const borderColorRgb = hexToRgb(tableBorderColorHex);

  const outerLineWidth = borderEnabled && config.tableOuterBorder !== false
    ? Math.max(0.2, (config.tableBorderWidthPx ?? 1.5) * 0.35)
    : 0;

  const innerHorizLineWidth = borderEnabled && config.tableInnerHorizontalLines !== false
    ? Math.max(0.15, (config.tableHorizontalLineWidthPx ?? 1) * 0.3)
    : 0;

  const innerVertLineWidth = borderEnabled && config.tableInnerVerticalLines !== false
    ? Math.max(0.15, (config.tableVerticalLineWidthPx ?? 1) * 0.3)
    : 0;

  const headerBottomLineWidth = borderEnabled && config.tableHeaderBorder !== false
    ? Math.max(0.25, (config.tableHeaderBorderWidthPx ?? 2) * 0.4)
    : 0;

  // Pre-generate barcodes for items to speed up rendering
  const barcodeCache = new Map<string, string | null>();
  const locatorBarcodeCache = new Map<string, string | null>();

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage([pageWidth, pageHeight], config.orientation);
    }

    if (onProgress) {
      onProgress({
        currentPage: pageIdx + 1,
        totalPages: pages.length,
        percent: Math.round(((pageIdx + 1) / pages.length) * 100),
      });
    }

    const pageData = pages[pageIdx];
    let currentY = marginTop;

    // ==========================================
    // 1. TOP HEADER SECTION
    // ==========================================
    const headerTopY = currentY;

    // Title: COUNT SHEET
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('COUNT SHEET', marginLeft, headerTopY + 5);

    // Badge: PHYSICAL INVENTORY
    const titleWidth = doc.getTextWidth('COUNT SHEET');
    const badgeX = marginLeft + titleWidth + 3;
    doc.setDrawColor(24, 24, 27);
    doc.setLineWidth(0.3);
    doc.setFillColor(244, 244, 245);
    doc.rect(badgeX, headerTopY + 1, 36, 4.5, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text('PHYSICAL INVENTORY', badgeX + 2, headerTopY + 4.2);

    // Session Meta Line
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let metaX = marginLeft;
    const metaY = headerTopY + 9.5;

    if (session.store) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('STORE: ', metaX, metaY);
      metaX += doc.getTextWidth('STORE: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(session.store + '   ', metaX, metaY);
      metaX += doc.getTextWidth(session.store + '   ');
    }

    if (session.branch) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('BRANCH: ', metaX, metaY);
      metaX += doc.getTextWidth('BRANCH: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(session.branch + '   ', metaX, metaY);
      metaX += doc.getTextWidth(session.branch + '   ');
    }

    if (session.inventoryDate) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('DATE: ', metaX, metaY);
      metaX += doc.getTextWidth('DATE: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(session.inventoryDate + '   ', metaX, metaY);
      metaX += doc.getTextWidth(session.inventoryDate + '   ');
    }

    if (session.preparedBy) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PREPARED: ', metaX, metaY);
      metaX += doc.getTextWidth('PREPARED: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(session.preparedBy, metaX, metaY);
    }

    // Upper-Right: LOCATOR & SCANNER-READABLE BARCODE
    const rightColWidth = 52;
    const rightColX = marginLeft + printableWidth - rightColWidth;

    // Locator text box
    const cleanLocator = String(pageData.locator || 'UNASSIGNED').trim();
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('LOCATOR:', rightColX, headerTopY + 3.5);

    const locLabelWidth = doc.getTextWidth('LOCATOR: ');
    const locBoxX = rightColX + locLabelWidth;
    const locBoxWidth = rightColWidth - locLabelWidth;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.setFillColor(248, 250, 252);
    doc.rect(locBoxX, headerTopY, locBoxWidth, 5, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanLocator, locBoxX + locBoxWidth / 2, headerTopY + 3.7, { align: 'center' });

    // Locator Barcode
    let headerHeightUsed = 13;
    if (config.showLocatorBarcode !== false && cleanLocator && cleanLocator !== 'UNASSIGNED') {
      let locDataUrl = locatorBarcodeCache.get(cleanLocator);
      if (locDataUrl === undefined) {
        locDataUrl = generateLocatorBarcodeDataUrl(
          cleanLocator,
          config.locatorBarcodeFormat || 'CODE128',
          44,
          config.locatorBarcodeWidthScale || 1.5,
          config.showLocatorBarcodeText !== false,
          config.locatorBarcodeTextSizePt || 8
        );
        locatorBarcodeCache.set(cleanLocator, locDataUrl);
      }

      if (locDataUrl) {
        const locBcH = Math.min(10, Math.max(7, config.locatorBarcodeHeightMm || 9));
        const locBcW = Math.min(rightColWidth, 48);
        const locBcX = marginLeft + printableWidth - locBcW;
        try {
          doc.addImage(locDataUrl, 'PNG', locBcX, headerTopY + 5.5, locBcW, locBcH);
          headerHeightUsed = Math.max(headerHeightUsed, 6 + locBcH + 4);
        } catch (e) {
          console.warn('Failed to embed locator barcode in PDF:', e);
        }
      }
    }

    // Page count indicator (e.g. PAGE 1 OF 2 (SHEET 1/4))
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    let pageStr = `PAGE ${pageData.pageNumber} OF ${pageData.totalPagesForLocator}`;
    if (pageData.totalGlobalPages > pageData.totalPagesForLocator) {
      pageStr += ` (SHEET ${pageData.globalPageIndex}/${pageData.totalGlobalPages})`;
    }
    doc.text(pageStr, marginLeft + printableWidth, headerTopY + headerHeightUsed - 0.5, { align: 'right' });

    // Header bottom line
    currentY = headerTopY + headerHeightUsed + 1;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY, marginLeft + printableWidth, currentY);
    currentY += 1.5;

    // ==========================================
    // 2. TABLE HEADER
    // ==========================================
    const tableStartY = currentY;
    const headerRowHeight = 6.5;

    // Header Background fill
    doc.setFillColor(241, 245, 249);
    doc.rect(marginLeft, tableStartY, printableWidth, headerRowHeight, 'F');

    // Header Text & Vertical Lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(7, Number(config.headerFontSizePt) || 8.5));
    doc.setTextColor(15, 23, 42);

    let curColX = marginLeft;

    // Optional Row Numbers Header
    if (config.showRowNumbers !== false) {
      doc.text('#', curColX + rowNumWidth / 2, tableStartY + 4.5, { align: 'center' });
      if (innerVertLineWidth > 0) {
        doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
        doc.setLineWidth(innerVertLineWidth);
        doc.line(curColX + rowNumWidth, tableStartY, curColX + rowNumWidth, tableStartY + headerRowHeight);
      }
      curColX += rowNumWidth;
    }

    activeColumns.forEach((colId, cIdx) => {
      const colW = colWidthsMap[colId];
      const isLast = cIdx === activeColumns.length - 1;

      let colTitle = 'COLUMN';
      let align: 'left' | 'center' | 'right' = 'left';

      if (colId === 'sku') {
        colTitle = 'SKU';
        align = config.tableHeaderAlign === 'center' ? 'center' : 'left';
      } else if (colId === 'barcode') {
        colTitle = 'BARCODE';
        align = 'center';
      } else if (colId === 'description') {
        colTitle = 'DESCRIPTION';
        align = config.tableHeaderAlign === 'center' ? 'center' : 'left';
      } else if (colId === 'count') {
        colTitle = 'COUNT';
        align = 'center';
      }

      const textX = align === 'center' ? curColX + colW / 2 : curColX + 2;
      doc.text(colTitle, textX, tableStartY + 4.5, { align });

      if (!isLast && innerVertLineWidth > 0) {
        doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
        doc.setLineWidth(innerVertLineWidth);
        doc.line(curColX + colW, tableStartY, curColX + colW, tableStartY + headerRowHeight);
      }

      curColX += colW;
    });

    // Header Bottom Line
    if (headerBottomLineWidth > 0) {
      doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
      doc.setLineWidth(headerBottomLineWidth);
      doc.line(marginLeft, tableStartY + headerRowHeight, marginLeft + printableWidth, tableStartY + headerRowHeight);
    }

    currentY = tableStartY + headerRowHeight;

    // ==========================================
    // 3. TABLE BODY ROWS
    // ==========================================
    const items = pageData.items || [];
    const bodyStartY = currentY;

    for (let rIdx = 0; rIdx < totalRows; rIdx++) {
      const item = items[rIdx];
      const rowY = bodyStartY + (rIdx * rowHeight);
      const rowNum = pageData.startIndex + rIdx + 1;

      let rowColX = marginLeft;

      // Row Number Cell
      if (config.showRowNumbers !== false) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(item ? 100 : 180, item ? 116 : 180, item ? 139 : 180);
        doc.text(String(rowNum), rowColX + rowNumWidth / 2, rowY + (rowHeight / 2) + 1.2, { align: 'center' });

        if (innerVertLineWidth > 0) {
          doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
          doc.setLineWidth(innerVertLineWidth);
          doc.line(rowColX + rowNumWidth, rowY, rowColX + rowNumWidth, rowY + rowHeight);
        }
        rowColX += rowNumWidth;
      }

      // Column Cells
      activeColumns.forEach((colId, cIdx) => {
        const colW = colWidthsMap[colId];
        const isLast = cIdx === activeColumns.length - 1;

        if (item) {
          if (colId === 'sku') {
            doc.setFont('courier', 'bold');
            doc.setFontSize(Math.max(7, Number(config.skuFontSizePt) || 8.5));
            doc.setTextColor(15, 23, 42);
            doc.text(item.sku || '-', rowColX + 2, rowY + (rowHeight / 2) + 1.2);
          } else if (colId === 'barcode') {
            const codeVal = String(item.barcode || item.upcNo || item.sku || '').trim();
            if (config.showBarcodeGraphic && codeVal) {
              let bcDataUrl = barcodeCache.get(codeVal);
              if (bcDataUrl === undefined) {
                bcDataUrl = generateBarcodeDataUrl(codeVal, config.barcodeFormat || 'CODE128', 40);
                barcodeCache.set(codeVal, bcDataUrl);
              }

              if (bcDataUrl) {
                const bcH = Math.min(rowHeight - 2, Math.max(4, (config.barcodeHeightMm || 7.5)));
                const targetW = Number(config.barcodeWidthMm) > 0 ? Number(config.barcodeWidthMm) : 36;
                const bcW = Math.min(colW - 2, Math.max(10, targetW));
                const bcX = rowColX + (colW - bcW) / 2;
                const bcY = rowY + (rowHeight - bcH) / 2;
                try {
                  doc.addImage(bcDataUrl, 'PNG', bcX, bcY, bcW, bcH);
                } catch (e) {
                  // Fallback to text
                  doc.setFont('courier', 'bold');
                  doc.setFontSize(7.5);
                  doc.setTextColor(15, 23, 42);
                  doc.text(codeVal, rowColX + colW / 2, rowY + (rowHeight / 2) + 1.2, { align: 'center' });
                }
              } else {
                doc.setFont('courier', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(15, 23, 42);
                doc.text(codeVal, rowColX + colW / 2, rowY + (rowHeight / 2) + 1.2, { align: 'center' });
              }
            } else if (codeVal) {
              doc.setFont('courier', 'bold');
              doc.setFontSize(7.5);
              doc.setTextColor(15, 23, 42);
              doc.text(codeVal, rowColX + colW / 2, rowY + (rowHeight / 2) + 1.2, { align: 'center' });
            }
          } else if (colId === 'description') {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(Math.max(6.5, Number(config.descFontSizePt) || 8));
            doc.setTextColor(15, 23, 42);
            const desc = (item.description || '-').toUpperCase();
            const lines = doc.splitTextToSize(desc, colW - 4);
            if (lines.length === 1) {
              doc.text(lines[0], rowColX + 2, rowY + (rowHeight / 2) + 1.2);
            } else {
              doc.text(lines.slice(0, 2), rowColX + 2, rowY + (rowHeight / 2) - 0.5);
            }
          } else if (colId === 'count') {
            // Handwriting blank field with subtle line
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.setLineWidth(0.2);
            const lineW = colW * 0.75;
            const lineX = rowColX + (colW - lineW) / 2;
            doc.line(lineX, rowY + rowHeight - 2.5, lineX + lineW, rowY + rowHeight - 2.5);
          }
        } else {
          // Empty row
          if (colId === 'count') {
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.2);
            const lineW = colW * 0.75;
            const lineX = rowColX + (colW - lineW) / 2;
            doc.line(lineX, rowY + rowHeight - 2.5, lineX + lineW, rowY + rowHeight - 2.5);
          }
        }

        // Inner Vertical Column Line
        if (!isLast && innerVertLineWidth > 0) {
          doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
          doc.setLineWidth(innerVertLineWidth);
          doc.line(rowColX + colW, rowY, rowColX + colW, rowY + rowHeight);
        }

        rowColX += colW;
      });

      // Inner Horizontal Row Line
      if (innerHorizLineWidth > 0 && rIdx < totalRows - 1) {
        doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
        doc.setLineWidth(innerHorizLineWidth);
        doc.line(marginLeft, rowY + rowHeight, marginLeft + printableWidth, rowY + rowHeight);
      }
    }

    const tableHeight = totalRows * rowHeight;
    const tableTotalHeight = headerRowHeight + tableHeight;

    // Outer Table Border Rect
    if (outerLineWidth > 0) {
      doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
      doc.setLineWidth(outerLineWidth);
      doc.rect(marginLeft, tableStartY, printableWidth, tableTotalHeight);
    }

    currentY = tableStartY + tableTotalHeight;

    // ==========================================
    // 4. FOOTER SIGNATURE SECTION
    // ==========================================
    if (config.showSignatures !== false) {
      const footerY = currentY + 3;
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, footerY, marginLeft + printableWidth, footerY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);

      let sigX = marginLeft;
      const sigLabels = ['COUNTER:', 'SCANNER:', 'VALIDATOR:', 'DATE & TIME:'];
      sigLabels.forEach(label => {
        doc.text(label, sigX, footerY + 3.5);
        const lW = doc.getTextWidth(label + ' ');
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.25);
        doc.line(sigX + lW, footerY + 3.5, sigX + lW + 20, footerY + 3.5);
        sigX += lW + 25;
      });

      // Locator footer note
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const footNote = `LOCATOR: ${pageData.locator} | PAGE ${pageData.pageNumber}/${pageData.totalPagesForLocator}`;
      doc.text(footNote, marginLeft + printableWidth, footerY + 3.5, { align: 'right' });
    }

    // ==========================================
    // 5. BRANDING FOOTER: Powered by: DECStudioHub (30% opacity)
    // ==========================================
    const brandingY = pageHeight - Math.max(2.5, marginBottom / 2);
    try {
      if (typeof (doc as any).GState === 'function') {
        (doc as any).saveGraphicsState();
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.3 }));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 0, 0);
        doc.text('Powered by: DECStudioHub', pageWidth / 2, brandingY, { align: 'center' });
        (doc as any).restoreGraphicsState();
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(179, 179, 179);
        doc.text('Powered by: DECStudioHub', pageWidth / 2, brandingY, { align: 'center' });
      }
    } catch {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(179, 179, 179);
      doc.text('Powered by: DECStudioHub', pageWidth / 2, brandingY, { align: 'center' });
    }
  }

  return doc;
}

/**
 * Convenience helper to generate and trigger instant PDF file download
 */
export async function downloadCountSheetPdf(
  items: InventoryItem[],
  config: CountSheetConfig,
  session: InventorySession,
  selectedLocator: string | string[] = 'ALL',
  onProgress?: (progress: CountSheetPdfProgress) => void
): Promise<string> {
  const doc = await generateCountSheetPdf(items, config, session, selectedLocator, onProgress);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Filename formatting: CountSheet-YYYY-MM-DD.pdf
  const dateStr = session.inventoryDate && session.inventoryDate.trim() !== ''
    ? session.inventoryDate.replace(/[^0-9a-zA-Z_-]/g, '_')
    : new Date().toISOString().slice(0, 10);

  let locSuffix = '';
  if (Array.isArray(selectedLocator)) {
    if (selectedLocator.length === 1) {
      locSuffix = `_${selectedLocator[0]}`;
    } else if (selectedLocator.length > 1) {
      locSuffix = `_${selectedLocator.length}Locators`;
    }
  } else if (selectedLocator && selectedLocator !== 'ALL') {
    locSuffix = `_${selectedLocator}`;
  }

  const filename = `CountSheet-${dateStr}${locSuffix}.pdf`;

  triggerFileDownload(blobUrl, filename);
  return blobUrl;
}
