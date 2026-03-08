"use client";

import { cn } from "@/lib/utils/cn";

type Props = Readonly<{
  displayName: string;
  onChangeDisplayName: (value: string) => void;
  onContinue: () => void;
  onSignInWithGoogle: () => void;
}>;

function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function OnboardingCard({
  displayName,
  onChangeDisplayName,
  onContinue,
  onSignInWithGoogle
}: Props) {
  const valid = isValidName(displayName);

  return (
    <div className="rounded-xl border border-border bg-white shadow-soft">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Welcome to LiveGrid
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Sign in with Google or choose a display name. Your identity and
              color will be visible to collaborators.
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
              Identity
            </div>
          </div>
        </div>

        {/* Google Sign-In */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onSignInWithGoogle}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium",
              "bg-white hover:bg-surface-2 shadow-sm transition"
            )}
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-text-muted">or continue as guest</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form
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
            Tip: use your first name + initial (e.g. &quot;Asmita B.&quot;).
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!valid}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-blue-600 text-white shadow-sm",
                valid ? "hover:bg-blue-700" : "opacity-50"
              )}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
