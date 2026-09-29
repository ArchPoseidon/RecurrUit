import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(candidate);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (typeof body.emailSubject === "string") update.emailSubject = body.emailSubject;
  if (typeof body.emailBody === "string") update.emailBody = body.emailBody;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  update.updatedAt = new Date();

  const [updated] = await db
    .update(candidates)
    .set(update)
    .where(eq(candidates.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  const [deleted] = await db.delete(candidates).where(eq(candidates.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
