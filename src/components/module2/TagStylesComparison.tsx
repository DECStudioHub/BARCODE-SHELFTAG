import React from 'react';
import { Module2Config, ShelfTagItem } from '../../types';
import { ShelftagCardRenderer } from './ShelftagCardRenderer';

interface TagStylesComparisonProps {
  config: Module2Config;
  sampleWhiteItem?: ShelfTagItem;
  sampleYellowItem?: ShelfTagItem;
}

const DEFAULT_WHITE_SAMPLE: ShelfTagItem = {
  id: 'sample-white',
  tagStyle: 'white',
  description: 'COCA-COLA ORIGINAL TASTE 1.5L PET BOTTLE',
  sku: 'BEV-1001',
  barcode: '4800016644021',
  regularPrice: 72.0,
  promoPrice: null,
  unit: 'per BTL',
  locator: 'A01-01',
  category: 'Beverages',
  isSelected: true,
  copies: 1,
};

const DEFAULT_YELLOW_SAMPLE: ShelfTagItem = {
  id: 'sample-yellow',
  tagStyle: 'yellow',
  description: 'COCA-COLA ZERO SUGAR 1.5L PET BOTTLE',
  promoHeader: 'SAVE ₱13.00',
  promoSubtext: 'SAVE ₱13.00 • VALID UNTIL SEPT 30',
  promoValidity: 'Valid until Sept 30',
  sku: 'BEV-1002',
  barcode: '4800016644052',
  regularPrice: 78.0,
  promoPrice: 65.0,
  unit: 'per BTL',
  locator: 'A01-02',
  category: 'Beverages',
  isSelected: true,
  copies: 1,
};

export const TagStylesComparison: React.FC<TagStylesComparisonProps> = ({
  config,
  sampleWhiteItem = DEFAULT_WHITE_SAMPLE,
  sampleYellowItem = DEFAULT_YELLOW_SAMPLE,
}) => {
  return (
    <div className="bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-zinc-800 shadow-xl overflow-hidden">
      {/* Header title in amber */}
      <h3 className="text-xs font-black tracking-wider text-amber-500 uppercase mb-5">
        TAG STYLES LIVE COMPARISON (AT EXACT CONFIGURED SIZE)
      </h3>

      {/* Side-by-side display */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 overflow-x-auto py-2">
        {/* White Tag Preview */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-xs font-bold text-zinc-200">
            White Tag (Regular Retail Price)
          </span>
          <div className="shadow-lg rounded-sm overflow-hidden flex items-center justify-center bg-zinc-950 p-2 border border-zinc-800">
            <ShelftagCardRenderer
              item={sampleWhiteItem}
              config={config}
              scale={1}
            />
          </div>
        </div>

        {/* Yellow Tag Preview */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-xs font-bold text-amber-400">
            Yellow Tag (Promo / PP Price Point)
          </span>
          <div className="shadow-lg rounded-sm overflow-hidden flex items-center justify-center bg-zinc-950 p-2 border border-zinc-800">
            <ShelftagCardRenderer
              item={sampleYellowItem}
              config={config}
              scale={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
