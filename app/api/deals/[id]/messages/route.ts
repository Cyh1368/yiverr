import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { addMessage } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const text = body && typeof body === "object" ? (body as { body?: unknown }).body : "";
  const result = await updateDB((db) => addMessage(db, user.id, id, text));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ message: result.value });
}
