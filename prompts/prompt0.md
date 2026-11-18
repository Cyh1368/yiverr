# Yiverr — Build Prompt (90-minute Grokathon)

You are a senior full-stack engineer. We have 90 minutes to build a working demo of "Yiverr" — a marketplace for Yale students to sell services, request services, and sell unwanted items from their dorm rooms. Prioritize a working, polished core over extra features. Use minimal dependencies and zero external services except the xAI API.

## Product

- Students can:
  1. Post SERVICE listings (offer a service for a price)
  2. Post REQUESTS (ask for a service or item they need, with a budget)
  3. Post ITEM listings (sell things from their room)
  4. Buy items, book services, and respond to requests from other students
- Tagline: "Buy, sell, and hire — only Yalies."
- Fixed categories (no others):
  - Services: Photography, Design & Creative, Hair & Beauty, Moving & Labor, Tech Help & Repair, Music & Performance, Errands & Delivery, Other Services
  - Items: Furniture, Appliances, Electronics, Clothing, Decor, Books, Other Items
- Do NOT include tutoring, academic help, or any academic-work category anywhere in the app, seed data, or AI prompts.

## Tech stack (keep it simple)

- Next.js (App Router) + TypeScript + Tailwind CSS
- Data: a local JSON file (`data/db.json`) read and written through one small module (`lib/db.ts`). No external database.
- Images: uploads saved to `/public/uploads`.
- Login: a simple sign-in form (name, @yale.edu email, residential college from a dropdown of the 14 colleges, class year, Venmo handle). Reject non-@yale.edu emails. Store the current user id in a cookie. No passwords.
- A "Switch user" dropdown in the navbar listing the seeded users, for demoing buyer and seller flows quickly.
- xAI Grok API via the OpenAI-compatible SDK (base URL `https://api.x.ai/v1`). Read `XAI_API_KEY` and `GROK_MODEL` (must support image input) from `.env.local`. All AI calls run in server-side API routes, never on the client.
- Mobile-first design, Yale Blue (`#00356B`) primary color, clean card-based UI.

## Data model (in db.json)

- **users**: id, name, email, college, class_year, venmo_handle
- **posts**: id, user_id, kind (`'service' | 'item' | 'request'`), title, description, category, price (for requests this is the budget), price_unit (`'fixed' | 'hourly' | 'obo'`), condition (items only), images[], status (`'active' | 'closed'`), created_at
- **deals**: id, post_id, from_user_id, to_user_id, amount, message, status (`'pending' | 'accepted' | 'declined'`), created_at
  - For services/items: the buyer sends a deal to the seller ("Buy" or "Book").
  - For requests: a provider sends a deal to the requester ("I can do this").

## Pages

1. **Home/Browse**: tabs for Services, Requests, and Items; category filter chips; price sort; the AI search bar at top; a grid of cards (image or icon, title, price or budget, poster's name and college badge).
2. **Post detail**: description, price, poster card, and the main action button ("Book" for services, "Buy" for items, "I can do this" for requests) that opens a form with amount + message.
3. **Create post**: choose Service / Request / Item, with the AI autofill option (below), then an editable form.
4. **Dashboard**: my posts (close or delete), deals received (accept or decline), deals sent. When a deal is accepted, show both people each other's email and a "Pay with Venmo" button linking to `https://venmo.com/{venmo_handle}`, with the note "Mark the payment as Goods & Services."

## AI feature 1 — Listing autofill

- **Items**: the user uploads 1–3 photos. Grok vision returns JSON `{title, description, category (from the fixed list), condition, suggested_price, price_reasoning}`.
- **Services and requests**: the user types one rough sentence (e.g., "I do headshots with my DSLR" or "need two people to help move a couch Saturday"). Grok returns JSON `{title, description, category (from the fixed list), suggested_price, price_unit}`.
- Pre-fill the create form; the user can edit everything before posting. Show a loading state ("Grok is writing your listing…"). Validate the JSON, and fall back to an empty form if parsing fails.

## AI feature 2 — Smart search

- The search bar accepts natural language, e.g., "someone to take graduation photos under $50", "furnish my single for under $150", "who can fix my laptop this week".
- The server sends Grok the query plus a compact JSON list of active posts (id, kind, title, category, price, short description). Grok returns JSON `{results: [{post_id, reason}], bundle: {post_ids[], total_price, summary} | null}`.
- Display ranked result cards, each with Grok's one-line reason. If a bundle is returned (e.g., furnishing a room), show it as a cart-style card with the total price.
- If no posts match, suggest creating a Request with the query pre-filled.

## Seed data

- 5 users across different colleges.
- 25 posts:
  - ~10 services (e.g., "Headshots on Cross Campus — $30", "Fades & lineups in Saybrook — $15", "Logo design for your club — $40", "Help moving out — $20/hr", "Laptop cleanup & setup — $25")
  - ~5 requests (e.g., "Need a photographer for our formal — $100 budget", "Someone to assemble my IKEA bed — $25")
  - ~10 items (e.g., "Mini-fridge, barely used — $45", "Desk lamp — $10", "Area rug 5x7 — $30")
- Use simple category icons or gradient placeholders instead of real images for seeded posts.

## Demo flows that MUST work

1. Sign in with a @yale.edu email → land on Browse.
2. Upload a photo of a chair → Grok fills the listing → post it.
3. Type "I can cut hair in my dorm" → Grok writes a service listing → post it.
4. Search "furnish my single for under $150" → get a bundle with a total.
5. Switch user → book a service → switch back → accept → Venmo button appears.
6. Post a request → switch user → respond "I can do this" → accept.

## Deliverables

- Full working code, the file structure, `.env.example`, the seed script, and exact commands to install and run.
- Build in this order:
  1. Data layer + seed
  2. Browse + detail + create without AI
  3. Deals + dashboard
  4. AI autofill
  5. AI search
- Make sure the app runs after each step and tell me how to test it.

