"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { columnIndexToLabel } from "@/lib/grid/coords";
import { cn } from "@/lib/utils/cn";
import type { SpreadsheetEditorApi } from "@/lib/editor/useSpreadsheetEditor";
import { CellView } from "@/components/editor/CellView";
import { coordToKey } from "@/lib/grid/keys";
import { useSpreadsheetEngine } from "@/lib/editor/useSpreadsheetEngine";
import type { GridLayoutApi } from "@/lib/editor/useGridLayout";

type Props = Readonly<{
  editor: SpreadsheetEditorApi;
  rows: number;
  cols: number;
  layout: GridLayoutApi;
}>;

const ROW_HEADER_W = 56;
const COL_HEADER_H = 38;
const RESIZE_GUTTER_PX = 12;
const GRID_SCROLL_MAX_H = "calc(100dvh - 240px)";

export function SpreadsheetGrid({ editor, rows, cols, layout }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const engine = useSpreadsheetEngine(editor.state.cells);

  const [reorderUi, setReorderUi] = useState<
    null | Readonly<{ fromVisible: number; overVisible: number }>
  >(null);
  const dragRef = useRef<null | { fromVisible: number; overVisible: number }>(null);

  const focusGrid = useCallback(() => {
    scrollerRef.current?.focus({ preventScroll: true });
  }, []);

  const clampCoord = useCallback(
    (r: number, cUnderlying: number) => ({
      row: Math.max(0, Math.min(rows - 1, r)),
      col: Math.max(0, Math.min(cols - 1, cUnderlying))
    }),
    [rows, cols]
  );

  const visibleToUnderlying = useCallback(
    (visibleCol: number) => layout.state.colOrder[visibleCol] ?? visibleCol,
    [layout.state.colOrder]
  );

  const underlyingToVisible = useCallback(
    (underlyingCol: number) => {
      const idx = layout.state.colOrder.indexOf(underlyingCol);
      return idx >= 0 ? idx : underlyingCol;
    },
    [layout.state.colOrder]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (editor.state.editing.isEditing) return;

      const { row, col: underlyingCol } = editor.state.selection.focus;
      const visibleCol = underlyingToVisible(underlyingCol);

      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        editor.beginEdit();
        editor.setDraft(e.key);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        editor.cancelEdit();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        const nextVisible = Math.max(0, Math.min(cols - 1, visibleCol + dir));
        editor.selectCell(clampCoord(row, visibleToUnderlying(nextVisible)));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        editor.selectCell(clampCoord(row + dir, underlyingCol));
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        editor.selectCell(clampCoord(row + 1, underlyingCol));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        editor.selectCell(clampCoord(row - 1, underlyingCol));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextVisible = Math.max(0, Math.min(cols - 1, visibleCol + 1));
        editor.selectCell(clampCoord(row, visibleToUnderlying(nextVisible)));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const nextVisible = Math.max(0, Math.min(cols - 1, visibleCol - 1));
        editor.selectCell(clampCoord(row, visibleToUnderlying(nextVisible)));
        return;
      }
    },
    [editor, cols, clampCoord, visibleToUnderlying, underlyingToVisible]
  );

  const colLabels = useMemo(
    () => Array.from({ length: cols }, (_, v) => columnIndexToLabel(v)),
    [cols]
  );
  const rowNumbers = useMemo(
    () => Array.from({ length: rows }, (_, r) => String(r + 1)),
    [rows]
  );

  const startColResize = useCallback(
    (e: React.PointerEvent, visibleCol: number) => {
      e.preventDefault();
      e.stopPropagation();

      const underlying = visibleToUnderlying(visibleCol);
      const startX = e.clientX;
      const startW = layout.state.colWidths[underlying] ?? 120;

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      let raf = 0;
      let latestX = startX;

      const onMove = (ev: PointerEvent) => {
        latestX = ev.clientX;
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          layout.setColWidth(underlying, startW + (latestX - startX));
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (raf) window.cancelAnimationFrame(raf);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
    },
    [layout, visibleToUnderlying]
  );

  const startRowResize = useCallback(
    (e: React.PointerEvent, row: number) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startH = layout.state.rowHeights[row] ?? 32;

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      let raf = 0;
      let latestY = startY;

      const onMove = (ev: PointerEvent) => {
        latestY = ev.clientY;
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          layout.setRowHeight(row, startH + (latestY - startY));
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (raf) window.cancelAnimationFrame(raf);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
    },
    [layout]
  );

  const startColDrag = useCallback(
    (e: React.PointerEvent, fromVisible: number) => {
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const scroller = scrollerRef.current;
      if (!scroller) return;

      const headerRowEl = scroller.querySelector(
        "[data-livegrid-col-header-row]"
      ) as HTMLDivElement | null;
      const headerRect = headerRowEl?.getBoundingClientRect();
      if (!headerRect) return;

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      dragRef.current = { fromVisible, overVisible: fromVisible };
      setReorderUi({ fromVisible, overVisible: fromVisible });

      const computeOver = (clientX: number) => {
        const x = clientX - headerRect.left;
        let acc = 0;
        let over = 0;

        for (let v = 0; v < cols; v++) {
          const underlying = visibleToUnderlying(v);
          const w = layout.state.colWidths[underlying] ?? 120;
          if (x >= acc && x < acc + w) {
            over = v;
            break;
          }
          acc += w;
        }
        return over;
      };

      const onMove = (ev: PointerEvent) => {
        const over = computeOver(ev.clientX);
        const cur = dragRef.current;
        if (!cur) return;
        if (cur.overVisible === over) return;

        dragRef.current = { ...cur, overVisible: over };
        setReorderUi({ fromVisible: cur.fromVisible, overVisible: over });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        const cur = dragRef.current;
        dragRef.current = null;
        setReorderUi(null);

        if (cur && cur.fromVisible !== cur.overVisible) {
          layout.reorderColumns(cur.fromVisible, cur.overVisible);
        }
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
    },
    [cols, layout, visibleToUnderlying]
  );

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft">
      <div
        ref={scrollerRef}
        className="overflow-auto outline-none"
        style={{ maxHeight: GRID_SCROLL_MAX_H }}
        tabIndex={0}
        role="grid"
        aria-rowcount={rows}
        aria-colcount={cols}
        onKeyDown={onKeyDown}
        onMouseDown={() => focusGrid()}
      >
        {/* Put everything in a w-fit wrapper so borders span the full scroll width */}
        <div className="w-fit">
          {/* Sticky header row: corner + column headers */}
          <div className="sticky top-0 z-30 flex bg-surface-2">
            <div
              className="shrink-0 border-b border-r border-border"
              style={{ width: ROW_HEADER_W, height: COL_HEADER_H }}
            />
            <div className="border-b border-border" style={{ height: COL_HEADER_H }}>
              <div data-livegrid-col-header-row className="flex">
                {colLabels.map((label, v) => {
                  const underlying = visibleToUnderlying(v);
                  const w = layout.state.colWidths[underlying] ?? 120;

                  const isDragFrom = reorderUi?.fromVisible === v;
                  const isOver = reorderUi?.overVisible === v;

                  return (
                    <div
                      key={label}
                      className={cn(
                        "relative flex items-stretch select-none border-r border-border/70",
                        "text-sm font-semibold text-text-muted"
                      )}
                      style={{ width: w, height: COL_HEADER_H, opacity: isDragFrom ? 0.6 : 1 }}
                    >
                      <div
                        className="flex min-w-0 flex-1 items-center justify-center cursor-grab active:cursor-grabbing"
                        onPointerDown={(ev) => startColDrag(ev, v)}
                        style={{ touchAction: "none" }}
                        title="Drag to reorder column"
                      >
                        <span className="truncate">{label}</span>
                      </div>

                      <div
                        onPointerDown={(ev) => startColResize(ev, v)}
                        className="relative shrink-0 cursor-col-resize"
                        style={{ width: RESIZE_GUTTER_PX, touchAction: "none" }}
                        title="Drag to resize column"
                      >
                        <div className="absolute right-[5px] top-0 h-full w-[2px] bg-slate-400/60" />
                      </div>

                      {reorderUi && isOver ? (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-600" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body: row header + grid */}
          <div className="flex">
            <div className="shrink-0" style={{ width: ROW_HEADER_W }}>
              {rowNumbers.map((label, r) => {
                const h = layout.state.rowHeights[r] ?? 32;
                return (
                  <div
                    key={label}
                    className={cn(
                      "relative flex items-center justify-center",
                      "border-b border-r border-border/70 bg-surface-2",
                      "text-sm font-medium text-text-muted"
                    )}
                    style={{ height: h }}
                  >
                    {label}
                    <div
                      onPointerDown={(ev) => startRowResize(ev, r)}
                      className="absolute bottom-0 left-0 right-0 h-[10px] cursor-row-resize"
                      style={{ touchAction: "none", background: "transparent" }}
                      title="Drag to resize row"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              {Array.from({ length: rows }, (_, r) => {
                const h = layout.state.rowHeights[r] ?? 32;
                return (
                  <div key={r} className="flex" style={{ height: h }}>
                    {Array.from({ length: cols }, (_, v) => {
                      const underlyingCol = visibleToUnderlying(v);
                      const w = layout.state.colWidths[underlyingCol] ?? 120;

                      const key = coordToKey({ row: r, col: underlyingCol });
                      const d = engine.displayByCell.get(key);

                      return (
                        <CellView
                          key={`${r},${underlyingCol}`}
                          coord={{ row: r, col: underlyingCol }}
                          editor={editor}
                          width={w}
                          height={h}
                          focusGrid={focusGrid}
                          displayText={d?.text}
                          displayError={d?.error ?? null}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-white px-4 py-3 text-sm text-text-muted">
        Selected:{" "}
        <span className="font-semibold text-text">
          {colLabels[underlyingToVisible(editor.state.selection.focus.col)]}
          {editor.state.selection.focus.row + 1}
        </span>
      </div>
    </div>
  );
}