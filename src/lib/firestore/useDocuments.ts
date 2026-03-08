"use client";

import { useEffect, useMemo, useState } from "react";
import type { Document as LiveGridDocument } from "@/models";
import { subscribeToDocuments } from "@/lib/firestore/documents";

export type DocumentsState = Readonly<{
  documents: LiveGridDocument[];
  isLoading: boolean;
  error: string | null;
}>;

export function useDocuments(): DocumentsState {
  const [documents, setDocuments] = useState<LiveGridDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToDocuments(
      (docs) => {
        setDocuments(docs);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return useMemo(
    () => ({ documents, isLoading, error }),
    [documents, isLoading, error]
  );
}