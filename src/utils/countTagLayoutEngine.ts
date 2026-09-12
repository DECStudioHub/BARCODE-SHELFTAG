import { InventoryItem } from '../types';
import { groupItemsByLocator, sortInventoryItemsForCountSheet } from './countSheetLayoutEngine';

export interface CountTagPage {
  pageNumber: number;
  items: InventoryItem[];
  locators: string[];
  isMixedLocators: boolean;
  totalTags: number;
}

export interface PackCountTagsOptions {
  capacity?: number;
  selectedLocators?: string[] | 'ALL';
}

/**
 * Intelligent Count Tag Sorting and Paper-Saving Packing Engine.
 * 
 * Rules:
 * 1. Filter out unselected items (isSelected !== false).
 * 2. Filter by selectedLocators if specified.
 * 3. Group items by LOCATOR (natural alphanumeric order, UNASSIGNED last).
 * 4. Within each LOCATOR group:
 *    Sort by DESCRIPTION -> A to Z (case-insensitive natural sort).
 * 5. Separate locator groups into:
 *    - LARGE LOCATOR GROUPS: groups containing >= 3 SKUs
 *    - SMALL LOCATOR GROUPS: groups containing 1 or 2 SKUs
 * 6. Process LARGE LOCATOR GROUPS:
 *    - Priority: keep that locator together and preserve its strict A-Z sequence.
 *    - Chunk into pages of size capacity (e.g. 9 tags per page).
 *    - Do not disrupt the locator's sequence or unnecessarily mix other locators into these pages.
 * 7. Process SMALL LOCATOR GROUPS:
 *    - Each 1-SKU or 2-SKU group is treated as an INDIVISIBLE unit (do NOT split a 2-SKU locator across pages).
 *    - Intelligently combine small locator groups to fill pages up to capacity (9 tags).
 *    - Efficient bin packing:
 *      * Fill up to capacity without splitting any small locator group.
 *      * If a page has remaining capacity (e.g. 1 slot) and the immediate next group is size 2,
 *        look ahead for a size 1 group to fill the page to capacity (9 tags).
 *      * If no lookahead group can fit, close the page and start a new page.
 * 8. Never duplicate or lose any item.
 * 9. Every Count Tag retains its original LOCATOR and raw item properties.
 */
export function packCountTagPages(
  items: InventoryItem[],
  optionsOrCapacity: number | PackCountTagsOptions = 9
): CountTagPage[] {
  const options: PackCountTagsOptions =
    typeof optionsOrCapacity === 'number'
      ? { capacity: optionsOrCapacity }
      : optionsOrCapacity;

  const capacity = Math.max(1, options.capacity || 9);
  const selectedLocators = options.selectedLocators;

  // 1. Filter active selected items
  let activeItems = items.filter(it => it.isSelected !== false);

  // Optional locator filtering
  if (selectedLocators && selectedLocators !== 'ALL') {
    const locSet = new Set(
      (Array.isArray(selectedLocators) ? selectedLocators : [selectedLocators]).map(l =>
        String(l).trim().toUpperCase()
      )
    );
    activeItems = activeItems.filter(it => {
      const itLoc = String(it.locator || '').trim().toUpperCase() || 'UNASSIGNED';
      return locSet.has(itLoc);
    });
  }

  if (activeItems.length === 0) {
    return [];
  }

  // 2. Group items by locator (sorted natural alphabetically, UNASSIGNED last)
  const grouped = groupItemsByLocator(activeItems);

  // 3. Sort items inside each locator by DESCRIPTION A to Z
  const sortedGrouped: Record<string, InventoryItem[]> = {};
  for (const loc of Object.keys(grouped)) {
    sortedGrouped[loc] = sortInventoryItemsForCountSheet(grouped[loc], 'description', 'asc');
  }

  // 4. Separate into Large (>= 3 SKUs) and Small (1 or 2 SKUs)
  const largeGroups: { locator: string; items: InventoryItem[] }[] = [];
  const smallGroups: { locator: string; items: InventoryItem[] }[] = [];

  for (const loc of Object.keys(sortedGrouped)) {
    const groupItems = sortedGrouped[loc];
    if (groupItems.length >= 3) {
      largeGroups.push({ locator: loc, items: groupItems });
    } else if (groupItems.length > 0) {
      smallGroups.push({ locator: loc, items: groupItems });
    }
  }

  const pages: CountTagPage[] = [];
  let pageCounter = 1;

  // 5. Process Large Groups
  for (const group of largeGroups) {
    const totalItems = group.items.length;
    for (let i = 0; i < totalItems; i += capacity) {
      const pageItems = group.items.slice(i, i + capacity);
      pages.push({
        pageNumber: pageCounter++,
        items: pageItems,
        locators: [group.locator],
        isMixedLocators: false,
        totalTags: pageItems.length,
      });
    }
  }

  // 6. Process Small Groups with Paper-Saving Packing
  // Small groups must remain indivisible: size is either 1 or 2 items.
  const remainingSmall = [...smallGroups];

  while (remainingSmall.length > 0) {
    const currentPageItems: InventoryItem[] = [];
    const pageLocators: string[] = [];
    let remainingSpace = capacity;

    while (remainingSmall.length > 0) {
      // 1. Check if the next sequential group fits
      if (remainingSmall[0].items.length <= remainingSpace) {
        const group = remainingSmall.shift()!;
        currentPageItems.push(...group.items);
        pageLocators.push(group.locator);
        remainingSpace -= group.items.length;
      } else {
        // The first group (e.g. size 2) doesn't fit into remainingSpace (e.g. 1).
        // Look ahead for a smaller group (e.g. size 1) that fits within remainingSpace
        const fitIdx = remainingSmall.findIndex(g => g.items.length <= remainingSpace);
        if (fitIdx !== -1) {
          const [group] = remainingSmall.splice(fitIdx, 1);
          currentPageItems.push(...group.items);
          pageLocators.push(group.locator);
          remainingSpace -= group.items.length;
        } else {
          // No remaining small group can fit in this page
          break;
        }
      }

      if (remainingSpace <= 0) {
        break;
      }
    }

    if (currentPageItems.length > 0) {
      pages.push({
        pageNumber: pageCounter++,
        items: currentPageItems,
        locators: Array.from(new Set(pageLocators)),
        isMixedLocators: pageLocators.length > 1,
        totalTags: currentPageItems.length,
      });
    }
  }

  return pages;
}
