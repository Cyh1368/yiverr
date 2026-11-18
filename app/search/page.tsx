import { SearchResults } from "@/components/SearchResults";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-4xl text-yale">Search</h1>
      <form action="/search" className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="search-q">
          Search
        </label>
        <input id="search-q" name="q" required defaultValue={query} className="field h-12" placeholder="who can fix my laptop this week" />
        <button className="btn-primary h-12" type="submit">
          Ask Grok
        </button>
      </form>
      <div className="mt-6">
        {query ? (
          <SearchResults key={query} query={query} />
        ) : (
          <p className="text-ink/60">Ask for a person, a thing, or a whole room.</p>
        )}
      </div>
    </div>
  );
}
