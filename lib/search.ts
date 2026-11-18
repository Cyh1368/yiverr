import { roundMoney } from "./format";
import type { Post, SearchBundle, SearchHit, SearchPlan } from "./types";

const STOP = new Set([
  "a",
  "an",
  "the",
  "for",
  "to",
  "my",
  "me",
  "someone",
  "who",
  "can",
  "this",
  "that",
  "with",
  "under",
  "below",
  "and",
  "or",
  "of",
  "on",
  "in",
  "week",
  "need",
  "looking",
  "i",
  "want",
  "take",
  "get",
  "some",
  "from",
  "your",
  "please",
]);

const SYNONYMS: Record<string, string[]> = {
  photo: ["headshot", "photographer", "photography", "picture"],
  photographer: ["photo", "headshot", "photography"],
  graduation: ["headshot", "photo"],
  laptop: ["computer", "tech"],
  computer: ["laptop"],
  fix: ["repair", "cleanup", "setup"],
  hair: ["fade", "lineup", "cut", "haircut"],
  haircut: ["fade", "lineup", "hair"],
  fade: ["hair", "lineup"],
  move: ["moving", "haul", "assemble", "ikea"],
  moving: ["move", "haul"],
  couch: ["moving", "haul"],
  fridge: ["mini-fridge", "appliance"],
  lamp: ["light"],
  light: ["lamp"],
  logo: ["design", "poster"],
  design: ["logo", "poster"],
};

function stem(token: string) {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

export function extractBudget(query: string): { max: number; inclusive: boolean } | null {
  const under = query.match(/(?:under|below|less than)\s*\$?\s*(\d{1,5})/i);
  if (under) return { max: Number(under[1]), inclusive: false };
  const other =
    query.match(/(?:budget(?: of)?|within|for)\s*\$?\s*(\d{1,5})/i) || query.match(/\$\s*(\d{1,5})/);
  if (!other) return null;
  return { max: Number(other[1]), inclusive: true };
}

function withinBudget(total: number, price: number, budget: { max: number; inclusive: boolean } | null) {
  if (!budget) return true;
  const next = total + price;
  return budget.inclusive ? next <= budget.max : next < budget.max;
}

export function isFurnishQuery(query: string) {
  return /furnish|furniture|decorate|my single|dorm|move-?in kit|outfit (my|a) room/i.test(query);
}

function tokensOf(query: string) {
  const base = query
    .toLowerCase()
    .replace(/[^a-z0-9$ ]/g, " ")
    .split(/\s+/)
    .map(stem)
    .filter((token) => token.length > 2 && !STOP.has(token) && !/^\d+$/.test(token));
  const expanded = new Set(base);
  for (const token of base) {
    for (const synonym of SYNONYMS[token] ?? []) expanded.add(synonym);
  }
  return [...expanded];
}

function furnishRank(post: Post) {
  const text = `${post.title} ${post.category}`.toLowerCase();
  if (text.includes("chair")) return 1;
  if (text.includes("desk lamp")) return 2;
  if (text.includes("rug")) return 3;
  if (text.includes("floor lamp")) return 4;
  if (text.includes("bookshelf") || text.includes("shelf")) return 5;
  if (text.includes("fridge")) return 6;
  if (text.includes("string light")) return 7;
  if (post.category === "Furniture") return 8;
  if (post.category === "Decor") return 9;
  if (post.category === "Appliances") return 10;
  return 50;
}

function fitPosts(posts: Post[], budget: { max: number; inclusive: boolean } | null) {
  const kept: Post[] = [];
  let total = 0;
  for (const post of posts) {
    if (!withinBudget(total, post.price, budget)) continue;
    kept.push(post);
    total += post.price;
  }
  return kept;
}

function bundleFrom(posts: Post[], summary: string): SearchBundle | null {
  if (!posts.length) return null;
  const total = posts.reduce((sum, post) => sum + post.price, 0);
  return {
    post_ids: posts.map((post) => post.id),
    total_price: roundMoney(total),
    summary,
  };
}

function furnishPlan(query: string, posts: Post[]): SearchPlan {
  const budget = extractBudget(query);
  const candidates = posts
    .filter(
      (post) =>
        post.status === "active" &&
        post.kind === "item" &&
        (post.category === "Furniture" || post.category === "Decor" || post.category === "Appliances"),
    )
    .sort((a, b) => furnishRank(a) - furnishRank(b));
  const picked = fitPosts(candidates, budget);
  const total = picked.reduce((sum, post) => sum + post.price, 0);
  const summary = budget
    ? `A set to furnish a single ${budget.inclusive ? "within" : "under"} $${budget.max}. Total $${roundMoney(total)}.`
    : `A set to furnish a single. Total $${roundMoney(total)}.`;
  return {
    results: picked.map((post) => ({
      post_id: post.id,
      reason: `${post.category} for a dorm single, $${post.price}.`,
    })),
    bundle: bundleFrom(picked, summary),
  };
}

function scorePost(post: Post, tokens: string[], query: string) {
  const title = post.title.toLowerCase();
  const description = post.description.toLowerCase();
  const category = post.category.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    if (category.includes(token)) score += 3;
    if (description.includes(token)) score += 2;
  }
  if (/someone|who can|hire|book/i.test(query) && post.kind === "service") score += 3;
  if (/someone|who can|hire/i.test(query) && post.kind === "request") score -= 2;
  if (isFurnishQuery(query) && post.kind === "item") score += 2;
  return score;
}

