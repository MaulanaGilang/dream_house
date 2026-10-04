// Cut the La Casa tour film into scroll frames.
// Sources (design/film, not in git): clip1 gate->aerial, clip2 aerial->portal, clip3 portal->beach, clip4 cove drift.
// Clip 2 is trimmed at 6.4 s (later frames add pedestals that are not in the site plan); the joins are dissolves.
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
// offsets: xfade starts at (sum of previous visible lengths - overlap)
const filter = [
  "[0:v]trim=0:10,setpts=PTS-STARTPTS,fps=24,format=yuv420p[a]",
  "[1:v]trim=0:6.4,setpts=PTS-STARTPTS,fps=24,format=yuv420p[b]",
  "[2:v]trim=0:10,setpts=PTS-STARTPTS,fps=24,format=yuv420p[c]",
  "[3:v]trim=0:5,setpts=PTS-STARTPTS,fps=24,format=yuv420p[d]",
  "[a][b]xfade=transition=fade:duration=0.4:offset=9.6[ab]",
  "[ab][c]xfade=transition=fade:duration=0.8:offset=15.2[abc]",
  "[abc][d]xfade=transition=fade:duration=1.0:offset=24.2[film]",
  `[film]fps=${FPS}[out]`,
].join(";");

execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", c(1), "-i", c(2), "-i", c(3), "-i", c(4),
  "-filter_complex", filter, "-map", "[out]", path.join(TMP, "f%04d.png")], { stdio: "inherit" });

const frames = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
for (const set of ["desktop", "mobile"]) {
  rmSync(path.join(OUT, set), { recursive: true, force: true });
  mkdirSync(path.join(OUT, set), { recursive: true });
}

let bytes = { desktop: 0, mobile: 0 };
for (const [i, f] of frames.entries()) {
  const src = path.join(TMP, f);
  const name = `f${String(i + 1).padStart(3, "0")}.avif`;
  const d = await sharp(src).resize({ width: 1920 }).avif({ quality: 62, effort: 4, chromaSubsampling: "4:2:0" })
    .toFile(path.join(OUT, "desktop", name));
  const meta = await sharp(src).metadata();
  const cw = Math.round((meta.height * 9) / 16);
  const m = await sharp(src).extract({ left: Math.round((meta.width - cw) / 2), top: 0, width: cw, height: meta.height })
    .resize({ height: 1080 }).avif({ quality: 58, effort: 4 }).toFile(path.join(OUT, "mobile", name));
  bytes.desktop += d.size;
  bytes.mobile += m.size;
  if (i === 0) await sharp(src).resize({ width: 1920 }).avif({ quality: 70 }).toFile(path.join(OUT, "poster.avif"));
}
console.log(`${frames.length} frames · desktop ${(bytes.desktop / 1e6).toFixed(1)} MB · mobile ${(bytes.mobile / 1e6).toFixed(1)} MB`);
rmSync(TMP, { recursive: true, force: true });
writeFileSync(path.resolve("src/data/film.json"), JSON.stringify({ count: frames.length }) + "\n");
