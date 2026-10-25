// Turns the originals in source-media/ into web images in public/img/:
// AVIF, WebP, and JPEG at several widths. Run after adding or replacing a photo:
//   npm run images
// Output names are stable (name-width.ext), so replacing a source file and re-running
// updates the site without touching any HTML.

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT = `${root}public/img/`;
const WIDTHS = [480, 800, 1200, 1600];

// name: output base name · src: file in source-media/ · widths: optional override
const IMAGES = [
  { name: "headshot", src: "photos/headshot.jpg" },
  { name: "singing-front", src: "photos/singing-front.jpg" },
  { name: "choir-strings", src: "gallery/photo-1.jpg" },
  { name: "singing-folder", src: "gallery/photo-2.jpg" },
  { name: "singing-warm", src: "gallery/photo-3.jpg" },
  { name: "conducting", src: "gallery/photo-4.jpg" },
  { name: "choir-stage", src: "gallery/photo-5.jpg" },
  { name: "choir-bw", src: "gallery/photo-6.jpg" },
  { name: "score-when-i-am-dead", src: "covers/when-i-am-dead.jpg", widths: [480, 800, 1200] },
  { name: "score-golden-sunset", src: "covers/golden-sunset.jpg", widths: [480, 800, 1200] },
];

mkdirSync(OUT, { recursive: true });

for (const image of IMAGES) {
  const input = sharp(`${root}source-media/${image.src}`).rotate();
  const { width, height } = await input.metadata();
  const widths = (image.widths || WIDTHS).filter((w) => w <= width);
  if (!widths.includes(width) && widths.length < (image.widths || WIDTHS).length) widths.push(width);

  for (const w of widths) {
    const resized = input.clone().resize({ width: w, withoutEnlargement: true });
    await Promise.all([
      resized.clone().avif({ quality: 50, effort: 6 }).toFile(`${OUT}${image.name}-${w}.avif`),
      resized.clone().webp({ quality: 74 }).toFile(`${OUT}${image.name}-${w}.webp`),
      resized.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(`${OUT}${image.name}-${w}.jpg`),
    ]);
  }
  console.log(`${image.name}: ${width}×${height} → widths ${widths.join(", ")}`);
}
