# Content inventory

Audit of www.matthewmenardmusic.com on 2026-10-23. Source: the `main` branch of this repo (14 commits, last: "Align About page photo with title bottom") and a live crawl. The live site matches `main`.

Platform: hand-coded static HTML on Vercel. Apex `matthewmenardmusic.com` 308-redirects to `www`. No `sitemap.xml`, no `robots.txt`. Google Fonts (Cormorant Garamond, Lora), GSAP + ScrollTrigger + Lenis from jsDelivr, Vercel Web Analytics.

Recommendation key: **keep** (reuse as written), **rewrite** (keep the facts, new copy or structure), **cut** (drop).

## Pages

| Old URL | Content | Action | New URL |
|---|---|---|---|
| `/` | Hero: "Composer & bass singer — Ottawa, Canada". Quote: "Each work is my invitation—to walk the emotional path that gave it life." Intro: choral and sacred music, composer-in-residence at St. Joseph's Parish. Two score cards. | rewrite | `/` |
| `/about/` | Bio, three paragraphs (below). Headshot. | rewrite (long + short versions; add affiliations) | `/about` |
| `/scores/` | "Digital sheet music". Intro line. Two score cards. | rewrite into the works list | `/compositions` |
| `/scores/when-i-am-dead/` | Art song, bass voice and piano. Rossetti text. Description. Cover image. Add to cart. $4.00 CAD. | rewrite into composition template | `/compositions/when-i-am-dead` |
| `/scores/golden-sunset/` | Art song, solo voice and piano. Samuel Longfellow text. Description. Cover image. Add to cart. $4.00 CAD. | rewrite into composition template | `/compositions/golden-sunset` |
| `/gallery/` | Six performance and rehearsal photos, masonry layout. | fold into About | `/about#photos` |
| `/contact/` | Email and Instagram links. "I read and reply to everything myself." | rewrite (add form) | `/contact` |
| `/checkout/` | Cart, Stripe checkout button. | keep function, restyle | `/checkout` |
| `/success/` | Verifies Stripe session, shows download links. | keep function, restyle | `/success` |
| `/privacy/` | Privacy policy, effective 2026-09-17. Covers Stripe and localStorage cart. | rewrite (add contact form, commissions form, analytics) — owner review | `/privacy` |
| `/refund/` | Refund policy, effective 2026-09-17. | keep, one fix (below) — owner review | `/refund` |

## Copy worth keeping (verbatim from the live site)

**Bio (About):**
> Matthew Menard is a Taiwanese-Canadian composer and bass singer, born in Ottawa, Ontario in 2004. He began composing at the age of 11, initially exploring pop and EDM production before gradually turning toward classical music.
>
> Today, his focus is primarily on choral and sacred composition. He serves as composer-in-residence at St. Joseph's Parish in downtown Ottawa, where he has written a substantial body of liturgical works. His music has been performed by ensembles including the Capital Chamber Choir, Ontario Youth Choir, York University Chamber Choir, and the Ottawa Bach Choir, among others.
>
> Since beginning his formal classical compositional path in 2023, Matthew has studied with several influential mentors whose guidance has shaped his artistic direction. Conductors Jamie Loback and Laurence Ewashko have been key figures in his development as a composer, while baritone Brett Polegato has played an important role in his vocal training and development, helping shape a voice marked by depth and resonance in both choral and operatic settings across Canada.

**Score descriptions:** both are good; reuse on the composition pages.

## Facts in the brief that the live site does not mention

Confirm each before it ships:
- Chorister, Capital Chamber Choir
- Chorister and Assistant Conductor, Ottawa Regional Youth Choir
- Sings with the Ewashko Singers
- Cypress Publishing placement (which work, and is there a link?)

## Issues found

