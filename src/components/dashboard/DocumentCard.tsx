"use client";

import { useState } from "react";
import Link from "next/link";
import type { Document as LiveGridDocument } from "@/models";
import { formatShortDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { deleteDocument } from "@/lib/firestore/documents";

type Props = Readonly<{
  doc: LiveGridDocument;
}>;

export function DocumentCard({ doc }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteDocument(doc.id);
    } catch {
      alert("Failed to delete document. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Link
      href={`/docs/${doc.id}`}
      className={cn(
        "group relative block rounded-xl border border-border bg-white p-5 shadow-soft",
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

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete document"
            className={cn(
              "rounded-md p-1 text-text-muted opacity-0 transition",
              "hover:bg-red-50 hover:text-red-600",
              "group-hover:opacity-100",
              deleting && "opacity-50"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>

          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-text-muted">
            Open
          </span>
        </div>
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