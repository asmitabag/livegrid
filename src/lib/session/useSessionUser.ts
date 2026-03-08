"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/models";
import {
  clearSessionUserStorage,
  readSessionUserFromStorage,
  writeSessionUserToStorage
} from "@/lib/session/storage";
import { createLocalSessionUser } from "@/lib/session/createSessionUser";
import { getFirebaseAuth, onAuthStateChanged, signOut as firebaseSignOut } from "@/lib/firebase/auth";
import { userColor } from "@/lib/utils/colors";

export type SessionUserState = Readonly<{
  user: SessionUser | null;
  setDisplayName: (displayName: string) => void;
  clear: () => void;
  isGoogleUser: boolean;
  signOutGoogle: () => Promise<void>;
}>;

function getInitialUser(): SessionUser | null {
  return readSessionUserFromStorage();
}

export function useSessionUser(): SessionUserState {
  const [user, setUser] = useState<SessionUser | null>(getInitialUser);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Listen to Firebase Auth state — if a Google user signs in, adopt that identity.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const sessionUser: SessionUser = {
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? "Anonymous",
          email: firebaseUser.email ?? undefined,
          photoURL: firebaseUser.photoURL ?? undefined,
          color: userColor(firebaseUser.uid)
        };
        writeSessionUserToStorage(sessionUser);
        setUser(sessionUser);
        setIsGoogleUser(true);
      } else {
        setIsGoogleUser(false);
        // Don't clear local session user — keep the display-name-only identity.
      }
    });
    return unsubscribe;
  }, []);

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
    setIsGoogleUser(false);
  }, []);

  const signOutGoogle = useCallback(async () => {
    await firebaseSignOut();
    clear();
  }, [clear]);

  return useMemo(
    () => ({ user, setDisplayName, clear, isGoogleUser, signOutGoogle }),
    [user, setDisplayName, clear, isGoogleUser, signOutGoogle]
  );
}
