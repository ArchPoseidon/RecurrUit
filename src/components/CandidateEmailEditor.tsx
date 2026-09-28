"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CandidateEmailEditor({
  candidateId,
  initialSubject,
  initialBody,
  emailStatus,
}: {
  candidateId: string;
  initialSubject: string;
  initialBody: string;
  emailStatus: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState(emailStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveDraft() {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSubject: subject, emailBody: body }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function send() {
    if (!confirm(`Send this email now? This cannot be undone.`)) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/send`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to send");
      setStatus("sent");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSending(false);
    }
  }

  const sent = status === "sent";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sent}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
      </div>
      <div>
        <label className="text-xs text-muted">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sent}
          rows={10}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-sans leading-relaxed disabled:opacity-60"
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {saved && !error && <p className="text-xs text-accent">Draft saved.</p>}

      <div className="flex items-center gap-3">
        {sent ? (
          <span className="text-sm text-accent font-medium">Sent</span>
        ) : (
          <>
            <button
              onClick={saveDraft}
              disabled={isSaving || isSending}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save draft"}
            </button>
            <button
              onClick={send}
              disabled={isSaving || isSending}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSending ? "Sending…" : "Send email"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
