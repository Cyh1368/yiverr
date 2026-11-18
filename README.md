# Yiverr

A marketplace for Yale students.

Students post services, requests, and items from their rooms. Someone else books, buys, or says they can do it. When a deal is accepted, both people see each other's Yale email and a Venmo link.

## Run it

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open http://localhost:3000.

Put your key in `.env.local`:

```bash
XAI_API_KEY=your_key
GROK_MODEL=grok-4.7
```

`GROK_MODEL` has to accept images. `grok-4.7` does. AI calls stay on the server.

There is no password. Sign-in stores a user id in a cookie. The navbar **Switch user** menu lists Cheng-You Ho, Carter Lagasse, and Carlos Cedano so you can play both sides of a deal. Cheng-You starts with 2 posts and 3 deals received. Inbox threads already have messages from the other person.

Reset the demo data anytime with `npm run seed`. That wipes posts and deals and writes `data/db.json` again.

Check the data layer without the server:

```bash
npm run smoke
```

## What to click

1. **Sign in.** Use any `@yale.edu` email, or press one of the seeded students. A gmail address is rejected. You land on Browse.
2. **Photo listing.** Post → Sell an item → add a chair photo → Write with Grok. The status line says "Grok is writing your listing…". Edit the draft, then Post listing.
3. **Service listing.** Post → Offer a service → type `I can cut hair in my dorm` → Write with Grok → Post listing.
4. **Search.** On Browse, ask `furnish my single for under $150`. You get a bundle card with a total under $150. If nothing matches, the page offers to post a request with that sentence filled in.
5. **Book and accept.** Switch user to someone who does not own the listing. Open a service, press Book, send an amount and a note. Switch back to the seller, open Dashboard, Accept. Both people then see the other's email and **Pay with Venmo**. The note under the button says to mark the payment as Goods & Services.
6. **Request.** Post a request. Switch user. Open it, press “I can do this”, send an offer. Switch back and Accept.

Without `XAI_API_KEY`, search still returns local matches (including the furnish bundle) and says so. Autofill asks you to fill the form yourself.

## Layout

```
data/db.json            users, posts, deals
lib/db.ts               the only reader and writer
lib/seed-data.ts        5 students, 25 posts
lib/mutate.ts           create posts and deals
lib/search.ts           bundle and keyword matching
lib/grok.ts             OpenAI SDK pointed at https://api.x.ai/v1
app/api/ai/autofill     listing draft from a photo or a sentence
app/api/ai/search       ranked results and an optional bundle
public/uploads          photos saved from the create form
```

Categories are fixed. Services: Photography, Design & Creative, Hair & Beauty, Moving & Labor, Tech Help & Repair, Music & Performance, Errands & Delivery, Other Services. Items: Furniture, Appliances, Electronics, Clothing, Decor, Books, Other Items.

## How the pieces were built

The app is complete. This is the order the pieces stack, and how to see each one working.

1. **Data.** `npm run seed` then `npm run smoke`. Smoke checks the 25 posts, the furnish bundle, a booking, and a request reply.
2. **Browse, detail, create.** `npm run dev`, sign in, switch the Services / Requests / Items tabs, open a card, and post a listing with the form (skip Grok).
3. **Deals and dashboard.** Book a listing as one student, switch user, accept on Dashboard, confirm the Venmo button.
4. **Autofill.** With `XAI_API_KEY` set, post an item from a photo and a service from one sentence. If the model returns junk JSON, the form stays blank and you can type it yourself.
5. **Smart search.** Ask Grok to furnish a single under $150 and read the bundle total.
