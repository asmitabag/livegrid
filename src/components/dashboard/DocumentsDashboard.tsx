"use client";

import { useDocuments } from "@/lib/firestore/useDocuments";
import { DocumentsList } from "@/components/dashboard/DocumentsList";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";

export function DocumentsDashboard() {
  const { documents, isLoading, error } = useDocuments();

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-soft">
        <div className="text-sm font-semibold">Couldn’t load documents</div>
        <div className="mt-2 text-sm text-text-muted">{error}</div>
        <div className="mt-4 text-xs text-text-muted">
          Check Firestore is enabled and your rules allow reads in dev.
        </div>
      </div>
    );
  }

  if (documents.length === 0) return <EmptyState />;

  return <DocumentsList docs={documents} />;
}