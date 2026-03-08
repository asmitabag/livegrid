function hashString(input: string): number {
  // FNV-1a-ish small hash (deterministic)
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function userColor(seed: string): string {
  const h = hashString(seed);
  const hue = h % 360;
  const saturation = 68;
  const lightness = 52;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}