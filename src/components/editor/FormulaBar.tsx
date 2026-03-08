"use client";

import { toA1 } from "@/lib/grid/coords";
import { cn } from "@/lib/utils/cn";
import type { SpreadsheetEditorApi } from "@/lib/editor/useSpreadsheetEditor";

type Props = Readonly<{
  editor: SpreadsheetEditorApi;
}>;

export function FormulaBar({ editor }: Props) {
  const sel = editor.state.selection.focus;
  const a1 = toA1(sel);

  const isEditingThisCell =
    editor.state.editing.isEditing &&
    editor.state.editing.coord?.row === sel.row &&
    editor.state.editing.coord?.col === sel.col;

  const value = isEditingThisCell
    ? editor.state.editing.draft
    : (() => {
        const raw = editor.getCellRaw(sel);
        return raw === null ? "" : String(raw);
      })();

  return (
    <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-2.5">
      <div
        className={cn(
          "w-20 shrink-0 rounded-lg border border-border bg-surface-2 px-2 py-1",
          "text-xs font-semibold text-text"
        )}
      >
        <span className="font-mono">{a1}</span>
      </div>

      <input
        value={value}
        onChange={(e) => {
          if (!isEditingThisCell) editor.beginEdit(sel);
          editor.setDraft(e.target.value);
        }}
        onFocus={() => {
          if (!isEditingThisCell) editor.beginEdit(sel);
        }}
        onBlur={() => {
          if (isEditingThisCell) editor.commitEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor.commitEdit();
            (e.currentTarget as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            editor.cancelEdit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        placeholder='Value or formula (e.g. "=SUM(A1:A5)")'
        className={cn(
          "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm",
          "placeholder:text-text-muted/70",
          "focus-ring"
        )}
      />
    </div>
  );
}