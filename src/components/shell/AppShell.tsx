import { Header } from "@/components/shell/Header";
import { IdentityGate } from "@/components/identity/IdentityGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="livegrid-bg min-h-dvh">
        <Header />
        <IdentityGate>{children}</IdentityGate>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} LiveGrid</span>
        </footer>
      </div>
    </div>
  );
}