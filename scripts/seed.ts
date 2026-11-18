import { writeDB } from "../lib/db";
import { buildSeed } from "../lib/seed-data";

async function main() {
  const db = buildSeed();
  await writeDB(db);
  const services = db.posts.filter((post) => post.kind === "service").length;
  const requests = db.posts.filter((post) => post.kind === "request").length;
  const items = db.posts.filter((post) => post.kind === "item").length;
  console.log(
    `Seeded ${db.users.length} users and ${db.posts.length} posts (${services} services, ${requests} requests, ${items} items).`,
  );
}

main();
