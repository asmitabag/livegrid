"use client";

import { useCallback, useMemo, useState } from "react";
import type { SessionUser } from "@/models";
import {
  clearSessionUserStorage,
  readSessionUserFromStorage,
  writeSessionUserToStorage
} from "@/lib/session/storage";
import { createLocalSessionUser } from "@/lib/session/createSessionUser";

export type SessionUserState = Readonly<{
  user: SessionUser | null;
  setDisplayName: (displayName: string) => void;
  clear: () => void;
}>;

function getInitialUser(): SessionUser | null {
  return readSessionUserFromStorage();
}

export function useSessionUser(): SessionUserState {
  const [user, setUser] = useState<SessionUser | null>(getInitialUser);

  const setDisplayName = useCallback((displayName: string) => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) return;

    setUser((prev) => {
      const next: SessionUser =
        prev?.userId ? { ...prev, displayName: trimmed } : createLocalSessionUser(trimmed);

      writeSessionUserToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearSessionUserStorage();
    setUser(null);
  }, []);

  return useMemo(() => ({ user, setDisplayName, clear }), [user, setDisplayName, clear]);
}