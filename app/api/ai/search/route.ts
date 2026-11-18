import { NextResponse } from "next/server";
import { smartSearch } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const query = body && typeof body === "object" ? String((body as { query?: unknown }).query ?? "").trim() : "";
  if (query.length < 2) return NextResponse.json({ error: "Type a search." }, { status: 400 });
  const result = await smartSearch(query.slice(0, 300));
  return NextResponse.json(result);
}
