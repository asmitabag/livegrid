"use client";

import { useEffect, useState } from "react";
import { useSessionUser } from "@/lib/session/SessionUserContext";
import { cn } from "@/lib/utils/cn";

export function UserBadge() {
  const { user, clear, isGoogleUser, signOutGoogle } = useSessionUser();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: server render and first client render match.
  if (!mounted) {
    return <div className="h-9 w-40 rounded-full bg-black/10" />;
  }

  if (!user) {
    return <div className="h-9 w-40 rounded-full bg-black/10" />;
  }

  const handleSignOut = async () => {
    setMenuOpen(false);
    if (isGoogleUser) {
      await signOutGoogle();
    } else {
      clear();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm hover:bg-surface-2 transition"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: user.color }}
          />
        )}
        <span className={cn("max-w-[160px] truncate text-xs font-medium")}>
          {user.displayName}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-text-muted">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {menuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-white py-1 shadow-lg">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-xs font-medium truncate">{user.displayName}</div>
              {user.email && (
                <div className="text-xs text-text-muted truncate">{user.email}</div>
              )}
              <div className="mt-1 text-[10px] text-text-muted">
                {isGoogleUser ? "Signed in with Google" : "Guest session"}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.08-1.04l-2.25 2.33a.75.75 0 0 0 0 1.04l2.25 2.33a.75.75 0 1 0 1.08-1.04l-1.048-1.08H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
