import {
  collection,
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
import type { Cell, CellFormatting, CellValue } from "@/models";
import type { CellCoord } from "@/lib/grid/coords";
import { coordToKey, type CellKey } from "@/lib/grid/keys";
import { toIsoString } from "@/lib/firestore/mapper";

const SUBCOLLECTION = "cells";

type CellRecord = Readonly<{
  cellId: string;
  row: number;
  col: number;
  rawValue: CellValue;
  displayValue?: string;
  updatedAt: unknown; // Firestore Timestamp
  updatedBy: string;
  formatting?: CellFormatting;
}>;

function recordToCell(record: CellRecord): Cell {
  return {
    id: record.cellId,
    address: { row: record.row, col: record.col },
    value: record.rawValue ?? null,
    formatting: record.formatting ?? {},
    updatedAt: toIsoString(record.updatedAt as never),
    updatedBy: record.updatedBy
  };
}

const cellConverter: FirestoreDataConverter<CellRecord> = {
  toFirestore: (value) => value as DocumentData,
  fromFirestore: (snap) => snap.data() as CellRecord
};

function cellsCollectionRef(docId: string) {
  return collection(getDb(), "documents", docId, SUBCOLLECTION).withConverter(cellConverter);
}

function cellDocRef(docId: string, cellKey: CellKey) {
  return doc(getDb(), "documents", docId, SUBCOLLECTION, cellKey).withConverter(cellConverter);
}

export type CellsSnapshot = Readonly<{
  cells: readonly Cell[];
}>;

export function subscribeToCells(
  docId: string,
  onChange: (snapshot: CellsSnapshot) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(cellsCollectionRef(docId));

  return onSnapshot(
    q,
    (snap: QuerySnapshot<CellRecord>) => {
      const cells = snap.docs.map((d) => recordToCell(d.data()));
      onChange({ cells });
    },
    (e) => onError?.(e instanceof Error ? e : new Error("Firestore cells subscribe error"))
  );
}

export type UpsertCellInput = Readonly<{
  coord: CellCoord;
  rawValue: CellValue;
  updatedBy: string;
  formatting?: CellFormatting;
  displayValue?: string;
}>;

export async function upsertCell(docId: string, input: UpsertCellInput): Promise<void> {
  const cellKey = coordToKey(input.coord);

  const record: CellRecord = {
    cellId: cellKey,
    row: input.coord.row,
    col: input.coord.col,
    rawValue: input.rawValue,
    updatedAt: serverTimestamp(),
    updatedBy: input.updatedBy,
    ...(input.displayValue !== undefined ? { displayValue: input.displayValue } : {}),
    ...(input.formatting !== undefined ? { formatting: input.formatting } : {})
  };

  await setDoc(cellDocRef(docId, cellKey), record, { merge: true });
}