// Light frames for motion: while the film glides the canvas shows these (they decode several times
// faster than the 1920 px set), and the full frame is swapped in as soon as the playhead rests.
// Built from public/film/desktop. Usage: node tools/film/build-lite.mjs [width]
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = Number(process.argv[2] ?? 1280);
const SRC = path.resolve("public/film/desktop");
const OUT = path.resolve("public/film/desktop-lite");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let bytes = 0;
const files = readdirSync(SRC).filter((f) => f.endsWith(".webp")).sort();
for (const f of files) {
  const info = await sharp(path.join(SRC, f)).resize({ width: W }).webp({ quality: 68, effort: 4 }).toFile(path.join(OUT, f));
  bytes += info.size;
}
console.log(`${files.length} lite frames at ${W}px · ${(bytes / 1e6).toFixed(1)} MB`);
