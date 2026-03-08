import type { CellFormatting } from "@/models/formatting";
import type { CellCoord } from "@/lib/grid/coords";

export type CellValue = string | number | boolean | null;

export type CellAddress = CellCoord;

export type Cell = Readonly<{
  id: string;
  address: CellAddress;
  value: CellValue;
  formatting: CellFormatting;
  updatedAt: string; // ISO
  updatedBy: string; // userId
}>;