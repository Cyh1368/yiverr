import { NextResponse } from "next/server";
import { cookieOptions, USER_COOKIE } from "@/lib/auth";
import { updateDB } from "@/lib/db";
import { upsertUser } from "@/lib/mutate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Enter your details." }, { status: 400 });
  }
  const result = await updateDB((db) => upsertUser(db, body));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const response = NextResponse.json({ user: result.value });
  response.cookies.set(USER_COOKIE, result.value.id, cookieOptions);
  return response;
}
