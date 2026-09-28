"use client";

import { useState } from "react";
import type { Role } from "@/lib/rubric";

interface JdData {
  role: Role;
  title: string;
  content: string;
}

export function JdEditor({ jds }: { jds: JdData[] }) {
  const [activeRole, setActiveRole] = useState<Role>(jds[0]?.role ?? "pm");
  const [drafts, setDrafts] = useState<Record<Role, JdData>>(
    Object.fromEntries(jds.map((j) => [j.role, j])) as Record<Role, JdData>,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const active = drafts[activeRole];

  async function save() {
    setIsSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/jds/${activeRole}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: active.title, content: active.content }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-border">
        {jds.map((jd) => (
          <button
            key={jd.role}
            onClick={() => {
              setActiveRole(jd.role);
              setSaved(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeRole === jd.role
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {jd.title}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted">Title</label>
          <input
            value={active.title}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [activeRole]: { ...d[activeRole], title: e.target.value } }))
            }
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted">Job description</label>
          <textarea
            value={active.content}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [activeRole]: { ...d[activeRole], content: e.target.value } }))
            }
            rows={24}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed"
          />
        </div>

        <p className="text-xs text-muted">
          Editing this JD does not change the fixed scoring rubric or weights for this role.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={isSaving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-xs text-accent">Saved.</span>}
        </div>
      </div>
    </div>
  );
}
