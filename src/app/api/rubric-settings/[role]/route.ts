import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rubricSettings } from "@/db/schema";
import { isRole } from "@/lib/rubric";

type Params = { params: Promise<{ role: string }> };

export async function GET(_request: NextRequest, ctx: Params) {
  const { role } = await ctx.params;
  if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const [settings] = await db.select().from(rubricSettings).where(eq(rubricSettings.role, role));
  if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest, ctx: Params) {
  const { role } = await ctx.params;
  if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const { shortlistThreshold, holdThreshold, gateMinimum } = await request.json();
  if (
    typeof shortlistThreshold !== "number" ||
    typeof holdThreshold !== "number" ||
    typeof gateMinimum !== "number"
  ) {
    return NextResponse.json(
      { error: "shortlistThreshold, holdThreshold and gateMinimum must be numbers" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(rubricSettings)
    .set({ shortlistThreshold, holdThreshold, gateMinimum })
    .where(eq(rubricSettings.role, role))
    .returning();

  return NextResponse.json(updated);
}
