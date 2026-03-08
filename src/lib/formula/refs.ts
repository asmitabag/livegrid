import type { CellCoord } from "@/lib/grid/coords";
import { columnLabelToIndex } from "@/lib/grid/coords";
import { coordToKey, keyToCoord, type CellKey } from "@/lib/grid/keys";

export class FormulaRefError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaRefError";
  }
}

export function a1ToCoord(colLabel: string, row1Based: number): CellCoord {
  const col = columnLabelToIndex(colLabel);
  const row = row1Based - 1;
  if (!Number.isInteger(col) || col < 0) throw new FormulaRefError(`Invalid column: ${colLabel}`);
  if (!Number.isInteger(row) || row < 0) throw new FormulaRefError(`Invalid row: ${row1Based}`);
  return { row, col };
}

export function a1ToKey(colLabel: string, row1Based: number): CellKey {
  return coordToKey(a1ToCoord(colLabel, row1Based));
}

export function normalizeRange(from: CellKey, to: CellKey): Readonly<{ top: number; left: number; bottom: number; right: number }> {
  const a = keyToCoord(from);
  const b = keyToCoord(to);
  const top = Math.min(a.row, b.row);
  const bottom = Math.max(a.row, b.row);
  const left = Math.min(a.col, b.col);
  const right = Math.max(a.col, b.col);
  return { top, left, bottom, right };
}

export function expandRange(from: CellKey, to: CellKey): readonly CellKey[] {
  const { top, left, bottom, right } = normalizeRange(from, to);
  const out: CellKey[] = [];
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      out.push(coordToKey({ row: r, col: c }));
    }
  }
  return out;
}