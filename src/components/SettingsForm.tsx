"use client";

import { useState } from "react";

interface EmailSettings {
  fromEmail: string | null;
  fromName: string | null;
  resendConnected: boolean;
}

export function EmailSettingsForm({ initial }: { initial: EmailSettings }) {
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState(initial.fromEmail ?? "");
  const [fromName, setFromName] = useState(initial.fromName ?? "");
  const [connected, setConnected] = useState(initial.resendConnected);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resendApiKey, fromEmail, fromName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setConnected(data.resendConnected);
      setResendApiKey("");
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Resend (sending identity)</h2>
        <span className={`text-xs ${connected ? "text-accent" : "text-muted"}`}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div>
        <label className="text-xs text-muted">Resend API key</label>
        <input
          type="password"
          value={resendApiKey}
          onChange={(e) => setResendApiKey(e.target.value)}
          placeholder={connected ? "•••••••••••• (saved — enter a new key to replace it)" : "re_..."}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted">From email (verified in Resend)</label>
          <input
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="arjun@kargo.io"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted">From name</label>
          <input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Arjun Mehta"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {saved && !error && <p className="text-xs text-accent">Saved.</p>}

      <button
        onClick={save}
        disabled={isSaving}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

interface RubricSettingsData {
  role: string;
  shortlistThreshold: number;
  holdThreshold: number;
  gateMinimum: number;
}

export function RubricSettingsForm({ label, initial }: { label: string; initial: RubricSettingsData }) {
  const [values, setValues] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setIsSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/rubric-settings/${initial.role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{label} thresholds</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted">Shortlist ≥</label>
          <input
            type="number"
            value={values.shortlistThreshold}
            onChange={(e) => setValues((v) => ({ ...v, shortlistThreshold: Number(e.target.value) }))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted">Hold ≥</label>
          <input
            type="number"
            value={values.holdThreshold}
            onChange={(e) => setValues((v) => ({ ...v, holdThreshold: Number(e.target.value) }))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted">Gate min ≥</label>
          <input
            type="number"
            value={values.gateMinimum}
            onChange={(e) => setValues((v) => ({ ...v, gateMinimum: Number(e.target.value) }))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={isSaving}
        className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
      {saved && <span className="ml-3 text-xs text-accent">Saved.</span>}
    </div>
  );
}
