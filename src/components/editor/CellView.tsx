"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { CellCoord } from "@/lib/grid/coords";
import type { SpreadsheetEditorApi } from "@/lib/editor/useSpreadsheetEditor";
import { coordToKey } from "@/lib/grid/keys";

type Props = Readonly<{
  coord: CellCoord;
  editor: SpreadsheetEditorApi;
  width: number;
  height: number;
  focusGrid: () => void;
  displayText?: string;
  displayError?: string | null;
}>;

function coordEq(a: CellCoord, b: CellCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function CellView({
  coord,
  editor,
  width,
  height,
  focusGrid,
  displayText,
  displayError
}: Props) {
  const selected = coordEq(editor.state.selection.focus, coord);

  const isEditing =
    editor.state.editing.isEditing &&
    editor.state.editing.coord !== null &&
    coordEq(editor.state.editing.coord, coord);

  const raw = editor.getCellRaw(coord);
  const rawText = raw === null ? "" : String(raw);

  const key = coordToKey(coord);
  const cell = editor.state.cells.get(key);
  const fmt = cell?.formatting ?? {};

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      const input = inputRef.current;
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  const shown = displayText ?? rawText;

  const textStyle = useMemo<React.CSSProperties>(
    () => ({
      fontWeight: fmt.bold ? 700 : 400,
      fontStyle: fmt.italic ? "italic" : "normal",
      color: fmt.textColor ?? undefined
    }),
    [fmt.bold, fmt.italic, fmt.textColor]
  );

  return (
    <div
      role="gridcell"
      aria-selected={selected}
      onMouseDown={(e) => {
        e.preventDefault();
        focusGrid();
        editor.selectCell(coord);
      }}
      onDoubleClick={() => editor.beginEdit(coord)}
      className={cn(
        "relative flex items-center px-2.5 text-[13px] leading-none transition-colors",
        "border-r border-b border-border/70 bg-white",
        "hover:bg-surface-2/70",
        selected && "bg-blue-50/50",
        selected && "outline outline-2 outline-blue-600/80 outline-offset-[-2px]",
        displayError && !isEditing && "text-red-600"
      )}
      style={{ width, height }}
      tabIndex={-1}
      data-cellkey={key}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editor.state.editing.draft}
          onChange={(e) => editor.setDraft(e.target.value)}
          onBlur={() => editor.commitEdit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") editor.commitEdit();
            if (e.key === "Escape") editor.cancelEdit();
          }}
          className={cn("w-full bg-transparent text-[13px] focus:outline-none")}
          style={textStyle}
        />
      ) : (
        <span className="truncate" style={textStyle}>
          {shown}
        </span>
      )}
    </div>
  );
}