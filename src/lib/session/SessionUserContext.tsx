"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const SessionUserContext = createContext<SessionUserState | null>(null);

export function SessionUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readSessionUserFromStorage());
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Listen to Firebase Auth state.
  // Gracefully no-ops if Firebase Auth is not yet enabled in the Firebase Console.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
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
          }
        },
        (error) => {
          console.warn("Firebase Auth unavailable:", error.message);
        }
      );
    } catch (err) {
      console.warn("Firebase Auth could not be initialised:", err);
    }
    return () => unsubscribe?.();
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

  const value = useMemo(
    () => ({ user, setDisplayName, clear, isGoogleUser, signOutGoogle }),
    [user, setDisplayName, clear, isGoogleUser, signOutGoogle]
  );

  return (
    <SessionUserContext.Provider value={value}>
      {children}
    </SessionUserContext.Provider>
  );
}

export function useSessionUser(): SessionUserState {
  const ctx = useContext(SessionUserContext);
  if (!ctx) throw new Error("useSessionUser must be used inside SessionUserProvider");
  return ctx;
}
