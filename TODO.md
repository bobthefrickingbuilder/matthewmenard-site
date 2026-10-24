# TODO

Everything waiting on Matthew, with the file it affects. Kept current every phase.

## Phase 4 (built; auto-approved per your instruction)

- [ ] Look over About, Compositions, Performing, Conducting & Teaching, Listen & Watch, Contact, and Checkout on the preview.
- [ ] **Contact form needs Resend** to actually send: a Resend API key plus `COMMISSION_TO_EMAIL` and `COMMISSION_FROM_EMAIL` in Vercel. Until then the form validates but logs instead of sending (and fails on production, so nothing is silently lost).
- [ ] **Stripe test key for Preview** (`STRIPE_SECRET_KEY` = an `sk_test_…` key, Preview environment only) so checkout can be tried on previews without real charges.
- [ ] Contact page lists Instagram and Facebook. Add others?

## Decisions (Phase 3 checkpoint)

- [x] Home and the composition template approved (2026-10-23).
- [ ] **The Golden Sunset voicing:** the live site says bass voice; the score names Baritone. Which is right? (`public/index.html`, `public/compositions/golden-sunset.html`)
- [ ] **Years and durations** for both works. *When I am dead, my dearest* is marked © 2025 on the score; is that the composition year?
- [ ] **Commissions teaser wording** on Home (`public/index.html`).
- [ ] **Vercel Web Analytics:** the old site used it. Keep it on the new site? (Cookieless; needs one script tag and a line in the privacy policy.)

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
| Commissions: audience wording, package names/scope/prices, budget ranges, FAQ answers | `/commissions` | 5 |
| Commissions portfolio: URLs, screenshots, and permission for ORYC, the luthier site, Esmée Peets | `/commissions` | 5 |
| Resend account + verified sending domain; approve Turnstile for spam (optional) | `/api/commission` | 5 |

## Technical follow-ups (mine)

- [ ] Confirm on the first preview that each old URL redirects in one hop, including trailing-slash forms, and that `/success/?session_id=…` keeps its query string. (`vercel.json`)
- [x] Store port: PDFs served only through `/api/download` after a paid-session check; cart, checkout, and success pages rebuilt (Phase 4).
- [ ] Favicon and touch icon (new mark) — every page currently 404s on `/favicon.ico`. (Phase 3)
- [x] CSP `frame-src` allows YouTube (no-cookie), Vimeo, Spotify, SoundCloud for click-to-load players (Phase 4).
- [ ] CSP: prune `frame-src` to the services actually used once recordings are in (Phase 6). (`vercel.json`)
- [ ] Rate limit on forms is per server instance (in memory). Fine at this traffic; revisit if spam gets through.
