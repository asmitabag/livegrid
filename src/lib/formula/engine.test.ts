import { describe, expect, it } from "vitest";
import { computeEngine } from "@/lib/formula/engine";
import type { SparseCellMap } from "@/lib/grid/sparseCells";
import type { CellKey } from "@/lib/grid/keys";
import type { Cell } from "@/models";

function cell(key: CellKey, raw: any): Cell {
  const [r, c] = key.split(",").map(Number);
  return {
    id: key,
    address: { row: r!, col: c! },
    value: raw,
    formatting: {},
    updatedAt: new Date().toISOString(),
    updatedBy: "test"
  };
}

function mapOf(entries: Array<[CellKey, any]>): SparseCellMap {
  const m = new Map<CellKey, Cell>();
  for (const [k, v] of entries) m.set(k, cell(k, v));
  return m;
}

describe("computeEngine", () => {
  it("computes simple formula references", () => {
    const cells = mapOf([
      ["0,0", 10],     // A1
      ["0,1", "=A1+5"] // B1
    ]);

    const r = computeEngine(cells);
    expect(r.displayByCell.get("0,1")?.text).toBe("15");
    expect(r.displayByCell.get("0,1")?.error).toBe(null);
  });

  it("handles division by zero as error", () => {
    const cells = mapOf([["0,0", "=1/0"]]);
    const r = computeEngine(cells);
    expect(r.displayByCell.get("0,0")?.text).toBe("#ERROR");
    expect(r.displayByCell.get("0,0")?.error).toMatch(/Division by zero/i);
  });

  it("detects circular references", () => {
    const cells = mapOf([
      ["0,0", "=B1"], // A1
      ["0,1", "=A1"]  // B1
    ]);
    const r = computeEngine(cells);
    expect(r.displayByCell.get("0,0")?.text).toBe("#CYCLE!");
    expect(r.displayByCell.get("0,1")?.text).toBe("#CYCLE!");
  });

  it("only marks changed display keys on incremental update", () => {
    const c1 = mapOf([
      ["0,0", 1],
      ["0,1", "=A1+1"]
    ]);
    const r1 = computeEngine(c1);

    const c2 = mapOf([
      ["0,0", 2], // A1 changed
      ["0,1", "=A1+1"]
    ]);
    const r2 = computeEngine(c2, r1, ["0,0"]);

    expect(r2.changedDisplayKeys).toBeTruthy();
    // A1 and B1 likely changed display
    expect(new Set(r2.changedDisplayKeys)).toEqual(new Set(["0,0", "0,1"]));
  });
});