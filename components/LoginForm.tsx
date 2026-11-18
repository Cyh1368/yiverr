"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLASS_YEARS, COLLEGES } from "@/lib/constants";
import { collegeShort } from "@/lib/format";

type Seed = { id: string; name: string; college: string; class_year: number };

export function LoginForm({ seeds }: { seeds: Seed[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        college: form.get("college"),
        class_year: form.get("class_year"),
        venmo_handle: form.get("venmo_handle"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function jump(id: string) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Could not switch to that student.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="flex flex-col justify-between bg-yale px-6 py-8 text-white md:px-12 md:py-12">
        <p className="font-display text-3xl">Yiverr</p>
        <div className="my-8">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">The campus marketplace.</h1>
          <p className="mt-4 max-w-sm text-white/75">
            Offer a service, ask for one, or sell what is sitting in your room.
          </p>
        </div>
        <p className="text-sm text-white/60">No password. A Yale email is enough.</p>
      </section>
      <section className="px-6 py-8 md:px-12 md:py-12">
        <h2 className="font-display text-3xl text-ink">Sign in</h2>
        <p className="mt-1 text-sm text-ink/60">Use the email on your Yale ID.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium" htmlFor="name">
            Name
            <input id="name" name="name" required className="field mt-1" placeholder="Cheng-You Ho" />
          </label>
          <label className="block text-sm font-medium" htmlFor="email">
            Yale email
            <input id="email" name="email" type="email" required className="field mt-1" placeholder="chengyou.ho@yale.edu" />
          </label>
          <label className="block text-sm font-medium" htmlFor="college">
            Residential college
            <select id="college" name="college" required className="field mt-1" defaultValue="">
              <option value="" disabled>
                Choose a college
              </option>
              {COLLEGES.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium" htmlFor="class_year">
            Class year
            <select id="class_year" name="class_year" required className="field mt-1" defaultValue="2027">
              {CLASS_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium" htmlFor="venmo_handle">
            Venmo
            <input id="venmo_handle" name="venmo_handle" required className="field mt-1" placeholder="chengyouho" />
          </label>
          {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          <button className="btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter Yiverr"}
          </button>
        </form>
        <div className="mt-8">
          <p className="text-sm font-medium text-ink/60">Or jump in as a student</p>
          <div className="mt-3 grid gap-2">
            {seeds.map((seed) => (
              <button
                key={seed.id}
                type="button"
                disabled={busy}
                onClick={() => jump(seed.id)}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-black/5 hover:ring-yale/30"
              >
                <span>
                  <span className="block font-medium">{seed.name}</span>
                  <span className="text-sm text-ink/55">
                    {collegeShort(seed.college)} · {seed.class_year}
                  </span>
                </span>
                <span className="text-sm font-semibold text-yale">Use</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
