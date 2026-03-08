export type { CellCoord, CellRange } from "@/lib/grid/coords";
export {
  columnIndexToLabel,
  columnLabelToIndex,
  toA1,
  parseA1,
  toA1Range,
  parseA1Range,
  normalizeRange,
  isSingleCellRange,
  forEachCoordInRange
} from "@/lib/grid/coords";

export type { CellKey } from "@/lib/grid/keys";
export { coordToKey, keyToCoord } from "@/lib/grid/keys";

export type { Selection } from "@/lib/grid/selection";
export {
  selectionToRange,
  moveCoord,
  expandSelection,
  setSingleCellSelection,
  selectionContainsCoord
} from "@/lib/grid/selection";

export type { Viewport, ViewportInput } from "@/lib/grid/viewport";
export { computeViewport, visibleCount } from "@/lib/grid/viewport";

export type { SparseCellMap } from "@/lib/grid/sparseCells";
export {
  emptySparseCells,
  getCell,
  getCellValue,
  setCellValue,
  clearRange
} from "@/lib/grid/sparseCells";

export { DEFAULT_GRID, GRID_LIMITS, clampGridSize } from "@/lib/grid/constants";