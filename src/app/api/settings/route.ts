import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export async function GET() {
  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  return NextResponse.json({
    fromEmail: settings?.fromEmail ?? null,
    fromName: settings?.fromName ?? null,
    resendConnected: Boolean(settings?.resendApiKey),
  });
}

export async function PUT(request: NextRequest) {
  const { resendApiKey, fromEmail, fromName } = await request.json();

  if (typeof fromEmail !== "string" || !fromEmail.includes("@")) {
    return NextResponse.json({ error: "A valid fromEmail is required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    fromEmail,
    fromName: typeof fromName === "string" ? fromName : null,
    updatedAt: new Date(),
  };
  // Only overwrite the stored key when a new one is actually provided, so
  // re-saving the from-email doesn't require re-pasting the API key.
  if (typeof resendApiKey === "string" && resendApiKey.trim().length > 0) {
    update.resendApiKey = resendApiKey.trim();
  }

  const [updated] = await db
    .insert(appSettings)
    .values({ id: 1, ...update })
    .onConflictDoUpdate({ target: appSettings.id, set: update })
    .returning();

  return NextResponse.json({
    fromEmail: updated.fromEmail,
    fromName: updated.fromName,
    resendConnected: Boolean(updated.resendApiKey),
  });
}
