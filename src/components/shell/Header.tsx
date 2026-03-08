import { Logo } from "@/components/shell/Logo";
import { UserBadge } from "@/components/shell/UserBadge";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-muted sm:inline-flex">
            Foundation
          </span>
          <UserBadge />
        </div>
      </div>
    </header>
  );
}