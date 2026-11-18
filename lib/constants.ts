import type { Kind, PriceUnit } from "./types";

export const COLLEGES = [
  "Berkeley College",
  "Branford College",
  "Davenport College",
  "Ezra Stiles College",
  "Jonathan Edwards College",
  "Benjamin Franklin College",
  "Grace Hopper College",
  "Morse College",
  "Pauli Murray College",
  "Pierson College",
  "Saybrook College",
  "Silliman College",
  "Timothy Dwight College",
  "Trumbull College",
] as const;

export const CLASS_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export const SERVICE_CATEGORIES = [
  "Photography",
  "Design & Creative",
  "Hair & Beauty",
  "Moving & Labor",
  "Tech Help & Repair",
  "Music & Performance",
  "Errands & Delivery",
  "Other Services",
] as const;

export const ITEM_CATEGORIES = [
  "Furniture",
  "Appliances",
  "Electronics",
  "Clothing",
  "Decor",
  "Books",
  "Other Items",
] as const;

export const CONDITIONS = ["new", "like new", "good", "fair", "poor"] as const;

export const PRICE_UNITS: PriceUnit[] = ["fixed", "hourly", "obo"];

export const SEED_USER_IDS = ["u_chengyou", "u_carter", "u_carlos"] as const;

export function isSeedUser(id: string) {
  return (SEED_USER_IDS as readonly string[]).includes(id);
}

export function categoriesFor(kind: Kind): readonly string[] {
  if (kind === "item") return ITEM_CATEGORIES;
  if (kind === "service") return SERVICE_CATEGORIES;
  return [...SERVICE_CATEGORIES, ...ITEM_CATEGORIES];
}

export const CATEGORY_META: Record<string, { emoji: string; from: string; to: string }> = {
  Photography: { emoji: "📷", from: "#00356B", to: "#5B8BB5" },
  "Design & Creative": { emoji: "✏️", from: "#5C3D2E", to: "#C4A484" },
  "Hair & Beauty": { emoji: "✂️", from: "#3D2B4D", to: "#A07AB5" },
  "Moving & Labor": { emoji: "📦", from: "#1F3D2B", to: "#6A9A78" },
  "Tech Help & Repair": { emoji: "💻", from: "#102A43", to: "#3D7EA6" },
  "Music & Performance": { emoji: "🎵", from: "#3A1D3A", to: "#C46B8A" },
  "Errands & Delivery": { emoji: "🚲", from: "#3E2F1C", to: "#C4A15A" },
  "Other Services": { emoji: "✨", from: "#243038", to: "#6D7C89" },
  Furniture: { emoji: "🪑", from: "#3F2A1D", to: "#A97449" },
  Appliances: { emoji: "🧊", from: "#12343A", to: "#3E8B8B" },
  Electronics: { emoji: "🔌", from: "#1B2430", to: "#4C6A92" },
  Clothing: { emoji: "🧥", from: "#3A2430", to: "#B76E79" },
  Decor: { emoji: "🪞", from: "#2C3A28", to: "#8AA36A" },
  Books: { emoji: "📚", from: "#2A241B", to: "#8C7355" },
  "Other Items": { emoji: "🏷️", from: "#2A3140", to: "#7D8BA1" },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? { emoji: "🏷️", from: "#00356B", to: "#4E7EA3" };
}
