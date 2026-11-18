import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { createDeal } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing offer." }, { status: 400 });
  }
  const result = await updateDB((db) => createDeal(db, user.id, body));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ deal: result.value });
}
