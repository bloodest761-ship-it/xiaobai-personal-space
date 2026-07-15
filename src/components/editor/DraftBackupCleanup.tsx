"use client";

import { useEffect } from "react";

export function DraftBackupCleanup({ entryId }: { entryId?: string }) {
  useEffect(() => {
    if (!entryId) return;
    try {
      window.localStorage.removeItem(`xiaobai-draft:${entryId}`);
    } catch {
      // Local storage is optional and must not affect the deletion result.
    }
  }, [entryId]);

  return null;
}
