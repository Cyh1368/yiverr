import { ITEM_CATEGORIES, SERVICE_CATEGORIES } from "../lib/constants";
import { buildSeed } from "../lib/seed-data";
import { addMessage, createDeal, resolveDeal, upsertUser } from "../lib/mutate";
import { fallbackSearch } from "../lib/search";

function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

const db = buildSeed();
assert(db.users.length === 3, "3 users");
assert(db.posts.filter((post) => post.user_id === "u_chengyou").length === 2, "Cheng-You has 2 posts");
assert(db.deals.filter((deal) => deal.to_user_id === "u_chengyou").length === 3, "Cheng-You has 3 deals received");
for (const category of [...SERVICE_CATEGORIES, ...ITEM_CATEGORIES]) {
  const count = db.posts.filter((post) => post.category === category).length;
  assert(count >= 3, `${category} has ${count}`);
}
assert(
  db.posts.every((post) => post.images[0]?.startsWith("https://images.unsplash.com/")),
  "every listing has an external photo",
);
for (const deal of db.deals.filter((entry) => entry.to_user_id === "u_chengyou")) {
  const fromOther = db.messages.some(
    (message) => message.deal_id === deal.id && message.from_user_id !== "u_chengyou",
  );
  assert(fromOther, `${deal.id} already has a message from the other person`);
}

const furnish = fallbackSearch("furnish my single for under $150", db.posts);
assert(furnish.bundle, "furnish bundle exists");
assert(furnish.bundle!.total_price < 150, `bundle total ${furnish.bundle!.total_price} is under 150`);
assert(furnish.bundle!.post_ids.length >= 3, "bundle has several items");
assert(furnish.bundle!.post_ids.includes("p_chair"), "bundle includes the chair");
assert(furnish.bundle!.post_ids.includes("p_floorlamp"), "bundle includes the floor lamp");
assert(furnish.bundle!.post_ids.includes("p_rug"), "bundle includes the rug");
assert(furnish.bundle!.post_ids.includes("p_fridge"), "bundle includes the mini-fridge");
assert(!furnish.bundle!.post_ids.includes("p_coat"), "bundle skips the coat");
assert(!furnish.bundle!.post_ids.includes("p_reader"), "bundle skips the e-reader");
const summed = furnish.bundle!.post_ids.reduce((sum, id) => sum + db.posts.find((post) => post.id === id)!.price, 0);
assert(summed === furnish.bundle!.total_price, "bundle total matches the items");

const photos = fallbackSearch("someone to take graduation photos under $50", db.posts);
assert(photos.results.some((hit) => hit.post_id === "p_headshots"), "graduation search finds headshots");
assert(
  photos.results.every((hit) => db.posts.find((post) => post.id === hit.post_id)!.price <= 50),
  "graduation search respects the budget",
);

const laptop = fallbackSearch("who can fix my laptop this week", db.posts);
assert(laptop.results[0]?.post_id === "p_laptop", "laptop search ranks the laptop listing first");

const empty = fallbackSearch("xylophone quartet underwater", db.posts);
assert(empty.results.length === 0 && empty.bundle === null, "nonsense query has no matches");

const localReasons = furnish.results.map((hit) => hit.reason).join(" ");
assert(!localReasons.includes("Desk chair Desk"), "bundle reasons are not just the title");
assert(furnish.results.every((hit) => hit.reason.includes("dorm single")), "bundle reasons mention a single");

const booked = createDeal(db, "u_carter", { post_id: "p_laptop", amount: 25, message: "Thursday after 4?" });
assert(booked.ok, "book a service");
if (!booked.ok) process.exit(1);
assert(booked.value.from_user_id === "u_carter" && booked.value.to_user_id === "u_carlos", "buyer sends the deal to the seller");
const duplicate = createDeal(db, "u_carter", { post_id: "p_laptop", amount: 25, message: "again" });
assert(!duplicate.ok, "no second pending offer");
const self = createDeal(db, "u_carlos", { post_id: "p_laptop", amount: 25, message: "me" });
assert(!self.ok, "cannot book your own listing");
const accepted = resolveDeal(db, "u_carlos", booked.value.id, "accept");
assert(accepted.ok, "seller accepts");
assert(db.posts.find((post) => post.id === "p_laptop")!.status === "closed", "accepted deal closes the listing");
const note = addMessage(db, "u_carter", booked.value.id, "See you Thursday.");
assert(note.ok, "either side can send a chat message");
const outsider = addMessage(db, "u_chengyou", booked.value.id, "I am not in this deal.");
assert(!outsider.ok, "a third person cannot join the chat");

const fresh = buildSeed();
const offered = createDeal(fresh, "u_carter", {
  post_id: "p_req_logo",
  amount: 45,
  message: "I can design it by Friday.",
});
assert(offered.ok, "respond to a request");
if (!offered.ok) process.exit(1);
assert(offered.value.from_user_id === "u_carter" && offered.value.to_user_id === "u_carlos", "provider sends the deal to the requester");
const requesterAccepts = resolveDeal(fresh, "u_carlos", offered.value.id, "accept");
assert(requesterAccepts.ok, "requester accepts");

const rejected = upsertUser(fresh, {
  name: "Pat",
  email: "pat@gmail.com",
  college: "Pierson College",
  class_year: 2028,
  venmo_handle: "pat",
});
assert(!rejected.ok, "reject a non-yale email");

const created = upsertUser(fresh, {
  name: "Casey Lin",
  email: "casey.lin@yale.edu",
  college: "Morse College",
  class_year: 2028,
  venmo_handle: "@caseylin",
});
assert(created.ok && created.ok && created.value.venmo_handle === "caseylin", "new yale user");

console.log(
  `smoke ok · furnish bundle $${furnish.bundle!.total_price} · ${furnish.bundle!.post_ids.length} items`,
);
