import type { Cell, CellValue } from "@/models";
import type { CellCoord } from "@/lib/grid/coords";
import { nowIso } from "@/lib/utils/dates";
import { createId } from "@/lib/utils/ids";
import { coordToKey, type CellKey } from "@/lib/grid/keys";

export type SparseCellMap = ReadonlyMap<CellKey, Cell>;

export function emptySparseCells(): SparseCellMap {
  return new Map<CellKey, Cell>();
}

export function getCell(map: SparseCellMap, coord: CellCoord): Cell | null {
  return map.get(coordToKey(coord)) ?? null;
}

export function getCellValue(map: SparseCellMap, coord: CellCoord): CellValue {
  return getCell(map, coord)?.value ?? null;
}

/**
 * Sets a cell value in sparse storage.
 * If value is empty (null or ""), the cell is removed from the map (sparse behavior).
 */
export function setCellValue(
  map: SparseCellMap,
  input: Readonly<{
    coord: CellCoord;
    value: CellValue;
    userId: string;
    formatting?: Cell["formatting"];
  }>
): SparseCellMap {
  const key = coordToKey(input.coord);
  const next = new Map(map);

  const isEmpty =
    input.value === null ||
    (typeof input.value === "string" && input.value.trim() === "");

  if (isEmpty) {
    next.delete(key);
    return next;
  }

  const prev = next.get(key);
  const updatedAt = nowIso();

  const cell: Cell = {
    id: prev?.id ?? createId("cell"),
    address: input.coord,
    value: input.value,
    formatting: input.formatting ?? prev?.formatting ?? {},
    updatedAt,
    updatedBy: input.userId
  };

  next.set(key, cell);
  return next;
}

export function clearRange(map: SparseCellMap, keys: readonly CellKey[]): SparseCellMap {
  if (keys.length === 0) return map;
  const next = new Map(map);
  for (const k of keys) next.delete(k);
  return next;
}