"use client";

import { cn } from "@/lib/utils/cn";

type Props = Readonly<{
  displayName: string;
  onChangeDisplayName: (value: string) => void;
  onContinue: () => void;
}>;

function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function OnboardingCard({
  displayName,
  onChangeDisplayName,
  onContinue
}: Props) {
  const valid = isValidName(displayName);

  return (
    <div className="rounded-xl border border-border bg-white shadow-soft">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Choose a display name
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              This name will be shown to other collaborators. You can change it later.
            </p>
          </div>

          <div className="hidden shrink-0 sm:block">
            <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
              Local identity
            </div>
          </div>
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onContinue();
          }}
        >
          <label className="block text-sm font-medium">Display name</label>
          <input
            value={displayName}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            placeholder="e.g. Asmita"
            autoFocus
            className={cn(
              "mt-2 w-full rounded-lg border px-3 py-2 text-sm shadow-sm",
              "border-border bg-white",
              "focus-ring"
            )}
          />

          <div className="mt-2 text-xs text-text-muted">
            Tip: use your first name + initial (e.g. “Asmita B.”).
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!valid}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-blue-600 text-white",
                "shadow-sm",
                valid ? "hover:bg-blue-700" : "opacity-50"
              )}
            >
              Continue
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-muted">
          Later we can plug in Google sign-in, but for now this keeps onboarding fast.
        </div>
      </div>
    </div>
  );
}