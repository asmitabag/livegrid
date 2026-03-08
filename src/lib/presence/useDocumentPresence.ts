"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PresenceRecord } from "@/lib/presence/types";
import {
  cleanupStalePresence,
  subscribeToPresence,
  updatePresenceHeartbeat,
  updatePresenceSelectedCell,
  upsertPresence
} from "@/lib/firestore/presence";
import type { SessionUser } from "@/models";
import { colorForUserId } from "@/lib/presence/colors";
import type { CellCoord } from "@/lib/grid/coords";
import { coordToA1 } from "@/lib/presence/a1";

export type DocumentPresenceState = Readonly<{
  isLoading: boolean;
  error: string | null;
  active: readonly PresenceRecord[];
  me: PresenceRecord | null;
  setSelectedCell: (coord: CellCoord) => void;
}>;

const HEARTBEAT_MS = 15_000;
const ACTIVE_MS = 45_000;
const STALE_MS = 120_000;
const SELECTION_DEBOUNCE_MS = 350;

function firstNonEmpty(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const s = c.trim();
    if (s) return s;
  }
  return null;
}

function deriveName(user: SessionUser): string {
  // Your SessionUser may not use `name`. Try common alternatives.
  const u = user as unknown as {
    userId?: string;
    name?: string;
    displayName?: string;
    fullName?: string;
    username?: string;
    email?: string;
  };

  const picked =
    firstNonEmpty(u.name, u.displayName, u.fullName, u.username) ??
    // email prefix can be decent if present
    (typeof u.email === "string" && u.email.includes("@") ? u.email.split("@")[0]!.trim() : null) ??
    null;

  if (picked) return picked;

  const id = typeof u.userId === "string" ? u.userId : "user";
  return `User ${id.slice(-4)}`;
}

export function useDocumentPresence(docId: string, user: SessionUser | null): DocumentPresenceState {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<readonly PresenceRecord[]>([]);

  const selectionTimerRef = useRef<number | null>(null);
  const lastSentSelectionRef = useRef<string | null>(null);

  const userColor = useMemo(() => (user ? colorForUserId(user.userId) : "#64748B"), [user]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsub = subscribeToPresence(
      docId,
      (recs) => {
        setRecords(recs);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsub;
  }, [docId]);

  useEffect(() => {
    if (!user) return;

    const name = deriveName(user);

    upsertPresence(docId, {
      userId: user.userId,
      name,
      color: userColor
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Presence join failed"));
  }, [docId, user, userColor]);

  useEffect(() => {
    if (!user) return;

    const t = window.setInterval(() => {
      updatePresenceHeartbeat(docId, user.userId).catch(() => {});
    }, HEARTBEAT_MS);

    return () => window.clearInterval(t);
  }, [docId, user]);

  useEffect(() => {
    if (records.length === 0) return;
    cleanupStalePresence(docId, records, STALE_MS).catch(() => {});
  }, [docId, records]);

  const setSelectedCell = useCallback(
    (coord: CellCoord) => {
      if (!user) return;

      const a1 = coordToA1(coord);
      if (lastSentSelectionRef.current === a1) return;

      if (selectionTimerRef.current) window.clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = window.setTimeout(() => {
        lastSentSelectionRef.current = a1;
        updatePresenceSelectedCell(docId, user.userId, a1).catch(() => {});
      }, SELECTION_DEBOUNCE_MS);
    },
    [docId, user]
  );

  const active = useMemo(() => {
    const now = Date.now();
    const filtered = records.filter((r) => {
      const t = r.lastSeen?.toMillis?.();
      if (!t) return false;
      return now - t <= ACTIVE_MS;
    });

    const meId = user?.userId ?? null;
    filtered.sort((a, b) => {
      if (meId && a.userId === meId) return -1;
      if (meId && b.userId === meId) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [records, user?.userId]);

  const me = useMemo(() => {
    if (!user) return null;
    return active.find((r) => r.userId === user.userId) ?? null;
  }, [active, user]);

  return useMemo(
    () => ({
      isLoading,
      error,
      active,
      me,
      setSelectedCell
    }),
    [isLoading, error, active, me, setSelectedCell]
  );
}