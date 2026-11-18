"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { categoriesFor, CONDITIONS, SERVICE_CATEGORIES, ITEM_CATEGORIES } from "@/lib/constants";
import { resizeImage } from "@/lib/resize-image";
import type { Kind, PriceUnit } from "@/lib/types";

const kinds: Array<{ id: Kind; title: string; body: string }> = [
  { id: "service", title: "Offer a service", body: "Haircuts, photos, moving, design, a ride." },
  { id: "request", title: "Ask for something", body: "Name what you need and what you can pay." },
  { id: "item", title: "Sell an item", body: "The mini-fridge, the lamp, the coat that does not fit." },
];

function isKind(value: string): value is Kind {
  return value === "service" || value === "request" || value === "item";
}

export function CreateForm({ initialKind, initialQuery }: { initialKind: string; initialQuery: string }) {
  const router = useRouter();
  const starting = isKind(initialKind) ? initialKind : null;
  const [kind, setKind] = useState<Kind | null>(starting);
  const [sentence, setSentence] = useState(initialQuery);
  const [title, setTitle] = useState(initialQuery.slice(0, 80));
  const [description, setDescription] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("fixed");
  const [condition, setCondition] = useState("good");
  const [photos, setPhotos] = useState<Array<{ id: string; dataUrl: string }>>([]);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiNote, setAiNote] = useState("");

  const categories = useMemo(() => (kind ? categoriesFor(kind) : []), [kind]);

  function choose(next: Kind) {
    setKind(next);
    setCategory("");
    setReasoning("");
    setError("");
    setAiNote("");
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const room = 3 - photos.length;
    if (room <= 0) {
      setError("Three photos is the limit.");
      return;
    }
    const next = [...photos];
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const dataUrl = await resizeImage(file);
        next.push({ id: crypto.randomUUID(), dataUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that photo.");
      }
    }
    setPhotos(next);
  }

  async function writeWithGrok() {
    if (!kind) return;
    setLoading(true);
    setError("");
    setAiNote("");
    try {
      const response = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          sentence,
          images: kind === "item" ? photos.map((photo) => photo.dataUrl) : [],
        }),
        signal: AbortSignal.timeout(95_000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAiNote(data.error || "Grok could not write that. Fill in the listing yourself.");
        return;
      }
      const listing = data.listing;
      setTitle(listing.title || "");
      setDescription(listing.description || "");
      setCategory(listing.category || "");
      if (listing.suggested_price != null) setPrice(String(listing.suggested_price));
      if (listing.price_unit) setPriceUnit(listing.price_unit);
      if (listing.condition) setCondition(listing.condition);
      setReasoning(listing.price_reasoning || "");
    } catch (err) {
      setAiNote(err instanceof Error ? err.message : "Grok could not write that. Fill in the listing yourself.");
    } finally {
      setLoading(false);
    }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!kind) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        title,
        description,
        category,
        price: Number(price),
        price_unit: priceUnit,
        condition: kind === "item" ? condition : null,
        images: photos.map((photo) => photo.dataUrl),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not post that.");
      return;
    }
    router.push(`/post/${data.post.id}`);
    router.refresh();
  }

  if (!kind) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-4xl text-yale">What are you posting?</h1>
        <div className="mt-6 grid gap-3">
          {kinds.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => choose(entry.id)}
              className="card p-5 text-left hover:ring-2 hover:ring-yale/30"
            >
              <span className="font-display text-2xl">{entry.title}</span>
              <span className="mt-1 block text-sm text-ink/60">{entry.body}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const kindMeta = kinds.find((entry) => entry.id === kind)!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button type="button" onClick={() => setKind(null)} className="text-sm font-medium text-yale">
        Change type
      </button>
      <h1 className="mt-2 font-display text-4xl text-yale">{kindMeta.title}</h1>

      <section className="card mt-6 p-5">
        {kind === "item" ? (
          <div>
            <p className="font-medium">Start with a photo</p>
            <p className="mt-1 text-sm text-ink/60">Add 1 to 3 photos. Grok will draft the listing. You can edit every field.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-2xl">
                  <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-xs"
                    onClick={() => setPhotos(photos.filter((entry) => entry.id !== photo.id))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {photos.length < 3 ? (
                <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-2xl border border-dashed border-yale/30 text-sm font-medium text-yale">
                  Add
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      void addPhotos(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <label className="font-medium" htmlFor="sentence">
              Start with a sentence
            </label>
            <textarea
              id="sentence"
              className="field mt-2 min-h-24"
              placeholder={kind === "service" ? "I can cut hair in my dorm" : "Need two people to help move a couch Saturday"}
              value={sentence}
              onChange={(event) => setSentence(event.target.value)}
            />
          </div>
        )}
        <button type="button" className="btn-primary mt-4" onClick={writeWithGrok} disabled={loading}>
          {loading ? "Writing…" : "Write with Grok"}
        </button>
        {loading ? (
          <p className="mt-3 rounded-2xl bg-yale px-4 py-3 text-sm font-medium text-white" role="status">
            Grok is writing your listing…
          </p>
        ) : null}
        {aiNote ? <p className="mt-3 text-sm text-ink/70">{aiNote}</p> : null}
      </section>

      <form onSubmit={publish} className="card mt-4 space-y-3 p-5">
        <label className="block text-sm font-medium" htmlFor="title">
          Title
          <input id="title" required maxLength={80} className="field mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="block text-sm font-medium" htmlFor="description">
          Description
          <textarea
            id="description"
            required
            className="field mt-1 min-h-32"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="category">
          Category
          <select
            id="category"
            required
            className="field mt-1"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {kind === "request" ? (
              <>
                <optgroup label="Services">
                  {SERVICE_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Items">
                  {ITEM_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))
            )}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium" htmlFor="price">
            {kind === "request" ? "Budget" : "Price"}
            <input
              id="price"
              inputMode="decimal"
              required
              className="field mt-1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="price_unit">
            Rate
            <select
              id="price_unit"
              className="field mt-1"
              value={priceUnit}
              onChange={(event) => setPriceUnit(event.target.value as PriceUnit)}
            >
              <option value="fixed">{kind === "request" ? "Fixed budget" : "Fixed price"}</option>
              <option value="hourly">Per hour</option>
              <option value="obo">Or best offer</option>
            </select>
          </label>
        </div>
        {reasoning ? <p className="text-sm text-ink/60">Grok: {reasoning}</p> : null}
        {kind === "item" ? (
          <label className="block text-sm font-medium" htmlFor="condition">
            Condition
            <select
              id="condition"
              className="field mt-1 capitalize"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
            >
              {CONDITIONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <button className="btn-primary w-full" type="submit" disabled={busy || loading}>
          {busy ? "Posting…" : "Post listing"}
        </button>
      </form>
    </div>
  );
}
