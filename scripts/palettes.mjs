// Run: node scripts/palettes.mjs. Checks four candidate palettes against the site's @pairings and writes public/design/palettes.css.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const SITE = fileURLToPath(new URL("../", import.meta.url));

const DARK_SHADOW = (hsl) => ({
  "shadow-color": hsl,
  "shadow-1": "0 1px 2px hsl(var(--shadow-color) / 0.5)",
  "shadow-2": "0 4px 12px hsl(var(--shadow-color) / 0.55), 0 1px 3px hsl(var(--shadow-color) / 0.4)",
  "shadow-3": "0 16px 40px hsl(var(--shadow-color) / 0.6), 0 4px 10px hsl(var(--shadow-color) / 0.4)",
});
const LIGHT_SHADOW = (hsl) => ({
  "shadow-color": hsl,
  "shadow-1": "0 1px 2px hsl(var(--shadow-color) / 0.12)",
  "shadow-2": "0 4px 12px hsl(var(--shadow-color) / 0.14), 0 1px 3px hsl(var(--shadow-color) / 0.1)",
  "shadow-3": "0 16px 40px hsl(var(--shadow-color) / 0.18), 0 4px 10px hsl(var(--shadow-color) / 0.1)",
});

export const PALETTES = {
  midnight: {
    label: "Midnight & Brass",
    note: "Deep navy, brass gold, warm red. Concert hall at night.",
    scheme: "dark",
    c: {
      ground: "#0f1621", "ground-950": "#0a0f17", "ground-850": "#172130", "ground-800": "#1d293b", "ground-700": "#263449",
      panel: "#23395a", "panel-700": "#1b2d48", "panel-400": "#2d4770", "panel-200": "#6b809e",
      text: "#f3efe6", "text-muted": "#c5cad3", "text-subtle": "#a3abb8",
      accent: "#dcbd7a", "accent-hover": "#e9d29f", "accent-pressed": "#cfac62",
      spark: "#f07563", "spark-hover": "#f48e7f", "spark-pressed": "#e86452",
      danger: "#f4a3ab", success: "#a9dcb8",
    },
    shadow: DARK_SHADOW("218 45% 4%"),
  },
  paper: {
    label: "Score Paper",
    note: "Warm ivory, ink black, oxblood red. Like a printed score.",
    scheme: "light",
    c: {
      ground: "#f6f1e7", "ground-950": "#ebe3d3", "ground-850": "#fbf8f2", "ground-800": "#ffffff", "ground-700": "#ede6d9",
      panel: "#e8dcc6", "panel-700": "#dfd0b5", "panel-400": "#efe5d3", "panel-200": "#8c7f69",
      text: "#1d1a16", "text-muted": "#4a443b", "text-subtle": "#635c50",
      accent: "#7d1f2c", "accent-hover": "#5e1520", "accent-pressed": "#69192a",
      spark: "#a8401b", "spark-hover": "#8f3414", "spark-pressed": "#7a2c10",
      danger: "#9e1f2c", success: "#2d6a3c",
    },
    shadow: LIGHT_SHADOW("35 35% 25%"),
  },
  chapel: {
    label: "Chapel Green",
    note: "Dark forest green, sage, copper. Quiet and natural.",
    scheme: "dark",
    c: {
      ground: "#101b17", "ground-950": "#0a120f", "ground-850": "#17251f", "ground-800": "#1d2e27", "ground-700": "#263a31",
      panel: "#2b4a3d", "panel-700": "#223c31", "panel-400": "#35594a", "panel-200": "#6f9282",
      text: "#eef2ea", "text-muted": "#c3cec6", "text-subtle": "#a0aea5",
      accent: "#b7d4a9", "accent-hover": "#cee3c4", "accent-pressed": "#a2c592",
      spark: "#e6a05c", "spark-hover": "#edb57f", "spark-pressed": "#dd8f44",
      danger: "#f4a3ab", success: "#a9dcb8",
    },
    shadow: DARK_SHADOW("150 40% 3%"),
  },
  stone: {
    label: "Stone & Teal",
    note: "Cool light grey, deep teal, coral. Clean and modern.",
    scheme: "light",
    c: {
      ground: "#eef1f3", "ground-950": "#dfe5e9", "ground-850": "#f7f9fa", "ground-800": "#ffffff", "ground-700": "#e3e8ec",
      panel: "#d3dfe5", "panel-700": "#c5d4dc", "panel-400": "#dfe8ed", "panel-200": "#6c7e8b",
      text: "#14202a", "text-muted": "#3d4b56", "text-subtle": "#55636e",
      accent: "#0a5c68", "accent-hover": "#07434c", "accent-pressed": "#084e58",
      spark: "#b83e26", "spark-hover": "#9c331e", "spark-pressed": "#862b19",
      danger: "#a3202e", success: "#2b6838",
    },
    shadow: LIGHT_SHADOW("205 30% 20%"),
  },
};

// Same math and pairings as scripts/contrast.mjs.
const tokens = readFileSync(SITE + "public/css/tokens.css", "utf8");
const MIN = { text: 4.5, large: 3, ui: 3, decor: 0 };
const pairs = [...tokens.match(/\/\*\s*@pairings([\s\S]*?)\*\//)[1].matchAll(/^\s*([\w-]+)\s+on\s+([\w-]+)\s+(text|large|ui|decor)\b/gm)].map((m) => m.slice(1));
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };

let bad = 0;
for (const [id, p] of Object.entries(PALETTES)) {
  const fails = [];
  let min = 99;
  for (const [fg, bg, kind] of pairs) {
    const r = ratio(p.c[fg], p.c[bg]);
    if (kind !== "decor") min = Math.min(min, r);
    if (r < MIN[kind]) fails.push(`${fg} on ${bg} ${r.toFixed(2)} (${kind})`);
  }
  bad += fails.length;
  console.log(`${id.padEnd(9)} ${fails.length ? "FAIL" : "pass"}  lowest ${min.toFixed(2)}  ${fails.join("; ")}`);
}
if (bad) process.exit(1);

const block = (id, p) => `/* ${p.label}: ${p.note} */
:root[data-palette="${id}"] {
  color-scheme: ${p.scheme};
${Object.entries({ ...p.c, ...p.shadow }).map(([k, v]) => `  --${k}: ${v};`).join("\n")}
}`;
writeFileSync(SITE + "public/design/palettes.css", `/* Palette previews. Not used by the live design: loaded only when a preview is switched on
   (/?palette=<name>, see /js/palette-preview.js). Every palette passes the same contrast
   pairings as tokens.css. Generated; to adopt one, copy its values into tokens.css. */

${Object.entries(PALETTES).map(([id, p]) => block(id, p)).join("\n\n")}
`);
writeFileSync(SITE + "public/design/palettes.json", JSON.stringify(Object.fromEntries(Object.entries(PALETTES).map(([id, p]) => [id, { label: p.label, note: p.note, swatches: [p.c.ground, p.c.panel, p.c.text, p.c.accent, p.c.spark] }])), null, 2));
console.log("wrote palettes.css and palettes.json");
