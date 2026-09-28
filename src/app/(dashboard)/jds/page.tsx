import { db } from "@/db";
import { jobDescriptions } from "@/db/schema";
import { JdEditor } from "@/components/JdEditor";
import type { Role } from "@/lib/rubric";

export default async function JdsPage() {
  const rows = await db.select().from(jobDescriptions);
  const jds = rows.map((r) => ({ role: r.role as Role, title: r.title, content: r.content }));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Job Descriptions</h1>
      <p className="text-sm text-muted mb-8">
        Editable — used as context for scoring and interview-brief generation. The 7 rubric criteria and their
        weights stay fixed regardless of edits here.
      </p>
      <JdEditor jds={jds} />
    </div>
  );
}
