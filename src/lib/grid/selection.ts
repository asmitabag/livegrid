import type { CellCoord, CellRange } from "@/lib/grid/coords";
import { normalizeRange } from "@/lib/grid/coords";

export type Selection = Readonly<{
  anchor: CellCoord; // where selection started
  focus: CellCoord; // current focus (end)
}>;

export function selectionToRange(sel: Selection): CellRange {
  return normalizeRange({ start: sel.anchor, end: sel.focus });
}

export function moveCoord(
  coord: CellCoord,
  delta: Readonly<{ dRow: number; dCol: number }>,
  bounds?: Readonly<{ rows: number; cols: number }>
): CellCoord {
  const nextRow = coord.row + delta.dRow;
  const nextCol = coord.col + delta.dCol;

  const clampedRow = bounds ? Math.max(0, Math.min(bounds.rows - 1, nextRow)) : Math.max(0, nextRow);
  const clampedCol = bounds ? Math.max(0, Math.min(bounds.cols - 1, nextCol)) : Math.max(0, nextCol);

  return { row: clampedRow, col: clampedCol };
}

export function expandSelection(
  sel: Selection,
  nextFocus: CellCoord
): Selection {
  return Object.freeze({
    anchor: sel.anchor,
    focus: nextFocus
  });
}

export function setSingleCellSelection(coord: CellCoord): Selection {
  return Object.freeze({ anchor: coord, focus: coord });
}

export function selectionContainsCoord(sel: Selection, coord: CellCoord): boolean {
  const r = selectionToRange(sel);
  return (
    coord.row >= r.start.row &&
    coord.row <= r.end.row &&
    coord.col >= r.start.col &&
    coord.col <= r.end.col
  );
}