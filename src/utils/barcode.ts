import JsBarcode from 'jsbarcode';
import { BarcodeType } from '../types';

export function getJsBarcodeFormat(type: BarcodeType): string {
  switch (type) {
    case 'CODE39':
      return 'CODE39';
    case 'EAN13':
      return 'EAN13';
    case 'UPCA':
      return 'UPC';
    case 'CODE128':
    default:
      return 'CODE128';
  }
}

/**
 * Generate SVG string for barcode
 */
export function generateBarcodeSvgString(
  value: string,
  type: BarcodeType = 'CODE128',
  height: number = 38,
  displayValue: boolean = true,
  fontSize: number = 12
): string {
  if (!value || typeof document === 'undefined') {
    return '';
  }

  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const format = getJsBarcodeFormat(type);

  try {
    JsBarcode(svgNode, String(value).trim(), {
      format: format,
      lineColor: '#000000',
      width: 1.8,
      height: height,
      displayValue: displayValue,
      fontSize: fontSize,
      font: 'monospace',
      margin: 2,
      textMargin: 2,
      valid: () => true,
    });

    // Subtle adjustment: slightly move human-readable barcode text toward center of barcode
    const textElem = svgNode.querySelector ? svgNode.querySelector('text') : null;
    if (textElem) {
      const currentX = parseFloat(textElem.getAttribute('x') || '0');
      if (currentX > 0) {
        const subtleShift = Math.max(4, Math.round(fontSize * 0.65));
        textElem.setAttribute('x', String(Math.round((currentX - subtleShift) * 10) / 10));
      }
    }

    return svgNode.outerHTML;
  } catch (err) {
    // If specific format fails (e.g. invalid checksum for EAN13), fallback to CODE128
    try {
      JsBarcode(svgNode, String(value).trim(), {
        format: 'CODE128',
        lineColor: '#000000',
        width: 1.8,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        font: 'monospace',
        margin: 2,
        textMargin: 2,
      });

      // Subtle adjustment: slightly move human-readable barcode text toward center of barcode
      const fallbackTextElem = svgNode.querySelector ? svgNode.querySelector('text') : null;
      if (fallbackTextElem) {
        const currentX = parseFloat(fallbackTextElem.getAttribute('x') || '0');
        if (currentX > 0) {
          const subtleShift = Math.max(4, Math.round(fontSize * 0.65));
          fallbackTextElem.setAttribute('x', String(Math.round((currentX - subtleShift) * 10) / 10));
        }
      }

      return svgNode.outerHTML;
    } catch {
      // Fallback SVG representation
      return `<svg width="100%" height="${height + 15}" viewBox="0 0 200 ${height + 15}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="10" font-family="monospace" fill="#ef4444">INVALID BARCODE</text>
        <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-size="11" font-family="monospace" fill="#334155">${value}</text>
      </svg>`;
    }
  }
}

/**
 * Generate barcode as data URL for PDF insertion
 */
export function generateBarcodeDataUrl(
  value: string,
  type: BarcodeType = 'CODE128',
  height: number = 40
): string | null {
  if (!value || typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const format = getJsBarcodeFormat(type);

  try {
    JsBarcode(canvas, String(value).trim(), {
      format: format,
      lineColor: '#000000',
      width: 2,
      height: height,
      displayValue: true,
      fontSize: 12,
      font: 'monospace',
      margin: 4,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch {
    try {
      JsBarcode(canvas, String(value).trim(), {
        format: 'CODE128',
        lineColor: '#000000',
        width: 2,
        height: height,
        displayValue: true,
        fontSize: 12,
        font: 'monospace',
        margin: 4,
        background: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }
}
