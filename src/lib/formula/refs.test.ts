import { describe, expect, it } from "vitest";
import { a1ToKey, expandRange } from "@/lib/formula/refs";

describe("formula refs", () => {
  it("a1ToKey", () => {
    expect(a1ToKey("A", 1)).toBe("0,0");
    expect(a1ToKey("B", 2)).toBe("1,1");
  });

  it("expandRange", () => {
    const from = a1ToKey("A", 1); // 0,0
    const to = a1ToKey("B", 2);   // 1,1
    expect(expandRange(from, to)).toEqual(["0,0", "0,1", "1,0", "1,1"]);
  });
});