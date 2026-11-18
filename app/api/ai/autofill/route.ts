import { NextResponse } from "next/server";
import { autofillListing } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import type { Kind } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing listing notes." }, { status: 400 });
  }
  const kind = (body as { kind?: unknown }).kind;
  if (kind !== "service" && kind !== "item" && kind !== "request") {
    return NextResponse.json({ error: "Pick a service, request, or item." }, { status: 400 });
  }
  try {
    const result = await autofillListing({
      kind: kind as Kind,
      sentence: String((body as { sentence?: unknown }).sentence ?? ""),
      images: Array.isArray((body as { images?: unknown }).images)
        ? ((body as { images: unknown[] }).images.filter((image) => typeof image === "string") as string[])
        : [],
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json({ listing: result.listing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grok could not write that listing.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
