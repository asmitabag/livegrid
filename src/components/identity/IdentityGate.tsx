"use client";

import { useEffect, useState } from "react";
import { useSessionUser } from "@/lib/session/useSessionUser";
import { OnboardingCard } from "@/components/identity/OnboardingCard";
import { signInWithGoogle } from "@/lib/firebase/auth";

export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { user, setDisplayName } = useSessionUser();
  const [pendingName, setPendingName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
      // useSessionUser's onAuthStateChanged listener will pick up the signed-in user automatically.
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  // Hydration-safe: server and first client render match.
  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="h-24 rounded-xl border border-border bg-white shadow-soft" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center px-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

        <div className="relative w-full max-w-lg animate-[livegridIn_.18s_ease-out]">
          <OnboardingCard
            displayName={pendingName}
            onChangeDisplayName={setPendingName}
            onContinue={() => setDisplayName(pendingName)}
            onSignInWithGoogle={handleSignInWithGoogle}
          />
        </div>

        <style jsx global>{`
          @keyframes livegridIn {
            from {
              transform: translateY(8px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}