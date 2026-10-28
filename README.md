# matthewmenardmusic.com

Hand-coded static site on Vercel. Plain HTML, CSS, and JavaScript. No framework, no build step. The score store uses Stripe through two small functions in `api/`.

## Where things live

| Folder | What it is | Public? |
|---|---|---|
| `public/` | The website. Every file here gets a URL. | yes |
| `public/css/tokens.css` | All colors, fonts, sizes, and spacing. Change a value here and it changes everywhere. | yes |
| `public/css/base.css` | Page defaults: text, links, focus rings, layout helpers. | yes |
| `public/css/components.css` | Buttons, forms, cards, header, menu, footer. | yes |
| `public/fonts/` | Self-hosted font files and their licenses. | yes |
| `public/design/` | Internal pages: type specimen and style guide. Not linked from the site. | yes (noindex) |
| `api/` | Serverless functions: score checkout, order check, PDF download, the Stripe webhook that emails buyers their download links, contact and commission forms. | runs on Vercel |
| `lib/products.js` | Score titles and prices. The one place prices are set. | no |
| `lib/forms.js`, `lib/mail.js` | Form checking, spam defenses, and sending email through Resend. | no |
| `partials/` | The header and footer, copied into every page. | no |
| `public/data/performances.js` | Upcoming performances list. | yes |
| `private-scores/` | The paid PDFs. Only sent after payment is confirmed. | no |
| `source-media/` | Original photos before optimizing. | no |
| `scripts/contrast.mjs` | Checks every color pairing meets accessibility contrast. | no |

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

Quick look at the pages (no store, no forms):

```bash
npx serve public
```

Then open the address it prints.

Full site including the forms and store:

```bash
npm run dev
```

Then open http://localhost:3000. Keys come from a `.env` file in this folder (copy `.env.example` and fill it in; it never gets committed). With no keys:

- The contact form works and prints the email in the terminal instead of sending it.
- Checkout says it is not configured yet. Put an `sk_test_…` Stripe key in `.env` to try a test purchase with card 4242 4242 4242 4242.

## Check colors

```bash
npm run check:contrast
```

Prints every declared text/background pairing with its contrast ratio. Vercel runs the same check on every deploy and stops the deploy if anything fails. If you add a new color combination to the site, add a line for it in the `@pairings` block at the bottom of `tokens.css`.

## Deploy

- Push a branch to GitHub → Vercel builds a **preview** at its own URL. The live site does not change.
- Merge into `main` → Vercel deploys to **matthewmenardmusic.com**.

## Tune the intro

Open `/prototype/intro` (on a preview or locally). The form under the hero lists every timing value. Change numbers, press **Replay**, and the intro runs again with them. The address bar then holds the exact settings, so you can send that link. Defaults live at the top of `public/prototype/intro.js`.

The intro plays once per browser session. Add `?intro` to the address to force it. It never plays with reduced motion turned on.

## Edit text

Each page is one HTML file in `public/`. Open it, find the sentence, change it, save. Keep the tags (`<p>`, `<h2>`, and so on) around the text as they are.

## Swap a photo

1. Put the new photo in `source-media/`, replacing the old file with the same name (for example `source-media/photos/headshot.jpg`).
2. Run `npm run images`. It rebuilds every size and format in `public/img/`.
3. If the new photo has a different shape (portrait instead of landscape), update the `width` and `height` numbers on its `<img>` tag to the new photo's pixel size. That keeps the page from jumping while it loads.

To add a new photo, add a line for it in the list at the top of `scripts/images.mjs`, then run `npm run images`.

## Change the header or footer

Edit `partials/header.html` or `partials/footer.html`, then run `npm run partials`. It copies the change into every page and marks the current page in the menu.

## Add a performance

Open `public/data/performances.js` and add a line (the format is in the comment at the top). Past dates hide themselves. Home shows the next three.

## Add a composition

Copy `public/compositions/when-i-am-dead.html` to a new file named after the work (for example `ave-maria.html`). Change the title, description, details, and score image. Leave out anything you do not know yet; the template has commented-out sections for year, duration, premiere, recordings, and performances.

## Add a recording

Open `public/listen.html`. The comment above the list shows one recording; copy it into the list and change the link, title, and details. Players load only when a visitor presses Play, so nothing from YouTube or Spotify loads until then. Then delete the `[TODO]` paragraph.

## Put a new score on sale

1. Put the PDF in `private-scores/`.
2. Add it to `lib/products.js` (id, title, price in cents, file name, page).
3. On its composition page, copy the buy box from `when-i-am-dead.html` and change the `items` value to the new id.

## Forms and email

