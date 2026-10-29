Add a "Website by Matthew Menard" credit to this website.

This is a client website built by Matthew Menard. Every page needs a small credit in the footer that links to the Websites page on his site. That page has a "Request an alteration" button, which is how this client sends him changes for their site, so the credit is also their way in. Visitors will see it, so it should look like a normal, quiet part of the footer, not like an ad.

What to add:
- The text "Website by Matthew Menard", where "Matthew Menard" is a link to https://www.matthewmenardmusic.com/commissions
- The link opens in a new tab: target="_blank" rel="noopener"
- Put it in the site footer, on every page, next to the copyright line or the other small footer text. If the footer comes from a shared template, partial, layout, or component, change it there once. If every page has its own copy of the footer, add it to each page, and check that none are missed (including 404 and other utility pages).
- If the site already has a credit to Matthew, replace it with this one instead of adding a second.
- Plain HTML only. No new scripts, tracking, cookies, fonts, or third-party requests.

The plain markup, before styling:
<p>Website by <a href="https://www.matthewmenardmusic.com/commissions" target="_blank" rel="noopener">Matthew Menard</a></p>

How it should look:
- Match the site's existing footer: same small text size and the same link style as the other footer links. Reuse existing classes instead of inventing a new look. If you add CSS, put it in the site's existing stylesheet and use its existing colour and spacing variables.
- Accessible: the text and link must pass WCAG 2.2 AA contrast (4.5:1) against the footer background, the keyboard focus outline must be visible, and the link must be recognisable as a link (underline or the site's usual link style).
- It must not cause horizontal scrolling at 360 px wide, and it must not overlap anything.
- Do not use inline style="" attributes. Many of these sites have a Content-Security-Policy that blocks them.

Check before you finish:
1. Open the site locally (use the project's own dev server or preview command if there is one) and confirm the credit appears on every page, at phone width (about 375 px) and desktop width.
2. Confirm the link goes to https://www.matthewmenardmusic.com/commissions and opens in a new tab.
3. Run the project's existing checks or build, if it has any, and make sure they pass.

Then commit with the message "Footer credit: Website by Matthew Menard" and deploy the way this project normally deploys (for example, push to the branch that goes live). If you cannot tell how it deploys, stop and ask instead of guessing.

Do not change anything else on the site. When done, report: the files you changed, the pages you checked, and the live URL where the credit can be seen.
