// WCAG contrast gate for the color pairings declared in public/css/tokens.css.
// Run: npm run check:contrast   (exits 1 if any pairing fails)
//
// Pairings live in tokens.css inside a comment block:
//   /* @pairings
//      text        on ground      text     (body text, needs 4.5:1)
//      accent      on ground      large    (24px+ or 19px bold, needs 3:1)
//      focus       on ground      ui       (icons, borders, focus rings, needs 3:1)
//      panel       on ground      decor    (decoration only, reported, never gated)
//   */
// Token names omit the leading "--". Values may be hex or var(--other).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MIN = { text: 4.5, large: 3, ui: 3, decor: 0 };
const path = fileURLToPath(new URL("../public/css/tokens.css", import.meta.url));
const css = readFileSync(path, "utf8");

const raw = {};
for (const [, name, value] of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
  if (!(name in raw)) raw[name] = value.trim();
}

function resolve(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token: --${name}`);
  seen.add(name);
  const value = raw[name];
  if (value === undefined) throw new Error(`Unknown token: --${name}`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(ref[1], seen);
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--${name} is not a 6-digit hex or var(): ${value}`);
  return value;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const block = css.match(/\/\*\s*@pairings([\s\S]*?)\*\//);
if (!block) {
  console.error("No @pairings block found in tokens.css");
  process.exit(1);
}

let failures = 0;
let count = 0;
for (const line of block[1].split("\n")) {
  const m = line.match(/^\s*([\w-]+)\s+on\s+([\w-]+)\s+(text|large|ui|decor)\b/);
  if (!m) continue;
  const [, fg, bg, kind] = m;
  count++;
  const r = ratio(resolve(fg), resolve(bg));
  const pass = r >= MIN[kind];
  if (!pass) failures++;
  const status = kind === "decor" ? "DECOR" : pass ? "pass " : "FAIL ";
  console.log(`${status} ${r.toFixed(2).padStart(5)}  ${fg} on ${bg} (${kind}${MIN[kind] ? `, min ${MIN[kind]}` : ""})`);
}

console.log(`\n${count} pairings checked, ${failures} failing.`);
process.exit(failures ? 1 : 0);
