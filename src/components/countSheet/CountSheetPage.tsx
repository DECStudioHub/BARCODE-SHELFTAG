import React, { useMemo } from 'react';
import { CountSheetConfig, CountSheetPageData, InventorySession } from '../../types';
import { generateBarcodeSvgString } from '../../utils/barcode';
import { getCountSheetPaperDimensions } from '../../utils/countSheetLayoutEngine';

interface CountSheetPageProps {
  pageData: CountSheetPageData;
  config: CountSheetConfig;
  session?: InventorySession;
  scale?: number;
  isPrint?: boolean;
}

export const CountSheetPage: React.FC<CountSheetPageProps> = ({
  pageData,
  config,
  session,
  scale = 1,
  isPrint = false,
}) => {
  const paperDims = useMemo(() => {
    return getCountSheetPaperDimensions(
      config.paperSize,
      config.customWidthMm,
      config.customHeightMm,
      config.orientation
    );
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Generate upper-right locator barcode SVG
  const locatorBarcodeSvg = useMemo(() => {
    if (!config.showLocatorBarcode || !pageData.locator || pageData.locator === 'UNASSIGNED') {
      return '';
    }
    const cleanLocator = String(pageData.locator).trim();
    return generateBarcodeSvgString(
      cleanLocator,
      config.locatorBarcodeFormat || 'CODE128',
      Math.max(18, Math.round(config.locatorBarcodeHeightMm * 2.8 * scale)),
      config.showLocatorBarcodeText !== false,
      Math.max(7, Math.round(8 * scale))
    );
  }, [
    config.showLocatorBarcode,
    config.locatorBarcodeFormat,
    config.locatorBarcodeHeightMm,
    config.showLocatorBarcodeText,
    pageData.locator,
    scale,
  ]);

  // Compute number of rows to render
  const totalRows = config.rowsPerPage || 20;
  const items = pageData.items || [];
  const emptyRowsCount = config.emptyRowsToFillPage !== false
    ? Math.max(0, totalRows - items.length)
    : 0;

  // Font family mapping
  const getFontFamily = (family: string) => {
    switch (family) {
      case 'monospace':
      case 'courier':
        return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      case 'serif':
      case 'times':
        return 'Georgia, Cambria, "Times New Roman", Times, serif';
      default:
        return 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  const headerFont = getFontFamily(config.headerFontFamily);
  const bodyFont = getFontFamily(config.bodyFontFamily);

  // Column widths
  const colWidths = config.columnWidths || {
    skuMm: 28,
    barcodeMm: 42,
    descMm: 88,
    countMm: 34,
  };

  return (
    <div
      className={`bg-white text-zinc-950 box-border relative flex flex-col justify-between ${
        isPrint
          ? 'print-page break-after-page'
          : 'shadow-md rounded-xs border border-zinc-200'
      }`}
      style={{
        width: `${paperDims.widthMm * scale}mm`,
        height: `${paperDims.heightMm * scale}mm`,
        minWidth: `${paperDims.widthMm * scale}mm`,
        minHeight: `${paperDims.heightMm * scale}mm`,
        maxWidth: `${paperDims.widthMm * scale}mm`,
        maxHeight: `${paperDims.heightMm * scale}mm`,
        paddingTop: `${config.marginTopMm * scale}mm`,
        paddingBottom: `${config.marginBottomMm * scale}mm`,
        paddingLeft: `${config.marginLeftMm * scale}mm`,
        paddingRight: `${config.marginRightMm * scale}mm`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="w-full flex items-start justify-between border-b-2 border-zinc-950 pb-2 mb-2">
        {/* Left / Center: Count Sheet Titles & Session Info */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h1
              className="font-black tracking-tight uppercase leading-tight text-zinc-950"
              style={{
                fontFamily: headerFont,
                fontSize: `${Math.max(14, (config.headerFontSizePt + 6) * scale)}pt`,
              }}
            >
              COUNT SHEET
            </h1>
            <span
              className="inline-block px-2 py-0.5 border border-zinc-900 font-extrabold text-[9px] uppercase tracking-wider bg-zinc-100 rounded-xs"
              style={{ fontFamily: bodyFont }}
            >
              PHYSICAL INVENTORY
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-zinc-700 mt-1 font-medium"
            style={{
              fontFamily: bodyFont,
              fontSize: `${Math.max(7, config.bodyFontSizePt * scale)}pt`,
            }}
          >
            {session?.store && (
              <div>
                <span className="font-bold text-zinc-900">STORE: </span>
                {session.store}
              </div>
            )}
            {session?.branch && (
              <div>
                <span className="font-bold text-zinc-900">BRANCH: </span>
                {session.branch}
              </div>
            )}
            {session?.inventoryDate && (
              <div>
                <span className="font-bold text-zinc-900">DATE: </span>
                {session.inventoryDate}
              </div>
            )}
            {session?.preparedBy && (
              <div>
                <span className="font-bold text-zinc-900">PREPARED BY: </span>
                {session.preparedBy}
              </div>
            )}
          </div>
        </div>

        {/* UPPER RIGHT: LOCATOR IDENTIFICATION & LOCATOR BARCODE */}
        <div className="shrink-0 flex flex-col items-end text-right pl-3 border-l border-zinc-300">
          <div className="flex items-center gap-1.5 justify-end">
            <span
              className="font-bold text-zinc-500 uppercase tracking-wider"
              style={{ fontSize: `${Math.max(7, 8 * scale)}pt` }}
            >
              LOCATOR:
            </span>
            <span
              className="font-black font-mono text-zinc-950 px-2 py-0.5 border-2 border-zinc-950 bg-zinc-50 rounded-xs tracking-wider"
              style={{
                fontSize: `${Math.max(11, 13 * scale)}pt`,
                fontFamily: 'monospace',
              }}
            >
              {pageData.locator || 'UNASSIGNED'}
            </span>
          </div>

          {/* Scannable Locator Barcode */}
          {locatorBarcodeSvg && (
            <div
              className="mt-1 flex flex-col items-end overflow-hidden max-w-[55mm]"
              title={`Locator Barcode: ${pageData.locator}`}
              dangerouslySetInnerHTML={{ __html: locatorBarcodeSvg }}
            />
          )}

          {/* Page Info under locator */}
          <div
            className="text-[9px] font-bold text-zinc-600 mt-1"
            style={{ fontFamily: bodyFont }}
          >
            PAGE {pageData.pageNumber} OF {pageData.totalPagesForLocator}
            {pageData.totalGlobalPages > pageData.totalPagesForLocator && (
              <span className="text-zinc-400 ml-1">
                (SHEET {pageData.globalPageIndex}/{pageData.totalGlobalPages})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. TABLE CONTAINER */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        <table
          className="w-full border-collapse border border-zinc-950 text-left"
          style={{
            borderWidth: `${config.borderWidthPx}px`,
            fontFamily: bodyFont,
          }}
        >
          {/* Table Header: SKU | BARCODE | DESCRIPTION | COUNT */}
          <thead>
            <tr className="bg-zinc-100 border-b-2 border-zinc-950">
              {config.showRowNumbers && (
                <th
                  className="border-r border-zinc-400 px-1 py-1 text-center font-extrabold uppercase text-zinc-700"
                  style={{
                    width: `${6 * scale}mm`,
                    fontSize: `${Math.max(7, (config.headerFontSizePt - 1.5) * scale)}pt`,
                  }}
                >
                  #
                </th>
              )}

              <th
                className="border-r border-zinc-400 px-2 py-1 font-black uppercase text-zinc-950 tracking-wider"
                style={{
                  width: `${colWidths.skuMm * scale}mm`,
                  fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                }}
              >
                SKU
              </th>

              <th
                className="border-r border-zinc-400 px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center"
                style={{
                  width: `${colWidths.barcodeMm * scale}mm`,
                  fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                }}
              >
                BARCODE
              </th>

              <th
                className="border-r border-zinc-400 px-2 py-1 font-black uppercase text-zinc-950 tracking-wider"
                style={{
                  width: `${colWidths.descMm * scale}mm`,
                  fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                }}
              >
                DESCRIPTION
              </th>

              {/* COUNT COLUMN: MANDATED FOR MANUAL HANDWRITING */}
              <th
                className="px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center bg-zinc-200/60"
                style={{
                  width: `${colWidths.countMm * scale}mm`,
                  fontSize: `${Math.max(8, (config.countHeaderFontSizePt || 9) * scale)}pt`,
                }}
              >
                COUNT
              </th>
            </tr>
          </thead>

          {/* Table Body: Exact item rows + empty rows to reach rowsPerPage */}
          <tbody>
            {items.map((item, idx) => {
              const rowNum = pageData.startIndex + idx + 1;
              const codeVal = String(item.barcode || item.upcNo || item.sku || '').trim();

              const barcodeSvg =
                config.showBarcodeGraphic && codeVal
                  ? generateBarcodeSvgString(
                      codeVal,
                      config.barcodeFormat || 'CODE128',
                      Math.max(14, Math.round(config.barcodeHeightMm * 2.8 * scale)),
                      config.showBarcodeValueText !== false,
                      Math.max(6, Math.round((config.barcodeTextFontSizePt || 7) * scale))
                    )
                  : '';

              return (
                <tr
                  key={item.id || `row-${idx}`}
                  className="border-b border-zinc-300 hover:bg-zinc-50 transition-colors"
                  style={{
                    height: `${config.rowHeightMm * scale}mm`,
                    maxHeight: `${config.rowHeightMm * scale}mm`,
                  }}
                >
                  {/* Row Number */}
                  {config.showRowNumbers && (
                    <td
                      className="border-r border-zinc-300 px-1 text-center font-mono font-bold text-zinc-500 text-[9px]"
                      style={{ height: `${config.rowHeightMm * scale}mm` }}
                    >
                      {rowNum}
                    </td>
                  )}

                  {/* SKU */}
                  <td
                    className="border-r border-zinc-300 px-2 font-mono font-bold text-zinc-950 truncate"
                    style={{
                      width: `${colWidths.skuMm * scale}mm`,
                      fontSize: `${Math.max(7, config.skuFontSizePt * scale)}pt`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  >
                    {item.sku || '-'}
                  </td>

                  {/* BARCODE (Graphic + Text or Text Only) */}
                  <td
                    className="border-r border-zinc-300 px-1 py-0.5 overflow-hidden text-center"
                    style={{
                      width: `${colWidths.barcodeMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  >
                    {barcodeSvg ? (
                      <div
                        className="w-full flex flex-col items-center justify-center overflow-hidden max-h-full"
                        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                      />
                    ) : (
                      <span
                        className="font-mono font-semibold text-zinc-900 tracking-wider"
                        style={{
                          fontSize: `${Math.max(7, config.barcodeTextFontSizePt * scale)}pt`,
                        }}
                      >
                        {codeVal || '-'}
                      </span>
                    )}
                  </td>

                  {/* DESCRIPTION */}
                  <td
                    className="border-r border-zinc-300 px-2 py-0.5 text-zinc-900 font-medium leading-tight"
                    style={{
                      width: `${colWidths.descMm * scale}mm`,
                      fontSize: `${Math.max(7, config.descFontSizePt * scale)}pt`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  >
                    <div
                      className="overflow-hidden uppercase font-semibold"
                      style={{
                        display: config.wrapDescription ? '-webkit-box' : 'block',
                        WebkitLineClamp: config.wrapDescription ? config.descMaxLines : 1,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: config.descLineHeight,
                        whiteSpace: config.wrapDescription ? 'normal' : 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.description}
                    >
                      {item.description || '-'}
                    </div>
                  </td>

                  {/* COUNT COLUMN: MUST BE COMPLETELY BLANK FOR MANUAL ENTRY */}
                  <td
                    className="px-2 py-0.5 text-center relative bg-white"
                    style={{
                      width: `${colWidths.countMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  >
                    {/* Empty cell for physical inventory handwriting */}
                    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                      {/* Optional subtle dotted line guideline for neat handwriting */}
                      <span className="w-4/5 border-b border-zinc-200/80 inline-block h-2" />
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Extra Blank Rows to complete the exact rowsPerPage requirement */}
            {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => {
              const rowNum = items.length + emptyIdx + 1;
              return (
                <tr
                  key={`empty-${emptyIdx}`}
                  className="border-b border-zinc-300 bg-white"
                  style={{
                    height: `${config.rowHeightMm * scale}mm`,
                    maxHeight: `${config.rowHeightMm * scale}mm`,
                  }}
                >
                  {config.showRowNumbers && (
                    <td
                      className="border-r border-zinc-300 px-1 text-center font-mono font-bold text-zinc-400 text-[9px]"
                      style={{ height: `${config.rowHeightMm * scale}mm` }}
                    >
                      {rowNum}
                    </td>
                  )}
                  <td
                    className="border-r border-zinc-300 px-2"
                    style={{
                      width: `${colWidths.skuMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  />
                  <td
                    className="border-r border-zinc-300 px-1"
                    style={{
                      width: `${colWidths.barcodeMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  />
                  <td
                    className="border-r border-zinc-300 px-2"
                    style={{
                      width: `${colWidths.descMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  />
                  <td
                    className="px-2 text-center"
                    style={{
                      width: `${colWidths.countMm * scale}mm`,
                      height: `${config.rowHeightMm * scale}mm`,
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                      <span className="w-4/5 border-b border-zinc-200/80 inline-block h-2" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER SIGNATURE & VERIFICATION SECTION */}
      {config.showSignatures && (
        <div className="w-full pt-2 mt-1 border-t border-zinc-400 flex items-center justify-between text-[8px] font-medium text-zinc-700">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">COUNTER:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">SCANNER:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">VALIDATOR:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">DATE & TIME:</span>
              <span className="inline-block w-24 border-b border-zinc-900" />
            </div>
          </div>

          <div className="font-mono text-zinc-500 font-bold">
            LOCATOR: {pageData.locator} | PAGE {pageData.pageNumber}/{pageData.totalPagesForLocator}
          </div>
        </div>
      )}
    </div>
  );
};