1. **Paid PDFs are public.** `/files/when-i-am-dead.pdf` and `/files/golden-sunset.pdf` return 200 to anyone. See `store-audit.md`.
2. **Source code is public.** `/lib/products.js` and `/package.json` are served as static files because the repo root is the web root. The rebuild serves only `public/`.
3. **Refund policy mentions "Choral Licensing Tiers"** and "copy-count tier". The store sells single PDFs with no tiers. Cut that section unless tiers are planned.
4. **Refund policy says** "review the score's sample pages, skill level, and instrumentation". The score pages show the first page only and no skill level. Either add those fields to the composition template or soften the line.
5. **Third-party requests** to Google Fonts and jsDelivr on every page. The rebuild self-hosts everything.
6. **Images** are JPEG only, up to 2550 × 3300 (score covers, ~370 KB each), no `srcset`, no width/height on some. Rebuild converts to AVIF/WebP with responsive sizes.
7. **Logo and favicon:** a bass clef PNG. The new design gets new marks; the old ones are kept in `source-media/` for reference only.

## Media

All original files are moved to `source-media/` on this branch (not served). They get optimized into `public/img/` in Phase 3.

| File | Size | Dimensions | Alt text on live site | Action |
|---|---|---|---|---|
| `photos/headshot.jpg` | 121 KB | 1400 × 1050 | "Matthew Menard" | keep; better alt |
| `gallery/photo-1.jpg` | 154 KB | 1400 × 980 | Performance with the choir and strings | keep |
| `gallery/photo-2.jpg` | 245 KB | 933 × 1400 | Singing in rehearsal | keep |
| `gallery/photo-3.jpg` | 206 KB | 1400 × 933 | Singing in performance | keep |
| `gallery/photo-4.jpg` | 94 KB | 933 × 1400 | Conducting | keep (Conducting and Teaching page) |
| `gallery/photo-5.jpg` | 168 KB | 1080 × 1350 | Performing on stage with a choir | keep |
| `gallery/photo-6.jpg` | 130 KB | 1400 × 933 | Singing with a choir, black and white | keep |
| `covers/when-i-am-dead.jpg` | 375 KB | 2550 × 3300 | First page of the score | keep as score sample |
| `covers/golden-sunset.jpg` | 360 KB | 2550 × 3300 | First page of the score | keep as score sample |
| `bass-clef-logo.png`, favicons | small | — | — | cut (new marks) |
| `facebook-icon.png`, `instagram-icon.png` | small | — | — | cut (replace with inline SVG icons) |
| `files/*.pdf` → `private-scores/*.pdf` | ~128 KB each | — | — | keep, serve only after payment |

Photo credits: none listed on the live site. `[TODO: owner to supply photographer credits, if any are required]`

## External links

- Facebook: `https://www.facebook.com/profile.php?id=61580524025330`
- Instagram: `https://instagram.com/matthewmenardbass`
- Email: `mailto:mmenardproduction@gmail.com`

## Redirects

All permanent. The trailing-slash form of every old URL redirects in one hop to the final URL. Configured in `vercel.json`.

| Old | New | Status |
|---|---|---|
| `/scores`, `/scores/` | `/compositions` | 301 |
| `/scores/when-i-am-dead`, `/scores/when-i-am-dead/` | `/compositions/when-i-am-dead` | 301 |
| `/scores/golden-sunset`, `/scores/golden-sunset/` | `/compositions/golden-sunset` | 301 |
| `/gallery`, `/gallery/` | `/about#photos` | 301 |
| `/files/:file.pdf` | `/compositions` | 301 (old public PDF links stop working by design) |
| `/about/`, `/contact/`, `/checkout/`, `/success/`, `/privacy/`, `/refund/` | same path without slash | 308 (Vercel `trailingSlash: false`) |

`/success/?session_id=…` must keep working so past customers with a saved success link still reach their downloads. Vercel should carry the query string through the slash redirect; confirm on the preview.

To verify on the first preview deploy: `curl -sI` each old URL (with and without the slash) and confirm a single hop. If Vercel strips the slash before the custom redirect runs, the slash forms take two hops; fix by adjusting the sources.
