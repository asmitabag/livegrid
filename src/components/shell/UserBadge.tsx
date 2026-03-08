"use client";

import { useEffect, useState } from "react";
import { useSessionUser } from "@/lib/session/useSessionUser";
import { cn } from "@/lib/utils/cn";

export function UserBadge() {
  const { user } = useSessionUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: server render and first client render match.
  if (!mounted) {
    return <div className="h-9 w-40 rounded-full bg-black/10" />;
  }

  if (!user) {
    return <div className="h-9 w-40 rounded-full bg-black/10" />;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: user.color }}
      />
      <span className={cn("max-w-[160px] truncate text-xs font-medium")}>
        {user.displayName}
      </span>
    </div>
  );
}