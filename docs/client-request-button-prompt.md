Add a "Request a change" button to this website.

This is a client website built by Matthew Menard. His clients send him change requests through a page on his site. Every page of this site needs a small, unobtrusive link to that page, so the client can find it whenever they want something changed. Visitors will see it, so it should look like a normal part of the footer, not like an ad or a call to action.

What to add:
- A link with the text "Request a change", pointing to https://www.matthewmenardmusic.com/alterations
- It opens in a new tab: target="_blank" rel="noopener"
- Put it in the site footer, on every page. If the footer comes from a shared template, partial, layout, or component, change it there once. If every page has its own copy of the footer, add it to each page, and check that none are missed (including 404 and other utility pages).
- Plain HTML only. No new scripts, tracking, cookies, fonts, or third-party requests.

The plain markup, before styling:
<a href="https://www.matthewmenardmusic.com/alterations" target="_blank" rel="noopener">Request a change</a>

How it should look:
- Match the site's existing styles. Reuse an existing class (a small or secondary button, or the footer link style) instead of inventing a new look. If you add CSS, put it in the site's existing stylesheet and use its existing colour and spacing variables.
- Keep it small and quiet: footer-sized text, placed with the other footer links or the copyright line.
- Accessible: the text must pass WCAG 2.2 AA contrast (4.5:1) against its background, the keyboard focus outline must be visible, and the tap target should be at least 24 by 24 px.
- It must not cause horizontal scrolling at 360 px wide, and it must not overlap anything.
- Do not use inline style="" attributes. Many of these sites have a Content-Security-Policy that blocks them.

Check before you finish:
1. Open the site locally (use the project's own dev server or preview command if there is one) and confirm the link appears on every page, at phone width (about 375 px) and desktop width.
2. Confirm the link goes to https://www.matthewmenardmusic.com/alterations and opens in a new tab.
3. Run the project's existing checks or build, if it has any, and make sure they pass.

Then commit with the message "Add Request a change link to the footer" and deploy the way this project normally deploys (for example, push to the branch that goes live). If you cannot tell how it deploys, stop and ask instead of guessing.

Do not change anything else on the site. When done, report: the files you changed, the page(s) you checked, and the live URL where the link can be seen.
