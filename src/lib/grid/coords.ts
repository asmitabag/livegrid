export type CellCoord = Readonly<{ row: number; col: number }>; // 0-based
export type CellRange = Readonly<{ start: CellCoord; end: CellCoord }>; // inclusive, 0-based

export function isValidCoord(coord: CellCoord): boolean {
  return Number.isInteger(coord.row) && Number.isInteger(coord.col) && coord.row >= 0 && coord.col >= 0;
}

export function columnIndexToLabel(col: number): string {
  // 0 -> A, 25 -> Z, 26 -> AA ...
  if (!Number.isInteger(col) || col < 0) throw new Error(`Invalid column index: ${col}`);

  let n = col + 1; // convert to 1-based
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function columnLabelToIndex(label: string): number {
  const clean = label.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(clean)) throw new Error(`Invalid column label: "${label}"`);

  let col = 0;
  for (let i = 0; i < clean.length; i++) {
    col = col * 26 + (clean.charCodeAt(i) - 64); // A -> 1
  }
  return col - 1; // back to 0-based
}

export function toA1(coord: CellCoord): string {
  if (!isValidCoord(coord)) throw new Error(`Invalid coord: row=${coord.row} col=${coord.col}`);
  const colLabel = columnIndexToLabel(coord.col);
  const rowLabel = String(coord.row + 1);
  return `${colLabel}${rowLabel}`;
}

export function parseA1(a1: string): CellCoord {
  const clean = a1.trim().toUpperCase();
  const match = /^([A-Z]+)(\d+)$/.exec(clean);
  if (!match) throw new Error(`Invalid A1 notation: "${a1}"`);

  const [, colLabel, rowLabel] = match;
  const col = columnLabelToIndex(colLabel);
  const rowNum = Number(rowLabel);
  if (!Number.isFinite(rowNum) || rowNum < 1) throw new Error(`Invalid row in A1: "${a1}"`);

  return { row: rowNum - 1, col };
}

export function normalizeRange(range: CellRange): CellRange {
  const startRow = Math.min(range.start.row, range.end.row);
  const endRow = Math.max(range.start.row, range.end.row);
  const startCol = Math.min(range.start.col, range.end.col);
  const endCol = Math.max(range.start.col, range.end.col);

  return Object.freeze({
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol }
  });
}

export function toA1Range(range: CellRange): string {
  const r = normalizeRange(range);
  return `${toA1(r.start)}:${toA1(r.end)}`;
}

export function parseA1Range(input: string): CellRange {
  const clean = input.trim().toUpperCase();
  const parts = clean.split(":");
  if (parts.length !== 2) throw new Error(`Invalid A1 range: "${input}"`);
  const start = parseA1(parts[0]);
  const end = parseA1(parts[1]);
  return normalizeRange({ start, end });
}

export function isSingleCellRange(range: CellRange): boolean {
  const r = normalizeRange(range);
  return r.start.row === r.end.row && r.start.col === r.end.col;
}

/**
 * Enumerate coordinates in a normalized range, row-major order.
 * Pure helper; caller controls bounds.
 */
export function forEachCoordInRange(
  range: CellRange,
  visit: (coord: CellCoord) => void
): void {
  const r = normalizeRange(range);
  for (let row = r.start.row; row <= r.end.row; row++) {
    for (let col = r.start.col; col <= r.end.col; col++) {
      visit({ row, col });
    }
  }
}