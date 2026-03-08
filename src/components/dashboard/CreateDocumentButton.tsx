"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDocument } from "@/lib/firestore/documents";
import { useSessionUser } from "@/lib/session/useSessionUser";
import { cn } from "@/lib/utils/cn";

export function CreateDocumentButton() {
  const router = useRouter();
  const { user } = useSessionUser();
  const [isCreating, setIsCreating] = useState(false);

  const disabled = !user || isCreating;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        if (!user) return;
        try {
          setIsCreating(true);
          const id = await createDocument({}, user);
          router.push(`/docs/${id}`);
        } finally {
          setIsCreating(false);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "border border-blue-700/20 bg-blue-600 text-white shadow-sm",
        "hover:bg-blue-700",
        "focus-ring",
        disabled && "cursor-not-allowed opacity-60 hover:bg-blue-600"
      )}
    >
      {isCreating ? "Creating…" : "New document"}
    </button>
  );
}