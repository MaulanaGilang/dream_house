// Cut the La Casa tour film into scroll frames.
// Sources (design/film, not in git), three 10 s Kling 3.0 clips chained on shared keyframes:
//   round 10 (rose + lavender border inside the hedge, 4 m front balcony under its own flower canopy):
//   clipA gate 0255ab82 -> aerial 90bfdb9b (40522c3a)
//   clipB aerial -> over the roof and the eave-level cable pergola -> back lawn: two 5 s halves through a
//         mid keyframe that pins the geometry (c4f871d8 90bfdb9b -> 969a39e8, d596b2ba 969a39e8 -> fb660abb),
//         joined into clipB.mp4 beforehand
//   clipC back lawn -> over the portal -> out over the cove -> turns to face the bluff, the house centred
//         behind the portal (fa4bb2d8, -> cove-view de3c1a2e). The joins are short dissolves.
// Usage: node tools/film/build-frames.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const SRC = path.resolve("design/film");
const OUT = path.resolve("public/film");
const TMP = path.join(os.tmpdir(), "lacasa-frames");
const FPS = 12;
// film time (s) of each scroll chapter: the full aerial over the front garden, the view over the house to the cove
const CHAPTER_SECONDS = [9.7, 20.6];

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const c = (n) => path.join(SRC, `clip${n}.mp4`);
// every clip is scaled to one size first (Kling 3.0 renders 1928x1076); xfade offset = running length - overlap
const norm = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=24,format=yuv420p";
const filter = [
  `[0:v]trim=0:10,setpts=PTS-STARTPTS,${norm}[a]`,
  `[1:v]trim=0:10,setpts=PTS-STARTPTS,${norm}[b]`,
  `[2:v]trim=0:10,setpts=PTS-STARTPTS,${norm}[c]`,
  "[a][b]xfade=transition=fade:duration=0.3:offset=9.7[ab]",
  "[ab][c]xfade=transition=fade:duration=0.3:offset=19.4[film]",
  `[film]fps=${FPS}[out]`,
].join(";");

execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", c("A"), "-i", c("B"), "-i", c("C"),
  "-filter_complex", filter, "-map", "[out]", path.join(TMP, "f%04d.png")], { stdio: "inherit" });

const frames = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
for (const set of ["desktop", "desktop-lite", "mobile"]) {
  rmSync(path.join(OUT, set), { recursive: true, force: true });
  mkdirSync(path.join(OUT, set), { recursive: true });
}

let bytes = { desktop: 0, lite: 0, mobile: 0 };
for (const [i, f] of frames.entries()) {
  const src = path.join(TMP, f);
  // WebP rather than AVIF: same weight here, but it decodes several times faster while scrubbing
  const name = `f${String(i + 1).padStart(3, "0")}.webp`;
  const d = await sharp(src).resize({ width: 1920 }).webp({ quality: 84, effort: 4 })
    .toFile(path.join(OUT, "desktop", name));
  // light set for motion: the whole film loads fast and scrubs smoothly; the sharp frame replaces it at rest
  const l = await sharp(src).resize({ width: 1280 }).webp({ quality: 72, effort: 4 })
    .toFile(path.join(OUT, "desktop-lite", name));
  bytes.lite += l.size;
  const meta = await sharp(src).metadata();
  const cw = Math.round((meta.height * 9) / 16);
  const m = await sharp(src).extract({ left: Math.round((meta.width - cw) / 2), top: 0, width: cw, height: meta.height })
    .resize({ height: 1080 }).webp({ quality: 70, effort: 4 }).toFile(path.join(OUT, "mobile", name));
  bytes.desktop += d.size;
  bytes.mobile += m.size;
  if (i === 0) await sharp(src).resize({ width: 1920 }).avif({ quality: 70 }).toFile(path.join(OUT, "poster.avif"));
}
console.log(`${frames.length} frames · desktop ${(bytes.desktop / 1e6).toFixed(1)} MB · lite ${(bytes.lite / 1e6).toFixed(1)} MB · mobile ${(bytes.mobile / 1e6).toFixed(1)} MB`);
rmSync(TMP, { recursive: true, force: true });
// the hero's scroll chapters, as fractions of the film: the drone over the front garden, then over
// the house to the cove (the last chapter is the end of the film, the house seen from the cove)
const total = frames.length / FPS;
const chapters = CHAPTER_SECONDS.map((t) => Number((t / total).toFixed(3)));
writeFileSync(path.resolve("src/data/film.json"), JSON.stringify({ count: frames.length, chapters }) + "\n");
