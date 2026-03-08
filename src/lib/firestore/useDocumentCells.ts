"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cell } from "@/models";
import type { SparseCellMap } from "@/lib/grid/sparseCells";
import { coordToKey, type CellKey } from "@/lib/grid/keys";
import {
  collection,
  onSnapshot,
  query,
  type QuerySnapshot,
  type DocumentData
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

const SUBCOLLECTION = "cells";

type CellsState = Readonly<{
  isLoading: boolean;
  error: string | null;
  cells: SparseCellMap;
}>;

function cellFromDoc(doc: DocumentData): Cell | null {
  // Expect the schema used in your firestore/cells.ts recordToCell mapping
  // We keep this defensive so bad docs don't crash rendering.
  try {
    const row = Number(doc.row);
    const col = Number(doc.col);
    if (!Number.isInteger(row) || row < 0) return null;
    if (!Number.isInteger(col) || col < 0) return null;

    return {
      id: String(doc.cellId ?? `${row},${col}`),
      address: { row, col },
      value: (doc.rawValue ?? null) as Cell["value"],
      formatting: (doc.formatting ?? {}) as Cell["formatting"],
      updatedAt: new Date().toISOString(),
      updatedBy: String(doc.updatedBy ?? "unknown")
    };
  } catch {
    return null;
  }
}

function cellsCollectionRef(docId: string) {
  return collection(getDb(), "documents", docId, SUBCOLLECTION);
}

export function useDocumentCells(docId: string): CellsState {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // keep as mutable Map underneath, exposed as ReadonlyMap via type
  const [cells, setCells] = useState<SparseCellMap>(() => new Map<CellKey, Cell>());

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const q = query(cellsCollectionRef(docId));

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot) => {
        setCells((prev) => {
          const next = new Map(prev) as Map<CellKey, Cell>;
          let changed = false;

          for (const ch of snap.docChanges()) {
            const data = ch.doc.data();
            const cell = cellFromDoc(data);
            if (!cell) continue;

            const key = coordToKey(cell.address);

            if (ch.type === "removed") {
              if (next.has(key)) {
                next.delete(key);
                changed = true;
              }
              continue;
            }

            const prevCell = next.get(key);
            // cheap equality check to avoid useless state updates
            const same =
              prevCell &&
              prevCell.value === cell.value &&
              JSON.stringify(prevCell.formatting ?? {}) === JSON.stringify(cell.formatting ?? {});

            if (!same) {
              next.set(key, cell);
              changed = true;
            }
          }

          return changed ? next : prev;
        });

        setIsLoading(false);
      },
      (e) => {
        setError(e instanceof Error ? e.message : "Firestore cells subscribe error");
        setIsLoading(false);
      }
    );

    return unsub;
  }, [docId]);

  return useMemo(() => ({ isLoading, error, cells }), [isLoading, error, cells]);
}