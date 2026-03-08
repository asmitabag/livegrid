import type { CellCoord } from "@/lib/grid/coords";

export type CellKey = `${number},${number}`;

export function coordToKey(coord: CellCoord): CellKey {
  return `${coord.row},${coord.col}`;
}

export function keyToCoord(key: CellKey): CellCoord {
  const [r, c] = key.split(",");
  const row = Number(r);
  const col = Number(c);
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    throw new Error(`Invalid CellKey: "${key}"`);
  }
  return { row, col };
}