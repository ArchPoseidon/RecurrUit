import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, appSettings } from "@/db/schema";
import { sendCandidateEmail } from "@/lib/resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Params) {
  const { id } = await ctx.params;

  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!candidate.emailSubject || !candidate.emailBody) {
    return NextResponse.json({ error: "No email draft to send for this candidate" }, { status: 400 });
  }
  if (candidate.emailStatus === "sent") {
    return NextResponse.json({ error: "Email already sent for this candidate" }, { status: 409 });
  }

  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  if (!settings?.resendApiKey || !settings.fromEmail) {
    return NextResponse.json(
      { error: "Connect a Resend API key and sending email in Settings before sending." },
      { status: 400 },
    );
  }

  try {
    await sendCandidateEmail({
      apiKey: settings.resendApiKey,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      to: candidate.email,
      subject: candidate.emailSubject,
      body: candidate.emailBody,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const [updated] = await db
    .update(candidates)
    .set({ emailStatus: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning();

  return NextResponse.json(updated);
}
