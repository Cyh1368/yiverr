import Link from "next/link";
import { DealChat, type ChatMessage } from "@/components/DealChat";
import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { formatMoney, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ deal?: string }> }) {
  const me = await requireUser();
  const params = await searchParams;
  const db = await readDB();
  const now = Date.now();

  const conversations = db.deals
    .filter((deal) => deal.from_user_id === me.id || deal.to_user_id === me.id)
    .map((deal) => {
      const post = db.posts.find((entry) => entry.id === deal.post_id);
      const otherId = deal.from_user_id === me.id ? deal.to_user_id : deal.from_user_id;
      const other = db.users.find((entry) => entry.id === otherId);
      const thread = db.messages
        .filter((message) => message.deal_id === deal.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = thread[thread.length - 1];
      return {
        id: deal.id,
        amount: deal.amount,
        status: deal.status,
        direction: deal.to_user_id === me.id ? "received" : "sent",
        postTitle: post?.title ?? "Removed listing",
        postId: post?.id ?? null,
        otherName: other?.name ?? "Yale student",
        otherId,
        lastBody: last?.body ?? deal.message,
        lastFromMe: last ? last.from_user_id === me.id : false,
        lastAt: last?.created_at ?? deal.created_at,
        messages: thread.map((message) => ({
          id: message.id,
          from_user_id: message.from_user_id,
          from_name: db.users.find((entry) => entry.id === message.from_user_id)?.name ?? "Yale student",
          body: message.body,
          ago: timeAgo(message.created_at, now),
        })) satisfies ChatMessage[],
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const selected = conversations.find((entry) => entry.id === params.deal) ?? conversations[0] ?? null;

  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside>
        <h1 className="font-display text-3xl text-yale">Inbox</h1>
        <ul className="mt-4 space-y-2">
          {conversations.length === 0 ? <li className="text-sm text-ink/60">No conversations yet.</li> : null}
          {conversations.map((entry) => {
            const active = selected?.id === entry.id;
            return (
              <li key={entry.id}>
                <Link
                  href={`/inbox?deal=${entry.id}`}
                  className={
                    active
                      ? "block rounded-2xl bg-yale px-3 py-3 text-white"
                      : "block rounded-2xl bg-white px-3 py-3 ring-1 ring-black/5"
                  }
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.otherName}</span>
                    {!entry.lastFromMe ? (
                      <span className={active ? "text-[11px] text-white/80" : "text-[11px] font-semibold text-yale"}>
                        New
                      </span>
                    ) : null}
                  </span>
                  <span className={active ? "mt-1 block text-xs text-white/75" : "mt-1 block text-xs text-ink/50"}>
                    {entry.direction === "received" ? "They offered" : "You offered"} {formatMoney(entry.amount)} · {entry.postTitle}
                  </span>
                  <span className={active ? "mt-1 block truncate text-sm text-white/90" : "mt-1 block truncate text-sm text-ink/70"}>
                    {entry.lastFromMe ? "You: " : ""}
                    {entry.lastBody}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
      <section className="card p-4">
        {selected ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-yale/70">
              {selected.status} · {selected.direction === "received" ? "Deal received" : "Deal sent"}
            </p>
            <h2 className="font-display text-2xl">{selected.otherName}</h2>
            <p className="text-sm text-ink/60">
              {formatMoney(selected.amount)} on{" "}
              {selected.postId ? (
                <Link href={`/post/${selected.postId}`} className="font-medium text-yale">
                  {selected.postTitle}
                </Link>
              ) : (
                selected.postTitle
              )}
            </p>
            <DealChat dealId={selected.id} meId={me.id} messages={selected.messages} />
          </>
        ) : (
          <p className="text-sm text-ink/60">When you book someone, or they book you, the thread shows up here.</p>
        )}
      </section>
    </div>
  );
}
