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
| `api/` | Serverless functions (Stripe checkout and order check). | runs on Vercel |
| `lib/products.js` | Score titles and prices. The one place prices are set. | no |
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

Full site including the `api/` functions:

```bash
npx vercel dev
```

The first time, it asks you to log in to Vercel and link this folder to the existing project. Say yes to linking, and pick the current matthewmenardmusic project.

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

Details are filled in once images are set up in Phase 3.

## Change a font

Fonts are named once, in `tokens.css` (`--font-display` and `--font-body`). Font files in `public/fonts/` are cached by browsers for a year, so if you replace a font file, give it a new file name and update the `@font-face` rule.

## Secrets

API keys go in Vercel → Project → Settings → Environment Variables. Never in the code. `.env.example` lists the names.
