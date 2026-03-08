import type { Timestamp } from "firebase/firestore";

export type FirestoreDateValue = Timestamp | Date | string | null | undefined;

export function toIsoString(value: FirestoreDateValue): string {
  if (!value) return new Date(0).toISOString();

  if (typeof value === "string") return value;

  // Firestore Timestamp has toDate()
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) return value.toISOString();

  // fallback
  return new Date(0).toISOString();
}