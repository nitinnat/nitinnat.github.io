// Publishes web-sized, metadata-free copies of content/assets/photos: a display image and a thumbnail per photo.
// URL rule mirrored in src/lib/photo-assets.ts.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE_DIR = path.join(process.cwd(), "content/assets/photos");
const TARGET_DIR = path.join(process.cwd(), "public/assets/photos");
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;
const SIZES = [
  { dir: "", edge: 3200, quality: 90 },
  { dir: "thumbs", edge: 600, quality: 76 },
];

const publishedPath = (rel) => (/\.(jpe?g|webp)$/i.test(rel) ? rel : rel.replace(/\.[^.]+$/, ".jpg"));

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return IMAGE.test(entry.name) && fs.statSync(full).size > 0 ? [full] : [];
  });
}

async function publish(file) {
  const rel = publishedPath(path.relative(SOURCE_DIR, file));
  const webp = /\.webp$/i.test(rel);
  let bytes = 0;
  for (const { dir, edge, quality } of SIZES) {
    const out = path.join(TARGET_DIR, dir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const image = sharp(file)
      .rotate()
      .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
      .withIccProfile("srgb");
    const info = await (webp ? image.webp({ quality }) : image.jpeg({ quality, mozjpeg: true })).toFile(out);
    bytes += info.size;
  }
  return bytes;
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log("[optimize-photos] no photos directory, skipping");
    return;
  }
  fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  const files = collect(SOURCE_DIR);
  let original = 0;
  let published = 0;
  for (const file of files) {
    original += fs.statSync(file).size;
    published += await publish(file);
  }
  const mb = (bytes) => (bytes / 1e6).toFixed(1);
  console.log(`[optimize-photos] published ${files.length} photos: ${mb(original)} MB originals -> ${mb(published)} MB display + thumbnails`);
}

main().catch((error) => {
  console.error("[optimize-photos] failed:", error);
  process.exit(1);
});
