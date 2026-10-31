# TODO

Everything waiting on Matthew, with the file it affects. Kept current every phase.

## Colours (2026-10-24)

- Site colours changed from Bass Violet (purple) to Chapel Green: forest green, moss, sage, copper. All 45 contrast pairings pass. Icons and the link preview image rebuilt to match.
- The other options (Midnight & Brass, Score Paper, Stone & Teal) stay viewable on any page with `?palette=midnight`, `paper`, or `stone`. They can be deleted before launch (`public/design/palettes.*`, `public/js/palette-preview.js`).

## Motion pass (2026-10-23)

- Pull quote removed from Home.
- Home now has a "Music performed by" scrolling list (the four ensembles from your bio) and two photo links, to Performing and to Conducting & Teaching, using text already on those pages.
- Listen & Watch card removed from Home (2026-10-24). It can come back once recordings are in.

## Phase 6 (quality pass; done)

- Lighthouse (mobile, local): accessibility, best practices, SEO 100 on every page tested; performance 93–99.
- Favicon and touch icons: your existing bass clef mark, recolored to the site palette. Want a different mark? Replace `source-media/apple-touch-icon.png` and run `npm run icons`.
- Share image for links (`public/img/share.jpg`): the choir-and-strings photo. Say if you want a different photo.
- Search: Open Graph and Twitter tags on every public page; Person data on Home and About; composition data with price on both score pages; `sitemap.xml`, `robots.txt`.
- [ ] **Vercel Web Analytics:** the old site used it. Keep it? (Cookieless; one script tag, a CSP line, and a sentence in the privacy policy.)

## 2026-10-28

- Conducting & Teaching hidden: no links point to it, it is out of the sitemap, and it is marked noindex. Home's conductor photo and role link now go to About. To bring it back, see the comment at the top of `public/conducting-teaching.html`.
- Websites page packages, FAQ, and budget ranges approved as drafted (owner, 2026-10-28).
- Website clients pay through /pay: a monthly quote with an optional one-time build fee charged with the first payment.
- ORYC and luthier placeholder cards removed from Recent sites (owner, 2026-10-30). Add them when the URL, screenshot, one line, and permission are ready.
- Listen & Watch hidden until recordings are in (owner, 2026-10-30): placeholder removed, no links point to it, out of the sitemap, marked noindex. To bring it back, see the comment at the top of `public/listen.html`.
- Request link for client sites (snippet on `/admin`): clients sign in by email; no private links needed.

## 2026-10-31

- Choral licences built: 10 or 20 copies at a flat price per copy, or 40+ at one fixed price, 40 times the copy price (`lib/copies.js`; how to add a score is in the README). First choral score on sale: Sorrowing of Winds, $1.50 per copy.
- [ ] One Stripe test purchase of a choral licence. Tenor bar 13 on page 2 of the Sorrowing of Winds PDF reads "Hlaf" instead of "Half".

## Launched 2026-10-26

- Launched with the visible placeholders showing (owner decision); `scripts/todo-check.mjs` now warns instead of failing.
- Contact and commission forms replaced by email links until Resend is set up. The form markup is in git history (commit 303db99) to restore.

## Before launch (Phase 7)

