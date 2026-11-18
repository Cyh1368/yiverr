import { ITEM_CATEGORIES, SERVICE_CATEGORIES } from "./constants";
import { readDB } from "./db";
import { toCard } from "./format";
import { getGrok, grokJSON } from "./grok";
import { mergeModelSearch } from "./search";
import type { Card, Kind, SearchPlan } from "./types";
import { coerceCategory, coerceCondition, coercePrice, coerceUnit } from "./validate";

const ITEM_LIST = ITEM_CATEGORIES.join(", ");
const SERVICE_LIST = SERVICE_CATEGORIES.join(", ");

export type ListingDraft = {
  title: string;
  description: string;
  category: string;
  condition: string | null;
  suggested_price: number | null;
  price_unit: "fixed" | "hourly" | "obo";
  price_reasoning: string;
};

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function normalizeListing(kind: Kind, raw: unknown): ListingDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = clip(row.title, 80);
  const description = String(row.description ?? "").trim().slice(0, 2000);
  if (title.length < 3 || description.length < 10) return null;
  return {
    title,
    description,
    category: coerceCategory(kind, row.category),
    condition: kind === "item" ? coerceCondition(row.condition) : null,
    suggested_price: coercePrice(row.suggested_price),
    price_unit: coerceUnit(row.price_unit),
    price_reasoning: clip(row.price_reasoning, 240),
  };
}

export async function autofillListing(input: { kind: Kind; sentence?: string; images?: string[] }) {
  if (input.kind === "item") {
    const images = (input.images ?? []).filter((image) => image.startsWith("data:image/"));
    if (!images.length) return { ok: false as const, error: "Add a photo first." };
    const raw = await grokJSON({
      system: [
        "You write item listings for Yiverr, a marketplace where Yale students sell things from their dorm rooms.",
        "Look at the photo or photos and return one JSON object.",
        `category must be exactly one of: ${ITEM_LIST}.`,
        "condition must be exactly one of: new, like new, good, fair, poor.",
        "suggested_price is a whole-dollar campus resale price. A basic chair is often 10 to 40, a mini-fridge 30 to 80, small decor under 25.",
        "price_reasoning is one sentence about that price.",
        "title is short and specific, with no emoji.",
        "description is two or three practical sentences a buyer can trust. Mention what you can see, the condition, and that pickup is from a dorm.",
        "Do not invent a brand you cannot see.",
        'JSON keys: {"title","description","category","condition","suggested_price","price_reasoning"}.',
      ].join(" "),
      userText: "Write the listing from these photos.",
      images: images.slice(0, 3),
    });
    const listing = normalizeListing("item", raw);
    if (!listing) return { ok: false as const, error: "Grok's answer could not be read. Fill in the listing yourself." };
    return { ok: true as const, listing };
  }

  const sentence = (input.sentence ?? "").trim();
  if (sentence.length < 4) return { ok: false as const, error: "Type a sentence first." };
  const asking = input.kind === "request";
  const raw = await grokJSON({
    system: [
      asking
        ? "You write request posts for Yiverr, where a Yale student asks other students for a service or an item."
        : "You write service listings for Yiverr, where Yale students offer to do something for a price.",
      "Turn the student's rough sentence into one JSON object they can edit and post.",
      `category must be exactly one of: ${asking ? `${SERVICE_LIST}, ${ITEM_LIST}` : SERVICE_LIST}.`,
      asking
        ? "suggested_price is their budget in whole dollars. price_unit is fixed, hourly, or obo."
        : "suggested_price is a fair student price in whole dollars. A haircut is often 10 to 25, photos 25 to 50, an hour of labor 15 to 25, a small design job 25 to 60. price_unit is fixed, hourly, or obo.",
      "title is short, with no emoji.",
      asking
        ? "description is two or three sentences about what they need, when, and any detail from their sentence."
        : "description is two or three friendly, specific sentences about what the student will do.",
      'JSON keys: {"title","description","category","suggested_price","price_unit"}.',
    ].join(" "),
    userText: sentence.slice(0, 500),
  });
  const listing = normalizeListing(input.kind, raw);
  if (!listing) return { ok: false as const, error: "Grok's answer could not be read. Fill in the listing yourself." };
  return { ok: true as const, listing };
}

export type SearchResponse = {
  query: string;
  source: "grok" | "fallback";
  notice: string | null;
  results: Array<SearchPlan["results"][number] & { post: Card }>;
  bundle: null | {
    post_ids: string[];
    total_price: number;
    summary: string;
    posts: Card[];
  };
};

export async function smartSearch(query: string): Promise<SearchResponse> {
  const db = await readDB();
  const active = db.posts.filter((post) => post.status === "active");
  let plan: SearchPlan;
  let source: "grok" | "fallback" = "fallback";
  let notice: string | null = null;

  if (!getGrok()) {
    plan = mergeModelSearch(query, active, null);
    notice = "Add XAI_API_KEY to .env.local for Grok search. These matches are local.";
  } else {
    try {
      const compact = active.map((post) => ({
        id: post.id,
        kind: post.kind,
        title: post.title,
        category: post.category,
        price: post.price,
        price_unit: post.price_unit,
        description: post.description.slice(0, 160),
      }));
      const raw = await grokJSON({
        system: [
          "You search Yiverr, a marketplace of posts from Yale students.",
          "Posts are services for sale, items for sale, or requests from someone who needs help.",
          "Return one JSON object: {\"results\":[{\"post_id\":\"\",\"reason\":\"\"}],\"bundle\":null}",
          "results is the best matches, best first, at most 8. reason is one short sentence.",
          "Use only ids from the list. Never invent a post.",
          "If the person wants several things together, such as furnishing a dorm room or a single within a budget, set bundle to {\"post_ids\":[],\"total_price\":0,\"summary\":\"\"}.",
          "A furnish bundle should be item posts only: a chair, light, a rug, storage, and a mini-fridge when they fit. Order post_ids from most useful to least useful.",
          "The prices in bundle must sum to the budget or less when a budget is stated. total_price is that sum.",
          "If a bundle does not make sense, bundle must be null.",
        ].join(" "),
        userText: `Query: ${query}\n\nActive posts:\n${JSON.stringify(compact)}`,
      });
      plan = mergeModelSearch(query, active, raw);
      source = "grok";
    } catch (err) {
      console.error("Grok search failed:", err instanceof Error ? err.message : err);
      plan = mergeModelSearch(query, active, null);
      notice = "Grok didn't answer, so these matches are local.";
    }
  }

  const cards = new Map(db.posts.map((post) => [post.id, toCard(post, db.users)]));
  const results = plan.results.flatMap((hit) => {
    const post = cards.get(hit.post_id);
    return post ? [{ ...hit, post }] : [];
  });
  const bundlePosts = (plan.bundle?.post_ids ?? []).flatMap((id) => {
    const post = cards.get(id);
    return post ? [post] : [];
  });

  return {
    query,
    source,
    notice,
    results,
    bundle:
      plan.bundle && bundlePosts.length
        ? {
            post_ids: bundlePosts.map((post) => post.id),
            total_price: bundlePosts.reduce((sum, post) => sum + post.price, 0),
            summary: plan.bundle.summary,
            posts: bundlePosts,
          }
        : null,
  };
}
