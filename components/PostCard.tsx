import Link from "next/link";
import { CategoryArt, CollegeBadge } from "./CategoryArt";
import { formatPrice } from "@/lib/format";
import type { Card } from "@/lib/types";

export function PostCard({ post, reason }: { post: Card; reason?: string }) {
  return (
    <Link href={`/post/${post.id}`} className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        {post.images[0] ? (
          <img src={post.images[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <CategoryArt category={post.category} className="h-full w-full" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-yale">
          {post.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-display text-xl leading-snug text-ink group-hover:text-yale">{post.title}</h2>
        <p className="mt-2 text-sm font-semibold text-yale">{formatPrice(post.price, post.price_unit, post.kind)}</p>
        {reason ? <p className="mt-2 text-sm leading-snug text-ink/70">{reason}</p> : null}
        <p className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-sm text-ink/70">
          <span>{post.poster_name}</span>
          <CollegeBadge college={post.poster_college} />
        </p>
      </div>
    </Link>
  );
}
