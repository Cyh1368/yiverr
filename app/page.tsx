import { Browse } from "@/components/Browse";
import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { toCard } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireUser();
  const db = await readDB();
  const now = Date.now();
  const posts = db.posts
    .filter((post) => post.status === "active")
    .map((post) => toCard(post, db.users, now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <Browse posts={posts} />;
}
