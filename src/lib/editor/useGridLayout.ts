"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getDocumentLayout,
  upsertDocumentLayout,
  type DocumentLayout
} from "@/lib/firestore/documentLayout";

export type GridLayoutState = Readonly<{
  colOrder: readonly number[]; // visible -> underlying
  colWidths: readonly number[]; // underlying -> px
  rowHeights: readonly number[]; // row -> px
}>;

export type GridLayoutApi = Readonly<{
  state: GridLayoutState;

  setColWidth: (underlyingCol: number, px: number) => void;
  setRowHeight: (row: number, px: number) => void;
  reorderColumns: (fromVisible: number, toVisible: number) => void;

  exportCsv: (args: {
    rows: number;
    cols: number;
    getDisplayText: (row: number, colUnderlying: number) => string;
  }) => void;

  exportJson: (args: {
    docId: string;
    layout: GridLayoutState;
    cells: readonly {
      row: number;
      col: number;
      rawValue: unknown;
      formatting: unknown;
      updatedAt?: string;
      updatedBy?: string;
    }[];
  }) => void;
}>;

const DEFAULT_COL_W = 120;
const DEFAULT_ROW_H = 32;

const MIN_COL_W = 56;
const MAX_COL_W = 520;

const MIN_ROW_H = 24;
const MAX_ROW_H = 180;

const SAVE_DEBOUNCE_MS = 600;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function useGridLayout(docId: string, rows: number, cols: number): GridLayoutApi {
  const [state, setState] = useState<GridLayoutState>(() => ({
    colOrder: Array.from({ length: cols }, (_, i) => i),
    colWidths: Array.from({ length: cols }, () => DEFAULT_COL_W),
    rowHeights: Array.from({ length: rows }, () => DEFAULT_ROW_H)
  }));

  const loadedOnceRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  // Load from Firestore once per docId/size
  useEffect(() => {
    let cancelled = false;
    loadedOnceRef.current = false;

    (async () => {
      const layout = await getDocumentLayout(docId);
      if (cancelled) return;

      loadedOnceRef.current = true;

      if (!layout) return;

      setState((prev) => {
        const colOrder =
          Array.isArray(layout.colOrder) && layout.colOrder.length === cols
            ? layout.colOrder
            : prev.colOrder;

        const colWidths =
          Array.isArray(layout.colWidths) && layout.colWidths.length === cols
            ? layout.colWidths.map((w) => clamp(Number(w) || DEFAULT_COL_W, MIN_COL_W, MAX_COL_W))
            : prev.colWidths;

        const rowHeights =
          Array.isArray(layout.rowHeights) && layout.rowHeights.length === rows
            ? layout.rowHeights.map((h) => clamp(Number(h) || DEFAULT_ROW_H, MIN_ROW_H, MAX_ROW_H))
            : prev.rowHeights;

        return { colOrder, colWidths, rowHeights };
      });
    })().catch(() => {
      // ignore; layout is non-critical
      loadedOnceRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [docId, rows, cols]);

  // Persist debounced whenever state changes (after initial load)
  useEffect(() => {
    if (!loadedOnceRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const payload: DocumentLayout = {
        colOrder: state.colOrder,
        colWidths: state.colWidths,
        rowHeights: state.rowHeights
      };
      upsertDocumentLayout(docId, payload).catch(() => {});
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [state, docId]);

  const setColWidth = useCallback((underlyingCol: number, px: number) => {
    setState((prev) => {
      const nextWidths = prev.colWidths.slice();
      nextWidths[underlyingCol] = clamp(px, MIN_COL_W, MAX_COL_W);
      return { ...prev, colWidths: nextWidths };
    });
  }, []);

  const setRowHeight = useCallback((row: number, px: number) => {
    setState((prev) => {
      const nextHeights = prev.rowHeights.slice();
      nextHeights[row] = clamp(px, MIN_ROW_H, MAX_ROW_H);
      return { ...prev, rowHeights: nextHeights };
    });
  }, []);

  const reorderColumns = useCallback((fromVisible: number, toVisible: number) => {
    setState((prev) => {
      if (fromVisible === toVisible) return prev;
      const nextOrder = moveItem(prev.colOrder, fromVisible, toVisible);
      return { ...prev, colOrder: nextOrder };
    });
  }, []);

  const exportCsv = useCallback(
    (args: {
      rows: number;
      cols: number;
      getDisplayText: (row: number, colUnderlying: number) => string;
    }) => {
      const header = Array.from({ length: args.cols }, (_, visible) => `C${visible + 1}`);
      const lines: string[] = [];
      lines.push(header.map(csvEscape).join(","));

      for (let r = 0; r < args.rows; r++) {
        const rowVals: string[] = [];
        for (let v = 0; v < args.cols; v++) {
          const underlying = state.colOrder[v]!;
          rowVals.push(csvEscape(args.getDisplayText(r, underlying)));
        }
        lines.push(rowVals.join(","));
      }

      downloadText(`livegrid-${docId}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
    },
    [docId, state.colOrder]
  );

  const exportJson = useCallback(
    (args: {
      docId: string;
      layout: GridLayoutState;
      cells: readonly {
        row: number;
        col: number;
        rawValue: unknown;
        formatting: unknown;
        updatedAt?: string;
        updatedBy?: string;
      }[];
    }) => {
      const payload = {
        version: 1,
        docId: args.docId,
        exportedAt: new Date().toISOString(),
        layout: args.layout,
        cells: args.cells
      };

      downloadText(
        `livegrid-${args.docId}.json`,
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
      );
    },
    []
  );

  return useMemo(
    () => ({
      state,
      setColWidth,
      setRowHeight,
      reorderColumns,
      exportCsv,
      exportJson
    }),
    [state, setColWidth, setRowHeight, reorderColumns, exportCsv, exportJson]
  );
}