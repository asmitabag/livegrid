import type { CellKey } from "@/lib/grid/keys";

export type Expr =
  | Readonly<{ kind: "number"; value: number }>
  | Readonly<{ kind: "ref"; key: CellKey }>
  | Readonly<{ kind: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }>
  | Readonly<{ kind: "sum"; from: CellKey; to: CellKey }>;

export type ParseResult = Readonly<{
  expr: Expr;
  deps: readonly CellKey[];
}>;