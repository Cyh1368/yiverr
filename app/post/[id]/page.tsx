import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryArt, CollegeBadge } from "@/components/CategoryArt";
import { DealPanel } from "@/components/DealPanel";
import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { formatPrice, initials, kindLabel, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await readDB();
  const post = db.posts.find((entry) => entry.id === id);
  if (!post) notFound();
  const poster = db.users.find((entry) => entry.id === post.user_id);
  const mine = db.deals
    .filter((deal) => deal.post_id === post.id && deal.from_user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <article>
        <Link href="/" className="text-sm font-medium text-yale">
          Back to browse
        </Link>
        <div className="mt-3 overflow-hidden rounded-3xl">
          {post.images.length ? (
            <div className="grid gap-2">
              <img src={post.images[0]} alt={post.title} className="aspect-[4/3] w-full object-cover" />
              {post.images.length > 1 ? (
                <div className="grid grid-cols-3 gap-2">
                  {post.images.slice(1).map((src) => (
                    <img key={src} src={src} alt="" className="aspect-square w-full object-cover" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <CategoryArt category={post.category} className="aspect-[4/3] w-full" emojiClassName="text-7xl" />
          )}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-yale/70">
          {kindLabel(post.kind)} · {post.category}
          {post.condition ? ` · ${post.condition}` : ""}
          {post.status === "closed" ? " · Closed" : ""}
        </p>
        <h1 className="mt-1 font-display text-4xl leading-tight text-ink">{post.title}</h1>
        <p className="mt-2 text-2xl font-semibold text-yale">{formatPrice(post.price, post.price_unit, post.kind)}</p>
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink/80">{post.description}</p>
        <p className="mt-4 text-sm text-ink/45">{timeAgo(post.created_at)}</p>
      </article>
      <aside className="space-y-4">
        <div className="card flex items-center gap-3 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-yale text-sm font-semibold text-white">
            {initials(poster?.name ?? "Y")}
          </div>
          <div>
            <p className="font-medium">{poster?.name ?? "Yale student"}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
              <CollegeBadge college={poster?.college ?? ""} />
              {poster ? <span>{poster.class_year}</span> : null}
            </p>
          </div>
        </div>
        <DealPanel
          postId={post.id}
          kind={post.kind}
          price={post.price}
          priceUnit={post.price_unit}
          status={post.status}
          mine={post.user_id === user.id}
          existing={mine ? { status: mine.status } : null}
        />
      </aside>
    </div>
  );
}
