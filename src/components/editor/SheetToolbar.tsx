"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { SpreadsheetEditorApi } from "@/lib/editor/useSpreadsheetEditor";
import { coordToKey } from "@/lib/grid/keys";
import type { CellFormatting, Document } from "@/models";
import type { GridLayoutApi } from "@/lib/editor/useGridLayout";
import { updateDocumentTitle } from "@/lib/firestore/documents";

type Props = Readonly<{
  editor: SpreadsheetEditorApi;
  layout: GridLayoutApi;
  rows: number;
  cols: number;
  getDisplayText: (row: number, underlyingCol: number) => string;
  getExportCells: () => readonly {
    row: number;
    col: number;
    rawValue: unknown;
    formatting: unknown;
    updatedAt?: string;
    updatedBy?: string;
  }[];
  docId: string;
  document: Document | null;
}>;

function toggle(fmt: CellFormatting | undefined, key: "bold" | "italic"): CellFormatting {
  const next: CellFormatting = { ...(fmt ?? {}) };
  (next as any)[key] = !Boolean((fmt as any)?.[key]);
  return next;
}

function ToolButton(props: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  pressed?: boolean;
  variant?: "default" | "primary";
}) {
  const variant = props.variant ?? "default";

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold",
        "shadow-sm focus-ring",
        variant === "primary"
          ? "border-blue-700/20 bg-blue-600 text-white hover:bg-blue-700"
          : "border-border bg-white text-text hover:bg-surface-2",
        props.pressed && "bg-slate-900 text-white hover:bg-slate-900 border-slate-900"
      )}
      aria-pressed={Boolean(props.pressed)}
      title={props.title}
    >
      {props.children}
    </button>
  );
}

export function SheetToolbar({
  editor,
  layout,
  rows,
  cols,
  getDisplayText,
  getExportCells,
  docId,
  document
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  
  const sel = editor.state.selection.focus;
  const key = coordToKey(sel);

  const selectedCell = editor.state.cells.get(key);
  const fmt = (selectedCell?.formatting ?? {}) as CellFormatting;

  const boldActive = Boolean(fmt.bold);
  const italicActive = Boolean(fmt.italic);
  const textColor = fmt.textColor ?? "#111827";

  const summary = useMemo(() => {
    const bits: string[] = [];
    if (boldActive) bits.push("Bold");
    if (italicActive) bits.push("Italic");
    if (fmt.textColor) bits.push(`Color ${fmt.textColor}`);
    return bits.length ? bits.join(" • ") : "Default";
  }, [boldActive, italicActive, fmt.textColor]);

  const handleTitleClick = () => {
    if (document?.title) {
      setEditedTitle(document.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== document?.title) {
      await updateDocumentTitle(docId, editedTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-base font-semibold tracking-tight text-text border-b-2 border-blue-500 bg-transparent outline-none"
            autoFocus
          />
        ) : (
          <div
            onClick={handleTitleClick}
            className="text-base font-semibold tracking-tight text-text cursor-pointer hover:text-blue-600 transition-colors"
            title="Click to edit document name"
          >
            {document?.title || "Loading..."}
          </div>
        )}
        <div className="hidden text-xs text-text-muted sm:block mt-1">{summary}</div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ToolButton title="Bold" onClick={() => editor.applyFormatting(sel, toggle(fmt, "bold"))} pressed={boldActive}>
          <span className="font-bold">B</span>
        </ToolButton>

        <ToolButton title="Italic" onClick={() => editor.applyFormatting(sel, toggle(fmt, "italic"))} pressed={italicActive}>
          <span className="italic font-serif">I</span>
        </ToolButton>

        <label
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-white",
            "shadow-sm cursor-pointer",
            "hover:bg-surface-2",
            "focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:ring-offset-2 focus-within:ring-offset-white"
          )}
          title="Text color"
        >
          <input
            aria-label="Text color"
            type="color"
            value={textColor}
            onChange={(e) =>
              editor.applyFormatting(sel, {
                ...(fmt ?? {}),
                textColor: e.target.value
              })
            }
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>

        <ToolButton
          title="Export CSV"
          variant="primary"
          onClick={() => layout.exportCsv({ rows, cols, getDisplayText })}
        >
          Export CSV
        </ToolButton>

        <ToolButton
          title="Export JSON"
          onClick={() =>
            layout.exportJson({
              docId,
              layout: layout.state,
              cells: getExportCells()
            })
          }
        >
          Export JSON
        </ToolButton>
      </div>
    </div>
  );
}