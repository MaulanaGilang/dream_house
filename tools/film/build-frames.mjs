// Cut the La Casa tour film into scroll frames.
// Sources (design/film, not in git):
//   clip1d gate -> aerial (Kling f8f5e1cd, round 5: two-car S driveway through the gate, site plan v7)
//   clip1e aerial -> roof (Kling 2dc2301c, ends on clip2's frame at 3.0 s)
//   clip2  roof -> back lawn, used from 3.0 s to 6.2 s (later frames add pedestals that are not in the plan)
//   clip3c back lawn -> over the portal and the stone stairs -> turns to face the bluff from the water
//          (Kling f74ae393, starts on clip2's 6.2 s frame, ends on clip4's first frame)
//   clip4  cove drift. The joins are short dissolves.
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

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const c = (n) => path.join(SRC, `clip${n}.mp4`);
// every clip is scaled to one size first (Kling 3.0 renders 1928x1076); xfade offset = running length - overlap
const norm = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=24,format=yuv420p";
const filter = [
  `[0:v]trim=0:10,setpts=PTS-STARTPTS,${norm}[a]`,
  `[1:v]trim=0:5,setpts=PTS-STARTPTS,${norm}[b]`,
  `[2:v]trim=3.0:6.2,setpts=PTS-STARTPTS,${norm}[c]`,
  `[3:v]trim=0:10,setpts=PTS-STARTPTS,${norm}[d]`,
  `[4:v]trim=0:5,setpts=PTS-STARTPTS,${norm}[e]`,
  "[a][b]xfade=transition=fade:duration=0.3:offset=9.7[ab]",
  "[ab][c]xfade=transition=fade:duration=0.3:offset=14.4[abc]",
  "[abc][d]xfade=transition=fade:duration=0.3:offset=17.3[abcd]",
  "[abcd][e]xfade=transition=fade:duration=0.3:offset=27.0[film]",
  `[film]fps=${FPS}[out]`,
].join(";");

execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", c("1d"), "-i", c("1e"), "-i", c(2), "-i", c("3c"), "-i", c(4),
  "-filter_complex", filter, "-map", "[out]", path.join(TMP, "f%04d.png")], { stdio: "inherit" });

const frames = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
for (const set of ["desktop", "mobile"]) {
  rmSync(path.join(OUT, set), { recursive: true, force: true });
  mkdirSync(path.join(OUT, set), { recursive: true });
}

let bytes = { desktop: 0, mobile: 0 };
for (const [i, f] of frames.entries()) {
  const src = path.join(TMP, f);
  // WebP rather than AVIF: same weight here, but it decodes several times faster while scrubbing
  const name = `f${String(i + 1).padStart(3, "0")}.webp`;
  const d = await sharp(src).resize({ width: 1920 }).webp({ quality: 74, effort: 4 })
    .toFile(path.join(OUT, "desktop", name));
  const meta = await sharp(src).metadata();
  const cw = Math.round((meta.height * 9) / 16);
  const m = await sharp(src).extract({ left: Math.round((meta.width - cw) / 2), top: 0, width: cw, height: meta.height })
    .resize({ height: 1080 }).webp({ quality: 70, effort: 4 }).toFile(path.join(OUT, "mobile", name));
  bytes.desktop += d.size;
  bytes.mobile += m.size;
  if (i === 0) await sharp(src).resize({ width: 1920 }).avif({ quality: 70 }).toFile(path.join(OUT, "poster.avif"));
}
console.log(`${frames.length} frames · desktop ${(bytes.desktop / 1e6).toFixed(1)} MB · mobile ${(bytes.mobile / 1e6).toFixed(1)} MB`);
rmSync(TMP, { recursive: true, force: true });
writeFileSync(path.resolve("src/data/film.json"), JSON.stringify({ count: frames.length }) + "\n");
// light 1280 px set the canvas shows while gliding
execFileSync(process.execPath, [path.resolve("tools/film/build-lite.mjs")], { stdio: "inherit" });
