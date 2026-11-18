import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { createPost } from "@/lib/mutate";
import { saveDataUrls } from "@/lib/uploads";
import { validatePostFields } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }
  const parsed = validatePostFields(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const images = await saveDataUrls((body as { images?: unknown }).images);
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });
  const result = await updateDB((db) => createPost(db, user.id, { ...parsed.value, images: images.paths }));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ post: result.value });
}
