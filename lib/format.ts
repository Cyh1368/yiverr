import type { Kind, Post, PriceUnit, User } from "./types";
import type { Card } from "./types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatMoney(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}

export function formatPrice(price: number, unit: PriceUnit | string, kind: Kind | string) {
  const money = formatMoney(price);
  if (kind === "request") {
    return unit === "hourly" ? `${money}/hr budget` : `${money} budget`;
  }
  if (unit === "hourly") return `${money}/hr`;
  if (unit === "obo") return `${money} OBO`;
  return money;
}

export function collegeShort(college: string) {
  return college.replace(/ College$/, "");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeAgo(iso: string, now = Date.now()) {
  const delta = now - new Date(iso).getTime();
  const min = Math.max(1, Math.round(delta / 60000));
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function kindLabel(kind: Kind | string) {
  if (kind === "service") return "Service";
  if (kind === "request") return "Request";
  return "Item";
}

export function actionLabel(kind: Kind | string) {
  if (kind === "service") return "Book";
  if (kind === "request") return "I can do this";
  return "Buy";
}

export function toCard(post: Post, users: User[], now = Date.now()): Card {
  const user = users.find((entry) => entry.id === post.user_id);
  return {
    id: post.id,
    kind: post.kind,
    title: post.title,
    description: post.description,
    category: post.category,
    price: post.price,
    price_unit: post.price_unit,
    condition: post.condition,
    images: post.images,
    status: post.status,
    created_at: post.created_at,
    ago: timeAgo(post.created_at, now),
    poster_name: user?.name ?? "Yale student",
    poster_college: user?.college ?? "",
    poster_year: user?.class_year ?? 0,
  };
}

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
