// Builds the favicon set and the social share image from source-media/.
// The icon is the existing bass clef mark, recolored onto the site palette.
// Run: npm run icons
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const GROUND = "#1b1020";
const MARK = "#f4efe8";
const OUT = "public/";

// Clef as an alpha mask: dark pixels opaque, white background transparent.
const { data, info } = await sharp("source-media/apple-touch-icon.png")
  .flatten({ background: "#ffffff" })
  .grayscale()
  .negate()
  .raw()
  .toBuffer({ resolveWithObject: true });
const mask = await sharp(data, { raw: info }).png().toBuffer();

async function icon(size, { padding = 0.14, radius = 0 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const alpha = await sharp(mask).resize(inner, inner).extractChannel(0).toBuffer();
  const glyph = await sharp({ create: { width: inner, height: inner, channels: 3, background: MARK } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
  const base = sharp({ create: { width: size, height: size, channels: 4, background: GROUND } });
  const layers = [{ input: glyph, gravity: "centre" }];
  if (radius) {
    const r = Math.round(size * radius);
    layers.push({ input: Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`), blend: "dest-in" });
  }
  return base.composite(layers).png().toBuffer();
}

// ICO file wrapping PNG images (supported by every current browser).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const s16 = await icon(16, { padding: 0.06 });
const s32 = await icon(32, { padding: 0.08, radius: 0.18 });
const s48 = await icon(48, { padding: 0.1, radius: 0.18 });
writeFileSync(OUT + "favicon.ico", ico([{ size: 16, buf: s16 }, { size: 32, buf: s32 }, { size: 48, buf: s48 }]));
writeFileSync(OUT + "icon-192.png", await icon(192, { radius: 0.18 }));
writeFileSync(OUT + "icon-512.png", await icon(512, { radius: 0.18 }));
// iOS rounds the corners itself, so the touch icon stays square.
writeFileSync(OUT + "apple-touch-icon.png", await icon(180, { padding: 0.16 }));

// Share image for links on social media and messaging apps: 1200 × 630, same plum wash as on the site.
await sharp("source-media/gallery/photo-1.jpg")
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .modulate({ saturation: 0.85 })
  .composite([{ input: Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#5a2e6b" opacity="0.28"/></svg>`), blend: "soft-light" }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT + "img/share.jpg");

console.log("icons and share image written");
