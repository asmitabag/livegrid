export type Viewport = Readonly<{
  rowStart: number; // inclusive
  rowEnd: number;   // inclusive
  colStart: number; // inclusive
  colEnd: number;   // inclusive
}>;

export type ViewportInput = Readonly<{
  scrollTop: number;
  scrollLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  rowHeight: number;
  colWidth: number;
  totalRows: number;
  totalCols: number;
  overscanRows?: number;
  overscanCols?: number;
}>;

function clampInt(n: number, min: number, max: number): number {
  const v = Math.floor(n);
  return Math.max(min, Math.min(max, v));
}

export function computeViewport(input: ViewportInput): Viewport {
  const overscanRows = input.overscanRows ?? 6;
  const overscanCols = input.overscanCols ?? 3;

  const firstRow = Math.floor(input.scrollTop / input.rowHeight);
  const firstCol = Math.floor(input.scrollLeft / input.colWidth);

  const visibleRows = Math.ceil(input.viewportHeight / input.rowHeight);
  const visibleCols = Math.ceil(input.viewportWidth / input.colWidth);

  const rowStart = clampInt(firstRow - overscanRows, 0, Math.max(0, input.totalRows - 1));
  const colStart = clampInt(firstCol - overscanCols, 0, Math.max(0, input.totalCols - 1));

  const rowEnd = clampInt(firstRow + visibleRows + overscanRows, 0, Math.max(0, input.totalRows - 1));
  const colEnd = clampInt(firstCol + visibleCols + overscanCols, 0, Math.max(0, input.totalCols - 1));

  return Object.freeze({ rowStart, rowEnd, colStart, colEnd });
}

export function visibleCount(vp: Viewport): Readonly<{ rows: number; cols: number }> {
  return Object.freeze({
    rows: Math.max(0, vp.rowEnd - vp.rowStart + 1),
    cols: Math.max(0, vp.colEnd - vp.colStart + 1)
  });
}