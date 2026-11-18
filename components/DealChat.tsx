"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  from_user_id: string;
  from_name: string;
  body: string;
  ago: string;
};

export function DealChat({
  dealId,
  meId,
  messages,
}: {
  dealId: string;
  meId: string;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/deals/${dealId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not send that.");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-2xl bg-paper p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Chat</p>
      <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? <p className="text-sm text-ink/50">No messages yet.</p> : null}
        {messages.map((message) => {
          const mine = message.from_user_id === meId;
          return (
            <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div className={mine ? "max-w-[80%] text-right" : "max-w-[80%]"}>
                <p className="text-[11px] text-ink/45">
                  {mine ? "You" : message.from_name} · {message.ago}
                </p>
                <p
                  className={
                    mine
                      ? "mt-0.5 inline-block rounded-2xl rounded-br-md bg-yale px-3 py-2 text-left text-sm text-white"
                      : "mt-0.5 inline-block rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-ink ring-1 ring-black/5"
                  }
                >
                  {message.body}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor={`chat-${dealId}`}>
          Message
        </label>
        <input
          id={`chat-${dealId}`}
          className="field"
          value={text}
          placeholder="Write a message"
          onChange={(event) => setText(event.target.value)}
        />
        <button className="btn-primary shrink-0" type="submit" disabled={busy || !text.trim()}>
          {busy ? "Sending…" : "Send"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
