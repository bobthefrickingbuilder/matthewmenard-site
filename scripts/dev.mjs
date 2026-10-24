// Local server: serves public/ with clean URLs (like Vercel) and runs the /api functions.
//   npm run dev        → http://localhost:3000
// Reads .env if present. No Vercel login needed. Headers and redirects from vercel.json
// are not applied here; previews are the place to check those.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join, extname, normalize } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(root, "public");
const PORT = Number(process.env.PORT) || 3000;
const require = createRequire(import.meta.url);

if (existsSync(join(root, ".env"))) {
  for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml", ".pdf": "application/pdf",
};

function staticFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const base = join(PUBLIC, clean);
  if (!base.startsWith(PUBLIC)) return null;
  for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const type = req.headers["content-type"] || "";
  if (type.includes("application/json")) return raw ? JSON.parse(raw) : {};
  if (type.includes("application/x-www-form-urlencoded")) {
    const body = {};
    for (const [k, v] of new URLSearchParams(raw)) body[k] = k in body ? [].concat(body[k], v) : v;
    return body;
  }
  return raw;
}

// Minimal versions of the helpers Vercel adds to Node functions.
function vercelify(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => (res.setHeader("Content-Type", "application/json"), res.end(JSON.stringify(data)));
  res.send = (data) => res.end(data);
  res.redirect = (code, location) => (res.writeHead(code, { Location: location }), res.end());
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      const file = join(root, "api", `${url.pathname.slice(5)}.js`);
      if (!existsSync(file)) return res.writeHead(404).end("Not found");
      vercelify(req, res, url);
      req.body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : undefined;
      delete require.cache[require.resolve(file)];
      return await require(file)(req, res);
    }
    const file = staticFile(url.pathname);
    if (!file) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return res.end(readFileSync(join(PUBLIC, "404.html")));
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500).end("Server error");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
