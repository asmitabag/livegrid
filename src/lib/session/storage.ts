import type { SessionUser } from "@/models";

const STORAGE_KEY = "livegrid.sessionUser.v1";

type StoredSessionUser = Readonly<{
  userId: string;
  displayName: string;
  color: string;
  email?: string;
  photoURL?: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredSessionUser(value: unknown): value is StoredSessionUser {
  if (!isRecord(value)) return false;
  return (
    typeof value.userId === "string" &&
    typeof value.displayName === "string" &&
    typeof value.color === "string"
  );
}

export function readSessionUserFromStorage(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSessionUser(parsed)) return null;

    const user: SessionUser = {
      userId: parsed.userId,
      displayName: parsed.displayName,
      color: parsed.color,
      email: parsed.email,
      photoURL: parsed.photoURL
    };
    return user;
  } catch {
    return null;
  }
}

export function writeSessionUserToStorage(user: SessionUser): void {
  if (typeof window === "undefined") return;
  const toStore: StoredSessionUser = {
    userId: user.userId,
    displayName: user.displayName,
    color: user.color,
    email: user.email,
    photoURL: user.photoURL
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function clearSessionUserStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
