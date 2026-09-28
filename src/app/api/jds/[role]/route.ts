import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobDescriptions } from "@/db/schema";
import { isRole } from "@/lib/rubric";

type Params = { params: Promise<{ role: string }> };

export async function GET(_request: NextRequest, ctx: Params) {
  const { role } = await ctx.params;
  if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const [jd] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.role, role));
  if (!jd) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(jd);
}

export async function PUT(request: NextRequest, ctx: Params) {
  const { role } = await ctx.params;
  if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const { title, content } = await request.json();
  if (typeof title !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const [updated] = await db
    .update(jobDescriptions)
    .set({ title, content, updatedAt: new Date() })
    .where(eq(jobDescriptions.role, role))
    .returning();

  return NextResponse.json(updated);
}
