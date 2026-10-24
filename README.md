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
| `api/` | Serverless functions: score checkout, order check, PDF download, contact form. | runs on Vercel |
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

The contact form sends to `COMMISSION_TO_EMAIL` through Resend. Spam defenses: a hidden field bots fill in, a minimum fill time, and a limit of 5 messages per 10 minutes per visitor. Bots get a fake "sent" so they don't retry. No CAPTCHA.

## Placeholders

Missing content shows on preview pages as a dashed red box marked `[TODO: …]`. A production deploy fails while any are visible (`npm run check:todo`), so nothing unfinished goes live. `TODO.md` lists them all.

## Change a font

Fonts are named once, in `tokens.css` (`--font-display` and `--font-body`). Font files in `public/fonts/` are cached by browsers for a year, so if you replace a font file, give it a new file name and update the `@font-face` rule.

## Secrets

API keys go in Vercel → Project → Settings → Environment Variables. Never in the code. `.env.example` lists the names.
