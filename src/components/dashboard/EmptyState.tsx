export function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-center shadow-soft">
      <h3 className="text-base font-semibold tracking-tight">No documents yet</h3>
      <p className="mt-2 text-sm text-text-muted">
        Create your first spreadsheet to start collaborating in real time.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
        Tip: Keep documents small; we’ll optimize cell streaming later.
      </div>
    </div>
  );
}