import { NextResponse } from "next/server";
import { cookieOptions, USER_COOKIE } from "@/lib/auth";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = body && typeof body === "object" ? String((body as { user_id?: unknown }).user_id ?? "") : "";
  const db = await readDB();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) return NextResponse.json({ error: "That student is not on Yiverr." }, { status: 404 });
  const response = NextResponse.json({ user });
  response.cookies.set(USER_COOKIE, user.id, cookieOptions);
  return response;
}
