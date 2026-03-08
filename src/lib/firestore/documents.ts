import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QuerySnapshot
} from "firebase/firestore";

import type { Document as LiveGridDocument, SessionUser } from "@/models";
import { getDb } from "@/lib/firebase/firestore";
import { createId } from "@/lib/utils/ids";
import { toIsoString } from "@/lib/firestore/mapper";

const COLLECTION = "documents";

type DocumentRecord = Readonly<{
  title: string;
  authorId: string;
  authorName: string;
  createdAt: unknown; // Timestamp (server)
  lastModifiedAt: unknown; // Timestamp (server)
  lastModifiedBy: string;
  gridSize: { rows: number; cols: number };
}>;

function mapDoc(id: string, data: DocumentRecord): LiveGridDocument {
  return {
    id,
    title: data.title,
    authorId: data.authorId,
    authorName: data.authorName,
    createdAt: toIsoString(data.createdAt as never),
    lastModifiedAt: toIsoString(data.lastModifiedAt as never),
    lastModifiedBy: data.lastModifiedBy,
    gridSize: data.gridSize
  };
}

/**
 * Converter keeps Firestore reads typed without leaking Timestamp into the app layer.
 */
const documentConverter: FirestoreDataConverter<DocumentRecord> = {
  toFirestore: (value) => value as DocumentData,
  fromFirestore: (snap) => snap.data() as DocumentRecord
};

export function documentsCollectionRef() {
  return collection(getDb(), COLLECTION).withConverter(documentConverter);
}

export function subscribeToDocuments(
  onChange: (docs: LiveGridDocument[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(documentsCollectionRef(), orderBy("lastModifiedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentRecord>) => {
      const docs = snapshot.docs.map((d) => mapDoc(d.id, d.data()));
      onChange(docs);
    },
    (e) => onError?.(e instanceof Error ? e : new Error("Firestore subscribe error"))
  );
}

export type CreateDocumentInput = Readonly<{
  title?: string;
}>;

export async function createDocument(
  input: CreateDocumentInput,
  user: SessionUser
): Promise<string> {
  const title = input.title?.trim() || "Untitled spreadsheet";

  const now = serverTimestamp();

  const record: DocumentRecord = {
    title,
    authorId: user.userId,
    authorName: user.displayName,
    createdAt: now,
    lastModifiedAt: now,
    lastModifiedBy: user.userId,
    gridSize: { rows: 40, cols: 14 }
  };

  // Add a doc; Firestore will assign ID.
  // (We keep createId import available if you later want deterministic IDs.)
  void createId; // prevents unused import if you remove it later

  const ref = await addDoc(documentsCollectionRef(), record);
  return ref.id;
}

/**
 * Get a single document by ID
 */
export async function getDocument(docId: string): Promise<LiveGridDocument | null> {
  const docRef = doc(getDb(), COLLECTION, docId).withConverter(documentConverter);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    return null;
  }
  
  return mapDoc(snap.id, snap.data());
}

/**
 * Subscribe to a single document
 */
export function subscribeToDocument(
  docId: string,
  onChange: (doc: LiveGridDocument | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(getDb(), COLLECTION, docId).withConverter(documentConverter);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      onChange(mapDoc(snapshot.id, snapshot.data()));
    },
    (e) => onError?.(e instanceof Error ? e : new Error("Firestore subscribe error"))
  );
}

/**
 * Update document title
 */
export async function updateDocumentTitle(docId: string, title: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, docId);
  await updateDoc(docRef, {
    title: title.trim() || "Untitled spreadsheet",
    lastModifiedAt: serverTimestamp()
  });
}