export type PresenceUser = Readonly<{
  userId: string;
  displayName: string;
  color: string; // persistent per user
  lastActiveAt: string; // ISO
  cursor?: Readonly<{
    row: number;
    col: number;
  }>;
  selection?: Readonly<{
    start: { row: number; col: number };
    end: { row: number; col: number };
  }>;
}>;