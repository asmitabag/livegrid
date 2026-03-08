const PALETTE = [
  "#2563EB", // blue
  "#DC2626", // red
  "#16A34A", // green
  "#7C3AED", // violet
  "#EA580C", // orange
  "#0D9488", // teal
  "#DB2777", // pink
  "#4B5563" // slate
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function colorForUserId(userId: string): string {
  const idx = hashString(userId) % PALETTE.length;
  return PALETTE[idx]!;
}