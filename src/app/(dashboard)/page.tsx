import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { isRole, ROLE_RUBRICS, type Role } from "@/lib/rubric";
import { VerdictBadge } from "@/components/VerdictBadge";
import { UploadPanel } from "@/components/UploadPanel";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: rawRole } = await searchParams;
  const role: Role = rawRole && isRole(rawRole) ? rawRole : "pm";

  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.role, role))
    .orderBy(desc(candidates.weightedTotal));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted mt-1">
            Ranked by weighted rubric score. Upload a CV to score it against the {ROLE_RUBRICS[role].label} rubric.
          </p>
        </div>
        <UploadPanel role={role} />
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(["pm", "spm"] as const).map((r) => (
          <Link
            key={r}
            href={`/?role=${r}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              role === r
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {ROLE_RUBRICS[r].label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No candidates yet for this role.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Gate</th>
                <th className="px-4 py-3 font-medium">Verdict</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/candidates/${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{c.weightedTotal?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={c.gateStatus === "Pass" ? "text-accent" : "text-danger"}>
                      {c.gateStatus ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <VerdictBadge verdict={c.verdict} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">
                    {c.emailStatus.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
