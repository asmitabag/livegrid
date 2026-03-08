export type WriteState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "saving" }>
  | Readonly<{ status: "saved"; savedAt: number }>
  | Readonly<{ status: "error"; message: string }>;