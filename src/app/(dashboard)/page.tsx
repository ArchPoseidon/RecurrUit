import Link from "next/link";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { ROLE_RUBRICS, type Role, type Verdict } from "@/lib/rubric";
import { VerdictBar } from "@/components/VerdictBar";

const ROLES: Role[] = ["pm", "spm"];

export default async function OverviewPage() {
  const rows = await db
    .select({
      role: candidates.role,
      verdict: candidates.verdict,
      emailStatus: candidates.emailStatus,
    })
    .from(candidates);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Where every applicant stands, by role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROLES.map((role) => {
          const roleRows = rows.filter((r) => r.role === role);
          const total = roleRows.length;

          const counts: Record<string, number> = {};
          for (const r of roleRows) {
            const key = r.verdict ?? "Unscored";
            counts[key] = (counts[key] ?? 0) + 1;
          }

          const shortlisted = roleRows.filter((r) => r.verdict === ("Shortlist" satisfies Verdict));
          const sent = shortlisted.filter((r) => r.emailStatus === "sent").length;

          return (
            <div key={role} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-semibold">{ROLE_RUBRICS[role].label}</h2>
                <Link href={`/candidates?role=${role}`} className="text-xs text-muted hover:text-accent">
                  View candidates →
                </Link>
              </div>
              <p className="text-3xl font-semibold font-mono mb-5">
                {total}
                <span className="text-sm font-sans font-normal text-muted ml-1.5">
                  {total === 1 ? "candidate" : "candidates"}
                </span>
              </p>

              <VerdictBar counts={counts} total={total} />

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs uppercase tracking-wide text-muted mb-2">Outreach</p>
                {shortlisted.length === 0 ? (
                  <p className="text-sm text-muted">No one shortlisted yet.</p>
                ) : (
                  <>
                    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-surface">
                      <div
                        title={`Sent: ${sent}`}
                        style={{ width: `${(sent / shortlisted.length) * 100}%`, backgroundColor: "var(--accent)" }}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                      />
                      {sent < shortlisted.length && (
                        <div
                          title={`Awaiting send: ${shortlisted.length - sent}`}
                          style={{
                            width: `${((shortlisted.length - sent) / shortlisted.length) * 100}%`,
                          }}
                          className="h-full rounded-r-full bg-surface-hover"
                        />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      <span className="font-mono text-foreground">{sent}</span> of{" "}
                      <span className="font-mono text-foreground">{shortlisted.length}</span> shortlisted invites sent
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
