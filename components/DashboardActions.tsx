"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DealActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function act(action: "accept" | "decline") {
    setBusy(action);
    setError("");
    const response = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) {
      setError(data.error || "Could not update that deal.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={!!busy} onClick={() => act("accept")}>
          {busy === "accept" ? "Accepting…" : "Accept"}
        </button>
        <button type="button" className="btn-ghost" disabled={!!busy} onClick={() => act("decline")}>
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

export function PostActions({ id, status }: { id: string; status: "active" | "closed" }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function closeOrOpen() {
    const next = status === "active" ? "closed" : "active";
    setBusy(next);
    setError("");
    const response = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) {
      setError(data.error || "Could not update the listing.");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Delete this listing? Offers on it go away too.")) return;
    setBusy("delete");
    setError("");
    const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) {
      setError(data.error || "Could not delete the listing.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" disabled={!!busy} onClick={closeOrOpen}>
          {busy === "closed" || busy === "active" ? "Saving…" : status === "active" ? "Close" : "Reopen"}
        </button>
        <button type="button" className="btn-danger" disabled={!!busy} onClick={remove}>
          {busy === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
