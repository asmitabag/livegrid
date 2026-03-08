"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CellValue, SessionUser, CellFormatting } from "@/models";
import type { CellCoord } from "@/lib/grid/coords";
import type { Selection } from "@/lib/grid/selection";
import { setSingleCellSelection } from "@/lib/grid/selection";
import {
  emptySparseCells,
  getCellValue,
  setCellValue,
  type SparseCellMap
} from "@/lib/grid/sparseCells";
import type { WriteState } from "@/lib/editor/writeState";
import type { Cell } from "@/models";
import type { CellKey } from "@/lib/grid/keys";
import { coordToKey } from "@/lib/grid/keys";

export type EditorState = Readonly<{
  cells: SparseCellMap; // merged (remote + local)
  selection: Selection;
  editing: Readonly<{
    isEditing: boolean;
    coord: CellCoord | null;
    draft: string;
  }>;
  write: WriteState;
  hasSavedOnce: boolean;
}>;

export type SpreadsheetEditorApi = Readonly<{
  state: EditorState;

  selectCell: (coord: CellCoord) => void;

  beginEdit: (coord?: CellCoord) => void;
  cancelEdit: () => void;

  setDraft: (value: string) => void;
  commitEdit: () => void;

  setCellRawLocal: (coord: CellCoord, value: CellValue) => void;
  getCellRaw: (coord: CellCoord) => CellValue;

  applyFormatting: (coord: CellCoord, formatting: CellFormatting) => void;
}>;

export type EditorSyncAdapter = Readonly<{
  docId: string;
  remoteCells: SparseCellMap;
  user: SessionUser;
  // IMPORTANT: sync layer supports formatting by putting it in Cell.value/formatting map entry via firestore upsert
  upsertCell: (coord: CellCoord, value: CellValue, formatting?: CellFormatting) => Promise<void>;
}>;

function coordEq(a: CellCoord, b: CellCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

function cellValueEq(a: CellValue, b: CellValue): boolean {
  return a === b;
}

function formattingEq(a: CellFormatting | undefined, b: CellFormatting | undefined): boolean {
  // shallow compare is enough for this small object
  const ak = a ? Object.keys(a) : [];
  const bk = b ? Object.keys(b) : [];
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if ((a as any)[k] !== (b as any)[k]) return false;
  }
  return true;
}

function mergeSparseCells(remote: SparseCellMap, local: SparseCellMap): SparseCellMap {
  if (local.size === 0) return remote;

  const merged = new Map<CellKey, Cell>();
  for (const [k, v] of remote.entries()) merged.set(k, v);
  for (const [k, v] of local.entries()) merged.set(k, v);
  return merged;
}

