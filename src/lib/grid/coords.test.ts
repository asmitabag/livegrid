import { describe, expect, it } from "vitest";
import { columnIndexToLabel, columnLabelToIndex, parseA1, parseA1Range, toA1, toA1Range } from "@/lib/grid/coords";

describe("grid coords", () => {
  it("columnIndexToLabel", () => {
    expect(columnIndexToLabel(0)).toBe("A");
    expect(columnIndexToLabel(25)).toBe("Z");
    expect(columnIndexToLabel(26)).toBe("AA");
    expect(columnIndexToLabel(27)).toBe("AB");
  });

  it("columnLabelToIndex", () => {
    expect(columnLabelToIndex("A")).toBe(0);
    expect(columnLabelToIndex("Z")).toBe(25);
    expect(columnLabelToIndex("AA")).toBe(26);
    expect(columnLabelToIndex("AB")).toBe(27);
  });

  it("toA1 / parseA1 roundtrip", () => {
    const coord = { row: 3, col: 1 }; // B4
    expect(toA1(coord)).toBe("B4");
    expect(parseA1("B4")).toEqual(coord);
  });

  it("toA1Range / parseA1Range", () => {
    const r = { start: { row: 0, col: 0 }, end: { row: 2, col: 1 } }; // A1:B3
    expect(toA1Range(r)).toBe("A1:B3");
    expect(parseA1Range("A1:B3")).toEqual(r);
  });
});