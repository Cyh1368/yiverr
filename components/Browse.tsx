"use client";

import { useMemo, useState } from "react";
import { PostCard } from "./PostCard";
import { categoriesFor } from "@/lib/constants";
import { kindLabel } from "@/lib/format";
import type { Card, Kind } from "@/lib/types";

const kinds: Kind[] = ["service", "request", "item"];

export function Browse({ posts }: { posts: Card[] }) {
  const [kind, setKind] = useState<Kind>("service");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"new" | "low" | "high">("new");

  const categories = useMemo(() => ["All", ...categoriesFor(kind)], [kind]);
  const visible = useMemo(() => {
    const filtered = posts.filter((post) => post.kind === kind && (category === "All" || post.category === category));
    return [...filtered].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [posts, kind, category, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-yale sm:text-5xl">Find a Yalie.</h1>
      </div>

      <form action="/search" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="q">
          Search with Grok
        </label>
        <input
          id="q"
          name="q"
          required
          className="field h-12"
          placeholder="Search listings"
        />
        <button className="btn-primary h-12 shrink-0 px-6" type="submit">
          Ask Grok
        </button>
      </form>

      <div className="mt-6 grid grid-cols-3 rounded-full bg-white p-1 shadow-sm">
        {kinds.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => {
              setKind(entry);
              setCategory("All");
            }}
            className={
              kind === entry
                ? "rounded-full bg-yale px-3 py-2 text-sm font-semibold text-white"
                : "rounded-full px-3 py-2 text-sm font-semibold text-ink/60"
            }
          >
            {entry === "service" ? "Services" : entry === "request" ? "Requests" : "Items"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              className={
                category === entry ? "chip bg-yale text-white" : "chip bg-white text-ink/70 ring-1 ring-black/5"
              }
            >
              {entry}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          aria-label="Sort listings"
          className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-medium ring-1 ring-black/10"
          value={sort}
          onChange={(event) => setSort(event.target.value as "new" | "low" | "high")}
        >
          <option value="new">Newest</option>
          <option value="low">Price: low</option>
          <option value="high">Price: high</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-ink/50">
        {visible.length} {visible.length === 1 ? kindLabel(kind).toLowerCase() : `${kindLabel(kind).toLowerCase()}s`}
      </p>

      {visible.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-ink/70">Nothing in this category yet.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
