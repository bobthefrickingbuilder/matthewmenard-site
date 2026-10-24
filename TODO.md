# TODO

Everything waiting on Matthew, with the file it affects. Kept current every phase.

## Decisions (Phase 1 checkpoint)

- [ ] **Pick a type pairing**, A or B. See `public/design/type-specimen.html`.
- [ ] **Approve tokens and style guide.** See `public/design/styleguide.html`.
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
| Upcoming performances: date, title, venue | Home, Performing | 4 |
| Repertoire: roles and works, by category, performed vs. learned | Performing | 4 |
| Teaching: pricing, instruments/voice focus, location, availability blurb; Cal.com account if you want booking | Conducting and Teaching | 4 |
| Audio and video links | Listen and Watch | 4 |
| Planning docs from claude.ai: "Site Design", "Hosting & Payment Questionnaire", "Studio Launch Roadmap", "Stripe payments roadmap" | Store port, Commissions | 4–5 |
| Stripe **test** key set for Preview in Vercel | Store testing on previews | 4 |
| Refund policy: remove "Choral Licensing Tiers" section? Soften "sample pages, skill level" line? | `/refund` | 4 |
| Commissions: audience wording, package names/scope/prices, budget ranges, FAQ answers | `/commissions` | 5 |
| Commissions portfolio: URLs, screenshots, and permission for ORYC, the luthier site, Esmée Peets | `/commissions` | 5 |
| Resend account + verified sending domain; approve Turnstile for spam (optional) | `/api/commission` | 5 |

## Technical follow-ups (mine)

- [ ] Confirm on the first preview that each old URL redirects in one hop, including trailing-slash forms, and that `/success/?session_id=…` keeps its query string. (`vercel.json`)
- [ ] Store port: serve PDFs through `/api/download` after payment check; update `lib/products.js` file paths (still point at old `/files/`). (`store-audit.md`)
- [ ] CSP: add `frame-src` for click-to-load players on Listen and Watch (Phase 4) and the Turnstile domain if approved (Phase 5). (`vercel.json`)
- [ ] Delete the unused type pairing's fonts and `design.css` @font-face rules after the pick.
