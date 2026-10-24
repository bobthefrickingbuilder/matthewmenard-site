// Writes public/sitemap.xml from every page that has a canonical link.
// Pages marked noindex have no canonical, so they stay out. Run: npm run sitemap
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "design" || name === "prototype" ? [] : pages(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const urls = pages("public")
  .map((file) => readFileSync(file, "utf8").match(/<link rel="canonical" href="([^"]+)">/)?.[1])
  .filter(Boolean)
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync("public/sitemap.xml", xml);
console.log(`sitemap.xml: ${urls.length} pages`);
