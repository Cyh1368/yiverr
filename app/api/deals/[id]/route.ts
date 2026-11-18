import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { resolveDeal } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body && typeof body === "object" ? (body as { action?: unknown }).action : null;
  const result = await updateDB((db) => resolveDeal(db, user.id, id, action));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ deal: result.value });
}
