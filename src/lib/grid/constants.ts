export const DEFAULT_GRID = Object.freeze({
  rows: 40,
  cols: 14
});

export const GRID_LIMITS = Object.freeze({
  // Hard caps to prevent accidental giant rendering loops later
  maxRows: 10_000,
  maxCols: 1_000
});

export type GridSize = Readonly<{
  rows: number;
  cols: number;
}>;

export function clampGridSize(size: GridSize): GridSize {
  const rows = Math.max(1, Math.min(GRID_LIMITS.maxRows, Math.floor(size.rows)));
  const cols = Math.max(1, Math.min(GRID_LIMITS.maxCols, Math.floor(size.cols)));
  return { rows, cols };
}