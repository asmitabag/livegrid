"use client";

import type { WriteState } from "@/lib/editor/writeState";

export function WriteStatus({
  state,
  hasSavedOnce
}: {
  state: WriteState;
  hasSavedOnce: boolean;
}) {
  if (state.status === "idle") {
    return (
      <div className="flex items-center justify-end gap-2 px-4 py-2 text-xs text-text-muted">
        <span className="inline-flex h-2 w-2 rounded-full bg-slate-400/70" />
        <span>{hasSavedOnce ? "Saved" : "Ready"}</span>
      </div>
    );
  }

  if (state.status === "saving") {
    return (
      <div className="flex items-center justify-end gap-2 px-4 py-2 text-xs text-text-muted">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500/80" />
        <span>Saving…</span>
      </div>
    );
  }

  if (state.status === "saved") {
    return (
      <div className="flex items-center justify-end gap-2 px-4 py-2 text-xs text-text-muted">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/70" />
        <span>Saved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 px-4 py-2 text-xs">
      <span className="inline-flex h-2 w-2 rounded-full bg-red-500/80" />
      <span className="text-red-600">Error</span>
      <span className="text-text-muted">{state.message}</span>
    </div>
  );
}