"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actionLabel, formatPrice } from "@/lib/format";
import type { DealStatus, Kind, PostStatus, PriceUnit } from "@/lib/types";

const placeholders: Record<Kind, string> = {
  service: "Does Thursday after class work?",
  item: "I can pick this up this weekend.",
  request: "I can do this Saturday.",
};

export function DealPanel({
  postId,
  kind,
  price,
  priceUnit,
  status,
  mine,
  existing,
}: {
  postId: string;
  kind: Kind;
  price: number;
  priceUnit: PriceUnit;
  status: PostStatus;
  mine: boolean;
  existing: { status: DealStatus } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(price));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const label = actionLabel(kind);

  if (mine) {
    return (
      <div className="rounded-3xl bg-yale-soft p-4 text-sm">
        <p className="font-medium text-yale">This is your listing.</p>
        <Link href="/dashboard" className="mt-2 inline-block font-semibold text-yale underline">
          Manage it on your dashboard
        </Link>
      </div>
    );
  }

  if (status === "closed") {
    return <div className="rounded-3xl bg-white p-4 text-sm text-ink/70 ring-1 ring-black/5">This listing is closed.</div>;
  }

  if (sent || existing?.status === "pending") {
    return (
      <div className="rounded-3xl bg-yale-soft p-4 text-sm">
        <p className="font-medium text-yale">Offer sent.</p>
        <p className="mt-1 text-ink/70">It is waiting on their dashboard.</p>
        <Link href="/dashboard" className="mt-2 inline-block font-semibold text-yale underline">
          See deals sent
        </Link>
      </div>
    );
  }

  if (existing?.status === "accepted") {
    return (
      <div className="rounded-3xl bg-yale-soft p-4 text-sm">
        <p className="font-medium text-yale">This deal is accepted.</p>
        <Link href="/dashboard" className="mt-2 inline-block font-semibold text-yale underline">
          Open Venmo from your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <p className="text-sm text-ink/60">{kind === "request" ? "Their budget" : "Listed at"}</p>
      <p className="font-display text-3xl text-yale">{formatPrice(price, priceUnit, kind)}</p>
      {existing?.status === "declined" ? (
        <p className="mt-2 text-sm text-ink/60">Your last offer was declined. You can send another.</p>
      ) : null}
      {!open ? (
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => setOpen(true)}>
          {label}
        </button>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const response = await fetch("/api/deals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ post_id: postId, amount: Number(amount), message }),
            });
            const data = await response.json().catch(() => ({}));
            setBusy(false);
            if (!response.ok) {
              setError(data.error || "Could not send that.");
              return;
            }
            setSent(true);
            router.refresh();
          }}
        >
          <label className="block text-sm font-medium" htmlFor="amount">
            {kind === "request" ? "Your price" : "Amount"}
            <input
              id="amount"
              inputMode="decimal"
              required
              className="field mt-1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="message">
            Message
            <textarea
              id="message"
              className="field mt-1 min-h-24"
              placeholder={placeholders[kind]}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit" disabled={busy}>
              {busy ? "Sending…" : label}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
