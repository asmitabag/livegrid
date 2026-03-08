import type { Expr } from "@/lib/formula/ast";
import { expandRange } from "@/lib/formula/refs";
import type { CellKey } from "@/lib/grid/keys";
import type { SparseCellMap } from "@/lib/grid/sparseCells";
import type { CellValue } from "@/models";

export class FormulaEvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaEvalError";
  }
}

export type EvalContext = Readonly<{
  cells: SparseCellMap;
  // To prevent infinite recursion / cycles:
  stack: readonly CellKey[];
  getRawByKey: (key: CellKey) => CellValue;
  evalCellDisplayByKey: (key: CellKey) => number; // numeric display for formula use
}>;

function toNumber(v: CellValue): number {
  if (v === null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = String(v).trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new FormulaEvalError(`Not a number: "${s}"`);
  return n;
}

export function evalExpr(expr: Expr, ctx: EvalContext): number {
  switch (expr.kind) {
    case "number":
      return expr.value;

    case "ref":
      return ctx.evalCellDisplayByKey(expr.key);

    case "binary": {
      const a = evalExpr(expr.left, ctx);
      const b = evalExpr(expr.right, ctx);
      switch (expr.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          if (b === 0) throw new FormulaEvalError("Division by zero");
          return a / b;
      }
    }

    case "sum": {
      const keys = expandRange(expr.from, expr.to);
      let total = 0;
      for (const k of keys) {
        total += ctx.evalCellDisplayByKey(k);
      }
      return total;
    }
  }
}

export function rawToDisplayNumber(raw: CellValue): number {
  // Used when a referenced cell is not a formula:
  return toNumber(raw);
}