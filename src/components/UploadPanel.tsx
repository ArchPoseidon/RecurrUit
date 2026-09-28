"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/rubric";

export function UploadPanel({ role }: { role: Role }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);

    try {
      const res = await fetch("/api/candidates", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/candidates/${data.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors">
        {isUploading ? "Scoring…" : "Upload CV"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </label>
      {error && <p className="text-xs text-danger max-w-xs text-right">{error}</p>}
    </div>
  );
}
