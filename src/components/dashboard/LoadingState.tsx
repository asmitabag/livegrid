export function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-border bg-white/70 shadow-soft"
        />
      ))}
    </div>
  );
}