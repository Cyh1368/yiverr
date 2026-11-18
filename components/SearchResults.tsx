"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostCard } from "./PostCard";
import { formatMoney, formatPrice } from "@/lib/format";
import type { Card } from "@/lib/types";

type Payload = {
  query: string;
  source: "grok" | "fallback";
  notice: string | null;
  results: Array<{ post_id: string; reason: string; post: Card }>;
  bundle: null | {
    post_ids: string[];
    total_price: number;
    summary: string;
    posts: Card[];
  };
};

export function SearchResults({ query }: { query: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(95_000),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Search failed.");
        return body as Payload;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (error) {
    return <div className="card p-6 text-sm text-red-800">{error}</div>;
  }
  if (!data) {
    return (
      <div className="card p-8 text-center" role="status">
        <div className="mx-auto mb-4 h-1.5 w-40 overflow-hidden rounded-full bg-yale-soft">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-yale" />
        </div>
        <p className="font-medium text-yale">Grok is searching Yiverr…</p>
      </div>
    );
  }

  const bundleIds = new Set(data.bundle?.post_ids ?? []);
  const rest = data.results.filter((hit) => !bundleIds.has(hit.post_id));
  const reasons = new Map(data.results.map((hit) => [hit.post_id, hit.reason]));

  if (!data.bundle && data.results.length === 0) {
    return (
      <div className="card p-8 text-center">
        {data.notice ? <p className="mb-3 text-sm text-ink/60">{data.notice}</p> : null}
        <p className="font-display text-2xl text-ink">Nothing on Yiverr matches that yet.</p>
        <p className="mt-2 text-sm text-ink/60">Post a request and let someone else answer it.</p>
        <Link href={`/create?kind=request&q=${encodeURIComponent(query)}`} className="btn-primary mt-5">
          Post a request
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.notice ? <p className="text-sm text-ink/60">{data.notice}</p> : null}
      {data.source === "grok" && !data.notice ? <p className="text-sm font-medium text-yale">Ranked by Grok</p> : null}
      {data.bundle ? (
        <section className="card overflow-hidden">
          <div className="border-b border-yale/10 bg-yale px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Bundle</p>
            <h2 className="mt-1 font-display text-2xl">{data.bundle.summary}</h2>
            <p className="mt-2 text-lg font-semibold">{formatMoney(data.bundle.total_price)} total</p>
          </div>
          <ul className="divide-y divide-black/5">
            {data.bundle.posts.map((post) => (
              <li key={post.id}>
                <Link href={`/post/${post.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-yale-soft/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-ink/60">{reasons.get(post.id) || post.category}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-yale">
                    {formatPrice(post.price, post.price_unit, post.kind)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="px-5 py-3 text-xs text-ink/50">Each item is its own listing. Message the seller from the page.</p>
        </section>
      ) : null}
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((hit) => (
            <PostCard key={hit.post_id} post={hit.post} reason={hit.reason} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