- [ ] Every visible `[TODO]` filled or its section removed. Production deploys fail until then (`npm run check:todo`). Now: Commissions (3, recent sites), Teaching (1), Listen (1).
- [ ] Resend set up (key, verified domain, both addresses) and one test message from each form on a preview.
- [ ] One Stripe test purchase on a preview, then confirm the live key is on Production.
- [x] Website alterations: Upstash, ADMIN_PASSWORD and ADMIN_SESSION_SECRET set (2026-10-28). Site email now goes through Gmail: add SMTP_USER and SMTP_PASS (same as payments) to this project, then test a client request.
- [ ] Stripe webhook for the download-link email: add the endpoint in Stripe (test mode for Preview, live mode for Production; URL and events in `.env.example`), put each signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`, and confirm the test purchase's email arrives with working links. Until then the thank-you page still works, but it says the links were emailed when they were not.
- [ ] Merge to `main` (your go-ahead), then check redirects and headers on the live domain.

## Phase 5 (built; auto-approved per your instruction)

- [ ] Look over `/commissions` on the preview. Its placeholders block a production deploy until filled or removed:
  - **Packages** (3 cards): draft written (Artist Bio, Portfolio, Studio; monthly plans with alterations per month). Confirm names, scope, timelines, one-time prices, and monthly rates.
  - **Recent sites**: Paige Robinson and Esmée Peets are up. ORYC and the luthier site can be added later: URL, screenshot, one line, and permission.
  - **FAQ answers:** drafted (ownership, hosting and domain, maintenance, timeline, revisions). Confirm, and decide what happens if a client ends their monthly plan.
  - **Budget ranges**: drafted (Under $200, $200 to $500, $500 to $1,000, Over $1,000, Not sure yet). Confirm or change in `public/commissions.html` and `api/commission.js`.
- [ ] Confirm the wording: hero line, "What gets built" sentence (from the brief), and the 7 process steps.
- [ ] **Privacy policy:** I drafted sections for both forms, Resend, and retention (`public/privacy.html`). I'm not a lawyer; review it and set a new effective date.
- [ ] Spam: honeypot + minimum fill time + in-memory rate limit. Approve Cloudflare Turnstile only if spam gets through.
- [ ] A deposit step can slot into the process later (marked in the page source). Nothing built.

## Phase 4 (built; auto-approved per your instruction)

- [ ] Look over About, Compositions, Performing, Conducting & Teaching, Listen & Watch, Contact, and Checkout on the preview.
- [ ] **Contact form needs Resend** to actually send: a Resend API key plus `COMMISSION_TO_EMAIL` and `COMMISSION_FROM_EMAIL` in Vercel. Until then the form validates but logs instead of sending (and fails on production, so nothing is silently lost).
- [ ] **Stripe test key for Preview** (`STRIPE_SECRET_KEY` = an `sk_test_…` key, Preview environment only) so checkout can be tried on previews without real charges.
- [ ] Contact page lists Instagram and Facebook. Add others?

## Decisions (Phase 3 checkpoint)

- [x] Home and the composition template approved (2026-10-23).
- [x] **The Golden Sunset voicing:** Baritone and piano (owner, 2026-10-28).
- [ ] **Years and durations** for both works. *When I am dead, my dearest* is marked © 2025 on the score; is that the composition year?
- [x] **Commissions teaser wording** on Home: teaser removed from Home (2026-10-24, owner request). The Websites page stays in the menu.

## Decisions (Phase 2 checkpoint)

- [x] Intro feel and timing approved as is (2026-10-23).

## Decisions (Phase 1 checkpoint)

- [x] Type pairing: A, Fraunces + Source Sans 3 (picked 2026-10-23).
- [x] Tokens and style guide approved (2026-10-23).
- [ ] **Paid PDFs are public on the live site.** Patch `main` now, or wait for launch? See `store-audit.md`.

## Defaults I chose while you were away (confirm or change)

- [ ] Email for contact, mailto links, and commissions: `mmenardproduction@gmail.com` (from the live site).
- [ ] Gallery photos fold into About; `/gallery` redirects to `/about#photos`.
- [ ] Repertoire list (from your September roadmap) goes on the Performing page.
- [ ] Header link reads "Commission a Website", separated from the music nav.

## Content needed

| What | Where it goes | Phase |
|---|---|---|
| Confirm: Capital Chamber Choir chorister; ORYC chorister and Assistant Conductor; Ewashko Singers; Cypress Publishing placement (which work, link?) | About, Performing | 3–4 |
| Photo credits, if any are required | About, image captions | 3 |
| Higher-resolution photos, if you have them (`Documents/Matthew Menard Website/media/` is empty) | All pages | 3 |
| Social links beyond Facebook and Instagram (YouTube, Spotify, SoundCloud?) | Footer, Contact | 3 |
| Works list: title, year, voicing, duration, text source, premiere, performances, audio/video links | Compositions | 4 |
| Upcoming performances: date, title, venue (sections stay hidden until one is added) | Home, Performing | 4 |
| Repertoire: roles and works, by category, performed vs. learned | Performing | 4 |
| Teaching: pricing, instruments/voice focus, location, availability blurb; Cal.com account if you want booking (visible placeholder on the page now; blocks launch) | Conducting and Teaching | 4 |
| Audio and video links: URL, title, performers, year (visible placeholder on the page now; blocks launch) | Listen and Watch | 4 |
| Planning docs from claude.ai: "Site Design", "Hosting & Payment Questionnaire", "Studio Launch Roadmap", "Stripe payments roadmap" | Store port, Commissions | 4–5 |
| Refund policy: remove "Choral Licensing Tiers" section? Soften "sample pages, skill level" line? | `/refund` | 4 |
| Resend account + verified sending domain (needed for both forms to send) | `/api/contact`, `/api/commission` | 4–5 |

## Technical follow-ups (mine)

- [ ] Confirm on the first preview that each old URL redirects in one hop, including trailing-slash forms, and that `/success/?session_id=…` keeps its query string. (`vercel.json`)
- [x] Store port: PDFs served only through `/api/download` after a paid-session check; cart, checkout, and success pages rebuilt (Phase 4).
- [x] Favicon and touch icon (Phase 6).
- [x] CSP `frame-src` allows YouTube (no-cookie), Vimeo, Spotify, SoundCloud for click-to-load players (Phase 4).
- [ ] CSP: prune `frame-src` to the services actually used once recordings are in (Phase 6). (`vercel.json`)
- [ ] Rate limit on forms is per server instance (in memory). Fine at this traffic; revisit if spam gets through.
