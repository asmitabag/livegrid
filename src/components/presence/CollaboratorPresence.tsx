"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PresenceRecord } from "@/lib/presence/types";

function initials(name: unknown): string {
  const safe = typeof name === "string" ? name : "";
  const parts = safe.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function presenceLine(p: PresenceRecord): string {
  const who = p.name?.trim?.() ? p.name : "Anonymous";
  if (p.selectedCell) return `${who} • viewing ${p.selectedCell}`;
  return `${who} • viewing the sheet`;
}

export function CollaboratorPresence({
  collaborators,
  myUserId
}: {
  collaborators: readonly PresenceRecord[];
  myUserId: string | null;
}) {
  const [hovered, setHovered] = useState<PresenceRecord | null>(null);

  const shown = useMemo(() => collaborators.slice(0, 8), [collaborators]);
  const extra = Math.max(0, collaborators.length - shown.length);

  const label = hovered
    ? presenceLine(hovered)
    : collaborators.length
      ? "Collaborators"
      : "No one else is here yet";

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2">
      <div className="flex items-center -space-x-2">
        {shown.map((p) => {
          const me = myUserId && p.userId === myUserId;
          return (
            <button
              key={p.userId}
              type="button"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "relative inline-flex h-8 w-8 items-center justify-center rounded-full",
                "border border-white shadow-soft",
                "text-xs font-semibold text-white",
                "transition-transform hover:-translate-y-[1px]",
                "focus-ring",
                me && "ring-2 ring-blue-600"
              )}
              style={{ backgroundColor: p.color || "#64748B" }}
              aria-label={presenceLine(p)}
              title={presenceLine(p)}
            >
              {initials(p.name)}
            </button>
          );
        })}

        {extra > 0 ? (
          <div
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full",
              "border border-white bg-slate-600 text-xs font-semibold text-white shadow-soft"
            )}
            title={`${extra} more collaborator${extra === 1 ? "" : "s"}`}
          >
            +{extra}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="truncate text-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}