import Link from "next/link";
import { DealActions, PostActions } from "@/components/DashboardActions";
import { DealChat, type ChatMessage } from "@/components/DealChat";
import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { formatMoney, formatPrice, kindLabel, timeAgo } from "@/lib/format";
import { payeeId } from "@/lib/mutate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const me = await requireUser();
  const db = await readDB();
  const now = Date.now();
  const posts = db.posts
    .filter((post) => post.user_id === me.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const deals = db.deals
    .filter((deal) => deal.from_user_id === me.id || deal.to_user_id === me.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((deal) => {
      const post = db.posts.find((entry) => entry.id === deal.post_id) ?? null;
      const otherId = deal.from_user_id === me.id ? deal.to_user_id : deal.from_user_id;
      const other = db.users.find((entry) => entry.id === otherId) ?? null;
      const payee = post ? db.users.find((entry) => entry.id === payeeId(post.kind, deal)) ?? null : null;
      const accepted = deal.status === "accepted";
      const thread = db.messages
        .filter((message) => message.deal_id === deal.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return {
        deal,
        post,
        direction: deal.to_user_id === me.id ? "received" : "sent",
        otherName: other?.name ?? "Yale student",
        otherEmail: accepted ? other?.email ?? "" : "",
        payeeName: payee?.name ?? "",
        payeeHandle: accepted ? payee?.venmo_handle ?? "" : "",
        iAmPayee: payee?.id === me.id,
        ago: timeAgo(deal.created_at, now),
        messages: thread.map((message) => ({
          id: message.id,
          from_user_id: message.from_user_id,
          from_name: db.users.find((entry) => entry.id === message.from_user_id)?.name ?? "Yale student",
          body: message.body,
          ago: timeAgo(message.created_at, now),
        })),
      };
    });

  const received = deals.filter((entry) => entry.direction === "received");
  const sent = deals.filter((entry) => entry.direction === "sent");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
      <div>
        <h1 className="font-display text-4xl text-yale">Your Yiverr</h1>
        <p className="mt-1 text-ink/60">
          {me.name} · {me.email}
        </p>
      </div>

      <section>
        <h2 className="font-display text-2xl">My posts</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            You have not posted yet. <Link className="font-semibold text-yale" href="/create">Start one.</Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-yale/70">
                      {kindLabel(post.kind)} · {post.status}
                    </p>
                    <Link href={`/post/${post.id}`} className="font-display text-xl hover:text-yale">
                      {post.title}
                    </Link>
                    <p className="text-sm text-ink/60">
                      {formatPrice(post.price, post.price_unit, post.kind)} · {timeAgo(post.created_at, now)}
                    </p>
                  </div>
                </div>
                <PostActions id={post.id} status={post.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Deals received</h2>
        {received.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">When someone books you, or answers your request, it shows up here.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {received.map((entry) => (
              <li key={entry.deal.id} className="card p-4">
                <DealBody entry={entry} />
                {entry.deal.status === "pending" ? <DealActions id={entry.deal.id} /> : null}
                <DealChat dealId={entry.deal.id} meId={me.id} messages={entry.messages} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Deals sent</h2>
        {sent.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Offers you send from a listing land here.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sent.map((entry) => (
              <li key={entry.deal.id} className="card p-4">
                <DealBody entry={entry} />
                <DealChat dealId={entry.deal.id} meId={me.id} messages={entry.messages} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DealBody({
  entry,
}: {
  entry: {
    deal: { amount: number; message: string; status: string };
    post: { id: string; title: string; kind: "service" | "item" | "request" } | null;
    direction: string;
    otherName: string;
    otherEmail: string;
    payeeName: string;
    payeeHandle: string;
    iAmPayee: boolean;
    ago: string;
    messages: ChatMessage[];
  };
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
        {entry.deal.status} · {entry.ago}
      </p>
      <p className="mt-1 font-medium">
        {entry.direction === "received" ? entry.otherName : "You"} · {formatMoney(entry.deal.amount)}
        {entry.post ? (
          <>
            {" "}
            on{" "}
            <Link href={`/post/${entry.post.id}`} className="text-yale">
              {entry.post.title}
            </Link>
          </>
        ) : (
          " on a removed listing"
        )}
      </p>
      {entry.deal.message ? <p className="mt-2 text-sm text-ink/70">“{entry.deal.message}”</p> : null}
      {entry.deal.status === "accepted" ? (
        <div className="mt-3 rounded-2xl bg-yale-soft p-3 text-sm">
          {entry.otherEmail ? (
            <p>
              Email {entry.otherName} at{" "}
              <a className="font-semibold text-yale" href={`mailto:${entry.otherEmail}`}>
                {entry.otherEmail}
              </a>
            </p>
          ) : null}
          {entry.payeeHandle ? (
            <>
              <a
                className="btn-primary mt-3"
                href={`https://venmo.com/${entry.payeeHandle}`}
                target="_blank"
                rel="noreferrer"
              >
                Pay with Venmo
              </a>
              <p className="mt-2 text-xs text-ink/70">
                {entry.iAmPayee
                  ? `This opens your Venmo, @${entry.payeeHandle}. ${entry.otherName} pays you there.`
                  : `Pay ${entry.payeeName} (@${entry.payeeHandle}).`}
              </p>
              <p className="text-xs text-ink/70">Mark the payment as Goods & Services.</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
