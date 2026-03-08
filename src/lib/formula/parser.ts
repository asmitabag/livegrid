import type { Token } from "@/lib/formula/tokenizer";
import { FormulaTokenizeError } from "@/lib/formula/tokenizer";
import type { Expr, ParseResult } from "@/lib/formula/ast";
import { a1ToKey } from "@/lib/formula/refs";
import type { CellKey } from "@/lib/grid/keys";

export class FormulaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaParseError";
  }
}

type Cursor = Readonly<{
  tokens: readonly Token[];
  i: number;
}>;

function peek(cur: Cursor): Token {
  return cur.tokens[cur.i] ?? { type: "eof" };
}

function advance(cur: Cursor): Cursor {
  return { ...cur, i: cur.i + 1 };
}

function expect(cur: Cursor, type: Token["type"]): Cursor {
  const t = peek(cur);
  if (t.type !== type) throw new FormulaParseError(`Expected ${type} but found ${t.type}`);
  return advance(cur);
}

function parsePrimary(cur: Cursor): Readonly<{ cur: Cursor; expr: Expr; deps: CellKey[] }> {
  const t = peek(cur);

  if (t.type === "number") {
    return { cur: advance(cur), expr: { kind: "number", value: t.value }, deps: [] };
  }

  if (t.type === "cell") {
    const key = a1ToKey(t.col, t.row);
    return { cur: advance(cur), expr: { kind: "ref", key }, deps: [key] };
  }

  if (t.type === "lparen") {
    let c2 = expect(cur, "lparen");
    const inner = parseExpr(c2);
    c2 = inner.cur;
    c2 = expect(c2, "rparen");
    return { cur: c2, expr: inner.expr, deps: inner.deps.slice() };
  }

  // SUM(range) - STRICT: must be SUM(A1:A5)
  if (t.type === "ident" && t.value === "SUM") {
    let c2 = advance(cur);
    c2 = expect(c2, "lparen");

    const a = peek(c2);
    if (a.type !== "cell") throw new FormulaParseError("SUM expects a range like SUM(A1:A5)");
    const from = a1ToKey(a.col, a.row);
    c2 = advance(c2);

    const mid = peek(c2);
    if (mid.type !== "colon") throw new FormulaParseError("SUM expects a range like SUM(A1:A5)");
    c2 = advance(c2);

    const b = peek(c2);
    if (b.type !== "cell") throw new FormulaParseError("SUM expects a range like SUM(A1:A5)");
    const to = a1ToKey(b.col, b.row);
    c2 = advance(c2);

    c2 = expect(c2, "rparen");

    return { cur: c2, expr: { kind: "sum", from, to }, deps: [from, to] };
  }

  throw new FormulaParseError(`Unexpected token: ${t.type}`);
}

function parseUnary(cur: Cursor): Readonly<{ cur: Cursor; expr: Expr; deps: CellKey[] }> {
  const t = peek(cur);
  if (t.type === "op" && t.value === "-") {
    const inner = parseUnary(advance(cur));
    return {
      cur: inner.cur,
      expr: { kind: "binary", op: "*", left: { kind: "number", value: -1 }, right: inner.expr },
      deps: inner.deps
    };
  }
  return parsePrimary(cur);
}

function parseMulDiv(cur: Cursor): Readonly<{ cur: Cursor; expr: Expr; deps: CellKey[] }> {
  let left = parseUnary(cur);
  while (true) {
    const t = peek(left.cur);
    if (t.type === "op" && (t.value === "*" || t.value === "/")) {
      const right = parseUnary(advance(left.cur));
      left = {
        cur: right.cur,
        expr: { kind: "binary", op: t.value, left: left.expr, right: right.expr },
        deps: [...left.deps, ...right.deps]
      };
      continue;
    }
    break;
  }
  return left;
}

function parseAddSub(cur: Cursor): Readonly<{ cur: Cursor; expr: Expr; deps: CellKey[] }> {
  let left = parseMulDiv(cur);
  while (true) {
    const t = peek(left.cur);
    if (t.type === "op" && (t.value === "+" || t.value === "-")) {
      const right = parseMulDiv(advance(left.cur));
      left = {
        cur: right.cur,
        expr: { kind: "binary", op: t.value, left: left.expr, right: right.expr },
        deps: [...left.deps, ...right.deps]
      };
      continue;
    }
    break;
  }
  return left;
}

function parseExpr(cur: Cursor) {
  return parseAddSub(cur);
}

export function parseFormula(tokens: readonly Token[]): ParseResult {
  if (tokens.length === 0) throw new FormulaTokenizeError("Empty formula");
  let cur: Cursor = { tokens, i: 0 };
  cur = expect(cur, "eq");

  const out = parseExpr(cur);
  cur = out.cur;

  const end = peek(cur);
  if (end.type !== "eof") {
    throw new FormulaParseError(`Unexpected token after expression: ${end.type}`);
  }

  return { expr: out.expr, deps: out.deps };
}