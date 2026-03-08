"use client";

import { useEffect, useState } from "react";
import { subscribeToDocument } from "./documents";
import type { Document } from "@/models";

export function useDocument(docId: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToDocument(
      docId,
      (doc) => {
        setDocument(doc);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [docId]);

  return { document, isLoading, error };
}
