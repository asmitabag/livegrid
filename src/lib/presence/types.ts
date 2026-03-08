import type { Timestamp } from "firebase/firestore";

export type PresenceRecord = Readonly<{
  userId: string;
  name: string;
  color: string;
  lastSeen: Timestamp;
  selectedCell?: string;
}>;