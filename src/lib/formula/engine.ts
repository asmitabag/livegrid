import { tokenizeFormula } from "@/lib/formula/tokenizer";
import { parseFormula } from "@/lib/formula/parser";
import type { Expr } from "@/lib/formula/ast";
import { evalExpr, rawToDisplayNumber } from "@/lib/formula/evaluator";
import { expandRange } from "@/lib/formula/refs";
import type { CellKey } from "@/lib/grid/keys";
import type { SparseCellMap } from "@/lib/grid/sparseCells";
import type { CellValue } from "@/models";

export type CellDisplay = Readonly<{
  text: string;
  error: string | null;
  isFormula: boolean;
  deps: readonly CellKey[];
}>;

export type FormulaGraph = Readonly<{
  depsByCell: ReadonlyMap<CellKey, readonly CellKey[]>;
  revDeps: ReadonlyMap<CellKey, ReadonlySet<CellKey>>;
}>;

export type EngineResult = Readonly<{
  displayByCell: ReadonlyMap<CellKey, CellDisplay>;
  graph: FormulaGraph;

  /**
   * Keys whose display may have changed in this compute pass.
   * Used by UI layer to update view maps incrementally.
   */
  changedDisplayKeys?: readonly CellKey[];
}>;

function isFormulaValue(raw: CellValue): raw is string {
  return typeof raw === "string" && raw.trim().startsWith("=");
}

function asString(raw: CellValue): string {
  return raw === null ? "" : String(raw);
}

function uniqueKeys(keys: readonly CellKey[]): readonly CellKey[] {
  const seen = new Set<CellKey>();
  const out: CellKey[] = [];
  for (const k of keys) if (!seen.has(k)) (seen.add(k), out.push(k));
  return out;
}

function expandDeps(expr: Expr): readonly CellKey[] {
  switch (expr.kind) {
    case "number":
      return [];
    case "ref":
      return [expr.key];
    case "binary":
      return [...expandDeps(expr.left), ...expandDeps(expr.right)];
    case "sum":
      return expandRange(expr.from, expr.to);
  }
}

type ParsedFormula = Readonly<{
  expr: Expr;
  deps: readonly CellKey[];
}>;

type GraphState = Readonly<{
  depsByCell: Map<CellKey, readonly CellKey[]>;
  revDeps: Map<CellKey, Set<CellKey>>;
}>;

function cloneGraph(prev?: FormulaGraph): GraphState {
  const depsByCell = new Map<CellKey, readonly CellKey[]>(
    prev ? Array.from(prev.depsByCell.entries()) : []
  );
  const revDeps = new Map<CellKey, Set<CellKey>>();
  if (prev) {
    for (const [k, s] of prev.revDeps.entries()) revDeps.set(k, new Set(s));
  }
  return { depsByCell, revDeps };
}

function removeRevDepsForFormula(graph: GraphState, formulaKey: CellKey) {
  const oldDeps = graph.depsByCell.get(formulaKey) ?? [];
  for (const dep of oldDeps) {
    const set = graph.revDeps.get(dep);
    if (!set) continue;
    set.delete(formulaKey);
    if (set.size === 0) graph.revDeps.delete(dep);
  }
  graph.depsByCell.delete(formulaKey);
}

function addRevDepsForFormula(graph: GraphState, formulaKey: CellKey, deps: readonly CellKey[]) {
  graph.depsByCell.set(formulaKey, deps);
  for (const dep of deps) {
    const set = graph.revDeps.get(dep) ?? new Set<CellKey>();
    set.add(formulaKey);
    graph.revDeps.set(dep, set);
  }
}

function topoAffected(
  start: readonly CellKey[],
  revDeps: ReadonlyMap<CellKey, ReadonlySet<CellKey>>
): readonly CellKey[] {
  const out: CellKey[] = [];
  const seen = new Set<CellKey>();
  const q: CellKey[] = [...start];

  while (q.length) {
    const cur = q.shift()!;
    const deps = revDeps.get(cur);
    if (!deps) continue;

    for (const f of deps) {
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(f);
      q.push(f);
    }
  }
  return out;
}

