// Fails a production deploy if any page still shows a visible placeholder.
// Visible placeholders use the `todo` class (styled dashed so nobody mistakes them for real
// content). They are fine on previews and blocked on production.
// HTML comments with [TODO] are not visible and are not checked here; TODO.md lists them.
//   npm run check:todo            report only
//   VERCEL_ENV=production …       report and fail

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const PUBLIC = fileURLToPath(new URL("../public", import.meta.url));
const SKIP = new Set(["design", "prototype"]);

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP.has(name) ? [] : pages(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const found = [];
for (const file of pages(PUBLIC)) {
  const html = readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const count = (html.match(/class="[^"]*\btodo\b[^"]*"/g) || []).length;
  if (count) found.push(`${relative(PUBLIC, file)}: ${count} visible placeholder(s)`);
}

const production = process.env.VERCEL_ENV === "production";
if (found.length) {
  console.log(found.join("\n"));
  if (production) {
    // Owner chose to launch with these showing (2026-10-26). Put process.exit(1) back to block again.
    console.warn("\nVisible [TODO] placeholders are live on production. Fill or remove them.");
  }
}
console.log(`${found.length} page(s) with visible placeholders${production ? "" : " (allowed on previews)"}.`);
