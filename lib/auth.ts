import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDB } from "./db";
import type { User } from "./types";

export const USER_COOKIE = "yiverr_user";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  if (!id) return null;
  const db = await readDB();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
