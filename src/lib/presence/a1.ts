import { columnIndexToLabel } from "@/lib/grid/coords";
import type { CellCoord } from "@/lib/grid/coords";

export function coordToA1(coord: CellCoord): string {
  return `${columnIndexToLabel(coord.col)}${coord.row + 1}`;
}