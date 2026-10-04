// Download the La Casa renders (all guided by the massing model built from design/site-plan-1000m2.svg)
// and store web-ready copies in src/assets/photos. Usage: node tools/fetch-renders.mjs
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3HRGlCWAJ2JSOIUWtb4HPHGZ7c7/";
const RAW = path.resolve("design/renders");
const OUT = path.resolve("src/assets/photos");

// name -> Higgsfield result file (the job id is in the name)
const RENDERS = {
  gate: "hf_20261004_113715_db14bf50-bb32-4e73-bc34-2219e88afafd.png",
  facade: "hf_20261004_113715_afaec0b4-c045-4a2e-91b4-878ca7781254.png",
  aerial: "hf_20261004_130315_060fd9d9-bca8-4686-8f66-323f95f4ed29.png",
  portal: "hf_20261004_113715_91288aff-d94c-4b6b-b970-a1f7677f625e.png",
  "cove-view": "hf_20261004_113945_bcdab7e9-9b39-46f4-9c9e-aea680f1d977.png",
  rear: "hf_20261004_113945_6534d6f4-80b5-4582-a1e7-c8348032bd95.png",
  terrace: "hf_20261004_113945_b97be51a-a64d-46ed-a51d-f5631e098aeb.png",
  laundry: "hf_20261004_113944_bd44d63f-d3fc-4c33-9ad3-1c56727a9ed0.png",
  "rear-night": "hf_20261004_114456_367853d2-356a-4c32-918b-fc89e51a6399.png",
  living: "hf_20261004_113944_a4f384f9-7bef-45d5-b3e4-da48355a69a1.png",
  kitchen: "hf_20261004_113945_d6172376-5667-4e81-a259-f6e862257505.png",
  "bedroom-2": "hf_20261004_113946_6e6b7e6f-3391-4e47-aeb9-9ab19cab398b.png",
  "guest-bath": "hf_20261004_114455_d51a88ff-2926-4130-bbcf-f0045dbbaa3e.png",
  workout: "hf_20261004_114456_10860f53-6e2f-44cf-bc8b-4b53e871292c.png",
  master: "hf_20261004_114459_c9a6239c-abd4-4e16-864c-7f12fa6ee932.png",
  ensuite: "hf_20261004_114457_feafd5d7-e700-4e85-9a7a-2f2daabf1a69.png",
  "work-room": "hf_20261004_114456_6411475f-de81-4caa-b047-76f31f7f4f5e.png",
  bougainvillea: "hf_20261004_114455_7af71c9f-a784-47f9-8ebc-15d6eb108a44.png",
};

await mkdir(RAW, { recursive: true });
await mkdir(OUT, { recursive: true });

for (const [name, file] of Object.entries(RENDERS)) {
  const raw = path.join(RAW, `${name}.png`);
  try {
    await access(raw);
  } catch {
    const res = await fetch(CDN + file);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
  }
  if (name === "bougainvillea") {
    // studio shot on white: key the white out into alpha for a floating cut-out
    const { data, info } = await sharp(raw).resize({ width: 1400 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const m = Math.min(data[i], data[i + 1], data[i + 2]);
      const a = m > 244 ? 0 : m > 214 ? Math.round(((244 - m) / 30) * 255) : 255;
      data[i + 3] = Math.min(data[i + 3], a);
    }
    const out = await sharp(data, { raw: info }).webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(OUT, `${name}.webp`));
    console.log(name.padEnd(14), `${out.width}x${out.height}`, `${Math.round(out.size / 1024)} KB`);
    continue;
  }
  const info = await sharp(raw)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, `${name}.webp`));
  console.log(name.padEnd(14), `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}
