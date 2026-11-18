import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { isSeedUser } from "@/lib/constants";
import { readDB } from "@/lib/db";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Yiverr", template: "%s · Yiverr" },
  description: "A marketplace for Yale students.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let seedUsers: Array<{ id: string; name: string; college: string }> = [];
  let pending = 0;
  let unread = 0;
  if (user) {
    const db = await readDB();
    seedUsers = db.users
      .filter((entry) => isSeedUser(entry.id))
      .map((entry) => ({ id: entry.id, name: entry.name, college: entry.college }));
    pending = db.deals.filter((deal) => deal.to_user_id === user.id && deal.status === "pending").length;
    unread = db.deals.filter((deal) => {
      if (deal.from_user_id !== user.id && deal.to_user_id !== user.id) return false;
      const last = db.messages
        .filter((message) => message.deal_id === deal.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .at(-1);
      return last ? last.from_user_id !== user.id : false;
    }).length;
  }

  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <Navbar
          user={user ? { id: user.id, name: user.name, college: user.college } : null}
          seedUsers={seedUsers}
          pending={pending}
          unread={unread}
        />
        <main className={user ? "pb-24 md:pb-10" : ""}>{children}</main>
      </body>
    </html>
  );
}
