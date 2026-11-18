"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { collegeShort, cx } from "@/lib/format";

type NavUser = {
  id: string;
  name: string;
  college: string;
};

const links = [
  { href: "/", label: "Browse" },
  { href: "/create", label: "Post" },
  { href: "/inbox", label: "Inbox" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar({
  user,
  seedUsers,
  pending,
  unread,
}: {
  user: NavUser | null;
  seedUsers: NavUser[];
  pending: number;
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  if (pathname === "/login") return null;

  const options = user && !seedUsers.some((entry) => entry.id === user.id) ? [user, ...seedUsers] : seedUsers;

  function active(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/post") || pathname.startsWith("/search");
    if (href === "/inbox") return pathname.startsWith("/inbox");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function onSwitch(userId: string) {
    if (!user || userId === user.id) return;
    setSwitching(true);
    await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setSwitching(false);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-yale/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl text-yale">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-yale text-sm font-sans font-bold text-white">Y</span>
            Yiverr
          </Link>
          {user ? (
            <nav className="ml-4 hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active(link.href) ? "page" : undefined}
                  className={cx(
                    "relative rounded-full px-3 py-1.5 text-sm font-medium",
                    active(link.href) ? "bg-yale text-white" : "text-ink/70 hover:bg-white",
                  )}
                >
                  {link.label}
                  {link.href === "/dashboard" && pending > 0 ? (
                    <span
                      className={cx(
                        "ml-1.5 inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold",
                        active(link.href) ? "bg-white text-yale" : "bg-yale text-white",
                      )}
                    >
                      {pending}
                    </span>
                  ) : null}
                  {link.href === "/inbox" && unread > 0 ? (
                    <span
                      className={cx(
                        "ml-1.5 inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold",
                        active(link.href) ? "bg-white text-yale" : "bg-yale text-white",
                      )}
                    >
                      {unread}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <label className="hidden text-xs font-semibold uppercase tracking-wide text-ink/45 sm:inline" htmlFor="switch-user">
                  Switch user
                </label>
                <select
                  id="switch-user"
                  aria-label="Switch user"
                  className="max-w-[46vw] rounded-full bg-white px-3 py-1.5 text-sm font-medium text-yale ring-1 ring-yale/15 sm:max-w-xs"
                  value={user.id}
                  disabled={switching}
                  onChange={(event) => onSwitch(event.target.value)}
                >
                  {options.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} · {collegeShort(entry.college)}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={logout} className="hidden text-sm font-medium text-ink/60 hover:text-yale sm:inline">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      {user ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-yale/10 bg-white/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "relative px-1 py-3 text-center text-xs font-semibold",
                  active(link.href) ? "text-yale" : "text-ink/45",
                )}
              >
                {link.label}
                {link.href === "/dashboard" && pending > 0 ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-yale px-1 text-[11px] font-bold text-white">
                    {pending}
                  </span>
                ) : null}
                {link.href === "/inbox" && unread > 0 ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-yale px-1 text-[11px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </>
  );
}
