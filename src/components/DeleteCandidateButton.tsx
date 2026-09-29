"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCandidateButton({
  candidateId,
  candidateName,
  variant = "row",
  onDeleted,
}: {
  candidateId: string;
  candidateName: string;
  variant?: "row" | "detail";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Remove ${candidateName}? This permanently deletes their scoring and any drafted email.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to remove candidate");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/candidates");
      }
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
      setIsDeleting(false);
    }
  }

  if (variant === "detail") {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
      >
        {isDeleting ? "Removing…" : "Remove candidate"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="relative z-10 text-xs text-muted hover:text-danger transition-colors disabled:opacity-50"
    >
      {isDeleting ? "Removing…" : "Remove"}
    </button>
  );
}
