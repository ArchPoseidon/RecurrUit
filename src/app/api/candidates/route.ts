import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, jobDescriptions, rubricSettings } from "@/db/schema";
import { extractTextFromFile, parseResume } from "@/lib/parse-resume";
import { assessCandidate } from "@/lib/gemini";
import { computeScore, isRole } from "@/lib/rubric";
import { personalize } from "@/lib/personalize";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  if (!role || !isRole(role)) {
    return NextResponse.json({ error: "A valid ?role=pm|spm query param is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.role, role))
    .orderBy(desc(candidates.weightedTotal));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const role = formData.get("role");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A CV file is required" }, { status: 400 });
  }
  if (typeof role !== "string" || !isRole(role)) {
    return NextResponse.json({ error: "A valid role (pm|spm) is required" }, { status: 400 });
  }

  const [jd] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.role, role));
  const [settings] = await db.select().from(rubricSettings).where(eq(rubricSettings.role, role));
  if (!jd || !settings) {
    return NextResponse.json({ error: "JD or rubric settings missing for this role. Run the seed script." }, { status: 500 });
  }

  let rawText: string;
  try {
    rawText = await extractTextFromFile(file);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const parsed = parseResume(rawText);
  if (!parsed.email) {
    return NextResponse.json(
      { error: "Could not find an email address in this CV — please check the file." },
      { status: 422 },
    );
  }

  const assessment = await assessCandidate({
    role,
    jdContent: jd.content,
    redactedResumeText: parsed.redactedText,
  });

  const { weightedTotal, gateStatus, verdict } = computeScore(role, assessment.scores, {
    shortlistThreshold: settings.shortlistThreshold,
    holdThreshold: settings.holdThreshold,
    gateMinimum: settings.gateMinimum,
  });

  let emailSubject: string | null = null;
  let emailBody: string | null = null;
  let emailStatus = "not_generated";

  if (verdict === "Shortlist") {
    emailSubject = personalize(assessment.inviteEmail.subject, parsed.name);
    emailBody = personalize(assessment.inviteEmail.body, parsed.name);
    emailStatus = "draft";
  } else if (verdict === "Do Not Advance" || verdict === "Flagged for Review (Gate)") {
    emailSubject = personalize(assessment.rejectionEmail.subject, parsed.name);
    emailBody = personalize(assessment.rejectionEmail.body, parsed.name);
    emailStatus = "draft";
  }
  // verdict === "Hold for Review" -> no email drafted; pending manual call.

  const [candidate] = await db
    .insert(candidates)
    .values({
      role,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      sourceFileName: file.name,
      resumeText: parsed.rawText,
      redactedText: parsed.redactedText,
      c1: assessment.scores.C1,
      c2: assessment.scores.C2,
      c3: assessment.scores.C3,
      c4: assessment.scores.C4,
      c5: assessment.scores.C5,
      c6: assessment.scores.C6,
      c7: assessment.scores.C7,
      rationale: assessment.rationale,
      weightedTotal,
      gateStatus,
      verdict,
      interviewBrief: personalize(assessment.interviewBrief, parsed.name),
      emailSubject,
      emailBody,
      emailStatus,
    })
    .returning();

  return NextResponse.json(candidate, { status: 201 });
}
