import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { CRITERIA, CRITERION_ORDER, ROLE_RUBRICS, type Role, type CriterionId } from "@/lib/rubric";
import { VerdictBadge } from "@/components/VerdictBadge";
import { CandidateEmailEditor } from "@/components/CandidateEmailEditor";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
  if (!candidate) notFound();

  const role = candidate.role as Role;
  const weights = ROLE_RUBRICS[role].weights;
  const gateCriterion = ROLE_RUBRICS[role].gateCriterion;
  const rationale = (candidate.rationale as Record<string, string> | null) ?? {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
        <p className="text-sm text-muted mt-1">
          {candidate.email} {candidate.phone ? `· ${candidate.phone}` : ""} · Applied for {ROLE_RUBRICS[role].label}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Weighted Total</p>
          <p className="text-2xl font-mono mt-1">{candidate.weightedTotal?.toFixed(1)}<span className="text-sm text-muted">/100</span></p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Gate Status ({gateCriterion})</p>
          <p className={`text-2xl font-mono mt-1 ${candidate.gateStatus === "Pass" ? "text-accent" : "text-danger"}`}>
            {candidate.gateStatus}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Verdict</p>
          <div className="mt-2"><VerdictBadge verdict={candidate.verdict} /></div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Rubric breakdown</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-medium">Criterion</th>
                <th className="px-4 py-2 font-medium w-16">Score</th>
                <th className="px-4 py-2 font-medium w-16">Weight</th>
                <th className="px-4 py-2 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CRITERION_ORDER.map((id: CriterionId) => (
                <tr key={id}>
                  <td className="px-4 py-3 align-top">
                    <span className="font-medium">{id}</span>
                    <span className="text-muted"> · {CRITERIA[id].name}</span>
                    {id === gateCriterion && (
                      <span className="ml-2 inline-block rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] text-warning">
                        GATE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top font-mono">{candidate[id as keyof typeof candidate] as number}/5</td>
                  <td className="px-4 py-3 align-top text-muted">{weights[id]}%</td>
                  <td className="px-4 py-3 align-top text-muted">{rationale[id] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Interview brief</h2>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {candidate.interviewBrief}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
          {candidate.verdict === "Shortlist" ? "Interview invite" : candidate.verdict === "Hold for Review" ? "Email" : "Rejection email"}
        </h2>
        {candidate.emailSubject && candidate.emailBody ? (
          <CandidateEmailEditor
            candidateId={candidate.id}
            initialSubject={candidate.emailSubject}
            initialBody={candidate.emailBody}
            emailStatus={candidate.emailStatus}
          />
        ) : (
          <p className="text-sm text-muted">
            No email drafted — this candidate is on hold pending your manual decision.
          </p>
        )}
      </div>
    </div>
  );
}
