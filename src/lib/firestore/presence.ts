import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QuerySnapshot
} from "firebase/firestore";

import { getDb } from "@/lib/firebase/firestore";
import type { PresenceRecord } from "@/lib/presence/types";

const SUBCOLLECTION = "presence";

type PresenceRecordDb = Readonly<{
  userId?: string;
  name?: string;
  color?: string;
  lastSeen?: unknown; // Timestamp
  selectedCell?: string;
}>;

const presenceConverter: FirestoreDataConverter<PresenceRecordDb> = {
  toFirestore: (value) => value as DocumentData,
  fromFirestore: (snap) => snap.data() as PresenceRecordDb
};

function presenceColRef(docId: string) {
  return collection(getDb(), "documents", docId, SUBCOLLECTION).withConverter(presenceConverter);
}

function presenceDocRef(docId: string, userId: string) {
  return doc(getDb(), "documents", docId, SUBCOLLECTION, userId).withConverter(presenceConverter);
}

export type UpsertPresenceInput = Readonly<{
  userId: string;
  name: string;
  color: string;
  selectedCell?: string;
}>;

export async function upsertPresence(docId: string, input: UpsertPresenceInput): Promise<void> {
  const payload: PresenceRecordDb = {
    userId: input.userId,
    name: input.name,
    color: input.color,
    lastSeen: serverTimestamp(),
    ...(input.selectedCell !== undefined ? { selectedCell: input.selectedCell } : {})
  };

  await setDoc(presenceDocRef(docId, input.userId), payload, { merge: true });
}

export async function updatePresenceHeartbeat(docId: string, userId: string): Promise<void> {
  await setDoc(presenceDocRef(docId, userId), { lastSeen: serverTimestamp() }, { merge: true });
}

export async function updatePresenceSelectedCell(
  docId: string,
  userId: string,
  selectedCell: string
): Promise<void> {
  await setDoc(
    presenceDocRef(docId, userId),
    { selectedCell, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

export async function removePresence(docId: string, userId: string): Promise<void> {
  await deleteDoc(presenceDocRef(docId, userId));
}

function sanitizePresence(raw: PresenceRecordDb, fallbackId: string): PresenceRecord | null {
  const userId = (raw.userId ?? fallbackId).trim();
  if (!userId) return null;

  const name = (raw.name ?? "Anonymous").trim() || "Anonymous";
  const color = (raw.color ?? "#64748B").trim() || "#64748B";

  const lastSeen = raw.lastSeen as PresenceRecord["lastSeen"] | undefined;
  if (!lastSeen || typeof (lastSeen as any).toMillis !== "function") return null;

  const selectedCell =
    raw.selectedCell !== undefined && raw.selectedCell !== null
      ? String(raw.selectedCell)
      : undefined;

  return { userId, name, color, lastSeen, ...(selectedCell ? { selectedCell } : {}) };
}

export function subscribeToPresence(
  docId: string,
  onChange: (records: readonly PresenceRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(presenceColRef(docId));

  return onSnapshot(
    q,
    (snap: QuerySnapshot<PresenceRecordDb>) => {
      const out: PresenceRecord[] = [];
      for (const d of snap.docs) {
        const rec = sanitizePresence(d.data(), d.id);
        if (rec) out.push(rec);
      }
      onChange(out);
    },
    (e) => onError?.(e instanceof Error ? e : new Error("Presence subscribe error"))
  );
}

export async function cleanupStalePresence(
  docId: string,
  records: readonly PresenceRecord[],
  staleMs: number
): Promise<void> {
  const now = Date.now();

  const stale = records.filter((r) => {
    const t = r.lastSeen?.toMillis?.();
    if (!t) return false;
    return now - t > staleMs;
  });

  await Promise.allSettled(stale.map((r) => removePresence(docId, r.userId)));
}