export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-white shadow-soft"
      >
        <div className="grid grid-cols-2 gap-0.5">
          <span className="h-2.5 w-2.5 rounded bg-blue-600" />
          <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
          <span className="h-2.5 w-2.5 rounded bg-amber-500" />
          <span className="h-2.5 w-2.5 rounded bg-violet-600" />
        </div>
      </div>

      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">LiveGrid</div>
        <div className="text-xs text-text-muted">Real-time sheets</div>
      </div>
    </div>
  );
}