The contact form and the website request form on `/commissions` both send to `COMMISSION_TO_EMAIL` through Resend. The request form also sends the visitor a short fixed confirmation (nothing they typed is echoed back, so it can't be used to spam others). To change the request form's choices (project types, pages, budget ranges), edit both `public/commissions.html` and the lists at the top of `api/commission.js`; they must match. Spam defenses: a hidden field bots fill in, a minimum fill time, and a limit of 5 messages per 10 minutes per visitor. Bots get a fake "sent" so they don't retry. No CAPTCHA.

## Website clients and alterations

Website clients request alterations from a private page; you track them on another.

- **Your tracker:** `/admin`. Sign in with `ADMIN_PASSWORD`. It lists requests (open, in progress, done, cancelled), each client's alterations used this month against their plan, and lets you add clients, change plans, pause a link, or make a new link.
- **Client page:** each client gets a private link like `/alterations#k=…`. Add the client in the tracker, copy the link it shows, and email it to them. It is shown only once; "New private link" makes another and stops the old one.
- **Link on client sites:** put `<a href="https://www.matthewmenardmusic.com/alterations" target="_blank" rel="noopener">Request a change</a>` in the footer of every page of a client's site (also shown on `/admin`). Clients sign in by email: they type the address you have for them and get a one-time link (30 minutes); after that a cookie keeps them signed in for 120 days (`lib/client-auth.js`). Unknown emails get nothing. The private links from "Add client" still work and sign them in too.
- **Counts** start again on the 1st of each month (Ottawa time). Marking a request "Cancelled" stops it counting. A client can still send requests past their plan; the email to you says "over the plan".
- **Emails:** you get each request; the client gets a confirmation, and another when you mark it done (untick the box on the tracker to skip that).
- **Plans** (names and alterations per month) live in `lib/alterations.js`. Keep them in step with the package cards on `/commissions`.
- **Setup on Vercel:** add Upstash for Redis under Storage and connect it to the project, then set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (see `.env.example`). Locally, without Upstash, requests are kept in memory until the dev server stops.

## Motion

- Sections rise into view as you scroll, pages cross-fade when you click between them, and buttons, cards, photos, and menu links ease on hover. All of it lives in the Motion section at the end of `public/css/components.css` and in `public/js/motion.js`.
- Speeds are tokens in `tokens.css` (`--dur-reveal`, `--reveal-stagger`, `--reveal-distance`). Bigger numbers = slower, farther.
- Anything new placed inside the usual page blocks (sections, grids, cards, lists) animates automatically. To add another kind of block, add its selector to the list in both `components.css` and `motion.js`.
- Changing page: the old page sinks back and softens out of focus while the new one is drawn down from the top; the header stays put (`::view-transition-old/new(root)` in `components.css`). Chrome, Edge, and Safari; other browsers just load the page.
- Custom cursor (`public/js/cursor.js`): a sage dot exactly on the pointer, a ring over anything clickable, a wide capsule over the draggable photo strip. Mouse only; text fields keep the normal I-beam; off with reduced motion.
- Visitors who turn on "reduce motion" on their device see everything still, and the marquee becomes a plain list.
- Reactive touches (all in `motion.js`): a thin progress line under the header shows how far down the page you are; section headings rise word by word; on Home, the Singer, Composer, and Conductor bios slide open and shut (`home.js`). With a mouse, a soft light follows the pointer over cards and panels, buttons lean toward it, and the photo strip can be dragged. Phones skip the mouse-only ones.
- Compositions (the store): a **Sort by** menu (title, newest/oldest, price, scores for sale first). Options appear only when they would change the order, so with today's two scores only the title sorts show. Give each card `data-year` and, for scores on sale, `data-price` in cents.
- Compositions (piano) and Performance (choir) open on a full-screen photo behind the heading ("Photo hero" in `components.css`; set the crop per photo with `--hero-focus`), then glide down to the content after 1.5 seconds (`public/js/hero-scroll.js`; add `data-hero-scroll` to another full-screen block to reuse it). It stops if the visitor scrolls, taps, clicks, or presses a key first, and is off with reduced motion. Change the wait with `DELAY` in that file.
- Home: to change the "Music performed by" names, edit both lists in the marquee section of `public/index.html` (the second is a copy for the seamless loop).

## Signature details

- **Staff dividers:** the line between sections is a five-line music staff that draws in as you scroll (`.section + .section` in `base.css`).
- **Film grain:** a faint texture over every page (`body::after` in `components.css`). Change its `opacity` to make it stronger or remove it.
- **Portrait:** put a photo inside `<div class="arch">` for the single upright portrait frame.
- **Home only:** the hero's three role panels (Singer, Composer, Conductor; the open one takes turns every 5 seconds and opens on hover; a Scroll button rises in after 1 second, bottom right; swap photos in `index.html`, set each crop with `object-position` in `home.css`, change the timing with `TURN` in `home.js`), staggered score cards, the names ticker (steady loop, pauses on hover), the Singer / Composer / Conductor band with openable bios, and the sideways photo strip with arrows.

## Search engines and link previews

- Each public page has a title, description, canonical link, and social preview tags in its `<head>`. A new page: copy the `<head>` from a similar page and change the title, description, and URLs.
- After adding or removing a page, run `npm run sitemap` to rebuild `public/sitemap.xml`.
- `npm run icons` rebuilds the favicon set and the link-preview image (`public/img/share.jpg`) from `source-media/`.

## Placeholders

Missing content shows on preview pages as a dashed red box marked `[TODO: …]`. A production deploy fails while any are visible (`npm run check:todo`), so nothing unfinished goes live. `TODO.md` lists them all.

## Change a font

Fonts are named once, in `tokens.css` (`--font-display` and `--font-body`). Font files in `public/fonts/` are cached by browsers for a year, so if you replace a font file, give it a new file name and update the `@font-face` rule.

## Secrets

API keys go in Vercel → Project → Settings → Environment Variables. Never in the code. `.env.example` lists the names.

## Payments (/pay) and Studio

- `/studio` is a private page (noindex, linked quietly from the footer) listing Matthew's tools. Each tool has its own password.
- `/pay/*` is the separate **payments** Vercel project (code in `Documents/annual-payments`, deployed with `npx vercel deploy --prod` from that folder). `vercel.json` here forwards `/pay` and `/pay/*` to `https://payments-six-chi.vercel.app`.
- This site's security headers skip `/pay`, so the payments app sends its own. If the payments project's address ever changes, update the two `rewrites` in `vercel.json`.
