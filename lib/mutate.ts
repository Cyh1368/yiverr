import { validatePostFields, validateProfile, type PostDraft } from "./validate";
import type { DB, Deal, Message, Post, User } from "./types";

export type Mutation<T> = { ok: true; value: T } | { ok: false; error: string };

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function upsertUser(
  db: DB,
  input: {
    name?: unknown;
    email?: unknown;
    college?: unknown;
    class_year?: unknown;
    venmo_handle?: unknown;
  },
): Mutation<User> {
  const parsed = validateProfile(input);
  if (!parsed.ok) return parsed;
  const existing = db.users.find((user) => user.email === parsed.value.email);
  if (existing) return { ok: true, value: existing };
  const user: User = { id: id("u"), ...parsed.value };
  db.users.push(user);
  return { ok: true, value: user };
}

export function createPost(db: DB, userId: string, input: PostDraft & { images?: string[] }): Mutation<Post> {
  const parsed = validatePostFields(input);
  if (!parsed.ok) return parsed;
  if (!db.users.some((user) => user.id === userId)) return { ok: false, error: "Sign in first." };
  const images = (input.images ?? []).filter((path) => /^\/uploads\/[A-Za-z0-9.-]+$/.test(path)).slice(0, 3);
  const post: Post = {
    id: id("p"),
    user_id: userId,
    ...parsed.value,
    images,
    status: "active",
    created_at: new Date().toISOString(),
  };
  db.posts.push(post);
  return { ok: true, value: post };
}

export function setPostStatus(db: DB, userId: string, postId: string, status: unknown): Mutation<Post> {
  if (status !== "active" && status !== "closed") return { ok: false, error: "Status must be active or closed." };
  const post = db.posts.find((entry) => entry.id === postId);
  if (!post) return { ok: false, error: "Listing not found." };
  if (post.user_id !== userId) return { ok: false, error: "You can only change your own listings." };
  post.status = status;
  return { ok: true, value: post };
}

export function deletePost(db: DB, userId: string, postId: string): Mutation<{ id: string }> {
  const post = db.posts.find((entry) => entry.id === postId);
  if (!post) return { ok: false, error: "Listing not found." };
  if (post.user_id !== userId) return { ok: false, error: "You can only delete your own listings." };
  const removedDeals = new Set(db.deals.filter((deal) => deal.post_id === postId).map((deal) => deal.id));
  db.posts = db.posts.filter((entry) => entry.id !== postId);
  db.deals = db.deals.filter((deal) => deal.post_id !== postId);
  db.messages = db.messages.filter((message) => !removedDeals.has(message.deal_id));
  return { ok: true, value: { id: postId } };
}

export function addMessage(db: DB, actorId: string, dealId: string, body: unknown): Mutation<Message> {
  const deal = db.deals.find((entry) => entry.id === dealId);
  if (!deal) return { ok: false, error: "That conversation is gone." };
  if (deal.from_user_id !== actorId && deal.to_user_id !== actorId) {
    return { ok: false, error: "You are not part of this deal." };
  }
  const text = String(body ?? "").trim();
  if (!text || text.length > 500) return { ok: false, error: "Write a message, up to 500 characters." };
  const message: Message = {
    id: id("m"),
    deal_id: deal.id,
    from_user_id: actorId,
    body: text,
    created_at: new Date().toISOString(),
  };
  db.messages.push(message);
  return { ok: true, value: message };
}

export function createDeal(
  db: DB,
  actorId: string,
  input: { post_id?: unknown; amount?: unknown; message?: unknown },
): Mutation<Deal> {
  const post = db.posts.find((entry) => entry.id === input.post_id);
  if (!post) return { ok: false, error: "Listing not found." };
  if (post.status !== "active") return { ok: false, error: "This listing is closed." };
  if (post.user_id === actorId) return { ok: false, error: "That listing is yours." };
  const amount = typeof input.amount === "number" ? input.amount : Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000) return { ok: false, error: "Enter an amount." };
  const message = String(input.message ?? "").trim().slice(0, 500);
  const pending = db.deals.find(
    (deal) => deal.post_id === post.id && deal.from_user_id === actorId && deal.status === "pending",
  );
  if (pending) return { ok: false, error: "You already have a pending offer on this listing." };

  const deal: Deal = {
    id: id("d"),
    post_id: post.id,
    from_user_id: actorId,
    to_user_id: post.user_id,
    amount: Math.round(amount * 100) / 100,
    message,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  db.deals.push(deal);
  return { ok: true, value: deal };
}

export function resolveDeal(
  db: DB,
  actorId: string,
  dealId: string,
  action: unknown,
): Mutation<Deal> {
  if (action !== "accept" && action !== "decline") return { ok: false, error: "Accept or decline the deal." };
  const deal = db.deals.find((entry) => entry.id === dealId);
  if (!deal) return { ok: false, error: "Deal not found." };
  if (deal.to_user_id !== actorId) return { ok: false, error: "Only the recipient can respond." };
  if (deal.status !== "pending") return { ok: false, error: "This deal is already settled." };
  deal.status = action === "accept" ? "accepted" : "declined";
  if (action === "accept") {
    for (const other of db.deals) {
      if (other.post_id === deal.post_id && other.id !== deal.id && other.status === "pending") {
        other.status = "declined";
      }
    }
    const post = db.posts.find((entry) => entry.id === deal.post_id);
    if (post) post.status = "closed";
  }
  return { ok: true, value: deal };
}

export function payeeId(postKind: string, deal: Pick<Deal, "from_user_id" | "to_user_id">) {
  return postKind === "request" ? deal.from_user_id : deal.to_user_id;
}