function unionKeys(a: readonly CellKey[], b: readonly CellKey[]): readonly CellKey[] {
  const set = new Set<CellKey>();
  for (const k of a) set.add(k);
  for (const k of b) set.add(k);
  return Array.from(set);
}

function eqArr(a: readonly CellKey[], b: readonly CellKey[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function computeEngine(
  cells: SparseCellMap,
  previous?: EngineResult,
  changedKeys?: readonly CellKey[]
): EngineResult {
  // --- Parse cache: formula string -> parsed expr+deps
  // Keep it inside previous engine so it persists across renders.
  const prevAny = previous as any;
  const parseCache: Map<string, ParsedFormula> =
    (prevAny?.__parseCache as Map<string, ParsedFormula> | undefined) ?? new Map();

  const graphState = cloneGraph(previous?.graph);

  const formulaAsts = new Map<CellKey, Expr>();
  const parseErrorByCell = new Map<CellKey, string>();

  const changed = changedKeys ?? [];

  // Rebuild formulas incrementally:
  // - if changedKeys not provided: fall back to full scan
  const keysToScan: readonly CellKey[] =
    changed.length > 0 ? changed : Array.from(cells.keys());

  // Update graph entries only for cells we scanned.
  for (const key of keysToScan) {
    const cell = cells.get(key);
    const raw = cell?.value ?? null;

    // If it used to be a formula but no longer is, remove old deps.
    if (!isFormulaValue(raw)) {
      if (graphState.depsByCell.has(key)) removeRevDepsForFormula(graphState, key);
      continue;
    }

    // It is a formula: re-parse and update deps.
    const s = raw.trim();

    try {
      let parsed = parseCache.get(s);
      if (!parsed) {
        const tokens = tokenizeFormula(s);
        const p = parseFormula(tokens);
        parsed = {
          expr: p.expr,
          deps: uniqueKeys(expandDeps(p.expr))
        };
        parseCache.set(s, parsed);
      }

      formulaAsts.set(key, parsed.expr);
      parseErrorByCell.delete(key);

      const prevDeps = graphState.depsByCell.get(key) ?? [];
      if (!eqArr(prevDeps, parsed.deps)) {
        removeRevDepsForFormula(graphState, key);
        addRevDepsForFormula(graphState, key, parsed.deps);
      } else {
        // keep existing deps mapping
        graphState.depsByCell.set(key, prevDeps);
      }
    } catch (e) {
      // parse failed: treat as formula with no deps; still show error.
      parseErrorByCell.set(key, e instanceof Error ? e.message : "Invalid formula");
      formulaAsts.delete(key);

      removeRevDepsForFormula(graphState, key);
      addRevDepsForFormula(graphState, key, []);
    }
  }

  const roRevDeps = new Map<CellKey, ReadonlySet<CellKey>>();
  for (const [k, s] of graphState.revDeps.entries()) roRevDeps.set(k, s);

  const graph: FormulaGraph = {
    depsByCell: graphState.depsByCell,
    revDeps: roRevDeps
  };

  const prevDisplay = previous?.displayByCell ?? new Map<CellKey, CellDisplay>();
  const displayByCell = new Map<CellKey, CellDisplay>(prevDisplay);

  // Determine dirty formula keys:
  // - changed formula cells themselves (if their raw changed)
  // - formulas affected via revDeps
  const affected = changed.length > 0 ? topoAffected(changed, graph.revDeps) : [];
  const dirtyCandidateKeys =
    changed.length > 0 ? unionKeys(changed, affected) : Array.from(graph.depsByCell.keys());

  // Also include parse-error formulas so they display immediately
  const dirtyFormulaKeys = unionKeys(dirtyCandidateKeys, Array.from(parseErrorByCell.keys()));

  const evalCache = new Map<CellKey, number>();
  const errorByFormulaCell = new Map<CellKey, string>();

  const markCycle = (stack: readonly CellKey[]) => {
    for (const k of stack) {
      if (!errorByFormulaCell.has(k)) errorByFormulaCell.set(k, "CYCLE");
    }
  };

  const evalCellDisplayNumber = (key: CellKey, stack: CellKey[]): number => {
    if (evalCache.has(key)) return evalCache.get(key)!;

    const cell = cells.get(key);
    const raw = cell?.value ?? null;

    // Missing cell: treat as 0 for numeric context (spreadsheet-ish)
    if (!cell) {
      evalCache.set(key, 0);
      return 0;
    }

    if (!isFormulaValue(raw)) {
      const n = rawToDisplayNumber(raw);
      evalCache.set(key, n);
      return n;
    }

    const parseErr = parseErrorByCell.get(key);
    if (parseErr) {
      errorByFormulaCell.set(key, parseErr);
      evalCache.set(key, 0);
      return 0;
    }

    if (stack.includes(key)) {
      markCycle([...stack, key]);
      evalCache.set(key, 0);
      return 0;
    }

    const ast = formulaAsts.get(key);
    if (!ast) {
      errorByFormulaCell.set(key, "Invalid formula");
      evalCache.set(key, 0);
      return 0;
    }

    try {
      const nextStack = [...stack, key];
      const n = evalExpr(ast, {
        cells,
        stack: nextStack,
        getRawByKey: (k) => cells.get(k)?.value ?? null,
        evalCellDisplayByKey: (k) => evalCellDisplayNumber(k, nextStack)
      });
      evalCache.set(key, n);
      return n;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Evaluation error";
      errorByFormulaCell.set(key, msg);
      evalCache.set(key, 0);
      return 0;
    }
  };

  const changedDisplayKeysSet = new Set<CellKey>();

  // Recompute formula displays for dirty set
  for (const key of dirtyFormulaKeys) {
    const cell = cells.get(key);
    const raw = cell?.value ?? null;
    if (!isFormulaValue(raw)) continue;

    const n = evalCellDisplayNumber(key, []);
    const err = errorByFormulaCell.get(key) ?? null;

    const next: CellDisplay = {
      text: err ? (err === "CYCLE" ? "#CYCLE!" : "#ERROR") : String(n),
      error: err === "CYCLE" ? "Circular reference" : err,
      isFormula: true,
      deps: graph.depsByCell.get(key) ?? []
    };

    const prev = displayByCell.get(key);
    if (!prev || prev.text !== next.text || prev.error !== next.error || prev.isFormula !== true) {
      displayByCell.set(key, next);
      changedDisplayKeysSet.add(key);
    }
  }

  // Non-formula display for all sparse cells
  // Optimize: if changedKeys provided, only update those.
  const nonFormulaKeysToUpdate =
    changed.length > 0 ? changed : Array.from(cells.keys());

  for (const key of nonFormulaKeysToUpdate) {
    const cell = cells.get(key);
    if (!cell) continue;

    const raw = cell.value ?? null;
    if (isFormulaValue(raw)) continue;

    const next: CellDisplay = {
      text: asString(raw),
      error: null,
      isFormula: false,
      deps: []
    };

    const prev = displayByCell.get(key);
    if (!prev || prev.text !== next.text || prev.isFormula !== false || prev.error !== null) {
      displayByCell.set(key, next);
      changedDisplayKeysSet.add(key);
    }
  }

  // Also: if a sparse cell was deleted, remove its display entry
  // (Only possible when changedKeys provided and a key disappeared)
  if (changed.length > 0) {
    for (const key of changed) {
      if (!cells.has(key) && displayByCell.has(key)) {
        displayByCell.delete(key);
        changedDisplayKeysSet.add(key);
      }
    }
  }

  const out: EngineResult = {
    displayByCell,
    graph,
    changedDisplayKeys: Array.from(changedDisplayKeysSet)
  };

  // attach parse cache for next run (non-exported internal)
  (out as any).__parseCache = parseCache;

  return out;
}