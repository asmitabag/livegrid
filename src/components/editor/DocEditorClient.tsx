"use client";

import Link from "next/link";
import { useEffect, useMemo, useCallback } from "react";
import { SheetToolbar } from "@/components/editor/SheetToolbar";
import { FormulaBar } from "@/components/editor/FormulaBar";
import { SpreadsheetGrid } from "@/components/editor/SpreadsheetGrid";
import { WriteStatus } from "@/components/editor/WriteStatus";
import { CollaboratorPresence } from "@/components/presence/CollaboratorPresence";

import { useSessionUser } from "@/lib/session/useSessionUser";
import { useDocumentCells } from "@/lib/firestore/useDocumentCells";
import { useDocument } from "@/lib/firestore/useDocument";
import { upsertCell } from "@/lib/firestore/cells";
import { useSpreadsheetEditor } from "@/lib/editor/useSpreadsheetEditor";
import type { CellCoord } from "@/lib/grid/coords";
import type { CellFormatting, CellValue } from "@/models";
import { useDocumentPresence } from "@/lib/presence/useDocumentPresence";
import { useGridLayout } from "@/lib/editor/useGridLayout";
import { coordToKey } from "@/lib/grid/keys";
import { useSpreadsheetEngine } from "@/lib/editor/useSpreadsheetEngine";

export function DocEditorClient({ docId }: { docId: string }) {
  const { user } = useSessionUser();
  const { cells: remoteCells, isLoading, error } = useDocumentCells(docId);
  const { document } = useDocument(docId);

  const rows = 40;
  const cols = 14;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-border bg-white p-6 shadow-soft">
          <div className="text-sm font-semibold">Missing identity</div>
          <div className="mt-2 text-sm text-text-muted">
            Please go back to the dashboard and set your display name.
          </div>
          <div className="mt-4">
            <Link
              href="/"
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:bg-white"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const editor = useSpreadsheetEditor({
    docId,
    remoteCells,
    user,
    upsertCell: async (coord: CellCoord, value: CellValue, formatting?: CellFormatting) => {
      await upsertCell(docId, {
        coord,
        rawValue: value,
        updatedBy: user.userId,
        ...(formatting !== undefined ? { formatting } : {})
      });
    }
  });

  // engine for export CSV display (computed)
  const engine = useSpreadsheetEngine(editor.state.cells);

  const layout = useGridLayout(docId, rows, cols);
  const presence = useDocumentPresence(docId, user);

  useEffect(() => {
    presence.setSelectedCell(editor.state.selection.focus);
  }, [editor.state.selection.focus, presence]);

  const getDisplayText = useCallback(
    (r: number, underlyingCol: number) => {
      const key = coordToKey({ row: r, col: underlyingCol });
      const d = engine.displayByCell.get(key as any);
      if (d) return d.text ?? "";
      const raw = editor.state.cells.get(key as any)?.value ?? null;
      return raw === null ? "" : String(raw);
    },
    [engine.displayByCell, editor.state.cells]
  );

  const getExportCells = useCallback(() => {
    // Export sparse only (keeps JSON small)
    const out: {
      row: number;
      col: number;
      rawValue: unknown;
      formatting: unknown;
      updatedAt?: string;
      updatedBy?: string;
    }[] = [];

    for (const [, cell] of editor.state.cells.entries()) {
      out.push({
        row: cell.address.row,
        col: cell.address.col,
        rawValue: cell.value ?? null,
        formatting: cell.formatting ?? {},
        updatedAt: cell.updatedAt,
        updatedBy: cell.updatedBy
      });
    }
    return out;
  }, [editor.state.cells]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-3 flex items-center justify-end">
        <Link
          href="/"
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:bg-white"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
        <SheetToolbar
          editor={editor}
          layout={layout}
          rows={rows}
          cols={cols}
          getDisplayText={getDisplayText}
          getExportCells={getExportCells}
          docId={docId}
          document={document}
        />
        <FormulaBar editor={editor} />
        <div className="border-t border-border">
          <CollaboratorPresence collaborators={presence.active} myUserId={user.userId} />
        </div>
        <WriteStatus state={editor.state.write} hasSavedOnce={editor.state.hasSavedOnce} />
      </div>

      <div className="mt-4">
        <SpreadsheetGrid editor={editor} rows={rows} cols={cols} layout={layout} />
      </div>
    </main>
  );
}