export function useSpreadsheetEditor(sync: EditorSyncAdapter): SpreadsheetEditorApi {
  const [selection, setSelection] = useState<Selection>(() =>
    setSingleCellSelection({ row: 0, col: 0 })
  );

  const [editing, setEditing] = useState<EditorState["editing"]>({
    isEditing: false,
    coord: null,
    draft: ""
  });

  // optimistic local overlay for values / formatting (not yet reflected remotely)
  const [localCells, setLocalCells] = useState<SparseCellMap>(() => emptySparseCells());

  const [write, setWrite] = useState<WriteState>({ status: "idle" });
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // UX timers
  const savedTimerRef = useRef<number | null>(null);
  const savingStartedAtRef = useRef<number | null>(null);
  const MIN_SAVING_MS = 300;

  // If remote matches local override, clear that override so the overlay stays small.
  useEffect(() => {
    if (localCells.size === 0) return;

    let changed = false;
    const next = new Map(localCells) as Map<CellKey, Cell>;

    for (const [k, localCell] of localCells.entries()) {
      const remoteCell = sync.remoteCells.get(k);
      const remoteValue = remoteCell?.value ?? null;
      const localValue = localCell.value ?? null;

      const remoteFmt = remoteCell?.formatting ?? {};
      const localFmt = localCell.formatting ?? {};

      if (cellValueEq(remoteValue, localValue) && formattingEq(remoteFmt, localFmt)) {
        next.delete(k);
        changed = true;
      }
    }

    if (changed) setLocalCells(next);
  }, [sync.remoteCells, localCells]);

  const mergedCells = useMemo(
    () => mergeSparseCells(sync.remoteCells, localCells),
    [sync.remoteCells, localCells]
  );

  const getCellRaw = useCallback(
    (coord: CellCoord) => getCellValue(mergedCells, coord),
    [mergedCells]
  );

  const setCellRawLocal = useCallback(
    (coord: CellCoord, value: CellValue) => {
      setLocalCells((prev) =>
        setCellValue(prev, {
          coord,
          value,
          userId: sync.user.userId
        })
      );
    },
    [sync.user.userId]
  );

  const selectCell = useCallback((coord: CellCoord) => {
    setSelection(setSingleCellSelection(coord));
    setEditing((e) => {
      // selecting another cell exits edit mode
      if (!e.isEditing) return e;
      if (e.coord && coordEq(e.coord, coord)) return e;
      return { isEditing: false, coord: null, draft: "" };
    });
  }, []);

  const beginEdit = useCallback(
    (coord?: CellCoord) => {
      const target = coord ?? selection.focus;
      const raw = getCellValue(mergedCells, target);
      setEditing({
        isEditing: true,
        coord: target,
        draft: raw === null ? "" : String(raw)
      });
    },
    [mergedCells, selection.focus]
  );

  const cancelEdit = useCallback(() => {
    setEditing({ isEditing: false, coord: null, draft: "" });
  }, []);

  const setDraft = useCallback((value: string) => {
    setEditing((e) => (e.isEditing ? { ...e, draft: value } : e));
  }, []);

  const startWrite = useCallback(() => {
    setWrite({ status: "saving" });
    savingStartedAtRef.current = Date.now();
  }, []);

  const finishWriteOk = useCallback(() => {
    const startedAt = savingStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_SAVING_MS - elapsed);

    window.setTimeout(() => {
      setHasSavedOnce(true);
      setWrite({ status: "saved", savedAt: Date.now() });

      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => {
        setWrite({ status: "idle" });
      }, 1200);
    }, remaining);
  }, []);

  const finishWriteErr = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : "Failed to save";
    setWrite({ status: "error", message });
  }, []);

  const commitEdit = useCallback(() => {
    setEditing((e) => {
      if (!e.isEditing || !e.coord) return e;

      const coord = e.coord;
      const nextValue: CellValue = e.draft;

      // Avoid unnecessary writes if nothing changed (string-compare)
      const current = getCellValue(mergedCells, coord);
      const currentStr = current === null ? "" : String(current);
      if (currentStr === e.draft) {
        return { isEditing: false, coord: null, draft: "" };
      }

      // Optimistic local update
      setCellRawLocal(coord, nextValue);

      // Persist (keep formatting as-is)
      const key = coordToKey(coord);
      const currentCell = mergedCells.get(key);
      const fmt = currentCell?.formatting ?? {};

      startWrite();
      sync
        .upsertCell(coord, nextValue, fmt)
        .then(finishWriteOk)
        .catch(finishWriteErr);

      return { isEditing: false, coord: null, draft: "" };
    });
  }, [mergedCells, setCellRawLocal, sync, startWrite, finishWriteOk, finishWriteErr]);

  const applyFormatting = useCallback(
    (coord: CellCoord, formatting: CellFormatting) => {
      const key = coordToKey(coord);
      const currentCell = mergedCells.get(key);
      const raw = currentCell?.value ?? null;
      const currentFmt = currentCell?.formatting ?? {};

      // avoid pointless writes
      if (formattingEq(currentFmt, formatting)) return;

      // optimistic local overlay: keep same raw value, just change formatting
      setLocalCells((prev) => {
        const prevCell = prev.get(key);
        const base: Cell = prevCell ?? currentCell ?? {
          id: key,
          address: coord,
          value: raw,
          formatting: {},
          updatedAt: new Date().toISOString(),
          updatedBy: sync.user.userId
        };

        const nextCell: Cell = {
          ...base,
          address: coord,
          value: raw,
          formatting,
          updatedAt: new Date().toISOString(),
          updatedBy: sync.user.userId
        };

        const next = new Map(prev) as Map<CellKey, Cell>;
        next.set(key, nextCell);
        return next;
      });

      // persist
      startWrite();
      sync
        .upsertCell(coord, raw, formatting)
        .then(finishWriteOk)
        .catch(finishWriteErr);
    },
    [mergedCells, sync.user.userId, startWrite, finishWriteOk, finishWriteErr, sync]
  );

  const state: EditorState = useMemo(
    () => ({
      cells: mergedCells,
      selection,
      editing,
      write,
      hasSavedOnce
    }),
    [mergedCells, selection, editing, write, hasSavedOnce]
  );

  return useMemo(
    () => ({
      state,
      selectCell,
      beginEdit,
      cancelEdit,
      setDraft,
      commitEdit,
      setCellRawLocal,
      getCellRaw,
      applyFormatting
    }),
    [
      state,
      selectCell,
      beginEdit,
      cancelEdit,
      setDraft,
      commitEdit,
      setCellRawLocal,
      getCellRaw,
      applyFormatting
    ]
  );
}