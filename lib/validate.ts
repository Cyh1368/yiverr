import { categoriesFor, CLASS_YEARS, COLLEGES, CONDITIONS, PRICE_UNITS } from "./constants";
import type { Kind, PriceUnit } from "./types";

export type Fail = { ok: false; error: string };
export type Ok<T> = { ok: true; value: T };

export function fail(error: string): Fail {
  return { ok: false, error };
}

export function coerceCategory(kind: Kind, category: unknown) {
  const list = categoriesFor(kind);
  const text = String(category ?? "").trim().toLowerCase();
  return list.find((entry) => entry.toLowerCase() === text) ?? (kind === "item" ? "Other Items" : "Other Services");
}

export function coerceCondition(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  return CONDITIONS.find((entry) => entry === text) ?? "good";
}

export function coerceUnit(value: unknown): PriceUnit {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "hourly" || text === "hour" || text === "hr" || text === "per hour") return "hourly";
  if (text === "obo" || text.includes("best offer")) return "obo";
  return "fixed";
}

export function coercePrice(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > 10000) return null;
    return Math.round(value);
  }
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000) return null;
  return Math.round(amount);
}

const EMAIL = /^[A-Za-z0-9._%+-]+@yale\.edu$/i;

export function validateProfile(input: {
  name?: unknown;
  email?: unknown;
  college?: unknown;
  class_year?: unknown;
  venmo_handle?: unknown;
}) {
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const email = String(input.email ?? "").trim().toLowerCase();
  const college = String(input.college ?? "").trim();
  const year = Number(input.class_year);
  const venmo = String(input.venmo_handle ?? "").trim().replace(/^@/, "");

  if (name.length < 2 || name.length > 40) return fail("Enter your name.");
  if (!EMAIL.test(email)) return fail("Use your @yale.edu email.");
  if (!(COLLEGES as readonly string[]).includes(college)) return fail("Pick a residential college.");
  if (!(CLASS_YEARS as readonly number[]).includes(year)) return fail("Pick a class year.");
  if (!/^[A-Za-z0-9_-]{2,30}$/.test(venmo)) return fail("Enter a Venmo handle, without the @.");

  return {
    ok: true as const,
    value: { name, email, college, class_year: year, venmo_handle: venmo },
  };
}

export type PostDraft = {
  kind: Kind;
  title: string;
  description: string;
  category: string;
  price: number;
  price_unit: PriceUnit;
  condition: string | null;
};

export function validatePostFields(input: {
  kind?: unknown;
  title?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  price_unit?: unknown;
  condition?: unknown;
}): Ok<PostDraft> | Fail {
  const kind = input.kind;
  if (kind !== "service" && kind !== "item" && kind !== "request") {
    return fail("Pick a service, request, or item.");
  }
  const title = String(input.title ?? "").trim().replace(/\s+/g, " ");
  const description = String(input.description ?? "").trim();
  if (title.length < 3 || title.length > 80) return fail("Give it a title, up to 80 characters.");
  if (description.length < 10 || description.length > 2000) {
    return fail("Add a description of at least a sentence.");
  }
  const allowed = categoriesFor(kind);
  const category = allowed.find((entry) => entry === String(input.category ?? "").trim());
  if (!category) return fail("Pick a category from the list.");
  const price = typeof input.price === "number" ? input.price : Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000) return fail("Enter a price between 0 and 10000.");
  const unit = input.price_unit;
  if (unit !== "fixed" && unit !== "hourly" && unit !== "obo") return fail("Pick a price type.");
  let condition: string | null = null;
  if (kind === "item") {
    const found = CONDITIONS.find((entry) => entry === String(input.condition ?? "").trim().toLowerCase());
    if (!found) return fail("Pick a condition.");
    condition = found;
  }
  if (!PRICE_UNITS.includes(unit)) return fail("Pick a price type.");
  return {
    ok: true,
    value: {
      kind,
      title,
      description,
      category,
      price: Math.round(price * 100) / 100,
      price_unit: unit,
      condition,
    },
  };
}
