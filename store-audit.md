# Store audit

How the score store works on the live site, what the rebuild keeps, and what it fixes.

## How it works now

1. **Products** are defined twice: `lib/products.js` (server, prices in cents CAD) and a `PRODUCTS` object in `assets/site.js` (client display). They must be kept in sync by hand.
2. **Cart** is an array of product IDs in `localStorage` under `mm_cart`. One copy per item, no quantities.
3. **Checkout:** `/checkout/` POSTs `{ items: [...] }` to `/api/create-checkout-session`. The function filters to known IDs, builds Stripe `price_data` line items from `lib/products.js` (so the client cannot change prices), and creates a Stripe Checkout Session with `success_url = /success/?session_id={CHECKOUT_SESSION_ID}` and `cancel_url = /checkout/`. Item IDs go in session metadata.
4. **Delivery:** `/success/` calls `/api/verify-session?session_id=…`, which retrieves the session from Stripe and returns `payment_status` plus each item's `fileUrl`. The page shows download links only when status is `paid`.
5. **Files** were at `/files/*.pdf`, served as public static files.
6. **Env vars used:** `STRIPE_SECRET_KEY` only. No webhook, no publishable key, no email sending (Stripe sends its own receipt).

## Problems

1. **Anyone can download the PDFs free.** The file URLs are public and guessable. Payment is never checked when the file is fetched.
2. **`verify-session` returns file URLs for unpaid sessions.** The page hides them, but the JSON response includes them.
3. **Product data is duplicated** in two files.
4. **No webhook.** If a buyer closes the tab before `/success/` loads, they have only the Stripe receipt, which has no download link. The success URL works again if they kept it, but they are not given it anywhere else.

## Plan for the rebuild (Store port, during Phase 4)

- PDFs live in `private-scores/` (done on this branch). It is outside `public/`, so Vercel never serves it as a static file.
- New function `/api/download?session_id=…&id=…`: retrieves the session from Stripe, confirms `payment_status === "paid"` and that the ID is in the session's items, then streams the PDF with `Content-Disposition: attachment`. The function bundles `private-scores/` via `functions.includeFiles` in `vercel.json`.
- `verify-session` returns titles and download endpoints only when paid.
- One product list: `lib/products.js`, plus a small `/api/products` endpoint (or a generated JSON file) that the site reads for display. Prices stay server-authoritative.
- Cart and checkout keep the same Stripe flow, `localStorage` key, and success URL, so in-flight carts and saved success links keep working.
- `STRIPE_SECRET_KEY` already exists on the Vercel project. Preview deployments need it too (Stripe test key for Preview, live key for Production). `[TODO: owner to confirm a Stripe test key is set for Preview in Vercel]`
- Optional, owner to decide: add a Stripe webhook that emails the download link (via Resend, shared with the Commissions form) so a closed tab does not lose the purchase.

## Not changing

- Prices ($4.00 CAD each), product IDs (`when-i-am-dead`, `golden-sunset`), currency, Stripe account.
- Refund policy terms, apart from the licensing-tier section flagged in `content-inventory.md`.

## Until the rebuild launches

The live site on `main` still serves `/files/*.pdf` publicly. A one-file stopgap is possible on `main` (block `/files/*` and serve downloads through a function). I have not touched `main`. `[TODO: owner to decide whether to patch main now or wait for launch]`
