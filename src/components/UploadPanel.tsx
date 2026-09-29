"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/rubric";

interface FailedUpload {
  fileName: string;
  error: string;
}

export function UploadPanel({ role }: { role: Role }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<FailedUpload[]>([]);

  async function uploadOne(file: File): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);
    try {
      const res = await fetch("/api/candidates", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Upload failed" };
      return { ok: true, id: data.id };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setFailures([]);
    setProgress({ done: 0, total: files.length });

    const newFailures: FailedUpload[] = [];
    let lastSuccessId: string | null = null;
    let successCount = 0;

    // Sequential, not parallel — keeps Gemini calls from bursting all at once
    // and gives an accurate running "X of Y" count.
    for (const file of files) {
      const result = await uploadOne(file);
      if (result.ok) {
        successCount += 1;
        lastSuccessId = result.id;
      } else {
        newFailures.push({ fileName: file.name, error: result.error });
      }
      setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
    }

    setFailures(newFailures);
    setIsUploading(false);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (successCount === 1 && newFailures.length === 0 && lastSuccessId) {
      router.push(`/candidates/${lastSuccessId}`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors">
        {isUploading ? `Scoring ${progress?.done ?? 0}/${progress?.total ?? 0}…` : "Upload CVs"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </label>
      {failures.length > 0 && (
        <div className="max-w-xs text-right text-xs text-danger space-y-0.5">
          <p className="font-medium">{failures.length} file(s) failed:</p>
          {failures.map((f) => (
            <p key={f.fileName} className="truncate" title={f.error}>
              {f.fileName} — {f.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
