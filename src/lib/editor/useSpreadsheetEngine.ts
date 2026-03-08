"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SparseCellMap } from "@/lib/grid/sparseCells";
import type { CellKey } from "@/lib/grid/keys";
import { computeEngine, type EngineResult } from "@/lib/formula/engine";

function diffKeys(prev: SparseCellMap, next: SparseCellMap): readonly CellKey[] {
  const changed = new Set<CellKey>();

  for (const [k, v] of prev.entries()) {
    const n = next.get(k);
    if (!n || n.value !== v.value) changed.add(k);
  }
  for (const [k, v] of next.entries()) {
    const p = prev.get(k);
    if (!p || p.value !== v.value) changed.add(k);
  }

  return Array.from(changed);
}

export type SpreadsheetEngineView = Readonly<{
  displayByCell: ReadonlyMap<CellKey, { text: string; error: string | null }>;
}>;

function eqDisplay(
  a: { text: string; error: string | null } | undefined,
  b: { text: string; error: string | null } | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.text === b.text && a.error === b.error;
}

export function useSpreadsheetEngine(cells: SparseCellMap): SpreadsheetEngineView {
  const prevCellsRef = useRef<SparseCellMap | null>(null);
  const prevEngineRef = useRef<EngineResult | undefined>(undefined);

  const [view, setView] = useState<SpreadsheetEngineView>(() => ({
    displayByCell: new Map()
  }));

  useEffect(() => {
    const prevCells = prevCellsRef.current;
    const changedKeys = prevCells ? diffKeys(prevCells, cells) : undefined;

    const nextEngine = computeEngine(cells, prevEngineRef.current, changedKeys);

    prevCellsRef.current = cells;
    prevEngineRef.current = nextEngine;

    setView((prev) => {
      const prevMap = prev.displayByCell as Map<CellKey, { text: string; error: string | null }>;
      let nextMap: Map<CellKey, { text: string; error: string | null }> | null = null;

      const ensureNext = () => {
        if (!nextMap) nextMap = new Map(prevMap);
        return nextMap;
      };

      const keysToCheck =
        nextEngine.changedDisplayKeys && nextEngine.changedDisplayKeys.length > 0
          ? nextEngine.changedDisplayKeys
          : Array.from(nextEngine.displayByCell.keys());

      for (const k of keysToCheck) {
        const d = nextEngine.displayByCell.get(k);
        if (!d) continue;

        const nextVal = { text: d.text, error: d.error };
        const curVal = prevMap.get(k);
        if (!eqDisplay(curVal, nextVal)) {
          ensureNext().set(k, nextVal);
        }
      }

      // If changedKeys includes deletions, ensure the UI map drops them too
      if (changedKeys && changedKeys.length > 0) {
        for (const k of changedKeys) {
          if (!cells.has(k) && prevMap.has(k)) {
            ensureNext().delete(k);
          }
        }
      }

      if (!nextMap) return prev;
      return { displayByCell: nextMap };
    });
  }, [cells]);

  return useMemo(() => view, [view]);
}