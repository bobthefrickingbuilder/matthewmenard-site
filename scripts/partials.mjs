// Copies partials/header.html and partials/footer.html into every page in public/,
// between the <!-- header --> … <!-- /header --> and <!-- footer --> … <!-- /footer --> markers,
// and marks the current page's nav links. Run after editing a partial:
//   npm run partials
// Pages stay complete HTML files; nothing runs at deploy time.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, sep } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(root, "public");
const SKIP = new Set(["design", "prototype"]);

const partials = {
  header: readFileSync(join(root, "partials/header.html"), "utf8").trim(),
  footer: readFileSync(join(root, "partials/footer.html"), "utf8").trim(),
};

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP.has(name) ? [] : pages(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

// public/compositions/golden-sunset.html → /compositions/golden-sunset ; index.html → /
function urlFor(file) {
  const path = "/" + relative(PUBLIC, file).split(sep).join("/").replace(/\.html$/, "");
  return path.replace(/\/index$/, "") || "/";
}

function markCurrent(html, url) {
  return html.replace(/<a href="([^"]+)">/g, (tag, href) => {
    if (href === url) return `<a href="${href}" aria-current="page">`;
    if (href !== "/" && url.startsWith(href + "/")) return `<a href="${href}" aria-current="true">`;
    return tag;
  });
}

let changed = 0;
for (const file of pages(PUBLIC)) {
  const url = urlFor(file);
  let html = readFileSync(file, "utf8");
  const before = html;
  for (const [name, content] of Object.entries(partials)) {
    const pattern = new RegExp(`(<!-- ${name} -->)[\\s\\S]*?(<!-- /${name} -->)`);
    if (!pattern.test(html)) continue;
    const indent = html.match(new RegExp(`\\n([ \\t]*)<!-- ${name} -->`))?.[1] ?? "";
    const body = markCurrent(content, url).replace(/\n/g, `\n${indent}`);
    html = html.replace(pattern, `$1\n${indent}${body}\n${indent}$2`);
  }
  if (html !== before) {
    writeFileSync(file, html);
    changed++;
    console.log(`updated ${url}`);
  }
}
console.log(`${changed} page(s) updated.`);
