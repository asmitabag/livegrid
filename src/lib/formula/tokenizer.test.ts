import { describe, expect, it } from "vitest";
import { tokenizeFormula } from "@/lib/formula/tokenizer";

describe("tokenizeFormula", () => {
  it("tokenizes a simple expression", () => {
    const t = tokenizeFormula("=1+2");
    expect(t.map((x) => x.type)).toEqual(["eq", "number", "op", "number", "eof"]);
  });

  it("tokenizes a cell reference", () => {
    const t = tokenizeFormula("=A1");
    expect(t.some((x) => x.type === "cell")).toBe(true);
  });

  it("tokenizes SUM range", () => {
    const t = tokenizeFormula("=SUM(A1:B2)");
    expect(t.some((x) => x.type === "ident")).toBe(true);
    expect(t.filter((x) => x.type === "cell").length).toBe(2);
  });
});