export function fallbackSearch(query: string, posts: Post[]): SearchPlan {
  if (isFurnishQuery(query)) return furnishPlan(query, posts);
  const budget = extractBudget(query);
  const tokens = tokensOf(query);
  const ranked = posts
    .filter((post) => post.status === "active")
    .map((post) => ({ post, score: scorePost(post, tokens, query) }))
    .filter((entry) => entry.score > 0)
    .filter((entry) => withinBudget(0, entry.post.price, budget))
    .sort((a, b) => b.score - a.score || a.post.price - b.post.price)
    .slice(0, 8);
  return {
    results: ranked.map(({ post }) => ({
      post_id: post.id,
      reason: `${post.category} · $${post.price}.`,
    })),
    bundle: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mergeModelSearch(query: string, posts: Post[], raw: unknown): SearchPlan {
  const active = posts.filter((post) => post.status === "active");
  const byId = new Map(active.map((post) => [post.id, post]));
  const budget = extractBudget(query);
  const obj = asRecord(raw);
  const results: SearchHit[] = [];
  let bundleIds: string[] = [];
  let summary = "";

  if (obj) {
    const list = Array.isArray(obj.results) ? obj.results : [];
    for (const item of list) {
      const row = asRecord(item);
      if (!row) continue;
      const postId = String(row.post_id ?? "");
      if (!byId.has(postId) || results.some((hit) => hit.post_id === postId)) continue;
      const reason = String(row.reason ?? "").trim().slice(0, 180);
      results.push({ post_id: postId, reason: reason || "Matches your search." });
    }
    const bundle = asRecord(obj.bundle);
    if (bundle) {
      summary = String(bundle.summary ?? "").trim().slice(0, 280);
      const ids = Array.isArray(bundle.post_ids) ? bundle.post_ids : [];
      for (const id of ids) {
        const post = byId.get(String(id));
        if (!post || post.kind !== "item" || bundleIds.includes(post.id)) continue;
        bundleIds.push(post.id);
      }
    }
  }

  if (budget && bundleIds.length) {
    const kept: string[] = [];
    let total = 0;
    for (const id of bundleIds) {
      const price = byId.get(id)?.price ?? 0;
      if (!withinBudget(total, price, budget)) continue;
      kept.push(id);
      total += price;
    }
    bundleIds = kept;
  }

  const local = fallbackSearch(query, posts);
  if (!bundleIds.length && isFurnishQuery(query) && local.bundle) {
    bundleIds = local.bundle.post_ids;
    if (!summary) summary = local.bundle.summary;
  }
  if (!results.length) {
    if (!bundleIds.length) return local;
    const localReason = new Map(local.results.map((hit) => [hit.post_id, hit.reason]));
    for (const id of bundleIds) {
      const post = byId.get(id);
      results.push({
        post_id: id,
        reason: localReason.get(id) || (post ? `${post.category}, $${post.price}.` : "Part of the bundle."),
      });
    }
  }

  const total = bundleIds.reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0);
  const bundle: SearchBundle | null = bundleIds.length
    ? {
        post_ids: bundleIds,
        total_price: roundMoney(total),
        summary:
          summary ||
          (budget
            ? `A set to furnish a single ${budget.inclusive ? "within" : "under"} $${budget.max}. Total $${roundMoney(total)}.`
            : `A set of campus listings. Total $${roundMoney(total)}.`),
      }
    : null;

  return { results: results.slice(0, 8), bundle };
}
