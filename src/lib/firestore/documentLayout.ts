import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

export type DocumentLayout = Readonly<{
  // visible column -> underlying column index
  colOrder: readonly number[];
  // underlying col index -> width px
  colWidths: readonly number[];
  // row index -> height px
  rowHeights: readonly number[];
  updatedAt?: unknown;
}>;

function docRef(docId: string) {
  return doc(getDb(), "documents", docId);
}

export async function getDocumentLayout(docId: string): Promise<DocumentLayout | null> {
  const snap = await getDoc(docRef(docId));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const layout = data?.layout as DocumentLayout | undefined;
  return layout ?? null;
}

export async function upsertDocumentLayout(docId: string, layout: DocumentLayout): Promise<void> {
  // Avoid writing undefined fields
  const payload: DocumentData = {
    layout: {
      colOrder: Array.from(layout.colOrder),
      colWidths: Array.from(layout.colWidths),
      rowHeights: Array.from(layout.rowHeights),
      updatedAt: serverTimestamp()
    }
  };

  await setDoc(docRef(docId), payload, { merge: true });
}