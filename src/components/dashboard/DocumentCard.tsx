"use client";

import Link from "next/link";
import type { Document as LiveGridDocument } from "@/models";
import { formatShortDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type Props = Readonly<{
  doc: LiveGridDocument;
}>;

export function DocumentCard({ doc }: Props) {
  return (
    <Link
      href={`/docs/${doc.id}`}
      className={cn(
        "group block rounded-xl border border-border bg-white p-5 shadow-soft",
        "transition",
        "hover:-translate-y-[1px] hover:border-black/10 hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_14px_34px_rgba(0,0,0,0.10)]",
        "focus-ring"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-text">
            {doc.title}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Author: <span className="text-text">{doc.authorName}</span>
          </div>
        </div>

        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-text-muted">
          Open
        </span>
      </div>

      <div className="mt-4 text-xs text-text-muted">
        Last modified:{" "}
        <span className="text-text">{formatShortDateTime(doc.lastModifiedAt)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
        <span className="rounded-md border border-border bg-surface-2 px-2 py-1">
          {doc.gridSize.rows}×{doc.gridSize.cols}
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">→</span>
      </div>
    </Link>
  );
}