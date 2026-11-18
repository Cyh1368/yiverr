import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { isSeedUser } from "@/lib/constants";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const db = await readDB();
  const seeds = db.users
    .filter((entry) => isSeedUser(entry.id))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      college: entry.college,
      class_year: entry.class_year,
    }));
  return <LoginForm seeds={seeds} />;
}
